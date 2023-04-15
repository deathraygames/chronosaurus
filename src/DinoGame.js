// import * as THREE from 'three';
import PointerLocker from './PointerLocker.js';
import DinoScene from './DinoScene.js';
import GenericGame from './GenericGame.js';
import DinoWorld from './DinoWorld.js';
import Actor from './Actor.js';

const { PI } = Math;
const TAU = PI * 2;
const HALF_PI = PI / 2;

const states = {
	home: {
		keyboardMapping: {
			Enter: 'start',
		},
	},
	intro: {

	},
	explore: {
		keyboardMapping: {
			w: 'move forward',
			s: 'move back',
			a: 'move left',
			d: 'move right',
			q: 'turn left',
			e: 'turn right',
		}
	},
	inventory: {},
	dead: {},
};

class DinoGame extends GenericGame {
	constructor(options) {
		super({
			states,
			minMouseWheel: 0,
			maxMouseWheel: 500,
			SceneClass: DinoScene,
			ActorClass: Actor,
			WorldClass: DinoWorld,
		});
		this.pointerLocker = new PointerLocker();
	}

	handleCommand(command) {
		const { mainCharacter } = this;
		const commandWords = command.split(' ');
		const firstCommand = commandWords[0];
		if (firstCommand === 'move') {
			let spd = 3;
			let angleOfMovement = mainCharacter.facing; // forward
			if (commandWords[1] === 'forward') {}
			else if (commandWords[1] === 'back') angleOfMovement += PI;
			else if (commandWords[1] === 'left') angleOfMovement += HALF_PI;
			else if (commandWords[1] === 'right') angleOfMovement -= HALF_PI;
			const x = spd * Math.sin(angleOfMovement);
			const z = spd * Math.cos(angleOfMovement);
			mainCharacter.move([x, 0, z]);
			// this.cameraCoords.position
		} else if (firstCommand === 'turn') {
			let turnAmount = TAU / 50;
			if (commandWords[1] === 'right') turnAmount *= -1;
			mainCharacter.turn(turnAmount);
		}
	}

	applyPhysics(actor, world) {
		const h = world.getTerrainHeight(actor.coords[0], actor.coords[2]);
		actor.setY(h);
	}

	animationTick() {
		const { mainCharacter, actors } = this;
		const zoom = this.mouseWheelWatcher.percent * 100;
		this.mouseWheelWatcher.update();
		const [x, y, z] = mainCharacter.coords;
		const terrainChunks = this.world.makeTerrainChunks(mainCharacter.coords);
		actors.forEach((actor) => this.applyPhysics(actor, this.world));
		this.gameScene.update({
			terrainChunks,
			cameraPosition: [-(zoom ** 1.5), 30 + (zoom ** 2), -zoom / 2],
			cameraRotation: mainCharacter.facing,
			worldCoords: [-x, -y, -z],
			entities: [...actors],
		}).render();
	}

	async start() {
		const { spirit } = this.addNewPlayer();
		this.mainCharacter = this.addNewCharacter(spirit);
		this.mainCharacter.coords = [100, 0, 100];
		// this.transition('home');
		// this.transition('intro');
		this.transition('explore');
		const { gameScene } = this;
		gameScene.setup([0, 100, 100]);
		this.pointerLocker
			.setup() // Needs to happen after the canvas is created
			.on('lockedMouseMove', ({ x, y }) => {
				this.mainCharacter.facing += x * -0.001;
			});
		// gameScene.addBox();
		// gameScene.addBox();
		// await gameScene.addTerrainByHeightMap('BritanniaHeightMap2.jpg');
		this.loop.set(() => this.animationTick()).start();
	}
}

export default DinoGame;
