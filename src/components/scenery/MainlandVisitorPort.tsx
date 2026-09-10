import * as THREE from "three";
import { useMemo, useEffect } from "react";

interface MainlandVisitorPortProps {
  isNight?: boolean;
  isLightShow?: boolean;
}

/**
 * Creates a parametric curved wave ribbon canopy geometry for the observation port & viewing colonnade
 */
function createWaveCanopyGeometry(length = 32, width = 3.8, segX = 48, segY = 16) {
  const geo = new THREE.PlaneGeometry(length, width, segX, segY);
  const pos = geo.attributes["position"] as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const normX = (x + length * 0.5) / length; // 0 to 1
    // Smooth sinusoidal wave profile matching the architectural ribbon in the photo
    const wave = Math.sin(normX * Math.PI * 3.2) * 0.65;
    pos.setZ(i, wave);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates an arched tensile canopy wing shape for the approach bridge promenade modules
 */
function createTensileWingGeometry(width = 4.0, depth = 2.4) {
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.5, -depth * 0.5);
  shape.quadraticCurveTo(0, -depth * 0.1, width * 0.5, -depth * 0.5);
  shape.quadraticCurveTo(width * 0.45, depth * 0.45, 0, depth * 0.5);
  shape.quadraticCurveTo(-width * 0.45, depth * 0.45, -width * 0.5, -depth * 0.5);

  const extrudeSettings = {
    steps: 1,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  };
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * Mainland Visitor Port, Ferry Dock & Multi-Tier Viewing Plaza Complex
 * - Connected at ONE EDGE by the Approach Bridge at Z = 0
 * - Entire Observation Port & Promenade stretches to the LEFT (Z = 0 to +64)
 * - Parking Concourse is situated on the RIGHT (Z = -14 to -72)
 */
export function MainlandVisitorPort({ isNight = false, isLightShow = false }: MainlandVisitorPortProps) {
  const materials = useMemo(() => {
    return {
      redSandstone: new THREE.MeshStandardMaterial({
        color: "#b44f3d",
        roughness: 0.72,
        metalness: 0.08,
        flatShading: true,
      }),
      redSandstoneDark: new THREE.MeshStandardMaterial({
        color: "#8f3b2d",
        roughness: 0.78,
        metalness: 0.06,
        flatShading: true,
      }),
      redSandstoneTrim: new THREE.MeshStandardMaterial({
        color: "#cf6350",
        roughness: 0.68,
        metalness: 0.1,
      }),
      plazaPaving: new THREE.MeshStandardMaterial({
        color: "#8a7566",
        roughness: 0.85,
        metalness: 0.05,
      }),
      plazaGridInlay: new THREE.MeshStandardMaterial({
        color: "#9e4334",
        roughness: 0.75,
      }),
      whiteSteel: new THREE.MeshStandardMaterial({
        color: "#f1f5f9",
        roughness: 0.3,
        metalness: 0.45,
      }),
      tensileFabric: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.32,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
      concretePier: new THREE.MeshStandardMaterial({
        color: "#7b8492",
        roughness: 0.84,
        metalness: 0.05,
      }),
      yellowSafety: new THREE.MeshStandardMaterial({
        color: "#eab308",
        roughness: 0.35,
      }),
      stainlessRailing: new THREE.MeshStandardMaterial({
        color: "#cbd5e1",
        roughness: 0.25,
        metalness: 0.85,
      }),
      boatHullNavy: new THREE.MeshStandardMaterial({
        color: "#1e3a8a",
        roughness: 0.4,
        metalness: 0.3,
        flatShading: true,
      }),
      boatDeckWhite: new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.5,
        metalness: 0.1,
        flatShading: true,
      }),
      revetmentRiprap: new THREE.MeshStandardMaterial({
        color: "#5a626d",
        roughness: 0.95,
        metalness: 0.02,
        flatShading: true,
      }),
      glassDark: new THREE.MeshStandardMaterial({
        color: "#0369a1",
        emissive: new THREE.Color("#000000"),
        emissiveIntensity: 0,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.85,
      }),
      hedgeGreen: new THREE.MeshStandardMaterial({
        color: "#2d7a3e",
        roughness: 0.92,
        flatShading: true,
      }),
      flowerGold: new THREE.MeshStandardMaterial({
        color: "#eab308",
        roughness: 0.85,
        flatShading: true,
      }),
      treeTrunk: new THREE.MeshStandardMaterial({
        color: "#4a3b32",
        roughness: 0.95,
      }),
      treeFoliage: new THREE.MeshStandardMaterial({
        color: "#246b38",
        roughness: 0.88,
        flatShading: true,
      }),
      lampGlow: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#fff7db"),
        emissiveIntensity: 0.4,
        roughness: 0.1,
      }),
      waveCanopyNeon: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.1,
        roughness: 0.1,
      }),
    };
  }, []);

  useEffect(() => {
    materials.redSandstone.color.set(isNight ? "#782d22" : "#b44f3d");
    materials.redSandstoneDark.color.set(isNight ? "#5c2017" : "#8f3b2d");
    materials.redSandstoneTrim.color.set(isNight ? "#92382b" : "#cf6350");
    materials.plazaPaving.color.set(isNight ? "#382e28" : "#8a7566");
    materials.plazaGridInlay.color.set(isNight ? "#60251c" : "#9e4334");
    materials.tensileFabric.color.set(isNight ? "#cbd5e1" : "#ffffff");
    materials.concretePier.color.set(isNight ? "#3b424d" : "#7b8492");
    materials.boatHullNavy.color.set(isNight ? "#0f172a" : "#1e3a8a");
    materials.boatDeckWhite.color.set(isNight ? "#94a3b8" : "#f8fafc");
    materials.revetmentRiprap.color.set(isNight ? "#2d3238" : "#5a626d");
    materials.glassDark.color.set(isNight ? "#0284c7" : "#0369a1");
    materials.glassDark.emissive.set(isNight ? "#0284c7" : "#000000");
    materials.glassDark.emissiveIntensity = isNight ? 1.5 : 0;
    materials.hedgeGreen.color.set(isNight ? "#14381e" : "#2d7a3e");
    materials.flowerGold.color.set(isNight ? "#b45309" : "#eab308");
    materials.treeTrunk.color.set(isNight ? "#1e1814" : "#4a3b32");
    materials.treeFoliage.color.set(isNight ? "#0f2e1b" : "#246b38");
    materials.lampGlow.emissiveIntensity = isNight ? 5.0 : 0.4;
    materials.waveCanopyNeon.emissive.set(isNight ? (isLightShow ? "#38bdf8" : "#f59e0b") : "#ffffff");
    materials.waveCanopyNeon.emissiveIntensity = isNight ? (isLightShow ? 6.5 : 4.5) : 0.1;
  }, [isNight, isLightShow, materials]);


  const waveCanopyGeo = useMemo(() => createWaveCanopyGeometry(34, 3.8), []);
  const tensileWingGeo = useMemo(() => createTensileWingGeometry(4.2, 2.5), []);

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================= */}
      {/* 1. BRIDGE CANTILEVERED TENSILE FABRIC CANOPY UMBRELLAS   */}
      {/* ========================================================= */}
      <group position={[0, 2.1, 0]}>
        {Array.from({ length: 17 }).map((_, i) => {
          const px = 24 + i * 4.9;
          return (
            <group key={i} position={[px, 0, 0]}>
              {/* North Side Cantilevered Tensile Canopy */}
              <group position={[0, 0, 3.2]}>
                <mesh position={[0, 1.4, 0]} material={materials.whiteSteel} castShadow>
                  <cylinderGeometry args={[0.07, 0.1, 2.8, 8]} />
                </mesh>
                <mesh position={[0, 2.7, -0.6]} rotation-x={-0.45} material={materials.whiteSteel}>
                  <cylinderGeometry args={[0.04, 0.05, 1.6, 6]} />
                </mesh>
                <mesh
                  position={[0, 3.1, -1.0]}
                  rotation-x={Math.PI / 2 + 0.12}
                  geometry={tensileWingGeo}
                  material={materials.tensileFabric}
                  castShadow
                />
                <mesh position={[0, 3.6, 0]} material={materials.whiteSteel}>
                  <cylinderGeometry args={[0.02, 0.04, 0.9, 6]} />
                </mesh>
              </group>

              {/* South Side Cantilevered Tensile Canopy */}
              <group position={[0, 0, -3.2]}>
                <mesh position={[0, 1.4, 0]} material={materials.whiteSteel} castShadow>
                  <cylinderGeometry args={[0.07, 0.1, 2.8, 8]} />
                </mesh>
                <mesh position={[0, 2.7, 0.6]} rotation-x={0.45} material={materials.whiteSteel}>
                  <cylinderGeometry args={[0.04, 0.05, 1.6, 6]} />
                </mesh>
                <mesh
                  position={[0, 3.1, 1.0]}
                  rotation-x={Math.PI / 2 - 0.12}
                  geometry={tensileWingGeo}
                  material={materials.tensileFabric}
                  castShadow
                />
                <mesh position={[0, 3.6, 0]} material={materials.whiteSteel}>
                  <cylinderGeometry args={[0.02, 0.04, 0.9, 6]} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 2. BRIDGEHEAD LANDING PORTAL (AT THE EDGE: Z = 0)        */}
      {/* ========================================================= */}
      <group position={[114, 2.1, 0]}>
        {/* Landing Transition Deck */}
        <mesh position={[0, 0, 0]} material={materials.plazaPaving} receiveShadow>
          <boxGeometry args={[14, 0.7, 12]} />
        </mesh>
        <mesh position={[0, -1.8, 0]} material={materials.redSandstoneDark} receiveShadow>
          <boxGeometry args={[14.2, 3.0, 12.2]} />
        </mesh>

        {/* Grand Arched White Entrance Canopy Gateway */}
        <group position={[5.5, 0, 0]}>
          <mesh position={[0, 4.2, 0]} material={materials.whiteSteel} castShadow>
            <torusGeometry args={[4.8, 0.3, 12, 24, Math.PI]} />
          </mesh>
          <mesh position={[0, 4.2, -0.3]} rotation-x={0.12} material={materials.tensileFabric} castShadow>
            <cylinderGeometry args={[4.6, 4.6, 1.6, 24, 1, true, 0, Math.PI]} />
          </mesh>
          {/* Side Gateway Red Sandstone Pillars */}
          <mesh position={[0, 2.0, 4.6]} material={materials.redSandstone} castShadow>
            <boxGeometry args={[2.8, 4.2, 2.4]} />
          </mesh>
          <mesh position={[0, 2.0, -4.6]} material={materials.redSandstone} castShadow>
            <boxGeometry args={[2.8, 4.2, 2.4]} />
          </mesh>
        </group>
      </group>

      {/* ========================================================= */}
      {/* 3. GRAND OBSERVATION PLAZA EXTENDING TO THE LEFT (Z=4..64)*/}
      {/* ========================================================= */}
      <group position={[125, 2.1, 32]}>
        {/* Main Paved Sandstone Plaza Terrace Slab */}
        <mesh position={[0, 0, 0]} material={materials.plazaPaving} receiveShadow>
          <boxGeometry args={[32, 0.7, 64]} />
        </mesh>
        <mesh position={[0, -1.8, 0]} material={materials.redSandstoneDark} receiveShadow>
          <boxGeometry args={[32.2, 3.0, 64.2]} />
        </mesh>

        {/* Geometric Paving Inlay Grid */}
        {[-24, -12, 0, 12, 24].map((gz) => (
          <mesh key={`gx-${gz}`} position={[0, 0.36, gz]} material={materials.plazaGridInlay} receiveShadow>
            <boxGeometry args={[31.6, 0.02, 0.6]} />
          </mesh>
        ))}
        {[-10, -2, 6, 12].map((gx) => (
          <mesh key={`gz-${gx}`} position={[gx, 0.36, 0]} material={materials.plazaGridInlay} receiveShadow>
            <boxGeometry args={[0.6, 0.02, 63.6]} />
          </mesh>
        ))}

        {/* Perimeter Sandstone Viewing Parapets on Left and End */}
        <mesh position={[0, 0.75, 31.7]} material={materials.redSandstone} castShadow>
          <boxGeometry args={[31.8, 0.8, 0.5]} />
        </mesh>
        <mesh position={[0, 1.18, 31.7]} material={materials.redSandstoneTrim} castShadow>
          <boxGeometry args={[32.0, 0.12, 0.65]} />
        </mesh>

        {/* Riverfront Facing Parapet along the Left Riverbank */}
        <mesh position={[-15.7, 0.75, 0]} material={materials.redSandstone} castShadow>
          <boxGeometry args={[0.5, 0.8, 63.8]} />
        </mesh>
        <mesh position={[-15.7, 1.18, 0]} material={materials.redSandstoneTrim} castShadow>
          <boxGeometry args={[0.65, 0.12, 64.0]} />
        </mesh>

        {/* Planters & Shade Trees along the Plaza Walkway */}
        {[
          { x: -4, z: 16, sx: 12, sz: 4.8 },
          { x: 8, z: 16, sx: 8, sz: 4.8 },
          { x: -4, z: -16, sx: 12, sz: 4.8 },
          { x: 8, z: -16, sx: 8, sz: 4.8 },
        ].map((bed, idx) => (
          <group key={idx} position={[bed.x, 0.36, bed.z]}>
            <mesh position={[0, 0.25, 0]} material={materials.redSandstoneTrim} castShadow>
              <boxGeometry args={[bed.sx, 0.5, bed.sz]} />
            </mesh>
            <mesh position={[0, 0.55, 0]} material={materials.hedgeGreen} castShadow>
              <boxGeometry args={[bed.sx - 0.6, 0.45, bed.sz - 0.6]} />
            </mesh>
            {[-bed.sx * 0.3, bed.sx * 0.3].map((tx, tidx) => (
              <group key={tidx} position={[tx, 0.5, 0]}>
                <mesh position={[0, 1.2, 0]} material={materials.treeTrunk} castShadow>
                  <cylinderGeometry args={[0.12, 0.18, 2.4, 6]} />
                </mesh>
                <mesh position={[0, 2.6, 0]} material={materials.treeFoliage} castShadow>
                  <dodecahedronGeometry args={[1.5, 1]} />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* Plaza Lighting Masts */}
        {[
          { x: -12, z: 24 },
          { x: 6, z: 24 },
          { x: -12, z: -8 },
          { x: 6, z: -8 },
          { x: -14, z: 8 },
        ].map((lamp, idx) => (
          <group key={idx} position={[lamp.x, 0.36, lamp.z]}>
            <mesh position={[0, 2.0, 0]} material={materials.whiteSteel}>
              <cylinderGeometry args={[0.06, 0.1, 4.0, 6]} />
            </mesh>
            <mesh position={[0, 4.1, 0]} material={materials.lampGlow}>
              <sphereGeometry args={[0.22, 8, 8]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 4. WAVE RIBBON CANOPY COLONNADE ON LEFT OVERLOOK          */}
      {/* ========================================================= */}
      <group position={[114, 2.4, 32]}>
        {/* Colonnade Pillars Supporting the Wave Canopy */}
        {[-14, -8, -2, 4, 10, 16].map((pz) => (
          <group key={pz} position={[-0.5, 0, pz]}>
            <mesh position={[0, 1.6, 0]} material={materials.whiteSteel} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 3.2, 8]} />
            </mesh>
            <mesh position={[0, 3.25, 0]} material={materials.redSandstoneTrim}>
              <boxGeometry args={[0.45, 0.12, 0.45]} />
            </mesh>
          </group>
        ))}

        {/* Undulating White Wave Ribbon Canopy Roof */}
        <mesh
          position={[-0.5, 3.65, 0]}
          rotation-y={Math.PI / 2}
          rotation-x={Math.PI / 2}
          geometry={waveCanopyGeo}
          material={materials.tensileFabric}
          castShadow
        />
        {/* Wave Canopy Neon Ribbon Contour (Night Mode) */}
        {isNight && (
          <mesh
            position={[-0.5, 3.68, 0]}
            rotation-y={Math.PI / 2}
            rotation-x={Math.PI / 2}
            geometry={waveCanopyGeo}
            material={materials.waveCanopyNeon}
          />
        )}

        {/* Panoramic Observation Telescopes */}
        {[-12, -4, 4, 12].map((bx) => (
          <group key={bx} position={[-1.2, 0.3, bx]}>
            <mesh position={[0, 0.6, 0]} material={materials.stainlessRailing}>
              <cylinderGeometry args={[0.04, 0.06, 1.2, 6]} />
            </mesh>
            <mesh position={[0, 1.25, -0.1]} rotation-x={-0.2} material={materials.whiteSteel}>
              <boxGeometry args={[0.2, 0.15, 0.4]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 5. WATERFRONT BOAT JETTY & FERRY PORT (ON THE LEFT)      */}
      {/* ========================================================= */}
      <group position={[92, -2.4, 42]}>
        {/* Sloped Rip-Rap Embankment Revetment Face */}
        <mesh position={[12, 1.4, 0]} rotation-z={-0.28} material={materials.revetmentRiprap} receiveShadow>
          <boxGeometry args={[16, 1.2, 44]} />
        </mesh>

        {/* Grand Concrete Access Staircase Descending down to Boat Jetty */}
        <group position={[8, 1.2, 0]}>
          {Array.from({ length: 14 }).map((_, step) => (
            <mesh
              key={step}
              position={[-step * 0.5, -step * 0.2, 0]}
              material={materials.concretePier}
              receiveShadow
            >
              <boxGeometry args={[0.6, 0.25, 4.4]} />
            </mesh>
          ))}
          <mesh position={[-3.5, -0.4, 2.1]} rotation-z={0.38} material={materials.stainlessRailing}>
            <cylinderGeometry args={[0.03, 0.03, 8.2, 6]} />
          </mesh>
          <mesh position={[-3.5, -0.4, -2.1]} rotation-z={0.38} material={materials.stainlessRailing}>
            <cylinderGeometry args={[0.03, 0.03, 8.2, 6]} />
          </mesh>
        </group>

        {/* Main Solid Concrete Finger Jetty / Ferry Dock Platform */}
        <mesh position={[0, 0.4, 0]} material={materials.concretePier} receiveShadow castShadow>
          <boxGeometry args={[18, 0.8, 36]} />
        </mesh>

        {/* Safety Yellow Curb Edge Lines */}
        <mesh position={[-8.8, 0.82, 0]} material={materials.yellowSafety}>
          <boxGeometry args={[0.2, 0.05, 35.8]} />
        </mesh>
        <mesh position={[0, 0.82, 17.8]} material={materials.yellowSafety}>
          <boxGeometry args={[17.8, 0.05, 0.2]} />
        </mesh>
        <mesh position={[0, 0.82, -17.8]} material={materials.yellowSafety}>
          <boxGeometry args={[17.8, 0.05, 0.2]} />
        </mesh>

        {/* Heavy Marine Piling Columns in Water */}
        {[-6, 0, 6].map((px) =>
          [-12, 0, 12].map((pz) => (
            <mesh key={`pile-${px}-${pz}`} position={[px, -1.8, pz]} material={materials.concretePier} castShadow>
              <cylinderGeometry args={[0.45, 0.5, 4.5, 8]} />
            </mesh>
          ))
        )}

        {/* Safety Guardrails with Open Center Boarding Gate for Cruise Ship */}
        {[-14, -8, -2.5, 2.5, 8, 14].map((rz) => (
          <group key={rz} position={[-8.8, 0.8, rz]}>
            <mesh position={[0, 0.5, 0]} material={materials.stainlessRailing}>
              <cylinderGeometry args={[0.025, 0.025, 1.0, 6]} />
            </mesh>
          </group>
        ))}
        {/* North Railing Section */}
        <mesh position={[-8.8, 1.3, -8.2]} material={materials.stainlessRailing}>
          <boxGeometry args={[0.04, 0.04, 12.0]} />
        </mesh>
        {/* South Railing Section */}
        <mesh position={[-8.8, 1.3, 8.2]} material={materials.stainlessRailing}>
          <boxGeometry args={[0.04, 0.04, 12.0]} />
        </mesh>

        {/* Mooring Bollards */}
        {[-14, -6, 6, 14].map((bz) => (
          <group key={bz} position={[-8.6, 0.8, bz]}>
            <mesh position={[0, 0.18, 0]} material={materials.whiteSteel}>
              <cylinderGeometry args={[0.12, 0.16, 0.36, 8]} />
            </mesh>
            <mesh position={[0, 0.36, 0]} material={materials.whiteSteel}>
              <boxGeometry args={[0.38, 0.08, 0.16]} />
            </mesh>
          </group>
        ))}

        {/* Passenger Boarding Gangway & Marine Dock Fenders for Unity Cruise Ship */}
        <group position={[-10.2, 0.45, 0]}>
          {/* Main Articulated Passenger Boarding Gangway */}
          <mesh position={[0, 0.15, 0]} material={materials.stainlessRailing}>
            <boxGeometry args={[2.8, 0.08, 2.6]} />
          </mesh>
          <mesh position={[0, 0.55, 1.25]} material={materials.stainlessRailing}>
            <boxGeometry args={[2.8, 0.04, 0.04]} />
          </mesh>
          <mesh position={[0, 0.55, -1.25]} material={materials.stainlessRailing}>
            <boxGeometry args={[2.8, 0.04, 0.04]} />
          </mesh>
          {/* Embarkation Archway */}
          <group position={[1.4, 0.5, 0]}>
            <mesh position={[0, 1.1, -1.25]} material={materials.whiteSteel}>
              <cylinderGeometry args={[0.04, 0.04, 2.2, 6]} />
            </mesh>
            <mesh position={[0, 1.1, 1.25]} material={materials.whiteSteel}>
              <cylinderGeometry args={[0.04, 0.04, 2.2, 6]} />
            </mesh>
            <mesh position={[0, 2.2, 0]} material={materials.whiteSteel}>
              <boxGeometry args={[0.1, 0.1, 2.6]} />
            </mesh>
          </group>
          {/* Heavy Rubber Marine Dock Fenders */}
          {[-12, -6, 6, 12].map((fz) => (
            <mesh key={`fender-${fz}`} position={[0.8, -0.4, fz]} rotation-z={Math.PI / 2} material={materials.boatHullNavy}>
              <cylinderGeometry args={[0.32, 0.32, 1.4, 10]} />
            </mesh>
          ))}
        </group>

      </group>

      {/* ========================================================= */}
      {/* 6. VISITOR RECEPTION TERMINAL BUILDING (LEFT BACK WALL)   */}
      {/* ========================================================= */}
      <group position={[144, 2.1, 32]}>
        <mesh position={[0, 2.4, 0]} material={materials.redSandstone} castShadow receiveShadow>
          <boxGeometry args={[8.4, 4.8, 48]} />
        </mesh>
        <mesh position={[-4.25, 2.0, 0]} material={materials.glassDark}>
          <boxGeometry args={[0.15, 3.4, 42]} />
        </mesh>
        <mesh position={[0, 4.85, 0]} material={materials.redSandstoneTrim} castShadow>
          <boxGeometry args={[8.8, 0.3, 48.4]} />
        </mesh>
        {/* Roof Louvres / Architectural Crown */}
        <mesh position={[0, 5.4, 0]} material={materials.whiteSteel}>
          <boxGeometry args={[6.5, 0.8, 40]} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 7. POSED VISITORS ON THE OBSERVATION PROMENADE & DOCK     */}
      {/* ========================================================= */}
      <group position={[0, 2.45, 0]}>
        {[
          // Left Observation Terrace (Under Wave Canopy & Binoculars)
          { x: 114, z: 20, top: "#ea580c", bot: "#1e293b", rot: Math.PI / 2 },
          { x: 115, z: 28, top: "#ffffff", bot: "#374151", rot: 1.4 },
          { x: 114, z: 36, top: "#0284c7", bot: "#1e293b", rot: 1.6 },
          { x: 115, z: 44, top: "#16a34a", bot: "#374151", rot: Math.PI / 2 },
          { x: 122, z: 18, top: "#e11d48", bot: "#1e293b", rot: 0.2 },
          { x: 126, z: 28, top: "#f59e0b", bot: "#374151", rot: -0.3 },
          // Bridgehead Gateway
          { x: 114, z: 2, top: "#8b5cf6", bot: "#1e293b", rot: -Math.PI / 2 },
          { x: 116, z: -2, top: "#0d9488", bot: "#374151", rot: -Math.PI / 2 },
          // Waterfront Boat Jetty Pier & Unity Cruise Ship Boarding Queue
          { x: 84, z: 42, top: "#ea580c", bot: "#1e293b", rot: -Math.PI / 2, y: -4.05 },
          { x: 87, z: 42, top: "#2563eb", bot: "#374151", rot: -Math.PI / 2, y: -4.05 },
          { x: 89, z: 40, top: "#16a34a", bot: "#1e293b", rot: -Math.PI / 2, y: -4.05 },
          { x: 89, z: 44, top: "#e11d48", bot: "#374151", rot: -Math.PI / 2, y: -4.05 },
          { x: 92, z: 36, top: "#f59e0b", bot: "#1e293b", rot: 0.8, y: -4.05 },
          { x: 92, z: 48, top: "#0284c7", bot: "#1e293b", rot: -0.5, y: -4.05 },
        ].map((v, idx) => (
          <group key={idx} position={[v.x, v.y ?? 0, v.z]} rotation-y={v.rot}>
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.14, 0.16, 0.9, 8]} />
              <meshStandardMaterial color={v.bot} roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.18, 0.16, 0.6, 8]} />
              <meshStandardMaterial color={v.top} roughness={0.6} />
            </mesh>
            <mesh position={[0, 1.55, 0]}>
              <sphereGeometry args={[0.13, 8, 8]} />
              <meshStandardMaterial color="#fcd34d" roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
