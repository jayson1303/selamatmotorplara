// ==========================================================================
// ANDRASELAMATMOTOR
// admin-auth.js - Otentikasi Admin Firebase
// ==========================================================================

import { 
  auth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "../../js/firebase-config.js";
import { firebaseConfigured, firebaseConfigMissingKeys } from "../../js/firebase-config.js";

import { adminConfirm } from "./admin-dialogs.js";

// Check current page
const isLoginPage = window.location.pathname.endsWith("login.html") || 
                    window.location.pathname.endsWith("login") || 
                    window.location.pathname.includes("login.html");

// Pre-fill remembered email on login page
const emailInput = document.getElementById("admin-email");
if (emailInput && isLoginPage) {
  const savedEmail = localStorage.getItem("admin_last_email");
  if (savedEmail) {
    emailInput.value = savedEmail;
  }
}

// Password show/hide toggle
const togglePwdBtn = document.getElementById("btn-toggle-pwd");
const pwdInput = document.getElementById("admin-password");
const togglePwdIcon = document.getElementById("toggle-pwd-icon");
if (togglePwdBtn && pwdInput) {
  togglePwdBtn.addEventListener("click", () => {
    if (pwdInput.type === "password") {
      pwdInput.type = "text";
      if (togglePwdIcon) togglePwdIcon.className = "fa-regular fa-eye-slash";
    } else {
      pwdInput.type = "password";
      if (togglePwdIcon) togglePwdIcon.className = "fa-regular fa-eye";
    }
  });
}

// Firebase Web credentials must be supplied before the admin portal can run.
if (!firebaseConfigured) {
  const alertBox = document.getElementById("login-alert");
  const alertText = document.getElementById("login-alert-text");
  if (!isLoginPage) {
    window.location.replace("login.html");
  } else if (alertBox && alertText) {
    alertText.textContent = `Firebase Web app selamatmotorplara-cb4d4 belum lengkap. Isi nilai ${firebaseConfigMissingKeys.join(", ")} di js/firebase-config.js dari Firebase Console.`;
    alertBox.style.display = "flex";
  }
}

// Auth State Observer
if (auth) onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    if (isLoginPage) {
      window.location.href = "index.html";
    } else {
      const emailDisplay = document.getElementById("admin-user-email");
      if (emailDisplay) emailDisplay.textContent = user.email || "Admin";
    }
  } else {
    // User is signed out
    if (!isLoginPage) {
      window.location.href = "login.html";
    }
  }
});

// Handle Login Form on login.html
const loginForm = document.getElementById("admin-login-form");
if (loginForm && auth) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value;
    const rememberMe = document.getElementById("admin-remember")?.checked;
    const alertBox = document.getElementById("login-alert");
    const alertText = document.getElementById("login-alert-text");
    const btnLogin = document.getElementById("btn-login");
    const btnText = document.getElementById("btn-login-text");
    const btnSpinner = document.getElementById("btn-login-spinner");

    alertBox.style.display = "none";
    btnLogin.disabled = true;
    btnText.style.display = "none";
    btnSpinner.style.display = "inline-block";

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (rememberMe) {
        localStorage.setItem("admin_last_email", email);
      } else {
        localStorage.removeItem("admin_last_email");
      }

      // Success redirect
      window.location.href = "index.html";
    } catch (err) {
      console.error("Login failed:", err);
      btnLogin.disabled = false;
      btnText.style.display = "inline-block";
      btnSpinner.style.display = "none";

      const authErrorMessages = {
        "auth/invalid-credential": "Email atau password tidak cocok. Firebase menyamarkan kedua kasus ini sebagai kredensial tidak valid jika perlindungan pencarian email aktif.",
        "auth/user-not-found": "Email ini belum terdaftar sebagai pengguna Firebase Authentication pada project ANDRASELAMATMOTOR.",
        "auth/wrong-password": "Password salah untuk akun Firebase Authentication ini.",
        "auth/invalid-email": "Format email tidak valid. Periksa kembali alamat email.",
        "auth/user-disabled": "Akun Firebase Authentication ini dinonaktifkan.",
        "auth/too-many-requests": "Terlalu banyak percobaan login. Tunggu beberapa saat sebelum mencoba lagi.",
        "auth/network-request-failed": "Tidak dapat menghubungi Firebase Authentication. Periksa koneksi internet dan coba lagi.",
        "auth/invalid-api-key": "Konfigurasi Firebase tidak valid: apiKey ditolak. Pastikan Web App memakai project selamatmotorplara-cb4d4.",
        "auth/operation-not-allowed": "Provider Email/Password belum diaktifkan di Firebase Console untuk project selamatmotorplara-cb4d4.",
        "auth/unauthorized-domain": "Domain website belum diizinkan untuk Firebase Authentication. Tambahkan domain ini di Authentication > Settings > Authorized domains.",
        "auth/app-not-authorized": "Firebase menolak aplikasi dari domain ini. Periksa Authorized domains dan konfigurasi Web App.",
        "auth/configuration-not-found": "Konfigurasi Firebase Authentication tidak ditemukan pada project selamatmotorplara-cb4d4."
      };
      const errorCode = err?.code || "auth/unknown";
      const msg = authErrorMessages[errorCode]
        || `Login Firebase gagal (${errorCode}): ${err?.message || "Terjadi kesalahan yang tidak diketahui."}`;

      alertText.textContent = msg;
      alertBox.style.display = "flex";
    }
  });
}

// Handle Logout Button
const logoutBtn = document.getElementById("btn-logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const confirmed = await adminConfirm(
      "Apakah Anda yakin ingin keluar dari Dashboard Administrator ANDRASELAMATMOTOR?",
      "Konfirmasi Logout",
      "warning",
      "Ya, Keluar",
      "Tetap di Dashboard"
    );
    if (confirmed) {
      try {
        await signOut(auth);
        window.location.href = "login.html";
      } catch (err) {
        console.error("Logout error:", err);
        window.location.href = "login.html";
      }
    }
  });
}

export { auth };
