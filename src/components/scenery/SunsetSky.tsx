import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { subscribeTheme, ThemeMode, getThemeMode } from "./sceneControlStore";

const vert = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  varying vec3 vPos;
  uniform vec3 cTop;
  uniform vec3 cMid;
  uniform vec3 cHorizon;
  uniform vec3 cGlow;

  void main() {
    float h = normalize(vPos).y;
    vec3 col = mix(cHorizon, cMid, smoothstep(-0.02, 0.32, h));
    col = mix(col, cTop, smoothstep(0.30, 0.90, h));

    // Warm sun / twilight horizon glow
    vec3 dir = normalize(vPos);
    float glow = pow(max(0.0, dot(dir, normalize(vec3(0.2, 0.4, -0.9)))), 4.0);
    col += cGlow * glow * 0.55;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// Color palettes for Day and Night (matching the reference photo twilight sky)
const DAY_COLORS = {
  cTop: new THREE.Color("#4a85c2"),
  cMid: new THREE.Color("#8ab6db"),
  cHorizon: new THREE.Color("#dbe5ee"),
  cGlow: new THREE.Color("#fff2d6"),
};

const NIGHT_COLORS = {
  cTop: new THREE.Color("#0a1128"),
  cMid: new THREE.Color("#1e2548"),
  cHorizon: new THREE.Color("#9c3128"),
  cGlow: new THREE.Color("#f97316"),
};

export function SunsetSky() {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const applyThemeColors = (mode: ThemeMode) => {
    if (!shaderRef.current) return;
    const target = mode === "night" ? NIGHT_COLORS : DAY_COLORS;
    const u = shaderRef.current.uniforms;
    if (u["cTop"]?.value) (u["cTop"].value as THREE.Color).copy(target.cTop);
    if (u["cMid"]?.value) (u["cMid"].value as THREE.Color).copy(target.cMid);
    if (u["cHorizon"]?.value) (u["cHorizon"].value as THREE.Color).copy(target.cHorizon);
    if (u["cGlow"]?.value) (u["cGlow"].value as THREE.Color).copy(target.cGlow);
  };

  useEffect(() => {
    return subscribeTheme((mode) => {
      applyThemeColors(mode);
    });
  }, []);

  const uniforms = useMemo(() => {
    const initial = getThemeMode() === "night" ? NIGHT_COLORS : DAY_COLORS;
    return {
      cTop: { value: initial.cTop.clone() },
      cMid: { value: initial.cMid.clone() },
      cHorizon: { value: initial.cHorizon.clone() },
      cGlow: { value: initial.cGlow.clone() },
    };
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[400, 48, 32]} />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

