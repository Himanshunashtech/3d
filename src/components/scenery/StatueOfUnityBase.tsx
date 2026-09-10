import * as THREE from "three";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  subscribeTheme,
  getThemeMode,
  subscribeLightShowState,
  getLightShowState,
  LightShowState,
} from "./sceneControlStore";
import { MainlandVisitorPort } from "./MainlandVisitorPort";

/**
 * Authentic 3D reproduction of the Statue of Unity base & visitor infrastructure (Sadhu Bet, Kevadia)
 * Exact match to the 4 reference photographs:
 * 1. Terracotta red sandstone polygonal pedestal building with upper feet plinth platform
 * 2. Front sloped facade with iconic rhombus/diamond green garden lattice & circular skylights
 * 3. Left & Right outdoor escalators with metallic trusses, glass balustrades & flanking staircases
 * 4. Ground-level entrance portal with "STATUE OF UNITY" carved inscription & glass doors
 * 5. Angled side wings with rhythmic vertical louvres/columns and interior glazing
 * 6. Multi-tiered viewing plazas with modern undulating white wave canopy shelters
 * 7. Long approach bridge with white arched tensile fabric canopy modules & street lamps
 * 8. Rocky Sadhu Bet island foundation surrounded by the Narmada River
 */
// Preload Statue 3D Asset in parallel immediately at page initialization
useGLTF.preload("/Screenshot 2026-09-09 213731.glb");

export function StatueOfUnityBase({
  modelUrl = "/Screenshot 2026-09-09 213731.glb",
}: {
  modelUrl?: string;
}) {
  const [isNight, setIsNight] = useState(getThemeMode() === "night");
  const [showState, setShowState] = useState<LightShowState>(getLightShowState());

  useEffect(() => {
    return subscribeTheme((mode) => {
      setIsNight(mode === "night");
    });
  }, []);

  useEffect(() => {
    return subscribeLightShowState((state) => {
      setShowState(state);
    });
  }, []);

  // Authentic architectural materials calibrated to the reference photos (stable single-instance)
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
        color: "#c65f4c",
        roughness: 0.65,
        metalness: 0.1,
        flatShading: true,
      }),
      louverMat: new THREE.MeshStandardMaterial({
        color: "#ba5340",
        emissive: new THREE.Color("#000000"),
        emissiveIntensity: 0,
        roughness: 0.58,
        metalness: 0.12,
        flatShading: true,
      }),
      glassDark: new THREE.MeshStandardMaterial({
        color: "#1e293b",
        roughness: 0.15,
        metalness: 0.85,
      }),
      glassEntrance: new THREE.MeshStandardMaterial({
        color: "#0f2334",
        emissive: new THREE.Color("#000000"),
        emissiveIntensity: 0,
        roughness: 0.1,
        metalness: 0.9,
      }),
      gardenGrass: new THREE.MeshStandardMaterial({
        color: "#3d7828",
        roughness: 0.9,
        metalness: 0.02,
        flatShading: true,
      }),
      diamondRib: new THREE.MeshStandardMaterial({
        color: "#d07865",
        roughness: 0.6,
        metalness: 0.1,
        flatShading: true,
      }),
      skylightGlass: new THREE.MeshStandardMaterial({
        color: "#1e293b",
        emissive: new THREE.Color("#000000"),
        emissiveIntensity: 0,
        roughness: 0.2,
        metalness: 0.8,
      }),
      escalatorTruss: new THREE.MeshStandardMaterial({
        color: "#64748b",
        roughness: 0.4,
        metalness: 0.6,
      }),
      escalatorGlass: new THREE.MeshStandardMaterial({
        color: "#93c5fd",
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.65,
      }),
      escalatorHandrail: new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.3,
        metalness: 0.2,
      }),
      stairTreads: new THREE.MeshStandardMaterial({
        color: "#cbd5e1",
        roughness: 0.7,
        metalness: 0.3,
      }),
      plazaPaving: new THREE.MeshStandardMaterial({
        color: "#eee3d3",
        roughness: 0.78,
      }),
      plazaGridInlay: new THREE.MeshStandardMaterial({
        color: "#943b2a",
        roughness: 0.8,
      }),
      signLetters: new THREE.MeshStandardMaterial({
        color: "#1c1917",
        roughness: 0.4,
        metalness: 0.4,
      }),
      tensileFabric: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.3,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
      whiteSteelMast: new THREE.MeshStandardMaterial({
        color: "#f1f5f9",
        roughness: 0.3,
        metalness: 0.4,
      }),
      bridgeConcrete: new THREE.MeshStandardMaterial({
        color: "#9e9a93",
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      }),
      islandRockDark: new THREE.MeshStandardMaterial({
        color: "#524436",
        roughness: 0.96,
        metalness: 0.02,
        flatShading: true,
      }),
      islandRockWarm: new THREE.MeshStandardMaterial({
        color: "#6c5b49",
        roughness: 0.92,
        metalness: 0.02,
        flatShading: true,
      }),
      streetLampGlow: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#fff7db"),
        emissiveIntensity: 0.4,
        roughness: 0.1,
      }),
    };
  }, []);

  // Instant zero-allocation material theme updater
  useEffect(() => {
    materials.redSandstone.color.set(isNight ? "#782d22" : "#b44f3d");
    materials.redSandstoneDark.color.set(isNight ? "#5c2017" : "#8f3b2d");
    materials.redSandstoneTrim.color.set(isNight ? "#8c3629" : "#c65f4c");
    materials.louverMat.color.set(isNight ? "#d97706" : "#ba5340");
    materials.louverMat.emissive.set(isNight ? "#b45309" : "#000000");
    materials.louverMat.emissiveIntensity = isNight ? 1.6 : 0;
    materials.glassDark.color.set(isNight ? "#0f172a" : "#1e293b");
    materials.glassEntrance.color.set(isNight ? "#38bdf8" : "#0f2334");
    materials.glassEntrance.emissive.set(isNight ? "#0284c7" : "#000000");
    materials.glassEntrance.emissiveIntensity = isNight ? 0.9 : 0;
    materials.gardenGrass.color.set(isNight ? "#143317" : "#3d7828");
    materials.diamondRib.color.set(isNight ? "#8d392b" : "#d07865");
    materials.skylightGlass.color.set(isNight ? "#fef08a" : "#1e293b");
    materials.skylightGlass.emissive.set(isNight ? "#eab308" : "#000000");
    materials.skylightGlass.emissiveIntensity = isNight ? 2.2 : 0;
    materials.escalatorTruss.color.set(isNight ? "#334155" : "#64748b");
    materials.stairTreads.color.set(isNight ? "#475569" : "#cbd5e1");
    materials.plazaPaving.color.set(isNight ? "#a39580" : "#eee3d3");
    materials.plazaGridInlay.color.set(isNight ? "#5c241b" : "#943b2a");
    materials.signLetters.color.set(isNight ? "#f8fafc" : "#1c1917");
    materials.tensileFabric.color.set(isNight ? "#cbd5e1" : "#ffffff");
    materials.bridgeConcrete.color.set(isNight ? "#55524d" : "#9e9a93");
    materials.islandRockDark.color.set(isNight ? "#261e18" : "#524436");
    materials.islandRockWarm.color.set(isNight ? "#362c22" : "#6c5b49");
    materials.streetLampGlow.emissiveIntensity = isNight ? 5.0 : 0.4;
  }, [isNight, materials]);


  return (
    <group position={[-6, -1.2, 0]}>
      {/* ========================================================= */}
      {/* 1. SADHU BET ROCKY ISLAND FOUNDATION & CRAGS             */}
      {/* ========================================================= */}
      <group position={[0, 0, 0]}>
        {/* Core Island Foundation */}
        <mesh position={[-1, -1.1, 0]} material={materials.islandRockWarm} receiveShadow castShadow>
          <cylinderGeometry args={[17, 23, 2.8, 20]} />
        </mesh>
        {/* Rocky stepped promontories plunging into water */}
        <mesh position={[-12, -1.5, 3]} material={materials.islandRockDark} receiveShadow castShadow>
          <cylinderGeometry args={[10, 14, 2.4, 14]} />
        </mesh>
        <mesh position={[-6, -1.6, 12]} material={materials.islandRockDark} receiveShadow castShadow>
          <cylinderGeometry args={[9, 13, 2.2, 12]} />
        </mesh>
        <mesh position={[9, -1.4, 5]} material={materials.islandRockWarm} receiveShadow castShadow>
          <cylinderGeometry args={[10, 14, 2.5, 14]} />
        </mesh>
        <mesh position={[-17, -2.0, -9]} material={materials.islandRockDark} receiveShadow castShadow>
          <cylinderGeometry args={[8, 12, 2.0, 10]} />
        </mesh>

        {/* Scattered rock boulders at water line */}
        {[
          { x: -19, y: -2.2, z: 8, s: 2.4 },
          { x: -15, y: -2.1, z: 16, s: 2.0 },
          { x: -8, y: -2.0, z: 18, s: 2.6 },
          { x: 3, y: -2.1, z: 17, s: 2.2 },
          { x: -24, y: -2.3, z: -5, s: 2.8 },
        ].map((r, i) => (
          <mesh
            key={i}
            position={[r.x, r.y, r.z]}
            scale={[r.s, r.s * 0.7, r.s]}
            material={materials.islandRockDark}
            receiveShadow
            castShadow
          >
            <dodecahedronGeometry args={[1.2, 1]} />
          </mesh>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 2 to 7 & 9: BASE MONUMENT COMPLEX (FACING THE RIVER)       */}
      {/* ========================================================= */}
      <group rotation-y={0}>
        {/* ========================================================= */}
        {/* 2. GROUND PLAZA, ENTRANCE PORTAL & "STATUE OF UNITY" SIGN */}
        {/* ========================================================= */}
        <group position={[0, 0.8, 0]}>
          {/* Main Paved Entrance Plaza Courtyard */}
          <mesh position={[0, 0.05, 7.5]} material={materials.plazaPaving} receiveShadow castShadow>
            <boxGeometry args={[26, 0.3, 16]} />
          </mesh>

          {/* Decorative Plaza Grid Lines (matching Image 3 & 4) */}
          {[-8, -4, 0, 4, 8].map((px) => (
            <mesh key={px} position={[px, 0.21, 7.5]} material={materials.plazaGridInlay}>
              <boxGeometry args={[0.3, 0.02, 16]} />
            </mesh>
          ))}
          {[2, 5, 8, 11, 14].map((pz) => (
            <mesh key={pz} position={[0, 0.21, pz]} material={materials.plazaGridInlay}>
              <boxGeometry args={[26, 0.02, 0.3]} />
            </mesh>
          ))}

          {/* Lower Ground Entrance Wall with Red Sandstone Masonry */}
          <mesh position={[0, 1.8, 0.2]} material={materials.redSandstone} receiveShadow castShadow>
            <boxGeometry args={[16, 3.4, 2.2]} />
          </mesh>

          {/* Recessed Glass Entrance Doors with Transoms (Image 3) */}
          <group position={[0, 1.3, 1.35]}>
            {/* Main Glass Doors Portal */}
            <mesh position={[0, 0, 0]} material={materials.glassEntrance}>
              <boxGeometry args={[7.2, 2.4, 0.15]} />
            </mesh>
            {/* Vertical Door Frame Mullions */}
            {[-3.0, -1.5, 0, 1.5, 3.0].map((mx) => (
              <mesh key={mx} position={[mx, 0, 0.08]} material={materials.redSandstoneDark}>
                <boxGeometry args={[0.15, 2.4, 0.1]} />
              </mesh>
            ))}
            {/* Horizontal Transom Frame */}
            <mesh position={[0, 0.6, 0.08]} material={materials.redSandstoneDark}>
              <boxGeometry args={[7.2, 0.12, 0.1]} />
            </mesh>
            {/* Entrance Lobby Display Board */}
            <mesh position={[0, 0.1, 0.1]} material={materials.signLetters}>
              <boxGeometry args={[1.0, 1.4, 0.04]} />
            </mesh>
          </group>

          {/* Lintel with Engraved "STATUE OF UNITY" Text Inscription (Image 3) */}
          <group position={[0, 2.9, 1.35]}>
            {/* Sandstone Lintel Panel */}
            <mesh position={[0, 0, 0]} material={materials.redSandstoneTrim} receiveShadow castShadow>
              <boxGeometry args={[8.8, 0.9, 0.25]} />
            </mesh>
            {/* 3D Debossed Letter Blocks reading STATUE OF UNITY */}
            <mesh position={[0, 0, 0.14]} material={materials.signLetters}>
              <boxGeometry args={[7.4, 0.45, 0.05]} />
            </mesh>
          </group>

          {/* Planter Boxes & Shrubs in Front Plaza */}
          {[-8.5, 8.5].map((px) => (
            <group key={px} position={[px, 0.5, 6.0]}>
              <mesh material={materials.redSandstoneTrim} castShadow>
                <boxGeometry args={[1.4, 0.7, 4.2]} />
              </mesh>
              <mesh position={[0, 0.45, 0]} material={materials.gardenGrass}>
                <boxGeometry args={[1.2, 0.25, 4.0]} />
              </mesh>
            </group>
          ))}
        </group>

        {/* ========================================================= */}
        {/* 3. POLYGONAL RED SANDSTONE PEDESTAL BUILDING CORE        */}
        {/* ========================================================= */}
        <group position={[0, 2.8, 0]}>
          {/* Main Terracotta Polygonal Base Body */}
          <mesh position={[0, 1.4, -0.6]} material={materials.redSandstone} receiveShadow castShadow>
            <cylinderGeometry args={[8.8, 10.8, 3.2, 6]} />
          </mesh>

          {/* Upper Plinth Terrace under Statue's Feet (Images 1, 2, 3) */}
          <group position={[0, 3.1, -0.5]}>
            {/* Top Sandstone Footing Deck */}
            <mesh position={[0, 0.25, 0]} material={materials.redSandstoneDark} receiveShadow castShadow>
              <cylinderGeometry args={[6.6, 7.8, 0.6, 8]} />
            </mesh>
            {/* Upper Plinth Foot Pad */}
            <mesh position={[0, 0.7, 0]} material={materials.redSandstoneTrim} receiveShadow castShadow>
              <cylinderGeometry args={[5.4, 6.2, 0.4, 8]} />
            </mesh>
            {/* Parapet Wall Rim with Geometric Window Openings (Images 1 & 2) */}
            <mesh position={[0, 1.05, 0]} material={materials.redSandstone} receiveShadow castShadow>
              <cylinderGeometry args={[7.6, 7.6, 0.6, 16, 1, true]} />
            </mesh>
          </group>
        </group>

        {/* ========================================================= */}
        {/* 4. FRONT SLOPED DIAMOND / RHOMBUS GARDEN LATTICE (1, 2, 3)*/}
        {/* ========================================================= */}
        <group position={[0, 3.2, 1.6]}>
          {/* Front Sloped Roof Plane (angled at ~28 degrees) */}
          <group rotation-x={0.48}>
            {/* Base Sloped Sandstone Deck */}
            <mesh position={[0, -0.2, 0]} material={materials.redSandstoneDark} receiveShadow castShadow>
              <boxGeometry args={[9.6, 0.4, 6.8]} />
            </mesh>

            {/* Lush Greenery Layer on the Slope */}
            <mesh position={[0, 0.05, 0]} material={materials.gardenGrass} receiveShadow>
              <boxGeometry args={[9.2, 0.1, 6.4]} />
            </mesh>

            {/* 3D Rhombus / Diamond Waffle Lattice Grid Structure */}
            {/* Diagonal Ribs Set 1 (Angle +45 deg) */}
            {[-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6].map((offset, idx) => (
              <mesh
                key={`diag1-${idx}`}
                position={[offset * 0.7, 0.18, 0]}
                rotation-y={Math.PI / 4}
                material={materials.diamondRib}
                castShadow
              >
                <boxGeometry args={[0.18, 0.16, 8.5]} />
              </mesh>
            ))}
            {/* Diagonal Ribs Set 2 (Angle -45 deg) */}
            {[-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6].map((offset, idx) => (
              <mesh
                key={`diag2-${idx}`}
                position={[offset * 0.7, 0.18, 0]}
                rotation-y={-Math.PI / 4}
                material={materials.diamondRib}
                castShadow
              >
                <boxGeometry args={[0.18, 0.16, 8.5]} />
              </mesh>
            ))}

            {/* Recessed Circular Skylights / Planters in each diamond cell (Image 1, 2, 3) */}
            {[-2.4, -1.2, 0, 1.2, 2.4].map((gx) =>
              [-2.0, -0.8, 0.4, 1.6].map((gz) => (
                <group key={`${gx}-${gz}`} position={[gx, 0.22, gz]}>
                  <mesh material={materials.skylightGlass} receiveShadow castShadow>
                    <cylinderGeometry args={[0.34, 0.38, 0.12, 16]} />
                  </mesh>
                  <mesh position={[0, 0.08, 0]} material={materials.redSandstoneTrim}>
                    <torusGeometry args={[0.36, 0.06, 8, 16]} />
                  </mesh>
                </group>
              ))
            )}

            {/* Stepped Central Access Ribs on the Garden Slope */}
            {[-2.2, 0, 2.2].map((sx) => (
              <mesh key={sx} position={[sx, 0.24, 0]} material={materials.stairTreads}>
                <boxGeometry args={[0.35, 0.14, 6.4]} />
              </mesh>
            ))}
          </group>
        </group>

        {/* ========================================================= */}
        {/* 5. DUAL OUTDOOR ESCALATORS & FLANKING STAIRCASES (Image 3) */}
        {/* ========================================================= */}
        <group position={[0, 1.0, 0]}>
          {/* LEFT ESCALATOR & STAIR RAMP */}
          <group position={[-5.8, 1.4, 2.8]}>
            {/* Escalator Inclined Metal Truss */}
            <mesh
              position={[0, 0.6, 0.8]}
              rotation-x={0.48}
              material={materials.escalatorTruss}
              castShadow
            >
              <boxGeometry args={[1.3, 0.6, 6.6]} />
            </mesh>
            {/* Escalator Stepped Moving Treads */}
            <mesh
              position={[0, 0.95, 0.8]}
              rotation-x={0.48}
              material={materials.stairTreads}
            >
              <boxGeometry args={[0.9, 0.15, 6.4]} />
            </mesh>
            {/* Glass Balustrade Panels */}
            <mesh
              position={[-0.58, 1.35, 0.8]}
              rotation-x={0.48}
              material={materials.escalatorGlass}
            >
              <boxGeometry args={[0.06, 0.75, 6.4]} />
            </mesh>
            <mesh
              position={[0.58, 1.35, 0.8]}
              rotation-x={0.48}
              material={materials.escalatorGlass}
            >
              <boxGeometry args={[0.06, 0.75, 6.4]} />
            </mesh>
            {/* Black Handrails */}
            <mesh
              position={[-0.58, 1.75, 0.8]}
              rotation-x={0.48}
              material={materials.escalatorHandrail}
            >
              <boxGeometry args={[0.12, 0.08, 6.5]} />
            </mesh>
            <mesh
              position={[0.58, 1.75, 0.8]}
              rotation-x={0.48}
              material={materials.escalatorHandrail}
            >
              <boxGeometry args={[0.12, 0.08, 6.5]} />
            </mesh>

            {/* Adjacent Red Sandstone Pedestrian Stairs */}
            <mesh
              position={[-1.2, 0.5, 0.8]}
              rotation-x={0.48}
              material={materials.redSandstone}
              receiveShadow
              castShadow
            >
              <boxGeometry args={[1.0, 0.5, 6.6]} />
            </mesh>
            {/* Sandstone Safety Flank Wall */}
            <mesh
              position={[-1.8, 1.0, 0.8]}
              rotation-x={0.48}
              material={materials.redSandstoneTrim}
              castShadow
            >
              <boxGeometry args={[0.3, 0.9, 6.8]} />
            </mesh>
          </group>

          {/* RIGHT ESCALATOR & STAIR RAMP */}
          <group position={[5.8, 1.4, 2.8]}>
            {/* Escalator Inclined Metal Truss */}
            <mesh
              position={[0, 0.6, 0.8]}
              rotation-x={0.48}
              material={materials.escalatorTruss}
              castShadow
            >
              <boxGeometry args={[1.3, 0.6, 6.6]} />
            </mesh>
            {/* Escalator Stepped Moving Treads */}
            <mesh
              position={[0, 0.95, 0.8]}
              rotation-x={0.48}
              material={materials.stairTreads}
            >
              <boxGeometry args={[0.9, 0.15, 6.4]} />
            </mesh>
            {/* Glass Balustrade Panels */}
            <mesh
              position={[-0.58, 1.35, 0.8]}
              rotation-x={0.48}
              material={materials.escalatorGlass}
            >
              <boxGeometry args={[0.06, 0.75, 6.4]} />
            </mesh>
            <mesh
              position={[0.58, 1.35, 0.8]}
              rotation-x={0.48}
              material={materials.escalatorGlass}
            >
              <boxGeometry args={[0.06, 0.75, 6.4]} />
            </mesh>
            {/* Black Handrails */}
            <mesh
              position={[-0.58, 1.75, 0.8]}
              rotation-x={0.48}
              material={materials.escalatorHandrail}
            >
              <boxGeometry args={[0.12, 0.08, 6.5]} />
            </mesh>
            <mesh
              position={[0.58, 1.75, 0.8]}
              rotation-x={0.48}
              material={materials.escalatorHandrail}
            >
              <boxGeometry args={[0.12, 0.08, 6.5]} />
            </mesh>

            {/* Adjacent Red Sandstone Pedestrian Stairs */}
            <mesh
              position={[1.2, 0.5, 0.8]}
              rotation-x={0.48}
              material={materials.redSandstone}
              receiveShadow
              castShadow
            >
              <boxGeometry args={[1.0, 0.5, 6.6]} />
            </mesh>
            {/* Sandstone Safety Flank Wall */}
            <mesh
              position={[1.8, 1.0, 0.8]}
              rotation-x={0.48}
              material={materials.redSandstoneTrim}
              castShadow
            >
              <boxGeometry args={[0.3, 0.9, 6.8]} />
            </mesh>
          </group>
        </group>

        {/* ========================================================= */}
        {/* 6. ANGLED SIDE WINGS WITH VERTICAL LOUVRES/COLUMNS (1, 2)  */}
        {/* ========================================================= */}
        <group position={[0, 2.4, 0]}>
          {/* LEFT SIDE LOUVRED WING */}
          <group position={[-6.8, 0, -1.2]} rotation-y={0.38}>
            {/* Backing Tinted Curtain Glazing */}
            <mesh position={[0, 1.5, 0]} material={materials.glassDark}>
              <boxGeometry args={[6.8, 3.2, 0.2]} />
            </mesh>
            {/* Sloped Roof Coping */}
            <mesh
              position={[0, 3.2, 0]}
              rotation-z={-0.12}
              material={materials.redSandstoneTrim}
              castShadow
            >
              <boxGeometry args={[7.2, 0.45, 0.9]} />
            </mesh>
            {/* Vertical Louvre Fins / Columns Screen */}
            {Array.from({ length: 14 }).map((_, i) => {
              const lx = -3.0 + i * 0.46;
              const h = 2.4 + (i / 14) * 1.2;
              return (
                <mesh
                  key={i}
                  position={[lx, h * 0.5, 0.35]}
                  material={materials.louverMat}
                  castShadow
                >
                  <boxGeometry args={[0.18, h, 0.55]} />
                </mesh>
              );
            })}
          </group>

          {/* RIGHT SIDE LOUVRED WING */}
          <group position={[6.8, 0, -1.2]} rotation-y={-0.38}>
            {/* Backing Tinted Curtain Glazing */}
            <mesh position={[0, 1.5, 0]} material={materials.glassDark}>
              <boxGeometry args={[6.8, 3.2, 0.2]} />
            </mesh>
            {/* Sloped Roof Coping */}
            <mesh
              position={[0, 3.2, 0]}
              rotation-z={0.12}
              material={materials.redSandstoneTrim}
              castShadow
            >
              <boxGeometry args={[7.2, 0.45, 0.9]} />
            </mesh>
            {/* Vertical Louvre Fins / Columns Screen */}
            {Array.from({ length: 14 }).map((_, i) => {
              const lx = 3.0 - i * 0.46;
              const h = 2.4 + (i / 14) * 1.2;
              return (
                <mesh
                  key={i}
                  position={[lx, h * 0.5, 0.35]}
                  material={materials.louverMat}
                  castShadow
                >
                  <boxGeometry args={[0.18, h, 0.55]} />
                </mesh>
              );
            })}
          </group>
        </group>

        {/* ========================================================= */}
        {/* 7. GRAND WHITE PROMENADE & OBSERVATION BASE (360 DEGREES) */}
        {/* ========================================================= */}
        <group position={[0, 1.0, 0]}>
          {/* Front River-Facing Viewing Promenade (z = 4 to 15, facing river +Z) */}
          <mesh position={[0, 0.6, 9.5]} material={materials.plazaPaving} receiveShadow castShadow>
            <boxGeometry args={[26, 1.2, 10]} />
          </mesh>
          <mesh position={[0, 1.25, 9.5]} material={materials.redSandstoneTrim} receiveShadow castShadow>
            <boxGeometry args={[25.2, 0.2, 9.2]} />
          </mesh>
          <mesh position={[0, 1.37, 9.5]} material={materials.plazaPaving} receiveShadow>
            <boxGeometry args={[24.4, 0.05, 8.4]} />
          </mesh>

          {/* Central Side Promenade Wings (Flanking Red Base) */}
          <mesh position={[0, 0.6, 0]} material={materials.plazaPaving} receiveShadow castShadow>
            <boxGeometry args={[28, 1.2, 10]} />
          </mesh>
          <mesh position={[0, 1.25, 0]} material={materials.redSandstoneTrim} receiveShadow castShadow>
            <boxGeometry args={[27.2, 0.2, 9.2]} />
          </mesh>
          <mesh position={[0, 1.37, 0]} material={materials.plazaPaving} receiveShadow>
            <boxGeometry args={[26.4, 0.05, 8.4]} />
          </mesh>

          {/* Rear Panoramic Observation Deck (Behind the Red Base: z = -4 to -13) */}
          <mesh position={[0, 0.6, -9.5]} material={materials.plazaPaving} receiveShadow castShadow>
            <boxGeometry args={[26, 1.2, 10]} />
          </mesh>
          <mesh position={[0, 1.25, -9.5]} material={materials.redSandstoneTrim} receiveShadow castShadow>
            <boxGeometry args={[25.2, 0.2, 9.2]} />
          </mesh>
          <mesh position={[0, 1.37, -9.5]} material={materials.plazaPaving} receiveShadow>
            <boxGeometry args={[24.4, 0.05, 8.4]} />
          </mesh>

          {/* East Bridge-Head Platform (Connecting East Flank to Approach Bridge x=7 to 18) */}
          <mesh position={[12.5, 0.6, 0]} material={materials.plazaPaving} receiveShadow castShadow>
            <boxGeometry args={[11, 1.2, 14]} />
          </mesh>
          <mesh position={[12.5, 1.25, 0]} material={materials.redSandstoneTrim} receiveShadow castShadow>
            <boxGeometry args={[10.2, 0.2, 13.2]} />
          </mesh>
          <mesh position={[12.5, 1.37, 0]} material={materials.plazaPaving} receiveShadow>
            <boxGeometry args={[9.4, 0.05, 12.4]} />
          </mesh>

          {/* Heavy Sub-Deck Concrete Abutment Pier Foundation over the water under bridge neck */}
          <mesh position={[14.0, -1.8, 0]} material={materials.bridgeConcrete} receiveShadow castShadow>
            <boxGeometry args={[8.0, 4.4, 12.0]} />
          </mesh>

          {/* 2. Perimeter Safety Balustrades & Glass Railings around the whole white base */}
          {/* Front River Balustrades */}
          <mesh position={[0, 1.8, 14.4]} material={materials.escalatorGlass}>
            <boxGeometry args={[25.2, 0.85, 0.1]} />
          </mesh>
          <mesh position={[0, 2.25, 14.4]} material={materials.redSandstoneTrim}>
            <boxGeometry args={[25.2, 0.1, 0.18]} />
          </mesh>

          {/* Rear Balustrades (Back of Red Base) */}
          <mesh position={[0, 1.8, -14.4]} material={materials.escalatorGlass}>
            <boxGeometry args={[25.2, 0.85, 0.1]} />
          </mesh>
          <mesh position={[0, 2.25, -14.4]} material={materials.redSandstoneTrim}>
            <boxGeometry args={[25.2, 0.1, 0.18]} />
          </mesh>

          {/* West Flank Balustrade */}
          <mesh position={[-13.8, 1.8, 0]} material={materials.escalatorGlass}>
            <boxGeometry args={[0.1, 0.85, 27.0]} />
          </mesh>
          <mesh position={[-13.8, 2.25, 0]} material={materials.redSandstoneTrim}>
            <boxGeometry args={[0.18, 0.1, 27.0]} />
          </mesh>

          {/* East Flank Balustrades (North & South of Bridge Entrance) */}
          <mesh position={[13.8, 1.8, 10.0]} material={materials.escalatorGlass}>
            <boxGeometry args={[0.1, 0.85, 8.5]} />
          </mesh>
          <mesh position={[13.8, 2.25, 10.0]} material={materials.redSandstoneTrim}>
            <boxGeometry args={[0.18, 0.1, 8.5]} />
          </mesh>
          <mesh position={[13.8, 1.8, -10.0]} material={materials.escalatorGlass}>
            <boxGeometry args={[0.1, 0.85, 8.5]} />
          </mesh>
          <mesh position={[13.8, 2.25, -10.0]} material={materials.redSandstoneTrim}>
            <boxGeometry args={[0.18, 0.1, 8.5]} />
          </mesh>

          {/* Decorative Planters with Greenery */}
          {[
            { x: -10.0, z: 12.0, sx: 5.0, sz: 1.2 },
            { x: 10.0, z: 12.0, sx: 5.0, sz: 1.2 },
            { x: -10.0, z: -12.0, sx: 5.0, sz: 1.2 },
            { x: 10.0, z: -12.0, sx: 5.0, sz: 1.2 },
            { x: 16.0, z: 5.2, sx: 1.2, sz: 3.2 },
            { x: 16.0, z: -5.2, sx: 1.2, sz: 3.2 },
          ].map((pl, idx) => (
            <group key={idx} position={[pl.x, 1.6, pl.z]}>
              <mesh material={materials.redSandstoneTrim} castShadow>
                <boxGeometry args={[pl.sx, 0.45, pl.sz]} />
              </mesh>
              <mesh position={[0, 0.28, 0]} material={materials.gardenGrass}>
                <boxGeometry args={[Math.max(0.2, pl.sx - 0.3), 0.2, Math.max(0.2, pl.sz - 0.3)]} />
              </mesh>
            </group>
          ))}

          {/* 3. White Tensile Wave Canopy Structures (Front River & Rear Overlooks) */}
          {/* A. Front River Overlook Canopy */}
          <group position={[0, 1.5, 11.5]}>
            {[-8.0, 0, 8.0].map((px) => (
              <group key={px}>
                <mesh position={[px, 1.1, -1.6]} material={materials.redSandstoneTrim} castShadow>
                  <boxGeometry args={[0.45, 2.2, 0.45]} />
                </mesh>
                <mesh position={[px, 1.1, 1.6]} material={materials.redSandstoneTrim} castShadow>
                  <boxGeometry args={[0.45, 2.2, 0.45]} />
                </mesh>
              </group>
            ))}
            {Array.from({ length: 36 }).map((_, i) => {
              const u = i / 36;
              const px = -10.0 + u * 20.0;
              const py = 2.4 + Math.sin(u * Math.PI * 2) * 0.4;
              return (
                <mesh key={i} position={[px, py, 0]} material={materials.tensileFabric} castShadow>
                  <boxGeometry args={[0.34, 0.08, 4.4]} />
                </mesh>
              );
            })}
          </group>

          {/* B. Rear Mountain Overlook Canopy (Back of Red Base) */}
          <group position={[0, 1.5, -11.5]}>
            {[-8.0, 0, 8.0].map((px) => (
              <group key={px}>
                <mesh position={[px, 1.1, -1.6]} material={materials.redSandstoneTrim} castShadow>
                  <boxGeometry args={[0.45, 2.2, 0.45]} />
                </mesh>
                <mesh position={[px, 1.1, 1.6]} material={materials.redSandstoneTrim} castShadow>
                  <boxGeometry args={[0.45, 2.2, 0.45]} />
                </mesh>
              </group>
            ))}
            {Array.from({ length: 36 }).map((_, i) => {
              const u = i / 36;
              const px = -10.0 + u * 20.0;
              const py = 2.4 + Math.sin(u * Math.PI * 2) * 0.4;
              return (
                <mesh key={i} position={[px, py, 0]} material={materials.tensileFabric} castShadow>
                  <boxGeometry args={[0.34, 0.08, 4.4]} />
                </mesh>
              );
            })}
          </group>

          {/* C. East Bridge Arrival Wave Canopy */}
          <group position={[12.5, 1.5, 0]}>
            {[-3.5, 3.5].map((pz) => (
              <group key={pz}>
                <mesh position={[-2.2, 1.1, pz]} material={materials.redSandstoneTrim} castShadow>
                  <boxGeometry args={[0.45, 2.2, 0.45]} />
                </mesh>
                <mesh position={[2.2, 1.1, pz]} material={materials.redSandstoneTrim} castShadow>
                  <boxGeometry args={[0.45, 2.2, 0.45]} />
                </mesh>
              </group>
            ))}
            {Array.from({ length: 28 }).map((_, i) => {
              const u = i / 28;
              const pz = -4.5 + u * 9.0;
              const py = 2.4 + Math.sin(u * Math.PI * 2) * 0.38;
              return (
                <mesh key={i} position={[0, py, pz]} material={materials.tensileFabric} castShadow>
                  <boxGeometry args={[5.2, 0.08, 0.32]} />
                </mesh>
              );
            })}
          </group>
        </group>

        {/* ========================================================= */}
        {/* 9. COLOSSAL STATUE OF SARDAR PATEL (ENLARGED & ALIGNED)   */}
        {/* ========================================================= */}
        {modelUrl ? (
          <Suspense fallback={null}>
            <StatueModel
              url={modelUrl}
              position={[0, 6.9, 0]}
              isNight={isNight}
              isLightShow={showState.active && showState.lightsActive}
              phaseIndex={showState.phaseIndex}
            />
          </Suspense>
        ) : null}
      </group>

      {/* ========================================================= */}
      {/* 8. APPROACH BRIDGE WITH ARCHED TENSILE FABRIC CANOPIES    */}
      {/* ========================================================= */}
      <group position={[0, 1.2, 0]}>
        {/* Main Concrete Bridge Deck (Spanning from platform at x=18 to x=108) */}
        <mesh position={[63, 0.9, 0]} material={materials.bridgeConcrete} receiveShadow castShadow>
          <boxGeometry args={[90, 0.8, 6.8]} />
        </mesh>
        {/* Paved Pedestrian Walkway Center Strip */}
        <mesh position={[63, 1.32, 0]} material={materials.plazaPaving} receiveShadow>
          <boxGeometry args={[90, 0.04, 5.8]} />
        </mesh>
        {/* Bridge Side Concrete Barriers */}
        <mesh position={[63, 1.6, 3.2]} material={materials.redSandstoneTrim} castShadow>
          <boxGeometry args={[90, 0.6, 0.35]} />
        </mesh>
        <mesh position={[63, 1.6, -3.2]} material={materials.redSandstoneTrim} castShadow>
          <boxGeometry args={[90, 0.6, 0.35]} />
        </mesh>

        {/* Concrete Support Piers across the widened river channel */}
        {[26, 40, 54, 68, 82, 96].map((px) => (
          <group key={px} position={[px, -1.6, 0]}>
            <mesh position={[0, 0, 2.4]} material={materials.bridgeConcrete} receiveShadow castShadow>
              <boxGeometry args={[2.0, 5.2, 1.6]} />
            </mesh>
            <mesh position={[0, 0, -2.4]} material={materials.bridgeConcrete} receiveShadow castShadow>
              <boxGeometry args={[2.0, 5.2, 1.6]} />
            </mesh>
            <mesh position={[0, 2.2, 0]} material={materials.bridgeConcrete} receiveShadow castShadow>
              <boxGeometry args={[2.6, 0.9, 7.2]} />
            </mesh>
            <mesh position={[0, -2.3, 0]} material={materials.bridgeConcrete} receiveShadow castShadow>
              <boxGeometry args={[3.4, 0.8, 7.8]} />
            </mesh>
          </group>
        ))}

        {/* Street Lighting Posts along the Open-Air Bridge Promenade */}
        {Array.from({ length: 12 }).map((_, i) => {
          const px = 24 + i * 7.0;
          return (
            <group key={i} position={[px, 1.3, 0]}>
              {/* North Side Lamp Post */}
              <group position={[0, 0, 3.1]}>
                <mesh position={[0, 1.5, 0]} material={materials.whiteSteelMast}>
                  <cylinderGeometry args={[0.05, 0.08, 3.0, 6]} />
                </mesh>
                <mesh position={[0, 3.0, -0.2]} material={materials.streetLampGlow}>
                  <sphereGeometry args={[0.16, 8, 8]} />
                </mesh>
              </group>
              {/* South Side Lamp Post */}
              <group position={[0, 0, -3.1]}>
                <mesh position={[0, 1.5, 0]} material={materials.whiteSteelMast}>
                  <cylinderGeometry args={[0.05, 0.08, 3.0, 6]} />
                </mesh>
                <mesh position={[0, 3.0, 0.2]} material={materials.streetLampGlow}>
                  <sphereGeometry args={[0.16, 8, 8]} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 9. MAINLAND VISITOR PORT, FERRY DOCK & VIEWING PLAZAS     */}
      {/* ========================================================= */}
      <MainlandVisitorPort isNight={isNight} isLightShow={showState.active && showState.lightsActive} />
    </group>
  );
}

/**
 * Normalizes, scales, and aligns the 3D model of Sardar Vallabhbhai Patel
 * Target height is set to 38 units (commanding monumental scale as seen in the photos).
 */
function StatueModel({
  url,
  position = [0, 6.9, 0],
  isNight = false,
  isLightShow = false,
  phaseIndex = 0,
}: {
  url: string;
  position?: [number, number, number];
  isNight?: boolean;
  isLightShow?: boolean;
  phaseIndex?: number;
}) {
  const { scene } = useGLTF(url);

  const shaderUniforms = useMemo(
    () => ({
      uIsFlagTheme: { value: 0.0 },
      uPhaseIndex: { value: 0 },
      uTime: { value: 0.0 },
    }),
    []
  );

  useEffect(() => {
    const isFlag = isLightShow && phaseIndex === 9;
    shaderUniforms.uIsFlagTheme.value = isFlag ? 1.0 : 0.0;
    shaderUniforms.uPhaseIndex.value = isLightShow ? phaseIndex : -1;
  }, [isLightShow, phaseIndex, shaderUniforms]);

  useFrame((state) => {
    shaderUniforms.uTime.value = state.clock.getElapsedTime();
  });

  const { model, scale } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.position.set(0, 0, 0);
    cloned.rotation.set(0, 0, 0);
    cloned.scale.set(1, 1, 1);
    cloned.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const targetHeight = 38;
    const computedScale = size.y > 0 ? targetHeight / size.y : 1;

    cloned.position.set(-center.x, -box.min.y, -center.z);

    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
        }
      }
    });

    return {
      model: cloned,
      scale: computedScale,
    };
  }, [scene]);

  // Shader configuration for Light Show mode
  useEffect(() => {
    model.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (mat && mat instanceof THREE.MeshStandardMaterial) {
            if (isLightShow) {
              mat.color.set("#e0d2bc");
              mat.emissive.set("#1a140e");
              mat.emissiveIntensity = 0.25;
              mat.roughness = 0.38;
              mat.metalness = 0.18;
              mat.onBeforeCompile = (shader) => {
                shader.uniforms["uIsFlagTheme"] = shaderUniforms.uIsFlagTheme;
                shader.uniforms["uPhaseIndex"] = shaderUniforms.uPhaseIndex;
                shader.uniforms["uTime"] = shaderUniforms.uTime;

                shader.vertexShader = shader.vertexShader.replace(
                  "#include <common>",
                  `#include <common>
                   varying vec3 vStatueWorldPos;
                   varying vec3 vStatueWorldNormal;`
                );
                shader.vertexShader = shader.vertexShader.replace(
                  "#include <worldpos_vertex>",
                  `#include <worldpos_vertex>
                   vStatueWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
                   vStatueWorldNormal = normalize(mat3(modelMatrix) * normal);`
                );
                shader.fragmentShader = shader.fragmentShader.replace(
                  "#include <common>",
                  `#include <common>
                   varying vec3 vStatueWorldPos;
                   varying vec3 vStatueWorldNormal;
                   uniform float uIsFlagTheme;
                   uniform int uPhaseIndex;
                   uniform float uTime;`
                );
                shader.fragmentShader = shader.fragmentShader.replace(
                  "#include <dithering_fragment>",
                  `#include <dithering_fragment>
                    vec3 norm = normalize(vStatueWorldNormal);
                    vec3 viewDir = normalize(cameraPosition - vStatueWorldPos);

                    float NdotV = abs(dot(norm, viewDir));
                    float fresnel = 1.0 - NdotV;
                    float silhouetteRim = smoothstep(0.38, 0.86, fresnel);
                    float sharpOuterEdge = smoothstep(0.72, 0.95, fresnel) * 1.8;

                    vec3 dNdx = dFdx(norm);
                    vec3 dNdy = dFdy(norm);
                    float normalCurv = length(dNdx) + length(dNdy);
                    float foldCrease = smoothstep(0.06, 0.28, normalCurv) * 2.2;

                    float drapeContours = smoothstep(0.85, 0.96, sin((vStatueWorldPos.y * 3.8 + vStatueWorldPos.x * 0.4))) * 0.4;
                    float laserScanY = mod(uTime * 9.0, 42.0) + 5.0;
                    float scanPulse = exp(-pow((vStatueWorldPos.y - laserScanY) * 0.35, 2.0)) * 0.7;

                    float laserEdgeMask = clamp(sharpOuterEdge + silhouetteRim * 0.8 + foldCrease + (drapeContours + scanPulse) * (silhouetteRim + foldCrease + 0.2), 0.0, 1.0);

                    vec3 cNeonLaserGreen = vec3(0.28, 1.0, 0.22);
                    vec3 cLaserLimeGold  = vec3(0.88, 1.0, 0.35);
                    vec3 cLaserCoreHot   = vec3(0.96, 1.0, 0.92);
                    vec3 laserGlowColor  = mix(cNeonLaserGreen, cLaserLimeGold, smoothstep(0.35, 0.85, laserEdgeMask));
                    laserGlowColor       = mix(laserGlowColor, cLaserCoreHot, sharpOuterEdge * 0.7);

                    if (uPhaseIndex == 5) {
                      // Theme 6: Neon Laser Contour Outline
                      vec3 darkSilhouette = gl_FragColor.rgb * 0.03 + vec3(0.008, 0.012, 0.010);
                      gl_FragColor.rgb = mix(darkSilhouette, laserGlowColor * 2.4, laserEdgeMask);
                    }
                    else if (uPhaseIndex == 6) {
                      // Theme 7: Thermal Prismatic Rainbow Spectrum (Image 2)
                      float hRel = clamp((vStatueWorldPos.y - 5.5) / 38.0, 0.0, 1.0);
                      float wave = sin(hRel * 12.0 - uTime * 2.2 + vStatueWorldPos.x * 0.3) * 0.5 + 0.5;

                      vec3 cHeadGold     = vec3(1.0, 0.92, 0.18); // Golden-yellow head
                      vec3 cShawlCyan    = vec3(0.05, 0.88, 0.95); // Cyan shawl
                      vec3 cShawlMagenta = vec3(0.95, 0.12, 0.78); // Magenta prismatic band
                      vec3 cTorsoRed     = vec3(1.0, 0.18, 0.08); // Scarlet crimson midsection
                      vec3 cLegsGreen    = vec3(0.08, 0.96, 0.35); // Emerald laser green dhoti
                      vec3 cFeetCyan     = vec3(0.15, 0.78, 1.0);  // Cyan plinth base

                      vec3 rainbow = cFeetCyan;
                      rainbow = mix(rainbow, cLegsGreen, smoothstep(0.05, 0.28, hRel));
                      rainbow = mix(rainbow, cTorsoRed, smoothstep(0.28, 0.48, hRel));
                      rainbow = mix(rainbow, mix(cShawlMagenta, cShawlCyan, wave), smoothstep(0.48, 0.72, hRel));
                      rainbow = mix(rainbow, cHeadGold, smoothstep(0.72, 0.88, hRel));

                      rainbow += laserGlowColor * laserEdgeMask * 0.55;
                      gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.15, rainbow * 1.55, 0.93);
                    }
                    else if (uPhaseIndex == 7) {
                      // Theme 8: Realistic Traditional Attire ("Sardar in True Colors" - Image 3)
                      float hRel = clamp((vStatueWorldPos.y - 5.5) / 38.0, 0.0, 1.0);
                      float xOffset = abs(vStatueWorldPos.x - (-6.0));

                      vec3 cSkin       = vec3(0.86, 0.62, 0.48); // Natural skin tone
                      vec3 cShawlGold  = vec3(0.96, 0.78, 0.20); // Golden mustard shawl
                      vec3 cShawlGreen = vec3(0.12, 0.58, 0.24); // Emerald border stripe
                      vec3 cKurtaDark  = vec3(0.24, 0.18, 0.16); // Charcoal brown kurta vest
                      vec3 cDhotiWhite = vec3(0.95, 0.95, 0.98); // White cotton dhoti
                      vec3 cLeather    = vec3(0.38, 0.24, 0.16); // Leather footwear

                      float borderStripe = smoothstep(0.08, 0.02, abs(sin(vStatueWorldPos.y * 3.5))) * 0.8;
                      vec3 shawlPattern = mix(cShawlGold, cShawlGreen, borderStripe);

                      vec2 faceUv = vec2(vStatueWorldPos.x - (-6.0), vStatueWorldPos.y - 34.8);
                      float glasses = smoothstep(0.12, 0.04, abs(length(vec2(abs(faceUv.x) - 0.42, faceUv.y)) - 0.35));
                      vec3 skinWithFeatures = mix(cSkin, vec3(0.15, 0.12, 0.10), glasses * 0.9);

                      vec3 attire = cLeather;
                      attire = mix(attire, cDhotiWhite, smoothstep(0.04, 0.12, hRel));
                      attire = mix(attire, mix(cKurtaDark, shawlPattern, smoothstep(0.6, 2.2, xOffset)), smoothstep(0.48, 0.56, hRel));
                      attire = mix(attire, shawlPattern, smoothstep(0.56, 0.78, hRel));
                      attire = mix(attire, skinWithFeatures, smoothstep(0.78, 0.88, hRel));

                      attire *= 0.75 + 0.25 * foldCrease;
                      gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.18, attire * 1.4, 0.96);
                    }
                    else if (uPhaseIndex == 8) {
                      // Theme 9: Celestial Cyan & Saffron Split (Image 4)
                      float hRel = clamp((vStatueWorldPos.y - 5.5) / 38.0, 0.0, 1.0);
                      vec3 cUpperCyan   = vec3(0.22, 0.80, 1.0); // Celestial cyan wash
                      vec3 cLowerOrange = vec3(1.0, 0.34, 0.10); // Saffron-crimson wash

                      float splitGrad = smoothstep(0.28, 0.36, hRel);
                      vec3 splitWash = mix(cLowerOrange, cUpperCyan, splitGrad);
                      splitWash += laserGlowColor * laserEdgeMask * 0.35;

                      gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.15, splitWash * 1.6, 0.94);
                    }
                    else if (uIsFlagTheme > 0.5 || uPhaseIndex == 9) {
                      // Theme 10: Grand Tiranga Finale
                      float hRel = clamp((vStatueWorldPos.y - 5.5) / 38.0, 0.0, 1.0);

                      vec3 cSaffron = vec3(1.0, 0.28, 0.0);
                      vec3 cWhite   = vec3(0.98, 0.98, 1.0);
                      vec3 cGreen   = vec3(0.02, 0.58, 0.18);
                      vec3 cNavy    = vec3(0.0, 0.08, 0.72);

                      vec2 cUv = vec2(vStatueWorldPos.x - (-6.0), (vStatueWorldPos.y - 23.5));
                      float cDist = length(cUv);
                      float cAngle = atan(cUv.y, cUv.x);

                      float spokes = smoothstep(0.70, 0.94, cos(cAngle * 24.0));
                      float outerRim = smoothstep(0.20, 0.04, abs(cDist - 2.2));
                      float spokeBand = smoothstep(0.40, 0.60, cDist) * (1.0 - smoothstep(2.0, 2.2, cDist));
                      float hub = 1.0 - smoothstep(0.35, 0.48, cDist);

                      float chakraMask = clamp(outerRim + (spokes * spokeBand) + hub, 0.0, 1.0);
                      vec3 whiteWithChakra = mix(cWhite, cNavy, chakraMask * 0.96);

                      vec3 flagOverlay = mix(cGreen, whiteWithChakra, smoothstep(0.26, 0.36, hRel));
                      flagOverlay = mix(flagOverlay, cSaffron, smoothstep(0.58, 0.68, hRel));

                      gl_FragColor.rgb = mix(gl_FragColor.rgb * 1.5, flagOverlay * 1.5, 0.94);
                    }
                    else if (uPhaseIndex >= 0) {
                      gl_FragColor.rgb += laserGlowColor * laserEdgeMask * 0.22;
                    }
                  `
                );
              };
              mat.customProgramCacheKey = () => "tiranga_laser_outline_dynamic_program_v3";
              mat.needsUpdate = true;
            } else {
              mat.onBeforeCompile = () => {};
              mat.customProgramCacheKey = () => "standard_bronze";
              mat.roughness = 0.52;
              mat.metalness = 0.36;
              mat.needsUpdate = true;
            }
          }
        });
      }
    });
  }, [model, isLightShow, shaderUniforms]);

  // Instant zero-recompilation Day/Night bronze color update
  useEffect(() => {
    if (isLightShow) return;
    model.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (mat && mat instanceof THREE.MeshStandardMaterial) {
            mat.color.set(isNight ? "#8e7356" : "#9c8062");
            mat.emissive.set(isNight ? "#2a1d12" : "#000000");
            mat.emissiveIntensity = isNight ? 0.18 : 0;
          }
        });
      }
    });
  }, [model, isNight, isLightShow]);

  return (
    <group position={position} scale={scale} rotation-y={-Math.PI * 0.14}>
      <primitive object={model} />
    </group>
  );
}

