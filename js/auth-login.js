// /js/auth-login.js
import { signInWithEmailAndPassword, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const { auth } = window.firebase;

onAuthStateChanged(auth, (user) => {
  if (user) location.href = "/page/admin/dashboard.html";
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const pass  = document.getElementById("password").value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    alert("Login failed: " + (err?.message || err));
  }
});
