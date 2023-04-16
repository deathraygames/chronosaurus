// import * as THREE from 'three';
import PointerLocker from './PointerLocker.js';
import DinoScene from './DinoScene.js';
import GenericGame from './GenericGame.js';
import DinoWorld from './DinoWorld.js';
import Actor from './Actor.js';
import { ArrayCoords } from 'rocket-utility-belt';
const { X, Y, Z } = ArrayCoords;

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
		this.cameraPosition = [0, 0, 0];
	}

	handleCommand(command) {
		const { mainCharacter } = this;
		const commandWords = command.split(' ');
		const firstCommand = commandWords[0];
		if (firstCommand === 'move') {
			let spd = 10;
			let angleOfMovement = mainCharacter.facing; // forward
			if (commandWords[1] === 'forward') {}
			else if (commandWords[1] === 'back') angleOfMovement += PI;
			else if (commandWords[1] === 'left') angleOfMovement -= HALF_PI;
			else if (commandWords[1] === 'right') angleOfMovement += HALF_PI;
			const x = spd * Math.sin(angleOfMovement);
			const y = spd * Math.cos(angleOfMovement);
			mainCharacter.move([x, y, 0]);
			// this.cameraCoords.position
		} else if (firstCommand === 'turn') {
			let turnAmount = TAU / 50;
			if (commandWords[1] === 'left') turnAmount *= -1;
			mainCharacter.turn(turnAmount);
		}
	}

	applyPhysics(actor, world) {
		const h = world.getTerrainHeight(actor.coords[X], actor.coords[Y]);
		actor.setZ(h);
	}

	animationTick() {
		const { mainCharacter, actors } = this;
		const zoom = this.mouseWheelWatcher.percent * 100;
		this.mouseWheelWatcher.update();
		this.cameraPosition[Z] = 50 + (zoom ** 2);
		this.cameraPosition[Y] = -100 - zoom;
		const [x, y, z] = mainCharacter.coords;
		const terrainChunks = this.world.makeTerrainChunks(mainCharacter.coords);
		actors.forEach((actor) => this.applyPhysics(actor, this.world));
		this.gameScene.update({
			terrainChunks,
			// cameraPosition: [-(zoom ** 1.5), -zoom / 2, 30 + (zoom ** 2)],
			cameraPosition: this.cameraPosition,
			cameraRotation: mainCharacter.facing,
			worldCoords: [-x, -y, -z],
			entities: [...actors],
		}).render();
	}

	async start() {
		const { spirit } = this.addNewPlayer();
		this.mainCharacter = this.addNewCharacter(spirit);
		this.mainCharacter.coords = [0, 0, 0];
		// this.transition('home');
		// this.transition('intro');
		this.transition('explore');
		const { gameScene } = this;
		gameScene.setup([0, 100, 100]);
		this.pointerLocker
			.setup() // Needs to happen after the canvas is created
			.on('lockedMouseMove', ({ x, y }) => {
				this.mainCharacter.facing += x * 0.001;
				// this.cameraPosition[X] += x * 1;
				this.cameraPosition[Y] += y * 1;
			});
		// gameScene.addBox();
		// gameScene.addBox();
		// await gameScene.addTerrainByHeightMap('BritanniaHeightMap2.jpg');
		this.loop.set(() => this.animationTick()).start();
	}
}

export default DinoGame;
