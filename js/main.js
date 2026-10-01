// ==========================================================================
// SELAMATMOTORPLARA
// main.js - Rendering Landing Page dari Firestore dengan Fallback Cerdas
// ==========================================================================

import { 
  db, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  onSnapshot 
} from "./firebase-config.js";

import { 
  openProductModal, 
  initModalListeners, 
  formatRupiah,
  showToast 
} from "./product-detail.js";

// Global App State
let allProducts = [];
let allTestimonials = [];
let appSettings = null;
let currentCategory = "all";
let searchKeyword = "";
let promoCarouselTimer = null;

// DOM Elements
const productsGrid = document.getElementById("products-grid");
const searchInput = document.getElementById("search-input");
const categoryTabs = document.getElementById("category-tabs");
const mobileToggle = document.getElementById("mobile-toggle");
const mobileDrawer = document.getElementById("mobile-menu-drawer");

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  initModalListeners();
  initMobileMenu();
  initCategoryFilters();
  initSearch();
  initScrollSpy();

  // Load All Data
  await Promise.all([
    loadSettings(),
    loadProducts(),
    loadTestimonials()
  ]);
});

// ==========================================================================
// 1. Settings, Hero, About & Contact Loader
// ==========================================================================
async function loadSettings() {
  try {
    // Try fetching from Firestore
    const contactSnap = await getDoc(doc(db, "settings", "contact"));
    const waTemplateSnap = await getDoc(doc(db, "settings", "waTemplate"));
    const heroSnap = await getDoc(doc(db, "hero", "main"));
    const aboutSnap = await getDoc(doc(db, "about", "main"));

    let settings = {};

    if (contactSnap.exists() || heroSnap.exists() || aboutSnap.exists()) {
      settings.contact = contactSnap.exists() ? contactSnap.data() : null;
      settings.waTemplate = waTemplateSnap.exists() ? waTemplateSnap.data() : null;
      settings.hero = heroSnap.exists() ? heroSnap.data() : null;
      settings.about = aboutSnap.exists() ? aboutSnap.data() : null;
    } else {
      // Fallback to local default-settings.json
      const res = await fetch("data/default-settings.json");
      settings = await res.json();
    }

    appSettings = settings;
    renderHero(settings.hero);
    renderAbout(settings.about);
    renderContact(settings.contact);

    // Setup Realtime listeners for quick live updates if online
    setupRealtimeSettings();

  } catch (err) {
    console.warn("Firestore settings load failed, using fallback:", err);
    try {
      const res = await fetch("data/default-settings.json");
      appSettings = await res.json();
      renderHero(appSettings.hero);
      renderAbout(appSettings.about);
      renderContact(appSettings.contact);
    } catch (e) {
      console.error("Critical: Could not load default settings", e);
    }
  }
}

function setupRealtimeSettings() {
  try {
    onSnapshot(doc(db, "hero", "main"), (snap) => {
      if (snap.exists()) {
        appSettings.hero = snap.data();
        renderHero(appSettings.hero);
      }
    });

    onSnapshot(doc(db, "about", "main"), (snap) => {
      if (snap.exists()) {
        appSettings.about = snap.data();
        renderAbout(appSettings.about);
      }
    });

    onSnapshot(doc(db, "settings", "contact"), (snap) => {
      if (snap.exists()) {
        appSettings.contact = snap.data();
        renderContact(appSettings.contact);
      }
    });

    onSnapshot(doc(db, "settings", "waTemplate"), (snap) => {
      if (snap.exists()) {
        appSettings.waTemplate = snap.data();
      }
    });
  } catch (e) {
    console.log("Realtime listener disabled:", e.message);
  }
}

function renderHero(hero) {
  if (!hero) return;

  const heroSection = document.getElementById("beranda");
  const heroTitle = document.getElementById("hero-title");
  const heroSubtitle = document.getElementById("hero-subtitle");
  const heroTagline = document.getElementById("hero-tagline");
  const heroCtaBtn = document.getElementById("hero-cta-btn");
  const heroPromoWrapper = document.getElementById("hero-promo-wrapper");
  const heroPromoImg = document.getElementById("hero-promo-img");

  if (hero.backgroundUrl) {
    heroSection.style.backgroundImage = `url('${hero.backgroundUrl}')`;
  }

  if (hero.title && heroTitle) {
    heroTitle.childNodes[0].textContent = hero.title + " ";
  }
  if (hero.subtitle && heroSubtitle) {
    heroSubtitle.textContent = hero.subtitle;
  }
  if (hero.tagline && heroTagline) {
    heroTagline.textContent = hero.tagline;
  }
  if (hero.ctaText && heroCtaBtn) {
    heroCtaBtn.innerHTML = `<i class="fa-solid fa-motorcycle"></i> ${hero.ctaText}`;
  }

  // Promo carousel supports up to three images saved from the admin dashboard.
  if (heroPromoWrapper && heroPromoImg) {
    const promoImages = (Array.isArray(hero.promoImages) ? hero.promoImages : [hero.promoImageUrl])
      .filter((url) => typeof url === "string" && url.trim() !== "")
      .slice(0, 3);
    if (hero.promoActive !== false && promoImages.length) {
      heroPromoWrapper.style.display = "flex";
      initPromoCarousel(promoImages, heroPromoImg);
    } else {
      heroPromoWrapper.style.display = "none";
      if (promoCarouselTimer) window.clearInterval(promoCarouselTimer);
      promoCarouselTimer = null;
    }
  }
}

function initPromoCarousel(images, image) {
  if (promoCarouselTimer) window.clearInterval(promoCarouselTimer);

  const dots = document.getElementById("promo-carousel-dots");
  const prev = document.getElementById("promo-carousel-prev");
  const next = document.getElementById("promo-carousel-next");
  let activeIndex = 0;

  const renderDots = () => {
    if (!dots) return;
    dots.innerHTML = images.map((_, i) => `
      <button type="button" class="promo-carousel-dot ${i === activeIndex ? "is-active" : ""}"
        aria-label="Tampilkan foto promo ${i + 1}" aria-pressed="${i === activeIndex}"></button>
    `).join("");
    dots.querySelectorAll(".promo-carousel-dot").forEach((dot, i) => {
      dot.addEventListener("click", () => showSlide(i));
    });
    dots.style.display = images.length > 1 ? "flex" : "none";
  };

  const showSlide = (index) => {
    activeIndex = (index + images.length) % images.length;
    image.classList.remove("is-active");
    window.setTimeout(() => {
      image.src = images[activeIndex];
      image.alt = `Foto promo ${activeIndex + 1} SELAMATMOTORPLARA`;
      requestAnimationFrame(() => image.classList.add("is-active"));
    }, 160);
    renderDots();
  };

  image.src = images[0];
  image.alt = "Foto promo 1 SELAMATMOTORPLARA";
  image.classList.add("is-active");
  if (prev) {
    prev.hidden = images.length < 2;
    prev.onclick = () => showSlide(activeIndex - 1);
  }
  if (next) {
    next.hidden = images.length < 2;
    next.onclick = () => showSlide(activeIndex + 1);
  }
  renderDots();

  if (images.length > 1) {
    promoCarouselTimer = window.setInterval(() => showSlide(activeIndex + 1), 4500);
  }
}

function renderAbout(about) {
  if (!about) return;

  const aboutImg = document.getElementById("about-img");
  const aboutTitle = document.getElementById("about-title");
  const aboutDesc = document.getElementById("about-desc");

  if (about.foto && aboutImg) aboutImg.src = about.foto;
  if (about.title && aboutTitle) {
    aboutTitle.innerHTML = about.title.replace("SELAMATMOTORPLARA", "<span>SELAMATMOTORPLARA</span>");
  }
  if (about.deskripsi && aboutDesc) {
    aboutDesc.textContent = about.deskripsi;
  }
}

function renderContact(contact) {
  if (!contact) return;

  const addrEl = document.getElementById("contact-address");
  const hoursEl = document.getElementById("contact-hours");
  const mapsIframe = document.getElementById("contact-maps-iframe");

  if (contact.alamat && addrEl) addrEl.textContent = contact.alamat;
  if (contact.jamOperasional && hoursEl) hoursEl.innerHTML = contact.jamOperasional.replace(/ \| /g, "<br>");
  if (contact.googleMapsEmbed && mapsIframe) mapsIframe.src = contact.googleMapsEmbed;

  // WhatsApp Links
  const waHref = "https://wa.me/6285715787494";

  const floatingWa = document.getElementById("floating-wa-btn");
  const navWa = document.getElementById("nav-wa-cta");
  const mobileWa = document.getElementById("mobile-wa-cta");
  const heroWa = document.getElementById("hero-wa-btn");
  const socialWa = document.getElementById("social-wa");

  if (floatingWa) floatingWa.href = waHref;
  if (navWa) navWa.href = waHref;
  if (mobileWa) mobileWa.href = waHref;
  if (heroWa) heroWa.href = waHref;
  if (socialWa) socialWa.href = waHref;

  // Social Links
  const igEl = document.getElementById("social-ig");
  const tiktokEl = document.getElementById("social-tiktok");
  const fbEl = document.getElementById("social-fb");

  if (igEl) igEl.href = "https://www.instagram.com/el_premmm?stkn=MW5paHpodGdqMDI5MQ==";
  if (tiktokEl) tiktokEl.href = "https://www.tiktok.com/@andraselamatmotorplara?_r=1&_t=ZS-9A67WanIVXD";
  if (fbEl) fbEl.href = "https://www.facebook.com/share/14tu7EkBkFd/";
}

// ==========================================================================
// 2. Products Loader & Renderer
// ==========================================================================
async function loadProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const firestoreProducts = [];

    querySnapshot.forEach(doc => {
      firestoreProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (firestoreProducts.length > 0) {
      allProducts = firestoreProducts;
    } else {
      // Fallback to local JSON seed data
      const res = await fetch("data/seed-products.json");
      allProducts = await res.json();
    }
  } catch (err) {
    console.warn("Firestore products load failed, loading fallback data:", err);
    try {
      const res = await fetch("data/seed-products.json");
      allProducts = await res.json();
    } catch (e) {
      console.error("Critical: Cannot load products fallback", e);
    }
  }

  // Ensure robust category normalization
  allProducts.forEach(p => {
    p.kategori = getProductCategory(p);
  });

  updateCategoryCounts();
  renderProducts();
}

function getProductCategory(p) {
  const VALID_SERIES = [
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

  const rawCat = (p.kategori || p.category || "").trim();
  const match = VALID_SERIES.find(s => s.toLowerCase() === rawCat.toLowerCase());
  if (match) return match;
  if (rawCat.toLowerCase().endsWith("series")) return rawCat;

  const up = ((p.folder || "") + " " + (p.namaMotor || "") + " " + (p.sheet || "") + " " + rawCat).toUpperCase();
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

  return rawCat || "Beat Series";
}

function updateCategoryCounts() {
  const countAll = allProducts.length;
  const elAll = document.getElementById("count-all");
  if (elAll) elAll.textContent = countAll;

  // Calculate product counts per category
  const counts = {};
  allProducts.forEach(p => {
    const cat = (p.kategori || "").toLowerCase();
    counts[cat] = (counts[cat] || 0) + 1;
  });

  // Dynamic category tabs for custom categories added in admin
  if (categoryTabs) {
    const existingCats = new Set([...categoryTabs.querySelectorAll(".tab-btn")].map(b => (b.dataset.category || "").toLowerCase()));
    allProducts.forEach(p => {
      const origCat = p.kategori ? p.kategori.trim() : "";
      if (origCat && !existingCats.has(origCat.toLowerCase())) {
        existingCats.add(origCat.toLowerCase());
        const newBtn = document.createElement("button");
        newBtn.className = "tab-btn";
        newBtn.dataset.category = origCat;
        newBtn.innerHTML = `${origCat} <span class="tab-count">${counts[origCat.toLowerCase()] || 0}</span>`;
        newBtn.addEventListener("click", () => {
          categoryTabs.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
          newBtn.classList.add("active");
          currentCategory = origCat;
          renderProducts();
        });
        categoryTabs.appendChild(newBtn);
      }
    });
  }

  // Update count in tab buttons
  const buttons = categoryTabs?.querySelectorAll(".tab-btn");
  buttons?.forEach(btn => {
    const cat = btn.dataset.category;
    if (!cat || cat === "all") return;
    const badge = btn.querySelector(".tab-count");
    if (badge) {
      badge.textContent = counts[cat.toLowerCase()] || 0;
    }
  });
}

function renderProducts() {
  if (!productsGrid) return;

  // Filter by category
  let filtered = allProducts;
  if (currentCategory !== "all") {
    filtered = filtered.filter(p => (p.kategori || "").toLowerCase() === currentCategory.toLowerCase());
  }

  // Filter by search keyword
  if (searchKeyword.trim() !== "") {
    const kw = searchKeyword.toLowerCase();
    filtered = filtered.filter(p => 
      (p.namaMotor || "").toLowerCase().includes(kw) ||
      (p.kategori || "").toLowerCase().includes(kw) ||
      (p.deskripsiSingkat || "").toLowerCase().includes(kw)
    );
  }

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-motorcycle"></i>
        <h3>Motor Tidak Ditemukan</h3>
        <p>Silakan coba kata kunci pencarian lain atau pilih kategori lain.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = "";

  filtered.forEach(product => {
    // Determine main photo
    const mainPhoto = (product.warna && product.warna.length > 0 && product.warna[0].foto) 
      ? product.warna[0].foto 
      : "assets/img/logo/logo.png";

    // Find minimum cicilan for badge
    let minCicilanBadge = "";
    if (product.simulasiKredit && product.simulasiKredit.length > 0) {
      const cicilans = product.simulasiKredit.map(s => s.cicilan).filter(c => c > 0);
      if (cicilans.length > 0) {
        const minCicilan = Math.min(...cicilans);
        minCicilanBadge = `
          <div class="product-cicilan-badge">
            <i class="fa-solid fa-tags"></i> Cicilan mulai ${formatRupiah(minCicilan)}/bln
          </div>
        `;
      }
    }

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <span class="product-badge-cat">${product.kategori || "Honda"}</span>
      <div class="product-img-box">
        <img src="${mainPhoto}" alt="${product.namaMotor}" class="product-img" loading="lazy" onerror="this.src='assets/img/logo/logo.png'">
      </div>
      <div class="product-body">
        <h3 class="product-name">${product.namaMotor}</h3>
        <div class="product-price-label">Harga Cash / OTR</div>
        <div class="product-price">${formatRupiah(product.hargaCashAsuransi)}</div>
        ${minCicilanBadge}
        <button type="button" class="btn-detail">
          <i class="fa-solid fa-calculator"></i> Lihat Detail & Simulasi
        </button>
      </div>
    `;

    // Click handler to open detail modal
    card.querySelector(".btn-detail").addEventListener("click", () => {
      const template = appSettings?.waTemplate?.template;
      const contact = appSettings?.contact;
      openProductModal(product, template, contact);
    });

    productsGrid.appendChild(card);
  });
}

// ==========================================================================
// 3. Testimonials Loader & Renderer
// ==========================================================================
async function loadTestimonials() {
  const container = document.getElementById("testimonials-slider");
  if (!container) return;

  try {
    const snap = await getDocs(collection(db, "testimonials"));
    const firestoreTesti = [];
    snap.forEach(doc => {
      firestoreTesti.push({ id: doc.id, ...doc.data() });
    });

    if (firestoreTesti.length > 0) {
      allTestimonials = firestoreTesti;
    } else {
      const res = await fetch("data/seed-testimonials.json");
      allTestimonials = await res.json();
    }
  } catch (e) {
    console.warn("Firestore testimonials load failed, using fallback:", e);
    try {
      const res = await fetch("data/seed-testimonials.json");
      allTestimonials = await res.json();
    } catch (err) {
      console.error("Critical: Cannot load testimonials", err);
    }
  }

  container.innerHTML = "";
  allTestimonials.forEach(item => {
    const stars = Array(item.rating || 5).fill('<i class="fa-solid fa-star"></i>').join("");

    const card = document.createElement("div");
    card.className = "testi-card";
    const photoMarkup = item.foto ? `
      <div class="testi-img-box">
        <img src="${item.foto}" alt="Foto testimoni ${item.nama}" class="testi-img" loading="lazy">
        <span class="testi-badge"><i class="fa-solid fa-circle-check"></i> Konsumen Terverifikasi</span>
      </div>
    ` : "";
    card.innerHTML = `
      ${photoMarkup}
      <div class="testi-body">
        <div class="testi-top-meta">
          <div>
            <h4 class="testi-author-name">${item.nama}</h4>
            <span class="testi-author-city"><i class="fa-solid fa-location-dot"></i> Palabuhanratu</span>
          </div>
          <div class="testi-stars">${stars}</div>
        </div>
        <div class="testi-comment-box">
          <i class="fa-solid fa-quote-left testi-quote-icon"></i>
          <p class="testi-comment">${item.komentar}</p>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ==========================================================================
// 4. UI Interaction & Listeners
// ==========================================================================
function initCategoryFilters() {
  if (!categoryTabs) return;

  const buttons = categoryTabs.querySelectorAll(".tab-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.category || "all";
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      renderProducts();
    });
  });

  // Enable mouse-wheel horizontal scrolling over category tabs on desktop
  categoryTabs.addEventListener("wheel", (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      categoryTabs.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}

// Expose filterByCategory to global window for footer links
window.filterByCategory = function(cat) {
  currentCategory = cat;
  const buttons = categoryTabs?.querySelectorAll(".tab-btn");
  let targetBtn = null;
  buttons?.forEach(b => {
    if (b.dataset.category.toLowerCase() === cat.toLowerCase()) {
      b.classList.add("active");
      targetBtn = b;
    } else {
      b.classList.remove("active");
    }
  });
  if (targetBtn) {
    targetBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
  renderProducts();
};

function initSearch() {
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    searchKeyword = e.target.value;
    renderProducts();
  });
}

function initMobileMenu() {
  if (!mobileToggle || !mobileDrawer) return;

  mobileToggle.addEventListener("click", () => {
    mobileToggle.classList.toggle("active");
    mobileDrawer.classList.toggle("show");
  });

  // Close when clicking nav link
  mobileDrawer.querySelectorAll(".mobile-nav-link").forEach(link => {
    link.addEventListener("click", () => {
      mobileToggle.classList.remove("active");
      mobileDrawer.classList.remove("show");
    });
  });
}

function initScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute("id");

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        current = sectionId;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}
