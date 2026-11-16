# Cornhole Scorekeeper | AppADay 193

**Live:** https://augustineiacopelli.github.io/appaday-193-cornhole-scorekeeper/

Cornhole Scorekeeper is a backyard scoreboard for singles or doubles. Enter each frame's woodies and cornholes and cancellation scoring nets the difference with a live preview. Play to 11 to 25 with an optional bust rule, run best of 3 or 5 series, and track ACL stats like PPR, DPR and bags in by team and player.

Part of [AppADay](https://augustineiacopelli.github.io/appaday/), one complete app shipped every day. Category: Games.

## How to use it

After each frame, count what each side left on the board and in the hole. Use the Woodies stepper for bags on the board (1 point each) and the Cornholes stepper for bags through the hole (3 points each). Four dots per side mirror the four bags thrown, and a side cannot go past four. The preview line under the steppers shows what will happen before anything is committed: who nets how many, the new score, whether it busts, or whether it wins. Tap Score Frame to commit it. Undo sits beside it and puts the last frame back into the steppers so it can be corrected.

Scoring is cancellation scoring. Only the difference between the two sides counts, so 3 cornholes and a woodie (10) against 2 cornholes and 2 woodies (8) nets 2 for the first side. A wash scores nothing. The side that scored last frame throws first in the next one, and the first throw stays put on a wash. The THROWS FIRST badge on the scoreboard shows who has it. Four cornholes from one side flashes FOUR BAGGER on that team's panel.

By default the first side to reach the target or more wins, as under official rules, so 19 plus 5 wins at 24. Turn on the bust rule and a side that goes over the target drops back to the bust value (13 by default) and must land the target exactly. The bust check runs after cancellation, so at 19 a frame of four cornholes against three nets 3 and busts.

Tap any frame in the log to edit it with the same steppers, then Save, or Delete with two taps. Every total after it is recomputed. If an edit makes the game end earlier, frames after the winning frame are struck through and a Trim button removes them. Undo after a win reopens the game.

When a team wins, the win card shows the final score and the full American Cornhole League stat line for each side, counted over the frames up to the win: PPR (points per round, raw points before cancellation), DPR (differential per round, PPR minus the opponent's PPR), bags in, on and off percentages, four baggers with their percentage, and rounds won, tied and lost. Bags off is simply the four bags thrown minus the woodies and cornholes, so none of this asks for any extra input. Next Game saves the game to history and starts the next one. In a best of 3 or 5 series the button reads Series Complete when the series is decided, and pips under each team name track games won. With Loser throws first turned on, the losing side opens the next game.

## Stats

Each team panel shows a running PPR and DPR once the first frame is in.

In doubles, partners stand at opposite boards, so one pair throws the odd frames (1, 3, 5) and the other pair the even frames. Name the four players in the gear menu and the win card splits PPR, DPR and bags in by player. Unnamed players fall back to the team name with 1 or 2.

The Career tab in Match History combines every saved game by name, ignoring case and stray spaces. Players covers singles players (tracked by team name) and named doubles players; Doubles Teams covers doubles team names. Each card shows games and win percentage, series won, rounds, PPR, DPR, bags in, on and off, four bagger percentage, rounds won, tied and lost, and opponent PPR, with a skill label from common league PPR bands: under 5 beginner, 5 to 6 intermediate, 6 to 7 intermediate plus, 7 to 9 advanced, and 9 and up pro level. Cards are sorted by PPR.

## Customizing

Tap a team name on the scoreboard to rename it. Each team also gets its own color: pick one of nine presets in the gear menu, or set any custom color, and the scoreboard numerals, panel stripe, bag dots, frame log, win card and history all follow it. A color already used by the other team is greyed out, and a team still named after its preset color (Blue, Amber and so on) is renamed to match when you pick a new preset. Very dark custom colors are lifted on the numerals so the score stays readable from across the yard. The gear menu holds team names and colors, doubles player names, singles or doubles, the target, the bust toggle and bust value, series length, who throws first, the loser throws first toggle, Reset Game, and JSON export and import. The clock button opens Match History, grouped by series, which clears with two taps.

The screen stays awake during play where the browser supports the Wake Lock API, and a small dot next to the subtitle shows while the lock is held.

## Storage

Everything stays in this browser's localStorage. `appaday-193-live` holds the settings, team names, frames, the current series and the draft frame, and is saved after every change. `appaday-193-history` holds finished games. Export JSON writes both to one backup file; Import JSON restores it.

## Build

One `index.html` with inline CSS and JavaScript, no frameworks, no build step, Chakra Petch from Google Fonts. The scoring engine sits between `/* ENGINE START */` and `/* ENGINE END */` and touches no DOM: `validSide`, `sidePoints`, `frameNet`, `validSettings`, `compute`, `trimFrames`, `undoFrames`, `seriesStatus`, `previewText`, and the stats functions `sideStats`, `playerStats`, `careerStats` and `skillLabel`. The layout fills the screen at 375px wide in portrait and splits into a scoreboard column and a controls column in landscape.

## Tests

`test.js` loads the engine straight out of `index.html` and runs 45 checks covering cancellation, washes and first throw, four baggers, exact and over target wins, bust before and after cancellation, settings validation, bag limits, frame edits, undo after a win, frames after a win, points per frame, best of 3 and 5 series, the full stat line, the doubles odd and even frame split, career merging by name, and the skill bands.

```
bash tests/run.sh
```

runs the engine tests, `node --check` on the inline script, an ASCII scan, a grep for forbidden APIs, and a count of the required head tags.
