/* ============================================================
   AZ-900 Simulados — app.js
   Motor de simulados: hub, exame (6 formatos), treino/prática,
   cronômetro, marcar p/ revisar, gráfico por seção, dica final,
   tema claro/escuro e histórico (10 tentativas por simulado).
   ============================================================ */
(function () {
  "use strict";
  const POOL = window.POOL || [];
  const SIMULADOS = window.SIMULADOS || [];
  const DOMAINS = window.DOMAINS || {};
  const DOMORDER = ["conceitos", "arquitetura", "governanca"];
  const DOMCOLOR = { conceitos: "#8b5cf6", arquitetura: "#0ea5b7", governanca: "#e3a008" };
  const KEYS = ["A", "B", "C", "D"];
  const FORMLBL = { mc: "Múltipla escolha", multi: "Escolha duas", tf: "Verdadeiro / Falso", yesno: "V ou F por afirmação", dnd: "Arrastar e soltar", fill: "Completar lacunas" };
  const CUT = 70; // linha de corte de referência (%)

  const $ = (s) => document.querySelector(s);
  const app = () => document.getElementById("app");

  /* ---------- armazenamento ---------- */
  function lsGet(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }

  /* ---------- tema ---------- */
  function initTheme() { const t = lsGet("azq_theme", "dark"); document.documentElement.setAttribute("data-theme", t); }
  function themeLabel() { return (document.documentElement.getAttribute("data-theme") === "dark") ? "☀️ Claro" : "🌙 Escuro"; }
  function toggleTheme() { const cur = document.documentElement.getAttribute("data-theme") || "dark"; const nx = cur === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", nx); lsSet("azq_theme", nx); renderChrome(); }

  /* ---------- estado ---------- */
  const state = { view: "hub", sim: null, Q: [], i: 0, mode: "treino", picks: {}, revealed: {}, flags: new Set(), done: false, t0: 0, tick: null, sel: null, histSim: null };

  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = (ms) => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  const reindex = (arr) => arr.map((q, i) => Object.assign({}, q, { n: i + 1 }));

  function qtext(q) {
    let x = (q.s || "") + " " + (q.k || "");
    if (q.o) x += " " + q.o.join(" ");
    if (q.chips) x += " " + q.chips.map((c) => c.label).join(" ");
    if (q.slots) x += " " + q.slots.map((z) => z.req).join(" ");
    if (q.segs) x += " " + q.segs.filter((y) => typeof y === "object").map((b) => b.opts.join(" ")).join(" ");
    if (q.st) x += " " + q.st.map((z) => z.t).join(" ");
    return x;
  }

  /* ---------- seleção de questões ---------- */
  const REQ = [/data lake/i, /data factory/i, /management group/i, /(grupo de recursos|resource group)/i];
  const RXSCALE = /escala (vertical|horizontal)|scale ?(up|out|down|in)|verticalmente|horizontalmente/i;

  function geralSelect(pool) {
    const used = new Set(); const chosen = [];
    REQ.forEach((rx) => { const c = []; pool.forEach((q, i) => { if (!used.has(i) && rx.test(qtext(q))) c.push(i); }); if (c.length) { const i = c[Math.floor(Math.random() * c.length)]; used.add(i); chosen.push(pool[i]); } });
    const rest = []; pool.forEach((q, i) => { if (!used.has(i)) rest.push(q); });
    shuffle(rest);
    let scal = chosen.filter((q) => RXSCALE.test(qtext(q))).length;
    for (const q of rest) { if (chosen.length >= 70) break; const s = RXSCALE.test(qtext(q)); if (s && scal >= 2) continue; if (s) scal++; chosen.push(q); }
    return shuffle(chosen).slice(0, 70);
  }
  function buildExam(sim) {
    let pool = sim.dom === "all" ? POOL.slice() : POOL.filter((q) => q.domain === sim.dom);
    if (sim.modo === "todas") return reindex(shuffle(pool));
    if (sim.modo === "geral") return reindex(geralSelect(pool));
    return reindex(shuffle(pool).slice(0, Math.min(sim.n, pool.length)));
  }
  function simSize(sim) {
    const pool = sim.dom === "all" ? POOL : POOL.filter((q) => q.domain === sim.dom);
    if (sim.modo === "todas") return pool.length;
    if (sim.modo === "geral") return 70;
    return Math.min(sim.n, pool.length);
  }

  /* ---------- correção ---------- */
  function answered(q) {
    const p = state.picks[q.n];
    switch (q.type) {
      case "mc": case "tf": return !!p;
      case "multi": return Array.isArray(p) && p.length === q.need;
      case "yesno": return Array.isArray(p) && p.length === q.st.length && p.every((x) => x !== undefined && x !== null);
      case "dnd": return p && Object.keys(p).length === q.slots.length;
      case "fill": { const bl = q.segs.filter((x) => typeof x === "object"); return Array.isArray(p) && p.filter((x) => x !== undefined && x !== null).length === bl.length; }
    }
  }
  function isCorrect(q) {
    const p = state.picks[q.n]; if (!answered(q)) return false;
    switch (q.type) {
      case "mc": case "tf": return p === q.a;
      case "multi": return p.length === q.a.length && q.a.every((x) => p.includes(x));
      case "yesno": return q.st.every((s, i) => p[i] === s.a);
      case "dnd": return q.slots.every((s, i) => p[i] === s.a);
      case "fill": { let bi = 0; return q.segs.every((x) => (typeof x === "string" ? true : p[bi++] === x.a)); }
    }
  }
  const needsConfirm = (q) => ["multi", "yesno", "dnd", "fill"].includes(q.type);
  const score = () => state.Q.filter(isCorrect).length;
  const answeredCount = () => state.Q.filter(answered).length;

  function correctSummary(q) {
    switch (q.type) {
      case "mc": return q.a + ") " + q.o[KEYS.indexOf(q.a)];
      case "tf": return q.a === "V" ? "Verdadeiro" : "Falso";
      case "multi": return q.a.map((l) => l + ") " + q.o[KEYS.indexOf(l)]).join(" · ");
      case "yesno": return q.st.map((s, i) => (i + 1) + "=" + (s.a ? "V" : "F")).join("  ");
      case "dnd": return q.slots.map((sl) => q.chips.find((c) => c.id === sl.a).label).join(" · ");
      case "fill": return q.segs.filter((x) => typeof x === "object").map((b) => b.opts[b.a]).join(" · ");
    }
  }
  function yourSummary(q) {
    const p = state.picks[q.n];
    if (p === undefined || p === null || (Array.isArray(p) && !p.length) || (typeof p === "object" && !Array.isArray(p) && !Object.keys(p || {}).length)) return "— (em branco)";
    switch (q.type) {
      case "mc": return p + ") " + q.o[KEYS.indexOf(p)];
      case "tf": return p === "V" ? "Verdadeiro" : "Falso";
      case "multi": return p.map((l) => l + ") " + q.o[KEYS.indexOf(l)]).join(" · ");
      case "yesno": return q.st.map((s, i) => (i + 1) + "=" + (p[i] === undefined ? "?" : (p[i] ? "V" : "F"))).join("  ");
      case "dnd": return q.slots.map((sl, i) => (p[i] ? q.chips.find((c) => c.id === p[i]).label : "?")).join(" · ");
      case "fill": { let bi = 0; return q.segs.filter((x) => typeof x === "object").map((b) => { const v = p[bi++]; return v === undefined ? "?" : b.opts[v]; }).join(" · "); }
    }
  }

  /* ---------- cabeçalho (chrome) ---------- */
  function renderChrome() {
    const tools = $("#htools");
    let html = "";
    if (state.view === "exam") html += '<button class="iconbtn" id="exitBtn">← Sair</button>';
    if (state.view === "results" || state.view === "history") html += '<button class="iconbtn" id="homeBtn2">← Início</button>';
    html += '<button class="iconbtn" id="themeBtn">' + themeLabel() + "</button>";
    tools.innerHTML = html;
    const eb = $("#exitBtn"); if (eb) eb.onclick = exitToHub;
    const hb = $("#homeBtn2"); if (hb) hb.onclick = () => { state.view = "hub"; render(); };
    $("#themeBtn").onclick = toggleTheme;

    const bar = $("#hbar");
    if (state.view === "exam") {
      bar.innerHTML =
        '<div class="hrow" style="margin-top:6px">' +
        '<div class="hstats">' +
        '<span>Questão <b id="pos">' + (state.i + 1) + "</b>/" + state.Q.length + "</span>" +
        '<span>Respondidas <b id="ans">' + answeredCount() + "</b></span>" +
        '<span id="scoreLive" style="display:' + (state.mode === "treino" ? "inline" : "none") + '">Acertos <b>' + score() + "</b></span>" +
        '<span>⏱ <b id="timer">' + fmt(Date.now() - state.t0) + "</b></span>" +
        "</div>" +
        '<div class="modewrap" role="group" aria-label="Modo">' +
        '<button id="mTreino" aria-pressed="' + (state.mode === "treino") + '">Treino · feedback na hora</button>' +
        '<button id="mPratica" aria-pressed="' + (state.mode === "pratica") + '">Prática · prova</button>' +
        "</div></div>" +
        '<div class="track" style="margin-top:8px"><i id="bar" style="width:' + (answeredCount() / state.Q.length * 100) + '%"></i></div>';
      $("#mTreino").onclick = () => setMode("treino");
      $("#mPratica").onclick = () => setMode("pratica");
    } else bar.innerHTML = "";
  }
  function updHeaderStats() {
    if (state.view !== "exam") return;
    const p = $("#pos"); if (p) p.textContent = state.i + 1;
    const a = $("#ans"); if (a) a.textContent = answeredCount();
    const sl = $("#scoreLive"); if (sl) { sl.style.display = state.mode === "treino" ? "inline" : "none"; sl.querySelector("b").textContent = score(); }
    const b = $("#bar"); if (b) b.style.width = (answeredCount() / state.Q.length * 100) + "%";
  }
  function startTimer() { if (state.tick) clearInterval(state.tick); state.tick = setInterval(() => { if (!state.done) { const t = $("#timer"); if (t) t.textContent = fmt(Date.now() - state.t0); } }, 1000); }

  /* ---------- HUB ---------- */
  function renderHub() {
    if (state.tick) clearInterval(state.tick);
    const cardFor = (id, nome, desc, sizeLabel, dot, custom) => {
      const attempts = lsGet("azq_hist_" + id, []);
      const best = attempts.length ? Math.max.apply(null, attempts.map((a) => a.pct)) : null;
      return '<button class="simcard' + (custom ? " custom" : "") + '" data-sim="' + id + '">' +
        '<div class="cardtop"><h3>' + dot + " " + nome + '</h3><span class="count">' + sizeLabel + "</span></div>" +
        "<p>" + desc + "</p>" +
        '<div class="cardfoot">' +
        (best !== null ? '<span class="best">Melhor: ' + best + "%</span>" : "<span>Sem tentativas</span>") +
        (attempts.length ? '<span>·</span><span class="histlink" data-hist="' + id + '">histórico (' + attempts.length + ")</span>" : "") +
        "</div></button>";
    };
    let cards = SIMULADOS.map((sim) => cardFor(sim.id, sim.nome, sim.desc, simSize(sim) + " q", sim.dom !== "all" ? '<span class="domdot" style="background:' + DOMCOLOR[sim.dom] + '"></span>' : "", false)).join("");
    cards += cardFor("personalizado", "Simulado Personalizado", "Você escolhe os tópicos e quantas questões quer. Monte seu próprio treino focado.", "⚙️ montar", "✨", true);
    app().innerHTML =
      '<div class="hub-intro"><h2>Escolha um simulado</h2>' +
      "<p>Simulados por seção da prova, os gerais ou monte o seu. Todos têm modo Treino/Prática, cronômetro, marcar para revisar, gráfico por seção e histórico das últimas 10 tentativas.</p></div>" +
      '<div class="simgrid">' + cards + "</div>" +
      '<footer class="legend" style="margin-top:22px">' +
      Object.keys(DOMAINS).map((d) => '<span><i style="background:' + DOMCOLOR[d] + '"></i>' + DOMAINS[d] + "</span>").join("") +
      "</footer>";
    app().querySelectorAll(".simcard").forEach((c) => {
      c.onclick = (e) => {
        const hl = e.target.closest("[data-hist]");
        if (hl) { openHistory(hl.dataset.hist); return; }
        if (c.dataset.sim === "personalizado") openCustom(); else startSim(c.dataset.sim);
      };
    });
  }

  /* ---------- Simulado personalizado ---------- */
  function openCustom() { state.view = "custom"; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function renderCustom() {
    if (state.tick) clearInterval(state.tick);
    
    const counts = {};
    DOMORDER.forEach((d) => {
      counts[d] = POOL.filter((q) => q.domain === d).length;
    });

    const groups = DOMORDER.map((d) => {
      return '<label class="domain-chk-card">' +
        '<input type="checkbox" class="dchk" data-domain="' + d + '" checked>' +
        '<div class="dchk-info">' +
          '<h4><span class="domdot" style="background:' + DOMCOLOR[d] + '"></span>' + DOMAINS[d] + '</h4>' +
          '<span class="cnt">' + counts[d] + ' questões disponíveis</span>' +
        '</div>' +
      '</label>';
    }).join("");

    app().innerHTML =
      '<div class="hub-intro"><h2>Simulado Personalizado</h2><p>Escolha os domínios e a distribuição das questões para sua prática.</p></div>' +
      '<div class="custom-cfg">' +
      '<div class="domain-selection">' + groups + '</div>' +
      
      '<span class="cfg-group-title">Distribuição das questões</span>' +
      '<div class="dist-options">' +
        '<label class="dist-opt">' +
          '<input type="radio" name="distMode" value="aleatoria" checked>' +
          '<div class="dist-opt-info">' +
            '<b>Totalmente Aleatória</b>' +
            '<span>Mistura todas as questões das seções marcadas de forma livre.</span>' +
          '</div>' +
        '</label>' +
        '<label class="dist-opt">' +
          '<input type="radio" name="distMode" value="igualitaria">' +
          '<div class="dist-opt-info">' +
            '<b>Igualitária / Balanceada</b>' +
            '<span>Garante divisão de quantidade idêntica entre as seções que você escolheu.</span>' +
          '</div>' +
        '</label>' +
        '<label class="dist-opt">' +
          '<input type="radio" name="distMode" value="oficial">' +
          '<div class="dist-opt-info">' +
            '<b>Carga Oficial da Prova</b>' +
            '<span>Aplica proporções aproximadas da prova oficial (Conceitos: 28%, Arquitetura: 37%, Governança: 35%).</span>' +
          '</div>' +
        '</label>' +
      '</div>' +

      '<div class="cfg-row" style="margin-top:20px"><label for="qtd">Quantas questões?</label><input type="range" id="qtdRange" min="1" max="50" value="20"><input type="number" id="qtd" min="1" value="20"></div>' +
      '<div class="avail" id="avail"></div>' +
      '<div class="controls"><button class="btn ghost" id="cCancel">← Voltar</button><div class="spacer"></div><button class="btn primary" id="cStart">Iniciar simulado</button></div>' +
      "</div>";

    const selectedDomains = () => {
      const s = new Set();
      app().querySelectorAll(".dchk:checked").forEach((c) => s.add(c.dataset.domain));
      return s;
    };

    const getSelectedDistMode = () => {
      const checked = app().querySelector('input[name="distMode"]:checked');
      return checked ? checked.value : "aleatoria";
    };

    const upd = () => {
      const sel = selectedDomains();
      const avail = POOL.filter((q) => sel.has(q.domain)).length;
      const range = $("#qtdRange"), num = $("#qtd");
      range.max = Math.max(1, avail);
      if (+num.value > avail) num.value = avail || 1;
      if (+num.value < 1) num.value = 1;
      range.value = num.value;
      $("#avail").innerHTML = "<b>" + avail + "</b> questões disponíveis com esta seleção. O simulado usará <b>" + Math.min(+num.value, avail) + "</b>.";
      $("#cStart").disabled = avail === 0;
    };

    app().querySelectorAll(".dchk").forEach((c) => (c.onchange = upd));
    $("#qtdRange").oninput = () => { $("#qtd").value = $("#qtdRange").value; upd(); };
    $("#qtd").oninput = upd;
    $("#cCancel").onclick = () => { state.view = "hub"; render(); };
    $("#cStart").onclick = () => startCustom(selectedDomains(), +$("#qtd").value, getSelectedDistMode());
    upd();
    renderChrome();
  }
  function startCustom(sel, n, distMode) {
    const selectedList = Array.from(sel);
    if (!selectedList.length) return;

    let finalQuestions = [];

    if (distMode === "aleatoria") {
      const matches = POOL.filter((q) => sel.has(q.domain));
      n = Math.max(1, Math.min(n || matches.length, matches.length));
      finalQuestions = shuffle(matches.slice()).slice(0, n);
    } else {
      const poolByDomain = {};
      selectedList.forEach(d => {
        poolByDomain[d] = shuffle(POOL.filter(q => q.domain === d).slice());
      });

      let weights = {};
      if (distMode === "oficial") {
        const baseWeights = { conceitos: 0.28, arquitetura: 0.37, governanca: 0.35 };
        let sumWeights = 0;
        selectedList.forEach(d => { sumWeights += baseWeights[d] || 0; });
        selectedList.forEach(d => {
          weights[d] = (baseWeights[d] || 0) / sumWeights;
        });
      } else {
        selectedList.forEach(d => {
          weights[d] = 1 / selectedList.length;
        });
      }

      n = Math.max(1, n);

      let targets = {};
      let allocated = 0;
      selectedList.forEach(d => {
        let target = Math.round(weights[d] * n);
        target = Math.min(target, poolByDomain[d].length);
        targets[d] = target;
        allocated += target;
      });

      let diff = n - allocated;
      if (diff !== 0) {
        const sortedDomains = selectedList.slice().sort((a, b) => weights[b] - weights[a]);
        if (diff > 0) {
          for (let i = 0; i < sortedDomains.length && diff > 0; i++) {
            const d = sortedDomains[i];
            const available = poolByDomain[d].length - targets[d];
            const toAdd = Math.min(diff, available);
            targets[d] += toAdd;
            diff -= toAdd;
          }
          if (diff > 0) {
            n -= diff;
          }
        } else if (diff < 0) {
          for (let i = 0; i < sortedDomains.length && diff < 0; i++) {
            const d = sortedDomains[i];
            const toRemove = Math.min(-diff, targets[d]);
            targets[d] -= toRemove;
            diff += toRemove;
          }
        }
      }

      selectedList.forEach(d => {
        finalQuestions.push(...poolByDomain[d].slice(0, targets[d]));
      });

      shuffle(finalQuestions);
    }

    state.sim = { id: "personalizado", nome: "Simulado Personalizado", dom: "custom" };
    state.Q = reindex(finalQuestions);
    state.i = 0; state.picks = {}; state.revealed = {}; state.flags = new Set(); state.done = false; state.sel = null; state.t0 = Date.now();
    state.view = "exam"; startTimer(); render(); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- iniciar simulado ---------- */
  function startSim(id) {
    const sim = SIMULADOS.find((s) => s.id === id);
    state.sim = sim; state.Q = buildExam(sim); state.i = 0; state.picks = {}; state.revealed = {}; state.flags = new Set(); state.done = false; state.sel = null; state.t0 = Date.now();
    state.view = "exam"; startTimer(); render();
  }
  function newDraw() { startSim(state.sim.id); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function retrySame() { state.picks = {}; state.revealed = {}; state.done = false; state.i = 0; state.sel = null; state.t0 = Date.now(); state.view = "exam"; startTimer(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function exitToHub() { if (!state.done && answeredCount() > 0 && !confirm("Sair sem finalizar? O progresso desta tentativa será perdido.")) return; if (state.tick) clearInterval(state.tick); state.view = "hub"; render(); }
  function setMode(m) { state.mode = m; if (m === "pratica") state.revealed = {}; render(); }

  /* ---------- EXAME ---------- */
  function renderExam() {
    const q = state.Q[state.i];
    const revealed = state.mode === "treino" && state.revealed[q.n];
    let body = questionBody(q, revealed);
    const confirmBtn = (state.mode === "treino" && needsConfirm(q) && !revealed) ?
      '<button class="btn confirm" id="confirm" ' + (answered(q) ? "" : "disabled") + ">Confirmar resposta</button>" : "";
    app().innerHTML =
      '<div class="card">' +
      '<div class="qhead"><span class="qnum">Questão ' + q.n + '</span><span class="qkind">' + (q.k || "") + '</span>' +
      '<button class="flagbtn ' + (state.flags.has(q.n) ? "on" : "") + '" id="flagBtn">' + (state.flags.has(q.n) ? "★ marcada" : "☆ revisar depois") + "</button>" +
      '<span class="qform">' + FORMLBL[q.type] + "</span></div>" +
      '<p class="stem">' + q.s + "</p>" + body +
      '<div class="explain ' + (revealed ? "show" : "") + '"><b>Por quê:</b> ' + q.e + "</div>" +
      '<div class="controls">' +
      '<button class="btn ghost" id="prev" ' + (state.i === 0 ? "disabled" : "") + ">← Anterior</button>" +
      confirmBtn + '<div class="spacer"></div>' +
      (state.i < state.Q.length - 1 ? '<button class="btn primary" id="next">Próxima →</button>' : "") +
      '<button class="btn finish" id="finish">Finalizar</button>' +
      "</div></div>" + navHtml();
    wireQuestion(q, revealed);
    $("#flagBtn").onclick = () => { if (state.flags.has(q.n)) state.flags.delete(q.n); else state.flags.add(q.n); render(); };
    const pv = $("#prev"); if (pv) pv.onclick = () => go(state.i - 1);
    const nx = $("#next"); if (nx) nx.onclick = () => go(state.i + 1);
    const cf = $("#confirm"); if (cf) cf.onclick = () => { if (answered(q)) { state.revealed[q.n] = true; render(); } };
    $("#finish").onclick = confirmFinish;
    wireNav();
    renderChrome();
  }
  function go(idx) { if (idx < 0 || idx >= state.Q.length) return; state.i = idx; state.sel = null; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }

  function navHtml() {
    let cells = state.Q.map((q, idx) => {
      let cls = "";
      if (idx === state.i) cls += " cur";
      if (state.flags.has(q.n)) cls += " flag";
      if (answered(q)) { if ((state.mode === "treino" && state.revealed[q.n])) cls += isCorrect(q) ? " ok" : " no"; else cls += " done"; }
      return '<button class="' + cls.trim() + '" data-idx="' + idx + '">' + q.n + "</button>";
    }).join("");
    return '<div class="nav" id="nav">' + cells + "</div>" +
      '<footer class="legend"><span><i style="background:var(--track)"></i> pendente</span><span><i style="background:var(--amber)"></i> marcada</span><span><i style="background:var(--correct)"></i> certa</span><span><i style="background:var(--wrong)"></i> errada</span></footer>';
  }
  function wireNav() { app().querySelectorAll("#nav button").forEach((b) => (b.onclick = () => go(+b.dataset.idx))); }

  function questionBody(q, revealed) {
    if (q.type === "mc" || q.type === "multi") {
      const pick = state.picks[q.n];
      return '<div class="opts">' + q.o.map((txt, idx) => {
        const key = KEYS[idx]; let sel = q.type === "mc" ? pick === key : (Array.isArray(pick) && pick.includes(key)); let cls = "opt", mark = "";
        if (sel) cls += " sel";
        if (revealed) { const right = q.type === "mc" ? q.a === key : q.a.includes(key); if (right) { cls += " correct"; mark = "✓"; } else if (sel) { cls += " incorrect"; mark = "✗"; } }
        return '<button class="' + cls + '" data-k="' + key + '" ' + (revealed ? "disabled" : "") + '><span class="k">' + key + "</span><span>" + txt + "</span>" + (mark ? '<span class="mark">' + mark + "</span>" : "") + "</button>";
      }).join("") + "</div>";
    }
    if (q.type === "tf") {
      const pick = state.picks[q.n];
      return '<div class="tfrow">' + [["V", "Verdadeiro"], ["F", "Falso"]].map(([key, txt]) => {
        let sel = pick === key, cls = "opt", mark = "";
        if (sel) cls += " sel";
        if (revealed) { if (q.a === key) { cls += " correct"; mark = "✓"; } else if (sel) { cls += " incorrect"; mark = "✗"; } }
        return '<button class="' + cls + '" data-k="' + key + '" ' + (revealed ? "disabled" : "") + '><span class="k">' + key + "</span><span>" + txt + "</span>" + (mark ? '<span class="mark">' + mark + "</span>" : "") + "</button>";
      }).join("") + "</div>";
    }
    if (q.type === "yesno") {
      const pick = state.picks[q.n] || [];
      return '<div class="stmts">' + q.st.map((st, si) => {
        const rows = [[true, "Verdadeiro"], [false, "Falso"]].map(([val, txt]) => {
          let sel = pick[si] === val, cls = "";
          if (sel) cls = "sel";
          if (revealed) { if (st.a === val) cls = "correct"; else if (sel) cls = "incorrect"; }
          return '<button class="' + cls + '" data-si="' + si + '" data-v="' + val + '" ' + (revealed ? "disabled" : "") + ">" + txt + "</button>";
        }).join("");
        return '<div class="stmt"><div class="txt">' + (si + 1) + ". " + st.t + '</div><div class="choices">' + rows + "</div></div>";
      }).join("") + "</div>";
    }
    if (q.type === "dnd") {
      const pick = state.picks[q.n] || {}; const usedIds = Object.values(pick);
      const tray = q.chips.filter((c) => !usedIds.includes(c.id));
      let h = '<div class="dndhelp">Toque em um item e depois no destino (ou arraste, no computador).</div><div class="slots">';
      h += q.slots.map((sl, si) => {
        const cid = pick[si]; const chip = cid ? q.chips.find((c) => c.id === cid) : null; let inner;
        if (chip) {
          let ccls = "chip"; if (revealed) ccls += cid === sl.a ? " correct" : " incorrect";
          inner = '<span class="' + ccls + '" data-slotchip="' + si + '" ' + (revealed ? "" : 'draggable="true" data-drag="' + cid + '" data-fromslot="' + si + '"') + ">" + chip.label + "</span>";
          if (revealed && cid !== sl.a) inner += '<div class="fixnote">correto: ' + q.chips.find((c) => c.id === sl.a).label + "</div>";
          else if (revealed) inner += '<div class="okmini">✓</div>';
        } else inner = '<span class="placeholder">solte aqui</span>';
        return '<div class="slot" data-slot="' + si + '"><div class="req">' + sl.req + '</div><div class="drop">' + inner + "</div></div>";
      }).join("") + "</div>";
      if (!revealed) h += '<div class="tray"><span class="traylbl">Itens</span>' + (tray.length ? tray.map((c) => '<span class="chip ' + (state.sel === c.id ? "picked" : "") + '" draggable="true" data-drag="' + c.id + '" data-chip="' + c.id + '">' + c.label + "</span>").join("") : '<span class="placeholder">todos posicionados</span>') + "</div>";
      return h;
    }
    if (q.type === "fill") {
      const pick = state.picks[q.n] || []; let bi = 0;
      return '<div class="fill">' + q.segs.map((seg) => {
        if (typeof seg === "string") return seg.replace(/</g, "&lt;");
        const idx = bi++; const chosen = pick[idx]; let cls = "", fix = "";
        if (revealed) { if (chosen === seg.a) cls = "correct"; else { cls = "incorrect"; fix = ' <span class="fixtag">(correto: ' + seg.opts[seg.a] + ")</span>"; } }
        const opts = '<option value="">— escolha —</option>' + seg.opts.map((o, oi) => '<option value="' + oi + '" ' + (chosen === oi ? "selected" : "") + ">" + o + "</option>").join("");
        return '<select class="' + cls + '" data-blank="' + idx + '" ' + (revealed ? "disabled" : "") + ">" + opts + "</select>" + fix;
      }).join("") + "</div>";
    }
    return "";
  }

  function wireQuestion(q, revealed) {
    if (revealed && q.type !== "dnd") return;
    if (q.type === "mc" || q.type === "tf") {
      app().querySelectorAll(".opt").forEach((b) => (b.onclick = () => { if (revealed) return; state.picks[q.n] = b.dataset.k; if (state.mode === "treino") state.revealed[q.n] = true; render(); }));
    } else if (q.type === "multi") {
      app().querySelectorAll(".opt").forEach((b) => (b.onclick = () => { if (revealed) return; let arr = Array.isArray(state.picks[q.n]) ? state.picks[q.n].slice() : []; const k = b.dataset.k; if (arr.includes(k)) arr = arr.filter((x) => x !== k); else { if (arr.length >= q.need) arr.shift(); arr.push(k); } state.picks[q.n] = arr; render(); }));
    } else if (q.type === "yesno") {
      app().querySelectorAll(".stmt .choices button").forEach((b) => (b.onclick = () => { if (revealed) return; const si = +b.dataset.si, v = b.dataset.v === "true"; let arr = Array.isArray(state.picks[q.n]) ? state.picks[q.n].slice() : new Array(q.st.length).fill(undefined); arr[si] = v; state.picks[q.n] = arr; render(); }));
    } else if (q.type === "fill") {
      app().querySelectorAll(".fill select").forEach((sel) => (sel.onchange = () => { const bi = +sel.dataset.blank; const bl = q.segs.filter((x) => typeof x === "object").length; let arr = Array.isArray(state.picks[q.n]) ? state.picks[q.n].slice() : new Array(bl).fill(undefined); arr[bi] = sel.value === "" ? undefined : +sel.value; state.picks[q.n] = arr; render(); }));
    } else if (q.type === "dnd") {
      if (revealed) return;
      const assign = (slot, chip) => { const p = Object.assign({}, state.picks[q.n] || {}); for (const k of Object.keys(p)) if (p[k] === chip) delete p[k]; p[slot] = chip; state.picks[q.n] = p; state.sel = null; render(); };
      app().querySelectorAll("[data-chip]").forEach((c) => { c.onclick = () => { state.sel = state.sel === c.dataset.chip ? null : c.dataset.chip; render(); }; c.ondragstart = (e) => e.dataTransfer.setData("text/plain", c.dataset.drag); });
      app().querySelectorAll("[data-slotchip]").forEach((c) => { c.onclick = (e) => { e.stopPropagation(); const p = Object.assign({}, state.picks[q.n] || {}); delete p[c.dataset.fromslot]; state.picks[q.n] = p; render(); }; c.ondragstart = (e) => e.dataTransfer.setData("text/plain", c.dataset.drag); });
      app().querySelectorAll("[data-slot]").forEach((s) => {
        const si = +s.dataset.slot;
        s.onclick = (e) => { if (e.target.closest("[data-slotchip]")) return; if (state.sel) assign(si, state.sel); };
        s.ondragover = (e) => { e.preventDefault(); s.classList.add("over"); };
        s.ondragleave = () => s.classList.remove("over");
        s.ondrop = (e) => { e.preventDefault(); s.classList.remove("over"); const id = e.dataTransfer.getData("text/plain"); if (id) assign(si, id); };
      });
    }
  }

  /* ---------- métricas por domínio ---------- */
  function perDomain() {
    const d = {};
    state.Q.forEach((q) => { const k = q.domain || "arquitetura"; d[k] = d[k] || { c: 0, t: 0 }; d[k].t++; if (isCorrect(q)) d[k].c++; });
    return d;
  }
  function weakTopics() {
    const w = {};
    state.Q.forEach((q) => { if (!isCorrect(q)) { const k = q.k || "geral"; w[k] = (w[k] || 0) + 1; } });
    return Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
  }

  /* ---------- FINALIZAR ---------- */
  function confirmFinish() {
    const pend = state.Q.length - answeredCount();
    const flagged = state.flags.size;
    let msg = "";
    if (pend > 0) msg += pend + " questão(ões) em branco. ";
    if (flagged > 0) msg += flagged + " marcada(s) para revisar. ";
    if (msg && !confirm(msg + "Finalizar mesmo assim?")) return;
    finish();
  }
  function finish() {
    if (state.tick) clearInterval(state.tick);
    const total = state.Q.length, sc = score(), pct = Math.round(sc / total * 100), timeSec = Math.floor((Date.now() - state.t0) / 1000);
    const pd = perDomain();
    const items = state.Q.map((q) => ({ s: (q.s || "").replace(/<[^>]+>/g, "").slice(0, 180), k: q.k, d: q.domain, ok: isCorrect(q), flag: state.flags.has(q.n), ya: yourSummary(q), ca: correctSummary(q), e: (q.e || "").replace(/<[^>]+>/g, "").slice(0, 260) }));
    const attempt = { date: new Date().toISOString(), simId: state.sim.id, simNome: state.sim.nome, mode: state.mode, score: sc, total, pct, timeSec, perDomain: pd, items };
    const key = "azq_hist_" + state.sim.id;
    let hist = lsGet(key, []); hist.unshift(attempt); hist = hist.slice(0, 10); lsSet(key, hist);
    state.done = true; state.lastAttempt = attempt; state.view = "results"; render(); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- gráfico por seção ---------- */
  function bandClass(p) { return p >= CUT ? "good" : (p >= 50 ? "mid" : "low"); }
  function sectionChartHtml(pd, title) {
    const rows = DOMORDER.filter((d) => pd[d]).map((d) => {
      const o = pd[d], p = o.t ? Math.round(o.c / o.t * 100) : 0;
      return '<div class="barrow"><div class="barlbl"><span>' + DOMAINS[d] + '</span><span class="pctnum">' + p + "% <span style=\"color:var(--muted)\">(" + o.c + "/" + o.t + ")</span></span></div>" +
        '<div class="bartrack"><div class="barfill ' + bandClass(p) + '" style="width:' + p + '%"></div></div></div>';
    }).join("");
    return '<div class="section-perf"><h3>' + (title || "Performance por seção de avaliação") + '</h3><p class="sub">Percentual de acertos em cada domínio da prova.</p>' + rows + "</div>";
  }

  /* ---------- dica final ---------- */
  function tipHtml() {
    const pd = perDomain();
    const entries = DOMORDER.filter((d) => pd[d]).map((d) => ({ d, p: pd[d].t ? pd[d].c / pd[d].t : 0 }));
    const topics = weakTopics();
    let li = [];
    const below = entries.filter((e) => e.p < CUT / 100).sort((a, b) => a.p - b.p);
    if (below.length) li.push("Seção mais fraca: <b>" + DOMAINS[below[0].d] + "</b> (" + Math.round(below[0].p * 100) + "%). Priorize essa área.");
    if (topics.length) li.push("Tópicos que mais te derrubaram: <b>" + topics.join(", ") + "</b>.");
    if (state.flags.size) li.push("Você marcou <b>" + state.flags.size + "</b> questão(ões) para revisar — use o botão “Revisar marcadas”.");
    if (!li.length) li.push("Desempenho equilibrado entre as seções. Mantenha o ritmo e revise os poucos erros.");
    return '<div class="tip"><h4>💡 O que melhorar</h4><ul>' + li.map((x) => "<li>" + x + "</li>").join("") + "</ul></div>";
  }

  /* ---------- RESULTADO ---------- */
  function renderResults() {
    const total = state.Q.length, sc = score(), pct = Math.round(sc / total * 100), pass = pct >= CUT;
    const R = 2 * Math.PI * 70, dash = R * (pct / 100);
    const wrong = state.Q.filter((q) => !isCorrect(q)).length;
    const flagged = state.flags.size;
    app().innerHTML =
      '<div class="result">' +
      '<div class="gauge"><svg width="170" height="170" viewBox="0 0 170 170">' +
      '<circle cx="85" cy="85" r="70" fill="none" stroke="var(--track)" stroke-width="14"/>' +
      '<circle cx="85" cy="85" r="70" fill="none" stroke="' + (pass ? "var(--correct)" : "var(--wrong)") + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + dash + " " + R + '"/></svg>' +
      '<div class="val"><div class="pct">' + pct + '%</div><div class="lbl">acertos</div></div></div>' +
      '<div class="verdict ' + (pass ? "pass" : "fail") + '">' + (pass ? "Você passaria ✓" : "Ainda não — continue treinando") + "</div>" +
      '<p class="rsum">Acertou <b>' + sc + "</b> de <b>" + total + "</b> · " + state.sim.nome + "</p>" +
      '<p class="rmeta">Tempo: ' + fmt((state.lastAttempt.timeSec) * 1000) + " · modo " + (state.mode === "treino" ? "Treino" : "Prática") + " · corte de referência: " + CUT + "%</p>" +
      '<div class="rbtns">' +
      (wrong ? '<button class="btn primary" id="revErr">Revisar erros (' + wrong + ")</button>" : "") +
      (flagged ? '<button class="btn ghost" id="revFlag">Revisar marcadas (' + flagged + ")</button>" : "") +
      '<button class="btn confirm" id="retry">Refazer estas</button>' +
      '<button class="btn ghost" id="draw">Sortear novas</button>' +
      '<button class="btn ghost" id="hist">Histórico</button>' +
      "</div></div>" +
      sectionChartHtml(perDomain()) +
      tipHtml() +
      '<div id="reviewArea"></div>';
    const re = $("#revErr"); if (re) re.onclick = () => showReview("err");
    const rf = $("#revFlag"); if (rf) rf.onclick = () => showReview("flag");
    $("#retry").onclick = retrySame;
    $("#draw").onclick = newDraw;
    $("#hist").onclick = () => openHistory(state.sim.id);
    renderChrome();
  }
  function showReview(kind) {
    const list = state.Q.filter((q) => kind === "err" ? !isCorrect(q) : state.flags.has(q.n));
    $("#reviewArea").innerHTML = "<h3 style='font-family:Space Grotesk;margin:8px 4px'>" + (kind === "err" ? "Erros" : "Marcadas para revisar") + " (" + list.length + ")</h3>" +
      list.map((q) => {
        const ok = isCorrect(q);
        return '<div class="card"><div class="qhead"><span class="qnum">Q' + q.n + '</span><span class="qkind">' + (q.k || "") + '</span><span class="qform">' + FORMLBL[q.type] + "</span></div>" +
          '<p class="stem" style="font-size:15px">' + q.s + "</p>" +
          '<div class="explain show" style="border-color:' + (ok ? "var(--correct)" : "var(--wrong)") + ';background:' + (ok ? "var(--correct-bg)" : "var(--wrong-bg)") + '">' +
          "Sua resposta: <b>" + yourSummary(q) + "</b><br>Correta: <b>" + correctSummary(q) + "</b><br><br><b>Por quê:</b> " + q.e + "</div></div>";
      }).join("");
    $("#reviewArea").scrollIntoView({ behavior: "smooth" });
  }

  /* ---------- HISTÓRICO ---------- */
  function openHistory(simId) { state.histSim = simId; state.view = "history"; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function simById(id) { return SIMULADOS.find((s) => s.id === id) || { id: id, nome: id === "personalizado" ? "Simulado Personalizado" : id }; }
  function renderHistory() {
    if (state.tick) clearInterval(state.tick);
    const sim = simById(state.histSim);
    const hist = lsGet("azq_hist_" + state.histSim, []);
    let html = '<div class="hub-intro"><h2>Histórico — ' + sim.nome + "</h2><p>Últimas " + hist.length + " tentativa(s). Toque para ver o gráfico por seção e as questões respondidas.</p></div>";
    if (!hist.length) html += '<div class="empty">Nenhuma tentativa registrada ainda.</div>';
    else {
      html += hist.map((a, ai) => {
        const dt = new Date(a.date);
        const when = dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const cls = a.pct >= CUT ? "var(--correct-ink)" : "var(--wrong-ink)";
        return '<div class="hist-item"><div class="hist-head" data-ai="' + ai + '">' +
          '<span class="hpct" style="color:' + cls + '">' + a.pct + "%</span>" +
          '<span class="hmeta"><b>' + a.score + "/" + a.total + "</b> · " + when + " · " + fmt(a.timeSec * 1000) + " · " + (a.mode === "treino" ? "Treino" : "Prática") + "</span>" +
          '<span class="chev">▼ detalhes</span></div>' +
          '<div class="hist-body" id="hb' + ai + '"></div></div>';
      }).join("");
      html += '<div style="margin-top:14px"><button class="btn ghost" id="clearHist">Limpar histórico deste simulado</button></div>';
    }
    app().innerHTML = html;
    app().querySelectorAll(".hist-head").forEach((h) => (h.onclick = () => toggleHistItem(hist, +h.dataset.ai)));
    const ch = $("#clearHist"); if (ch) ch.onclick = () => { if (confirm("Apagar o histórico deste simulado?")) { lsSet("azq_hist_" + state.histSim, []); render(); } };
    renderChrome();
  }
  function toggleHistItem(hist, ai) {
    const body = $("#hb" + ai); if (!body) return;
    if (body.classList.contains("open")) { body.classList.remove("open"); body.innerHTML = ""; return; }
    const a = hist[ai];
    const chart = sectionChartHtml(a.perDomain, "Desempenho por seção");
    const items = a.items.map((it) => {
      return '<div class="review-item ' + (it.ok ? "correct" : "") + '">' +
        '<div class="qs">' + (it.flag ? "★ " : "") + it.s + ' <span class="badge">' + (DOMAINS[it.d] ? DOMAINS[it.d].split(" ").slice(-1) : "") + "</span></div>" +
        '<div class="ans">Sua resposta: <span class="you">' + it.ya + "</span> · Correta: <span class=\"ok\">" + it.ca + "</span></div>" +
        (it.ok ? "" : '<div class="exp">' + it.e + "</div>") +
        "</div>";
    }).join("");
    body.innerHTML = chart + '<h4 style="font-family:Space Grotesk;margin:14px 0 4px">Questões respondidas (' + a.items.length + ")</h4>" + items;
    body.classList.add("open");
  }

  /* ---------- dispatch ---------- */
  function render() {
    renderChrome();
    if (state.view === "hub") renderHub();
    else if (state.view === "custom") renderCustom();
    else if (state.view === "exam") { renderExam(); }
    else if (state.view === "results") renderResults();
    else if (state.view === "history") renderHistory();
  }

  const hb0 = document.getElementById("homeBtn");
  if (hb0) hb0.onclick = () => { if (state.view === "exam") exitToHub(); else { state.view = "hub"; render(); } };

  initTheme();
  render();
})();