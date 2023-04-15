import Entity from './Entity.js';

class Actor extends Entity {
	constructor(options = {}) {
		super(options);
		this.spiritId = options.spiritId;
		this.isActor = true;
	}
}

export default Actor;
