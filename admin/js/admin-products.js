// ==========================================================================
// SELAMATMOTORPLARA
// admin-products.js - CRUD Produk, Simulasi Kredit, Kategori Seri & Import
// ==========================================================================

import { 
  db, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  addDoc, 
  deleteDoc 
} from "../../js/firebase-config.js";

import { formatRupiah } from "../../js/product-detail.js";
import { 
  adminAlert, 
  adminConfirm, 
  adminPrompt, 
  adminPromptDp, 
  adminPromptCategory 
} from "./admin-dialogs.js";
import { 
  uploadWithFallback, 
  setupCompressedPreview, 
  formatAdminImageUrl 
} from "./image-utils.js";

const DEFAULT_CATEGORIES = [
  "ADV Series",
  "Beat Series",
  "PCX Series",
  "Vario Series",
  "Scoopy Series",
  "Stylo Series",
  "Genio Series",
  "Supra Series",
  "Revo Series",
  "CBR Series",
  "CB150 Series",
  "CRF/Off-Road Series",
  "CB Verza Series",
  "Forza Series"
];

let allCategories = [...DEFAULT_CATEGORIES];
let productsList = [];
let editingProductId = null;
let currentColorVariants = [];
let currentSimulations = [];
let applyFiltersFn = null;

export async function initAdminProducts() {
  await loadCategories();
  await loadProductsTable();
  setupFilterAndSearch();
  setupProductModalEvents();
  setupImportModalEvents();
  setupCategoryManagementEvents();
}

// --------------------------------------------------------------------------
// 1. Categories Management (Load, Save, Sync Dropdowns, Manager UI)
// --------------------------------------------------------------------------
export async function loadCategories() {
  allCategories = [...DEFAULT_CATEGORIES];
  try {
    const snap = await getDoc(doc(db, "settings", "categories"));
    if (snap.exists() && Array.isArray(snap.data().list) && snap.data().list.length > 0) {
      allCategories = snap.data().list;
    } else {
      const localCat = localStorage.getItem("admin_categories");
      if (localCat) {
        try {
          const parsed = JSON.parse(localCat);
          if (Array.isArray(parsed) && parsed.length > 0) allCategories = parsed;
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn("Could not load categories from Firestore, checking localStorage:", err);
    const localCat = localStorage.getItem("admin_categories");
    if (localCat) {
      try {
        const parsed = JSON.parse(localCat);
        if (Array.isArray(parsed) && parsed.length > 0) allCategories = parsed;
      } catch (e) {}
    }
  }

  // Ensure default categories are present if empty
  if (!allCategories || allCategories.length === 0) {
    allCategories = [...DEFAULT_CATEGORIES];
  }

  syncCategoriesToDropdowns();
  renderCategoryManagerList();
}

export async function saveCategories() {
  try {
    await setDoc(doc(db, "settings", "categories"), {
      list: allCategories,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Could not save categories to Firestore, saved to localStorage:", err);
  }
  try {
    localStorage.setItem("admin_categories", JSON.stringify(allCategories));
  } catch (e) {}
}

export function syncCategoriesToDropdowns() {
  // 1. Filter dropdown in product table
  const filterCat = document.getElementById("product-filter-cat");
  if (filterCat) {
    const currentVal = filterCat.value || "all";
    filterCat.innerHTML = `<option value="all">Semua Kategori</option>` + 
      allCategories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join("");
    
    const exists = [...filterCat.options].some(o => o.value.toLowerCase() === currentVal.toLowerCase());
    if (exists) {
      filterCat.value = currentVal;
    } else {
      filterCat.value = "all";
    }
  }

  // 2. Category select inside Product Modal
  const prodInputKat = document.getElementById("prod-input-kategori");
  if (prodInputKat) {
    const currentVal = prodInputKat.value || "";
    prodInputKat.innerHTML = allCategories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join("") +
      `<option value="__NEW__">➕ Tambah Kategori Baru...</option>`;
    
    if (currentVal && [...prodInputKat.options].some(o => o.value === currentVal)) {
      prodInputKat.value = currentVal;
    }
  }

  // 3. Category total count badge
  const badge = document.getElementById("category-total-badge");
  if (badge) {
    badge.textContent = `${allCategories.length} Seri`;
  }
}

export function renderCategoryManagerList() {
  const container = document.getElementById("category-manager-list");
  const badge = document.getElementById("category-total-badge");
  if (badge) badge.textContent = `${allCategories.length} Seri`;
  if (!container) return;

  container.innerHTML = "";

  if (allCategories.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #94A3B8; padding: 20px;">Belum ada kategori aktif. Tambahkan kategori baru di atas.</div>`;
    return;
  }

  allCategories.forEach((cat, idx) => {
    const prodCount = productsList.filter(p => (p.kategori || "").toLowerCase() === cat.toLowerCase()).length;
    const row = document.createElement("div");
    row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #FFF; padding: 10px 14px; border-radius: 6px; border: 1px solid #E2E8F0; transition: all 0.15s ease;";
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-weight: 700; color: #1E293B; font-size: 0.92rem;">
          <i class="fa-solid fa-tag" style="color: #DC2626; font-size: 0.8rem; margin-right: 6px;"></i>${escapeHtml(cat)}
        </span>
        <span style="font-size: 0.75rem; background: #F1F5F9; color: #64748B; padding: 2px 8px; border-radius: 12px; font-weight: 600;">
          ${prodCount} Motor
        </span>
      </div>
      <div style="display: flex; gap: 6px;">
        <button type="button" class="btn-del-cat" data-index="${idx}" title="Hapus Kategori" style="background: none; border: 1px solid #FECACA; color: #DC2626; padding: 5px 9px; border-radius: 4px; cursor: pointer; font-size: 0.78rem;">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    row.querySelector(".btn-del-cat").addEventListener("click", async () => {
      let confirmMsg = `Hapus kategori seri "${cat}" dari daftar?`;
      if (prodCount > 0) {
        confirmMsg = `Kategori "${cat}" saat ini digunakan oleh ${prodCount} motor.\nApakah Anda yakin ingin menghapusnya dari daftar kategori? Data motor akan tetap tersimpan.`;
      }
      
      const confirmed = await adminConfirm(confirmMsg, "Hapus Kategori Seri", "danger", "Ya, Hapus");
      if (!confirmed) return;

      allCategories.splice(idx, 1);
      if (allCategories.length === 0) {
        allCategories = [...DEFAULT_CATEGORIES];
      }
      await saveCategories();
      syncCategoriesToDropdowns();
      renderCategoryManagerList();
      if (applyFiltersFn) applyFiltersFn();
    });

    container.appendChild(row);
  });
}

export function setupCategoryManagementEvents() {
  const btnOpen = document.getElementById("btn-open-categories");
  const modal = document.getElementById("modal-categories");
  const btnClose = document.getElementById("modal-categories-close");
  const btnSubmit = document.getElementById("btn-submit-new-category");
  const inputNew = document.getElementById("input-new-category-name");

  if (btnOpen && modal) {
    btnOpen.addEventListener("click", () => {
      renderCategoryManagerList();
      modal.classList.add("active");
      if (inputNew) {
        inputNew.value = "";
        setTimeout(() => inputNew.focus(), 150);
      }
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  const handleAddNewCat = async () => {
    if (!inputNew) return;
    const val = inputNew.value.trim();
    if (!val) {
      await adminAlert("Silakan masukkan nama kategori seri motor terlebih dahulu!", "Peringatan", "warning");
      inputNew.focus();
      return;
    }

    // Check duplicate
    const exists = allCategories.some(c => c.toLowerCase() === val.toLowerCase());
    if (exists) {
      await adminAlert(`Kategori "${val}" sudah ada dalam daftar kategori aktif!`, "Kategori Sudah Ada", "warning");
      inputNew.focus();
      return;
    }

    allCategories.push(val);
    await saveCategories();
    syncCategoriesToDropdowns();
    renderCategoryManagerList();
    inputNew.value = "";
    await adminAlert(`Kategori "${val}" berhasil ditambahkan ke daftar seri!`, "Kategori Ditambahkan", "success");
  };

  if (btnSubmit) {
    btnSubmit.addEventListener("click", handleAddNewCat);
  }

  if (inputNew) {
    inputNew.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddNewCat();
      }
    });
  }

  // Quick Add from Product Modal (+ Kategori Baru button)
  const btnQuickAdd = document.getElementById("btn-quick-add-category");
  if (btnQuickAdd) {
    btnQuickAdd.addEventListener("click", async () => {
      const cleanVal = await adminPromptCategory();
      if (!cleanVal) return;

      if (!allCategories.some(c => c.toLowerCase() === cleanVal.toLowerCase())) {
        allCategories.push(cleanVal);
        await saveCategories();
        syncCategoriesToDropdowns();
        renderCategoryManagerList();
      }

      const prodInputKat = document.getElementById("prod-input-kategori");
      if (prodInputKat) {
        prodInputKat.value = cleanVal;
      }
    });
  }

  // Handle __NEW__ option in product category dropdown
  const prodInputKat = document.getElementById("prod-input-kategori");
  if (prodInputKat) {
    let lastSelectedKat = prodInputKat.value;
    prodInputKat.addEventListener("focus", () => {
      if (prodInputKat.value !== "__NEW__") {
        lastSelectedKat = prodInputKat.value;
      }
    });
    prodInputKat.addEventListener("change", async () => {
      if (prodInputKat.value === "__NEW__") {
        const cleanVal = await adminPromptCategory();
        if (!cleanVal) {
          prodInputKat.value = lastSelectedKat || allCategories[0] || "Beat Series";
          return;
        }
        if (!allCategories.some(c => c.toLowerCase() === cleanVal.toLowerCase())) {
          allCategories.push(cleanVal);
          await saveCategories();
          syncCategoriesToDropdowns();
          renderCategoryManagerList();
        }
        prodInputKat.value = cleanVal;
        lastSelectedKat = cleanVal;
      } else {
        lastSelectedKat = prodInputKat.value;
      }
    });
  }
}

// --------------------------------------------------------------------------
// 2. Load & Render Table
// --------------------------------------------------------------------------
export async function loadProductsTable() {
  const tbody = document.getElementById("tbody-products");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar motor...</td></tr>';

  try {
    const snap = await getDocs(collection(db, "products"));
    productsList = [];
    snap.forEach(d => {
      productsList.push({ id: d.id, ...d.data() });
    });

    if (productsList.length === 0) {
      // Fallback to seed json
      const res = await fetch("../data/seed-products.json");
      productsList = await res.json();
    }
  } catch (err) {
    console.warn("Firestore error loading products, using fallback:", err);
    try {
      const res = await fetch("../data/seed-products.json");
      productsList = await res.json();
    } catch (e) {
      productsList = [];
    }
  }

  // Normalize categories
  productsList.forEach(p => {
    p.kategori = getProductCategory(p);
    // Ensure all existing categories in products are recognized
    if (p.kategori && !allCategories.some(c => c.toLowerCase() === p.kategori.toLowerCase())) {
      allCategories.push(p.kategori);
    }
  });

  syncCategoriesToDropdowns();

  // Update counter
  const metricCount = document.getElementById("metric-products-count");
  if (metricCount) metricCount.textContent = productsList.length;

  if (applyFiltersFn) {
    applyFiltersFn();
  } else {
    renderProductsTable(productsList);
  }
}

function renderProductsTable(list) {
  const tbody = document.getElementById("tbody-products");
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 28px; color: #94A3B8;"><i class="fa-solid fa-circle-exclamation" style="margin-right: 6px;"></i> Tidak ada data motor yang sesuai kriteria pencarian/filter.</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  list.forEach(p => {
    let mainPhoto = (p.warna && p.warna.length > 0 && p.warna[0].foto) 
      ? p.warna[0].foto 
      : "../assets/img/logo/logo.png";

    if (mainPhoto && !mainPhoto.startsWith("http") && !mainPhoto.startsWith("../") && !mainPhoto.startsWith("data:")) {
      mainPhoto = "../" + mainPhoto;
    }

    const catName = getProductCategory(p);
    const catClass = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const simCount = (p.simulasiKredit && p.simulasiKredit.length) || 0;
    const priceVal = p.hargaCashAsuransi || p.hargaOtr || 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <img src="${mainPhoto}" alt="${escapeHtml(p.namaMotor)}" class="table-thumb" onerror="this.src='../assets/img/logo/logo.png'">
      </td>
      <td>
        <strong>${escapeHtml(p.namaMotor || 'Sepeda Motor')}</strong>
        <div style="font-size: 0.75rem; color: #94A3B8;">${p.warna?.length || 0} Varian Warna</div>
      </td>
      <td><span class="badge-status badge-${catClass}">${escapeHtml(catName)}</span></td>
      <td><strong>${formatRupiah(priceVal)}</strong></td>
      <td><span style="font-weight: 600; color: #059669;">${simCount} Simulasi</span></td>
      <td>
        <div class="table-action-btns">
          <button type="button" class="btn-tbl-edit" data-id="${p.id}"><i class="fa-solid fa-pen"></i> Edit</button>
          <button type="button" class="btn-tbl-delete" data-id="${p.id}"><i class="fa-solid fa-trash"></i> Hapus</button>
        </div>
      </td>
    `;

    tr.querySelector(".btn-tbl-edit").addEventListener("click", () => openProductModal(p));
    tr.querySelector(".btn-tbl-delete").addEventListener("click", () => handleDeleteProduct(p.id));

    tbody.appendChild(tr);
  });
}

function setupFilterAndSearch() {
  const filterCat = document.getElementById("product-filter-cat");
  const searchInput = document.getElementById("product-search-input");

  applyFiltersFn = () => {
    const cat = filterCat ? filterCat.value.trim() : "all";
    const kw = searchInput ? searchInput.value.toLowerCase().trim() : "";

    let filtered = productsList;
    if (cat !== "all" && cat !== "") {
      filtered = filtered.filter(p => (p.kategori || "").trim().toLowerCase() === cat.toLowerCase());
    }
    if (kw !== "") {
      filtered = filtered.filter(p => (p.namaMotor || "").toLowerCase().includes(kw));
    }
    renderProductsTable(filtered);
  };

  if (filterCat) filterCat.addEventListener("change", applyFiltersFn);
  if (searchInput) searchInput.addEventListener("input", applyFiltersFn);
}

// --------------------------------------------------------------------------
// 3. Product Form Modal & Variant / Simulation Editors
// --------------------------------------------------------------------------
function setupProductModalEvents() {
  const btnAdd = document.getElementById("btn-add-product");
  if (btnAdd) {
    btnAdd.addEventListener("click", () => openProductModal(null));
  }

  const btnClose = document.getElementById("modal-product-close");
  const modal = document.getElementById("modal-product");
  if (btnClose && modal) {
    btnClose.addEventListener("click", () => modal.classList.remove("active"));
  }

  // Add Color Variant Button
  const btnAddColor = document.getElementById("btn-add-color-variant");
  if (btnAddColor) {
    btnAddColor.addEventListener("click", () => {
      const container = document.getElementById("colors-container");
      const currentCount = container ? container.querySelectorAll(".color-variant-row").length : 0;
      addColorVariantRow({ nama: `Warna Varian ${currentCount + 1}`, foto: "" });
    });
  }

  // Add Simulation Row Button: DIRECTLY ADDS 1 BLANK EMPTY ROW (READY FOR MANUAL ENTRY)
  const btnAddSim = document.getElementById("btn-add-sim-row");
  if (btnAddSim) {
    btnAddSim.addEventListener("click", () => {
      // Add completely empty row: DP empty, Tenor 35 Bulan default, Cicilan empty
      const newRow = addSimulationRow({ dp: "", tenor: 35, cicilan: "" });
      const container = document.getElementById("simulations-container");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      if (newRow) {
        const dpInput = newRow.querySelector(".sim-dp");
        if (dpInput) {
          setTimeout(() => dpInput.focus(), 60);
        }
      }
    });
  }

  // Quick Generate Simulations (CUSTOM MODAL REPLACING NATIVE PROMPT)
  const btnQuickGen = document.getElementById("btn-quick-generate-sim");
  if (btnQuickGen) {
    btnQuickGen.addEventListener("click", async () => {
      const dp = await adminPromptDp();
      if (!dp) return; // User cancelled or closed

      const tenors = [11, 17, 23, 29, 35];
      tenors.forEach(t => {
        addSimulationRow({ dp, tenor: t, cicilan: "" });
      });

      const container = document.getElementById("simulations-container");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }

  // Form Submit
  const form = document.getElementById("form-product");
  if (form) {
    form.addEventListener("submit", handleSaveProduct);
  }
}

function openProductModal(prod = null) {
  const modal = document.getElementById("modal-product");
  const modalTitle = document.getElementById("modal-product-title");
  const inputNama = document.getElementById("prod-input-nama");
  const inputKat = document.getElementById("prod-input-kategori");
  const inputCash = document.getElementById("prod-input-cash");
  const inputDesc = document.getElementById("prod-input-desc");

  if (!modal) return;

  // Make sure category dropdown is fresh
  syncCategoriesToDropdowns();

  if (prod) {
    editingProductId = prod.id;
    modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Data Motor: <strong>${escapeHtml(prod.namaMotor || '')}</strong>`;
    inputNama.value = prod.namaMotor || "";
    
    const cat = getProductCategory(prod);
    if (cat && !allCategories.some(c => c.toLowerCase() === cat.toLowerCase())) {
      allCategories.push(cat);
      syncCategoriesToDropdowns();
    }
    inputKat.value = cat;

    inputCash.value = prod.hargaCashAsuransi || prod.hargaOtr || "";
    inputDesc.value = prod.deskripsiSingkat || "";
    currentColorVariants = (prod.warna && Array.isArray(prod.warna) && prod.warna.length > 0)
      ? JSON.parse(JSON.stringify(prod.warna))
      : [{ nama: "Warna Utama", foto: "" }];
    currentSimulations = (prod.simulasiKredit && Array.isArray(prod.simulasiKredit) && prod.simulasiKredit.length > 0)
      ? JSON.parse(JSON.stringify(prod.simulasiKredit))
      : [];
  } else {
    editingProductId = null;
    modalTitle.innerHTML = `<i class="fa-solid fa-motorcycle"></i> Tambah Sepeda Motor Baru`;
    inputNama.value = "";
    
    const filterCat = document.getElementById("product-filter-cat");
    const selectedFilter = filterCat && filterCat.value !== "all" ? filterCat.value : null;
    inputKat.value = selectedFilter || allCategories[0] || "Beat Series";
    
    inputCash.value = "";
    inputDesc.value = "";
    currentColorVariants = [{ nama: "Warna Standar", foto: "" }];
    currentSimulations = [
      { dp: 2000000, tenor: 11, cicilan: 2100000 },
      { dp: 2000000, tenor: 17, cicilan: 1480000 },
      { dp: 2000000, tenor: 23, cicilan: 1170000 },
      { dp: 2000000, tenor: 29, cicilan: 1000000 },
      { dp: 2000000, tenor: 35, cicilan: 880000 }
    ];
  }

  renderColorVariantsUI();
  renderSimulationsUI();

  modal.classList.add("active");
  setTimeout(() => inputNama && inputNama.focus(), 150);
}

function renderColorVariantsUI() {
  const container = document.getElementById("colors-container");
  if (!container) return;

  container.innerHTML = "";
  currentColorVariants.forEach((v, idx) => {
    addColorVariantRow(v, idx);
  });
}

function addColorVariantRow(variant = { nama: "", foto: "" }, index = null) {
  const container = document.getElementById("colors-container");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "color-variant-row";
  row.style.cssText = "display: flex; gap: 10px; align-items: center; margin-bottom: 8px; background: #F8FAFC; padding: 8px; border-radius: 6px; border: 1px solid #E2E8F0;";
  
  row.dataset.originalFoto = variant.foto || "";

  let previewSrc = variant.foto || "../assets/img/logo/logo.png";
  if (previewSrc && !previewSrc.startsWith("http") && !previewSrc.startsWith("../") && !previewSrc.startsWith("data:")) {
    previewSrc = "../" + previewSrc;
  }

  row.innerHTML = `
    <img src="${previewSrc}" style="width: 38px; height: 38px; object-fit: contain; border-radius: 4px; background: #FFF; border: 1px solid #CBD5E1;" class="variant-preview-img" onerror="this.src='../assets/img/logo/logo.png'">
    <input type="text" class="form-control variant-name" placeholder="Nama Warna (misal: Hitam Glossy)" value="${escapeHtml(variant.nama || '')}" style="flex: 1; padding: 6px 10px;">
    <input type="file" class="variant-file" accept="image/*" style="font-size: 0.75rem; max-width: 190px;">
    <button type="button" class="btn-tbl-delete btn-del-variant" title="Hapus varian" style="padding: 6px 10px;"><i class="fa-solid fa-trash"></i></button>
  `;

  // File change preview & base64 capture with instant client-side compression
  const fileInput = row.querySelector(".variant-file");
  const imgPreview = row.querySelector(".variant-preview-img");
  setupCompressedPreview(fileInput, imgPreview, {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    maxSizeBytes: 50 * 1024
  }, (compressed) => {
    row.dataset.newBase64 = compressed.dataUrl;
  });

  // Delete row
  row.querySelector(".btn-del-variant").addEventListener("click", async () => {
    const allRows = container.querySelectorAll(".color-variant-row");
    if (allRows.length <= 1) {
      await adminAlert("Sepeda motor minimal harus memiliki 1 varian warna!", "Perhatian", "warning");
      return;
    }
    row.remove();
  });

  container.appendChild(row);
  return row;
}

function renderSimulationsUI() {
  const container = document.getElementById("simulations-container");
  if (!container) return;

  container.innerHTML = "";
  currentSimulations.forEach(s => {
    addSimulationRow(s);
  });
}

function addSimulationRow(sim = { dp: "", tenor: 35, cicilan: "" }) {
  const container = document.getElementById("simulations-container");
  if (!container) return null;

  const row = document.createElement("div");
  row.className = "sim-row";
  row.style.cssText = "display: grid; grid-template-columns: 1fr 1fr 1fr 40px; gap: 8px; margin-bottom: 6px; align-items: center;";

  const standardTenors = [11, 17, 23, 29, 35, 47];
  const currentTenor = parseInt(sim.tenor) || 35;
  if (!standardTenors.includes(currentTenor)) {
    standardTenors.push(currentTenor);
    standardTenors.sort((a, b) => a - b);
  }

  const tenorOptsHtml = standardTenors.map(t => 
    `<option value="${t}" ${t === currentTenor ? 'selected' : ''}>${t} Bulan</option>`
  ).join("");

  // Value formatting: if sim.dp is provided and > 0, show value, otherwise leave completely blank
  const dpValue = (sim.dp !== undefined && sim.dp !== null && sim.dp !== "" && sim.dp !== 0) ? sim.dp : "";
  const cicilanValue = (sim.cicilan !== undefined && sim.cicilan !== null && sim.cicilan !== "" && sim.cicilan !== 0) ? sim.cicilan : "";

  row.innerHTML = `
    <input type="number" class="form-control sim-dp" placeholder="DP (Rp)" value="${dpValue}" style="padding: 6px 10px;">
    <select class="form-control sim-tenor" style="padding: 6px 10px;">
      ${tenorOptsHtml}
    </select>
    <input type="number" class="form-control sim-cicilan" placeholder="Cicilan (Rp/bln)" value="${cicilanValue}" style="padding: 6px 10px;">
    <button type="button" class="btn-tbl-delete btn-del-sim" title="Hapus baris" style="padding: 6px 10px;"><i class="fa-solid fa-trash"></i></button>
  `;

  row.querySelector(".btn-del-sim").addEventListener("click", () => row.remove());
  container.appendChild(row);
  return row;
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const btnSave = document.getElementById("btn-save-prod");
  btnSave.disabled = true;
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan Motor...';

  try {
    const namaMotor = document.getElementById("prod-input-nama").value.trim();
    if (!namaMotor) {
      await adminAlert("Nama sepeda motor wajib diisi sebelum menyimpan!", "Data Tidak Lengkap", "warning");
      btnSave.disabled = false;
      btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Sepeda Motor';
      return;
    }

    const kategori = document.getElementById("prod-input-kategori").value;
    const hargaCashAsuransi = parseInt(document.getElementById("prod-input-cash").value) || 0;
    const deskripsiSingkat = document.getElementById("prod-input-desc").value.trim();

    // Collect Color Variants & Upload photos in parallel
    const colorRows = document.querySelectorAll(".color-variant-row");
    const variantPromises = Array.from(colorRows).map(async (r) => {
      const name = r.querySelector(".variant-name").value.trim() || "Standar";
      const fileInput = r.querySelector(".variant-file");
      let fotoUrl = r.dataset.originalFoto || "assets/img/logo/logo.png";

      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const filePath = `products/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        fotoUrl = await uploadWithFallback(file, filePath, {
          preCompressed: fileInput._compressed,
          maxWidth: 800,
          maxHeight: 600,
          quality: 0.8,
          maxSizeBytes: 50 * 1024
        });
      } else if (r.dataset.newBase64) {
        fotoUrl = r.dataset.newBase64;
      }

      return { nama: name, foto: fotoUrl };
    });

    const warnaList = await Promise.all(variantPromises);

    if (warnaList.length === 0) {
      warnaList.push({ nama: "Standar", foto: "assets/img/logo/logo.png" });
    }

    // Collect Simulations (only save valid rows)
    const simRows = document.querySelectorAll(".sim-row");
    const simulasiList = [];
    simRows.forEach(r => {
      const dp = parseInt(r.querySelector(".sim-dp").value) || 0;
      const tenor = parseInt(r.querySelector(".sim-tenor").value) || 0;
      const cicilan = parseInt(r.querySelector(".sim-cicilan").value) || 0;
      if (dp > 0 && tenor > 0) {
        simulasiList.push({ dp, tenor, cicilan });
      }
    });

    const payload = {
      namaMotor,
      kategori,
      hargaCashAsuransi,
      hargaOtr: hargaCashAsuransi,
      deskripsiSingkat: deskripsiSingkat || `Honda ${namaMotor} pilihan terbaik di kelasnya. Desain modern, irit bahan bakar, dan bergaransi resmi Astra Honda Motor.`,
      warna: warnaList,
      simulasiKredit: simulasiList,
      updatedAt: new Date().toISOString()
    };

    let docId = editingProductId;
    if (docId) {
      try {
        await setDoc(doc(db, "products", docId), payload, { merge: true });
      } catch (err) {
        console.warn("Firestore save failed, updating local state:", err);
      }
      const idx = productsList.findIndex(p => p.id === docId);
      if (idx !== -1) {
        productsList[idx] = { ...productsList[idx], ...payload, id: docId };
      }
    } else {
      docId = "motor-" + Date.now();
      try {
        const docRef = await addDoc(collection(db, "products"), payload);
        docId = docRef.id;
      } catch (err) {
        console.warn("Firestore addDoc failed, adding to local state:", err);
      }
      productsList.unshift({ id: docId, ...payload });
    }

    // Ensure category is in allCategories
    if (kategori && !allCategories.some(c => c.toLowerCase() === kategori.toLowerCase())) {
      allCategories.push(kategori);
      await saveCategories();
      syncCategoriesToDropdowns();
      renderCategoryManagerList();
    }

    document.getElementById("modal-product").classList.remove("active");
    await adminAlert(`Data sepeda motor "${namaMotor}" berhasil disimpan ke sistem!`, "Berhasil Disimpan", "success");

    // Update table with active filter maintained
    if (applyFiltersFn) {
      applyFiltersFn();
    } else {
      renderProductsTable(productsList);
    }

    const metricCount = document.getElementById("metric-products-count");
    if (metricCount) metricCount.textContent = productsList.length;

  } catch (err) {
    console.error("Gagal simpan motor:", err);
    await adminAlert("Gagal menyimpan data motor: " + err.message, "Gagal Menyimpan", "error");
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Sepeda Motor';
  }
}

async function handleDeleteProduct(id) {
  const motor = productsList.find(p => p.id === id);
  const motorName = motor ? motor.namaMotor : "motor ini";
  
  const confirmed = await adminConfirm(
    `Apakah Anda yakin ingin menghapus motor "${motorName}" beserta seluruh data simulasinya?`,
    "Hapus Sepeda Motor",
    "danger",
    "Ya, Hapus Motor"
  );
  if (!confirmed) return;
  
  try {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.warn("Firestore delete failed, deleting locally:", err);
    }
    productsList = productsList.filter(p => p.id !== id);

    if (applyFiltersFn) {
      applyFiltersFn();
    } else {
      renderProductsTable(productsList);
    }

    const metricCount = document.getElementById("metric-products-count");
    if (metricCount) metricCount.textContent = productsList.length;

    await adminAlert(`Motor "${motorName}" berhasil dihapus dari daftar!`, "Berhasil Dihapus", "success");
  } catch (err) {
    console.error("Gagal hapus motor:", err);
    await adminAlert("Gagal menghapus motor: " + err.message, "Gagal Menghapus", "error");
  }
}

// --------------------------------------------------------------------------
// 4. File Import Feature (JSON, Excel .xls/.xlsx via SheetJS, & 1-Click Seed)
// --------------------------------------------------------------------------
function setupImportModalEvents() {
  const btnOpenImport = document.getElementById("btn-open-import");
  const modalImport = document.getElementById("modal-import");
  const btnCloseImport = document.getElementById("modal-import-close");
  const btnStartImport = document.getElementById("btn-start-import");
  const btnOneClickSeed = document.getElementById("btn-one-click-seed");
  const fileInput = document.getElementById("import-file-input");

  if (btnOpenImport && modalImport) {
    btnOpenImport.addEventListener("click", () => {
      modalImport.classList.add("active");
      document.getElementById("import-progress-box").style.display = "none";
    });
  }

  if (btnCloseImport && modalImport) {
    btnCloseImport.addEventListener("click", () => modalImport.classList.remove("active"));
  }

  // 1-Click Seed All 45 Motors to Firestore
  if (btnOneClickSeed) {
    btnOneClickSeed.addEventListener("click", async () => {
      const confirmed = await adminConfirm(
        "Anda akan mengupload seluruh 45 model motor Honda beserta ribuan baris data simulasi kredit ke Firestore. Lanjutkan proses ini?",
        "Inisialisasi 45 Motor",
        "warning",
        "Ya, Upload Sekarang"
      );
      if (!confirmed) return;
      
      const progressBox = document.getElementById("import-progress-box");
      const progressText = document.getElementById("import-progress-text");
      const progressBar = document.getElementById("import-progress-bar");
      
      progressBox.style.display = "block";
      btnOneClickSeed.disabled = true;

      try {
        const res = await fetch("../data/seed-products.json");
        const seedData = await res.json();
        
        let count = 0;
        const total = seedData.length;

        for (const item of seedData) {
          const docId = item.id || `motor-${count + 1}`;
          try {
            await setDoc(doc(db, "products", docId), item, { merge: true });
          } catch (e) {
            console.warn("Firestore setDoc failed during seed:", e);
          }
          count++;
          const pct = Math.round((count / total) * 100);
          progressBar.style.width = `${pct}%`;
          progressText.textContent = `Mengupload ${count} dari ${total} motor (${item.namaMotor})...`;
        }

        await adminAlert(`Berhasil menginisialisasi ${total} data sepeda motor ke Firestore!`, "Inisialisasi Selesai", "success");
        modalImport.classList.remove("active");
        await loadProductsTable();

      } catch (err) {
        console.error("Gagal inisialisasi:", err);
        await adminAlert("Gagal menginisialisasi data: " + err.message, "Inisialisasi Gagal", "error");
      } finally {
        btnOneClickSeed.disabled = false;
        progressBox.style.display = "none";
      }
    });
  }

  // Custom File Import (JSON / Excel)
  if (btnStartImport && fileInput) {
    btnStartImport.addEventListener("click", async () => {
      const file = fileInput.files[0];
      if (!file) {
        await adminAlert("Pilih file JSON atau Excel (.xls / .xlsx) terlebih dahulu!", "Pilih File", "warning");
        return;
      }

      const fileName = file.name.toLowerCase();
      const progressBox = document.getElementById("import-progress-box");
      const progressText = document.getElementById("import-progress-text");
      const progressBar = document.getElementById("import-progress-bar");

      progressBox.style.display = "block";
      btnStartImport.disabled = true;

      try {
        let importedProducts = [];

        if (fileName.endsWith(".json")) {
          const text = await file.text();
          importedProducts = JSON.parse(text);
          if (!Array.isArray(importedProducts)) {
            throw new Error("File JSON harus berupa array daftar produk!");
          }
        } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
          if (!window.XLSX) {
            throw new Error("Pustaka SheetJS belum dimuat. Periksa koneksi internet Anda.");
          }

          const data = await file.arrayBuffer();
          const workbook = window.XLSX.read(data, { type: "array" });

          importedProducts = [];

          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const jsonRows = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (jsonRows.length < 5) continue;

            const rawName = jsonRows[0] && jsonRows[0][2] ? String(jsonRows[0][2]).trim() : sheetName;
            const cleanName = rawName || sheetName;
            const price = jsonRows[1] && jsonRows[1][2] ? parseInt(jsonRows[1][2]) : 0;

            // Tenor cols from row 4 (0-indexed)
            const tenorCols = {};
            const tenorRow = jsonRows[4] || [];
            for (let c = 1; c < 10; c++) {
              if (tenorRow[c] && !isNaN(tenorRow[c])) {
                tenorCols[c] = parseInt(tenorRow[c]);
              }
            }

            // Simulasi from row 5
            const simList = [];
            for (let r = 5; r < jsonRows.length; r++) {
              const rData = jsonRows[r];
              if (!rData || !rData[0] || isNaN(rData[0]) || rData[0] < 100000) break;
              const dp = parseInt(rData[0]);

              for (const [colIdx, tenor] of Object.entries(tenorCols)) {
                const cicilan = parseInt(rData[colIdx]);
                if (cicilan && !isNaN(cicilan)) {
                  simList.push({ dp, tenor, cicilan });
                }
              }
            }

            // Categorize
            const cat = getProductCategory({ namaMotor: sheetName, sheet: sheetName });

            importedProducts.push({
              namaMotor: sheetName.trim(),
              kategori: cat,
              hargaCashAsuransi: price,
              hargaOtr: price,
              deskripsiSingkat: `Honda ${cleanName} pilihan terbaik di kelasnya. Desain modern, irit bahan bakar, dan bergaransi resmi Astra Honda Motor.`,
              warna: [{ nama: "Standar", foto: "assets/img/logo/logo.png" }],
              simulasiKredit: simList
            });
          }
        } else {
          throw new Error("Format file tidak didukung! Harap upload .json atau .xls / .xlsx");
        }

        // Upload to Firestore
        let count = 0;
        const total = importedProducts.length;

        for (const item of importedProducts) {
          const docId = `import-${Date.now()}-${count + 1}`;
          try {
            await setDoc(doc(db, "products", docId), item, { merge: true });
          } catch (e) {
            console.warn("Firestore setDoc failed during import:", e);
          }
          count++;
          const pct = Math.round((count / total) * 100);
          progressBar.style.width = `${pct}%`;
          progressText.textContent = `Mengimport ${count} dari ${total} motor...`;
        }

        await adminAlert(`Sukses mengimport ${total} data sepeda motor ke Firestore!`, "Import Berhasil", "success");
        modalImport.classList.remove("active");
        await loadProductsTable();

      } catch (err) {
        console.error("Gagal import:", err);
        await adminAlert("Gagal mengimport file: " + err.message, "Import Gagal", "error");
      } finally {
        btnStartImport.disabled = false;
        progressBox.style.display = "none";
      }
    });
  }
}

// --------------------------------------------------------------------------
// 5. Helpers
// --------------------------------------------------------------------------
function getProductCategory(p) {
  const rawCat = (p?.kategori || p?.category || "").trim();
  
  // Exact or case-insensitive match against allCategories
  const match = allCategories.find(s => s.toLowerCase() === rawCat.toLowerCase());
  if (match) return match;

  // If rawCat already ends with "Series", preserve it
  if (rawCat.toLowerCase().endsWith("series")) return rawCat;

  const up = ((p?.folder || "") + " " + (p?.namaMotor || "") + " " + (p?.sheet || "") + " " + rawCat).toUpperCase();
  
  // Try matching active categories prefix
  for (const cat of allCategories) {
    const key = cat.replace(/\s*series/i, "").trim().toUpperCase();
    if (key && up.includes(key)) {
      return cat;
    }
  }

  if (up.includes("ADV")) return "ADV Series";
  if (up.includes("BEAT")) return "Beat Series";
  if (up.includes("PCX")) return "PCX Series";
  if (up.includes("VARIO")) return "Vario Series";
  if (up.includes("SCOOPY")) return "Scoopy Series";
  if (up.includes("STYLO")) return "Stylo Series";
  if (up.includes("GENIO")) return "Genio Series";
  if (up.includes("SUPRA") || up.includes("SUPTA")) return "Supra Series";
  if (up.includes("REVO")) return "Revo Series";
  if (up.includes("CBR")) return "CBR Series";
  if (up.includes("CB150R") || up.includes("CB150X") || up.includes("CB 150R") || up.includes("CB 150X") || (up.includes("CB150") && !up.includes("VERZA"))) return "CB150 Series";
  if (up.includes("CRF")) return "CRF/Off-Road Series";
  if (up.includes("VERZA")) return "CB Verza Series";
  if (up.includes("FORZA")) return "Forza Series";

  return rawCat || (allCategories[0] || "Beat Series");
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
