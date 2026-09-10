import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { riverCurve, getRiverWidth } from "./riverPath";
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

    // Realistic multi-wave downstream flow & surface chop
    float flow = uv.y * 3.2 - uTime * 1.6;
    float crossFlow = uv.x * 6.28;

    float w1 = sin(flow + crossFlow) * 0.09;
    float w2 = sin(flow * 1.9 - uv.x * 12.0 + uTime * 0.6) * 0.055;
    float w3 = cos(flow * 3.4 + uv.x * 22.0 - uTime * 1.1) * 0.032;
    float w4 = sin((uv.x + uv.y * 2.0) * 16.0 + uTime * 2.4) * 0.018;

    float wave = w1 + w2 + w3 + w4;
    p.y += wave;

    // Approximate dynamic surface normal from wave gradients
    float dHdx = cos(flow + crossFlow) * 0.09 * 6.28 - cos(flow * 1.9 - uv.x * 12.0 + uTime * 0.6) * 0.66;
    float dHdy = cos(flow + crossFlow) * 0.09 * 3.2 + cos(flow * 1.9 - uv.x * 12.0 + uTime * 0.6) * 0.104;
    vec3 localNorm = normalize(vec3(-dHdx * 0.4, 1.0, -dHdy * 0.4));

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
  uniform vec3 uSunGlow;
  uniform vec3 uFoam;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormalVec;
  varying vec3 vViewVec;
  varying float vWave;

  void main() {
    // Centerline distance (0 = river center, 1 = banks)
    float edgeDist = abs(vUv.x - 0.5) * 2.0;

    // 1. Natural optical depth gradient from shallow turquoise banks to deep sapphire channel
    vec3 col = mix(uDeep, uShallow, smoothstep(0.08, 0.88, edgeDist));

    // 2. Multi-layer animated flowing streamlines and caustic swirls
    float flowFast = vUv.y * 4.5 - uTime * 2.2;
    float flowSlow = vUv.y * 2.1 - uTime * 0.9;
    float stream1 = sin(vUv.x * 26.0 + sin(flowFast) * 2.2 + flowSlow * 3.8);
    float stream2 = cos(vUv.x * 42.0 - flowFast * 1.8 + vWave * 15.0);
    float streamPattern = 0.5 + 0.5 * (stream1 * 0.58 + stream2 * 0.42);
    col = mix(col, uShallow * 1.32, streamPattern * 0.22);

    // 3. Realistic Fresnel reflection at glancing angles
    vec3 N = normalize(vNormalVec);
    vec3 V = normalize(vViewVec);
    float NdotV = max(0.0, dot(N, V));
    float fresnel = pow(1.0 - NdotV, 3.8);
    col = mix(col, uSunGlow * 1.15, fresnel * 0.48);

    // 4. Sun reflection column & specular water glints
    float band = exp(-pow((vUv.x - 0.5) * 11.0, 2.0));
    float shimmer1 = sin(vUv.y * 65.0 - uTime * 3.4 + vWave * 26.0);
    float shimmer2 = cos(vUv.x * 48.0 + vUv.y * 32.0 - uTime * 2.6);
    float shimmer = pow(max(0.0, 0.5 + 0.5 * (shimmer1 * 0.52 + shimmer2 * 0.48)), 5.0);

    // Directional specular glint from sun
    vec3 L = normalize(uSunDir);
    vec3 H = normalize(L + V);
    float spec = pow(max(0.0, dot(N, H)), 48.0);

    col += uSunGlow * band * shimmer * 0.72;
    col += uSunGlow * spec * 0.85;

    // 5. Dynamic crest foam and turbulent shoreline foam
    float crestFoam = smoothstep(0.075, 0.145, vWave);
    float bankFoamDist = smoothstep(0.78, 0.98, edgeDist);
    float foamNoise = sin(vUv.y * 48.0 - uTime * 3.2) * cos(vUv.x * 32.0 + uTime * 1.4);
    float bankFoam = bankFoamDist * (0.65 + 0.35 * smoothstep(0.1, 0.6, foamNoise));

    float totalFoam = clamp(crestFoam * 0.4 + bankFoam * 0.85, 0.0, 1.0);
    col = mix(col, uFoam, totalFoam * 0.62);

    // 6. Smooth bank and river boundary alpha transition
    float normV = vUv.y / 24.0;
    float endFade = smoothstep(0.0, 0.025, normV) * (1.0 - smoothstep(0.975, 1.0, normV));
    float bankFade = 1.0 - smoothstep(0.93, 1.0, edgeDist);
    float alpha = 0.95 * bankFade * endFade;

    if (alpha <= 0.01) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

const WATER_DAY = {
  uDeep: new THREE.Color("#0a2847"),
  uShallow: new THREE.Color("#1e5a88"),
  uSunGlow: new THREE.Color("#e6f3ff"),
  uFoam: new THREE.Color("#e8f5ff"),
};

const WATER_NIGHT = {
  uDeep: new THREE.Color("#030813"),
  uShallow: new THREE.Color("#0a1b30"),
  uSunGlow: new THREE.Color("#fbbf24"),
  uFoam: new THREE.Color("#1a3556"),
};

export function River() {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const applyThemeColors = (mode: ThemeMode) => {
    if (!mat.current) return;
    const target = mode === "night" ? WATER_NIGHT : WATER_DAY;
    const u = mat.current.uniforms;
    if (u["uDeep"]?.value) (u["uDeep"].value as THREE.Color).copy(target.uDeep);
    if (u["uShallow"]?.value) (u["uShallow"].value as THREE.Color).copy(target.uShallow);
    if (u["uSunGlow"]?.value) (u["uSunGlow"].value as THREE.Color).copy(target.uSunGlow);
    if (u["uFoam"]?.value) (u["uFoam"].value as THREE.Color).copy(target.uFoam);
  };

  useEffect(() => {
    return subscribeTheme((mode) => {
      applyThemeColors(mode);
    });
  }, []);

  const uniforms = useMemo(() => {
    const initial = getThemeMode() === "night" ? WATER_NIGHT : WATER_DAY;
    return {
      uTime: { value: 0 },
      uDeep: { value: initial.uDeep.clone() },
      uShallow: { value: initial.uShallow.clone() },
      uSunGlow: { value: initial.uSunGlow.clone() },
      uFoam: { value: initial.uFoam.clone() },
      uSunDir: { value: new THREE.Vector3(45, 75, 40).normalize() },
    };
  }, []);

  useFrame((_, delta) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    if (u["uTime"]) u["uTime"].value += Math.min(delta, 0.05);
  });

  const geometry = useMemo(() => {
    const lengthSegments = 260;
    const widthSegments = 32;
    const totalVerts = (lengthSegments + 1) * (widthSegments + 1);

    const positions = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const normals = new Float32Array(totalVerts * 3);
    const indices: number[] = [];

    let vertIndex = 0;

    for (let i = 0; i <= lengthSegments; i++) {
      const t = i / lengthSegments;
      const point = riverCurve.getPointAt(t);
      const tangent = riverCurve.getTangentAt(t);

      // Normal vector in XZ plane perpendicular to river tangent
      let nx = -tangent.z;
      let nz = tangent.x;
      const nLen = Math.hypot(nx, nz) || 1;
      nx /= nLen;
      nz /= nLen;

      const width = getRiverWidth(t);

      for (let j = 0; j <= widthSegments; j++) {
        const u = j / widthSegments;
        const offset = (u - 0.5) * width;

        const vx = point.x + nx * offset;
        const vy = point.y;
        const vz = point.z + nz * offset;

        const idx = vertIndex * 3;
        positions[idx] = vx;
        positions[idx + 1] = vy;
        positions[idx + 2] = vz;

        normals[idx] = 0;
        normals[idx + 1] = 1;
        normals[idx + 2] = 0;

        const uvIdx = vertIndex * 2;
        uvs[uvIdx] = u;
        uvs[uvIdx + 1] = t * 24.0; // Flow length scale

        vertIndex++;
      }
    }

    for (let i = 0; i < lengthSegments; i++) {
      for (let j = 0; j < widthSegments; j++) {
        const a = i * (widthSegments + 1) + j;
        const b = (i + 1) * (widthSegments + 1) + j;
        const c = (i + 1) * (widthSegments + 1) + (j + 1);
        const d = i * (widthSegments + 1) + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, []);

  return (
    <mesh geometry={geometry} renderOrder={1}>
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
