// ==========================================================================
// ANDRASELAMATMOTOR
// image-utils.js - Image Compression & Robust Firebase Storage / Base64 Fallback
// ==========================================================================

import { 
  storage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "../../js/firebase-config.js";

/**
 * Format relative URLs for display inside admin folder
 * @param {string} url
 * @returns {string}
 */
export function formatAdminImageUrl(url) {
  if (!url) return "../assets/img/logo/logo.png";
  if (
    url.startsWith("http://") || 
    url.startsWith("https://") || 
    url.startsWith("data:") || 
    url.startsWith("../") || 
    url.startsWith("blob:")
  ) {
    return url;
  }
  return "../" + url;
}

/**
 * Compress an image file/blob or data URL via HTML5 Canvas
 * @param {File|Blob|string} source 
 * @param {Object} [options]
 * @param {number} [options.maxWidth=1200]
 * @param {number} [options.maxHeight=1200]
 * @param {number} [options.quality=0.8]
 * @param {number} [options.maxSizeBytes=120000]
 * @param {string} [options.mimeType='image/jpeg']
 * @returns {Promise<{blob: Blob, dataUrl: string, width: number, height: number, size: number}>}
 */
export function compressImage(source, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    maxSizeBytes = 120 * 1024,
    mimeType = "image/jpeg"
  } = options;

  return new Promise((resolve, reject) => {
    if (!source) {
      return reject(new Error("File atau data gambar kosong"));
    }

    const img = new Image();
    let objectUrl = null;

    img.onload = () => {
      try {
        if (objectUrl) URL.revokeObjectURL(objectUrl);

        let { width, height } = img;
        if (!width || !height) {
          return reject(new Error("Dimensi gambar tidak valid"));
        }

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        const isPng = (source instanceof File || source instanceof Blob)
          ? source.type === "image/png"
          : (typeof source === "string" && source.startsWith("data:image/png"));

        // If JPEG, fill white background to prevent black background on transparent images
        const targetFormat = isPng ? "image/webp" : mimeType;
        if (targetFormat === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let dataUrl = canvas.toDataURL(targetFormat, currentQuality);

        // Fallback if browser doesn't support webp encoding on canvas (returns image/png)
        if (isPng && dataUrl.startsWith("data:image/png") && dataUrl.length > maxSizeBytes * 1.35) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          dataUrl = canvas.toDataURL("image/jpeg", currentQuality);
        }

        // Adaptive quality reduction if size still exceeds target limit
        let attempts = 0;
        while (dataUrl.length * 0.75 > maxSizeBytes && attempts < 3 && currentQuality > 0.4) {
          currentQuality -= 0.15;
          const fmt = dataUrl.startsWith("data:image/webp") ? "image/webp" : "image/jpeg";
          dataUrl = canvas.toDataURL(fmt, currentQuality);
          attempts++;
        }

        // Generate binary Blob
        canvas.toBlob((blob) => {
          if (!blob) {
            // Convert dataUrl to blob manually
            try {
              const parts = dataUrl.split(",");
              const byteStr = atob(parts[1]);
              const mime = parts[0].split(":")[1].split(";")[0];
              const ab = new ArrayBuffer(byteStr.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteStr.length; i++) {
                ia[i] = byteStr.charCodeAt(i);
              }
              blob = new Blob([ab], { type: mime });
            } catch (convErr) {
              console.warn("Blob conversion fallback failed:", convErr);
            }
          }

          resolve({
            blob,
            dataUrl,
            width,
            height,
            size: blob ? blob.size : Math.round(dataUrl.length * 0.75)
          });
        }, dataUrl.startsWith("data:image/webp") ? "image/webp" : "image/jpeg", currentQuality);

      } catch (e) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(e);
      }
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("Format file bukan gambar yang didukung"));
    };

    if (source instanceof File || source instanceof Blob) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else if (typeof source === "string") {
      img.src = source;
    } else {
      reject(new Error("Input gambar tidak valid"));
    }
  });
}

/**
 * Upload image with strict timeout. Automatically falls back to compressed base64
 * if Firebase Storage is not initialized, times out, or fails.
 * @param {File|Blob} file
 * @param {string} storagePath
 * @param {Object} [options]
 * @returns {Promise<string>} Download URL or optimized base64 string
 */
export async function uploadWithFallback(file, storagePath, options = {}) {
  // Image uploads can take longer on mobile or slow connections. A short
  // timeout caused valid uploads to be stored as base64 in Firestore instead.
  const timeoutMs = options.timeoutMs || 30000;

  // 1. Ensure compressed version exists
  let compressed = options.preCompressed;
  if (!compressed && file) {
    try {
      compressed = await compressImage(file, options);
    } catch (err) {
      console.warn("Gagal mengompresi gambar, mencoba menggunakan file asli:", err);
      compressed = { blob: file, dataUrl: null };
    }
  }

  // 2. Try upload to Firebase Storage if available
  if (storage && compressed && compressed.blob) {
    const uploadTask = (async () => {
      const fileRef = ref(storage, storagePath);
      const snap = await uploadBytes(fileRef, compressed.blob, {
        contentType: compressed.blob.type || "image/jpeg"
      });
      return await getDownloadURL(snap.ref);
    })();

    const timeoutTask = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Storage timeout (${timeoutMs}ms)`)), timeoutMs)
    );

    try {
      const url = await Promise.race([uploadTask, timeoutTask]);
      console.info("Upload berhasil ke Firebase Storage:", url);
      return url;
    } catch (e) {
      console.warn(`Upload Firebase Storage (${e.message}) gagal/timeout. Beralih ke data terkompresi otomatis.`);
    }
  }

  // 3. Fallback to compressed base64 Data URL
  if (compressed && compressed.dataUrl) {
    return compressed.dataUrl;
  }

  if (compressed && compressed.blob) {
    return await new Promise((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result || "");
      reader.readAsDataURL(compressed.blob);
    });
  }

  return "";
}

/**
 * Setup instant compression and preview on file input change
 * @param {HTMLInputElement} fileInput
 * @param {HTMLImageElement} imgPreview
 * @param {Object} [options]
 * @param {Function} [onDone]
 */
export function setupCompressedPreview(fileInput, imgPreview, options = {}, onDone = null) {
  if (!fileInput) return;

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    // Never reuse a previous selection's compressed image if this preview fails.
    fileInput._compressed = null;

    if (imgPreview) {
      imgPreview.style.opacity = "0.5";
    }

    try {
      const compressed = await compressImage(file, options);
      fileInput._compressed = compressed;
      if (imgPreview) {
        imgPreview.src = compressed.dataUrl;
        imgPreview.style.display = "block";
        imgPreview.style.opacity = "1";
      }
      if (typeof onDone === "function") {
        onDone(compressed);
      }
    } catch (err) {
      console.warn("Gagal kompresi preview, menggunakan FileReader biasa:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (imgPreview) {
          imgPreview.src = e.target.result;
          imgPreview.style.display = "block";
          imgPreview.style.opacity = "1";
        }
      };
      reader.readAsDataURL(file);
    }
  });
}
