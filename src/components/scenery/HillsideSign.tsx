import * as THREE from "three";
import { useMemo, useEffect } from "react";
import { getTerrainHeight } from "./Terrain";

interface HillsideSignProps {
  isNight?: boolean;
  isLightShow?: boolean;
}

interface LetterDef {
  char: string;
  width: number;
}

/**
 * 3D Monumental Hillside Lettering ("STATUE OF UNITY")
 * Modeled after the iconic Hollywood / Kevadia mountain landmark sign:
 * 1. Bold 3D block capital letters mounted on steel trestle support frames anchored into the hillside.
 * 2. Positioned on the elevated mountain slope behind the monument, facing the river and visitor concourse.
 * 3. Bottom upward focus spotlights / ground floodlights illuminating the letters vividly at night.
 * 4. Terraced rock foundation and flowering hillside shrub clusters.
 */
export function HillsideSign({ isNight = false, isLightShow = false }: HillsideSignProps) {
  // Letters definition: "STATUE OF UNITY"
  const textWords: LetterDef[][] = useMemo(
    () => [
      [
        { char: "S", width: 2.8 },
        { char: "T", width: 2.8 },
        { char: "A", width: 3.0 },
        { char: "T", width: 2.8 },
        { char: "U", width: 2.8 },
        { char: "E", width: 2.6 },
      ],
      [
        { char: "O", width: 3.0 },
        { char: "F", width: 2.6 },
      ],
      [
        { char: "U", width: 2.8 },
        { char: "N", width: 3.0 },
        { char: "I", width: 1.4 },
        { char: "T", width: 2.8 },
        { char: "Y", width: 3.0 },
      ],
    ],
    []
  );

  const materials = useMemo(() => {
    return {
      letterWhite: new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        emissive: new THREE.Color("#000000"),
        emissiveIntensity: 0,
        roughness: 0.25,
        metalness: 0.1,
      }),
      letterBorder: new THREE.MeshStandardMaterial({
        color: "#cbd5e1",
        roughness: 0.4,
        metalness: 0.5,
      }),
      steelSupport: new THREE.MeshStandardMaterial({
        color: "#475569",
        roughness: 0.5,
        metalness: 0.7,
      }),
      spotlightCasing: new THREE.MeshStandardMaterial({
        color: "#334155",
        roughness: 0.35,
        metalness: 0.8,
      }),
      spotlightLens: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: new THREE.Color("#fef08a"),
        emissiveIntensity: 0.4,
        roughness: 0.1,
      }),
      lightBeamCone: new THREE.MeshBasicMaterial({
        color: "#fffde7",
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      terraceSoil: new THREE.MeshStandardMaterial({
        color: "#54463a",
        roughness: 0.95,
        flatShading: true,
      }),
    };
  }, []);

  useEffect(() => {
    materials.letterWhite.color.set(isNight ? "#ffffff" : "#f8fafc");
    materials.letterWhite.emissive.set(isNight ? "#f1f5f9" : "#000000");
    materials.letterWhite.emissiveIntensity = isNight ? (isLightShow ? 2.8 : 2.2) : 0;
    materials.letterBorder.color.set(isNight ? "#94a3b8" : "#cbd5e1");
    materials.steelSupport.color.set(isNight ? "#334155" : "#475569");
    materials.spotlightCasing.color.set(isNight ? "#1e293b" : "#334155");
    materials.spotlightLens.emissiveIntensity = isNight ? 6.0 : 0.4;
    materials.lightBeamCone.opacity = isNight ? 0.22 : 0.0;
    materials.terraceSoil.color.set(isNight ? "#29211b" : "#54463a");
  }, [isNight, isLightShow, materials]);


  // Calculate layout coordinates for all letters on the western mountain ridge facing the Statue
  const letterInstances = useMemo(() => {
    const list: {
      char: string;
      x: number;
      y: number;
      z: number;
      rotY: number;
      rotX: number;
      width: number;
      height: number;
    }[] = [];

    // Western mountain ridge (high up on dry terrain at X = -175, Z = 0, directly across from the Statue)
    const centerAnchorX = -175.0;
    const centerAnchorZ = 0.0;
    const letterHeight = 6.2;
    const letterSpacing = 4.8;
    const wordGap = 7.0;

    // Total width calculation
    let totalLen = 0;
    textWords.forEach((word, wIdx) => {
      word.forEach(() => {
        totalLen += letterSpacing;
      });
      if (wIdx < textWords.length - 1) totalLen += wordGap;
    });

    // Start from South (+Z) to North (-Z) so the text reads left-to-right when looking from the Statue
    let currOffset = totalLen * 0.5;

    textWords.forEach((word, wIdx) => {
      word.forEach((l) => {
        const z = centerAnchorZ + currOffset;
        const normFrac = (currOffset + totalLen * 0.5) / totalLen;
        // Natural concave arch hugging the mountain slope
        const x = centerAnchorX + Math.sin(normFrac * Math.PI) * 6.0;
        const groundY = getTerrainHeight(x, z);
        const y = Math.max(groundY + 2.0, 16.0);

        list.push({
          char: l.char,
          x,
          y,
          z,
          rotY: Math.PI * 0.5 - (currOffset / totalLen) * 0.25, // faces East towards the Statue with gentle splay
          rotX: -0.16, // slight backward tilt conforming to mountain hillside
          width: l.width * 1.2,
          height: letterHeight,
        });

        currOffset -= letterSpacing;
      });
      if (wIdx < textWords.length - 1) currOffset -= wordGap;
    });

    return list;
  }, [textWords]);

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. 3D HOLLYWOOD-STYLE LETTERS & SUPPORT FRAMES ON MOUNTAIN*/}
      {/* ========================================================= */}
      {letterInstances.map((inst, idx) => (
        <group
          key={idx}
          position={[inst.x, inst.y, inst.z]}
          rotation-y={inst.rotY}
          rotation-x={inst.rotX}
        >
          {/* Terraced Foundation Pad under letter footing */}
          <mesh position={[0, -0.6, 0]} material={materials.terraceSoil}>
            <boxGeometry args={[inst.width + 1.2, 0.45, 2.4]} />
          </mesh>

          {/* Heavy Galvanized Steel Superstructure / Support Truss */}
          <group position={[0, 0, -0.35]}>
            {/* Vertical A-frame Support Columns */}
            {[-inst.width * 0.38, inst.width * 0.38].map((px, pIdx) => (
              <group key={pIdx} position={[px, 0, 0]}>
                <mesh position={[0, inst.height * 0.5, 0]} material={materials.steelSupport}>
                  <cylinderGeometry args={[0.07, 0.09, inst.height + 1.2, 6]} />
                </mesh>
                {/* Diagonal Rear K-Brace anchor to bedrock */}
                <mesh
                  position={[0, inst.height * 0.4, -0.9]}
                  rotation-x={0.45}
                  material={materials.steelSupport}
                >
                  <cylinderGeometry args={[0.05, 0.07, inst.height * 0.95, 6]} />
                </mesh>
              </group>
            ))}

            {/* Horizontal Waler Beams */}
            {[inst.height * 0.25, inst.height * 0.5, inst.height * 0.75].map((wy, wIdx) => (
              <mesh key={wIdx} position={[0, wy, 0]} material={materials.steelSupport}>
                <boxGeometry args={[inst.width * 0.92, 0.12, 0.12]} />
              </mesh>
            ))}

            {/* Cross X-bracing between frames */}
            <mesh
              position={[0, inst.height * 0.5, 0]}
              rotation-z={0.52}
              material={materials.steelSupport}
            >
              <boxGeometry args={[inst.width * 0.9, 0.08, 0.08]} />
            </mesh>
            <mesh
              position={[0, inst.height * 0.5, 0]}
              rotation-z={-0.52}
              material={materials.steelSupport}
            >
              <boxGeometry args={[inst.width * 0.9, 0.08, 0.08]} />
            </mesh>
          </group>

          {/* 3D Dimensional Hollywood Capital Letter */}
          <group position={[0, inst.height * 0.5, 0]}>
            <LetterMesh
              char={inst.char}
              width={inst.width}
              height={inst.height}
              depth={0.48}
              material={materials.letterWhite}
              borderMaterial={materials.letterBorder}
            />
          </group>
        </group>
      ))}

      {/* ========================================================= */}
      {/* 2. GROUND FOCUS FLOODLIGHTS / BOTTOM UPLIGHTING ON HILL   */}
      {/* ========================================================= */}
      {[-35, -24, -12, 0, 12, 24, 35].map((offset, idx) => {
        const lz = 0.0 + offset;
        const lx = -167.0 + Math.sin(((offset + 35) / 70) * Math.PI) * 5.0;
        const ly = getTerrainHeight(lx, lz) + 0.35;
        return (
          <group key={idx} position={[lx, ly, lz]} rotation-y={Math.PI * 0.5}>
            {/* Spotlight Concrete Plinth */}
            <mesh position={[0, 0.18, 0]} material={materials.spotlightCasing}>
              <boxGeometry args={[0.95, 0.35, 0.95]} />
            </mesh>
            {/* Dual Heavy Upward Floodlight Projectors */}
            {[-0.28, 0.28].map((fx, fIdx) => (
              <group key={fIdx} position={[fx, 0.48, 0]} rotation-x={-0.68}>
                {/* Projector Casing */}
                <mesh material={materials.spotlightCasing} castShadow>
                  <cylinderGeometry args={[0.24, 0.28, 0.5, 8]} />
                </mesh>
                {/* Glass Lamp Lens */}
                <mesh position={[0, 0.26, 0]} material={materials.spotlightLens}>
                  <cylinderGeometry args={[0.23, 0.23, 0.05, 8]} />
                </mesh>
                {/* Upward Volumetric Light Beam Cone at Night */}
                {isNight && (
                  <mesh position={[0, 4.8, 0]} material={materials.lightBeamCone}>
                    <coneGeometry args={[2.2, 9.6, 12, 1, true]} />
                  </mesh>
                )}
              </group>
            ))}

          </group>
        );
      })}
    </group>
  );
}

/**
 * Procedural 3D Block Capital Letter Geometry Builder
 */
function LetterMesh({
  char,
  width,
  height,
  depth,
  material,
  borderMaterial,
}: {
  char: string;
  width: number;
  height: number;
  depth: number;
  material: THREE.Material;
  borderMaterial: THREE.Material;
}) {
  const barThick = 0.68;
  const halfW = width * 0.5;
  const halfH = height * 0.5;

  switch (char) {
    case "S":
      return (
        <group>
          {/* Top Bar */}
          <mesh position={[0, halfH - barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
          {/* Top Left Vertical */}
          <mesh position={[-halfW + barThick * 0.5, halfH * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, halfH, depth]} />
          </mesh>
          {/* Mid Bar */}
          <mesh position={[0, 0, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
          {/* Bottom Right Vertical */}
          <mesh position={[halfW - barThick * 0.5, -halfH * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, halfH, depth]} />
          </mesh>
          {/* Bottom Bar */}
          <mesh position={[0, -halfH + barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
        </group>
      );

    case "T":
      return (
        <group>
          {/* Top Crossbar */}
          <mesh position={[0, halfH - barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
          {/* Center Vertical Post */}
          <mesh position={[0, -barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height - barThick, depth]} />
          </mesh>
        </group>
      );

    case "A":
      return (
        <group>
          {/* Top Cap */}
          <mesh position={[0, halfH - barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width * 0.65, barThick, depth]} />
          </mesh>
          {/* Left Vertical */}
          <mesh position={[-halfW + barThick * 0.5, 0, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height, depth]} />
          </mesh>
          {/* Right Vertical */}
          <mesh position={[halfW - barThick * 0.5, 0, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height, depth]} />
          </mesh>
          {/* Middle Crossbar */}
          <mesh position={[0, -0.15, 0]} material={material} castShadow>
            <boxGeometry args={[width - barThick * 2, barThick, depth]} />
          </mesh>
        </group>
      );

    case "U":
      return (
        <group>
          {/* Left Vertical */}
          <mesh position={[-halfW + barThick * 0.5, barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height - barThick, depth]} />
          </mesh>
          {/* Right Vertical */}
          <mesh position={[halfW - barThick * 0.5, barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height - barThick, depth]} />
          </mesh>
          {/* Bottom Bar */}
          <mesh position={[0, -halfH + barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
        </group>
      );

    case "E":
      return (
        <group>
          {/* Left Spine */}
          <mesh position={[-halfW + barThick * 0.5, 0, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height, depth]} />
          </mesh>
          {/* Top Bar */}
          <mesh position={[0, halfH - barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
          {/* Mid Bar */}
          <mesh position={[-barThick * 0.2, 0, 0]} material={material} castShadow>
            <boxGeometry args={[width * 0.75, barThick, depth]} />
          </mesh>
          {/* Bottom Bar */}
          <mesh position={[0, -halfH + barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
        </group>
      );

    case "O":
      return (
        <group>
          {/* Left Vertical */}
          <mesh position={[-halfW + barThick * 0.5, 0, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height, depth]} />
          </mesh>
          {/* Right Vertical */}
          <mesh position={[halfW - barThick * 0.5, 0, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height, depth]} />
          </mesh>
          {/* Top Bar */}
          <mesh position={[0, halfH - barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
          {/* Bottom Bar */}
          <mesh position={[0, -halfH + barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
        </group>
      );

    case "F":
      return (
        <group>
          {/* Left Spine */}
          <mesh position={[-halfW + barThick * 0.5, 0, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height, depth]} />
          </mesh>
          {/* Top Bar */}
          <mesh position={[0, halfH - barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
          {/* Mid Bar */}
          <mesh position={[-barThick * 0.2, 0, 0]} material={material} castShadow>
            <boxGeometry args={[width * 0.75, barThick, depth]} />
          </mesh>
        </group>
      );

    case "N":
      return (
        <group>
          {/* Left Post */}
          <mesh position={[-halfW + barThick * 0.5, 0, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height, depth]} />
          </mesh>
          {/* Right Post */}
          <mesh position={[halfW - barThick * 0.5, 0, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height, depth]} />
          </mesh>
          {/* Diagonal Bar */}
          <mesh
            position={[0, 0, 0]}
            rotation-z={-Math.atan2(width, height)}
            material={material}
            castShadow
          >
            <boxGeometry args={[barThick * 0.9, Math.hypot(width, height), depth * 0.95]} />
          </mesh>
        </group>
      );

    case "I":
      return (
        <group>
          {/* Center Post */}
          <mesh position={[0, 0, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, height, depth]} />
          </mesh>
          {/* Top Serif */}
          <mesh position={[0, halfH - barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
          {/* Bottom Serif */}
          <mesh position={[0, -halfH + barThick * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[width, barThick, depth]} />
          </mesh>
        </group>
      );

    case "Y":
      return (
        <group>
          {/* Lower Stem */}
          <mesh position={[0, -halfH * 0.5, 0]} material={material} castShadow>
            <boxGeometry args={[barThick, halfH, depth]} />
          </mesh>
          {/* Upper Left Arm */}
          <mesh
            position={[-halfW * 0.45, halfH * 0.45, 0]}
            rotation-z={-0.58}
            material={material}
            castShadow
          >
            <boxGeometry args={[barThick, halfH * 1.15, depth]} />
          </mesh>
          {/* Upper Right Arm */}
          <mesh
            position={[halfW * 0.45, halfH * 0.45, 0]}
            rotation-z={0.58}
            material={material}
            castShadow
          >
            <boxGeometry args={[barThick, halfH * 1.15, depth]} />
          </mesh>
        </group>
      );

    default:
      return (
        <mesh position={[0, 0, 0]} material={material}>
          <boxGeometry args={[width, height, depth]} />
        </mesh>
      );
  }
}
