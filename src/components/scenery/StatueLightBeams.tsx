import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Custom GLSL Shader for Volumetric Light Shafts:
 * - Extremely bright, concentrated golden-white flash at the base emitter
 * - Spreads out wide over Sardar Patel's statue as it shoots upward
 * - Soft radial falloff and atmospheric dust shimmer
 */
const beamVertShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const beamFragShader = /* glsl */ `
  uniform vec3 uColorCore;
  uniform vec3 uColorOuter;
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormal;

  void main() {
    // Vertical progression: 0.0 is emitter base, 1.0 is top spread
    float y = vUv.y;

    // Bottom flash intensity peak (concentrated intense beam origin)
    float baseFlash = pow(1.0 - y, 2.2) * 2.2;
    // Main shaft body spread
    float shaftBody = sin(y * 3.14159) * 0.9 + (1.0 - y) * 0.65;
    float verticalFactor = clamp(baseFlash + shaftBody, 0.0, 3.0);

    // Soft cylindrical / radial falloff (fade at edges)
    // For cylinder UVs: x is circumferential
    float radial = abs(vUv.x - 0.5) * 2.0;
    float edgeFalloff = pow(clamp(1.0 - radial, 0.0, 1.0), 1.7);

    // Atmospheric micro-shimmer & dust drift
    float shimmer = 1.0 + 0.08 * sin(uTime * 2.4 + vWorldPos.y * 0.6 + vWorldPos.x * 0.3);

    // Dynamic color gradient: White-gold at core base -> Rich amber-gold higher up
    vec3 color = mix(uColorOuter, uColorCore, pow(1.0 - y, 1.5) * 0.7);

    float alpha = verticalFactor * edgeFalloff * uIntensity * shimmer * 0.32;

    gl_FragColor = vec4(color * (1.0 + baseFlash * 0.6), clamp(alpha, 0.0, 1.0));
  }
`;

interface LightBeamProps {
  start: [number, number, number];
  end: [number, number, number];
  radiusBottom: number;
  radiusTop: number;
  intensity?: number;
  colorCore?: string;
  colorOuter?: string;
}

/**
 * Individual oriented volumetric light beam cone
 */
function VolumetricBeam({
  start,
  end,
  radiusBottom,
  radiusTop,
  intensity = 1.0,
  colorCore = "#fffbeb",
  colorOuter = "#f59e0b",
}: LightBeamProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Compute transform (orientation, position, height) between start and end vectors
  const { position, quaternion, height } = useMemo(() => {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(vEnd, vStart);
    const h = dir.length();

    // Midpoint between start and end
    const pos = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);

    // Orientation: Three.js Cylinder default axis is Y-up [0, 1, 0]
    const quat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    dir.normalize();
    quat.setFromUnitVectors(up, dir);

    return { position: pos, quaternion: quat, height: h };
  }, [start, end]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uColorCore: { value: new THREE.Color(colorCore) },
      uColorOuter: { value: new THREE.Color(colorOuter) },
    }),
    [intensity, colorCore, colorOuter]
  );

  useFrame((state) => {
    if (matRef.current && matRef.current.uniforms["uTime"]) {
      matRef.current.uniforms["uTime"].value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} position={position} quaternion={quaternion} renderOrder={10}>
      {/* CylinderGeometry: radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded */}
      <cylinderGeometry args={[radiusTop, radiusBottom, height, 32, 12, true]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={beamVertShader}
        fragmentShader={beamFragShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * High-intensity glowing flare disc at the bottom emitter fixture
 */
function FlashFlare({
  position,
  scale = 1.6,
  color = "#ffd166",
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <group position={position}>
      {/* Intense White-Golden Core Flash */}
      <mesh>
        <sphereGeometry args={[scale * 0.35, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Radiant Golden Outer Glow Corona */}
      <mesh>
        <sphereGeometry args={[scale * 0.95, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Large Soft Glow Ring */}
      <mesh>
        <sphereGeometry args={[scale * 1.9, 16, 16]} />
        <meshBasicMaterial
          color="#ff9f1c"
          transparent
          opacity={0.38}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Solid Lamp Housing Mount */}
      <mesh position={[0, -scale * 0.35, 0]}>
        <boxGeometry args={[scale * 0.7, scale * 0.5, scale * 0.7]} />
        <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Floating luminous golden atmospheric light motes / rising dust particles in the beams
 */
function RisingLightMotes() {
  const count = 75;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      x: -6 + (Math.random() - 0.5) * 12,
      y: 4.5 + Math.random() * 32,
      z: (Math.random() - 0.5) * 9 + 2,
      speedY: 0.8 + Math.random() * 1.4,
      driftX: (Math.random() - 0.5) * 0.3,
      driftZ: (Math.random() - 0.5) * 0.3,
      scale: 0.08 + Math.random() * 0.16,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      if (!p) continue;

      p.y += p.speedY * delta;
      p.x += Math.sin(p.phase + p.y * 0.4) * 0.015;
      p.phase += delta;

      // Wrap back to bottom emitter plinth once reaching upper torso
      if (p.y > 38) {
        p.y = 4.5;
        p.x = -6 + (Math.random() - 0.5) * 7;
        p.z = (Math.random() - 0.5) * 6 + 2.5;
      }

      const pulse = 1.0 + 0.3 * Math.sin(p.phase * 3);
      tempObj.position.set(p.x, p.y, p.z);
      tempObj.scale.setScalar(p.scale * pulse);
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color="#ffeaa7"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/**
 * StatueLightBeams:
 * Renders multiple realistic volumetric light shafts shooting from the base of the statue
 * and spreading dramatically upwards across the legs, dhoti, chest, and head.
 */
export function StatueLightBeams() {
  return (
    <group position={[-6, 0, 0]} rotation-y={0}>
      {/* 1. Main Center Floodlight Beam: Shoots from front base platform up over chest & head */}
      <VolumetricBeam
        start={[0, 4.2, 7.5]}
        end={[0, 32, 0.5]}
        radiusBottom={0.65}
        radiusTop={9.8}
        intensity={1.1}
        colorCore="#ffffff"
        colorOuter="#f7ebd8"
      />

      {/* 2. Left Flank Angled Beam: Illuminates left drapery and side profile */}
      <VolumetricBeam
        start={[-4.2, 4.0, 5.8]}
        end={[0.8, 30, -0.5]}
        radiusBottom={0.55}
        radiusTop={8.4}
        intensity={0.95}
        colorCore="#fff9f0"
        colorOuter="#f5e6ce"
      />

      {/* 3. Right Flank Angled Beam: Illuminates right shoulder and shawl */}
      <VolumetricBeam
        start={[4.2, 4.0, 5.8]}
        end={[-0.8, 30, -0.5]}
        radiusBottom={0.55}
        radiusTop={8.4}
        intensity={0.95}
        colorCore="#fff9f0"
        colorOuter="#f5e6ce"
      />

      {/* 4. High-Angle Spot Beam: Focused upward beam reaching head & upper silhouette */}
      <VolumetricBeam
        start={[0, 4.2, 9.8]}
        end={[0, 42, 0]}
        radiusBottom={0.45}
        radiusTop={6.8}
        intensity={0.9}
        colorCore="#ffffff"
        colorOuter="#f0dfc8"
      />

      {/* 5. Rear Dramatic Backlight Rim Beam */}
      <VolumetricBeam
        start={[0, 3.8, -5.8]}
        end={[0, 28, 0.5]}
        radiusBottom={0.6}
        radiusTop={8.0}
        intensity={0.6}
        colorCore="#fff7ed"
        colorOuter="#e8d4b8"
      />

      {/* ========================================================= */}
      {/* Glowing Lens Flash Flares at Base Floodlight Fixtures     */}
      {/* ========================================================= */}
      <FlashFlare position={[0, 4.2, 7.5]} scale={1.6} color="#fff4e6" />
      <FlashFlare position={[-4.2, 4.0, 5.8]} scale={1.4} color="#faecd9" />
      <FlashFlare position={[4.2, 4.0, 5.8]} scale={1.4} color="#faecd9" />
      <FlashFlare position={[0, 4.2, 9.8]} scale={1.5} color="#fff8f0" />
      <FlashFlare position={[0, 3.8, -5.8]} scale={1.2} color="#f5e6ce" />

      {/* Rising Warm Atmospheric Light Dust Motes in the beam path */}
      <RisingLightMotes />
    </group>
  );
}
