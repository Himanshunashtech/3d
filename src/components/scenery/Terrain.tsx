import * as THREE from "three";
import { useMemo } from "react";
import { getRiverInfo, getScenicRoadX } from "./riverPath";

export const WATER_LEVEL = -3.0;

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < 5; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return sum / norm;
}

export function getTerrainHeight(wx: number, wz: number): number {
  // 1. Natural rolling baseline
  let h = fbm(wx * 0.026 + 15, wz * 0.026 - 8) * 3.6 - 1.2;

  // 2. Rolling lush green mountain ridges (Satpura & Vindhya mountain ranges matching 2nd image)
  const bgMountainT = THREE.MathUtils.smoothstep(-wz, 10, 110);
  const westRidgeT = THREE.MathUtils.smoothstep(-wx, 25, 120);
  const eastRidgeT = THREE.MathUtils.smoothstep(wx, 30, 130);
  const mountainZone = Math.max(bgMountainT, Math.max(westRidgeT * 0.85, eastRidgeT * 0.85));

  if (mountainZone > 0.01) {
    // Harmonic rolling mounds and rounded domes (matching the second image)
    const rollingDomes = (Math.sin(wx * 0.028 + 1.5) * Math.cos(wz * 0.028 - 0.7) + 0.4) * 18.0;
    const ridgeCrests = fbm(wx * 0.018 + 5.0, wz * 0.018 - 8.0) * 32.0;
    const foothills = (fbm(wx * 0.045 - 2.0, wz * 0.045 + 3.0) - 0.25) * 14.0;
    const knolls = Math.abs(fbm(wx * 0.08, wz * 0.08) - 0.5) * 6.5;

    const mountainElevation = (rollingDomes + ridgeCrests + foothills + knolls) * mountainZone;
    h += mountainElevation;
  }

  // 3. Wide Narmada River Channel carving (smooth, natural slope into river valley)
  const river = getRiverInfo(wx, wz);
  const halfW = river.halfWidth;
  const dist = river.dist;

  const bedDepth = river.waterHeight - 2.2;
  // Natural gentle 38m slope transition into river channel
  const channelT = 1 - THREE.MathUtils.smoothstep(dist, halfW - 4.0, halfW + 36.0);
  h = THREE.MathUtils.lerp(h, bedDepth, channelT);

  // 4. Sadhu Bet Island Promontory in the middle of the river (centered at X = -6)
  const islandDist = Math.hypot(wx - (-6), wz);
  const islandT = 1 - THREE.MathUtils.smoothstep(islandDist, 12, 24);
  if (islandT > 0.01) {
    h = THREE.MathUtils.lerp(h, -1.2, islandT);
  }

  // 5. Mainland Visitor Port, Viewing Plaza & Right-Side Parking Concourse (world wx: 80 to 195, wz: -85 to 75)
  if (wx > 80 && wx < 195 && wz > -85 && wz < 75) {
    const portXBlend = THREE.MathUtils.smoothstep(wx, 85, 104) * (1 - THREE.MathUtils.smoothstep(wx, 185, 195));
    const portZBlend = 1 - THREE.MathUtils.smoothstep(Math.abs(wz - (-5)), 55, 76);
    const portFactor = portXBlend * portZBlend;
    if (portFactor > 0.01) {
      // Slopes smoothly from plaza & parking level (-1.2) down to riverbed (-4.2) on the boat jetty side
      const riverSlope = THREE.MathUtils.smoothstep(wz, 20, 52);
      const targetH = THREE.MathUtils.lerp(-1.2, bedDepth, riverSlope);
      h = THREE.MathUtils.lerp(h, targetH, portFactor);
    }
  }

  // 6. Scenic Riverside Highway shelf grading (conforming along the eastern riverbank contour)
  if (wz > -480 && wz < 480) {
    const roadX = getScenicRoadX(wz);
    const roadDist = Math.abs(wx - roadX);
    if (roadDist < 14.0) {
      let targetH = -1.2;
      if (wz < -50) {
        const t = Math.min(1, Math.max(0, (-wz - 50) / 400));
        targetH = -1.2 + Math.sin(t * Math.PI) * 1.8;
      } else if (wz > 50) {
        const t = Math.min(1, Math.max(0, (wz - 50) / 400));
        targetH = -1.2 + Math.sin(t * Math.PI) * 2.4;
      }
      const roadT = 1 - THREE.MathUtils.smoothstep(roadDist, 4.5, 13.0);
      h = THREE.MathUtils.lerp(h, targetH, roadT * 0.92);
    }
  }

  // 6b. Metal River Bridge Shore Approach & Abutment Grounding
  if (Math.abs(wz - (-340)) < 42) {
    const bridgeZDist = Math.abs(wz - (-340));
    // West Bank Mountain Approach Shore (X: -400 to -220)
    if (wx < -220 && wx > -400) {
      const westSlope = THREE.MathUtils.smoothstep(-wx, 220, 380);
      const groundH = THREE.MathUtils.lerp(-0.8, 3.8, westSlope);
      const zBlend = 1 - THREE.MathUtils.smoothstep(bridgeZDist, 4, 38);
      h = THREE.MathUtils.lerp(h, groundH, zBlend * 0.88);
    }
    // East Bank Highway Junction Shore (X: -80 to 40)
    if (wx > -85 && wx < 40) {
      const eastH = -0.5;
      const zBlend = 1 - THREE.MathUtils.smoothstep(bridgeZDist, 4, 35);
      h = THREE.MathUtils.lerp(h, eastH, zBlend * 0.85);
    }
  }

  // 7. Sardar Sarovar Dam Gorge & Upstream Reservoir Carving (shifted further right at X = -25, Z = 335)
  // Dam canyon floor & spillway channel (Z between 305 and 360, X between -115 and 65)
  if (wx > -115 && wx < 65 && wz > 305 && wz < 360) {
    const canyonXBlend = 1 - THREE.MathUtils.smoothstep(Math.abs(wx - (-25)), 52, 85);
    const canyonZBlend = 1 - THREE.MathUtils.smoothstep(Math.abs(wz - 332), 0, 28);
    const canyonFactor = canyonXBlend * canyonZBlend;
    if (canyonFactor > 0.01) {
      h = THREE.MathUtils.lerp(h, -1.4, canyonFactor * 0.95);
    }
  }

  // Upstream Reservoir Basin behind the Dam (wz > 335, wx between -120 and 70)
  if (wz > 335 && wx > -120 && wx < 70) {
    const resXBlend = 1 - THREE.MathUtils.smoothstep(Math.abs(wx - (-25)), 50, 82);
    const resZBlend = THREE.MathUtils.smoothstep(wz, 335, 365);
    const resFactor = resXBlend * resZBlend;
    if (resFactor > 0.01) {
      h = THREE.MathUtils.lerp(h, 18.0, resFactor * 0.92);
    }
  }

  // Exact pedestal foundation leveling
  const padT = 1 - THREE.MathUtils.smoothstep(islandDist, 0, 14);
  h = THREE.MathUtils.lerp(h, -1.2, padT);

  return h;
}

/**
 * Topography matching the Narmada River Valley (Statue of Unity, Kevadia):
 * 1. Rolling lush green mountain ridges (Satpura/Vindhya range) behind the statue.
 * 2. Sadhu Bet rocky island situated proudly in the middle of the wide river.
 * 3. Expansive deep blue river water surrounding the island.
 * 4. Right mainland embankment meeting the second half of the approach bridge.
 * 5. Upstream shoals and green riverbank terraces extending beyond the metal bridge.
 */
export function Terrain() {
  const geometry = useMemo(() => {
    const size = 900;
    const seg = 190;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    const pos = geo.attributes["position"] as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);

    const deepForestGreen = new THREE.Color("#184c20");
    const lushJungleGreen = new THREE.Color("#26732d");
    const emeraldSlopeGreen = new THREE.Color("#3ba045");
    const brightCanopyGreen = new THREE.Color("#56b44a");
    const sunlitRidgeGreen = new THREE.Color("#7bc64e");
    const mossyRockGreen = new THREE.Color("#496638");
    const weatheredRock = new THREE.Color("#5a4d3f");
    const riverBedWet = new THREE.Color("#221b15");
    const riverbedShoal = new THREE.Color("#736352");
    const embankmentSand = new THREE.Color("#827463");

    const tempCol = new THREE.Color();
    const tempMountain = new THREE.Color();
    const tempBase = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const wx = vx;
      const wz = -vy;

      const h = getTerrainHeight(wx, wz);
      pos.setZ(i, h);

      const river = getRiverInfo(wx, wz);
      const dist = river.dist;
      const halfW = river.halfWidth;
      const islandDist = Math.hypot(wx - (-6), wz);

      const mountainGreenFactor = THREE.MathUtils.smoothstep(-wz, 10, 80);
      const sideMountainFactor = Math.max(
        THREE.MathUtils.smoothstep(-wx, 25, 80),
        THREE.MathUtils.smoothstep(wx, 40, 95),
      );
      const greenDominance = Math.max(mountainGreenFactor, sideMountainFactor * 0.9);

      if (h < -1.8) {
        // Deep underwater / riverbed
        tempCol.copy(weatheredRock).lerp(riverbedShoal, THREE.MathUtils.clamp((h + 3.8) / 2.0, 0, 1));
      } else {
        const vegNoise = fbm(wx * 0.07 + 3, wz * 0.07 - 4);
        const detailNoise = fbm(wx * 0.22, wz * 0.22);
        const moundHighlight = (Math.sin(wx * 0.03 + 1.2) * Math.cos(wz * 0.03 - 0.8) + 1.0) * 0.5;

        // Mountain greenery layers
        if (h < 4) {
          tempMountain.copy(deepForestGreen).lerp(lushJungleGreen, vegNoise);
        } else if (h < 15) {
          const tH = (h - 4) / 11;
          tempMountain.copy(lushJungleGreen).lerp(emeraldSlopeGreen, tH);
          tempMountain.lerp(brightCanopyGreen, detailNoise * 0.45);
        } else if (h < 30) {
          const tH = (h - 15) / 15;
          tempMountain.copy(emeraldSlopeGreen).lerp(sunlitRidgeGreen, tH);
          tempMountain.lerp(brightCanopyGreen, moundHighlight * 0.4);
        } else {
          const tH = THREE.MathUtils.clamp((h - 30) / 20, 0, 1);
          tempMountain.copy(sunlitRidgeGreen).lerp(mossyRockGreen, tH * 0.35);
          tempMountain.lerp(brightCanopyGreen, detailNoise * 0.35);
        }

        // Base ground color near island & river
        tempBase.copy(weatheredRock).lerp(mossyRockGreen, vegNoise * 0.5);
        if (h > 4) {
          tempBase.lerp(weatheredRock, THREE.MathUtils.clamp((h - 4) / 12, 0, 0.6));
        }

        tempCol.copy(tempBase).lerp(tempMountain, THREE.MathUtils.clamp(greenDominance * 1.4, 0, 1));

        if (wz < -10) {
          const bgLushT = THREE.MathUtils.smoothstep(-wz, 10, 45);
          tempCol.lerp(tempMountain, bgLushT * 0.98);
        }
      }

      // Riverbed wet gravel and bank blending
      if (dist < halfW + 8.0) {
        if (dist < halfW) {
          const bedBlend = THREE.MathUtils.clamp(dist / halfW, 0, 1);
          tempCol.copy(riverBedWet).lerp(weatheredRock, bedBlend);
        } else {
          const bankBlend = THREE.MathUtils.clamp((dist - halfW) / 8.0, 0, 1);
          tempCol.copy(weatheredRock).lerp(tempCol, bankBlend);
        }
      }

      // Upstream rocky riverbed shoals coloring
      if (wz < -15 && wx < -5 && dist < halfW + 16) {
        const shoalColBlend = THREE.MathUtils.smoothstep(-wz, 15, 55);
        tempCol.lerp(riverbedShoal, shoalColBlend * 0.65);
      }

      // Downstream dam side wide riverbed shoals and sandbars coloring
      if (wz > 120 && dist < halfW + 35.0) {
        const damShoalBlend = THREE.MathUtils.smoothstep(wz, 120, 320);
        tempCol.lerp(riverbedShoal, damShoalBlend * 0.75);
      }

      // Right side embankment sand/shale tone
      if (wx > 38 && Math.abs(wz) < 40) {
        const bankTone = THREE.MathUtils.smoothstep(wx, 38, 90);
        tempCol.lerp(embankmentSand, bankTone * 0.5);
      }

      // Sadhu Bet island rocky retaining base
      if (islandDist < 15) {
        const islandRockBlend = 1 - THREE.MathUtils.smoothstep(islandDist, 8, 15);
        tempCol.lerp(weatheredRock, islandRockBlend * 0.85);
      }

      colors[i * 3] = tempCol.r;
      colors[i * 3 + 1] = tempCol.g;
      colors[i * 3 + 2] = tempCol.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} position-y={-1.2} receiveShadow castShadow>
      <meshStandardMaterial vertexColors roughness={0.88} metalness={0.03} flatShading />
    </mesh>
  );
}
