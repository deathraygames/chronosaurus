import * as THREE from 'three';
import DinoScene from './DinoScene.js';

class DinoGame {
	constructor() {
		this.dinoScene = new DinoScene();
	}

	start() {
		const { dinoScene } = this;
		dinoScene.setup([0, 0, 100]);
		dinoScene.addBox();
		dinoScene.addTerrain('BritanniaHeightMap2.jpg');
		dinoScene.render();
	}
}

export default DinoGame;
