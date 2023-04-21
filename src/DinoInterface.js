const $ = (selector) => {
	const elt = window.document.querySelector(selector);
	if (!elt) console.warn('Could not find', selector);
	return elt;
};

const SHOW_CLASS = 'ui-show';
const HIDE_CLASS = 'ui-hide';

class DinoInterface {
	// constructor() {
	// 	//
	// }

	static setText(selector, text) {
		const elt = $(selector);
		if (elt.innerText === text) return;
		elt.innerText = text;
	}

	static setHtml(selector, html) {
		const elt = $(selector);
		if (elt.innerHTML === html) return;
		elt.innerHTML = html;
	}

	static show(selector) {
		const elt = $(selector);
		elt.classList.remove(HIDE_CLASS);
		elt.classList.add(SHOW_CLASS);
	}

	static hide(selector) {
		const elt = $(selector);
		elt.classList.remove(SHOW_CLASS);
		elt.classList.add(HIDE_CLASS);
	}

	static capitalize(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	static getItemName(item) {
		let n = DinoInterface.capitalize(item.name) || 'Item';
		if (item.damage) n += ` - Damaged (${item.damage})`;
		return n;
	}

	hideLoading() {
		DinoInterface.hide('#loading');
	}

	updateInteraction(item) {
		if (!item) {
			DinoInterface.hide('#interaction-details');
			return;
		}
		DinoInterface.show('#interaction-details');
		DinoInterface.setText('#interaction-target', DinoInterface.getItemName(item));
		let actionText = item.interactionAction || 'Interact';
		const percent = item.getInteractionPercent();
		if (percent < 1) actionText += ` ${Math.floor(percent * 100)}%`;
		DinoInterface.setText('#interaction-action-name', actionText);
	}

	updateDebug(actor) {
		const html = `
			Vel: ${actor.vel.map((v) => Math.round(v * 100) / 100).join('<br>')}<br>
			Pos: ${actor.coords.map((v) => Math.round(v * 100) / 100).join('<br>')}<br>
			Grounded: ${actor.grounded}
		`;
		DinoInterface.setHtml('#debug', html);
	}

	render(interfaceUpdates = {}) {
		const { item, actor } = interfaceUpdates;
		this.updateDebug(actor);
		this.updateInteraction(item);
	}
}

export default DinoInterface;
