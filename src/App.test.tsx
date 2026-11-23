// @vitest-environment jsdom
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {KEY,loadProgress} from './progress';
import {WELCOME_KEY} from './Playground';
import {SoundKit} from './sounds';
import {defaults,score} from './math';
import {generatePuzzle} from './wordsearch';
import {generateBox} from './numberbox';
import {directionTo,directions,generateMaze,step} from './maze';
import {generateScramble} from './scramble';
import {generatePatterns} from './patterns';
import {generateCrossword} from './crossword';
import {generateColoring} from './colorbynumber';
function answer(){const t=document.querySelector('.math-question')!.textContent!;const m=t.match(/(\d+)\s*([+−])\s*(\d+)/)!;return String(m[2]==='+'?Number(m[1])+Number(m[3]):Number(m[1])-Number(m[3]));}
beforeEach(()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{});localStorage.clear();sessionStorage.clear();sessionStorage.setItem(WELCOME_KEY,'seen');vi.spyOn(SoundKit.prototype,'play').mockReturnValue(true);vi.spyOn(SoundKit.prototype,'stop').mockImplementation(()=>{});vi.spyOn(Math,'random').mockReturnValue(.2);HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}});
afterEach(()=>{cleanup();vi.restoreAllMocks()});
describe('complete learning flows',()=>{
 it('finishes a game, persists first-attempt scores, retries mistakes, and restores dashboard',async()=>{
  const user=userEvent.setup();const view=render(<App/>);
  await user.click(screen.getByRole('button',{name:/^Addition/}));await user.click(screen.getByRole('button',{name:'5'}));await user.click(screen.getByRole('button',{name:'Let’s play!'}));
  for(let i=0;i<5;i++){expect(screen.getByText(`Question ${i+1} of 5`)).toBeTruthy();const field=screen.getByLabelText('Your answer');await user.type(field,i===0?'9999':answer());await user.keyboard('{Enter}');expect(screen.getByRole('status').textContent).toMatch(i===0?/Good try/:/Wonderful/);await user.click(screen.getByRole('button',{name:i===4?'See my stars':'Next question'}))}
  expect(screen.getByText('80%')).toBeTruthy();expect(screen.getByText('B',{exact:true})).toBeTruthy();expect(screen.getByText(/New badge: First steps/)).toBeTruthy();const result=loadProgress(localStorage).results[0];expect(result.correct).toBe(4);expect(result.points).toBe(60);expect(result.stars).toBe(2);expect(SoundKit.prototype.play).toHaveBeenCalledWith('party');
  await user.click(screen.getByRole('button',{name:/Practice 1 mistake/}));await user.type(screen.getByLabelText('Your answer'),answer());await user.keyboard('{Enter}');await user.click(screen.getByRole('button',{name:'See my stars'}));expect(screen.getByText('100%')).toBeTruthy();expect(loadProgress(localStorage).results).toHaveLength(1);
  view.unmount();render(<App/>);await user.click(screen.getByRole('button',{name:'My progress'}));expect(screen.getByText('80%')).toBeTruthy();expect(screen.getByText('First steps')).toBeTruthy();expect(screen.getAllByRole('row')).toHaveLength(2);
 });
 it('supports the touch keypad, empty input protection, and guarded navigation',async()=>{
  const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Let’s play!'}));expect((screen.getByRole('button',{name:'Check my answer'}) as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByRole('button',{name:'1'}));await user.click(screen.getByRole('button',{name:'2'}));expect((screen.getByLabelText('Your answer') as HTMLInputElement).value).toBe('12');await user.click(screen.getByRole('button',{name:'Delete last digit'}));expect((screen.getByLabelText('Your answer') as HTMLInputElement).value).toBe('1');await user.click(screen.getByRole('button',{name:'Clear answer'}));expect((screen.getByLabelText('Your answer') as HTMLInputElement).value).toBe('');
  await user.click(screen.getByRole('button',{name:'Worksheets'}));const dialog=screen.getByRole('dialog');expect(dialog.hasAttribute('open')).toBe(true);await user.click(within(dialog).getByRole('button',{name:'Keep playing'}));expect(screen.getByText('Question 1 of 10')).toBeTruthy();await user.click(screen.getByRole('button',{name:'Worksheets'}));await user.click(within(dialog).getByRole('button',{name:'Leave this game'}));expect(screen.getByText('Big ideas. Little scribbles.')).toBeTruthy();expect(localStorage.getItem(KEY)).toBe(null);
 });
 it('renders counting pictures and story questions',async()=>{
  const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:/Picture counting/}));expect(screen.getByText(/up to 20 objects/)).toBeTruthy();await user.click(screen.getByRole('button',{name:'Let’s play!'}));expect(document.querySelectorAll('.counting-picture span').length).toBeGreaterThan(0);await user.click(screen.getByRole('button',{name:'Leave game'}));await user.click(screen.getByRole('button',{name:'Leave this game'}));await user.click(screen.getByRole('button',{name:/Story problems/}));await user.click(screen.getByRole('button',{name:'Let’s play!'}));expect(document.querySelector('.story-question')!.textContent).toContain('How many');
 });
 it('generates fresh printable story worksheets with optional keys',async()=>{
  const user=userEvent.setup();const print=vi.spyOn(window,'print').mockImplementation(()=>{});render(<App/>);await user.click(screen.getByRole('button',{name:'Worksheets'}));await user.selectOptions(screen.getByLabelText('Questions'),'15');await user.selectOptions(screen.getByLabelText('Style'),'Stories');await user.click(screen.getByRole('button',{name:'Generate fresh'}));expect(document.querySelectorAll('.worksheet-problems li')).toHaveLength(15);expect(document.querySelector('.worksheet-problems')!.className).toContain('stories');expect(document.querySelector('.answer-key')).toBe(null);await user.click(screen.getByLabelText('Include answer key'));expect(document.querySelectorAll('.answer-key li')).toHaveLength(15);await user.click(screen.getByRole('button',{name:'Print worksheet'}));expect(print).toHaveBeenCalledOnce();
 });
 it('persists mute and shows offline status',async()=>{
  const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Mute sound'}));expect(localStorage.getItem('kidzmath.muted')).toBe('true');expect(screen.getByRole('button',{name:'Turn sound on'})).toBeTruthy();vi.spyOn(navigator,'onLine','get').mockReturnValue(false);fireEvent(window,new Event('offline'));expect(screen.getByText(/Offline adventure mode/)).toBeTruthy();
 });
 it('uses the app keypad without requesting a software keyboard and still accepts physical keys',async()=>{
  const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Let’s play!'}));
  const field=screen.getByLabelText('Your answer') as HTMLInputElement;
  expect(field.readOnly).toBe(true);expect(field.getAttribute('inputmode')).toBe('none');
  await user.click(field);await user.keyboard('12{Backspace}3');expect(field.value).toBe('13');
  await user.keyboard('{Delete}');expect(field.value).toBe('');
  await user.click(screen.getByRole('button',{name:'7'}));expect(field.value).toBe('7');
  expect(field).toBe(document.activeElement);expect(window.scrollTo).toHaveBeenLastCalledWith(0,0);
 });
 it('replaces the keypad with a nearby reaction and restores it for the next question',async()=>{
  const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Let’s play!'}));
  await user.type(screen.getByLabelText('Your answer'),answer());await user.keyboard('{Enter}');
  const status=screen.getByRole('status');expect(status.textContent).toContain('Wonderful');
  expect(status.querySelector('.reaction-mascot .happy')).toBeTruthy();
  expect(screen.queryByRole('button',{name:'7'})).toBe(null);
  expect(screen.getByRole('button',{name:'Next question'})).toBeTruthy();
  vi.mocked(window.scrollTo).mockClear();await user.click(screen.getByRole('button',{name:'Next question'}));
  expect(window.scrollTo).toHaveBeenCalledWith(0,0);
  expect(screen.getByRole('button',{name:'7'})).toBeTruthy();expect(document.querySelector('.reaction-mascot')).toBe(null);
  expect(screen.getByText('Question 2 of 10')).toBeTruthy();
 });
 it('keeps a wrong-answer explanation beside the reaction and reveals hints on request',async()=>{
  const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Let’s play!'}));
  await user.click(screen.getByRole('button',{name:'A little hint, please'}));expect(screen.getByText(/Start at/)).toBeTruthy();
  await user.type(screen.getByLabelText('Your answer'),'9999');await user.keyboard('{Enter}');
  const status=screen.getByRole('status');expect(status.textContent).toContain('Good try!');expect(status.textContent).toContain('Start at');
  expect(status.querySelector('.reaction-mascot')).toBeTruthy();expect(screen.getByRole('button',{name:'Next question'})).toBeTruthy();
 });

 it('shows an optional welcome without audio autoplay and preserves existing progress',async()=>{
  sessionStorage.removeItem(WELCOME_KEY);
  const existing={id:'old-game',date:'2026-01-01T12:00:00Z',correct:4,total:5,bestStreak:3,settings:defaults,...score(4,5,3)};
  localStorage.setItem(KEY,JSON.stringify({version:1,results:[existing]}));
  const user=userEvent.setup();render(<App/>);
  expect(screen.getByRole('region',{name:'Welcome to kidzMath'})).toBeTruthy();
  expect(SoundKit.prototype.play).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button',{name:/Skip intro/}));
  expect(screen.queryByRole('region',{name:'Welcome to kidzMath'})).toBe(null);
  expect(sessionStorage.getItem(WELCOME_KEY)).toBe('seen');
  expect(loadProgress(localStorage).results).toEqual([existing]);
  await user.click(screen.getByRole('button',{name:'My progress'}));expect(screen.getByText('80%')).toBeTruthy();
 });
 it('remembers quiet mode and allows replaying the welcome without discarding progress',async()=>{
  sessionStorage.removeItem(WELCOME_KEY);const user=userEvent.setup();const view=render(<App/>);
  await user.click(screen.getByRole('button',{name:/Play quietly/}));
  expect(localStorage.getItem('kidzmath.muted')).toBe('true');expect(SoundKit.prototype.play).not.toHaveBeenCalled();
  view.unmount();render(<App/>);expect(screen.queryByRole('region',{name:'Welcome to kidzMath'})).toBe(null);
  await user.click(screen.getByRole('button',{name:'My progress'}));await user.click(screen.getByRole('button',{name:/Meet Milo/}));
  expect(screen.getByRole('region',{name:'Welcome to kidzMath'})).toBeTruthy();
  await user.click(screen.getByRole('button',{name:'Let’s play!'}));expect(screen.getByRole('region',{name:'Choose your game'})).toBeTruthy();
  expect(SoundKit.prototype.play).not.toHaveBeenCalled();
 });
 it('plays playful effects on gestures and stops all effects when muted',async()=>{
  const user=userEvent.setup();render(<App/>);expect(SoundKit.prototype.play).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button',{name:'Let’s play!'}));expect(SoundKit.prototype.play).toHaveBeenCalledWith('welcome');
  await user.type(screen.getByLabelText('Your answer'),answer());await user.keyboard('{Enter}');
  expect(SoundKit.prototype.play).toHaveBeenCalledWith('correct');expect(screen.getByText('Woo-hoo!')).toBeTruthy();
  await user.click(screen.getByRole('button',{name:'Mute sound'}));expect(SoundKit.prototype.stop).toHaveBeenCalled();
  vi.mocked(SoundKit.prototype.play).mockClear();await user.click(screen.getByRole('button',{name:'Next question'}));
  await user.type(screen.getByLabelText('Your answer'),answer());await user.keyboard('{Enter}');expect(SoundKit.prototype.play).not.toHaveBeenCalled();
 });

 it('plays a themed word search with taps and hints, then saves stars beside math games',async()=>{
  const user=userEvent.setup();const view=render(<App/>);
  await user.click(screen.getByRole('button',{name:/Word search/}));expect(screen.getByRole('region',{name:'Choose your word search'})).toBeTruthy();expect(screen.queryByRole('region',{name:'Choose your game'})).toBe(null);
  await user.click(screen.getByRole('button',{name:/^Solar system/}));await user.click(screen.getByRole('button',{name:'Find the words!'}));
  // Math.random is pinned in these tests, so the same call reproduces the puzzle on screen.
  const puzzle=generatePuzzle({theme:'space',difficulty:'Easy'});expect(puzzle.placements).toHaveLength(6);
  const cell=(p:{r:number;c:number})=>document.querySelector<HTMLElement>(`.ws-cell[data-r="${p.r}"][data-c="${p.c}"]`)!;
  expect(document.querySelectorAll('.ws-cell')).toHaveLength(64);expect(screen.getByText('0 of 6')).toBeTruthy();
  const [first,...rest]=puzzle.placements;
  await user.click(cell(first.cells[0]));expect(cell(first.cells[0]).getAttribute('aria-pressed')).toBe('true');
  const crooked=puzzle.placements.flatMap(p=>p.cells).find(c=>c.r!==first.cells[0].r&&c.c!==first.cells[0].c&&Math.abs(c.r-first.cells[0].r)!==Math.abs(c.c-first.cells[0].c));
  if(crooked){await user.click(cell(crooked));expect(screen.getByRole('status').textContent).toMatch(/straight line/);await user.click(cell(crooked))}else await user.click(cell(first.cells[0]));
  await user.click(screen.getByRole('button',{name:'Hint'}));expect(screen.getByRole('status').textContent).toContain(`${first.word} starts at the glowing letter`);expect(cell(first.cells[0]).className).toContain('hint-glow');
  await user.click(cell(first.cells[0]));await user.click(cell(first.cells[first.cells.length-1]));
  expect(screen.getByRole('status').textContent).toContain(`You found ${first.word}`);expect(screen.getByText('1 of 6')).toBeTruthy();expect(cell(first.cells[0]).className).toContain('found');expect(SoundKit.prototype.play).toHaveBeenCalledWith('correct');
  expect(screen.queryByRole('button',{name:'See my stars'})).toBe(null);
  await user.click(screen.getByRole('button',{name:'My progress'}));const dialog=screen.getByRole('dialog');await user.click(within(dialog).getByRole('button',{name:'Keep playing'}));
  // Backwards selections count too.
  for(const p of rest){await user.click(cell(p.cells[p.cells.length-1]));await user.click(cell(p.cells[0]))}
  expect(screen.getByText('6 of 6')).toBeTruthy();expect(screen.queryByRole('button',{name:'Hint'})).toBe(null);await user.click(screen.getByRole('button',{name:'See my stars'}));
  expect(screen.getByText('YOU DID IT!')).toBeTruthy();expect(screen.getByText('words found')).toBeTruthy();expect(screen.getByText('hint used')).toBeTruthy();expect(screen.getByText(/New badge: Word detective/)).toBeTruthy();
  const saved=loadProgress(localStorage).results[0];expect(saved).toMatchObject({activity:'wordsearch',correct:5,total:6,stars:2,points:50,settings:{theme:'space',difficulty:'Easy',count:6}});
  await user.click(screen.getByRole('button',{name:'Play again'}));expect(screen.getByText('0 of 6')).toBeTruthy();
  view.unmount();render(<App/>);await user.click(screen.getByRole('button',{name:'My progress'}));expect(screen.getByText('Word search')).toBeTruthy();expect(screen.getByText(/Solar system · 6 words/)).toBeTruthy();expect(screen.getByText('5 of 6 without hints')).toBeTruthy();
 });
 it('prints a fresh word search worksheet with a shaded answer key',async()=>{
  const user=userEvent.setup();const print=vi.spyOn(window,'print').mockImplementation(()=>{});render(<App/>);await user.click(screen.getByRole('button',{name:'Worksheets'}));
  expect(document.querySelector('.worksheet-problems')).toBeTruthy();expect(document.querySelector('.ws-sheet')).toBe(null);
  await user.click(screen.getByRole('button',{name:/Word search/}));expect(document.querySelector('.worksheet-problems')).toBe(null);expect(screen.queryByLabelText('Questions')).toBe(null);
  expect(screen.getByText(/My word search: Animals/)).toBeTruthy();expect(document.querySelectorAll('.ws-sheet-grid span')).toHaveLength(64);expect(document.querySelectorAll('.ws-sheet-words li')).toHaveLength(6);expect(screen.getByText(/Words go across and down\./)).toBeTruthy();
  await user.selectOptions(screen.getByLabelText('Theme'),'foods');await user.selectOptions(screen.getByLabelText('Level'),'Challenge');
  // Like math worksheets, the paper only changes when a fresh one is requested.
  expect(screen.getByText(/My word search: Animals/)).toBeTruthy();await user.click(screen.getByRole('button',{name:'Generate fresh'}));
  const puzzle=generatePuzzle({theme:'foods',difficulty:'Challenge'});
  expect(screen.getByText(/My word search: Foods/)).toBeTruthy();expect(screen.getByText(/even backwards/)).toBeTruthy();expect(document.querySelectorAll('.ws-sheet-grid span')).toHaveLength(144);
  expect([...document.querySelectorAll('.ws-sheet-words li')].map(li=>li.textContent)).toEqual(puzzle.placements.map(p=>p.word));
  expect([...document.querySelectorAll('.ws-sheet-grid span')].map(s=>s.textContent).join('')).toBe(puzzle.grid.flat().join(''));
  expect(document.querySelector('.ws-sheet-key')).toBe(null);await user.click(screen.getByLabelText('Include answer key'));
  expect(document.querySelectorAll('.ws-sheet-key .answer')).toHaveLength(new Set(puzzle.placements.flatMap(p=>p.cells.map(c=>`${c.r}-${c.c}`))).size);
  await user.click(screen.getByRole('button',{name:'Print worksheet'}));expect(print).toHaveBeenCalledOnce();
  await user.click(screen.getByRole('button',{name:/Math/}));expect(document.querySelector('.worksheet-problems')).toBeTruthy();expect(screen.getByLabelText('Questions')).toBeTruthy();
 });
 it('solves an add-and-subtract number box with the pad, a moved number, and a hint',async()=>{
  const user=userEvent.setup();const view=render(<App/>);
  await user.click(screen.getByRole('button',{name:/Number boxes/}));expect(screen.getByRole('region',{name:'Choose your number box'})).toBeTruthy();
  await user.click(screen.getByRole('button',{name:/^Add & subtract/}));await user.click(screen.getByRole('button',{name:/Medium/}));await user.click(screen.getByRole('button',{name:'Solve the puzzle!'}));
  // Math.random is pinned in these tests, so the same call reproduces the box on screen.
  const box=generateBox({difficulty:'Medium',operation:'Mixed'});const blanks=box.given.flatMap((g,i)=>g?[]:[i]);expect(blanks.length).toBeGreaterThanOrEqual(3);
  const cell=(i:number)=>document.querySelector<HTMLButtonElement>(`.nb-cell[data-cell="${i}"]`)!;const pad=(d:number)=>within(screen.getByRole('group',{name:'Number pad'})).getByRole('button',{name:new RegExp(`^${d}\\b`)});
  expect(document.querySelectorAll('.nb-cell.blank')).toHaveLength(blanks.length);expect(document.querySelectorAll('.nb-cell.given')).toHaveLength(9-blanks.length);expect(screen.getByText(`0 of ${blanks.length}`)).toBeTruthy();
  const givenDigit=box.solution[box.given.indexOf(true)];expect((pad(givenDigit) as HTMLButtonElement).disabled).toBe(true);
  const [first,second,...rest]=blanks;
  // Put the first answer in the wrong square, then move it by placing it again.
  await user.click(cell(second));await user.click(pad(box.solution[first]));expect(cell(second).textContent).toBe(String(box.solution[first]));
  await user.click(cell(first));await user.click(pad(box.solution[first]));expect(cell(first).textContent).toBe(String(box.solution[first]));expect(cell(second).textContent).toBe('');
  await user.click(cell(second));await user.click(screen.getByRole('button',{name:'Hint'}));expect(cell(second).textContent).toBe(String(box.solution[second]));expect(cell(second).disabled).toBe(true);expect(screen.getByRole('status').textContent).toMatch(/belongs in that glowing square|solved/);
  expect(screen.queryByRole('button',{name:'See my stars'})).toBe(null);
  // Physical keys work too.
  for(const i of rest){await user.click(cell(i));await user.keyboard(String(box.solution[i]))}
  expect(screen.getByRole('status').textContent).toContain('You solved it!');expect(document.querySelectorAll('.nb-target.ok')).toHaveLength(6);expect(screen.queryByRole('group',{name:'Number pad'})).toBe(null);expect(SoundKit.prototype.play).toHaveBeenCalledWith('correct');
  await user.click(screen.getByRole('button',{name:'See my stars'}));expect(screen.getByText('squares filled')).toBeTruthy();expect(screen.getByText('hint used')).toBeTruthy();expect(screen.getByText(/New badge: Puzzle pro/)).toBeTruthy();
  expect(loadProgress(localStorage).results[0]).toMatchObject({activity:'numberbox',correct:blanks.length-1,total:blanks.length,settings:{operation:'Mixed',difficulty:'Medium',count:blanks.length}});
  view.unmount();render(<App/>);await user.click(screen.getByRole('button',{name:'My progress'}));expect(screen.getByText('Number box')).toBeTruthy();expect(screen.getByText(new RegExp(`Medium · Add & subtract · ${blanks.length} squares`))).toBeTruthy();
 });
 it('prints four number boxes with a filled-in answer key',async()=>{
  const user=userEvent.setup();const print=vi.spyOn(window,'print').mockImplementation(()=>{});render(<App/>);await user.click(screen.getByRole('button',{name:'Worksheets'}));await user.click(screen.getByRole('button',{name:/Number boxes/}));
  expect(screen.getByText(/My number boxes/)).toBeTruthy();expect(document.querySelectorAll('.nb-sheet-boxes li')).toHaveLength(4);expect(screen.queryByText(/left to right/)).toBe(null);
  await user.selectOptions(screen.getByLabelText('Puzzle'),'Mixed');await user.selectOptions(screen.getByLabelText('Level'),'Challenge');await user.click(screen.getByRole('button',{name:'Generate fresh'}));
  const box=generateBox({difficulty:'Challenge',operation:'Mixed'});expect(screen.getByText(/left to right/)).toBeTruthy();
  const sheet=document.querySelector('.nb-sheet-boxes li')!;expect(sheet.querySelectorAll('.nb-cell.blank')).toHaveLength(box.given.filter(g=>!g).length);expect([...sheet.querySelectorAll('.nb-target')].map(t=>t.textContent)).toEqual([...box.rows,...box.cols].map(l=>String(l.target)));
  expect(document.querySelector('.nb-sheet-key')).toBe(null);await user.click(screen.getByLabelText('Include answer key'));
  expect([...document.querySelector('.nb-sheet-key li')!.querySelectorAll('.nb-cell')].map(c=>c.textContent)).toEqual(box.solution.map(String));
  await user.click(screen.getByRole('button',{name:'Print worksheet'}));expect(print).toHaveBeenCalledOnce();
 });
 it('walks a themed maze with the arrow buttons and keys, bumps a wall, uses a hint, and saves stars',async()=>{
  const user=userEvent.setup();const view=render(<App/>);
  await user.click(screen.getByRole('button',{name:/Mazes/}));expect(screen.getByRole('region',{name:'Choose your maze'})).toBeTruthy();
  await user.click(screen.getByRole('button',{name:/^Space trip/}));await user.click(screen.getByRole('button',{name:'Enter the maze!'}));
  // Math.random is pinned in these tests, so the same call reproduces the maze on screen.
  const maze=generateMaze({theme:'space',difficulty:'Easy'}),route=maze.solution,total=route.length-1;expect(total).toBeGreaterThanOrEqual(11);
  expect(screen.getByText(`${total} to go`)).toBeTruthy();expect(document.querySelectorAll('.mz-wall').length).toBeGreaterThan(24);expect(document.querySelector('.mz-trail')).toBe(null);
  const blocked=directions.find(d=>step(maze,maze.start,d)<0)!;await user.click(screen.getByRole('button',{name:`Move ${blocked}`}));expect(screen.getByRole('status').textContent).toMatch(/There’s a wall/);expect(screen.getByText(`${total} to go`)).toBeTruthy();
  const go=(i:number)=>directionTo(maze,route[i],route[i+1])!;
  await user.click(screen.getByRole('button',{name:`Move ${go(0)}`}));await user.click(screen.getByRole('button',{name:`Move ${go(1)}`}));expect(screen.getByText(`${total-2} to go`)).toBeTruthy();expect(document.querySelector('.mz-trail')!.getAttribute('points')!.split(' ')).toHaveLength(3);
  // Stepping back along the trail rubs it out.
  await user.click(screen.getByRole('button',{name:`Move ${directionTo(maze,route[2],route[1])}`}));expect(screen.getByText(`${total-1} to go`)).toBeTruthy();expect(document.querySelector('.mz-trail')!.getAttribute('points')!.split(' ')).toHaveLength(2);
  await user.click(screen.getByRole('button',{name:'Hint'}));expect(screen.getByRole('status').textContent).toContain(`Start by going ${go(1)}`);expect(document.querySelector('.mz-hint')).toBeTruthy();
  await user.click(screen.getByRole('button',{name:'Start over'}));expect(screen.getByText(`${total} to go`)).toBeTruthy();expect(document.querySelector('.mz-hint')).toBe(null);
  const keyFor={up:'{ArrowUp}',right:'{ArrowRight}',down:'{ArrowDown}',left:'{ArrowLeft}'};
  for(let i=0;i<total;i++){expect(screen.queryByRole('button',{name:'See my stars'})).toBe(null);await user.keyboard(keyFor[go(i)])}
  expect(screen.getByText('Arrived!')).toBeTruthy();expect(screen.getByRole('status').textContent).toContain('You made it');expect(screen.queryByRole('group',{name:'Move'})).toBe(null);expect(SoundKit.prototype.play).toHaveBeenCalledWith('correct');
  await user.click(screen.getByRole('button',{name:'See my stars'}));expect(screen.getByText('steps to the finish')).toBeTruthy();expect(screen.getByText('hint used')).toBeTruthy();expect(screen.getByText(/New badge: Pathfinder/)).toBeTruthy();
  expect(loadProgress(localStorage).results[0]).toMatchObject({activity:'maze',correct:4,total:5,stars:2,points:40,settings:{theme:'space',difficulty:'Easy',count:total}});
  view.unmount();render(<App/>);await user.click(screen.getByRole('button',{name:'My progress'}));expect(screen.getByText('Maze')).toBeTruthy();expect(screen.getByText(new RegExp(`Easy · Space trip · ${total} steps`))).toBeTruthy();expect(screen.getByText('1 hint')).toBeTruthy();
 });
 it('prints a maze with the way through on the answer key',async()=>{
  const user=userEvent.setup();const print=vi.spyOn(window,'print').mockImplementation(()=>{});render(<App/>);await user.click(screen.getByRole('button',{name:'Worksheets'}));await user.click(screen.getByRole('button',{name:/Mazes/}));
  expect(screen.getByText(/My maze: Busy bee/)).toBeTruthy();expect(document.querySelectorAll('.mz-sheet .mz-art')).toHaveLength(1);expect(document.querySelector('.mz-solution')).toBe(null);
  await user.selectOptions(screen.getByLabelText('Mission'),'cheese');await user.selectOptions(screen.getByLabelText('Level'),'Challenge');await user.click(screen.getByRole('button',{name:'Generate fresh'}));
  const maze=generateMaze({theme:'cheese',difficulty:'Challenge'});expect(screen.getByText(/My maze: Cheese chase/)).toBeTruthy();expect(screen.getByText(/Guide the mouse to the cheese!/)).toBeTruthy();
  await user.click(screen.getByLabelText('Include answer key'));expect(document.querySelectorAll('.mz-sheet .mz-art')).toHaveLength(2);expect(document.querySelector('.mz-sheet-key .mz-solution')!.getAttribute('points')!.split(' ')).toHaveLength(maze.solution.length);
  await user.click(screen.getByRole('button',{name:'Print worksheet'}));expect(print).toHaveBeenCalledOnce();
 });
 it('unscrambles themed words with tiles, a hint, and the keyboard',async()=>{
  const user=userEvent.setup();const view=render(<App/>);
  await user.click(screen.getByRole('button',{name:/Word scramble/}));expect(screen.getByRole('region',{name:'Choose your word scramble'})).toBeTruthy();await user.click(screen.getByRole('button',{name:/^Fruits/}));await user.click(screen.getByRole('button',{name:'Unscramble!'}));
  const puzzle=generateScramble({theme:'fruits',difficulty:'Easy'}),total=puzzle.words.length;expect(total).toBe(5);
  const tile=(i:number)=>document.querySelector<HTMLButtonElement>(`.sc-tile[data-tile="${i}"]`)!,slot=(i:number)=>document.querySelector<HTMLButtonElement>(`.sc-slot[data-slot="${i}"]`)!;
  const first=puzzle.words[0];expect([...document.querySelectorAll('.sc-tile')].map(t=>t.textContent).join('')).toBe(first.letters.join(''));expect(screen.getByText(`0 of ${total}`)).toBeTruthy();
  // Tapping the tiles in their mixed-up order spells something that is not a word.
  for(let i=0;i<first.letters.length;i++)await user.click(tile(i));expect(screen.getByRole('status').textContent).toMatch(/Not a word yet/);expect(document.querySelector('.sc-slots')!.className).toContain('off');
  await user.click(slot(first.letters.length-1));expect(slot(first.letters.length-1).textContent).toBe('');await user.click(screen.getByRole('button',{name:'Clear'}));expect(slot(0).textContent).toBe('');
  await user.click(screen.getByRole('button',{name:'Hint'}));expect(slot(0).textContent).toBe(first.word[0]);expect(slot(0).disabled).toBe(true);expect(screen.getByRole('status').textContent).toContain(`Letter 1 is ${first.word[0]}`);
  await user.keyboard(first.word.slice(1));expect(screen.getByRole('status').textContent).toContain(`${first.word}! You unscrambled it.`);expect(SoundKit.prototype.play).toHaveBeenCalledWith('correct');
  await user.click(screen.getByRole('button',{name:'Next word'}));
  for(let i=1;i<total;i++){expect(screen.getByText(`${i} of ${total}`)).toBeTruthy();await user.keyboard(puzzle.words[i].word);await user.keyboard('{Enter}')}
  expect(screen.getByText('words unscrambled')).toBeTruthy();expect(screen.getByText('word with a hint')).toBeTruthy();expect(screen.getByText(/New badge: Letter untangler/)).toBeTruthy();
  expect(loadProgress(localStorage).results[0]).toMatchObject({activity:'scramble',correct:total-1,total,settings:{difficulty:'Easy',theme:'fruits',count:total}});
  view.unmount();render(<App/>);await user.click(screen.getByRole('button',{name:'My progress'}));expect(screen.getByText('Word scramble')).toBeTruthy();expect(screen.getByText(/Easy · Fruits · 5 words/)).toBeTruthy();expect(screen.getByText('4 of 5 without hints')).toBeTruthy();
 });
 it('finds missing numbers in patterns, counting only first tries',async()=>{
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:/Number patterns/}));await user.click(screen.getByRole('button',{name:/Medium/}));await user.click(screen.getByRole('button',{name:'Spot the patterns!'}));
  const puzzle=generatePatterns({difficulty:'Medium'}),total=puzzle.patterns.length;expect(total).toBe(8);
  const choice=(n:number)=>within(screen.getByRole('group',{name:'Choose the missing number'})).getByRole('button',{name:new RegExp(`^${n}(,|$)`)}) as HTMLButtonElement;
  const first=puzzle.patterns[0],wrong=first.choices.find(n=>n!==first.answer)!;
  expect([...document.querySelectorAll('.pt-row li')].map(li=>li.textContent)).toEqual(first.terms.map((n,i)=>i===first.blank?'?':String(n)));
  await user.click(choice(wrong));expect(screen.getByRole('status').textContent).toMatch(/Not that one/);expect(choice(wrong).disabled).toBe(true);
  await user.click(choice(first.answer));expect(screen.getByRole('status').textContent).toContain(`${first.answer} is right!`);expect(document.querySelector('.pt-row li.blank')!.textContent).toBe(String(first.answer));await user.click(screen.getByRole('button',{name:'Next pattern'}));
  // A hint shows the rule and also costs the first-try point.
  await user.click(screen.getByRole('button',{name:'Hint'}));expect(screen.getByText(puzzle.patterns[1].rule)).toBeTruthy();await user.click(choice(puzzle.patterns[1].answer));await user.keyboard('{Enter}');
  for(let i=2;i<total;i++){expect(screen.getByText(`${i} of ${total}`)).toBeTruthy();await user.click(choice(puzzle.patterns[i].answer));await user.click(screen.getByRole('button',{name:i+1===total?'See my stars':'Next pattern'}))}
  expect(screen.getByText('right on the first try')).toBeTruthy();expect(screen.getByText(/New badge: Pattern spotter/)).toBeTruthy();
  expect(loadProgress(localStorage).results[0]).toMatchObject({activity:'patterns',correct:total-2,total,stars:2,settings:{difficulty:'Medium',count:total}});expect(loadProgress(localStorage).results[0].settings).not.toHaveProperty('theme');
 });
 it('solves a mini crossword from its clues with typing, a hint, and the letter keyboard',async()=>{
  const user=userEvent.setup();const view=render(<App/>);
  await user.click(screen.getByRole('button',{name:/Crossword/}));await user.click(screen.getByRole('button',{name:/^Yummy foods/}));await user.click(screen.getByRole('button',{name:'Solve the clues!'}));
  const cw=generateCrossword({theme:'foods',difficulty:'Easy'}),total=cw.entries.length;expect(total).toBe(4);
  const cell=(c:number)=>document.querySelector<HTMLButtonElement>(`.cw-cell[data-cell="${c}"]`)!,clue=(i:number)=>screen.getByRole('button',{name:new RegExp(`^${cw.entries[i].number} ${cw.entries[i].clue.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`)});
  expect(document.querySelectorAll('.cw-cell')).toHaveLength(cw.letters.filter(Boolean).length);expect(screen.getByText(`0 of ${total}`)).toBeTruthy();
  const filled=new Set<number>();
  // First word: one hinted letter, one wrong letter fixed with erase, the rest from the on-screen keyboard.
  const first=cw.entries[0];await user.click(clue(0));await user.click(screen.getByRole('button',{name:'Hint'}));expect(cell(first.cells[0]).textContent).toContain(first.word[0]);expect(cell(first.cells[0]).className).toContain('hinted');
  const helped=cw.entries.filter(e=>e.cells.includes(first.cells[0])).length;
  const keys=within(screen.getByRole('group',{name:'Letter keyboard'})),wrongLetter=first.word[1]==='Q'?'Z':'Q';
  await user.click(keys.getByRole('button',{name:wrongLetter}));expect(cell(first.cells[1]).textContent).toContain(wrongLetter);await user.click(keys.getByRole('button',{name:'Erase letter'}));await user.click(keys.getByRole('button',{name:'Erase letter'}));expect(cell(first.cells[1]).textContent).not.toContain(wrongLetter);
  for(const letter of first.word.slice(1))await user.click(keys.getByRole('button',{name:letter}));
  first.cells.forEach(c=>filled.add(c));expect(screen.getByText(`1 of ${total}`)).toBeTruthy();expect(cell(first.cells[1]).className).toContain('locked');expect(screen.getByRole('status').textContent).toContain(`${first.word} fits!`);
  // Other words: pick the clue and type only the letters still missing; crossing letters are already there.
  for(let i=1;i<total;i++){const e=cw.entries[i];await user.click(clue(i));await user.keyboard(e.cells.flatMap((c,k)=>filled.has(c)?[]:[e.word[k]]).join(''));e.cells.forEach(c=>filled.add(c))}
  expect(screen.getByText(`${total} of ${total}`)).toBeTruthy();expect(screen.getByRole('status').textContent).toContain('You finished the crossword');expect(screen.queryByRole('group',{name:'Letter keyboard'})).toBe(null);
  await user.click(screen.getByRole('button',{name:'See my stars'}));expect(screen.getByText('words solved')).toBeTruthy();expect(screen.getByText(/New badge: Clue cracker/)).toBeTruthy();
  expect(loadProgress(localStorage).results[0]).toMatchObject({activity:'crossword',correct:total-helped,total,settings:{difficulty:'Easy',theme:'foods',count:total}});
  view.unmount();render(<App/>);await user.click(screen.getByRole('button',{name:'My progress'}));expect(screen.getByText('Crossword')).toBeTruthy();expect(screen.getByText(/Easy · Yummy foods · 4 words/)).toBeTruthy();
 });
 it('paints a mystery picture by number and counts a wrong tap',async()=>{
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByRole('button',{name:/Color by number/}));await user.click(screen.getByRole('button',{name:/Challenge/}));await user.click(screen.getByRole('button',{name:'Start painting!'}));
  const puzzle=generateColoring({difficulty:'Challenge'}),squares=puzzle.cells.flatMap((c,i)=>c?[i]:[]);
  const cell=(i:number)=>document.querySelector<HTMLButtonElement>(`.cb-cell[data-i="${i}"]`)!,brush=(n:number)=>within(screen.getByRole('group',{name:'Colors'})).getByRole('button',{name:new RegExp(`^${n}:`)});
  expect(document.querySelectorAll('.cb-cell')).toHaveLength(squares.length);expect(cell(squares[0]).textContent).toBe(puzzle.cells[squares[0]]!.text);expect(screen.getByText(`0 of ${squares.length}`)).toBeTruthy();
  // The first color is selected to begin with; tapping a square that belongs to another color is a mistake.
  const first=puzzle.colors[0],other=squares.find(i=>puzzle.cells[i]!.key!==first.key)!;
  await user.click(cell(other));expect(screen.getByRole('status').textContent).toContain(`That square is not ${first.number}`);expect(cell(other).className).toContain('missed');expect(screen.getByText(`0 of ${squares.length}`)).toBeTruthy();expect(SoundKit.prototype.play).toHaveBeenCalledWith('tryAgain');
  for(const color of puzzle.colors){await user.click(brush(color.number));for(const i of squares.filter(i=>puzzle.cells[i]!.key===color.key))await user.click(cell(i))}
  expect(screen.getByRole('status').textContent).toContain(puzzle.name);expect(screen.queryByRole('group',{name:'Colors'})).toBe(null);expect(cell(other).textContent).toBe('');
  await user.click(screen.getByRole('button',{name:'See my stars'}));expect(screen.getByText('squares painted')).toBeTruthy();expect(screen.getByText(/New badge: Super artist/)).toBeTruthy();
  expect(loadProgress(localStorage).results[0]).toMatchObject({activity:'colors',total:10,correct:Math.round(10*(squares.length-1)/squares.length),settings:{difficulty:'Challenge',count:squares.length}});
 });
 it('prints worksheets for the scramble, patterns, crossword, and coloring activities',async()=>{
  const user=userEvent.setup();const print=vi.spyOn(window,'print').mockImplementation(()=>{});render(<App/>);await user.click(screen.getByRole('button',{name:'Worksheets'}));
  expect(within(screen.getByRole('group',{name:'Worksheet type'})).getAllByRole('button')).toHaveLength(8);
  await user.click(screen.getByRole('button',{name:/Word scramble/}));await user.selectOptions(screen.getByLabelText('Theme'),'space');await user.selectOptions(screen.getByLabelText('Level'),'Medium');await user.click(screen.getByRole('button',{name:'Generate fresh'}));
  const scramble=generateScramble({theme:'space',difficulty:'Medium'});expect(screen.getByText(/My word scramble: Solar system/)).toBeTruthy();expect([...document.querySelectorAll('.sc-sheet-mix')].map(m=>m.textContent!.replace(/ /g,''))).toEqual(scramble.words.map(w=>w.letters.join('')));
  expect(document.querySelector('.answer-key')).toBe(null);await user.click(screen.getByLabelText('Include answer key'));expect([...document.querySelectorAll('.answer-key strong')].map(s=>s.textContent)).toEqual(scramble.words.map(w=>w.word));
  await user.click(screen.getByRole('button',{name:/Number patterns/}));expect(screen.queryByLabelText('Theme')).toBe(null);await user.selectOptions(screen.getByLabelText('Level'),'Challenge');await user.click(screen.getByRole('button',{name:'Generate fresh'}));
  const patterns=generatePatterns({difficulty:'Challenge'});expect(document.querySelectorAll('.pt-sheet-rows li')).toHaveLength(10);expect(document.querySelectorAll('.pt-sheet-rows .blank')).toHaveLength(10);expect([...document.querySelectorAll('.answer-key strong')].map(s=>s.textContent)).toEqual(patterns.patterns.map(p=>String(p.answer)));
  await user.click(screen.getByRole('button',{name:/Crossword/}));const cw=generateCrossword({theme:'animals',difficulty:'Easy'});
  expect(screen.getByText(/My crossword: Animals/)).toBeTruthy();expect([...document.querySelectorAll('.cw-sheet .cw-clues i')].map(i=>i.textContent)).toEqual(cw.entries.map(e=>`(${e.word.length} letters)`));
  expect(document.querySelectorAll('.cw-sheet .cw-paper:not(.answers) .cw-cell')).toHaveLength(cw.letters.filter(Boolean).length);expect([...document.querySelectorAll('.cw-sheet .cw-paper:not(.answers) .cw-cell')].every(c=>!/[A-Z]/.test(c.textContent!))).toBe(true);
  expect([...document.querySelectorAll('.cw-sheet-key .cw-cell')].map(c=>c.textContent!.replace(/\d/g,'')).join('')).toBe(cw.letters.filter(Boolean).join(''));
  await user.click(screen.getByRole('button',{name:/Color by number/}));const art=generateColoring({difficulty:'Easy'});
  expect(screen.getByText(/My color by number/)).toBeTruthy();expect(document.querySelectorAll('.cb-key li')).toHaveLength(art.colors.length);expect(document.querySelectorAll('.cb-sheet .cb-paper:not(.answers) .cb-cell')).toHaveLength(art.cells.filter(Boolean).length);expect(screen.getByText(new RegExp(`Answer key · It’s an? ${art.name}!`))).toBeTruthy();
  await user.click(screen.getByRole('button',{name:'Print worksheet'}));expect(print).toHaveBeenCalledOnce();
 });
});
