import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Custom GLSL Shader for Dynamic Laser Light Beams
 * Creates bright pencil-thin laser shafts with intense core and soft atmospheric halo
 */
const laserVertShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const laserFragShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float y = vUv.y;
    // Radial core falloff
    float radial = abs(vUv.x - 0.5) * 2.0;
    float core = pow(clamp(1.0 - radial, 0.0, 1.0), 3.2);

    // Laser beam along-length fade
    float lengthFade = pow(1.0 - y * 0.7, 1.2);

    // Micro laser flicker
    float flicker = 0.92 + 0.08 * sin(uTime * 18.0 + y * 40.0);

    float alpha = core * lengthFade * uIntensity * flicker * 0.75;
    vec3 col = mix(uColor, vec3(1.0), pow(core, 4.0) * 0.7);

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

interface LaserProps {
  origin: [number, number, number];
  targetAngle: { rx: number; rz: number; sweepSpeed: number; sweepRange: number };
  color: string;
  length?: number;
  radius?: number;
}

function SweepingLaser({
  origin,
  targetAngle,
  color,
  length = 180,
  radius = 0.22,
}: LaserProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: 1.8 },
    }),
    [color]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (matRef.current && matRef.current.uniforms["uTime"]) {
      matRef.current.uniforms["uTime"].value = t;
    }
    if (groupRef.current) {
      const sweep = Math.sin(t * targetAngle.sweepSpeed) * targetAngle.sweepRange;
      groupRef.current.rotation.x = targetAngle.rx + sweep * 0.6;
      groupRef.current.rotation.z = targetAngle.rz + sweep;
    }
  });

  return (
    <group ref={groupRef} position={origin}>
      {/* Position cylinder so origin [0,0,0] is at its base emitter */}
      <mesh position={[0, length * 0.5, 0]}>
        <cylinderGeometry args={[radius * 1.8, radius, length, 16, 1, true]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={laserVertShader}
          fragmentShader={laserFragShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Laser emitter head lens */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.32, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/**
 * StatueLaserShow:
 * Spectacular Indian Flag (Tiranga) Laser & Light Projection Show
 * Recreates the world-famous Kevadia Light Show matching the user reference photo!
 */
export function StatueLaserShow() {
  const targetChest = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(-6, 22, 0);
    return obj;
  }, []);

  const targetHead = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(-6, 35, 0);
    return obj;
  }, []);

  const targetFeet = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(-6, 8, 0);
    return obj;
  }, []);

  return (
    <group>
      <primitive object={targetChest} />
      <primitive object={targetHead} />
      <primitive object={targetFeet} />

      {/* ========================================================= */}
      {/* 1. INDIAN FLAG (TIRANGA) PROJECTION LIGHT ARRAY           */}
      {/* ========================================================= */}

      {/* LOWER SECTION: Vibrant Saffron / Orange-Red on Dhoti & Legs */}
      <spotLight
        position={[-6, 2.0, 7.5]}
        target={targetFeet}
        color="#ff3d00"
        intensity={75}
        distance={60}
        angle={0.88}
        penumbra={0.35}
        decay={1.1}
      />
      <spotLight
        position={[-10, 2.2, 6.0]}
        target={targetFeet}
        color="#ff5722"
        intensity={55}
        distance={55}
        angle={0.8}
        penumbra={0.4}
        decay={1.1}
      />
      <spotLight
        position={[-2, 2.2, 6.0]}
        target={targetFeet}
        color="#ff5722"
        intensity={55}
        distance={55}
        angle={0.8}
        penumbra={0.4}
        decay={1.1}
      />

      {/* MIDDLE SECTION: Pure Luminous White on Torso & Kurta */}
      <spotLight
        position={[-6, 12.0, 15.0]}
        target={targetChest}
        color="#ffffff"
        intensity={65}
        distance={110}
        angle={0.65}
        penumbra={0.35}
        decay={1.1}
      />
      <spotLight
        position={[-11, 10.0, 12.0]}
        target={targetChest}
        color="#f8fafc"
        intensity={45}
        distance={95}
        angle={0.65}
        penumbra={0.4}
        decay={1.2}
      />
      <spotLight
        position={[-1, 10.0, 12.0]}
        target={targetChest}
        color="#f8fafc"
        intensity={45}
        distance={95}
        angle={0.65}
        penumbra={0.4}
        decay={1.2}
      />

      {/* UPPER SECTION: Royal Blue / Sky Cyan Projection on Head, Face & Shawl */}
      <spotLight
        position={[-6, 16.0, 18.0]}
        target={targetHead}
        color="#00b0ff"
        intensity={65}
        distance={130}
        angle={0.52}
        penumbra={0.35}
        decay={1.0}
      />
      <spotLight
        position={[-6, 8.0, 14.0]}
        target={targetHead}
        color="#1565c0"
        intensity={50}
        distance={120}
        angle={0.48}
        penumbra={0.4}
        decay={1.1}
      />

      {/* BASE PLINTH: Emerald Green Laser Glow */}
      <spotLight
        position={[-6, 0.8, 5.0]}
        target={targetFeet}
        color="#00e676"
        intensity={45}
        distance={35}
        angle={0.9}
        penumbra={0.5}
        decay={1.2}
      />

      {/* 360 Fill Multi-Color Lights */}
      <pointLight position={[-6, 8, 4]} color="#ff3d00" intensity={25} distance={25} />
      <pointLight position={[-6, 22, 4]} color="#ffffff" intensity={22} distance={30} />
      <pointLight position={[-6, 34, 4]} color="#0091ea" intensity={22} distance={30} />

      {/* ========================================================= */}
      {/* 2. DYNAMIC SWEEPING LASER BEAMS CUTTING THROUGH THE SKY   */}
      {/* ========================================================= */}

      {/* Emerald Green Laser Projectors */}
      <SweepingLaser
        origin={[-12, 3.5, 5.5]}
        targetAngle={{ rx: 0.35, rz: 0.45, sweepSpeed: 1.4, sweepRange: 0.35 }}
        color="#00e676"
        length={240}
      />
      <SweepingLaser
        origin={[0, 3.5, 5.5]}
        targetAngle={{ rx: 0.35, rz: -0.45, sweepSpeed: 1.2, sweepRange: 0.35 }}
        color="#00e676"
        length={240}
      />

      {/* Saffron Orange High-Power Lasers */}
      <SweepingLaser
        origin={[-8, 3.8, 6.5]}
        targetAngle={{ rx: 0.25, rz: 0.2, sweepSpeed: 1.8, sweepRange: 0.25 }}
        color="#ff3d00"
        length={260}
      />
      <SweepingLaser
        origin={[-4, 3.8, 6.5]}
        targetAngle={{ rx: 0.25, rz: -0.2, sweepSpeed: 1.6, sweepRange: 0.25 }}
        color="#ff6d00"
        length={260}
      />

      {/* Royal Blue Sky Piercing Lasers */}
      <SweepingLaser
        origin={[-6, 4.0, 8.0]}
        targetAngle={{ rx: 0.15, rz: 0.05, sweepSpeed: 2.2, sweepRange: 0.18 }}
        color="#00b0ff"
        length={280}
      />
      <SweepingLaser
        origin={[-6, 4.0, 4.0]}
        targetAngle={{ rx: -0.2, rz: 0.15, sweepSpeed: 1.5, sweepRange: 0.22 }}
        color="#2979ff"
        length={250}
      />

      {/* Flanking River Crossing Lasers */}
      <SweepingLaser
        origin={[-18, 1.2, 4]}
        targetAngle={{ rx: 0.45, rz: 0.6, sweepSpeed: 0.9, sweepRange: 0.4 }}
        color="#00e676"
        length={220}
      />
      <SweepingLaser
        origin={[6, 1.2, 4]}
        targetAngle={{ rx: 0.45, rz: -0.6, sweepSpeed: 0.9, sweepRange: 0.4 }}
        color="#ff3d00"
        length={220}
      />
    </group>
  );
}
