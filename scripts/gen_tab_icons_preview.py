#!/usr/bin/env python3
"""
生成 PetPal TabBar 图标预览大图（4x 放大 = 324x324）
方便在聊天中确认效果
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUT = "/Users/liumeng/private/mini_program/petpal/assets/tab-icons"
PREVIEW_DIR = "/Users/liumeng/private/mini_program/petpal/docs"
os.makedirs(OUT, exist_ok=True)

SIZE = 324          # 预览用 4x 大图
PAD  = 64
W    = 12           # 线条宽度
W2   = 15

# 颜色
GRAY   = (181, 166, 140)
ORANGE = (255, 140, 66)
WHITE  = (255, 255, 255)
TRANS  = (0, 0, 0, 0)
BG     = (255, 253, 246)  # 暖白背景

def new_canvas(bg=False):
    if bg:
        return Image.new("RGBA", (SIZE, SIZE), BG)
    return Image.new("RGBA", (SIZE, SIZE), TRANS)

def save(img, name):
    path = os.path.join(PREVIEW_DIR, name)
    img.save(path, "PNG")
    print(f"  ✓ {path}")

# ── 任务 ────────────────────────────────
def draw_tasks(selected):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    c = ORANGE if selected else GRAY
    w = W2 if selected else W
    x0, y0, x1, y1 = PAD, PAD+16, SIZE-PAD, SIZE-PAD
    r = 32
    d.rounded_rectangle([x0,y0,x1,y1], radius=r, outline=c, width=w)
    cx = SIZE//2
    d.rounded_rectangle([cx-40, y0-16, cx+40, y0+32], radius=16, fill=c)
    if selected:
        pts = [(x0+48, y0+96), (cx-16, y0+152), (x1-40, y0+48)]
        for i in range(len(pts)-1):
            d.line([pts[i], pts[i+1]], fill=WHITE, width=w-2)
    else:
        for dy in (56, 104, 152):
            d.line([(x0+56, y0+dy), (x1-56, y0+dy)], fill=c, width=w-2)
    return img

# ── 宠物 ────────────────────────────────
def draw_pet(selected):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    c = ORANGE if selected else GRAY
    w = W2 if selected else W
    cx, cy = SIZE//2, SIZE//2 + 8
    
    # 耳朵
    ear_color = c if selected else TRANS
    ew_l = [cx-104, cy-120, cx-48, cy-40]
    ew_r = [cx+48, cy-120, cx+104, cy-40]
    if selected:
        d.ellipse(ew_l, fill=c)
        d.ellipse(ew_r, fill=c)
    else:
        d.ellipse(ew_l, outline=c, width=w)
        d.ellipse(ew_r, outline=c, width=w)
    
    # 脸
    face = [cx-88, cy-88, cx+88, cy+88]
    if selected:
        d.ellipse(face, fill=c)
    else:
        d.ellipse(face, outline=c, width=w)
    
    # 眼睛
    eye_y = cy - 32
    if selected:
        d.ellipse([cx-48, eye_y-20, cx-24, eye_y+4], fill=WHITE)
        d.ellipse([cx+24, eye_y-20, cx+48, eye_y+4], fill=WHITE)
        d.ellipse([cx-38, eye_y-14, cx-30, eye_y-6], fill=c)  # 瞳孔
        d.ellipse([cx+30, eye_y-14, cx+38, eye_y-6], fill=c)
    else:
        d.ellipse([cx-44, eye_y-16, cx-28, eye_y], fill=c)
        d.ellipse([cx+28, eye_y-16, cx+44, eye_y], fill=c)
    
    # 鼻子
    nose_y = cy + 16
    if selected:
        d.ellipse([cx-16, nose_y, cx+16, nose_y+36], fill=WHITE)
    else:
        d.ellipse([cx-14, nose_y, cx+14, nose_y+32], fill=c)
    
    # 嘴巴 (微笑弧线)
    mouth_y = cy + 56
    if selected:
        d.arc([cx-40, mouth_y-8, cx+40, mouth_y+56], start=200, end=340, fill=WHITE, width=w)
    else:
        d.arc([cx-36, mouth_y-6, cx+36, mouth_y+48], start=200, end=340, fill=c, width=w)
    
    # 小心心 (仅选中态)
    if selected:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 52)
            d.text((cx+60, cy-100), "♥", fill=(255, 90, 90), font=font)
        except:
            d.text((cx+60, cy-100), "♥", fill=(255, 90, 90))
    
    return img

# ── 家长 ────────────────────────────────
def draw_parent(selected):
    img = new_canvas()
    d = ImageDraw.Draw(img)
    c = ORANGE if selected else GRAY
    w = W2 if selected else W
    cx = SIZE // 2
    lx0, ly0 = PAD+24, PAD+72
    lx1, ly1 = SIZE-PAD-24, SIZE-PAD
    r = 40
    
    if selected:
        d.rounded_rectangle([lx0,ly0,lx1,ly1], radius=r, fill=c)
        d.arc([cx-48, ly0-72, cx+48, ly0+40], start=180, end=0, fill=WHITE, width=w)
        d.ellipse([cx-20, ly0+48, cx+20, ly0+88], fill=WHITE)
    else:
        d.rounded_rectangle([lx0,ly0,lx1,ly1], radius=r, outline=c, width=w)
        d.arc([cx-48, ly0-72, cx+48, ly0+40], start=180, end=0, fill=c, width=w)
        d.ellipse([cx-18, ly0+48, cx+18, ly0+86], outline=c, width=w)
    
    return img

# ── 生成全部 ────────────────────────────
print("生成预览大图...")
save(draw_tasks(False), "preview-tasks.png")
save(draw_tasks(True),  "preview-tasks-active.png")
save(draw_pet(False), "preview-pet.png")
save(draw_pet(True),  "preview-pet-active.png")
save(draw_parent(False), "preview-parent.png")
save(draw_parent(True),  "preview-parent-active.png")

# ── 生成一张对比总览图 ───────────────────
GRID_W = 3
GRID_H = 2
CELL = SIZE + 40
TOTAL_W = GRID_W * CELL + 80
TOTAL_H = GRID_H * CELL + 120
grid = Image.new("RGB", (TOTAL_W, TOTAL_H), (250, 248, 245))
dg = ImageDraw.Draw(grid)

labels = [
    ("做什么 · 未选中", draw_tasks(False)),
    ("做什么 · 选中",  draw_tasks(True)),
    ("宠物 · 未选中",   draw_pet(False)),
    ("宠物 · 选中",    draw_pet(True)),
    ("家长 · 未选中",   draw_parent(False)),
    ("家长 · 选中",    draw_parent(True)),
]

try:
    label_font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 28)
except:
    label_font = ImageFont.load_default()

for idx, (label, icon_img) in enumerate(labels):
    col = idx % GRID_W
    row = idx // GRID_W
    x = 40 + col * CELL + 10
    y = 60 + row * CELL
    grid.paste(icon_img, (x, y))
    dg.text((x, y - 36), label, fill=(100, 80, 50), font=label_font)

grid_path = os.path.join(PREVIEW_DIR, "tabbar-icons-preview-all.png")
grid.save(grid_path, "PNG")
print(f"  ✓ 总览图: {grid_path}")

print("\n✅ 全部预览图生成完毕！")
