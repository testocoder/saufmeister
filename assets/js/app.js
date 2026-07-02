"use strict";

/* Geteilte Helfer für alle Spiele. Keine Abhängigkeiten, kein Netzwerk. */
window.App = (function () {

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* Fisher-Yates, gibt eine neue gemischte Kopie zurück */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Endloser Zieh-Stapel: mischt neu, wenn alle Einträge durch sind,
     ohne dass direkt hintereinander derselbe Eintrag kommt. */
  function pool(items) {
    let deck = shuffle(items);
    let i = 0;
    return {
      next() {
        if (i >= deck.length) {
          const last = deck[deck.length - 1];
          deck = shuffle(items);
          if (deck.length > 1 && deck[0] === last) {
            deck.push(deck.shift());
          }
          i = 0;
        }
        return deck[i++];
      },
      get position() { return i; },
      get size() { return deck.length; }
    };
  }

  /* Kategorie-Auswahl: lädt/speichert die Auswahl pro Spiel in localStorage.
     Standard: alles ausgewählt. */
  function catState(storageKey, categories) {
    const validIds = new Set(categories.map(function (c) { return c.id; }));
    let selected = null;
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(raw)) {
        const filtered = raw.filter(function (id) { return validIds.has(id); });
        if (filtered.length > 0) selected = new Set(filtered);
      }
    } catch (e) { /* defekter Eintrag -> Standard */ }
    if (!selected) selected = new Set(validIds);

    function save() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(selected)));
      } catch (e) { /* z.B. privater Modus */ }
    }

    return {
      has: function (id) { return selected.has(id); },
      toggle: function (id) {
        if (selected.has(id)) selected.delete(id);
        else selected.add(id);
        save();
      },
      setAll: function (on) {
        selected = on ? new Set(validIds) : new Set();
        save();
      },
      entries: function () {
        let out = [];
        for (const c of categories) {
          if (selected.has(c.id)) out = out.concat(c.entries);
        }
        return out;
      },
      get count() { return selected.size; }
    };
  }

  /* Baut die Chip-Auswahl (Alle/Keine + ein Toggle-Chip je Kategorie). */
  function catPicker(categories, state, onChange) {
    const wrap = el("div", "cat-picker");

    const toolbar = el("div", "cat-toolbar");
    const allBtn = el("button", "cat-tool", "Alle auswählen");
    allBtn.type = "button";
    const noneBtn = el("button", "cat-tool", "Alle abwählen");
    noneBtn.type = "button";
    toolbar.append(allBtn, noneBtn);

    const grid = el("div", "cat-grid");
    const chips = [];
    for (const cat of categories) {
      const chip = el("button", "cat-chip");
      chip.type = "button";
      chip.append(
        el("span", "", cat.name),
        el("span", "cat-chip__count", String(cat.entries.length))
      );
      chip.setAttribute("aria-pressed", state.has(cat.id) ? "true" : "false");
      chip.addEventListener("click", function () {
        state.toggle(cat.id);
        chip.setAttribute("aria-pressed", state.has(cat.id) ? "true" : "false");
        onChange();
      });
      chips.push(chip);
      grid.append(chip);
    }

    function refreshChips() {
      for (let i = 0; i < categories.length; i++) {
        chips[i].setAttribute("aria-pressed", state.has(categories[i].id) ? "true" : "false");
      }
      onChange();
    }
    allBtn.addEventListener("click", function () { state.setAll(true); refreshChips(); });
    noneBtn.addEventListener("click", function () { state.setAll(false); refreshChips(); });

    wrap.append(toolbar, grid);
    return wrap;
  }

  function initRulesDialog() {
    const dlg = $("#rules");
    const openBtn = $("[data-open-rules]");
    if (!dlg || !openBtn) return;
    openBtn.addEventListener("click", function () { dlg.showModal(); });
    const closeBtn = $("[data-close-rules]", dlg);
    if (closeBtn) closeBtn.addEventListener("click", function () { dlg.close(); });
    /* Tipp auf den Hintergrund schließt */
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) dlg.close();
    });
  }

  document.addEventListener("DOMContentLoaded", initRulesDialog);

  return { $: $, el: el, shuffle: shuffle, pool: pool, catState: catState, catPicker: catPicker };
})();
