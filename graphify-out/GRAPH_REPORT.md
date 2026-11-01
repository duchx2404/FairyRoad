# Graph Report - TienLo  (2026-11-01)

## Corpus Check
- 84 files · ~244,248 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .log 16, (none) 2, .bat 1)

## Summary
- 1648 nodes · 7287 edges · 61 communities (58 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Game Mechanics
- World Setup
- place.ts
- panels.ts
- Map Regions
- openLibrary
- Game Actions
- DAO能力系统
- 自然与齿轮
- craft.ts
- 地图与地理
- arrangeByPower
- kinhmach.ts
- engine/tienco.ts
- bang.ts
- Item Management
- h
- Scene Management
- Sect Management
- Life Events
- Court Management
- Realm Management
- Origin Management
- Family & Marriage
- detailCard
- Life Management
- Game Mechanics
- UI Icons
- mark
- Character Skills
- 3D Modeling and Texturing
- effRi
- Image Processing and Background Effects
- state.ts
- actions.ts
- modal.ts
- util.ts
- stat
- Art Generation
- Image Processing
- char.ts
- openModal
- engine/core.ts
- hud.ts
- Project Setup
- Celestial Offices
- Realm Life Stages
- Beast Generation
- Game Events
- Gear Trading
- Testing Tools
- combat.ts
- TypeScript Config
- Simulation Logic
- menus.ts
- Glyph System
- El
- hrand
- Image Processing
- ensureChauEmpires

## God Nodes (most connected - your core abstractions)
1. `effRi()` - 106 edges
2. `h()` - 94 edges
3. `charPanel()` - 72 edges
4. `ch()` - 71 edges
5. `openPlace()` - 67 edges
6. `clamp()` - 66 edges
7. `pick()` - 66 edges
8. `mark()` - 59 edges
9. `RMAX()` - 55 edges
10. `passTime()` - 54 edges

## Surprising Connections (you probably didn't know these)
- `Thiên Cơ Lâu & luật phi thăng` --references--> `soulAge()`  [INFERRED]
  README.md → src/engine/char.ts
- `Thiên Cơ Lâu & luật phi thăng` --references--> `passTime()`  [INFERRED]
  README.md → src/engine/core.ts
- `Thiên Cơ Lâu & luật phi thăng` --references--> `tiencoTick()`  [INFERRED]
  README.md → src/engine/tienco.ts
- `Thiên Cơ Lâu & luật phi thăng` --references--> `lifeLived()`  [INFERRED]
  README.md → src/engine/char.ts
- `Intent` --references--> `Skill`  [EXTRACTED]
  src/engine/combat.ts → src/data/items.ts

## Import Cycles
- None detected.

## Communities (61 total, 3 thin omitted)

### Community 0 - "Game Mechanics"
Cohesion: 0.08
Nodes (33): elMult(), Skill, BASIC, Battle, fightLogs, FightPending, manualFights(), Script (+25 more)

### Community 1 - "World Setup"
Cohesion: 0.05
Nodes (39): BASE_CHU, BASE_GUARD, BASE_TOP, BLOOD_N, CHAU, CHAU_LAND, CHAU_MID, ChauLand (+31 more)

### Community 2 - "place.ts"
Cohesion: 0.17
Nodes (31): courtReq(), shjAt(), nextOpen(), realmOpen(), canTakePost(), myCourt(), resignPost(), takePost() (+23 more)

### Community 3 - "panels.ts"
Cohesion: 0.05
Nodes (97): Chạy, Cấu trúc, Thiên Cơ Lâu & luật phi thăng, Thêm sự kiện, Tiên Lộ Mạn Mạn (仙路漫漫), BREAK_BASE, CLANS, SLOTS (+89 more)

### Community 4 - "Map Regions"
Cohesion: 0.06
Nodes (44): CHAU_BORDERS, ISLANDS, LANDMASS, LANDS, LOC_LIST, MAINLAND, MOUNTAINS, PEAKS (+36 more)

### Community 5 - "openLibrary"
Cohesion: 0.32
Nodes (19): fmt(), gearLabel(), itemDesc(), itemTier(), gearLine(), wareCat(), matIconSvg(), scrollIconSvg() (+11 more)

### Community 6 - "Game Actions"
Cohesion: 0.17
Nodes (38): clamp(), ri(), RMAX(), evil(), gain(), giveGear(), heal(), hurt() (+30 more)

### Community 7 - "DAO能力系统"
Cohesion: 0.12
Nodes (33): BATQUAI, breakthroughScene(), daiDaoScene(), daoScene(), affinity(), canFuse(), canLord(), contemplate() (+25 more)

### Community 8 - "自然与齿轮"
Cohesion: 0.09
Nodes (36): TIER_C, bookArt(), crystalLeaf(), flower(), frame(), fruit(), GEAR_SHAPES, GEAR_SLUG (+28 more)

### Community 9 - "craft.ts"
Cohesion: 0.15
Nodes (36): rf(), coPaper(), HERBS, pillGiai(), pillGrade(), PILLS, TALIS, talisGrade() (+28 more)

### Community 10 - "地图与地理"
Cohesion: 0.08
Nodes (26): Chau, Empire, LocType, majorRivers(), MAP_H, MAP_W, mkDragons(), mkGates() (+18 more)

### Community 11 - "arrangeByPower"
Cohesion: 0.18
Nodes (17): arrangeByPower(), assignChau(), bandOf(), buildChauBorders(), buildLabels(), chauCenter(), chauIdAt(), corePoly() (+9 more)

### Community 12 - "kinhmach.ts"
Cohesion: 0.10
Nodes (53): khacOf(), SKILLS, TamPhap, TAMPHAP, merMax(), openMeridian(), toggleSkill(), hstr() (+45 more)

### Community 13 - "engine/tienco.ts"
Cohesion: 0.10
Nodes (31): DAI_DAO, DAO_HOLDER, ascendPerson(), BEAST_FORM, BEAST_SUR, BLOOD_N, board(), cap() (+23 more)

### Community 14 - "bang.ts"
Cohesion: 0.07
Nodes (30): LAST_WORLD, WORLD_CAP, TIER_N, cap(), TB_KIND_C, TB_KIND_N, Tbdb, TBDB (+22 more)

### Community 15 - "Item Management"
Cohesion: 0.06
Nodes (32): BAG_CAP, BASE_NAMES, GEAR_GRADE, GEAR_GRADE_C, GIAI_OF_P, learnReq(), Mat, MAX_GIAI (+24 more)

### Community 16 - "h"
Cohesion: 0.28
Nodes (15): askConfirm(), notice(), show(), btn(), h(), glyphSvg(), achPanel(), baoRows() (+7 more)

### Community 17 - "Scene Management"
Cohesion: 0.13
Nodes (17): ch(), npcCap(), REALMS, wander(), canPay(), addNpc(), mkNpc(), withOffer() (+9 more)

### Community 18 - "Sect Management"
Cohesion: 0.12
Nodes (35): daoTitle(), isLaoTo(), master(), TRAITS, CRAFT_N, assignedMaster(), backer(), baiBlock() (+27 more)

### Community 19 - "Life Events"
Cohesion: 0.08
Nodes (21): pick(), he(), daolu(), cap(), childIds(), choose(), chooseOr(), CULT_PILL (+13 more)

### Community 20 - "Court Management"
Cohesion: 0.17
Nodes (23): SECTS, doBounty(), doMission(), npcActions(), tribulation(), battle(), M(), beastFoe() (+15 more)

### Community 21 - "Realm Management"
Cohesion: 0.21
Nodes (15): Scene, cult(), lifeAdd(), statUp(), FightResult, Choice, register(), s (+7 more)

### Community 22 - "Origin Management"
Cohesion: 0.08
Nodes (26): Body, Clan, clanRel(), KHAC, Origin, ORIGIN_MONEY, originName(), ORIGINS (+18 more)

### Community 23 - "Family & Marriage"
Cohesion: 0.07
Nodes (25): BODIES, PERKS, ROOTS, BrideKind, FAM_CLAN, FAM_HOLY, FAM_ROYAL_F, FAM_ROYAL_M (+17 more)

### Community 24 - "detailCard"
Cohesion: 0.17
Nodes (15): hueBg(), skHue(), skillEffect(), skSource(), skSrcMul(), stowSkill(), confirmStow(), detailCard() (+7 more)

### Community 25 - "Life Management"
Cohesion: 0.12
Nodes (29): shuffle(), uid(), wpick(), setSurname(), applyWorld(), mkBrideBio(), hooks, age() (+21 more)

### Community 26 - "Game Mechanics"
Cohesion: 0.19
Nodes (22): ALL_EL, BASIC_EL, EVERY_EL, THAP, YINYANG_EL, fitRoot(), freeMode(), lastLife() (+14 more)

### Community 27 - "UI Icons"
Cohesion: 0.15
Nodes (22): Tech, photoSvg(), darken(), elColor(), G, gearIconSvg(), linhIconSvg(), MAT_C (+14 more)

### Community 28 - "mark"
Cohesion: 0.08
Nodes (37): fame(), addBetrothal(), mark(), relChange(), revealThap(), usePill(), transcend(), expel() (+29 more)

### Community 29 - "Character Skills"
Cohesion: 0.16
Nodes (32): gradeLabel(), skillGrade(), tamEffect(), tamGrade(), techGrade(), techSpeed(), pqGrade(), pqList() (+24 more)

### Community 30 - "3D Modeling and Texturing"
Cohesion: 0.14
Nodes (10): blade_start(), extrude_body(), guard_tilt(), level_guard(), main(), rectify(), shorten_body(), straighten() (+2 more)

### Community 31 - "effRi"
Cohesion: 0.07
Nodes (40): BREAK_PILL, beast(), contrib(), cultivator(), good(), here(), meet(), mortal() (+32 more)

### Community 32 - "Image Processing and Background Effects"
Cohesion: 0.15
Nodes (11): bg_field(), chroma_key(), flood_bg(), glow_alpha(), graph(), jobs(), main(), main_blob() (+3 more)

### Community 33 - "state.ts"
Cohesion: 0.12
Nodes (22): aiOn(), biography(), charLine(), chat(), clean(), hasCJK(), listModels(), rewriteOutcome() (+14 more)

### Community 34 - "actions.ts"
Cohesion: 0.15
Nodes (24): PILL_GRADE, beastEncounter(), Bounty, eventScene(), explore(), gatherScene(), teahouse(), teaPrice() (+16 more)

### Community 35 - "modal.ts"
Cohesion: 0.20
Nodes (18): esc(), drainFights(), pendingDeath(), die(), after(), fightBlock(), gate(), modal (+10 more)

### Community 36 - "util.ts"
Cohesion: 0.17
Nodes (7): BIG_UNITS, pct(), EVENTS, PickItem, PickSpec, Where, store

### Community 37 - "stat"
Cohesion: 0.20
Nodes (20): buyMult(), cultRate(), daoCo(), daoCoInfo(), perfectBody(), phams(), phamSum(), placeQi() (+12 more)

### Community 38 - "Art Generation"
Cohesion: 0.24
Nodes (12): graph(), jobs(), main(), get(), graph(), jobs(), main(), post() (+4 more)

### Community 39 - "Image Processing"
Cohesion: 0.17
Nodes (8): comfy_up(), main(), start_comfy(), build_dataset(), fill_bg(), free_vram(), main(), train()

### Community 40 - "char.ts"
Cohesion: 0.14
Nodes (29): worldLife(), worldMult(), herbPrice(), matPrice(), pillPrice(), skillPrice(), talisPrice(), tamPrice() (+21 more)

### Community 41 - "openModal"
Cohesion: 0.27
Nodes (11): CELESTIAL, CelestialId, celestialOffices(), celestialTop(), officeRealm(), Loc, forceBoard(), openCelestial() (+3 more)

### Community 42 - "engine/core.ts"
Cohesion: 0.12
Nodes (19): DAO_CO, worldSize(), DIA_THE, travelInfo(), moneyScale(), pillMult(), CultResult, dist() (+11 more)

### Community 43 - "hud.ts"
Cohesion: 0.11
Nodes (35): yearsTxt(), empireAt(), LOC_TYPE, ownerEmpire(), ownerTxt(), REGIONS, Vuc, VUC (+27 more)

### Community 44 - "Project Setup"
Cohesion: 0.13
Nodes (16): devDependencies, tsx@^4.23.15, typescript@^5.6.0, vite@^6.0.0, name, private, scripts, build (+8 more)

### Community 45 - "Celestial Offices"
Cohesion: 0.16
Nodes (12): COffice, COfficeView, CPlace, CRealm, holderName(), pk(), DAO_HAO, DAO_HAO_F (+4 more)

### Community 46 - "Realm Life Stages"
Cohesion: 0.27
Nodes (13): cultivate(), pendingDeathSoon(), atBottleneck(), effR(), stageName(), tang(), tdCanAscend(), tdLocal() (+5 more)

### Community 47 - "Beast Generation"
Cohesion: 0.23
Nodes (22): hashStr(), rnd(), seeded(), worldPack(), bounties(), genName(), masterBoard(), pk() (+14 more)

### Community 48 - "Game Events"
Cohesion: 0.20
Nodes (14): flag(), hasItem(), inSect(), isMortalRoot(), learnSkill(), learnTech(), lose(), setFlag() (+6 more)

### Community 49 - "Gear Trading"
Cohesion: 0.13
Nodes (27): gearPrice(), mkGear(), bagRoom(), gearRand(), addGear(), addItem(), bagCap(), bagFree() (+19 more)

### Community 50 - "Testing Tools"
Cohesion: 0.12
Nodes (14): beasts, cg, f, fate, ma, me, mine, people (+6 more)

### Community 51 - "combat.ts"
Cohesion: 0.09
Nodes (20): EL, STAGES, GRADE_MULT, ChanLinh, CHANLINH, clEffect(), BEASTS, Act (+12 more)

### Community 52 - "TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleResolution, noEmit, noImplicitAny (+5 more)

### Community 53 - "Simulation Logic"
Cohesion: 0.22
Nodes (9): causes, err(), errors, evCount, N, pick(), playScene(), realms (+1 more)

### Community 54 - "menus.ts"
Cohesion: 0.14
Nodes (34): Gear, MATS, Talis, TECHS, PhapQuyet, PHAPQUYET, headTitle(), promoReq() (+26 more)

### Community 55 - "Glyph System"
Cohesion: 0.25
Nodes (7): C(), DOT(), GLYPH, ITEM_KIND_GLYPH, P2D, SECT_GLYPH, SLOT_GLYPH

### Community 56 - "El"
Cohesion: 0.18
Nodes (12): El, Herb, Weapon, Beast, Region, Sect, Theme, BaoRow (+4 more)

### Community 57 - "hrand"
Cohesion: 0.43
Nodes (7): blob(), buildGeo(), hrand(), inLand(), layout(), placeF(), placeT()

## Knowledge Gaps
- **1 isolated node(s):** `ensureChauEmpires`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 357 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `render()` connect `Art Generation` to `Image Processing`, `effRi`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `openPlace()` (e.g. with `explore()` and `teahouse()`) actually correct?**
  _`openPlace()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ensureChauEmpires` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Game Mechanics` be split into smaller, more focused modules?**
  _Cohesion score 0.0777928539122569 - nodes in this community are weakly interconnected._
- **Why does `s` connect `Realm Management` to `Game Mechanics`, `place.ts`, `panels.ts`, `Map Regions`, `Game Actions`, `DAO能力系统`, `craft.ts`, `kinhmach.ts`, `engine/tienco.ts`, `bang.ts`, `Scene Management`, `Sect Management`, `Life Events`, `Court Management`, `Origin Management`, `Family & Marriage`, `Life Management`, `Game Mechanics`, `UI Icons`, `mark`, `Character Skills`, `effRi`, `state.ts`, `actions.ts`, `modal.ts`, `util.ts`, `char.ts`, `openModal`, `engine/core.ts`, `hud.ts`, `Game Events`, `Gear Trading`, `combat.ts`, `menus.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `World Setup` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `effRi()` connect `effRi` to `Game Mechanics`, `place.ts`, `openLibrary`, `Game Actions`, `craft.ts`, `kinhmach.ts`, `Scene Management`, `Sect Management`, `Life Events`, `Court Management`, `Realm Management`, `detailCard`, `mark`, `Character Skills`, `actions.ts`, `util.ts`, `stat`, `char.ts`, `engine/core.ts`, `Realm Life Stages`, `Beast Generation`, `Game Events`, `Gear Trading`, `combat.ts`, `menus.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._