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
function usd(val) {
  return 'USD $' + val.toLocaleString('es-EC', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function yearsBetween(d1, d2) {
  return Math.max(0, (d2 - d1) / (365.25 * 864e5));
}
function el(id) { return document.getElementById(id); }
function setText(id, val) { el(id).textContent = val; }
function val(id) { return el(id).value; }

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

function validateField(id, regex) {
  var f = el(id);
  var ok = regex.test(f.value.trim());
  f.classList.toggle('error', !ok);
  return ok;
}

function save(tier, data) {
  Object.assign(leadData, data);
  localStorage.setItem('pl_lead_t' + tier, JSON.stringify(leadData));
  console.log('[PensionLab] Tier', tier, data);
}

function showResult(id) {
  var panel = el(id);
  panel.style.display = 'block';
  panel.style.overflow = 'hidden';
  panel.style.transition = 'max-height 0.6s ease';
  panel.style.maxHeight = '0';
  requestAnimationFrame(function() {
    panel.style.maxHeight = panel.scrollHeight + 'px';
  });
  setTimeout(function() { panel.scrollIntoView({behavior:'smooth', block:'nearest'}); }, 100);
}

/* ── Sidebar ── */
function setSidebar(open) {
  el('sidebar').classList.toggle('open', open);
  el('sidebar-overlay').classList.toggle('visible', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function toggleSidebar() { setSidebar(!el('sidebar').classList.contains('open')); }
function closeSidebar()   { setSidebar(false); }

function scrollTo(id) {
  closeSidebar();
  var target = el(id);
  if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
}

/* ── WhatsApp ── */
function openWhatsApp(src) {
  if (typeof trackWhatsAppClick === 'function') trackWhatsAppClick(src);
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(WHATSAPP_MSG), '_blank');
}

/* ── Form 1: Estimación Rápida ── */
function submitRapida(e) {
  e.preventDefault();
  if (!validate('form-rapida-form')) return;
  if (el('hp1') && el('hp1').value) return;
  var years  = parseFloat(val('f1_years'))  || 0;
  var salary = parseFloat(val('f1_salary')) || 0;
  if (years < 1 || salary < 1) return;
  var data = { name: val('f1_name').trim(), whatsapp: val('f1_wa').trim(), years: years, salary: salary };
  save(1, data);
  if (typeof trackLead === 'function') trackLead(data);
  var r = calcRapida(years, salary);
  setText('r1_range', usd(r.low) + ' — ' + usd(r.high));
  showResult('result-rapida');
}

/* ── Form 2: Estimación Detallada ── */
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
  if (!validate('form-detallada-form')) return;
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
  save(2, data);
  if (typeof trackFormStep2 === 'function') trackFormStep2({employer: data.employer});
  var r = calcDetallada(data);
  var elig = el('r2_elig');
  elig.textContent = r.eligible
    ? '✓ Califica: ' + r.eligType
    : '⚠ Posiblemente no cumple los requisitos mínimos. Le recomendamos una consulta.';
  elig.style.color = r.eligible ? '#25D366' : '#cc8833';
  setText('r2_years',  r.yrs + ' años de servicio calculados');
  setText('r2_global', usd(r.fondoGlobal));
  setText('r2_pension', usd(r.pension) + '/mes');
  showResult('result-detallada');
}

/* ── Form 3: Enviar Mi Caso ── */
function buildYears() {
  var c = el('f3_years');
  if (c.children.length) return;
  var yr = new Date().getFullYear();
  for (var i = 0; i < 5; i++) {
    var y = yr - 1 - i;
    var d = document.createElement('div');
    d.className = 'year-block';
    d.innerHTML =
      '<div class="year-header"><span class="year-badge">Año ' + y + '</span></div>' +
      '<div class="form-row cols3">' +
        '<div class="fgroup"><label>Sueldo base</label><input type="number" class="yr-base" placeholder="0.00" min="0" step="0.01"></div>' +
        '<div class="fgroup"><label>Comisiones</label><input type="number" class="yr-com" placeholder="0.00" min="0" step="0.01"></div>' +
        '<div class="fgroup"><label>Horas extra</label><input type="number" class="yr-ext" placeholder="0.00" min="0" step="0.01"></div>' +
      '</div>';
    c.appendChild(d);
  }
}

function submitCaso(e) {
  e.preventDefault();
  if (!validate('form-caso-form')) return;
  if (!validateField('f3_cedula', /^\d{10}$/)) return;
  if (!validateField('f3_ruc', /^\d{13}$/)) return;
  var breakdown = [];
  document.querySelectorAll('#f3_years .year-block').forEach(function(b) {
    breakdown.push({
      base: parseFloat(b.querySelector('.yr-base').value) || 0,
      com:  parseFloat(b.querySelector('.yr-com').value)  || 0,
      ext:  parseFloat(b.querySelector('.yr-ext').value)  || 0
    });
  });
  var data = {
    cedula: val('f3_cedula').trim(),
    email:  val('f3_email').trim(),
    ruc:    val('f3_ruc').trim(),
    breakdown: breakdown,
    docs: {
      contrato:  val('f3_contrato'),
      roles:     val('f3_roles'),
      aviso:     val('f3_aviso'),
      finiquito: val('f3_finiquito')
    }
  };
  save(3, data);
  if (typeof trackFormComplete === 'function') trackFormComplete();
  el('form-caso-fields').style.display = 'none';
  showResult('result-caso');
}

/* ── Scroll reveal (single shared observer) ── */
function observe(selector, onIntersect, options) {
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) { onIntersect(entry.target, io); io.unobserve(entry.target); }
    });
  }, options);
  document.querySelectorAll(selector).forEach(function(el) { io.observe(el); });
}

function initReveal() {
  observe('.reveal', function(target) { target.classList.add('visible'); }, {threshold: 0.12});
}

function initCounters() {
  observe('.stat-num[data-target]', function(target) {
    var end = parseFloat(target.dataset.target);
    var pfx = target.dataset.prefix || '';
    var sfx = target.dataset.suffix || '';
    var steps = 1400 / 16, cur = 0, inc = end / steps;
    var t = setInterval(function() {
      cur = Math.min(cur + inc, end);
      target.textContent = pfx + Math.round(cur) + sfx;
      if (cur >= end) clearInterval(t);
    }, 16);
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
  buildYears();
  initReveal();
  initCounters();
  if (typeof trackPageView === 'function') trackPageView();
});
