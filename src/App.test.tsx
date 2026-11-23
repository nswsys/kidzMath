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
});
