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

	registerSceneObj(entityId, obj) {
		this.entitySceneObjects[entityId] = obj;
	}

	deregisterSceneObj(entityId) {
		delete this.entitySceneObjects[entityId];
	}

	findRegisteredSceneObj(entityId) {
		return this.entitySceneObjects[entityId];
	}

	findRegisteredSceneObjEntityId(uuid) {
		const foundEntityId = Object.keys(this.entitySceneObjects).find((entityId) => {
			const obj = this.entitySceneObjects[entityId];
			return (obj.uuid === uuid);
		});
		return foundEntityId;
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
		this.terrainGroup = new Group();
		this.worldGroup.add(this.terrainGroup);
		this.scene.add(this.worldGroup);
		this.camera = this.makeCamera(cameraCoords);
		this.camera.lookAt(new Vector3(0, 0, 0));
		this.makeLight();
		this.entitySceneObjects = {};
		const axesHelper = new THREE.AxesHelper(5);
		this.scene.add(axesHelper);
		return this;
	}

	updateToGoals(t) {
		const q = 1.0 - (0.24 ** t); // This q & lerp logic is from simondev
		// To lerp:
		// obj.position.lerp(goalPos, q);
		// To do it instantly:
		// obj.position.copy(goalPos);

		// this.camera.rotation.setFromVector3(this.worldRotationGoal);
	}

	updateCamera(positionGoal, rotationGoal, focusGoal = new Vector3()) {
		if (positionGoal) {
			this.camera.position.copy(DinoScene.convertCoordsToVector3(positionGoal));
		}
		this.camera.rotation.setFromVector3(rotationGoal, 'ZXY');
		// this.camera.lookAt(focusGoal);
	}

	removeObject(obj) {
		const { uuid } = obj;
		const entityId = this.findRegisteredSceneObjEntityId(uuid);
		this.deregisterSceneObj(entityId);
		obj.removeFromParent();
		console.log('removing object', entityId, uuid);
	}

	update(options = {}, t = 5) { // time `t` is in milliseconds
		// console.log(t);
		const {
			cameraPosition, cameraRotationGoalArray, worldCoords, entities, terrainChunks,
			clearColor,
		} = options;
		if (clearColor && clearColor !== this.clearColor) {
			this.clearColor = (clearColor instanceof Array)
				? new THREE.Color(...clearColor) : new THREE.Color(clearColor);
			this.renderer.setClearColor(this.clearColor);
		}
		if (cameraPosition || cameraRotationGoalArray) {
			const [x = 0, y = 0, z = 0] = cameraRotationGoalArray;
			this.updateCamera(
				DinoScene.convertCoordsToVector3(cameraPosition),
				(new Vector3(x, y, z)),
			);
			// this.camera.position.copy(DinoScene.convertCoordsToVector3(cameraPosition));
			// this.camera.lookAt(new Vector3());
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
			const visibleTerrainUuids = [];
			terrainChunks.forEach((chunk) => {
				let sceneObj = this.entitySceneObjects[chunk.entityId];
				if (sceneObj) {
					this.applyTextureImageToObject(sceneObj, chunk.textureImage);
				} else {
					console.log('Adding terrain for chunk', chunk);
					sceneObj = this.addNewTerrainChunkPlane(chunk);
				}
				visibleTerrainUuids.push(sceneObj.uuid);
			});
			// Loop over terrain objects (children of terrainGroup)
			// and remove any not visible
			this.terrainGroup.children.forEach((terrainChild) => {
				if (!visibleTerrainUuids.includes(terrainChild.uuid)) {
					this.removeObject(terrainChild);
				}
			});
		}
		this.updateToGoals(t);
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

	// async addNewTerrainByHeightMap(heightMapImageSrc) {
	// 	const heightMap = await DinoScene.loadTexture(heightMapImageSrc);
	// 	const terrain = this.makeTerrain(heightMap);
	// 	window.terrain = terrain;
	// 	this.chunkTerrains.push(terrain);
	// 	this.worldGroup.add(terrain); // add the terrain to the scene
	// }

	applyTextureImageToObject(obj, textureImage) {
		if (!textureImage.complete) {
			console.warn('Cannot apply texture because image is not complete yet');
		}
		return; // FIXME: short-cutting this because it's not working
		const texture = new THREE.Texture(textureImage);
		texture.type = THREE.RGBAFormat;
		// console.log(texture, textureImage);
		// new THREE.Texture(terrainChunk.image, {}, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter, THREE.RGBAFormat, THREE.UnsignedByteType, 0);
		const { material } = obj;
		material.map = texture;
		material.needsUpdate = true;
	}

	applyHeightsToGeometry(geometry, heights, dataSize) {
		const { position } = geometry.attributes;
		const vertices = position.array;
		const heightMultiplier = 1;
		// console.log(vertices.length, position.count, 'dataSize', dataSize, 'dataSize^2', dataSize * dataSize, 'height length', heights.length, heights);
		const heightsSize = heights.length;
		// for (let i = 0, j = 0, l = vertices.length; i < l; i += 1, j += 3) {
		for (let i = 0; i < position.count; i += 1) {
			// h = (Math.random() * 100));
			const y = Math.floor(i / heightsSize);
			const x = i % heightsSize;
			// const x = position.getX(i);
			// const y = position.getY(i);
			// const x = position.getX(i);
			// const y = position.getY(i);
			if (!heights[y]) {
				console.warn('No heights[y]', i, x, y, 'heightsSize', heightsSize);
				continue;
			}
			const h = heights[y][x] * heightMultiplier;
			// console.log(x, y, h);
			position.setZ(i, h);
			// {
			// 	const x = position.getX(i);
			// 	const y = position.getY(i);
			// 	position.setXYZ(i, x, y, h);
			// }
			// vertices[j + 1] = h;
		}
		position.needsUpdate = true;
	}

	makeTerrainChunkPlane(terrainChunk = {}) {
		// const texture = new THREE.TextureLoader().load('images/test-grid.jpg');
		const { heights, segments, size, vertexDataSize, center,
			color = 0x55ffbb,
		} = terrainChunk;
		// const segments = 8;
		console.log(segments);
		const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

		// Option 1 -- a heightmap -- but it appears to be blank

		// const heightMap = new THREE.Texture(terrainChunk.image, {}, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter, THREE.RGBAFormat, THREE.UnsignedByteType, 0);
		// heightMap.needsUpdate = true;
		// console.log(terrainChunk.image.complete);

		// other attempts:
		// const heightMap = new THREE.Texture(terrainChunk.image);
		// heightMap.image = terrainChunk.image;
		// heightMap.type = THREE.RGBAFormat;
		// heightMap.format = THREE.UnsignedByteType;

		// Option 2 -- This has not worked

		this.applyHeightsToGeometry(geometry, heights, vertexDataSize);

		// Not sure if this is needed:
		// heightMap.wrapS = THREE.RepeatWrapping;
		// heightMap.wrapT = THREE.RepeatWrapping;

		const material = new THREE.MeshStandardMaterial({
			// opacity: 0.9,
			color,
			// map: texture,
			// vertexColors: true,
			// wireframe: true,
			side: THREE.DoubleSide,
			// Option 1
			// displacementMap: heightMap,
			// displacementScale: 500,
			flatShading: true,
		});

		// create the mesh for the terrain
		const terrain = new THREE.Mesh(geometry, material);

		{
			const [x = 0, y = 0, z = 0] = center;
			terrain.position.x = x;
			terrain.position.y = y;
			terrain.position.z = z;
		}

		// rotate the terrain to make it look like hills and valleys
		// terrain.rotation.x = -Math.PI / 2;
		return terrain;
	}

	addNewTerrainChunkPlane(terrainChunk) {
		const terrain = this.makeTerrainChunkPlane(terrainChunk);
		this.chunkTerrains.push(terrain);
		this.terrainGroup.add(terrain); // add the terrain to the scene
		this.entitySceneObjects[terrainChunk.entityId] = terrain;
		return terrain;
	}

	addNewWorldEntity(entity) {
		const box = this.makeBox();
		box.position.copy(this.convertCoordsToVector3(entity.coords));
		this.worldGroup.add(box);
		this.entitySceneObjects[entity.entityId] = box;
	}
}

export default DinoScene;
