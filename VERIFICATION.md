# Verification

- `npm test`: 44 passing automated tests (39 arithmetic, scoring, and persistence tests; 5 DOM integration tests).
- `npm run build`: TypeScript and production Vite build pass.
- Production output includes a scoped manifest, service worker, precached app shell, bundled fonts, and original SVG/192px/512px icons.
- Integration coverage: complete first-attempt game, score persistence, mistake practice without duplicate rewards, dashboard restoration, keypad input, guarded navigation, counting/stories, worksheet answer keys/printing, saved mute, and offline status.
- Browser visual inspection and an actual offline reload/install were not performed: the cloud session did not expose the required `cua_repl.js` browser tool. DOM tests do not establish visual layout or actual service-worker lifecycle behavior.
- Deployment and live URL status must be checked in GitHub Actions. The expected production URL is https://nswsys.github.io/kidzMath/.
