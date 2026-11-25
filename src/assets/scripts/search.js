// [data-search] (the menu): from two letters typed, every matching page stands in for the list; the clear button, Escape or closing brings it back
const MIN = 2;
const SNIPPET = 180; // characters of page text around the first match
const WEIGHTS = { title: 12, headings: 5, description: 3 };
const TEXT_CAP = 8; // matches in the page text that still add to its score

const norm = (text) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[‘’]/g, "'");
const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]);
const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// each word matches where a word starts, so "enrol" finds "enrolment" while it is still being typed
const termsOf = (query) => [...new Set(norm(query).split(/[^a-z0-9']+/).map((t) => t.replace(/^'+|'+$/g, "")).filter((t) => t.length > 1 || /\d/.test(t)))];
const matcher = (term) => new RegExp(`(^|[^a-z0-9])(${escapeRe(term)})`, "g");
const count = (text, re) => {
  re.lastIndex = 0;
  let n = 0;
  while (re.exec(text)) n++;
  return n;
};

const indexes = new Map();
function load(url) {
  if (!indexes.has(url)) {
    const base = new URL(url, location.href);
    const request = fetch(base)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((entries) => entries.map((entry) => ({
        ...entry,
        href: new URL(entry.url.replace(/^\//, ""), base).href,
        n: { title: norm(entry.title), headings: norm(entry.headings.join(" · ")), description: norm(entry.description), text: norm(entry.text) },
      })))
      .catch(() => {
        indexes.delete(url);
        return [];
      });
    indexes.set(url, request);
  }
  return indexes.get(url);
}

// every word must be on the page; the title weighs most, then headings, the description and the text, and the whole phrase counts extra
function rank(entries, query) {
  const terms = termsOf(query);
  if (!terms.length) return [];
  const res = terms.map(matcher);
  const phrase = terms.join(" ");
  return entries
    .map((entry) => {
      let score = 0;
      for (const re of res) {
        const s = count(entry.n.title, re) * WEIGHTS.title + count(entry.n.headings, re) * WEIGHTS.headings
          + count(entry.n.description, re) * WEIGHTS.description + Math.min(count(entry.n.text, re), TEXT_CAP);
        if (!s) return null;
        score += s;
      }
      if (terms.length > 1 && entry.n.text.includes(phrase)) score += 10;
      return { entry, score, res };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

// the normalised copy finds the words; a letter that changes length under it leaves the text unmarked
function highlight(text, res) {
  const plain = norm(text);
  if (plain.length !== text.length) return escape(text);
  const ranges = [];
  for (const re of res) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(plain))) ranges.push([m.index + m[1].length, m.index + m[0].length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let out = "";
  let at = 0;
  for (const [start, end] of ranges) {
    if (start < at) continue;
    out += `${escape(text.slice(at, start))}<mark>${escape(text.slice(start, end))}</mark>`;
    at = end;
  }
  return out + escape(text.slice(at));
}

function snippet({ entry, res }) {
  const { text } = entry;
  let first = -1;
  for (const re of res) {
    re.lastIndex = 0;
    const m = re.exec(entry.n.text);
    if (m && (first < 0 || m.index < first)) first = m.index + m[1].length;
  }
  if (first < 0) return highlight(entry.description || text.slice(0, SNIPPET), res);
  let start = Math.max(0, first - 60);
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space > -1 && space < first) start = space + 1;
  }
  let end = Math.min(text.length, start + SNIPPET);
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > first) end = space;
  }
  return `${start > 0 ? "…" : ""}${highlight(text.slice(start, end), res)}${end < text.length ? "…" : ""}`;
}

function initScope(scope) {
  const form = scope.querySelector("[data-search-form]");
  const input = form?.querySelector('input[name="q"]');
  const list = scope.querySelector("[data-search-list]");
  const row = scope.querySelector("template[data-search-row]");
  if (!input || !list || !row) return;
  const clear = scope.querySelector("[data-search-clear]");
  const status = scope.querySelector("[data-search-status]");
  const results = scope.querySelector("[data-search-results]");
  const replaced = scope.querySelector("[data-search-replace]");
  const empty = scope.querySelector("[data-search-empty]");
  const scroller = scope.querySelector("[data-search-scroll]");
  const index = () => load(scope.dataset.searchIndex);
  let turn = 0;

  const say = (count, query) => {
    if (!status) return;
    const key = count === 0 ? "none" : count === 1 ? "one" : "many";
    status.textContent = query ? (status.dataset[key] || "").replace("{n}", count).replace("{q}", `“${query}”`) : "";
  };

  const fill = (found) => {
    list.replaceChildren(...found.map((hit) => {
      const item = row.content.firstElementChild.cloneNode(true);
      item.querySelector("[data-search-link]").href = hit.entry.href;
      item.querySelector("[data-search-title]").innerHTML = highlight(hit.entry.title, hit.res);
      item.querySelector("[data-search-text]").innerHTML = snippet(hit);
      return item;
    }));
  };

  const show = async (raw) => {
    const query = raw.trim();
    const mine = ++turn;
    if (clear) clear.hidden = !raw;
    if (query.length < MIN) {
      list.replaceChildren();
      say(0, "");
      if (results) results.hidden = true;
      if (replaced) replaced.hidden = false;
      if (empty) empty.hidden = true;
      return;
    }
    const found = rank(await index(), query);
    if (mine !== turn) return;
    fill(found);
    say(found.length, query);
    if (results) results.hidden = false;
    if (replaced) replaced.hidden = true;
    if (empty) empty.hidden = found.length > 0;
    if (scroller) scroller.scrollTop = 0;
  };

  const reset = (focus) => {
    input.value = "";
    show("");
    if (focus) input.focus();
  };

  input.addEventListener("focus", index, { once: true });
  input.addEventListener("input", () => show(input.value));
  clear?.addEventListener("click", () => reset(true));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    list.querySelector("[data-search-link]")?.focus();
  });

  // the arrows step from the field through the results and back; Escape closes the search before the menu
  const links = () => Array.from(list.querySelectorAll("[data-search-link]"));
  const escaped = (event) => {
    if (event.key !== "Escape" || !input.value) return false;
    event.preventDefault();
    event.stopPropagation();
    reset(true);
    return true;
  };
  input.addEventListener("keydown", (event) => {
    if (escaped(event)) return;
    if (event.key === "ArrowDown" && links().length) {
      event.preventDefault();
      links()[0].focus();
    }
  });
  list.addEventListener("keydown", (event) => {
    if (escaped(event)) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const found = links();
    const at = found.indexOf(document.activeElement);
    if (at < 0) return;
    event.preventDefault();
    const next = at + (event.key === "ArrowDown" ? 1 : -1);
    if (next < 0) input.focus();
    else found[Math.min(next, found.length - 1)].focus();
  });

  // a menu closed with a search in it opens on its list next time
  const host = scope.closest("#menu");
  if (host) new MutationObserver(() => host.hidden && input.value && reset(false)).observe(host, { attributes: true, attributeFilter: ["hidden"] });
}

export function initSearch() {
  document.querySelectorAll("[data-search]").forEach(initScope);
}
