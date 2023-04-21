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
		this.terrainSegmentSize = 32; // 10; // (originally 10; 256 works for testing)
		this.terrainSegmentsPerChunk = this.chunkSize / this.terrainSegmentSize;
		// Segements: 2560/10 = 256, 2560/20 = 128, 2560/32 = 80, 2560/256 = 10
		// While the segments break up the chunk into various triangles, each side
		// of the terrain has +1 vertex compared to the # of segments
		this.terrainChunkVertexSize = this.terrainSegmentsPerChunk + 1;
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

	static calcNoiseHeight(x, y, noiseScale, altitudeScale = 1) {
		return altitudeScale * noise.perlin2(noiseScale * x, noiseScale * y);
	}

	calcTerrainHeight(xP, y) {
		// return 0;
		const x = xP + 120;
		const noiseScale = 0.002;
		// const noiseScale = 0.0002;
		const minHeight = 0;
		const maxHeight = 1000;
		// const delta = maxHeight - minHeight;
		let h = 100;
		// Add big heights
		h += DinoWorld.calcNoiseHeight(x, y, 0.0002, 800);
		h = clamp(h, minHeight, maxHeight);
		// Pokey mountains
		h += DinoWorld.calcNoiseHeight(x, y, 0.002, 600);
		// const roll = DinoWorld.calcNoiseHeight(x, y, 0.00015, 1);
		// if (roll)
		h = clamp(h, minHeight, maxHeight);

		// Add roughness
		const roughness = (h <= 2) ? 20 : 50 * (h / maxHeight);
		h += DinoWorld.calcNoiseHeight(x, y, 0.02, roughness);

		// Add ripples (negative for erosion)
		h -= 20 * (1 + Math.sin(noiseScale * x + 10 * noise.perlin3(noiseScale * x, noiseScale * 2 * y, 0)));
		h = clamp(h, minHeight, maxHeight);
		// h += DinoWorld.calcNoiseHeight(x, y, 0.00021, 200);
		// this.validateNumbers({ h, h2 });
		return h;
	}

	getTerrainHeight(x, y) {
		return this.calcTerrainHeight(x, y);
	}

	getChunkCoord(n) {
		this.validateNumbers({ n }, 'getChunkCoord');
		// const round = (n < 0) ? Math.ceil : Math.floor;
		return Math.round(n / this.chunkSize);
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
		return [center[X] - this.halfChunkSize, center[Y] + this.halfChunkSize, 0];
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

	makeChunkCanvas(size) {
		const canvas = document.createElement('canvas');
		canvas.width = size * 1;
		canvas.height = size * 1;
		const ctx = canvas.getContext('2d');
		return { canvas, ctx };
	}

	makeTerrainChunk(chunkCoords) {
		if (!chunkCoords) throw new Error('makeTerrainChunk missing chunkCoords');
		const debug = [];
		const heights = [];
		const topLeft = this.getChunkTopLeftCoords(chunkCoords);
		const center = this.getChunkCenterCoords(chunkCoords);
		const chunkId = this.getChunkId(chunkCoords);
		const dataSize = this.terrainChunkVertexSize;
		const { canvas, ctx } = this.makeChunkCanvas(dataSize);
		// x and y here are steps along the terrain segments, not actual world x,y coordinates
		let x;
		let y;
		for (y = 0; y < dataSize; y += 1) {
			if (!heights[y]) heights[y] = [];
			if (!debug[y]) debug[y] = [];
			for (x = 0; x < dataSize; x += 1) {
				// Convert the x, y steps to actual world x, y
				const convSize = this.terrainSegmentSize;
				const worldX = topLeft[X] + (x * convSize);
				const worldY = topLeft[Y] - (y * convSize);
				this.validateNumbers({ worldX, worldY });
				const h = this.calcTerrainHeight(worldX, worldY);
				// if (y === 0) console.log('y = 0', x, h);
				heights[y][x] = h;
				// console.log('step x,y', x, y, '--> world', worldX, worldY, 'h', h);
				// if( x > 10) throw new Error();
				const hmh = Math.min(Math.max(Math.round(h), 0), 255);
				ctx.fillStyle = `rgba(${hmh},${hmh},${hmh},1)`;
				// if (Math.round(worldX) < 1) ctx.fillStyle = `rgba(255,${hmh},${hmh},1)`;
				// if (Math.round(worldY) < 1) ctx.fillStyle = `rgba(255,255,${hmh},1)`;
				// ctx.fillStyle = `rgb(${hmh},${hmh},${hmh})`;
				// ctx.fillRect(x * 2, y * 2, 2, 2);
				ctx.fillRect(x * 1, y * 1, 1, 1);
			}
		}
		const image = new Image();
		image.src = canvas.toDataURL();
		// This is beyond stupid, but the image is somehow not loaded
		// even though we just created it and populated it synchronously.
		// So we have to wait for the image to load...
		// const waitForImage = (img) => (
		// 	new Promise((resolve, reject) => {
		// 		img.onload = resolve;
		// 		img.onerror = reject;
		// 	})
		// );
		// console.log(image.complete);
		// await waitForImage(image);
		// console.log(image.complete);

		// document.getElementById('map').innerHTML = '';
		// document.getElementById('map').appendChild(image);
		return {
			color: (chunkCoords[X] - chunkCoords[Y] === 0) ? 0x55ffbb : 0x66eeaa,
			textureImage: image,
			image,
			heights,
			entityId: chunkId,
			center,
			size: this.chunkSize,
			segments: this.terrainSegmentsPerChunk,
			vertexDataSize: dataSize,
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

	makeTerrainChunks(coords, chunkRadius = 1) {
		if (!coords) throw new Error('Missing coords param');
		const centerChunkCoords = this.getChunkCoords(coords);
		// const centerChunk = this.addNewTerrainChunk(centerChunkCoords);
		// return [centerChunk];
		const chunks = [];
		const MAX = Math.round(chunkRadius);
		const MIN = -MAX;
		for (let x = MIN; x <= MAX; x += 1) {
			for (let y = MIN; y <= MAX; y += 1) {
				const newChunkCoords = ArrayCoords.add(centerChunkCoords, [x, y, 0]);
				const chunk = this.addNewTerrainChunk(newChunkCoords);
				chunks.push(chunk);
			}
		}
		return chunks;
	}
}

export default DinoWorld;
