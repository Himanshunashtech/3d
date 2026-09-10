import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { getTerrainHeight } from "./Terrain";
import { getScenicRoadPoint, getBridgeRiverCrossing } from "./riverPath";

interface MainlandRoadAndParkingProps {
  isNight?: boolean;
  isLightShow?: boolean;
}

/**
 * Generates continuous 3D ribbon geometry for the asphalt highway that dynamically conforms to the terrain height
 */
function createRiverbankRoadGeometry(startZ = -460, endZ = 450, numSegments = 540, roadWidth = 8.8) {
  const geo = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const step = (endZ - startZ) / numSegments;
  const halfW = roadWidth * 0.5;

  for (let i = 0; i <= numSegments; i++) {
    const z = startZ + i * step;
    const pt = getScenicRoadPoint(z);

    const nx = -pt.dz;
    const nz = pt.dx;

    // Outer river-facing shoulder
    const lx = pt.x + nx * halfW;
    const lz = pt.z + nz * halfW;
    const ly = getTerrainHeight(lx, lz) + 0.08;

    // Center-left lane
    const clx = pt.x + nx * (halfW * 0.48);
    const clz = pt.z + nz * (halfW * 0.48);
    const cly = getTerrainHeight(clx, clz) + 0.08;

    // Center-right lane
    const crx = pt.x - nx * (halfW * 0.48);
    const crz = pt.z - nz * (halfW * 0.48);
    const cry = getTerrainHeight(crx, crz) + 0.08;

    // Inner mountain-facing shoulder
    const rx = pt.x - nx * halfW;
    const rz = pt.z - nz * halfW;
    const ry = getTerrainHeight(rx, rz) + 0.08;

    positions.push(lx, ly, lz);
    uvs.push(0, i * 0.5);

    positions.push(clx, cly, clz);
    uvs.push(0.25, i * 0.5);

    positions.push(crx, cry, crz);
    uvs.push(0.75, i * 0.5);

    positions.push(rx, ry, rz);
    uvs.push(1.0, i * 0.5);

    if (i < numSegments) {
      const row = i * 4;
      indices.push(row, row + 4, row + 1);
      indices.push(row + 1, row + 4, row + 5);
      indices.push(row + 1, row + 5, row + 2);
      indices.push(row + 2, row + 5, row + 6);
      indices.push(row + 2, row + 6, row + 3);
      indices.push(row + 3, row + 6, row + 7);
    }
  }

  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  return geo;
}

const crossingData = getBridgeRiverCrossing(-340);

function createWesternMountainRoadGeometry(numSegments = 80, roadWidth = 8.4) {
  const geo = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const halfW = roadWidth * 0.5;

  const pts: THREE.Vector3[] = [
    new THREE.Vector3(crossingData.westBank.x, 2.4, crossingData.westBank.z),
    new THREE.Vector3(crossingData.westBank.x - 35, 2.3, crossingData.westBank.z - 12),
    new THREE.Vector3(crossingData.westBank.x - 75, 2.1, crossingData.westBank.z - 28),
    new THREE.Vector3(crossingData.westBank.x - 120, 2.0, crossingData.westBank.z - 50),
    new THREE.Vector3(crossingData.westBank.x - 160, 1.8, crossingData.westBank.z - 80),
    new THREE.Vector3(crossingData.westBank.x - 195, 1.6, crossingData.westBank.z - 120),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);

  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const nx = -tangent.z;
    const nz = tangent.x;
    const nLen = Math.hypot(nx, nz) || 1;
    const unx = nx / nLen;
    const unz = nz / nLen;

    const lx = p.x + unx * halfW;
    const lz = p.z + unz * halfW;
    const ly = Math.max(p.y, getTerrainHeight(lx, lz) + 0.08);

    const rx = p.x - unx * halfW;
    const rz = p.z - unz * halfW;
    const ry = Math.max(p.y, getTerrainHeight(rx, rz) + 0.08);

    positions.push(lx, ly, lz);
    uvs.push(0, i * 0.5);
    positions.push(rx, ry, rz);
    uvs.push(1, i * 0.5);

    if (i < numSegments) {
      const row = i * 2;
      indices.push(row, row + 2, row + 1);
      indices.push(row + 1, row + 2, row + 3);
    }
  }

  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export interface VehicleState {
  x: number;
  y: number;
  z: number;
  angle: number;
}

const _busState: VehicleState = { x: 0, y: 0, z: 0, angle: 0 };
const _carState: VehicleState = { x: 0, y: 0, z: 0, angle: 0 };

/**
 * Calculates the exact world position and orientation of the tourist shuttle bus.
 * Originates from the western mountain pass, drives across the Metal River Bridge,
 * cruises south along the highway, turns into the parking bus terminal with a 4s stop,
 * then continues south towards the dam.
 */
function getShuttleBusTrajectory(t: number): VehicleState {
  const CYCLE_PERIOD = 56.0;
  const tau = ((t % CYCLE_PERIOD) + CYCLE_PERIOD) % CYCLE_PERIOD;

  let x = 0;
  let z = 0;
  let y = 0;
  let angle = 0;

  // Phase 1: Originates from Western Mountain Pass & Drives Eastbound across Metal River Bridge (t: 0 -> 12s)
  if (tau < 12.0) {
    const frac = tau / 12.0;
    x = THREE.MathUtils.lerp(crossingData.westBank.x - 40, crossingData.eastBank.x, frac);
    z = THREE.MathUtils.lerp(crossingData.westBank.z, crossingData.eastBank.z, frac) + 1.8;
    y = 2.4;
    angle = -crossingData.spanAngle;
  }
  // Phase 2: Curves smoothly off the bridge junction onto Southbound Scenic Highway (t: 12 -> 15s)
  else if (tau < 15.0) {
    const frac = (tau - 12.0) / 3.0;
    const targetZ = crossingData.eastBank.z + frac * 45.0;
    const pt = getScenicRoadPoint(targetZ);
    x = THREE.MathUtils.lerp(crossingData.eastBank.x, pt.x - (-pt.dz) * 2.1, frac);
    z = THREE.MathUtils.lerp(crossingData.eastBank.z + 1.8, pt.z - pt.dx * 2.1, frac);
    const roadAngle = Math.atan2(pt.dx, pt.dz);
    angle = THREE.MathUtils.lerp(-crossingData.spanAngle, roadAngle, frac);
    const groundY = getTerrainHeight(x, z) + 0.1;
    y = THREE.MathUtils.lerp(2.4, groundY, frac);
  }
  // Phase 3: Highway Cruise Southbound to Visitor Port (t: 15 -> 28s)
  else if (tau < 28.0) {
    const frac = (tau - 15.0) / 13.0;
    const startZ = crossingData.eastBank.z + 45.0;
    z = startZ + frac * (-65.0 - startZ);
    const pt = getScenicRoadPoint(z);
    x = pt.x - (-pt.dz) * 2.1;
    z = pt.z - pt.dx * 2.1;
    angle = Math.atan2(pt.dx, pt.dz);
    y = getTerrainHeight(x, z) + 0.1;
  }
  // Phase 4: Decelerate & Turn into Parking Lot Bus Bay (t: 28 -> 32s, z: -65 -> -42, x -> 150)
  else if (tau < 32.0) {
    const frac = (tau - 28.0) / 4.0;
    const smoothT = THREE.MathUtils.smoothstep(frac, 0, 1);
    const roadPt = getScenicRoadPoint(-65 + frac * 23);
    const roadX = roadPt.x - (-roadPt.dz) * 2.1;
    const busBayX = 150.0;
    x = THREE.MathUtils.lerp(roadX, busBayX, smoothT);
    z = -65 + frac * 23;
    angle = THREE.MathUtils.lerp(Math.atan2(roadPt.dx, roadPt.dz), 0.05, smoothT);
    y = getTerrainHeight(x, z) + 0.1;
  }
  // Phase 5: DWELL / STOPPED IN PARKING BUS BAY for 4.0 seconds (t: 32 -> 36s)
  else if (tau < 36.0) {
    x = 150.0;
    z = -42.0;
    angle = 0.05;
    y = getTerrainHeight(x, z) + 0.1;
  }
  // Phase 6: Accelerate & Exit Parking Lot back to Highway (t: 36 -> 40s, z: -42 -> -15)
  else if (tau < 40.0) {
    const frac = (tau - 36.0) / 4.0;
    const smoothT = THREE.MathUtils.smoothstep(frac, 0, 1);
    const busBayX = 150.0;
    const targetZ = -42 + frac * 27;
    const roadPt = getScenicRoadPoint(targetZ);
    const roadX = roadPt.x - (-roadPt.dz) * 2.1;
    x = THREE.MathUtils.lerp(busBayX, roadX, smoothT);
    z = targetZ;
    angle = THREE.MathUtils.lerp(0.05, Math.atan2(roadPt.dx, roadPt.dz), smoothT);
    y = getTerrainHeight(x, z) + 0.1;
  }
  // Phase 7: Resume Highway Cruise South to Dam Boundary (t: 40 -> 56s, z: -15 -> 300)
  else {
    const frac = (tau - 40.0) / 16.0;
    z = -15 + frac * 315;
    const pt = getScenicRoadPoint(z);
    x = pt.x - (-pt.dz) * 2.1;
    z = pt.z - pt.dx * 2.1;
    angle = Math.atan2(pt.dx, pt.dz);
    y = getTerrainHeight(x, z) + 0.1;
  }

  _busState.x = x;
  _busState.y = y;
  _busState.z = z;
  _busState.angle = angle;
  return _busState;
}

/**
 * Calculates the exact world position and orientation of passenger car traffic (Northbound).
 * Zero per-frame memory allocation for silky smooth 60+ FPS rendering.
 */
function getCarTrafficTrajectory(t: number): VehicleState {
  const CYCLE_PERIOD = 56.0;
  const tau = (((t + 28.0) % CYCLE_PERIOD) + CYCLE_PERIOD) % CYCLE_PERIOD;

  let x = 0;
  let z = 0;
  let y = 0;
  let angle = 0;

  // Phase 1: Highway Approach Northbound from Dam (t: 0 -> 14s, z: 290 -> -20)
  if (tau < 14.0) {
    const frac = tau / 14.0;
    z = 290 - frac * 310;
    const pt = getScenicRoadPoint(z);
    x = pt.x + (-pt.dz) * 2.1;
    z = pt.z + pt.dx * 2.1;
    angle = Math.atan2(-pt.dx, -pt.dz);
    y = getTerrainHeight(x, z) + 0.1;
  }
  // Phase 2: Decelerate & Turn into Parking Car Drop-off Stall (t: 14 -> 17.5s, z: -20 -> -42)
  else if (tau < 17.5) {
    const frac = (tau - 14.0) / 3.5;
    const smoothT = THREE.MathUtils.smoothstep(frac, 0, 1);
    const targetZ = -20 - frac * 22;
    const roadPt = getScenicRoadPoint(targetZ);
    const roadX = roadPt.x + (-roadPt.dz) * 2.1;
    const carBayX = 136.0;
    x = THREE.MathUtils.lerp(roadX, carBayX, smoothT);
    z = targetZ;
    angle = THREE.MathUtils.lerp(Math.atan2(-roadPt.dx, -roadPt.dz), Math.PI, smoothT);
    y = getTerrainHeight(x, z) + 0.1;
  }
  // Phase 3: DWELL / STOPPED IN PARKING STALL for 3.0 seconds (t: 17.5 -> 20.5s)
  else if (tau < 20.5) {
    x = 136.0;
    z = -42.0;
    angle = Math.PI;
    y = getTerrainHeight(x, z) + 0.1;
  }
  // Phase 4: Accelerate & Exit Parking Lot back to Northbound Highway (t: 20.5 -> 24s, z: -42 -> -65)
  else if (tau < 24.0) {
    const frac = (tau - 20.5) / 3.5;
    const smoothT = THREE.MathUtils.smoothstep(frac, 0, 1);
    const carBayX = 136.0;
    const targetZ = -42 - frac * 23;
    const roadPt = getScenicRoadPoint(targetZ);
    const roadX = roadPt.x + (-roadPt.dz) * 2.1;
    x = THREE.MathUtils.lerp(carBayX, roadX, smoothT);
    z = targetZ;
    angle = THREE.MathUtils.lerp(Math.PI, Math.atan2(-roadPt.dx, -roadPt.dz), smoothT);
    y = getTerrainHeight(x, z) + 0.1;
  }
  // Phase 5: Highway Cruise Northbound to Bridge Junction (t: 24 -> 36s, z: -65 -> -340)
  else if (tau < 36.0) {
    const frac = (tau - 24.0) / 12.0;
    z = -65 - frac * (Math.abs(crossingData.eastBank.z) - 65);
    const pt = getScenicRoadPoint(z);
    x = pt.x + (-pt.dz) * 2.1;
    z = pt.z + pt.dx * 2.1;
    angle = Math.atan2(-pt.dx, -pt.dz);
    const groundY = getTerrainHeight(x, z) + 0.1;
    const bridgeApproachT = THREE.MathUtils.smoothstep(frac, 0.85, 1.0);
    y = THREE.MathUtils.lerp(groundY, 2.4, bridgeApproachT);
  }
  // Phase 6: DRIVING ACROSS THE METAL RIVER BRIDGE (t: 36 -> 48s)
  else if (tau < 48.0) {
    const bridgeFrac = (tau - 36.0) / 12.0;
    x = THREE.MathUtils.lerp(crossingData.eastBank.x, crossingData.westBank.x, bridgeFrac);
    z = THREE.MathUtils.lerp(crossingData.eastBank.z, crossingData.westBank.z, bridgeFrac) - 1.8;
    y = 2.4;
    angle = Math.PI - crossingData.spanAngle;
  }
  // Phase 7: Driving off Bridge into Western Mountain Highway (t: 48 -> 56s)
  else {
    const exitFrac = (tau - 48.0) / 8.0;
    x = crossingData.westBank.x - exitFrac * 40.0;
    z = crossingData.westBank.z - 1.8;
    y = 2.4;
    angle = Math.PI - crossingData.spanAngle;
  }

  _carState.x = x;
  _carState.y = y;
  _carState.z = z;
  _carState.angle = angle;
  return _carState;
}

/**
 * Scenic Riverside Highway conforming perfectly to the terrain slopes,
 * connected directly with the Mainland Visitor Port & Parking Complex.
 */
export function MainlandRoadAndParking({ isNight = false, isLightShow = false }: MainlandRoadAndParkingProps) {
  const shuttleBusRef = useRef<THREE.Group>(null);
  const carTrafficRef = useRef<THREE.Group>(null);

  const materials = useMemo(() => {
    return {
      asphaltRoad: new THREE.MeshStandardMaterial({
        color: "#2d333d",
        roughness: 0.88,
        metalness: 0.05,
      }),
      asphaltParking: new THREE.MeshStandardMaterial({
        color: "#262c36",
        roughness: 0.9,
      }),
      concreteCurb: new THREE.MeshStandardMaterial({
        color: "#8a94a0",
        roughness: 0.82,
      }),
      roadMarkingYellow: new THREE.MeshStandardMaterial({
        color: "#f59e0b",
        roughness: 0.4,
      }),
      roadMarkingWhite: new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.4,
      }),
      handicapBlue: new THREE.MeshStandardMaterial({
        color: "#0284c7",
        roughness: 0.4,
      }),
      steelGuardrail: new THREE.MeshStandardMaterial({
        color: "#94a3b8",
        roughness: 0.35,
        metalness: 0.75,
      }),
      whiteSteelMast: new THREE.MeshStandardMaterial({
        color: "#f1f5f9",
        roughness: 0.3,
        metalness: 0.45,
      }),
      greenSignboard: new THREE.MeshStandardMaterial({
        color: "#047857",
        roughness: 0.3,
      }),
      canopyRoof: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.3,
        side: THREE.DoubleSide,
      }),
      glassDark: new THREE.MeshStandardMaterial({
        color: "#0369a1",
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.82,
      }),
      lawnGrass: new THREE.MeshStandardMaterial({
        color: "#2d7a3e",
        roughness: 0.92,
      }),
      palmTrunk: new THREE.MeshStandardMaterial({
        color: "#4a3b32",
        roughness: 0.95,
      }),
      palmFrond: new THREE.MeshStandardMaterial({
        color: "#1e5e31",
        roughness: 0.85,
        flatShading: true,
      }),
      lampGlow: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#fff7db"),
        emissiveIntensity: 0.4,
        roughness: 0.1,
      }),
      busGreen: new THREE.MeshStandardMaterial({
        color: "#059669",
        roughness: 0.3,
        metalness: 0.2,
      }),
      busWhite: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.3,
        metalness: 0.1,
      }),
      carRed: new THREE.MeshStandardMaterial({
        color: "#dc2626",
        roughness: 0.35,
        metalness: 0.4,
      }),
      carSilver: new THREE.MeshStandardMaterial({
        color: "#94a3b8",
        roughness: 0.3,
        metalness: 0.7,
      }),
      carBlue: new THREE.MeshStandardMaterial({
        color: "#1d4ed8",
        roughness: 0.35,
        metalness: 0.45,
      }),
      carWhite: new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.3,
        metalness: 0.15,
      }),
      tireBlack: new THREE.MeshStandardMaterial({
        color: "#111827",
        roughness: 0.9,
      }),
    };
  }, []);

  useEffect(() => {
    materials.asphaltRoad.color.set(isNight ? "#1c2027" : "#2d333d");
    materials.asphaltParking.color.set(isNight ? "#181d24" : "#262c36");
    materials.concreteCurb.color.set(isNight ? "#47515c" : "#8a94a0");
    materials.roadMarkingYellow.color.set(isNight ? "#d97706" : "#f59e0b");
    materials.roadMarkingWhite.color.set(isNight ? "#cbd5e1" : "#f8fafc");
    materials.greenSignboard.color.set(isNight ? "#064e3b" : "#047857");
    materials.canopyRoof.color.set(isNight ? "#cbd5e1" : "#ffffff");
    materials.glassDark.color.set(isNight ? "#0284c7" : "#0369a1");
    materials.lawnGrass.color.set(isNight ? "#14381e" : "#2d7a3e");
    materials.palmTrunk.color.set(isNight ? "#1e1814" : "#4a3b32");
    materials.palmFrond.color.set(isNight ? "#0f2e1b" : "#1e5e31");
    materials.lampGlow.emissiveIntensity = isNight ? 5.5 : 0.4;
  }, [isNight, materials]);


  const highwayGeo = useMemo(() => createRiverbankRoadGeometry(-460, 450, 540, 8.8), []);
  const westRoadGeo = useMemo(() => createWesternMountainRoadGeometry(80, 8.4), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (shuttleBusRef.current) {
      const bus = getShuttleBusTrajectory(t);
      shuttleBusRef.current.position.set(bus.x, bus.y, bus.z);
      shuttleBusRef.current.rotation.y = bus.angle;
    }

    if (carTrafficRef.current) {
      const car = getCarTrafficTrajectory(t);
      carTrafficRef.current.position.set(car.x, car.y, car.z);
      carTrafficRef.current.rotation.y = car.angle;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================= */}
      {/* 1. SCENIC RIVERSIDE HIGHWAY RIBBON HUGGING THE TERRAIN    */}
      {/* ========================================================= */}
      {/* Continuous Lengthened Riverbank Asphalt Highway */}
      <mesh geometry={highwayGeo} material={materials.asphaltRoad} receiveShadow />

      {/* Western Mountain Scenic Highway (Crossing from West Bridge Abutment deep into western mountain pass) */}
      <mesh geometry={westRoadGeo} material={materials.asphaltRoad} receiveShadow />

      {/* Dashed Yellow Center Divider Lines across entire extended scenic highway */}
      {Array.from({ length: 122 }).map((_, i) => {
        const z = -454 + i * 7.5;
        const pt = getScenicRoadPoint(z);
        const y = getTerrainHeight(pt.x, pt.z) + 0.11;
        const angle = Math.atan2(pt.dx, pt.dz);
        return (
          <mesh
            key={`center-line-${i}`}
            position={[pt.x, y, pt.z]}
            rotation-y={angle}
            material={materials.roadMarkingYellow}
          >
            <boxGeometry args={[0.22, 0.01, 3.8]} />
          </mesh>
        );
      })}

      {/* Highway Guardrails along the entire River-Facing Edge */}
      {Array.from({ length: 73 }).map((_, i) => {
        const z = -452 + i * 12.6;
        const pt = getScenicRoadPoint(z);
        const nx = -pt.dz;
        const nz = pt.dx;
        const gx = pt.x + nx * 4.6;
        const gz = pt.z + nz * 4.6;
        const gy = getTerrainHeight(gx, gz) + 0.08;
        const angle = Math.atan2(pt.dx, pt.dz);
        return (
          <group key={`guardrail-${i}`} position={[gx, gy, gz]} rotation-y={angle}>
            <mesh position={[0, 0.45, 0]} material={materials.steelGuardrail}>
              <boxGeometry args={[0.06, 0.35, 12.8]} />
            </mesh>
            <mesh position={[0, 0.25, 0]} material={materials.steelGuardrail}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
            </mesh>
          </group>
        );
      })}

      {/* Highway Street Lighting Poles along the Mountain Edge */}
      {Array.from({ length: 42 }).map((_, i) => {
        const z = -450 + i * 22.0;
        const pt = getScenicRoadPoint(z);
        const nx = -pt.dz;
        const nz = pt.dx;
        const lx = pt.x - nx * 5.2;
        const lz = pt.z - nz * 5.2;
        const ly = getTerrainHeight(lx, lz) + 0.08;
        const angle = Math.atan2(pt.dx, pt.dz);
        return (
          <group key={`hwy-light-${i}`} position={[lx, ly, lz]} rotation-y={angle}>
            <mesh position={[0, 3.2, 0]} material={materials.whiteSteelMast}>
              <cylinderGeometry args={[0.08, 0.12, 6.4, 8]} />
            </mesh>
            <mesh position={[1.4, 6.2, 0]} rotation-z={0.3} material={materials.whiteSteelMast}>
              <cylinderGeometry args={[0.04, 0.05, 3.0, 6]} />
            </mesh>
            <mesh position={[2.6, 6.6, 0]} material={materials.lampGlow}>
              <sphereGeometry args={[0.26, 8, 8]} />
            </mesh>
          </group>
        );
      })}

      {/* Directional Signboards along the scenic highway */}
      {[-390, -180, -45, 45, 220].map((sz, idx) => {
        const pt = getScenicRoadPoint(sz);
        const nx = -pt.dz;
        const nz = pt.dx;
        const sx = pt.x - nx * 4.8;
        const szPos = pt.z - nz * 4.8;
        const sy = getTerrainHeight(sx, szPos) + 0.08;
        const angle = Math.atan2(pt.dx, pt.dz);
        return (
          <group key={`signboard-${idx}`} position={[sx, sy, szPos]} rotation-y={angle}>
            <mesh position={[0, 2.2, 0]} material={materials.whiteSteelMast}>
              <cylinderGeometry args={[0.06, 0.06, 4.4, 6]} />
            </mesh>
            <mesh position={[0, 3.4, 0]} material={materials.greenSignboard} castShadow>
              <boxGeometry args={[4.2, 1.8, 0.12]} />
            </mesh>
          </group>
        );
      })}

      {/* Western Mountain Pass Guardrails & Highway Lighting */}
      {[
        { x: crossingData.westBank.x - 20, z: crossingData.westBank.z - 6, ang: -0.32 },
        { x: crossingData.westBank.x - 55, z: crossingData.westBank.z - 18, ang: -0.35 },
        { x: crossingData.westBank.x - 95, z: crossingData.westBank.z - 38, ang: -0.42 },
        { x: crossingData.westBank.x - 140, z: crossingData.westBank.z - 64, ang: -0.52 },
        { x: crossingData.westBank.x - 178, z: crossingData.westBank.z - 100, ang: -0.62 },
      ].map((mp, idx) => {
        const gy = getTerrainHeight(mp.x, mp.z) + 0.1;
        return (
          <group key={`west-guard-${idx}`} position={[mp.x, gy, mp.z]} rotation-y={mp.ang}>
            {/* Outer Mountain Edge Guardrail */}
            <mesh position={[0, 0.45, 4.4]} material={materials.steelGuardrail}>
              <boxGeometry args={[0.06, 0.35, 26.0]} />
            </mesh>
            <mesh position={[0, 0.25, 4.4]} material={materials.steelGuardrail}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
            </mesh>
            {/* Inner Mountain Pass Streetlamp */}
            <group position={[0, 0, -4.8]}>
              <mesh position={[0, 3.0, 0]} material={materials.whiteSteelMast}>
                <cylinderGeometry args={[0.08, 0.12, 6.0, 8]} />
              </mesh>
              <mesh position={[-1.2, 5.8, 0]} rotation-z={-0.3} material={materials.whiteSteelMast}>
                <cylinderGeometry args={[0.04, 0.05, 2.8, 6]} />
              </mesh>
              <mesh position={[-2.4, 6.2, 0]} material={materials.lampGlow}>
                <sphereGeometry args={[0.24, 8, 8]} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* ========================================================= */}
      {/* 2. MAINLAND VISITOR PARKING LOT (ON RIGHT OF VISITOR PORT)*/}
      {/*    SITUATED ON THE RIGHT FLANK (Z = -14 to -70, X = 126..158)*/}
      {/* ========================================================= */}
      <group position={[142, -1.2, -42]}>
        {/* Main Paved Asphalt Parking Deck */}
        <mesh position={[0, 0, 0]} material={materials.asphaltParking} receiveShadow>
          <boxGeometry args={[32, 0.6, 58]} />
        </mesh>

        {/* Concrete Perimeter Curbs */}
        <mesh position={[0, 0.38, 29.2]} material={materials.concreteCurb}>
          <boxGeometry args={[32.4, 0.25, 0.4]} />
        </mesh>
        <mesh position={[0, 0.38, -29.2]} material={materials.concreteCurb}>
          <boxGeometry args={[32.4, 0.25, 0.4]} />
        </mesh>
        <mesh position={[-16.2, 0.38, 0]} material={materials.concreteCurb}>
          <boxGeometry args={[0.4, 0.25, 58.4]} />
        </mesh>

        {/* Continuous Multi-Ramp Road Connection Linking Riverside Highway to Parking */}
        {/* Center Main Throat */}
        <mesh position={[14, 0, 0]} material={materials.asphaltRoad} receiveShadow>
          <boxGeometry args={[16, 0.6, 26]} />
        </mesh>
        {/* North Curved Entry Slip Ramp */}
        <mesh position={[12, 0, -22]} rotation-y={0.32} material={materials.asphaltRoad} receiveShadow>
          <boxGeometry args={[14, 0.6, 18]} />
        </mesh>
        {/* South Curved Exit Slip Ramp */}
        <mesh position={[12, 0, 22]} rotation-y={-0.32} material={materials.asphaltRoad} receiveShadow>
          <boxGeometry args={[14, 0.6, 18]} />
        </mesh>

        {/* Directional White Entry & Exit Arrows and Turn Markings on Ramps */}
        <mesh position={[12, 0.32, -22]} rotation-y={0.32} material={materials.roadMarkingWhite}>
          <boxGeometry args={[0.3, 0.02, 4.2]} />
        </mesh>
        <mesh position={[12, 0.32, 22]} rotation-y={-0.32} material={materials.roadMarkingWhite}>
          <boxGeometry args={[0.3, 0.02, 4.2]} />
        </mesh>

        {/* Parking Stall Markings */}
        {Array.from({ length: 9 }).map((_, i) => {
          const pz = -22 + i * 5.5;
          return (
            <group key={`stall-a-${i}`} position={[-6, 0.32, pz]}>
              <mesh position={[0, 0, 0]} material={materials.roadMarkingWhite}>
                <boxGeometry args={[5.8, 0.02, 0.15]} />
              </mesh>
              {i % 3 === 0 && (
                <mesh position={[0, 0, 2.5]} material={materials.handicapBlue}>
                  <boxGeometry args={[1.5, 0.02, 1.5]} />
                </mesh>
              )}
            </group>
          );
        })}

        {Array.from({ length: 9 }).map((_, i) => {
          const pz = -22 + i * 5.5;
          return (
            <group key={`stall-b-${i}`} position={[6, 0.32, pz]}>
              <mesh position={[0, 0, 0]} material={materials.roadMarkingWhite}>
                <boxGeometry args={[5.8, 0.02, 0.15]} />
              </mesh>
            </group>
          );
        })}

        {/* Tour Bus Bays */}
        {[-14, 14].map((bz, idx) => (
          <group key={`bus-bay-${idx}`} position={[10, 0.32, bz]}>
            <mesh position={[0, 0, 0]} material={materials.roadMarkingYellow}>
              <boxGeometry args={[3.8, 0.02, 14.0]} />
            </mesh>
          </group>
        ))}

        {/* Landscaped Parking Medians & Palm Trees */}
        {[-16, 16].map((mz, idx) => (
          <group key={`median-${idx}`} position={[0, 0.35, mz]}>
            <mesh position={[0, 0.15, 0]} material={materials.concreteCurb}>
              <boxGeometry args={[2.8, 0.3, 14.0]} />
            </mesh>
            <mesh position={[0, 0.32, 0]} material={materials.lawnGrass}>
              <boxGeometry args={[2.4, 0.05, 13.6]} />
            </mesh>
            {[-4.0, 4.0].map((pz, pidx) => (
              <group key={`palm-${pidx}`} position={[0, 0.3, pz]}>
                <mesh position={[0, 2.5, 0]} material={materials.palmTrunk} castShadow>
                  <cylinderGeometry args={[0.18, 0.26, 5.0, 8]} />
                </mesh>
                {Array.from({ length: 8 }).map((_, fidx) => (
                  <mesh
                    key={`frond-${fidx}`}
                    position={[0, 5.1, 0]}
                    rotation-y={(fidx / 8) * Math.PI * 2}
                    rotation-z={0.55}
                    material={materials.palmFrond}
                    castShadow
                  >
                    <boxGeometry args={[2.2, 0.08, 0.5]} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        ))}

        {/* Floodlight Masts */}
        {[
          { x: -10, z: -22 },
          { x: -10, z: 22 },
          { x: 10, z: -22 },
          { x: 10, z: 22 },
        ].map((mast, idx) => (
          <group key={`mast-${idx}`} position={[mast.x, 0.35, mast.z]}>
            <mesh position={[0, 4.5, 0]} material={materials.whiteSteelMast}>
              <cylinderGeometry args={[0.1, 0.16, 9.0, 8]} />
            </mesh>
            <mesh position={[0, 9.1, 0]} material={materials.lampGlow}>
              <sphereGeometry args={[0.3, 8, 8]} />
            </mesh>
          </group>
        ))}

        {/* Parked Electric Shuttle Bus */}
        <group position={[10, 0.35, -14]}>
          <mesh position={[0, 1.2, 0]} material={materials.busGreen} castShadow>
            <boxGeometry args={[3.2, 2.1, 12.0]} />
          </mesh>
          <mesh position={[0, 2.3, 0]} material={materials.busWhite}>
            <boxGeometry args={[3.25, 0.25, 12.05]} />
          </mesh>
          <mesh position={[0, 1.45, 0]} material={materials.glassDark}>
            <boxGeometry args={[3.3, 0.85, 11.2]} />
          </mesh>
          {[-1.5, 1.5].map((wx) => (
            <group key={`w-${wx}`} position={[wx, 0.45, 0]}>
              <mesh position={[0, 0, 3.8]} rotation-z={Math.PI / 2} material={materials.tireBlack}>
                <cylinderGeometry args={[0.45, 0.45, 0.35, 12]} />
              </mesh>
              <mesh position={[0, 0, -3.8]} rotation-z={Math.PI / 2} material={materials.tireBlack}>
                <cylinderGeometry args={[0.45, 0.45, 0.35, 12]} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Parked Cars in Stalls */}
        {[
          { x: -6, z: -16.5, mat: materials.carRed },
          { x: -6, z: -5.5, mat: materials.carSilver },
          { x: -6, z: 5.5, mat: materials.carWhite },
          { x: 6, z: -11, mat: materials.carBlue },
          { x: 6, z: 0, mat: materials.carSilver },
          { x: 6, z: 11, mat: materials.carWhite },
        ].map((car, idx) => (
          <group key={`car-${idx}`} position={[car.x, 0.35, car.z]}>
            <mesh position={[0, 0.45, 0]} material={car.mat} castShadow>
              <boxGeometry args={[2.2, 0.8, 4.4]} />
            </mesh>
            <mesh position={[0, 0.95, -0.2]} material={car.mat} castShadow>
              <boxGeometry args={[1.9, 0.65, 2.4]} />
            </mesh>
            <mesh position={[0, 0.95, -0.2]} material={materials.glassDark}>
              <boxGeometry args={[1.95, 0.55, 2.45]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 3. MOVING SHUTTLE BUS & VEHICLE ON RIVERSIDE HIGHWAY      */}
      {/* ========================================================= */}
      <group ref={shuttleBusRef}>
        <mesh position={[0, 1.2, 0]} material={materials.busGreen} castShadow>
          <boxGeometry args={[2.8, 1.9, 9.5]} />
        </mesh>
        <mesh position={[0, 2.2, 0]} material={materials.busWhite}>
          <boxGeometry args={[2.85, 0.22, 9.55]} />
        </mesh>
        <mesh position={[0, 1.4, 0]} material={materials.glassDark}>
          <boxGeometry args={[2.9, 0.75, 8.8]} />
        </mesh>
        <mesh position={[0.9, 0.65, 4.8]} material={materials.lampGlow}>
          <sphereGeometry args={[0.15, 6, 6]} />
        </mesh>
        <mesh position={[-0.9, 0.65, 4.8]} material={materials.lampGlow}>
          <sphereGeometry args={[0.15, 6, 6]} />
        </mesh>
      </group>

      <group ref={carTrafficRef}>
        <mesh position={[0, 0.45, 0]} material={materials.carRed} castShadow>
          <boxGeometry args={[2.0, 0.6, 4.2]} />
        </mesh>
        <mesh position={[0, 0.9, -0.2]} material={materials.carRed} castShadow>
          <boxGeometry args={[1.7, 0.5, 2.3]} />
        </mesh>
        <mesh position={[0, 0.9, -0.2]} material={materials.glassDark}>
          <boxGeometry args={[1.75, 0.4, 2.35]} />
        </mesh>
      </group>
    </group>
  );
}
