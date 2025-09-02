/* script.js — Asilux Research landing page
   - lightweight canvas background (particles)
   - renders sample VMFI + sparkline + area
   - Netlify-friendly form submit (fetch to '/')
*/

/* ------------------------------
   Canvas background (optimized)
   ------------------------------ */
(function(){
  const canvas = document.getElementById('bgCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const DPR = window.devicePixelRatio || 1;
  canvas.width = Math.floor(w * DPR);
  canvas.height = Math.floor(h * DPR);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(DPR, DPR);

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const COUNT = isMobile ? 28 : 72;
  const particles = [];

  function rand(min, max){ return Math.random()*(max-min)+min }

  for(let i=0;i<COUNT;i++){
    particles.push({
      x: Math.random()*w,
      y: Math.random()*h,
      vx: rand(-0.25,0.25),
      vy: rand(-0.2,0.2),
      r: rand(0.6,2.2),
      hue: rand(170,260),
      alpha: rand(0.08,0.25)
    });
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    // subtle base fill for depth
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, 'rgba(2,6,23,0.35)');
    g.addColorStop(1, 'rgba(3,6,16,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    ctx.globalCompositeOperation = 'lighter';
    for(let i=0;i<particles.length;i++){
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if(p.x < -20) p.x = w + 20;
      if(p.x > w + 20) p.x = -20;
      if(p.y < -20) p.y = h + 20;
      if(p.y > h + 20) p.y = -20;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue},80%,65%,${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();

      // pair lines for nearby particles
      for(let j=i+1;j<particles.length;j++){
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist2 = dx*dx + dy*dy;
        if(dist2 < 2000){
          ctx.strokeStyle = `hsla(${(p.hue+q.hue)/2},70%,60%,${0.04})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', ()=>{
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(DPR, DPR);
  });

  draw();
})();

/* ------------------------------
   VMFI sample series + small charts
   ------------------------------ */
(function(){
  // sample data for 6 months
  const series = [98.4,100.6,104.2,102.0,108.7,111.5];
  const latest = series[series.length-1];
  const prev = series[series.length-2];
  const mom = ((latest - prev) / prev) * 100;
  const changeText = (mom>=0? '▲ ' : '▼ ') + Math.abs(mom).toFixed(1) + '% (MoM)';

  // inject into DOM
  const vmfiValue = document.getElementById('vmfi-value');
  const vmfiChange = document.getElementById('vmfi-change');
  if(vmfiValue) vmfiValue.textContent = latest.toFixed(1);
  if(vmfiChange) {
    vmfiChange.textContent = changeText;
    vmfiChange.style.color = mom >= 0 ? '#0ecf9b' : '#ff7b7b';
  }

  // draw sparkline polyline
  (function drawSpark(){
    const svg = document.getElementById('spark');
    if(!svg) return;
    const W = 120, H = 40, pad = 6;
    const max = Math.max(...series), min = Math.min(...series);
    const pts = series.map((v,i)=>{
      const x = pad + (i/(series.length-1))*(W - pad*2);
      const y = pad + (1 - (v-min)/(max-min))*(H - pad*2);
      return `${x},${y}`;
    }).join(' ');
    svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="url(#g)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#4fd1c5"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>`;
  })();

  // area chart for the right tile
  (function drawArea(){
    const svg = document.getElementById('vmfi-area');
    if(!svg) return;
    const W = 300, H = 80, pad = 6;
    const max = Math.max(...series), min = Math.min(...series);
    let path = '';
    series.forEach((v,i)=>{
      const x = pad + (i/(series.length-1))*(W - pad*2);
      const y = pad + (1 - (v-min)/(max-min))*(H - pad*2);
      path += (i===0? `M ${x} ${y}` : ` L ${x} ${y}`);
    });
    const firstX = pad, lastX = W - pad, baseY = H - pad;
    const d = `${path} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
    svg.innerHTML = `<defs><linearGradient id="a" x1="0" x2="0"><stop offset="0%" stop-color="#6366f1" stop-opacity="0.18"/><stop offset="100%" stop-color="#4fd1c5" stop-opacity="0.02"/></linearGradient></defs>
      <path d="${d}" fill="url(#a)" stroke="#6366f1" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>`;
  })();

  // mini placeholders for tiles (simple polyline)
  (function miniCharts(){
    const fillMini = (id, values) => {
      const svg = document.getElementById(id);
      if(!svg) return;
      const W = 100, H = 28, pad = 4;
      const max = Math.max(...values), min = Math.min(...values);
      const pts = values.map((v,i)=>{
        const x = pad + (i/(values.length-1))*(W - pad*2);
        const y = pad + (1 - (v-min)/(max-min))*(H - pad*2);
        return `${x},${y}`;
      }).join(' ');
      svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="#4fd1c5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    };
    fillMini('mini-1', [10,12,9,14,16,15]); // sample
    fillMini('mini-2', [30,28,32,31,33,35]);
  })();
})();

/* ------------------------------
   Netlify form handler (client UX)
   ------------------------------ */
function handleForm(e){
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('form-msg');
  const data = new FormData(form);

  if(!data.get('name') || !data.get('email')){
    msg.textContent = 'Please complete name and email.';
    return;
  }

  // POST to Netlify (static form)
  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(Array.from(data.entries()))
  }).then(()=>{
    msg.textContent = 'Thanks — you are on the waitlist.';
    form.reset();
  }).catch(()=> {
    msg.textContent = 'Submission failed — please try again or email hello@asiluxresearch.com';
  });
}
