// src/shaders.js

export const relicVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uThermoBalance;
  uniform float uPulse;
  uniform vec3 uMouseWorld;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vNoise;
  
  // Ashima 3D Simplex Noise
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    float n1 = snoise(normal * 1.8 + uTime * 0.28);
    float n2 = snoise(normal * 4.2 - uTime * 0.45) * 0.45;
    float combinedNoise = n1 + n2;

    float crystalline = abs(combinedNoise);
    float displacement = mix(crystalline * 0.52, combinedNoise * 0.45, uThermoBalance * 0.5 + 0.5);
    displacement *= (1.0 + uPulse * 0.45);

    vec3 displacedPosition = position + normal * displacement;
    
    // Repel from cursor
    float mouseDist = distance(displacedPosition, uMouseWorld);
    float mouseEffect = smoothstep(3.5, 0.0, mouseDist) * 0.22;
    displacedPosition += normal * mouseEffect;

    vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    vNoise = combinedNoise;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const relicFragmentShader = /* glsl */ `
  uniform vec3 uColorObsidian;
  uniform vec3 uColorFrost;
  uniform vec3 uColorMagma;
  uniform vec3 uColorIvory;
  uniform vec3 uLightPos;
  uniform float uThermoBalance;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vNoise;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 lightDir = normalize(uLightPos - vWorldPosition);

    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.6);
    float diff = max(dot(vNormal, lightDir), 0.0);

    float latitude = clamp(vWorldPosition.y * 0.45 - uThermoBalance * 0.85 + vNoise * 0.35, -1.0, 1.0);
    float fireMask = smoothstep(0.15, -0.35, latitude);

    float crevice = smoothstep(0.28, -0.32, vNoise);
    vec3 magmaCore = mix(uColorObsidian, uColorMagma, crevice * 1.35);
    vec3 frostSurface = mix(uColorObsidian, uColorFrost, fresnel * 0.9 + diff * 0.55);

    vec3 baseColor = mix(frostSurface, magmaCore, fireMask);
    vec3 rimColor = mix(uColorFrost, uColorMagma, fireMask);
    baseColor += rimColor * fresnel * 0.75;

    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vNormal, halfVec), 0.0), 32.0);
    baseColor += uColorIvory * spec * 0.35;

    gl_FragColor = vec4(baseColor * 0.6, 1.0);
  }
`;

export const particleVertexShader = /* glsl */ `
  attribute float aScale;
  attribute float aTemperature;
  attribute float aPhase;

  uniform float uTime;
  uniform float uSpeedMultiplier;
  uniform float uPixelRatio;

  varying float vTemperature;
  varying float vAlpha;

  void main() {
    vTemperature = aTemperature;
    vec3 pos = position;

    float angle = uTime * (0.12 + aScale * 0.15) * uSpeedMultiplier + aPhase;
    float radius = length(pos.xz);
    pos.x = cos(angle) * radius;
    pos.z = sin(angle) * radius;

    float verticalDir = mix(-1.0, 1.0, aTemperature);
    pos.y = mod(pos.y + verticalDir * uTime * 1.2 * uSpeedMultiplier + 25.0, 50.0) - 25.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aScale * 38.0 * uPixelRatio * (1.0 / -mvPosition.z);
    vAlpha = smoothstep(45.0, 8.0, -mvPosition.z);
  }
`;

export const particleFragmentShader = /* glsl */ `
  uniform vec3 uColorFrost;
  uniform vec3 uColorMagma;
  uniform vec3 uColorIvory;

  varying float vTemperature;
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float strength = pow(1.0 - dist * 2.0, 2.0);
    vec3 hue = mix(uColorFrost, uColorMagma, vTemperature);
    vec3 finalColor = mix(hue, uColorIvory, strength * 0.45);

    gl_FragColor = vec4(finalColor, strength * vAlpha * 0.85);
  }
`;

export const postVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const postFragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uAberration;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 c = vUv - 0.5;
    float d = dot(c, c);
    vec2 off = c * uAberration * (0.4 + d * 2.5);

    float r = texture2D(tDiffuse, vUv + off).r;
    float g = texture2D(tDiffuse, vUv).g;
    float b = texture2D(tDiffuse, vUv - off).b;
    vec3 col = vec3(r, g, b);

    float vig = smoothstep(0.95, 0.2, length(c) * 1.15);
    col *= mix(0.5, 1.0, vig);

    float grain = hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 100.0);
    col += (grain - 0.5) * 0.03;

    gl_FragColor = vec4(col, 1.0);
  }
`;
