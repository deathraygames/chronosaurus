const NOOP = () => {};

class Looper {
	constructor(a) {
		this.loopHook = (typeof a === 'function') ? a : NOOP;
		this.lastTime = performance.now();
	}

	set(fn) {
		this.loopHook = fn;
		return this;
	}

	next() {
		const now = performance.now();
		const t = now - this.lastTime;
		this.lastTime = now;
		this.loopHook(t);
		requestAnimationFrame(() => this.next());
	}

	start() {
		this.lastTime = performance.now();
		this.next();
		return this;
	}
}

export default Looper;
