const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const app = fs.readFileSync(__dirname + '/../dist/app.js', 'utf8');

function game() {
  const context = vm.createContext({
    structuredClone,
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
  });
  vm.runInContext(app.slice(0, app.indexOf("$('#decideBtn').onclick=")), context);
  return expression => vm.runInContext(expression, context);
}

test('skyscraper construction waits for the free sale before ending the player action', () => {
  const source = app.slice(app.indexOf('async function executePlayerBuild'), app.indexOf('async function playerBuild'));
  assert.ok(source.indexOf("await playerSell(null,{free:true})") >= 0);
  assert.ok(source.indexOf("await playerSell(null,{free:true})") < source.lastIndexOf('finishPlayer('));
});

test('player free sale flips an industry without consuming a card or action', async () => {
  const run = game();
  run(`
    state=fresh();
    state.gameMode='full';
    state.setup.merchant.보스턴='제조 상자 · +6VP';
    state.roundActions={player:1,automa:2};
    state.playerDiscard=[];
    state.playerHand=['피츠버그'];
    connectedFrom=()=>new Set(['보스턴']);
    Object.assign(slot('피츠버그',0),{owner:'player',industry:'제조 상자',groupId:'m2',flipped:false,resource:0,resources:{}});
    pick=async(label,items)=>label.includes('상인')?'보스턴':label.includes('위스키')?0:items.find(item=>!item.skip&&!item.done);
    confirmAction=async()=>true;
  `);
  const detail = await run("playerSell(null,{free:true})");
  assert.match(detail, /마천루 무료 판매/);
  assert.equal(run("state.cities['피츠버그'][0].flipped"), true);
  assert.equal(run('state.playerDiscard.length'), 0);
  assert.equal(run('state.playerHand.length'), 1);
  assert.equal(run('state.roundActions.player'), 1);
  assert.equal(run('state.history.length'), 0);
});

test('automa skyscraper free sale is included without consuming its build card', () => {
  const run = game();
  run(`
    state=fresh();
    state.hand=['피츠버그'];
    state.setup.merchant.보스턴='제조 상자 · +6VP';
    connectedFrom=()=>new Set(['보스턴']);
    Object.assign(slot('피츠버그',0),{owner:'automa',industry:'제조 상자',groupId:'m2',flipped:false,resource:0,resources:{}});
  `);
  assert.equal(run('executeAutomaSkyscraperSale([])'), true);
  assert.equal(run("state.cities['피츠버그'][0].flipped"), true);
  assert.equal(run('state.hand.length'), 1);
  assert.equal(run('state.discard.length'), 0);
});

test('automa search simulation models the skyscraper free sale', () => {
  const source = app.slice(app.indexOf('function applyAutomaCandidateForSearch'), app.indexOf('function collectAutomaCandidates'));
  assert.match(source, /executeAutomaSkyscraperSale\(detail\)/);
});
