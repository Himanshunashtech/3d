import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

interface Walker {
  // Path type: 'bridge' | 'plaza' | 'viewpoint'
  type: "bridge" | "plaza" | "viewpoint";
  startX: number;
  endX: number;
  z: number;
  speed: number;
  progress: number;
  direction: number; // 1 or -1
  colorTop: string;
  colorBottom: string;
  scale: number;
  plazaAngle?: number;
  plazaRadius?: number;
  plazaSpeed?: number;
}

const CLOTH_PALETTES = [
  { top: "#e67e22", bot: "#2c3e50" }, // Saffron / Navy
  { top: "#ffffff", bot: "#7f8c8d" }, // White Kurta / Gray
  { top: "#3498db", bot: "#34495e" }, // Sky Blue / Dark
  { top: "#e74c3c", bot: "#2c3e50" }, // Crimson / Navy
  { top: "#2ecc71", bot: "#1b4f72" }, // Green / Denim
  { top: "#f39c12", bot: "#17202a" }, // Yellow Gold / Black
  { top: "#9b59b6", bot: "#2c3e50" }, // Violet / Navy
  { top: "#1abc9c", bot: "#7f8c8d" }, // Teal / Khaki
  { top: "#d35400", bot: "#f4f6f7" }, // Rust / White
  { top: "#ecf0f1", bot: "#2c3e50" }, // Light / Dark
];

export function Visitors() {
  const groupRef = useRef<THREE.Group>(null);

  // Initialize animated visitors data
  const visitors = useMemo<Walker[]>(() => {
    const list: Walker[] = [];

    // 1. Walkers on the Grand Pedestrian Bridge (walking back and forth)
    for (let i = 0; i < 28; i++) {
      const palette = CLOTH_PALETTES[i % CLOTH_PALETTES.length]!;
      const dir = i % 2 === 0 ? 1 : -1;
      const zOffset = (Math.random() - 0.5) * 2.2; // distributed along the walkway width
      list.push({
        type: "bridge",
        startX: 20.0 + Math.random() * 4,
        endX: 104.0 - Math.random() * 4,
        z: 0 + zOffset,
        speed: 1.8 + Math.random() * 1.4,
        progress: Math.random(),
        direction: dir,
        colorTop: palette.top,
        colorBottom: palette.bot,
        scale: 0.85 + Math.random() * 0.2,
      });
    }

    // 2. Visitors moving around the base observation deck / promenade
    for (let i = 0; i < 22; i++) {
      const palette = CLOTH_PALETTES[(i + 5) % CLOTH_PALETTES.length]!;
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
      const radius = 6.0 + Math.random() * 4.0;
      list.push({
        type: "plaza",
        startX: 0,
        endX: 0,
        z: 0,
        speed: 0.4 + Math.random() * 0.4,
        progress: 0,
        direction: Math.random() > 0.5 ? 1 : -1,
        colorTop: palette.top,
        colorBottom: palette.bot,
        scale: 0.85 + Math.random() * 0.2,
        plazaAngle: angle,
        plazaRadius: radius,
        plazaSpeed: (0.12 + Math.random() * 0.12) * (Math.random() > 0.5 ? 1 : -1),
      });
    }

    // 3. Visitors paused on the front and rear observation decks viewing the wide river
    for (let i = 0; i < 18; i++) {
      const palette = CLOTH_PALETTES[(i + 2) % CLOTH_PALETTES.length]!;
      const isRear = i >= 10;
      const vx = isRear ? -14.0 + (i - 10) * 1.8 : 5.0 + (i % 2 === 0 ? 4.5 : 9.5);
      const vz = isRear ? ((i % 2 === 0 ? 1 : -1) * 7.5) : ((i % 5) - 2) * 2.2;
      list.push({
        type: "viewpoint",
        startX: vx + (Math.random() - 0.5) * 0.6,
        endX: vx + (Math.random() - 0.5) * 0.6,
        z: vz,
        speed: 0,
        progress: 0,
        direction: 1,
        colorTop: palette.top,
        colorBottom: palette.bot,
        scale: 0.85 + Math.random() * 0.2,
      });
    }

    return list;
  }, []);

  // Animate visitors each frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const children = groupRef.current.children;

    visitors.forEach((v, idx) => {
      const child = children[idx];
      if (!child) return;

      if (v.type === "bridge") {
        // Linear movement along bridge length
        const span = v.endX - v.startX;
        v.progress += (v.speed / span) * delta * v.direction;

        if (v.progress > 1.0) {
          v.progress = 1.0;
          v.direction = -1;
        } else if (v.progress < 0.0) {
          v.progress = 0.0;
          v.direction = 1;
        }

        const currentX = v.startX + v.progress * span;
        const currentZ = v.z;
        // Walking bobbing motion
        const bob = Math.abs(Math.sin(time * 6.5 + idx)) * 0.06;

        child.position.set(currentX, 1.45 + bob, currentZ);
        child.rotation.y = v.direction > 0 ? 0 : Math.PI;
      } else if (v.type === "plaza") {
        // Circular / elliptic wandering around the pedestal promenade
        if (v.plazaAngle !== undefined && v.plazaSpeed !== undefined && v.plazaRadius !== undefined) {
          v.plazaAngle += v.plazaSpeed * delta;
          const currentX = -6 + Math.cos(v.plazaAngle) * v.plazaRadius;
          const currentZ = Math.sin(v.plazaAngle) * v.plazaRadius * 0.85 + 1.0;
          const bob = Math.abs(Math.sin(time * 5.0 + idx)) * 0.05;

          child.position.set(currentX, 1.45 + bob, currentZ);
          // Face tangent of motion
          child.rotation.y = -v.plazaAngle + (v.plazaSpeed > 0 ? Math.PI / 2 : -Math.PI / 2);
        }
      } else if (v.type === "viewpoint") {
        // Subtle idle breathing and slight shifting
        const idleSway = Math.sin(time * 1.5 + idx * 0.8) * 0.03;
        child.position.set(v.startX, 1.45, v.z);
        child.rotation.y = Math.PI * 0.1 + idleSway; // looking out toward front river view
      }
    });
  });

  return (
    <group ref={groupRef}>
      {visitors.map((v, i) => (
        <group key={i} scale={v.scale}>
          {/* Head & Skin Tone */}
          <mesh position={[0, 1.55, 0]} castShadow>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshStandardMaterial color="#c68642" roughness={0.7} />
          </mesh>
          {/* Upper Body / Shirt / Kurta */}
          <mesh position={[0, 1.15, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.18, 0.55, 6]} />
            <meshStandardMaterial color={v.colorTop} roughness={0.65} />
          </mesh>
          {/* Lower Body / Pants / Draping */}
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.11, 0.65, 6]} />
            <meshStandardMaterial color={v.colorBottom} roughness={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
