import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BoardDesign } from '../types';

interface ThreeViewProps {
  design: BoardDesign;
}

export function ThreeView({ design }: ThreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Initialize camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(500, 400, 500);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(500, 500, 500);
    scene.add(directionalLight);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(1000, 20);
    scene.add(gridHelper);

    // Create board mesh
    updateBoard(scene, design);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Slow rotation
      if (sceneRef.current) {
        sceneRef.current.rotation.y += 0.002;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      updateBoard(sceneRef.current, design);
    }
  }, [design]);

  return <div ref={containerRef} className="three-view" />;
}

function updateBoard(scene: THREE.Scene, design: BoardDesign) {
  // Remove existing board
  const existingBoard = scene.getObjectByName('board');
  if (existingBoard) {
    scene.remove(existingBoard);
  }

  const { width, length, thickness } = design.dimensions;
  
  // Create board geometry
  const geometry = new THREE.BoxGeometry(width, thickness, length);
  
  // Create material with wood texture color
  const color = new THREE.Color(design.species[0]?.color || '#D9B382');
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.7,
    metalness: 0.1,
  });

  const board = new THREE.Mesh(geometry, material);
  board.name = 'board';
  board.position.set(0, thickness / 2, 0);
  
  scene.add(board);

  // Add juice groove if enabled
  if (design.juiceGroove.enabled) {
    addJuiceGroove(scene, design);
  }

  // Add rubber feet if enabled
  if (design.rubberFeet.enabled) {
    addRubberFeet(scene, design);
  }
}

function addJuiceGroove(scene: THREE.Scene, design: BoardDesign) {
  const { width, thickness } = design.dimensions;
  const { width: grooveWidth, fromEdge } = design.juiceGroove;

  const grooveGeometry = new THREE.TorusGeometry(
    (width / 2 - fromEdge - grooveWidth / 2),
    grooveWidth / 2,
    16,
    50
  );
  
  const grooveMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.8,
  });

  const groove = new THREE.Mesh(grooveGeometry, grooveMaterial);
  groove.position.set(0, thickness / 2 + 1, 0);
  groove.rotation.x = Math.PI / 2;
  
  scene.add(groove);
}

function addRubberFeet(scene: THREE.Scene, design: BoardDesign) {
  const { width, length, thickness } = design.dimensions;
  const { diameter, height, inset } = design.rubberFeet;

  const footGeometry = new THREE.CylinderGeometry(diameter / 2, diameter / 2, height, 16);
  const footMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.9,
  });

  const positions = [
    [-width / 2 + inset, -thickness / 2 - height / 2, -length / 2 + inset],
    [width / 2 - inset, -thickness / 2 - height / 2, -length / 2 + inset],
    [-width / 2 + inset, -thickness / 2 - height / 2, length / 2 - inset],
    [width / 2 - inset, -thickness / 2 - height / 2, length / 2 - inset],
  ];

  for (const [x, y, z] of positions) {
    const foot = new THREE.Mesh(footGeometry, footMaterial);
    foot.position.set(x, y, z);
    scene.add(foot);
  }
}
