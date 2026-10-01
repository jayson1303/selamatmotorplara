// ==========================================================================
// SELAMATMOTORPLARA
// admin-hero.js - Kelola Hero Section & Banner Promo
// ==========================================================================

import { 
  db, 
  doc, 
  getDoc, 
  setDoc 
} from "../../js/firebase-config.js";

import { adminAlert } from "./admin-dialogs.js";
import { 
  uploadWithFallback, 
  setupCompressedPreview, 
  formatAdminImageUrl 
} from "./image-utils.js";

export async function initAdminHero() {
  const form = document.getElementById("form-hero");
  if (!form) return;

  let currentBackgroundUrl = "";
  let currentPromoImageUrls = [];

  const fileHeroBg = document.getElementById("file-hero-bg");
  const previewHeroBg = document.getElementById("preview-hero-bg");
  const promoFiles = [1, 2, 3].map((slot) => document.getElementById(slot === 1 ? "file-hero-promo" : `file-hero-promo-${slot}`));
  const promoPreviews = [1, 2, 3].map((slot) => document.getElementById(slot === 1 ? "preview-hero-promo" : `preview-hero-promo-${slot}`));

  // Load current hero data
  try {
    const snap = await getDoc(doc(db, "hero", "main"));
    let data = {};
    if (snap.exists()) {
      data = snap.data();
    } else {
      const res = await fetch("../data/default-settings.json");
      const defaults = await res.json();
      data = defaults.hero || {};
    }

    currentBackgroundUrl = data.backgroundUrl || "";
    currentPromoImageUrls = (Array.isArray(data.promoImages) ? data.promoImages : [data.promoImageUrl || ""]).slice(0, 3);

    // Populate inputs
    document.getElementById("hero-input-title").value = data.title || "";
    document.getElementById("hero-input-subtitle").value = data.subtitle || "";
    document.getElementById("hero-input-tagline").value = data.tagline || "";
    document.getElementById("hero-input-cta").value = data.ctaText || "";
    document.getElementById("hero-promo-active").checked = data.promoActive !== false;

    if (currentBackgroundUrl && previewHeroBg) {
      previewHeroBg.src = formatAdminImageUrl(currentBackgroundUrl);
      previewHeroBg.style.display = "block";
    }
    currentPromoImageUrls.forEach((url, index) => {
      if (url && promoPreviews[index]) {
        promoPreviews[index].src = formatAdminImageUrl(url);
        promoPreviews[index].style.display = "block";
      }
    });

  } catch (e) {
    console.error("Error loading hero data:", e);
  }

  // Setup client-side compressed preview on file selection
  setupCompressedPreview(fileHeroBg, previewHeroBg, {
    maxWidth: 1400,
    maxHeight: 900,
    quality: 0.78,
    maxSizeBytes: 140 * 1024
  });

  promoFiles.forEach((file, index) => setupCompressedPreview(file, promoPreviews[index], {
    maxWidth: 1200,
    maxHeight: 1800,
    quality: 0.8,
    maxSizeBytes: 180 * 1024
  }));

  // Form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById("btn-save-hero");
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
      const title = document.getElementById("hero-input-title").value.trim();
      const subtitle = document.getElementById("hero-input-subtitle").value.trim();
      const tagline = document.getElementById("hero-input-tagline").value.trim();
      const ctaText = document.getElementById("hero-input-cta").value.trim();
      const promoActive = document.getElementById("hero-promo-active").checked;

      let bgUrl = currentBackgroundUrl;
      const promoUrls = [...currentPromoImageUrls];

      const bgFile = fileHeroBg?.files?.[0];
      // Upload selected promo images in parallel, keeping existing slots intact.
      const uploadTasks = [];

      if (bgFile) {
        uploadTasks.push(
          (async () => {
            const bgPath = `hero/bg_${Date.now()}_${bgFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            bgUrl = await uploadWithFallback(bgFile, bgPath, {
              preCompressed: fileHeroBg._compressed,
              maxWidth: 1400,
              maxHeight: 900,
              quality: 0.78,
              maxSizeBytes: 140 * 1024
            });
            currentBackgroundUrl = bgUrl;
          })()
        );
      }

      promoFiles.forEach((fileInput, index) => {
        const promoFile = fileInput?.files?.[0];
        if (!promoFile) return;
        uploadTasks.push((async () => {
          const promoPath = `hero/promo_${index + 1}_${Date.now()}_${promoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          promoUrls[index] = await uploadWithFallback(promoFile, promoPath, {
            preCompressed: fileInput._compressed,
            maxWidth: 1200,
            maxHeight: 1800,
            quality: 0.8,
            maxSizeBytes: 180 * 1024
          });
        })());
      });

      if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
      }
      const savedPromoUrls = promoUrls.filter(Boolean).slice(0, 3);

      const updateData = {
        title,
        subtitle,
        tagline,
        ctaText,
        promoActive,
        backgroundUrl: bgUrl,
        promoImageUrl: savedPromoUrls[0] || "",
        promoImages: savedPromoUrls,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "hero", "main"), updateData, { merge: true });

      // Clear file inputs so re-submitting doesn't re-upload
      if (fileHeroBg) fileHeroBg.value = "";
      promoFiles.forEach((file) => { if (file) file.value = ""; });

      await adminAlert("Pengaturan Hero & Banner Promo berhasil disimpan!", "Berhasil Disimpan", "success");

    } catch (err) {
      console.error("Gagal simpan hero:", err);
      await adminAlert("Gagal menyimpan data hero: " + err.message, "Gagal Menyimpan", "error");
    } finally {
      btnSave.disabled = false;
      btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan Hero';
    }
  });
}
