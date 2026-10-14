# Tana atlasi: Servier Medical Art (CC BY 4.0) rasmlaridan qatlamlar va a'zo konturlari.
# python scripts/atlas/build.py <servier papka> scripts/atlas/layout.json <chiqish papka> [preview.png]
# Kerak: numpy, pillow, scikit-image. Manba fayllar ro'yxati — layout.json "sources".
# Chiqish: bg.webp, <qatlam>.webp, atlas.json (qatlamlar joyi, tartibi, a'zo konturlari SVG path).
import json, sys, warnings
warnings.filterwarnings("ignore")
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from skimage import measure, morphology, draw

SRC, CFGF, OUT = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
PREVIEW = Path(sys.argv[4]) if len(sys.argv) > 4 else None
OUT.mkdir(parents=True, exist_ok=True)
CFG = json.loads(CFGF.read_text(encoding="utf8"))
W, H = CFG["canvas"]
RES = CFG.get("res", 1)
VX, VY, VW, VH = CFG["view"]

def load(name):
    return Image.open(SRC / name).convert("RGBA")

# ---- Fon: och tana silueti + yarim shaffof skelet ----
B = CFG["bg"]
if B.get("body"):
    body = load(B["body"]); body = body.resize((round(body.width * B["body_h"] / body.height), B["body_h"]), Image.LANCZOS)
    a = np.array(body)[..., 3] > 10
    a = morphology.binary_closing(a, morphology.disk(3))
    arr = np.zeros((*a.shape, 4), np.uint8)
    arr[a] = (*B["fill"], 255)
    edge = morphology.binary_dilation(a, morphology.disk(2)) & ~a
    arr[edge] = (*B["edge"], 255)
    sil = Image.fromarray(arr)
skel = load(B["skel"]); skel = skel.resize((round(skel.width * B["skel_h"] * RES / skel.height), B["skel_h"] * RES), Image.LANCZOS)
sa = np.array(skel); sa[..., 3] = (sa[..., 3] * B["skel_alpha"]).astype(np.uint8); skel = Image.fromarray(sa)
bg = Image.new("RGBA", (W * RES, H * RES), (0, 0, 0, 0))
if B.get("body"): bg.alpha_composite(sil, tuple(B["body_xy"]))
bg.alpha_composite(skel, (B["skel_xy"][0] * RES, B["skel_xy"][1] * RES))
bg_full = bg
bg.crop((VX * RES, VY * RES, (VX + VW) * RES, (VY + VH) * RES)).save(OUT / "bg.webp", quality=84)

# ---- Qatlamlar ----
layers, crops = {}, {}
for name, L in CFG["layers"].items():
    src = load(L["src"])
    if L.get("crop"): src = src.crop(tuple(L["crop"]))
    s = L["w"] / src.width
    sy = s * L.get("squash", 1)
    img = src.resize((L["w"] * RES, round(src.height * sy * RES)), Image.LANCZOS)
    if L.get("alpha", 1) < 1:
        ia = np.array(img); ia[..., 3] = (ia[..., 3] * L["alpha"]).astype(np.uint8); img = Image.fromarray(ia)
    img.save(OUT / f"{name}.webp", quality=88)
    layers[name] = {"x": L["x"], "y": L["y"], "w": L["w"], "h": round(src.height * sy), "s": s, "sy": sy}
    crops[name] = src

def contour_path(mask, L, tol=1.5):
    mask = morphology.binary_closing(mask, morphology.disk(4))
    mask = morphology.remove_small_holes(mask, 2000)
    lab = measure.label(mask)
    parts = []
    for r in sorted(measure.regionprops(lab), key=lambda r: -r.area):
        if r.area < 300: continue
        c = measure.find_contours(np.pad(lab == r.label, 1), 0.5)
        poly = measure.approximate_polygon(max(c, key=len), tolerance=tol / L["s"])
        pts = [(L["x"] + (p[1] - 1) * L["s"], L["y"] + (p[0] - 1) * L["sy"]) for p in poly]
        parts.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
    return "".join(parts)

def box_mask(shape, box):
    m = np.zeros(shape, bool); x0, y0, x1, y1 = box; m[y0:y1, x0:x1] = True; return m

masks = {}
for oid, spec in CFG["organs"].items():
    src = crops[spec["layer"]]
    arr = np.array(src).astype(int)
    if "seeds" in spec:
        line = (arr[..., :3].max(-1) < 110) | (arr[..., 3] < 200)
        lab = measure.label(~line, connectivity=1)
        keep = {lab[y, x] for x, y in spec["seeds"] if lab[y, x]}
        m = np.isin(lab, list(keep))
        m = morphology.binary_dilation(m, morphology.disk(spec.get("grow", 3)))
    else:
        m = arr[..., 3] > 40
    if "box" in spec: m &= box_mask(m.shape, spec["box"])
    if "within" in spec or "outside" in spec:
        pm = np.zeros(m.shape, bool)
        poly = np.array(spec.get("within") or spec.get("outside"))
        rr, cc = draw.polygon(poly[:, 1], poly[:, 0], m.shape); pm[rr, cc] = True
        m &= pm if "within" in spec else ~pm
    if "minus" in spec: m &= ~box_mask(m.shape, spec["minus"])
    masks[oid] = (m, spec["layer"])

organs = {oid: contour_path(m, layers[ln]) for oid, (m, ln) in masks.items()}
meta = {"canvas": [W, H], "view": [VX, VY, VW, VH], "order": CFG["order"], "layers": {k: {kk: round(v, 1) if isinstance(v, float) else v for kk, v in L.items() if kk != "s"} for k, L in layers.items()}, "organs": organs}
for L in meta["layers"].values(): L.pop("sy", None)
(OUT / "atlas.json").write_text(json.dumps(meta), encoding="utf8")

if PREVIEW:
    pv = Image.new("RGBA", (W, H), (255, 255, 255, 255)); pv.alpha_composite(bg_full.resize((W, H)))
    for name in CFG["order"]:
        li = Image.open(OUT / f"{name}.webp").convert("RGBA").resize((layers[name]["w"], layers[name]["h"]))
        pv.alpha_composite(li, (layers[name]["x"], layers[name]["y"]))
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    pal = [(255,0,0),(0,160,0),(0,0,255),(255,140,0),(160,0,160),(0,170,170),(120,80,0),(255,0,160),(0,0,0),(90,90,255),(0,120,60),(200,200,0),(255,90,90),(60,60,60),(0,90,150)]
    for k, (oid, (m, ln)) in enumerate(masks.items()):
        L = layers[ln]
        for seg in organs[oid].split("Z"):
            if not seg: continue
            pts = [tuple(map(float, p.split())) for p in seg[1:].split("L")]
            if len(pts) > 2: d.polygon(pts, outline=pal[k % len(pal)] + (255,), width=2)
    pv.alpha_composite(ov); pv.save(PREVIEW)
print("ok", {k: v.count("M") for k, v in organs.items()})
