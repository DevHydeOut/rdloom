// The land outline the Globe and DottedMap rasterise into dots at runtime, so no map file is ever downloaded or shipped
// as an image. The outline itself (utils/world-land.ts) is Natural Earth 1:110m land, which is in the public domain,
// simplified by scripts/build-world-outline.mjs.
import { WORLD_LAND, type Ring } from "./world-land";

function inside(ring: Ring, lng: number, lat: number): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** A polygon is its outer ring minus any holes (inland seas such as the Caspian). */
function onLand(polygon: ReadonlyArray<Ring>, lng: number, lat: number): boolean {
  if (!inside(polygon[0]!, lng, lat)) return false;
  for (let h = 1; h < polygon.length; h++) if (inside(polygon[h]!, lng, lat)) return false;
  return true;
}

const CELL = 1.5; // degrees per mask cell
const COLS = Math.round(360 / CELL);
const ROWS = Math.round(180 / CELL);
let mask: Uint8Array | null = null;

function buildMask(): Uint8Array {
  const out = new Uint8Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) {
    const lat = 90 - (r + 0.5) * CELL;
    for (let c = 0; c < COLS; c++) {
      const lng = -180 + (c + 0.5) * CELL;
      if (WORLD_LAND.some((polygon) => onLand(polygon, lng, lat))) out[r * COLS + c] = 1;
    }
  }
  return out;
}

/** True when the point (degrees) falls on the simplified land. Built once, on first use. */
export function isLand(lat: number, lng: number): boolean {
  mask ??= buildMask();
  const c = Math.min(COLS - 1, Math.max(0, Math.floor((((lng + 180) % 360) + 360) % 360 / CELL)));
  const r = Math.min(ROWS - 1, Math.max(0, Math.floor((90 - lat) / CELL)));
  return mask[r * COLS + c] === 1;
}

const sphereCache = new Map<number, Float32Array>();

/** Land points spread evenly over a sphere as unit vectors (x, y, z triples; y up). */
export function landSpherePoints(stepDegrees: number): Float32Array {
  const step = Math.max(1, stepDegrees);
  const cached = sphereCache.get(step);
  if (cached) return cached;
  const out: number[] = [];
  for (let lat = -90 + step / 2; lat < 90; lat += step) {
    const ring = Math.max(1, Math.round((360 / step) * Math.cos((lat * Math.PI) / 180)));
    for (let k = 0; k < ring; k++) {
      const lng = -180 + ((k + 0.5) * 360) / ring;
      if (!isLand(lat, lng)) continue;
      const [x, y, z] = unitVector(lat, lng);
      out.push(x, y, z);
    }
  }
  const points = Float32Array.from(out);
  sphereCache.set(step, points);
  return points;
}

/** Longitude 0 faces +z; longitude grows toward +x. */
export function unitVector(lat: number, lng: number): [number, number, number] {
  const la = (lat * Math.PI) / 180;
  const lo = (lng * Math.PI) / 180;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

export const MAP_TOP_LAT = 84;
export const MAP_BOTTOM_LAT = -58;
export const MAP_ASPECT = 360 / (MAP_TOP_LAT - MAP_BOTTOM_LAT);

export interface WorldMarker {
  lat: number;
  lng: number;
  label: string;
}

export interface WorldConnection {
  /** The label of a marker. */
  from: string;
  /** The label of a marker. */
  to: string;
}
