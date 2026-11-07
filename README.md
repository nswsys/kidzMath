# kidzMath

A gentle, playful math adventure for ages 6–10, with original SVG buddies Milo the puppy and Luna the bunny. All student-facing content is English.

## Local development

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the development URL at `/kidzMath/`. Run `npm test` for arithmetic, validation, scoring, and persistence tests. Run `npm run build` for the TypeScript check and production build; `npm run preview` serves the built app at `/kidzMath/`.

## Learning adventures

Choose addition, subtraction, or mixed practice; Easy (0–20), Medium (0–100), or Challenge (0–1000); and 5, 10, 15, or 20 questions. Choose numbers, picture counting, or short English story problems. Addition totals stay inside the selected range, and subtraction never goes negative. Picture counting uses up to 20 objects at every level to remain useful and readable.

Use the built-in touch keypad or a physical keyboard. The answer display does not open the device keyboard. On phones, a compact three-row keypad keeps the answer action close; feedback replaces the keypad with an inline animated buddy. The mobile home screen prioritizes game setup; progress and worksheets remain in the navigation. Portrait home and game layouts use the available viewport height: controls and reactions grow on taller screens and the primary action stays near the bottom, while shorter screens and enlarged text can still scroll. Submit with Enter. Read questions aloud with the speaker button when sound is enabled and browser speech synthesis is available. Audio uses device speech voices; offline voice availability depends on the browser. Optional sound effects are generated locally. Hints support counting and tens/ones strategies. Incorrect answers are shown supportively and can be practiced again after the game.

Scores use first-attempt answers: 90%+ = A, 80%+ = B, 70%+ = C, 60%+ = D; lower scores receive F with supportive encouragement. Stars: 3 for 90%+, 2 for 60%+, and 1 for completing any other game. Points: 10 per correct answer plus 5 per question in the best streak. Retrying mistakes builds confidence without duplicating earned progress.

The dashboard shows weighted overall accuracy, games, stars, points, best streak, badges, and the ten most recent results. Up to 1,000 results are retained on this device. No accounts, analytics, ads, or collection of personal information. Progress uses `localStorage`, so clearing browser data or changing devices will remove it. Storage failures display a message and still permit play. Reset progress from the dashboard.

## Worksheets

Choose options, select **Generate fresh**, and print. The optional answer key starts on a new printed page. Printing works through the system print dialog, including Save as PDF where available. No names are entered or stored by the app; the printed name line is for pencil use.

## PWA and offline use

The build generates a web manifest and Workbox service worker. Open once online to cache the app, then use it offline. Install with Chrome/Edge's install option, or Safari's Share → Add to Home Screen. The app includes original 192px and 512px icons. Fonts are bundled locally; there are no third-party runtime requests. Updates are installed automatically when a new version is available. No server or account is required.

Accessibility includes semantic controls, selected-state announcements, keyboard input, live feedback, a skip link, visible focus rings, large touch targets, and support for reduced-motion preferences.

## GitHub Pages deployment

Vite's base is explicitly `/kidzMath/`. The GitHub Actions workflow tests and builds pull requests. Pushes to `main` and manual runs on `main` also upload and deploy the production artifact using GitHub's official Pages actions.

In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Enable Actions and permit the workflow's Pages write and OIDC token permissions. If the `github-pages` environment requires approval, approve the deployment in Actions. No custom secrets are necessary. The expected URL is https://nswsys.github.io/kidzMath/; check the actual Actions deployment result before calling it live.

## Original artwork

Milo, Luna, the meadow, and the application icon are original vector artwork made for this project. They use no third-party cartoon characters or branding. Standard emoji are rendered by each device.
