// /js/auth-signup.js
import {
  onAuthStateChanged, createUserWithEmailAndPassword, updateProfile
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const { auth, db } = window.firebase;
const { ADMIN_SIGNUP_KEY } = window.DC_CONFIG || {};

const unlockBtn  = document.getElementById("unlock-btn");
const unlockKey  = document.getElementById("unlock-key");
const signupForm = document.getElementById("signup-form");

unlockBtn.addEventListener("click", () => {
  if (unlockKey.value === ADMIN_SIGNUP_KEY) {
    signupForm.classList.remove("hidden");
    document.getElementById("unlock-area").classList.add("hidden");
  } else {
    alert("Incorrect unlock key.");
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) location.href = "/page/admin/dashboard.html";
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const displayName = document.getElementById("signup-name").value.trim() || "";
  const email       = document.getElementById("signup-email").value.trim();
  const pass        = document.getElementById("signup-password").value.trim();

  if (!email || !pass) return alert("Email and password required.");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) await updateProfile(cred.user, { displayName });

    // Force viewer role on profile doc
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      displayName: displayName || email,
      role: "viewer",
      active: true,
      createdAt: serverTimestamp()
    });

    alert("User created as 'viewer'. You can now log in.");
    location.href = "/page/admin/index.html";
  } catch (err) {
    alert("Sign-up failed: " + (err?.message || err));
  }
});
