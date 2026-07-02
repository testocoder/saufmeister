"use strict";

/* Double or Nothing – Push-your-luck mit 52er-Deck.
   Regeln: "Ladies first" – die DAME ist die höchste Karte (Markenzeichen des
   Spiels), Gleichstand = verloren.
   Werte: 2-10 wie aufgedruckt, Bube 11, König 12, Ass 13, Dame 14. */
(function () {
  const SUITS = [
    { sym: "♠", red: false }, /* ♠ */
    { sym: "♥", red: true },  /* ♥ */
    { sym: "♦", red: true },  /* ♦ */
    { sym: "♣", red: false }  /* ♣ */
  ];
  const RANKS = [
    { r: "2", v: 2 }, { r: "3", v: 3 }, { r: "4", v: 4 }, { r: "5", v: 5 },
    { r: "6", v: 6 }, { r: "7", v: 7 }, { r: "8", v: 8 }, { r: "9", v: 9 },
    { r: "10", v: 10 }, { r: "B", v: 11 }, { r: "K", v: 12 }, { r: "A", v: 13 },
    { r: "D", v: 14 } /* Ladies first: die Dame schlägt alles */
  ];

  function buildDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank: rank.r, value: rank.v, suit: suit.sym, red: suit.red });
      }
    }
    return App.shuffle(deck);
  }

  let deck = buildDeck();
  let streak = []; /* aufgedeckte Karten der aktuellen Person */

  const stage = App.$("#game");

  function draw() {
    if (deck.length === 0) deck = buildDeck();
    return deck.pop();
  }

  function sum() {
    return streak.reduce(function (acc, c) { return acc + c.value; }, 0);
  }

  function clear() {
    stage.replaceChildren();
  }

  function cardFace(card) {
    const el = App.el("div", "playing-card" + (card.red ? " playing-card--red" : ""));
    const tl = App.el("span", "playing-card__corner playing-card__corner--tl");
    tl.append(App.el("span", "", card.rank), App.el("span", "", card.suit));
    const br = App.el("span", "playing-card__corner playing-card__corner--br");
    br.append(App.el("span", "", card.rank), App.el("span", "", card.suit));
    const center = App.el("div", "");
    center.append(App.el("div", "playing-card__rank", card.rank), App.el("div", "playing-card__suit", card.suit));
    center.classList.add("playing-card__center");
    el.append(tl, center, br);
    return el;
  }

  function cardBack() {
    const el = App.el("button", "playing-card playing-card--back");
    el.type = "button";
    el.setAttribute("aria-label", "Karte aufdecken");
    el.append(App.el("span", "playing-card__logo", "?"));
    return el;
  }

  function streakChips() {
    const wrap = App.el("div", "streak");
    for (const c of streak) {
      wrap.append(App.el("span", "streak__chip" + (c.red ? " streak__chip--red" : ""), c.rank + " " + c.suit));
    }
    return wrap;
  }

  /* Screen 1: verdeckte Karte, Handy ist bei der nächsten Person */
  function showHandoff() {
    clear();
    streak = [];
    const back = cardBack();
    back.addEventListener("click", function () {
      streak.push(draw());
      showTurn();
    });
    stage.append(
      App.el("p", "counter", "Nächste Person ist dran"),
      back,
      App.el("p", "hint", "Nur du schaust auf den Bildschirm. Tippe auf die Karte, um sie aufzudecken.")
    );
  }

  /* Screen 2: Karte aufgedeckt – aufhören oder riskieren? */
  function showTurn() {
    clear();
    const current = streak[streak.length - 1];
    const total = sum();

    const stopBtn = App.el("button", "btn btn--primary",
      "Aufhören – " + total + " Schlücke verteilen");
    stopBtn.type = "button";
    stopBtn.addEventListener("click", function () { showWin(total); });

    const riskBtn = App.el("button", "btn btn--secondary",
      current.rank === "D"
        ? "Riskieren unmöglich – nichts schlägt die Dame"
        : "Riskieren – nächste Karte ist höher als " + current.rank);
    riskBtn.type = "button";
    if (current.rank === "D") riskBtn.disabled = true;
    riskBtn.addEventListener("click", function () {
      const next = draw();
      if (next.value > current.value) {
        streak.push(next);
        showTurn();
      } else {
        showBust(next, current);
      }
    });

    const actions = App.el("div", "actions");
    actions.append(stopBtn, riskBtn);

    stage.append(
      App.el("span", "badge", streak.length + (streak.length === 1 ? " Karte" : " Karten") + " · " + total + " Schlücke"),
      cardFace(current)
    );
    if (current.rank === "D") {
      stage.append(App.el("p", "hint", "Ladies first! Die Dame schlägt alles – höher geht nicht mehr."));
    }
    stage.append(streakChips(), actions);
  }

  /* Gewonnen: Summe verteilen */
  function showWin(total) {
    clear();
    const nextBtn = App.el("button", "btn btn--primary", "Handy weitergeben");
    nextBtn.type = "button";
    nextBtn.addEventListener("click", showHandoff);
    stage.append(
      App.el("h2", "headline headline--ok", total + " Schlücke!"),
      App.el("p", "hint", "Verteile sie in der Runde – wie du willst."),
      streakChips(),
      nextBtn
    );
  }

  /* Verloren: alles weg */
  function showBust(lostCard, prev) {
    clear();
    const nextBtn = App.el("button", "btn btn--primary", "Handy weitergeben");
    nextBtn.type = "button";
    nextBtn.addEventListener("click", showHandoff);
    stage.append(
      App.el("h2", "headline headline--danger", "Alles verloren!"),
      cardFace(lostCard),
      App.el("p", "hint", lostCard.rank + " " + lostCard.suit + " ist nicht höher als " + prev.rank + " " + prev.suit + ". Keine Schlücke für dich zum Verteilen."),
      nextBtn
    );
  }

  showHandoff();
})();
