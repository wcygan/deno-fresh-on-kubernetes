// tiny in-memory TTL cache suitable for Deno/Containers
type Entry<T> = { v: T; exp: number };

export class TTLCache<T> {
  #map = new Map<string, Entry<T>>();

  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const e = this.#map.get(key);
    if (!e) return;
    if (Date.now() > e.exp) {
      this.#map.delete(key);
      return;
    }
    return e.v;
  }

  set(key: string, v: T) {
    this.#map.set(key, { v, exp: Date.now() + this.ttlMs });
  }

  clear() {
    this.#map.clear();
  }

  size() {
    return this.#map.size;
  }
}
