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

Eight colours × four huddles = thirty-two groups, which puts the room back under
the limit. `planGroups()` picks the huddle count automatically and will never
choose a shape that violates the rule. A 22-person circle was never a
conversation anyway.

### Measured

`npm run load` — 300 guests, 10 colours, 10 rounds:

```
round  1: matched 1150ms | 300 phones in 133ms | repeats 0 | colleagues 0 | circle spread 0
...
round 10: matched 1150ms | 300 phones in  54ms | repeats 0 | colleagues 0 | circle spread 0

avg distinct people met: 50.0 | repeat pairs across the whole event: 0
```

`npm run simulate` compares huddles against whole-circle matching on a synthetic
room. `GUESTS=180 COLORS=8 ROUNDS=12 npm run simulate` to change the shape.

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
