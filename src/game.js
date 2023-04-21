import DinoGame from './DinoGame.js';
import test from './test.js';

let game = {};

if (true) {
	game = new DinoGame({
		textures: {

		},
		sounds: {

		},
		prototypes: {
			tree: { rooted: 1, renderAs: 'billboard', texture: 'tree.png' },
		},
		terrainItems: {

		},
		specialItems: {

		},
		actors: {

		},
	});
	window.document.addEventListener('DOMContentLoaded', () => {
		game.start();
	});
	window.game = game;
	window.g = game;
} else {
	window.document.addEventListener('DOMContentLoaded', () => test());
}

export default game;
