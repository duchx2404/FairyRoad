# Graph Report - TienLo  (2026-11-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1632 nodes · 7225 edges · 61 communities (59 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.85)
- Token cost: 10,723 input · 12,861 output

## Community Hubs (Navigation)
- Game Mechanics
- World Setup
- Location Management
- Party Management
- Map Regions
- Item Properties
- Game Actions
- DAO能力系统
- 自然与齿轮
- 游戏动作
- 地图与地理
- panels.ts
- kinhmach.ts
- engine/tienco.ts
- bang.ts
- Item Management
- Bag Management
- Scene Management
- Sect Management
- Life Events
- Court Management
- Realm Management
- Origin Management
- Family & Marriage
- Skill Placement
- Life Management
- Game Mechanics
- UI Icons
- Wedding Scenes
- Character Skills
- 3D Modeling and Texturing
- NPC and Realm Management
- Image Processing and Background Effects
- state.ts
- ch
- modal.ts
- effRi
- Character Stats
- Art Generation
- Image Processing
- Item Pricing
- Game Locations
- Cultivation Mechanics
- Map Functions
- Project Setup
- Celestial Offices
- Realm Life Stages
- Beast Generation
- Game Events
- Gear Trading
- Testing Tools
- Combat Mechanics
- TypeScript Config
- Simulation Logic
- Ranking & Promotion
- Glyph System
- Sect Skills
- UI Interactions
- Image Processing
- Test Setup

## God Nodes (most connected - your core abstractions)
1. `effRi()` - 106 edges
2. `h()` - 94 edges
3. `charPanel()` - 72 edges
4. `ch()` - 70 edges
5. `openPlace()` - 66 edges
6. `pick()` - 65 edges
7. `clamp()` - 65 edges
8. `mark()` - 58 edges
9. `passTime()` - 56 edges
10. `RMAX()` - 55 edges

## Surprising Connections (you probably didn't know these)
- `openFight()` --indirect_call--> `root()`  [INFERRED]
  src/ui/fightui.ts → src/engine/char.ts
- `kmRealmName()` --calls--> `effRi()`  [EXTRACTED]
  src/engine/kinhmach.ts → src/engine/char.ts
- `dr()` --calls--> `effRi()`  [EXTRACTED]
  src/events/suitor.ts → src/engine/char.ts
- `openPlace()` --indirect_call--> `veinCultivate()`  [INFERRED]
  src/ui/place.ts → src/engine/sectx.ts
- `renderActions()` --indirect_call--> `breakthroughScene()`  [INFERRED]
  src/ui/hud.ts → src/engine/actions.ts

## Import Cycles
- 2-file cycle: `src/ui/hud.ts -> src/ui/place.ts -> src/ui/hud.ts`
- 2-file cycle: `src/engine/core.ts -> src/engine/tienco.ts -> src/engine/core.ts`
- 2-file cycle: `src/engine/char.ts -> src/engine/dao.ts -> src/engine/char.ts`
- 2-file cycle: `src/engine/core.ts -> src/engine/party.ts -> src/engine/core.ts`
- 2-file cycle: `src/engine/core.ts -> src/engine/court.ts -> src/engine/core.ts`
- 2-file cycle: `src/engine/char.ts -> src/engine/kinhmach.ts -> src/engine/char.ts`
- 3-file cycle: `src/ui/fightui.ts -> src/ui/hud.ts -> src/ui/modal.ts -> src/ui/fightui.ts`
- 3-file cycle: `src/engine/char.ts -> src/engine/dao.ts -> src/engine/core.ts -> src/engine/char.ts`
- 3-file cycle: `src/engine/core.ts -> src/engine/party.ts -> src/engine/sect.ts -> src/engine/core.ts`
- 3-file cycle: `src/engine/combat.ts -> src/engine/core.ts -> src/engine/court.ts -> src/engine/combat.ts`
- 3-file cycle: `src/engine/bride.ts -> src/engine/core.ts -> src/engine/court.ts -> src/engine/bride.ts`
- 4-file cycle: `src/ui/fightui.ts -> src/ui/hud.ts -> src/ui/place.ts -> src/ui/modal.ts -> src/ui/fightui.ts`
- 4-file cycle: `src/ui/fightui.ts -> src/ui/hud.ts -> src/ui/menus.ts -> src/ui/modal.ts -> src/ui/fightui.ts`
- 4-file cycle: `src/engine/char.ts -> src/engine/dao.ts -> src/engine/core.ts -> src/engine/tienco.ts -> src/engine/char.ts`
- 4-file cycle: `src/engine/char.ts -> src/engine/dao.ts -> src/engine/core.ts -> src/engine/court.ts -> src/engine/char.ts`
- 4-file cycle: `src/engine/combat.ts -> src/engine/dao.ts -> src/engine/core.ts -> src/engine/court.ts -> src/engine/combat.ts`
- 4-file cycle: `src/engine/char.ts -> src/engine/dao.ts -> src/engine/core.ts -> src/engine/party.ts -> src/engine/char.ts`
- 4-file cycle: `src/engine/combat.ts -> src/engine/party.ts -> src/engine/core.ts -> src/engine/court.ts -> src/engine/combat.ts`
- 5-file cycle: `src/ui/celestial.ts -> src/ui/modal.ts -> src/ui/fightui.ts -> src/ui/hud.ts -> src/ui/place.ts -> src/ui/celestial.ts`
- 5-file cycle: `src/ui/fightui.ts -> src/ui/hud.ts -> src/ui/place.ts -> src/ui/menus.ts -> src/ui/modal.ts -> src/ui/fightui.ts`

## Communities (61 total, 2 thin omitted)

### Community 0 - "Game Mechanics"
Cohesion: 0.07
Nodes (36): elMult(), Skill, TALIS, TECHS, REGIONS, BASIC, Battle, fightLogs (+28 more)

### Community 1 - "World Setup"
Cohesion: 0.06
Nodes (63): applyWorld(), arrangeByPower(), assignChau(), bandOf(), BASE_CHU, BASE_GUARD, BASE_TOP, BEASTS (+55 more)

### Community 2 - "Location Management"
Cohesion: 0.09
Nodes (54): yearsTxt(), CelestialId, SLOTS, TIER_C, Loc, LOC_TYPE, shjAt(), whereOf() (+46 more)

### Community 3 - "Party Management"
Cohesion: 0.08
Nodes (52): Gear, learnReq(), MAX_SKILLS, RK, SECT_RANKS, SECT_TIER_INFO, allyFighters(), findNpc() (+44 more)

### Community 4 - "Map Regions"
Cohesion: 0.07
Nodes (43): CHAU_BORDERS, ISLANDS, LANDMASS, LANDS, LOC_LIST, MAINLAND, MOUNTAINS, REGION_LABELS (+35 more)

### Community 5 - "Item Properties"
Cohesion: 0.16
Nodes (43): fmt(), gearLabel(), pillGiai(), pillGrade(), realmForGiai(), count(), itemDesc(), itemName() (+35 more)

### Community 6 - "Game Actions"
Cohesion: 0.15
Nodes (41): ri(), RMAX(), canPay(), evil(), gain(), giveGear(), good(), hasItem() (+33 more)

### Community 7 - "DAO能力系统"
Cohesion: 0.10
Nodes (39): BATQUAI, Weapon, breakthroughScene(), daiDaoScene(), daoScene(), affinity(), canFuse(), canLord() (+31 more)

### Community 8 - "自然与齿轮"
Cohesion: 0.08
Nodes (36): HERBS, MATS, bookArt(), crystalLeaf(), flower(), frame(), fruit(), GEAR_SHAPES (+28 more)

### Community 9 - "游戏动作"
Cohesion: 0.13
Nodes (36): clamp(), rf(), coPaper(), mkGear(), talisGrade(), rest(), travelTo(), waitYear() (+28 more)

### Community 10 - "地图与地理"
Cohesion: 0.06
Nodes (36): El, Herb, Tech, Beast, Chau, DIA_THE, Empire, majorRivers() (+28 more)

### Community 11 - "panels.ts"
Cohesion: 0.11
Nodes (38): worldName(), age(), lifeLived(), sortBag(), MERIDIANS, npcAge(), npcRealm(), relLabel() (+30 more)

### Community 12 - "kinhmach.ts"
Cohesion: 0.10
Nodes (37): khacOf(), hstr(), HX_N, HX_NAME, HX_ORD, hxCap(), hxCount(), hxMatch() (+29 more)

### Community 13 - "engine/tienco.ts"
Cohesion: 0.09
Nodes (36): BREAK_BASE, DAI_DAO, DAO_HOLDER, FEM, MALE, SURN, ascendPerson(), BEAST_FORM (+28 more)

### Community 14 - "bang.ts"
Cohesion: 0.07
Nodes (32): CELESTIAL, CLANS, LAST_WORLD, WORLD_CAP, TIER_N, cap(), TB_KIND_C, TB_KIND_N (+24 more)

### Community 15 - "Item Management"
Cohesion: 0.06
Nodes (31): BAG_CAP, BASE_NAMES, GEAR_GRADE, GEAR_GRADE_C, GIAI_OF_P, Mat, MAX_GIAI, PEAK_SK (+23 more)

### Community 16 - "Bag Management"
Cohesion: 0.13
Nodes (32): techGrade(), bagRoom(), bagCap(), bagFree(), bagUsed(), unequip(), askConfirm(), notice() (+24 more)

### Community 17 - "Scene Management"
Cohesion: 0.11
Nodes (22): Scene, FightResult, addNpc(), mkNpc(), Choice, register(), joinSect(), linkNpc() (+14 more)

### Community 18 - "Sect Management"
Cohesion: 0.15
Nodes (30): daoTitle(), isLaoTo(), master(), TRAITS, CRAFT_N, assignedMaster(), backer(), baiBlock() (+22 more)

### Community 19 - "Life Events"
Cohesion: 0.08
Nodes (16): he(), breakPill(), cap(), childIds(), choose(), chooseOr(), CULT_PILL, cultPill() (+8 more)

### Community 20 - "Court Management"
Cohesion: 0.14
Nodes (29): COURT_RANKS, courtReq(), doBounty(), doMission(), npcActions(), addBetrothal(), beastFoe(), dangerLabel() (+21 more)

### Community 21 - "Realm Management"
Cohesion: 0.14
Nodes (18): REALMS, SECTS, battle(), cult(), lifeAdd(), statUp(), mark(), revealThap() (+10 more)

### Community 22 - "Origin Management"
Cohesion: 0.08
Nodes (24): BODIES, Body, Clan, clanRel(), KHAC, Origin, ORIGIN_MONEY, originName() (+16 more)

### Community 23 - "Family & Marriage"
Cohesion: 0.07
Nodes (25): EL, PERKS, ROOTS, BrideKind, FAM_CLAN, FAM_HOLY, FAM_ROYAL_F, FAM_ROYAL_M (+17 more)

### Community 24 - "Skill Placement"
Cohesion: 0.19
Nodes (26): hueBg(), skHue(), skillEffect(), merMax(), knownByGrade(), stowSkill(), toggleSkill(), kmCanPlace() (+18 more)

### Community 25 - "Life Management"
Cohesion: 0.14
Nodes (24): shuffle(), uid(), setSurname(), mkBrideBio(), clearPendingDeath(), friends(), mkName(), achPtsLife() (+16 more)

### Community 26 - "Game Mechanics"
Cohesion: 0.17
Nodes (25): ALL_EL, BASIC_EL, EVERY_EL, rootKindOf(), STATS, THAP, YINYANG_EL, buyUpgrade() (+17 more)

### Community 27 - "UI Icons"
Cohesion: 0.13
Nodes (25): SKILLS, Talis, TamPhap, TAMPHAP, photoCircle(), photoSvg(), darken(), elColor() (+17 more)

### Community 28 - "Wedding Scenes"
Cohesion: 0.13
Nodes (24): fame(), years(), relChange(), setLoc(), Outcome, awakenScene(), BREAK_FALLBACK, BREAK_LINE (+16 more)

### Community 29 - "Character Skills"
Cohesion: 0.19
Nodes (24): gradeLabel(), skillGrade(), tamEffect(), tamGrade(), techSpeed(), pqGrade(), myLinh(), pqList() (+16 more)

### Community 30 - "3D Modeling and Texturing"
Cohesion: 0.14
Nodes (10): blade_start(), extrude_body(), guard_tilt(), level_guard(), main(), rectify(), shorten_body(), straighten() (+2 more)

### Community 31 - "NPC and Realm Management"
Cohesion: 0.12
Nodes (18): beast(), contrib(), here(), meet(), npcTitle(), sectName(), seenRealm(), NPC (+10 more)

### Community 32 - "Image Processing and Background Effects"
Cohesion: 0.15
Nodes (11): bg_field(), chroma_key(), flood_bg(), glow_alpha(), graph(), jobs(), main(), main_blob() (+3 more)

### Community 33 - "state.ts"
Cohesion: 0.14
Nodes (19): aiOn(), biography(), charLine(), chat(), clean(), hasCJK(), listModels(), rewriteOutcome() (+11 more)

### Community 34 - "ch"
Cohesion: 0.15
Nodes (21): BIG_UNITS, ch(), pct(), wpick(), LocType, beastEncounter(), eventScene(), explore() (+13 more)

### Community 35 - "modal.ts"
Cohesion: 0.19
Nodes (21): esc(), drainFights(), dateStr(), pendingDeath(), openCelestial(), sel, fullBodyKey(), openPortrait() (+13 more)

### Community 36 - "effRi"
Cohesion: 0.13
Nodes (18): BREAK_PILL, cultivator(), inSect(), mortal(), effRi(), canJoin(), healPill(), breakPill() (+10 more)

### Community 37 - "Character Stats"
Cohesion: 0.20
Nodes (22): atkOf(), basePow(), body(), clSum(), cultRate(), daoCo(), daoCoInfo(), defOf() (+14 more)

### Community 38 - "Art Generation"
Cohesion: 0.24
Nodes (12): graph(), jobs(), main(), get(), graph(), jobs(), main(), post() (+4 more)

### Community 39 - "Image Processing"
Cohesion: 0.17
Nodes (8): comfy_up(), main(), start_comfy(), build_dataset(), fill_bg(), free_vram(), main(), train()

### Community 40 - "Item Pricing"
Cohesion: 0.16
Nodes (19): worldMult(), herbPrice(), matPrice(), pillPrice(), skillPrice(), talisPrice(), tamPrice(), techPrice() (+11 more)

### Community 41 - "Game Locations"
Cohesion: 0.15
Nodes (17): bounties(), Bounty, pendingDeathSoon(), teahouse(), teaPrice(), travelInfo(), tribulation(), tribulationScene() (+9 more)

### Community 42 - "Cultivation Mechanics"
Cohesion: 0.16
Nodes (16): DAO_CO, perfectBody(), phams(), pillMult(), CultResult, enemies(), isDiep(), NpcOpts (+8 more)

### Community 43 - "Map Functions"
Cohesion: 0.15
Nodes (18): WORLD, TITLE_RE, VUC, hooks, refreshAll(), centerOn(), clampView(), draw() (+10 more)

### Community 44 - "Project Setup"
Cohesion: 0.13
Nodes (16): devDependencies, tsx@^4.23.15, typescript@^5.6.0, vite@^6.0.0, name, private, scripts, build (+8 more)

### Community 45 - "Celestial Offices"
Cohesion: 0.18
Nodes (16): hashStr(), seeded(), celestialOffices(), celestialTop(), COffice, COfficeView, CPlace, CRealm (+8 more)

### Community 46 - "Realm Life Stages"
Cohesion: 0.21
Nodes (18): worldLife(), cultivate(), atBottleneck(), effR(), lifeLeft(), maxLife(), realmAt(), root() (+10 more)

### Community 47 - "Beast Generation"
Cohesion: 0.24
Nodes (17): rnd(), worldPack(), genName(), masterBoard(), pk(), toolBoard(), treasureBoard(), beastForm() (+9 more)

### Community 48 - "Game Events"
Cohesion: 0.18
Nodes (13): flag(), isMortalRoot(), learnSkill(), learnTech(), realmStage(), setFlag(), seenRoot(), thapHidden() (+5 more)

### Community 49 - "Gear Trading"
Cohesion: 0.23
Nodes (15): gearPrice(), addGear(), buyMult(), sellMult(), bought(), buy(), consignGear(), FORGE_MATS (+7 more)

### Community 50 - "Testing Tools"
Cohesion: 0.12
Nodes (14): beasts, cg, f, fate, ma, me, mine, people (+6 more)

### Community 51 - "Combat Mechanics"
Cohesion: 0.16
Nodes (13): npcCap(), STAGES, GRADE_MULT, PILLS, Act, BEAST_SKILLS, compare(), ELEM_BEAST_SKILL (+5 more)

### Community 52 - "TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleResolution, noEmit, noImplicitAny (+5 more)

### Community 53 - "Simulation Logic"
Cohesion: 0.22
Nodes (9): causes, err(), errors, evCount, N, pick(), playScene(), realms (+1 more)

### Community 54 - "Ranking & Promotion"
Cohesion: 0.50
Nodes (9): headTitle(), promoReq(), rankLabel(), leaveSect(), promoInfo(), promote(), rankName(), retire() (+1 more)

### Community 55 - "Glyph System"
Cohesion: 0.25
Nodes (7): C(), DOT(), GLYPH, ITEM_KIND_GLYPH, P2D, SECT_GLYPH, SLOT_GLYPH

### Community 56 - "Sect Skills"
Cohesion: 0.25
Nodes (8): pick(), herb(), sectHead(), skillFor(), techFor(), mat(), skillBook(), talis()

### Community 57 - "UI Interactions"
Cohesion: 0.52
Nodes (7): close(), closeAll(), drag(), navIcon(), renderNav(), show(), toggle()

### Community 59 - "Test Setup"
Cohesion: 0.33
Nodes (3): HD, N, store

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `render()` connect `Art Generation` to `Image Processing`, `NPC and Realm Management`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `openPlace()` (e.g. with `explore()` and `teahouse()`) actually correct?**
  _`openPlace()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Should `Game Mechanics` be split into smaller, more focused modules?**
  _Cohesion score 0.07204968944099378 - nodes in this community are weakly interconnected._
- **Why does `effRi()` connect `effRi` to `Game Mechanics`, `Location Management`, `Party Management`, `Item Properties`, `Game Actions`, `游戏动作`, `panels.ts`, `kinhmach.ts`, `Scene Management`, `Sect Management`, `Life Events`, `Court Management`, `Realm Management`, `Skill Placement`, `Wedding Scenes`, `Character Skills`, `NPC and Realm Management`, `ch`, `Character Stats`, `Item Pricing`, `Game Locations`, `Cultivation Mechanics`, `Realm Life Stages`, `Game Events`, `Gear Trading`, `Combat Mechanics`, `Ranking & Promotion`, `Sect Skills`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `World Setup` be split into smaller, more focused modules?**
  _Cohesion score 0.055288461538461536 - nodes in this community are weakly interconnected._
- **Why does `s` connect `Realm Management` to `Game Mechanics`, `Location Management`, `Party Management`, `Map Regions`, `Item Properties`, `Game Actions`, `DAO能力系统`, `游戏动作`, `panels.ts`, `kinhmach.ts`, `engine/tienco.ts`, `bang.ts`, `Scene Management`, `Sect Management`, `Life Events`, `Court Management`, `Origin Management`, `Family & Marriage`, `Skill Placement`, `Life Management`, `Game Mechanics`, `UI Icons`, `Wedding Scenes`, `Character Skills`, `NPC and Realm Management`, `state.ts`, `ch`, `modal.ts`, `effRi`, `Item Pricing`, `Game Locations`, `Cultivation Mechanics`, `Map Functions`, `Game Events`, `Gear Trading`, `Combat Mechanics`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `Location Management` be split into smaller, more focused modules?**
  _Cohesion score 0.09415584415584416 - nodes in this community are weakly interconnected._