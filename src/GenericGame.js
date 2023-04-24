/* eslint-disable class-methods-use-this */
import MouseWheelWatcher from 'rocket-boots-three-toolbox/src/MouseWheelWatcher.js';
import { Random, ArrayCoords, clamp } from 'rocket-utility-belt';
import { SoundController } from 'sound-controller';

import Entity from './Entity.js';
import Looper from './Looper.js';
import StateCommander from './StateCommander.js';

const { PI } = Math;
const TAU = PI * 2;
const HALF_PI = PI / 2;
const MAX_ACTORS = 5000;
const SECONDS_PER_HOUR = 60 * 60;
const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24;
const START_WORLD_TIME = 60 * 60 * 10; // 10 AM, in seconds

class GenericGame extends StateCommander {
	constructor(options = {}) {
		const {
			SceneClass, // required
			WorldClass, // required
			InterfaceClass, // required
			ActorClass = Entity, // recommended
			ItemClass = Entity, // recommended
			SoundControllerClass = SoundController, // recommended
			states, // recommended
			minMouseWheel = -100,
			maxMouseWheel = 100,
			sounds = {},
			music = {},
			startWorldTime, // optional
		} = options;
		super({ states });
		this.lastDeltaT = 0; // just for debug/tracking purposes
		this.minMouseWheel = minMouseWheel;
		this.maxMouseWheel = maxMouseWheel;
		this.loop = new Looper();
		this.sounds = new SoundControllerClass(sounds, music);
		this.mouseWheelWatcher = new MouseWheelWatcher({ min: minMouseWheel, max: maxMouseWheel });
		this.gameScene = new SceneClass({ models: options.models });
		this.world = new WorldClass();
		this.interface = new InterfaceClass();
		this.ActorClass = ActorClass;
		this.ItemClass = ItemClass;
		this.players = [];
		this.spirits = [];
		this.actors = [];
		this.items = [];
		this.tick = 0;
		this.worldTime = startWorldTime || START_WORLD_TIME; // In seconds
		this.worldTimePerGameTime = 200;
	}

	render(renderData = {}, t = 5) {
		const {
			sceneUpdateOptions = {},
			interfaceUpdates = {},
		} = renderData;
		this.interface.render(interfaceUpdates);
		// Send updates to the scene
		this.gameScene.update(sceneUpdateOptions, t).render();
	}

	gameTick(t) { // You should overwrite this method
		this.tick += 1;
		if (this.tick > 1000000) this.tick = 0;
		const deltaTWorldTime = (t / 1000) * this.worldTimePerGameTime;
		this.worldTime = (this.worldTime + deltaTWorldTime) % SECONDS_PER_DAY;
		return {};
	}

	getWorldHour() {
		return Math.floor(this.worldTime / SECONDS_PER_HOUR);
	}

	assembleRenderData(gameTickData = {}) { // You should overwrite this method
		return {
			...gameTickData,
		};
	}

	animationTick(deltaT) {
		// Clamp the value to 100 ms so that it doesn't go overboard if the
		// animation doesn't run in a long time
		this.lastDeltaT = deltaT; // just for debug/tracking purposes
		const t = clamp(deltaT, 0, 100);
		const gameTickData = this.gameTick(t);
		const renderData = this.assembleRenderData(gameTickData);
		this.render(renderData, t);
	}

	startAnimationGameLoop() {
		this.loop.set((t) => this.animationTick(t)).start();
	}

	stopAnimationGameLoop() {
		this.loop.stop();
	}

	makePlayer() {
		const playerId = Random.uniqueString();
		const spiritId = Random.uniqueString();
		const player = { playerId }; // TODO: give a uid
		const spirit = { spiritId, playerId }; // TODO: give a uid and link to player uid
		return { player, spirit };
	}

	addNewPlayer() {
		const { player, spirit } = this.makePlayer();
		this.players.push(player);
		this.spirits.push(spirit);
		return { player, spirit };
	}

	makeCharacter(charProperties) {
		const character = new this.ActorClass(charProperties);
		character.isCharacter = true;
		return character;
	}

	addNewCharacter(charProperties) {
		const character = this.makeCharacter(charProperties);
		this.actors.push(character);
		return character;
	}

	makeActor(opt = {}) {
		return (new this.ActorClass(opt));
	}

	addNewActor(opt) {
		if (this.actors.length >= MAX_ACTORS) return null;
		const actor = this.makeActor(opt);
		this.actors.push(actor);
		return actor;
	}

	makeItem(itemData = {}) {
		const item = new this.ItemClass(itemData);
		if (item.randomAtRadius) {
			const angle = Random.randomAngle();
			const [x, y] = ArrayCoords.polarToCartesian(Number(item.randomAtRadius), angle);
			item.coords = [x, y, 0];
		}
		return item;
	}

	addNewItem(itemData = {}) {
		const item = this.makeItem(itemData);
		this.items.push(item);
		return item;
	}

	/** Returns an array of (0) the distance to the nearest thing, and (1) the thing */
	static findNearest(arr, coords, filterFn) {
		const nearest = arr.reduce((previousValue, thing) => {
			// if there's a filter function defined, then use it to
			// skip considering certain things
			if (filterFn && !filterFn(thing)) return previousValue;
			const [nearestSoFar] = previousValue;
			const distance = ArrayCoords.getDistance(thing.coords, coords);
			return (distance < nearestSoFar) ? [distance, thing] : previousValue;
		}, [Infinity, null]);
		return nearest;
	}

	findNearestActor(coords, filterFn) {
		return GenericGame.findNearest(this.actors, coords, filterFn);
	}

	findNearestItem(coords, filterFn) {
		return GenericGame.findNearest(this.items, coords, filterFn);
	}

	/** Find all items that are interactable (not necessary within range though) */
	findNearestInteractableItem(coords) {
		return GenericGame.findNearest(this.items, coords, this.ItemClass.isItemInteractable);
	}

	/** Find all items that are interactable (not necessary within range though) */
	findNearestInRangeInteractableItem(coords) {
		const filter = (item) => this.ItemClass.isItemInRangeInteractable(item, coords);
		// TODO: this could be made more efficient since we're checking distance twice
		// (once in isItemInRangeInteractable, once in findNearest)
		return GenericGame.findNearest(this.items, coords, filter);
	}

	removeLost(things = [], despawnCenter = [0, 0, 0]) {
		things.forEach((thing) => {
			if (thing.isCharacter || thing.important) return;
			if (typeof thing.despawnRadius !== 'number') return;
			const distance = ArrayCoords.getDistance(despawnCenter, thing.coords);
			if (distance > this.despawnRadius) thing.remove = true;
		});
	}

	despawn(despawnCenter) {
		this.removeLost(this.actors, despawnCenter);
		this.removeLost(this.items, despawnCenter);
		this.cleanItems();
		this.cleanActors();
	}

	static cleanRemoved(arr) {
		for (let i = arr.length - 1; i >= 0; i -= 1) {
			if (arr[i].remove) arr.splice(i, 1);
		}
	}

	cleanItems() {
		GenericGame.cleanRemoved(this.items);
	}

	cleanActors() {
		GenericGame.cleanRemoved(this.actors);
	}
}

GenericGame.PI = PI;
GenericGame.TAU = TAU;
GenericGame.HALF_PI = HALF_PI;

export default GenericGame;
