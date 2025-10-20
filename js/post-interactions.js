import {
  getDocs, query, where, limit, collection, addDoc, serverTimestamp,
  onSnapshot, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
const { db, auth } = window.firebase;

const elPost   = document.getElementById("post");
const boxReac  = document.getElementById("reactions");
const boxCom   = document.getElementById("comments");
const listCom  = document.getElementById("comments-list");
const formCom  = document.getElementById("comment-form");
const txtCom   = document.getElementById("comment-text");
const hintCom  = document.getElementById("comment-hint");
const hintReac = document.getElementById("react-hint");

const params = new URLSearchParams(location.search);
const slug = params.get("slug");
let postId = null;
let me = null;

onAuthStateChanged(auth, user => {
  me = user || null;
  updateAuthUI();
});

function updateAuthUI(){
  if(!boxReac || !boxCom) return;
  const signed = !!me;
  // Reactions: enable buttons if signed in
  hintReac.textContent = signed ? "Tap to react." : "Sign in to react.";
  boxReac.querySelectorAll("button[data-react]").forEach(b=>{
    b.disabled = !signed;
  });
  // Comments
  if (signed) {
    formCom.classList.remove("hidden");
    hintCom.textContent = "";
  } else {
    formCom.classList.add("hidden");
    hintCom.textContent = "Sign in to comment.";
  }
}

async function loadPost() {
  if (!slug) { elPost.innerHTML = `<p class="muted">Missing slug.</p>`; return; }
  const q = query(collection(db, "posts"), where("slug","==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) { elPost.innerHTML = `<p class="muted">Post not found.</p>`; return; }
  const d = snap.docs[0];
  postId = d.id;
  const p = d.data();
  const cover = p.cover ? `<img class="cover" src="${p.cover}" alt="">` : '';
  const dateText = p.publishedAt?.toDate ? p.publishedAt.toDate().toLocaleDateString() : "";
  elPost.innerHTML = `${cover}<h1>${p.title}</h1><time class="muted">${dateText}</time><div class="content" style="margin-top:10px">${p.content}</div>`;
  document.title = `${p.title} — Dustin’s Corner`;

  // show interactions
  boxReac.style.display = "";
  boxCom.style.display  = "";

  bindReactions();
  bindComments();
}

function bindReactions(){
  const counts = { like:0, love:0, funny:0, fire:0 };
  // live aggregate = count reaction docs with property true
  onSnapshot(collection(db, "posts", postId, "reactions"), (snap)=>{
    counts.like = counts.love = counts.funny = counts.fire = 0;
    snap.forEach(doc=>{
      const r = doc.data();
      if(r.like) counts.like++;
      if(r.love) counts.love++;
      if(r.funny) counts.funny++;
      if(r.fire) counts.fire++;
    });
    for (const k of Object.keys(counts)) {
      const el = document.getElementById(`c-${k}`);
      if (el) el.textContent = String(counts[k]);
    }
  });

  boxReac.querySelectorAll("button[data-react]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      if(!me) return;
      const key = b.getAttribute("data-react");
      const ref = doc(db, "posts", postId, "reactions", me.uid);
      const snap = await getDoc(ref);
      const curr = snap.exists() ? snap.data() : {};
      // toggle that emoji
      const next = { like:false, love:false, funny:false, fire:false, ...curr, [key]: !curr[key] };
      await setDoc(ref, next, { merge:true });
    });
  });
}

function bindComments(){
  // live comments
  onSnapshot(collection(db, "posts", postId, "comments"), (snap)=>{
    if(snap.empty){ listCom.innerHTML = `<p class="muted">No comments yet.</p>`; return; }
    const frag = document.createDocumentFragment();
    snap.docs
      .sort((a,b)=> (a.data().at?.toMillis?.()||0) - (b.data().at?.toMillis?.()||0))
      .forEach(d=>{
        const c = d.data();
        const div = document.createElement("div");
        div.className = "card";
        const when = c.at?.toDate ? c.at.toDate().toLocaleString() : "";
        div.innerHTML = `<strong>${c.name||"Anon"}</strong> <span class="small muted">${when}</span><p style="margin:6px 0 0">${escapeHTML(c.text||"")}</p>`;
        frag.appendChild(div);
      });
    listCom.innerHTML = "";
    listCom.appendChild(frag);
  });

  formCom.addEventListener("submit", async (e)=>{
    e.preventDefault();
    if(!me) return alert("Sign in to comment.");
    const text = txtCom.value.trim();
    if(!text) return;
    await addDoc(collection(db, "posts", postId, "comments"), {
      uid: me.uid,
      name: me.displayName || me.email || "User",
      text,
      at: serverTimestamp()
    });
    txtCom.value = "";
  });
}

function escapeHTML(s){ return s.replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m])); }

loadPost();
