import * as THREE from 'three';
import { Object3D, Vector3, Group, Scene, PerspectiveCamera } from 'three';
import Renderer from 'rocket-boots-three-toolbox/src/Renderer.js';
import noise from './perlinNoise.js';

class DinoScene {
	constructor() {
		// Settings
		this.gridConversion = [1, 1, -1];
		this.gridSquareSize = 20;
		this.clearColor = '#344';
		this.fov = 75;
		this.eyeLightColor = 0xffffff;
		this.eyeLightIntensity = 0.9;
		this.eyeLightDistance = 100;
		// Instantiated things
		this.eyeLight = null;
		this.scene = null;
		this.renderer = null;
		this.autoFacingObjects = [];
		this.camera = null;
		this.sceneObjects = {}; // keyed by the things' unique id
	}

	convertGridToRenderingVector3(gridCoords) {
		const [x = 0, y = 0, z = 0] = gridCoords;
		const [convX, convY, convZ] = this.gridConversion;
		return new Vector3(
			x * this.gridSquareSize * convX,
			y * this.gridSquareSize * convY,
			z * this.gridSquareSize * convZ,
		);
	}

	makeCamera([x = 0, y = 0, z = 0] = []) {
		const aspect = window.innerWidth / window.innerHeight;
		const camera = new PerspectiveCamera(this.fov, aspect, 0.1, 1000);
		camera.position.x = x;
		camera.position.y = y;
		camera.position.z = z;
		return camera;
	}

	makeLight() {
		// const color = 0xFFFFFF;
		// const intensity = .005;
		// const light = new THREE.DirectionalLight(color, intensity);
		// light.position.set(-1, 2, 4);
		// grid.scene.add(light);
		const { eyeLightColor, eyeLightIntensity, eyeLightDistance } = this;
		this.eyeLight = new THREE.PointLight(eyeLightColor, eyeLightIntensity, eyeLightDistance);
		this.scene.add(this.eyeLight);

		// const pointLight = new THREE.PointLight(0xffffff, 0.15, 1000);
		// pointLight.position.set(-100, -100, -100);
		// this.scene.add(pointLight);

		const ambientLight = new THREE.AmbientLight(0x404040, 0.25);
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
		this.camera = this.makeCamera(cameraCoords);
		this.camera.lookAt(new Vector3(0, 0, 0));
		this.makeLight();
		this.sceneObjects = {};
	}

	render() {
		this.autoFacingObjects.forEach((obj) => {
			obj.quaternion.copy(this.camera.quaternion);
		});
		this.renderer.render(this.scene, this.camera);
	}

	static loadTexture(src) {
		const loader = new THREE.TextureLoader().setPath('images/');
		return new Promise((resolve, reject) => {
			loader.load(src, resolve, null, reject);
		});
	}

	addBox() {
		const box = new THREE.BoxGeometry(10, 10, 10);
		const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
		const boxMesh = new THREE.Mesh(box, material);
		this.scene.add(boxMesh);
	}

	static makeTerrain(heightMap) {
		const geometry = new THREE.PlaneGeometry(1000, 1000, 256, 256);
		// heightMap.wrapS = THREE.RepeatWrapping;
		// heightMap.wrapT = THREE.RepeatWrapping;

		// set the height of each vertex based on the color of the corresponding pixel in the heightmap
		// const vertices = geometry.attributes.position.array;
		// const imageData = heightMap.image.data;
		// for (let i = 0, j = 0, l = vertices.length; i < l; i += 1, j += 4) {
		// 	vertices[i] = (imageData[j] + imageData[j + 1] + imageData[j + 2]) / 3;
		// }

		// const noiseScale = 0.1;
		// const vertices = geometry.attributes.position.array;
		// for (let i = 0, j = 0, l = vertices.length; i < l; i += 3, j += 1) {
		// 	const x = vertices[i];
		// 	const z = vertices[i + 2];
		// 	const y = 50 * (1 + Math.sin(noiseScale * x + 10 * noise.perlin3(noiseScale * x, noiseScale * z, 0)));
		// 	vertices[i + 1] = y;
		// }

		const material = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			wireframe: true,
			side: THREE.DoubleSide,
			// displacementMap: heightMap,
			// displacementScale: 20,
		});

		// create the mesh for the terrain
		const terrain = new THREE.Mesh(geometry, material);

		// rotate the terrain to make it look like hills and valleys
		terrain.rotation.x = -Math.PI / 2;
		terrain.position.y = -10;
		return terrain;
	}

	async addTerrain(heightMapImageSrc) {
		const heightMap = await DinoScene.loadTexture(heightMapImageSrc);
		const terrain = DinoScene.makeTerrain(heightMap);
		window.terrain = terrain;
		// add the terrain to the scene
		this.scene.add(terrain);
	}
}

export default DinoScene;
