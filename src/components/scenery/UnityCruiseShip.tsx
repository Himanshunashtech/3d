import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

interface UnityCruiseShipProps {
  isNight?: boolean;
  isLightShow?: boolean;
}

/**
 * Closed-loop River Tour Waypoints for "UNITY 1" Cruise Ship
 * 1. Starts moored at Mainland Visitor Port Jetty Gangway (Z = 42, safely SOUTH of Approach Bridge).
 * 2. Sails south through open valley into the Sardar Sarovar Dam reservoir basin (Z = 270).
 * 3. Sweeps north along the wide western river channel, passing Sardar Patel safely at X = -52 (46m clear of island plinth).
 * 4. Cruises into northern mountain valley, executing a wide panoramic turn at Z = -215 (125m south of metal bridge).
 * 5. Returns south along western/central river channels and banks into the visitor port jetty without ever passing under any bridge.
 */
const TOUR_WAYPOINTS: [number, number, number][] = [
  [77.6, -2.92, 42.0],    // 0: Moored at Mainland Visitor Port Jetty (Boarding Gangway at Z=42)
  [68.0, -3.05, 68.0],    // 1: Casting off, steering into open southern fairway
  [40.0, -3.2, 110.0],    // 2: Sweeping south down the broad river valley
  [2.0, -3.4, 165.0],     // 3: Downstream mountain canyon cruise
  [-30.0, -3.6, 220.0],   // 4: Entering Sardar Sarovar Dam reservoir reach
  [-20.0, -3.75, 270.0],  // 5: Dam reservoir viewing basin (Grand front view of dam & 42 gates)
  [-55.0, -3.65, 260.0],  // 6: Wide western banking turn in reservoir
  [-74.0, -3.45, 195.0],  // 7: Northbound cruise along western mountain gorge
  [-64.0, -3.25, 130.0],  // 8: Deep western channel heading north
  [-56.0, -3.1, 65.0],    // 9: Cruising north past southern tip of Sadhu Bet
  [-52.0, -3.0, 0.0],     // 10: Wide western channel past Statue of Unity (46m clear of island plinth, NEVER enters base)
  [-54.0, -2.95, -55.0],  // 11: Past northwest flank of Sadhu Bet (Safely west of second bridge)
  [-74.0, -2.85, -115.0], // 12: Sweeping upstream into scenic northern mountain basin
  [-98.0, -2.75, -170.0], // 13: Upper mountain valley cruise
  [-115.0, -2.7, -210.0], // 14: Northern turning reach (125m south of metal bridge, NEVER goes below bridge)
  [-128.0, -2.7, -195.0], // 15: Completing wide northern scenic U-turn
  [-108.0, -2.75, -145.0],// 16: Southbound return cruise along western mountain ridge
  [-76.0, -2.85, -85.0],  // 17: Heading south through central deep channel
  [-48.0, -2.95, -20.0],  // 18: Wide channel west of Sadhu Bet
  [-38.0, -3.05, 38.0],   // 19: Sweeping around southern promontory of Sadhu Bet
  [-10.0, -3.15, 88.0],   // 20: Entering eastern navigation channel safely south of approach bridge
  [28.0, -3.1, 95.0],     // 21: Aligning with visitor port approach corridor
  [58.0, -3.0, 72.0],     // 22: Decelerating and aligning parallel to visitor jetty
  [77.6, -2.92, 42.0],    // 23: Moored at Mainland Visitor Port Jetty (Loop closed)
];

const tourCurvePoints = TOUR_WAYPOINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
const cruiseSpline = new THREE.CatmullRomCurve3(tourCurvePoints, true, "catmullrom", 0.35);

// Timing parameters (in seconds)
export const CRUISE_DOCK_TIME = 60.0; // 1 minute stationary at port for boarding
export const CRUISE_TOUR_TIME = 180.0; // 3 minutes full river excursion
export const CRUISE_TOTAL_CYCLE = CRUISE_DOCK_TIME + CRUISE_TOUR_TIME; // 240 seconds (4 mins)

export interface CruiseShipState {
  x: number;
  y: number;
  z: number;
  angle: number;
  roll: number;
  pitch: number;
  isDocked: boolean;
  speed: number;
  dockProgress: number;
}

const DOCKED_X = 77.6;
const DOCKED_Y = -2.92;
const DOCKED_Z = 42.0;
const DOCKED_ANGLE = -0.15; // Parallel to visitor jetty face, facing downstream

const _shipState: CruiseShipState = {
  x: DOCKED_X,
  y: DOCKED_Y,
  z: DOCKED_Z,
  angle: DOCKED_ANGLE,
  roll: 0,
  pitch: 0,
  isDocked: true,
  speed: 0,
  dockProgress: 0,
};

const _posScratch = new THREE.Vector3();
const _tangentScratch = new THREE.Vector3();
const _nextTangentScratch = new THREE.Vector3();

/**
 * Calculates ship world coordinates, orientation angle, speed, and wake intensity at any time t.
 * Zero per-frame memory allocation for silky smooth 60+ FPS rendering.
 */
export function getCruiseShipState(time: number): CruiseShipState {
  const tau = ((time % CRUISE_TOTAL_CYCLE) + CRUISE_TOTAL_CYCLE) % CRUISE_TOTAL_CYCLE;

  // Phase 1: Moored at Mainland Visitor Port Jetty for 1 Minute (60 seconds)
  if (tau < CRUISE_DOCK_TIME) {
    const dockProgress = tau / CRUISE_DOCK_TIME;
    const bobbingY = Math.sin(time * 1.6) * 0.025;
    const gentleRoll = Math.sin(time * 1.1) * 0.012;
    _shipState.x = DOCKED_X;
    _shipState.y = DOCKED_Y + bobbingY;
    _shipState.z = DOCKED_Z;
    _shipState.angle = DOCKED_ANGLE;
    _shipState.roll = gentleRoll;
    _shipState.pitch = Math.sin(time * 1.3) * 0.006;
    _shipState.isDocked = true;
    _shipState.speed = 0;
    _shipState.dockProgress = dockProgress;
    return _shipState;
  }

  // Phase 2: Active River Excursion Tour (180 seconds)
  const tourElapsed = tau - CRUISE_DOCK_TIME;
  const rawU = tourElapsed / CRUISE_TOUR_TIME;

  let u = rawU;
  if (rawU < 0.05) {
    const t = rawU / 0.05;
    u = 0.05 * THREE.MathUtils.smoothstep(t, 0, 1) * t;
  } else if (rawU > 0.95) {
    const t = (rawU - 0.95) / 0.05;
    u = 0.95 + 0.05 * (1 - (1 - t) * (1 - t));
  }

  cruiseSpline.getPointAt(u, _posScratch);
  cruiseSpline.getTangentAt(u, _tangentScratch);

  const nextU = (u + 0.005) % 1;
  cruiseSpline.getTangentAt(nextU, _nextTangentScratch);
  const yawDelta = Math.atan2(_nextTangentScratch.x, _nextTangentScratch.z) - Math.atan2(_tangentScratch.x, _tangentScratch.z);
  const bankRoll = THREE.MathUtils.clamp(-yawDelta * 32.0, -0.12, 0.12);

  const waveRockingY = Math.sin(time * 3.4) * 0.035;
  const waveRoll = Math.sin(time * 2.8) * 0.018;
  const cruisePitch = -0.02 + Math.sin(time * 3.2) * 0.012;

  const headingAngle = Math.atan2(_tangentScratch.x, _tangentScratch.z);

  _shipState.x = _posScratch.x;
  _shipState.y = _posScratch.y + waveRockingY;
  _shipState.z = _posScratch.z;
  _shipState.angle = headingAngle;
  _shipState.roll = bankRoll + waveRoll;
  _shipState.pitch = cruisePitch;
  _shipState.isDocked = false;
  _shipState.speed = 1.0;
  _shipState.dockProgress = 0;

  return _shipState;
}

/**
 * Authentic 3D Reproduction of the "UNITY 1" Double-Deck River Cruise Vessel
 * Built to match the exact design in the reference photo:
 * - Catamaran twin-hull design with navy bronze finish & "UNITY 1" decal branding
 * - Lower passenger cabin with full continuous panoramic glass picture windows & warm interior seating
 * - Forward observation lounge with signature backward-angled prow windscreen
 * - Upper open-air promenade deck with golden LED illuminated handrails & orange safety lifebuoys
 * - Elevated navigation bridge / wheelhouse with radar arch scanner & marine antennas
 * - Comprehensive warm golden LED contour edge lighting outlining the entire ship structure in night mode
 * - Dynamic stern twin-propeller water wake and warm water-reflection illumination
 */
export function UnityCruiseShip({ isNight = false, isLightShow = false }: UnityCruiseShipProps) {
  const shipGroupRef = useRef<THREE.Group>(null);
  const wakeRef = useRef<THREE.Group>(null);

  const materials = useMemo(() => {
    return {
      hullBronzeNavy: new THREE.MeshStandardMaterial({
        color: "#1e293b",
        roughness: 0.35,
        metalness: 0.65,
      }),
      hullBottomRed: new THREE.MeshStandardMaterial({
        color: "#7f1d1d",
        roughness: 0.6,
        metalness: 0.2,
      }),
      superstructureWhite: new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.28,
        metalness: 0.15,
      }),
      trimDark: new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.4,
        metalness: 0.5,
      }),
      panoramicGlass: new THREE.MeshPhysicalMaterial({
        color: "#38bdf8",
        emissive: new THREE.Color("#000000"),
        emissiveIntensity: 0.0,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.68,
        opacity: 0.85,
        transparent: true,
        ior: 1.52,
      }),
      ledContourStrip: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#f59e0b"),
        emissiveIntensity: 1.2,
        roughness: 0.15,
        toneMapped: false,
      }),
      interiorWarmGlow: new THREE.MeshStandardMaterial({
        color: "#fef3c7",
        emissive: new THREE.Color("#f59e0b"),
        emissiveIntensity: 0.4,
        roughness: 0.4,
      }),
      passengerSeatFabric: new THREE.MeshStandardMaterial({
        color: "#2563eb",
        roughness: 0.8,
      }),
      stainlessRail: new THREE.MeshStandardMaterial({
        color: "#f1f5f9",
        roughness: 0.18,
        metalness: 0.92,
      }),
      lifebuoyOrange: new THREE.MeshStandardMaterial({
        color: "#ea580c",
        emissive: new THREE.Color("#c2410c"),
        emissiveIntensity: 0.1,
        roughness: 0.4,
      }),
      lifebuoyWhiteBand: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.3,
      }),
      deckTeak: new THREE.MeshStandardMaterial({
        color: "#a16207",
        roughness: 0.72,
      }),
      navGreen: new THREE.MeshStandardMaterial({
        color: "#22c55e",
        emissive: new THREE.Color("#16a34a"),
        emissiveIntensity: 1.2,
      }),
      navRed: new THREE.MeshStandardMaterial({
        color: "#ef4444",
        emissive: new THREE.Color("#dc2626"),
        emissiveIntensity: 1.2,
      }),
      mastHeadWhite: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#fffbeb"),
        emissiveIntensity: 1.5,
      }),
      wakeFoam: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#93c5fd"),
        emissiveIntensity: 0.1,
        roughness: 0.9,
        transparent: true,
        opacity: 0.65,
      }),
    };
  }, []);

  useEffect(() => {
    materials.hullBronzeNavy.color.set(isNight ? "#0f172a" : "#1e293b");
    materials.hullBottomRed.color.set(isNight ? "#450a0a" : "#7f1d1d");
    materials.superstructureWhite.color.set(isNight ? "#cbd5e1" : "#f8fafc");
    materials.trimDark.color.set(isNight ? "#020617" : "#0f172a");
    materials.panoramicGlass.color.set(isNight ? "#93c5fd" : "#38bdf8");
    materials.panoramicGlass.emissive.set(isNight ? "#fbbf24" : "#000000");
    materials.panoramicGlass.emissiveIntensity = isNight ? 1.4 : 0.0;
    materials.ledContourStrip.emissiveIntensity = isNight ? (isLightShow ? 8.5 : 6.8) : 1.2;
    materials.interiorWarmGlow.emissiveIntensity = isNight ? 3.8 : 0.4;
    materials.passengerSeatFabric.color.set(isNight ? "#1e3a8a" : "#2563eb");
    materials.stainlessRail.color.set(isNight ? "#94a3b8" : "#f1f5f9");
    materials.lifebuoyOrange.emissiveIntensity = isNight ? 0.8 : 0.1;
    materials.deckTeak.color.set(isNight ? "#573a21" : "#a16207");
    materials.navGreen.emissiveIntensity = isNight ? 4.5 : 1.2;
    materials.navRed.emissiveIntensity = isNight ? 4.5 : 1.2;
    materials.mastHeadWhite.emissiveIntensity = isNight ? 5.5 : 1.5;
    materials.wakeFoam.emissiveIntensity = isNight ? 0.6 : 0.1;
  }, [isNight, isLightShow, materials]);


  useFrame((state) => {
    if (!shipGroupRef.current) return;
    const t = state.clock.getElapsedTime();
    const ship = getCruiseShipState(t);

    shipGroupRef.current.position.set(ship.x, ship.y, ship.z);
    shipGroupRef.current.rotation.set(ship.pitch, ship.angle, ship.roll);

    if (wakeRef.current) {
      wakeRef.current.visible = !ship.isDocked;
      if (!ship.isDocked) {
        const pulse = 1 + Math.sin(t * 12) * 0.12;
        wakeRef.current.scale.set(pulse, 1, 1 + Math.sin(t * 8) * 0.18);
      }
    }
  });

  return (
    <group ref={shipGroupRef} name="UnityCruiseShip">
      {/* ========================================================= */}
      {/* 1. CATAMARAN TWIN-HULL STRUCTURE (LOWER DRAFT & PROW)     */}
      {/* ========================================================= */}
      {/* Port Hull Sponson */}
      <group position={[1.9, 0.45, 0]}>
        <mesh material={materials.hullBronzeNavy} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.2, 16.5]} />
        </mesh>
        {/* Angled Forward Bow Rake */}
        <mesh position={[0, 0.12, 8.8]} rotation-x={-0.42} material={materials.hullBronzeNavy} castShadow>
          <boxGeometry args={[1.48, 1.3, 2.4]} />
        </mesh>
        {/* Antifouling Bottom Keel */}
        <mesh position={[0, -0.55, 0]} material={materials.hullBottomRed}>
          <boxGeometry args={[1.4, 0.3, 16.8]} />
        </mesh>
      </group>

      {/* Starboard Hull Sponson */}
      <group position={[-1.9, 0.45, 0]}>
        <mesh material={materials.hullBronzeNavy} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.2, 16.5]} />
        </mesh>
        {/* Angled Forward Bow Rake */}
        <mesh position={[0, 0.12, 8.8]} rotation-x={-0.42} material={materials.hullBronzeNavy} castShadow>
          <boxGeometry args={[1.48, 1.3, 2.4]} />
        </mesh>
        {/* Antifouling Bottom Keel */}
        <mesh position={[0, -0.55, 0]} material={materials.hullBottomRed}>
          <boxGeometry args={[1.4, 0.3, 16.8]} />
        </mesh>
      </group>

      {/* Central Wet Deck Bridging Tunnel */}
      <mesh position={[0, 0.8, 0]} material={materials.hullBronzeNavy} castShadow>
        <boxGeometry args={[2.5, 0.5, 16.2]} />
      </mesh>

      {/* Main Hull Deck Plating & Teak Floor */}
      <mesh position={[0, 1.08, 0]} material={materials.deckTeak} receiveShadow>
        <boxGeometry args={[5.5, 0.12, 17.2]} />
      </mesh>

      {/* Lower Gunwale Outer Fender Strip with Warm Golden LED Outline */}
      <mesh position={[2.78, 0.98, 0]} material={materials.ledContourStrip}>
        <boxGeometry args={[0.08, 0.12, 17.2]} />
      </mesh>
      <mesh position={[-2.78, 0.98, 0]} material={materials.ledContourStrip}>
        <boxGeometry args={[0.08, 0.12, 17.2]} />
      </mesh>
      {/* Bow Transom LED Edge */}
      <mesh position={[0, 0.98, 8.65]} material={materials.ledContourStrip}>
        <boxGeometry args={[5.55, 0.12, 0.08]} />
      </mesh>
      {/* Stern Transom LED Edge */}
      <mesh position={[0, 0.98, -8.65]} material={materials.ledContourStrip}>
        <boxGeometry args={[5.55, 0.12, 0.08]} />
      </mesh>

      {/* ========================================================= */}
      {/* 2. LOWER PASSENGER CABIN WITH PANORAMIC GLASS WINDOWS     */}
      {/* ========================================================= */}
      {/* Cabin Base Enclosure */}
      <group position={[0, 1.95, -0.2]}>
        {/* Forward Slanted Panoramic Windscreen Lounge (As seen in photo) */}
        <mesh position={[0, 0.15, 6.6]} rotation-x={-0.38} material={materials.panoramicGlass}>
          <boxGeometry args={[4.9, 1.6, 0.08]} />
        </mesh>
        {/* Forward Window Mullions & Golden LED Bevels */}
        <mesh position={[0, 0.15, 6.6]} rotation-x={-0.38} material={materials.ledContourStrip}>
          <boxGeometry args={[4.95, 0.08, 0.12]} />
        </mesh>
        {[-1.6, 0, 1.6].map((wx, idx) => (
          <mesh key={`fwd-mul-${idx}`} position={[wx, 0.15, 6.6]} rotation-x={-0.38} material={materials.superstructureWhite}>
            <boxGeometry args={[0.12, 1.62, 0.14]} />
          </mesh>
        ))}

        {/* Port Panoramic Picture Windows (8 bays along side) */}
        <mesh position={[2.52, 0, 0]} material={materials.panoramicGlass}>
          <boxGeometry args={[0.06, 1.45, 12.8]} />
        </mesh>
        {/* Starboard Panoramic Picture Windows */}
        <mesh position={[-2.52, 0, 0]} material={materials.panoramicGlass}>
          <boxGeometry args={[0.06, 1.45, 12.8]} />
        </mesh>

        {/* Window Division Pillars & Mullions */}
        {Array.from({ length: 9 }).map((_, i) => {
          const pz = -6.0 + i * 1.5;
          return (
            <group key={`pillar-${i}`}>
              <mesh position={[2.54, 0, pz]} material={materials.superstructureWhite}>
                <boxGeometry args={[0.14, 1.48, 0.16]} />
              </mesh>
              <mesh position={[-2.54, 0, pz]} material={materials.superstructureWhite}>
                <boxGeometry args={[0.14, 1.48, 0.16]} />
              </mesh>
            </group>
          );
        })}

        {/* Golden LED Ribbon running along top & bottom of passenger windows */}
        <mesh position={[2.56, 0.72, 0]} material={materials.ledContourStrip}>
          <boxGeometry args={[0.08, 0.08, 13.0]} />
        </mesh>
        <mesh position={[-2.56, 0.72, 0]} material={materials.ledContourStrip}>
          <boxGeometry args={[0.08, 0.08, 13.0]} />
        </mesh>
        <mesh position={[2.56, -0.72, 0]} material={materials.ledContourStrip}>
          <boxGeometry args={[0.08, 0.08, 13.0]} />
        </mesh>
        <mesh position={[-2.56, -0.72, 0]} material={materials.ledContourStrip}>
          <boxGeometry args={[0.08, 0.08, 13.0]} />
        </mesh>

        {/* Illuminated Passenger Cabin Interior (Seating & Tables) */}
        <group position={[0, -0.4, 0]}>
          {Array.from({ length: 7 }).map((_, rIdx) => {
            const rz = -5.0 + rIdx * 1.6;
            return (
              <group key={`row-${rIdx}`} position={[0, 0, rz]}>
                {/* Port 2-Seater */}
                <mesh position={[1.6, 0.25, 0]} material={materials.passengerSeatFabric}>
                  <boxGeometry args={[1.3, 0.45, 0.55]} />
                </mesh>
                <mesh position={[1.6, 0.65, -0.22]} material={materials.passengerSeatFabric}>
                  <boxGeometry args={[1.3, 0.55, 0.14]} />
                </mesh>
                {/* Starboard 2-Seater */}
                <mesh position={[-1.6, 0.25, 0]} material={materials.passengerSeatFabric}>
                  <boxGeometry args={[1.3, 0.45, 0.55]} />
                </mesh>
                <mesh position={[-1.6, 0.65, -0.22]} material={materials.passengerSeatFabric}>
                  <boxGeometry args={[1.3, 0.55, 0.14]} />
                </mesh>
              </group>
            );
          })}
          {/* Ceiling Cove Light Inset */}
          <mesh position={[0, 1.15, 0]} material={materials.interiorWarmGlow}>
            <boxGeometry args={[3.8, 0.08, 12.0]} />
          </mesh>
        </group>
      </group>

      {/* Mid-Deck Roof & Promenade Floor */}
      <mesh position={[0, 2.75, -0.2]} material={materials.superstructureWhite} castShadow>
        <boxGeometry args={[5.3, 0.16, 14.8]} />
      </mesh>
      <mesh position={[0, 2.84, -0.2]} material={materials.deckTeak} receiveShadow>
        <boxGeometry args={[5.1, 0.05, 14.5]} />
      </mesh>

      {/* Mid-Deck Eaves Continuous Golden LED Contour */}
      <mesh position={[2.68, 2.76, -0.2]} material={materials.ledContourStrip}>
        <boxGeometry args={[0.08, 0.1, 14.9]} />
      </mesh>
      <mesh position={[-2.68, 2.76, -0.2]} material={materials.ledContourStrip}>
        <boxGeometry args={[0.08, 0.1, 14.9]} />
      </mesh>

      {/* ========================================================= */}
      {/* 3. UPPER PROMENADE SUNDECK & OBSERVATION LOUNGE           */}
      {/* ========================================================= */}
      {/* Upper Cabin Lounge */}
      <group position={[0, 3.65, -1.2]}>
        {/* Upper Forward Slanted Windscreen */}
        <mesh position={[0, 0.12, 4.4]} rotation-x={-0.45} material={materials.panoramicGlass}>
          <boxGeometry args={[4.2, 1.35, 0.06]} />
        </mesh>
        <mesh position={[0, 0.12, 4.4]} rotation-x={-0.45} material={materials.ledContourStrip}>
          <boxGeometry args={[4.25, 0.06, 0.1]} />
        </mesh>

        {/* Upper Side Glass Windows */}
        <mesh position={[2.12, 0, 0]} material={materials.panoramicGlass}>
          <boxGeometry args={[0.06, 1.25, 8.2]} />
        </mesh>
        <mesh position={[-2.12, 0, 0]} material={materials.panoramicGlass}>
          <boxGeometry args={[0.06, 1.25, 8.2]} />
        </mesh>

        {/* Upper Window Outline LED Strip */}
        <mesh position={[2.16, 0.62, 0]} material={materials.ledContourStrip}>
          <boxGeometry args={[0.06, 0.06, 8.4]} />
        </mesh>
        <mesh position={[-2.16, 0.62, 0]} material={materials.ledContourStrip}>
          <boxGeometry args={[0.06, 0.06, 8.4]} />
        </mesh>
      </group>

      {/* Upper Sundeck Canopy Roof */}
      <group position={[0, 4.45, -1.2]}>
        <mesh material={materials.superstructureWhite} castShadow>
          <boxGeometry args={[4.6, 0.14, 10.2]} />
        </mesh>
        {/* Canopy Roof Edge Warm LED Glow Contour */}
        <mesh position={[2.34, 0, 0]} material={materials.ledContourStrip}>
          <boxGeometry args={[0.08, 0.1, 10.3]} />
        </mesh>
        <mesh position={[-2.34, 0, 0]} material={materials.ledContourStrip}>
          <boxGeometry args={[0.08, 0.1, 10.3]} />
        </mesh>
        <mesh position={[0, 0, 5.15]} material={materials.ledContourStrip}>
          <boxGeometry args={[4.65, 0.1, 0.08]} />
        </mesh>
        <mesh position={[0, 0, -5.15]} material={materials.ledContourStrip}>
          <boxGeometry args={[4.65, 0.1, 0.08]} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 4. UPPER DECK STAINLESS RAILINGS & ORANGE LIFEBUOYS       */}
      {/* ========================================================= */}
      {/* Upper Forward Observation Deck Railings */}
      <group position={[0, 2.9, 0]}>
        {/* Port Railing */}
        <mesh position={[2.52, 0.45, 4.2]} material={materials.stainlessRail}>
          <boxGeometry args={[0.04, 0.04, 6.2]} />
        </mesh>
        {/* Port Railing LED Strip (Running along top rail) */}
        <mesh position={[2.52, 0.48, 4.2]} material={materials.ledContourStrip}>
          <boxGeometry args={[0.05, 0.04, 6.2]} />
        </mesh>
        {/* Starboard Railing */}
        <mesh position={[-2.52, 0.45, 4.2]} material={materials.stainlessRail}>
          <boxGeometry args={[0.04, 0.04, 6.2]} />
        </mesh>
        <mesh position={[-2.52, 0.48, 4.2]} material={materials.ledContourStrip}>
          <boxGeometry args={[0.05, 0.04, 6.2]} />
        </mesh>

        {/* Forward Bow Cross Railing */}
        <mesh position={[0, 0.45, 7.2]} material={materials.stainlessRail}>
          <boxGeometry args={[5.0, 0.04, 0.04]} />
        </mesh>
        <mesh position={[0, 0.48, 7.2]} material={materials.ledContourStrip}>
          <boxGeometry args={[5.0, 0.04, 0.05]} />
        </mesh>

        {/* Vertical Railing Stanchions */}
        {[-2.4, -1.2, 0, 1.2, 2.4].map((stX, idx) => (
          <mesh key={`fwd-st-${idx}`} position={[stX, 0.22, 7.2]} material={materials.stainlessRail}>
            <cylinderGeometry args={[0.02, 0.02, 0.45, 6]} />
          </mesh>
        ))}

        {/* Marine Safety Lifebuoy Rings on Port & Starboard Railings (Matching reference photo) */}
        {[
          { pos: [2.55, 0.42, 4.5] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
          { pos: [2.55, 0.42, 1.8] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
          { pos: [-2.55, 0.42, 4.5] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
          { pos: [-2.55, 0.42, 1.8] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
          { pos: [0, 0.42, 7.22] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
        ].map((ring, idx) => (
          <group key={`lifebuoy-${idx}`} position={ring.pos} rotation={ring.rot}>
            {/* Orange Torus Body */}
            <mesh material={materials.lifebuoyOrange}>
              <torusGeometry args={[0.32, 0.075, 10, 18]} />
            </mesh>
            {/* White Reflective Quarter Bands */}
            {[0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].map((angle, bIdx) => (
              <mesh key={`band-${bIdx}`} rotation-z={angle} position={[0.32 * Math.cos(angle), 0.32 * Math.sin(angle), 0]} material={materials.lifebuoyWhiteBand}>
                <boxGeometry args={[0.08, 0.16, 0.16]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 5. ELEVATED NAVIGATION BRIDGE & RADAR ARCH MAST           */}
      {/* ========================================================= */}
      <group position={[0, 4.5, 0]}>
        {/* Radar Mast Pedestal */}
        <mesh position={[0, 0.45, 0]} material={materials.superstructureWhite} castShadow>
          <cylinderGeometry args={[0.16, 0.24, 0.9, 8]} />
        </mesh>
        {/* Cross Yardarm */}
        <mesh position={[0, 0.82, 0]} material={materials.stainlessRail}>
          <boxGeometry args={[1.8, 0.06, 0.06]} />
        </mesh>
        {/* Rotating Marine Radar Scanner */}
        <mesh position={[0, 1.05, 0]} material={materials.superstructureWhite}>
          <boxGeometry args={[1.4, 0.12, 0.22]} />
        </mesh>
        {/* Top All-Round White Navigation Light */}
        <mesh position={[0, 1.25, 0]} material={materials.mastHeadWhite}>
          <sphereGeometry args={[0.08, 8, 8]} />
        </mesh>

        {/* Port (Red) Navigation Light */}
        <mesh position={[0.9, 0.85, 0]} material={materials.navRed}>
          <sphereGeometry args={[0.07, 8, 8]} />
        </mesh>
        {/* Starboard (Green) Navigation Light */}
        <mesh position={[-0.9, 0.85, 0]} material={materials.navGreen}>
          <sphereGeometry args={[0.07, 8, 8]} />
        </mesh>
      </group>

      {/* Stern Twin Propeller Tunnel Exhausts */}
      <group position={[0, 0.35, -8.4]}>
        {[-1.9, 1.9].map((px, idx) => (
          <group key={`prop-${idx}`} position={[px, 0, 0]}>
            <mesh material={materials.hullBronzeNavy}>
              <cylinderGeometry args={[0.42, 0.42, 0.5, 12]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 6. DYNAMIC STERN WATER WAKE & FOAM CHURN TRAIL            */}
      {/* ========================================================= */}
      <group ref={wakeRef} position={[0, -0.1, -10.2]} rotation-x={-Math.PI / 2}>
        {/* Center Foam V-Wake */}
        <mesh material={materials.wakeFoam}>
          <planeGeometry args={[5.2, 14.0]} />
        </mesh>
        {/* Outward Spreading Port Bow Wave */}
        <mesh position={[3.2, -4.0, 0]} rotation-z={-0.22} material={materials.wakeFoam}>
          <planeGeometry args={[2.4, 10.0]} />
        </mesh>
        {/* Outward Spreading Starboard Bow Wave */}
        <mesh position={[-3.2, -4.0, 0]} rotation-z={0.22} material={materials.wakeFoam}>
          <planeGeometry args={[2.4, 10.0]} />
        </mesh>
      </group>

    </group>
  );
}
