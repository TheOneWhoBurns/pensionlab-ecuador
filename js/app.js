var WHATSAPP_NUMBER = '593990000000';
var WHATSAPP_MSG = 'Hola, quiero consultar sobre mi jubilación patronal.';

var leadData = {};

var mortalityCoef = {
  M: { 55:180,56:175,57:170,58:165,59:160,60:155,61:150,62:145,63:140,64:135,65:130,66:125,67:120,68:115,69:110,70:105,71:100,72:95,73:90,74:85,75:80,76:75,77:70,78:65,79:60,80:55 },
  F: { 55:195,56:190,57:185,58:180,59:175,60:170,61:165,62:160,63:155,64:150,65:145,66:140,67:135,68:130,69:125,70:120,71:115,72:110,73:105,74:100,75:95,76:90,77:85,78:80,79:75,80:70 }
};

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

function calcRapida(years, salary) {
  var a = salary * 12, fr = salary * years;
  return { low: fr * 0.30 + 0.05 * a * years, high: fr + 0.05 * a * years };
}

function calcDetallada(d) {
  var ingreso = new Date(d.ingreso);
  var salida  = d.aunTrabaja ? new Date() : new Date(d.salida);
  var yrs     = yearsBetween(ingreso, salida);
  var age     = Math.floor(yearsBetween(new Date(d.dob), salida));
  var sal     = parseFloat(d.salary) || (leadData.salary || 1000);
  var fr      = sal * yrs;
  var ded     = d.fondo === 'depositado' ? 0.30 : d.fondo === 'mensual' ? 0.50 : 1.0;
  var haber   = fr * ded + 0.05 * sal * 12 * yrs;
  var eligible = yrs >= 25 || (yrs >= 20 && d.motivo === 'despido');
  return {
    yrs: Math.round(yrs * 10) / 10,
    fondoGlobal: haber,
    pension: haber / coef(age, d.sexo),
    eligible: eligible,
    eligType: yrs >= 25 ? '25+ años — cualquier desvinculación' : '20+ años — despido intempestivo'
  };
}

function validate(id) {
  var el = document.getElementById(id), ok = true;
  el.querySelectorAll('[required]').forEach(function(f) {
    f.classList.remove('error');
    if (!f.value.trim()) { f.classList.add('error'); ok = false; }
  });
  return ok;
}

function save(tier, data) {
  Object.assign(leadData, data);
  localStorage.setItem('pl_lead_t' + tier, JSON.stringify(data));
  console.log('[PensionLab] Tier', tier, data);
}

function showResult(id) {
  var el = document.getElementById(id);
  el.style.maxHeight = '0';
  el.style.overflow = 'hidden';
  el.style.transition = 'max-height 0.6s ease';
  el.style.display = 'block';
  requestAnimationFrame(function() { el.style.maxHeight = '800px'; });
  setTimeout(function() { el.scrollIntoView({behavior:'smooth', block:'nearest'}); }, 100);
}

/* ── FORM 1: Estimación Rápida ── */
function submitRapida(e) {
  e.preventDefault();
  if (!validate('form-rapida')) return;
  var hp = document.getElementById('hp1');
  if (hp && hp.value) return;
  var years  = parseFloat(document.getElementById('f1_years').value) || 0;
  var salary = parseFloat(document.getElementById('f1_salary').value) || 0;
  if (years < 1 || salary < 1) return;
  var data = {
    name: document.getElementById('f1_name').value.trim(),
    whatsapp: document.getElementById('f1_wa').value.trim(),
    years: years, salary: salary
  };
  save(1, data);
  if (typeof trackLead === 'function') trackLead(data);
  var r = calcRapida(years, salary);
  document.getElementById('r1_range').textContent = usd(r.low) + ' — ' + usd(r.high);
  showResult('result-rapida');
}

/* ── FORM 2: Estimación Detallada ── */
function toggleStillWorking() {
  var cb  = document.getElementById('f2_still');
  var end = document.getElementById('f2_salida');
  var mot = document.getElementById('f2_motivo');
  if (cb.checked) {
    end.disabled = true; end.value = ''; end.removeAttribute('required');
    mot.disabled = true; mot.value = '';
  } else {
    end.disabled = false; end.setAttribute('required','');
    mot.disabled = false;
  }
}

function submitDetallada(e) {
  e.preventDefault();
  if (!validate('form-detallada')) return;
  var data = {
    salary:     parseFloat(document.getElementById('f2_salary').value) || (leadData.salary || 1000),
    dob:        document.getElementById('f2_dob').value,
    sexo:       document.getElementById('f2_sexo').value,
    employer:   document.getElementById('f2_employer').value.trim(),
    ingreso:    document.getElementById('f2_ingreso').value,
    salida:     document.getElementById('f2_salida').value,
    aunTrabaja: document.getElementById('f2_still').checked,
    motivo:     document.getElementById('f2_motivo').value,
    fondo:      document.getElementById('f2_fondo').value,
    modalidad:  document.getElementById('f2_modalidad').value
  };
  save(2, data);
  if (typeof trackFormStep2 === 'function') trackFormStep2({employer: data.employer});
  var r = calcDetallada(data);
  var elig = document.getElementById('r2_elig');
  elig.textContent = r.eligible ? '✓ Califica: ' + r.eligType : '⚠ Posiblemente no cumple los requisitos mínimos. Le recomendamos una consulta.';
  elig.style.color = r.eligible ? '#25D366' : '#cc8833';
  document.getElementById('r2_years').textContent   = r.yrs + ' años de servicio calculados';
  document.getElementById('r2_global').textContent  = usd(r.fondoGlobal);
  document.getElementById('r2_pension').textContent = usd(r.pension) + '/mes';
  showResult('result-detallada');
}

/* ── FORM 3: Enviar Mi Caso ── */
function buildYears() {
  var c = document.getElementById('f3_years');
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
  if (!validate('form-caso')) return;
  var ced = document.getElementById('f3_cedula').value.trim();
  var ruc = document.getElementById('f3_ruc').value.trim();
  if (!/^\d{10}$/.test(ced)) { document.getElementById('f3_cedula').classList.add('error'); return; }
  if (!/^\d{13}$/.test(ruc)) { document.getElementById('f3_ruc').classList.add('error'); return; }
  var breakdown = [];
  document.querySelectorAll('#f3_years .year-block').forEach(function(b) {
    breakdown.push({
      base: parseFloat(b.querySelector('.yr-base').value)||0,
      com:  parseFloat(b.querySelector('.yr-com').value)||0,
      ext:  parseFloat(b.querySelector('.yr-ext').value)||0
    });
  });
  var data = {
    cedula: ced, email: document.getElementById('f3_email').value.trim(), ruc: ruc,
    breakdown: breakdown,
    docs: {
      contrato:  document.getElementById('f3_contrato').value,
      roles:     document.getElementById('f3_roles').value,
      aviso:     document.getElementById('f3_aviso').value,
      finiquito: document.getElementById('f3_finiquito').value
    }
  };
  save(3, data);
  if (typeof trackFormComplete === 'function') trackFormComplete();
  document.getElementById('form-caso-fields').style.display = 'none';
  showResult('result-caso');
}

/* ── WhatsApp ── */
function openWhatsApp(src) {
  if (typeof trackWhatsAppClick === 'function') trackWhatsAppClick(src);
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(WHATSAPP_MSG), '_blank');
}

/* ── Sidebar ── */
function toggleSidebar() {
  var sb  = document.getElementById('sidebar');
  var ov  = document.getElementById('sidebar-overlay');
  var open = sb.classList.toggle('open');
  ov.classList.toggle('visible', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
  document.body.style.overflow = '';
}

function scrollTo(id) {
  closeSidebar();
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

/* ── Scroll reveal ── */
function initReveal() {
  var els = document.querySelectorAll('.reveal');
  var io  = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, {threshold: 0.12});
  els.forEach(function(el) { io.observe(el); });
}

/* ── Stats counter ── */
function initCounters() {
  var els = document.querySelectorAll('.stat-num[data-target]');
  var io  = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (!e.isIntersecting) return;
      var el  = e.target;
      var end = parseFloat(el.dataset.target);
      var pfx = el.dataset.prefix || '';
      var sfx = el.dataset.suffix || '';
      var dur = 1400, step = 16, steps = dur / step;
      var cur = 0, inc = end / steps;
      var t = setInterval(function() {
        cur = Math.min(cur + inc, end);
        el.textContent = pfx + (Number.isInteger(end) ? Math.round(cur) : cur.toFixed(0)) + sfx;
        if (cur >= end) clearInterval(t);
      }, step);
      io.unobserve(el);
    });
  }, {threshold: 0.5});
  els.forEach(function(el) { io.observe(el); });
}

/* ── Nav scroll shadow ── */
document.addEventListener('DOMContentLoaded', function() {
  var nav = document.querySelector('.nav');
  window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
  buildYears();
  initReveal();
  initCounters();
  if (typeof trackPageView === 'function') trackPageView();
});
