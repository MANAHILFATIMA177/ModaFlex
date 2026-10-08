/* Startup: restore saved settings and pick the initial mode */
// Init: restore settings and use the device's primary pointer as the starting guess
(function init(){
  const sc = load('ui-scale'); if(sc){ $('scale').value = sc; document.documentElement.style.setProperty('--scale', sc + '%'); }
  const th = load('ui-theme'); if(th) document.documentElement.dataset.theme = th;
  const coarse = signals();
  current = coarse ? 'touch' : 'mouse';
  render(current);
  log('Started in ' + MODES[current].label + ' mode (primary pointer is ' + (coarse ? 'coarse' : 'fine') + ')');
  const ov = load('ui-override');
  if(ov && ov !== 'auto'){ document.querySelector('#seg [data-m="' + ov + '"]').click(); }
})();
