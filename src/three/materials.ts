import * as THREE from 'three'

export interface WindowUniforms {
  uLit: { value: number }
  uWinIntensity: { value: number }
  uWinColor: { value: THREE.Color }
  uWinColor2: { value: THREE.Color }
  uWinW: { value: number }
  uWinH: { value: number }
  uFloor: { value: number }
}

/**
 * Matériau de façade : les fenêtres sont calculées dans le shader à partir de la position monde,
 * ce qui permet d'instancier des centaines d'immeubles avec un seul matériau.
 */
export function makeWindowMaterial(opts: {
  lit?: number
  intensity?: number
  winColor?: string
  winColor2?: string
  winW?: number
  winH?: number
  floor?: number
  roughness?: number
  metalness?: number
  color?: string
}): THREE.MeshStandardMaterial & { userData: { uniforms: WindowUniforms } } {
  const mat = new THREE.MeshStandardMaterial({
    color: opts.color ?? '#ffffff',
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0.05,
  })
  const uniforms: WindowUniforms = {
    uLit: { value: opts.lit ?? 0.35 },
    uWinIntensity: { value: opts.intensity ?? 2.2 },
    uWinColor: { value: new THREE.Color(opts.winColor ?? '#ffcf7a') },
    uWinColor2: { value: new THREE.Color(opts.winColor2 ?? '#bcd9ff') },
    uWinW: { value: opts.winW ?? 2.2 },
    uWinH: { value: opts.winH ?? 3 },
    uFloor: { value: opts.floor ?? 1.6 },
  }
  mat.userData.uniforms = uniforms
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNormal;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        #ifdef USE_INSTANCING
          vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
          vWNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);
        #else
          vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
          vWNormal = normalize(mat3(modelMatrix) * objectNormal);
        #endif`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWPos;
        varying vec3 vWNormal;
        uniform float uLit;
        uniform float uWinIntensity;
        uniform vec3 uWinColor;
        uniform vec3 uWinColor2;
        uniform float uWinW;
        uniform float uWinH;
        uniform float uFloor;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          vec3 an = abs(vWNormal);
          if (an.y < 0.5 && vWPos.y > uFloor) {
            vec2 uv = an.x > an.z ? vWPos.zy : vWPos.xy;
            vec2 g = uv / vec2(uWinW, uWinH);
            vec2 cell = floor(g);
            vec2 f = fract(g);
            float win = step(0.22, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.8);
            float h = fract(sin(dot(cell, vec2(12.9898, 78.233)) + dot(floor(vWPos.xz / 7.0), vec2(3.17, 7.71))) * 43758.5453);
            float lit = step(1.0 - uLit, h);
            vec3 wc = mix(uWinColor, uWinColor2, step(0.75, fract(h * 13.0)));
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.25, win);
            totalEmissiveRadiance += win * lit * wc * uWinIntensity;
          }
        }`,
      )
  }
  mat.customProgramCacheKey = () => 'idledeal-windows'
  return mat as THREE.MeshStandardMaterial & { userData: { uniforms: WindowUniforms } }
}

/** Matériau émissif (néons, phares) — dépasse 1 pour déclencher le bloom. */
export function neon(color: string, intensity = 3): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#000000', emissive: color, emissiveIntensity: intensity, toneMapped: false })
}

const cache = new Map<string, THREE.Material>()

/** Matériaux simples partagés (évite de recréer un matériau par mesh). */
export function solid(color: string, roughness = 0.8, metalness = 0): THREE.MeshStandardMaterial {
  const key = `s:${color}:${roughness}:${metalness}`
  let m = cache.get(key) as THREE.MeshStandardMaterial | undefined
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness })
    cache.set(key, m)
  }
  return m
}

export function glow(color: string, intensity = 3): THREE.MeshStandardMaterial {
  const key = `g:${color}:${intensity}`
  let m = cache.get(key) as THREE.MeshStandardMaterial | undefined
  if (!m) {
    m = neon(color, intensity)
    cache.set(key, m)
  }
  return m
}

/** Géométries partagées. */
export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cone: new THREE.ConeGeometry(0.5, 1, 8),
  sphere: new THREE.SphereGeometry(0.5, 12, 10),
  ico: new THREE.IcosahedronGeometry(0.5, 0),
  capsule: new THREE.CapsuleGeometry(0.3, 0.8, 4, 8),
  plane: new THREE.PlaneGeometry(1, 1),
}
