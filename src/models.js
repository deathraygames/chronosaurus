const defaultModel = {
	castShadows: true,
};
const TECH_COLOR = '#c2b5a9';

export default {
	royalPalm: {
		...defaultModel,
		path: 'trees/RoyalPalmTreeGLB.glb',
		scale: 6,
		color: [0.3, 0.7, 0.3],
	},
	teleporter: {
		path: 'tech/Turret_Teleporter.fbx',
		scale: 1,
		color: TECH_COLOR,
	},
	sputnik: {
		path: 'tech/Sputnik.glb',
		scale: 2,
		color: TECH_COLOR,
	},
	gear: {
		path: 'tech/Collectible_Gear.glb',
		scale: 40,
		color: TECH_COLOR,
	},
	// apatosaurus1: {
	// 	path: 'dinos/converted/Apatosaurus.gltf',
	// 	scale: 10,
	// },
	// apatosaurus2: {
	// 	path: 'dinos/converted/Apatosaurus.glb',
	// 	scale: 10,
	// },
	// tRex: {
	// 	...defaultModel,
	// 	path: 'dinos/converted/Trex.glb',
	// 	scale: 10,
	// 	color: [0.7, 0.2, 0.1],
	// },
	// diplodocus: {
	// 	path: 'dinos/GLB/Diplodocus.glb',
	// 	scale: 0.2,
	// },
	// steg: {
	// 	path: 'dinos/GLB/steg.glb',
	// 	scale: 10,
	// },
	// veloGlb: {
	// 	...defaultModel,
	// 	path: 'dinos/Exported/Velo.glb',
	// 	scale: 10,
	// 	color: [0.6, 0.2, 0.1],
	// },
	apat: {
		...defaultModel,
		path: 'dinos/FBX/Apatosaurus.fbx',
		scale: 0.1,
		color: [0.5, 0.5, 0.7],
	},
	para: {
		...defaultModel,
		path: 'dinos/FBX/Parasaurolophus.fbx',
		scale: 0.1,
		color: [0.3, 0.6, 0.6],
	},
	steg: {
		...defaultModel,
		path: 'dinos/FBX/Stegosaurus.fbx',
		scale: 0.1,
		color: [0.6, 0.6, 0.3],
	},
	trex: {
		...defaultModel,
		path: 'dinos/FBX/Trex.fbx',
		scale: 0.1,
		color: [0.65, 0.2, 0.1],
	},
	tric: {
		...defaultModel,
		path: 'dinos/FBX/Triceratops.fbx',
		scale: 0.1,
		color: [0.5, 0.7, 0.2],
	},
	velo: {
		...defaultModel,
		path: 'dinos/FBX/Velociraptor.fbx',
		scale: 0.1,
		color: [0.7, 0.5, 0.2],
	},
};
