import { Random, ArrayCoords, clamp } from 'rocket-utility-belt';

const { X, Y, Z } = ArrayCoords;

class Entity {
	constructor(properties = {}) {
		this.entityId = Random.uniqueString();
		this.isEntity = true;
		this.coords = [0, 0, 0];
		this.facing = 0; // radians
		this.vel = [0, 0, 0];
		this.acc = [0, 0, 0];
		// Good to stop velocity from skyrocketing
		this.maxVelocity = 500;
		this.movementForce = 0; // track movement force just to know when entity is moving on its own
		this.tags = [];
		this.renderAs = 'box';
		this.color = 0xffffff;
		this.inventory = [];
		this.inventorySize = 0;
		this.heightSizeOffset = 0.5;
		this.size = 2;
		this.remove = false;
		Object.keys(properties).forEach((key) => {
			this[key] = JSON.parse(JSON.stringify(properties[key]));
		});
	}

	/* eslint-disable no-param-reassign */
	static setX(entity, x) { entity.coords[X] = x; }

	static setY(entity, y) { entity.coords[Y] = y; }

	static setZ(entity, z) { entity.coords[Z] = z; }
	/* eslint-enable no-param-reassign */

	setX(x) { this.coords[X] = x; }

	setY(y) { this.coords[Y] = y; }

	setZ(z) { this.coords[Z] = z; }

	getCoords() {
		return [...this.coords];
	}

	setGrounded(grounded, h) {
		this.grounded = grounded;
		if (typeof h === 'number' && grounded) this.setZ(h);
	}

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
		const entityTags = this.getTags();
		return entityTags.includes(tag);
	}

	hasOneOfTags(tags = []) {
		const entityTags = this.getTags();
		const matchingTags = entityTags.filter((tag) => tags.includes(tag));
		return (matchingTags.length > 0);
	}

	addToInventory(thing) {
		const itemsInInv = this.inventory.filter((item) => item);
		if (itemsInInv.length < this.inventorySize) {
			this.inventory.push(thing);
			return true;
		}
		return false;
	}

	applyForce(force = []) {
		if (!this.mass) return;
		const accDueToForce = ArrayCoords.multiply(force, (1 / this.mass));
		this.acc = ArrayCoords.add(this.acc, accDueToForce);
		// if (this.isCharacter) console.log(JSON.stringify(this.acc));
	}

	applyMovementForce(force = 0, direction = 0) {
		const angleOfForce = (this.facing + direction); // not sure why we need to negate this
		const directedForce = [
			force * Math.sin(angleOfForce),
			force * Math.cos(angleOfForce),
			0,
		];
		this.applyForce(directedForce);
		this.movementForce = force;
	}

	updatePhysics(t, options = {}) {
		if (!this.physics) return 0;
		const seconds = t / 1000;
		const {
			gravity = [0, 0, -4],
			groundFriction = 0.95,
			airFriction = 0.9999,
			accelerationDecay = 0.9,
		} = options;
		// Velocity
		const deltaVel = ArrayCoords.multiply(this.acc, seconds);
		this.vel = ArrayCoords.add(this.vel, deltaVel);
		if (!this.grounded) this.vel = ArrayCoords.add(this.vel, gravity);
		this.vel = ArrayCoords.clampEachCoord(this.vel, -this.maxVelocity, this.maxVelocity);
		const deltaPos = ArrayCoords.multiply(this.vel, seconds);
		this.coords = ArrayCoords.add(this.coords, deltaPos);
		// Acceleration due to force is only momentary
		// this.acc = [0, 0, 0];
		/// ...but let's try to make it last a little longer?
		this.acc = ArrayCoords.multiply(this.acc, accelerationDecay);
		// Friction
		let friction = (this.grounded) ? groundFriction : airFriction;
		if (this.movementForce) friction = 1; // no friction if moving/walking
		this.vel = ArrayCoords.multiply(this.vel, friction);
		this.vel = [
			(Math.abs(this.vel[X]) < 0.001) ? 0 : this.vel[X],
			(Math.abs(this.vel[Y]) < 0.001) ? 0 : this.vel[Y],
			(Math.abs(this.vel[Z]) < 0.001) ? 0 : this.vel[Z],
		];
		this.movementForce = 0;
	}

	update(t) {
		// this.updateTimers(t);
		this.updatePhysics(t);
	}
}

export default Entity;
