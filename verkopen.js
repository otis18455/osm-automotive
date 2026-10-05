const form = document.getElementById('form');
const $ = s => document.querySelector(s);

// bouwjaar-opties
const yr = new Date().getFullYear();
for (let y = yr; y >= 1995; y--) form.bouwjaar.add(new Option(y, y));

// gegevens uit de url overnemen (bijv. vanaf de home)
const qs = new URLSearchParams(location.search);
['merk', 'model', 'km'].forEach(k => { if (qs.get(k)) form[k].value = qs.get(k); });
if (qs.get('bouwjaar')) { const o = [...form.bouwjaar.options].find(o => o.value === qs.get('bouwjaar')); if (o) form.bouwjaar.value = o.value; }

// ---------- concept bewaren (alleen in deze browser, tot het tabblad sluit) ----------
const DRAFT = 'osm-aanvraag';
const draftFields = () => [...form.elements].filter(e => e.name && !['photos', 'website', 'akkoord'].includes(e.name));
try {
  const saved = JSON.parse(sessionStorage.getItem(DRAFT) || 'null');
  if (saved && ![...qs.keys()].length) draftFields().forEach(e => { if (saved[e.name] != null) e.value = saved[e.name]; });
} catch {}
form.addEventListener('input', () => {
  try { sessionStorage.setItem(DRAFT, JSON.stringify(Object.fromEntries(draftFields().map(e => [e.name, e.value])))); } catch {}
});

// ---------- foto's ----------
const MAX_PHOTOS = 6, MAX_MB = 8;
const photoMsg = $('#photoMsg'), thumbs = $('#thumbs'), drop = $('#drop');
let photos = [];
const say = (t, cls = '') => { photoMsg.textContent = t; photoMsg.className = 'plate-msg ' + cls; };

function syncInput() {
  const dt = new DataTransfer();
  photos.forEach(p => dt.items.add(p.file));
  form.photos.files = dt.files;
}
function renderThumbs() {
  thumbs.innerHTML = '';
  photos.forEach((p, i) => {
    const w = document.createElement('div'); w.className = 'thumb';
    const img = document.createElement('img'); img.src = p.url; img.alt = 'Foto ' + (i + 1);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'thumb-x'; b.setAttribute('aria-label', 'Foto ' + (i + 1) + ' verwijderen'); b.textContent = '×';
    b.addEventListener('click', () => { URL.revokeObjectURL(p.url); photos.splice(i, 1); syncInput(); renderThumbs(); say(photos.length ? photos.length + ' van ' + MAX_PHOTOS + " foto's toegevoegd." : ''); });
    w.append(img, b); thumbs.appendChild(w);
  });
}
function addFiles(list) {
  const skipped = [];
  for (const f of list) {
    if (!/^image\//.test(f.type)) { skipped.push(f.name + ' is geen afbeelding'); continue; }
    if (f.size > MAX_MB * 1024 * 1024) { skipped.push(f.name + ' is groter dan ' + MAX_MB + ' MB'); continue; }
    if (photos.length >= MAX_PHOTOS) { skipped.push("maximaal " + MAX_PHOTOS + " foto's"); break; }
    if (photos.some(p => p.file.name === f.name && p.file.size === f.size)) continue;
    photos.push({ file: f, url: URL.createObjectURL(f) });
  }
  syncInput(); renderThumbs();
  if (skipped.length) say('Niet toegevoegd: ' + skipped.join(', ') + '.', 'bad');
  else say(photos.length ? photos.length + ' van ' + MAX_PHOTOS + " foto's toegevoegd." : '', 'ok');
}
form.photos.addEventListener('change', e => { addFiles([...e.target.files]); });
// slepen en neerzetten
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
drop.addEventListener('drop', e => addFiles([...e.dataTransfer.files]));

// ---------- validatie ----------
function check(el) {
  const fld = el.closest('.fld');
  const v = el.value.trim();
  let bad = false;
  if (el.type === 'checkbox') bad = el.required && !el.checked;
  else if (el.type === 'email') bad = !/^\S+@\S+\.\S+$/.test(v);
  else if (el.type === 'tel') bad = v !== '' && (v.replace(/\D/g, '').length < 8 || !/^[+()\d\s./-]+$/.test(v));
  else if (el.type === 'number') bad = el.required && (v === '' || Number(v) < Number(el.min || 0) || Number(v) > Number(el.max || Infinity));
  else bad = el.required && !v;
  fld.classList.toggle('bad', bad);
  return !bad;
}
const checkable = () => [...form.querySelectorAll('[required], [type=tel]')];
checkable().forEach(el => {
  el.addEventListener('blur', () => check(el));
  el.addEventListener('input', () => el.closest('.fld').classList.contains('bad') && check(el));
});
// km: geen negatieve of komma-invoer
form.km.addEventListener('keydown', e => { if (['e', 'E', '+', '-', ',', '.'].includes(e.key)) e.preventDefault(); });

// ---------- versturen ----------
const sendBtn = $('#submitBtn');
form.addEventListener('submit', e => {
  e.preventDefault();
  if (sendBtn.disabled) return; // dubbel klikken voorkomen
  if (form.website.value) return; // spamveld
  let ok = true, first = null;
  checkable().forEach(el => { if (!check(el)) { ok = false; first = first || el; } });
  if (!ok) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus({ preventScroll: true }); return; }

  sendBtn.disabled = true; sendBtn.textContent = 'Bezig met versturen…';
  const data = Object.fromEntries(new FormData(form).entries());
  delete data.website; delete data.photos;
  data.fotos = photos.length;

  // TODO e-mail: hier later het versturen koppelen (bijv. fetch naar Formspree of eigen server) en pas daarna de bedankpagina tonen.
  // Voor nu wordt er nog niets verstuurd.
  console.log('Aanvraag (nog niet verstuurd):', data);

  setTimeout(() => {
    try { sessionStorage.removeItem(DRAFT); } catch {}
    photos.forEach(p => URL.revokeObjectURL(p.url));
    $('#okAuto').textContent = [data.merk, data.model].filter(Boolean).join(' ');
    $('#okMail').textContent = data.email;
    $('#formArea').style.display = 'none';
    document.querySelector('.page-head').style.display = 'none';
    $('#success').classList.add('show');
    document.title = 'Bedankt – OSM Automotive';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 600);
});
