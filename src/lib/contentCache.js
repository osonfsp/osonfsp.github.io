// Materiallar keshi IndexedDB'da: kontent bir necha MB, localStorage (~5 MB) ga sig'maydi.
// Har qanday xato (yashirin rejim, cheklov) — keshsiz ishlaymiz: materiallar serverdan qayta olinadi.
const DB = "fsp",
  STORE = "kv",
  KEY = "content",
  LEGACY_KEY = "fsp.content"; // eski localStorage keshi — o'chiriladi

function open() {
  return new Promise((ok, fail) => {
    let r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fail(r.error);
    r.onblocked = () => fail(new Error("blocked"));
  });
}

async function run(mode, fn) {
  let db = await open();
  return new Promise((ok, fail) => {
    let t = db.transaction(STORE, mode),
      req = fn(t.objectStore(STORE));
    t.oncomplete = () => (db.close(), ok(req?.result));
    t.onerror = t.onabort = () => (db.close(), fail(t.error));
  });
}

// Ba'zi brauzerlarda IndexedDB javob bermay qolishi mumkin — ilova ochilishini kutib qolmasin
const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, fail) => setTimeout(() => fail(new Error("timeout")), ms))]);

export const contentCache = {
  async get() {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {}
    try {
      return (
        (await withTimeout(
          run("readonly", (s) => s.get(KEY)),
          3000,
        )) ?? null
      );
    } catch {
      return null;
    }
  },
  set: (value) =>
    withTimeout(
      run("readwrite", (s) => s.put(value, KEY)),
      10000,
    ).catch(() => {}),
  remove: () =>
    withTimeout(
      run("readwrite", (s) => s.delete(KEY)),
      3000,
    ).catch(() => {}),
};
