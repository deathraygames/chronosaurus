import { TAU } from 'rocket-utility-belt';

const defaultDino = {
	name: 'Dino',
	autonomous: true,
	isDinosaur: true,
	wandering: true,
	size: 60,
	heightSizeOffset: 0,
	// color: [randColor(), randColor(), randColor()],
	walkForce: 10000,
	mass: 10000,
	attentionDistance: 1000,
	fleeDistance: 0,
	huntDistance: 0,
	renderAs: 'model', // renderAs: 'sphere',
};
const dinos = {
	apat: {
		...defaultDino,
		model: 'apat',
		faction: 'herbivore',
		name: 'Dino apat',
		mass: 20000,
		turnSpeed: TAU / 3000,
	},
	para: {
		...defaultDino,
		model: 'para',
		faction: 'herbivore',
		name: 'Dino para',
		mass: 6000,
	},
	steg: {
		...defaultDino,
		model: 'steg',
		faction: 'herbivore',
		name: 'Dino steg',
		mass: 10000,
	},
	trex: {
		...defaultDino,
		model: 'trex',
		faction: 'trex',
		name: 'Dino trex',
		mass: 12000,
		huntDistance: 500,
	},
	tric: {
		...defaultDino,
		model: 'tric',
		faction: 'tric',
		name: 'Dino tric',
		mass: 10000,
	},
	velo: {
		...defaultDino,
		model: 'velo',
		faction: 'velo',
		name: 'Dino velo',
		mass: 5000,
		huntDistance: 500,
	},
};

export default dinos;
