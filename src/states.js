const INTRO_TIME = 7000;

const states = {
	loading: {
		start: async (game) => {
			// Pre-load some music -- this doesn't seem to be working
			game.sounds.playMusic('panic').stop();
			game.sounds.playMusic('jazz').stop();
			// Since this is the start of the app running, we need to hide some things
			game.interface.hideWin();
			// await game.setup();
			// Note: The loading window is shown by default (last z-index in the page),
			// but we'll ensure it's being shown
			game.interface.showLoading();
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
			game.sounds.playMusic('jazz').fade(0, 0.5, 4000);
			// game.interface.hideWin();
			game.interface.showMainMenu();
			game.interface.hide('#menu');
			game.interface.show('#main-menu-loading');
			game.toggleSoundBasedOnCheckboxes();
			game.setupMainMenuEvents();
			await game.setup();
			game.interface.hide('#main-menu-loading');
			game.interface.show('#menu');
			if (game.testMode) game.transition('explore'); // For testing
		},
		stop(game) {
			game.interface.hideMainMenu();
			game.cleanUpMainMenuEvents();
		},
	},
	intro: {
		keyboardMapping: {
			Esc: 'exit', // TODO: make this work
			//
		},
		start(game) {
			const song = game.sounds.playMusic('panic');
			if (song) song.seek(65).fade(0, 0.75, 500);
			game.interface.show('#intro');
			const waitTime = (game.testMode) ? 1000 : INTRO_TIME;
			setTimeout(() => game.transition('explore'), waitTime);
		},
		stop(game) {
			game.interface.hide('#intro');
			// If this state transitions too quick, it's possible the music never fades out
			// TODO: Move this fadeOut method into sound controller lib
			if (game.sounds.musicNowPlaying) game.sounds.musicNowPlaying.fade(0.75, 0, 5000);
			game.sounds.play('explode');
			game.sounds.play('explode', { delay: 1000 });
			game.sounds.play('explode', { delay: 2500 });
			game.sounds.play('scary');
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
		async start(game) {
			game.interface.showHud();
			game.setupMouseMove();
			game.startAnimationGameLoop();
			game.interface.addToLog([
				'It looks like your time machine broke apart, and pieces are strewn across this strange landscape.',
				'((Click screen to enable/disable mouse look))',
			]);
			game.sounds.playMusic('wandering');
		},
		stop(game) {
			game.interface.hideHud();
			game.stopAnimationGameLoop();
			game.cleanUpMouseMove();
		},
	},
	inventory: {
		// TBD
	},
	dead: {
		start(game) {
			game.sounds.play('scary');
			game.interface.showDead();
			setTimeout(() => {
				game.mainCharacter.coords = [0, 0, 0]; // eslint-disable-line no-param-reassign
				game.sounds.play('teleport');
				game.transition('explore');
			}, 5000);
		},
		stop(game) {
			game.interface.hideDead();
		},
	},
	win: {
		start: async (game) => {
			game.sounds.play('teleport');
			game.sounds.playMusic('home');
			game.interface.showWin();
		},
		stop: (game) => {
			game.interface.hideWin();
		},
	},
};

export default states;
