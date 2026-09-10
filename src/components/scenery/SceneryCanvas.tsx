import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { Scene } from "./Scene";
import { Overlay } from "./Overlay";
import { AmbientSound } from "./AmbientSound";
import { SkyShutterLoader } from "./SkyShutterLoader";

export function SceneryCanvas() {
  return (
    <div className="fixed inset-0 bg-background">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 2]}
        camera={{ position: [34, 16, 56], fov: 48, near: 0.2, far: 1200 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <SkyShutterLoader />
      <Overlay />
      <AmbientSound />
    </div>
  );
}
