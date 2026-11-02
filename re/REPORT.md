# Reverse-Engineering Report — the reference campground build

> Captured with a real headless Chrome session (bypassed Cloudflare challenge), then
> the game bundle was de-minified. All sites/assets mirrored under `../capture2/`.
> Assets are complete **except** the 6 movies from `the reference host` which were
> downloaded separately to `../capture2/movies/` and are ~1.3 GB total (the site itself
> streams them live from that host).

---

## 1. What the product is

**the reference game** is a *massively-multiplayer, server-authoritative 2D "cursor park"*
made by the original author (the reference host). You log in (no account), your OS mouse **pointer
artwork** becomes your avatar, and you roam a large illustrated campground shared in
real time with every visitor currently online. It is a mix of:

- an open-world "hangout" (see other cursors move/emote/sit in real time),
- a **shop/economy** (collect seashells, buy hats/shorts/sunglasses),
- **badge collection** (9 unlockable achievements),
- small arcade toys (soccer, volleyball, tetherball, slides, seesaw, waterslide…),
- **live events**: a video screen that plays public-domain movies, plus scheduled
  "premieres" fetched from an API (countdown + synchronized playback for everyone),
- several interlinked rooms (11 maps) connected by doors: campground, sauna, tent,
  cave, treehouse, house (main/cafeteria/bedroom/trophy), boat, telescope.

There is deliberately no chat and no names — identity is purely visual.

---

## 2. Tech stack (verified)

| Layer | Technology |
|---|---|
| Framework | **Nuxt 2 + Vue 2** (SSR; `__NUXT__` hydration, `data-n-head-ssr`, `state.js`/`payload.js` statics, chunked webpack) |
| Rendering | HTML5 Canvas 2D (game world drawn with `ctx.drawImage`/fills per frame), plus **Rive 2.47.1** for vector/lottie-style animations |
| Rive backends | `webgl2_advanced.wasm` (WebGL2) with automatic Canvas2D fallback (`?rive=canvas|gl`, SwiftShader detection, sessionStorage pin) |
| Realtime | **Socket.IO** (`io(...)` with `transports:["websocket"]`) to `https://reference-game-dovag.ondigitalocean.app/` |
| Audio | **howler.js** (Howl), many spatial/ambient/one-shot SFX, <audio> for evergreens |
| Live video | HTTP-fetched `countdown.mp4` + `the reference host/movies/*.mp4` playlist, synced to server timestamps |
| Analytics/ads | Plausible (`plausible.the reference host`), Google AdSense, Sentry debug IDs |
| Edge | Cloudflare (challenge + hotlink protection: binary assets need a `Referer`) |
| Persistence | Server-side only (player state, inventory, shop ownership). Browser keeps only `INFO`-ish localStorage (`nf-first-seen`, rive backend pin) |

Entry chain for `/reference-game/`:
`index.html` (SSR shell + meta + AdSense + Plausible) → Nuxt runtime chunks →
`_nuxt/static/<build>/reference-game/state.js` defines `window.__NUXT__` →
async chunk `e57b6e0.js` (310 KB) contains the **entire game** (Vue page component,
game engine, Rive glue, audio, networking).

---

## 3. Boot sequence & page lifecycle

1. SSR HTML renders the landing page (welcome modal over an empty canvas).
2. `mounted()`: sizes window, computes `dpr = min(devicePixelRatio, 2)`, wires listeners
   (resize, mousemove/down/up, contextmenu, keydown, pointerlockchange), creates the
   cursor-overlay 2D canvas, polls `/api/reference-game/schedule` for premieres, calls
   `initSocket()`.
3. Socket handshake → server pushes `init` (your id, player state, map), then a stream
   of `state` snapshots (all players + objects) at ~30 Hz.
4. On **Enter**: requests pointer lock, loads the current map (tiles or full image +
   water mask), fonts/SFX, spawns the cursor.
5. Blur/pointerlock-lost → `Paused. Click resume to re-join.` modal; socket stays up.

---

## 4. Networking & multiplayer model (the core design)

**Server-authoritative with client prediction + reconciliation.**

- **Token**: probably a JWT/cookie-based handshake; events observed:
  ```js
  socket.emit("set-view-radius", { viewRadius })   // 1..4, throttled
  socket.emit("input", { seq, dx, dy })             // at 30 Hz tick
  socket.emit("object-click", data)                 // on every interactable
  socket.emit("enter-door", { doorId, mapId } or coords)
  socket.emit("request-hat", { hatType })
  socket.emit("shop-buy" / "shop-unequip", { itemId })
  socket.emit("emote", { slice })                   // emote wheel selection
  ```
- **Input loop**: deltas accumulate in `pendingDelta`; every game tick the client bumps
  `inputSeq`, sends `{seq, dx, dy}` and stores it in `pendingInputs` with the predicted
  position.
- **State**: server broadcasts `state` containing `players[]`. For the local player the
  client runs `reconcile()`: filters `pendingInputs` whose seq ≤ server seq, re-applies
  remaining inputs as offsets, lerps (`0.5` factor) when velocity is high, else snaps if
  the error exceeds `reconcileThreshold: 5`.
- **Other players**: kept in `otherUsers`, each with a **position buffer** (up to 1 s)
  enabling smooth interpolation of server snapshots.
- Fields per player state: `id, x, y, vx, vy, sq(seq), m(mapId), eq(equipped), el(elevation),
  rl(roastLevel), ht(hat), gl(glasses), sh(shorts), ss(shellsSpent), os(ownedShopItems),
  ct(country), sk(shocked), ga(gatorade), wo(woozy)`.
- Server pushes `object-updates` (dynamic objects: soccer ball, seats, plants…),
  `player-joined/left`, `map-changed`, `animation-start/end`, `player-emote`,
  `door-rejected` (silent), and `kicked` (server disconnect for spam/abuse; client marks
  `wasKicked`, disables reconnection until user clicks Resume).
- `set-view-radius`: radius in "chunks" (250 px cells) computed from viewport
  (`ceil(t/2/250)` capped 1..4) — the server's LOD/dedup optimization for state broadcasting.

### Game constants (module 630)
```js
GAME_CONFIG = { tickRate: 30, maxDelta: 45, maxDeltaWater: 22, maxDeltaOcean: 13,
                reconcileThreshold: 5, horizonY: 3230, horizonFadeDistance: 300 }
```

---

## 5. World & maps

### Coordinates
The campground is a fixed world: **6750 × 3797 px**, camera = canvas centered on cursor
(local player), no scrolling limits inside a map. The bottom edge (below `horizonY`,
~y 3230) fades to an ocean painted with a looping Rive `ocean.riv` (waves parallax
`speed: 0.7`).

### Map registry (11 maps)
```js
default (6750×3797, start 3000,1600, hasWater+hasTop)
sauna, tent, cave (3378×950), treehouse, house-main,
house-cafeteria, house-bedroom, house-trophey, boat, telescope  // ~1700×950 each
```

### Rendering of a map (two modes)
1. **Tile mode (default campground only)**: `maps/tiles/default/manifest.json`
   `{tileSize:512, tileScale:1.6, cols:14, rows:8, width:6750, height:3797}` with boolean
   arrays `layers.base` (112 set) and `layers.top` (64 set). Tiles:
   `{base|top}_{col}_{row}.webp`. Loaded lazily AROUND the camera (only ~30 were fetched
   in our session), decoded in a **dedicated Web Worker + createImageBitmap** pipeline
   (`hasTile/getTile/preloadVisible/evictFar/clear` — view-distance eviction). Low-DPR
   clients try a `/1x` variant first.
2. **Full-image mode (other rooms)**: `optimized/maps/<id>.webp` (+ optional `-top.webp`
   drawn above everything for roofs/trees) + water mask `maps/<id>-water.png`.

### Water
Per-map PNG water mask, downsampled ×4 into an RGBA buffer, converted to a `1/0` grid
(the "can't walk here" data). Movement speed limits: water `maxDelta 22`, ocean `13`
(normal land `45` px/tick).

### Doors
23 `door` elements with `x,y,width,height,to,toX,toY,doorSound`. Doors trigger
`enter-door`, the client shows a fade/transition, waits for server `map-changed`, then
loads the new map and spawns you at `(toX,toY)`.

---

## 6. Object/element system

Map JSON (embedded in the bundle as string blobs) is a flat list of typed elements;
the `<game>` component's engine builds per-type handlers. **54 element types**:

```
ambientAudio, baguette, bat, bell, book, cake, candle, cat, cauldron, chair(5),
chandelier, chilli, clickArea(7), coal, coffee, concert, door(23), drum, exitArea,
fan, floatie, gatorade, gong, hat(15), hourglass, hoverPoint(10), lapTracker, light,
lockedDoor, marshmallow, merryGoRound, metal(3), metalDetector, orange, piano,
pinkFloatie, plant, radio, riveObject(16), river(3), rocks, seashell, seesaw,
shock, soccerBall, spatialAudio(5), squirrel, staticImage(7), sunbathe, tetherball,
thermometer, trapdoor, trigger(2: waterslide, cannonball), video, volleyball, water,
watercan, wood
```

Highlights:
- **riveObject**: `campfire, stage, hottub, flags, lagoon, ocean, river, windsock,
  woodburner, seesaw, merry-go-round, gong, drum, lever, watering, fan, squirrel,
  hourglass, bell, trapdoor, bread, cake, candle, light, chandelier, thermometer,
  piano, radio, cauldron, bat, rocks, sun, clock, fishing-rod, puddle, flies, cat`
  (≈36 `.riv` files — all mirrored). Each has position, width, optional `behind:true`
  (drawn under players), `maxDpr`, `speed`. Rive instances are named
  `reference-game-rive-backend`.
- **staticImage**: pngs with `zIndex`/`layer` for depth sorting (bridges at z 500).
- **chair / sunbathe**: sit-down interactions with progress rings + `chair-sat` events.
- **clickArea(7)**: `shop`, plus map-specific actions (levers, bells…).
- **river**: curved spline (points + per-point width/speed); the cursor "flows" quickly
  on water, used in a bonus lap race.
- **lapTracker**: kart-style checkpoint loop (5 checkpoints) in the campground —
  completing a lap plays `lap-complete`.
- **soccerBall / volleyball / tetherball / merryGoRound / seesaw**: physics toys;
  soccer has a `playArea` quad + 2 `goalEdges` (score → `Goal!` badge + goal flash).
  Ball kick strength capped (`strength` × min(·, 2)); volleyball has net header bounce.
- **metalDetector + metal(3)**: radar sweep; digging finds `watch / wedding ring / bottle cap`
  (coins? mini collection shown as counters).
- **watercan + plant grid**: watering 4 plants → `gardener` badge (`Green Thumb`).
- **marshmallow + campfire**: roast meter (`rl` server field), burning → eat → badge.
- **hat(15)** scattered: pick up → own that hat.
- **cat**: pet it (click) → `Cat Person` badge.
- **baguette / bread / cake / cauldron / bell / trapdoor…** per-room toys.
- **shock / woozy / gatorade**: temporary status effects (electric shock on electrified
  floor, `shocked` flag; gatorade buff sprite `ga`).

---

## 7. Rendering pipeline

1. Clear canvas; draw sky/background gradient (or image `optimized/maps/*`).
2. Draw `behind`-layer Rive objects.
3. Draw map base tiles / full map image (the campground is assembled from visible tiles
   with `imageSmoothingEnabled` off at DPR).
4. Draw **water** (mask-derived blob with animation) drawn above base but under entities,
   using the sampled grid for collision.
5. Draw top tiles/`-top.webp` OVERLAY (trees/roofs) above players → creates depth
   ("walk behind a tree" effect).
6. Draw a **cursor overlay canvas** on top of everything: your actual OS cursor image
   (`optimized/cursor.webp`, `pointer.webp` variants), scaled; for other players same
   artwork + country flag + hats/glasses/shorts drawn on top via small inline drawings
   (`df/hf/pf` helpers: hats with per-type size/offset tables, flags 14×10.5, emotes/horses).
7. DOM `<video>` for the movie screen is absolutely positioned over the world and faded by
   distance from the screen (they render even at distance for simplicity → "screen in the
   world" effect).
8. `rAF` main loop (`gameLoop`) drives rive advance, interpolation, input send, particle/joystick.

The cursor avatars literally reuse your local `cursor.webp` + pointer assets — that's the
whole "campground for your cursor" conceit.

---

## 8. Audio (howler.js)

- **One-shots** by name: `beep book bucket camera chandelier discovery diving-board
  dizzy eat fire-put flicker floatie hourglass lap-complete lever light metal-pick
  orange pickup pop shock slide slurp steam stick wheel whoosh` + sports
  `soccer-goal soccer-kick soccer-out volleyball-hit volleyball-net`
  (files `optimized/sounds/<name>.mp3`, 404s for the 2 not shipped).
- **spatialAudio** nodes in the map JSON: `{x,y,sound,radius,falloff,maxVolume}` for
  `campfire, hot-tub, fountain, waterfall, water-stream, river(×5), ocean-waves, flags,
  small-waterfall, buzz, coal` — volume fades with distance from the player.
- **ambientAudio**: `walking` (0.12), `forest` (0.17), `sauna` (0.3)… loops.
- **concert**: `optimized/concert/1..8.mp3` positional on the stage radius (0.27 max).
- **Movie screen**: a `<video>` element; its own audio muted and replaced by
  distance-faded volume within `audioRadius 350 / falloff 200`.

---

## 9. Economy, shop & badges

### Shells
Beach has `seashell` elements (17 in the default map). Clicking collects → server
increments shell count (`shellCount`), client shows a shell modal & plays `discovery`.
Total count 17 → dedicated badge. Spending is tracked as `shellsSpent` (server-authoritative).

### Shop (3 items, 5 shells each)
| Item | Slot | Image |
|---|---|---|
| Camp Cap (`ccap`) | hat | `shop/ccap.png` |
| Shorts | shorts | `shop/shorts.png` |
| Sunglasses | glasses | `shop/sunglasses.png` |

Buying/unequipping emits `shop-buy`/`shop-unequip`; server returns ownership array `os`
and re-broadcasts your equipped slots to everyone (server re-renders your avocado).

### Badges (9)
`cannonball`, `metalDetector` (Treasure Hunter), `goal` (Goal!), `marshmallow` (S'more
Please), `cat` (Cat Person), `chairs` (sit in 2 chairs), `waterslide` (Slide!), `seashells`
(Beachcomber), `gardener` (Green Thumb) — images `badges/*.png` + `locked.png`; modal grid.

### Hats / flags / emotes / horses
- 19 hat sprites with per-hat draw offsets (cap, towel, party, beret(404), chef, ccap,
  shorts, sunglasses, 3d-glasses, snorkel, normal, newspaper, sailor, miner, party-1..3,
  wavy, explorer).
- 20 country flags (`flags/<cc>.webp`) chosen from IP geolocation (`country` field).
- Emote wheel → `emotes/1..8.webp`; after the race event, horses (`horses/1..7.png`)
  replace emotes (live-event gimmick).

---

## 10. Live events & the movie screen

- `fetch("the reference host/api/reference-game/schedule")` returns:
  ```json
  {"premieres":[{"id":"start","title":"Life Is Pain","startMs":1778950800000,"durationSeconds":360}, ...]}
  ```
  Mirrored at `api/reference-game/schedule` (captured).
- During a premiere, the site shows a **countdown video** (`videos/countdown.mp4`),
  then synchronizes playback of a public-domain movie for everyone connected
  (16:9 screen element on the map on a picnic ~ (5410,2478) tilted `skewY:23`).
- The **playlist** (`video` element) has 6 classic titles streamed from
  `the reference host/movies/1..6.mp4`:
  12 Angry Men, Charlie Chaplin, King Kong vs Godzilla, Popeye, Superman, Looney Tunes —
  with durations in ms; `window._video` exposes the active movie for debugging.
- `Td = "the reference host/api/reference-game/video"` is a video telemetry endpoint
  (reports playback stats/errors).

---

## 11. UI components (all Vue SFCs in one bundle)

- Welcome modal ("Welcome to the reference game! Enjoy your stay" + Enter → pointer lock).
- Pause modal ("Paused. Click resume to re-join.").
- Shop modal, Badges modal, Shells modal, Postcard (share?) modal.
- Movie title/concert title toasts, `hover-tooltip`, baguette pickup counter.
- **Touch controls**: virtual joystick (`radius 45`) with a deadzone (0.15) + squared
  response curve (0.6 smoothing EMA); tap button. Shown only when `isTouchDevice &&
  width < 800`.
- Top-left brand link; reference-game logo.png.

---

## 12. Anti-abuse / operational notes

- `kicked` event: server hard-disconnects; client freezes its socket (no auto-reconnect)
  until the user clicks Resume (post-`wasKicked` → re-enable reconnection). Suggests
  rate-limiting/tarpit server logic for rapid input.
- `door-rejected` is silently dropped (server refuses teleports it can't validate).
- `set-view-radius` throttling on resize (300 ms debounce) + `computeViewRadius` cap 4.
- Network polling for premieres every 1 s (`_premiereInterval`).

---

## 13. Asset inventory (complete mirror)

Everything is under `../capture2/site/reference-game/` unless noted:

- `logo.svg/png`, `optimized/` (cursor, pointer, objects{…,garden}, hats, flags, emotes,
  maps, sounds, concert 1..8)
- `maps/tiles/default/{manifest.json,1x? ,{base,top}_*.webp}` + `default-water.png`
- `optimized/maps/{sauna,tent,cave,treehouse,house-main,house-cafeteria,house-bedroom,
  house-trophey,boat,telescope}.webp`
- `animations/*.riv` (21) — delivered only with a `Referer` header
- `riv/2.47.1/webgl2_advanced.wasm`
- `shop/{ccap,shorts,sunglasses}.png`, `badges/*.png`, `bridges/bridge-{1,2,3}.png`
- `videos/countdown.mp4`
- Movies (external host, captured separately into `../capture2/movies/`):
  1.mp4 256M, 2.mp4 71M, 3.mp4 402M, 4.mp4 319M, 5.mp4 113M, 6.mp4 132M
- Full request log: `network-requests.tsv` (203 entries: status/type/size/url)
- Beautified game bundle: `game-chunk.prettified.js` (17 276 lines)

---

## 14. What could NOT be obtained

- The **Socket.IO server** (`reference-game-dovag.ondigitalocean.app`) — no server source;
  only the wire protocol above. A local re-make needs a compatible server (Node + Socket.IO,
  ~30 Hz state broadcast, input validation, shells/shop/badges persistence).
- Server-held persistence format (play key/DB) — unknown, but the API surface is clear.
- `beret.webp` (404 — not shipped), `volleyball-net.mp3`, `sauna.mp3`, `horses/8.png` (404s).
- Rive sources (`.riv` are compiled binaries — extracted but not editable without Rive editor).

---

## 15. Recreation plan (recommended minimal clone)

1. **Static host**: mirror `capture2/site/reference-game` + `_nuxt/*.js` exactly (works
   offline; Rive WASM loads from `/reference-game/rive/...`).
2. **Server**: Node + Socket.IO implementing the observed protocol:
   `init`, `state` (30 Hz, players + dynamic objects), `object-updates`, input consume
   (dx/dy per tick, maxDelta clamp), door checks, map_changed, shop-buy/unequip,
   request-hat, emote, set-view-radius, kicked.
3. **Client**: reuse the de-minified page component engine semantics (map JSON, element
   handlers, tile worker, water grid, rive glue, howler) — or rebuild it in a framework-agnostic
   way following section 6/7.
4. **Events**: implement `/api/reference-game/schedule` + countdown + role out the movie
   playlist locally.
5. Soft/mirrored copy: keep hardcoded `the reference host` URLs patched to local files.
---

## 16. Standalone rebuild status (final)

A framework-free standalone rebuild lives in `standalone/` (run `node serve.js` → http://127.0.0.1:8901/).
It mirrors the original engine semantics from section 6/7 using the mirrored assets only, with
procedural fallbacks where the live site refuses to serve files even to real browsers.

**Verified working (Playwright end-to-end, real Chrome):**
- Boot → enter → walk with keyboard/touch joystick, camera clamp + shake.
- All 11 rooms load (`default`, `sauna`, `tent`, `cave`, `treehouse`, `house-main`,
  `house-cafeteria`, `house-bedroom`, `house-trophey`, `boat`, `telescope`), including
  real door transitions (`beach door → sauna` verified by walking through).
- Economy/shop: `ccShells(20)` → buy Camp Cap (15 shells left, added to hats) → click to
  equip → `{hat:"ccap", hats:["ccap"]}`; badge modal auto-hides after 3 s.
- Rive animated objects render: tent cauldron + drum (drawing surface resized every frame),
  treehouse squirrel/trapdoor, cave bat/crystals, boat bell/fishing-line, cafeteria cake/piano,
  concert stage, etc.
- `probe.js` smoke test: `errors: []`, `uniqueMissing: []` (zero page errors, zero missing assets).
- `e2e.js`: `errors: []` after door walk + shop flow.

**Notable engine recreations:**
- **Y-axis**: original engine is bottom-up (`mapH - y`); all map JSON gets flipped to
  top-down at load (`U.flipMap`), checkpoint lap points too (`CC.flipCheckpoints`, default H = 3797).
- **Rive glue**: HEAD-preflight gates real `.riv` mounts (transient aborts retry; real 404s stick);
  WASM pointed at local `rive/2.47.1/webgl2_advanced.wasm`.
- **Ambient art**: the live site 403s/404s its ambient `.riv` loops even to real browsers, so
  ambient motion is procedural (`procfx.js`); gadget rives shipped fine.
- **Audio**: `spatialAlias` table maps requested-but-unshipped mp3s to shipped ones;
  ambient loop whitelist = walking + forest.
- **Missing assets tolerated**: `beret.webp`, `volleyball-net.mp3`, `sauna.mp3`, `horses/8.png`
  (all 404 on the live site too) fall back gracefully.

**Deviations (documented):**
- No multiplayer (Socket.IO server can't be mirrored; protocol documented in section 13).
- Persistence is localStorage (`cc-standalone-save-v1`), not the server play key.
- Movies still stream from `the reference host/movies/` (`CC.LIVE.moviesBase`) as in the original.
- Door affordance: invisible doors get a small mat only when the door rect is small (boat's
  2000 px gangway renders nothing — it previously painted the whole sky).
- `pell` → local ACCM policies.

**Branding: welcome sign rebranded (verified in live Chrome, `signlive.js` + full `probe.js`):**
The original "the reference game" welcome sign on the campground island (world ~x 2758-3302,
y 1840-2005; nearest spawn x 3000 y 1600) was repainted to read "Explore Chaupal". The sign
lives in the **top layer** tiles `top_5_3`/`top_6_3` (819×819 native, engine maps
world = tileOrigin + px/1.6 — the earlier base-layer attempt at 1:1 was misaligned and was
reverted; `paintsign.html`/`paintsign.js` paint the board + text into the top tiles at the
correct scale, plank seams and legs preserved). Base tiles `base_5_3`/`base_6_3` restored to
originals. `probe.js`: `errors: []`, `uniqueMissing: []` after the change.

**Bug-fix pass (this session) — three real map/coordinate bugs fixed and verified live:**

1. **Destination coordinates were Y-flipped against the wrong map.** `U.flipYObject` flipped
every `*Y` key including cross-map door destinations `toY`, against the *source* map's height
(e.g. default's `toY=510` became `3147`), so arrivals landed at the destination map's clamped
bottom wall (`y = h-8`) instead of the doorway. Fix: `toY` is kept raw in map JSON and is now
flipped against the *destination* map's height at spawn time in `Game.prototype.load`.
Result (verified live): `sauna → (830,316)`, `tent → (215,412)`, `cave → (3065,165)`,
`treehouse → (140,846)`, `house-main → (825,456)`, `boat → (1033,804)` — each on its authored
doorway, previously all clamped to the far wall.

2. **Telescope ↔ treehouse infinite map bounce.** The telescope map's `exitArea` (radius 380,
covering almost the whole room) plus the treehouse→telescope door sitting exactly at the
telescope's arrival point caused `goTo(treehouse) → arrive on door → goTo(telescope) → spawn
inside exit ring → …` forever, and afterwards `ccGoto("default")` could never complete.
Fixes: relocated the exit ring to the actual exit corner (`x 1600, y 120, r 160`) so spawning
in the observatory no longer re-triggers it, moved the treehouse arrival to open floor
(`toX 430, toY 650`), and added a short entry-grace window (`entryGraceUntil`, ~220 ms) so a
door under the arrival point can never bounce you back the frame you appear.
Result (verified live): telescope loads and stays; `ccGoto("default")` works again; full
`probe.js` green with the final room report correctly returning to `default`.

3. **"Camp is full of people" restoration — ambient camper NPCs upgraded.** The port has no
multiplayer server (section 13), so `js/campers.js` populates the campground with friendly
wandering visitors (cursor avatar + random hat + name tag + occasional emote). This session
bumped density `6 → 12–22`, scattered anchor points across the entire 6750×3797 map (grid
cells + landmark spots: chairs, seesaw, merry-go-round, water can, static images), and made
walk targets avoid doorway rects so NPCs never camp on a door. Verified live in Chrome: 22
campers spawn across every quadrant; `g.pick(wx,wy)` returns the `Camper`; a real mousedown at
the camper's on-screen pixel fires the wave animation + toast `"Gus waves at you!"` + `pop`
sound; campers still never block door triggers (door checks use the player's feet, not NPCs).
Campers only spawn on the tile-map campground; room interiors stay as authored.

**Robustness polyfills (still verified green by `probe.js`):**
- `CanvasRenderingContext2D.prototype.roundRect` polyfill in `js/util.js` — without it every
`roundRect` call in the draw loop throws on Chrome < 99 / Firefox < 112 / Safari < 16, which
would blank the whole world (a plausible cause for a "everything missing" report).
- `U.detectWebp(cb)` / `U.noWebp` WebP capability flag for the tile pipeline.
- `TileMap.preload` now fetches only ±512 px around the visible viewport (was ±2 tiles),
which keeps the phantom `top_10_7.webp` (missing on the live site too, see section 5) out of
the request stream.

**Probe-misread clarifications from the earlier validation pass (no code change):**
- Object kinds live in `def.type`, not the runtime object's `o.type` — `spawn()` copies the
kind into the def; the earlier probe reading `o.type` saw "no types" that were really there.
- `Howl._howls` is an *instance* field in howler 2.2.4, so an earlier "audio is dead"
reading was wrong; audio genuinely plays (AudioContext `running`, 6 mp3s HTTP 200).
- The shell counter is `CCE.load().shells`, not `shellCount` — shell clicks genuinely work.

**17. Village Chaupal — banyan tree gathering (new interactive feature).**

Built from the user's reference sketch (`re/reference-chaupal-dialogue.png`): an interactive
village corner on the campground where four women sit under a banyan tree and talk about
girls' education. All new code is self-contained under `standalone/`:

- **Location:** open field at world (6100, 1870) / mat at (6190, 1970) — east of the
  Clubhouse, south of the playground. Water fraction 0 on every anchor; no doors within
  the canopy; large natural canopy draws on top of the player like the map's own trees.
- **Art (`js/village.js`):** fully procedural canvas (no new image assets) in the game's
  cartoony style — banyan trunk + aerial roots, layered leaf canopy, hanging lantern,
  hanging "Learn • Listen • Support" plaque, jute mat with woven lines and sari-colored
  seat dots, earthen water pot (matka), small orange cat "Mintu" on a rock, and a wooden
  "Village Chaupal" ground sign. Camera checks: canopy pass renders above the player
  (like top-layer tiles); trunk/mat render under entities; the four women are y-depth
  sorted with campers and the player.
- **People (`dialogue.js` content):** four women, each with a distinct education struggle,
  told in warm Hinglish:
  - *Radha Devi* (52) — household chores eat study time, homework by lamp-light;
  - *Savitri* (28, daughter in 6th) — school 6 km away, no transport, and no girls'
    toilet/pads → 4–5 school days lost every month;
  - *Meena* (24) — married at 17, dropped out in 10th, now runs an evening letters
    class ("pathshala") for younger girls;
  - *Kavita* (19) — online classes on a shared phone with no data/electricity; dreams
    of a community library and of becoming a teacher.
  Each chat is a 4–5 line conversation with a **typewriter effect** and a painted
  canvas **portrait** (sari color, bindi, bun) as in the reference mockup.
- **UI (`js/village-ui.js`):** matches the reference panel layout — a speech bubble with
  portrait, name + role badge, "Tap to continue ▸", and ✕; a right-rail menu with the
  four reference actions:
  1. **Talk to the Women** — 4-card chooser (portrait cards) → her story;
  2. **Explore Education** — panel of 5 issue cards (RTE 2009, dropout after class 5–8,
     periods = lost school days, distance, digital divide), each with a tag chip;
  3. **Share Solutions** — panel of 5 solution cards (cycles/safe routes, girls' toilet
     + pad machines, evening pathshala, scholarships, community library + solar);
  4. **View Impact** — timeline of 5 success stories (Kavita's 10th with first division,
     pad machine installed, SHG cycle bank, Radha's granddaughter back in school, the
     evening pathshala serving 14 girls).
  Menu appears when the player is near the tree (< 1000 px), hides when you walk away
  or enter a room; panels close via ✕, dim-click or Escape.
- **Interactions:** clicking a woman directly opens her chat (wave + 💬 + toast
  "…has a story to tell 🌳"); clicking the cat pets it ("Mintu purrs 🐱"); every action
  plays the `pop` sound. Verified live in Chrome (`villagecheck.js`): chooser shows 4
  cards, chat type-advances through Savitri's full story, all three panels open with
  5 cards each, map round-trip (default ↔ sauna) hides the UI and rebuilds the village.
- **Scope:** village exists only on the default campground map; room interiors are
  untouched. `probe.js` stays fully green (`errors: []`, `uniqueMissing: []`) with the
  new scripts (`dialogue.js`, `village.js`, `village-ui.js`) loaded after `campers.js`.

**17b. Art upgrade + wayfinding signs (post-17 revision).**
- Figure art moved out of `village.js` into `js/village-art.js` (loaded first in
  `index.html`): women are now pre-rendered 3× soft-shaded sprites (gradient-shaded
  skin/sari, rim light, gold bangles + jhumka, bun with flowers, ground shadow),
  `buildSprite` x-flips odd-indexed women; `paintPortrait` was ported into this file
  (it is defined here, not `village.js`). `village.js` now contains only Part 2
  (`VillageZone`); `CC_V` (incl. `shade` helper, hoisted to IIFE scope) is exported
  solely by `village-art.js` so `VWaySign` is always present.
- New `VWaySign` wayfinding sign (post + arrow board “Village Chaupal →”): two placed
  on the west approach to the village (world (5720,2000) and (5900,2060)); they are
  pickable (z 1.4, ±52×±40 hitbox), clicking shows “The banyan tree is east ✨” hint
  + toast + `pop` — matching the intro FAQ’s “follow the wayfinding signs east”
  promise. Terrain verified dry (water fraction 0) at both anchor points and on the
  path from the clubhouse area.
- Verified live (`artcheck.js`, `villagecheck.js`): `CC_V.VWaySign` present, women
  render sprites, signs are picked as `VWaySign` and interact, portraits draw
  84×84 with 13+ distinct colors, all dialogue/panels unchanged, `errors: []`.

**17c. Bugfix: phantom interactions + clickable doors (post-17b revision).**
- *Phantom interaction ("happens by itself", "glitches from place to place"):*
  `Game.clickAt` had a final fallback that ran `pick(player.x, player.y)` when
  nothing was under the cursor — so clicking empty grass activated whatever object
  the player happened to stand near (signs, women), making interactions fire
  seemingly on their own and jump between entities while walking. Removed that
  fallback; clicks now interact only with what is actually under the cursor
  (pointer-locked mode unchanged: interacts under the player, per reference-game
  mechanics). Verified: clicking empty grass next to a woman triggers nothing.
- *Unclickable doors/entrances:* `Door` only defined `touching()` (walk-over), never
  `hit()`, and `Game.pick` skips objects without `hit` — so doors were invisible to
  clicks. Added `Door.prototype.hit` (rect + 10 px slack, capped at 340 px so the
  boat's 2000 px gangway doesn't span the whole map) and a `CC_O.Door` branch in
  `interact()`: click a door while nearby → `goTo(dest)` (same transition as
  walking), too far → toast "Walk up to the door to open it", no-dest (locked doors)
  → "This door is locked". Walk-over still works via the update loop.
- Verified live (`bugcheck.js` + door checks): `PICK-AT-TENT-DOOR` now returns the
  door, near-click opens `tent`, far-click refuses with hint, locked door toasts,
  walk-onto still transitions, and full village regression (`villagecheck.js`
  `errors: []`, `probe.js` clean) passes unchanged.

**17d. Bugfix: remaining broken "openings" — telescope exit + treehouse trapdoor (post-17c).**
- A full-map audit after 17c confirmed every `Door` (15 across `default` 7, `telescope`
  1, `treehouse` 2, `cave` 2, `boat` 1, `house-main` 5 incl. the locked one, `tent` 1)
  now has a working `hit()`. Two openings were still not clickable: the telescope
  `ExitArea` and the treehouse `trapdoor`.
- *Telescope `ExitArea`:* it had `render`/`update` but no `hit()`, so it was invisible
  to clicks (walk-over warp still worked). Added `ExitArea.prototype.hit`
  (`U.hitCircle` at the def centre with `radius + 10` slack, `z()` stays `-2` so it
  stays beneath the door strip). The data audit also surfaced a **latent warp loop**:
  the stale `embedded.js` (offline fallback) copy of the exit area had radius 380
  around the room centre, so spawning anywhere near mid-room instantly bounced
  telescope↔treehouse. The live map JSON already carried the sane smaller opening
  (1600,120 r160); aligned `embedded.js` to it so the offline path behaves the same.
  Also fixed the telescope door's `toX/toY` (was 280,470 → landed the player on the
  treehouse→telescope return door and ping-ponged back). Both files now agree.
- *Treehouse `trapdoor`:* it lived in `RIV_GADGETS`, so the spawn branch created a
  plain `ClickArea` gadget (`action:"gadget"`) and silently dropped the map def's
  `to/toX/toY` destination. Added an `o.action === "trapdoor"` branch in `interact()`
  that reads `o.tdest = { to, x, y, sound }`, and the `RIV_GADGETS[type]` spawn branch
  now copies `to/toX/toY/doorSound` into `o.tdest` (with the same riv-y coordinate
  flip as the door/lever). Clicking the trapdoor lever now warps to `default`; the
  hatch itself still spawns as a `Door` (clickable, no art, sound) so both paths work.
- Verified live (`opencheck.js`, plus focused one-off probes): click telescope opening
  → `treehouse`; click trapdoor lever → `default`; click treehouse→telescope return
  door → `telescope`; door/chair/locked-door/latch checks all pass. Full regression
  re-run: `bugcheck.js`, `villagecheck.js`, `artcheck.js`, `probe.js` all
  `errors: []` (only pre-existing harmless console noise: off-map tile
  `maps/tiles/default/top_10_7.webp` at 404, which the tile loader skips and which
  renders nothing since its tile origin (8192,5734) exceeds the 6750×3797 map).
- Temporary probe scripts removed; `bugcheck.js`/`opencheck.js` remain as the
  canonical reproductions.

**17e. Bugfix: every hitbox was mirrored (doors only "worked" by walking).**

Reported as: *clicking a house door does nothing, but clicking near it reacts to a chair or a ball; the campfire, shells and ball games feel missing.*

Root cause: `U.flipYObject` tested keys with `/Y$/` — that only matches a **capital** `Y`, so lowercase `y` was never flipped. The map JSON is authored bottom-up (`mapH - y`), so every element kept its bottom-up y while the artwork is top-down: all 89 campground objects (doors, shells, chairs, campfire, goals) were drawn and hit-tested 1:1 on their raw coordinates, which after the port's top-down render sits at the vertically mirrored spot. Doors therefore "worked" only by walking, because `Door.touching()` was checking the mirrored rectangle too (it happened to land on walkable sand).

Fixes:
- `flipYObject` now flips `y` plus the other world-Y keys (`rivY`, `hitY`, `clickY`, `centerY`, `spriteY`, `sortY`, `fireY`, `soupY`, `leverY`, `audioY`, `soundY`, `titleY`, `campfireY`) and never touches non-position keys (`toY` — flipped against the destination map, `skewY`, `clickOffsetY`, `clickToPlay`). Array-valued geometry is now covered too (`playArea`, `corners`, `goal1`, `goal2`, `candlePoints`, `points`, `checkpoints`, `sounds`, `array`).
- Arrival coordinates: `Game.enterThrough()` flips a door's `toY` against the **destination** map height; `ccGoto()` keeps using screen-space coordinates.
- Race: `Game.start()` used to load the map only after the premiere schedule resolved, so a door entered during boot was overwritten by the initial load. The map now loads immediately, `loadSchedule()` is fire-and-forget, and every `load()` carries a sequence token so a slow fetch can never repaint over a newer room.
- Arrival debounce: doors within ~240 px of the spawn point are silenced for 1.6 s, and the entry grace is 650 ms, so you can't be bounced straight back out of the room you just entered.
- `assets.js` deep-clones the embedded map fallback, because `flipMap` mutates in place (file:// sessions flipped maps twice).
- Pointer lock: `clickAt()` resolves the click against the player when the pointer is locked (locked events report a frozen `clientX/Y`), matching reference-game's "the cursor is you" rule.
- Toys: `SoccerBall.hit`, `Volleyball.hit`, `TetherBall.hit` and `Seesaw.hit` were mutating state, so `pick()` — which runs on every click and hover — kicked balls that were merely *near* the cursor. `hit()` is now a pure predicate; the impulses moved to `kick()` / `whack()` / `push()` and are called from `interact()`. A dead-centre click also gets a direction from the player instead of a zero vector.
- Fire: the roast check and the marshmallow stick art use the map's real campfire position (`Game.findCampfire()`), not the hardcoded `(4560, 2720)`.
- Shock pad, merry-go-round orbit, sauna steam and cauldron FX read their positions from the clicked element instead of constants.

Verification: `node doorcheck.js` → 17/17 (all 8 campground doors click through to the right room and land on the doorway, plus real mouse click, walk-over, campfire, soccer, chair, shell, village). `node mechaniccheck.js` → 25/25 (18 interior doors across all 11 rooms, volleyball, tetherball, seesaw, watering, metal detector, gadgets, triggers). `probe.js` still green: `errors: []`, `uniqueMissing: []`.

**17f. Bugfix: water, the outdoor cinema, and page order.**

- `maps/<id>-water.png` is a *collision* mask (black RGB, alpha = zone), but it was being drawn straight onto the world at 22% — that is where the grey haze came from. `Water` now tints the mask into real water (ocean/river/shallow + a foam edge where water meets land), adds a slow swell and ~90 animated shimmer arcs, and `fraction()` samples top-down (`wy / height`) so swimming works again after the coordinate flip.
- The cinema board is painted into the map's **foreground** tile layer, so the video drawn with the entities was hidden behind it. `VideoScreen` is now painted after the top layer, uses the board's `skewY` (slope, %) so the picture sits in the painted perspective, and is anchored at `def.y - height` (the map's y is the bottom edge).
- Playback: the playlist is rewritten to the local `/movies/N.mp4` library (served with HTTP Range by `serve.js`), starts muted so autoplay is allowed, plays continuously while you are within 900 px of the screen, fades with distance, advances on `ended`, and falls back to the original URL per title. Clicking the screen toggles sound.
- The village menu used a 1,000 px radius and appeared while standing at the cinema; it is now 640 px.
