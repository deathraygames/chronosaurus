const NOOP = () => {};

class Looper {
	constructor(a) {
		this.loopHook = (typeof a === 'function') ? a : NOOP;
	}

	set(fn) {
		this.loopHook = fn;
		return this;
	}

	next() {
		this.loopHook();
		requestAnimationFrame(() => this.next());
	}

	start() {
		this.next();
		return this;
	}
}

export default Looper;
