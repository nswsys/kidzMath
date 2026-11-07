# Verification

- `npm test`: 50 passing automated tests (39 arithmetic, scoring, and persistence tests; 11 DOM integration tests).
- `npm run build`: TypeScript and production Vite build pass.
- Production output includes a scoped manifest, service worker, precached app shell, bundled fonts, and original SVG/192px/512px icons.
- Integration coverage: complete first-attempt game, score persistence, mistake practice without duplicate rewards, dashboard restoration, keypad input, guarded navigation, counting/stories, worksheet answer keys/printing, saved mute, offline status, software-keyboard suppression with physical-keyboard support, inline feedback replacing the keypad, nearby wrong-answer hints, optional welcome/session behavior, preservation of existing progress through the welcome, quiet-mode persistence, no audio autoplay, and stopping sound effects when muted.
- Browser visual inspection and an actual offline reload/install were not performed: the cloud session did not expose the required `cua_repl.js` browser tool. DOM tests do not establish visual layout or actual service-worker lifecycle behavior.
- Deployment and live URL status must be checked in GitHub Actions. The expected production URL is https://nswsys.github.io/kidzMath/.
