// form[data-form]: a select in .field__select becomes a listbox (the hidden select keeps the value); each field's mistake shows in its .field__error
import { Anim } from "./anim.js";
import { still, designPx } from "./motion.js";

const MESSAGES = {
  select: "Please choose an option.",
  email: "Please enter your email address.",
  emailFormat: "Please enter a valid email address, like name@example.com.",
  tel: "Please enter your phone number.",
  telFormat: "Please enter a valid phone number.",
  missing: "Please fill in this field.",
  other: "Please check this field.",
};
const TYPE_AHEAD = 600;

let uid = 0;

const telOk = (value) => {
  const digits = value.replace(/\D/g, "").length;
  return /^[\d\s()+-]+$/.test(value) && digits >= 8 && digits <= 15;
};

function problem(control) {
  const kind = control.tagName === "SELECT" ? "select" : control.type;
  const value = control.value.trim();
  if (control.required && !value) return control.dataset.error || MESSAGES[kind] || MESSAGES.missing;
  if (!value) return "";
  if (kind === "email" && control.validity.typeMismatch) return MESSAGES.emailFormat;
  if (kind === "tel" && !telOk(value)) return MESSAGES.telFormat;
  return control.validity.valid ? "" : MESSAGES.other;
}

const describe = (el, id, on) => {
  const ids = (el.getAttribute("aria-describedby") || "").split(/\s+/).filter((token) => token && token !== id);
  if (on) ids.push(id);
  if (ids.length) el.setAttribute("aria-describedby", ids.join(" "));
  else el.removeAttribute("aria-describedby");
};

function enhanceSelect(select) {
  const wrap = select.closest(".field__select");
  const field = select.closest(".field");
  const label = field?.querySelector(".field__label");
  const id = select.id || `field-select-${++uid}`;
  const entries = [...select.options].filter((option) => !option.disabled && !option.hidden).map((option, i) => {
    const li = document.createElement("li");
    li.className = "field__option";
    li.id = `${id}-option-${i}`;
    li.setAttribute("role", "option");
    li.textContent = option.textContent;
    return { li, option };
  });
  if (!entries.length) return;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "field__control field__trigger";
  trigger.id = `${id}-button`;
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", `${id}-list`);
  const value = document.createElement("span");
  value.className = "field__value";
  trigger.append(value);

  const list = document.createElement("ul");
  list.className = "field__list";
  list.id = `${id}-list`;
  list.setAttribute("role", "listbox");
  list.setAttribute("data-lenis-prevent", "");
  list.tabIndex = -1;
  list.append(...entries.map(({ li }) => li));

  if (label) {
    label.id ||= `${id}-label`;
    label.htmlFor = trigger.id;
    trigger.setAttribute("aria-labelledby", label.id);
    list.setAttribute("aria-labelledby", label.id);
    // a label passes its click on to a button, which would open the list; a select's label only focuses it
    label.addEventListener("click", (event) => {
      event.preventDefault();
      trigger.focus();
    });
  }

  select.classList.add("visually-hidden");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");
  select.after(trigger);
  wrap.append(list);
  wrap.classList.add("is-enhanced");

  let active = -1;
  let typed = "";
  let typedAt = 0;
  const isOpen = () => wrap.classList.contains("is-open");
  const chosen = () => entries.findIndex(({ option }) => option.selected);

  const sync = () => {
    const current = select.options[select.selectedIndex];
    value.textContent = current ? current.textContent : "";
    entries.forEach(({ li, option }) => li.setAttribute("aria-selected", String(option.selected)));
  };

  const setActive = (i, reveal = true) => {
    entries[active]?.li.classList.remove("is-active");
    active = i;
    const entry = entries[i];
    if (!entry) {
      trigger.removeAttribute("aria-activedescendant");
      return;
    }
    entry.li.classList.add("is-active");
    trigger.setAttribute("aria-activedescendant", entry.li.id);
    if (!reveal) return;
    const pad = parseFloat(getComputedStyle(list).paddingTop) || 0;
    const top = entry.li.offsetTop;
    const bottom = top + entry.li.offsetHeight;
    if (top - pad < list.scrollTop) list.scrollTop = top - pad;
    else if (bottom + pad > list.scrollTop + list.clientHeight) list.scrollTop = bottom + pad - list.clientHeight;
  };

  const place = () => {
    list.style.removeProperty("--field-list-room");
    const box = trigger.getBoundingClientRect();
    const edge = designPx(20) + designPx(10);
    const height = list.offsetHeight;
    const below = window.innerHeight - box.bottom - edge;
    const above = box.top - edge;
    const up = below < height && above > below;
    wrap.classList.toggle("is-up", up);
    const room = up ? above : below;
    if (room < height) list.style.setProperty("--field-list-room", `${Math.max(room, designPx(120))}px`);
  };

  const outside = (event) => {
    if (!wrap.contains(event.target)) close();
  };

  const open = (index = chosen()) => {
    if (isOpen()) return;
    place();
    wrap.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    setActive(Math.max(index, 0));
    document.addEventListener("pointerdown", outside, true);
  };

  function close(refocus = false) {
    if (!isOpen()) return;
    wrap.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    setActive(-1);
    document.removeEventListener("pointerdown", outside, true);
    if (refocus) trigger.focus();
  }

  const choose = (i) => {
    const entry = entries[i];
    if (!entry) return;
    if (!entry.option.selected) {
      entry.option.selected = true;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    sync();
  };

  const typeAhead = (key) => {
    const now = performance.now();
    typed = now - typedAt > TYPE_AHEAD ? key : typed + key;
    typedAt = now;
    const term = typed.toLowerCase();
    const base = isOpen() ? active : chosen();
    const from = typed.length === 1 ? base + 1 : Math.max(base, 0);
    const order = [...entries.slice(from), ...entries.slice(0, from)];
    const hit = order.find(({ li }) => li.textContent.trim().toLowerCase().startsWith(term));
    if (!hit) return;
    const i = entries.indexOf(hit);
    if (isOpen()) setActive(i);
    else choose(i);
  };

  trigger.addEventListener("click", () => (isOpen() ? close() : open()));
  trigger.addEventListener("blur", () => close());
  trigger.addEventListener("keyup", (event) => {
    if (event.key === " ") event.preventDefault();
  });
  trigger.addEventListener("keydown", (event) => {
    const last = entries.length - 1;
    const opened = isOpen();
    const typing = typed && performance.now() - typedAt < TYPE_AHEAD;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!opened) open();
        else if (!event.altKey) setActive(Math.min(active + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!opened) open();
        else if (event.altKey) {
          choose(active);
          close();
        } else setActive(Math.max(active - 1, 0));
        break;
      case "Home":
      case "End":
      case "PageUp":
      case "PageDown": {
        event.preventDefault();
        const step = Math.max(Math.floor(list.clientHeight / (entries[0].li.offsetHeight || 1)) - 1, 1);
        const target = { Home: 0, End: last, PageUp: Math.max(active - step, 0), PageDown: Math.min(active + step, last) }[event.key];
        if (!opened) open(event.key === "End" ? last : event.key === "Home" ? 0 : chosen());
        else setActive(target);
        break;
      }
      case "Enter":
      case " ":
        if (event.key === " " && typing) {
          event.preventDefault();
          typeAhead(" ");
          break;
        }
        event.preventDefault();
        if (!opened) open();
        else {
          choose(active);
          close();
        }
        break;
      case "Escape":
        if (opened) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
        break;
      case "Tab":
        if (opened) {
          choose(active);
          close();
        }
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          typeAhead(event.key);
        }
    }
  });

  // a press on an option must not take focus from the button, or its blur shuts the list before the click lands
  list.addEventListener("pointerdown", (event) => event.preventDefault());
  list.addEventListener("pointermove", (event) => {
    const li = event.target.closest(".field__option");
    if (li) setActive(entries.findIndex((entry) => entry.li === li), false);
  });
  list.addEventListener("click", (event) => {
    const li = event.target.closest(".field__option");
    if (!li) return;
    choose(entries.findIndex((entry) => entry.li === li));
    close(true);
  });

  select.addEventListener("change", sync);
  select.form?.addEventListener("reset", () => setTimeout(sync));
  sync();
}

function bringIntoView(field) {
  const box = field.getBoundingClientRect();
  if (box.top >= window.innerHeight * 0.15 && box.bottom <= window.innerHeight * 0.85) return;
  const offset = -window.innerHeight * 0.3;
  if (Anim.lenis && !still.matches) Anim.lenis.scrollTo(field, { offset });
  else window.scrollTo(0, window.scrollY + box.top + offset);
}

function initChecks(form) {
  form.noValidate = true;
  const fields = [...form.querySelectorAll(".field")].map((field) => {
    const control = field.querySelector("input, select, textarea");
    return control && { field, control, focusable: field.querySelector(".field__trigger") || control, error: field.querySelector(".field__error") };
  }).filter(Boolean);

  const check = (entry) => {
    const { field, focusable, error } = entry;
    const message = problem(entry.control);
    entry.checked = true;
    field.classList.toggle("is-invalid", Boolean(message));
    if (message) focusable.setAttribute("aria-invalid", "true");
    else focusable.removeAttribute("aria-invalid");
    if (!error) return !message;
    if (message && error.textContent !== message) error.textContent = message;
    error.hidden = !message;
    describe(focusable, error.id, Boolean(message));
    return !message;
  };

  fields.forEach((entry) => {
    entry.checked = entry.field.classList.contains("is-invalid");
    entry.control.addEventListener("input", () => entry.checked && check(entry));
    entry.control.addEventListener("change", () => check(entry));
    // leaving a field empty is not yet a mistake; leaving it filled in wrongly is
    entry.focusable.addEventListener("blur", () => (entry.checked || entry.control.value.trim()) && check(entry));
  });

  form.addEventListener("submit", (event) => {
    const wrong = fields.filter((entry) => !check(entry));
    if (wrong.length) {
      event.preventDefault();
      bringIntoView(wrong[0].field);
      wrong[0].focusable.focus({ preventScroll: true });
      return;
    }
    if (!form.hasAttribute("action")) event.preventDefault();
  });
}

export function initForms() {
  document.querySelectorAll("form[data-form]").forEach((form) => {
    form.querySelectorAll(".field__select select").forEach(enhanceSelect);
    initChecks(form);
  });
}
