import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CityGenerator } from './cityGenerator.js';

/**
 * ThreeSetup - Handles the initialization and rendering of the Three.js 3D scene,
 * including camera, lighting, fog, and orchestrating the CityGenerator.
 */
export class ThreeSetup {
  /**
   * Initialize the 3D environment
   * @param {HTMLCanvasElement} canvas - The canvas to render onto
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    
    this.initialFogColor = 0xbae6fd;
    this.scene.fog = new THREE.FogExp2(this.initialFogColor, 0.008);
    this.scene.background = new THREE.Color(this.initialFogColor);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(22, 20, 32);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 65;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, 2, 0);

    this.setupLighting();
    
    this.cityGenerator = new CityGenerator(this.scene);
    this.cityGenerator.buildCity();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Configures hemisphere and directional sunlight with shadows
   */
  setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.position.set(20, 35, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 80;

    const d = 30;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
  }

  /**
   * Interpolates lighting and sky colors based on the carbon score
   * @param {number} carbonScore - Score from 0 (clean) to 100 (dirty)
   */
  updateAtmosphere(carbonScore) {
    const t = carbonScore / 100.0;

    const cleanSky = new THREE.Color(0xbae6fd);
    const dirtySky = new THREE.Color(0x272522);
    const targetSkyColor = cleanSky.clone().lerp(dirtySky, t);
    
    this.scene.background.copy(targetSkyColor);
    this.scene.fog.color.copy(targetSkyColor);
    this.renderer.setClearColor(targetSkyColor);

    this.scene.fog.density = 0.008 + (0.030 * t);

    const cleanSunColor = new THREE.Color(0xffffff);
    const dirtySunColor = new THREE.Color(0xef4444);
    this.sunLight.color.copy(cleanSunColor).lerp(dirtySunColor, t);
    this.sunLight.intensity = 1.2 - (0.7 * t);

    const cleanHemiSky = new THREE.Color(0xffffff);
    const dirtyHemiSky = new THREE.Color(0x57534e);
    const cleanHemiGround = new THREE.Color(0x444444);
    const dirtyHemiGround = new THREE.Color(0x1c1917);
    
    this.hemiLight.color.copy(cleanHemiSky).lerp(dirtyHemiSky, t);
    this.hemiLight.groundColor.copy(cleanHemiGround).lerp(dirtyHemiGround, t);
  }

  /**
   * Handle browser window resizing
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Main animation tick for the 3D scene
   * @param {number} carbonScore - Current carbon score to drive animations
   */
  animate(carbonScore) {
    this.cityGenerator.animate(carbonScore);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
