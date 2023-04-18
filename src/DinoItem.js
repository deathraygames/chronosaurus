import { ArrayCoords, clamp } from 'rocket-utility-belt';

import Entity from './Entity.js';

class DinoItem extends Entity {
	constructor(properties = {}) {
		super(properties);
		this.interactionProgress = 0;
	}

	static isItemInteractable(item) {
		return Boolean(
			item.interactionRange && item.interactionAction && item.interactionResult,
		);
	}

	static isItemInRangeInteractable(item, coords) {
		if (!DinoItem.isItemInteractable(item)) return false;
		const distance = ArrayCoords.getDistance(item.coords, coords);
		return (distance <= item.interactionRange);
	}

	static interact(item, who, amount) {
		if (!item) return 0;
		return item.interact(who, amount);
	}

	getInteractionPercent() {
		if (!this.interactionEffort) return 1;
		return clamp(this.interactionProgress / this.interactionEffort);
	}

	interact(who, amount = 0) {
		if (!DinoItem.isItemInRangeInteractable(this, who.coords)) return 0;
		if (this.interactionEffort) {
			this.interactionProgress += amount;
			const percent = this.getInteractionPercent();
			if (percent < 1) return percent;
		}
		// either no effort is needed, or we're done with the progress
		if (!this.interactionResult) {
			console.warn('No interaction result for item');
			return 1;
		}
		Object.keys(this.interactionResult).forEach((resultKey) => {
			if (resultKey === 'modify') {
				const { modify } = this.interactionResult;
				Object.keys(modify).forEach((propName) => {
					this[propName] = modify[propName];
				});
			} else if (resultKey === 'pickUp' && this.interactionResult.pickUp) {
				const added = who.addToInventory(this);
				this.remove = added;
			}
			// else -- things like spawning something, damage, effects
		});
		return 1;
	}
}

export default DinoItem;
