import { ArrayCoords, Random, TAU, PI, Pool } from 'rocket-utility-belt';
import Entity from './Entity.js';

const CLOSE_ENOUGH = 40; // 2m
const SLOW_DIST = 500; // 25m ~ 8 ft

class Actor extends Entity {
	constructor(options = {}) {
		super(options);
		this.alive = true;
		this.mobile = true;
		this.physics = true;
		this.mass = 60; // kg
		this.stamina = new Pool(50, 50);
		this.staminaRegenPerSecond = 5;
		this.staminaUsePerWalk = 0.2;
		this.health = new Pool(50, 50);
		this.healthRegenPerSecond = 2;
		this.tiredMultiplier = 0.5;
		this.emotions = [];
		this.spiritId = options.spiritId;
		this.isActor = true;
		this.lookTargetEntity = null;
		this.lookTargetDistance = Infinity;
		this.currentPlan = { name: 'rest', moveTarget: null };
		this.cooldowns = {
			planning: 0,
			looking: 0,
			//
		};
		// this.lookDistance = 1000;
		this.huntDistance = 0; // Goes aggro if hungry and has stamina
		this.attentionDistance = 900; // Turns and looks
		this.fleeDistance = 0; // run away
		this.maxWanderRange = 1000;
		this.turnSpeed = TAU / 1000; // (radians/ms) one rotation in 1000 ms (1 second)
		this.walkForce = 1200;
		this.jumpForce = this.walkForce * 20;
		this.setProperties(options);
	}

	jump() {
		if (!this.grounded) return false;
		let { jumpForce } = this;
		if (this.stamina.atMin()) jumpForce *= this.tiredMultiplier;
		this.applyForce([0, 0, jumpForce]);
		return true;
	}

	walk(directionOffset = 0, multiplier = 1) {
		let { walkForce } = this;
		walkForce *= multiplier;
		// it feels good to walk in the air (a little bit at least)
		if (!this.grounded) walkForce *= 0.2;
		if (this.stamina.atMin()) walkForce *= this.tiredMultiplier;
		this.applyMovementForce(walkForce, directionOffset);
		this.stamina.subtract(this.staminaUsePerWalk);
	}

	heatUp(name, seconds) {
		this.cooldowns[name] = seconds;
	}

	coolDown(name, seconds = 0) {
		if (this.cooldowns[name] > 0) this.cooldowns[name] -= seconds;
		if (this.cooldowns[name] < 0) this.cooldowns[name] = 0;
	}

	updateTimers(seconds = 0) {
		Object.keys(this.cooldowns).forEach((cdName) => {
			this.coolDown(cdName, seconds);
		});
	}

	regenerate(seconds = 0) {
		if (!this.movementForce) {
			const stamHeal = this.staminaRegenPerSecond * seconds;
			this.stamina.add(stamHeal);
		}
		const healthHeal = this.healthRegenPerSecond * seconds;
		this.health.add(healthHeal);
	}

	// updateEmotions() {
	// TODO
	// }

	updateLook(t, gameWorld) {
		if (!this.autonomous) return null;
		// Look for a new target?
		if (this.cooldowns.looking) return null;
		// Reset look - assume no target
		this.lookTargetEntity = null;
		this.lookTargetDistance = Infinity;
		this.heatUp('looking', 1);
		// Do the look in the game world
		const filter = (actor) => (actor.faction !== this.faction && actor.entityId !== this.entityId);
		const [dist, who] = gameWorld.findNearestActor(this.coords, filter);
		if (!who) return [dist, who];
		if (dist < this.fleeDistance) {
			console.log(this.name, 'wants to flee');
			// TODO: run away
			// this.heatUp('planning', 3);
		} else if (dist < this.attentionDistance
			|| dist < this.huntDistance
		) {
			this.lookTargetEntity = who;
			// console.log(this.name, 'wants to look at', who.coords);
		}
		return [dist, who];
	}

	updatePlan() {
		if (!this.autonomous) return null;
		if (this.cooldowns.planning) return null;
		if (this.stamina.atMin()) {
			// Just rest
			this.heatUp('planning', 30);
			return { name: 'rest', moveTarget: null };
		}
		// Plan based on distances
		const { lookTargetDistance } = this;
		if (lookTargetDistance < this.fleeDistance) {
			const angleToThreat = ArrayCoords.getAngleFacing(this.coords, this.lookTargetEntity.coords);
			const angleAway = (angleToThreat + PI) % TAU;
			const moveTarget = ArrayCoords.polarToCartesian(this.fleeDistance, angleAway);
			return { name: 'flee', moveTarget };
		}
		if (lookTargetDistance < this.huntDistance) {
			this.heatUp('planning', 1); // re-plan soon so we can follow
			this.moveTarget = [...this.lookTargetEntity.coords];
			return { name: 'hunt', moveTarget: null };
		}
		if (lookTargetDistance < this.attentionDistance && Random.chance(0.5)) {
			return { name: 'watch', moveTarget: null };
		}
		if (this.wandering) {
			const deltaX = Random.randomInt(this.maxWanderRange) - Random.randomInt(this.maxWanderRange);
			const deltaY = Random.randomInt(this.maxWanderRange) - Random.randomInt(this.maxWanderRange);
			const moveTarget = ArrayCoords.add(this.coords, [deltaX, deltaY, 0]);
			this.heatUp('planning', 30);
			return { name: 'wander', moveTarget };
			// console.log(this.name, 'planning a wander');
		}
		return { name: 'rest', moveTarget: null };
	}

	updateMovement(t, moveTarget) {
		if (!this.mobile || !this.autonomous) return;
		if (!moveTarget) {
			if (this.lookTargetEntity) {
				this.turnToward(this.lookTargetEntity.coords, t * this.turnSpeed);
			}
			return;
		}
		const distanceToTarget = ArrayCoords.getDistance(this.coords, moveTarget);
		if (distanceToTarget < CLOSE_ENOUGH) return;
		// Do things slower if we're near the destination
		const proximityFraction = (distanceToTarget > SLOW_DIST) ? 1 : (distanceToTarget / SLOW_DIST);
		// Don't turn faster than your turn speed
		const maxTurnRadians = t * this.turnSpeed * proximityFraction;
		const remainderToTurn = this.turnToward(moveTarget, maxTurnRadians);
		// Don't walk until we've turned
		if (remainderToTurn < 0.2) this.walk(0, proximityFraction);
	}

	update(t, world, game) {
		const seconds = t / 1000;
		this.health.clearLastDelta(); // TODO: move this somewhere else?
		this.regenerate(seconds);
		this.updateTimers(seconds);
		// this.updateEmotions(t);
		this.updateLook(t, game);
		const newPlan = this.updatePlan(t);
		if (newPlan) this.currentPlan = newPlan;
		this.updateMovement(t, this.currentPlan.moveTarget);
		this.updatePhysics(t);
	}
}

export default Actor;
