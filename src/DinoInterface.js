const SHOW_CLASS = 'ui-show';
const HIDE_CLASS = 'ui-hide';

class DinoInterface {
	constructor() {
		this.log = [];
		this.lastDisplayedLogLength = 0;
		this.logShow = 3;
	}

	static $(selector) {
		const elt = window.document.querySelector(selector);
		if (!elt) console.warn('Could not find', selector);
		return elt;
	};

	static setText(selector, text) {
		const elt = DinoInterface.$(selector);
		if (elt.innerText === text) return;
		elt.innerText = text;
	}

	static setHtml(selector, html) {
		const elt = DinoInterface.$(selector);
		if (elt.innerHTML === html) return;
		elt.innerHTML = html;
	}

	static show(selector) {
		const elt = DinoInterface.$(selector);
		elt.classList.remove(HIDE_CLASS);
		elt.classList.add(SHOW_CLASS);
	}

	static hide(selector) {
		const elt = DinoInterface.$(selector);
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

	show(selector) { DinoInterface.show(selector); }

	hide(selector) { DinoInterface.hide(selector); }

	showLoading() { DinoInterface.show('#loading'); }

	hideLoading() { DinoInterface.hide('#loading'); }

	showWin() { DinoInterface.show('#win'); }

	hideWin() { DinoInterface.hide('#win'); }

	showMainMenu() { DinoInterface.show('#main-menu'); }

	hideMainMenu() { DinoInterface.hide('#main-menu'); }

	showHud() { DinoInterface.show('#hud'); }

	hideHud() { DinoInterface.hide('#hud'); }

	addToLog(messages) {
		if (!messages || !messages.length) return;
		if (messages instanceof Array) this.log = this.log.concat(messages);
		else this.log.push(messages); // string hopefully
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

	updateScanner(scannerItemPercentages = []) {
		const numbers = scannerItemPercentages
			.map((n) => Math.max(1, Math.round(10000 * n) / 100)) // No less than 1%, and round to .00
			.sort((a, b) => (a - b));
		const listItems = numbers.map((n) => `<li class="scan-bar" style="height: ${n}%;"><span>${n}</span></li>`);
		DinoInterface.setHtml('#scans', listItems.join(''));
	}

	updateLog() {
		if (this.log.length === this.lastDisplayedLogLength) return; // No changes
		this.lastDisplayedLogLength = this.log.length;
		const latest = this.log.slice(this.logShow * -1);
		const listItems = latest.map((message) => `<li>${message}</li>`);
		DinoInterface.setHtml('#log-list', listItems.join(''));
	}

	updateInventory(inventory = []) {
		const listItems = inventory.map((item) => `<li class="${(!item) ? 'inv-empty' : ''}">${item}</li>`);
		DinoInterface.setHtml('#inv-list', listItems.join(''));
	}

	render(interfaceUpdates = {}) {
		const { item, actor, scannerItemPercentages, inventory } = interfaceUpdates;
		this.updateLog();
		// this.updateDebug(actor);
		this.updateInteraction(item);
		this.updateScanner(scannerItemPercentages);
		this.updateLog();
		this.updateInventory(inventory);
	}
}

export default DinoInterface;
