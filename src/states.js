const states = {
	loading: {
		start: async (game) => {
			game.interface.hideWin();
			await game.setup();
		},
		stop: (game) => {
			game.interface.hideLoading();
		},
	},
	mainMenu: {
		keyboardMapping: {
			Enter: 'start',
		},
		async start(game) {
			game.interface.hideWin();
			game.interface.hideLoading();
			game.interface.showMainMenu();
			game.interface.hide('#menu');
			game.interface.show('#main-menu-loading');
			await game.setup();
			game.interface.hide('#main-menu-loading');
			game.interface.show('#menu');
			game.setupMainMenuEvents();
		},
		stop(game) {
			game.cleanUpMainMenuEvents();
			game.interface.hideMainMenu();
		},
	},
	intro: {
		start(game) {
			game.interface.show('#intro');
			setTimeout(() => game.transition('explore'), 4000);
		},
		stop(game) {
			game.interface.hide('#intro');
		},
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
		start(game) {
			game.interface.showHud();
			game.setupMouseMove();
			game.startAnimationGameLoop();
			game.interface.addToLog([
				'It looks like your time machine broke apart, and pieces are strewn across this strange landscape.',
				'((Click screen to enable/disable mouse look))',
			]);
		},
		stop(game) {
			game.interface.hideHud();
			game.stopAnimationGameLoop();
			game.cleanUpMouseMove();
		},
	},
	inventory: {

	},
	dead: {

	},
	win: {
		start: async (game) => {
			game.interface.showWin();
		},
		stop: (game) => {
			game.interface.hideWin();
		},
	},
};

export default states;
