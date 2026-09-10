import { useRef, useEffect, useState, useMemo } from "react";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SunsetSky } from "./SunsetSky";
import { Terrain } from "./Terrain";
import { River } from "./River";
import { Trees } from "./Trees";
import { Birds } from "./Birds";
import { SardarSarovarDam } from "./SardarSarovarDam";
import { StatueOfUnityBase } from "./StatueOfUnityBase";
import { MainlandRoadAndParking } from "./MainlandRoadAndParking";
import { SecondBridge } from "./SecondBridge";
import { MetalRiverBridge } from "./MetalRiverBridge";
import { HillsideSign } from "./HillsideSign";
import { UnityCruiseShip } from "./UnityCruiseShip";
import { StatueLightShow } from "./StatueLightShow";
import { Visitors } from "./Visitors";
import {
  subscribeControls,
  subscribeTheme,
  subscribeLightShow,
  subscribeAutoRotate,
  getThemeMode,
  getLightShow,
  getAutoRotate,
  ControlAction,
} from "./sceneControlStore";

export function Scene() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [autoRotate, setAutoRotate] = useState(getAutoRotate());
  const [isNight, setIsNight] = useState(getThemeMode() === "night");
  const [isLightShow, setIsLightShow] = useState(getLightShow());
  const targetYGoal = useRef(16);

  useEffect(() => {
    return subscribeTheme((mode) => {
      setIsNight(mode === "night");
    });
  }, []);

  useEffect(() => {
    return subscribeLightShow((active) => {
      setIsLightShow(active);
    });
  }, []);

  useEffect(() => {
    return subscribeAutoRotate((active) => {
      setAutoRotate(active);
    });
  }, []);

  useEffect(() => {
    return subscribeControls((action: ControlAction) => {
      const controls = controlsRef.current;
      if (!controls) return;

      if (action.type === "MOVE_UP") {
        targetYGoal.current = Math.min(40, targetYGoal.current + 7);
      } else if (action.type === "MOVE_DOWN") {
        targetYGoal.current = Math.max(3, targetYGoal.current - 7);
      } else if (action.type === "SET_HEIGHT") {
        targetYGoal.current = Math.max(3, Math.min(42, action.height));
      } else if (action.type === "ZOOM_IN") {
        const cam = controls.object;
        const target = controls.target;
        const dir = new THREE.Vector3().subVectors(cam.position, target);
        const newLen = Math.max(18, dir.length() * 0.78);
        dir.setLength(newLen);
        cam.position.copy(target).add(dir);
        controls.update();
      } else if (action.type === "ZOOM_OUT") {
        const cam = controls.object;
        const target = controls.target;
        const dir = new THREE.Vector3().subVectors(cam.position, target);
        const newLen = Math.min(145, dir.length() * 1.25);
        dir.setLength(newLen);
        cam.position.copy(target).add(dir);
        controls.update();
      } else if (action.type === "ROTATE_LEFT") {
        const cam = controls.object;
        const target = controls.target;
        const offset = new THREE.Vector3().subVectors(cam.position, target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 8);
        cam.position.copy(target).add(offset);
        controls.update();
      } else if (action.type === "ROTATE_RIGHT") {
        const cam = controls.object;
        const target = controls.target;
        const offset = new THREE.Vector3().subVectors(cam.position, target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8);
        cam.position.copy(target).add(offset);
        controls.update();
      } else if (action.type === "TOGGLE_AUTO_ROTATE") {
        setAutoRotate((prev) => !prev);
      } else if (action.type === "RESET_VIEW") {
        targetYGoal.current = 16;
        controls.target.set(-6, 16, 0);
        controls.object.position.set(34, 16, 56);
        controls.update();
      }
    });
  }, []);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Smooth height pan along the statue
    if (Math.abs(controls.target.y - targetYGoal.current) > 0.05) {
      const diff = targetYGoal.current - controls.target.y;
      const dy = diff * Math.min(delta * 4.5, 0.25);
      controls.target.y += dy;
      controls.object.position.y += dy;
      controls.update();
    }
  });

  return (
    <>
      <SunsetSky />
      <fog
        attach="fog"
        args={isNight ? ["#111827", 160, 850] : ["#c6d8ea", 180, 920]}
      />

      {/* Ambient & Hemisphere Lighting */}
      <ambientLight
        intensity={isNight ? 0.55 : 0.65}
        color={isNight ? "#334155" : "#e0edfa"}
      />
      <hemisphereLight
        args={
          isNight
            ? ["#384252", "#111827", 0.6]
            : ["#dceafc", "#6e5d48", 0.8]
        }
      />

      {/* Main Daylight Sun Directional Light */}
      {!isNight && (
        <directionalLight
          position={[45, 75, 40]}
          intensity={2.9}
          color="#fff6eb"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-80}
          shadow-camera-right={80}
          shadow-camera-top={90}
          shadow-camera-bottom={-70}
          shadow-camera-far={260}
          shadow-bias={-0.0002}
        />
      )}

      {/* Night Key Directional Lights */}
      {isNight && (
        <>
          {/* Main Front Key Light */}
          <directionalLight
            position={[16, 32, 42]}
            intensity={isLightShow ? 0.8 : 1.4}
            color={isLightShow ? "#ffffff" : "#fff6ed"}
          />
          {/* Night Dusk Moonlight Rim */}
          <directionalLight
            position={[-30, 45, -30]}
            intensity={0.4}
            color="#94a3b8"
          />
        </>
      )}

      {/* Upward Architectural Spotlight / Indian Flag Light Show at Night */}
      {isNight && (isLightShow ? <StatueLightShow /> : <StatueNightLighting />)}

      <Environment>
        <Lightformer
          intensity={isNight ? 0.4 : 1.6}
          color={isNight ? "#f59e0b" : "#ffffff"}
          position={[20, 25, 20]}
          scale={[40, 20, 1]}
        />
        <Lightformer
          intensity={isNight ? 0.3 : 0.9}
          color={isNight ? "#3b82f6" : "#9ec4e8"}
          position={[0, 45, 0]}
          rotation-x={Math.PI / 2}
          scale={[90, 90, 1]}
        />
      </Environment>

      <Terrain />
      <River />
      <SardarSarovarDam />
      <Trees />
      {!isNight && <Birds />}
      <Visitors />
      <StatueOfUnityBase modelUrl="/Screenshot 2026-09-09 213731.glb" />
      <MainlandRoadAndParking isNight={isNight} isLightShow={isLightShow} />
      <SecondBridge isNight={isNight} isLightShow={isLightShow} />
      <MetalRiverBridge isNight={isNight} isLightShow={isLightShow} />
      <HillsideSign isNight={isNight} isLightShow={isLightShow} />
      <UnityCruiseShip isNight={isNight} isLightShow={isLightShow} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        rotateSpeed={0.85}
        zoomSpeed={0.9}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        minDistance={12}
        maxDistance={450}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2.02}
        enableDamping
        dampingFactor={0.07}
        autoRotate={autoRotate}
        autoRotateSpeed={1.4}
        target={[-6, 16, 0]}
      />
    </>
  );
}

/**
 * Authentic 3-point architectural base illumination on Sardar Patel's statue
 * 1. Center Front Base Floodlight (Chest & Torso)
 * 2. Left Flank Base Spotlight (Upper Body & Head)
 * 3. Right Flank Base Spotlight (Dhoti, Feet & Lower Plinth)
 */
function StatueNightLighting() {
  const targetChest = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(-6, 22, 0);
    return obj;
  }, []);

  const targetHead = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(-8, 32, 0);
    return obj;
  }, []);

  const targetFeet = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(-4, 9, 0);
    return obj;
  }, []);

  return (
    <>
      <primitive object={targetChest} />
      <primitive object={targetHead} />
      <primitive object={targetFeet} />

      {/* 1. Center Front Base Floodlight */}
      <spotLight
        position={[-6, 3.5, 14.0]}
        target={targetChest}
        color="#fff6ed"
        intensity={60}
        distance={140}
        angle={0.65}
        penumbra={0.4}
        decay={1.2}
      />

      {/* 2. Left Flank Base Spotlight */}
      <spotLight
        position={[-12, 3.5, 9.0]}
        target={targetHead}
        color="#fef3c7"
        intensity={50}
        distance={130}
        angle={0.55}
        penumbra={0.45}
        decay={1.2}
      />

      {/* 3. Right Flank Base Spotlight */}
      <spotLight
        position={[0, 3.5, 9.0]}
        target={targetFeet}
        color="#fef3c7"
        intensity={50}
        distance={110}
        angle={0.65}
        penumbra={0.45}
        decay={1.2}
      />

      {/* Physical 3 Base Floodlight fixtures & glowing lens lamps on the plinth */}
      <group>
        {/* Center Base Fixture */}
        <group position={[-6, 3.2, 14.0]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.35, 0.45, 0.5, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <sphereGeometry args={[0.25, 12, 12]} />
            <meshBasicMaterial color="#fffbeb" />
          </mesh>
        </group>

        {/* Left Base Fixture */}
        <group position={[-12, 3.2, 9.0]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.35, 0.45, 0.5, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <sphereGeometry args={[0.25, 12, 12]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>

        {/* Right Base Fixture */}
        <group position={[0, 3.2, 9.0]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.35, 0.45, 0.5, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <sphereGeometry args={[0.25, 12, 12]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      </group>
    </>
  );
}



