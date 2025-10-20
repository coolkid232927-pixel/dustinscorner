// /js/header-auth.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const { auth, db } = window.firebase;
const nameEl    = document.getElementById("user-name");
const signoutEl = document.getElementById("signout");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (nameEl) nameEl.textContent = "";
    if (signoutEl) signoutEl.style.display = "none";
    return;
  }
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const display = snap.exists() ? (snap.data().displayName || user.email) : (user.displayName || user.email);
    if (nameEl) nameEl.textContent = display;
  } catch {
    if (nameEl) nameEl.textContent = user.displayName || user.email;
  }
  if (signoutEl) {
    signoutEl.style.display = "";
    signoutEl.onclick = () => signOut(auth);
  }
});
