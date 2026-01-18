'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Particle wave animation component
function ParticleWave({ count = 5000, depth = 50 }: { count?: number; depth?: number }) {
  const points = useRef<THREE.Points>(null);
  const { camera } = useThree();

  // Generate random positions for particles
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Indigo to violet gradient colors
    const colorStart = new THREE.Color('#6366f1'); // Indigo
    const colorEnd = new THREE.Color('#8b5cf6'); // Violet

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Spread particles in a 3D space
      positions[i3] = (Math.random() - 0.5) * 100; // x
      positions[i3 + 1] = (Math.random() - 0.5) * 100; // y
      positions[i3 + 2] = (Math.random() - 0.5) * depth * 2; // z (depth)

      // Random color between indigo and violet
      const mixRatio = Math.random();
      const color = colorStart.clone().lerp(colorEnd, mixRatio);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return [positions, colors];
  }, [count, depth]);

  // Store initial positions for wave animation
  const initialPositions = useMemo(() => positions.slice(), [positions]);

  // Scroll-based camera movement
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        // Move camera forward through particles as user scrolls
        camera.position.z = 30 - self.progress * depth * 0.8;
        camera.position.y = self.progress * 5;
      },
    });

    return () => trigger.kill();
  }, [camera, depth]);

  // Animate particles with wave effect
  useFrame((state) => {
    if (!points.current) return;

    const time = state.clock.getElapsedTime();
    const positionAttribute = points.current.geometry.attributes.position;
    const positions = positionAttribute.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Get initial position
      const ix = initialPositions[i3];
      const iy = initialPositions[i3 + 1];
      const iz = initialPositions[i3 + 2];

      // Apply wave animation
      const waveX = Math.sin(time * 0.3 + ix * 0.05) * 2;
      const waveY = Math.cos(time * 0.2 + iy * 0.05) * 2;
      const waveZ = Math.sin(time * 0.4 + iz * 0.03) * 1;

      positions[i3] = ix + waveX;
      positions[i3 + 1] = iy + waveY;
      positions[i3 + 2] = iz + waveZ;
    }

    positionAttribute.needsUpdate = true;

    // Gentle rotation of entire point cloud
    points.current.rotation.y = time * 0.02;
    points.current.rotation.x = Math.sin(time * 0.1) * 0.1;
  });

  // Create geometry with colors
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        transparent
        vertexColors
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.8}
      />
    </points>
  );
}

// Ambient glow effect
function AmbientGlow() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.getElapsedTime();
    mesh.current.rotation.z = time * 0.05;
    const scale = 1 + Math.sin(time * 0.5) * 0.1;
    mesh.current.scale.set(scale, scale, 1);
  });

  return (
    <mesh ref={mesh} position={[0, 0, -20]}>
      <circleGeometry args={[15, 64]} />
      <meshBasicMaterial
        color="#6366f1"
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Main background component
export function ParticleBackground() {
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check for mobile and reduced motion
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Delay render for smoother page load
    const timer = setTimeout(() => setIsReady(true), 100);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isReady || prefersReducedMotion) {
    // Fallback gradient background
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950" />
    );
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, isMobile ? 1.5 : 2]}
      >
        {/* Dark background */}
        <color attach="background" args={['#0a0a1a']} />

        {/* Ambient lighting */}
        <ambientLight intensity={0.5} />

        {/* Particle system - fewer on mobile */}
        <ParticleWave count={isMobile ? 2000 : 5000} depth={50} />

        {/* Glow effect */}
        <AmbientGlow />

        {/* Fog for depth */}
        <fog attach="fog" args={['#0a0a1a', 20, 80]} />
      </Canvas>

      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />
    </div>
  );
}
