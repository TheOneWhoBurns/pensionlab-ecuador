var WHATSAPP_NUMBER = '593990000000';
var WHATSAPP_MSG = 'Hola, quiero consultar sobre mi jubilación patronal.';

var leadData = {};

var mortalityCoef = {
  M: { 55:180,56:175,57:170,58:165,59:160,60:155,61:150,62:145,63:140,64:135,65:130,66:125,67:120,68:115,69:110,70:105,71:100,72:95,73:90,74:85,75:80,76:75,77:70,78:65,79:60,80:55 },
  F: { 55:195,56:190,57:185,58:180,59:175,60:170,61:165,62:160,63:155,64:150,65:145,66:140,67:135,68:130,69:125,70:120,71:115,72:110,73:105,74:100,75:95,76:90,77:85,78:80,79:75,80:70 }
};

/* ── Utilities ── */
function coef(age, sex) {
  var t = mortalityCoef[sex] || mortalityCoef.M;
  return t[Math.min(80, Math.max(55, age))] || 150;
}
function usd(n) {
  return 'USD $' + n.toLocaleString('es-EC', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function yearsBetween(d1, d2) {
  return Math.max(0, (d2 - d1) / (365.25 * 864e5));
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

/* ── Calculators ── */
function calcRapida(years, salary) {
  var a = salary * 12, fr = salary * years;
  return { low: fr * 0.30 + 0.05 * a * years, high: fr + 0.05 * a * years };
}

function calcDetallada(d) {
  var ingreso = new Date(d.ingreso);
  var salida  = d.aunTrabaja ? new Date() : new Date(d.salida);
  var yrs     = yearsBetween(ingreso, salida);
  var age     = Math.floor(yearsBetween(new Date(d.dob), salida));
  var fr      = d.salary * yrs;
  var ded     = d.fondo === 'depositado' ? 0.30 : d.fondo === 'mensual' ? 0.50 : 1.0;
  var haber   = fr * ded + 0.05 * d.salary * 12 * yrs;
  var eligible = yrs >= 25 || (yrs >= 20 && d.motivo === 'despido');
  return {
    yrs: Math.round(yrs * 10) / 10,
    fondoGlobal: haber,
    pension: haber / coef(age, d.sexo),
    eligible: eligible,
    eligType: yrs >= 25 ? '25+ años — cualquier desvinculación' : '20+ años — despido intempestivo'
  };
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

/* ── Form version switcher ── */
var VERSION_CFG = [
  { form: 'form-minima',    sb: 'sb-a' },
  { form: 'form-rapida',    sb: 'sb-b' },
  { form: 'form-detallada', sb: 'sb-c' }
];
var currentVersion = null;
var demoNavBtns = null;

function initVersion(id) {
  currentVersion = id;
  VERSION_CFG.forEach(function(v) {
    var s = el(v.form);
    if (s) s.style.display = v.form === id ? '' : 'none';
    var sb = el(v.sb);
    if (sb) sb.classList.toggle('active', v.form === id);
  });
  if (demoNavBtns) demoNavBtns.forEach(function(btn, i) { btn.classList.toggle('active', VERSION_CFG[i].form === id); });
}

function switchVersion(id) {
  if (id === currentVersion) { closeSidebar(); return; }
  initVersion(id);
  closeSidebar();
  var target = el('formularios');
  if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
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

/* ── Form A: Captura Mínima ── */
function submitMinima() {
  if (!validate('form-minima-form') || isHoneypot('hp0')) return;
  var data = { name: val('fa_name').trim(), whatsapp: val('fa_wa').trim() };
  saveLead(1, data);
  showResult('result-minima');
}

/* ── Form B: Estimación Rápida ── */
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

/* ── Form C: Estimación Detallada ── */
function toggleStillWorking() {
  var checked = el('f2_still').checked;
  ['f2_salida', 'f2_motivo'].forEach(function(id) {
    var f = el(id);
    f.disabled = checked;
    f.value = '';
    if (id === 'f2_salida') {
      checked ? f.removeAttribute('required') : f.setAttribute('required', '');
    }
  });
}

function submitDetallada(e) {
  e.preventDefault();
  if (!validate('form-detallada-form') || isHoneypot('hp2')) return;
  var data = {
    salary:     parseFloat(val('f2_salary')) || leadData.salary || 1000,
    dob:        val('f2_dob'),
    sexo:       val('f2_sexo'),
    employer:   val('f2_employer').trim(),
    ingreso:    val('f2_ingreso'),
    salida:     val('f2_salida'),
    aunTrabaja: el('f2_still').checked,
    motivo:     val('f2_motivo'),
    fondo:      val('f2_fondo'),
    modalidad:  val('f2_modalidad')
  };
  Object.assign(leadData, data);
  localStorage.setItem('pl_lead_t2', JSON.stringify(leadData));
  console.log('[PensionLab] Tier 2', data);
  if (typeof trackFormStep2 === 'function') trackFormStep2({employerName: data.employer});
  var r = calcDetallada(data);
  var eligText = r.eligible
    ? '✓ Califica: ' + r.eligType
    : '⚠ Posiblemente no cumple los requisitos mínimos. Le recomendamos una consulta.';
  setText('r2_elig', eligText);
  el('r2_elig').style.color = r.eligible ? '#25D366' : '#cc8833';
  setText('r2_years',  r.yrs + ' años de servicio calculados');
  setText('r2_global', usd(r.fondoGlobal));
  setText('r2_pension', usd(r.pension) + '/mes');
  showResult('result-detallada');
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
  demoNavBtns = document.querySelectorAll('.demo-nav-btn');
  initVersion('form-minima');
  initReveal();
  initCounters();
  if (typeof trackPageView === 'function') trackPageView();
});
