/* Gestures, eye control (dwell-to-click) and camera motion tracking */
// Gestures (touch, mouse drag and camera)
const MODE_CYCLE = ['auto','mouse','touch','keyboard','voice','gesture','eye'];
const G = {
  left:['←','Swipe left: previous mode'], right:['→','Swipe right: next mode'],
  up:['↑','Swipe up: text bigger'], down:['↓','Swipe down: text smaller'],
  doubletap:['◎◎','Double tap: theme toggled'], longpress:['●','Hold: microphone toggled'],
  pinchout:['⤢','Pinch out: text bigger'], pinchin:['⤡','Pinch in: text smaller']
};
function cycle(d){ const i = MODE_CYCLE.indexOf(override === 'auto' && current !== 'auto' ? 'auto' : override); chooseMode(MODE_CYCLE[(i + d + MODE_CYCLE.length) % MODE_CYCLE.length]); toast(MODES[current] && override !== 'auto' ? MODES[override].label + ' mode' : 'Auto mode'); }
function fire(name, src){
  const [g, d] = G[name];
  $('glyph').textContent = g; $('gdesc').textContent = d;
  $('glyph').classList.remove('pop'); void $('glyph').offsetWidth; $('glyph').classList.add('pop');
  log('Gesture: ' + name + ' (' + (src || 'pad') + ')');
  if(name === 'left') return cycle(-1);
  if(name === 'right') return cycle(1);
  setMode('gesture', name);
  if(name === 'up' || name === 'pinchout') setScale(10);
  else if(name === 'down' || name === 'pinchin') setScale(-10);
  else if(name === 'doubletap') $('themeBtn').click();
  else if(name === 'longpress') $('mic').click();
}
(function(){
  const pad = $('pad'), ptrs = new Map(); let x0, y0, t0 = 0, lp, longFired = false, lastTap = 0, pinch0 = 0;
  const dist = () => { const a = [...ptrs.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };
  pad.addEventListener('pointerdown', e => {
    pad.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(ptrs.size === 1){ x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); longFired = false; clearTimeout(lp); lp = setTimeout(() => { longFired = true; fire('longpress'); }, 650); }
    else if(ptrs.size === 2){ clearTimeout(lp); t0 = 0; pinch0 = dist(); }
  });
  pad.addEventListener('pointermove', e => {
    if(!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(ptrs.size === 1 && Math.hypot(e.clientX - x0, e.clientY - y0) > 12) clearTimeout(lp);
    if(ptrs.size === 2 && pinch0){ const r = dist() / pinch0; if(r > 1.25){ fire('pinchout'); pinch0 = dist(); } else if(r < .8){ fire('pinchin'); pinch0 = dist(); } }
  });
  pad.addEventListener('pointerup', e => {
    if(!ptrs.has(e.pointerId)) return; const single = ptrs.size === 1; ptrs.delete(e.pointerId); clearTimeout(lp);
    if(!single || !t0 || longFired) { t0 = 0; return; }
    const dx = e.clientX - x0, dy = e.clientY - y0, now = performance.now(); t0 = 0;
    if(Math.max(Math.abs(dx), Math.abs(dy)) > 50) fire(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    else if(Math.hypot(dx, dy) < 12){ if(now - lastTap < 320){ lastTap = 0; fire('doubletap'); } else lastTap = now; }
  });
  pad.addEventListener('pointercancel', () => { ptrs.clear(); clearTimeout(lp); t0 = 0; });
})();

// Eye control: dwell-to-click gaze pointer
const gz = $('gaze'); let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy; const dw = {el:null, t:0, cool:0};
const inEye = () => document.body.classList.contains('mode-eye');
addEventListener('pointermove', e => { if(inEye() && $('simGaze').checked){ tx = e.clientX; ty = e.clientY; } }, {passive:true});
$('dwell').addEventListener('input', e => { $('dwellLbl').textContent = 'Dwell time: ' + (e.target.value / 1000).toFixed(1) + ' s'; });
function eyeLoop(now){
  requestAnimationFrame(eyeLoop);
  if(!inEye()){ dw.el = null; return; }
  gx += (tx - gx) * .25; gy += (ty - gy) * .25;
  gz.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
  const hit = document.elementFromPoint(gx, gy), tgt = hit && hit.closest('button:not(:disabled),label.chk,.tile');
  if(!tgt || now < dw.cool){ dw.el = tgt; dw.t = now; gz.style.setProperty('--p', 0); return; }
  if(tgt !== dw.el){ dw.el = tgt; dw.t = now; }
  const p = Math.min(1, (now - dw.t) / +$('dwell').value);
  gz.style.setProperty('--p', p);
  if(p >= 1){ tgt.click(); dw.cool = now + 900; log('Gaze click: ' + (tgt.textContent.trim().slice(0, 24) || 'control')); }
}
requestAnimationFrame(eyeLoop);
function toggleEye(){
  const fb = matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse';
  if(inEye()){ if(override !== 'auto') chooseMode('auto'); setMode(fb, 'eye control stopped'); }
  else if(override !== 'auto') chooseMode('eye'); else setMode('eye', 'eye control started');
}
$('eyeBtn').addEventListener('click', toggleEye);
$('tiles').addEventListener('click', e => {
  const b = e.target.closest('.tile'); if(!b) return;
  $('said').textContent = 'Said: ' + b.dataset.say; log('Eye keypad: ' + b.dataset.say);
  b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 700);
  try{ speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(b.dataset.say)); }catch(err){}
});

// Camera: motion tracking for air swipes and head-steered pointer
const cam = {stream:null, v:null, ctx:null, prev:null, hist:[], last:0, cool:0};
async function startCam(){
  try{ cam.stream = await navigator.mediaDevices.getUserMedia({video:{width:160, height:120, facingMode:'user'}}); }
  catch(e){ $('eyeMsg').textContent = 'Camera unavailable or blocked. Allow camera access for this page and try again.'; return; }
  cam.v = document.createElement('video'); cam.v.muted = true; cam.v.playsInline = true; cam.v.srcObject = cam.stream;
  await cam.v.play(); $('camBox').appendChild(cam.v);
  const c = document.createElement('canvas'); c.width = 64; c.height = 48; cam.ctx = c.getContext('2d', {willReadFrequently:true});
  cam.prev = null; cam.hist = []; $('camBtn').textContent = '📷 Stop camera'; log('Camera on');
  requestAnimationFrame(camLoop);
}
function stopCam(){
  if(cam.stream) cam.stream.getTracks().forEach(t => t.stop());
  cam.stream = null; $('camBox').innerHTML = ''; $('camBtn').textContent = '📷 Start camera'; log('Camera off');
}
$('camBtn').addEventListener('click', () => cam.stream ? stopCam() : startCam());
function camLoop(t){
  if(!cam.stream) return; requestAnimationFrame(camLoop);
  if(t - cam.last < 40) return; cam.last = t;
  cam.ctx.drawImage(cam.v, 0, 0, 64, 48);
  const d = cam.ctx.getImageData(0, 0, 64, 48).data;
  if(!cam.prev){ cam.prev = new Float32Array(3072); for(let i = 0; i < 3072; i++) cam.prev[i] = (d[i*4] + d[i*4+1] + d[i*4+2]) / 3; return; }
  let n = 0, sx = 0, sy = 0;
  for(let i = 0; i < 3072; i++){ const g = (d[i*4] + d[i*4+1] + d[i*4+2]) / 3; if(Math.abs(g - cam.prev[i]) > 28){ n++; sx += i % 64; sy += (i / 64) | 0; } cam.prev[i] = g; }
  if(n < 25) return;
  const cx = 1 - (sx / n) / 64, cy = (sy / n) / 48;
  if(inEye()){
    const k = +$('gain').value; tx = Math.min(innerWidth, Math.max(0, ((cx - .5) * k + .5) * innerWidth));
    ty = Math.min(innerHeight, Math.max(0, ((cy - .5) * k + .5) * innerHeight));
    return;
  }
  cam.hist.push({x:cx, t}); cam.hist = cam.hist.filter(h => t - h.t < 500);
  if(cam.hist.length >= 4 && t > cam.cool && n > 80){
    const dx = cam.hist[cam.hist.length - 1].x - cam.hist[0].x;
    if(Math.abs(dx) > .35){ cam.cool = t + 1200; cam.hist = []; fire(dx > 0 ? 'right' : 'left', 'camera'); }
  }
}
