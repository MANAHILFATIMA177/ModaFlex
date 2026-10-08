/* Gallery playground and the editable communication board */
// Gallery playground
const SLIDES = [['🏔️','Mountain sunrise'],['🌊','Ocean waves'],['🌲','Pine forest'],['🏜️','Desert dunes'],['🌌','Night sky'],['🌸','Cherry blossom']];
let si = 0; const liked = new Set();
function paintSlide(){
  $('sEmoji').textContent = SLIDES[si][0]; $('sCap').textContent = SLIDES[si][1] + ' (' + (si + 1) + '/' + SLIDES.length + ')';
  $('slide').style.background = 'hsl(' + (si * 55 + 190) + ' 45% 38%)';
  $('dots').innerHTML = SLIDES.map((_, i) => '<i class="' + (i === si ? 'on' : '') + '"></i>').join('');
  $('like').firstChild.textContent = liked.has(si) ? '♥ Liked ' : '♡ Like '; $('likeN').textContent = liked.size;
}
function go(d){ si = (si + d + SLIDES.length) % SLIDES.length; paintSlide(); }
function like(){ liked.has(si) ? liked.delete(si) : liked.add(si); paintSlide(); log((liked.has(si) ? 'Liked ' : 'Unliked ') + SLIDES[si][1]); return liked.has(si) ? 'Liked' : 'Unliked'; }
$('prev').onclick = () => go(-1); $('next').onclick = () => go(1); $('like').onclick = like;
addEventListener('keydown', e => { if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if(e.key === 'ArrowRight') go(1); else if(e.key === 'ArrowLeft') go(-1); });
(function(){ let x0 = null; const sl = $('slide');
  sl.addEventListener('pointerdown', e => { x0 = e.clientX; });
  sl.addEventListener('pointerup', e => { if(x0 !== null && Math.abs(e.clientX - x0) > 50) go(e.clientX < x0 ? 1 : -1); x0 = null; });
})();
CMDS.unshift([/\b(next|forward)\b/, () => { go(1); return 'Next'; }], [/\b(previous|back)\b/, () => { go(-1); return 'Previous'; }], [/\blike\b|heart/, () => like()]);
$('gain').addEventListener('input', e => { $('gainLbl').textContent = 'Head sensitivity: ' + (+e.target.value).toFixed(1) + '×'; });
$('recenter').addEventListener('click', () => { tx = innerWidth / 2; ty = innerHeight / 2; log('Gaze re-centered'); });
$('quest').innerHTML = QUEST.map(m => '<li data-q="' + m + '">' + MODES[m].icon + ' ' + MODES[m].label + '</li>').join('');
paintSlide();

// ---- Editable communication board (saved in localStorage) ----
const DEFAULT_PHRASES = ['Yes','No','I need help','Thank you','Water please','Please call my family'];
let phrases = DEFAULT_PHRASES.slice();
try{ const saved = JSON.parse(load('ui-phrases')); if(Array.isArray(saved) && saved.length) phrases = saved; }catch(e){}
const esc = t => t.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function paintTiles(){ $('tiles').innerHTML = phrases.map(p => '<button class="tile" type="button" data-say="' + esc(p) + '">' + esc(p) + '</button>').join(''); }
function savePhrases(){ store('ui-phrases', JSON.stringify(phrases)); paintTiles(); }
function addPhrase(){ const v = $('newPhrase').value.trim().slice(0, 40); if(!v || phrases.length >= 10 || phrases.includes(v)) return; phrases.push(v); $('newPhrase').value = ''; savePhrases(); log('Phrase added: ' + v); }
$('addPhrase').addEventListener('click', addPhrase);
$('newPhrase').addEventListener('keydown', e => { if(e.key === 'Enter') addPhrase(); });
$('removePhrase').addEventListener('click', () => { if(phrases.length > 1){ log('Phrase removed: ' + phrases.pop()); savePhrases(); } });
$('resetPhrases').addEventListener('click', () => { phrases = DEFAULT_PHRASES.slice(); savePhrases(); log('Phrases reset'); });
paintTiles();
