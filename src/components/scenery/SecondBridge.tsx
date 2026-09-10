import * as THREE from "three";
import { useMemo, useEffect } from "react";

interface SecondBridgeProps {
  isNight?: boolean;
  isLightShow?: boolean;
}

/**
 * Authentic 3D reproduction of the Second Bridge (Service / Approach Trestle Bridge)
 * connecting the right/northern flank of Sadhu Bet Island to the mainland riverbank.
 * Exact match to the reference photo:
 * 1. White metal web lattice trestle pier towers (bents) with intricate diagonal X & V web bracing.
 * 2. Continuous double-I-beam terracotta / rust-red steel girder deck structure.
 * 3. Steel safety railings, pedestrian walkway, and vintage street lighting lampposts (NO vehicles).
 * 4. Sadhu Bet island sandstone abutment portal and mainland landing turnaround concourse.
 * 5. Rocky riverbed shoal crags around the pier footings.
 */
export function SecondBridge({ isNight = false, isLightShow = false }: SecondBridgeProps) {
  // Geometric bridge span parameters
  // From island right flank (x1=8, z1=-15) to mainland embankment (x2=98, z2=-42)
  const startPt = useMemo(() => new THREE.Vector2(8.0, -15.0), []);
  const endPt = useMemo(() => new THREE.Vector2(98.0, -42.0), []);
  const spanVector = useMemo(() => new THREE.Vector2().subVectors(endPt, startPt), [startPt, endPt]);
  const spanLength = useMemo(() => spanVector.length(), [spanVector]); // ~94.0m
  const spanAngle = useMemo(() => Math.atan2(spanVector.y, spanVector.x), [spanVector]); // Rotation around Y
  const centerPos = useMemo(
    () => new THREE.Vector3((startPt.x + endPt.x) * 0.5, 0.95, (startPt.y + endPt.y) * 0.5),
    [startPt, endPt]
  );

  const materials = useMemo(() => {
    return {
      steelGirder: new THREE.MeshStandardMaterial({
        color: "#64748b",
        roughness: 0.45,
        metalness: 0.65,
      }),
      steelGirderTrim: new THREE.MeshStandardMaterial({
        color: "#475569",
        roughness: 0.5,
        metalness: 0.6,
      }),
      deckSurface: new THREE.MeshStandardMaterial({
        color: "#333d49",
        roughness: 0.88,
        metalness: 0.08,
      }),
      walkwayPaving: new THREE.MeshStandardMaterial({
        color: "#94a3b8",
        roughness: 0.76,
      }),
      concretePier: new THREE.MeshStandardMaterial({
        color: "#7b8492",
        roughness: 0.84,
      }),
      sandstoneAbutment: new THREE.MeshStandardMaterial({
        color: "#b44f3d",
        roughness: 0.72,
      }),
      rockShoalDark: new THREE.MeshStandardMaterial({
        color: "#483e35",
        roughness: 0.95,
        flatShading: true,
      }),
      rockShoalWarm: new THREE.MeshStandardMaterial({
        color: "#6a5c4e",
        roughness: 0.92,
        flatShading: true,
      }),
      whiteMetalPillar: new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.28,
        metalness: 0.65,
      }),
      whiteMetalPillarTrim: new THREE.MeshStandardMaterial({
        color: "#e2e8f0",
        roughness: 0.32,
        metalness: 0.55,
      }),
      whiteSteel: new THREE.MeshStandardMaterial({
        color: "#f1f5f9",
        roughness: 0.3,
        metalness: 0.45,
      }),
      lampGlow: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#fff7db"),
        emissiveIntensity: 0.5,
        roughness: 0.1,
      }),
      railingSteel: new THREE.MeshStandardMaterial({
        color: "#f1f5f9",
        roughness: 0.25,
        metalness: 0.8,
      }),
    };
  }, []);

  useEffect(() => {
    materials.steelGirder.color.set(isNight ? "#334155" : "#64748b");
    materials.steelGirderTrim.color.set(isNight ? "#1e293b" : "#475569");
    materials.deckSurface.color.set(isNight ? "#1e242d" : "#333d49");
    materials.walkwayPaving.color.set(isNight ? "#475569" : "#94a3b8");
    materials.concretePier.color.set(isNight ? "#3b424d" : "#7b8492");
    materials.sandstoneAbutment.color.set(isNight ? "#782d22" : "#b44f3d");
    materials.rockShoalDark.color.set(isNight ? "#231e1a" : "#483e35");
    materials.rockShoalWarm.color.set(isNight ? "#362c24" : "#6a5c4e");
    materials.whiteMetalPillar.color.set(isNight ? "#cbd5e1" : "#f8fafc");
    materials.whiteMetalPillarTrim.color.set(isNight ? "#94a3b8" : "#e2e8f0");
    materials.railingSteel.color.set(isNight ? "#cbd5e1" : "#f1f5f9");
    materials.lampGlow.emissiveIntensity = isNight ? 5.0 : 0.5;
  }, [isNight, materials]);


  // Trestle Pier relative positions along the bridge span (from 0 to spanLength)
  const pierDistances = useMemo(() => [15.0, 29.0, 43.0, 57.0, 71.0, 84.0], []);

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================= */}
      {/* 1. CONTINUOUS STEEL TRESTLE BRIDGE SPAN                   */}
      {/* ========================================================= */}
      <group position={[centerPos.x, centerPos.y, centerPos.z]} rotation-y={-spanAngle}>
        {/* Main Deck Slab */}
        <mesh position={[0, 0, 0]} material={materials.deckSurface} receiveShadow castShadow>
          <boxGeometry args={[spanLength, 0.45, 5.2]} />
        </mesh>

        {/* Central Paved Pedestrian Walkway */}
        <mesh position={[0, 0.23, 0]} material={materials.walkwayPaving} receiveShadow>
          <boxGeometry args={[spanLength, 0.02, 3.8]} />
        </mesh>

        {/* Longitudinal Deep Steel I-Beams (North & South Deck Edges) */}
        <mesh position={[0, -0.4, 2.5]} material={materials.steelGirder} castShadow receiveShadow>
          <boxGeometry args={[spanLength + 0.5, 0.9, 0.25]} />
        </mesh>
        <mesh position={[0, -0.4, -2.5]} material={materials.steelGirder} castShadow receiveShadow>
          <boxGeometry args={[spanLength + 0.5, 0.9, 0.25]} />
        </mesh>

        {/* I-Beam Top & Bottom Flanges */}
        <mesh position={[0, 0.05, 2.5]} material={materials.steelGirderTrim}>
          <boxGeometry args={[spanLength, 0.1, 0.45]} />
        </mesh>
        <mesh position={[0, -0.85, 2.5]} material={materials.steelGirderTrim}>
          <boxGeometry args={[spanLength, 0.1, 0.45]} />
        </mesh>
        <mesh position={[0, 0.05, -2.5]} material={materials.steelGirderTrim}>
          <boxGeometry args={[spanLength, 0.1, 0.45]} />
        </mesh>
        <mesh position={[0, -0.85, -2.5]} material={materials.steelGirderTrim}>
          <boxGeometry args={[spanLength, 0.1, 0.45]} />
        </mesh>

        {/* Under-Deck Transverse Cross Beams every 3.2m */}
        {Array.from({ length: Math.floor(spanLength / 3.2) }).map((_, i) => {
          const bx = -spanLength * 0.5 + 1.6 + i * 3.2;
          return (
            <mesh key={`cross-beam-${i}`} position={[bx, -0.65, 0]} material={materials.steelGirderTrim}>
              <boxGeometry args={[0.18, 0.5, 5.0]} />
            </mesh>
          );
        })}

        {/* Safety Steel Handrails (North Side) */}
        <group position={[0, 0.25, 2.55]}>
          {/* Top Rail */}
          <mesh position={[0, 0.85, 0]} material={materials.railingSteel}>
            <cylinderGeometry args={[0.04, 0.04, spanLength, 6]} />
          </mesh>
          {/* Middle Rail */}
          <mesh position={[0, 0.45, 0]} material={materials.railingSteel}>
            <cylinderGeometry args={[0.03, 0.03, spanLength, 6]} />
          </mesh>
          {/* Bottom Kickplate Curb */}
          <mesh position={[0, 0.08, 0]} material={materials.steelGirderTrim}>
            <boxGeometry args={[spanLength, 0.16, 0.06]} />
          </mesh>
          {/* Vertical Stanchion Posts */}
          {Array.from({ length: Math.floor(spanLength / 2.0) }).map((_, i) => {
            const px = -spanLength * 0.5 + 1.0 + i * 2.0;
            return (
              <mesh key={`post-n-${i}`} position={[px, 0.45, 0]} material={materials.railingSteel}>
                <boxGeometry args={[0.06, 0.9, 0.06]} />
              </mesh>
            );
          })}
        </group>

        {/* Safety Steel Handrails (South Side) */}
        <group position={[0, 0.25, -2.55]}>
          {/* Top Rail */}
          <mesh position={[0, 0.85, 0]} material={materials.railingSteel}>
            <cylinderGeometry args={[0.04, 0.04, spanLength, 6]} />
          </mesh>
          {/* Middle Rail */}
          <mesh position={[0, 0.45, 0]} material={materials.railingSteel}>
            <cylinderGeometry args={[0.03, 0.03, spanLength, 6]} />
          </mesh>
          {/* Bottom Kickplate Curb */}
          <mesh position={[0, 0.08, 0]} material={materials.steelGirderTrim}>
            <boxGeometry args={[spanLength, 0.16, 0.06]} />
          </mesh>
          {/* Vertical Stanchion Posts */}
          {Array.from({ length: Math.floor(spanLength / 2.0) }).map((_, i) => {
            const px = -spanLength * 0.5 + 1.0 + i * 2.0;
            return (
              <mesh key={`post-s-${i}`} position={[px, 0.45, 0]} material={materials.railingSteel}>
                <boxGeometry args={[0.06, 0.9, 0.06]} />
              </mesh>
            );
          })}
        </group>

        {/* Streetlight Lampposts along the Bridge Deck */}
        {Array.from({ length: Math.floor(spanLength / 13.5) }).map((_, i) => {
          const lx = -spanLength * 0.5 + 6.0 + i * 13.5;
          return (
            <group key={`lamp-${i}`} position={[lx, 0.25, 0]}>
              {/* North Lamp */}
              <group position={[0, 0, 2.5]}>
                <mesh position={[0, 1.6, 0]} material={materials.whiteSteel}>
                  <cylinderGeometry args={[0.05, 0.08, 3.2, 6]} />
                </mesh>
                <mesh position={[0, 3.2, -0.25]} material={materials.lampGlow}>
                  <sphereGeometry args={[0.16, 8, 8]} />
                </mesh>
              </group>
              {/* South Lamp */}
              <group position={[0, 0, -2.5]}>
                <mesh position={[0, 1.6, 0]} material={materials.whiteSteel}>
                  <cylinderGeometry args={[0.05, 0.08, 3.2, 6]} />
                </mesh>
                <mesh position={[0, 3.2, 0.25]} material={materials.lampGlow}>
                  <sphereGeometry args={[0.16, 8, 8]} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 2. WHITE METAL WEB LATTICE DESIGN PILLARS & ROCKY SHOALS */}
      {/* ========================================================= */}
      {pierDistances.map((d, pierIdx) => {
        // Compute world (x, z) of this trestle pier along the bridge span
        const t = d / spanLength;
        const px = THREE.MathUtils.lerp(startPt.x, endPt.x, t);
        const pz = THREE.MathUtils.lerp(startPt.y, endPt.y, t);
        const towerHeight = 4.8;
        const towerTopY = 0.45;
        const towerBaseY = towerTopY - towerHeight; // in riverbed ~ -4.35

        return (
          <group key={`white-web-pier-${pierIdx}`} position={[px, 0, pz]} rotation-y={-spanAngle}>
            {/* Top Heavy White Steel Pier Cap Beam */}
            <mesh position={[0, towerTopY - 0.15, 0]} material={materials.whiteMetalPillarTrim} castShadow receiveShadow>
              <boxGeometry args={[2.2, 0.3, 5.4]} />
            </mesh>
            {/* White Metal Bearing Blocks */}
            <mesh position={[0, towerTopY + 0.05, 2.2]} material={materials.whiteMetalPillar}>
              <boxGeometry args={[0.6, 0.1, 0.6]} />
            </mesh>
            <mesh position={[0, towerTopY + 0.05, -2.2]} material={materials.whiteMetalPillar}>
              <boxGeometry args={[0.6, 0.1, 0.6]} />
            </mesh>

            {/* 4 Sturdy Vertical White Metal Trestle Columns */}
            {[-0.75, 0.75].map((lx) =>
              [-1.8, 1.8].map((lz) => {
                const legMidY = (towerTopY + towerBaseY) * 0.5;
                const legLen = towerHeight;
                return (
                  <mesh
                    key={`white-leg-${lx}-${lz}`}
                    position={[lx, legMidY, lz]}
                    material={materials.whiteMetalPillar}
                    castShadow
                  >
                    <boxGeometry args={[0.22, legLen, 0.22]} />
                  </mesh>
                );
              })
            )}

            {/* Multi-Tier Web Lattice Design with Diagonal X & V Bracing */}
            {[1, 2, 3, 4].map((tier) => {
              const ty = towerTopY - tier * 1.05;
              return (
                <group key={`web-tier-${tier}`} position={[0, ty, 0]}>
                  {/* Horizontal Perimeter Web Tie Girders */}
                  <mesh position={[0, 0, 1.8]} material={materials.whiteMetalPillarTrim}>
                    <boxGeometry args={[1.5, 0.14, 0.14]} />
                  </mesh>
                  <mesh position={[0, 0, -1.8]} material={materials.whiteMetalPillarTrim}>
                    <boxGeometry args={[1.5, 0.14, 0.14]} />
                  </mesh>
                  <mesh position={[0.75, 0, 0]} material={materials.whiteMetalPillarTrim}>
                    <boxGeometry args={[0.14, 0.14, 3.6]} />
                  </mesh>
                  <mesh position={[-0.75, 0, 0]} material={materials.whiteMetalPillarTrim}>
                    <boxGeometry args={[0.14, 0.14, 3.6]} />
                  </mesh>

                  {/* Diagonal Web Lattice X-Braces (Front Face) */}
                  <mesh position={[0, 0.5, 1.8]} rotation-z={0.52} material={materials.whiteMetalPillar}>
                    <boxGeometry args={[0.09, 1.35, 0.09]} />
                  </mesh>
                  <mesh position={[0, 0.5, 1.8]} rotation-z={-0.52} material={materials.whiteMetalPillar}>
                    <boxGeometry args={[0.09, 1.35, 0.09]} />
                  </mesh>

                  {/* Diagonal Web Lattice X-Braces (Rear Face) */}
                  <mesh position={[0, 0.5, -1.8]} rotation-z={0.52} material={materials.whiteMetalPillar}>
                    <boxGeometry args={[0.09, 1.35, 0.09]} />
                  </mesh>
                  <mesh position={[0, 0.5, -1.8]} rotation-z={-0.52} material={materials.whiteMetalPillar}>
                    <boxGeometry args={[0.09, 1.35, 0.09]} />
                  </mesh>

                  {/* Side Faces Multi-V Web Lattice Bracing */}
                  {[-1.0, 1.0].map((subOffset, subIdx) => (
                    <group key={`side-web-${subIdx}`} position={[0, 0, subOffset]}>
                      <mesh position={[0.75, 0.5, 0]} rotation-x={0.48} material={materials.whiteMetalPillar}>
                        <boxGeometry args={[0.09, 0.09, 1.4]} />
                      </mesh>
                      <mesh position={[0.75, 0.5, 0]} rotation-x={-0.48} material={materials.whiteMetalPillar}>
                        <boxGeometry args={[0.09, 0.09, 1.4]} />
                      </mesh>
                      <mesh position={[-0.75, 0.5, 0]} rotation-x={0.48} material={materials.whiteMetalPillar}>
                        <boxGeometry args={[0.09, 0.09, 1.4]} />
                      </mesh>
                      <mesh position={[-0.75, 0.5, 0]} rotation-x={-0.48} material={materials.whiteMetalPillar}>
                        <boxGeometry args={[0.09, 0.09, 1.4]} />
                      </mesh>
                    </group>
                  ))}

                  {/* Internal Diagonal Cross-Sway Bracing */}
                  <mesh position={[0, 0.5, 0]} rotation-x={0.36} rotation-z={0.28} material={materials.whiteMetalPillarTrim}>
                    <boxGeometry args={[0.06, 0.06, 3.8]} />
                  </mesh>
                  <mesh position={[0, 0.5, 0]} rotation-x={-0.36} rotation-z={-0.28} material={materials.whiteMetalPillarTrim}>
                    <boxGeometry args={[0.06, 0.06, 3.8]} />
                  </mesh>
                </group>
              );
            })}

            {/* Reinforced Concrete Plinth Footing Pad */}
            <mesh position={[0, towerBaseY + 0.5, 0]} material={materials.concretePier} receiveShadow castShadow>
              <boxGeometry args={[2.8, 1.2, 5.8]} />
            </mesh>

            {/* Web Lattice Structural Uplight Fixtures (Night Mode) */}
            {isNight && (
              <group position={[0, towerBaseY + 1.1, 0]}>
                <mesh position={[0, 0, 2.2]}>
                  <sphereGeometry args={[0.18, 8, 8]} />
                  <meshBasicMaterial color={isLightShow ? "#38bdf8" : "#fff7db"} />
                </mesh>
                <mesh position={[0, 0, -2.2]}>
                  <sphereGeometry args={[0.18, 8, 8]} />
                  <meshBasicMaterial color={isLightShow ? "#38bdf8" : "#fff7db"} />
                </mesh>
              </group>
            )}

            {/* Natural Rocky Shoal Islet Outcrops emerging from the water around each trestle */}
            <group position={[0, -2.6, 0]}>
              <mesh position={[0.4, 0, 0.3]} material={materials.rockShoalDark} receiveShadow castShadow>
                <cylinderGeometry args={[3.2, 4.8, 1.6, 8]} />
              </mesh>
              <mesh position={[-1.2, -0.2, 1.4]} material={materials.rockShoalWarm} receiveShadow castShadow>
                <dodecahedronGeometry args={[1.8, 1]} />
              </mesh>
              <mesh position={[1.4, -0.3, -1.6]} material={materials.rockShoalDark} receiveShadow castShadow>
                <dodecahedronGeometry args={[1.6, 1]} />
              </mesh>
              <mesh position={[-0.8, -0.4, -1.8]} material={materials.rockShoalWarm} receiveShadow castShadow>
                <dodecahedronGeometry args={[1.5, 1]} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* ========================================================= */}
      {/* 3. SADHU BET ISLAND ABUTMENT & CONNECTION PLATFORM        */}
      {/* ========================================================= */}
      <group position={[startPt.x, 0.3, startPt.y]} rotation-y={-spanAngle}>
        {/* Heavy Terracotta Sandstone Abutment Pier */}
        <mesh position={[-1.8, 0.1, 0]} material={materials.sandstoneAbutment} receiveShadow castShadow>
          <boxGeometry args={[4.2, 1.8, 6.4]} />
        </mesh>
        {/* Sandstone Paved Transition Plaza Deck */}
        <mesh position={[-1.8, 0.95, 0]} material={materials.walkwayPaving} receiveShadow>
          <boxGeometry args={[4.0, 0.1, 5.8]} />
        </mesh>
        {/* Stepped Safety Parapet Walls */}
        <mesh position={[-1.8, 1.4, 3.0]} material={materials.sandstoneAbutment} castShadow>
          <boxGeometry args={[4.0, 0.8, 0.35]} />
        </mesh>
        <mesh position={[-1.8, 1.4, -3.0]} material={materials.sandstoneAbutment} castShadow>
          <boxGeometry args={[4.0, 0.8, 0.35]} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 4. MAINLAND LANDING ABUTMENT & TURNAROUND CONCOURSE       */}
      {/* ========================================================= */}
      <group position={[endPt.x, 0.3, endPt.y]} rotation-y={-spanAngle}>
        {/* Mainland Sandstone Abutment Foundation */}
        <mesh position={[2.2, 0.1, 0]} material={materials.sandstoneAbutment} receiveShadow castShadow>
          <boxGeometry args={[5.2, 1.8, 7.2]} />
        </mesh>
        {/* Paved Landing Plaza connecting towards Riverbank Road */}
        <mesh position={[3.2, 0.95, 0]} material={materials.walkwayPaving} receiveShadow>
          <boxGeometry args={[6.8, 0.1, 6.4]} />
        </mesh>
        {/* Concrete Safety Curbs & Guard Walls */}
        <mesh position={[3.2, 1.4, 3.3]} material={materials.sandstoneAbutment} castShadow>
          <boxGeometry args={[6.8, 0.8, 0.35]} />
        </mesh>
        <mesh position={[3.2, 1.4, -3.3]} material={materials.sandstoneAbutment} castShadow>
          <boxGeometry args={[6.8, 0.8, 0.35]} />
        </mesh>

        {/* Security / Checkpoint Pavilion Booth */}
        <group position={[5.4, 1.0, 2.2]}>
          <mesh position={[0, 1.1, 0]} material={materials.whiteSteel} castShadow>
            <boxGeometry args={[1.8, 2.2, 1.6]} />
          </mesh>
          <mesh position={[0, 2.25, 0]} material={materials.steelGirderTrim} castShadow>
            <boxGeometry args={[2.1, 0.15, 1.9]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
