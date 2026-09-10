import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  subscribeLightShowState,
  getLightShowState,
  LightShowState,
} from "./sceneControlStore";

interface SpectacularLightEffectsProps {
  isNight?: boolean;
  isLightShow?: boolean;
}

/**
 * GLSL Shader for Dynamic Volumetric Aerial Searchlights & Laser Beams
 */
const aerialBeamVertShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const aerialBeamFragShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uBeamTightness;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    float y = vUv.y;
    // Base flash and long upward beam spread
    float baseFlash = pow(1.0 - y, 2.5) * 2.8;
    float beamBody = pow(1.0 - y, uBeamTightness) * 1.2 + 0.15;
    
    // Radial edge falloff
    float radial = abs(vUv.x - 0.5) * 2.0;
    float edge = pow(clamp(1.0 - radial, 0.0, 1.0), 2.2);

    float shimmer = 1.0 + 0.12 * sin(uTime * 4.0 + vWorldPos.y * 0.4 + vWorldPos.x * 0.2);
    float alpha = clamp((baseFlash + beamBody) * edge * uIntensity * shimmer * 0.45, 0.0, 1.0);

    gl_FragColor = vec4(uColor * (1.0 + baseFlash * 0.8), alpha);
  }
`;

/**
 * 1. Sky-Sweeping Searchlight Beams Array (8 synchronized volumetric searchlight towers)
 */
function SkySweepingSearchlights({ isLightShow = false }: { isLightShow?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(isLightShow ? "#38bdf8" : "#fffbeb") },
      uIntensity: { value: isLightShow ? 1.6 : 1.1 },
      uBeamTightness: { value: 0.8 },
    }),
    [isLightShow]
  );

  const searchlightPositions = useMemo(() => [
    { x: -16, y: 0.5, z: 14, speed: 0.65, phase: 0 },
    { x: 4, y: 0.5, z: 14, speed: 0.72, phase: Math.PI * 0.35 },
    { x: -22, y: 0.5, z: -8, speed: 0.58, phase: Math.PI * 0.7 },
    { x: 8, y: 0.5, z: -8, speed: 0.68, phase: Math.PI * 1.1 },
    { x: -45, y: -1.5, z: 45, speed: 0.45, phase: Math.PI * 0.2 },
    { x: 35, y: -1.5, z: 65, speed: 0.52, phase: Math.PI * 0.8 },
    { x: -65, y: -1.5, z: -65, speed: 0.62, phase: Math.PI * 1.4 },
    { x: 48, y: -1.5, z: -35, speed: 0.48, phase: Math.PI * 1.7 },
  ], []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    uniforms.uTime.value = t;

    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const sl = searchlightPositions[i];
        if (!sl) return;
        const angleY = Math.sin(t * sl.speed + sl.phase) * 0.65;
        const angleX = -0.35 + Math.cos(t * sl.speed * 0.8 + sl.phase) * 0.38;
        child.rotation.set(angleX, angleY, 0);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {searchlightPositions.map((sl, idx) => (
        <group key={`searchlight-${idx}`} position={[sl.x, sl.y, sl.z]}>
          {/* Volumetric Beam Cone */}
          <mesh position={[0, 48, 0]} renderOrder={12}>
            <cylinderGeometry args={[14.0, 0.4, 96, 24, 8, true]} />
            <shaderMaterial
              vertexShader={aerialBeamVertShader}
              fragmentShader={aerialBeamFragShader}
              uniforms={uniforms}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Emitter Fixture Disc */}
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.7, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.8, 0.5, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * 2. Aerial High-Power Laser Cannons (Quad Corner Projectors with Phase-Responsive Tiranga Colors)
 */
function AerialLaserCannons({ phaseIndex = 0 }: { phaseIndex?: number }) {
  const laserMatsRef = useRef<THREE.ShaderMaterial[]>([]);
  const laserPositions = useMemo(() => [
    { x: -18, y: 1.8, z: 16, target: [-80, 140, 60] as [number, number, number] },
    { x: 8, y: 1.8, z: 16, target: [60, 140, 80] as [number, number, number] },
    { x: -18, y: 1.8, z: -16, target: [-70, 140, -90] as [number, number, number] },
    { x: 8, y: 1.8, z: -16, target: [70, 140, -80] as [number, number, number] },
  ], []);

  const laserColor = useMemo(() => {
    switch (phaseIndex) {
      case 0: return new THREE.Color("#ff6d00"); // Saffron
      case 1: return new THREE.Color("#00b0ff"); // Cyan / Blue
      case 2: return new THREE.Color("#ffffff"); // White
      case 3: return new THREE.Color("#00e676"); // Green
      case 4: return new THREE.Color("#ffab40"); // Gold
      case 5: return new THREE.Color("#39ff14"); // Neon Laser
      case 6: default: return new THREE.Color("#00e676"); // Tiranga
    }
  }, [phaseIndex]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    laserMatsRef.current.forEach((mat) => {
      if (mat?.uniforms) {
        if (mat.uniforms["uTime"]) {
          mat.uniforms["uTime"].value = t;
        }
        if (mat.uniforms["uColor"]) {
          mat.uniforms["uColor"].value = laserColor;
        }
      }
    });
  });

  return (
    <group>
      {laserPositions.map((lp, idx) => {
        const start = new THREE.Vector3(lp.x, lp.y, lp.z);
        const end = new THREE.Vector3(...lp.target);
        const dir = new THREE.Vector3().subVectors(end, start);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());

        const uniforms = {
          uTime: { value: 0 },
          uColor: { value: laserColor },
          uIntensity: { value: 2.2 },
          uBeamTightness: { value: 0.2 },
        };

        return (
          <group key={`laser-${idx}`}>
            <mesh position={mid} quaternion={quat} renderOrder={15}>
              <cylinderGeometry args={[1.2, 0.15, len, 16, 4, true]} />
              <shaderMaterial
                ref={(el) => {
                  if (el) laserMatsRef.current[idx] = el;
                }}
                vertexShader={aerialBeamVertShader}
                fragmentShader={aerialBeamFragShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Laser Base Turret */}
            <mesh position={[lp.x, lp.y, lp.z]}>
              <sphereGeometry args={[0.5, 12, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * 3. Monument Halo Aura Corona (Hovering Above Sardar Patel's Head)
 */
function MonumentHaloAura({ isLightShow = false }: { isLightShow?: boolean }) {
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!haloRef.current) return;
    const t = state.clock.getElapsedTime();
    const scale = 1.0 + Math.sin(t * 2.2) * 0.08;
    haloRef.current.scale.set(scale, scale, scale);
    haloRef.current.rotation.y = t * 0.4;
  });

  return (
    <group position={[-6, 42, 0]}>
      {/* Outer Luminous Ring */}
      <mesh ref={haloRef} rotation-x={Math.PI / 2} renderOrder={14}>
        <torusGeometry args={[7.2, 0.45, 16, 48]} />
        <meshBasicMaterial
          color={isLightShow ? "#f59e0b" : "#fffbeb"}
          transparent
          opacity={isLightShow ? 0.65 : 0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Secondary Inner Glow Ring */}
      <mesh rotation-x={Math.PI / 2} renderOrder={14}>
        <torusGeometry args={[5.8, 0.25, 16, 48]} />
        <meshBasicMaterial
          color={isLightShow ? "#60a5fa" : "#fed7aa"}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * 4. River Perimeter Underwater Floodlight Ribbon (24 Underwater fixtures along Sadhu Bet island crags)
 */
function RiverPerimeterUnderwaterGlow({ isLightShow = false }: { isLightShow?: boolean }) {
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  const perimeterPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const rx = 18.0 + Math.sin(angle * 3) * 2.5;
      const rz = 22.0 + Math.cos(angle * 2) * 3.0;
      const px = -6 + Math.cos(angle) * rx;
      const pz = Math.sin(angle) * rz;
      points.push([px, -2.95, pz]);
    }
    return points;
  }, []);

  useFrame((state) => {
    if (!glowRef.current) return;
    const t = state.clock.getElapsedTime();

    perimeterPoints.forEach((pt, i) => {
      const pulse = 1.0 + 0.25 * Math.sin(t * 3.2 + i * 0.4);
      tempObj.position.set(pt[0], pt[1], pt[2]);
      tempObj.scale.set(3.8 * pulse, 0.15, 3.8 * pulse);
      tempObj.updateMatrix();
      glowRef.current!.setMatrixAt(i, tempObj.matrix);
    });
    glowRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={glowRef}
      args={[undefined, undefined, perimeterPoints.length]}
      renderOrder={8}
    >
      <cylinderGeometry args={[1, 1, 0.1, 16]} />
      <meshBasicMaterial
        color={isLightShow ? "#38bdf8" : "#f59e0b"}
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/**
 * 5. Aerial Sky Laser Fan (12 sweeping fan blades spreading across the valley)
 */
function SkyLaserFan({ isLightShow = false }: { isLightShow?: boolean }) {
  const fanGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!fanGroupRef.current) return;
    const t = state.clock.getElapsedTime();
    fanGroupRef.current.children.forEach((blade, i) => {
      const baseSpread = -0.75 + (i / 11) * 1.5;
      const wave = Math.sin(t * 1.8 + i * 0.3) * 0.08;
      blade.rotation.z = baseSpread + wave;
    });
  });

  return (
    <group ref={fanGroupRef} position={[-6, 3.2, 0]}>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`fan-blade-${i}`} position={[0, 42, 0]} renderOrder={13}>
          <cylinderGeometry args={[0.2, 0.04, 85, 8, 1, true]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? "#ff6d00" : i % 3 === 1 ? "#ffffff" : "#00e676"}
            transparent
            opacity={isLightShow ? 0.6 : 0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 6. Mountain Horizon Rim Silhouette Lighting
 */
function MountainHorizonRimLighting({ isLightShow = false }: { isLightShow?: boolean }) {
  const rimPositions = useMemo(() => [
    { x: -180, y: 48, z: -160, color: "#60a5fa" },
    { x: -140, y: 55, z: -240, color: "#f59e0b" },
    { x: -90, y: 62, z: -300, color: "#38bdf8" },
    { x: 140, y: 52, z: -140, color: "#f59e0b" },
    { x: 180, y: 58, z: 80, color: "#38bdf8" },
    { x: 120, y: 64, z: 220, color: "#60a5fa" },
  ], []);

  return (
    <group>
      {rimPositions.map((rp, idx) => (
        <group key={`rim-${idx}`} position={[rp.x, rp.y, rp.z]}>
          <mesh renderOrder={6}>
            <sphereGeometry args={[18, 16, 16]} />
            <meshBasicMaterial
              color={isLightShow ? rp.color : "#ffd8a8"}
              transparent
              opacity={0.28}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * SpectacularLightEffects:
 * Comprehensive 3D suite of 20+ spectacular night illumination and laser mapping effects:
 * - 8 Synchronized Sky-Sweeping Searchlight Beams
 * - Quad Phase-Responsive High-Power Aerial Laser Cannons
 * - Monument Halo Aura Corona
 * - 24 Underwater Shoreline Perimeter Floodlights
 * - 12-Blade Aerial Sky Laser Fan
 * - Mountain Horizon Rim Skyline Lighting
 */
export function SpectacularLightEffects({ isNight = false, isLightShow = false }: SpectacularLightEffectsProps) {
  const [showState, setShowState] = useState<LightShowState>(getLightShowState());

  useEffect(() => {
    return subscribeLightShowState((state) => {
      setShowState(state);
    });
  }, []);

  if (!isNight) return null;

  return (
    <group name="SpectacularLightEffects">
      {/* 1. 8 Sky-Sweeping Searchlights */}
      <SkySweepingSearchlights isLightShow={isLightShow} />

      {/* 2. Quad Aerial Laser Cannons */}
      <AerialLaserCannons phaseIndex={showState.phaseIndex} />

      {/* 3. Monument Halo Aura */}
      <MonumentHaloAura isLightShow={isLightShow} />

      {/* 4. 24 Underwater Perimeter Floodlights */}
      <RiverPerimeterUnderwaterGlow isLightShow={isLightShow} />

      {/* 5. 12-Blade Aerial Laser Fan (Active in Light Show) */}
      {isLightShow && <SkyLaserFan isLightShow={isLightShow} />}

      {/* 6. Mountain Horizon Rim Lighting */}
      <MountainHorizonRimLighting isLightShow={isLightShow} />
    </group>
  );
}
