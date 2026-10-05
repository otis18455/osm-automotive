// Gedeelde header + footer. Bedrijfsgegevens zijn nog voorbeeldgegevens: pas ze hier aan.
const CONTACT = { adres: 'Voorbeeldstraat 1, 0000 Plaatsnaam', tel: '+32 000 00 00 00', mail: 'info@voorbeeld.be' };
const NAV = [
  ['Home', 'index.html'],
  ['Ons aanbod', 'aanbod.html'],
  ['Auto verkopen', 'verkopen.html'],
  // ['Werkwijze', 'werkwijze.html'],  // pagina staat klaar, tijdelijk uit het menu gehaald
  ['Over ons', 'over-ons.html'],
  ['Contact', 'contact.html'],
];
const ICON = {
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
};
const page = location.pathname.split('/').pop() || 'index.html';
const links = cls => NAV.map(([t, h]) => `<a href="${h}" class="${cls && h === page ? 'active' : ''}">${t}</a>`).join('');
const PH = '<span class="ph">Voorbeeld</span>';

// favicon en themakleur voor alle pagina's
[['icon', 'logo.jpg'], ['apple-touch-icon', 'logo.jpg']].forEach(([rel, href]) => { const l = document.createElement('link'); l.rel = rel; l.href = href; document.head.appendChild(l); });
const tc = document.createElement('meta'); tc.name = 'theme-color'; tc.content = '#0a0a0b'; document.head.appendChild(tc);
document.querySelector('main')?.setAttribute('id', 'main');

document.getElementById('site-header').innerHTML = `
<a class="skip" href="#main">Ga naar de inhoud</a>
<header class="site">
  <div class="wrap">
    <a href="index.html" class="logo"><img src="logo.jpg" width="1338" height="448" alt="OSM Automotive – Quality Cars | Trusted Deals"></a>
    <nav class="main">${links(true)}</nav>
    <a href="verkopen.html" class="btn btn-primary head-cta">Auto aanbieden</a>
    <button class="burger" id="menuBtn" aria-label="Menu" aria-expanded="false">${ICON.menu}</button>
  </div>
  <div class="mobile-menu" id="mobileMenu">${links(false)}<a href="verkopen.html" class="btn btn-primary">Auto aanbieden</a></div>
</header>`;

document.getElementById('site-footer').innerHTML = `
<footer class="site">
  <div class="wrap foot">
    <div><img src="logo.jpg" width="1338" height="448" alt="OSM Automotive"><p>Uw betrouwbare auto-koper en verkoper.<br>Quality Cars | Trusted Deals.</p></div>
    <div><h4>Pagina's</h4><ul>${NAV.map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
    <div><h4>Contact ${PH}</h4><ul><li>${CONTACT.adres}</li><li>${CONTACT.tel}</li><li><a href="mailto:${CONTACT.mail}">${CONTACT.mail}</a></li></ul></div>
  </div>
  <div class="wrap copy"><span>© ${new Date().getFullYear()} OSM Automotive. Alle rechten voorbehouden.</span><span class="legal-links"><a href="privacy.html">Privacybeleid</a><a href="#" data-cookie-open>Cookie-instellingen</a></span></div>
</footer>`;

const btn = document.getElementById('menuBtn');
const menu = document.getElementById('mobileMenu');
const setMenu = open => { menu.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); };
btn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
window.addEventListener('resize', () => { if (innerWidth >= 1024) setMenu(false); });

// ---------- cookiemelding ----------
// De keuze wordt 6 maanden onthouden. Gebruik osmCookies.allowed() om te controleren of extra cookies (bijv. statistieken) aan mogen.
const osmCookies = (() => {
  const KEY = 'osm-cookie-keuze', MAX_AGE = 1000 * 60 * 60 * 24 * 182;
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && Date.now() - v.t < MAX_AGE ? v : null; } catch { return null; } };
  const save = value => { try { localStorage.setItem(KEY, JSON.stringify({ value, t: Date.now() })); } catch {} document.dispatchEvent(new CustomEvent('cookie-keuze', { detail: value })); };
  let el = null;
  const close = () => { if (!el) return; el.classList.remove('show'); const e = el; setTimeout(() => e.remove(), 250); el = null; };
  const open = () => {
    if (el) return;
    el = document.createElement('div');
    el.className = 'cookiebar'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Cookie-instellingen'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="cookiebar-text">
        <strong>Wij respecteren uw privacy</strong>
        <p>Wij gebruiken alleen noodzakelijke opslag zodat de website goed werkt. Met uw toestemming mogen wij later ook anonieme statistieken gebruiken om de site te verbeteren. Lees ons <a href="privacy.html">privacybeleid</a>.</p>
      </div>
      <div class="cookiebar-btns">
        <button type="button" class="btn btn-ghost" data-c="necessary">Alleen noodzakelijk</button>
        <button type="button" class="btn btn-primary" data-c="accepted">Alles accepteren</button>
      </div>`;
    el.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { save(b.dataset.c); close(); } });
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
  };
  const c = read();
  if (!c) setTimeout(open, 600);
  document.addEventListener('click', e => { if (e.target.closest('[data-cookie-open]')) { e.preventDefault(); open(); } });
  return { allowed: () => (read() || {}).value === 'accepted', choice: () => (read() || {}).value || null, open };
})();
