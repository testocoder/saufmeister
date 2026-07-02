"use strict";

/* Gemeinsame Logik für die reinen Karten-Spiele
   (Ich hab noch nie, Wer würde eher, Pass the Phone).
   Erwartet window.GAME_DATA = { id, hint, categories: [{id, name, entries}] }
   Ablauf: Kategorien wählen -> Karten ziehen. */
(function () {
  const data = window.GAME_DATA;
  if (!data || !Array.isArray(data.categories)) return;

  const stage = App.$("#game");
  const state = App.catState("prost-cats-" + data.id, data.categories);

  /* --- Screen 1: Kategorien wählen -------------------------------------- */
  function showCategories() {
    stage.replaceChildren();
    stage.classList.add("stage--top");

    const startBtn = App.el("button", "btn btn--primary", "");
    startBtn.type = "button";
    startBtn.addEventListener("click", function () {
      if (state.entries().length > 0) showCards();
    });

    function refresh() {
      const n = state.entries().length;
      startBtn.disabled = n === 0;
      startBtn.textContent = n === 0
        ? "Wähle mindestens eine Kategorie"
        : "Los geht's – " + n + " Karten";
    }

    refresh();
    stage.append(
      App.el("h2", "headline", "Kategorien"),
      App.el("p", "hint", "Wählt aus, welche Themen heute Abend dabei sind."),
      App.catPicker(data.categories, state, refresh),
      startBtn
    );
  }

  /* --- Screen 2: Karten ziehen ------------------------------------------- */
  function showCards() {
    stage.replaceChildren();
    stage.classList.remove("stage--top");

    const stack = App.pool(state.entries());

    const counter = App.el("p", "counter", "");
    const text = App.el("span", "card__text", "");
    const card = App.el("button", "card");
    card.type = "button";
    card.append(text, App.el("span", "card__tap", "Tippen für die nächste Karte"));

    const hint = App.el("p", "hint", data.hint || "");

    const catBtn = App.el("button", "btn btn--ghost", "Kategorien ändern");
    catBtn.type = "button";
    catBtn.addEventListener("click", showCategories);

    function next() {
      text.textContent = stack.next();
      counter.textContent = "Karte " + stack.position + " von " + stack.size;
      card.classList.remove("card--in");
      void card.offsetWidth; /* Animation neu starten */
      card.classList.add("card--in");
    }

    card.addEventListener("click", next);
    next();

    stage.append(counter, card, hint, catBtn);
  }

  showCategories();
})();
