// data-marquee="left|right": the track's one list is cloned to fill the lane and runs as a compositor animation,
// so it never stutters while the page is busy. Optional in the [data-marquee-scope]: [data-marquee-prev] / [data-marquee-next]
// step one item; data-marquee-pause slows it to a stop under the pointer; data-marquee-drag lets it be dragged and flicked.
import { gsap, still, fine } from "./motion.js";

const SPEED = 40; // design px per second; data-marquee-speed overrides
const DRAG = 6; // px a press must travel before it is a drag and not a click
// a flick: the least speed that counts (px per ms), the ms of travel it carries on for, and the most it may carry (share of the lane)
const FLICK = { least: 0.25, carry: 320, most: 0.6 };

export function initMarquees() {
  const tracks = Array.from(document.querySelectorAll("[data-marquee]"));
  if (!tracks.length) return;

  const builds = tracks.map((track) => {
    const list = track.firstElementChild;
    const lane = track.parentElement;
    const scope = track.closest("[data-marquee-scope]") || lane;
    const reverse = track.dataset.marquee === "right";
    const way = reverse ? -1 : 1;
    const speed = parseFloat(track.dataset.marqueeSpeed || SPEED);
    const pauses = track.hasAttribute("data-marquee-pause");
    let run = null;
    let span = 0; // from one list's start to the next one's
    let visible = false;
    let hovered = false;
    let dragging = false;
    let stepping = null;
    const state = { time: 0 };

    const length = () => run.effect.getComputedTiming().duration;
    const wrap = (time) => ((time % length()) + length()) % length();
    const rate = (value, duration = 0.6) => run && gsap.to(run, { playbackRate: value, duration, ease: "power1.out", overwrite: true });
    const sync = () => {
      if (!run || stepping || dragging) return;
      if (visible) run.play();
      else run.pause();
    };
    // picks the pace back up from a standstill, unless the pointer is resting on a row that pauses
    const resume = () => {
      if (!run) return;
      gsap.killTweensOf(run);
      run.playbackRate = 0;
      sync();
      if (!(pauses && hovered)) rate(1, 1.2);
    };

    const build = () => {
      // a rebuild (fonts in, a resize) carries on from the same point of the loop
      const progress = run && run.currentTime !== null ? wrap(run.currentTime) / length() : 0;
      stepping?.kill();
      stepping = null;
      dragging = false;
      if (run) gsap.killTweensOf(run);
      run?.cancel();
      run = null;
      track.querySelectorAll("[data-marquee-copy]").forEach((copy) => copy.remove());
      lane.classList.toggle("is-still", still.matches);
      lane.classList.remove("is-dragging");
      if (!list || still.matches) return;
      const first = list.cloneNode(true);
      first.setAttribute("aria-hidden", "true");
      first.setAttribute("data-marquee-copy", "");
      first.querySelectorAll("a, button").forEach((el) => el.setAttribute("tabindex", "-1"));
      track.append(first);
      span = first.getBoundingClientRect().left - list.getBoundingClientRect().left;
      if (!span) return;
      for (let i = Math.ceil(lane.clientWidth / span); i > 0; i--) track.append(first.cloneNode(true));
      const scale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
      run = track.animate(
        [{ transform: "translate3d(0, 0, 0)" }, { transform: `translate3d(${-span}px, 0, 0)` }],
        { duration: (span / (speed * scale)) * 1000, iterations: Infinity, direction: reverse ? "reverse" : "normal" }
      );
      run.currentTime = progress * length();
      if (pauses && hovered) run.playbackRate = 0;
      sync();
    };

    // moves the row by `px` to the left (negative: to the right), from wherever it is
    const shift = (px, duration = 0.9) => {
      if (!run) return lane.scrollBy({ left: px, behavior: "auto" });
      // a second click mid-step carries on from the first one's target
      const base = stepping ? stepping.vars.time : (state.time = run.currentTime);
      const target = base + (px / span) * length() * way;
      run.pause();
      stepping = gsap.to(state, {
        time: target,
        duration,
        overwrite: true,
        onUpdate: () => { run.currentTime = wrap(state.time); },
        onComplete: () => {
          stepping = null;
          resume();
        },
      });
    };
    const item = () => {
      const items = list.children;
      return items.length > 1 ? items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left : lane.clientWidth / 2;
    };
    scope.querySelector("[data-marquee-prev]")?.addEventListener("click", () => shift(-item()));
    scope.querySelector("[data-marquee-next]")?.addEventListener("click", () => shift(item()));

    if (pauses) {
      lane.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch" || !fine.matches) return;
        hovered = true;
        if (!stepping && !dragging) rate(0);
      });
      lane.addEventListener("pointerleave", () => {
        if (!hovered) return;
        hovered = false;
        if (!stepping && !dragging) rate(1, 1);
      });
    }

    if (track.hasAttribute("data-marquee-drag")) {
      let from = null;
      let moved = 0;
      let trail = [];
      lane.addEventListener("pointerdown", (event) => {
        if (!run || (event.pointerType === "mouse" && event.button)) return;
        stepping?.kill();
        stepping = null;
        gsap.killTweensOf(run);
        run.pause();
        dragging = true;
        from = { x: event.clientX, time: run.currentTime };
        moved = 0;
        trail = [{ x: event.clientX, at: event.timeStamp }];
      });
      window.addEventListener("pointermove", (event) => {
        if (!from) return;
        const dx = event.clientX - from.x;
        moved = Math.max(moved, Math.abs(dx));
        if (moved < DRAG) return;
        lane.classList.add("is-dragging");
        trail.push({ x: event.clientX, at: event.timeStamp });
        if (trail.length > 5) trail.shift();
        run.currentTime = wrap(from.time - (dx / span) * length() * way);
      });
      const release = (event) => {
        if (!from) return;
        from = null;
        dragging = false;
        lane.classList.remove("is-dragging");
        // click fires before this timer, so the drag's own click is still stopped and a later key press is not
        setTimeout(() => { moved = 0; }, 0);
        const first = trail[0];
        const last = trail[trail.length - 1];
        const idle = event.timeStamp - last.at > 80;
        const velocity = idle || last.at === first.at ? 0 : (last.x - first.x) / (last.at - first.at);
        const reach = lane.clientWidth * FLICK.most;
        if (Math.abs(velocity) > FLICK.least) shift(gsap.utils.clamp(-reach, reach, -velocity * FLICK.carry), 1.1);
        else resume();
      };
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
      // a drag must not follow the link it started on
      lane.addEventListener("click", (event) => {
        if (moved < DRAG) return;
        event.preventDefault();
        event.stopPropagation();
      }, true);
      lane.addEventListener("dragstart", (event) => event.preventDefault());
    }

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { rootMargin: "20% 0px" }).observe(lane);

    // the copies are lazy too, and one sliding in from the edge must not arrive blank
    new IntersectionObserver((entries, watch) => {
      if (!entries[0].isIntersecting) return;
      watch.disconnect();
      track.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        img.loading = "eager";
        img.decode().catch(() => {});
      });
    }, { rootMargin: "100% 0px" }).observe(lane);

    return build;
  });

  const rebuild = () => builds.forEach((build) => build());
  rebuild();
  document.fonts?.ready.then(rebuild);
  window.addEventListener("load", rebuild);
  // a phone's toolbar changes only the height, which leaves both of these alone
  const size = () => `${window.innerWidth} ${getComputedStyle(document.documentElement).fontSize}`;
  let built = size();
  let timer = 0;
  window.addEventListener("resize", () => {
    if (size() === built) return;
    built = size();
    clearTimeout(timer);
    timer = setTimeout(rebuild, 200);
  });
  still.addEventListener("change", rebuild);
}
