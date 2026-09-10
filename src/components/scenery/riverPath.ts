import * as THREE from "three";
import { MathUtils } from "three";

// Narmada River flowing broadly through the valley with Sadhu Bet island in the middle
const WAYPOINTS: [number, number, number][] = [
  [-220, -1.8, -490], // Far northern upstream approach
  [-190, -1.9, -420], // Northern mountain gorge upstream of metal bridge
  [-160, -2.0, -350], // Metal River Bridge crossing reach
  [-130, -2.3, -250], // Upstream winding river gorge
  [-90, -2.6, -160],  // Sweeping past the northern mountain ranges
  [-50, -2.8, -80],   // River entering the wide valley behind the statue island
  [-20, -3.0, -36],   // Sweeping past the northwest side of the statue island
  [-8, -3.1, 0],      // Flowing broadly with Sadhu Bet island situated in the middle
  [-14, -3.2, 44],    // Flowing south around the island
  [-42, -3.4, 86],    // Heading through the southwest gorge
  [-78, -3.6, 140],   // Sweeping along the downstream riverbed
  [-115, -3.8, 220],  // Mid riverbed reach
  [-25, -4.0, 335],   // Sardar Sarovar Dam reservoir gorge shifted further right
  [-45, -4.2, 410],   // Downstream valley reach
  [-65, -4.3, 490],   // Far southern terrain boundary reach
];

const curvePoints = WAYPOINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
export const riverCurve = new THREE.CatmullRomCurve3(curvePoints, false, "catmullrom", 0.3);

// Base river width spanning under the entire approach bridge till the bridge end (x = 108)
const BASE_RIVER_WIDTH = 236.0;

export function getRiverWidth(t = 0): number {
  if (t > 0.45) {
    const damSpread = MathUtils.smoothstep(t, 0.45, 0.92);
    return MathUtils.lerp(BASE_RIVER_WIDTH, 280.0, damSpread);
  }
  return BASE_RIVER_WIDTH;
}

const NUM_SEGMENTS = 260;
interface Segment {
  x1: number;
  z1: number;
  y1: number;
  x2: number;
  z2: number;
  y2: number;
  t1: number;
  t2: number;
  dx: number;
  dz: number;
  lenSq: number;
}

const segments: Segment[] = [];
for (let i = 0; i < NUM_SEGMENTS; i++) {
  const t1 = i / NUM_SEGMENTS;
  const t2 = (i + 1) / NUM_SEGMENTS;
  const p1 = riverCurve.getPointAt(t1);
  const p2 = riverCurve.getPointAt(t2);
  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;
  const lenSq = dx * dx + dz * dz;
  segments.push({
    x1: p1.x,
    z1: p1.z,
    y1: p1.y,
    x2: p2.x,
    z2: p2.z,
    y2: p2.y,
    t1,
    t2,
    dx,
    dz,
    lenSq: Math.max(lenSq, 1e-6),
  });
}

// Spatial Z-bucket partition for ultra-fast O(1) river segment lookups
const BUCKET_SIZE = 25.0;
const MIN_Z = -500.0;
const MAX_Z = 500.0;
const NUM_BUCKETS = Math.ceil((MAX_Z - MIN_Z) / BUCKET_SIZE) + 1;
const spatialBuckets: Segment[][] = Array.from({ length: NUM_BUCKETS }, () => []);

for (const s of segments) {
  const minSz = Math.min(s.z1, s.z2) - 15.0;
  const maxSz = Math.max(s.z1, s.z2) + 15.0;
  const startIdx = Math.max(0, Math.floor((minSz - MIN_Z) / BUCKET_SIZE));
  const endIdx = Math.min(NUM_BUCKETS - 1, Math.floor((maxSz - MIN_Z) / BUCKET_SIZE));
  for (let b = startIdx; b <= endIdx; b++) {
    spatialBuckets[b]!.push(s);
  }
}

export interface RiverInfo {
  dist: number;
  waterHeight: number;
  t: number;
  width: number;
  halfWidth: number;
  lateralDist: number;
}

/**
 * Fast and continuous river query for any (x, z) coordinate in world space.
 * Uses spatial Z-bucket partitioning to evaluate only localized candidate segments.
 */
export function getRiverInfo(x: number, z: number): RiverInfo {
  const bucketIdx = Math.max(0, Math.min(NUM_BUCKETS - 1, Math.floor((z - MIN_Z) / BUCKET_SIZE)));
  const candidates = spatialBuckets[bucketIdx] ?? segments;

  let minDistSq = Infinity;
  let bestY = -3.0;
  let bestT = 0.5;

  const len = candidates.length;
  for (let i = 0; i < len; i++) {
    const s = candidates[i]!;
    const px = x - s.x1;
    const pz = z - s.z1;
    const u = Math.max(0, Math.min(1, (px * s.dx + pz * s.dz) / s.lenSq));
    const cx = s.x1 + u * s.dx;
    const cz = s.z1 + u * s.dz;
    const dSq = (x - cx) * (x - cx) + (z - cz) * (z - cz);

    if (dSq < minDistSq) {
      minDistSq = dSq;
      bestY = s.y1 + u * (s.y2 - s.y1);
      bestT = s.t1 + u * (s.t2 - s.t1);
    }
  }

  const dist = Math.sqrt(minDistSq);
  const width = getRiverWidth(bestT);
  const halfWidth = width * 0.5;

  return {
    dist,
    waterHeight: bestY,
    t: bestT,
    width,
    halfWidth,
    lateralDist: dist - halfWidth,
  };
}

/**
 * Returns true if the coordinate is inside the river channel or on the immediate banks.
 */
export function isNearRiver(x: number, z: number, margin = 4.0): boolean {
  const info = getRiverInfo(x, z);
  return info.dist < info.halfWidth + margin;
}

/**
 * Calculates the exact X position of the scenic highway along the eastern riverbank.
 * Hugs the natural contour between the mountain base and water's edge, connecting seamlessly
 * into the Metal River Bridge at Z = -374 and Mainland Visitor Port & Parking Concourse at Z = 0.
 */
export function getScenicRoadX(z: number): number {
  let cx = -8;
  let hw = 118;
  let found = false;

  for (const s of segments) {
    if ((s.z1 <= z && z <= s.z2) || (s.z2 <= z && z <= s.z1)) {
      const u = Math.max(0, Math.min(1, (z - s.z1) / (s.z2 - s.z1 || 1e-6)));
      cx = s.x1 + u * (s.x2 - s.x1);
      const t = s.t1 + u * (s.t2 - s.t1);
      hw = getRiverWidth(t) * 0.5;
      found = true;
      break;
    }
  }

  // Smooth extrapolation if outside segment bounds
  if (!found && segments.length > 0) {
    const first = segments[0]!;
    const last = segments[segments.length - 1]!;
    if (z < first.z1) {
      const u = (z - first.z1) / (first.z2 - first.z1 || 1e-6);
      cx = first.x1 + u * (first.x2 - first.x1);
      hw = getRiverWidth(0) * 0.5;
    } else {
      const u = (z - last.z1) / (last.z2 - last.z1 || 1e-6);
      cx = last.x1 + u * (last.x2 - last.x1);
      hw = getRiverWidth(1) * 0.5;
    }
  }

  // Base east riverbank shelf is at cx + hw + setback
  let roadX = cx + hw + 11.5;

  // Near the Mainland Visitor Port (Z between -65 and +65), smoothly wrap behind the plaza
  // to align and connect with the visitor parking lot entrance (x ~ 138)
  if (Math.abs(z) < 65) {
    const portBlend = 1 - MathUtils.smoothstep(Math.abs(z), 0, 65);
    roadX = MathUtils.lerp(roadX, 138.0, portBlend * 0.96);
  }

  return roadX;
}

/**
 * Returns the exact 2D point and forward tangent of the scenic riverside highway at Z.
 */
export function getScenicRoadPoint(z: number): { x: number; z: number; dx: number; dz: number } {
  const x = getScenicRoadX(z);
  const dzSample = 1.0;
  const nextX = getScenicRoadX(z + dzSample);
  const prevX = getScenicRoadX(z - dzSample);
  const dx = (nextX - prevX) * 0.5;
  const len = Math.hypot(dx, dzSample);

  return { x, z, dx: dx / len, dz: dzSample / len };
}

export interface RiverCrossingInfo {
  center: THREE.Vector3;
  westBank: THREE.Vector3;
  eastBank: THREE.Vector3;
  riverWidth: number;
  spanAngle: number;
}

/**
 * Returns the exact river crossing parameters at a target Z:
 * center point, west river bank, east river bank, exact river width, and span angle.
 */
export function getBridgeRiverCrossing(targetZ = -340): RiverCrossingInfo {
  let bestT = 0.01;
  let minDiff = Infinity;
  for (let i = 0; i <= 300; i++) {
    const t = i / 300;
    const p = riverCurve.getPointAt(t);
    const diff = Math.abs(p.z - targetZ);
    if (diff < minDiff) {
      minDiff = diff;
      bestT = t;
    }
  }

  const centerPoint = riverCurve.getPointAt(bestT);
  const tangent = riverCurve.getTangentAt(bestT);

  // Normal vector across river pointing towards East Bank (positive X direction)
  let nx = tangent.z;
  let nz = -tangent.x;
  const nLen = Math.hypot(nx, nz) || 1;
  nx /= nLen;
  nz /= nLen;
  if (nx < 0) {
    nx = -nx;
    nz = -nz;
  }

  const riverWidth = getRiverWidth(bestT);
  const halfW = riverWidth * 0.5;

  // West Bank (Negative X side / western mountain shore)
  const westBank = new THREE.Vector3(
    centerPoint.x - nx * halfW,
    centerPoint.y,
    centerPoint.z - nz * halfW
  );

  // East Bank (Positive X side / eastern mainland shore)
  const eastBank = new THREE.Vector3(
    centerPoint.x + nx * halfW,
    centerPoint.y,
    centerPoint.z + nz * halfW
  );

  const spanAngle = Math.atan2(nz, nx);

  return {
    center: centerPoint,
    westBank,
    eastBank,
    riverWidth,
    spanAngle,
  };
}
