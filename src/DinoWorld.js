import { PseudoRandomizer, ArrayCoords, clamp } from 'rocket-utility-belt';
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
		const noiseScale = 0.002;
		const minHeight = 0;
		const maxHeight = 100;
		const delta = maxHeight - minHeight;
		const noiseValue = noise.perlin2(noiseScale * x, noiseScale * y);
		let h = clamp(minHeight + (delta * noiseValue), 0, maxHeight);
		// Add this just to make the terrain more pronounced
		if (x < 0 && y < 0) h += 100;
		else if (x < 0) h = 0;
		// Alternative
		// const h2 = 50 * (1 + Math.sin(noiseScale * x + 10 * noise.perlin3(noiseScale * x, noiseScale * 2 * y, 0)));
		// this.validateNumbers({ h, h2 });
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
		const y = this.getChunkCoord(coords[Y]);
		const z = 0; // right now we don't do chunking up/down
		return [x, y, z];
	}

	getChunkTopLeftCoords(chunkCoords) {
		const center = this.getChunkCenterCoords(chunkCoords);
		return [center[X] - this.halfChunkSize, center[Y] - this.halfChunkSize, 0];
	}

	getChunkCenterCoords(chunkCoords) {
		if (!chunkCoords) throw new Error();
		const centerX = chunkCoords[X] * this.chunkSize;
		const centerY = chunkCoords[Y] * this.chunkSize;
		return [centerX, centerY, 0];
	}

	getChunkId(chunkCoords) {
		if (!chunkCoords) throw new Error();
		return `terrain-chunk-${chunkCoords.join(',')}`;
	}

	makeChunkCanvas() {
		const canvas = document.createElement('canvas');
		canvas.width = this.terrainSegmentsPerChunk;
		canvas.height = this.terrainSegmentsPerChunk;
		const ctx = canvas.getContext('2d');
		return { canvas, ctx };
	}

	async makeTerrainChunk(chunkCoords) {
		if (!chunkCoords) throw new Error('makeTerrainChunk missing chunkCoords');
		const debug = [];
		const heights = [];
		const topLeft = this.getChunkTopLeftCoords(chunkCoords);
		const center = this.getChunkCenterCoords(chunkCoords);
		const chunkId = this.getChunkId(chunkCoords);
		const { canvas, ctx } = this.makeChunkCanvas();
		// x and y here are steps along the terrain segments, not actual world x,y coordinates
		let x;
		let y;
		const size = this.terrainSegmentsPerChunk + 2;
		for (y = 0; y <= size; y += 1) {
			if (!heights[y]) heights[y] = [];
			if (!debug[y]) debug[y] = [];
			for (x = 0; x <= size; x += 1) {
				// Convert the x, y steps to actual world x, y
				const worldX = topLeft[X] + (x * this.terrainSegmentSize);
				const worldY = topLeft[Y] + (y * this.terrainSegmentSize);
				this.validateNumbers({ worldX, worldY });
				const h = this.calcTerrainHeight(worldX, worldY);
				heights[y][x] = h;
				// console.log(x, y, '-->', worldX, worldY, heights[y][x]);
				// if( x > 10) throw new Error();
				const hmh = Math.min(Math.max(Math.round(h), 0), 255);
				ctx.fillStyle = `rgba(${hmh},${hmh},${hmh},1)`;
				// ctx.fillStyle = `rgb(${hmh},${hmh},${hmh})`;
				ctx.fillRect(x, y, 1, 1);
			}
		}
		const image = new Image();
		image.src = canvas.toDataURL();
		// This is beyond stupid, but the image is somehow not loaded
		// even though we just created it and populated it synchronously.
		// So we have to wait for the image to load...
		const waitForImage = (img) => (
			new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
			})
		);
		// console.log(image.complete);
		await waitForImage(image);
		// console.log(image.complete);

		document.getElementById('map').innerHTML = '';
		document.getElementById('map').appendChild(image);
		return {
			image,
			heights,
			entityId: chunkId,
			center,
			size: this.chunkSize,
			segments: this.terrainSegmentsPerChunk,
		};
	}

	async addNewTerrainChunk(chunkCoords) {
		const chunkId = this.getChunkId(chunkCoords);
		// Get it from cache if its already been created
		if (this.terrainChunksCache[chunkId]) return this.terrainChunksCache[chunkId];
		// Otherwise create it
		const chunk = await this.makeTerrainChunk(chunkCoords);
		// ...and cache it
		this.terrainChunksCache[chunk.entityId] = chunk;
		return chunk;
	}

	async makeTerrainChunks(coords) {
		if (!coords) throw new Error('Missing coords param');
		const chunkCoords = this.getChunkCoords(coords);
		const centerChunk = await this.addNewTerrainChunk(chunkCoords);
		return [
			centerChunk,
		];
	}
}

export default DinoWorld;
