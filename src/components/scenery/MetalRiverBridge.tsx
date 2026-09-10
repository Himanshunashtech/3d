import * as THREE from "three";
import { useMemo, useEffect } from "react";
import { getBridgeRiverCrossing } from "./riverPath";

interface MetalRiverBridgeProps {
  isNight?: boolean;
  isLightShow?: boolean;
}

/**
 * Creates a parametric curved arch rib geometry for the metal bridge superstructure
 */
function createArchRibGeometry(spanLength: number, archHeight: number, segments = 40) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = -spanLength * 0.5 + t * spanLength;
    // Parabolic arch curve
    const y = 4 * archHeight * t * (1 - t);
    points.push(new THREE.Vector3(x, y, 0));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, segments, 0.32, 8, false);
}

/**
 * Metal River Bridge (Through-Truss / Tied-Arch Highway Bridge)
 * Perfectly spans the exact width of the Narmada River channel, securely connecting
 * both the western mountain bank and the eastern riverside highway.
 */
export function MetalRiverBridge({ isNight = false, isLightShow = false }: MetalRiverBridgeProps) {
  // Exact river crossing parameters: center, west bank, east bank, width & angle
  const crossing = useMemo(() => getBridgeRiverCrossing(-340), []);
  const spanLength = useMemo(() => crossing.riverWidth, [crossing]); // Exactly matches river width (236m)
  const spanAngle = useMemo(() => crossing.spanAngle, [crossing]);
  const centerPos = useMemo(
    () => new THREE.Vector3(crossing.center.x, 2.2, crossing.center.z),
    [crossing]
  );

  const materials = useMemo(() => {
    return {
      structuralSteel: new THREE.MeshStandardMaterial({
        color: "#475569",
        roughness: 0.38,
        metalness: 0.72,
      }),
      steelGirderDark: new THREE.MeshStandardMaterial({
        color: "#334155",
        roughness: 0.42,
        metalness: 0.78,
      }),
      brightSteelTruss: new THREE.MeshStandardMaterial({
        color: "#e2e8f0",
        roughness: 0.3,
        metalness: 0.8,
      }),
      orangeSafetyTruss: new THREE.MeshStandardMaterial({
        color: "#c2410c",
        roughness: 0.5,
        metalness: 0.3,
      }),
      roadAsphalt: new THREE.MeshStandardMaterial({
        color: "#1f2937",
        roughness: 0.92,
        metalness: 0.05,
      }),
      yellowRoadMarking: new THREE.MeshStandardMaterial({
        color: "#eab308",
        roughness: 0.4,
      }),
      whiteRoadMarking: new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.35,
      }),
      concretePier: new THREE.MeshStandardMaterial({
        color: "#6b7280",
        roughness: 0.85,
      }),
      abutmentStone: new THREE.MeshStandardMaterial({
        color: "#78350f",
        roughness: 0.8,
      }),
      stainlessRailing: new THREE.MeshStandardMaterial({
        color: "#f1f5f9",
        roughness: 0.25,
        metalness: 0.85,
      }),
      walkwayPaving: new THREE.MeshStandardMaterial({
        color: "#9ca3af",
        roughness: 0.75,
      }),
      streetLampGlow: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#fffbeb"),
        emissiveIntensity: 0.8,
        roughness: 0.1,
      }),
      navRedLight: new THREE.MeshStandardMaterial({
        color: "#ef4444",
        emissive: new THREE.Color("#dc2626"),
        emissiveIntensity: 1.2,
      }),
      navGreenLight: new THREE.MeshStandardMaterial({
        color: "#22c55e",
        emissive: new THREE.Color("#16a34a"),
        emissiveIntensity: 1.2,
      }),
      archNeonGlow: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.1,
        roughness: 0.1,
      }),
    };
  }, []);

  useEffect(() => {
    materials.structuralSteel.color.set(isNight ? "#334155" : "#475569");
    materials.steelGirderDark.color.set(isNight ? "#1e293b" : "#334155");
    materials.brightSteelTruss.color.set(isNight ? "#cbd5e1" : "#e2e8f0");
    materials.orangeSafetyTruss.color.set(isNight ? "#9a3412" : "#c2410c");
    materials.roadAsphalt.color.set(isNight ? "#111827" : "#1f2937");
    materials.yellowRoadMarking.color.set(isNight ? "#ca8a04" : "#eab308");
    materials.whiteRoadMarking.color.set(isNight ? "#94a3b8" : "#f8fafc");
    materials.concretePier.color.set(isNight ? "#374151" : "#6b7280");
    materials.abutmentStone.color.set(isNight ? "#451a03" : "#78350f");
    materials.stainlessRailing.color.set(isNight ? "#94a3b8" : "#f1f5f9");
    materials.walkwayPaving.color.set(isNight ? "#4b5563" : "#9ca3af");
    materials.streetLampGlow.emissiveIntensity = isNight ? 5.5 : 0.8;
    materials.navRedLight.emissiveIntensity = isNight ? 4.0 : 1.2;
    materials.navGreenLight.emissiveIntensity = isNight ? 4.0 : 1.2;
    materials.archNeonGlow.emissive.set(isNight ? (isLightShow ? "#38bdf8" : "#f59e0b") : "#ffffff");
    materials.archNeonGlow.emissiveIntensity = isNight ? (isLightShow ? 6.0 : 4.5) : 0.1;
  }, [isNight, isLightShow, materials]);

  // Main arch spans: 5 graceful tied-arch truss sections spanning between bank abutments
  const numSpans = 5;
  const abutmentSetback = 10;
  const subSpanLen = (spanLength - abutmentSetback) / numSpans;
  const archHeight = 9.8;

  const archGeom = useMemo(() => createArchRibGeometry(subSpanLen, archHeight), [subSpanLen, archHeight]);

  return (
    <group position={[centerPos.x, centerPos.y, centerPos.z]} rotation-y={-spanAngle}>
      {/* ========================================================= */}
      {/* 1. CONTINUOUS STEEL DECK STRUCTURE & ROADWAY              */}
      {/* ========================================================= */}
      {/* Heavy Steel Box Girders under deck */}
      <mesh position={[0, -0.6, 3.8]} material={materials.structuralSteel} castShadow receiveShadow>
        <boxGeometry args={[spanLength, 1.2, 0.55]} />
      </mesh>
      <mesh position={[0, -0.6, -3.8]} material={materials.structuralSteel} castShadow receiveShadow>
        <boxGeometry args={[spanLength, 1.2, 0.55]} />
      </mesh>
      <mesh position={[0, -0.6, 0]} material={materials.steelGirderDark} castShadow receiveShadow>
        <boxGeometry args={[spanLength, 0.9, 0.6]} />
      </mesh>

      {/* Transverse Cross Floor-Beams */}
      {Array.from({ length: 46 }).map((_, i) => {
        const bx = -spanLength * 0.5 + 4 + i * ((spanLength - 8) / 45);
        return (
          <mesh key={i} position={[bx, -0.45, 0]} material={materials.structuralSteel} castShadow>
            <boxGeometry args={[0.35, 0.7, 8.4]} />
          </mesh>
        );
      })}

      {/* Main Bridge Concrete Slab Base */}
      <mesh position={[0, 0, 0]} material={materials.concretePier} receiveShadow>
        <boxGeometry args={[spanLength, 0.45, 8.8]} />
      </mesh>

      {/* Asphalt Highway Deck Surface */}
      <mesh position={[0, 0.24, 0]} material={materials.roadAsphalt} receiveShadow>
        <boxGeometry args={[spanLength, 0.05, 6.4]} />
      </mesh>

      {/* Center Yellow Double Road Markings */}
      <mesh position={[0, 0.28, 0.08]} material={materials.yellowRoadMarking}>
        <boxGeometry args={[spanLength - 4, 0.02, 0.12]} />
      </mesh>
      <mesh position={[0, 0.28, -0.08]} material={materials.yellowRoadMarking}>
        <boxGeometry args={[spanLength - 4, 0.02, 0.12]} />
      </mesh>

      {/* White Edge Lines */}
      <mesh position={[0, 0.28, 3.0]} material={materials.whiteRoadMarking}>
        <boxGeometry args={[spanLength - 4, 0.02, 0.15]} />
      </mesh>
      <mesh position={[0, 0.28, -3.0]} material={materials.whiteRoadMarking}>
        <boxGeometry args={[spanLength - 4, 0.02, 0.15]} />
      </mesh>

      {/* Raised Pedestrian Sidewalks */}
      <mesh position={[0, 0.38, 3.75]} material={materials.walkwayPaving} receiveShadow>
        <boxGeometry args={[spanLength, 0.22, 1.2]} />
      </mesh>
      <mesh position={[0, 0.38, -3.75]} material={materials.walkwayPaving} receiveShadow>
        <boxGeometry args={[spanLength, 0.22, 1.2]} />
      </mesh>

      {/* Steel Safety Barrier & Guardrails */}
      <mesh position={[0, 0.58, 3.2]} material={materials.structuralSteel} castShadow>
        <boxGeometry args={[spanLength, 0.28, 0.22]} />
      </mesh>
      <mesh position={[0, 0.58, -3.2]} material={materials.structuralSteel} castShadow>
        <boxGeometry args={[spanLength, 0.28, 0.22]} />
      </mesh>

      {/* Pedestrian Stainless Steel Handrails */}
      <mesh position={[0, 0.98, 4.3]} material={materials.stainlessRailing} castShadow>
        <boxGeometry args={[spanLength, 0.06, 0.06]} />
      </mesh>
      <mesh position={[0, 0.98, -4.3]} material={materials.stainlessRailing} castShadow>
        <boxGeometry args={[spanLength, 0.06, 0.06]} />
      </mesh>
      {/* Handrail Vertical Balusters */}
      {Array.from({ length: 64 }).map((_, i) => {
        const rx = -spanLength * 0.5 + 2 + i * ((spanLength - 4) / 63);
        return (
          <group key={i} position={[rx, 0.65, 0]}>
            <mesh position={[0, 0, 4.3]} material={materials.stainlessRailing}>
              <cylinderGeometry args={[0.025, 0.025, 0.65, 6]} />
            </mesh>
            <mesh position={[0, 0, -4.3]} material={materials.stainlessRailing}>
              <cylinderGeometry args={[0.025, 0.025, 0.65, 6]} />
            </mesh>
          </group>
        );
      })}

      {/* ========================================================= */}
      {/* 2. FIVE TIED-ARCH METAL TRUSS SUPERSTRUCTURES             */}
      {/* ========================================================= */}
      {Array.from({ length: numSpans }).map((_, spanIdx) => {
        const spanCenterX = -spanLength * 0.5 + abutmentSetback * 0.5 + subSpanLen * 0.5 + spanIdx * subSpanLen;
        return (
          <group key={spanIdx} position={[spanCenterX, 0.3, 0]}>
            {/* North Arch Tube */}
            <mesh position={[0, 0, 3.8]} geometry={archGeom} material={materials.brightSteelTruss} castShadow />
            {/* South Arch Tube */}
            <mesh position={[0, 0, -3.8]} geometry={archGeom} material={materials.brightSteelTruss} castShadow />

            {/* Neon Arch Contour Edge Tracers */}
            {isNight && (
              <>
                <mesh position={[0, 0.05, 3.8]} geometry={archGeom} material={materials.archNeonGlow} />
                <mesh position={[0, 0.05, -3.8]} geometry={archGeom} material={materials.archNeonGlow} />
              </>
            )}

            {/* Vertical Steel Hanger Cables */}
            {Array.from({ length: 11 }).map((_, hIdx) => {
              const u = (hIdx + 1) / 12;
              const hx = -subSpanLen * 0.5 + u * subSpanLen;
              const hy = 4 * archHeight * u * (1 - u);
              return (
                <group key={hIdx} position={[hx, 0, 0]}>
                  {/* North Hanger Cable */}
                  <mesh position={[0, hy * 0.5, 3.8]} material={materials.brightSteelTruss}>
                    <cylinderGeometry args={[0.04, 0.04, hy, 6]} />
                  </mesh>
                  {/* South Hanger Cable */}
                  <mesh position={[0, hy * 0.5, -3.8]} material={materials.brightSteelTruss}>
                    <cylinderGeometry args={[0.04, 0.04, hy, 6]} />
                  </mesh>
                </group>
              );
            })}

            {/* Overhead Wind Bracing Struts & X-Portal Sway Frames */}
            {Array.from({ length: 7 }).map((_, sIdx) => {
              const u = (sIdx + 1) / 8;
              const sx = -subSpanLen * 0.5 + u * subSpanLen;
              const sy = 4 * archHeight * u * (1 - u);
              if (sy < 4.0) return null;
              return (
                <group key={sIdx} position={[sx, sy, 0]}>
                  {/* Cross beam */}
                  <mesh material={materials.structuralSteel} castShadow>
                    <boxGeometry args={[0.26, 0.26, 7.6]} />
                  </mesh>
                  {/* Diagonal X-bracing between top arches */}
                  {sIdx < 6 && (
                    <mesh rotation-y={0.52} material={materials.brightSteelTruss}>
                      <boxGeometry args={[0.12, 0.12, 8.2]} />
                    </mesh>
                  )}
                </group>
              );
            })}

            {/* Arch Base Thrust Shoes & Gusset Plates */}
            {[-subSpanLen * 0.5, subSpanLen * 0.5].map((shoeX, idx) => (
              <group key={idx} position={[shoeX, 0.4, 0]}>
                <mesh position={[0, 0, 3.8]} material={materials.steelGirderDark} castShadow>
                  <boxGeometry args={[1.2, 0.8, 0.6]} />
                </mesh>
                <mesh position={[0, 0, -3.8]} material={materials.steelGirderDark} castShadow>
                  <boxGeometry args={[1.2, 0.8, 0.6]} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* ========================================================= */}
      {/* 3. RIVERBED CONCRETE PIERS WITH STREAMLINED CUTWATERS     */}
      {/* ========================================================= */}
      {Array.from({ length: numSpans + 1 }).map((_, pierIdx) => {
        const pierX = -spanLength * 0.5 + abutmentSetback * 0.5 + pierIdx * subSpanLen;
        return (
          <group key={pierIdx} position={[pierX, -4.2, 0]}>
            {/* Pier Column */}
            <mesh position={[0, 2.4, 0]} material={materials.concretePier} receiveShadow castShadow>
              <boxGeometry args={[3.2, 5.2, 9.6]} />
            </mesh>
            {/* Pointed Upstream Cutwater (Nose) */}
            <mesh position={[0, 2.4, 5.4]} rotation-y={Math.PI / 4} material={materials.concretePier} castShadow>
              <boxGeometry args={[1.8, 5.2, 1.8]} />
            </mesh>
            {/* Pointed Downstream Cutwater */}
            <mesh position={[0, 2.4, -5.4]} rotation-y={Math.PI / 4} material={materials.concretePier} castShadow>
              <boxGeometry args={[1.8, 5.2, 1.8]} />
            </mesh>
            {/* Pier Cap Beam */}
            <mesh position={[0, 5.1, 0]} material={materials.concretePier} castShadow>
              <boxGeometry args={[3.8, 0.6, 10.4]} />
            </mesh>
            {/* Heavy Riverbed Foundation Footing */}
            <mesh position={[0, -0.2, 0]} material={materials.concretePier} receiveShadow>
              <boxGeometry args={[4.8, 1.2, 12.0]} />
            </mesh>

            {/* Navigation Safety Lights on Central Piers */}
            {(pierIdx === 1 || pierIdx === 2 || pierIdx === 3) && (
              <group position={[0, 4.4, 0]}>
                <mesh position={[0, 0, 4.9]} material={materials.navGreenLight}>
                  <sphereGeometry args={[0.14, 8, 8]} />
                </mesh>
                <mesh position={[0, 0, -4.9]} material={materials.navRedLight}>
                  <sphereGeometry args={[0.14, 8, 8]} />
                </mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* ========================================================= */}
      {/* 4. WEST & EAST ABUTMENTS & HIGHWAY JUNCTION INTERCHANGE   */}
      {/* ========================================================= */}
      {/* West Bank Abutment (Western mountain terrain shore) */}
      <group position={[-spanLength * 0.5 + 2, -1.2, 0]}>
        <mesh position={[-3.0, 0.4, 0]} material={materials.abutmentStone} castShadow receiveShadow>
          <boxGeometry args={[8.0, 3.2, 11.2]} />
        </mesh>
        <mesh position={[-3.0, 1.8, 5.8]} material={materials.abutmentStone} castShadow>
          <boxGeometry args={[8.0, 0.6, 0.8]} />
        </mesh>
        <mesh position={[-3.0, 1.8, -5.8]} material={materials.abutmentStone} castShadow>
          <boxGeometry args={[8.0, 0.6, 0.8]} />
        </mesh>
        {/* Mountain Approach Road Ramp */}
        <mesh position={[-7.5, 0.55, 0]} rotation-z={-0.06} material={materials.roadAsphalt} receiveShadow>
          <boxGeometry args={[8.0, 0.1, 7.2]} />
        </mesh>

        {/* Western Mountain Highway Shore Connection */}
        <group position={[-11.5, 0.72, 0]}>
          <mesh position={[-10.0, 0, 0]} material={materials.roadAsphalt} receiveShadow>
            <boxGeometry args={[20.0, 0.12, 8.4]} />
          </mesh>
          <mesh position={[-10.0, 0.08, 0.08]} material={materials.yellowRoadMarking}>
            <boxGeometry args={[19.5, 0.02, 0.12]} />
          </mesh>
          <mesh position={[-10.0, 0.08, -0.08]} material={materials.yellowRoadMarking}>
            <boxGeometry args={[19.5, 0.02, 0.12]} />
          </mesh>
          <mesh position={[-10.0, 0.08, 3.8]} material={materials.whiteRoadMarking}>
            <boxGeometry args={[19.5, 0.02, 0.15]} />
          </mesh>
          <mesh position={[-10.0, 0.08, -3.8]} material={materials.whiteRoadMarking}>
            <boxGeometry args={[19.5, 0.02, 0.15]} />
          </mesh>
        </group>
      </group>

      {/* East Bank Abutment (Mainland Road Connection Interchange) */}
      <group position={[spanLength * 0.5 - 2, -1.2, 0]}>
        <mesh position={[3.0, 0.4, 0]} material={materials.abutmentStone} castShadow receiveShadow>
          <boxGeometry args={[8.0, 3.2, 11.2]} />
        </mesh>
        <mesh position={[3.0, 1.8, 5.8]} material={materials.abutmentStone} castShadow>
          <boxGeometry args={[8.0, 0.6, 0.8]} />
        </mesh>
        <mesh position={[3.0, 1.8, -5.8]} material={materials.abutmentStone} castShadow>
          <boxGeometry args={[8.0, 0.6, 0.8]} />
        </mesh>

        {/* Seamless Paved Apron & Slipway Ramp Connecting Bridge Deck to Highway */}
        <mesh position={[7.0, 0.72, 0]} material={materials.roadAsphalt} receiveShadow>
          <boxGeometry args={[9.0, 0.12, 8.8]} />
        </mesh>
        {/* North Curved Junction Slipway Flare */}
        <mesh position={[9.5, 0.72, 3.2]} rotation-y={0.35} material={materials.roadAsphalt} receiveShadow>
          <boxGeometry args={[8.0, 0.12, 6.4]} />
        </mesh>
        {/* South Curved Junction Slipway Flare */}
        <mesh position={[9.5, 0.72, -3.2]} rotation-y={-0.35} material={materials.roadAsphalt} receiveShadow>
          <boxGeometry args={[8.0, 0.12, 6.4]} />
        </mesh>

        {/* Junction Road Paint & Markings */}
        <mesh position={[4.0, 0.8, 0]} material={materials.whiteRoadMarking}>
          <boxGeometry args={[0.3, 0.02, 7.8]} />
        </mesh>
        <mesh position={[8.0, 0.8, 0]} rotation-y={Math.PI / 2} material={materials.yellowRoadMarking}>
          <boxGeometry args={[0.2, 0.02, 7.0]} />
        </mesh>

        {/* Highway Interchange Portal Signs */}
        <group position={[9.0, 0.8, 5.6]}>
          <mesh position={[0, 1.8, 0]} material={materials.structuralSteel}>
            <cylinderGeometry args={[0.08, 0.08, 3.6, 8]} />
          </mesh>
        </group>
        <group position={[9.0, 0.8, -5.6]}>
          <mesh position={[0, 1.8, 0]} material={materials.structuralSteel}>
            <cylinderGeometry args={[0.08, 0.08, 3.6, 8]} />
          </mesh>
        </group>
      </group>

      {/* ========================================================= */}
      {/* 5. STREET LIGHTING MASTS & NIGHTTIME ILLUMINATION         */}
      {/* ========================================================= */}
      {Array.from({ length: 14 }).map((_, i) => {
        const lx = -spanLength * 0.5 + 6 + i * ((spanLength - 12) / 13);
        return (
          <group key={i} position={[lx, 0.45, 0]}>
            {/* North Lamppost */}
            <group position={[0, 0, 4.35]}>
              <mesh position={[0, 1.8, 0]} material={materials.structuralSteel}>
                <cylinderGeometry args={[0.06, 0.09, 3.6, 6]} />
              </mesh>
              <mesh position={[0, 3.6, -0.4]} material={materials.structuralSteel}>
                <boxGeometry args={[0.1, 0.1, 0.9]} />
              </mesh>
              <mesh position={[0, 3.5, -0.75]} material={materials.streetLampGlow}>
                <sphereGeometry args={[0.18, 8, 8]} />
              </mesh>
            </group>

            {/* South Lamppost */}
            <group position={[0, 0, -4.35]}>
              <mesh position={[0, 1.8, 0]} material={materials.structuralSteel}>
                <cylinderGeometry args={[0.06, 0.09, 3.6, 6]} />
              </mesh>
              <mesh position={[0, 3.6, 0.4]} material={materials.structuralSteel}>
                <boxGeometry args={[0.1, 0.1, 0.9]} />
              </mesh>
              <mesh position={[0, 3.5, 0.75]} material={materials.streetLampGlow}>
                <sphereGeometry args={[0.18, 8, 8]} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}
