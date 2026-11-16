// Node harness for the Cornhole Scorekeeper engine. Run: node test.js
// Loads the code between the ENGINE markers straight out of index.html,
// so the tests always run against the shipped engine.
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
var start = html.indexOf('/* ENGINE START */');
var end = html.indexOf('/* ENGINE END */');
if (start < 0 || end < 0) { console.error('Engine markers not found'); process.exit(1); }
var src = html.slice(start, end);
if (/document|window|localStorage/.test(src.replace(/\/\*[\s\S]*?\*\//g, ''))) {
  console.error('Engine touches the DOM or storage'); process.exit(1);
}
var E = {};
vm.createContext(E);
vm.runInContext(src, E);

var pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  ' + detail : '')); }
}
function S(over) {
  var s = { target: 21, bust: false, bustTo: 13, mode: 'doubles', seriesLen: 1, firstThrow: 'a', loserThrowsFirst: true };
  for (var k in over) s[k] = over[k];
  return s;
}
function F(aw, ac, bw, bc) { return { a: { w: aw, c: ac }, b: { w: bw, c: bc }, ts: 0 }; }
// Frames that bring Team A to 19 with Team B on 0: 12 + 7.
var TO19 = [F(0, 4, 0, 0), F(1, 2, 0, 0)];

console.log('Cornhole Scorekeeper engine tests');

// 1 Cancellation
var n = E.frameNet(F(1, 3, 2, 2));
ok('cancellation: 3c 1w vs 2c 2w gives A 2', n.scorer === 'a' && n.pts === 2, JSON.stringify(n));

// 2 Wash
var c = E.compute([F(1, 1, 1, 1)], S({ firstThrow: 'b' }));
ok('wash scores nothing and first throw stays', c.totals.a === 0 && c.totals.b === 0 && c.nextFirst === 'b' && c.rows[0].scorer === null);
c = E.compute([F(0, 1, 0, 0), F(2, 0, 0, 2)], S());
ok('first throw passes to the last scorer', c.nextFirst === 'b');

// 3 Four bagger
c = E.compute([F(0, 4, 0, 0)], S());
ok('four bagger against nothing is 12', c.totals.a === 12 && c.fourBaggers.a === 1 && c.fourBaggers.b === 0);

// 4 Exact 21 wins
c = E.compute(TO19.concat([F(2, 0, 0, 0)]), S());
ok('exact 21 wins', c.winner === 'a' && c.totals.a === 21 && c.winFrame === 2);

// 5 Officials rules: 19 + 5 = 24 wins
c = E.compute(TO19.concat([F(2, 1, 0, 0)]), S());
ok('officials rules: 19 plus 5 wins at 24', c.winner === 'a' && c.totals.a === 24);

// 6 Bust: 19 + 5 resets to 13
c = E.compute(TO19.concat([F(2, 1, 0, 0)]), S({ bust: true }));
ok('bust: 19 plus 5 resets to 13', c.winner === null && c.totals.a === 13 && c.rows[2].bust === true);

// 7 Bust checked after cancellation
c = E.compute(TO19.concat([F(0, 4, 0, 3)]), S({ bust: true }));
ok('bust after cancellation: at 19, 4c vs 3c busts', c.totals.a === 13 && c.rows[2].pts === 3 && c.rows[2].bust && !c.winner);
c = E.compute(TO19.concat([F(0, 3, 0, 2)]), S({ bust: true }));
ok('19 plus a cancelled 12 vs 6 is not judged on the raw 12', c.rows[2].pts === 3 && c.totals.a === 13);

// 8 Exact 21 after cancellation wins with bust on
c = E.compute(TO19.concat([F(0, 3, 1, 2)]), S({ bust: true }));
ok('exact 21 after cancellation wins with bust on', c.winner === 'a' && c.totals.a === 21 && c.rows[2].pts === 2);

// 9 bustTo at or above target rejected
ok('bustTo equal to target rejected', E.validSettings(S({ bustTo: 21 })) === false);
ok('bustTo above target rejected', E.validSettings(S({ target: 11, bustTo: 13 })) === false);
ok('valid settings accepted', E.validSettings(S({ target: 15, bustTo: 7, bust: true })) === true);
ok('odd target rejected', E.validSettings(S({ target: 20 })) === false);

// 10 Five bags rejected
ok('five bags on one side rejected', E.validSide({ w: 2, c: 3 }) === false);
ok('negative or fractional bags rejected', E.validSide({ w: -1, c: 0 }) === false && E.validSide({ w: 1.5, c: 0 }) === false);
ok('four bags accepted', E.validSide({ w: 1, c: 3 }) === true);

// 11 Editing frame 2 recomputes everything after it
var frames = [F(0, 1, 0, 0), F(1, 0, 0, 0), F(0, 0, 0, 2), F(2, 0, 0, 0)];
var before = E.compute(frames, S());
var edited = frames.slice();
edited[1] = F(0, 2, 0, 0);
var after = E.compute(edited, S());
ok('editing frame 2 recomputes later totals',
  before.rows[1].totals.a === 4 && after.rows[1].totals.a === 9 &&
  before.rows[3].totals.a === 6 && after.rows[3].totals.a === 11 &&
  after.rows[2].totals.b === 6, JSON.stringify(after.rows.map(function (r) { return r.totals; })));

// 12 Undo after a win reopens the game
var won = TO19.concat([F(2, 0, 0, 0)]);
ok('game is won before undo', E.compute(won, S()).winner === 'a');
c = E.compute(E.undoFrames(won), S());
ok('undo after a win reopens the game', c.winner === null && c.totals.a === 19);

// 13 Frames after a win ignored
c = E.compute(won.concat([F(0, 0, 0, 4), F(0, 0, 0, 4)]), S());
ok('frames after a win are ignored', c.winner === 'a' && c.totals.b === 0 && c.extraFrames === 2 && c.rows[4].extra);
ok('trim drops frames after the win', E.trimFrames(won.concat([F(0, 0, 0, 4)]), S()).length === 3);

// 14 Points per frame
c = E.compute([F(1, 3, 2, 2), F(0, 0, 4, 0), F(0, 4, 0, 0)], S());
// A raw: 10, 0, 12 = 22 / 3 = 7.33 ; B raw: 8, 4, 0 = 12 / 3 = 4
ok('points per frame', c.ppf.a === 7.33 && c.ppf.b === 4 && c.played === 3, JSON.stringify(c.ppf));
c = E.compute(won.concat([F(0, 0, 0, 4)]), S());
ok('points per frame ignores frames after the win', c.ppf.b === 0 && c.played === 3);

// 15 Series
var g = function (w) { return { winner: w }; };
var s3 = E.seriesStatus([g('a'), g('b')], 3);
ok('best of 3 open at 1-1', !s3.decided && s3.need === 2);
s3 = E.seriesStatus([g('a'), g('b'), g('b')], 3);
ok('best of 3 decided 2-1', s3.decided && s3.winner === 'b' && s3.wins.b === 2);
var s5 = E.seriesStatus([g('a'), g('a'), g('b'), g('b')], 5);
ok('best of 5 open at 2-2', !s5.decided && s5.need === 3);
s5 = E.seriesStatus([g('a'), g('a'), g('b'), g('b'), g('a')], 5);
ok('best of 5 decided 3-2', s5.decided && s5.winner === 'a');
ok('single game decided by one win', E.seriesStatus([g('b')], 1).winner === 'b');

// 16 ACL stat line
var sf = [F(1, 3, 2, 2), F(0, 0, 4, 0), F(0, 4, 0, 0), F(1, 1, 1, 1)];
// A: 10, 0, 12, 4 = 26 over 4 = 6.5 ; B: 8, 4, 0, 4 = 16 over 4 = 4
var sa = E.sideStats(sf, 'a'), sb = E.sideStats(sf, 'b');
ok('PPR and opponent PPR', sa.ppr === 6.5 && sa.oppr === 4 && sb.ppr === 4, JSON.stringify(sa));
ok('DPR is PPR minus opponent PPR', sa.dpr === 2.5 && sb.dpr === -2.5);
// A bags: in 3+0+4+1 = 8, on 1+0+0+1 = 2, off 0+4+0+2 = 6 of 16
ok('bags in, on, off percent', sa.bagsIn === 50 && sa.bagsOn === 12.5 && sa.bagsOff === 37.5 && sa.bagsIn + sa.bagsOn + sa.bagsOff === 100, JSON.stringify(sa));
ok('four bagger percent', sa.fourBaggers === 1 && sa.fourPct === 25);
ok('rounds won, tied, lost', sa.won === 2 && sa.tied === 1 && sa.lost === 1 && sa.wonPct === 50 && sb.won === 1 && sb.lost === 2);
c = E.compute(won.concat([F(0, 0, 0, 4)]), S());
ok('compute stats stop at the winning frame', c.stats.a.rounds === 3 && c.stats.b.bagsIn === 0);

// 17 Doubles per-player split by frame parity
var dp = [F(0, 4, 0, 0), F(4, 0, 0, 0), F(0, 2, 0, 0), F(2, 0, 0, 0)];
var p0 = E.playerStats(dp, 'a', 0), p1 = E.playerStats(dp, 'a', 1);
ok('odd frames go to the first player', p0.rounds === 2 && p0.ppr === 9 && p0.fourBaggers === 1);
ok('even frames go to the second player', p1.rounds === 2 && p1.ppr === 3 && p1.bagsIn === 0);

// 18 Career stats across history
var H = [
  { seriesId: 's1', seriesLen: 3, mode: 'doubles', teams: ['Iacopellis', 'Neighbors'], players: [['Stino', 'Bianca'], ['Joe', '']], winner: 'a', frames: dp },
  { seriesId: 's1', seriesLen: 3, mode: 'doubles', teams: ['iacopellis ', 'Neighbors'], players: [['Stino', 'Bianca'], ['Joe', '']], winner: 'a', frames: dp },
  { seriesId: 's2', seriesLen: 1, mode: 'singles', teams: ['Stino', 'Simon'], winner: 'b', frames: [F(0, 0, 0, 1)] }
];
var cs = E.careerStats(H);
var team = cs.teams.filter(function (t) { return t.name === 'Iacopellis'; })[0];
ok('team names merge across case and spacing', team && team.games === 2 && team.wins === 2 && team.series === 1, JSON.stringify(team));
var stino = cs.players.filter(function (t) { return t.name === 'Stino'; })[0];
ok('player career joins doubles and singles', stino && stino.games === 3 && stino.wins === 2 && stino.stats.rounds === 5, JSON.stringify(stino));
ok('unnamed doubles players are skipped', cs.players.every(function (x) { return x.name !== ''; }) && cs.players.length === 4, cs.players.map(function (x) { return x.name; }).join());
ok('career sorted by PPR', cs.players[0].stats.ppr >= cs.players[cs.players.length - 1].stats.ppr);

// 19 Skill bands
ok('skill bands', E.skillLabel(4.9, 5) === 'Beginner' && E.skillLabel(5.5, 5) === 'Intermediate' && E.skillLabel(6.5, 5) === 'Intermediate+' && E.skillLabel(8, 5) === 'Advanced' && E.skillLabel(9.4, 5) === 'Pro level' && E.skillLabel(9, 0) === '');

// Preview
var teams = [{ name: 'Blue' }, { name: 'Amber' }];
var pv = E.previewText(TO19, { a: { w: 2, c: 1 }, b: { w: 0, c: 0 } }, S({ bust: true }), teams);
ok('preview reports a bust', /busts back to 13/.test(pv), pv);
pv = E.previewText([], { a: { w: 1, c: 0 }, b: { w: 1, c: 0 } }, S(), teams);
ok('preview reports a wash', /Wash/.test(pv), pv);
pv = E.previewText([], { a: { w: 5, c: 0 }, b: { w: 0, c: 0 } }, S(), teams);
ok('preview flags too many bags', /four bags/.test(pv), pv);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
