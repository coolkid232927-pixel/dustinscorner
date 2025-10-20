// /js/admin-users.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, getDocs, updateDoc, doc, query, orderBy }
  from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { logAction } from "/js/activity.js";

const { auth, db } = window.firebase;
const body = document.getElementById("users-body");
const searchEl = document.getElementById("user-search");

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "/page/admin/index.html";
  await renderUsers();
});

async function renderUsers() {
  body.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;
  try {
    const qy = query(collection(db, "users"), orderBy("createdAt","desc"));
    const snap = await getDocs(qy);
    body.innerHTML = "";

    if (snap.empty) {
      body.innerHTML = `<tr><td colspan="5">No users found.</td></tr>`;
      return;
    }

    snap.forEach(ds => {
      const u = ds.data(); const id = ds.id;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.displayName || ""} <span class="badge ${u.role||'viewer'}">${u.role||'viewer'}</span></td>
        <td>${u.email || ""}</td>
        <td>
          <select data-role="${id}">
            <option value="viewer" ${u.role==="viewer"?"selected":""}>viewer</option>
            <option value="editor" ${u.role==="editor"?"selected":""}>editor</option>
            <option value="publisher" ${u.role==="publisher"?"selected":""}>publisher</option>
            <option value="admin" ${u.role==="admin"?"selected":""}>admin</option>
          </select>
        </td>
        <td><input type="checkbox" data-active="${id}" ${u.active ? "checked": ""} /></td>
        <td><button class="btn outline" data-save="${id}">Save</button></td>
      `;
      body.appendChild(tr);
    });

    body.querySelectorAll("[data-save]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-save");
        const roleSel = body.querySelector(`[data-role="${id}"]`);
        const activeCb = body.querySelector(`[data-active="${id}"]`);
        const newRole = roleSel.value;
        const newActive = !!activeCb.checked;

        try {
          await updateDoc(doc(db, "users", id), { role: newRole, active: newActive });
          toast?.("Saved.");
          const row = btn.closest("tr");
          // update badge text immediately
          const badge = row.querySelector(".badge");
          if (badge) { badge.textContent = newRole; badge.className = `badge ${newRole}`; }

          await logAction({ db, auth }, "user:update", id, { role: newRole, active: newActive });
        } catch (err) {
          toast?.("Failed to save: " + (err?.message || err));
        }
      });
    });

    // quick search
    function textContentOf(tr){ return tr.textContent.toLowerCase(); }
    searchEl?.addEventListener("input", ()=>{
      const q = searchEl.value.toLowerCase().trim();
      body.querySelectorAll("tr").forEach(tr=>{
        tr.style.display = textContentOf(tr).includes(q) ? "" : "none";
      });
    });

  } catch (err) {
    body.innerHTML = `<tr><td colspan="5">Error: ${(err?.message || err)}</td></tr>`;
  }
}
