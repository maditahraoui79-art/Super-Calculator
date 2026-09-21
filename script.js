(() => {
"use strict";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let angle = "DEG";
let memory = Number(localStorage.getItem("sc_memory") || 0);
let ans = Number(localStorage.getItem("sc_ans") || 0);
let history = [];
try { history = JSON.parse(localStorage.getItem("sc_history") || "[]"); } catch { history = []; }

const expr = $("#expression");
const result = $("#result");

function factorial(n) {
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) throw Error();
  if (n > 170) throw Error();
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function toRad(x) { return angle === "DEG" ? x * Math.PI / 180 : x; }
function fromRad(x) { return angle === "DEG" ? x * 180 / Math.PI : x; }

function normalize(s) {
  return s
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-")
    .replaceAll("π", "PI");
}

function tokenize(s) {
  const re = /\s*(?:(\d+(?:\.\d*)?|\.\d+)|([A-Za-z]+)|(\^|[+\-*/%(),!]))/y;
  const tokens = [];
  let p = 0;
  while (p < s.length) {
    re.lastIndex = p;
    const m = re.exec(s);
    if (!m) throw Error();
    tokens.push(m[1] ?? m[2] ?? m[3]);
    p = re.lastIndex;
  }
  return tokens;
}

function evaluate(input) {
  let t = tokenize(normalize(input));
  let i = 0;
  const peek = () => t[i];
  const eat = (x) => {
    if (x && peek() !== x) throw Error();
    return t[i++];
  };

  function primary() {
    if (peek() === "-") { eat("-"); return -primary(); }
    if (peek() === "+") { eat("+"); return primary(); }

    let x;
    if (peek() === "(") {
      eat("(");
      x = add();
      eat(")");
    } else if (peek() === "PI") {
      eat("PI"); x = Math.PI;
    } else if (peek() === "e") {
      eat("e"); x = Math.E;
    } else if (/^[A-Za-z]+$/.test(peek() || "")) {
      const f = eat();
      eat("(");
      const v = add();
      eat(")");
      const map = {
        sin: v => Math.sin(toRad(v)),
        cos: v => Math.cos(toRad(v)),
        tan: v => Math.tan(toRad(v)),
        asin: v => fromRad(Math.asin(v)),
        acos: v => fromRad(Math.acos(v)),
        atan: v => fromRad(Math.atan(v)),
        log: v => Math.log10(v),
        ln: v => Math.log(v),
        sqrt: v => Math.sqrt(v)
      };
      if (!map[f]) throw Error();
      x = map[f](v);
    } else {
      const n = eat();
      x = Number(n);
      if (!Number.isFinite(x)) throw Error();
    }

    while (peek() === "!") {
      eat("!");
      x = factorial(x);
    }
    return x;
  }

  function power() {
    let x = primary();
    if (peek() === "^") {
      eat("^");
      x = Math.pow(x, power());
    }
    return x;
  }

  function mul() {
    let x = power();
    while (["*", "/", "%"].includes(peek())) {
      const op = eat();
      const y = power();
      if (op === "*") x *= y;
      else if (op === "/") x /= y;
      else x %= y;
    }
    return x;
  }

  function add() {
    let x = mul();
    while (["+", "-"].includes(peek())) {
      const op = eat();
      const y = mul();
      x = op === "+" ? x + y : x - y;
    }
    return x;
  }

  const value = add();
  if (i !== t.length || !Number.isFinite(value)) throw Error();
  return value;
}

function fmt(v) {
  if (Object.is(v, -0)) v = 0;
  return Number.isInteger(v) ? String(v) : Number(v.toPrecision(12)).toString();
}

function calculate() {
  const s = expr.value.trim();
  if (!s) return;
  try {
    const v = evaluate(s);
    ans = v;
    localStorage.setItem("sc_ans", String(ans));
    result.textContent = fmt(v);
    history.unshift({ e: s, r: fmt(v) });
    history = history.slice(0, 50);
    localStorage.setItem("sc_history", JSON.stringify(history));
    renderHistory();
  } catch {
    result.textContent = "خطأ";
  }
}

function insert(v) {
  const start = expr.selectionStart ?? expr.value.length;
  const end = expr.selectionEnd ?? start;

  if (v === "±") {
    if (!expr.value) expr.value = "-";
    else if (expr.value.startsWith("-")) expr.value = expr.value.slice(1);
    else expr.value = "-" + expr.value;
    expr.focus();
    return;
  }

  expr.value = expr.value.slice(0, start) + v + expr.value.slice(end);
  expr.focus();
  const pos = start + v.length;
  expr.setSelectionRange(pos, pos);
}

$$("[data-insert]").forEach(b => b.addEventListener("click", () => insert(b.dataset.insert)));
$("#equals").addEventListener("click", calculate);

$("#clear").addEventListener("click", () => {
  expr.value = "";
  result.textContent = "0";
  expr.focus();
});

$("#backspace").addEventListener("click", () => {
  const p = expr.selectionStart ?? expr.value.length;
  if (p > 0) {
    expr.value = expr.value.slice(0, p - 1) + expr.value.slice(p);
    expr.setSelectionRange(p - 1, p - 1);
  }
  expr.focus();
});

$("#angleBtn").addEventListener("click", () => {
  angle = angle === "DEG" ? "RAD" : "DEG";
  $("#angleBtn").textContent = angle;
  $("#modeLabel").textContent = angle;
});

$("#ansBtn").addEventListener("click", () => insert(fmt(ans)));

$("#mc").addEventListener("click", () => {
  memory = 0;
  localStorage.setItem("sc_memory", "0");
  $("#memoryLabel").textContent = "";
});

$("#mr").addEventListener("click", () => insert(fmt(memory)));

$("#mplus").addEventListener("click", () => {
  try {
    memory += evaluate(expr.value || "0");
    localStorage.setItem("sc_memory", String(memory));
    $("#memoryLabel").textContent = "M";
  } catch {}
});

$("#mminus").addEventListener("click", () => {
  try {
    memory -= evaluate(expr.value || "0");
    localStorage.setItem("sc_memory", String(memory));
    $("#memoryLabel").textContent = "M";
  } catch {}
});

$("#copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(result.textContent);
    $("#copyBtn").textContent = "تم النسخ";
    setTimeout(() => $("#copyBtn").textContent = "نسخ", 900);
  } catch {}
});

function renderHistory() {
  const list = $("#historyList");
  list.innerHTML = history.length
    ? history.map((x, n) =>
      '<div class="history-item" data-n="' + n + '">' +
      '<small>' + String(x.e).replaceAll("<", "&lt;") + '</small>' +
      '<strong>= ' + String(x.r) + '</strong></div>'
    ).join("")
    : '<div style="color:var(--muted)">لا توجد عمليات بعد</div>';

  $$(".history-item").forEach(x => x.addEventListener("click", () => {
    expr.value = history[Number(x.dataset.n)].e;
    calculate();
  }));
}

$("#historyBtn").addEventListener("click", () => $("#history").classList.toggle("hidden"));

$("#clearHistoryBtn").addEventListener("click", () => {
  history = [];
  localStorage.removeItem("sc_history");
  renderHistory();
});

$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("sc_theme", document.body.classList.contains("light") ? "light" : "dark");
});

if (localStorage.getItem("sc_theme") === "light") document.body.classList.add("light");
$("#memoryLabel").textContent = memory ? "M" : "";
renderHistory();

expr.addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); calculate(); }
  if (e.key === "Escape") $("#clear").click();
});

document.addEventListener("keydown", e => {
  if (e.target === expr) return;
  if (/^[0-9.()+\-*/%^!]$/.test(e.key)) insert(e.key === "*" ? "×" : e.key);
  else if (e.key === "Enter") calculate();
  else if (e.key === "Backspace") $("#backspace").click();
});
})();