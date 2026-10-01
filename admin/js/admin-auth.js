// ==========================================================================
// SELAMATMOTORPLARA
// admin-auth.js - Otentikasi Admin Firebase
// ==========================================================================

import { 
  auth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "../../js/firebase-config.js";
import { firebaseConfigured } from "../../js/firebase-config.js";

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
  if (alertBox && alertText) {
    alertText.textContent = "Konfigurasi Firebase Web belum lengkap. Lengkapi dari Firebase Console project selamatmotorplara-cb4d4.";
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

      let msg = "Terjadi kesalahan saat masuk. Silakan coba lagi.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        msg = "Email atau password yang Anda masukkan salah. Pastikan email dan password sesuai yang terdaftar di Firebase.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Format email tidak valid. Periksa penulisan email Anda.";
      } else if (err.code === "auth/user-disabled") {
        msg = "Akun administrator ini dinonaktifkan oleh sistem.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lagi.";
      } else if (err.code === "auth/network-request-failed") {
        msg = "Gagal terhubung ke Firebase. Periksa koneksi internet Anda.";
      } else if (err.message) {
        msg = err.message;
      }

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
      "Apakah Anda yakin ingin keluar dari Dashboard Administrator SELAMATMOTORPLARA?",
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
