window.dataLayer = window.dataLayer || [];

function pushEvent(eventName, params) {
  params = params || {};
  params.event = eventName;
  window.dataLayer.push(params);
}

function trackPageView() {
  pushEvent('page_view');
}

function trackLead(data) {
  pushEvent('generate_lead', {
    event_category: 'form',
    event_label: 'tier1_quick_estimate',
    lead_years: data.years,
    lead_salary: data.salary
  });
}

function trackFormStep2(data) {
  pushEvent('form_step2_complete', {
    event_category: 'form',
    event_label: 'tier2_detailed_estimate',
    employer_name: data.employerName
  });
}

function trackFormComplete() {
  pushEvent('form_complete', {
    event_category: 'form',
    event_label: 'tier3_full_case'
  });
}

function trackWhatsAppClick(source) {
  pushEvent('whatsapp_click', {
    event_category: 'engagement',
    event_label: source || 'floating_button'
  });
}
