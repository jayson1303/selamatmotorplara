// ==========================================================================
// ANDRASELAMATMOTOR
// admin-contact.js - Kelola Kontak, Sosial Media & Template WhatsApp
// ==========================================================================

import { 
  db, 
  doc, 
  getDoc, 
  setDoc 
} from "../../js/firebase-config.js";

import { adminAlert } from "./admin-dialogs.js";

export async function initAdminContact() {
  await loadContactAndTemplateData();
  setupTemplatePlaceholderButtons();
  setupLiveTemplatePreview();

  const formContact = document.getElementById("form-contact");
  if (formContact) {
    formContact.addEventListener("submit", handleSaveContact);
  }

  const formTemplate = document.getElementById("form-template");
  if (formTemplate) {
    formTemplate.addEventListener("submit", handleSaveTemplate);
  }
}

async function loadContactAndTemplateData() {
  try {
    // 1. Contact Settings
    const contactSnap = await getDoc(doc(db, "settings", "contact"));
    let contactData = {};
    if (contactSnap.exists()) {
      contactData = contactSnap.data();
    } else {
      const res = await fetch("../data/default-settings.json");
      const defaults = await res.json();
      contactData = defaults.contact || {};
    }

    document.getElementById("contact-input-alamat").value = contactData.alamat || "";
    document.getElementById("contact-input-jam").value = contactData.jamOperasional || "";
    document.getElementById("contact-input-wa-num").value = contactData.whatsappNumber || "";
    document.getElementById("contact-input-wa-link").value = contactData.whatsappLink || "https://wa.me/message/U3EXD46A5L7PM1";
    document.getElementById("contact-input-ig").value = contactData.instagram || "";
    document.getElementById("contact-input-tiktok").value = contactData.tiktok || "";
    document.getElementById("contact-input-fb").value = contactData.facebook || "";
    document.getElementById("contact-input-maps").value = contactData.googleMapsEmbed || "";

    // 2. WA Template
    const templateSnap = await getDoc(doc(db, "settings", "waTemplate"));
    let templateData = {};
    if (templateSnap.exists()) {
      templateData = templateSnap.data();
    } else {
      const res = await fetch("../data/default-settings.json");
      const defaults = await res.json();
      templateData = defaults.waTemplate || {};
    }

    const templateInput = document.getElementById("template-input-text");
    if (templateInput) {
      templateInput.value = templateData.template || "Halo ANDRASELAMATMOTOR, saya tertarik dengan:\nMotor: {namaMotor}\nWarna: {warna}\nSimulasi Kredit: DP {dp} - Tenor {tenor} bulan - Cicilan {cicilan}/bulan\nMohon info lebih lanjut. Terima kasih.";
      updatePreview(templateInput.value);
    }

  } catch (err) {
    console.error("Error loading contact & template:", err);
  }
}

async function handleSaveContact(e) {
  e.preventDefault();
  const btnSave = document.getElementById("btn-save-contact");
  btnSave.disabled = true;
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const alamat = document.getElementById("contact-input-alamat").value.trim();
    const jamOperasional = document.getElementById("contact-input-jam").value.trim();
    const whatsappNumber = document.getElementById("contact-input-wa-num").value.trim();
    const whatsappLink = document.getElementById("contact-input-wa-link").value.trim();
    const instagram = document.getElementById("contact-input-ig").value.trim();
    const tiktok = document.getElementById("contact-input-tiktok").value.trim();
    const facebook = document.getElementById("contact-input-fb").value.trim();
    const googleMapsEmbed = document.getElementById("contact-input-maps").value.trim();

    const payload = {
      alamat,
      jamOperasional,
      whatsappNumber,
      whatsappLink,
      instagram,
      tiktok,
      facebook,
      googleMapsEmbed,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, "settings", "contact"), payload, { merge: true });
    await adminAlert("Informasi Kontak & Sosial Media berhasil disimpan!", "Berhasil Disimpan", "success");

  } catch (err) {
    console.error("Gagal simpan contact:", err);
    await adminAlert("Gagal menyimpan kontak: " + err.message, "Gagal Menyimpan", "error");
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Pengaturan Kontak';
  }
}

async function handleSaveTemplate(e) {
  e.preventDefault();
  const btnSave = document.getElementById("btn-save-template");
  btnSave.disabled = true;
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const template = document.getElementById("template-input-text").value;
    await setDoc(doc(db, "settings", "waTemplate"), {
      template,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await adminAlert("Template Pesan WhatsApp berhasil disimpan!", "Berhasil Disimpan", "success");
  } catch (err) {
    console.error("Gagal simpan template WA:", err);
    await adminAlert("Gagal menyimpan template WhatsApp: " + err.message, "Gagal Menyimpan", "error");
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Template WhatsApp';
  }
}

function setupTemplatePlaceholderButtons() {
  const container = document.getElementById("template-tags-container");
  const textarea = document.getElementById("template-input-text");
  if (!container || !textarea) return;

  container.querySelectorAll(".template-tag-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      textarea.value = text.substring(0, start) + tag + text.substring(end);
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tag.length;

      updatePreview(textarea.value);
    });
  });
}

function setupLiveTemplatePreview() {
  const textarea = document.getElementById("template-input-text");
  if (!textarea) return;

  textarea.addEventListener("input", () => {
    updatePreview(textarea.value);
  });
}

function updatePreview(rawText) {
  const previewBox = document.getElementById("template-preview-text");
  if (!previewBox) return;

  let text = rawText || "";
  text = text.replace(/{namaMotor}/g, "Honda BeAT CBS");
  text = text.replace(/{warna}/g, "Merah Hard Rock");
  text = text.replace(/{dp}/g, "Rp 2.000.000");
  text = text.replace(/{tenor}/g, "35");
  text = text.replace(/{cicilan}/g, "Rp 885.000");
  text = text.replace(/{hargaCash}/g, "Rp 19.675.000");

  previewBox.textContent = text;
}
