import { ArrayCoords, Random } from 'rocket-utility-belt';

import PointerLocker from './PointerLocker.js';
import DinoScene from './DinoScene.js';
import GenericGame from './GenericGame.js';
import DinoWorld from './DinoWorld.js';
import Actor from './Actor.js';
import DinoItem from './DinoItem.js';
import DinoInterface from './DinoInterface.js';

const PART_SIZE = 20;
const PART = {
	name: 'Time travel machine part',
	randomAtRadius: 100,
	size: PART_SIZE,
	rooted: true,
	interactionRange: PART_SIZE + 20,
	interactionAction: 'Dig',
	interactionEffort: 6,
	heightSizeOffset: 0,
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
};
const PARTS = [
	{ ...PART, randomAtRadius: 100, color: [1, 0.5, 0.5] },
	{ ...PART, randomAtRadius: 200, color: [1, 1, 0] },
	{ ...PART, randomAtRadius: 300, color: [1, 1, 1] },
	{ ...PART, randomAtRadius: 400, color: [0, 1, 1] },
	{ ...PART, randomAtRadius: 500, color: [0, 0, 1] },
	{ ...PART, randomAtRadius: 600, color: [0, 1, 0] },
	{ ...PART, randomAtRadius: 700, color: [1, 0, 1] },
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
			z: 'turn left',
			x: 'turn right',
			e: 'interact nearest',
			' ': 'jump',
		},
	},
	inventory: {},
	dead: {},
};

class DinoGame extends GenericGame {
	constructor() {
		super({
			states,
			minMouseWheel: 0,
			maxMouseWheel: 500,
			SceneClass: DinoScene,
			ActorClass: Actor,
			WorldClass: DinoWorld,
			ItemClass: DinoItem,
			InterfaceClass: DinoInterface,
		});
		this.pointerLocker = new PointerLocker();
		this.cameraPosition = [0, 0, 0];
		this.cameraVerticalRotation = HALF_PI;
		// How spaced-out do you want the spawned actors
		this.spawnActorDistance = 900;
		// Min spawn distance should be greater than the sight view of enemies so that they
		// don't spawn and instantly attack.
		// Max spawn distance should be somwhat similar to half the size of all the chunks being shown
		this.spawnRadii = [this.spawnActorDistance, 3500];
		this.despawnRadius = this.spawnRadii[1] * 1.5;
	}

	handleCommand(command) {
		const { mainCharacter } = this;
		const commandWords = command.split(' ');
		const firstCommand = commandWords[0];
		if (firstCommand === 'move') {
			// const spd = 10;
			// Figure out the relative angle
			let angleOfMovement = 0;
			if (commandWords[1] === 'forward') {}
			else if (commandWords[1] === 'back') angleOfMovement += PI;
			else if (commandWords[1] === 'left') angleOfMovement -= HALF_PI;
			else if (commandWords[1] === 'right') angleOfMovement += HALF_PI;
			mainCharacter.walk(angleOfMovement);
			// const x = spd * Math.sin(angleOfMovement);
			// const y = spd * Math.cos(angleOfMovement);
			// mainCharacter.move([x, y, 0]);
			// this.cameraCoords.position
		} else if (firstCommand === 'turn') {
			let turnAmount = TAU / 50;
			if (commandWords[1] === 'left') turnAmount *= -1;
			mainCharacter.turn(turnAmount);
		} else if (firstCommand === 'interact') {
			if (commandWords[1] === 'nearest') {
				const [, iItem] = this.findNearestInRangeInteractableItem(mainCharacter.coords);
				if (!iItem) return;
				this.ItemClass.interact(iItem, mainCharacter, 1);
				this.setHeightToTerrain(iItem, this.world);
			}
		} else if (firstCommand === 'jump') {
			mainCharacter.jump();
		}
	}

	setHeightToTerrain(entity, world) {
		const [x, y, z] = entity.coords;
		let h = world.getTerrainHeight(x, y);
		h += (entity.heightSizeOffset * entity.size);
		const grounded = (z <= h);
		entity.setGrounded(grounded, h);
	}

	gameTick(t) {
		super.gameTick(t);
		if (this.tick % 300 === 0) {
			this.addNewDino();
		}
		// Clean items and actors to remove missing/dead
		this.removeLostActors();
		this.cleanItems();
		this.cleanActors();

		// Handle camera position
		const zoom = this.mouseWheelWatcher.percent * 100;
		this.mouseWheelWatcher.update();
		this.cameraPosition[Z] = 35 + (zoom ** 2);
		// this.cameraPosition[Y] = -100 - zoom;

		// Generate terrain
		const { mainCharacter, actors } = this;
		const terrainChunks = this.world.makeTerrainChunks(mainCharacter.coords);
		// Update actors
		actors.forEach((actor) => actor.update(t, this.world));
		actors.forEach((actor) => this.setHeightToTerrain(actor, this.world));
		return { terrainChunks };
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
		const sceneUpdateOptions = {
			terrainChunks,
			// cameraPosition: [-(zoom ** 1.5), -zoom / 2, 30 + (zoom ** 2)],
			cameraPosition,
			cameraRotationGoalArray: [cameraVerticalRotation, 0, -mainCharacter.facing],
			worldCoords: [-x, -y, -z],
			entities: [...actors, ...items],
			clearColor: [0.5, 0.75, 1],
		};
		const interfaceUpdates = {
			actor: mainCharacter,
			item: iItem,
		};
		return {
			sceneUpdateOptions,
			interfaceUpdates,
		};
	}

	removeLostActors() {
		this.actors.forEach((actor) => {
			if (actor.isCharacter || actor.important) return;
			const distance = ArrayCoords.getDistance(this.mainCharacter.coords, actor.coords);
			if (distance > this.despawnRadius) actor.remove = true;
		})
	}

	addNewDino() {
		const [minRadius, maxRadius] = this.spawnRadii;
		const r = minRadius + Random.randomInt(maxRadius - minRadius);
		const angle = Random.randomAngle();
		const [x, y] = ArrayCoords.polarToCartesian(r, angle);
		const coords = ArrayCoords.add(this.mainCharacter.coords, [x, y, 0]);
		const [distance] = this.findNearestActor(coords);
		if (distance < this.spawnActorDistance) return null;
		const randColor = () => (0.5 + (Random.random() * 0.5));
		const dinoOpt = {
			name: 'Dino',
			autonomous: true,
			isDinosaur: true,
			wandering: true,
			size: 60,
			color: [randColor(), randColor(), randColor()],
			renderAs: 'sphere',
		};
		const dino = this.addNewActor(dinoOpt);
		dino.coords = coords;
		console.log('Added dino', dino);
		return dino;
	}

	buildWorld() {
		PARTS.forEach((partData) => {
			this.addNewItem(partData);
		});
		this.items.forEach((item) => {
			if (item.rooted) {
				this.setHeightToTerrain(item, this.world);
			}
		});
	}

	async start() {
		const { spirit } = this.addNewPlayer();
		this.mainCharacter = this.addNewCharacter(spirit);
		this.mainCharacter.inventorySize = 10;
		this.mainCharacter.coords = [0, 0, 0];
		this.mainCharacter.walkForce = 12000;
		this.buildWorld();
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
				// this.cameraPosition[Y] += y * 1;
				this.cameraVerticalRotation += y * -0.001;
			});
		// gameScene.addBox();
		// gameScene.addBox();
		// await gameScene.addTerrainByHeightMap('BritanniaHeightMap2.jpg');
		this.startAnimationGameLoop();
	}
}

export default DinoGame;
