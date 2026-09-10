import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { WATER_LEVEL } from "./Terrain";
import { subscribeTheme, getThemeMode, ThemeMode } from "./sceneControlStore";

const vert = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalVec;
  varying vec3 vViewVec;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 p = position;

    // Realistic multi-directional lake wave displacement & gentle swell
    float w1 = sin(p.x * 0.28 + uTime * 0.95) * 0.12;
    float w2 = sin(p.y * 0.42 - uTime * 0.72) * 0.085;
    float w3 = sin((p.x + p.y) * 0.22 + uTime * 0.45) * 0.06;
    float w4 = cos((p.x * 0.5 - p.y * 0.6) + uTime * 1.3) * 0.035;

    float wave = w1 + w2 + w3 + w4;
    p.z += wave;

    // Surface normal perturbation from wave slope
    float dHdx = cos(p.x * 0.28 + uTime * 0.95) * 0.0336 + cos((p.x + p.y) * 0.22 + uTime * 0.45) * 0.0132;
    float dHdy = cos(p.y * 0.42 - uTime * 0.72) * 0.0357 + cos((p.x + p.y) * 0.22 + uTime * 0.45) * 0.0132;
    vec3 localNorm = normalize(vec3(-dHdx * 0.5, -dHdy * 0.5, 1.0));

    vWave = wave;
    vec4 worldPos = modelMatrix * vec4(p, 1.0);
    vWorldPos = worldPos.xyz;
    vNormalVec = normalize((modelMatrix * vec4(localNorm, 0.0)).xyz);
    vViewVec = normalize(cameraPosition - worldPos.xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const frag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uGlow;
  uniform vec3 uFoam;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalVec;
  varying vec3 vViewVec;
  varying float vWave;

  void main() {
    // 1. Distance from lake center creating depth variation from shallow shores to deep basin
    float d = distance(vUv, vec2(0.5));
    vec3 col = mix(uShallow, uDeep, smoothstep(0.06, 0.42, d));

    // 2. Optical depth caustic swirls
    float caustic1 = sin(vUv.x * 35.0 + sin(uTime * 0.8 + vUv.y * 25.0) * 1.5);
    float caustic2 = cos(vUv.y * 40.0 - uTime * 0.9 + vWave * 12.0);
    float caustics = 0.5 + 0.5 * (caustic1 * 0.5 + caustic2 * 0.5);
    col = mix(col, uShallow * 1.25, caustics * 0.18);

    // 3. Fresnel glance angle reflection
    vec3 N = normalize(vNormalVec);
    vec3 V = normalize(vViewVec);
    float NdotV = max(0.0, dot(N, V));
    float fresnel = pow(1.0 - NdotV, 3.5);
    col = mix(col, uGlow * 1.1, fresnel * 0.45);

    // 4. Sun reflection column & micro sparkle shimmer
    float band = exp(-pow((vUv.x - 0.5) * 14.0, 2.0));
    float shimmer = 0.5 + 0.5 * sin(vUv.y * 85.0 + uTime * 2.2 + vWave * 22.0);
    shimmer = pow(shimmer, 4.0);

    // Specular highlight from directional sun
    vec3 L = normalize(uSunDir);
    vec3 H = normalize(L + V);
    float spec = pow(max(0.0, dot(N, H)), 40.0);

    col += uGlow * band * shimmer * 0.65;
    col += uGlow * spec * 0.75;

    // 5. Wave crest foam highlights
    float crestFoam = smoothstep(0.05, 0.14, vWave);
    col = mix(col, uFoam, crestFoam * 0.45);

    // 6. Shoreline soft fading
    float edgeDist = max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0;
    float alpha = 0.93 * (1.0 - smoothstep(0.94, 1.0, edgeDist));

    if (alpha <= 0.01) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

const LAKE_DAY = {
  uDeep: new THREE.Color("#163d59"),
  uShallow: new THREE.Color("#3c738e"),
  uGlow: new THREE.Color("#e2f0f8"),
  uFoam: new THREE.Color("#e8f5ff"),
};

const LAKE_NIGHT = {
  uDeep: new THREE.Color("#040a14"),
  uShallow: new THREE.Color("#0d2035"),
  uGlow: new THREE.Color("#facc15"),
  uFoam: new THREE.Color("#1c3755"),
};

interface LakeProps {
  position?: [number, number, number];
  size?: [number, number];
  segments?: [number, number];
}

export function Lake({
  position = [0, WATER_LEVEL, -12],
  size = [115, 260],
  segments = [48, 96],
}: LakeProps) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const applyThemeColors = (mode: ThemeMode) => {
    if (!mat.current) return;
    const target = mode === "night" ? LAKE_NIGHT : LAKE_DAY;
    const u = mat.current.uniforms;
    if (u["uDeep"]?.value) (u["uDeep"].value as THREE.Color).copy(target.uDeep);
    if (u["uShallow"]?.value) (u["uShallow"].value as THREE.Color).copy(target.uShallow);
    if (u["uGlow"]?.value) (u["uGlow"].value as THREE.Color).copy(target.uGlow);
    if (u["uFoam"]?.value) (u["uFoam"].value as THREE.Color).copy(target.uFoam);
  };

  useEffect(() => {
    return subscribeTheme((mode) => {
      applyThemeColors(mode);
    });
  }, []);

  const uniforms = useMemo(() => {
    const initial = getThemeMode() === "night" ? LAKE_NIGHT : LAKE_DAY;
    return {
      uTime: { value: 0 },
      uDeep: { value: initial.uDeep.clone() },
      uShallow: { value: initial.uShallow.clone() },
      uGlow: { value: initial.uGlow.clone() },
      uFoam: { value: initial.uFoam.clone() },
      uSunDir: { value: new THREE.Vector3(45, 75, 40).normalize() },
    };
  }, []);

  useFrame((_, delta) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    if (u["uTime"]) u["uTime"].value += Math.min(delta, 0.05);
  });

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={position}
      renderOrder={1}
    >
      <planeGeometry args={[size[0], size[1], segments[0], segments[1]]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export default Lake;
