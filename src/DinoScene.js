import * as THREE from 'three';
import { Vector3, Group, Scene, PerspectiveCamera } from 'three';
import Renderer from 'rocket-boots-three-toolbox/src/Renderer.js';
// import noise from 'noise-esm';

class DinoScene {
	constructor() {
		// Settings
		this.gridConversion = [1, 1, -1];
		this.coordsConversion = [1, 1, 1];
		this.gridSquareSize = 20;
		this.clearColor = '#344';
		this.fov = 75;
		this.eyeLightColor = 0xffffff;
		this.eyeLightIntensity = 0.9;
		this.eyeLightDistance = 100;
		this.chunkSize = 128; // In grid units
		this.terrainSegments = 256;
		// Instantiated things
		this.eyeLight = null;
		this.scene = null;
		this.renderer = null;
		this.autoFacingObjects = [];
		this.camera = null;
		this.worldGroup = null;
		this.entitySceneObjects = {}; // keyed by the entity's unique entityId
		this.chunkTerrains = [];
	}

	// convertGridToRenderingVector3(gridCoords) {
	// 	const [x = 0, y = 0, z = 0] = gridCoords;
	// 	const [convX, convY, convZ] = this.gridConversion;
	// 	return new Vector3(
	// 		x * this.gridSquareSize * convX,
	// 		y * this.gridSquareSize * convY,
	// 		z * this.gridSquareSize * convZ,
	// 	);
	// }

	static convertCoordsToVector3(coords) {
		const [x = 0, y = 0, z = 0] = coords;
		return new Vector3(x, y, z);
	}

	convertCoordsToVector3(coords) {
		const [x = 0, y = 0, z = 0] = coords;
		const [convX, convY, convZ] = this.coordsConversion;
		return new Vector3(x * convX, y * convY, z * convZ);
	}

	makeCamera([x = 0, y = 0, z = 0] = []) {
		const aspect = window.innerWidth / window.innerHeight;
		const camera = new PerspectiveCamera(this.fov, aspect, 0.1, 100000);
		camera.position.x = x;
		camera.position.y = y;
		camera.position.z = z;
		return camera;
	}

	makeLight() {
		const color = 0xFFFFFF;
		const intensity = 0.05;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(0, 100, 40);
		light.lookAt(new Vector3());
		this.scene.add(light);

		// const { eyeLightColor, eyeLightIntensity, eyeLightDistance } = this;
		// this.eyeLight = new THREE.PointLight(eyeLightColor, eyeLightIntensity, eyeLightDistance);
		// this.scene.add(this.eyeLight);

		const pointLight = new THREE.PointLight(0xffffff, 0.25, 1000);
		pointLight.position.set(0, 0, 100);
		// pointLight.lookAt(new Vector3());
		this.scene.add(pointLight);

		const ambientLight = new THREE.AmbientLight(0x404040, 0.75);
		this.scene.add(ambientLight);

		// const sphereSize = 1;
		// const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
		// this.scene.add(pointLightHelper);
	}

	setupRenderer() {
		this.renderer = new Renderer();
		this.renderer.setClearColor(this.clearColor);
	}

	setup(cameraCoords) {
		if (!this.renderer) this.setupRenderer();
		this.scene = new Scene();
		this.worldGroup = new Group();
		this.scene.add(this.worldGroup);
		this.camera = this.makeCamera(cameraCoords);
		this.camera.lookAt(new Vector3(0, 0, 0));
		this.makeLight();
		this.entitySceneObjects = {};
		const axesHelper = new THREE.AxesHelper(5);
		this.scene.add(axesHelper);
		return this;
	}

	update(options = {}) {
		const { cameraPosition, cameraRotation, worldCoords, entities, terrainChunks } = options;
		if (cameraPosition) {
			this.camera.position.copy(DinoScene.convertCoordsToVector3(cameraPosition));
			this.camera.lookAt(new Vector3());
		}
		if (cameraRotation) {
			// this.camera.rotation.copy(DinoScene.convertCoordsToVector3(cameraPosition));
			this.camera.lookAt(new Vector3());
		}
		if (worldCoords) {
			this.worldGroup.position.copy(DinoScene.convertCoordsToVector3(worldCoords));
		}
		if (entities) {
			entities.forEach((entity) => {
				const sceneObj = this.entitySceneObjects[entity.entityId];
				if (sceneObj) {
					sceneObj.position.copy(DinoScene.convertCoordsToVector3(entity.coords));
					sceneObj.rotation.set(0, 0, -entity.facing);
					// TODO: see if position or anything else has changed
				} else {
					this.addNewWorldEntity(entity);
				}
			});
		}
		if (terrainChunks) {
			terrainChunks.forEach((chunk) => {
				const sceneObj = this.entitySceneObjects[chunk.entityId];
				if (sceneObj) {
					//
				} else {
					this.addNewTerrainChunkPlane(chunk);
				}
			});
		}
		return this;
	}

	render() {
		this.autoFacingObjects.forEach((obj) => {
			obj.quaternion.copy(this.camera.quaternion);
		});
		this.renderer.render(this.scene, this.camera);
		return this;
	}

	static loadTexture(src) {
		const loader = new THREE.TextureLoader().setPath('images/');
		return new Promise((resolve, reject) => {
			loader.load(src, resolve, null, reject);
		});
	}

	makeBox() {
		const box = new THREE.BoxGeometry(10, 20, 10);
		const material = new THREE.MeshToonMaterial({
			color: 0xff0000, // flatShading: true
		});
		const boxMesh = new THREE.Mesh(box, material);
		return boxMesh;
	}

	async addNewTerrainByHeightMap(heightMapImageSrc) {
		const heightMap = await DinoScene.loadTexture(heightMapImageSrc);
		const terrain = this.makeTerrain(heightMap);
		window.terrain = terrain;
		this.chunkTerrains.push(terrain);
		this.worldGroup.add(terrain); // add the terrain to the scene
	}

	applyHeightsToGeometry(geometry, heights, size) {
		const { position } = geometry.attributes;
		// let h = 0;
		for (let i = 0; i < position.count; i += 1) {
			// h = ((h * 2) + (Math.random() * 100)) / 3;
			const y = Math.floor(i / size);
			const x = i % size;
			// const x = position.getX(i);
			// const y = position.getY(i);
			if (!heights[y]) {
				console.warn('No heights[y]', i, x, y, 'size', size);
				continue;
			}
			const h = heights[y][x];
			position.setZ(i, h);
		}
		position.needsUpdate = true;
	}

	makeTerrainChunkPlane(terrainChunk = {}) {
		const texture = new THREE.TextureLoader().load('images/test-grid.jpg');
		const { heights, segments, size } = terrainChunk;
		const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

		// Option 1 -- a heightmap -- but it appears to be blank

		// const heightMap = new THREE.Texture(terrainChunk.image);
		// const heightMap = new THREE.Texture(terrainChunk.image, {}, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter, THREE.RGBAFormat, THREE.UnsignedByteType, 0);
		// heightMap.image = terrainChunk.image;
		// heightMap.needsUpdate = true;
		// heightMap.type = THREE.RGBAFormat;
		// heightMap.format = THREE.UnsignedByteType;

		// Option 2 -- This has not worked

		this.applyHeightsToGeometry(geometry, heights, segments);

		// Not sure if this is needed:
		// heightMap.wrapS = THREE.RepeatWrapping;
		// heightMap.wrapT = THREE.RepeatWrapping;

		const material = new THREE.MeshStandardMaterial({
			opacity: 0.9,
			color: 0x55ffbb,
			map: texture,
			// vertexColors: true,
			// wireframe: true,
			side: THREE.DoubleSide,
			// Option 1
			// displacementMap: heightMap,
			// displacementScale: 300,
			flatShading: true,
		});

		// create the mesh for the terrain
		const terrain = new THREE.Mesh(geometry, material);

		terrain.position.x = 0;
		terrain.position.y = 0;
		terrain.position.z = 0;

		// rotate the terrain to make it look like hills and valleys
		// terrain.rotation.x = -Math.PI / 2;
		return terrain;
	}

	addNewTerrainChunkPlane(terrainChunk) {
		const terrain = this.makeTerrainChunkPlane(terrainChunk);
		this.chunkTerrains.push(terrain);
		this.worldGroup.add(terrain); // add the terrain to the scene
		this.entitySceneObjects[terrainChunk.entityId] = terrain;
	}

	addNewWorldEntity(entity) {
		const box = this.makeBox();
		box.position.copy(this.convertCoordsToVector3(entity.coords));
		this.worldGroup.add(box);
		this.entitySceneObjects[entity.entityId] = box;
	}
}

export default DinoScene;
