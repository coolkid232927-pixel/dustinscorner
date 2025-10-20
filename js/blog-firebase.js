// /js/blog-firebase.js
import { collection, query, orderBy, getDocs, where }
  from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const { db } = window.firebase;
const container = document.getElementById('posts');

(async function load(){
  container.innerHTML = 'Loading...';
  try{
    const q = query(
      collection(db,'posts'),
      where('status','==','published'),
      orderBy('publishedAt','desc')
    );
    const snap = await getDocs(q);
    // ... rest stays the same


    const frag = document.createDocumentFragment();
    posts.forEach(p=>{
      const article = document.createElement('article');
      article.className = 'card';
      const cover = p.cover ? `<img class="cover" src="${p.cover}" alt="">` : '';
      let dateText = '';
      const ts = p.publishedAt;
      if(ts?.toDate) dateText = ts.toDate().toLocaleDateString();

      article.innerHTML = `
        ${cover}
        <h2>${p.title}</h2>
        <time>${dateText}</time>
        <div class="content">${p.content}</div>
      `;
      frag.appendChild(article);
    });

    container.innerHTML = '';
    container.appendChild(frag);
  } catch(err){
    container.innerHTML = `<p class="muted">Failed to load posts: ${err.message}</p>`;
  }
})();
