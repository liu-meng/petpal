#!/usr/bin/env python3
"""
生成 PetPal TabBar 图标（6 张 81x81 PNG）
风格：圆润、软萌、扁平插画；未选中暖灰，选中亮橙
"""

import os
import math
from PIL import Image, ImageDraw

OUT = "/Users/liumeng/private/mini_program/petpal/assets/tab-icons"
os.makedirs(OUT, exist_ok=True)

SIZE = 81
PAD  = 16          # 图标内容留白
W    = 4            # 线条宽度（未选中）
W2   = 5            # 线条宽度（选中，稍粗）

# ── 颜色 ──────────────────────────────────────
GRAY   = (181, 166, 140)   # #B5A68C  未选中主色
GRAY2  = (210, 195, 170)   # 未选中浅填充
ORANGE = (255, 140, 66)     # #FF8C42  选中主色
ORANGE_L = (255, 200, 150)  # 选中浅填充
WHITE  = (255, 255, 255)
TRANS  = (0, 0, 0, 0)

# ── 工具函数 ──────────────────────────────────
def new_canvas():
    return Image.new("RGBA", (SIZE, SIZE), TRANS)

def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path, "PNG")
    print(f"  ✓ {path}")

# ───────────────────────────────────────────────
#  Icon 1  & 2  :  任务  (clipboard / checklist)
# ───────────────────────────────────────────────
def draw_tasks(selected: bool):
    img  = new_canvas()
    d    = ImageDraw.Draw(img)
    c    = ORANGE if selected else GRAY
    w    = W2 if selected else W
    # 剪贴板主体 (圆角矩形)
    x0, y0, x1, y1 = PAD, PAD+4, SIZE-PAD, SIZE-PAD
    r = 8
    d.rounded_rectangle([x0,y0,x1,y1], radius=r, outline=c, width=w)
    # 夹子 (顶部小矩形)
    cx = SIZE//2
    d.rounded_rectangle([cx-10, y0-4, cx+10, y0+8], radius=4, fill=c)
    # 对勾 (选中=白色对勾, 未选中=三条横线)
    if selected:
        # 白色对勾
        pts = [(x0+12, y0+24), (cx-4, y0+38), (x1-10, y0+12)]
        for i in range(len(pts)-1):
            d.line([pts[i], pts[i+1]], fill=WHITE, width=w-1)
    else:
        for dy in (14, 26, 38):
            d.line([(x0+14, y0+dy), (x1-14, y0+dy)], fill=c, width=w-1)
    return img

save(draw_tasks(False), "tasks.png")
save(draw_tasks(True),  "tasks-active.png")

# ───────────────────────────────────────────────
#  Icon 3  & 4  :  宠物  (dog face / paw)
# ───────────────────────────────────────────────
def draw_pet(selected: bool):
    img  = new_canvas()
    d    = ImageDraw.Draw(img)
    c    = ORANGE if selected else GRAY
    w    = W2 if selected else W
    cx, cy = SIZE//2, SIZE//2 + 2

    if selected:
        # 选中：实心圆脸 + 耳朵 + 白色五官
        # 左耳
        d.ellipse([cx-26, cy-30, cx-12, cy-10], fill=c)
        # 右耳
        d.ellipse([cx+12, cy-30, cx+26, cy-10], fill=c)
        # 脸
        d.ellipse([cx-22, cy-22, cx+22, cy+22], fill=c)
        # 白色五官
        # 眼睛
        d.ellipse([cx-12, cy-8, cx-6, cy-2], fill=WHITE)
        d.ellipse([cx+6,  cy-8, cx+12, cy-2], fill=WHITE)
        # 鼻子
        d.ellipse([cx-4, cy+4, cx+4, cy+10], fill=WHITE)
        # 嘴巴
        d.arc([cx-8, cy+6, cx+8, cy+18], start=0, end=180, fill=WHITE, width=2)
        # 小心心
        d.text((cx+16, cy-28), "♥", fill=(255,120,120))
    else:
        # 未选中：线条风
        d.ellipse([cx-22, cy-22, cx+22, cy+22], outline=c, width=w)
        d.ellipse([cx-26, cy-30, cx-12, cy-10], outline=c, width=w)
        d.ellipse([cx+12, cy-30, cx+26, cy-10], outline=c, width=w)
        # 眼睛（小圆点）
        d.ellipse([cx-12, cy-8, cx-6, cy-2], fill=c)
        d.ellipse([cx+6,  cy-8, cx+12, cy-2], fill=c)
        # 鼻子
        d.ellipse([cx-4, cy+4, cx+4, cy+10], fill=c)
    return img

save(draw_pet(False), "pet.png")
save(draw_pet(True),  "pet-active.png")

# ───────────────────────────────────────────────
#  Icon 5  & 6  :  家长  (lock / shield)
# ───────────────────────────────────────────────
def draw_parent(selected: bool):
    img  = new_canvas()
    d    = ImageDraw.Draw(img)
    c    = ORANGE if selected else GRAY
    w    = W2 if selected else W
    cx   = SIZE // 2
    # 锁体 (圆角矩形)
    lx0, ly0 = PAD+6, PAD+18
    lx1, ly1 = SIZE-PAD-6, SIZE-PAD
    r = 10
    if selected:
        d.rounded_rectangle([lx0,ly0,lx1,ly1], radius=r, fill=c)
        # 锁环 (白色弧线)
        d.arc([cx-12, ly0-18, cx+12, ly0+10], start=180, end=0, fill=WHITE, width=w-1)
        # 钥匙孔 (白色圆)
        d.ellipse([cx-5, ly0+12, cx+5, ly0+22], fill=WHITE)
    else:
        d.rounded_rectangle([lx0,ly0,lx1,ly1], radius=r, outline=c, width=w)
        # 锁环
        d.arc([cx-12, ly0-18, cx+12, ly0+10], start=180, end=0, fill=c, width=w)
        # 钥匙孔
        d.ellipse([cx-5, ly0+12, cx+5, ly0+22], outline=c, width=w)
        d.ellipse([cx-5, ly0+12, cx+5, ly0+22], fill=TRANS)
    return img

save(draw_parent(False), "parent.png")
save(draw_parent(True),  "parent-active.png")

print("\n✅ 全部图标生成完毕 →", OUT)
