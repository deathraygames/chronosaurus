import MouseWheelWatcher from 'rocket-boots-three-toolbox/src/MouseWheelWatcher.js';
import { Random } from 'rocket-utility-belt';

import Looper from './Looper.js';
import StateCommander from './StateCommander.js';

class GenericGame extends StateCommander {
	constructor(options = {}) {
		const {
			SceneClass, // required
			ActorClass, // required
			WorldClass, // required
			states, // recommended
			minMouseWheel = -100,
			maxMouseWheel = 100,
		} = options;
		super({ states });
		this.minMouseWheel = minMouseWheel;
		this.maxMouseWheel = maxMouseWheel;
		this.loop = new Looper();
		this.mouseWheelWatcher = new MouseWheelWatcher({ min: minMouseWheel, max: maxMouseWheel });
		this.gameScene = new SceneClass();
		this.world = new WorldClass();
		this.ActorClass = ActorClass;
		this.players = [];
		this.spirits = [];
		this.actors = [];
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

	makeCharacter(spiritId) {
		const character = new this.ActorClass({
			spiritId,
		});
		character.isCharacter = true;
		return character;
	}

	addNewCharacter(...args) {
		const character = this.makeCharacter(...args);
		this.actors.push(character);
		return character;
	}
}

export default GenericGame;
