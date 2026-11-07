// @vitest-environment jsdom
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {KEY,loadProgress} from './progress';
function answer(){const t=document.querySelector('.math-question')!.textContent!;const m=t.match(/(\d+)\s*([+−])\s*(\d+)/)!;return String(m[2]==='+'?Number(m[1])+Number(m[3]):Number(m[1])-Number(m[3]));}
beforeEach(()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{});localStorage.clear();vi.spyOn(Math,'random').mockReturnValue(.2);HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}});
afterEach(()=>{cleanup();vi.restoreAllMocks()});
describe('complete learning flows',()=>{
 it('finishes a game, persists first-attempt scores, retries mistakes, and restores dashboard',async()=>{
  const user=userEvent.setup();const view=render(<App/>);
  await user.click(screen.getByRole('button',{name:/^Addition/}));await user.click(screen.getByRole('button',{name:'5'}));await user.click(screen.getByRole('button',{name:'Let’s play!'}));
  for(let i=0;i<5;i++){expect(screen.getByText(`Question ${i+1} of 5`)).toBeTruthy();const field=screen.getByLabelText('Your answer');await user.type(field,i===0?'9999':answer());await user.keyboard('{Enter}');expect(screen.getByRole('status').textContent).toMatch(i===0?/Good try/:/Wonderful/);await user.click(screen.getByRole('button',{name:i===4?'See my stars':'Next question'}))}
  expect(screen.getByText('80%')).toBeTruthy();expect(screen.getByText('B',{exact:true})).toBeTruthy();expect(screen.getByText(/New badge: First steps/)).toBeTruthy();const result=loadProgress(localStorage).results[0];expect(result.correct).toBe(4);expect(result.points).toBe(60);expect(result.stars).toBe(2);
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

});
