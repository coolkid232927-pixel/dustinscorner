// /js/admin-dashboard.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, Timestamp,
  query, orderBy, getDocs, getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { logAction } from "/js/activity.js";

const { auth, db } = window.firebase;

// UI refs
const verifyBar  = document.getElementById("verify-banner");
const viewerBar  = document.getElementById("viewer-banner");
const form       = document.getElementById("post-form");
const listEl     = document.getElementById("post-list");
const logoutBt   = document.getElementById("logout");

const titleEl    = document.getElementById("title");
const coverEl    = document.getElementById("cover");
const contentEl  = document.getElementById("content");
const slugEl     = document.getElementById("slug");
const dateEl     = document.getElementById("date");
const statusEl   = document.getElementById("status");
const publishOnEl= document.getElementById("publishOn");
const editIdEl   = document.getElementById("edit-id");
const previewBtn = document.getElementById("toggle-preview");
const previewEl  = document.getElementById("content-preview");
const copyBtn    = document.getElementById("copy-slug");
const postSearch = document.getElementById("post-search");
const resendBtn  = document.getElementById("resend-verify");

const fStatus = document.getElementById("filter-status");
const fFrom   = document.getElementById("filter-from");
const fTo     = document.getElementById("filter-to");
const fClear  = document.getElementById("filter-clear");

// Helpers
function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0,80);
}
function dateInputToTimestamp(d) {
  if (!d) return serverTimestamp();
  return Timestamp.fromDate(new Date(d + "T00:00:00"));
}
function dtLocalToTimestamp(dt) {
  if (!dt) return null;
  return Timestamp.fromDate(new Date(dt));
}
function mdQuick(s){
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  s = s.replace(/`(.+?)`/g, "<code>$1</code>");
  s = s.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
  s = s.replace(/(^|\n)### (.+)/g, "$1<h3>$2</h3>");
  s = s.replace(/(^|\n)## (.+)/g, "$1<h2>$2</h2>");
  s = s.replace(/(^|\n)# (.+)/g, "$1<h1>$2</h1>");
  s = s.split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
  return s;
}

// Toolbar
document.querySelectorAll('[data-md]').forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const type = btn.getAttribute("data-md");
    wrapSelection(contentEl, type);
  });
});
function wrapSelection(textarea, type){
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const sel = textarea.value.substring(start, end);
  let before="", after="";
  if (type==="bold")      { before="**"; after="**"; }
  if (type==="italic")    { before="*";  after="*"; }
  if (type==="code")      { before="`";  after="`"; }
  if (type==="link") {
    const url = prompt("Link URL (https://…):","https://");
    if(!url) return;
    const label = sel || "link text";
    const ins = `[${label}](${url})`;
    textarea.setRangeText(ins, start, end, "end");
    textarea.dispatchEvent(new Event("input"));
    return;
  }
  const ins = before + (sel || "text") + after;
  textarea.setRangeText(ins, start, end, "end");
  textarea.dispatchEvent(new Event("input"));
}

// Local autosave + dirty state
let DRAFT_KEY = "dc_draft";
let dirty = false;
function loadDraft(){
  try{
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");
    if(!d) return;
    titleEl.value = d.title||"";
    coverEl.value = d.cover||"";
    contentEl.value = d.content||"";
    slugEl.value = d.slug||"";
    dateEl.value = d.date||"";
    statusEl.value = d.status||"draft";
    publishOnEl.value = d.publishOn||"";
  }catch{}
}
function saveDraft(){
  const d = {
    title: titleEl.value, cover: coverEl.value, content: contentEl.value,
    slug: slugEl.value, date: dateEl.value, status: statusEl.value,
    publishOn: publishOnEl.value
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
}
function clearDirty(){ dirty = false; }
["input","change","keyup"].forEach(evt=>{
  form?.addEventListener(evt, ()=>{ dirty = true; saveDraft(); });
});
document.addEventListener("keydown", (e)=>{
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==="s"){
    e.preventDefault();
    form?.requestSubmit();
  }
});
window.addEventListener("beforeunload", (e)=>{
  if(dirty){ e.preventDefault(); e.returnValue = ""; }
});

// Auth + role/verify gate
let myRole = "viewer";
let canEdit = false;
onAuthStateChanged(auth, async (user) => {
  if (!user) { location.href = "/page/admin/index.html"; return; }

  DRAFT_KEY = `dc_draft_${user.uid}`;
  loadDraft();

  const verified = !!user.emailVerified;
  if (!verified) { verifyBar?.classList.remove("hidden"); form?.classList.add("hidden"); }
  else { verifyBar?.classList.add("hidden"); form?.classList.remove("hidden"); }

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) myRole = snap.data()?.role || "viewer";
  } catch {}
  canEdit = ["editor","publisher","admin"].includes(myRole);

  if (!canEdit) { viewerBar?.classList.remove("hidden"); form?.classList.add("hidden"); }
  else if (verified) { viewerBar?.classList.add("hidden"); form?.classList.remove("hidden"); }

  await renderList();
  startScheduler(); // run after auth
});

// Preview toggle
previewBtn?.addEventListener("click", ()=>{
  const showing = !previewEl.classList.contains("hidden");
  if(showing){
    previewEl.classList.add("hidden");
    previewBtn.textContent = "Preview";
  }else{
    const raw = contentEl.value.trim();
    previewEl.innerHTML = /<\w+/.test(raw) ? raw : mdQuick(raw);
    previewEl.classList.remove("hidden");
    previewBtn.textContent = "Hide Preview";
  }
});

// Copy slug link
copyBtn?.addEventListener("click", async ()=>{
  const s = (slugEl.value || slugify(titleEl.value)).trim();
  if(!s) return toast?.("Set a title or slug first.");
  const url = `${location.origin}/page/blog/post.html?slug=${encodeURIComponent(s)}`;
  try{ await navigator.clipboard.writeText(url); toast?.("Link copied!"); }
  catch{ toast?.("Could not copy, here it is:\n"+url); }
});

// Filters
[fStatus, fFrom, fTo].forEach(el=> el?.addEventListener("change", applyClientFilters));
fClear?.addEventListener("click", ()=>{
  fStatus.value=""; fFrom.value=""; fTo.value=""; postSearch.value=""; applyClientFilters();
});
postSearch?.addEventListener("input", applyClientFilters);

function applyClientFilters(){
  const qText = (postSearch.value||"").toLowerCase().trim();
  const wantStatus = fStatus.value;
  const from = fFrom.value ? new Date(fFrom.value+"T00:00:00").getTime() : null;
  const to   = fTo.value   ? new Date(fTo.value+"T23:59:59").getTime() : null;

  listEl.querySelectorAll(".post-item").forEach(li=>{
    const txt = li.textContent.toLowerCase();
    const rowStatus = li.getAttribute("data-status") || "";
    const millis = Number(li.getAttribute("data-published") || "0");

    const matchesText = !qText || txt.includes(qText);
    const matchesStatus = !wantStatus || wantStatus === rowStatus;
    const matchesFrom = !from || (millis && millis >= from);
    const matchesTo   = !to   || (millis && millis <= to);

    li.style.display = (matchesText && matchesStatus && matchesFrom && matchesTo) ? "" : "none";
  });
}

// Save (create/update) post
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!canEdit) return alert("You do not have permission to edit posts.");
  const title = titleEl.value.trim();
  const content = contentEl.value.trim();
  if (!title || !content) return alert("Title and content are required.");

  const status = statusEl.value;
  const p = {
    title,
    cover:   coverEl.value.trim(),
    content,
    slug:    (slugEl.value.trim() || slugify(title)),
    status,
    publishedAt: dateInputToTimestamp(dateEl.value),
    publishOn: dtLocalToTimestamp(publishOnEl.value)
  };

  try {
    const editId = editIdEl.value.trim();
    if (editId) {
      await updateDoc(doc(db, "posts", editId), p);
      await logAction({ db, auth }, "post:update", p.title, { postId: editId, slug: p.slug, status });
      alert("Post updated!");
    } else {
      const ref = await addDoc(collection(db, "posts"), p);
      await logAction({ db, auth }, "post:create", p.title, { postId: ref.id, slug: p.slug, status });
      alert("Post saved!");
    }
    form.reset();
    editIdEl.value = "";
    clearDirty(); saveDraft();
    await renderList();
  } catch (err) {
    alert("Save failed: " + (err?.message || err));
  }
});

// Render list
async function renderList() {
  listEl.innerHTML = "Loading...";
  try {
    const qy = query(collection(db, "posts"), orderBy("publishedAt", "desc"));
    const snap = await getDocs(qy);
    listEl.innerHTML = "";
    if (snap.empty) {
      listEl.innerHTML = `<li class="post-item"><div class="meta">
        <strong>No posts yet</strong><span class="small muted">Create your first above.</span></div></li>`;
      return;
    }
    snap.forEach((ds) => {
      const p = ds.data(); const id = ds.id;
      let dateText = ""; let millis=0;
      if (p.publishedAt?.toDate) { const d = p.publishedAt.toDate(); dateText = d.toISOString().slice(0,10); millis = d.getTime(); }
      const stat = p.status || "draft";
      const sched = p.publishOn?.toDate ? ` • Sched: ${p.publishOn.toDate().toLocaleString()}` : "";

      const li = document.createElement("li");
      li.className = "post-item";
      li.setAttribute("data-status", stat);
      li.setAttribute("data-published", String(millis||0));
      li.innerHTML = `
        <div class="meta">
          <strong>${p.title}</strong>
          <span class="small muted">${dateText || "pending"} • ${p.slug || ""} • <em>${stat}</em>${sched}</span>
        </div>
        <div>
          ${canEdit ? `<button class="btn outline" data-edit="${id}">Edit</button>` : ""}
          ${["publisher","admin"].includes(myRole) ? `<button class="btn" data-delete="${id}">Delete</button>` : ""}
        </div>
      `;
      listEl.appendChild(li);
    });

    applyClientFilters();

    if (canEdit) {
      listEl.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-edit");
          const all = await getDocs(query(collection(db,"posts")));
          const match = all.docs.find(d=>d.id===id);
          if (!match) return alert("Could not load post to edit.");
          const p = match.data();
          titleEl.value   = p.title || "";
          coverEl.value   = p.cover || "";
          contentEl.value = p.content || "";
          slugEl.value    = p.slug || "";
          dateEl.value    = p.publishedAt?.toDate ? p.publishedAt.toDate().toISOString().slice(0,10) : "";
          statusEl.value  = p.status || "draft";
          publishOnEl.value = p.publishOn?.toDate ? toLocalDT(p.publishOn.toDate()) : "";
          editIdEl.value  = id;
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });
    }

    if (["publisher","admin"].includes(myRole)) {
      listEl.querySelectorAll("[data-delete]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-delete");
          if (!confirm("Delete this post?")) return;
          try {
            await deleteDoc(doc(db, "posts", id));
            await logAction({ db, auth }, "post:delete", id, { postId: id });
            await renderList();
          } catch (err) {
            alert("Delete failed: " + (err?.message || err));
          }
        });
      });
    }

  } catch (err) {
    listEl.innerHTML = `<li class="post-item"><div class="meta">
      <strong>Failed to load posts</strong>
      <span class="small muted">${(err?.message || err)}</span>
    </div></li>`;
  }
}

function toLocalDT(d){
  const pad=n=> String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Simple client-side scheduler (mock)
// If status==="scheduled" and publishOn<=now, flip to published.
let schedulerTimer = null;
function startScheduler(){
  if (schedulerTimer) return;
  const run = async ()=>{
    if (!["publisher","admin","editor"].includes(myRole)) return; // needs edit rights
    try{
      const snap = await getDocs(query(collection(db,"posts")));
      const now = Date.now();
      for (const d of snap.docs) {
        const p = d.data();
        if ((p.status==="scheduled") && p.publishOn?.toDate && p.publishOn.toDate().getTime() <= now) {
          await updateDoc(doc(db,"posts", d.id), {
            status:"published",
            publishedAt: serverTimestamp()
          });
          await logAction({ db, auth }, "post:autopublish", p.title, { postId: d.id, slug: p.slug });
          toast?.(`Auto-published: ${p.title}`);
        }
      }
    }catch(e){ /* non-fatal */ }
  };
  run();
  schedulerTimer = setInterval(run, 60 * 1000); // check every minute
}
