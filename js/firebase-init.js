// /js/firebase-init.js
// Firebase v12 (modular, CDN). Make sure your config below is correct.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8PHBIZym-NEBKOEv03hZpSiazVNjUfDw",
  authDomain: "dustins-corner.firebaseapp.com",
  projectId: "dustins-corner",
  storageBucket: "dustins-corner.firebasestorage.app",
  messagingSenderId: "390973282895",
  appId: "1:390973282895:web:55b4c63f68ad5dc22de83a",
  measurementId: "G-4B0K6ENX6N"
};

const app = initializeApp(firebaseConfig);

window.firebase = {
  app,
  auth: getAuth(app),
  db:   getFirestore(app)
};
