# kidzMath

A gentle, playful activity app for ages 6–10, with original SVG buddies Milo the puppy and Luna the bunny. It started as a math adventure and now also offers word searches, word scrambles, mini crosswords, number boxes, number patterns, color by number, and mazes; the home screen lets children switch between activities. All student-facing content is English.

## Local development

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the development URL at `/kidzMath/`. Run `npm test` for arithmetic, puzzle generation for every activity, validation, scoring, and persistence tests. Run `npm run build` for the TypeScript check and production build; `npm run preview` serves the built app at `/kidzMath/`.

## Playground experience

The approved Playground design adds a skippable animated welcome, waving/blinking Milo and Luna, colorful number tiles, original synthesized pop/high-five/fanfare sounds, and a trophy-and-confetti finish. The welcome appears once per browser session; replay it with **Meet Milo & Luna** in the footer. **Play quietly** saves the mute preference. Audio never plays automatically on page load, and muting stops active effects and speech. System reduced-motion preferences disable motion effects.

The production app keeps its existing installation URL, progress key/schema, scoring, quiz options, and worksheets. Correct answers show a +10-point reaction; end-of-game stars still follow the scoring rules below. No demo progress or prototype controls are included.

## Milo and Luna in every activity

Every game outside the original math quiz has a buddy with a speech bubble that gives the instructions and reacts: a happy hop for a success and a gentle wince for a miss. Milo the puppy helps with the number activities (number boxes, number patterns, color by number) and Luna the bunny with the word activities (word search, word scramble, crossword). Hints are asked from the buddy (**Ask Milo** / **Ask Luna**). In the mazes Milo guides, except in his own maze, where he walks the path himself and Luna guides; Luna likewise walks hers. The buddy also gives the instructions on every printed worksheet, and color by number includes pictures of both buddies.

Stars unlock things for the buddies to wear: party hat (3 stars), bow tie (8), sunglasses (15), flower (25), hero cape (40), and crown (60). Nothing is spent; items unlock as the star total grows and are announced on the result screen. Dress each buddy from **My progress → Dress up your buddies**; items that share a spot (the hat, flower, and crown all go on the head) replace each other. Outfits appear wherever the buddies do, are saved on this device under `kidzmath.outfit.v1`, and are put away if progress is reset below an item's stars.

## Learning adventures

Choose addition, subtraction, or mixed practice; Easy (0–20), Medium (0–100), or Challenge (0–1000); and 5, 10, 15, or 20 questions. Choose numbers, picture counting, or short English story problems. Addition totals stay inside the selected range, and subtraction never goes negative. Picture counting uses up to 20 objects at every level to remain useful and readable.

Use the built-in touch keypad or a physical keyboard. The answer display does not open the device keyboard. On phones, a compact three-row keypad keeps the answer action close; feedback replaces the keypad with an inline animated buddy. The mobile home screen prioritizes game setup; progress and worksheets remain in the navigation. In landscape, the question and answer controls use two panels, with one inline mascot reaction and extra bottom clearance on tablets for system bars. Each new question returns the view to the top. Portrait home and game layouts use the available viewport height: controls and reactions grow on taller screens and the primary action stays near the bottom, while shorter screens and enlarged text can still scroll. Submit with Enter. Read questions aloud with the speaker button when sound is enabled and browser speech synthesis is available. Audio uses device speech voices; offline voice availability depends on the browser. Optional sound effects are generated locally. Hints support counting and tens/ones strategies. Incorrect answers are shown supportively and can be practiced again after the game.

Scores use first-attempt answers: 90%+ = A, 80%+ = B, 70%+ = C, 60%+ = D; lower scores receive F with supportive encouragement. Stars: 3 for 90%+, 2 for 60%+, and 1 for completing any other game. Points: 10 per correct answer plus 5 per question in the best streak. Retrying mistakes builds confidence without duplicating earned progress.

The dashboard shows weighted overall accuracy, games, stars, points, best streak, badges, and the ten most recent results. Up to 1,000 results are retained on this device. No accounts, analytics, ads, or collection of personal information. Progress uses `localStorage`, so clearing browser data or changing devices will remove it. Storage failures display a message and still permit play. Reset progress from the dashboard.

## Word searches

Choose **Word search** on the home screen, then a theme and a level. Themes: Animals, Solar system, Science, Fruits, Foods, Sports, Cartoon stars, and Shows & movies. Word lists live in `src/wordsearch.ts`; add a theme by adding an entry to `themes` (uppercase A–Z words of 3–10 letters).

Every puzzle is generated fresh on the device, so it works offline. Easy is an 8×8 grid with 6 words reading left-to-right or top-to-bottom. Medium is 10×10 with 8 words and adds diagonals. Challenge is 12×12 with 10 words and adds backwards words. Each answer can be read in exactly one place, answers hidden inside other answers are never chosen together, and filler letters are checked against a short list of unkind words.

Find a word by dragging across it, or by tapping its first and then its last letter; either end may come first. Drags snap to the nearest row, column, or diagonal. With a keyboard, move with the arrow keys and press Enter or Space on the first and last letters. **Hint** makes the first letter of an unfound word glow.

Finishing a puzzle earns stars with the same rules as math, counting words found without a hint as first-attempt answers, plus 10 points per word found without a hint. Results are saved in the same progress store as math games (marked `activity: 'wordsearch'`), appear in the dashboard, and unlock the Word detective badge.

## Number boxes

Choose **Number boxes** on the home screen. Each puzzle is a 3×3 box that uses the numbers 1 to 9 once each; some squares are filled in, and every row and column must match the answer shown outside the box. **Addition** uses only plus signs. **Add & subtract** gives each line one plus and one minus where the numbers allow it; signs are worked left to right, and no line ever dips below zero. Easy leaves 3 squares empty, Medium 5, and Challenge 7.

Puzzles are generated on the device (`src/numberbox.ts`) and are only used when they have exactly one answer. Tap an empty square, then a number on the pad, or type the number on a keyboard. Placing a number that is already in another square moves it, and numbers already printed in the box are crossed out on the pad. The answer beside a finished line turns green when it matches and orange when it does not. **Hint** fills one square correctly.

Stars follow the same rules as the other activities, counting squares filled without a hint as first-attempt answers. Results are saved with `activity: 'numberbox'`, appear in the dashboard, and unlock the Puzzle pro badge.

## Mazes

Choose **Mazes** on the home screen, then a mission and a level. Each mission pairs a character with a finish: Busy bee, Space trip, Milo’s treat, Luna’s snack, Summer island, Jungle swing, Way home, and Cheese chase. Missions live in `src/maze.ts`; add one by adding an entry to `mazeThemes`. Easy is a 6×6 maze, Medium 9×9, and Challenge 12×12.

Mazes are generated on the device. Every maze has exactly one route between any two squares and no loops, the character starts in the top-left corner, and the finish is placed at the square farthest from the start. Move by dragging along the path, with the on-screen arrow buttons, or with the arrow keys. The trail is drawn behind the character and stepping back along it rubs it out. **Hint** makes the next four steps glow; **Start over** returns to the start.

A maze has no wrong answers, so stars depend on hints: no hints earns 3 stars, one or two hints earn 2, and more earn 1. Results are saved with `activity: 'maze'`, appear in the dashboard, and unlock the Pathfinder badge.

## Word scramble, number patterns, crossword, and color by number

These four activities share one registry (`src/activities.tsx`): each entry supplies its setup choices, a generator, the game, the printable page, a badge, and how a saved result is described. Adding another activity of this kind means adding one entry there plus its id in `extraActivities` in `src/progress.ts`. Results are saved with `activity` set to `scramble`, `patterns`, `crossword`, or `colors`.

**Word scramble** mixes up the letters of words from the eight word search themes. Easy has 5 words of up to 5 letters, Medium 6 of up to 7, Challenge 8 of up to 10. Tap the tiles in order (or type); tap a placed letter to take it back. If the tiles can spell another word from the same theme (LEMON and MELON), that counts too. **Hint** places the next correct letter.

**Number patterns** shows five numbers with one missing and four choices. Easy counts up by 1, 2, 5, or 10; Medium goes up or down by 2, 3, 4, 5, or 10; Challenge adds bigger steps, jumps that grow by one, and doubling. Easy has 6 patterns, Medium 8, Challenge 10. Only patterns answered on the first try without the hint count toward stars. **Hint** shows the rule.

**Crossword** builds a small crossword from a bank of 20 clued words per theme (Animals, Yummy foods, Sky & nature) in `src/crossword.ts`: 4 words on Easy, 6 on Medium, 8 on Challenge. Every word crosses another and no stray words are formed. Tap a square or a clue, then use the on-screen letters or a keyboard; a finished word turns green and locks. **Hint** reveals one letter.

**Color by number** hides a pixel picture (Milo, Luna, heart, fish, rocket, flower, house, tree, or sunny face). Each color has its own answer. Easy squares show the number itself, Medium squares show additions up to 10, and Challenge squares show additions and subtractions within 20. Pick a color, then tap or drag across the squares with that answer. Tapping a square with the wrong color counts as a mistake; dragging over other squares does not. Stars use the share of squares painted without a mistake.

## Worksheets

Choose any of the eight activities, pick your options, select **Generate fresh**, and print. A word search worksheet has the letter grid, a tick-off word list, and a line saying which directions words can go; its answer key repeats the grid with the hidden words shaded. A number box worksheet has four fresh boxes; its answer key shows them filled in with the answers shaded. A maze worksheet has one large maze; its answer key draws the way through. Word scramble and number pattern worksheets list the items with space to write and give the answers on the key. A crossword worksheet has the empty grid and clues, with the filled grid as its key. A color by number worksheet has the grid of numbers or sums and a color key, with the finished picture as its answer key. The optional answer key starts on a new printed page. Printing works through the system print dialog, including Save as PDF where available. No names are entered or stored by the app; the printed name line is for pencil use.

## PWA and offline use

The build generates a web manifest and Workbox service worker. Open once online to cache the app, then use it offline. Install with Chrome/Edge's install option, or Safari's Share → Add to Home Screen. The app uses the Playground “Magic k” icon without bunny ears. It includes 192px/512px app icons, a separately padded opaque 512px Android maskable icon, a 180px Apple touch icon, and a 32px browser favicon. Regenerate them with `npm run icons` from `artwork/icon-magic-k.png`. Versioned asset URLs help refresh cached icons; browsers and operating systems control when an installed app’s icon is refreshed. The app identity, start URL, scope, and saved progress are unchanged. Fonts are bundled locally; there are no third-party runtime requests. Updates are installed automatically when a new version is available. No server or account is required.

Accessibility includes semantic controls, selected-state announcements, keyboard input, live feedback, a skip link, visible focus rings, large touch targets, and support for reduced-motion preferences.

## GitHub Pages deployment

Vite's base is explicitly `/kidzMath/`. The GitHub Actions workflow tests and builds pull requests. Pushes to `main` and manual runs on `main` also upload and deploy the production artifact using GitHub's official Pages actions.

In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Enable Actions and permit the workflow's Pages write and OIDC token permissions. If the `github-pages` environment requires approval, approve the deployment in Actions. No custom secrets are necessary. The expected URL is https://nswsys.github.io/kidzMath/; check the actual Actions deployment result before calling it live.

## Original artwork

Milo, Luna, and the meadow are original vector artwork made for this project. The original Magic k icon artwork and its exported assets are included in this repository. The artwork uses no third-party cartoon characters or branding. The Cartoon stars and Shows & movies word lists mention well-known character and show names as plain text only; those names belong to their respective owners. Standard emoji are rendered by each device.
