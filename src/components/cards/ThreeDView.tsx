"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import * as THREE from "three";
import { MTLLoader, OBJLoader, OrbitControls } from "three-stdlib";
import { useDarkMode } from '@/context/DarkModeContext';

export default function ThreeDView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const objectRef = useRef<THREE.Object3D | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const fitDistanceRef = useRef<number>(20);

  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useDarkMode();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 20;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    const rendererEl = renderer.domElement;
    container.appendChild(rendererEl);

    const controls = new OrbitControls(camera, rendererEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('/models/');
    mtlLoader.load('bodyfull.mtl', (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath('/models/');
      objLoader.load(
        'bodyfull.obj',
        (object) => {
          const box = new THREE.Box3().setFromObject(object);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          object.scale.setScalar(scale);
          center.y -= size.y * 0.25;
          object.position.sub(center.multiplyScalar(scale));

          scene.add(object);
          objectRef.current = object;

          const boundingSphere = new THREE.Sphere();
          box.getBoundingSphere(boundingSphere);

          const fitRadius = boundingSphere.radius * scale;
          const fov = camera.fov * (Math.PI / 180);
          const fitHeightDistance = fitRadius / Math.sin(fov / 2);
          const fitWidthDistance =
            fitRadius / Math.sin((camera.aspect * fov) / 2);
          const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance);

          camera.position.set(0, 0, distance);
          camera.lookAt(0, 0, 0);
          controls.target.set(0, 0, 0);
          controls.update();

          fitDistanceRef.current = distance;
          controlsRef.current = controls;

          setIsLoading(false);
          animate();
        },
        undefined,
        (err) => {
          console.error('Error loading model:', err);
          setIsLoading(false);
        },
      );
    });

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      renderer.dispose();
      controls.dispose();
      window.removeEventListener('resize', handleResize);
      if (container.contains(rendererEl)) {
        container.removeChild(rendererEl);
      }
    };
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-start w-full px-5 py-4 border-2 rounded-xl flex-1 overflow-hidden relative ${
        isDark
          ? 'border-[#113541] bg-[#0F1B2B] text-white'
          : 'border-[#ECECEC] bg-white text-black'
      }`}
      style={{ height: '400px' }}
    >
      <button
        onClick={() => {
          if (!cameraRef.current || !controlsRef.current) return;
          cameraRef.current.position.set(0, 0, fitDistanceRef.current);
          cameraRef.current.lookAt(0, 0, 0);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }}
        className={`absolute top-2 right-2 z-30 px-3 py-1 text-sm rounded-lg shadow transition ${
          isDark
            ? 'bg-[#1E2D40] text-white hover:bg-[#29415E]'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Icon icon='mdi:refresh' className='w-5 h-5' />
      </button>

      <div
        className={`absolute inset-0 z-0 opacity-60 pointer-events-none`}
        style={{
          backgroundImage: `linear-gradient(to right, ${
            isDark ? '#1f2e40' : '#e0e0e0'
          } 1px, transparent 1px), linear-gradient(to bottom, ${
            isDark ? '#1f2e40' : '#e0e0e0'
          } 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      <div className='flex flex-row items-center justify-start w-full gap-2 z-10 mb-3'>
        <div className='p-1.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl shadow-md'>
          <Icon
            icon='iconamoon:3d-fill'
            width={20}
            height={20}
            className='text-white'
          />
        </div>
        <p className='font-semibold text-base'>3D View</p>
      </div>

      <div
        ref={containerRef}
        className='w-full h-[300px] flex-1 z-10'
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          width: '100%',
        }}
      >
        {isLoading && (
          <div
            className={`absolute inset-0 flex items-center justify-center z-20 ${
              isDark ? 'bg-[#0F1B2B]/80' : 'bg-white/70'
            } backdrop-blur`}
          >
            <svg
              className='animate-spin h-8 w-8 text-blue-500'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
