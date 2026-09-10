import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface BirdData {
  flock: "egret" | "eagle";
  baseRadiusX: number;
  baseRadiusZ: number;
  centerPos: [number, number, number];
  height: number;
  speed: number;
  flapSpeed: number;
  scale: number;
  phase: number;
  bodyColor: string;
  wingColor: string;
  wingTipColor: string;
}

const BIRD_COUNT = 18;

export function Birds() {
  const birdsGroupRef = useRef<THREE.Group>(null);
  const leftWingsRef = useRef<(THREE.Group | null)[]>([]);
  const rightWingsRef = useRef<(THREE.Group | null)[]>([]);

  // Generate diverse flocking birds (River Egrets + Mountain Eagles)
  const birdSeeds = useMemo<BirdData[]>(() => {
    const list: BirdData[] = [];

    // 1. White River Valley Egrets soaring over the water & island
    for (let i = 0; i < 16; i++) {
      const isLeader = i === 0;
      list.push({
        flock: "egret",
        baseRadiusX: 28 + (i % 5) * 7,
        baseRadiusZ: 34 + (i % 4) * 8,
        centerPos: [-8, 0, 10],
        height: 18 + (i % 6) * 2.8,
        speed: 0.22 + (i % 3) * 0.03,
        flapSpeed: 7.5 + (i % 4) * 0.8,
        scale: isLeader ? 0.22 : 0.15 + (i % 4) * 0.02,
        phase: (i / 16) * Math.PI * 2 + (i * 0.12),
        bodyColor: "#f8fafc",
        wingColor: "#e2e8f0",
        wingTipColor: "#64748b",
      });
    }

    // 2. High-Altitude Soaring Eagles over the mountain backdrop
    for (let i = 0; i < 6; i++) {
      list.push({
        flock: "eagle",
        baseRadiusX: 55 + (i % 3) * 16,
        baseRadiusZ: 45 + (i % 2) * 18,
        centerPos: [-20, 0, -50],
        height: 48 + i * 4.5,
        speed: 0.14 + (i % 2) * 0.02,
        flapSpeed: 4.2 + (i % 2) * 0.5,
        scale: 0.28 + (i % 3) * 0.04,
        phase: (i / 6) * Math.PI * 2 + 1.2,
        bodyColor: "#451a03",
        wingColor: "#78350f",
        wingTipColor: "#d97706",
      });
    }

    return list;
  }, []);

  const timeRef = useRef(0);

  // Shared geometric parts for high performance & clean silhouette
  const parts = useMemo(() => {
    // Aerodynamic Bird Torso
    const bodyGeo = new THREE.ConeGeometry(0.24, 1.4, 6);
    bodyGeo.rotateX(Math.PI / 2);

    // Bird Head & Beak
    const headGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const beakGeo = new THREE.ConeGeometry(0.06, 0.45, 4);
    beakGeo.rotateX(-Math.PI / 2);

    // Tail Feathers
    const tailGeo = new THREE.BoxGeometry(0.42, 0.04, 0.65);

    // Main Wing Panel
    const wingMainGeo = new THREE.BoxGeometry(1.25, 0.04, 0.55);
    wingMainGeo.translate(0.625, 0, 0); // Pivot at shoulder

    // Tapered Wingtip Feather
    const wingTipGeo = new THREE.BoxGeometry(0.85, 0.03, 0.38);
    wingTipGeo.translate(0.425, 0, 0); // Pivot at wing joint

    return { bodyGeo, headGeo, beakGeo, tailGeo, wingMainGeo, wingTipGeo };
  }, []);

  useFrame((_, delta) => {
    timeRef.current += Math.min(delta, 0.04);
    const t = timeRef.current;
    const g = birdsGroupRef.current;
    if (!g) return;

    birdSeeds.forEach((b, i) => {
      const birdMesh = g.children[i] as THREE.Group | undefined;
      if (!birdMesh) return;

      // 1. Orbital Flight Path around center
      const angle = b.phase + t * b.speed;
      const x = b.centerPos[0] + Math.cos(angle) * b.baseRadiusX;
      const z = b.centerPos[2] + Math.sin(angle) * b.baseRadiusZ;
      const y =
        b.height +
        Math.sin(t * 0.8 + b.phase) * 2.2 +
        (b.flock === "eagle" ? Math.sin(t * 0.3) * 4.0 : 0);

      birdMesh.position.set(x, y, z);

      // 2. Heading & Banking / Roll Angle during turns
      const nextAngle = angle + 0.05;
      const nextX = b.centerPos[0] + Math.cos(nextAngle) * b.baseRadiusX;
      const nextZ = b.centerPos[2] + Math.sin(nextAngle) * b.baseRadiusZ;
      const heading = Math.atan2(nextX - x, nextZ - z);

      birdMesh.rotation.y = heading;
      // Banking into the turn
      birdMesh.rotation.z = -Math.sin(angle) * 0.28;
      // Slight pitch climb/dive
      birdMesh.rotation.x = Math.cos(t * 0.8 + b.phase) * 0.08;

      // 3. Organic Wing Flapping Physics with Gliding Intervals
      const leftWing = leftWingsRef.current[i];
      const rightWing = rightWingsRef.current[i];

      if (leftWing && rightWing) {
        // Soaring eagles glide longer, egrets flap steadily
        const glideMod =
          b.flock === "eagle" ? Math.max(0, Math.sin(t * 0.6 + b.phase * 2)) : 0;
        const isGliding = glideMod > 0.45;

        let flap = 0;
        if (!isGliding) {
          flap = Math.sin(t * b.flapSpeed + b.phase) * 0.55;
        } else {
          // Flat dihedral thermal soaring posture
          flap = 0.08 + Math.sin(t * 1.5) * 0.04;
        }

        leftWing.rotation.z = flap;
        rightWing.rotation.z = -flap;

        // Secondary wingtip flexion
        const leftTip = leftWing.children[1] as THREE.Mesh | undefined;
        const rightTip = rightWing.children[1] as THREE.Mesh | undefined;
        if (leftTip && rightTip) {
          leftTip.rotation.z = flap * 0.5;
          rightTip.rotation.z = -flap * 0.5;
        }
      }
    });
  });

  return (
    <group ref={birdsGroupRef}>
      {birdSeeds.map((b, i) => (
        <group key={i} scale={b.scale}>
          {/* Central Body Torso */}
          <mesh geometry={parts.bodyGeo} castShadow>
            <meshStandardMaterial color={b.bodyColor} roughness={0.7} />
          </mesh>

          {/* Bird Head */}
          <mesh geometry={parts.headGeo} position={[0, 0.12, 0.72]} castShadow>
            <meshStandardMaterial color={b.bodyColor} roughness={0.65} />
          </mesh>

          {/* Golden / Amber Beak */}
          <mesh geometry={parts.beakGeo} position={[0, 0.08, 0.98]} castShadow>
            <meshStandardMaterial color="#f59e0b" roughness={0.4} metalness={0.1} />
          </mesh>

          {/* Tail Feathers */}
          <mesh geometry={parts.tailGeo} position={[0, 0.04, -0.85]} castShadow>
            <meshStandardMaterial color={b.wingTipColor} roughness={0.8} />
          </mesh>

          {/* ================= LEFT WING ================= */}
          <group
            ref={(el) => {
              leftWingsRef.current[i] = el;
            }}
            position={[0.16, 0.06, 0.1]}
          >
            {/* Inner Main Wing */}
            <mesh geometry={parts.wingMainGeo} castShadow>
              <meshStandardMaterial color={b.wingColor} roughness={0.75} side={THREE.DoubleSide} />
            </mesh>
            {/* Outer Wingtip Feathers */}
            <mesh geometry={parts.wingTipGeo} position={[1.25, 0, 0]} castShadow>
              <meshStandardMaterial color={b.wingTipColor} roughness={0.75} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* ================= RIGHT WING ================= */}
          <group
            ref={(el) => {
              rightWingsRef.current[i] = el;
            }}
            position={[-0.16, 0.06, 0.1]}
            rotation-y={Math.PI} // Mirror to right side
          >
            {/* Inner Main Wing */}
            <mesh geometry={parts.wingMainGeo} castShadow>
              <meshStandardMaterial color={b.wingColor} roughness={0.75} side={THREE.DoubleSide} />
            </mesh>
            {/* Outer Wingtip Feathers */}
            <mesh geometry={parts.wingTipGeo} position={[1.25, 0, 0]} castShadow>
              <meshStandardMaterial color={b.wingTipColor} roughness={0.75} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
