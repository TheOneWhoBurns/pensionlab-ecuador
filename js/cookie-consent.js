var GTM_ID = 'GTM-XXXXXXX';

function getConsent() {
  return localStorage.getItem('pl_cookie_consent');
}

function setConsent(value) {
  localStorage.setItem('pl_cookie_consent', value);
}

function loadGTM() {
  if (document.getElementById('gtm-script')) return;
  var s = document.createElement('script');
  s.id = 'gtm-script';
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
}

function showBanner() {
  var banner = document.getElementById('cookie-banner');
  if (banner) {
    setTimeout(function() { banner.classList.add('visible'); }, 1000);
  }
}

function hideBanner() {
  var banner = document.getElementById('cookie-banner');
  if (banner) banner.classList.remove('visible');
}

function acceptCookies() {
  setConsent('accepted');
  hideBanner();
  loadGTM();
}

function rejectCookies() {
  setConsent('rejected');
  hideBanner();
}

function initConsent() {
  var consent = getConsent();
  if (consent === 'accepted') {
    loadGTM();
  } else if (!consent) {
    showBanner();
  }
}

document.addEventListener('DOMContentLoaded', initConsent);
