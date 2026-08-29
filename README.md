# Spin The Wheel — Colors

A live networking activation. Guests scan a QR at the door, spin a colour wheel
on their phone, and walk to the matching coloured circle on the floor. Every few
minutes the colour changes and the room reshuffles.

The wheel is theatre. The server decides each guest's colour **before** the
phone animates anything — that is the only way circles stay even and guests stop
re-meeting the same people.

## Run it

```bash
npm install
ADMIN_PIN=1234 npm start
```

| Page | URL | Who |
|---|---|---|
| Guest | `/` | phones, via the QR |
| Operator console | `/admin` | whoever is running the room |
| Projector view | `/screen` | the big screen in the hall |

Copy `.env.example` to `.env` and set `ADMIN_PIN` before any real event.

## How the matching works

Cutting a room into groups so that everyone keeps meeting new people is the
[social golfer problem](https://en.wikipedia.org/wiki/Social_golfer_problem).
`src/assign.js` runs randomised greedy construction, then directed local search,
then ruin-and-recreate, under a time budget. It optimises four things at once:

1. **Even circles** — guaranteed by construction; every move preserves group size.
2. **No repeat meetings** — a pair who have already talked costs `met²`, so a
   second meeting is tolerated only when unavoidable and a third is fought hard.
3. **Colleagues kept apart** — people from the same company are pushed onto
   different circles. They can talk at the office.
4. **Everybody moves** — nobody is handed the same colour twice running.

### The one rule that decides whether this works

**A repeat-free round is only possible when the group size is no larger than the
number of groups.**

Twenty-two people on one circle, drawn from only eight circles, forces repeat
pairings by pigeonhole from round two — no matching algorithm can fix it. That
is why a colour is split into **huddles**: the colour tells a guest where to
walk, and their phone names the 5–6 people they are actually talking to.

Six colours × eight huddles = forty-eight groups, which puts the room back under
the limit. `planGroups()` picks the huddle count automatically and will never
choose a shape that violates the rule. A 22-person circle was never a
conversation anyway.

This is also why capping the palette at six brand colours costs nothing: the
planner compensates with more huddles per circle. Fewer colours, same result.

### Measured

`npm run load` — 300 guests, 6 colours, 10 rounds:

```
round  1: matched 1150ms | 300 phones in 142ms | repeats 0 | colleagues 0 | circle spread 0
...
round 10: matched 1150ms | 300 phones in  60ms | repeats 0 | colleagues 0 | circle spread 0

avg distinct people met: 52.8 | repeat pairs across the whole event: 0
```

`npm run simulate` compares huddles against whole-circle matching on a synthetic
room. `GUESTS=180 COLORS=6 ROUNDS=12 npm run simulate` to change the shape.

## Brand

Ranna palette only — the six brand colours, tints of them, and white. No colour
in the app comes from anywhere else.

| Colour | Hex | Used for |
|---|---|---|
| Ember Dawn | `#FB9203` | primary accent, timers, the wheel pointer |
| Burnt Horizon | `#E3500A` | warnings, disconnection |
| Crimson Bloom | `#C91B7A` | circle colour, progress gradient |
| Veil of Becoming | `#68097D` | circle colour, page wash |
| Dusk Matter | `#3F184D` | circle colour, surfaces |
| Abyssal Black | `#080035` | page background |

Type is **Prompt** for display (headings, clocks, numbers) and **Poppins** for
anything that has to be read at length.

**Logo:** drop the white/reversed mark at `public/brand/logo.svg`. Every page
loads it and falls back to a text wordmark if it is missing, so the app runs
either way — but the real asset should be in before a client sees it.

### Circle colours are ordered by separability, not by the brand sheet

The operator picks how many circles are in play and gets the first N, so a
four-circle event gets the four that read furthest apart across a room. Dusk
Matter and Abyssal Black are flagged `floorRisk`: they are brand colours and
they work, but they are dark, and a dark circle on a dark event floor is hard to
find from across the room. The console warns when a floor plan depends on them —
light or edge those circles.

## Sound and haptics

Every sound is synthesised with the Web Audio API. Nothing to download over
venue wifi, nothing to cache, no delay at the moment it matters.

| Cue | Sound | Vibration |
|---|---|---|
| Wheel spins | rising sweep, ticks thinning out as it slows | short pulse |
| Wheel lands | major arpeggio | double pulse |
| **Rotation** | two rising two-note calls over a low tone | long insistent pattern |
| Event ends | falling three-note resolve | soft double |

Guests get a sound toggle in the header; the choice is remembered. The projector
view arms the same rotation chime with one click, so it can carry through the
house speakers — which is louder and better than three hundred phone speakers,
though both firing together is its own moment.

Browsers refuse audio before a user gesture, so the context is unlocked on the
join tap (guests) and the arm-screen tap (projector).

## Operating it

Start the event from `/admin` once the room has filled a little. The console
shows live circle counts, a health readout per round (repeats, colleague
pairings, how long matching took), and lets you rotate early, add or remove a
minute, pause, and export a CSV of everyone who attended.

- **Late arrivals** are seated immediately into the emptiest, least-conflicting
  huddle — they never wait out a round.
- **Phones in pockets** are fine. Guests stay on the roster for
  `absentAfterMinutes` (25 by default) of total silence, and the page re-syncs
  on wake, on reconnect, and by polling when the socket drops.
- **A restart mid-event loses nothing.** State is snapshotted continuously; if a
  round expired while the server was down, it rotates on boot.

## Railway

Project `spin-the-wheel-colors`, production environment, two services:

| Service | What |
|---|---|
| `app` | this repo, exposed at the public domain |
| `Postgres` | `postgres:16-alpine` on a persistent volume at `/var/lib/postgresql/data` |

Variables already set on `app`:

- `DATABASE_URL` — points at Postgres over Railway's private network
- `ADMIN_PIN` — the operator console PIN
- `PUBLIC_URL` — the domain the QR code encodes
- `NODE_ENV=production`

`/health` reports which store won, so a deploy that quietly fell back to file
storage is visible before an event rather than during one.

### Keep it to one replica

The live event lives in memory and is snapshotted to Postgres. Two replicas
would each hold their own copy of the room and hand out contradictory colours,
so `numReplicas` is pinned to 1 in `railway.json`. Scaling this app means
moving round state into Postgres proper, not adding instances.

## Layout

```
src/assign.js   the matching engine — no I/O, pure functions, the interesting part
src/state.js    the live event: guests, rounds, meeting history, views
src/store.js    snapshot persistence (Postgres or file)
src/config.js   palette, icebreaker questions, cost weights
src/server.js   HTTP + WebSocket
public/         guest page, operator console, projector view
scripts/        e2e, load test, offline simulation
```

Tuning lives in `src/config.js` — `WEIGHTS` decides how hard the matcher fights
repeat meetings versus colleague pairings.
