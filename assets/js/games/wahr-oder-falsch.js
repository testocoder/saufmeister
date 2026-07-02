"use strict";

/* Wahr oder falsch – Behauptungen über Personen aus der Runde.
   Abstimmung läuft analog (Handzeichen), die App liefert Personen + Behauptungen.
   Erwartet window.WOF_DATA = { categories: [{id, name, entries}] } */
(function () {
  const data = window.WOF_DATA;
  if (!data || !Array.isArray(data.categories)) return;

  const STORAGE_KEY = "prost-wof-players";
  const MAX_PLAYERS = 12;
  const MAX_NAME_LEN = 20;

  const stage = App.$("#game");
  const catState = App.catState("prost-cats-wahr-oder-falsch", data.categories);

  let players = loadPlayers();
  let lastPerson = null;
  let templates = null; /* Zieh-Stapel, wird beim Start aus der Kategorie-Auswahl gebaut */

  function loadPlayers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(function (n) { return typeof n === "string"; })
        .map(function (n) { return n.trim().slice(0, MAX_NAME_LEN); })
        .filter(function (n) { return n.length > 0; })
        .slice(0, MAX_PLAYERS);
    } catch (e) {
      return [];
    }
  }

  function savePlayers() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch (e) { /* z.B. privater Modus – dann eben ohne Speichern */ }
  }

  function clear() {
    stage.replaceChildren();
  }

  /* --- Screen 1: Spieler + Kategorien ----------------------------------- */
  function showSetup() {
    clear();
    stage.classList.add("stage--top");

    const title = App.el("h2", "headline", "Wer spielt mit?");
    const sub = App.el("p", "hint", "Mindestens 3 Personen. Die Namen bleiben nur auf diesem Gerät.");

    const form = App.el("form", "setup-form");
    const input = App.el("input");
    input.type = "text";
    input.maxLength = MAX_NAME_LEN;
    input.placeholder = "Name eingeben";
    input.autocomplete = "off";
    input.enterKeyHint = "done";
    const addBtn = App.el("button", "", "+");
    addBtn.type = "submit";
    addBtn.setAttribute("aria-label", "Person hinzufügen");
    form.append(input, addBtn);

    const error = App.el("p", "form-error", "");
    const list = App.el("ul", "chips");

    const catTitle = App.el("p", "counter", "Kategorien");
    const startBtn = App.el("button", "btn btn--primary", "");
    startBtn.type = "button";

    function refresh() {
      list.replaceChildren();
      for (const name of players) {
        const li = App.el("li", "", name);
        const rm = App.el("button", "", "✕");
        rm.type = "button";
        rm.setAttribute("aria-label", name + " entfernen");
        rm.addEventListener("click", function () {
          players = players.filter(function (p) { return p !== name; });
          savePlayers();
          refresh();
        });
        li.append(rm);
        list.append(li);
      }
      const nEntries = catState.entries().length;
      if (players.length < 3) {
        startBtn.disabled = true;
        startBtn.textContent = "Los geht's (" + players.length + "/3 Personen)";
      } else if (nEntries === 0) {
        startBtn.disabled = true;
        startBtn.textContent = "Wähle mindestens eine Kategorie";
      } else {
        startBtn.disabled = false;
        startBtn.textContent = "Los geht's – " + nEntries + " Behauptungen";
      }
    }

    startBtn.addEventListener("click", function () {
      if (players.length >= 3 && catState.entries().length > 0) {
        templates = App.pool(catState.entries());
        showClaim();
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      error.textContent = "";
      const name = input.value.trim().slice(0, MAX_NAME_LEN);
      if (!name) return;
      if (players.length >= MAX_PLAYERS) {
        error.textContent = "Maximal " + MAX_PLAYERS + " Personen.";
        return;
      }
      if (players.some(function (p) { return p.toLowerCase() === name.toLowerCase(); })) {
        error.textContent = "Den Namen gibt es schon.";
        return;
      }
      players.push(name);
      savePlayers();
      input.value = "";
      input.focus();
      refresh();
    });

    refresh();
    stage.append(
      title, sub, form, error, list,
      catTitle,
      App.catPicker(data.categories, catState, refresh),
      startBtn
    );
  }

  function pickPerson() {
    let candidates = players;
    if (players.length > 1 && lastPerson) {
      candidates = players.filter(function (p) { return p !== lastPerson; });
    }
    const person = candidates[Math.floor(Math.random() * candidates.length)];
    lastPerson = person;
    return person;
  }

  /* Baut den Behauptungstext mit hervorgehobenem Namen (ohne innerHTML) */
  function claimNode(template, name) {
    const wrap = App.el("p", "card__text");
    const parts = template.split("___");
    wrap.append(document.createTextNode(parts[0]));
    wrap.append(App.el("strong", "claim-name", name));
    if (parts[1]) wrap.append(document.createTextNode(parts[1]));
    return wrap;
  }

  /* --- Screen 2: Behauptung + analoge Abstimmung ------------------------ */
  function showClaim() {
    clear();
    stage.classList.remove("stage--top");
    const person = pickPerson();
    const template = templates.next();

    const card = App.el("div", "card");
    card.append(
      claimNode(template, person),
      App.el("span", "card__tap", "Wahr oder falsch?")
    );

    const resolveBtn = App.el("button", "btn btn--primary", "Auflösen");
    resolveBtn.type = "button";
    resolveBtn.addEventListener("click", function () { showReveal(person); });

    stage.append(
      App.el("p", "counter", "Behauptung"),
      card,
      App.el("p", "hint", "Alle außer " + person + " stimmen gleichzeitig ab: Daumen hoch = wahr, Daumen runter = falsch."),
      resolveBtn
    );
  }

  /* --- Screen 3: Auflösung ---------------------------------------------- */
  function showReveal(person) {
    clear();

    const nextBtn = App.el("button", "btn btn--primary", "Nächste Runde");
    nextBtn.type = "button";
    nextBtn.addEventListener("click", showClaim);

    const editBtn = App.el("button", "btn btn--ghost", "Spieler & Kategorien");
    editBtn.type = "button";
    editBtn.addEventListener("click", showSetup);

    const actions = App.el("div", "actions");
    actions.append(nextBtn, editBtn);

    stage.append(
      App.el("h2", "headline", person + ", raus mit der Wahrheit!"),
      App.el("p", "hint", "Stimmt die Behauptung – ja oder nein? Wer falsch getippt hat, trinkt einen Schluck."),
      actions
    );
  }

  showSetup();
})();
