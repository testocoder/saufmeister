"use strict";

/* Bluff – Quiz-Bluff-Hybrid.
   Ablauf: Einsatz setzen → Frage + 3 Antworten sehen, eigene falsche Antwort
   erfinden → Gruppe stimmt über 4 gemischte Antworten ab → Auflösung.
   Regeln: Gruppe wählt den Bluff → Person verteilt doppelten Einsatz.
   Gruppe wählt die richtige Antwort → Person trinkt den Einsatz selbst.
   Gruppe wählt einen anderen Ablenker → Gruppe trinkt den Einsatz.
   Erwartet window.BLUFF_DATA = { categories: [{id, name, entries:[{q, correct, wrong:[3]}]}] }
   Von den 3 Ablenkern werden pro Runde 2 zufällig verwendet, damit die
   Abstimmung bei 4 Antworten bleibt. */
(function () {
  const data = window.BLUFF_DATA;
  if (!data || !Array.isArray(data.categories)) return;

  const MIN_BET = 1;
  const MAX_BET = 15;
  const MAX_ANSWER_LEN = 60;

  const stage = App.$("#game");
  const catState = App.catState("sm-cats-bluff", data.categories);

  let questions = null; /* Zieh-Stapel, folgt der Kategorie-Auswahl */
  let bet = 3;
  let round = null; /* { q, given, invented, options } */

  function clear() {
    stage.replaceChildren();
  }

  function rebuildPool() {
    questions = App.pool(catState.entries());
  }

  /* --- Kategorien wählen -------------------------------------------------- */
  function showCategories() {
    clear();
    stage.classList.add("stage--top");

    const doneBtn = App.el("button", "btn btn--primary", "");
    doneBtn.type = "button";
    doneBtn.addEventListener("click", function () {
      if (catState.entries().length > 0) {
        rebuildPool();
        showBet();
      }
    });

    function refresh() {
      const n = catState.entries().length;
      doneBtn.disabled = n === 0;
      doneBtn.textContent = n === 0
        ? "Wähle mindestens eine Kategorie"
        : "Fertig – " + n + " Fragen";
    }

    refresh();
    stage.append(
      App.el("h2", "headline", "Kategorien"),
      App.el("p", "hint", "Wählt aus, aus welchen Themen die Quizfragen kommen."),
      App.catPicker(data.categories, catState, refresh),
      doneBtn
    );
  }

  /* --- Screen 1: Einsatz festlegen -------------------------------------- */
  function showBet() {
    clear();
    stage.classList.remove("stage--top");
    if (!questions) rebuildPool();

    const q = questions.next();
    /* 2 der 3 Ablenker zufällig auswählen */
    const wrongPair = App.shuffle(q.wrong).slice(0, 2);
    round = { q: q, given: [q.correct].concat(wrongPair), invented: "", options: [] };

    const minus = App.el("button", "", "−");
    minus.type = "button";
    minus.setAttribute("aria-label", "Einsatz verringern");
    const plus = App.el("button", "", "+");
    plus.type = "button";
    plus.setAttribute("aria-label", "Einsatz erhöhen");
    const out = App.el("output", "", String(bet));

    function update() { out.textContent = String(bet); }
    minus.addEventListener("click", function () {
      if (bet > MIN_BET) { bet--; update(); }
    });
    plus.addEventListener("click", function () {
      if (bet < MAX_BET) { bet++; update(); }
    });

    const stepper = App.el("div", "stepper");
    stepper.append(minus, out, plus);

    const goBtn = App.el("button", "btn btn--primary", "Frage ansehen");
    goBtn.type = "button";
    goBtn.addEventListener("click", showQuestion);

    const catBtn = App.el("button", "btn btn--ghost", "Kategorien ändern");
    catBtn.type = "button";
    catBtn.addEventListener("click", showCategories);

    stage.append(
      App.el("h2", "headline", "Du bist dran."),
      App.el("p", "hint", "Setze blind deinen Einsatz, bevor du die Frage siehst. Fällt die Gruppe auf deinen Bluff rein, verteilst du das Doppelte."),
      App.el("p", "stepper-label", "Einsatz in Schlücken"),
      stepper,
      goBtn,
      catBtn
    );
  }

  /* --- Screen 2: Frage + eigene Bluff-Antwort --------------------------- */
  function showQuestion() {
    clear();
    const q = round.q;
    const given = round.given;

    const list = App.el("ul", "options");
    for (const answer of App.shuffle(given)) {
      const li = App.el("li", "option", answer);
      if (answer === q.correct) {
        li.classList.add("option--correct");
        li.append(App.el("span", "option__tag", "richtig"));
      }
      list.append(li);
    }

    const input = App.el("input", "free-input");
    input.type = "text";
    input.maxLength = MAX_ANSWER_LEN;
    input.placeholder = "Deine erfundene 4. Antwort …";
    input.autocomplete = "off";
    input.enterKeyHint = "done";

    const error = App.el("p", "form-error", "");

    const form = App.el("form", "actions");
    const submit = App.el("button", "btn btn--primary", "Abstimmung starten");
    submit.type = "submit";
    form.append(input, error, submit);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const invented = input.value.trim().slice(0, MAX_ANSWER_LEN);
      if (!invented) {
        error.textContent = "Erfinde erst eine eigene Antwort.";
        return;
      }
      const clash = round.q.wrong.concat([round.q.correct]).some(function (a) {
        return a.toLowerCase() === invented.toLowerCase();
      });
      if (clash) {
        error.textContent = "Die Antwort gibt es schon – denk dir eine neue aus.";
        return;
      }
      round.invented = invented;
      round.options = App.shuffle(given.concat([invented]));
      showHandover();
    });

    stage.append(
      App.el("p", "counter", "Nur für deine Augen · Einsatz: " + bet),
      App.el("div", "question-box", q.q),
      list,
      App.el("p", "hint", "Denk dir eine falsche, aber überzeugende 4. Antwort aus."),
      form
    );
    input.focus();
  }

  /* --- Screen 3a: Handy an die Gruppe ----------------------------------- */
  function showHandover() {
    clear();
    const goBtn = App.el("button", "btn btn--primary", "Antworten zeigen");
    goBtn.type = "button";
    goBtn.addEventListener("click", showVote);
    stage.append(
      App.el("h2", "headline", "Bluff platziert."),
      App.el("p", "hint", "Gib das Handy in die Runde. Die Gruppe einigt sich gleich auf eine gemeinsame Antwort."),
      goBtn
    );
  }

  /* --- Screen 3b: Gruppe stimmt ab -------------------------------------- */
  function showVote() {
    clear();
    const list = App.el("ul", "options");
    for (const answer of round.options) {
      const li = App.el("li");
      const btn = App.el("button", "option", answer);
      btn.type = "button";
      btn.addEventListener("click", function () { showResult(answer); });
      li.append(btn);
      list.append(li);
    }
    stage.append(
      App.el("p", "counter", "Die Gruppe ist dran · Einsatz: " + bet),
      App.el("div", "question-box", round.q.q),
      list,
      App.el("p", "hint", "Diskutiert und einigt euch auf EINE Antwort. Dann tippt sie an.")
    );
  }

  /* --- Screen 4: Auflösung ----------------------------------------------- */
  function showResult(chosen) {
    clear();
    const q = round.q;

    let title, titleClass, outcome;
    if (chosen === round.invented) {
      title = "Reingefallen!";
      titleClass = "headline headline--ok";
      outcome = "Die Gruppe hat den Bluff gewählt. Verteile " + (bet * 2) + " Schlücke (doppelter Einsatz) in der Runde.";
    } else if (chosen === q.correct) {
      title = "Aufgeflogen!";
      titleClass = "headline headline--danger";
      outcome = "Die Gruppe hat die richtige Antwort gefunden. Du trinkst deinen Einsatz selbst: " + bet + " " + (bet === 1 ? "Schluck" : "Schlücke") + ".";
    } else {
      title = "Daneben!";
      titleClass = "headline";
      outcome = "Falsch geraten – aber dein Bluff blieb unentdeckt. Die Gruppe trinkt " + bet + " " + (bet === 1 ? "Schluck" : "Schlücke") + ".";
    }

    const list = App.el("ul", "options");
    for (const answer of round.options) {
      const li = App.el("li", "option", answer);
      if (answer === q.correct) {
        li.classList.add("option--correct");
        li.append(App.el("span", "option__tag", "richtig"));
      } else if (answer === round.invented) {
        li.classList.add("option--bluff");
        li.append(App.el("span", "option__tag", "Bluff"));
      } else if (answer === chosen) {
        li.classList.add("option--plain-chosen");
        li.append(App.el("span", "option__tag", "eure Wahl"));
      }
      if (answer === chosen) li.classList.add("option--chosen");
      list.append(li);
    }

    const nextBtn = App.el("button", "btn btn--primary", "Nächste Runde");
    nextBtn.type = "button";
    nextBtn.addEventListener("click", showBet);

    stage.append(
      App.el("h2", titleClass, title),
      App.el("p", "hint", outcome),
      list,
      nextBtn
    );
  }

  showBet();
})();
