import { useMemo, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { isNearRiver, getScenicRoadX, getBridgeRiverCrossing } from "./riverPath";
import { getTerrainHeight } from "./Terrain";

function pseudoRandom(seed: number) {
  const n = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// Curated natural forest foliage palettes
const PINE_COLORS = ["#173c1b", "#1c4722", "#24552a", "#143619", "#204d26", "#2a5f31", "#1e4d25"];
const CANOPY_COLORS = ["#265c28", "#316f32", "#3e823f", "#4b9449", "#2b632c", "#56a350", "#40873a"];
const SHRUB_COLORS = ["#2e5c2b", "#3d6e36", "#4c7f42", "#5c914e", "#376332", "#6ba355", "#487e3d"];

interface TreeInstance {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotY: number;
  color: THREE.Color;
}

const bridgeCrossing = getBridgeRiverCrossing(-340);

export function Trees() {
  // 1. Generate dense forest distribution behind the statue, along mountain ridges and up to the bridge
  const { pines, canopies, shrubs } = useMemo(() => {
    const pineList: TreeInstance[] = [];
    const canopyList: TreeInstance[] = [];
    const shrubList: TreeInstance[] = [];

    let seed = 100;

    // Helper to evaluate valid mountain tree placement
    const tryPlace = (x: number, z: number, minElevation = -0.5): { valid: boolean; y: number } => {
      // Avoid statue island pedestal core (centered at X = -6)
      if (Math.hypot(x - (-6), z) < 17) return { valid: false, y: 0 };

      // Avoid approach bridge, mainland port, parking lot & riverside highway
      if (x > 0 && Math.abs(z - 2.5) < 6.5) return { valid: false, y: 0 };
      if (x > 24 && z < -4 && z > -22) return { valid: false, y: 0 };
      if (x > 95 && x < 165 && z > -75 && z < 68) return { valid: false, y: 0 };

      // Avoid second bridge corridor
      if (x > 5 && x < 105 && z < -10 && z > -48) {
        const u = Math.max(0, Math.min(1, ((x - 8) * 90 + (z - (-15)) * (-27)) / (90 * 90 + 27 * 27)));
        const bx = 8 + u * 90;
        const bz = -15 + u * (-27);
        if (Math.hypot(x - bx, z - bz) < 6.0) return { valid: false, y: 0 };
      }

      // Avoid Scenic Highway corridor along eastern bank (Z: -430 to +360)
      if (z > -430 && z < 360) {
        const roadX = getScenicRoadX(z);
        if (Math.abs(x - roadX) < 7.5) return { valid: false, y: 0 };
      }

      // Avoid overlapping the STATUE OF UNITY mountain sign (western mountain side of statue)
      if (x > -118 && x < -92 && z > -12 && z < 52) return { valid: false, y: 0 };

      // Avoid metal river bridge corridor (span between westBank and eastBank)
      const wb = bridgeCrossing.westBank;
      const eb = bridgeCrossing.eastBank;
      const dxB = eb.x - wb.x;
      const dzB = eb.z - wb.z;
      const lenB2 = Math.max(1, dxB * dxB + dzB * dzB);
      const uBridge = Math.max(0, Math.min(1, ((x - wb.x) * dxB + (z - wb.z) * dzB) / lenB2));
      const bridgePx = wb.x + uBridge * dxB;
      const bridgePz = wb.z + uBridge * dzB;
      if (Math.hypot(x - bridgePx, z - bridgePz) < 8.0) return { valid: false, y: 0 };

      // Avoid deep water channel
      if (isNearRiver(x, z, 3.8)) return { valid: false, y: 0 };

      const surfaceH = getTerrainHeight(x, z);
      const y = surfaceH - 1.2;

      // Don't place underwater
      if (y < minElevation) return { valid: false, y };

      return { valid: true, y };
    };

    // Pre-instantiated color pools to prevent thousands of new Color() allocations
    const pineColorPool = PINE_COLORS.map((c) => new THREE.Color(c));
    const canopyColorPool = CANOPY_COLORS.map((c) => new THREE.Color(c));
    const shrubColorPool = SHRUB_COLORS.map((c) => new THREE.Color(c));

    const addTree = (x: number, y: number, z: number, s: number, r: number, typePick: number) => {
      if (typePick < 0.5) {
        const col = pineColorPool[Math.floor(pseudoRandom(seed * 5.7) * pineColorPool.length)] ?? pineColorPool[0]!;
        pineList.push({ x, y, z, scale: s * 1.15, rotY: r, color: col });
      } else if (typePick < 0.82) {
        const col = canopyColorPool[Math.floor(pseudoRandom(seed * 6.9) * canopyColorPool.length)] ?? canopyColorPool[0]!;
        canopyList.push({ x, y, z, scale: s * 1.1, rotY: r, color: col });
      } else {
        const col = shrubColorPool[Math.floor(pseudoRandom(seed * 8.1) * shrubColorPool.length)] ?? shrubColorPool[0]!;
        shrubList.push({ x, y, z, scale: s * 1.3, rotY: r, color: col });
      }
    };

    // A. Dense mountain background forest behind the statue spanning all the way up to and past the bridge (wz: -10 to -430)
    const NUM_BACKGROUND_TREES = 2400;
    for (let i = 0; i < NUM_BACKGROUND_TREES; i++) {
      seed++;
      const x = (pseudoRandom(seed * 1.3) - 0.5) * 440;
      seed++;
      const z = -10 - Math.pow(pseudoRandom(seed * 1.7), 0.76) * 420;

      const { valid, y } = tryPlace(x, z, -0.6);
      if (!valid) continue;

      seed++;
      const s = 0.8 + pseudoRandom(seed * 2.1) * 1.4;
      seed++;
      const r = pseudoRandom(seed * 3.3) * Math.PI * 2;
      seed++;
      const typePick = pseudoRandom(seed * 4.5);
      addTree(x, y, z, s, r, typePick);
    }

    // B. Western Mountain Ranges (along western bank, covering mountain slopes up to bridge)
    const NUM_WEST_BANK_TREES = 1400;
    for (let i = 0; i < NUM_WEST_BANK_TREES; i++) {
      seed++;
      const x = -35 - pseudoRandom(seed * 2.3) * 260;
      seed++;
      const z = (pseudoRandom(seed * 3.7) - 0.45) * 860;

      const { valid, y } = tryPlace(x, z, -0.6);
      if (!valid) continue;

      seed++;
      const s = 0.75 + pseudoRandom(seed * 4.2) * 1.35;
      seed++;
      const r = pseudoRandom(seed * 5.4) * Math.PI * 2;
      seed++;
      const typePick = pseudoRandom(seed * 6.6);
      addTree(x, y, z, s, r, typePick);
    }

    // C. Eastern mainland slopes and riverside green terraces (extended north past the bridge)
    const NUM_EAST_FLANK_TREES = 1100;
    for (let i = 0; i < NUM_EAST_FLANK_TREES; i++) {
      seed++;
      const x = 30 + pseudoRandom(seed * 2.2) * 220;
      seed++;
      const z = (pseudoRandom(seed * 3.1) - 0.45) * 820;

      const { valid, y } = tryPlace(x, z, -0.6);
      if (!valid) continue;

      seed++;
      const s = 0.75 + pseudoRandom(seed * 4.1) * 1.25;
      seed++;
      const r = pseudoRandom(seed * 5.1) * Math.PI * 2;
      seed++;
      const typePick = pseudoRandom(seed * 6.2);
      addTree(x, y, z, s, r, typePick);
    }

    // D. Dedicated Bridge Riverbanks & Mountain Pass Greenery Grove (z: -280 to -430)
    const NUM_BRIDGE_GROVE_TREES = 600;
    for (let i = 0; i < NUM_BRIDGE_GROVE_TREES; i++) {
      seed++;
      // Distribute across western mountain shore and eastern highway slopes around bridge
      const isWest = pseudoRandom(seed * 1.8) < 0.6;
      seed++;
      const x = isWest
        ? -200 - pseudoRandom(seed * 2.7) * 180
        : -65 + pseudoRandom(seed * 2.9) * 210;
      seed++;
      const z = -280 - pseudoRandom(seed * 3.4) * 145;

      const { valid, y } = tryPlace(x, z, -0.6);
      if (!valid) continue;

      seed++;
      const s = 0.85 + pseudoRandom(seed * 4.6) * 1.4;
      seed++;
      const r = pseudoRandom(seed * 5.8) * Math.PI * 2;
      seed++;
      const typePick = pseudoRandom(seed * 6.7);
      addTree(x, y, z, s, r, typePick);
    }

    return { pines: pineList, canopies: canopyList, shrubs: shrubList };
  }, []);

  return (
    <group>
      {/* 1. Dense Conifer / Pine Forest on Mountains */}
      <InstancedPineTrees data={pines} />

      {/* 2. Lush Broadleaf Valley Canopy Trees */}
      <InstancedCanopyTrees data={canopies} />

      {/* 3. Mountain Hillside Greenery & Shrub Clusters */}
      <InstancedShrubClusters data={shrubs} />
    </group>
  );
}

// -------------------------------------------------------------
// Instanced Pine Trees (Trunk + 3-tiered Evergreen Foliage Cones)
// -------------------------------------------------------------
function InstancedPineTrees({ data }: { data: TreeInstance[] }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const foliage1Ref = useRef<THREE.InstancedMesh>(null);
  const foliage2Ref = useRef<THREE.InstancedMesh>(null);
  const foliage3Ref = useRef<THREE.InstancedMesh>(null);

  const count = data.length;

  useLayoutEffect(() => {
    if (!trunkRef.current || !foliage1Ref.current || !foliage2Ref.current || !foliage3Ref.current) return;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const item = data[i];
      if (!item) continue;

      // Trunk matrix
      dummy.position.set(item.x, item.y + 0.6 * item.scale, item.z);
      dummy.rotation.set(0, item.rotY, 0);
      dummy.scale.set(item.scale, item.scale, item.scale);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);

      // Bottom Foliage Tier
      dummy.position.set(item.x, item.y + 1.8 * item.scale, item.z);
      dummy.scale.set(item.scale * 1.5, item.scale * 1.4, item.scale * 1.5);
      dummy.updateMatrix();
      foliage1Ref.current.setMatrixAt(i, dummy.matrix);
      foliage1Ref.current.setColorAt(i, item.color);

      // Middle Foliage Tier
      dummy.position.set(item.x, item.y + 2.8 * item.scale, item.z);
      dummy.scale.set(item.scale * 1.2, item.scale * 1.3, item.scale * 1.2);
      dummy.updateMatrix();
      foliage2Ref.current.setMatrixAt(i, dummy.matrix);
      foliage2Ref.current.setColorAt(i, item.color.clone().multiplyScalar(1.08));

      // Top Foliage Tier
      dummy.position.set(item.x, item.y + 3.7 * item.scale, item.z);
      dummy.scale.set(item.scale * 0.85, item.scale * 1.1, item.scale * 0.85);
      dummy.updateMatrix();
      foliage3Ref.current.setMatrixAt(i, dummy.matrix);
      foliage3Ref.current.setColorAt(i, item.color.clone().multiplyScalar(1.15));
    }

    trunkRef.current.instanceMatrix.needsUpdate = true;
    foliage1Ref.current.instanceMatrix.needsUpdate = true;
    foliage2Ref.current.instanceMatrix.needsUpdate = true;
    foliage3Ref.current.instanceMatrix.needsUpdate = true;

    if (foliage1Ref.current.instanceColor) foliage1Ref.current.instanceColor.needsUpdate = true;
    if (foliage2Ref.current.instanceColor) foliage2Ref.current.instanceColor.needsUpdate = true;
    if (foliage3Ref.current.instanceColor) foliage3Ref.current.instanceColor.needsUpdate = true;
  }, [data, count]);

  if (count === 0) return null;

  return (
    <group>
      {/* Trunks */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.28, 1.4, 5]} />
        <meshStandardMaterial color="#4a3e30" roughness={0.95} flatShading />
      </instancedMesh>

      {/* Foliage Cones */}
      <instancedMesh ref={foliage1Ref} args={[undefined, undefined, count]} castShadow receiveShadow>
        <coneGeometry args={[1.3, 2.0, 6]} />
        <meshStandardMaterial roughness={0.85} flatShading />
      </instancedMesh>

      <instancedMesh ref={foliage2Ref} args={[undefined, undefined, count]} castShadow receiveShadow>
        <coneGeometry args={[1.1, 1.7, 6]} />
        <meshStandardMaterial roughness={0.85} flatShading />
      </instancedMesh>

      <instancedMesh ref={foliage3Ref} args={[undefined, undefined, count]} castShadow receiveShadow>
        <coneGeometry args={[0.85, 1.4, 6]} />
        <meshStandardMaterial roughness={0.85} flatShading />
      </instancedMesh>
    </group>
  );
}

// -------------------------------------------------------------
// Instanced Broadleaf Canopy Trees
// -------------------------------------------------------------
function InstancedCanopyTrees({ data }: { data: TreeInstance[] }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopy1Ref = useRef<THREE.InstancedMesh>(null);
  const canopy2Ref = useRef<THREE.InstancedMesh>(null);

  const count = data.length;

  useLayoutEffect(() => {
    if (!trunkRef.current || !canopy1Ref.current || !canopy2Ref.current) return;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const item = data[i];
      if (!item) continue;

      // Trunk
      dummy.position.set(item.x, item.y + 1.0 * item.scale, item.z);
      dummy.rotation.set(0, item.rotY, 0);
      dummy.scale.set(item.scale, item.scale, item.scale);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);

      // Main Canopy Crown
      dummy.position.set(item.x, item.y + 2.3 * item.scale, item.z);
      dummy.scale.set(item.scale * 1.5, item.scale * 1.3, item.scale * 1.5);
      dummy.updateMatrix();
      canopy1Ref.current.setMatrixAt(i, dummy.matrix);
      canopy1Ref.current.setColorAt(i, item.color);

      // Top Canopy Crest
      dummy.position.set(
        item.x + Math.sin(item.rotY) * 0.4 * item.scale,
        item.y + 3.2 * item.scale,
        item.z + Math.cos(item.rotY) * 0.4 * item.scale,
      );
      dummy.scale.set(item.scale * 1.15, item.scale * 1.0, item.scale * 1.15);
      dummy.updateMatrix();
      canopy2Ref.current.setMatrixAt(i, dummy.matrix);
      canopy2Ref.current.setColorAt(i, item.color.clone().multiplyScalar(1.12));
    }

    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopy1Ref.current.instanceMatrix.needsUpdate = true;
    canopy2Ref.current.instanceMatrix.needsUpdate = true;

    if (canopy1Ref.current.instanceColor) canopy1Ref.current.instanceColor.needsUpdate = true;
    if (canopy2Ref.current.instanceColor) canopy2Ref.current.instanceColor.needsUpdate = true;
  }, [data, count]);

  if (count === 0) return null;

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, 2.2, 5]} />
        <meshStandardMaterial color="#544535" roughness={0.95} flatShading />
      </instancedMesh>

      <instancedMesh ref={canopy1Ref} args={[undefined, undefined, count]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial roughness={0.88} flatShading />
      </instancedMesh>

      <instancedMesh ref={canopy2Ref} args={[undefined, undefined, count]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial roughness={0.88} flatShading />
      </instancedMesh>
    </group>
  );
}

// -------------------------------------------------------------
// Instanced Mountain Shrub & Bush Clusters
// -------------------------------------------------------------
function InstancedShrubClusters({ data }: { data: TreeInstance[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = data.length;

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const item = data[i];
      if (!item) continue;

      dummy.position.set(item.x, item.y + 0.6 * item.scale, item.z);
      dummy.rotation.set(0, item.rotY, 0);
      dummy.scale.set(item.scale * 1.6, item.scale * 0.9, item.scale * 1.6);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, item.color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [data, count]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1.1, 0]} />
      <meshStandardMaterial roughness={0.92} flatShading />
    </instancedMesh>
  );
}
