/* Core: mode registry, detection, manual override, event log, device diagnostics */
const $ = id => document.getElementById(id);
const MODES = {
  mouse:{label:'Mouse',icon:'🖱️',why:'Fine pointer: compact layout with hover effects.'},
  touch:{label:'Touch',icon:'👆',why:'Coarse pointer: large targets and wider spacing.'},
  keyboard:{label:'Keyboard',icon:'⌨️',why:'Keyboard navigation: strong focus ring and key hints.'},
  gesture:{label:'Gesture',icon:'🤚',why:'Gesture control: swipe, pinch, tap and hold.'},
  eye:{label:'Eye',icon:'👁️',why:'Eye control: look at a target to click it. Large targets.'},
  voice:{label:'Voice',icon:'🎙️',why:'Voice control: speak commands and hear replies.'}
};
const QUEST = ['mouse','touch','keyboard','voice','gesture','eye'], used = new Set();
function markUsed(m){
  if(!QUEST.includes(m) || used.has(m)) return; used.add(m);
  const li = document.querySelector('#quest [data-q="' + m + '"]'); if(li){ li.classList.add('done'); li.textContent = '✓ ' + MODES[m].label; }
  $('qCount').textContent = used.size + '/6'; $('qBar').style.width = (used.size / 6 * 100) + '%';
  if(used.size === 6){ toast('All six inputs unlocked 🎉'); log('Mission complete'); }
}
const counts = {mouse:0,touch:0,keyboard:0,voice:0,gesture:0,eye:0};
let current = 'mouse', override = 'auto';

function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function load(k){try{return localStorage.getItem(k)}catch(e){return null}}

function log(msg){
  const ul = $('log');
  if(ul.children.length === 1 && !ul.firstChild.querySelector('time')) ul.innerHTML = '';
  const li = document.createElement('li');
  li.innerHTML = '<time>' + new Date().toLocaleTimeString([], {hour12:false}) + '</time><span></span>';
  li.lastChild.textContent = msg;
  ul.prepend(li);
  while(ul.children.length > 30) ul.lastChild.remove();
}

function render(mode){
  const m = MODES[mode];
  document.body.className = 'mode-' + mode;
  $('modalityBadge').textContent = m.label;
  $('icon').textContent = m.icon;
  $('why').textContent = m.why;
  if($('eyeBtn')) $('eyeBtn').textContent = mode === 'eye' ? '👁 Stop eye control' : '👁 Start eye control';
  document.querySelectorAll('#rules li').forEach(li => li.classList.toggle('on', li.dataset.r === mode));
}

function setMode(mode, reason){
  if(override !== 'auto' || mode === current) return;
  if((listening || document.body.classList.contains('mode-eye')) && reason === 'pointer moved') return;
  current = mode;
  counts[mode]++; markUsed(mode);
  $({mouse:'cMouse',touch:'cTouch',keyboard:'cKey',voice:'cVoice',gesture:'cGest',eye:'cEye'}[mode]).textContent = counts[mode];
  render(mode);
  log('Switched to ' + MODES[mode].label + ' (' + reason + ')');
}

// Detection: pointer events avoid the "synthetic mouse after touch" bug
addEventListener('pointerdown', e => { if(e.target.closest('#pad')) return; if(e.pointerType === 'touch') setMode('touch','touch press'); else setMode('mouse','click'); }, {passive:true});
addEventListener('pointermove', e => { if(e.pointerType === 'mouse' || e.pointerType === 'pen') setMode('mouse','pointer moved'); }, {passive:true});
addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA)$/.test(e.target.tagName) && e.target.type === 'text';
  if(e.key === 'Tab' || (!typing && e.key.startsWith('Arrow'))) setMode('keyboard', e.key + ' key');
});

// Manual override
function chooseMode(m){
  override = m;
  document.querySelectorAll('#seg button').forEach(x => x.setAttribute('aria-pressed', x.dataset.m === m));
  store('ui-override', m);
  if(m === 'auto'){ log('Auto detection resumed'); }
  else { current = m; render(m); markUsed(m); log('Locked to ' + MODES[m].label + ' manually'); }
}
$('seg').addEventListener('click', e => { const b = e.target.closest('button'); if(b) chooseMode(b.dataset.m); });

// Demo controls
function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1400)}
document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { toast(b.dataset.act); log('Pressed "' + b.textContent + '"'); }));
$('sw').addEventListener('click', e => { const s = e.currentTarget; s.setAttribute('aria-checked', s.getAttribute('aria-checked') !== 'true'); log('Notifications ' + (s.getAttribute('aria-checked') === 'true' ? 'on' : 'off')); });
$('clear').addEventListener('click', () => { $('log').innerHTML = '<li><span>Log cleared.</span></li>'; });

// Text size + theme
$('scale').addEventListener('input', e => { document.documentElement.style.setProperty('--scale', e.target.value + '%'); store('ui-scale', e.target.value); });
$('themeBtn').addEventListener('click', () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  r.dataset.theme = dark ? 'light' : 'dark'; store('ui-theme', r.dataset.theme);
});

// Device signals from media queries
function signals(){
  const q = s => matchMedia(s).matches;
  const rows = [
    ['Primary pointer', q('(pointer: coarse)') ? 'Coarse (touch)' : q('(pointer: fine)') ? 'Fine (mouse)' : 'None'],
    ['Hover support', q('(hover: hover)') ? 'Yes' : 'No'],
    ['Touch points', String(navigator.maxTouchPoints || 0)],
    ['Reduced motion', q('(prefers-reduced-motion: reduce)') ? 'On' : 'Off'],
    ['Viewport', innerWidth + ' × ' + innerHeight],
    ['Voice input', SR ? '<span class="ok">✓ Ready</span>' : '<span class="no">✗ Unsupported</span>'],
    ['Voice output', 'speechSynthesis' in window ? '<span class="ok">✓ Ready</span>' : '<span class="no">✗ Unsupported</span>'],
    ['Camera', navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? '<span class="ok">✓ Available</span>' : '<span class="no">✗ Unavailable</span>']
  ];
  $('signals').innerHTML = rows.map(r => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join('');
  return q('(pointer: coarse)');
}
addEventListener('resize', signals);
