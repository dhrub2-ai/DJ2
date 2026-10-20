# DJ — Private chat, voice and video calls (v2)

A complete **two-person**, mobile-friendly website offering:

- Live **video calls** (front camera preview, remote video, mute microphone, turn camera on/off, end call)
- Live **voice calls** (microphone mute and hang up)
- **Instant text chat** between two connected devices
- **Direct image sharing** (up to 15 MB per image)
- **Direct video sharing** (up to 50 MB per video)
- Secret **invitation links / 20-character room codes**
- Messages, image/video previews, and received files are removed from the app **when a call ends**, when a participant leaves, or on page reload.

## Your privacy requirement

**DJ v2 does not use Firebase at all.** No Firebase authentication, Firestore, Firebase Storage, backups, or billing plan is necessary. More importantly, DJ doesn't write messages, images, videos, or recordings to *any* application cloud database.

Text, photos and videos are exchanged on an encrypted **WebRTC data channel**, device-to-device. Live audio and video use encrypted WebRTC media streams. DJ itself makes **no call recordings**. A lightweight **Cloudflare Worker + Durable Object** is used only to coordinate two users and forward temporary connection setup messages (SDP and ICE) in a live WebSocket connection. The Worker source includes **no database read/write**, no persistent file storage, no history, and no Firebase SDK. The Worker handles participants' temporary display names and WebRTC signaling until their connection closes. Cloudflare may nevertheless retain service operational logs/metadata according to its own policies; the service isn't a zero-metadata or anonymity guarantee.

**Note:** Users may still take screenshots, screen-record, or independently save received media. When a call ends, DJ clears its own message and file previews; this cannot erase copies another person has made or third-party traffic metadata. With standard public STUN servers, a peer or STUN provider may be exposed to connection IP metadata. Some networks require a TURN relay; see below.

**Important limitation:** Both people must be online at the same time. DJ is an ephemeral **one-to-one** app, not an offline inbox, group chat, or recording service.

## What's inside

```
DJ-Website/
├── index.html                  Main responsive website
├── styles.css                  UI and mobile styling
├── app.js                      WebRTC voice/video/chat/file transfer
├── config.js                   One URL to configure
├── assets/favicon.svg          DJ logo
└── signaling-worker/
    ├── package.json
    ├── wrangler.jsonc           Cloudflare Worker and Durable Object config
    └── src/index.js            Stateless-in-practice relay (no database writes)
```

## 1. Deploy the signaling Worker (Cloudflare Free tier)

You need a free Cloudflare account and Node.js installed. Cloudflare Durable Objects with SQLite-backed namespaces are available on Workers Free subject to usage limits; **the deployed DJ code does not write to this storage**. The Durable Object is used only for live WebSocket coordination. Cloudflare free allowance can change.

1. Create/sign in to your Cloudflare account: <https://dash.cloudflare.com/>.
2. Install Node.js: <https://nodejs.org/>.
3. Unzip the DJ project, then in Terminal / PowerShell run:

   ```powershell
   cd DJ-Website\signaling-worker
   npm install
   npx wrangler login
   npm run deploy
   ```

4. Cloudflare will show a public endpoint similar to:

   `https://dj-private-signaling.example-account.workers.dev`

5. Open `config.js` in a text editor and replace the placeholder:

   ```javascript
   signalingUrl: 'https://dj-private-signaling.example-account.workers.dev',
   ```

6. Test your Worker by opening:

   `https://dj-private-signaling.example-account.workers.dev/health`

   You should see: **DJ signaling relay ready. No user content stored.**

**Cloudflare deployment reference:** <https://developers.cloudflare.com/durable-objects/get-started/>.

For a stricter origin policy, add a variable to `signaling-worker/wrangler.jsonc` before deploying:

```json
"vars": {
  "ALLOWED_ORIGINS": "https://YOUR_GITHUB_NAME.github.io"
}
```

This limits incoming browser WebSockets to your GitHub Pages origin. Be careful to use exactly your deployed site's origin (without path). Room links are the primary access secret; there are no user accounts in this version.

## 2. Publish the website free on GitHub Pages

1. Open <https://github.com/new> and make a repository, e.g. `DJ`.
2. Upload the **contents** of `DJ-Website` (particularly `index.html`, `app.js`, `styles.css`, `config.js`, `assets/`). Do not upload the outer ZIP as the homepage.
3. Commit changes. In your repo, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, branch **main**, folder **/(root)**, then Save.
5. Your published website should be at `https://YOUR_GITHUB_NAME.github.io/DJ/`.

The website must use HTTPS for camera and microphone permissions. GitHub Pages provides HTTPS. You can use any other static HTTPS hosting service instead.

## 3. Use DJ on two phones or computers

1. Open DJ on **Device A** and enter your name.
2. Select **Create a new room** and **Copy invite link**.
3. Open the invitation link on **Device B**, enter a different name and choose **Join a room**.
4. Once the secure peer-to-peer connection is ready, chat or tap **Voice** or **Video**.
5. Answer the incoming call on the other device. Both users can mute their microphone or switch their camera off. **End call** stops camera/microphone and clears shared messages and media from DJ on both devices.
6. Leave the room to disconnect and clear the current session. Reloading the page also loses the messages and files.

Opening two tabs on one device may cause audio feedback. Use two separate devices and headphones during testing.

## Technical notes and limitations

- **No backend media upload:** Photos and videos are transferred in 16 KB WebRTC chunks with buffer backpressure and size checks; no file is uploaded to Cloudflare or Firebase. The entire file is received while both people remain online, which may take time for large video files.
- **Encryption:** WebRTC encrypts its data and media channels. The Cloudflare Worker temporarily sees the connection-negotiation messages and display names, **not** the text messages or media. There is no extra end-to-end identity verification, so keep invite links private.
- **TURN:** Public STUN servers work on many networks, but not all. Corporate, symmetric NAT, and strict carrier networks may require a properly secured TURN server. Add its `turn:` / `turns:` URLs and per-user credentials to `iceServers` in `config.js`. TURN services may cost money. Any TURN server relays encrypted WebRTC traffic.
- **No persistent identity/history:** There is no database, and DJ doesn't save conversations in localStorage or cookies. Room links are bearer secrets (anyone with the code may join while a slot is available). No offline messages, notifications while offline, or group video calling.
- **Limits:** Maximum **2 simultaneous people** per room; one media transfer per sending device; maximum 15 MB image or 50 MB video. Supported file MIME types depend on each browser.
- **Operational privacy:** Cloudflare may produce access logs/connection metadata outside of DJ's application logic. The app does not promise that third parties or recipients can never record content.
- **Troubleshooting:** If chat is stuck at "Waiting for your friend", confirm both joined the **same** full room code, `config.js` points at a deployed Worker, browser console has no errors, and no third connection occupied the room. If chat works but a call cannot connect, check browser permissions, HTTPS, and TURN needs.

## Verification checklist

- [ ] Worker `/health` responds.
- [ ] DJ webpage loads on Android and desktop over HTTPS.
- [ ] Device A creates room; B joins via shareable link.
- [ ] Both send and receive real-time text.
- [ ] Both receive a photo and a short video.
- [ ] Video and voice calls connect in both directions.
- [ ] Microphone mute/camera-off toggles work.
- [ ] Hangup stops all camera/microphone tracks and clears message previews.
- [ ] Reload shows no prior history; Worker uses no Firebase account or storage.

This is source code ready to deploy. **It cannot become a working public URL until you deploy its Worker and publish the web files under your own accounts.**
