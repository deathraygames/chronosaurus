import DinoGame from './DinoGame.js';

const game = new DinoGame({
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

export default game;
