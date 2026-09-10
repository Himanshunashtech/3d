import * as THREE from "three";
import { useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  subscribeLightShowState,
  getLightShowState,
  LightShowState,
} from "./sceneControlStore";

/**
 * StatueLightShow:
 * Multi-Phase 2:15 Minute (135 Seconds) Indian Flag (Tiranga) Lighting Spectacular
 * 
 * - Multi-angle architectural spotlights & full Indian Flag (Tiranga) projection mapping
 * - Synchronized with the official Statue of Unity soundtrack on YouTube (_EpmoYFxky8)
 * - Automatically completes after 2:15 minutes (135 seconds)
 */
export function StatueLightShow() {
  const [showState, setShowState] = useState<LightShowState>(getLightShowState());

  useEffect(() => {
    return subscribeLightShowState((state) => {
      setShowState(state);
    });
  }, []);

  if (!showState.active || !showState.lightsActive) {
    return null;
  }

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

  // Dynamic spotlight color combinations across the 11 choreographed themes spanning 135 seconds (2:15)
  const spotColors = useMemo(() => {
    switch (showState.phaseIndex) {
      case 0: // Theme 1: Saffron Sunrise (Kesariya) (00:00 - 00:12)
        return {
          head: "#ff9100",
          chest: "#ff6d00",
          feet: "#ff3d00",
          base: "#ffab40",
          intensityHead: 70,
          intensityChest: 80,
          intensityFeet: 75,
        };
      case 1: // Theme 2: Ashoka Blue & Royal Cyan (00:12 - 00:24)
        return {
          head: "#00b0ff",
          chest: "#0091ea",
          feet: "#002699",
          base: "#80d8ff",
          intensityHead: 75,
          intensityChest: 80,
          intensityFeet: 70,
        };
      case 2: // Theme 3: Sacred White & Shanti (00:24 - 00:36)
        return {
          head: "#ffffff",
          chest: "#f8fafc",
          feet: "#e2e8f0",
          base: "#f1f5f9",
          intensityHead: 70,
          intensityChest: 85,
          intensityFeet: 70,
        };
      case 3: // Theme 4: India Green (Samriddhi) (00:36 - 00:48)
        return {
          head: "#00e676",
          chest: "#00c853",
          feet: "#007e33",
          base: "#69f0ae",
          intensityHead: 65,
          intensityChest: 75,
          intensityFeet: 85,
        };
      case 4: // Theme 5: Saffron & Green Dual Waves (00:48 - 01:00)
        return {
          head: "#ff6d00",
          chest: "#ffab40",
          feet: "#00e676",
          base: "#00c853",
          intensityHead: 70,
          intensityChest: 75,
          intensityFeet: 80,
        };
      case 5: // Theme 6: Neon Laser Contour Outline (01:05 - 01:18)
        return {
          head: "#39ff14", // Electric laser green
          chest: "#00e676", // Bright laser emerald
          feet: "#2e7d32",
          base: "#1b5e20",
          intensityHead: 24,
          intensityChest: 20,
          intensityFeet: 25,
        };
      case 6: // Theme 7: Thermal Prismatic Rainbow Spectrum (Image 2) (01:18 - 01:31)
        return {
          head: "#ffeb3b", // Spectral yellow top
          chest: "#00e5ff", // Cyan & magenta prismatic mid
          feet: "#00e676", // Laser emerald lower
          base: "#38bdf8",
          intensityHead: 80,
          intensityChest: 90,
          intensityFeet: 85,
        };
      case 7: // Theme 8: Realistic Traditional Attire ("Sardar in True Colors" - Image 3) (01:31 - 01:44)
        return {
          head: "#fff3e0", // Warm natural skin keylight
          chest: "#ffd54f", // Golden mustard shawl fill
          feet: "#f8fafc", // Crisp white dhoti uplight
          base: "#fef3c7",
          intensityHead: 70,
          intensityChest: 80,
          intensityFeet: 75,
        };
      case 8: // Theme 9: Celestial Cyan & Saffron Split (Image 4) (01:44 - 01:57)
        return {
          head: "#00e5ff", // Electric celestial cyan
          chest: "#38bdf8", // Sky blue chest
          feet: "#ff3d00", // Fiery crimson-saffron dhoti
          base: "#ff6d00",
          intensityHead: 85,
          intensityChest: 85,
          intensityFeet: 90,
        };
      case 9: // Theme 10: Grand Tiranga (Indian Flag Full Finale Overlay) (01:57 - 02:15)
      default:
        return {
          head: "#ff3d00", // Saffron Top
          chest: "#ffffff", // Pure White + Blue Chakra
          feet: "#00c853", // India Green Bottom
          base: "#00e676", // Emerald Plinth
          intensityHead: 85,
          intensityChest: 95,
          intensityFeet: 90,
        };
    }
  }, [showState.phaseIndex]);

  const pulseRef = useMemo(() => ({ value: 1 }), []);
  useFrame((state) => {
    // Subtle dynamic pulse
    pulseRef.value = 1.0 + 0.1 * Math.sin(state.clock.getElapsedTime() * 3.5);
  });

  return (
    <group>
      <primitive object={targetChest} />
      <primitive object={targetHead} />
      <primitive object={targetFeet} />

      {/* 1. UPPER HEAD & FACE SPOTLIGHT */}
      <spotLight
        position={[-6, 16.0, 18.0]}
        target={targetHead}
        color={spotColors.head}
        intensity={spotColors.intensityHead * pulseRef.value}
        distance={140}
        angle={0.52}
        penumbra={0.35}
        decay={1.1}
      />

      {/* 2. MIDDLE CHEST & TORSO FLOODLIGHT */}
      <spotLight
        position={[-6, 12.0, 16.0]}
        target={targetChest}
        color={spotColors.chest}
        intensity={spotColors.intensityChest * pulseRef.value}
        distance={120}
        angle={0.68}
        penumbra={0.35}
        decay={1.1}
      />

      {/* 3. LOWER DHOTI & FEET UPLIGHT */}
      <spotLight
        position={[-6, 2.2, 7.5]}
        target={targetFeet}
        color={spotColors.feet}
        intensity={spotColors.intensityFeet * pulseRef.value}
        distance={60}
        angle={0.88}
        penumbra={0.35}
        decay={1.1}
      />
    </group>
  );
}

