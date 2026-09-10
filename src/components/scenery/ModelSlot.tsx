import { Suspense } from "react";
import { useGLTF } from "@react-three/drei";

/**
 * Drop-in slot for a future 3D model.
 *
 * When you have a .glb file, put it in `public/models/` and render:
 *   <ModelSlot url="/models/your-model.glb" position={[0, -1, 0]} scale={1} />
 *
 * Without a url it renders a subtle plinth marking where the model will stand.
 */
export function ModelSlot({
  url,
  position = [0, -1.6, 0],
  scale = 1,
  rotation = [0, 0, 0],
}: {
  url?: string;
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position-y={0.3} receiveShadow castShadow>
        <cylinderGeometry args={[3.4, 4.2, 0.7, 24]} />
        <meshStandardMaterial color="#6b6257" roughness={0.9} flatShading />
      </mesh>
      {url ? (
        <Suspense fallback={null}>
          <LoadedModel url={url} />
        </Suspense>
      ) : null}
    </group>
  );
}

function LoadedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} position={[0, 0.65, 0]} />;
}
