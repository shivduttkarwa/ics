// Frames of a page over time, to look at an entrance or a scroll: one PNG per step.
// Usage: node .qa/frames.mjs <url> <width> <height> <outDir> <mobile 0|1> <steps> [reduced motion 0|1]
//   steps: comma list of `wait:<ms>`, `scroll:<y>` (instant), `wheel:<dy>` (through Lenis), `click:<selector>`, `eval:<js>`; a shot follows each `shot`
//   `page:<ms>` shoots every screen of the page top to bottom, pausing <ms> on each
//   e.g. "wait:300,shot,wait:600,shot,wheel:900,wait:500,shot"
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [url, width, height, outDir, mobile = "0", stepsArg = "wait:4000,shot", rest = "0"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "frames-"));
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
setTimeout(() => { console.error("timed out"); finish(1); }, 170000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let version;
for (let i = 0; i < 60 && !version; i++) {
  try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(250); }
}
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const logs = [];
let session;
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === "Runtime.exceptionThrown") logs.push("EXCEPTION " + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) logs.push(msg.params.type.toUpperCase() + " " + msg.params.args.map((a) => a.value ?? a.description).join(" "));
};
const send = (method, params = {}, sessionId = session) =>
  new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params, sessionId })); });

const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" }, undefined);
({ result: { sessionId: session } } = await send("Target.attachToTarget", { targetId, flatten: true }, undefined));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +width, height: +height, deviceScaleFactor: 1, mobile: mobile === "1" });
if (mobile === "1") await send("Emulation.setTouchEmulationEnabled", { enabled: true });
if (rest === "1") await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Page.navigate", { url });

let n = 0;
for (const step of stepsArg.split(",")) {
  const [kind, ...rest] = step.split(":");
  const arg = rest.join(":");
  if (kind === "wait") await sleep(+arg);
  else if (kind === "scroll") await send("Runtime.evaluate", { expression: `window.scrollTo({ top: ${+arg}, behavior: "instant" })` });
  else if (kind === "wheel") await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: +width / 2, y: +height / 2, deltaX: 0, deltaY: +arg });
  else if (kind === "click") await send("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(arg)})?.click()` });
  else if (kind === "eval") await send("Runtime.evaluate", { expression: arg });
  else if (kind === "hover") {
    const where = await send("Runtime.evaluate", { expression: `(() => { const b = document.querySelector(${JSON.stringify(arg)}).getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; })()`, returnByValue: true });
    const [x, y] = where.result.result.value;
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  }
  else if (kind === "page") {
    const total = (await send("Runtime.evaluate", { expression: "document.documentElement.scrollHeight", returnByValue: true })).result.result.value;
    for (let y = 0; y < total; y += +height) {
      await send("Runtime.evaluate", { expression: `window.scrollTo({ top: ${y}, behavior: "instant" })` });
      await sleep(+arg || 700);
      const { result: { data } } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(outDir, `${String(n++).padStart(2, "0")}.png`), Buffer.from(data, "base64"));
    }
    console.log(`page height ${total}`);
  }
  else if (kind === "shot") {
    const { result: { data } } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    const file = path.join(outDir, `${String(n++).padStart(2, "0")}.png`);
    fs.writeFileSync(file, Buffer.from(data, "base64"));
  }
}
console.log(`${n} frames in ${outDir}`);
if (logs.length) console.log(logs.join("\n"));
finish(0);
