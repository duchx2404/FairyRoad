"""Vẽ tranh bán thực cho thuật pháp, tâm kinh, pháp quyết, chân linh, chân dung nhân vật / địch
   (bổ sung cho gen_items.py, cùng ComfyUI + Flux dev + LoRA add-details).
   python tools/gen_art.py [--only k1,k2] [--group sk,tp,fq,cl,x,pc,npc,foe,sn,snv,stv,pttd] [--limit N] [--redo]
   Ảnh: public/items/<khoá>.webp (256×256); xong thì cập nhật manifest.json.
   Nhân vật chính: LoRA học từ AIFilm (nam chính aif181817m / nữ chính aif181817f)."""
import json, random, argparse, time
from gen_items import OUT, render_graph

LORA_DETAIL = ('FLUX.1-dev-LoRA-add-details.safetensors', 0.6)
LORA_MALE = ('learn_20261028_181817_nam_chinh.safetensors', 0.9)
LORA_FEMALE = ('learn_20261028_181817_nu_chinh.safetensors', 0.9)

NEG = 'no text, no letters, no Chinese characters, no watermark, no frame, no border, no UI, not anime, not cartoon, not cel shading, not 3D render'

# ---------- thuật pháp: cảnh chiêu thức, năng lượng thật ----------
STYLE_SK = ('Hyper-detailed semi-realistic digital painting, xianxia martial-arts technique icon art: {subj}. '
            'Bold centered composition that reads clearly at small size, photoreal elemental energy (real fire, water, ice, lightning, wind, light), '
            'cinematic lighting with strong glow, live-action xianxia drama visual effects, dark smoky background with soft vignette, ' + NEG)
EL = {
  'kim': 'golden metal', 'moc': 'emerald-green wood', 'thuy': 'deep blue water', 'hoa': 'blazing orange fire', 'tho': 'earthen brown stone',
  'bang': 'pale icy-blue frost', 'loi': 'violet lightning', 'phong': 'pale jade-green wind', 'am': 'black-purple shadow', 'quang': 'radiant white-gold holy light',
}
SK = {
  'chuongphong': 'an open palm thrusting forward, a spiraling vortex of pale jade-green wind and swirling leaves bursting from the palm',
  'kimtien': 'a single gleaming golden arrow made of condensed metal energy flying forward, golden sparks trailing behind',
  'dangleo': 'thick thorny green vines coiling and tightening around a broken stone pillar, faint green life essence drained along the vines',
  'thuytien': 'three arrows made of clear rushing water flying in a row, droplets spraying behind them',
  'hoacau': 'a roaring ball of real fire floating above an open palm, flames licking upward, embers flying',
  'thothuan': 'a thick wall of brown earth and stone erupting from the ground like a shield, dust and pebbles flying',
  'luuthuykiem': 'a straight jian sword slicing through the air leaving three flowing ribbons of blue water in its arc',
  'hoixuan': 'a cupped pair of hands holding a soft glow of green spring light, tiny leaves and a blossom sprouting from the light',
  'nguhanhan': 'a large square mystic seal of light hovering in the air, its five corners glowing gold, green, blue, red and brown for the five elements',
  'phongnhan': 'several invisible crescent blades of wind slicing through falling leaves, the leaves cut cleanly in half',
  'phuvanthan': 'a robed figure dissolving into drifting white clouds, the silhouette half made of mist',
  'lietduongchuong': 'a palm strike blazing like the midday sun, a huge golden-orange palm print of fire pushing outward',
  'hanbangtien': 'a sharp arrow of clear blue ice with frost spreading from its tip, cold mist trailing',
  'docvu': 'a cloud of sickly green poison mist creeping over the ground, dead leaves withering inside it',
  'thuymanthien': 'a shimmering sphere of flowing blue water wrapped around a meditating silhouette, soft healing light inside',
  'loiquang': 'a palm with a ball of crackling violet lightning exploding in its center, arcs of electricity jumping between the fingers',
  'kimthan': 'a muscular torso turned to gleaming solid gold, a sword blade shattering against the golden skin with sparks',
  'thaihuyenan': 'a massive bronze-gold seal stamp descending from the sky with mystical runes underneath, pressing down with crushing force',
  'loiamchuong': 'a giant translucent golden Buddha palm descending with rings of violet thunder around it',
  'huyetsatthu': 'a clawed hand dripping with blood-red aura, crimson mist being sucked into the palm',
  'tinhhailang': 'towering night-sea waves under a starry sky, each wave crest glittering with starlight',
  'canhkimkiem': 'a single straight sword of sharp white-gold metal energy piercing through a shattering glass-like protective barrier',
  'vanmoc': 'a forest of ancient tree roots and branches surging upward like grasping hands, green life energy flowing into them',
  'tutieuloi': 'a colossal purple lightning bolt striking down from nine layers of swirling purple storm clouds',
  'khaithien': 'a giant primordial battle axe splitting a swirling chaos of many-colored primordial energy in two',
  'thaicucan': 'a large spinning black-and-white yin-yang taiji disc of light with eight trigrams around it, deflecting a blast',
  'cuuuban': 'a whole landscape frozen solid in an instant, jagged ice spikes and a blizzard swirling under a dark sky',
  'ngukiem': 'a flying sword darting through the air on its own, trailing a long streak of white-gold sword light',
  'kimchungtrao': 'a giant translucent golden temple bell of light covering a seated monk silhouette, ripples where attacks hit it',
  'diahoa': 'molten lava and flames bursting up from deep cracks in the ground, fire pillars rising to the sky',
  'liemloi': 'chain lightning leaping in a zigzag between several stone targets, violet sparks everywhere',
  'cuuchuyenphathien': 'a colossal golden sword descending from the heavens wrapped in nine spiraling rings of sword energy, the sky cracking open above it',
  'cuuchuyenkimthan': 'a warrior whose skin glows like molten gold with nine faint golden rings circling his body, blades breaking on him in showers of sparks',
  'tichhuyettrungsinh': 'a single glowing drop of red blood from which a new green sprout and a pulse of life light are growing',
  'phapthientuongdia': 'a colossal semi-transparent spirit giant made of glowing pale golden spiritual energy, see-through glowing body, head among the clouds, feet on the mountains, raising one enormous palm, a tiny cultivator on a peak below',
  'thatthapnhibien': 'a figure splitting into many shifting illusory forms (a bird, a tree, a stone, a beast) in a swirl of jade-green wind',
  'sontrung': 'a whole mountain peak torn from the earth hovering in the air, about to crash down, rocks falling from its base',
  'bangtruy': 'a long needle-sharp icicle shooting straight forward with frost trailing behind it',
  'loichi': 'a single pointing finger shooting one thin bolt of violet lightning',
  'tieuphong': 'three paper-thin crescent saber blades of wind cutting through the air in a fan',
  'uanhthich': 'a dagger thrusting out of a pool of black shadow on the ground, purple-black smoke curling around it',
  'quangkiem': 'a straight sword formed entirely of condensed radiant white-gold light, rays spilling from it',
  'diachan': 'a heavy foot stomping on the ground, the earth cracking open in a radiating web of fissures with dust exploding',
  'thuvuong': 'a roaring shockwave in the shape of a tiger, a leopard and a wolf head made of brown spirit energy charging forward',
  'phehon': 'ghostly purple-black wisps devouring a pale glowing soul flame piece by piece',
  'thanhquang': 'a pillar of soft holy white-gold light descending on a silhouette, wounds of light closing',
  'dieunhat': 'a miniature blazing sun exploding in mid-air, white-gold shockwave rings',
  'cuongphong': 'a violent tornado of jade-green wind lifting rocks and debris high into the air',
  'vanmaphe': 'countless shadowy demonic hands and ghost faces rising from black ground, purple-black miasma',
  'daiquangminh': 'a huge radiant seal of white-gold light with sun rays, dark smoke burning away at its edges',
  'phongloi': 'a jade-green wind spiral guiding a violet lightning bolt, wind and lightning twisted together',
  'pk_thanhphong': 'three light sword slashes drawn in the air like soft green breeze lines, the third slash glinting cold and deadly',
  'pk_vankiem': 'thousands of flying swords filling the sky in a vast spiral, all converging toward one point of light',
  'pk_doangiang': 'one sword slash cutting a great river in two, the water walls frozen in mid-flow on both sides',
  'pd_bonloi': 'a broad dao saber swung so fast it leaves a trail of crackling thunder and motion blur',
  'pd_thapbattram': 'eighteen overlapping crescent saber slashes in a storm of steel light, each larger than the last',
  'pd_khaison': 'a giant dao saber slash splitting a mountain cleanly in half from peak to base',
  'pt_phatran': 'a cavalry spear thrust piercing through three layers of iron armor plates in a row',
  'pt_bachdieu': 'a spear tip blooming into a hundred phantom birds of light flying outward',
  'pt_bachlong': 'a spear thrust upward with a white dragon of energy coiling along it toward the sun',
  'pq_bangson': 'a heavy fist punching forward, a landslide of boulders collapsing in front of it',
  'pq_bavuong': 'a single mighty overlord fist strike, a crater shockwave and dust ring exploding from the impact',
  'pq_thatthuong': 'a fist releasing seven spiraling red-black streams of force, cracks of strain on the forearm',
  'pq_longtuong': 'a fist strike with a dragon and an elephant silhouette of golden energy charging behind it',
  'pc_phienthien': 'a huge palm flipping over in the sky, the clouds and land below turning upside down',
  'pb_lienchau': 'three arrows flying nose to tail in a straight line like beads on a string',
  'pb_xuyenvan': 'a single arrow piercing through a thick sea of clouds, leaving a tunnel of clear sky',
  'pb_lactinh': 'an arrow shot upward striking a star, the star falling from the night sky in a streak of fire',
  'pb_xanhat': 'an arrow wrapped in the fire of the sun, a blazing comet of golden flame',
  'px_thutam': 'the crescent blade tip of a ji halberd thrusting straight forward, a single red glint at its point',
  'px_phuongthien': 'a heavy painted ji halberd with a crescent side blade swung in a wide powerful arc',
  'px_hoanhtao': 'a halberd sweeping in a full circle, a ring shockwave knocking down rows of spears',
  'px_doantruong': 'a crimson-black halberd strike tearing through the battlefield, a war banner split in two',
}

# ---------- tâm kinh: mỗi kinh một biểu tượng tâm cảnh ----------
STYLE_TP = ('Hyper-detailed semi-realistic digital painting, xianxia meditation sutra art: an old Buddhist-Taoist sutra book lying open, '
            'and rising above its pages {subj}. Soft spiritual glow, incense smoke, photoreal paper and materials, dark background with soft vignette, ' + NEG)
TP = {
  'tinhtamkinh': 'a single still drop of water falling into a perfectly calm pool',
  'duongkhikinh': 'a gentle sphere of white qi mist slowly circling and staying contained',
  'ngungthankinh': 'one bright point of focused light with faint lines of thought converging into it',
  'bangtamquyet': 'a heart-shaped crystal of ice with frost blooming across it',
  'thanhtinhkinh': 'clear water washing dust away from a white lotus petal',
  'hoinguyenkinh': 'a glowing ring of qi flowing in a full circle and returning to a small golden core',
  'tuphukinh': 'a vast starry ocean inside a glowing violet palace gate',
  'bodetamkinh': 'a small bodhi tree with heart-shaped leaves swaying while its roots stay firm',
  'huyennguyentam': 'a calm flame standing straight in a storm, a cracking stone barrier around it',
  'cuuchuyentam': 'nine concentric rings of golden light turning around a small glowing heart',
  'vongtinhkinh': 'a red silk thread being cut and drifting away into cold moonlight',
  'hukhongtam': 'an empty circle of pure void surrounded by soft fading starlight',
  'honnguyentam': 'a blue spirit flame and a golden qi stream merging into one swirling sphere',
  'vouluongtam': 'endless glowing script-like light patterns spreading to infinity, no readable characters',
}

# ---------- pháp quyết ----------
STYLE_FQ = ('Hyper-detailed semi-realistic digital painting, xianxia secret art icon: {subj}. '
            'Photoreal materials, mystical glow, cinematic light, dark smoky background with soft vignette, ' + NEG)
FQ = {
  'tulinhquyet': 'swirling streams of blue spirit qi gathering into a glowing vortex above a jade scroll',
  'thiennhan': 'a glowing third eye opening in mid-air, revealing hidden green spirit herbs shining among grass',
  'liemtuc': 'a cloaked figure fading into faint mist, its aura drawn inward and hidden',
  'hoinguyenquyet': 'a wound of light closing with green and gold healing threads',
  'ngukiemquyet': 'a person standing on a flying sword soaring above clouds and mountain peaks',
  'thodon': 'a figure sinking into the earth through a swirl of brown soil and stone',
  'tambao': 'a divining compass luopan pointing at a glowing treasure chest buried under the ground',
  'kimcang': 'a bronze vajra standing upright with a diamond-hard golden aura',
  'tuphongbo': 'cloth boots running on swirling green wind, afterimages trailing behind',
  'phapthien': 'a colossal golden giant silhouette standing among mountains, clouds around his shoulders',
  'thienlythuc': 'a single footstep folding a long road of mountains and rivers into one stride',
  'vanphaptu': 'many streams of different colored spell light converging into one glowing orb',
}

# ---------- chân linh ----------
STYLE_CL = ('Hyper-detailed semi-realistic digital painting portrait of {subj}, a mythical spirit beast companion of xianxia legend, '
            'head and upper body, photoreal fur, feathers or scales, intelligent eyes, {glow} aura, cinematic soft key light, '
            'dark background with soft vignette, ' + NEG)
CL = {
  'hoaly': ('a red-furred wild cat whose tail burns like a torch, amber eyes', 'warm fire'),
  'thanhxa': ('a slender jade-green spirit snake with smooth scales, sniffing with its tongue', 'emerald'),
  'ngantho': ('a pure white rabbit with silver-tipped fur under a full moon', 'silver moonlight'),
  'tuyetlang': ('a cold snow wolf with thick white fur and pale blue eyes, frost on its muzzle', 'icy blue'),
  'kimdieu': ('a great golden-winged eagle with gleaming metallic golden feathers', 'golden'),
  'huyenquy': ('an ancient black turtle with a huge rugged shell covered in moss and runes', 'deep sea-blue'),
  'loiung': ('a sharp-eyed hawk with dark feathers crackling with lightning', 'violet lightning'),
  'phonglinhhoa': ('a cunning three-tailed fox with jade-white fur, tails swaying', 'pale jade wind'),
  'hacky': ('a black qilin with obsidian scales, a single horn and dark flowing mane', 'black-purple shadow'),
  'chuoc': ('a young vermilion bird chick with feathers of living flame', 'phoenix red-gold'),
}

# ---------- vật phẩm còn thiếu ----------
STYLE_X = ('Hyper-detailed semi-realistic digital painting of {subj}, a single item centered in the frame with generous margin, '
           'game inventory item art, photoreal materials and textures, soft cinematic studio key light with gentle rim light, '
           'plain dark charcoal-brown background with soft vignette, no hands, no people, ' + NEG)
X = {
  'm_cotuhuyet': 'a small sealed crystal vial of dark crimson ancestral beast blood with a faint golden glow inside',
  'm_tuduehuyet': 'a glass vial of shimmering violet-red awakened bloodline essence, swirling like liquid flame',
  'm_yeubiphuchi': 'a few sheets of thin, dark tanned demon-beast hide cut into talisman strips, faint red scale pattern',
  'm_linhmocphuchi': 'a few strips of pale spirit-wood talisman paper with visible wood grain glowing faintly green',
  'x_cophu': 'an ancient worn leather-bound manual of talisman crafting lying open, faded red talisman diagrams on old yellowed pages',
  'g_u_hondonkiem': 'a complete intact ancient primordial chaos sword, a long straight jian with a dark grey blade swirling with faint multicolored chaos energy, an ornate archaic bronze hilt, lying on dark stone',
}

# ---------- chân dung ----------
STYLE_PT = ('Hyper-detailed semi-realistic digital painting portrait of {subj}, in the style of top-tier Chinese xianxia game character splash art: '
            'photoreal skin with subtle pores, real cloth with natural folds and visible embroidery thread texture, cinematic soft studio light, '
            'lifelike proportions, like a live-action costume photo painted over. Close-up portrait from the top of the head to the upper chest, '
            'frontal view, face centered, looking at the viewer. Neutral dark grey-brown background, sharp focus on the face. ' + NEG)
MALE_LEAD = ('aif181817m, a man, {age}, glossy black hair swept back into a high topknot with long loose hair past the shoulders, small carved gold crown '
             'with a dark blue-black jewel, pearl strands beside the face, long oval face, sharp jawline, narrow smoky dark-brown eyes, faint knowing smile, '
             'layered black silk robe with golden dragon and cloud embroidery, tall black stand-up collar crossed in a V with thin gold edging, white inner layer')
FEMALE_LEAD = ('aif181817f, a woman, {age}, long dark hair in an elegant updo with loose strands, a sheer white veil draped over her hair, '
               'gold flower earrings with dangling pearls, a fine gold chain at her neck, serene elegant face, white silk hanfu with gold trim')
PC = {  # khoá: (mô tả, LoRA)
  'pc_m': (MALE_LEAD.format(age='18 years old'), LORA_MALE),
  'pc_m_child': ('aif181817m, a boy, 9 years old child, small round face, black hair tied in a simple topknot, plain grey-blue cotton hanfu, '
                 'curious bright eyes, same facial features as a younger version', (LORA_MALE[0], 0.55)),
  'pc_f': (FEMALE_LEAD.format(age='18 years old'), LORA_FEMALE),
  'pc_f_child': ('aif181817f, a girl, 9 years old child, small round face, dark hair in two buns with ribbons, plain pale pink cotton hanfu, '
                 'bright curious eyes', (LORA_FEMALE[0], 0.55)),
}
NPC = {  # người nhà, đồng môn: giới × lứa tu vi
  'npc_m0': 'an ordinary Chinese village man in his forties, weathered tan skin, short beard, black hair in a cloth headwrap, plain brown hemp clothes',
  'npc_f0': 'an ordinary Chinese village woman in her late thirties, kind tired face, hair in a simple bun with a wooden pin, plain blue cotton clothes',
  'npc_m1': 'a young male Taoist cultivator in his twenties, black hair in a topknot with a jade hairpin, light grey-blue sect robe',
  'npc_f1': 'a young female cultivator in her twenties, long black hair half tied with a silver hairpin, pale green sect robe',
  'npc_m2': 'a stern middle-aged male cultivator, long black beard, dark blue embroidered robe, sharp eyes, a jade crown',
  'npc_f2': 'a dignified middle-aged female cultivator, hair in an elegant high bun with gold pins, deep purple embroidered robe',
  'npc_m3': 'an ancient white-haired male elder sage with long white beard and eyebrows, white and gold Taoist robe, calm deep eyes',
  'npc_f3': 'an elderly grey-haired female grandmaster with a serene face, silver hair in a bun with a jade pin, white robe with silver embroidery',
}
FOE = {  # chân dung đối thủ theo loại
  'foe_mortal': 'a rough bandit with a scar across his cheek, headscarf, leather vest, holding a crude saber at his shoulder, menacing grin',
  'foe_cultivator': 'a cold rival male cultivator in a black and crimson robe, long hair tied back, flying sword glowing behind his shoulder, hostile gaze',
  'foe_demon': 'a demonic cultivator with pale grey skin, glowing red eyes, black-purple miasma swirling, dark tattered robe, sinister smile',
}
BEAST = {  # yêu thú theo hệ (đối thủ loại thú)
  'kim': 'a gold-armored demon tiger with metallic striped fur', 'moc': 'a giant moss-covered demon bear with vines on its back',
  'thuy': 'a scaled water serpent-dragon rising from dark waves', 'hoa': 'a fiery demon lion with a mane of real flames',
  'tho': 'a huge rock-hided demon boar with stone tusks', 'bang': 'a frost demon wolf with icicles on its fur',
  'loi': 'a thunder demon leopard with lightning crackling over black fur', 'phong': 'a storm demon falcon with sharp jade-green feathers',
  'am': 'a shadow demon panther with glowing violet eyes in black mist', 'quang': 'a radiant white demon stag with antlers of light',
}

# ---------- Thánh nữ: cùng gương mặt LoRA nữ chính, đổi trang phục theo tông môn / thế gia ----------
SAINT_BASE = ('aif181817f, a woman, 18 years old, the same elegant serene face, {look}, '
              'a breathtakingly beautiful xianxia holy maiden (saintess) of {who}')
SN = {  # khoá sn_<id>: (thuộc về, ngoại hình riêng)
  'tutieu': ('the Purple Empyrean Immortal Palace (lightning, wind, fire)', 'long dark hair in a high updo with a silver hairpin shaped like a violet lightning bolt, a sheer lavender veil, layered purple and silver silk hanfu with cloud embroidery, faint violet sparks in the air'),
  'huyennguyen': ('the Primordial Origin Holy Land, the hidden righteous holy land', 'long dark hair in an elegant updo with a delicate gold crown, a sheer white veil, pure white silk hanfu with gold trim and gold flower earrings with pearls, calm noble gaze'),
  'batchu': ('the Broken Peak Holy Mountain, body-tempering martial cultivators', 'long dark hair tied in a high ponytail with a red silk band, no veil, earthy red-brown martial robe with leather bracers and a bronze belt, determined strong gaze'),
  'cucbang': ('the Polar Ice Divine Temple of the far north', 'long dark hair with frost-white streaks in an updo with a snowflake crystal hairpin, a sheer pale-blue veil, ice-blue and white hanfu with a soft white fur collar, frost on her eyelashes, cold aloof gaze'),
  'longdinh': ('the Azure Sea Dragon Court beneath the southern sea', 'long dark hair with a pearl and coral headdress, sheer sea-green veil, deep sea-blue hanfu with dragon-scale trim and strands of pearls, gentle mysterious smile'),
  'vanyeudinh': ('the Myriad Demon Court of the demon races', 'long dark hair loosely tied with jade leaf ornaments, a dark green silk hanfu with black embroidery and a soft fox-fur stole, faint golden glint in her eyes, sly charming smile'),
  'ta': ('the Xie clan, imperial preceptors of the capital', 'long dark hair in a tall court updo with gold phoenix hairpins and tassels, rich crimson and gold court hanfu with a high collar, dignified poised expression'),
  'tudo': ('the ancient Situ clan of the central lands', 'long dark hair half up with simple white jade hairpins, a sheer white veil, pale blue-green layered hanfu with silver embroidery, quiet scholarly grace'),
  'congton': ('the ambitious Gongsun clan, vassal of the purple palace', 'long dark hair in a high topknot with a gold-and-violet hair crown, a long sword hilt visible over her shoulder, violet and gold hanfu with sharp tailored lines, proud confident gaze'),
}

# ---------- Thánh nữ / Thánh tử theo thế lực × linh căn: cùng gương mặt LoRA, y phục đổi màu theo linh căn, phong cách theo thế lực ----------
SN_EXTRA = {  # thế lực giữ cổng mới (thánh địa bậc 4)
  'cuuu': ('the Nine Nether Ghost Mansion, the dark-arts holy land beneath the black marsh', 'long dark hair loose with a black lotus hairpin, pale skin, black and deep violet hanfu with faint ghost-blue flame embroidery, a thin bone ornament at the collar, cold mysterious gaze'),
  'linhsontu': ('the Spirit Mountain Temple, the Buddhist holy land of the western desert', 'long dark hair in a simple low bun with a sandalwood pin, white and saffron-gold layered robe with lotus embroidery, a sheer white veil, a string of prayer beads on her wrist, compassionate serene gaze'),
}
SN_ALL = {**SN, **SN_EXTRA}
# linh căn của từng thế lực (mỗi thánh nữ mang một hệ trong số này); màu y phục theo hệ
SN_ELS = {
  'tutieu': ['loi', 'phong', 'hoa'], 'huyennguyen': ['kim', 'thuy', 'quang', 'tho'], 'batchu': ['tho', 'moc', 'hoa', 'bang'], 'cucbang': ['bang', 'thuy', 'quang'],
  'longdinh': ['thuy', 'loi', 'kim'], 'vanyeudinh': ['moc', 'tho', 'am', 'phong'], 'cuuu': ['am', 'thuy'], 'linhsontu': ['quang', 'tho'],
  'ta': ['kim', 'tho', 'quang'], 'tudo': ['thuy', 'quang', 'moc'], 'congton': ['loi', 'kim', 'phong'],
}
EL_ROBE = {
  'kim': 'white and pale gold with gold thread embroidery', 'moc': 'fresh leaf green with silver vine embroidery', 'thuy': 'deep sea blue with silver wave embroidery',
  'hoa': 'crimson red with orange flame embroidery', 'tho': 'ochre yellow and earthy brown with bronze embroidery', 'bang': 'ice white and pale blue with frost crystal embroidery',
  'loi': 'violet purple with silver lightning embroidery', 'phong': 'jade cyan with white cloud embroidery', 'am': 'black and dark purple with faint blue ghost-fire embroidery',
  'quang': 'pure white and radiant gold with sun-ray embroidery',
}
# phong cách nam theo thế lực (cùng motif với nữ, không khăn voan)
ST_LOOK = {
  'tutieu': 'long black hair in a high topknot with a silver lightning-bolt hairpin, layered silk robe with cloud embroidery, faint violet sparks in the air',
  'huyennguyen': 'long black hair in a high topknot with a delicate gold crown, layered silk robe with gold trim, calm noble gaze',
  'batchu': 'long black hair tied in a high ponytail with a red silk band, martial robe with leather bracers and a bronze belt, determined strong gaze',
  'cucbang': 'long black hair with frost-white streaks in a topknot with a snowflake crystal hairpin, robe with a soft white fur collar, frost on his eyelashes, cold aloof gaze',
  'longdinh': 'long black hair with a pearl and coral hair crown, robe with dragon-scale trim and strands of pearls, gentle mysterious smile',
  'vanyeudinh': 'long black hair loosely tied with jade leaf ornaments, robe with black embroidery and a soft fox-fur stole, faint golden glint in his eyes, sly charming smile',
  'cuuu': 'long black hair loose with a black lotus hairpin, pale skin, robe with faint ghost-blue flame embroidery, a thin bone ornament at the collar, cold mysterious gaze',
  'linhsontu': 'long black hair in a simple low knot with a sandalwood pin, a saffron kasaya draped over one shoulder of the robe, a string of prayer beads on his wrist, compassionate serene gaze',
  'ta': 'long black hair in a tall court topknot with gold phoenix hairpins, court robe with a high collar, dignified poised expression',
  'tudo': 'long black hair half up with simple white jade hairpins, layered scholar robe with silver embroidery, quiet scholarly grace',
  'congton': 'long black hair in a high topknot with a gold-and-violet hair crown, a long sword hilt visible over his shoulder, robe with sharp tailored lines, proud confident gaze',
}
SAINT_BASE_M = ('aif181817m, a man, 18 years old, the same handsome face, {look}, '
                'a strikingly handsome xianxia holy son of {who}')

# ---------- Pháp Thiên Tượng Địa: cự nhân linh lực trong suốt mang hình người dùng, màu theo hệ chủ đạo của công pháp ----------
PTTD_COLOR = {
  'kim': 'golden', 'moc': 'emerald green', 'thuy': 'deep sea blue', 'hoa': 'crimson-orange fiery', 'tho': 'amber earthen brown',
  'bang': 'icy pale blue', 'loi': 'violet purple', 'phong': 'jade green', 'am': 'dark black-purple', 'quang': 'radiant white-gold',
  'none': 'pale silvery-white with a faint shifting rainbow chaos shimmer',
}
PTTD_WHO = {
  'm': ('aif181817m, a man', 'the young man (his own face, long black hair in a high topknot)', LORA_MALE),
  'f': ('aif181817f, a woman', 'the young woman (her own face, long dark hair in a high updo)', LORA_FEMALE),
}
STYLE_PTTD = ('Hyper-detailed semi-realistic digital painting, xianxia technique icon art: {trig}, Dharma Heaven and Earth form — '
              'a colossal spirit giant with exactly the face of {who}, wearing full ancient Chinese battle armor: '
              'lamellar plate armor, layered pauldrons with beast-head shoulder guards, chest plate, armored skirt and greaves, a war cape flowing behind. '
              'The ENTIRE giant, face, armor and cape alike, is completely TRANSPARENT and see-through like glowing {color} glass or a ghostly hologram of spiritual energy, '
              'the clouds and mountains behind are clearly visible THROUGH the body of the giant, only glowing {color} edges and light flowing inside, no solid parts, '
              'head among the clouds, feet planted on the mountains, raising one enormous palm to the sky, mountains reaching only to the ankles, '
              'the real person tiny on a peak below the giant, {color} glow lighting the clouds, ' + NEG)

def graph(prompt, seed, loras, wh=640):
    g = {
        '1': {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': 'flux1-dev-Q6_K.gguf'}},
        '2': {'class_type': 'DualCLIPLoaderGGUF', 'inputs': {'clip_name1': 't5-v1_1-xxl-encoder-Q5_K_M.gguf', 'clip_name2': 'clip_l.safetensors', 'type': 'flux'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
        '4': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': prompt}},
        '7': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': ''}},
        '15': {'class_type': 'FluxGuidance', 'inputs': {'conditioning': ['4', 0], 'guidance': 3.0}},
        '5': {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': wh, 'height': wh, 'batch_size': 1}},
        '8': {'class_type': 'VAEDecode', 'inputs': {'samples': ['6', 0], 'vae': ['3', 0]}},
        '10': {'class_type': 'SaveImage', 'inputs': {'images': ['8', 0], 'filename_prefix': 'tienlo_art'}},
    }
    prev = ['1', 0]
    for i, (name, w) in enumerate(loras):
        nid = f'l{i}'
        g[nid] = {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': prev, 'lora_name': name, 'strength_model': w}}
        prev = [nid, 0]
    g['6'] = {'class_type': 'KSampler', 'inputs': {'model': prev, 'positive': ['15', 0], 'negative': ['7', 0], 'latent_image': ['5', 0],
              'seed': seed, 'steps': 20, 'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1.0}}
    return g

def jobs():
    out = []  # (khoá, nhóm, prompt, loras)
    for k, v in SK.items(): out.append(('sk_' + k, 'sk', STYLE_SK.format(subj=v), [LORA_DETAIL]))
    for k, v in TP.items(): out.append(('tp_' + k, 'tp', STYLE_TP.format(subj=v), [LORA_DETAIL]))
    for k, v in FQ.items(): out.append(('fq_' + k, 'fq', STYLE_FQ.format(subj=v), [LORA_DETAIL]))
    for k, (v, c) in CL.items(): out.append(('cl_' + k, 'cl', STYLE_CL.format(subj=v, glow=c), [LORA_DETAIL]))
    for k, v in X.items(): out.append((k, 'x', STYLE_X.format(subj=v), [LORA_DETAIL]))
    for k, (v, lora) in PC.items(): out.append((k, 'pc', STYLE_PT.format(subj=v), [lora, (LORA_DETAIL[0], 0.4)]))
    for k, v in NPC.items(): out.append((k, 'npc', STYLE_PT.format(subj=v), [LORA_DETAIL]))
    for k, v in FOE.items(): out.append((k, 'foe', STYLE_PT.format(subj=v), [LORA_DETAIL]))
    for k, (who, look) in SN.items(): out.append(('sn_' + k, 'sn', STYLE_PT.format(subj=SAINT_BASE.format(look=look, who=who)), [(LORA_FEMALE[0], 0.65), (LORA_DETAIL[0], 0.4)]))  # 0.65: giữ mặt nữ chính, để trang phục tông môn hiện rõ
    for k, els in SN_ELS.items():  # biến thể theo linh căn: sn_<id>_<el> (nữ), st_<id>_<el> (nam)
        who, look = SN_ALL[k]
        for e in els:
            lf = f'{look}, the main color of her hanfu and veil is {EL_ROBE[e]}'
            out.append((f'sn_{k}_{e}', 'snv', STYLE_PT.format(subj=SAINT_BASE.format(look=lf, who=who)), [(LORA_FEMALE[0], 0.65), (LORA_DETAIL[0], 0.4)]))
            lm = f'{ST_LOOK[k]}, the main color of his robe is {EL_ROBE[e]}'
            out.append((f'st_{k}_{e}', 'stv', STYLE_PT.format(subj=SAINT_BASE_M.format(look=lm, who=who)), [(LORA_MALE[0], 0.65), (LORA_DETAIL[0], 0.4)]))
    for k, (who, look) in SN_EXTRA.items(): out.append(('sn_' + k, 'sn', STYLE_PT.format(subj=SAINT_BASE.format(look=look, who=who)), [(LORA_FEMALE[0], 0.65), (LORA_DETAIL[0], 0.4)]))
    # Pháp Thiên Tượng Địa theo người dùng: xem tools/gen_pttd.py (ghép lớp để luôn trong suốt)
    for k, v in BEAST.items(): out.append(('foe_beast_' + k, 'foe', STYLE_CL.format(subj=v + ', fierce and hostile', glow=EL[k]), [LORA_DETAIL]))
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--group', default='')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--redo', action='store_true')
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    js = jobs()
    if a.only: js = [j for j in js if j[0] in a.only.split(',')]
    if a.group: js = [j for j in js if j[1] in a.group.split(',')]
    if not a.redo: js = [j for j in js if not (OUT / f'{j[0]}.webp').exists()]
    if a.limit: js = js[:a.limit]
    print(f'##TOTAL {len(js)}', flush=True)
    for i, (key, _, prompt, loras) in enumerate(js, 1):
        t0 = time.time()
        render_graph(key, graph(prompt, random.randint(1, 2**31), loras))
        (OUT / 'manifest.json').write_text(json.dumps(sorted(p.stem for p in OUT.glob('*.webp'))), encoding='utf-8')
        print(f'##PROGRESS {i}/{len(js)} {key} {time.time() - t0:.0f}s', flush=True)

if __name__ == '__main__':
    main()
