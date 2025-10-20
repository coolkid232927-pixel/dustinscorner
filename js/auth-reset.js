// /js/auth-reset.js
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
const { auth } = window.firebase;

document.getElementById("reset-form").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = document.getElementById("reset-email").value.trim();
  try{
    await sendPasswordResetEmail(auth, email);
    toast("Reset link sent. Check your inbox.");
  }catch(err){
    toast("Could not send reset: " + (err?.message || err));
  }
});
