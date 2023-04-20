import { ArrayCoords, Random, TAU } from 'rocket-utility-belt';
import Entity from './Entity.js';

class Actor extends Entity {
	constructor(options = {}) {
		super(options);
		this.alive = true;
		this.mobile = true;
		this.physics = true;
		this.mass = 60; // kg
		this.emotions = [];
		this.spiritId = options.spiritId;
		this.isActor = true;
		this.moveTarget = [0, 0, 0];
		this.cooldowns = {
			planning: 0,
			//
		};
		this.turnSpeed = TAU / 1000; // one rotation in 1000 ms (1 second)
		this.walkForce = this.walkForce || 1000;
	}

	jump() {
		if (!this.grounded) return;
		this.applyForce([0, 0, 140000]);
	}

	walk(directionOffset = 0) {
		// it feels good to walk in the air (a little bit at least)
		const m = (this.grounded) ? 1 : 0.2;
		this.applyMovementForce(this.walkForce * m, directionOffset);
	}

	heatUp(name, seconds) {
		this.cooldowns[name] = seconds;
	}

	coolDown(name, seconds = 0) {
		if (this.cooldowns[name] > 0) this.cooldowns[name] -= seconds;
		if (this.cooldowns[name] < 0) this.cooldowns[name] = 0;
	}

	updateTimers(t) {
		const seconds = t / 1000;
		['planning'].forEach((cdName) => {
			this.coolDown(cdName, seconds);
		});
	}

	updateEmotions() {

	}

	updateLook() {
		if (!this.autonomous) return 0;
	}

	updatePlan() {
		if (!this.autonomous) return 0;
		if (this.cooldowns.planning) return 0;
		if (this.wandering) {
			const deltaX = Random.randomInt(1000) - Random.randomInt(1000);
			const deltaY = Random.randomInt(1000) - Random.randomInt(1000);
			this.moveTarget = ArrayCoords.add(this.coords, [deltaX, deltaY, 0]);
			this.heatUp('planning', 20);
			// console.log(this.name, 'planning a wander');
		}
	}

	updateMovement(t) {
		if (!this.mobile || !this.autonomous) return 0;
		const CLOSE_ENOUGH = 40;
		const distanceToTarget = ArrayCoords.getDistance(this.coords, this.moveTarget);
		if (distanceToTarget < CLOSE_ENOUGH) return 0;
		const maxTurnRadians = t * this.turnSpeed;
		const remainderToTurn = this.turnToward(this.moveTarget, maxTurnRadians);
		if (remainderToTurn < 0.2) this.walk();
	}

	update(t, world) {
		this.updateTimers(t);
		this.updateEmotions(t);
		this.updateLook(t);
		this.updatePlan(t);
		this.updateMovement(t);
		this.updatePhysics(t);
	}
}

export default Actor;
