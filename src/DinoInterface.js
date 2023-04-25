/* eslint-disable class-methods-use-this */

const SHOW_CLASS = 'ui-show';
const HIDE_CLASS = 'ui-hide';

function round(n = 0, m = 100) {
	return Math.round(n * m) / m;
}

class DinoInterface {
	constructor() {
		this.log = [];
		this.lastDisplayedLogLength = 0;
		this.logShow = 3;
		this.borderSelector = '#hud';
	}

	static $(selector) {
		const elt = window.document.querySelector(selector);
		if (!elt) console.warn('Could not find', selector);
		return elt;
	}

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

	showDead() { DinoInterface.show('#dead'); }

	hideDead() { DinoInterface.hide('#dead'); }

	addToLog(messages) {
		if (!messages || !messages.length) return;
		if (messages instanceof Array) this.log = this.log.concat(messages);
		else this.log.push(messages); // string hopefully
	}

	flashBorder(color = '#f00', duration = 1000) {
		const elt = DinoInterface.$(this.borderSelector);
		const keyFrames = [ // Keyframes
			{ borderColor: color },
			{ borderColor: 'transparent' },
		];
		const keyFrameSettings = { duration, direction: 'alternate', easing: 'linear' };
		const effect = new KeyframeEffect(elt, keyFrames, keyFrameSettings);
		const animation = new Animation(effect, document.timeline);
		animation.play();
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
		DinoInterface.setText('#interaction-tip', (item.interactionEffort) ? 'Hold' : '');
	}

	updateDebug(debug, actor) {
		const html = `
			Last delta T: ${round(debug.lastDeltaT)}<br>
			Vel: ${actor.vel.map((v) => round(v)).join('<br>')}<br>
			Pos: ${actor.coords.map((v) => round(v)).join('<br>')}<br>
			Grounded: ${actor.grounded}
		`;
		DinoInterface.setHtml('#debug', html);
	}

	updateScanner(scannerItemPercentages = []) {
		const numbers = scannerItemPercentages
			.map((n) => Math.max(1, round(100 * n))) // No less than 1%, and round to .00
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

	updateStats(actor) { // actor is main character
		const statBars = [
			{ name: 'stamina', value: actor.stamina.get(), barClass: 'stat-bar-stamina' },
			{ name: 'health', value: actor.health.get(), barClass: 'stat-bar-health' },
		];
		const listItems = statBars.map((bar) => `<li class="stat-bar ${bar.barClass}" style="height: ${bar.value}%;">
			<span>${bar.name} ${bar.value}</span>
		</li>`);
		DinoInterface.setHtml('#stat-list', listItems.join(''));
		if (actor.health.lastDelta < 0) {
			this.flashBorder('#933f45');
		}
	}

	updateClock(worldTimeArray) {
		const [hours, minutes] = worldTimeArray;
		const hourDegrees = Math.round((hours / 12) * 360);
		const minutesDegrees = Math.round((minutes / 60) * 360);
		DinoInterface.$('#world-clock .clock-hour-hand').style.transform = `rotate(${hourDegrees}deg)`;
		DinoInterface.$('#world-clock .clock-minute-hand').style.transform = `rotate(${minutesDegrees}deg)`;
		const minutesStr = ((minutes < 10) ? '0' : '') + minutes;
		DinoInterface.setText('#world-clock .clock-text', [hours, minutesStr].join(':'));
	}

	render(interfaceUpdates = {}) {
		const {
			item, actor, scannerItemPercentages, inventory, debug, worldTimeArray,
		} = interfaceUpdates;
		this.updateLog();
		if (debug) this.updateDebug(debug, actor);
		this.updateInteraction(item);
		this.updateScanner(scannerItemPercentages);
		this.updateStats(actor);
		this.updateClock(worldTimeArray);
		this.updateLog();
		this.updateInventory(inventory);
	}
}

export default DinoInterface;
