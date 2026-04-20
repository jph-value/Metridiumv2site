/* ============================================================
   METRIDIUM v2 — Contact HUD
   Global contact form overlay, accessible from all pages.
   Works with Netlify forms when deployed; simulates success locally.
   ============================================================ */

export function initContactHUD() {
  const C = window.MetridiumContent || {};
  const connect = C.connect || {};

  const overlay = document.createElement('div');
  overlay.className = 'contact-hud-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML =
    '<div class="contact-hud-panel">' +
      '<button class="contact-hud-close" aria-label="Close">&times;</button>' +
      '<h2>' + (connect.headline || 'Connect with us') + '</h2>' +
      '<p class="contact-hud-sub">Transmit</p>' +
      '<form class="connect-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">' +
        '<input type="hidden" name="form-name" value="contact">' +
        '<p class="sr-only"><label>Don\'t fill this out if you\'re human: <input name="bot-field"></label></p>' +
        '<label><span>Name</span><input type="text" name="name" placeholder="Ada Rivera" required></label>' +
        '<label><span>Email</span><input type="email" name="email" placeholder="ada@initiative.org" required></label>' +
        '<label><span>Confirm Email</span><input type="email" name="email_confirm" placeholder="ada@initiative.org" required></label>' +
        '<label><span>Message</span><textarea name="message" placeholder="What would you like to know?  What can we help you with? What can you help us with?" required></textarea></label>' +
        '<div class="contact-hud-mailing">' +
          '<label class="contact-hud-toggle">' +
            '<input type="checkbox" name="mailing_list" value="yes">' +
            '<span class="contact-hud-toggle-track"><span class="contact-hud-toggle-thumb"></span></span>' +
            '<span class="contact-hud-toggle-label">Join mailing list</span>' +
          '</label>' +
          '<p class="contact-hud-mailing-note">Mailing list is OPTIONAL. We don\'t spam, sell or share data.</p>' +
        '</div>' +
        '<button type="submit" data-cursor="SEND">Send Message</button>' +
        '<p class="form-status" aria-live="polite"></p>' +
      '</form>' +
    '</div>';

  document.body.appendChild(overlay);

  const openContact = () => {
    const navHud = document.getElementById('cmdPalette');
    if (navHud && navHud.classList.contains('is-open')) navHud.classList.remove('is-open');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  };

  const closeContact = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  };

  window.openContactHUD = openContact;

  const navBtn = document.getElementById('contactToggle');
  if (navBtn) navBtn.addEventListener('click', openContact);

  const hudBtn = document.getElementById('hudContactBtn');
  if (hudBtn) hudBtn.addEventListener('click', openContact);

  overlay.querySelector('.contact-hud-close').addEventListener('click', closeContact);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeContact(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeContact(); });

  const form = overlay.querySelector('.connect-form');
  if (!form) return;

  const isLocal = () => {
    const host = window.location.hostname;
    return window.location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  };

  const showState = (ok) => {
    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');
    const orig = 'Send Message';
    if (btn) btn.textContent = ok ? 'Message sent' : 'Send failed';
    if (status) status.textContent = ok ? 'Thank you. We received your message.' : 'We could not send right now. Please retry.';
    setTimeout(() => { if (btn) btn.textContent = orig; if (status) status.textContent = ''; }, 2400);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input[name="email"]');
    const emailConfirm = form.querySelector('input[name="email_confirm"]');
    const status = form.querySelector('.form-status');
    if (email && emailConfirm && email.value !== emailConfirm.value) {
      if (status) status.textContent = 'Email addresses do not match.';
      emailConfirm.focus();
      return;
    }
    if (isLocal()) { form.reset(); showState(true); return; }
    const formData = new FormData(form);
    formData.delete('email_confirm');
    const mailingCheckbox = form.querySelector('input[name="mailing_list"]');
    if (mailingCheckbox) formData.set('mailing_list', mailingCheckbox.checked ? 'yes' : 'no');
    const body = new URLSearchParams();
    formData.forEach((value, key) => { body.append(key, String(value)); });
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
      .then((res) => { if (!res.ok) throw new Error('Failed'); form.reset(); showState(true); })
      .catch(() => { showState(false); });
  });
}