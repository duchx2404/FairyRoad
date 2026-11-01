"""Vẽ tranh vật phẩm bán thực (preset semireal của AIFilm) bằng ComfyUI + Flux dev.
   python tools/gen_items.py [--only id1,id2] [--limit N] [--redo]
   Ảnh: public/items/<loại>_<id>.webp (256×256). Bỏ qua ảnh đã có (trừ --redo)."""
import json, sys, time, random, urllib.request, urllib.parse, io, argparse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'items'
COMFY = 'http://127.0.0.1:8188'

STYLE = ('Hyper-detailed semi-realistic digital painting of {subj}, a single item centered in the frame with generous margin, '
         'game inventory item art in the style of top-tier Chinese xianxia game splash art and live-action xianxia drama props, '
         'photoreal materials and textures, fine surface detail, soft cinematic studio key light with gentle rim light, {glow}'
         'plain dark charcoal-brown background with soft vignette, no text, no letters, no watermark, no frame, no hands, no people, '
         'not anime, not cartoon, not 3D render')

# ---------- danh mục: id → mô tả tiếng Anh ----------
H = {  # linh thảo
  'ngungkhithao': 'a clump of slender jade-green spirit grass with tiny glowing pale-blue dewdrops on the blade tips',
  'xichdiepthao': 'a small herb with crimson-red serrated leaves and dark red veins',
  'thanhtamlien': 'a pale blue lotus flower with golden stamens floating on a lotus pad',
  'hoangtinh': 'a knobbly golden-yellow polygonatum (solomon seal) rhizome root, segmented like ginger, with a few green leaves',
  'baclinhchi': 'a fan-shaped kidney-shaped flat ganoderma reishi bracket fungus with a glossy varnished red-brown lacquered cap and concentric bands, growing sideways from a piece of old wood',
  'tuyetlien': 'a pure white snow lotus (saussurea) flower with frost crystals on its petals',
  'hoaduongqua': 'an orange sun-fire fruit with a faint flame-shaped glow inside, on a short green stem',
  'kimtuyenthao': 'a tuft of thin golden-thread grass, each blade shining like gold wire',
  'longtuthao': 'curling teal dragon-whisker grass with long spiraling tendrils',
  'thienniensam': 'a whole wild ginseng root, pale tan skin with a reddish tint, a thick human-shaped main root with two leg-like branches and fine hair roots, a small stalk with five-fingered green leaves and a cluster of red berries on top, lying on dark soil',
  'loikichmoc': 'a charred branch of lightning-struck wood with crackling violet electric veins',
  'phongvuthao': 'a feathery wind-feather herb with silvery-green plume leaves bending as if in wind',
  'cuuchuyenhoa': 'a mystical violet flower with nine spiraling layered petals and golden center',
  'bangtamthao': 'an icy herb with translucent crystal-blue leaves like carved ice',
  'hoalongqua': 'a large oval fiery-red spirit fruit shaped like a coiled sleeping dragon, smooth ruby skin with faint dragon-scale patterns, a short gnarled stem, wisps of flame around it, resting on dark rock',
  'vannienthanhmoc': 'the polished heartwood core of a ten-thousand-year spirit tree, cross-section rings glowing green at the center',
  'tinhthannhuy': 'a star-shaped golden flower stamen glowing with starlight sparkles',
  'hongmongqua': 'a primordial fruit swirling with red, gold, teal and violet chaos energy, yin-yang pattern faintly visible',
  'uminhthao': 'a dark purple-black ghost grass with eerie violet glowing tips',
  'thienquanghoa': 'a radiant golden flower emitting soft sunlight rays',
  'dahonlien': 'a black-purple night soul lotus with faint violet mist',
  'kimodienqua': 'a radiant golden spirit fruit glowing like a tiny sun hanging from a short twig with three flame-shaped leaves, resting on a dark stone',
}
M = {  # vật liệu
  'longthu': 'a bundle of soft grey demon-beast fur tied with twine',
  'dayeu': 'a tanned, stretched piece of thick demon-beast hide',
  'docnang': 'a translucent green venom sac from a poisonous insect beast, glistening',
  'yeudan': 'a glowing amber-orange demon core orb, beast inner alchemy pearl with swirling energy inside',
  'longlan': 'three large hard armor-plate scales shed from a flood dragon, thick shield-shaped keratin scales with iridescent teal-green sheen and ridged edges, lying on dark stone',
  'linhmoc': 'a short straight branch of pale spirit wood with smooth silvery bark, a few fresh green leaves sprouting from it, faint green spirit light in the wood grain',
  'hukhongthach': 'a jagged black void stone with glowing purple cracks of space',
  'huyenthiet': 'a rectangular forged bar ingot of black dark iron metal with hammer marks, matte with subtle blue sheen, blacksmith metal bar',
  'tinhkim': 'a rectangular bar ingot of gleaming refined gold metal, blacksmith metal bar',
  'hanngoc': 'a raw block of icy blue cold jade, frosty surface',
  'thienthach': 'a dark meteoric iron fragment with glittering star-like specks inside',
  'phuchi': 'a small stack of yellow talisman paper sheets',
  'chusa': 'a small ceramic dish of bright red cinnabar powder with a calligraphy brush resting on it',
}
P = {  # đan dược (màu + đặc điểm)
  'tukhi': 'a single round pale-green elixir pill with a faint swirl of qi mist', 'hoixuandan': 'a round light-green healing pill with a tiny leaf imprint',
  'khaimach': 'a round orange meridian-opening pill with glowing lines on its surface', 'giaidoc': 'a round translucent sky-blue antidote pill',
  'trucco': 'a round golden foundation-establishment pill with an engraved square pattern, faint golden aura', 'ngungnguyen': 'a round deep-blue condensing pill',
  'tucotthuc': 'a round ivory bone-mending pill', 'ketdan': 'a round shining golden core-forming pill with a ring of light',
  'hoanguyen': 'a round teal transformation pill', 'diennien': 'a pink longevity peach-shaped elixir pill',
  'hoaanh': 'a round golden pill with the faint glowing silhouette of a tiny infant inside', 'duonganh': 'a round soft-pink nourishing pill',
  'tayconghoan': 'a round pearl-white marrow-cleansing pill with flowing water patterns', 'ngungthan': 'a round violet spirit-condensing pill with an eye-like pattern',
  'thanhtamdan': 'a round ice-blue calming pill with a lotus imprint', 'khaitridan': 'a round lavender wisdom pill with a star imprint',
  'luyencotdan': 'a round pale bone-tempering pill', 'hoathan': 'a small crystal vial of glowing pale-cyan divine elixir liquid',
  'phahu': 'a round dark void-breaking pill with purple cracks', 'hopnguyen': 'a round pill split into blue and white halves',
  'daithua': 'a round radiant pill with rainbow five-element rings', 'truongsinh': 'a golden immortal peach-shaped elixir pill with a star sparkle',
}
T = {  # phù lục: [hình đặc trưng vẽ trên bùa, màu hào quang]
  'trantaphu': ('a single wide-open divine eye radiating rays of light', 'warm white-gold'),
  'thanhanhphu': ('a pair of footprints with small wings, trailed by swirling wind gusts', 'pale jade-green'),
  'hoaphu': ('a blazing fireball with flame tongues streaming behind it', 'orange fire'),
  'kimcangphu': ('a round warrior shield with a vajra in its center', 'golden'),
  'hoixuanphu': ('a sprouting branch with fresh young leaves', 'soft spring-green'),
  'loiphu': ('exactly five jagged lightning bolts striking down from a cloud', 'violet lightning'),
  'bangphu': ('a large six-pointed snowflake crystal', 'icy pale-blue'),
  'doanhphu': ('a turtle seen from above with a hexagon-patterned shell', 'deep sea-blue'),
  'xichdiemphu': ('a mountain engulfed in roaring flames', 'crimson flame'),
  'dichphu': ('a swirling vortex of clouds', 'silver-cloud'),
  'sinhsinhphu': ('a blooming lotus flower rising on twisting vines with leaves', 'emerald'),
  'thienloiphu': ('one huge thunderbolt splitting through dark storm clouds', 'bright purple thunder'),
  'thaiamphu': ('a crescent moon above frosted waves', 'cold silver moonlight'),
  'phongthienphu': ('a square imperial seal stamp with a coiled beast knob', 'heavy amber'),
  'hukhongphu': ('a jagged crack tearing open through empty space', 'dark violet void'),
  'nadiphu': ('a spiral portal vortex', 'shimmering indigo'),
  'tutienphu': ('a long straight immortal sword pointing downward with sword energy around it', 'sharp white-gold'),
  'vanphapphu': ('a domed protective barrier made of concentric rings', 'radiant rainbow'),
  'thiendaophu': ('a great eye in the sky above a square seal', 'blazing holy golden'),
  'nietbanphu': ('a phoenix with spread wings rising from flames', 'phoenix red-gold'),
}
TALIS_DESC = ('a single vertical strip of aged yellow Taoist talisman paper lying flat, on it a bold red cinnabar ink brush painting of {m}, '
              'the painting fills most of the paper, traditional Chinese ink-brush art drawn in red ink only on the yellow paper, '
              'a thin red border line along the paper edge, no Chinese characters, no letters, no writing')
X = {  # vật đặc biệt
  'tuitruvat': 'a small embroidered purple silk storage pouch with golden drawstring',
  'banddo': 'an old Chinese silk map scroll partially unrolled on a wooden table, painted mountains and rivers in ink wash style, wooden scroll rods',
  'ngocgian': 'a jade slip, a flat rectangular green jade tablet used to store knowledge',
  'linhthach_trung': 'a cluster of medium-grade glowing blue spirit stones',
  'linhthach_thuong': 'a large high-grade violet spirit crystal glowing intensely',
  'kiemlenh': 'a rectangular jade and bronze sect token plaque with carved cloud patterns and a red silk tassel',
  'linhtuyen': 'a small porcelain bottle of glowing spirit spring water',
  'thanhoa': 'a small spirit flame floating above an ancient bronze stand',
  'phatnganh': 'a string of dark brown bodhi seed prayer beads',
}
G = {  # pháp khí theo kiểu dáng
  'kiem': 'an ornate straight jian sword with a decorated guard and tassel', 'dao': 'a curved single-edged dao saber', 'thuong': 'a spear with a long shaft and red tassel',
  'phien': 'an ornate folding fan weapon with painted silk', 'tieu': 'three throwing darts', 'cham': 'a set of fine silver needles in a cloth roll',
  'cau': 'a pair of Chinese hook swords (shuang gou) crossed, each straight blade ending in a large curved hook at the tip, crescent moon shaped hand guard, wushu weapon', 'phattran': 'a Taoist horsetail fly-whisk with white hair and wooden handle',
  'giap': 'an ancient Chinese lamellar armor displayed on a wooden armor stand, empty, no person, no helmet on a head', 'bao': 'an embroidered Taoist robe hanfu', 'y': 'an elegant silk hanfu garment', 'hotamkinh': 'a round polished bronze heart-protecting mirror plate (huxinjing), a flat circular disc with engraved bagua trigram border and leather straps',
  'langiap': 'a dragon-scale armor vest', 'an': 'a carved jade seal stamp with a beast knob', 'chung': 'an ancient bronze bell artifact', 'binh': 'a porcelain magic gourd vase',
  'kinh': 'an ancient bronze mirror with engraved back', 'dinh': 'a three-legged bronze alchemy cauldron ding', 'thap': 'a small multi-tiered golden pagoda artifact',
  'chau': 'a glowing spirit pearl on a stand', 'linh': 'a bronze ritual bell with handle', 'gioi': 'a jade storage ring with a gem', 'hoan': 'a carved jade bracelet',
  'ngocboi': 'a carved jade pendant with a red cord', 'trac': 'a gold arm bracelet', 'ngoa': 'a pair of Ming dynasty official black satin boots (guanxue), tall shaft, thick white platform soles, upturned square toes, silver cloud embroidery, museum artifact', 'hai': 'a pair of Ming dynasty Hanfu cloth shoes, low-cut, flat thin soles, rounded upturned toes (yunlu), dark blue cotton with embroidered cloud tips, museum artifact, not sneakers', 'ly': 'a pair of ancient Chinese straw sandals (caoxie), flat woven rice-straw soles with straw rope straps tied in loops, open toes, museum artifact, not sneakers',
}
B = {  # bí kíp / kinh thư
  'cp_kim': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover dyed a golden cover', 'cp_moc': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover dyed a jade-green cover', 'cp_thuy': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover dyed a deep blue cover',
  'cp_hoa': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover dyed a crimson cover', 'cp_tho': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover dyed an earthen brown cover', 'cp_bang': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover dyed an icy pale-blue cover',
  'cp_loi': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover dyed a violet cover crackling with faint lightning', 'cp_phong': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover dyed a teal-green cover', 'cp_am': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover dyed a black cover and dark purple mist',
  'cp_quang': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover dyed a white-gold cover glowing softly', 'cp_none': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, plain old yellowed paper cover', 'cp_evil': 'an old Chinese xianzhuang string-bound book lying flat on a wooden desk, floppy soft rice-paper cover, visible white thread stitches along the left edge, a narrow paper title strip with brush calligraphy, Ming dynasty museum artifact, not a hardcover, not leather, the cover blood-red stained, black thread stitches, dark red mist around it',
  'tp': 'an open Buddhist-Taoist sutra book with a glowing lotus above the pages', 'fq': 'a rolled ancient scroll with jade rollers and red tassel', 'recipe': 'an open alchemy recipe scroll with diagrams',
}

def jobs():
    out = []
    for k, v in H.items(): out.append(('h_' + k, v, 'subtle spirit glow, '))
    for k, v in M.items(): out.append(('m_' + k, v, ''))
    for k, v in P.items(): out.append(('p_' + k, v + ' resting on a small jade dish', 'faint magical aura, '))
    for k, (m, c) in T.items(): out.append(('t_' + k, TALIS_DESC.format(m=m), f'the painting glows faintly with a {c} aura, '))
    for k, v in X.items(): out.append(('x_' + k, v, ''))
    for k, v in G.items(): out.append(('g_' + k, v, ''))
    for k, v in B.items(): out.append(('b_' + k, v, ''))
    return out

def graph(prompt, seed):
    return {
        '1': {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': 'flux1-dev-Q6_K.gguf'}},
        '2': {'class_type': 'DualCLIPLoaderGGUF', 'inputs': {'clip_name1': 't5-v1_1-xxl-encoder-Q5_K_M.gguf', 'clip_name2': 'clip_l.safetensors', 'type': 'flux'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
        '9': {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['1', 0], 'lora_name': 'FLUX.1-dev-LoRA-add-details.safetensors', 'strength_model': 0.6}},
        '4': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': prompt}},
        '7': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': ''}},
        '15': {'class_type': 'FluxGuidance', 'inputs': {'conditioning': ['4', 0], 'guidance': 3.0}},
        '5': {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': 640, 'height': 640, 'batch_size': 1}},
        '6': {'class_type': 'KSampler', 'inputs': {'model': ['9', 0], 'positive': ['15', 0], 'negative': ['7', 0], 'latent_image': ['5', 0],
              'seed': seed, 'steps': 20, 'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1.0}},
        '8': {'class_type': 'VAEDecode', 'inputs': {'samples': ['6', 0], 'vae': ['3', 0]}},
        '10': {'class_type': 'SaveImage', 'inputs': {'images': ['8', 0], 'filename_prefix': 'tienlo_item'}},
    }

def post(path, data):
    req = urllib.request.Request(COMFY + path, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

def get(path):
    return json.loads(urllib.request.urlopen(COMFY + path, timeout=30).read())

def render(key, prompt):
    render_graph(key, graph(prompt, random.randint(1, 2**31)))

def render_graph(key, g):
    pid = post('/prompt', {'prompt': g})['prompt_id']
    while True:
        time.sleep(2)
        h = get('/history/' + pid)
        if pid in h:
            st = h[pid].get('status', {})
            if st.get('status_str') == 'error': raise RuntimeError(str(st)[:300])
            imgs = [i for n in h[pid]['outputs'].values() for i in n.get('images', [])]
            if imgs: break
    im = imgs[0]
    q = urllib.parse.urlencode({'filename': im['filename'], 'subfolder': im['subfolder'], 'type': im['type']})
    raw = urllib.request.urlopen(COMFY + '/view?' + q, timeout=60).read()
    img = Image.open(io.BytesIO(raw)).convert('RGB').resize((256, 256), Image.LANCZOS)
    img.save(OUT / f'{key}.webp', 'WEBP', quality=88)
    # dọn file gốc của ComfyUI (xoá là xoá hết)
    src = Path('E:/ComfyUI_windows_portable/ComfyUI/output') / im['subfolder'] / im['filename']
    try: src.unlink()
    except OSError: pass

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--redo', action='store_true')
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    js = jobs()
    if a.only: js = [j for j in js if j[0] in a.only.split(',')]
    if not a.redo: js = [j for j in js if not (OUT / f'{j[0]}.webp').exists()]
    if a.limit: js = js[:a.limit]
    print(f'##TOTAL {len(js)}', flush=True)
    for i, (key, subj, glow) in enumerate(js, 1):
        t0 = time.time()
        render(key, STYLE.format(subj=subj, glow=glow))
        print(f'##PROGRESS {i}/{len(js)} {key} {time.time() - t0:.0f}s', flush=True)
    (OUT / 'manifest.json').write_text(json.dumps(sorted(p.stem for p in OUT.glob('*.webp'))), encoding='utf-8')

if __name__ == '__main__':
    main()
