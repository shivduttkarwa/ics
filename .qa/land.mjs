// Films a split title landing with WAAPI slowed 10x (Animation.setPlaybackRate keeps it on the compositor), diffs the title's box
// frame by frame and reports change up to the finish and after it. The viewport is captured whole and cropped: captureScreenshot's clip is in page coordinates.
// Usage: node .qa/land.mjs <url> <width> <height> <dpr> <mobile 0|1> <title index among non-hero split titles> <outDir>
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

const [url, width, height, dprArg, mobile, indexArg, outDir] = process.argv.slice(2);
const dpr = +dprArg;
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "land-"));
const chrome = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ["--headless=new", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--autoplay-policy=no-user-gesture-required", "about:blank"],
  { stdio: "ignore" }
);
const finish = (code) => {
  try { execSync(`taskkill /PID ${chrome.pid} /T /F`, { stdio: "ignore" }); } catch {}
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch {}
  process.exit(code);
};
setTimeout(() => { console.error("timed out"); finish(1); }, 150000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let version;
for (let i = 0; i < 60 && !version; i++) {
  try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(250); }
}
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
let session;
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params, sessionId: session })); });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) console.error("eval error", JSON.stringify(r.result.exceptionDetails).slice(0, 300));
  return r.result?.result?.value;
};

const { result: { targetId } } = await new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method: "Target.createTarget", params: { url: "about:blank" } })); });
({ result: { sessionId: session } } = await new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method: "Target.attachToTarget", params: { targetId, flatten: true } })); }));
await send("Page.enable");
await send("Runtime.enable");
await send("Animation.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +width, height: +height, deviceScaleFactor: dpr, mobile: mobile === "1" });
if (mobile === "1") await send("Emulation.setTouchEmulationEnabled", { enabled: true });
await send("Page.navigate", { url });
await sleep(4000);
await send("Page.bringToFront");
await send("Emulation.setFocusEmulationEnabled", { enabled: true });

// the title to film: the nth split title that is not hero tier
const info = await evaluate(`(() => {
  const titles = [...document.querySelectorAll('[data-anim="split"]')].filter((el) => el.getAttribute("data-anim-tier") !== "hero");
  const el = titles[${+indexArg}];
  if (!el) return null;
  el.setAttribute("data-land-probe", "");
  const box = el.getBoundingClientRect();
  return { text: el.textContent.trim().slice(0, 60), top: box.top + window.scrollY, height: box.height, left: box.left, width: box.width, lh: getComputedStyle(el).lineHeight, fs: getComputedStyle(el).fontSize, dpr: window.devicePixelRatio };
})()`);
if (!info) { console.error("no title"); finish(1); }
console.log("title:", JSON.stringify(info));

await send("Animation.setPlaybackRate", { playbackRate: 0.1 });
// scroll so the title sits at 70% of the screen, past its 88% start
await evaluate(`window.scrollTo(0, Math.round(${info.top} - innerHeight * 0.7))`);
await sleep(400);
const box = await evaluate(`(() => { const b = document.querySelector('[data-land-probe]').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; })()`);
const pad = 24;
const clip = { x: Math.max(0, box[0] - pad), y: Math.max(0, box[1] - pad), width: box[2] + pad * 2, height: box[3] + pad * 2, scale: 1 };
console.log("clip:", JSON.stringify(clip));

// minimal PNG decode (8-bit RGB/RGBA, non-interlaced)
function decodePng(buf) {
  let pos = 8;
  let w = 0, h = 0, ct = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0;
      const b = y > 0 ? out[dst - stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[dst + x] = v & 255;
    }
  }
  return { w, h, bpp, px: out };
}
const crop = (img, c) => {
  const x0 = Math.round(c.x * dpr), y0 = Math.round(c.y * dpr), w = Math.round(c.width * dpr), h = Math.round(c.height * dpr);
  const out = Buffer.alloc(w * h * img.bpp);
  for (let y = 0; y < h; y++) img.px.copy(out, y * w * img.bpp, ((y0 + y) * img.w + x0) * img.bpp, ((y0 + y) * img.w + x0 + w) * img.bpp);
  return { w, h, bpp: img.bpp, px: out };
};
const diff = (a, b) => {
  if (!a || a.px.length !== b.px.length) return { changed: -1, sum: -1 };
  let changed = 0, sum = 0;
  const n = a.w * a.h;
  for (let i = 0; i < n; i++) {
    const o = i * a.bpp;
    const d = Math.max(Math.abs(a.px[o] - b.px[o]), Math.abs(a.px[o + 1] - b.px[o + 1]), Math.abs(a.px[o + 2] - b.px[o + 2]));
    if (d > 12) { changed++; sum += d; }
  }
  return { changed, sum };
};

const frames = [];
let prev = null;
const t0 = Date.now();
let finishedAt = null;
while (Date.now() - t0 < 60000) {
  const state = await evaluate(`(() => {
    const el = document.querySelector('[data-land-probe]');
    const lines = [...el.querySelectorAll('.anim-line')];
    const anims = lines.map((line) => line.getAnimations().map((a) => ({ p: a.effect.getComputedTiming().progress, state: a.playState, t: a.currentTime, d: a.effect.getTiming().duration, delay: a.effect.getTiming().delay })));
    const rects = lines.map((line) => { const b = line.getBoundingClientRect(); return [+b.left.toFixed(2), +b.top.toFixed(2)]; });
    return { lines: lines.length, anims, rects, revealed: el.classList.contains("is-revealed"), transforms: lines.map((l) => getComputedStyle(l).transform), clips: lines.map((l) => getComputedStyle(l.parentElement).clipPath) };
  })()`);
  const { result: { data } } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const img = crop(decodePng(Buffer.from(data, "base64")), clip);
  const t = Date.now() - t0;
  const d = diff(prev, img);
  frames.push({ t, ...d, state });
  prev = img;
  const allDone = state.lines > 0 && state.anims.every((list) => list.length && list.every((a) => a.state === "finished"));
  if (allDone && finishedAt === null) finishedAt = t;
  if (finishedAt !== null && t - finishedAt > 2500) break;
  if (frames.length % 25 === 0 || frames.length === 3) fs.writeFileSync(path.join(outDir, `f${String(frames.length).padStart(3, "0")}_${t}.png`), Buffer.from(data, "base64"));
}
fs.writeFileSync(path.join(outDir, "last.png"), Buffer.from(prev ? "" : "", "base64"));
fs.writeFileSync(path.join(outDir, "frames.json"), JSON.stringify(frames, null, 1));

// report
console.log(`frames: ${frames.length}, finished at ${finishedAt}ms (slowed 10x)`);
const after = frames.filter((f) => finishedAt !== null && f.t > finishedAt + 60);
console.log(`after finish: ${after.length} frames, changed px max ${Math.max(0, ...after.map((f) => f.changed))}, frames with change: ${after.filter((f) => f.changed > 0).length}`);
const last = frames.find((f) => f.t === finishedAt);
console.log("rects at finish:", JSON.stringify(last?.state.rects), "transforms:", JSON.stringify(last?.state.transforms?.map((s) => s.slice(0, 60))));
console.log("clips at finish:", JSON.stringify(last?.state.clips));
// the tail of the first line: progress and change per frame over its last 15% of progress
const tail = frames.filter((f) => f.state.anims[0]?.[0] && f.state.anims[0][0].p !== null && f.state.anims[0][0].p > 0.6 && f.state.anims[0][0].state !== "finished");
console.log("first line tail (t, progress, changed px, sum):");
tail.slice(-14).forEach((f) => console.log(`  ${f.t}ms p=${f.state.anims[0][0].p.toFixed(3)} changed=${f.changed} sum=${f.sum}`));
const around = frames.filter((f) => finishedAt !== null && f.t >= finishedAt - 400 && f.t <= finishedAt + 600);
console.log("around finish (t, changed):", around.map((f) => `${f.t}:${f.changed}`).join(" "));
const lineAnims = frames.at(-1).state.anims;
console.log("durations (ms):", JSON.stringify(lineAnims.map((l) => l.map((a) => Math.round(a.d)))), "delays:", JSON.stringify(lineAnims.map((l) => l.map((a) => Math.round(a.delay)))));
finish(0);
