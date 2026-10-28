"""Generate compact white-background catalog thumbnails without runtime WebGL.

Requires numpy and Pillow. The procedural geometry exporter uses bundled Three.js.
"""
import io
import json
import math
from pathlib import Path
import struct
import subprocess

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
DEST = ROOT / 'assets' / 'chido' / 'thumbs'
DEST.mkdir(parents=True, exist_ok=True)
GLBS = {
    22: 'sofaA1.glb', 23: 'SofaC1.glb', 24: 'sofab1.glb',
    25: 'desks2.glb', 26: 'desks1.glb', 27: 'minidesk1.glb',
    28: 'lamp1.glb', 29: 'Lamp2.glb', 30: 'decor1.glb', 31: 'rug.glb',
}
TYPES = {5120: np.int8, 5121: np.uint8, 5122: np.int16,
         5123: np.uint16, 5125: np.uint32, 5126: np.float32}
WIDTHS = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def read_glb(path):
    content = path.read_bytes()
    offset, data, binary = 12, None, None
    while offset < len(content):
        length, kind = struct.unpack_from('<I4s', content, offset)
        offset += 8
        chunk = content[offset:offset + length]
        if kind == b'JSON':
            data = json.loads(chunk)
        elif kind == b'BIN\0':
            binary = chunk
        offset += length

    def accessor(index):
        item = data['accessors'][index]
        view = data['bufferViews'][item['bufferView']]
        dtype = np.dtype(TYPES[item['componentType']]).newbyteorder('<')
        cols = WIDTHS[item['type']]
        stride = view.get('byteStride', dtype.itemsize * cols)
        base = view.get('byteOffset', 0) + item.get('byteOffset', 0)
        return np.ndarray((item['count'], cols), dtype=dtype, buffer=binary,
                          offset=base, strides=(stride, dtype.itemsize)).copy()

    def material_color(index):
        material = data.get('materials', [{}])[index or 0]
        pbr = material.get('pbrMetallicRoughness', {})
        color = np.asarray(pbr.get('baseColorFactor', [1, 1, 1, 1])[:3], dtype=float)
        texture_ref = pbr.get('baseColorTexture')
        if texture_ref is not None:
            texture = data['textures'][texture_ref['index']]
            image = data['images'][texture['source']]
            if 'bufferView' in image:
                view = data['bufferViews'][image['bufferView']]
                start = view.get('byteOffset', 0)
                raw = binary[start:start + view['byteLength']]
                try:
                    im = Image.open(io.BytesIO(raw)).convert('RGB').resize((32, 32))
                    color *= np.asarray(im, dtype=float).mean(axis=(0, 1)) / 255
                except OSError:
                    pass
        return tuple(np.clip(color * 255, 0, 255).astype(np.uint8))

    def node_matrix(node):
        if 'matrix' in node:
            return np.asarray(node['matrix'], dtype=float).reshape((4, 4), order='F')
        t = node.get('translation', [0, 0, 0])
        s = node.get('scale', [1, 1, 1])
        x, y, z, w = node.get('rotation', [0, 0, 0, 1])
        rotation = np.array([
            [1 - 2 * (y*y+z*z), 2 * (x*y-z*w), 2 * (x*z+y*w)],
            [2 * (x*y+z*w), 1 - 2 * (x*x+z*z), 2 * (y*z-x*w)],
            [2 * (x*z-y*w), 2 * (y*z+x*w), 1 - 2 * (x*x+y*y)],
        ])
        matrix = np.eye(4)
        matrix[:3, :3] = rotation @ np.diag(s)
        matrix[:3, 3] = t
        return matrix

    pieces = []

    def descend(index, parent):
        node = data['nodes'][index]
        world = parent @ node_matrix(node)
        if 'mesh' in node:
            for primitive in data['meshes'][node['mesh']]['primitives']:
                if primitive.get('mode', 4) != 4:
                    continue
                verts = accessor(primitive['attributes']['POSITION']).astype(float)
                v4 = np.column_stack((verts, np.ones(len(verts))))
                verts = (v4 @ world.T)[:, :3]
                indices = accessor(primitive['indices']).reshape(-1, 3).astype(np.int32) if 'indices' in primitive else np.arange(len(verts)).reshape(-1, 3)
                pieces.append((verts, indices, material_color(primitive.get('material', 0))))
        for child in node.get('children', []):
            descend(child, world)

    scene = data['scenes'][data.get('scene', 0)]
    for root in scene.get('nodes', []):
        descend(root, np.eye(4))
    return pieces


def render(index, pieces):
    vertices, faces, colors = [], [], []
    for points, triangles, base in pieces:
        if len(points) == 0 or len(triangles) == 0:
            continue
        offset = sum(len(p) for p in vertices)
        vertices.append(np.asarray(points, dtype=float))
        faces.append(np.asarray(triangles, dtype=np.int32) + offset)
        colors.append(np.tile(np.asarray(base[:3], dtype=np.float32), (len(triangles), 1)))
    if not vertices:
        return
    v = np.concatenate(vertices)
    f = np.concatenate(faces)
    c = np.concatenate(colors)
    if index == 22:
        c[:] = (28, 47, 77)  # Navy default textile.
    if index == 29:
        c = np.maximum(c, 115)
    v -= (v.max(axis=0) + v.min(axis=0)) / 2
    if index in (22, 23, 24, 25, 27, 30):
        # Same quarter-turn used for these imported models in the app.
        v = v[:, [2, 1, 0]] * np.array([1, 1, -1])

    toward = np.array([-1.25, .92, -1.5] if index in (22, 23, 24) else [1.25, .92, 1.5], dtype=float)
    toward /= np.linalg.norm(toward)
    right = np.cross([0, 1, 0], toward)
    right /= np.linalg.norm(right)
    upward = np.cross(toward, right)
    projected = np.column_stack((v @ right, v @ upward))
    lo, hi = projected.min(axis=0), projected.max(axis=0)
    scale = 340 / max(*(hi - lo), .01)
    xy = (projected - (lo + hi) / 2) * scale
    xy[:, 0] += 220
    xy[:, 1] = 220 - xy[:, 1]

    centers = v[f].mean(axis=1)
    order = np.argsort(centers @ toward)
    normals = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
    norms = np.linalg.norm(normals, axis=1)
    normals /= np.maximum(norms[:, None], 1e-8)
    light = np.array([-.35, .85, .4])
    light /= np.linalg.norm(light)
    brightness = .68 + .32 * np.maximum(0, normals @ light)
    shades = np.clip(c * brightness[:, None], 0, 255).astype(np.uint8)
    image = Image.new('RGB', (440, 440), 'white')
    painter = ImageDraw.Draw(image)
    for face_id in order:
        points = xy[f[face_id]]
        if not np.isfinite(points).all():
            continue
        painter.polygon([tuple(p) for p in points], fill=tuple(int(x) for x in shades[face_id]))
    image = image.resize((192, 192), Image.Resampling.LANCZOS)
    image.save(DEST / f'{index}.jpg', 'JPEG', quality=78, optimize=True)


def main():
    exported = subprocess.run(['node', str(ROOT / 'thumbnail-geometry.mjs')],
                              cwd=ROOT, check=True, capture_output=True, text=True)
    procedural = json.loads(exported.stdout)
    for i in range(32):
        if i < 22:
            parts = procedural[str(i)]
            pieces = [(np.asarray(p['positions']).reshape(-1, 3),
                       np.asarray(p['indices']).reshape(-1, 3),
                       tuple(bytes.fromhex(p['color'][1:]))) for p in parts]
        else:
            pieces = read_glb(ROOT / 'assets' / 'chido' / GLBS[i])
        render(i, pieces)
        print(i, (DEST / f'{i}.jpg').stat().st_size, flush=True)


if __name__ == '__main__':
    main()
