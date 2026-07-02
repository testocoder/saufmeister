"use strict";

/* Geheimmissionen – Hintergrundspiel für den ganzen Abend.
   Jede Person zieht 3 geheime Missionen und versucht, sie unbemerkt bei
   anderen auszulösen. Erste Neumischung ist gratis, jede weitere kostet
   einen Schluck (Ehrensache, die App zählt nicht mit).
   Erwartet window.MISSIONS_DATA = { categories: [{id, name, entries}] } */
(function () {
  const data = window.MISSIONS_DATA;
  if (!data || !Array.isArray(data.categories)) return;

  const MISSIONS_PER_PLAYER = 3;

  const stage = App.$("#game");
  const state = App.catState("prost-cats-geheimmissionen", data.categories);

  let pool = null;        /* verhindert doppelte Missionen innerhalb der Runde */
  let reshufflesUsed = 0; /* pro Person, wird beim Weitergeben zurückgesetzt */

  function clear() {
    stage.replaceChildren();
  }

  function rebuildPool() {
    pool = App.pool(state.entries());
  }

  function drawMissions() {
    const missions = [];
    for (let i = 0; i < MISSIONS_PER_PLAYER; i++) {
      missions.push(pool.next());
    }
    return missions;
  }

  /* --- Screen 1: Kategorien wählen -------------------------------------- */
  function showCategories() {
    clear();
    stage.classList.add("stage--top");

    const startBtn = App.el("button", "btn btn--primary", "");
    startBtn.type = "button";
    startBtn.addEventListener("click", function () {
      if (state.entries().length >= MISSIONS_PER_PLAYER) {
        rebuildPool();
        showHandoff();
      }
    });

    function refresh() {
      const n = state.entries().length;
      startBtn.disabled = n < MISSIONS_PER_PLAYER;
      startBtn.textContent = n < MISSIONS_PER_PLAYER
        ? "Wähle mindestens eine Kategorie"
        : "Los geht's – " + n + " Missionen im Pool";
    }

    refresh();
    stage.append(
      App.el("h2", "headline", "Kategorien"),
      App.el("p", "hint", "Wählt aus, welche Arten von Missionen im Pool landen."),
      App.catPicker(data.categories, state, refresh),
      startBtn
    );
  }

  /* --- Screen 2: Handy geht reihum --------------------------------------- */
  function showHandoff() {
    clear();
    stage.classList.remove("stage--top");

    const drawBtn = App.el("button", "btn btn--primary", "Meine 3 Missionen ziehen");
    drawBtn.type = "button";
    drawBtn.addEventListener("click", function () {
      reshufflesUsed = 0;
      showMissions(drawMissions());
    });

    const catBtn = App.el("button", "btn btn--ghost", "Kategorien ändern");
    catBtn.type = "button";
    catBtn.addEventListener("click", showCategories);

    stage.append(
      App.el("h2", "headline", "Nächste Person"),
      App.el("p", "hint", "Nimm das Handy so, dass niemand mitschauen kann. Deine Missionen sind streng geheim."),
      drawBtn,
      catBtn
    );
  }

  /* --- Screen 3: die 3 geheimen Missionen -------------------------------- */
  function showMissions(missions) {
    clear();

    const list = App.el("ul", "options");
    missions.forEach(function (mission, i) {
      const li = App.el("li", "option");
      li.append(
        App.el("span", "mission-num", String(i + 1)),
        App.el("span", "", mission)
      );
      list.append(li);
    });

    const shuffleBtn = App.el("button", "btn btn--secondary",
      reshufflesUsed === 0
        ? "Neu mischen (1× gratis)"
        : "Neu mischen – kostet dich 1 Schluck");
    shuffleBtn.type = "button";
    shuffleBtn.addEventListener("click", function () {
      reshufflesUsed++;
      showMissions(drawMissions());
    });

    const doneBtn = App.el("button", "btn btn--primary", "Eingeprägt – Handy weitergeben");
    doneBtn.type = "button";
    doneBtn.addEventListener("click", showHandoff);

    const actions = App.el("div", "actions");
    actions.append(doneBtn, shuffleBtn);

    stage.append(
      App.el("p", "counter", "Streng geheim – nur für deine Augen"),
      list,
      App.el("p", "hint", "Präge dir deine Missionen ein. Löst du eine im Laufe des Abends unbemerkt aus, trinkt die ausgetrickste Person einen Schluck."),
      actions
    );
  }

  showCategories();
})();
