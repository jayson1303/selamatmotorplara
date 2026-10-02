// ==========================================================================
// ANDRASELAMATMOTOR
// admin-about.js - Kelola Bagian Tentang Kami
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

export async function initAdminAbout() {
  const form = document.getElementById("form-about");
  if (!form) return;

  let currentAboutFoto = "";
  const fileInput = document.getElementById("file-about-img");
  const imgPreview = document.getElementById("preview-about-img");

  try {
    const snap = await getDoc(doc(db, "about", "main"));
    let data = {};
    if (snap.exists()) {
      data = snap.data();
    } else {
      const res = await fetch("../data/default-settings.json");
      const defaults = await res.json();
      data = defaults.about || {};
    }

    currentAboutFoto = data.foto || "";

    document.getElementById("about-input-title").value = data.title || "";
    document.getElementById("about-input-desc").value = data.deskripsi || "";

    if (currentAboutFoto && imgPreview) {
      imgPreview.src = formatAdminImageUrl(currentAboutFoto);
      imgPreview.style.display = "block";
    }

  } catch (err) {
    console.error("Error loading about data:", err);
  }

  // Setup client-side compressed preview on file selection
  if (fileInput && imgPreview) {
    setupCompressedPreview(fileInput, imgPreview, {
      maxWidth: 1000,
      maxHeight: 800,
      quality: 0.8,
      maxSizeBytes: 80 * 1024
    });
  }

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById("btn-save-about");
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
      const title = document.getElementById("about-input-title").value.trim();
      const deskripsi = document.getElementById("about-input-desc").value.trim();
      let fotoUrl = currentAboutFoto || "";

      const file = fileInput?.files?.[0];
      if (file) {
        const filePath = `about/about_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        fotoUrl = await uploadWithFallback(file, filePath, {
          preCompressed: fileInput._compressed,
          maxWidth: 1000,
          maxHeight: 800,
          quality: 0.8,
          maxSizeBytes: 80 * 1024
        });
        currentAboutFoto = fotoUrl;
      }

      const updateData = {
        title,
        deskripsi,
        foto: fotoUrl,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "about", "main"), updateData, { merge: true });

      if (fileInput) {
        fileInput.value = "";
        fileInput._compressed = null;
      }

      await adminAlert("Bagian Tentang Kami berhasil diperbarui!", "Berhasil Disimpan", "success");

    } catch (err) {
      console.error("Gagal simpan about:", err);
      await adminAlert("Gagal menyimpan data Tentang Kami: " + err.message, "Gagal Menyimpan", "error");
    } finally {
      btnSave.disabled = false;
      btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan Tentang Kami';
    }
  });
}
