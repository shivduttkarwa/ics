// Screencast frames of an animation, then per-frame sharpness and change inside named regions, to see text shiver.
// Usage: node .qa/shiver.mjs <url> <width> <height> <outDir> <steps before capture> <capture ms> <selector,selector,…>
//   steps: comma list of wait:<ms> / click:<selector> / eval:<js> (as frames.mjs); regions are measured by the selectors' boxes after the steps
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [url, width, height, outDir, stepsArg = "", captureArg = "3000", selectors = ""] = process.argv.slice(2);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "shiver-"));
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
setTimeout(() => { console.error("timed out"); finish(1); }, 120000);
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
const frames = [];
let capturing = false;
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === "Page.screencastFrame") {
    const { data, metadata, sessionId } = msg.params;
    if (capturing) frames.push({ t: metadata.timestamp, data });
    ws.send(JSON.stringify({ id: ++id, method: "Page.screencastFrameAck", params: { sessionId }, sessionId: session }));
  }
};
const send = (method, params = {}) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params, sessionId: session })); });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.result?.value;

const { result: { targetId } } = await new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method: "Target.createTarget", params: { url: "about:blank" } })); });
({ result: { sessionId: session } } = await new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method: "Target.attachToTarget", params: { targetId, flatten: true } })); }));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +width, height: +height, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url });

for (const step of stepsArg.split(",").filter(Boolean)) {
  const [kind, ...rest] = step.split(":");
  const arg = rest.join(":");
  if (kind === "wait") await sleep(+arg);
  else if (kind === "click") await evaluate(`document.querySelector(${JSON.stringify(arg)})?.click()`);
  else if (kind === "eval") await evaluate(arg);
}
await send("Page.bringToFront");
await send("Emulation.setFocusEmulationEnabled", { enabled: true });
await send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
capturing = true;
const started = Date.now();
await sleep(+captureArg);
capturing = false;
await send("Page.stopScreencast");
const regions = {};
for (const sel of selectors.split(",").filter(Boolean)) {
  regions[sel] = await evaluate(`(() => { const b = document.querySelector(${JSON.stringify(sel)})?.getBoundingClientRect(); return b ? [b.left, b.top, b.right, b.bottom].map(Math.round) : null; })()`);
}
const t0 = frames[0]?.t ?? 0;
frames.forEach((frame, i) => fs.writeFileSync(path.join(outDir, `${String(i).padStart(3, "0")}_${Math.round((frame.t - t0) * 1000)}.png`), Buffer.from(frame.data, "base64")));
fs.writeFileSync(path.join(outDir, "regions.json"), JSON.stringify(regions));
console.log(`${frames.length} frames over ${Date.now() - started}ms in ${outDir}`);
finish(0);
