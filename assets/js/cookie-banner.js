// verifydocs.online - GDPR & Indian DPDP Act 2023 Compliant Cookie Consent Banner
// Incorporating Google Consent Mode v2

(function () {
  // 1. Initialize Google Consent Mode v2 Default Settings
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  // Load saved preferences if any, otherwise default to denied
  const savedConsent = localStorage.getItem('verifydocs_cookie_consent');
  let consentState = {
    analytics: false,
    marketing: false
  };

  if (savedConsent) {
    try {
      consentState = JSON.parse(savedConsent);
    } catch (e) {
      console.error('Failed to parse cookie consent', e);
    }
  }

  // Apply default consent mode states immediately before loading tags
  window.gtag('consent', 'default', {
    'ad_storage': consentState.marketing ? 'granted' : 'denied',
    'analytics_storage': consentState.analytics ? 'granted' : 'denied',
    'ad_user_data': consentState.marketing ? 'granted' : 'denied',
    'ad_personalization': consentState.marketing ? 'granted' : 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted' // Essential for security
  });

  // Inject CSS Styles for Glassmorphic Banner and Modal
  const style = document.createElement('style');
  style.textContent = `
    .vd-cookie-banner {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      z-index: 99999;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 24px;
      color: #fff;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
      font-family: 'Inter', sans-serif;
      transition: all 0.3s ease-in-out;
      opacity: 0;
      transform: translateY(20px);
    }
    .vd-cookie-banner.show {
      opacity: 1;
      transform: translateY(0);
    }
    @media (min-width: 768px) {
      .vd-cookie-banner {
        max-width: 420px;
        left: auto;
      }
    }
    .vd-cookie-title {
      font-size: 16px;
      font-weight: 800;
      margin-bottom: 8px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .vd-cookie-desc {
      font-size: 13px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 20px;
    }
    .vd-cookie-desc a {
      color: #60a5fa;
      text-decoration: underline;
    }
    .vd-cookie-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .vd-cookie-btn {
      padding: 10px 16px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 12px;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      text-align: center;
    }
    .vd-cookie-btn-accept {
      background: #10b981;
      color: #fff;
    }
    .vd-cookie-btn-accept:hover {
      background: #059669;
    }
    .vd-cookie-btn-reject {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .vd-cookie-btn-reject:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .vd-cookie-manage-link {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      background: none;
      border: none;
      cursor: pointer;
      text-decoration: underline;
      display: block;
      width: 100%;
      text-align: center;
      margin-top: 8px;
    }
    .vd-cookie-manage-link:hover {
      color: #fff;
    }
    
    /* Preferences modal styles */
    .vd-cookie-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .vd-cookie-modal-overlay.show {
      display: flex;
    }
    .vd-cookie-modal {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      max-width: 480px;
      width: 100%;
      padding: 28px;
      font-family: 'Inter', sans-serif;
      color: #fff;
      box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6);
    }
    .vd-cookie-modal-title {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 16px;
    }
    .vd-cookie-option {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .vd-cookie-option-label {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .vd-cookie-option-desc {
      font-size: 11px;
      color: #94a3b8;
      max-width: 80%;
      line-height: 1.5;
    }
    .vd-cookie-toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .vd-cookie-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .vd-cookie-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: rgba(255, 255, 255, 0.1);
      transition: .3s;
      border-radius: 24px;
    }
    .vd-cookie-slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 4px;
      bottom: 4px;
      background-color: #cbd5e1;
      transition: .3s;
      border-radius: 50%;
    }
    input:checked + .vd-cookie-slider {
      background-color: #10b981;
    }
    input:checked + .vd-cookie-slider:before {
      transform: translateX(20px);
      background-color: #fff;
    }
    input:disabled + .vd-cookie-slider {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .vd-cookie-modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
  `;
  document.head.appendChild(style);

  // Initialize elements
  function createBanner() {
    if (savedConsent) return; // If already resolved, do not show banner

    const bannerDiv = document.createElement('div');
    bannerDiv.className = 'vd-cookie-banner';
    bannerDiv.innerHTML = `
      <div class="vd-cookie-title">🔒 Cookie & Privacy Consent</div>
      <div class="vd-cookie-desc">
        We use cookies for analytics and non-intrusive ads (Google AdSense) under GDPR and Indian DPDP Act 2023. Your document inputs remain 100% serverless. Learn more in our <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
      </div>
      <div class="vd-cookie-buttons">
        <button class="vd-cookie-btn vd-cookie-btn-reject" id="vd-cookie-reject">Reject All</button>
        <button class="vd-cookie-btn vd-cookie-btn-accept" id="vd-cookie-accept">Accept All</button>
      </div>
      <button class="vd-cookie-manage-link" id="vd-cookie-manage">Manage Preferences</button>
    `;
    document.body.appendChild(bannerDiv);

    // Trigger transition
    setTimeout(() => bannerDiv.classList.add('show'), 100);

    // Set up button listeners
    document.getElementById('vd-cookie-accept').addEventListener('click', () => {
      savePreferences(true, true);
    });

    document.getElementById('vd-cookie-reject').addEventListener('click', () => {
      savePreferences(false, false);
    });

    document.getElementById('vd-cookie-manage').addEventListener('click', () => {
      openModal();
    });
  }

  function createModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'vd-cookie-modal-overlay';
    modalOverlay.id = 'vd-cookie-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="vd-cookie-modal">
        <div class="vd-cookie-modal-title">Cookie Settings</div>
        
        <div class="vd-cookie-option">
          <div>
            <div class="vd-cookie-option-label">Essential Cookies</div>
            <div class="vd-cookie-option-desc">Necessary for standard navigation, security, and document tool state preservation.</div>
          </div>
          <label class="vd-cookie-toggle">
            <input type="checkbox" checked disabled>
            <span class="vd-cookie-slider"></span>
          </label>
        </div>

        <div class="vd-cookie-option">
          <div>
            <div class="vd-cookie-option-label">Performance & Analytics</div>
            <div class="vd-cookie-option-desc font-semibold">Allows us to analyze visitor traffic anonymously (Google Analytics 4).</div>
          </div>
          <label class="vd-cookie-toggle">
            <input type="checkbox" id="vd-toggle-analytics" ${consentState.analytics ? 'checked' : ''}>
            <span class="vd-cookie-slider"></span>
          </label>
        </div>

        <div class="vd-cookie-option">
          <div>
            <div class="vd-cookie-option-label">Advertising & Marketing</div>
            <div class="vd-cookie-option-desc font-semibold">Enables targeted or personalized ads via Google AdSense.</div>
          </div>
          <label class="vd-cookie-toggle">
            <input type="checkbox" id="vd-toggle-marketing" ${consentState.marketing ? 'checked' : ''}>
            <span class="vd-cookie-slider"></span>
          </label>
        </div>

        <div class="vd-cookie-modal-buttons">
          <button class="vd-cookie-btn vd-cookie-btn-reject" id="vd-cookie-close-modal">Cancel</button>
          <button class="vd-cookie-btn vd-cookie-btn-accept" id="vd-cookie-save-settings">Save Preferences</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    document.getElementById('vd-cookie-close-modal').addEventListener('click', closeModal);
    document.getElementById('vd-cookie-save-settings').addEventListener('click', () => {
      const isAnalytics = document.getElementById('vd-toggle-analytics').checked;
      const isMarketing = document.getElementById('vd-toggle-marketing').checked;
      savePreferences(isAnalytics, isMarketing);
      closeModal();
    });
  }

  function openModal() {
    const overlay = document.getElementById('vd-cookie-modal-overlay');
    if (overlay) overlay.classList.add('show');
  }

  function closeModal() {
    const overlay = document.getElementById('vd-cookie-modal-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  function savePreferences(analytics, marketing) {
    const preferences = { analytics, marketing };
    localStorage.setItem('verifydocs_cookie_consent', JSON.stringify(preferences));

    // Update Consent Mode V2 state dynamically
    window.gtag('consent', 'update', {
      'ad_storage': marketing ? 'granted' : 'denied',
      'analytics_storage': analytics ? 'granted' : 'denied',
      'ad_user_data': marketing ? 'granted' : 'denied',
      'ad_personalization': marketing ? 'granted' : 'denied'
    });

    // Remove banner from screen
    const banner = document.querySelector('.vd-cookie-banner');
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    }
  }

  // Load everything on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createBanner();
      createModal();
    });
  } else {
    createBanner();
    createModal();
  }
})();
