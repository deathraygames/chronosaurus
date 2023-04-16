import { Observer } from 'keyboard-commander';

class PointerLocker extends Observer {
	constructor(options = {}) {
		super();
		this.selector = options.selector || 'canvas';
		this.unlockEventName = options.unlockEventName || 'mousedown'; // contextmenu, click
		this.lockEventName = options.lockEventName || 'mousedown'; // or click
		this.clickTypes = ['click', 'mouseup', 'mousedown'];
		this.lockButton = 3;
		this.unlockButton = 3;
		this.handleLockedMouseMove = (event) => {
			const x = event.movementX;
			const y = event.movementY;
			this.trigger('lockedMouseMove', { x, y });
			// console.log({ x, y });
		};
		this.handleLock = async (event) => {
			// console.log('handleLock', event);
			if (this.clickTypes.includes(event.type)) {
				if (event.which !== this.lockButton) return;
			}
			// console.log('Preventing default, then locking');
			event.preventDefault();
			await this.lock();
		};
		this.handleLockUnlock = async (event) => {
			// console.log('handleLockUnlock - isLocked?', this.isLocked());
			if (this.isLocked()) {
				await this.handleUnlock(event);
				return;
			}
			await this.handleLock(event);
		};
		this.handleUnlock = async (event) => {
			// console.log('handleUnlock', event);
			if (this.clickTypes.includes(event.type)) {
				if (event.which !== this.unlockButton) return;
			}
			// console.log('Preventing default, then locking');
			event.preventDefault();
			await this.unlock();
		};
		this.doc = window.document;
		if (this.getElement()) this.setup();
	}

	getElement() {
		return this.doc.querySelector(this.selector);
	}

	isLocked() {
		return Boolean(this.doc.pointerLockElement);
	}

	async toggleLock() {
		const methodName = (this.isLocked()) ? 'unlock' : 'lock';
		await this[methodName]();
	}

	async lock() {
		if (this.doc.pointerLockElement) {
			console.warn('already locked');
			return;
		}
		await this.getElement().requestPointerLock();
	}

	async unlock() {
		const elt = this.getElement();
		if (this.doc.pointerLockElement !== elt) {
			console.warn('pointerLockElement is not element we expected. Cannot unlock.', this.doc.pointerLockElement);
			return;
		}
		await document.exitPointerLock();
	}

	setup() {
		const elt = this.getElement();
		this.doc.addEventListener('pointerlockchange', () => {
			if (this.doc.pointerLockElement === elt) {
				this.doc.addEventListener('mousemove', this.handleLockedMouseMove, false);
			} else {
				this.doc.removeEventListener('mousemove', this.handleLockedMouseMove, false);
			}
		});
		if (this.unlockEventName === this.lockEventName) {
			elt.addEventListener(this.lockEventName, this.handleLockUnlock, false);
		} else {
			elt.addEventListener(this.unlockEventName, this.handleUnlock, false);
			elt.addEventListener(this.lockEventName, this.handleLock, false);
		}
		return this;
	}
}

export default PointerLocker;
