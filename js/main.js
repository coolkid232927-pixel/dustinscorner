// Create a tiny global namespace
window.DC = window.DC || {};

/**
 * Simple slider
 * options: { selector, dotContainerSelector, intervalMs }
 */
window.DC.initSlider = function(options){
  const root = document.querySelector(options.selector);
  if(!root) return;

  const slides = [...root.querySelectorAll('.slide')];
  const prev = root.querySelector('.prev');
  const next = root.querySelector('.next');
  const dotsRoot = document.querySelector(options.dotContainerSelector);
  let i = 0, timer = null;

  function go(n){
    slides[i].classList.remove('is-active');
    dotsRoot.children[i].setAttribute('aria-selected', 'false');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('is-active');
    dotsRoot.children[i].setAttribute('aria-selected', 'true');
  }
  function nextSlide(){ go(i+1) }
  function prevSlide(){ go(i-1) }

  // dots
  slides.forEach((_, idx)=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role','tab');
    b.setAttribute('aria-label', `Go to slide ${idx+1}`);
    b.addEventListener('click', ()=>go(idx));
    dotsRoot.appendChild(b);
  });
  dotsRoot.children[0].setAttribute('aria-selected','true');

  next.addEventListener('click', nextSlide);
  prev.addEventListener('click', prevSlide);

  function start(){ timer = setInterval(nextSlide, options.intervalMs || 6000) }
  function stop(){ if(timer){ clearInterval(timer); timer = null; } }

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  start();
};

/**
 * Random photo of me
 * options: { imgId, buttonId, images: [] }
 */
window.DC.initRandomPhoto = function(options){
  const img = document.getElementById(options.imgId);
  const btn = document.getElementById(options.buttonId);
  if(!img || !btn || !options.images?.length) return;

  function pick(){
    const next = options.images[Math.floor(Math.random()*options.images.length)];
    img.src = next;
  }
  btn.addEventListener('click', pick);
  // do one random swap on load
  pick();
};
