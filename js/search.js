import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
const { db } = window.firebase;

const qEl = document.getElementById("q");
const res = document.getElementById("results");
const chk = {
  draft: document.getElementById("s-draft"),
  published: document.getElementById("s-published"),
  scheduled: document.getElementById("s-scheduled")
};

let all = [];
(async ()=>{
  res.innerHTML = "Loading index…";
  try{
    const snap = await getDocs(query(collection(db,"posts"), orderBy("publishedAt","desc")));
    all = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    res.innerHTML = `<p class="muted small">Indexed ${all.length} posts. Start typing.</p>`;
  }catch(e){
    res.innerHTML = `<p class="muted">Error: ${e?.message||e}</p>`;
  }
})();

[qEl, chk.draft, chk.published, chk.scheduled].forEach(el => el.addEventListener("input", render));
function render(){
  const q = (qEl.value||"").toLowerCase().trim();
  const allow = new Set([
    chk.draft.checked && "draft",
    chk.published.checked && "published",
    chk.scheduled.checked && "scheduled"
  ].filter(Boolean));

  const matches = all.filter(p=>{
    if (allow.size && !allow.has(p.status||"draft")) return false;
    if (!q) return true;
    const hay = `${p.title||""} ${p.slug||""}`.toLowerCase();
    // simple fuzzy: all query tokens must appear
    const tokens = q.split(/\s+/).filter(Boolean);
    return tokens.every(t => hay.includes(t));
  }).slice(0, 40); // cap

  if (matches.length === 0) { res.innerHTML = `<p class="muted">No matches.</p>`; return; }

  const frag = document.createDocumentFragment();
  matches.forEach(p=>{
    const div = document.createElement("article");
    div.className = "card";
    const cover = p.cover ? `<img class="cover" src="${p.cover}" alt="">` : "";
    const dateText = p.publishedAt?.toDate ? p.publishedAt.toDate().toLocaleDateString() : "";
    const status = p.status || "draft";
    div.innerHTML = `
      ${cover}
      <h2><a href="/page/blog/post.html?slug=${encodeURIComponent(p.slug||'')}">${p.title||"(untitled)"}</a></h2>
      <div class="small muted">${status} • ${p.slug||""} • ${dateText}</div>
      <div class="content">${(p.content||"").slice(0,280)}${(p.content||"").length>280?"…":""}</div>
    `;
    frag.appendChild(div);
  });
  res.innerHTML = "";
  res.appendChild(frag);
}
