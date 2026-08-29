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

This is also why the number of circles matters less than it looks: the planner
answers fewer colours with more huddles per circle. Six circles or ten, same
result.

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

## Colour: two layers, on purpose

**The interface is Ranna.** **The circles are not.**

Circle colours are wayfinding, not branding. A guest has to spot their circle
across a dark room full of people and say its name out loud to a stranger, so
they are plain primaries — Red, Blue, Yellow, Green, then Purple, Orange, Teal,
Pink. Everybody already knows what blue means. They live in `src/config.js` and
reach the browser as inline styles; nothing in `style.css` defines one.

They are ordered by how far apart they read, so a four-circle event gets
red/blue/yellow/green — the four most separable colours there are.

Everything wrapped around them is brand and only brand.

| Colour | Hex | Used for |
|---|---|---|
| Ember Dawn | `#FB9203` | primary accent, buttons, timers, the wheel pointer |
| Burnt Horizon | `#E3500A` | warnings, disconnection, destructive actions |
| Crimson Bloom | `#C91B7A` | progress gradient, page wash |
| Veil of Becoming | `#68097D` | page wash |
| Dusk Matter | `#3F184D` | card surfaces, the wheel hub ring |
| Abyssal Black | `#080035` | page background, text on Ember |

Type is **Prompt** for display (headings, clocks, numbers) and **Poppins** for
anything that has to be read at length.

**Logo:** `public/brand/logo.png` — the white/reversed Ranna lockup, cropped to
its artwork from the 4500² source (uncropped, the transparent padding shrinks it
to a speck). Every page falls back to a text wordmark if the file goes missing.
See `public/brand/README.md` to swap it.

**Website:** `rannastudios.com` sits quietly at the foot of all three pages.

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
| `app` | this repo, served at `networking.rannastudios.com` |
| `Postgres` | `postgres:16-alpine` on a persistent volume at `/var/lib/postgresql/data` |

Variables already set on `app`:

- `DATABASE_URL` — points at Postgres over Railway's private network
- `ADMIN_PIN` — the operator console PIN
- `PUBLIC_URL` — the domain the QR code encodes (`https://networking.rannastudios.com`)
- `NODE_ENV=production`

`/health` reports which store won, so a deploy that quietly fell back to file
storage is visible before an event rather than during one.

### The custom domain needs TWO DNS records, not one

Live at `networking.rannastudios.com`, on GoDaddy DNS:

| Type | Name | Value |
|---|---|---|
| `CNAME` | `networking` | `enkxfnja.up.railway.app` |
| `TXT` | `_railway-verify.networking` | `railway-verify=442ac327…` (from the Railway dashboard) |

The CNAME routes traffic; the **TXT proves ownership**. With only the CNAME in
place the domain never verifies, no certificate is issued, and Railway's edge
answers every request with its own **404 "the train has not arrived at the
station"** page — which looks like a routing bug and is not one.

Worth knowing because the API hides it: `domain-status` lists only the CNAME in
`dnsRecords` and reports it `PROPAGATED`, so everything reads as correct while
the domain sits at `VALIDATING_OWNERSHIP` with a null error. The TXT token lives
in `status.verificationToken`, which that endpoint does not return — the Railway
dashboard is the only place to read it.

If a certificate ever stalls again: **do not delete and re-add the domain.**
Let's Encrypt rate-limits 5 duplicate certificates per domain per week, and a
re-add can hand back a different CNAME target, meaning a new DNS record and a
fresh propagation wait. `railway domain` in the CLI has a retry that re-triggers
validation without any of that.

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
