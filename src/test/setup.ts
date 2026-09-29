class StoragePolyfill {
    private map = new Map<string, string>();
    get length() {
        return this.map.size;
    }
    getItem(k: string) {
        return this.map.has(k) ? this.map.get(k)! : null;
    }
    setItem(k: string, v: string) {
        this.map.set(String(k), String(v));
    }
    removeItem(k: string) {
        this.map.delete(k);
    }
    clear() {
        this.map.clear();
    }
    key(i: number) {
        return [...this.map.keys()][i] ?? null;
    }
}

// Node 22+ claims localStorage with a getter that returns undefined.
// jsdom refuses to override existing globals. So we install our own.
const storage = new StoragePolyfill();
Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
});
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
        value: storage,
        configurable: true,
        writable: true,
    });
}
