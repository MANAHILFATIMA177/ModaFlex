/* Voice: Web Speech API recognition + spoken replies and command table */
// Voice control (Web Speech API)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, listening = false;
function say(t){ if(!$('speak').checked || !('speechSynthesis' in window)) return; try{ speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(t)); }catch(e){} }
function heard(html){ $('heard').innerHTML = html; }
function setTheme(t){ document.documentElement.dataset.theme = t; store('ui-theme', t); }
function setScale(d){ const v = Math.min(140, Math.max(85, +$('scale').value + d)); $('scale').value = v; $('scale').dispatchEvent(new Event('input')); return v; }
function press(act){ document.querySelector('[data-act="' + act + '"]').click(); return act; }
function setSwitch(on){ const s = $('sw'); if((s.getAttribute('aria-checked') === 'true') !== on) s.click(); return 'Notifications ' + (on ? 'on' : 'off'); }

const CMDS = [
  [/stop listening|turn off (the )?mic/, () => { stopVoice(); return 'Stopped listening'; }],
  [/help|commands/, () => 'Try touch mode, mouse mode, keyboard mode, dark mode, text bigger, save, delete, notifications on, or clear log'],
  [/touch mode/, () => { chooseMode('touch'); return 'Touch mode'; }],
  [/mouse mode/, () => { chooseMode('mouse'); return 'Mouse mode'; }],
  [/keyboard mode/, () => { chooseMode('keyboard'); return 'Keyboard mode'; }],
  [/voice mode/, () => { chooseMode('voice'); return 'Voice mode'; }],
  [/auto/, () => { chooseMode('auto'); return 'Automatic detection'; }],
  [/dark/, () => { setTheme('dark'); return 'Dark theme'; }],
  [/light/, () => { setTheme('light'); return 'Light theme'; }],
  [/bigger|larger|increase/, () => 'Text size ' + setScale(10) + ' percent'],
  [/smaller|decrease/, () => 'Text size ' + setScale(-10) + ' percent'],
  [/save/, () => press('Saved')],
  [/draft/, () => press('Draft created')],
  [/delete/, () => press('Deleted')],
  [/notifications? on|turn on notifications?/, () => setSwitch(true)],
  [/notifications? off|turn off notifications?/, () => setSwitch(false)],
  [/clear (the )?log/, () => { $('clear').click(); return 'Log cleared'; }]
];

function runCommand(text){
  const t = text.toLowerCase().trim();
  const hit = CMDS.find(c => c[0].test(t));
  if(!hit){ heard('Heard <b>' + t.replace(/</g,'&lt;') + '</b>. No matching command. Say "help".'); log('Voice: unrecognised "' + t + '"'); say('Sorry, I did not catch a command'); return; }
  const reply = hit[1]();
  heard('Heard <b>' + t.replace(/</g,'&lt;') + '</b>');
  log('Voice command: "' + t + '"');
  if(reply) say(reply);
}

function setMicUI(on){ const m = $('mic'); m.classList.toggle('on', on); m.setAttribute('aria-pressed', on); m.textContent = on ? '⏹ Stop listening' : '🎙️ Start listening'; }

function startVoice(){
  if(!SR) return;
  rec = new SR(); rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true;
  rec.onresult = e => {
    for(let i = e.resultIndex; i < e.results.length; i++){
      const r = e.results[i], txt = r[0].transcript;
      if(r.isFinal) runCommand(txt); else heard('Listening… ' + txt.replace(/</g,'&lt;'));
    }
  };
  rec.onerror = e => {
    if(e.error === 'not-allowed' || e.error === 'service-not-allowed'){ heard('Microphone blocked. Allow mic access for this page in your browser, then try again.'); stopVoice(); }
    else if(e.error !== 'no-speech' && e.error !== 'aborted'){ log('Voice error: ' + e.error); }
  };
  rec.onend = () => { if(listening){ try{ rec.start(); }catch(err){} } };
  try{ rec.start(); }catch(err){ return; }
  listening = true; setMicUI(true);
  heard('Listening… say "help" for commands.');
  setMode('voice', 'microphone on');
  log('Microphone on');
}
function stopVoice(){
  listening = false; setMicUI(false);
  try{ rec && rec.stop(); }catch(e){}
  heard('Microphone off.');
  log('Microphone off');
  if(override === 'auto' && current === 'voice') setMode(matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse', 'microphone off');
}
$('mic').addEventListener('click', () => listening ? stopVoice() : startVoice());
if(!SR){ $('mic').disabled = true; heard('Voice commands need Chrome, Edge or Safari with microphone access.'); }
