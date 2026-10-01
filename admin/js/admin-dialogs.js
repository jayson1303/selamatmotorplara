// ==========================================================================
// SELAMATMOTORPLARA
// admin-dialogs.js - Custom Modals for Alert, Confirm, Prompt & Generators
// ==========================================================================

import { formatRupiah } from "../../js/product-detail.js";

// Ensure dialog container exists in DOM
function getDialogContainer() {
  let container = document.getElementById("admin-dialog-root");
  if (!container) {
    container = document.createElement("div");
    container.id = "admin-dialog-root";
    document.body.appendChild(container);
  }
  return container;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Custom Alert Modal
 * @param {string} message - Content message
 * @param {string} title - Modal title (optional)
 * @param {'success'|'error'|'warning'|'info'} type - Dialog style
 * @returns {Promise<void>}
 */
export function adminAlert(message, title = "Pemberitahuan", type = "info") {
  return new Promise((resolve) => {
    const root = getDialogContainer();
    
    let iconClass = "fa-solid fa-circle-info";
    let iconBgClass = "icon-info";
    
    if (type === "success") {
      iconClass = "fa-solid fa-circle-check";
      iconBgClass = "icon-success";
    } else if (type === "error") {
      iconClass = "fa-solid fa-circle-xmark";
      iconBgClass = "icon-danger";
    } else if (type === "warning") {
      iconClass = "fa-solid fa-triangle-exclamation";
      iconBgClass = "icon-warning";
    }

    const overlay = document.createElement("div");
    overlay.className = "admin-dialog-overlay";
    overlay.innerHTML = `
      <div class="admin-dialog-box" style="max-width: 440px;">
        <div class="admin-dialog-header">
          <div class="admin-dialog-icon ${iconBgClass}">
            <i class="${iconClass}"></i>
          </div>
          <div>
            <h3 class="admin-dialog-title">${escapeHtml(title)}</h3>
          </div>
        </div>
        <div class="admin-dialog-body" style="white-space: pre-line; word-break: break-word;">
          ${escapeHtml(message)}
        </div>
        <div class="admin-dialog-footer">
          <button type="button" class="btn-admin-action btn-primary-action btn-dialog-ok" style="min-width: 100px;">
            Mengerti
          </button>
        </div>
      </div>
    `;

    root.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("active"));

    const closeDialog = () => {
      overlay.classList.remove("active");
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 200);
    };

    const btnOk = overlay.querySelector(".btn-dialog-ok");
    btnOk.addEventListener("click", closeDialog);
    btnOk.focus();

    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        closeDialog();
      }
    });
  });
}

/**
 * Custom Confirm Modal
 * @param {string} message - Confirmation prompt
 * @param {string} title - Modal title (optional)
 * @param {'danger'|'warning'|'info'} type - Dialog style
 * @param {string} confirmBtnText - Text for confirm button
 * @param {string} cancelBtnText - Text for cancel button
 * @returns {Promise<boolean>} - Resolves true if confirmed, false otherwise
 */
export function adminConfirm(
  message, 
  title = "Konfirmasi Tindakan", 
  type = "warning", 
  confirmBtnText = "Ya, Lanjutkan", 
  cancelBtnText = "Batal"
) {
  return new Promise((resolve) => {
    const root = getDialogContainer();

    let iconClass = "fa-solid fa-triangle-exclamation";
    let iconBgClass = "icon-warning";
    let confirmBtnClass = "btn-primary-action";

    if (type === "danger") {
      iconClass = "fa-solid fa-trash-can";
      iconBgClass = "icon-danger";
      confirmBtnClass = "btn-danger-action";
    } else if (type === "info") {
      iconClass = "fa-solid fa-circle-question";
      iconBgClass = "icon-info";
    }

    const overlay = document.createElement("div");
    overlay.className = "admin-dialog-overlay";
    overlay.innerHTML = `
      <div class="admin-dialog-box" style="max-width: 480px;">
        <div class="admin-dialog-header">
          <div class="admin-dialog-icon ${iconBgClass}">
            <i class="${iconClass}"></i>
          </div>
          <div>
            <h3 class="admin-dialog-title">${escapeHtml(title)}</h3>
          </div>
        </div>
        <div class="admin-dialog-body" style="white-space: pre-line; word-break: break-word;">
          ${escapeHtml(message)}
        </div>
        <div class="admin-dialog-footer">
          <button type="button" class="btn-admin-action btn-outline-action btn-dialog-cancel" style="min-width: 90px;">
            ${escapeHtml(cancelBtnText)}
          </button>
          <button type="button" class="btn-admin-action ${confirmBtnClass} btn-dialog-confirm" style="min-width: 110px;">
            ${escapeHtml(confirmBtnText)}
          </button>
        </div>
      </div>
    `;

    root.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("active"));

    const closeDialog = (result) => {
      overlay.classList.remove("active");
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };

    overlay.querySelector(".btn-dialog-cancel").addEventListener("click", () => closeDialog(false));
    overlay.querySelector(".btn-dialog-confirm").addEventListener("click", () => closeDialog(true));

    const btnConfirm = overlay.querySelector(".btn-dialog-confirm");
    btnConfirm.focus();

    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog(false);
      }
    });
  });
}

/**
 * Custom Prompt Modal (Generic Input)
 * @param {string} message - Prompt label
 * @param {string} defaultValue - Initial input value
 * @param {string} title - Modal title
 * @param {string} placeholder - Input placeholder
 * @param {'text'|'number'} inputType - HTML input type
 * @returns {Promise<string|null>} - Value if submitted, null if cancelled
 */
export function adminPrompt(
  message, 
  defaultValue = "", 
  title = "Input Data", 
  placeholder = "", 
  inputType = "text", 
  confirmBtnText = "Simpan"
) {
  return new Promise((resolve) => {
    const root = getDialogContainer();

    const overlay = document.createElement("div");
    overlay.className = "admin-dialog-overlay";
    overlay.innerHTML = `
      <div class="admin-dialog-box" style="max-width: 480px;">
        <div class="admin-dialog-header">
          <div class="admin-dialog-icon icon-info">
            <i class="fa-solid fa-pen"></i>
          </div>
          <div>
            <h3 class="admin-dialog-title">${escapeHtml(title)}</h3>
          </div>
        </div>
        <div class="admin-dialog-body">
          <p style="margin-bottom: 12px; color: #475569;">${escapeHtml(message)}</p>
          <input type="${inputType}" class="form-control dialog-prompt-input" value="${escapeHtml(defaultValue)}" placeholder="${escapeHtml(placeholder)}" style="width: 100%; padding: 8px 12px; font-size: 0.95rem;">
        </div>
        <div class="admin-dialog-footer">
          <button type="button" class="btn-admin-action btn-outline-action btn-dialog-cancel">Batal</button>
          <button type="button" class="btn-admin-action btn-primary-action btn-dialog-confirm">${escapeHtml(confirmBtnText)}</button>
        </div>
      </div>
    `;

    root.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("active"));

    const input = overlay.querySelector(".dialog-prompt-input");
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);

    const closeDialog = (value) => {
      overlay.classList.remove("active");
      setTimeout(() => {
        overlay.remove();
        resolve(value);
      }, 200);
    };

    overlay.querySelector(".btn-dialog-cancel").addEventListener("click", () => closeDialog(null));
    overlay.querySelector(".btn-dialog-confirm").addEventListener("click", () => {
      closeDialog(input.value.trim());
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        closeDialog(input.value.trim());
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDialog(null);
      }
    });
  });
}

/**
 * Specialized Modal for "Generate Otomatis DP"
 * Replaces the prompt() popup with a beautiful custom modal with formatted currency and quick chips.
 * @returns {Promise<number|null>} - Returns valid DP number or null if cancelled
 */
export function adminPromptDp() {
  return new Promise((resolve) => {
    const root = getDialogContainer();

    const overlay = document.createElement("div");
    overlay.className = "admin-dialog-overlay";
    overlay.innerHTML = `
      <div class="admin-dialog-box" style="max-width: 500px;">
        <div class="admin-dialog-header">
          <div class="admin-dialog-icon icon-danger">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div>
            <h3 class="admin-dialog-title">Generate Otomatis Baris DP</h3>
            <p style="font-size: 0.78rem; color: #64748B; margin: 2px 0 0;">Simulasi Kredit Tenor 11, 17, 23, 29, & 35 Bulan</p>
          </div>
        </div>
        
        <div class="admin-dialog-body">
          <p style="font-size: 0.88rem; color: #475569; margin-bottom: 12px; line-height: 1.5;">
            Masukkan nominal <strong>Uang Muka (DP)</strong> dalam Rupiah. Sistem akan otomatis menambahkan <strong>5 baris tenor standar</strong> siap diisi nilai cicilannya.
          </p>

          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Nominal DP (Rp):</label>
            <div style="position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 700; color: #64748B;">Rp</span>
              <input type="text" class="form-control dp-input-field" placeholder="Contoh: 2500000" value="2500000" style="padding-left: 42px; font-size: 1.05rem; font-weight: 700; color: #1E293B;">
            </div>
            <div class="dp-preview-text" style="font-size: 0.82rem; font-weight: 600; color: #059669; margin-top: 6px;">
              = Rp 2.500.000
            </div>
          </div>

          <!-- Quick Chips -->
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 6px;">Pilihan Cepat Nominal DP:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <button type="button" class="dp-quick-chip" data-val="1500000">Rp 1.500.000</button>
              <button type="button" class="dp-quick-chip" data-val="2000000">Rp 2.000.000</button>
              <button type="button" class="dp-quick-chip" data-val="2500000">Rp 2.500.000</button>
              <button type="button" class="dp-quick-chip" data-val="3000000">Rp 3.000.000</button>
              <button type="button" class="dp-quick-chip" data-val="4000000">Rp 4.000.000</button>
            </div>
          </div>
        </div>

        <div class="admin-dialog-footer">
          <button type="button" class="btn-admin-action btn-outline-action btn-dp-cancel">Batal</button>
          <button type="button" class="btn-admin-action btn-primary-action btn-dp-submit">
            <i class="fa-solid fa-bolt"></i> Generate 5 Baris Tenor
          </button>
        </div>
      </div>
    `;

    root.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("active"));

    const input = overlay.querySelector(".dp-input-field");
    const preview = overlay.querySelector(".dp-preview-text");

    const updatePreview = () => {
      const raw = input.value.replace(/[^0-9]/g, "");
      const val = parseInt(raw) || 0;
      if (val > 0) {
        preview.textContent = `= ${formatRupiah(val)}`;
        preview.style.color = "#059669";
      } else {
        preview.textContent = "Nominal harus lebih dari 0";
        preview.style.color = "#DC2626";
      }
    };

    input.addEventListener("input", updatePreview);

    overlay.querySelectorAll(".dp-quick-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        input.value = chip.dataset.val;
        updatePreview();
        input.focus();
      });
    });

    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);

    const closeDialog = (val) => {
      overlay.classList.remove("active");
      setTimeout(() => {
        overlay.remove();
        resolve(val);
      }, 200);
    };

    overlay.querySelector(".btn-dp-cancel").addEventListener("click", () => closeDialog(null));

    const handleSubmit = () => {
      const raw = input.value.replace(/[^0-9]/g, "");
      const val = parseInt(raw);
      if (isNaN(val) || val <= 0) {
        preview.textContent = "Nominal DP tidak valid. Harap masukkan angka lebih dari 0!";
        preview.style.color = "#DC2626";
        input.focus();
        return;
      }
      closeDialog(val);
    };

    overlay.querySelector(".btn-dp-submit").addEventListener("click", handleSubmit);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDialog(null);
      }
    });
  });
}

/**
 * Specialized Modal for "+ Kategori Baru"
 * Replaces the prompt() popup with a custom modal with quick suggestions.
 * @returns {Promise<string|null>} - Returns category name string or null if cancelled
 */
export function adminPromptCategory() {
  return new Promise((resolve) => {
    const root = getDialogContainer();

    const overlay = document.createElement("div");
    overlay.className = "admin-dialog-overlay";
    overlay.innerHTML = `
      <div class="admin-dialog-box" style="max-width: 480px;">
        <div class="admin-dialog-header">
          <div class="admin-dialog-icon icon-danger">
            <i class="fa-solid fa-tags"></i>
          </div>
          <div>
            <h3 class="admin-dialog-title">Tambah Kategori Seri Baru</h3>
            <p style="font-size: 0.78rem; color: #64748B; margin: 2px 0 0;">Tambahkan kelompok motor Honda baru</p>
          </div>
        </div>
        
        <div class="admin-dialog-body">
          <p style="font-size: 0.88rem; color: #475569; margin-bottom: 12px; line-height: 1.5;">
            Masukkan nama kategori seri motor Honda. Kategori ini akan otomatis tersimpan dan dapat langsung dipilih pada formulir motor.
          </p>

          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Nama Kategori Seri *</label>
            <input type="text" class="form-control cat-input-field" placeholder="Contoh: Sonic Series, CT125 Series..." style="width: 100%; padding: 8px 12px; font-size: 0.95rem;">
            <div class="cat-error-text" style="font-size: 0.8rem; color: #DC2626; margin-top: 4px; display: none;"></div>
          </div>

          <!-- Quick Suggestions -->
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 6px;">Saran Kategori Seri:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <button type="button" class="dp-quick-chip cat-quick-chip" data-val="Sonic Series">+ Sonic Series</button>
              <button type="button" class="dp-quick-chip cat-quick-chip" data-val="CT125 Series">+ CT125 Series</button>
              <button type="button" class="dp-quick-chip cat-quick-chip" data-val="EM1 e: Series">+ EM1 e: Series</button>
              <button type="button" class="dp-quick-chip cat-quick-chip" data-val="Monkey Series">+ Monkey Series</button>
              <button type="button" class="dp-quick-chip cat-quick-chip" data-val="ST125 Dax Series">+ Dax Series</button>
            </div>
          </div>
        </div>

        <div class="admin-dialog-footer">
          <button type="button" class="btn-admin-action btn-outline-action btn-cat-cancel">Batal</button>
          <button type="button" class="btn-admin-action btn-primary-action btn-cat-submit">
            <i class="fa-solid fa-plus"></i> Tambah Kategori
          </button>
        </div>
      </div>
    `;

    root.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("active"));

    const input = overlay.querySelector(".cat-input-field");
    const errText = overlay.querySelector(".cat-error-text");

    overlay.querySelectorAll(".cat-quick-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        input.value = chip.dataset.val;
        errText.style.display = "none";
        input.focus();
      });
    });

    setTimeout(() => {
      input.focus();
    }, 100);

    const closeDialog = (val) => {
      overlay.classList.remove("active");
      setTimeout(() => {
        overlay.remove();
        resolve(val);
      }, 200);
    };

    overlay.querySelector(".btn-cat-cancel").addEventListener("click", () => closeDialog(null));

    const handleSubmit = () => {
      const val = input.value.trim();
      if (!val) {
        errText.textContent = "Nama kategori seri tidak boleh kosong!";
        errText.style.display = "block";
        input.focus();
        return;
      }
      closeDialog(val);
    };

    overlay.querySelector(".btn-cat-submit").addEventListener("click", handleSubmit);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDialog(null);
      }
    });
  });
}

// Global window fallbacks for backwards compatibility
if (typeof window !== "undefined") {
  window.adminAlert = adminAlert;
  window.adminConfirm = adminConfirm;
  window.adminPrompt = adminPrompt;
  window.adminPromptDp = adminPromptDp;
  window.adminPromptCategory = adminPromptCategory;
}
