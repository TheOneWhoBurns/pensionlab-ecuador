var WHATSAPP_NUMBER = '593990000000';
var WHATSAPP_MSG = 'Hola, quiero consultar sobre mi jubilación patronal.';

var leadData = {};

/* ── Utilities ── */
function usd(n) {
  return 'USD $' + n.toLocaleString('es-EC', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function el(id) { return document.getElementById(id); }
function setText(id, v) { el(id).textContent = v; }
function val(id) { return el(id).value; }
function isHoneypot(hpId) { return el(hpId) && el(hpId).value; }
function saveLead(tier, data) {
  Object.assign(leadData, data);
  localStorage.setItem('pl_lead_t' + tier, JSON.stringify(leadData));
  console.log('[PensionLab] Tier', tier, data);
  if (typeof trackLead === 'function') trackLead(data);
}

/* ── Calculator ── */
function calcRapida(years, salary) {
  var a = salary * 12, fr = salary * years;
  return { low: fr * 0.30 + 0.05 * a * years, high: fr + 0.05 * a * years };
}

/* ── Form helpers ── */
function validate(id) {
  var form = el(id), ok = true;
  form.querySelectorAll('[required]').forEach(function(f) {
    f.classList.remove('error');
    if (!f.value.trim()) { f.classList.add('error'); ok = false; }
  });
  return ok;
}

function showResult(id) {
  var panel = el(id);
  panel.style.cssText += ';display:block;overflow:hidden;transition:max-height 0.6s ease;max-height:0';
  requestAnimationFrame(function() {
    panel.style.maxHeight = panel.scrollHeight + 'px';
    panel.addEventListener('transitionend', function handler() {
      panel.removeEventListener('transitionend', handler);
      panel.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  });
}

/* ── Sidebar ── */
function setSidebar(open) {
  el('sidebar').classList.toggle('open', open);
  el('sidebar-overlay').classList.toggle('visible', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function toggleSidebar() { setSidebar(!el('sidebar').classList.contains('open')); }
function closeSidebar()   { setSidebar(false); }

function jumpTo(id) {
  closeSidebar();
  var target = el(id);
  if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
}

/* ── WhatsApp ── */
function openWhatsApp(src) {
  if (typeof trackWhatsAppClick === 'function') trackWhatsAppClick(src);
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(WHATSAPP_MSG), '_blank');
}

/* ── Form: Estimación Rápida ── */
function submitRapida(e) {
  e.preventDefault();
  if (!validate('form-rapida-form') || isHoneypot('hp1')) return;
  var years  = parseFloat(val('f1_years'))  || 0;
  var salary = parseFloat(val('f1_salary')) || 0;
  if (years < 1 || salary < 1) return;
  var data = { name: val('f1_name').trim(), whatsapp: val('f1_wa').trim(), years: years, salary: salary };
  saveLead(1, data);
  var r = calcRapida(years, salary);
  setText('r1_range', usd(r.low) + ' — ' + usd(r.high));
  showResult('result-rapida');
}

/* ── Scroll reveal (single shared observer) ── */
function observe(selector, onIntersect, options) {
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) { onIntersect(entry.target, io); io.unobserve(entry.target); }
    });
  }, options);
  document.querySelectorAll(selector).forEach(function(e) { io.observe(e); });
}

function initReveal() {
  observe('.reveal', function(target) { target.classList.add('visible'); }, {threshold: 0.12});
}

function initCounters() {
  observe('.stat-num[data-target]', function(target) {
    var end = parseFloat(target.dataset.target);
    var pfx = target.dataset.prefix || '';
    var sfx = target.dataset.suffix || '';
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var prog = Math.min((ts - start) / dur, 1);
      target.textContent = pfx + Math.round(prog * end) + sfx;
      if (prog < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, {threshold: 0.5});
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', function() {
  var nav = document.querySelector('.nav');
  var ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        nav.classList.toggle('scrolled', window.scrollY > 50);
        ticking = false;
      });
      ticking = true;
    }
  }, {passive: true});
  initReveal();
  initCounters();
  if (typeof trackPageView === 'function') trackPageView();
});
