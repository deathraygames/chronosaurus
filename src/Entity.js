import { Random, ArrayCoords } from 'rocket-utility-belt';

class Entity {
	constructor() {
		this.entityId = Random.uniqueString();
		this.isEntity = true;
		this.coords = [0, 0, 0];
		this.facing = 0; // radians
		this.tags = [];
		this.renderAs = 'box';
		this.color = 0xffffff;
	}

	getCoords() {
		return [...this.coords];
	}

	setX(x) { this.coords[ArrayCoords.X] = x; }

	setY(y) { this.coords[ArrayCoords.Y] = y; }

	setZ(z) { this.coords[ArrayCoords.Z] = z; }

	moveTo(coords) {
		const [x, y, z] = coords;
		if (typeof x === 'number') this.coords[0] = x;
		if (typeof y === 'number') this.coords[1] = y;
		if (typeof z === 'number') this.coords[2] = z;
	}

	move(relativeCoords = []) {
		this.moveTo(ArrayCoords.add(this.coords, relativeCoords));
	}

	turn(relativeRadians = 0) {
		this.facing += relativeRadians;
	}

	getTags() {
		return this.tags;
	}

	hasTag(tag) {
		const blobTags = this.getTags();
		return blobTags.includes(tag);
	}

	hasOneOfTags(tags = []) {
		const blobTags = this.getTags();
		const matchingTags = blobTags.filter((tag) => tags.includes(tag));
		return (matchingTags.length > 0);
	}
}

export default Entity;
