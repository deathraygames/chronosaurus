import { ArrayCoords, Random, HALF_PI, PI, TAU } from 'rocket-utility-belt';

import PointerLocker from './PointerLocker.js';
import DinoScene from './DinoScene.js';
import GenericGame from './GenericGame.js';
import DinoWorld from './DinoWorld.js';
import Actor from './Actor.js';
import DinoSoundController from './DinoSoundController.js';
import DinoItem from './DinoItem.js';
import DinoInterface from './DinoInterface.js';
import models from './models.js';
import states from './states.js';
import dinos from './dinos.js';
import { sounds, music } from './soundsAndMusic.js';
import Speaker from './Speaker.js';

const PART_SIZE = 20;
const PART = {
	name: 'Time travel machine part',
	randomAtRadius: 100,
	size: PART_SIZE,
	rooted: true,
	scannable: true,
	timeTravelPart: true,
	interactionRange: PART_SIZE + 40,
	interactionAction: 'Dig',
	interactionEffort: 100,
	heightSizeOffset: 0,
	inventoryDescription: 'This should be useful for rebuilding your time machine.',
	interactionResult: {
		modify: {
			heightSizeOffset: 0.5,
			rooted: false,
			// collectible: true,
			interactionAction: 'Pick up',
			interactionEffort: 0,
			interactionResult: { pickUp: true },
		},
	},
	castShadow: true,
	renderAs: 'model',
	model: 'gear',
};
const PARTS = [
	{ ...PART, randomAtRadius: 400, model: 'sputnik', heightSizeOffset: -0.5 },
	{ ...PART, randomAtRadius: 600 },
	{ ...PART, randomAtRadius: 700, model: 'computer', heightSizeOffset: -0.5 },
	{ ...PART, randomAtRadius: 1200, model: 'commandPod', heightSizeOffset: -0.25 },
	{ ...PART, randomAtRadius: 2200, model: 'sputnik' },
	{ ...PART, randomAtRadius: 2000 },
	{ ...PART, randomAtRadius: 3000, model: 'sputnik' },
	{ ...PART, randomAtRadius: 4000, model: 'computer' },
	{ ...PART, randomAtRadius: 5000 },
];
// Powers:
// - GPS Gravitation-wave Positioning System -- provides x,y,z coordinates
// - Compass --- provides N, S, E, W compass
// - Scanner --- provides some way to detect parts
// - threat monitor --- beeps when a creature neatby is aggro'd
// - rocket boots --- big jumps
// - Chrono-collector --- collects time resource
// - time-stopper --- drops a bubble that stops everyone but character in a radius
// - ranged time-stopper --- time bubble near where it's fired
// - overhead camera --- provides a map view
// - scanning visor --- provides a wireframe view with things highlighted
// - drone --- provides a mobile viewing system
// - laser gun
const PARTS_NEEDED = 6;
const ITEMS = [
	...PARTS,
	{
		name: 'time machine',
		isTimeMachine: true,
		randomAtRadius: 10,
		rooted: true,
		scannable: true,
		size: 20,
		heightSizeOffset: 0,
		renderAs: 'model',
		model: 'teleporter',
		inventorySize: 100,
		// color: [1, 1, 1],
		interactionRange: 80,
		interactionAction: 'Add part',
		interactionEffort: 0,
		damage: PARTS_NEEDED,
		interactionResult: {
			repair: 'timeTravelPart',
		},
	},
];

const DEFAULT_TIME = 5; // ms

// const { X, Y, Z } = ArrayCoords;
const { Z } = ArrayCoords;

// Color names from https://coolors.co/99d4e6
const DARK_PURPLE = '#352b40';
const EGGPLANT = '#653d48';
const OLD_ROSE = '#be7979';
const NON_PHOTO_BLUE = '#99d4e6';
const VISTA_BLUE = '#7b99c8';
const ULTRA_VIOLET = '#535c89';
const SKY_COLOR_PER_HOUR = [
	DARK_PURPLE, // 0
	DARK_PURPLE, // 1
	DARK_PURPLE,
	DARK_PURPLE,
	DARK_PURPLE,
	EGGPLANT, // 5
	EGGPLANT,
	OLD_ROSE, // 7
	NON_PHOTO_BLUE,
	NON_PHOTO_BLUE, // 9
	NON_PHOTO_BLUE,
	NON_PHOTO_BLUE,
	NON_PHOTO_BLUE, // noon
	NON_PHOTO_BLUE, // 13 (1 pm)
	NON_PHOTO_BLUE,
	VISTA_BLUE,
	VISTA_BLUE,
	ULTRA_VIOLET, // 17 (5pm)
	ULTRA_VIOLET, // 18
	EGGPLANT, // 19 (7 pm)
	EGGPLANT,
	DARK_PURPLE,
	DARK_PURPLE, // 22
	DARK_PURPLE, // 23
	DARK_PURPLE, // 24
];

const WALK_ANGLES = {
	forward: 0,
	back: PI, // Or -PI
	left: HALF_PI,
	right: -HALF_PI,
};

window.Speaker = Speaker;

class DinoGame extends GenericGame {
	constructor() {
		super({
			models,
			states,
			sounds,
			music,
			minMouseWheel: 0,
			maxMouseWheel: 500,
			SceneClass: DinoScene,
			ActorClass: Actor,
			WorldClass: DinoWorld,
			ItemClass: DinoItem,
			InterfaceClass: DinoInterface,
			SoundControllerClass: DinoSoundController,
			// SoundControllerClass: SoundController,
		});
		this.speaker = new Speaker({ voice: 'David', pitch: 1.2, rate: 0.9 });
		this.pointerLocker = new PointerLocker();
		this.cameraPosition = [0, 0, 0];
		this.cameraVerticalRotation = HALF_PI;
		// How spaced-out do you want the spawned actors
		this.spawnActorDistance = 1000;
		// Min spawn distance should be greater than the sight view of enemies so that they
		// don't spawn and instantly attack.
		// Max spawn distance should be somwhat similar to half the size of all the chunks being shown
		this.spawnRadii = [this.spawnActorDistance, 3500];
		this.despawnRadius = this.spawnRadii[1] * 1.5;
		this.timeMachine = null;
		this.headBop = 0.5;
		// this.testMode = true;
		this.spawnDinos = true;
	}

	say(text) {
		if (!this.sounds.isSoundsOn) return;
		this.speaker.speak(text);
	}

	walkCharacter(t, angles = [], sprint = false) {
		if (!angles.length) return;
		const angleSum = angles.reduce((sum, a) => sum + a, 0) / angles.length;
		const method = (sprint ? 'sprint' : 'walk');
		this.mainCharacter[method](t, angleSum);
		if (this.mainCharacter.grounded) {
			// this.sounds.play('footsteps', { random: 0.1 });
			if (this.tick % 100 === 0) this.sounds.play('footsteps');
			if (this.headBop) {
				// TODO: this could be improved, and moved into the Actor class
				// this.mainCharacter.heightSizeOffset = this.headBop * Math.sin(this.tick / 10);
			}
		}
	}

	interactNearest(t) {
		const [, iItem] = this.findNearestInRangeInteractableItem(this.mainCharacter.coords);
		if (!iItem) return;
		if (this.tick % 100 === 0) this.sounds.play('collect');
		const amount = t / 40;
		const messages = this.ItemClass.interact(iItem, this.mainCharacter, amount);
		if (messages) this.interface.addToLog(messages);
		this.setHeightToTerrain(iItem, this.world);
	}

	handleCommandsDown(commands = [], t = DEFAULT_TIME) {
		const splitCommands = commands.map((command) => command.split(' '));
		// const firstCommands = commands.map((commandWords) => commandWords[0]);
		const moves = splitCommands.filter((commandWords) => commandWords[0] === 'move');
		let sprint = (commands.includes('sprint'));
		const moveAngles = moves.map((moveCommandWords) => {
			if (moveCommandWords[2] === 'sprint') sprint = true;
			return WALK_ANGLES[moveCommandWords[1]];
		});
		if (this.kbCommander.isKeyDown('W')) moveAngles.push(WALK_ANGLES.forward);
		if (this.kbCommander.isKeyDown('A')) moveAngles.push(WALK_ANGLES.left);
		if (this.kbCommander.isKeyDown('S')) moveAngles.push(WALK_ANGLES.back);
		if (this.kbCommander.isKeyDown('D')) moveAngles.push(WALK_ANGLES.right);
		// if (sprint) console.log('sprint');
		if (moveAngles.length) this.walkCharacter(t, moveAngles, sprint);
		if (commands.includes('jump')) {
			this.mainCharacter.jump(t);
		}
		if (commands.includes('interact nearest')) {
			this.interactNearest(t);
		}
	}

	handleCommand(command) {
		const { mainCharacter } = this;
		const commandWords = command.split(' ');
		const firstCommand = commandWords[0];
		if (firstCommand === 'move') {
			// Figure out the relative angle
			// const angleOfMovement = WALK_ANGLES[commandWords[1]];
			// this.walkCharacter(DEFAULT_TIME, [angleOfMovement], commandWords[2] === 'sprint');
		} else if (firstCommand === 'turn') {
			let turnAmount = TAU / 50;
			if (commandWords[1] === 'right') turnAmount *= -1;
			mainCharacter.turn(turnAmount);
		} else if (firstCommand === 'interact') {
			if (commandWords[1] === 'nearest') {
				this.sounds.play('collect');
				// const [, iItem] = this.findNearestInRangeInteractableItem(mainCharacter.coords);
				// if (!iItem) return;
				// this.sounds.play('collect');
				// const messages = this.ItemClass.interact(iItem, mainCharacter, 1);
				// if (messages) this.interface.addToLog(messages);
				// this.setHeightToTerrain(iItem, this.world);
			}
		} else if (firstCommand === 'jump') {
			// const didJump = mainCharacter.jump();
			if (mainCharacter.grounded) this.sounds.play('jump');
		} else if (firstCommand === 'stop') {
			this.mainCharacter.vel = [0, 0, 0];
			// This is a hack to stop a key-stuck bug
			this.kbCommander.keysDown = {};
			this.kbCommander.commandsDown = {};
		}
	}

	setHeightToTerrain(entity, world) {
		const [x, y, z] = entity.coords;
		let h = world.getTerrainHeight(x, y);
		h += (entity.heightSizeOffset * entity.size);
		const grounded = (z <= h + 1);
		// have a small offset of h (+1) so things aren't in the air going from one tiny bump downwards
		if (grounded && !entity.grounded && entity.isCharacter) this.sounds.play('footsteps');
		// TODO: play 'land' sound instead if velocity downward is high
		entity.setGrounded(grounded, h);
	}

	checkWin() {
		const win = this.timeMachine.damage === 0;
		if (win) this.transition('win');
		return win;
	}

	checkDead() {
		const dead = this.mainCharacter.health.atMin();
		if (dead) this.transition('dead');
		return dead;
	}

	gameTick(t) {
		super.gameTick(t);

		if (this.checkWin()) return { terrainChunks: [] };
		this.checkDead();

		if (this.tick % 300 === 0 && this.spawnDinos) {
			this.addNewDino();
		}
		// Clean items and actors to remove missing/dead
		this.despawn(this.mainCharacter.coords);

		// Handle camera position
		const zoom = this.mouseWheelWatcher.percent * 100;
		this.mouseWheelWatcher.update();
		this.cameraPosition[Z] = 35 + (zoom ** 2);
		// this.cameraPosition[Y] = -100 - zoom;

		// Handle commands being held down
		this.handleCommandsDown(this.kbCommander.getCommandsDown(), t);

		// Generate terrain
		const { mainCharacter, actors } = this;
		const chunkRadius = Math.min(0 + Math.floor(this.tick / 70), 3);
		const terrainChunks = this.world.makeTerrainChunks(mainCharacter.coords, chunkRadius);
		// Update actors
		actors.forEach((actor) => actor.update(t, this.world, this));
		actors.forEach((actor) => this.setHeightToTerrain(actor, this.world));
		return { terrainChunks };
	}

	calcScannableItemPercentages() {
		const { coords } = this.mainCharacter;
		const MAX_SCAN = 5000;
		return this.items.filter((item) => item.scannable).map((item) => {
			const dist = ArrayCoords.getDistance(coords, item.coords);
			return Math.max(1 - (dist / MAX_SCAN), 0);
		});
	}

	getSun() {
		const hr = this.getWorldHour();
		// Angle of 0 = fully risen, 12 = fully hidden
		const sunLightAngle = (((hr / 24) * TAU) + PI) % TAU;
		// TODO: Change the color of the sun light?
		// TODO: Set min and max intensity values
		return { sunLightAngle };
	}

	assembleRenderData(gameTickData = {}) { // You should overwrite this method
		const { terrainChunks } = gameTickData;
		// Assemble data needed to render
		const {
			cameraPosition,
			cameraVerticalRotation,
			mainCharacter,
			actors,
			items,
		} = this;
		const [x, y, z] = mainCharacter.coords;
		const [, iItem] = this.findNearestInRangeInteractableItem(mainCharacter.coords);
		const { sunLightAngle } = this.getSun();
		const sceneUpdateOptions = {
			terrainChunks,
			// cameraPosition: [-(zoom ** 1.5), -zoom / 2, 30 + (zoom ** 2)],
			cameraPosition,
			cameraRotationGoalArray: [cameraVerticalRotation, 0, mainCharacter.facing - HALF_PI],
			worldCoords: [-x, -y, -z],
			entities: [...actors, ...items],
			// skyColor: [0.5, 0.75, 1],
			skyColor: SKY_COLOR_PER_HOUR[this.getWorldHour()],
			sunLightAngle,
		};
		const { inventory } = mainCharacter;
		const scannerItemPercentages = this.calcScannableItemPercentages();
		const worldTimeArray = [
			this.getWorldHour(), this.getWorldMinutes(),
		];
		const interfaceUpdates = {
			actor: mainCharacter,
			item: iItem,
			scannerItemPercentages,
			inventory,
			debug: (this.testMode) ? {
				lastDeltaT: this.lastDeltaT,
			} : null,
			worldTimeArray,
		};
		return {
			sceneUpdateOptions,
			interfaceUpdates,
		};
	}

	getRandomSpawnCoords() {
		const [minRadius, maxRadius] = this.spawnRadii;
		const r = minRadius + Random.randomInt(maxRadius - minRadius);
		const angle = Random.randomAngle();
		const [x, y] = ArrayCoords.polarToCartesian(r, angle);
		return ArrayCoords.add(this.mainCharacter.coords, [x, y, 0]);
	}

	addNewDino() {
		const coords = this.getRandomSpawnCoords();
		const [distance] = this.findNearestActor(coords);
		if (distance < this.spawnActorDistance) return null;
		// const randColor = () => (0.5 + (Random.random() * 0.5));
		const dinoKey = Random.pick(Object.keys(dinos));
		const dinoOpt = dinos[dinoKey];
		const dino = this.addNewActor(dinoOpt);
		dino.coords = coords;
		console.log('Added dino', dino.name, dino.entityId);
		return dino;
	}

	addNewTrees(n) {
		for (let i = n; i > 0; i -= 1) this.addNewTree();
	}

	addNewTree() {
		const coords = this.getRandomSpawnCoords();
		this.addNewItem({
			isTree: true,
			color: Random.pick(['#76c379', '#508d76']),
			renderAs: 'model',
			model: 'royalPalm',
			coords,
			rooted: true,
		});
		// TODO:
		// Create random tree and find a location
		// Add a despawnRadius
		// Then also run this a few more times when a new chunk is loaded
	}

	buildWorld() {
		ITEMS.forEach((itemData) => {
			this.addNewItem(itemData);
		});
		this.addNewTrees(30);
		this.items.forEach((item) => {
			if (item.rooted) {
				this.setHeightToTerrain(item, this.world);
			}
			if (item.isTimeMachine) this.timeMachine = item;
		});
	}

	async setup() {
		const { spirit } = this.addNewPlayer();
		this.mainCharacter = this.addNewCharacter({
			spirit,
			inventorySize: PARTS.length,
			coords: [0, 0, 0],
			// walkForce: 1000,
			// jumpForce: 1000 * 20,
		});
		this.buildWorld();
		const { gameScene } = this;
		await gameScene.setup([0, 100, 100]);
	}

	setupMouseMove() {
		this.mouseHandler = ({ x, y }) => {
			this.mainCharacter.turn(-x * 0.001);
			// this.cameraPosition[X] += x * 1;
			// this.cameraPosition[Y] += y * 1;
			this.cameraVerticalRotation += y * -0.001;
		};
		this.pointerLocker
			.setup({ selector: '#hud' }) // Needs to happen after the canvas is created
			.on('lockedMouseMove', this.mouseHandler);
	}

	cleanUpMouseMove() {
		this.pointerLocker.unlock();
		this.pointerLocker.off('lockedMouseMove', this.mouseHandler);
	}

	toggleSoundBasedOnCheckboxes() {
		const musicCheckbox = DinoInterface.$('#music-checkbox');
		const soundCheckbox = DinoInterface.$('#sound-fx-checkbox');
		this.sounds.turnMusicOn(musicCheckbox.checked);
		this.sounds.turnSoundsOn(soundCheckbox.checked);
	}

	setupMainMenuEvents() {
		this.startButtonHandler = () => {
			this.transition('intro');
		};
		DinoInterface.$('#start-game-button').addEventListener('click', this.startButtonHandler);
		const musicCheckbox = DinoInterface.$('#music-checkbox');
		this.toggleSoundListener = () => this.toggleSoundBasedOnCheckboxes();
		musicCheckbox.addEventListener('change', this.toggleSoundListener);
		const soundCheckbox = DinoInterface.$('#sound-fx-checkbox');
		soundCheckbox.addEventListener('change', this.toggleSoundListener);
	}

	cleanUpMainMenuEvents() {
		DinoInterface.$('#start-game-button').removeEventListener('click', this.startButtonHandler);
		DinoInterface.$('#music-checkbox').removeEventListener('change', this.toggleSoundListener);
		DinoInterface.$('#sound-fx-checkbox').removeEventListener('change', this.toggleSoundListener);
	}

	async start() {
		await this.transition('loading');
		await this.transition('mainMenu');
		// this.transition('intro');
		// await this.transition('explore');

		// await this.transition('win');
		// gameScene.addBox();
		// gameScene.addBox();
		// await gameScene.addTerrainByHeightMap('BritanniaHeightMap2.jpg');

		// this.addNewDino();
		// this.addNewDino();

		// const testDino = this.addNewDino();
		// // testDino.autonomous = true;
		// testDino.mobile = false;
		// testDino.coords = [200, 0, 40];
		// // testDino.physics = false;
		// testDino.setFacing(0);
		// window.d = testDino;

		// this.startAnimationGameLoop();
	}
}

window.ArrayCoords = ArrayCoords;

export default DinoGame;
