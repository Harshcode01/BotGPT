import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  relicVertexShader,
  relicFragmentShader,
  particleVertexShader,
  particleFragmentShader,
  postVertexShader,
  postFragmentShader,
} from "../shaders";

gsap.registerPlugin(ScrollTrigger);

const PALETTE = {
  obsidian: new THREE.Color("#050609"),
  ivory: new THREE.Color("#F4F6F9"),
  frost: new THREE.Color("#00E5FF"),
  magma: new THREE.Color("#FF3D00"),
};

export default function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeScale = reduceMotion ? 0.15 : 1;

    // Scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = PALETTE.obsidian;
    scene.fog = new THREE.FogExp2("#050609", 0.035);

    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    const dpr = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    container.appendChild(renderer.domElement);

    // Core
    const relicGeo = new THREE.IcosahedronGeometry(1.65, isMobile ? 24 : 48);
    const relicMat = new THREE.ShaderMaterial({
      vertexShader: relicVertexShader,
      fragmentShader: relicFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uThermoBalance: { value: 0 },
        uPulse: { value: 0 },
        uMouseWorld: { value: new THREE.Vector3(0, 0, 4) },
        uLightPos: { value: new THREE.Vector3(3, 3, 5) },
        uColorObsidian: { value: PALETTE.obsidian },
        uColorFrost: { value: PALETTE.frost },
        uColorMagma: { value: PALETTE.magma },
        uColorIvory: { value: PALETTE.ivory },
      },
    });
    const relic = new THREE.Mesh(relicGeo, relicMat);
    scene.add(relic);

    // Orbit rings
    const rings = [];
    const ringDefs = [
      { r: 2.7, t: 0.012, color: PALETTE.frost, tilt: [1.2, 0.2, 0] },
      { r: 3.3, t: 0.008, color: PALETTE.magma, tilt: [0.4, 0.9, 0.3] },
      { r: 4.1, t: 0.006, color: PALETTE.ivory, tilt: [-0.7, 0.3, 0.8] },
    ];
    ringDefs.forEach((d) => {
      const geo = new THREE.TorusGeometry(d.r, d.t, 8, 220);
      const mat = new THREE.MeshBasicMaterial({
        color: d.color,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.set(d.tilt[0], d.tilt[1], d.tilt[2]);
      scene.add(mesh);
      rings.push({ mesh, geo, mat, speed: 0.08 + Math.random() * 0.12 });
    });

    // Floating crystal shards
    const SHARD_COUNT = isMobile ? 80 : 260;
    const shardGeo = new THREE.OctahedronGeometry(0.16, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: "#0b0f16",
      metalness: 0.9,
      roughness: 0.22,
      emissive: "#001a22",
      emissiveIntensity: 0.6,
    });
    const shards = new THREE.InstancedMesh(shardGeo, shardMat, SHARD_COUNT);
    shards.frustumCulled = false;
    const shardData = [];
    for (let i = 0; i < SHARD_COUNT; i++) {
      shardData.push({
        radius: 4 + Math.random() * 12,
        angle: Math.random() * Math.PI * 2,
        y: (Math.random() - 0.5) * 22,
        speed: (0.03 + Math.random() * 0.08) * (Math.random() > 0.5 ? 1 : -1),
        spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.8),
        scale: 0.4 + Math.random() * 1.8,
        phase: Math.random() * 10,
      });
    }
    scene.add(shards);

    const frostLight = new THREE.PointLight(PALETTE.frost, 60, 40, 2);
    const magmaLight = new THREE.PointLight(PALETTE.magma, 60, 40, 2);
    scene.add(frostLight, magmaLight, new THREE.AmbientLight("#223344", 0.5));

    // Particles
    const PARTICLE_COUNT = isMobile ? 9000 : 30000;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);
    const temperatures = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const radius = 2.6 + Math.pow(Math.random(), 1.5) * 24;
      const theta = Math.random() * Math.PI * 2;
      positions[i3] = Math.cos(theta) * radius;
      positions[i3 + 1] = (Math.random() - 0.5) * 50;
      positions[i3 + 2] = Math.sin(theta) * radius - 6;
      scales[i] = 0.4 + Math.random() * 1.6;
      temperatures[i] = i % 2 === 0 ? 0 : 1;
      phases[i] = Math.random() * Math.PI * 2;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    particleGeo.setAttribute("aTemperature", new THREE.BufferAttribute(temperatures, 1));
    particleGeo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    const particleMat = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSpeedMultiplier: { value: 1 },
        uPixelRatio: { value: dpr },
        uColorFrost: { value: PALETTE.frost },
        uColorMagma: { value: PALETTE.magma },
        uColorIvory: { value: PALETTE.ivory },
      },
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    particles.frustumCulled = false;
    scene.add(particles);

    // Post processing: bloom, chromatic aberration, vignette, grain, tone map
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.55);
    composer.addPass(bloom);
    const postPass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAberration: { value: 0.002 } },
      vertexShader: postVertexShader,
      fragmentShader: postFragmentShader,
    });
    composer.addPass(postPass);
    composer.addPass(new OutputPass());

    // Scroll choreography. Lenis drives the window scroll in LandingPage.
    const cameraSpline = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(-4.2, 1.0, 7.2),
        new THREE.Vector3(4.4, -1.0, 7),
        new THREE.Vector3(0, 3.2, 6.4),
        new THREE.Vector3(0, 0, 14),
      ],
      false,
      "catmullrom",
      0.4
    );
    const state = { progress: 0, shardSpread: 0 };
    const ctx = gsap.context(() => {
      gsap.to(state, {
        progress: 1,
        ease: "none",
        scrollTrigger: { trigger: "#scroll-container", start: "top top", end: "bottom bottom", scrub: 1.2 },
      });
      gsap.to(relicMat.uniforms.uThermoBalance, {
        value: -0.95,
        ease: "none",
        scrollTrigger: { trigger: "#scene-frost", start: "top 80%", end: "center center", scrub: true },
      });
      gsap.to(relicMat.uniforms.uThermoBalance, {
        value: 0.95,
        ease: "none",
        scrollTrigger: { trigger: "#scene-fire", start: "top 80%", end: "center center", scrub: true },
      });
      gsap.to(state, {
        shardSpread: 1,
        ease: "none",
        scrollTrigger: { trigger: "#scene-track", start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.to(state, {
        shardSpread: 0,
        ease: "none",
        immediateRender: false,
        scrollTrigger: { trigger: "#scene-final", start: "top bottom", end: "top center", scrub: true },
      });
    });

    // Input
    let mouseX = 0;
    let mouseY = 0;
    let smoothX = 0;
    let smoothY = 0;
    const onMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);

    // Render loop
    const startTime = performance.now();
    const tmpV = new THREE.Vector3();
    const dummy = new THREE.Object3D();
    let lastScroll = window.scrollY;
    let velocity = 0;
    let rafId;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = ((performance.now() - startTime) / 1000) * timeScale;

      const dy = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      const target = reduceMotion ? 0 : Math.min(Math.abs(dy) / 60, 1.5);
      velocity += (target - velocity) * 0.08;

      smoothX += (mouseX - smoothX) * 0.05;
      smoothY += (mouseY - smoothY) * 0.05;

      relicMat.uniforms.uTime.value = t;
      relicMat.uniforms.uPulse.value = velocity * 0.9;
      relicMat.uniforms.uMouseWorld.value.set(smoothX * 2.5, smoothY * 2.5, 1.5);
      relicMat.uniforms.uLightPos.value.set(smoothX * 6, smoothY * 4.5, 4.5);
      particleMat.uniforms.uTime.value = t;
      particleMat.uniforms.uSpeedMultiplier.value = 1 + velocity * 3.5;
      postPass.uniforms.uTime.value = t;
      postPass.uniforms.uAberration.value = 0.0015 + velocity * 0.012;
      bloom.strength = 0.5 + velocity * 0.45;

      cameraSpline.getPointAt(Math.min(Math.max(state.progress, 0), 1), tmpV);
      camera.position.set(tmpV.x + smoothX * 0.6, tmpV.y + smoothY * 0.45, tmpV.z);
      camera.lookAt(0, 0, 0);

      relic.rotation.y = t * 0.16 + state.progress * Math.PI * 3;
      relic.rotation.x = t * 0.08;
      relic.scale.setScalar(1 + Math.sin(t * 1.2) * 0.015 + velocity * 0.06);

      rings.forEach((r, i) => {
        r.mesh.rotation.z += r.speed * 0.01 * (i % 2 ? -1 : 1) * (1 + velocity * 6);
        r.mesh.rotation.x += 0.0008;
        r.mesh.scale.setScalar(1 + state.shardSpread * 0.25 * (i + 1));
        r.mat.opacity = 0.35 + Math.sin(t + i) * 0.1 + velocity * 0.3;
      });

      frostLight.position.set(Math.cos(t * 0.4) * 5, 2, Math.sin(t * 0.4) * 5);
      magmaLight.position.set(Math.cos(t * 0.4 + Math.PI) * 5, -2, Math.sin(t * 0.4 + Math.PI) * 5);

      const spread = 1 + state.shardSpread * 0.9;
      for (let i = 0; i < SHARD_COUNT; i++) {
        const s = shardData[i];
        const a = s.angle + t * s.speed * (1 + velocity * 4);
        const rad = s.radius * spread;
        dummy.position.set(Math.cos(a) * rad, s.y + Math.sin(t * 0.5 + s.phase) * 0.6, Math.sin(a) * rad - 2);
        dummy.rotation.set(t * s.spin.x, t * s.spin.y, t * s.spin.z);
        dummy.scale.setScalar(s.scale);
        dummy.updateMatrix();
        shards.setMatrixAt(i, dummy.matrix);
      }
      shards.instanceMatrix.needsUpdate = true;

      composer.render();
    };
    animate();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      ctx.revert();
      relicGeo.dispose();
      relicMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      shardGeo.dispose();
      shardMat.dispose();
      shards.dispose();
      rings.forEach((r) => {
        r.geo.dispose();
        r.mat.dispose();
      });
      composer.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
