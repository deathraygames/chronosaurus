import { PseudoRandomizer, ArrayCoords } from 'rocket-utility-belt';
import noise from 'noise-esm';
const { X, Y, Z } = ArrayCoords;

class DinoWorld {
	constructor() {
		const todaysSeed = PseudoRandomizer.getPseudoRandInt(Number(new Date()), 1000);
		this.seed = todaysSeed;
		// Sizes are measured in integer "units"
		// 20 units = 1m = 100cm
		// 1 unit = 5cm
		this.unitsPerMeter = 20;
		// A chunk with size of 128m is roughly the size of ~10 houses.
		// A collection of 3x3 chunks would be 384m, larger than a nyc city block (274m)
		this.chunkSizeMeters = 128;
		this.chunkSize = this.unitsPerMeter * this.chunkSizeMeters; // 2560 units
		this.halfChunkSize = this.chunkSize / 2;
		this.terrainSegmentSize = 10;
		this.terrainSegmentsPerChunk = this.chunkSize / this.terrainSegmentSize; // 256
		this.terrainChunksCache = {};
	}

	validateNumbers(objOfValues, ...args) {
		Object.keys(objOfValues).forEach((key) => {
			const n = objOfValues[key];
			if (typeof n !== 'number' || Number.isNaN(n)) {
				console.error(args);
				throw new Error(`${key} is not a number`);
			}
		});
	}

	calcTerrainHeight(x, y) {
		const noiseScale = 0.02;
		const minHeight = -100;
		const maxHeight = 500;
		const delta = maxHeight - minHeight;
		const noiseValue = noise.perlin2(noiseScale * x, noiseScale * y);
		// TODO: FIXME -- noiseValue is coming back as 0
		const h = minHeight + (delta * noiseValue);
		// console.log(noiseValue);
		const h2 = 50 * (1 + Math.sin(noiseScale * x + 10 * noise.perlin3(noiseScale * x, noiseScale * 2 * y, 0)));
		// console.log(h, h2, '...', noiseValue);
		this.validateNumbers({ h, h2 });
		return h;
	}

	getTerrainHeight(x, y) {
		return this.calcTerrainHeight(x, y);
	}

	getChunkCoord(n) {
		this.validateNumbers({ n }, 'getChunkCoord');
		const round = (n < 0) ? Math.ceil : Math.floor;
		return round(n / this.chunkSize);
	}

	/** Get chunk-level x,y,z coordinates from world x,y,z coordinates */
	getChunkCoords(coords) {
		const x = this.getChunkCoord(coords[X]);
		const y = 0; // right now we don't do chunking up/down
		const z = this.getChunkCoord(coords[Z]);
		return [x, y, z];
	}

	getChunkTopLeftCoords(chunkCoords) {
		const center = this.getChunkCenterCoords(chunkCoords);
		return [center[X] - this.halfChunkSize, 0, center[Z] - this.halfChunkSize];
	}

	getChunkCenterCoords(chunkCoords) {
		if (!chunkCoords) throw new Error();
		const centerX = chunkCoords[X] * this.chunkSize;
		const centerZ = chunkCoords[Z] * this.chunkSize;
		return [centerX, 0, centerZ];
	}

	getChunkId(chunkCoords) {
		if (!chunkCoords) throw new Error();
		return `terrain-chunk-${chunkCoords.join(',')}`;
	}

	makeTerrainChunk(chunkCoords) {
		if (!chunkCoords) throw new Error('makeTerrainChunk missing chunkCoords');
		const heights = [];
		const topLeft = this.getChunkTopLeftCoords(chunkCoords);
		const center = this.getChunkCenterCoords(chunkCoords);
		const chunkId = this.getChunkId(chunkCoords);
		let x;
		let y;
		const size = this.terrainSegmentsPerChunk + 2;
		for (y = 0; y <= size; y += 1) {
			if (!heights[y]) heights[y] = [];
			for (x = 0; x <= size; x += 1) {
				// const h = Math.round(Math.sin(x) * 100 + Math.sin(y) * 50);
				const worldX = topLeft[X] + x;
				const worldY = topLeft[Z] + y;
				// Note: there's a z --> y conversion happening here
				this.validateNumbers({ worldX, worldY });
				heights[y][x] = this.calcTerrainHeight(worldX, worldY);
			}
		}
		return {
			heights,
			entityId: chunkId,
			center,
			size: this.chunkSize,
			segments: this.terrainSegmentsPerChunk,
		};
	}

	addNewTerrainChunk(chunkCoords) {
		const chunkId = this.getChunkId(chunkCoords);
		// Get it from cache if its already been created
		if (this.terrainChunksCache[chunkId]) return this.terrainChunksCache[chunkId];
		// Otherwise create it
		const chunk = this.makeTerrainChunk(chunkCoords);
		// ...and cache it
		this.terrainChunksCache[chunk.entityId] = chunk;
		return chunk;
	}

	makeTerrainChunks(coords) {
		if (!coords) throw new Error('Missing coords param');
		const chunkCoords = this.getChunkCoords(coords);
		const centerChunk = this.addNewTerrainChunk(chunkCoords);
		return [
			centerChunk,
		];
	}
}

export default DinoWorld;
