// DJ v2 — no Firebase account or Firebase Cloud Storage needed.
// 1. Deploy signaling-worker/ with Cloudflare Workers.
// 2. Replace the URL below with your actual workers.dev HTTPS address.
// 3. Upload this file with the website to GitHub Pages.
window.DJ_CONFIG = {
  signalingUrl: 'https://dj-private-signaling.YOUR_SUBDOMAIN.workers.dev',
  // Default public STUN servers; for difficult networks, add your own TURN
  // server credentials here (TURN use may cost money).
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]
};
