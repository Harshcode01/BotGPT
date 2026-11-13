import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import {
  relicVertexShader,
  relicFragmentShader,
  particleVertexShader,
  particleFragmentShader,
  CinematicFinishShader
} from './shaders.js';

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// 0. ACCESSIBILITY, COLOR PALETTE & CAPABILITY DETECTION
// ============================================================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 768;

const PALETTE = {
  obsidian: new THREE.Color('#050609'),
  ivory: new THREE.Color('#F4F6F9'),
  frost: new THREE.Color('#00E5FF'),
  magma: new THREE.Color('#FF3D00'),
  steel: new THREE.Color('#8A99AD')
};

function isWebGLAvailable() {
  try {
    const testCanvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

const canvas = document.getElementById('webgl-canvas');
const fallbackEl = document.getElementById('webgl-fallback');

if (!isWebGLAvailable()) {
  fallbackEl.hidden = false;
  document.getElementById('loader').style.display = 'none';
} else {
  initExperience();
}

// ============================================================================
// 1. MAIN WEBGL + GSAP + LENIS INITIALIZATION
// ============================================================================
function initExperience() {
  const disposableGeometries = [];
  const disposableMaterials = [];
  const disposableTextures = [];

  // Scene & Deep Exponential Fog
  const scene = new THREE.Scene();
  scene.background = PALETTE.obsidian.clone();
  scene.fog = new THREE.FogExp2('#050609', 0.042);

  // Camera
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 150);
  camera.position.set(0, 0, 8.5);

  // Renderer (Pixel Ratio capped at 2 per performance spec)
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    powerPreference: 'high-performance'
  });
  const maxDPR = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(maxDPR);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // Pre-configured Draco & KTX2 Compression Loaders for external asset pipelines
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  const ktx2Loader = new KTX2Loader();
  ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/basis/');
  ktx2Loader.detectSupport(renderer);

  // ==========================================================================
  // 2. FOCAL RELIC ("THE OBSIDIAN HEART") + ORBITAL RINGS
  // ==========================================================================
  const relicGroup = new THREE.Group();
  scene.add(relicGroup);

  const relicGeo = new THREE.IcosahedronGeometry(1.65, isMobile ? 32 : 64);
  const relicMat = new THREE.ShaderMaterial({
    vertexShader: relicVertexShader,
    fragmentShader: relicFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uThermoBalance: { value: 0.0 },
      uPulse: { value: 0.0 },
      uMouseWorld: { value: new THREE.Vector3(0, 0, 4) },
      uLightPos: { value: new THREE.Vector3(3, 3, 5) },
      uColorObsidian: { value: PALETTE.obsidian },
      uColorFrost: { value: PALETTE.frost },
      uColorMagma: { value: PALETTE.magma },
      uColorIvory: { value: PALETTE.ivory }
    }
  });
  const relicMesh = new THREE.Mesh(relicGeo, relicMat);
  relicGroup.add(relicMesh);
  disposableGeometries.push(relicGeo);
  disposableMaterials.push(relicMat);

  // Outer Astrolabe Rings
  const ringGeo1 = new THREE.TorusGeometry(2.55, 0.018, 16, 120);
  const ringGeo2 = new THREE.TorusGeometry(3.05, 0.012, 16, 120);
  const ringMat = new THREE.MeshStandardMaterial({
    color: PALETTE.steel,
    metalness: 0.9,
    roughness: 0.2
  });
  const ring1 = new THREE.Mesh(ringGeo1, ringMat);
  const ring2 = new THREE.Mesh(ringGeo2, ringMat);
  ring1.rotation.x = Math.PI * 0.35;
  ring2.rotation.y = Math.PI * 0.25;
  relicGroup.add(ring1, ring2);
  disposableGeometries.push(ringGeo1, ringGeo2);
  disposableMaterials.push(ringMat);

  // ==========================================================================
  // 3. STORY WAYPOINT MONOLITHS (Along the Camera Spline)
  // ==========================================================================
  const monolithGeo = new THREE.OctahedronGeometry(0.85, 0);
  const frostMonolithMat = new THREE.MeshStandardMaterial({
    color: PALETTE.frost,
    roughness: 0.15,
    metalness: 0.8,
    wireframe: true
  });
  const fireMonolithMat = new THREE.MeshStandardMaterial({
    color: PALETTE.magma,
    roughness: 0.2,
    metalness: 0.7,
    wireframe: true
  });
  disposableGeometries.push(monolithGeo);
  disposableMaterials.push(frostMonolithMat, fireMonolithMat);

  // Frost Spires Cluster (Scene I)
  const frostCluster = new THREE.Group();
  frostCluster.position.set(-4.2, 1.2, -7.5);
  for (let i = 0; i < 5; i++) {
    const spire = new THREE.Mesh(monolithGeo, frostMonolithMat);
    spire.position.set(Math.cos(i * 1.25) * 2.2, Math.sin(i * 1.25) * 1.5, -i * 0.6);
    spire.scale.set(0.5, 1.8, 0.5);
    frostCluster.add(spire);
  }
  scene.add(frostCluster);

  // Magma Pillars Cluster (Scene II)
  const magmaCluster = new THREE.Group();
  magmaCluster.position.set(4.5, -1.8, -16.0);
  for (let i = 0; i < 5; i++) {
    const pillar = new THREE.Mesh(monolithGeo, fireMonolithMat);
    pillar.position.set(Math.cos(i * 1.25) * 2.4, Math.sin(i * 1.25) * 1.5, -i * 0.6);
    pillar.scale.set(0.7, 1.4, 0.7);
    magmaCluster.add(pillar);
  }
  scene.add(magmaCluster);

  // ==========================================================================
  // 4. 25,000 PARTICLE DUAL-STREAM VORTEX
  // ==========================================================================
  const PARTICLE_COUNT = 25000;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const scales = new Float32Array(PARTICLE_COUNT);
  const temperatures = new Float32Array(PARTICLE_COUNT);
  const phases = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const radius = 2.6 + Math.pow(Math.random(), 1.5) * 22.0;
    const theta = Math.random() * Math.PI * 2;

    positions[i3] = Math.cos(theta) * radius;
    positions[i3 + 1] = (Math.random() - 0.5) * 50.0;
    positions[i3 + 2] = Math.sin(theta) * radius - 10.0;

    scales[i] = 0.4 + Math.random() * 1.6;
    temperatures[i] = i % 2 === 0 ? 0.0 : 1.0; // 50% Frost, 50% Magma Ember
    phases[i] = Math.random() * Math.PI * 2;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  particleGeo.setAttribute('aTemperature', new THREE.BufferAttribute(temperatures, 1));
  particleGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const particleMat = new THREE.ShaderMaterial({
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSpeedMultiplier: { value: 1.0 },
      uPixelRatio: { value: maxDPR },
      uColorFrost: { value: PALETTE.frost },
      uColorMagma: { value: PALETTE.magma },
      uColorIvory: { value: PALETTE.ivory }
    }
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);
  disposableGeometries.push(particleGeo);
  disposableMaterials.push(particleMat);

  // ==========================================================================
  // 5. DYNAMIC MOUSE-FOLLOWING LIGHTS
  // ==========================================================================
  const ambientLight = new THREE.AmbientLight(PALETTE.ivory, 0.35);
  scene.add(ambientLight);

  const mouseLight = new THREE.PointLight(PALETTE.frost, 8, 25);
  mouseLight.position.set(2, 2, 5);
  scene.add(mouseLight);

  const magmaRimLight = new THREE.PointLight(PALETTE.magma, 6, 30);
  magmaRimLight.position.set(-4, -3, 2);
  scene.add(magmaRimLight);

  // ==========================================================================
  // 6. POST-PROCESSING (Bloom + Chromatic Aberration + Film Grain)
  // ==========================================================================
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.85, // strength
    0.45, // radius
    0.25  // threshold
  );
  composer.addPass(bloomPass);

  const finishPass = new ShaderPass(CinematicFinishShader);
  composer.addPass(finishPass);

  // ==========================================================================
  // 7. CAMERA SPLINE & LENIS + GSAP SCROLL CHOREOGRAPHY
  // ==========================================================================
  const cameraSpline = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 8.5),      // 0. Hero Center
    new THREE.Vector3(-2.6, 0.9, 4.2), // 1. Act I: Frost Citadel
    new THREE.Vector3(2.8, -1.1, 3.8), // 2. Act II: Obsidian Crucible
    new THREE.Vector3(0, 0.3, 5.2),    // 3. Act III: Convergence
    new THREE.Vector3(0, -0.4, 7.2),   // 4. Relics Grid
    new THREE.Vector3(0, 0, 4.1)       // 5. Final CTA Overdrive
  ]);

  const scrollState = { progress: 0 };
  const hudTempEl = document.getElementById('hud-temp');

  const lenis = new Lenis({
    duration: prefersReducedMotion ? 0 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !prefersReducedMotion
  });

  lenis.on('scroll', ({ velocity }) => {
    ScrollTrigger.update();
    // Dynamic chromatic aberration spikes subtly with scroll speed
    const clampedVel = Math.min(Math.abs(velocity) * 0.0004, 0.008);
    finishPass.uniforms.uAberration.value = 0.0016 + clampedVel;
  });

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Master ScrollTimeline driving Camera Spline & Shader Moods
  gsap.to(scrollState, {
    progress: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#smooth-content',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8
    }
  });

  // Scene I: Frost Mood Transition
  gsap.timeline({
    scrollTrigger: {
      trigger: '#scene-frost',
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: true
    }
  })
    .to(relicMat.uniforms.uThermoBalance, { value: -0.95, duration: 1 }, 0)
    .to(scene.fog.color, { r: 0.01, g: 0.06, b: 0.09, duration: 1 }, 0)
    .call(() => { hudTempEl.textContent = 'THERMO // -214°C RIME'; });

  // Scene II: Fire Mood Transition
  gsap.timeline({
    scrollTrigger: {
      trigger: '#scene-fire',
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: true
    }
  })
    .to(relicMat.uniforms.uThermoBalance, { value: 0.95, duration: 1 }, 0)
    .to(scene.fog.color, { r: 0.09, g: 0.02, b: 0.01, duration: 1 }, 0)
    .call(() => { hudTempEl.textContent = 'THERMO // 3,400°C MAGMA'; });

  // Scene III: Equilibrium & Final Section Particle Overdrive
  gsap.timeline({
    scrollTrigger: {
      trigger: '#scene-convergence',
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: true
    }
  })
    .to(relicMat.uniforms.uThermoBalance, { value: 0.0, duration: 1 }, 0)
    .to(scene.fog.color, { r: PALETTE.obsidian.r, g: PALETTE.obsidian.g, b: PALETTE.obsidian.b, duration: 1 }, 0)
    .call(() => { hudTempEl.textContent = 'THERMO // 0.00° ECLIPSE'; });

  gsap.to(particleMat.uniforms.uSpeedMultiplier, {
    value: 3.4,
    ease: 'power2.inOut',
    scrollTrigger: {
      trigger: '#final-cta',
      start: 'top 85%',
      end: 'bottom bottom',
      scrub: true
    }
  });

  // ==========================================================================
  // 8. PRELOADER SEQUENCE (0 -> 100%) & HERO ENTRANCE (0.6s - 1.4s Easing)
  // ==========================================================================
  const loaderCountEl = document.getElementById('loader-count');
  const loaderBarEl = document.getElementById('loader-bar-fill');
  const loaderEl = document.getElementById('loader');

  const loaderObj = { val: 0 };
  gsap.to(loaderObj, {
    val: 100,
    duration: 1.4,
    ease: 'power3.inOut',
    onUpdate: () => {
      const current = Math.round(loaderObj.val);
      loaderCountEl.textContent = String(current).padStart(3, '0');
      loaderBarEl.style.width = `${current}%`;
    },
    onComplete: () => {
      const tl = gsap.timeline();
      tl.to(loaderEl, {
        opacity: 0,
        duration: 0.8,
        ease: 'power3.inOut',
        onComplete: () => {
          loaderEl.style.display = 'none';
        }
      })
        .from(
          relicGroup.scale,
          { x: 0.01, y: 0.01, z: 0.01, duration: 1.2, ease: 'expo.out' },
          '-=0.5'
        )
        .from(
          '.hero-reveal',
          {
            y: 36,
            opacity: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power3.out'
          },
          '-=0.8'
        );
    }
  });

  // ==========================================================================
  // 9. INTERACTIVE CURSOR, 3D CARD TILT & CTA SHOCKWAVE
  // ==========================================================================
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  const cursorLabel = cursorRing.querySelector('.cursor-label');

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  window.addEventListener(
    'pointermove',
    (e) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

      gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power2.out' });
      gsap.to(cursorRing, { x: e.clientX, y: e.clientY, duration: 0.35, ease: 'power3.out' });
    },
    { passive: true }
  );

  document.querySelectorAll('[data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => {
      cursorRing.classList.add('is-active');
      cursorLabel.textContent = el.getAttribute('data-cursor');
    });
    el.addEventListener('pointerleave', () => {
      cursorRing.classList.remove('is-active');
      cursorLabel.textContent = '';
    });
  });

  // 3D Tilt Cards
  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      if (prefersReducedMotion) return;
      const rect = card.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const pctX = (relX / rect.width - 0.5) * 2;
      const pctY = (relY / rect.height - 0.5) * 2;

      card.style.setProperty('--glow-x', `${relX}px`);
      card.style.setProperty('--glow-y', `${relY}px`);

      gsap.to(card, {
        rotateY: pctX * 10,
        rotateX: -pctY * 10,
        duration: 0.6,
        ease: 'power2.out'
      });
    });

    card.addEventListener('pointerleave', () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
    });
  });

  // Final CTA Button Shockwave
  const igniteBtn = document.getElementById('ignite-btn');
  igniteBtn.addEventListener('click', () => {
    gsap.fromTo(
      relicMat.uniforms.uPulse,
      { value: 0.0 },
      { value: 1.35, duration: 0.65, yoyo: true, repeat: 1, ease: 'power3.inOut' }
    );
    gsap.fromTo(
      bloomPass,
      { strength: 0.85 },
      { strength: 2.1, duration: 0.65, yoyo: true, repeat: 1, ease: 'power2.inOut' }
    );
  });

  // ==========================================================================
  // 10. RENDER LOOP & CLEANUP
  // ==========================================================================
  const clock = new THREE.Clock();
  const splinePoint = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;

    const elapsed = prefersReducedMotion ? 0 : clock.getElapsedTime();

    // Smooth mouse interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    // Update shader & post-processing uniforms
    relicMat.uniforms.uTime.value = elapsed;
    particleMat.uniforms.uTime.value = elapsed;
    finishPass.uniforms.uTime.value = elapsed;

    // Dynamic cursor light & 3D cursor interaction
    mouseLight.position.set(mouse.x * 6.0, mouse.y * 4.5, 4.5);
    relicMat.uniforms.uLightPos.value.copy(mouseLight.position);
    relicMat.uniforms.uMouseWorld.value.set(mouse.x * 2.5, mouse.y * 2.5, 1.5);

    // Move camera along spline + apply mouse parallax
    cameraSpline.getPointAt(scrollState.progress, splinePoint);
    camera.position.x = splinePoint.x + mouse.x * 0.55;
    camera.position.y = splinePoint.y + mouse.y * 0.45;
    camera.position.z = splinePoint.z;
    camera.lookAt(relicGroup.position);

    // Rotate core & astrolabe rings
    if (!prefersReducedMotion) {
      relicMesh.rotation.y = elapsed * 0.18 + scrollState.progress * Math.PI * 2;
      relicMesh.rotation.x = elapsed * 0.09;
      ring1.rotation.z = elapsed * 0.25;
      ring2.rotation.x = -elapsed * 0.2;
      frostCluster.rotation.y = elapsed * 0.15;
      magmaCluster.rotation.y = -elapsed * 0.15;
    }

    composer.render();
  }

  animate();

  // Viewport Resize Handler
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // Explicit GPU Resource Disposal on Page Unload
  window.addEventListener('pagehide', () => {
    window.removeEventListener('resize', onResize);
    lenis.destroy();
    dracoLoader.dispose();
    ktx2Loader.dispose();
    disposableGeometries.forEach((g) => g.dispose());
    disposableMaterials.forEach((m) => m.dispose());
    disposableTextures.forEach((t) => t.dispose());
    composer.dispose();
    renderer.dispose();
  });
}