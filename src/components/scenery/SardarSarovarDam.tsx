import * as THREE from "three";
import { useMemo, useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { subscribeTheme, getThemeMode, subscribeLightShow, getLightShow } from "./sceneControlStore";

/**
 * Monumental 3D model of the Sardar Sarovar Dam (Narmada River Valley)
 * Situated at the very end of the terrain / mountain boundary (X = -25, Z = 335):
 * 1. Towering concrete gravity dam wall (36m crest elevation) spanning over 315m with 42 radial spillway gate bays
 * 2. Continuous crest highway bridge with safety railings, lighting masts, and a towering orange industrial gantry crane
 * 3. Giant hydraulic spillway chute discharging turbulent foaming river water rapids
 * 4. Dual observation & operations towers soaring up to 60m elevation
 * 5. Hydroelectric powerhouse complex with generator station & transformer yards
 * 6. Elevated upstream calm reservoir lake surface nestled in the mountains
 * 7. Comprehensive Night Corner & Architectural Illumination
 * 8. FULL DAM & FULL HEIGHT Dynamic Waving Indian Flag (Tiranga) Laser Projection:
 *    - Wraps smoothly across the entire height (from bottom water level to top crest)
 *    - Extends corner-to-corner across all 315m from left mountain abutment to right powerhouse
 *    - Top Saffron, Middle Pure White with 24-spoke Ashoka Chakra, Bottom India Green
 */
export function SardarSarovarDam() {
  const [isNight, setIsNight] = useState(getThemeMode() === "night");
  const [isLightShow, setIsLightShow] = useState(getLightShow());
  const foamMatRef = useRef<THREE.ShaderMaterial>(null);
  const flagMatRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    const unsubTheme = subscribeTheme((mode) => {
      setIsNight(mode === "night");
    });
    const unsubShow = subscribeLightShow((active) => {
      setIsLightShow(active);
    });
    return () => {
      unsubTheme();
      unsubShow();
    };
  }, []);

  const materials = useMemo(() => {
    return {
      concreteDam: new THREE.MeshStandardMaterial({
        color: "#b0b8c2",
        roughness: 0.85,
        metalness: 0.08,
        flatShading: true,
      }),
      concreteDark: new THREE.MeshStandardMaterial({
        color: "#7e8894",
        roughness: 0.92,
        metalness: 0.05,
        flatShading: true,
      }),
      concreteChute: new THREE.MeshStandardMaterial({
        color: "#8f9aa6",
        roughness: 0.72,
        metalness: 0.1,
        flatShading: true,
      }),
      steelRadialGate: new THREE.MeshStandardMaterial({
        color: "#2d3748",
        roughness: 0.45,
        metalness: 0.7,
      }),
      gantrySteel: new THREE.MeshStandardMaterial({
        color: "#ea580c",
        roughness: 0.4,
        metalness: 0.45,
      }),
      crestRoad: new THREE.MeshStandardMaterial({
        color: "#374151",
        roughness: 0.95,
      }),
      powerhouseMat: new THREE.MeshStandardMaterial({
        color: "#64748b",
        roughness: 0.7,
        metalness: 0.25,
        flatShading: true,
      }),
      glassMat: new THREE.MeshStandardMaterial({
        color: "#bae6fd",
        emissive: new THREE.Color("#000000"),
        emissiveIntensity: 0,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.88,
      }),
      rockShoalMat: new THREE.MeshStandardMaterial({
        color: "#685b4b",
        roughness: 0.94,
        metalness: 0.02,
        flatShading: true,
      }),
      wetGravelMat: new THREE.MeshStandardMaterial({
        color: "#453f36",
        roughness: 0.75,
        metalness: 0.15,
        flatShading: true,
      }),
      lightCapGlowing: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#fff7db"),
        emissiveIntensity: 0.2,
        roughness: 0.1,
      }),
      cornerNeonGlowing: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.1,
        roughness: 0.1,
      }),
      lightBladeMat: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.1,
        roughness: 0.1,
      }),
      towerBeaconMat: new THREE.MeshBasicMaterial({
        color: "#fffbeb",
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      reservoirWaterMat: new THREE.MeshStandardMaterial({
        color: "#1e4d75",
        roughness: 0.2,
        metalness: 0.4,
        transparent: true,
        opacity: 0.94,
      }),
    };
  }, []);

  useEffect(() => {
    materials.concreteDam.color.set(isNight ? "#475569" : "#b0b8c2");
    materials.concreteDark.color.set(isNight ? "#334155" : "#7e8894");
    materials.concreteChute.color.set(isNight ? "#3e4c5e" : "#8f9aa6");
    materials.steelRadialGate.color.set(isNight ? "#1e293b" : "#2d3748");
    materials.gantrySteel.color.set(isNight ? "#c2410c" : "#ea580c");
    materials.crestRoad.color.set(isNight ? "#1e293b" : "#374151");
    materials.powerhouseMat.color.set(isNight ? "#2d3748" : "#64748b");
    materials.glassMat.color.set(isNight ? "#38bdf8" : "#bae6fd");
    materials.glassMat.emissive.set(isNight ? "#0284c7" : "#000000");
    materials.glassMat.emissiveIntensity = isNight ? 2.5 : 0;
    materials.rockShoalMat.color.set(isNight ? "#2d261e" : "#685b4b");
    materials.wetGravelMat.color.set(isNight ? "#1c2024" : "#453f36");
    materials.lightCapGlowing.emissiveIntensity = isNight ? 5.5 : 0.2;
    materials.cornerNeonGlowing.emissive.set(isNight ? (isLightShow ? "#38bdf8" : "#fbbf24") : "#ffffff");
    materials.cornerNeonGlowing.emissiveIntensity = isNight ? 4.0 : 0.1;
    materials.lightBladeMat.emissive.set(isNight ? (isLightShow ? "#00e676" : "#f59e0b") : "#ffffff");
    materials.lightBladeMat.emissiveIntensity = isNight ? (isLightShow ? 6.5 : 4.5) : 0.1;
    materials.towerBeaconMat.color.set(isLightShow ? "#38bdf8" : "#fffbeb");
    materials.towerBeaconMat.opacity = isNight ? 0.55 : 0.0;
    materials.reservoirWaterMat.color.set(isNight ? "#06182c" : "#1e4d75");
  }, [isNight, isLightShow, materials]);


  // 42 Monumental Radial Spillway Gate Bays (Massive Grand Scale)
  const NUM_GATES = 42;
  const GATE_WIDTH = 3.0;
  const PIER_THICKNESS = 0.75;
  const TOTAL_BAY_WIDTH = GATE_WIDTH + PIER_THICKNESS;
  const SPILLWAY_SPAN = NUM_GATES * TOTAL_BAY_WIDTH; // ~157.5 units
  const FULL_DAM_SPAN = SPILLWAY_SPAN + 160;          // ~317.5 units across entire gorge!

  // Frame loop for animated water turbulence and waving flag projection
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (foamMatRef.current && foamMatRef.current.uniforms["uTime"]) {
      foamMatRef.current.uniforms["uTime"].value = elapsed;
    }
    if (flagMatRef.current && flagMatRef.current.uniforms["uTime"]) {
      flagMatRef.current.uniforms["uTime"].value = elapsed;
    }
  });

  const foamShader = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
        uFoamColor: { value: new THREE.Color(isNight ? "#c7dcf7" : "#ffffff") },
        uWaterColor: { value: new THREE.Color(isNight ? "#0f2d4e" : "#2b6cb0") },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vTurbulence;
        void main() {
          vUv = uv;
          vec3 p = position;
          float t = uTime * 3.8;
          float turb = sin(p.x * 0.7 + t * 2.2) * cos(p.y * 1.4 - t * 1.8) * 0.55;
          turb += sin(p.x * 2.4 - t * 3.2) * 0.25;
          p.z += turb;
          vTurbulence = turb;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uFoamColor;
        uniform vec3 uWaterColor;
        varying vec2 vUv;
        varying float vTurbulence;
        void main() {
          float foamIntensity = smoothstep(-0.25, 0.48, vTurbulence + (1.0 - vUv.y) * 0.6);
          vec3 col = mix(uWaterColor, uFoamColor, foamIntensity);
          float alpha = 0.95 * (1.0 - smoothstep(0.88, 1.0, vUv.y));
          gl_FragColor = vec4(col, alpha);
        }
      `,
    };
  }, [isNight]);

  /**
   * Custom Geometry precisely hugging the front face of the 42-bay Spillway & Chute:
   * - Bottom edge (v = 0.0): River water level & ski-jump bucket toe (Y = 0.5, Z = 32.5) -> Green stripe
   * - Chute toe peak (v = 0.22): Sloped chute transition (Y = 8.6, Z = 36.8) -> Green stripe
   * - Sloped chute face (v = 0.22 to 0.53): Ascends from Y = 8.6 to Y = 20.0, Z = 36.8 to Z = 16.8
   * - Radial gates & Piers (v = 0.53 to 0.85): Y = 20.0 to 32.0, Z = 16.8 to 11.2 -> White stripe & Ashoka Chakra
   * - Crest Roadway & Parapet (v = 0.85 to 1.0): Y = 32.0 to 37.2, Z = 11.2 to 7.4 -> Saffron stripe
   *
   * Spans cleanly across the entire 42-gate spillway width between the dual observation towers!
   */
  const flagGeometry = useMemo(() => {
    const segX = 96;
    const segY = 64;
    const flagWidth = SPILLWAY_SPAN + 3.0; // ~160.5 units wide, framing the entire 42 spillway bays
    const geo = new THREE.PlaneGeometry(flagWidth, 1, segX, segY);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;
    const uv = geo.attributes['uv'] as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const v = uv.getY(i); // 0.0 (bottom) to 1.0 (top)
      const y = THREE.MathUtils.lerp(0.5, 37.2, v);
      let z: number;

      if (y <= 8.61) {
        // Lower chute front face / ski-jump bucket toe: Y from 0.5 to 8.61, Z from 32.5 to 36.8
        const t = (y - 0.5) / (8.61 - 0.5);
        z = THREE.MathUtils.lerp(32.5, 36.8, t);
      } else if (y <= 20.0) {
        // Sloped spillway chute: Y from 8.61 to 20.0, Z slanting from 36.8 to 16.8
        const t = (y - 8.61) / (20.0 - 8.61);
        z = THREE.MathUtils.lerp(36.8, 16.8, t);
      } else if (y <= 32.0) {
        // Radial gates and concrete divider piers: Y from 20.0 to 32.0, Z from 16.8 to 11.2
        const t = (y - 20.0) / (32.0 - 20.0);
        z = THREE.MathUtils.lerp(16.8, 11.2, t);
      } else {
        // Crest roadway deck & parapet barrier: Y from 32.0 to 37.2, Z from 11.2 to 7.4
        const t = (y - 32.0) / (37.2 - 32.0);
        z = THREE.MathUtils.lerp(11.2, 7.4, t);
      }

      // Forward offset (+0.45) ensures the laser projection hovers cleanly in front of all concrete
      pos.setY(i, y);
      pos.setZ(i, z + 0.45);
    }

    geo.computeVertexNormals();
    return geo;
  }, [SPILLWAY_SPAN]);

  /**
   * GLSL Shader for Dynamic Waving Indian Flag (Tiranga) Laser Projection:
   * - Top band (v >= 0.66): Radiant Indian Saffron (Kesariya #ff6a10)
   * - Middle band (0.33 <= v < 0.66): Pure White (#ffffff) with 24-spoke Navy Blue Ashoka Chakra
   * - Bottom band (v < 0.33): Rich India Green (Samriddhi #05a629)
   * - Harmonic fluid waving cloth displacement and laser projection shimmer
   */
  const flagShader = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          vUv = uv;
          vec3 p = position;
          // Harmonic waving cloth ripple displacement (strictly positive bias to prevent clipping into dam)
          float waveX = sin(uv.x * 12.0 - uTime * 3.4) * 0.18;
          float waveY = cos(uv.y * 8.0 - uTime * 2.0 + uv.x * 4.0) * 0.12;
          p.z += waveX + waveY + 0.15;

          vec4 wp = modelMatrix * vec4(p, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          vec2 uv = vUv;

          // Waving ripple distortion in fragment space
          float wave = sin(uv.x * 12.0 - uTime * 3.4) * 0.015 + cos(uv.y * 8.0 - uTime * 2.0) * 0.01;
          float y = uv.y + wave;

          // Vibrant Tiranga Color Palette
          vec3 saffron = vec3(1.0, 0.42, 0.06); // Radiant Saffron (#ff6a10)
          vec3 white = vec3(0.98, 0.98, 1.0);    // Pure Brilliant White
          vec3 green = vec3(0.02, 0.65, 0.16);  // India Green (#05a629)
          vec3 navy = vec3(0.0, 0.08, 0.58);    // Ashoka Navy Blue

          // Horizontal Tri-Color Stripes (Y: 0.0 bottom green -> 1.0 top saffron)
          vec3 col = green;
          float t1 = smoothstep(0.31, 0.35, y);
          float t2 = smoothstep(0.64, 0.68, y);
          col = mix(green, white, t1);
          col = mix(col, saffron, t2);

          // Center Ashoka Chakra in the White stripe
          vec2 center = vec2(0.5, 0.5);
          vec2 chakraUv = (uv + vec2(0.0, wave) - center);
          chakraUv.x *= 4.36; // Aspect ratio adjustment for wide spillway (160.5 / 36.7)
          float r = length(chakraUv);

          if (r < 0.15 && y > 0.32 && y < 0.68) {
            // Outer wheel ring
            float rim = smoothstep(0.122, 0.134, r) * (1.0 - smoothstep(0.142, 0.148, r));
            // Center hub
            float hub = 1.0 - smoothstep(0.018, 0.032, r);
            // 24 Spokes
            float angle = atan(chakraUv.y, chakraUv.x);
            float spokes = pow(abs(cos(angle * 12.0)), 14.0) * smoothstep(0.025, 0.038, r) * (1.0 - smoothstep(0.122, 0.134, r));
            float chakra = clamp(rim * 1.6 + hub + spokes * 1.8, 0.0, 1.0);
            col = mix(col, navy, chakra);
          }

          // Laser projection brilliance & wave shadow highlights
          float shimmer = 1.0 + 0.15 * sin(uTime * 4.0 + uv.x * 24.0);
          float waveShadow = 0.90 + 0.18 * cos(uv.x * 12.0 - uTime * 3.4);
          float edgeFade = smoothstep(0.0, 0.01, uv.x) * (1.0 - smoothstep(0.99, 1.0, uv.x)) *
                           smoothstep(0.0, 0.01, uv.y) * (1.0 - smoothstep(0.99, 1.0, uv.y));

          gl_FragColor = vec4(col * shimmer * waveShadow * 1.45, 0.98 * edgeFade);
        }
      `,
    };
  }, []);

  return (
    <group position={[-25, -1.2, 335]} rotation-y={2.96}>
      {/* ========================================================= */}
      {/* 1. ELEVATED UPSTREAM RESERVOIR WATER BASIN (LAKE)         */}
      {/* ========================================================= */}
      <mesh
        position={[0, 24.0, -80]}
        rotation-x={-Math.PI / 2}
        material={materials.reservoirWaterMat}
      >
        <planeGeometry args={[340, 190, 32, 32]} />
      </mesh>

      {/* ========================================================= */}
      {/* 2. MAIN TOWERING GRAVITY DAM WALL & MOUNTAIN ABUTMENTS    */}
      {/* ========================================================= */}
      <group position={[0, 0, 0]}>
        {/* Left Mountain Abutment Anchor Bastion (Western Flank Corner) */}
        <mesh position={[-SPILLWAY_SPAN * 0.5 - 40, 17.5, -6]} material={materials.concreteDam} receiveShadow castShadow>
          <boxGeometry args={[80, 44, 48]} />
        </mesh>
        {/* Left Non-Overflow Wing Section */}
        <mesh position={[-SPILLWAY_SPAN * 0.5 - 8, 19.0, 0]} material={materials.concreteDam} receiveShadow castShadow>
          <boxGeometry args={[18, 42, 32]} />
        </mesh>

        {/* Right Mountain Abutment Anchor Bastion (Eastern Flank Corner) */}
        <mesh position={[SPILLWAY_SPAN * 0.5 + 48, 17.5, -6]} material={materials.concreteDam} receiveShadow castShadow>
          <boxGeometry args={[96, 44, 48]} />
        </mesh>
        {/* Right Non-Overflow Transition Block */}
        <mesh position={[SPILLWAY_SPAN * 0.5 + 10, 19.0, 0]} material={materials.concreteDam} receiveShadow castShadow>
          <boxGeometry args={[20, 42, 32]} />
        </mesh>

        {/* Massive Sloped Spillway Chute Foundation (Height: 36m) */}
        <mesh
          position={[0, 8.5, 14]}
          rotation-x={0.52}
          material={materials.concreteChute}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[SPILLWAY_SPAN + 4, 22, 38]} />
        </mesh>

        {/* Dam Main Towering Gravity Core Mass */}
        <mesh position={[0, 16.5, -4]} material={materials.concreteDark} receiveShadow castShadow>
          <boxGeometry args={[FULL_DAM_SPAN, 38, 28]} />
        </mesh>

        {/* Ski-Jump Energy Dissipator Bucket at Base of Chute */}
        <mesh position={[0, -0.2, 28]} material={materials.concreteDark} receiveShadow castShadow>
          <boxGeometry args={[SPILLWAY_SPAN + 8, 4.2, 8.0]} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 3. 42 RADIAL SPILLWAY GATE PIERS & STEEL RADIAL GATES     */}
      {/* ========================================================= */}
      <group position={[0, 0, 0]}>
        {Array.from({ length: NUM_GATES + 1 }).map((_, i) => {
          const px = -SPILLWAY_SPAN * 0.5 + i * TOTAL_BAY_WIDTH;
          return (
            <group key={i} position={[px, 0, 0]}>
              {/* Concrete Spillway Divider Pier */}
              <mesh position={[0, 26.5, 2.2]} material={materials.concreteDam} receiveShadow castShadow>
                <boxGeometry args={[PIER_THICKNESS, 17.5, 16.5]} />
              </mesh>
              {/* Upstream Hydrodynamic Bullnose */}
              <mesh position={[0, 26.5, -6.0]} material={materials.concreteDam} receiveShadow castShadow>
                <cylinderGeometry args={[PIER_THICKNESS * 0.5, PIER_THICKNESS * 0.5, 17.5, 12]} />
              </mesh>
              {/* Downstream Sloped Pier Tail */}
              <mesh
                position={[0, 20.0, 11.5]}
                rotation-x={-0.5}
                material={materials.concreteDark}
                receiveShadow
                castShadow
              >
                <boxGeometry args={[PIER_THICKNESS, 11.5, 7.5]} />
              </mesh>
              {/* Vertical Illuminated Light Blade along Pier Tail */}
              {isNight && (
                <mesh position={[0, 20.0, 15.3]} rotation-x={-0.5} material={materials.lightBladeMat}>
                  <boxGeometry args={[PIER_THICKNESS * 0.45, 11.6, 0.15]} />
                </mesh>
              )}
            </group>
          );
        })}

        {/* Curved Radial Steel Gates nestled inside each bay */}
        {Array.from({ length: NUM_GATES }).map((_, i) => {
          const px = -SPILLWAY_SPAN * 0.5 + i * TOTAL_BAY_WIDTH + TOTAL_BAY_WIDTH * 0.5;
          const isGateDischarging = i >= 10 && i <= 31; // Grand central gate discharge
          return (
            <group key={i} position={[px, 21.5, 0.8]}>
              {/* Curved Radial Gate Face Plate */}
              <mesh
                position={[0, isGateDischarging ? 3.2 : 0, 0]}
                rotation-x={-0.2}
                material={materials.steelRadialGate}
                castShadow
              >
                <cylinderGeometry
                  args={[GATE_WIDTH * 0.48, GATE_WIDTH * 0.48, 8.5, 12, 1, false, -0.4, 0.8]}
                />
              </mesh>
              {/* Heavy Radial Trunnion Arms */}
              <mesh
                position={[-GATE_WIDTH * 0.44, isGateDischarging ? 1.4 : -0.8, 3.2]}
                rotation-x={0.42}
                material={materials.steelRadialGate}
              >
                <boxGeometry args={[0.15, 0.22, 7.5]} />
              </mesh>
              <mesh
                position={[GATE_WIDTH * 0.44, isGateDischarging ? 1.4 : -0.8, 3.2]}
                rotation-x={0.42}
                material={materials.steelRadialGate}
              >
                <boxGeometry args={[0.15, 0.22, 7.5]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 4. CREST HIGHWAY BRIDGE, LIGHTING & GANTRY CRANE          */}
      {/* ========================================================= */}
      <group position={[0, 36.0, 0]}>
        {/* Continuous Crest Roadway Deck spanning across the whole Dam */}
        <mesh position={[0, 0, 1.5]} material={materials.crestRoad} receiveShadow castShadow>
          <boxGeometry args={[FULL_DAM_SPAN, 1.2, 10.5]} />
        </mesh>
        {/* Upstream Safety Parapet Barrier */}
        <mesh position={[0, 1.1, -3.4]} material={materials.concreteDam} castShadow>
          <boxGeometry args={[FULL_DAM_SPAN, 1.1, 0.6]} />
        </mesh>
        {/* Downstream Safety Parapet Barrier */}
        <mesh position={[0, 1.1, 6.4]} material={materials.concreteDam} castShadow>
          <boxGeometry args={[FULL_DAM_SPAN, 1.1, 0.6]} />
        </mesh>

        {/* Glowing Luminous Parapet Edges on Far Left & Right Corners */}
        {isNight && (
          <>
            <mesh position={[-FULL_DAM_SPAN * 0.48, 1.4, 6.4]} material={materials.cornerNeonGlowing}>
              <boxGeometry args={[18, 0.25, 0.25]} />
            </mesh>
            <mesh position={[FULL_DAM_SPAN * 0.48, 1.4, 6.4]} material={materials.cornerNeonGlowing}>
              <boxGeometry args={[18, 0.25, 0.25]} />
            </mesh>
          </>
        )}

        {/* Towering Industrial Spillway Gantry Crane */}
        <group position={[-24, 1.8, 1.5]}>
          {/* 4 Leg Supports */}
          <mesh position={[-7.5, 3.8, -2.8]} material={materials.gantrySteel} castShadow>
            <boxGeometry args={[0.8, 7.6, 0.8]} />
          </mesh>
          <mesh position={[-7.5, 3.8, 4.5]} material={materials.gantrySteel} castShadow>
            <boxGeometry args={[0.8, 7.6, 0.8]} />
          </mesh>
          <mesh position={[7.5, 3.8, -2.8]} material={materials.gantrySteel} castShadow>
            <boxGeometry args={[0.8, 7.6, 0.8]} />
          </mesh>
          <mesh position={[7.5, 3.8, 4.5]} material={materials.gantrySteel} castShadow>
            <boxGeometry args={[0.8, 7.6, 0.8]} />
          </mesh>
          {/* Top Heavy Overhead Bridge Truss */}
          <mesh position={[0, 7.8, 0.8]} material={materials.gantrySteel} castShadow>
            <boxGeometry args={[18.5, 1.4, 8.6]} />
          </mesh>
          {/* Hoist Machinery Cab & Winch Trolley */}
          <mesh position={[0, 6.8, 0.8]} material={materials.steelRadialGate} castShadow>
            <boxGeometry args={[4.2, 1.0, 4.2]} />
          </mesh>
          {/* Operator Control Cabin */}
          <mesh position={[-5.5, 6.0, 3.6]} material={materials.powerhouseMat} castShadow>
            <boxGeometry args={[2.5, 2.5, 2.2]} />
          </mesh>
        </group>

        {/* Crest Lighting Poles spanning all the way from left to right corners */}
        {Array.from({ length: 28 }).map((_, i) => {
          const px = -FULL_DAM_SPAN * 0.48 + i * ((FULL_DAM_SPAN * 0.96) / 27);
          return (
            <group key={i} position={[px, 0.6, 6.4]}>
              <mesh position={[0, 2.5, 0]} material={materials.concreteDam}>
                <cylinderGeometry args={[0.06, 0.12, 5.0, 6]} />
              </mesh>
              <mesh position={[0, 5.1, -0.5]} material={materials.lightCapGlowing}>
                <sphereGeometry args={[0.26, 8, 8]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 5. TOWERING DUAL CONTROL TOWERS ON MOUNTAIN ABUTMENTS     */}
      {/* ========================================================= */}
      {/* Left Control Tower Corner */}
      <group position={[-SPILLWAY_SPAN * 0.5 - 12, 37.0, 0]}>
        <mesh position={[0, 6.5, 0]} material={materials.concreteDam} castShadow>
          <boxGeometry args={[10.5, 13.0, 11.5]} />
        </mesh>
        {/* Glass Panoramic Observation Floor */}
        <mesh position={[0, 13.8, 0]} material={materials.glassMat} castShadow>
          <boxGeometry args={[11.5, 3.8, 12.5]} />
        </mesh>
        {/* Tower Roof */}
        <mesh position={[0, 16.2, 0]} material={materials.concreteDark} castShadow>
          <boxGeometry args={[12.5, 1.0, 13.5]} />
        </mesh>
        {/* Antenna / Light Mast */}
        <mesh position={[0, 19.5, 0]} material={materials.steelRadialGate}>
          <cylinderGeometry args={[0.1, 0.18, 6.0, 6]} />
        </mesh>
        <mesh position={[0, 22.8, 0]} material={materials.lightCapGlowing}>
          <sphereGeometry args={[0.35, 8, 8]} />
        </mesh>
        {/* Rotating High-Power Aerodrome Beacon Shaft */}
        {isNight && (
          <DamTowerBeacon beamMaterial={materials.towerBeaconMat} speed={1.2} />
        )}
      </group>

      {/* Right Control & Operations Tower Corner */}
      <group position={[SPILLWAY_SPAN * 0.5 + 12, 37.0, 0]}>
        <mesh position={[0, 6.5, 0]} material={materials.concreteDam} castShadow>
          <boxGeometry args={[10.5, 13.0, 11.5]} />
        </mesh>
        {/* Glass Panoramic Observation Floor */}
        <mesh position={[0, 13.8, 0]} material={materials.glassMat} castShadow>
          <boxGeometry args={[11.5, 3.8, 12.5]} />
        </mesh>
        {/* Tower Roof */}
        <mesh position={[0, 16.2, 0]} material={materials.concreteDark} castShadow>
          <boxGeometry args={[12.5, 1.0, 13.5]} />
        </mesh>
        {/* Antenna / Light Mast */}
        <mesh position={[0, 19.5, 0]} material={materials.steelRadialGate}>
          <cylinderGeometry args={[0.1, 0.18, 6.0, 6]} />
        </mesh>
        <mesh position={[0, 22.8, 0]} material={materials.lightCapGlowing}>
          <sphereGeometry args={[0.35, 8, 8]} />
        </mesh>
        {/* Rotating High-Power Aerodrome Beacon Shaft */}
        {isNight && (
          <DamTowerBeacon beamMaterial={materials.towerBeaconMat} speed={-1.1} />
        )}
      </group>

      {/* ========================================================= */}
      {/* 6. HYDROELECTRIC POWERHOUSE & SUBSTATION COMPLEX          */}
      {/* ========================================================= */}
      <group position={[SPILLWAY_SPAN * 0.5 + 36, 0, 16]}>
        {/* Main Generator Hall Building */}
        <mesh position={[0, 7.5, 0]} material={materials.powerhouseMat} receiveShadow castShadow>
          <boxGeometry args={[36, 15.0, 24]} />
        </mesh>
        {/* Generator Hall Roof */}
        <mesh position={[0, 15.5, 0]} material={materials.concreteDark} castShadow>
          <boxGeometry args={[37.5, 1.2, 25.5]} />
        </mesh>
        {/* High-voltage Transformer Yard Substation Blocks */}
        {[-12, 0, 12].map((tx) => (
          <group key={tx} position={[tx, 2.0, 17]}>
            <mesh material={materials.concreteDark} castShadow>
              <boxGeometry args={[6.5, 4.0, 6.5]} />
            </mesh>
            <mesh position={[0, 3.5, 0]} material={materials.steelRadialGate}>
              <cylinderGeometry args={[0.15, 0.22, 3.5, 6]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 7. MASSIVE SPILLWAY WATER DISCHARGE RAPIDS & ACTIVE FOAM  */}
      {/* ========================================================= */}
      <group position={[0, 0.2, 42]} rotation-x={-Math.PI / 2}>
        <mesh>
          <planeGeometry args={[SPILLWAY_SPAN * 0.96, 68, 48, 24]} />
          <shaderMaterial
            ref={foamMatRef}
            vertexShader={foamShader.vertexShader}
            fragmentShader={foamShader.fragmentShader}
            uniforms={foamShader.uniforms}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 8. DOWNSTREAM SUBTLE RIVERBED PEBBLE SHOALS & GRAVEL BARS */}
      {/* ========================================================= */}
      <group position={[0, -2.1, 70]}>
        {[
          { x: -35, z: 15, sx: 12, sz: 6, sy: 0.45, rot: 0.15 },
          { x: 28, z: 32, sx: 14, sz: 7, sy: 0.5, rot: -0.2 },
          { x: -12, z: 50, sx: 10, sz: 5, sy: 0.4, rot: 0.28 },
          { x: 42, z: 60, sx: 12, sz: 6, sy: 0.45, rot: -0.12 },
          { x: -45, z: 45, sx: 11, sz: 5, sy: 0.4, rot: 0.35 },
          { x: 10, z: 90, sx: 15, sz: 7, sy: 0.5, rot: 0.08 },
          { x: -22, z: 110, sx: 12, sz: 6, sy: 0.45, rot: -0.15 },
          { x: 32, z: 120, sx: 14, sz: 7, sy: 0.5, rot: 0.22 },
        ].map((shoal, idx) => (
          <group key={idx} position={[shoal.x, 0, shoal.z]} rotation-y={shoal.rot}>
            {/* Gravel Shoal Ridge */}
            <mesh
              position={[0, shoal.sy * 0.3, 0]}
              scale={[shoal.sx, shoal.sy, shoal.sz]}
              material={materials.rockShoalMat}
              receiveShadow
            >
              <dodecahedronGeometry args={[1, 1]} />
            </mesh>
            {/* Wet Edge Rock Rib */}
            <mesh
              position={[0, -0.15, 0]}
              scale={[shoal.sx * 1.15, shoal.sy * 0.35, shoal.sz * 1.15]}
              material={materials.wetGravelMat}
              receiveShadow
            >
              <cylinderGeometry args={[1, 1.2, 1, 8]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 9. FULL HEIGHT & FULL WIDTH DYNAMIC WAVING INDIAN FLAG    */}
      {/*    (TIRANGA) LASER PROJECTION (ACTIVE ON LIGHT SHOW)      */}
      {/* ========================================================= */}
      {isNight && isLightShow && (
        <group position={[0, 0, 0]}>
          {/* Main Full Dam Waving Flag Mesh wrapping over gates, piers, and sloped chute */}
          <mesh geometry={flagGeometry} renderOrder={30}>
            <shaderMaterial
              ref={flagMatRef}
              vertexShader={flagShader.vertexShader}
              fragmentShader={flagShader.fragmentShader}
              uniforms={flagShader.uniforms}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Saffron (Left), White (Center), Green (Right) Accent Spotlights focused onto the spillway */}
          <spotLight
            position={[-SPILLWAY_SPAN * 0.35, 28, 48]}
            target-position={[-SPILLWAY_SPAN * 0.35, 18, 18]}
            color="#ff6d00"
            intensity={80}
            distance={220}
            angle={0.9}
            penumbra={0.35}
          />
          <spotLight
            position={[0, 28, 48]}
            target-position={[0, 18, 18]}
            color="#ffffff"
            intensity={75}
            distance={220}
            angle={0.9}
            penumbra={0.35}
          />
          <spotLight
            position={[SPILLWAY_SPAN * 0.35, 28, 48]}
            target-position={[SPILLWAY_SPAN * 0.35, 18, 18]}
            color="#059e29"
            intensity={80}
            distance={220}
            angle={0.9}
            penumbra={0.35}
          />
        </group>
      )}


    </group>
  );
}

/**
 * 360-degree Sweeping Aerodrome Searchlight Beacon atop Dam Control Towers
 */
function DamTowerBeacon({ beamMaterial, speed = 1.0 }: { beamMaterial: THREE.Material; speed?: number }) {
  const beaconRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!beaconRef.current) return;
    beaconRef.current.rotation.y = state.clock.getElapsedTime() * speed;
  });

  return (
    <group ref={beaconRef} position={[0, 23.2, 0]}>
      {/* Front sweeping light cone */}
      <mesh position={[0, 0, 16]} rotation-x={Math.PI / 2} material={beamMaterial} renderOrder={14}>
        <cylinderGeometry args={[4.5, 0.25, 32, 16, 1, true]} />
      </mesh>
      {/* Opposite trailing light cone */}
      <mesh position={[0, 0, -16]} rotation-x={-Math.PI / 2} material={beamMaterial} renderOrder={14}>
        <cylinderGeometry args={[4.5, 0.25, 32, 16, 1, true]} />
      </mesh>
    </group>
  );
}
