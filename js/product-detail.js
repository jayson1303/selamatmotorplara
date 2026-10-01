// ==========================================================================
// SELAMATMOTORPLARA
// product-detail.js - Logic Modal Detail Produk + Simulasi Kredit + WhatsApp
// ==========================================================================

let currentProduct = null;
let currentColor = null;
let currentWaTemplate = "Halo SELAMATMOTORPLARA, saya tertarik dengan:\nMotor: {namaMotor}\nWarna: {warna}\nSimulasi Kredit: DP {dp} - Tenor {tenor} bulan - Cicilan {cicilan}/bulan\nMohon info lebih lanjut. Terima kasih.";
let currentContact = {
  whatsappNumber: "",
  whatsappLink: "https://wa.me/6285715787494"
};

// Format Rupiah Helper
export function formatRupiah(num) {
  if (num === null || num === undefined || isNaN(num) || num === 0) return "Hubungi Sales";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(num);
}

// Show Toast Notification
export function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-message");
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.className = `toast-notification show ${type === "error" ? "error" : ""}`;

  setTimeout(() => {
    toast.className = "toast-notification";
  }, 4000);
}

// Open Product Modal
export function openProductModal(product, waTemplate = null, contact = null) {
  currentProduct = product;
  if (waTemplate) currentWaTemplate = waTemplate;
  if (contact) currentContact = contact;

  const modal = document.getElementById("product-modal");
  const modalImg = document.getElementById("modal-main-img");
  const modalTitle = document.getElementById("modal-product-title");
  const modalCat = document.getElementById("modal-category-badge");
  const modalDesc = document.getElementById("modal-desc-box");
  const modalCash = document.getElementById("modal-cash-price");
  const modalInsurance = document.getElementById("modal-insurance-price");
  const modalTotalCash = document.getElementById("modal-total-cash-price");
  const modalInsuranceBox = document.getElementById("modal-insurance-box");
  const modalColorList = document.getElementById("modal-color-list");
  const modalColorSelected = document.getElementById("modal-selected-color");

  if (!modal) return;

  // Set Basic Info
  modalTitle.textContent = product.namaMotor || "Sepeda Motor Honda";
  modalCat.textContent = product.kategori || "Honda Series";
  modalDesc.textContent = product.deskripsiSingkat || "Motor Honda resmi dengan performa terbaik dan hemat bahan bakar.";
  
  // Set Cash & Asuransi Info
  const otrPrice = product.hargaOtr || product.hargaCashAsuransi;
  const asuransiPrice = product.hargaAsuransi || 0;
  const totalCashAsuransi = product.hargaTotalCashAsuransi || (otrPrice + asuransiPrice);

  modalCash.textContent = formatRupiah(otrPrice);
  if (modalInsurance) {
    modalInsurance.textContent = formatRupiah(asuransiPrice);
  }
  if (modalTotalCash) {
    modalTotalCash.textContent = formatRupiah(totalCashAsuransi);
  }
  if (modalInsuranceBox) {
    modalInsuranceBox.style.display = asuransiPrice > 0 ? "flex" : "none";
  }

  // Setup Colors & Gallery
  modalColorList.innerHTML = "";
  const warnaList = (product.warna && product.warna.length > 0) 
    ? product.warna 
    : [{ nama: "Standar", foto: "assets/img/logo/logo.png" }];

  currentColor = warnaList[0];
  modalColorSelected.textContent = currentColor.nama;
  modalImg.src = currentColor.foto;
  modalImg.alt = `${product.namaMotor} - ${currentColor.nama}`;

  warnaList.forEach((w, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `color-chip ${index === 0 ? "active" : ""}`;
    chip.innerHTML = `
      <img src="${w.foto}" alt="${w.nama}" class="color-chip-thumb" onerror="this.src='assets/img/logo/logo.png'">
      <span>${w.nama}</span>
    `;

    chip.addEventListener("click", () => {
      document.querySelectorAll(".color-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentColor = w;
      modalColorSelected.textContent = w.nama;
      
      // Animate image switch
      modalImg.style.opacity = "0";
      modalImg.style.transform = "scale(0.96)";
      setTimeout(() => {
        modalImg.src = w.foto;
        modalImg.alt = `${product.namaMotor} - ${w.nama}`;
        modalImg.style.opacity = "1";
        modalImg.style.transform = "scale(1)";
      }, 150);
    });

    modalColorList.appendChild(chip);
  });

  // Setup Credit Simulation
  setupSimulation(product);

  // Show Modal
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// Setup Credit Simulation Dropdowns
function setupSimulation(product) {
  const dpSelect = document.getElementById("sim-dp-select");
  const tenorSelect = document.getElementById("sim-tenor-select");
  const cicilanVal = document.getElementById("sim-cicilan-value");

  if (!dpSelect || !tenorSelect || !cicilanVal) return;

  const simList = product.simulasiKredit || [];

  if (simList.length === 0) {
    dpSelect.innerHTML = '<option value="">Tidak ada data DP</option>';
    tenorSelect.innerHTML = '<option value="">Hubungi Sales</option>';
    cicilanVal.textContent = "Hubungi Sales";
    dpSelect.disabled = true;
    tenorSelect.disabled = true;
    return;
  }

  dpSelect.disabled = false;
  tenorSelect.disabled = false;

  // Extract unique DPs
  const uniqueDps = [...new Set(simList.map(item => item.dp))].sort((a, b) => a - b);

  dpSelect.innerHTML = "";
  uniqueDps.forEach(dp => {
    const opt = document.createElement("option");
    opt.value = dp;
    opt.textContent = formatRupiah(dp);
    dpSelect.appendChild(opt);
  });

  // Update Tenors for selected DP
  const updateTenors = () => {
    const selectedDp = parseInt(dpSelect.value);
    const availableItems = simList.filter(item => item.dp === selectedDp);
    
    // Sort tenors ascending
    availableItems.sort((a, b) => a.tenor - b.tenor);

    tenorSelect.innerHTML = "";
    availableItems.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.tenor;
      opt.textContent = `${item.tenor} Bulan`;
      tenorSelect.appendChild(opt);
    });

    // Auto calculate
    calculateCicilan();
  };

  const calculateCicilan = () => {
    const selectedDp = parseInt(dpSelect.value);
    const selectedTenor = parseInt(tenorSelect.value);

    const match = simList.find(item => item.dp === selectedDp && item.tenor === selectedTenor);
    if (match && match.cicilan) {
      cicilanVal.textContent = `${formatRupiah(match.cicilan)} / bln`;
    } else {
      cicilanVal.textContent = "Pilih DP & Tenor";
    }
  };

  dpSelect.onchange = updateTenors;
  tenorSelect.onchange = calculateCicilan;

  // Trigger initial populate
  updateTenors();
}

// Handle Order via WhatsApp
export function handleOrderWhatsApp() {
  if (!currentProduct) return;

  const dpSelect = document.getElementById("sim-dp-select");
  const tenorSelect = document.getElementById("sim-tenor-select");
  const cicilanVal = document.getElementById("sim-cicilan-value");

  const selectedColor = currentColor ? currentColor.nama : "Standar";
  const selectedDp = dpSelect && dpSelect.value ? formatRupiah(parseInt(dpSelect.value)) : "-";
  const selectedTenor = tenorSelect && tenorSelect.value ? tenorSelect.value : "-";
  const otrPrice = currentProduct.hargaOtr || currentProduct.hargaCashAsuransi;
  const asuransiPrice = currentProduct.hargaAsuransi || 0;
  const totalCashAsuransi = currentProduct.hargaTotalCashAsuransi || (otrPrice + asuransiPrice);
  const hargaCashText = formatRupiah(otrPrice);
  const asuransiText = formatRupiah(asuransiPrice);
  const totalCashText = formatRupiah(totalCashAsuransi);

  const cicilanText = (cicilanVal && cicilanVal.textContent && !cicilanVal.textContent.includes("Pilih") && cicilanVal.textContent !== "-")
    ? cicilanVal.textContent.trim() 
    : "-";

  // Generate Message from Template
  let message = currentWaTemplate;
  message = message.replace(/{namaMotor}/g, currentProduct.namaMotor || "");
  message = message.replace(/{warna}/g, selectedColor);
  message = message.replace(/{dp}/g, selectedDp);
  message = message.replace(/{tenor}/g, selectedTenor);
  message = message.replace(/{cicilan}/g, cicilanText);
  message = message.replace(/{hargaCash}/g, hargaCashText);
  message = message.replace(/{asuransi}/g, asuransiText);
  message = message.replace(/{totalCashAsuransi}/g, totalCashText);

  // Decide WhatsApp URL
  let waNumber = (currentContact?.whatsappNumber || "").trim().replace(/[^0-9]/g, "");
  if (waNumber.startsWith("0")) {
    waNumber = "62" + waNumber.substring(1);
  }

  let waUrl = "";
  if (waNumber && waNumber.length >= 9) {
    waUrl = `https://wa.me/6285715787494?text=${encodeURIComponent(message)}`;
  } else {
    const baseLink = "https://wa.me/6285715787494";
    const separator = baseLink.includes("?") ? "&" : "?";
    waUrl = `${baseLink}${separator}text=${encodeURIComponent(message)}`;
  }

  // Copy template to clipboard as convenience
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(message).catch(() => {});
  }
  showToast("Membuka WhatsApp & menyiapkan pesan pesanan...");

  // Open WhatsApp in new tab / app reliably via anchor click
  const tempLink = document.createElement("a");
  tempLink.href = waUrl;
  tempLink.target = "_blank";
  tempLink.rel = "noopener noreferrer";
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
}

// Close Modal Handler
export function closeModal() {
  const modal = document.getElementById("product-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// Initialize Modal Event Listeners
export function initModalListeners() {
  const modal = document.getElementById("product-modal");
  const closeBtn = document.getElementById("modal-close-btn");
  const btnWa = document.getElementById("btn-modal-wa");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  if (btnWa) {
    btnWa.addEventListener("click", handleOrderWhatsApp);
  }

  // Click outside to close
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Escape key to close
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });
}
