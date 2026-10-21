export type Vec3 = [number, number, number];
export type PiecePose = { position: Vec3; rotation: Vec3; scale: number };
export type CinematicFrame = {
  progress: number;
  phase: number;
  camera: Vec3;
  target: Vec3;
  group: Vec3;
  rotation: Vec3;
  light: number;
  pieces: PiecePose[];
};
export const cinematicStops = [0, 0.14, 0.34, 0.51, 0.72, 0.88, 1] as const;
export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const blend = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
function rotate(v: Vec3, e: Vec3): Vec3 {
  const [x, y, z] = v;
  const [a, b, c] = e;
  const cx = Math.cos(c),
    sx = Math.sin(c),
    by = Math.cos(b),
    bs = Math.sin(b),
    ax = Math.cos(a),
    as = Math.sin(a);
  const x1 = x * cx - y * sx,
    y1 = x * sx + y * cx;
  const x2 = x1 * by + z * bs,
    z2 = -x1 * bs + z * by;
  return [x2, y1 * ax - z2 * as, y1 * as + z2 * ax];
}
/** Pure, reversible choreography. Rendering never determines the scene's state. */
export function getCinematicFrame(
  raw: number,
  segments = 8,
  reduced = false,
): CinematicFrame {
  const p = reduced ? 0.91 : clamp(raw);
  const phase = Math.min(
    5,
    cinematicStops.findIndex((stop, i) => i > 0 && p < stop) - 1,
  );
  const safePhase = phase < 0 ? 5 : phase;
  const explode = smooth((p - 0.12) / 0.25);
  const reconnect = smooth((p - 0.47) / 0.31);
  const settle = smooth((p - 0.78) / 0.13);
  const pieces: PiecePose[] = [];
  for (let layer = 0; layer < 3; layer++)
    for (let i = 0; i < segments; i++) {
      const angle = ((i + 0.5) / segments) * Math.PI * 2;
      const center: Vec3 = [Math.cos(angle) * 1.28, Math.sin(angle) * 1.28, 0];
      const openingRot: Vec3 = [Math.PI / 2, 0, layer * 0.11];
      const opening = rotate(center, openingRot);
      opening[1] += (layer - 1) * 0.68;
      const openRotation: Vec3 = [
        Math.PI / 2 + (layer - 1) * 0.06,
        0,
        layer * 0.11,
      ];
      const exploded: Vec3 = [
        Math.cos(angle + layer * 0.28) * (2.45 + layer * 0.16),
        (layer - 1) * 1.16 + Math.sin(angle * 2 + layer) * 0.4,
        Math.sin(angle + layer * 0.28) * (1.65 + layer * 0.21),
      ];
      const explodedRotation: Vec3 = [
        Math.PI / 2 + Math.cos(angle) * 0.65,
        Math.sin(angle + layer) * 0.65,
        (layer - 1) * 0.3 + Math.sin(angle) * 0.55,
      ];
      const endRotation: Vec3 =
        layer === 0
          ? [0, 0, 0]
          : layer === 1
            ? [0, Math.PI / 2, 0.22]
            : [Math.PI / 2, 0.5, 0];
      const end = rotate(center, endRotation);
      end[0] += (layer - 1) * 0.12;
      const separated = blend(opening, exploded, explode);
      const startRot = blend(openRotation, explodedRotation, explode);
      const final = blend(separated, end, reconnect);
      final[1] += Math.sin(angle + layer) * 0.06 * (1 - settle) * reconnect;
      pieces.push({
        position: final,
        rotation: blend(startRot, endRotation, reconnect),
        scale: lerp(1, 0.97, Math.sin(Math.PI * explode) * (1 - reconnect)),
      });
    }
  const cameraKeys: { p: number; v: Vec3; t: Vec3 }[] = [
    { p: 0, v: [4.6, 2.9, 8.7], t: [0.25, -0.05, 0] },
    { p: 0.14, v: [4.1, 2.5, 8.0], t: [0.15, 0.05, 0] },
    { p: 0.34, v: [3.4, 3.0, 7.7], t: [0, 0.3, 0] },
    { p: 0.51, v: [0.3, 0.6, 5.4], t: [0, 0.2, 0] },
    { p: 0.72, v: [-3.5, 1.6, 7.8], t: [0.1, 0, 0] },
    { p: 0.88, v: [3.3, 2.4, 9.0], t: [0.2, -0.1, 0] },
    { p: 1, v: [3.5, 2.5, 9.2], t: [0.2, -0.1, 0] },
  ];
  let key = 0;
  while (key < cameraKeys.length - 2 && p > cameraKeys[key + 1].p) key++;
  const a = cameraKeys[key],
    b = cameraKeys[key + 1],
    t = smooth((p - a.p) / (b.p - a.p));
  const groupX =
    p < 0.45
      ? lerp(1.0, -1.25, smooth((p - 0.12) / 0.22))
      : lerp(-1.25, 0.8, smooth((p - 0.45) / 0.23));
  return {
    progress: p,
    phase: safePhase,
    camera: blend(a.v, b.v, t),
    target: blend(a.t, b.t, t),
    group: [groupX, lerp(-0.79, -0.06, reconnect), 0],
    rotation: [0, lerp(-0.3, 0.5, smooth(p)), 0],
    light: lerp(1.1, 1.5, smooth((p - 0.55) / 0.35)),
    pieces,
  };
}
export type ScrollSignal = {
  get: () => number;
  set: (value: number) => void;
  subscribe: (callback: (value: number) => void) => () => void;
};
export function createScrollSignal(): ScrollSignal {
  let current = 0;
  const listeners = new Set<(value: number) => void>();
  return {
    get: () => current,
    set(value) {
      current = value;
      listeners.forEach((listener) => listener(value));
    },
    subscribe(callback) {
      listeners.add(callback);
      callback(current);
      return () => {
        listeners.delete(callback);
      };
    },
  };
}
