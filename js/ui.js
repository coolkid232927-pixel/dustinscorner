// /js/ui.js
(function(){
  const css = `.toast-wrap{position:fixed;right:16px;top:16px;display:flex;flex-direction:column;gap:8px;z-index:9999}
  .toast{background:#0a2540;color:#fff;padding:10px 12px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,.12);max-width:360px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function ensure(){let w=document.querySelector('.toast-wrap'); if(!w){w=document.createElement('div'); w.className='toast-wrap'; document.body.appendChild(w);} return w;}
  window.toast = (msg)=>{ const w=ensure(); const el=document.createElement('div'); el.className='toast'; el.textContent=msg; w.appendChild(el); setTimeout(()=>el.remove(), 3000); };
})();
