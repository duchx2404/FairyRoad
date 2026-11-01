"""Màn giao chiến bán thực: nền trận đánh trên trời, sprite nhân vật chính (LoRA), sprite địch, hư ảnh cự nhân Pháp Thiên Tượng Địa.
   python tools/gen_battle.py [--group bg,pc,gi,foe,full] [--only k1,k2] [--limit N] [--redo]
   Ảnh ra public/items/:
     bg_<địa hình>_<cảnh>_<ngày|đêm>.webp   1280×720, nền toàn màn hình
     sp_pc_<m|f>_<vũ khí>.webp              sprite nhân vật chính, có alpha (tách nền xanh)
     gi_<m|f>_<vũ khí>.webp                 cự nhân: alpha = độ sáng của nét, màu trắng → game tô màu theo hệ
     sp_foe_<loại>.webp                     sprite địch, có alpha
     sp_ally_<m|f>_<hệ|none>.webp           sprite đồng hành riêng theo giới tính × hệ, quay sang phải, có alpha"""
import argparse, io, json, os, random, time, urllib.parse, urllib.request
os.environ.setdefault('U2NET_HOME', 'D:/AI/models/u2net')  # model tach nen de o D:/AI
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from gen_items import OUT, COMFY, post, get
from gen_art import LORA_MALE, LORA_FEMALE, LORA_DETAIL, NEG

RAW = Path(__file__).resolve().parent / 'battle_raw'
# sprite cần lật ngang để NHÂN VẬT nhìn sang phải / ĐỊCH nhìn sang trái (kiểm bằng mắt sau khi vẽ, thêm khoá vào đây)
FLIP = {'sp_foe_beast_hoa', 'sp_sn_huyennguyen', 'sp_sn_cucbang'}  # ảnh gốc PNG trước khi tách nền, để tách lại không mất dữ liệu

# ---------- nền ----------
TERRAIN = {
  'plain': 'the vast plains of a central kingdom far below: a wide winding river, patchwork fields, low green hills and distant blue mountains',
  'snow': 'a frozen northern land far below: snow-covered mountains, ice fields, a frozen river and pine forests under snow',
  'desert': 'a western desert far below: golden sand dunes, a dry canyon, an oasis and a smoking volcano on the horizon',
  'jungle': 'southern ten-thousand mountains far below: endless jungle-covered peaks, waterfalls, mist in the valleys',
  'marsh': 'eastern water country far below: a maze of rivers, lakes and misty marshes, willow islands, fishing boats',
  'sea': 'an open ocean far below: scattered rocky islands with cliffs, turquoise shallows, white surf, a few sailing junks',
}
LANDMARK = {
  'wild': 'no buildings at all, pure wilderness',
  'town': 'a great walled Chinese city with layered stone walls, watchtowers and a palace with golden roofs, built beside the water',
  'sect': 'a grand Taoist sect built on the highest peak: terraced halls with curved roofs, stone stairs, bridges between peaks, banners',
}
TIME = {
  'day': 'bright daytime, a blazing sun high in the sky, towering white cumulus clouds, blue sky',
  'night': 'deep night, a huge full moon, countless stars and a faint milky way, silver-lit clouds, dark blue sky',
}
STYLE_BG = ('Hyper-detailed semi-realistic digital painting, epic xianxia aerial battle arena seen from high up in the sky: '
            'the upper two thirds of the image is open sky with {time}, layers of clouds at the middle height; '
            'the lower third shows {terrain}, with {landmark}. Wide cinematic 16:9 composition, the center of the sky left clear for fighters, '
            'photoreal clouds and atmosphere, soft volumetric light, no people, no creatures, ' + NEG)

# ---------- vũ khí ----------
# Mọi thanh kiếm trong game đều theo mẫu HÁN KIẾM user chốt 2026-11-01 (tools/ref/hanjian_set.png: kiếm rút / bao rỗng / kiếm trong bao,
# vẽ bằng LoRA tools/train_hanjian.py, từ khoá "hanjian"): lưỡi thẳng hẹp hai lưỡi khắc hoa văn, mũi thép nhọn; hộ thủ KHỐI hộp chữ nhật nhỏ
# dày bằng kim loại đen chạm khắc, chỉ rộng hơn lưỡi một chút và ngắn theo chiều dọc (KHÔNG chắn ngang, KHÔNG chữ thập, KHÔNG tsuba, KHÔNG đĩa tròn);
# chuôi quấn dây đen ngắn ≈ 1/5 lưỡi; đốc tròn nhỏ đen; bao đen vuông thẳng, khoen đen chạm khắc ở miệng/giữa/đầu, bao chỉ dài hơn lưỡi 1 đốt ngón tay.
LORA_HANJIAN = ('tienlo_hanjian.safetensors', 1.0)  # tự gắn vào mọi prompt chứa "hanjian" (xem jobs()); ảnh kiếm đứng riêng (tools/test_hanjian.py) dùng 1.0
HAN_JIAN = ('hanjian, exactly ONE Han-dynasty Chinese jian sword, DRAWN with the bare blade fully visible, gripped in the RIGHT hand with the arm relaxed, the blade pointing FORWARD toward the right edge of the picture and slightly downward, the whole sword clearly visible in front of the body (never behind the body, never pointing backward): '
            'a straight slender double-edged polished steel blade with engraved cloud patterns and a sharp pointed tip; '
            'PROPORTIONS (user chốt 2026-11-01, người 175 cm): the blade is long, about 75 cm, reaching from the hand down to just above the ground when the arm hangs; '
            'the guard is a SMALL COMPACT THICK rectangular block of black carved metal, about 3.5 cm long and 6 cm wide, barely wider than the blade '
            '(absolutely NOT a thin crossbar, NOT a European cross-guard, NOT a katana tsuba, NOT a round disc); '
            'the grip is SHORT and straight, only one hand wide (about 12 cm, the blade is six times longer than the grip), tightly wrapped in plain black cord, ending in a small round black pommel no wider than the grip itself (NOT a long two-handed handle, NOT a bulbous pommel); '
            'there is NO scabbard anywhere in the picture, no sheath, no second sword, nothing hanging from the belt, nothing carried on the back, the other hand empty')
HAN_SCABBARD = 'a perfectly straight black lacquered rectangular scabbard with black engraved square collars at the mouth, middle and tip'
WEAPON = {
  'kiem': HAN_JIAN + ' held in one hand', 'dao': 'a curved single-edged dao saber', 'thuong': 'a long spear with a red tassel',
  'cung': 'a recurve bow with an arrow nocked', 'phien': 'an iron folding fan weapon', 'cau': 'a pair of hook swords',
  'phattran': 'a Taoist horsetail fly-whisk', 'quyen': 'no weapon, bare hands in a martial arts palm stance',
}
WHITE = 'isolated on a plain pure white background (#FFFFFF), no scenery, no floor, no ground shadow, no reflection, no mist, nothing else'
GREEN = 'isolated on a perfectly flat, uniform, featureless medium-grey studio background, no gradient, no mist, no smoke, no particles, no floor, no ground shadow, no other objects, nothing else'
# ---------- giày (user chốt 2026-11-01): nam luôn ủng vải đen cổ cao; nữ hài thêu hanfu (tools/ref/shoes_f.png), màu theo trang phục từng nhân vật ----------
SHOES_M = ('on the feet tall ancient Chinese black cloth boots (xianxia swordsman style): closed rounded toe, the soft black fabric shaft rises up to mid-calf '
           'and covers the whole foot and ankle, thin flat white cloth sole, plain and laceless')
SHOES_F = ('on the feet delicate embroidered hanfu flat shoes (xiuhua xie) in a colour matching her outfit: CLOSED rounded toe that fully covers all the toes, NOT sandals, no straps, no bare toes, no bare feet, ankle-height, thin flat white cloth sole, '
           'fine floral and cloud embroidery on the soft fabric, a tiny string of pearls at the toe and a small silk ribbon bow at the heel')
def shoes_for(key: str) -> str:
    """Giày theo khoá job: nữ = f_/_f/sn_, nam = còn lại; yêu thú/ma không giày."""
    if 'beast' in key or 'demon' in key: return ''
    f = ('_f_' in key or key.endswith('_f') or '_sn_' in key)
    return SHOES_F if f else SHOES_M

STYLE_PC = ('Hyper-detailed semi-realistic digital painting, {trig}, WIDE FULL-LENGTH SHOT, the whole figure from the top of the head down to the shoes occupies the middle 70% of the frame height with empty margin above the head and below the feet, FULL BODY of {who}, SHOES_TOKEN, standing in a combat-ready martial arts stance, feet fully visible with empty space below them, '
            'seen from the side in three-quarter view, body and face turned toward the RIGHT edge of the picture, eyes looking to the right, holding {weapon}, robe and hair moving in the wind, '
            'in the style of top-tier Chinese xianxia game character splash art, photoreal skin and real cloth, cinematic light, ' + GREEN + ', ' + NEG)
PC = {
  'm': ('aif181817m, a man', 'a young man with long black hair in a high topknot with a small gold crown, pearl strands beside the face, layered black silk robe with golden dragon and cloud embroidery, tall black stand-up collar crossed in a V with thin gold edging, white inner layer', LORA_MALE),
  'f': ('aif181817f, a woman', 'a young woman with long dark hair in an elegant high updo, a sheer white veil, gold flower earrings with pearls, white silk hanfu with gold trim and wide sleeves', LORA_FEMALE),
}
# cự nhân: nét sáng trắng trên nền đen, cùng dáng và vũ khí; trong game tô màu theo hệ
STYLE_GI = ('Hyper-detailed digital painting, {trig}, FULL BODY from head to feet of {who}, SHOES_TOKEN, standing in a combat-ready martial arts stance, '
            'body turned three-quarter toward the RIGHT side, holding {weapon}, but the whole figure is a HOLLOW WIREFRAME made purely of thin glowing white light lines '
            'and crackling white lightning filaments: outline and a few inner contour lines only, no filled surfaces, no shading, no rendered skin, '
            'the face suggested by only a few glowing strokes, the figure wears ancient Chinese general battle armor (pauldrons, chest plate, armored skirt, war cape) drawn as light lines, '
            'the weapon also drawn as glowing light lines, on a PURE BLACK background (#000000), completely black and empty everywhere else, nothing else, ' + NEG)
GI_WHO = {
  'm': ('aif181817m, a man', 'a young man with long hair in a high topknot', LORA_MALE),
  'f': ('aif181817f, a woman', 'a young woman with long hair in a high updo', LORA_FEMALE),
}

# ---------- địch (quay sang TRÁI) ----------
STYLE_FOE = ('Hyper-detailed semi-realistic digital painting, WIDE FULL-LENGTH SHOT, the whole figure occupies the middle 70% of the frame height with empty margin above and below, FULL BODY of {who}, SHOES_TOKEN, in a hostile combat stance, feet fully visible with empty space below them, '
             'seen from the side in three-quarter view, body and face turned toward the LEFT edge of the picture, eyes looking to the left, in the style of top-tier Chinese xianxia game splash art, photoreal textures, cinematic light, ' + GREEN + ', ' + NEG)
FOE = {
  'mortal': 'a rough bandit with a scar across his cheek, headscarf, leather vest, raising a crude saber',
  'cultivator': 'a cold rival male cultivator in a black and crimson robe, long hair tied back, a glowing flying sword hovering beside him — the flying sword is ' + HAN_JIAN,
  'cultivator_f': 'a cold rival female cultivator in a dark purple robe, long black hair, holding a glowing jade flute',
  'demon': 'a demonic cultivator with pale grey skin, glowing red eyes, black-purple miasma swirling around him, dark tattered robe, clawed hands',
  'beast_kim': 'a gold-armored demon tiger with metallic striped fur, roaring', 'beast_moc': 'a giant moss-covered demon bear with vines on its back, standing on hind legs',
  'beast_thuy': 'a scaled water serpent-dragon coiled and rearing up', 'beast_hoa': 'a fiery demon lion with a mane of real flames',
  'beast_tho': 'a huge rock-hided demon boar with stone tusks', 'beast_bang': 'a frost demon wolf with icicles on its fur, snarling',
  'beast_loi': 'a thunder demon leopard with lightning crackling over black fur', 'beast_phong': 'a storm demon falcon with sharp jade-green feathers, wings spread',
  'beast_am': 'a shadow demon panther with glowing violet eyes in black mist', 'beast_quang': 'a radiant white demon stag with antlers of light',
}

# ---------- đồng hành (quay sang PHẢI, mỗi hệ × giới tính một nhân vật riêng: tuổi, tóc, trang phục, vũ khí khác nhau) ----------
STYLE_ALLY = ('Hyper-detailed semi-realistic digital painting, WIDE FULL-LENGTH SHOT, the whole figure occupies the middle 70% of the frame height with empty margin above and below, FULL BODY of {who}, SHOES_TOKEN, in a combat-ready stance, feet fully visible with empty space below them, '
              'seen from the side in three-quarter view, body and face turned toward the RIGHT edge of the picture, eyes looking to the right, in the style of top-tier Chinese xianxia game splash art, photoreal skin and real cloth, cinematic light, ' + GREEN + ', ' + NEG)
ALLY = {
  'm_kim': 'a stern middle-aged male cultivator with short grey-streaked hair and a trimmed beard, white and gold brocade robe with bronze shoulder plates, holding ' + HAN_JIAN.replace('black carved metal', 'gold carved metal').replace('black engraved square collars', 'gold engraved square collars'),
  'f_kim': 'a sharp-eyed young female sword cultivator with hair in a tight braid wrapped with gold wire, white fitted martial dress with gold metal pauldrons and bracers, holding ' + HAN_JIAN.replace('black carved metal', 'gold carved metal').replace('black engraved square collars', 'gold engraved square collars') + ' in one hand',
  'm_moc': 'a gentle young male herbalist cultivator with loose dark green hair tied low, a simple green and brown linen robe with vine embroidery, a wooden staff sprouting leaves and a medicine gourd at his belt',
  'f_moc': 'a smiling young female wood cultivator with long brown hair decorated with fresh flowers and leaves, layered green hanfu with floral embroidery, vines and petals swirling around her raised hand',
  'm_thuy': 'a calm scholarly male cultivator with long black hair under a blue silk headband, flowing deep-blue robe with wave patterns, holding an open scroll with water ribbons flowing out of it',
  'f_thuy': 'a graceful young female water cultivator with wet-looking dark hair in a low bun with a pearl hairpin, light blue gauze hanfu with silver fish embroidery, a ribbon of clear water spiraling around her',
  'm_hoa': 'a hot-blooded young male fire cultivator with spiky red-brown hair and a red headband, open red and black short robe showing a muscular chest, flames wrapping both fists',
  'f_hoa': 'a fierce young female fire cultivator with wild long crimson hair, red and gold off-shoulder martial dress with short sleeves, a flaming whip in her hand',
  'm_tho': 'a burly bearded male earth cultivator with a shaved head and a stone prayer bead necklace, heavy ochre-brown robe with a thick leather belt, wielding a huge stone hammer',
  'f_tho': 'a sturdy calm young female earth cultivator with dark hair in two buns wrapped in earth-brown cloth, ochre and olive martial dress with a stone armor chest piece, holding a round stone shield',
  'm_bang': 'a cold aloof male ice cultivator with long silver-white hair and pale eyes, white and ice-blue robe with a white fur collar, holding ' + HAN_JIAN.replace('steel blade', 'ice-blue frosted steel blade') + ', frost trailing from the blade',
  'f_bang': 'an elegant young female ice cultivator with long white hair under an icy crystal crown, pale blue and white hanfu with snowflake embroidery and a fur-trimmed cape, snowflakes drifting around her',
  'm_loi': 'a wild young male lightning cultivator with short messy black hair streaked violet, dark violet and black robe with one bare arm wrapped in bandages, violet lightning crackling across his fist',
  'f_loi': 'a bold young female lightning cultivator with long black hair in a high ponytail with a violet ribbon, dark purple and silver martial dress, twin lightning daggers sparking in her hands',
  'm_phong': 'a carefree young male wind cultivator with long light-brown hair loose in the wind, pale jade-green robe with wide sleeves fluttering, a long bamboo flute in his hand',
  'f_phong': 'an agile young female wind cultivator with short dark hair and a green feather hair ornament, light jade-green hanfu with trailing ribbons, a pair of feathered wind fans in her hands',
  'm_am': 'a mysterious thin male shadow cultivator with long black hair covering one eye, black robe with dark purple inner lining and a black hood down, dark mist curling around his hands',
  'f_am': 'an alluring young female shadow cultivator with long black hair with a purple gradient, black and violet hanfu with sheer dark sleeves and a silver moon hairpin, black mist swirling around her',
  'm_quang': 'a serene young male light cultivator with long black hair under a white jade crown, pure white and gold robe, holding a glowing golden prayer-bead rosary radiating soft holy light',
  'f_quang': 'a radiant young female light cultivator with golden-brown hair in a halo-like gold headdress, white and gold hanfu with sheer sleeves, a glowing lotus of white-gold light floating above her palm',
  'm_none': 'an ordinary young male Taoist cultivator with black hair in a topknot with a wooden hairpin, plain grey-blue sect robe, holding ' + HAN_JIAN,
  'f_none': 'an ordinary young female cultivator with long black hair half tied with a simple silver hairpin, plain pale green sect robe, holding ' + HAN_JIAN,
}

# ---------- Thánh nữ toàn thân (xem tranh khi bấm avatar) ----------
from gen_art import SN_ALL as SN, SAINT_BASE
# gấu áo (user chốt 2026-11-01): váy / áo dài luôn chạm đất, chỉ hở mũi giày, không bao giờ chân trần hay váy ngắn
HEM = 'FLOOR-LENGTH robe: the long skirt hem reaches all the way down to the ground and pools slightly on the floor, covering the ankles, only the very tips of the closed shoes peek out from under the hem, never bare feet, never sandals, never a short skirt'
FRONT = (HEM + ', WIDE FULL-LENGTH SHOT, the whole figure from the top of the head to the shoes occupies the middle 70% of the frame height with empty margin above and below, '
         'FULL BODY, standing straight and relaxed, STRICTLY FRONTAL VIEW: body square to the camera, face looking directly into the camera, eyes on the viewer, ')
STYLE_SN_FULL = ('Hyper-detailed semi-realistic digital painting, ' + FRONT + '{subj}, SHOES_TOKEN, hands folded in front or holding a fan, flowing robe, '
                 'in the style of top-tier Chinese xianxia game character splash art, photoreal skin and real cloth, cinematic light, ' + GREEN + ', ' + NEG)

# Sprite trận của thánh nữ (sp_sn_*): toàn thân, quay 3/4 sang phải như sp_ally — KHÔNG trực diện, KHÔNG cắt chân (user góp ý 2026-10-31: sp_sn_huyennguyen bị cắt ngang đùi).
STYLE_SN_SP = ('Hyper-detailed semi-realistic digital painting, WIDE FULL-LENGTH SHOT, the whole figure from the top of the head to the shoes occupies the middle 70% of the frame height with empty margin above and below, '
               'FULL BODY of {subj}, SHOES_TOKEN, ' + HEM + ', standing gracefully, {hands}, the shoe tips visible under the hem with empty space below them, seen from the side in three-quarter view, body and face turned toward the RIGHT edge of the picture, eyes looking to the right, '
               'flowing robe and hair moving in the wind, in the style of top-tier Chinese xianxia game character splash art, photoreal skin and real cloth, cinematic light, ' + GREEN + ', ' + NEG)
SN_HANDS_DEFAULT = 'hands gracefully folded in front of her or holding a closed folding fan, carrying no weapon'
SN_HANDS = {'congton': 'holding ' + HAN_JIAN + ' in one hand, blade pointing down'}
STYLE_PC_FRONT = ('Hyper-detailed semi-realistic digital painting, {trig}, ' + FRONT + '{who}, SHOES_TOKEN, {weapon}, robe and hair still, '
                  'in the style of top-tier Chinese xianxia game character splash art, photoreal skin and real cloth, cinematic light, ' + GREEN + ', ' + NEG)
STYLE_NPC_FRONT = ('Hyper-detailed semi-realistic digital painting, ' + FRONT + '{who}, SHOES_TOKEN, in the style of top-tier Chinese xianxia game character splash art, photoreal textures, cinematic light, ' + GREEN + ', ' + NEG)
NPC_FRONT = {
  'cultivator_m': 'a young male Taoist cultivator in his twenties, black hair in a topknot with a jade hairpin, light grey-blue sect robe, calm expression',
  'cultivator_f': 'a young female cultivator in her twenties, long black hair half tied with a silver hairpin, pale green sect robe, serene expression',
}

def graph(prompt, seed, loras, w, h):
    g = {
        '1': {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': 'flux1-dev-Q6_K.gguf'}},
        '2': {'class_type': 'DualCLIPLoaderGGUF', 'inputs': {'clip_name1': 't5-v1_1-xxl-encoder-Q5_K_M.gguf', 'clip_name2': 'clip_l.safetensors', 'type': 'flux'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
        '4': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': prompt}},
        '7': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': ''}},
        '15': {'class_type': 'FluxGuidance', 'inputs': {'conditioning': ['4', 0], 'guidance': 3.0}},
        '5': {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': w, 'height': h, 'batch_size': 1}},
        '8': {'class_type': 'VAEDecode', 'inputs': {'samples': ['6', 0], 'vae': ['3', 0]}},
        '10': {'class_type': 'SaveImage', 'inputs': {'images': ['8', 0], 'filename_prefix': 'tienlo_battle'}},
    }
    prev = ['1', 0]
    for i, (name, wt) in enumerate(loras):
        g[f'l{i}'] = {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': prev, 'lora_name': name, 'strength_model': wt}}
        prev = [f'l{i}', 0]
    g['6'] = {'class_type': 'KSampler', 'inputs': {'model': prev, 'positive': ['15', 0], 'negative': ['7', 0], 'latent_image': ['5', 0],
              'seed': seed, 'steps': 20, 'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1.0}}
    return g

def render(prompt, loras, w, h) -> Image.Image:
    pid = post('/prompt', {'prompt': graph(prompt, random.randint(1, 2**31), loras, w, h)})['prompt_id']
    while True:
        time.sleep(2)
        hs = get('/history/' + pid)
        if pid in hs:
            st = hs[pid].get('status', {})
            if st.get('status_str') == 'error': raise RuntimeError(str(st)[:300])
            imgs = [i for n in hs[pid]['outputs'].values() for i in n.get('images', [])]
            if imgs: break
    im = imgs[0]
    q = urllib.parse.urlencode({'filename': im['filename'], 'subfolder': im['subfolder'], 'type': im['type']})
    img = Image.open(io.BytesIO(urllib.request.urlopen(COMFY + '/view?' + q, timeout=60).read())).convert('RGB')
    try: (Path('E:/ComfyUI_windows_portable/ComfyUI/output') / im['subfolder'] / im['filename']).unlink()
    except OSError: pass
    return img

# ---------- Vẽ lại phần chân cho ảnh toàn thân NỮ (user chốt 2026-11-01: váy phải chạm đất, lộ chân phải có hài kín mũi) ----------
# Flux + LoRA hay bỏ qua chữ về giày/gấu váy khi vẽ cả người (vùng chân quá nhỏ). Cách sửa: sau khi vẽ xong, cắt vùng từ hông xuống đáy ảnh,
# phóng to 1.5×, che (mask) từ đầu gối xuống rồi vẽ lại riêng vùng đó với prompt chỉ nói về gấu váy + hài, giữ nguyên phần trên làm ngữ cảnh,
# cuối cùng ghép lại (mép mask làm mờ). Ảnh gốc PNG lưu RAW/<khoá>.png, ảnh đã sửa RAW/<khoá>_fix.png.
LOWER_PROMPT = ('Hyper-detailed semi-realistic digital painting, close-up of the LOWER HALF of a standing young woman in an ancient Chinese hanfu dress, seen straight from the front, from the hips down to the ground: '
                + HEM + ', ' + SHOES_F + ', the skirt is one continuous piece of the same fabric, colour, pattern and embroidery as the visible upper part of the dress, falling straight down in soft folds, '
                'the hem lies on the ground and spreads slightly, the shoes are almost completely hidden under the hem, only two small closed embroidered shoe tips peek out from under the front of the hem, NO bare legs, NO bare feet, NO toes, NO sandals, NO high heels, no hands, no weapon, '
                + GREEN + ', ' + NEG)

def _upload(img: Image.Image, name: str) -> str:
    """Đưa ảnh vào thư mục input của ComfyUI (POST /upload/image, multipart), trả về tên để LoadImage dùng."""
    buf = io.BytesIO(); img.save(buf, 'PNG'); data = buf.getvalue()
    bnd = '----tienlo' + str(random.randint(10**8, 10**9))
    head = f'--{bnd}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n'.encode()
    tail = f'\r\n--{bnd}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{bnd}\r\nContent-Disposition: form-data; name="type"\r\n\r\ninput\r\n--{bnd}--\r\n'.encode()
    req = urllib.request.Request(COMFY + '/upload/image', data=head + data + tail, headers={'Content-Type': f'multipart/form-data; boundary={bnd}'})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())['name']

def _run_graph(g) -> Image.Image:
    pid = post('/prompt', {'prompt': g})['prompt_id']
    while True:
        time.sleep(2)
        hs = get('/history/' + pid)
        if pid in hs:
            st = hs[pid].get('status', {})
            if st.get('status_str') == 'error': raise RuntimeError(str(st)[:300])
            imgs = [i for n in hs[pid]['outputs'].values() for i in n.get('images', [])]
            if imgs: break
    im = imgs[0]
    q = urllib.parse.urlencode({'filename': im['filename'], 'subfolder': im['subfolder'], 'type': im['type']})
    out = Image.open(io.BytesIO(urllib.request.urlopen(COMFY + '/view?' + q, timeout=60).read())).convert('RGB')
    try: (Path('E:/ComfyUI_windows_portable/ComfyUI/output') / im['subfolder'] / im['filename']).unlink()
    except OSError: pass
    return out

def figure_span(img: Image.Image):
    """(y đỉnh đầu, y thấp nhất) của hình người trong ảnh gốc nền xám, đo bằng mặt nạ rembg."""
    global _SESS
    from rembg import remove, new_session
    if _SESS is None: _SESS = new_session('isnet-general-use')
    al = np.asarray(remove(img.convert('RGB'), session=_SESS, only_mask=True))
    rows = np.nonzero((al > 80).sum(1) >= 6)[0]
    if not len(rows): return 0, img.height - 1
    return int(rows[0]), int(rows[-1])

def fix_lower(img: Image.Image, loras, scale=1.5, seed=None, denoise=0.82) -> Image.Image:
    """Vẽ lại vùng từ đầu gối xuống: gấu váy chạm đất + hài thêu kín mũi. Trả về ảnh cùng cỡ ảnh gốc (nền xám, chưa tách nền).
    Trước khi vẽ lại, dải vải váy ngay trên đầu gối được kéo dài xuống tận sàn (mức chân thấp nhất) làm khung: mô hình chỉ tinh chỉnh
    (denoise < 1) nên giữ đúng màu / hoa văn váy và độ dài chạm đất, rồi thêm mũi hài theo prompt (lần thử denoise 1.0 bị đổi màu váy, váy vẫn ngắn)."""
    W, H = img.size
    top, bot = figure_span(img)
    hf = max(bot - top, H // 2)
    knee = int(top + hf * 0.68)                       # từ đầu gối xuống là vùng vẽ lại
    y0 = max(0, int(top + hf * 0.45))                 # giữ từ hông xuống đầu gối làm ngữ cảnh
    y0 -= (H - y0) % 16                               # chiều cao vùng cắt chia hết cho 16
    pre = img.convert('RGB').copy()
    band = pre.crop((0, max(y0, knee - int(hf * 0.10)), W, knee))   # dải váy ngay trên đầu gối
    floor = min(H, bot + 8)                                         # gấu váy chạm sàn ở mức chân thấp nhất, hơi xoã ra
    if floor > knee and band.height > 4: pre.paste(band.resize((W, floor - knee), Image.LANCZOS), (0, knee))
    crop = pre.crop((0, y0, W, H))
    cw, ch = int(W * scale) // 16 * 16, int((H - y0) * scale) // 16 * 16
    big = crop.resize((cw, ch), Image.LANCZOS)
    m = np.zeros((ch, cw), np.float32)
    k = int((knee - y0) / (H - y0) * ch); feather = int(48 * scale)
    m[k:, :] = 1
    for i in range(feather): m[max(0, k - feather + i), :] = i / feather
    mask = Image.fromarray((m * 255).astype(np.uint8), 'L')
    tag = f'{random.randint(1, 10**9)}'
    nm_img, nm_msk = _upload(big, f'tienlo_lower_{tag}.png'), _upload(mask.convert('RGB'), f'tienlo_lower_{tag}_m.png')
    g = {
        '1': {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': 'flux1-dev-Q6_K.gguf'}},
        '2': {'class_type': 'DualCLIPLoaderGGUF', 'inputs': {'clip_name1': 't5-v1_1-xxl-encoder-Q5_K_M.gguf', 'clip_name2': 'clip_l.safetensors', 'type': 'flux'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
        '4': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': LOWER_PROMPT}},
        '7': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': ''}},
        '15': {'class_type': 'FluxGuidance', 'inputs': {'conditioning': ['4', 0], 'guidance': 4.0}},
        'img': {'class_type': 'LoadImage', 'inputs': {'image': nm_img}},
        'msk': {'class_type': 'LoadImageMask', 'inputs': {'image': nm_msk, 'channel': 'red'}},
        'inp': {'class_type': 'InpaintModelConditioning', 'inputs': {'positive': ['15', 0], 'negative': ['7', 0], 'vae': ['3', 0], 'pixels': ['img', 0], 'mask': ['msk', 0], 'noise_mask': True}},
        '8': {'class_type': 'VAEDecode', 'inputs': {'samples': ['6', 0], 'vae': ['3', 0]}},
        '10': {'class_type': 'SaveImage', 'inputs': {'images': ['8', 0], 'filename_prefix': 'tienlo_lower'}},
    }
    prev = ['1', 0]
    for i, (name, wt) in enumerate(loras):
        g[f'l{i}'] = {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': prev, 'lora_name': name, 'strength_model': wt}}
        prev = [f'l{i}', 0]
    g['6'] = {'class_type': 'KSampler', 'inputs': {'model': prev, 'positive': ['inp', 0], 'negative': ['inp', 1], 'latent_image': ['inp', 2],
              'seed': seed if seed is not None else random.randint(1, 2**31), 'steps': 24, 'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': denoise}}
    out = _run_graph(g).resize(crop.size, Image.LANCZOS)
    for nm in (nm_img, nm_msk):  # dọn ảnh tạm đã đưa vào ComfyUI
        try: (Path('E:/ComfyUI_windows_portable/ComfyUI/input') / nm).unlink()
        except OSError: pass
    a = np.asarray(mask.resize(crop.size, Image.BILINEAR)).astype(np.float32)[..., None] / 255
    orig = img.convert('RGB').crop((0, y0, W, H))
    merged = (np.asarray(out).astype(np.float32) * a + np.asarray(orig).astype(np.float32) * (1 - a)).clip(0, 255).astype(np.uint8)
    res = img.convert('RGB').copy()
    res.paste(Image.fromarray(merged), (0, y0))
    return res

def fix_lower_then_key(key: str, loras):
    """Hậu xử lý cho ảnh toàn thân nữ: vẽ lại phần chân rồi mới tách nền. Lưu bản đã sửa vào RAW/<khoá>_fix.png."""
    def post_fn(im: Image.Image) -> Image.Image:
        fixed = fix_lower(im, loras)
        RAW.mkdir(exist_ok=True); fixed.save(RAW / f'{key}_fix.png')
        return chroma_key(fixed)
    return post_fn

def _nblur(arr: np.ndarray, r: float) -> np.ndarray:
    """Làm mờ Gauss mảng float (0..1), 1 hoặc 3 kênh."""
    if arr.ndim == 2:
        return np.asarray(Image.fromarray((arr * 255).clip(0, 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255
    return np.stack([_nblur(arr[..., i], r) for i in range(arr.shape[-1])], -1)

def bg_field(a: np.ndarray, tol=0.12) -> np.ndarray:
    """Ước lượng màu nền từng điểm cho nền studio phẳng / chuyển sắc / loang sáng:
       lặp 3 lần — lấy các điểm đang tin là nền, làm mờ có trọng số (bán kính lớn) thành trường màu, rồi xét lại điểm nào gần trường đó."""
    g = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), axis=0)
    w = (np.sqrt(((a - g) ** 2).sum(-1)) < 0.25).astype(np.float32)
    field = np.broadcast_to(g, a.shape).astype(np.float32)
    for r in (80, 50, 30):
        field = _nblur(a * w[..., None], r) / np.maximum(_nblur(w, r), 1e-3)[..., None]
        w = (np.sqrt(((a - field) ** 2).sum(-1)) < tol).astype(np.float32)
    return field

def flood_bg(img: Image.Image, tol=0.12, grow=2500, loose_grey=False) -> np.ndarray:
    """Mặt nạ nền: điểm gần màu nền ước lượng tại chỗ, loang từ mép vào (không ăn vào trong hình)."""
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255
    H, W = a.shape[:2]
    near = np.sqrt(((a - bg_field(a)) ** 2).sum(-1)) < tol
    if loose_grey:  # nền trắng (yêu thú): bóng / phản chiếu xám nhạt trên sàn cũng là nền
        sat = a.max(-1) - a.min(-1); lum = a.mean(-1)
        near |= (sat < 0.15) & (lum > 0.45)
    m = np.zeros((H, W), bool)
    m[0, :] = m[-1, :] = m[:, 0] = m[:, -1] = True
    m &= near
    for _ in range(grow):
        d = m.copy()
        d[1:, :] |= m[:-1, :]; d[:-1, :] |= m[1:, :]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
        d &= near
        if (d == m).all(): break
        m = d
    return m

def main_blob(fg: np.ndarray, grow=2500) -> np.ndarray:
    """Khối hình liền mạch chứa 'bàn chân': loang từ điểm hình thấp nhất gần giữa ảnh (bỏ mảng sương / đốm rời)."""
    H, W = fg.shape
    ys, xs = np.nonzero(fg)
    if not len(ys): return fg
    low = ys >= np.percentile(ys, 85)
    i = np.argmin(np.abs(xs[low] - W / 2))
    sy, sx = ys[low][i], xs[low][i]
    m = np.zeros_like(fg); m[sy, sx] = True
    for _ in range(grow):
        d = m.copy()
        d[1:, :] |= m[:-1, :]; d[:-1, :] |= m[1:, :]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
        d &= fg
        if (d == m).all(): break
        m = d
    return m

_SESS = None
def chroma_key(img: Image.Image, loose_grey=False) -> Image.Image:
    """Tách nền bằng mô hình rembg (isnet-general-use, CPU): giữ mặt, tóc bay, vũ khí; cắt sát hình."""
    global _SESS
    from rembg import remove, new_session
    if _SESS is None: _SESS = new_session('isnet-general-use')
    out = remove(img.convert('RGB'), session=_SESS, alpha_matting=False, post_process_mask=True)
    al = out.split()[3]
    box = al.point(lambda v: 255 if v > 40 else 0).getbbox()
    return out.crop(box) if box else out

def glow_alpha(img: Image.Image) -> Image.Image:
    """Cự nhân trên nền đen → RGBA trắng, alpha = độ sáng của nét (game tô màu bằng mask)."""
    lum = np.asarray(img.convert('L')).astype(np.float32) / 255
    bg = flood_bg(img, tol=0.16)
    bgl = float(np.median(lum[bg])) if bg.any() else 0.0
    alpha = np.clip((lum - bgl - 0.1) / max(0.25, 0.75 - bgl), 0, 1) ** 0.8 * (~bg)
    al = Image.fromarray((alpha * 255).astype(np.uint8), 'L')
    white = Image.new('RGB', img.size, (255, 255, 255))
    out = Image.merge('RGBA', (*white.split(), al))
    box = al.point(lambda v: 255 if v > 30 else 0).getbbox()
    return out.crop(box) if box else out

def jobs():
    out = []  # (khoá, nhóm, prompt, loras, w, h, hậu xử lý)
    for t, td in TERRAIN.items():
        for l, ld in LANDMARK.items():
            for tm, tmd in TIME.items():
                out.append((f'bg_{t}_{l}_{tm}', 'bg', STYLE_BG.format(time=tmd, terrain=td, landmark=ld), [LORA_DETAIL], 1280, 720, None))
    for g, (trig, who, lora) in PC.items():
        for w, wd in WEAPON.items():
            out.append((f'sp_pc_{g}_{w}', 'pc', STYLE_PC.format(trig=trig, who=who, weapon=wd), [(lora[0], 0.75), (LORA_DETAIL[0], 0.4)], 640, 1280, chroma_key))
    for g, (trig, who, lora) in GI_WHO.items():
        for w, wd in WEAPON.items():
            out.append((f'gi_{g}_{w}', 'gi', STYLE_GI.format(trig=trig, who=who, weapon=wd), [(lora[0], 0.7), (LORA_DETAIL[0], 0.3)], 640, 1024, glow_alpha))
    for g, (trig, who, lora) in PC.items():
        # tranh toàn thân xem chi tiết: CHỈ bản tay không (user chốt 2026-10-31 — Flux + LoRA vẽ vũ khí cầm tay không ổn, vũ khí chỉ có ở sprite trận)
        for w, wd in [('quyen', 'no weapon at all, both hands empty and relaxed at the sides, nothing hanging from the belt')]:
            out.append((f'full_pc_{g}_{w}', 'full', STYLE_PC_FRONT.format(trig=trig, who=who, weapon=wd), [(lora[0], 0.75), (LORA_DETAIL[0], 0.4)], 640, 1280, chroma_key))
    for k, who in NPC_FRONT.items():
        out.append((f'full_npc_{k}', 'full', STYLE_NPC_FRONT.format(who=who), [LORA_DETAIL], 640, 1280, chroma_key))
    for k, (who, look) in SN.items():
        out.append((f'full_sn_{k}', 'full', STYLE_SN_FULL.format(subj=SAINT_BASE.format(look=look, who=who)), [(LORA_FEMALE[0], 0.65), (LORA_DETAIL[0], 0.4)], 640, 1280, chroma_key))
    for k, (who, look) in SN.items():
        out.append((f'sp_sn_{k}', 'sn', STYLE_SN_SP.format(subj=SAINT_BASE.format(look=look, who=who), hands=SN_HANDS.get(k, SN_HANDS_DEFAULT)), [(LORA_FEMALE[0], 0.65), (LORA_DETAIL[0], 0.4)], 640, 1280, chroma_key))
    for k, who in ALLY.items():
        out.append((f'sp_ally_{k}', 'ally', STYLE_ALLY.format(who=who), [LORA_DETAIL], 640, 1280, chroma_key))
    for k, who in FOE.items():
        beast = k.startswith('beast')
        out.append((f'sp_foe_{k}', 'foe', STYLE_FOE.format(who=who).replace(GREEN, WHITE) if beast else STYLE_FOE.format(who=who), [LORA_DETAIL], 832 if beast else 640, 832 if beast else 1280, (lambda im: chroma_key(im, loose_grey=True)) if beast else chroma_key))
    # giày theo giới tính (SHOES_TOKEN) + mọi prompt có Hán kiếm ("hanjian") chạy thêm LoRA tienlo_hanjian
    # ảnh toàn thân nữ (nhóm full): vẽ lại phần chân (gấu váy chạm đất + hài kín mũi) trước khi tách nền
    out = [(k, g, p, l, w, h, fix_lower_then_key(k, l) if g == 'full' and shoes_for(k) == SHOES_F else f) for k, g, p, l, w, h, f in out]
    out = [(k, g, p.replace('SHOES_TOKEN, ', (shoes_for(k) + ', ') if shoes_for(k) else '').replace('SHOES_TOKEN', shoes_for(k)), l, w, h, f) for k, g, p, l, w, h, f in out]
    out = [(k, g, p, list(l) + ([LORA_HANJIAN] if 'hanjian' in p else []), w, h, f) for k, g, p, l, w, h, f in out]
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--group', default='', help='bg,pc,gi,full,sn,ally,foe')
    ap.add_argument('--only', default='')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--redo', action='store_true')
    ap.add_argument('--rekey', action='store_true', help='chỉ tách nền lại các sprite sp_* đã có')
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    if a.rekey:
        for f in sorted(OUT.glob('sp_*.webp')) + sorted(OUT.glob('gi_*.webp')):
            if a.only and f.stem not in a.only.split(','): continue
            raw = RAW / f'{f.stem}.png'
            if not raw.exists(): print('không có ảnh gốc, bỏ qua', f.stem, flush=True); continue
            fn = glow_alpha if f.stem.startswith('gi_') else (lambda im: chroma_key(im, loose_grey=True)) if f.stem.startswith('sp_foe_beast') else chroma_key
            im = fn(Image.open(raw).convert('RGB'))
            if f.stem in FLIP: im = im.transpose(Image.FLIP_LEFT_RIGHT)
            im.save(f, 'WEBP', quality=90, exact=True)
            print('tách nền lại', f.stem, flush=True)
        return
    js = jobs()
    if a.group: js = [j for j in js if j[1] in a.group.split(',')]
    if a.only: js = [j for j in js if j[0] in a.only.split(',')]
    if not a.redo: js = [j for j in js if not (OUT / f'{j[0]}.webp').exists()]
    if a.limit: js = js[:a.limit]
    print(f'##TOTAL {len(js)}', flush=True)
    for i, (key, grp, prompt, loras, w, h, post_fn) in enumerate(js, 1):
        t0 = time.time()
        img = render(prompt, loras, w, h)
        if post_fn:
            RAW.mkdir(exist_ok=True)
            img.save(RAW / f'{key}.png')
            img = post_fn(img)
            if key in FLIP: img = img.transpose(Image.FLIP_LEFT_RIGHT)
        if grp == 'bg': img.save(OUT / f'{key}.webp', 'WEBP', quality=84)
        else: img.save(OUT / f'{key}.webp', 'WEBP', quality=90, exact=True)
        (OUT / 'manifest.json').write_text(json.dumps(sorted(p.stem for p in OUT.glob('*.webp'))), encoding='utf-8')
        print(f'##PROGRESS {i}/{len(js)} {key} {time.time() - t0:.0f}s', flush=True)

if __name__ == '__main__':
    main()
