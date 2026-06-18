import * as THREE from 'three';

/**
 * CityGenerator - Procedurally generates and manages the 3D City representation
 * of the user's environmental digital twin.
 */
export class CityGenerator {
  constructor(scene) {
    this.scene = scene;
    
    // Grid settings
    this.gridSize = 9; // 9x9 cells
    this.cellSize = 6; // each cell is 6x6 units
    this.halfSize = (this.gridSize * this.cellSize) / 2;

    // Object tracking lists
    this.buildings = [];
    this.trees = [];
    this.windmills = [];
    this.chimneys = []; // Chimney positions for particle emitter
    this.waterMesh = null;
    this.groundMesh = null;
    
    // Particle system for smoke/smog
    this.smokeParticles = null;
    this.smokeGeometry = null;
    this.smokeData = []; // Array of { position, velocity, age, maxAge }
    this.maxSmokeCount = 120;

    // Window textures
    this.cleanWindowTexture = this.createWindowTexture(true);
    this.dirtyWindowTexture = this.createWindowTexture(false);
  }

  /**
   * Procedurally generates a window texture using HTML5 Canvas
   */
  createWindowTexture(isClean) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Building facade background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw windows
    const cols = 4;
    const rows = 12;
    const winWidth = 16;
    const winHeight = 12;
    const gapX = (canvas.width - (cols * winWidth)) / (cols + 1);
    const gapY = (canvas.height - (rows * winHeight)) / (rows + 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = gapX + c * (winWidth + gapX);
        const y = gapY + r * (winHeight + gapY);

        if (isClean) {
          // Clean/Green state: Warm yellow or soft cyan glow
          ctx.fillStyle = Math.random() > 0.15 ? '#fef08a' : '#38bdf8';
        } else {
          // Dirty/High-carbon state: Dim yellow, dead windows, or orange-red alert
          const rand = Math.random();
          if (rand > 0.6) {
            ctx.fillStyle = '#ea580c'; // eerie orange alert
          } else if (rand > 0.4) {
            ctx.fillStyle = '#475569'; // dead/dark window
          } else {
            ctx.fillStyle = '#f59e0b'; // dim yellow
          }
        }
        ctx.fillRect(x, y, winWidth, winHeight);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  /**
   * Initializes and builds the city scene
   */
  buildCity() {
    this.clearCity();
    
    // 1. Create main ground terrain
    this.buildGround();

    // 2. Create River (Water) along East Edge (gridX = 3 & 4)
    this.buildRiver();

    // 3. Grid traversal for city objects
    const halfGrid = Math.floor(this.gridSize / 2);
    
    for (let gx = -halfGrid; gx <= halfGrid; gx++) {
      for (let gz = -halfGrid; gz <= halfGrid; gz++) {
        // Calculate world coordinates
        const x = gx * this.cellSize;
        const z = gz * this.cellSize;

        // Skip river area (gx >= 3)
        if (gx >= 3) continue;

        // Define roads (gx == 0 or gz == 0)
        const isRoad = (gx === 0 || gz === 0);
        if (isRoad) {
          this.buildRoadSegment(x, z);
          continue;
        }

        // Special zone allocation
        const isWindmillPark = (gx === -4 && (gz === 3 || gz === -3));
        const isIndustrialZone = (gz === -4 && (gx === -3 || gx === -2));
        const isNormalPark = ((gx + gz) % 3 === 0);

        if (isWindmillPark) {
          this.buildWindmill(x, z);
        } else if (isIndustrialZone) {
          this.buildBuilding(x, z, true, Math.abs(gx * gz)); // Industrial building with smokestacks
        } else if (isNormalPark) {
          this.buildPark(x, z);
        } else {
          this.buildBuilding(x, z, false, Math.abs(gx + gz)); // Standard commercial/residential building
        }
      }
    }

    // 4. Setup Smoke Particle System
    this.buildSmokeParticleSystem();
  }

  /**
   * Build ground plane with soft stylized segments
   */
  buildGround() {
    // Large ground area
    const groundGeo = new THREE.PlaneGeometry(this.halfSize * 2, this.halfSize * 2, 8, 8);
    
    // Material starting with neutral green-grey
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // clean green
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -0.02; // slightly below 0
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  /**
   * Build water river along the east side of the city
   */
  buildRiver() {
    const width = this.cellSize * 2;
    const height = this.halfSize * 2;
    const riverGeo = new THREE.PlaneGeometry(width, height);
    
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, // clean sky blue water
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });

    this.waterMesh = new THREE.Mesh(riverGeo, riverMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(this.halfSize - width / 2, -0.01, 0);
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }

  /**
   * Build road segment (purely visual grey plate)
   */
  buildRoadSegment(x, z) {
    const roadGeo = new THREE.PlaneGeometry(this.cellSize, this.cellSize);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // dark slate
      roughness: 0.9,
      metalness: 0.1
    });

    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.005, z);
    road.receiveShadow = true;
    this.scene.add(road);
  }

  /**
   * Build a procedural building (low poly style)
   */
  buildBuilding(x, z, isIndustrial, seed) {
    // Heights are taller towards the center (0,0)
    const distFromCenter = Math.sqrt(x*x + z*z);
    const baseHeight = Math.max(2, 12 - distFromCenter * 0.4);
    const height = baseHeight + (seed % 3) * 2;
    const width = 2.5 + (seed % 2) * 0.8;
    const depth = 2.5 + (seed % 3) * 0.5;

    // Building body
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    
    // Choose texture based on nature of building
    const mapTexture = isIndustrial ? null : this.cleanWindowTexture;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: isIndustrial ? 0x64748b : 0xf1f5f9, // slate grey for factories, light white/beige for standard
      roughness: 0.5,
      metalness: 0.2,
      map: mapTexture,
      emissiveMap: mapTexture,
      emissive: isIndustrial ? 0x000000 : 0xfef08a,
      emissiveIntensity: isIndustrial ? 0 : 0.3
    });

    // Make texture repeat properly on sides of the box
    if (mapTexture) {
      // Repeat texture coordinate slightly based on dimensions
      const textureClone = mapTexture.clone();
      textureClone.repeat.set(1, Math.max(1, Math.floor(height / 3)));
      bodyMat.map = textureClone;
      bodyMat.emissiveMap = textureClone;
      bodyMat.needsUpdate = true;
    }

    const building = new THREE.Mesh(bodyGeo, bodyMat);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);

    // Track building metadata
    this.buildings.push({
      mesh: building,
      material: bodyMat,
      isIndustrial,
      baseColor: isIndustrial ? new THREE.Color(0x64748b) : new THREE.Color(0xf1f5f9),
      height
    });

    // If industrial, add chimney/smokestacks on top
    if (isIndustrial) {
      const chimneyHeight = 2;
      const chimneyGeo = new THREE.CylinderGeometry(0.3, 0.4, chimneyHeight, 8);
      const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
      
      const chimneyX = x - width/4;
      const chimneyZ = z - depth/4;
      const chimneyY = height + chimneyHeight/2;

      const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
      chimney.position.set(chimneyX, chimneyY, chimneyZ);
      chimney.castShadow = true;
      this.scene.add(chimney);
      
      // Store chimney top coordinates for particles
      this.chimneys.push({
        x: chimneyX,
        y: height + chimneyHeight,
        z: chimneyZ
      });
    }
  }

  /**
   * Build a park cell containing a grass base and several trees
   */
  buildPark(x, z) {
    // 1. Grass plane slightly raised
    const grassGeo = new THREE.BoxGeometry(this.cellSize - 0.2, 0.1, this.cellSize - 0.2);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // bright green
      roughness: 0.9,
      metalness: 0.0
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.set(x, 0.05, z);
    grass.receiveShadow = true;
    this.scene.add(grass);

    // Track grass as part of trees to update its color together
    this.trees.push({
      mesh: grass,
      material: grassMat,
      baseColor: new THREE.Color(0x10b981),
      isGrass: true
    });

    // 2. Add random trees (3 to 5 per park)
    const treeCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < treeCount; i++) {
      // Offset position inside cell
      const offsetX = (Math.random() - 0.5) * (this.cellSize - 2);
      const offsetZ = (Math.random() - 0.5) * (this.cellSize - 2);
      
      this.buildTree(x + offsetX, z + offsetZ);
    }
  }

  /**
   * Build a single procedural low-poly tree
   */
  buildTree(x, z) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);

    // Tree trunk (Cylinder)
    const trunkHeight = 1 + Math.random() * 0.8;
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, trunkHeight, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }); // wood brown
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Foliage (Icosahedron for clean flat-shaded look)
    const foliageSize = 0.7 + Math.random() * 0.5;
    const foliageGeo = new THREE.IcosahedronGeometry(foliageSize, 1);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // deep green
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = trunkHeight + foliageSize * 0.7;
    foliage.castShadow = true;
    treeGroup.add(foliage);

    this.scene.add(treeGroup);

    this.trees.push({
      mesh: treeGroup,
      foliageMesh: foliage,
      foliageMaterial: foliageMat,
      baseFoliageColor: new THREE.Color(0x059669),
      isGrass: false,
      foliageScale: 1.0,
      targetY: foliage.position.y
    });
  }

  /**
   * Build a clean energy wind turbine
   */
  buildWindmill(x, z) {
    const windmillGroup = new THREE.Group();
    windmillGroup.position.set(x, 0, z);

    // Tower base (Cylinder)
    const towerHeight = 6 + Math.random() * 2;
    const towerGeo = new THREE.CylinderGeometry(0.15, 0.3, towerHeight, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = towerHeight / 2;
    tower.castShadow = true;
    windmillGroup.add(tower);

    // Hub (Sphere)
    const hubGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.set(0, towerHeight, 0.3);
    windmillGroup.add(hub);

    // Rotor group containing blades (to rotate together)
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, towerHeight, 0.45);
    
    // Blades (3 thin Boxes rotated 120deg apart)
    const bladeLength = 2.8;
    const bladeGeo = new THREE.BoxGeometry(0.2, bladeLength, 0.05);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

    for (let i = 0; i < 3; i++) {
      const bladePivot = new THREE.Group();
      bladePivot.rotation.z = (i * Math.PI * 2) / 3;
      
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      // Offset so the blade extends outwards from the center hub
      blade.position.y = bladeLength / 2;
      blade.castShadow = true;
      bladePivot.add(blade);
      
      rotorGroup.add(bladePivot);
    }
    
    windmillGroup.add(rotorGroup);
    this.scene.add(windmillGroup);

    this.windmills.push({
      group: windmillGroup,
      rotor: rotorGroup,
      baseSpeed: 0.02 + Math.random() * 0.015,
      currentSpeed: 0.02,
      active: true
    });
  }

  /**
   * Initialize smoke particles emitted from industrial chimneys
   */
  buildSmokeParticleSystem() {
    this.smokeGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxSmokeCount * 3);
    const colors = new Float32Array(this.maxSmokeCount * 3);
    const sizes = new Float32Array(this.maxSmokeCount);

    // Initialize all off-screen/dead
    for (let i = 0; i < this.maxSmokeCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -1000;
      positions[i * 3 + 2] = 0;

      colors[i * 3] = 0.3;
      colors[i * 3 + 1] = 0.3;
      colors[i * 3 + 2] = 0.3;

      sizes[i] = 0.0;
      
      this.smokeData.push({
        position: new THREE.Vector3(0, -1000, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        age: 0,
        maxAge: 0,
        active: false
      });
    }

    this.smokeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.smokeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create a particle material using a circular point style
    const pMaterial = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.smokeParticles = new THREE.Points(this.smokeGeometry, pMaterial);
    this.scene.add(this.smokeParticles);
  }

  /**
   * Emits a single smoke particle from one of the active chimneys
   */
  emitSmokeParticle(chimneyPos) {
    // Find an inactive particle
    const p = this.smokeData.find(part => !part.active);
    if (!p) return; // all active

    p.active = true;
    p.age = 0;
    p.maxAge = 60 + Math.random() * 60; // lifetime in frames
    p.position.set(
      chimneyPos.x + (Math.random() - 0.5) * 0.2,
      chimneyPos.y,
      chimneyPos.z + (Math.random() - 0.5) * 0.2
    );
    // Rising velocity with slight wind offset
    p.velocity.set(
      (Math.random() - 0.5) * 0.02,
      0.03 + Math.random() * 0.02,
      (Math.random() - 0.5) * 0.02
    );
  }

  /**
   * Update particle positions and fade them out
   */
  updateParticles(carbonScore) {
    if (!this.smokeParticles || this.chimneys.length === 0) return;

    // Emit particles rate based on carbon score
    // Only emit if carbon score is significant (>30)
    if (carbonScore > 30 && Math.random() < (carbonScore - 30) / 100) {
      // Emit from a random chimney
      const rChimney = this.chimneys[Math.floor(Math.random() * this.chimneys.length)];
      this.emitSmokeParticle(rChimney);
    }

    const positions = this.smokeGeometry.attributes.position.array;
    const colors = this.smokeGeometry.attributes.color.array;

    for (let i = 0; i < this.maxSmokeCount; i++) {
      const p = this.smokeData[i];

      if (p.active) {
        p.age++;
        
        // Physics update
        p.position.add(p.velocity);
        // Slowly drift to the side (simulating wind)
        p.velocity.x += 0.0005; 
        
        // Update positions array
        positions[i * 3] = p.position.x;
        positions[i * 3 + 1] = p.position.y;
        positions[i * 3 + 2] = p.position.z;

        // Fade out color and change to soot dark grey
        const lifeRatio = p.age / p.maxAge;
        const colorVal = 0.1 + (0.3 * lifeRatio); // gets lighter/fades to grey dust
        colors[i * 3] = colorVal;
        colors[i * 3 + 1] = colorVal;
        colors[i * 3 + 2] = colorVal;

        if (p.age >= p.maxAge) {
          p.active = false;
          p.position.set(0, -1000, 0); // move off-screen
          positions[i * 3] = 0;
          positions[i * 3 + 1] = -1000;
          positions[i * 3 + 2] = 0;
        }
      }
    }

    this.smokeGeometry.attributes.position.needsUpdate = true;
    this.smokeGeometry.attributes.color.needsUpdate = true;
  }

  /**
   * Animation update for moving components
   */
  animate(carbonScore) {
    // 1. Spin windmills
    this.windmills.forEach(w => {
      // Windmills spin slower or stop completely in polluted settings
      const targetSpeed = w.active ? w.baseSpeed * Math.max(0, 1 - (carbonScore - 20) / 80) : 0;
      w.currentSpeed += (targetSpeed - w.currentSpeed) * 0.05; // smooth speed change
      w.rotor.rotation.z += w.currentSpeed;
    });

    // 2. Update factory smoke particles
    this.updateParticles(carbonScore);
  }

  /**
   * Dynamically updates the city visual state according to environmental variables
   */
  updateCityState(carbonScore, envVars) {
    // envVars contains: heatIndex, vegetationLoss, airQualityLoss, waterQualityLoss
    
    // 1. Update Ground Color: transitions from lush green to barren brown/grey
    if (this.groundMesh) {
      // Healthy green: 0x10b981. Barren dried ground: 0x783a0f / 0x4b3525
      const greenColor = new THREE.Color(0x10b981);
      const deadColor = new THREE.Color(0x4b3525);
      
      const t = Math.min(1.0, envVars.heatIndex / 50.0); // max heat index is 50
      this.groundMesh.material.color.copy(greenColor).lerp(deadColor, t);
    }

    // 2. Update River Water Color: clean cyan to murky toxic brown/green
    if (this.waterMesh) {
      const cleanWater = new THREE.Color(0x0ea5e9);
      const dirtyWater = new THREE.Color(0x5a4a3a); // murky brown
      const toxicWater = new THREE.Color(0x155e3b); // murky green
      
      const t = Math.min(1.0, envVars.waterQualityLoss / 10.0); // max loss is 10
      const targetWaterColor = cleanWater.clone().lerp(dirtyWater, t);
      
      this.waterMesh.material.color.copy(targetWaterColor);
      // Make water less transparent as it gets dirtier
      this.waterMesh.material.opacity = 0.85 - (t * 0.15);
    }

    // 3. Update Trees (Vegetation loss)
    // VegetationLoss ranges 0 - 25.
    // At max vegetationLoss (25), remaining green cover = 0%.
    const maxLoss = 25;
    const lossRatio = Math.min(1.0, envVars.vegetationLoss / maxLoss);
    
    this.trees.forEach((tree, index) => {
      if (tree.isGrass) {
        // Grass base in parks gets dry/barren too
        const healthyGrass = tree.baseColor;
        const dryGrass = new THREE.Color(0x783a0f);
        tree.material.color.copy(healthyGrass).lerp(dryGrass, lossRatio);
      } else {
        // Individual trees wither and disappear
        // Determine if this tree is cut down/dead based on its grid position
        // We deterministic-ally hide trees based on their index
        const treeThreshold = 1.0 - lossRatio;
        // Check index against threshold
        const treeSeed = (index * 7919) % 1000 / 1000;
        
        if (treeSeed > treeThreshold) {
          // Tree is completely lost (shrink scale to 0)
          tree.foliageScale += (0.0 - tree.foliageScale) * 0.1;
        } else {
          // Tree is still standing, but leaf colors change to brown/decayed
          tree.foliageScale += (1.0 - tree.foliageScale) * 0.1;
          const healthyLeaves = tree.baseFoliageColor;
          const deadLeaves = new THREE.Color(0x78350f);
          tree.foliageMaterial.color.copy(healthyLeaves).lerp(deadLeaves, lossRatio);
        }

        // Apply scaling
        tree.mesh.scale.set(tree.foliageScale, tree.foliageScale, tree.foliageScale);
        
        // Lower group position if cut down/shrunk, to sit nicely on the ground
        tree.mesh.position.y = (tree.foliageScale - 1) * 0.1;
      }
    });

    // 4. Update Buildings: window lighting and glass facade cleanliness
    // High carbon score = dim window illumination and dirty facade
    const tClean = Math.max(0.0, 1.0 - carbonScore / 100.0);
    this.buildings.forEach(building => {
      if (!building.isIndustrial) {
        // Lerp base color to look dusty/industrialized
        const cleanFacade = building.baseColor;
        const dirtyFacade = new THREE.Color(0x334155); // dark soot
        building.material.color.copy(cleanFacade).lerp(dirtyFacade, carbonScore / 130);
        
        // Emissive lights dimmer as score rises (power grids struggling / toxic environment)
        building.material.emissiveIntensity = 0.45 * tClean + 0.05;

        // Change texture to dirtier windows at higher carbon
        if (carbonScore > 50) {
          building.material.map = this.dirtyWindowTexture;
          building.material.emissiveMap = this.dirtyWindowTexture;
        } else {
          building.material.map = this.cleanWindowTexture;
          building.material.emissiveMap = this.cleanWindowTexture;
        }
      } else {
        // Industrial buildings get darker soot colors
        const cleanFactory = building.baseColor;
        const dirtyFactory = new THREE.Color(0x1e293b);
        building.material.color.copy(cleanFactory).lerp(dirtyFactory, carbonScore / 100);
      }
    });

    // 5. Update Windmills
    this.windmills.forEach(w => {
      // If carbon score is high, windmills are inactive (not used in high-carbon grid)
      w.active = carbonScore < 60;
    });
  }

  /**
   * Completely clean up all city geometries and materials from the scene
   */
  clearCity() {
    // Remove mesh objects
    this.buildings.forEach(b => {
      this.scene.remove(b.mesh);
      b.mesh.geometry.dispose();
      b.material.dispose();
    });
    this.buildings = [];

    this.trees.forEach(t => {
      this.scene.remove(t.mesh);
      t.mesh.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    });
    this.trees = [];

    this.windmills.forEach(w => {
      this.scene.remove(w.group);
      w.group.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    });
    this.windmills = [];
    this.chimneys = [];

    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh.material.dispose();
      this.waterMesh = null;
    }

    if (this.groundMesh) {
      this.scene.remove(this.groundMesh);
      this.groundMesh.geometry.dispose();
      this.groundMesh.material.dispose();
      this.groundMesh = null;
    }

    if (this.smokeParticles) {
      this.scene.remove(this.smokeParticles);
      this.smokeGeometry.dispose();
      this.smokeParticles.material.dispose();
      this.smokeParticles = null;
      this.smokeGeometry = null;
      this.smokeData = [];
    }
  }
}
