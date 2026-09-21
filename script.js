const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let angle="DEG", memory=Number(localStorage.getItem("sc_memory")||0), ans=Number(localStorage.getItem("sc_ans")||0);
let history=JSON.parse(localStorage.getItem("sc_history")||"[]");
const expr=$("#expression"), result=$("#result");

function factorial(n){if(!Number.isFinite(n)||n<0||Math.floor(n)!==n)throw Error("factorial");if(n>170)throw Error("large");let r=1;for(let i=2;i<=n;i++)r*=i;return r}
function deg(x){return angle==="DEG"?x*Math.PI/180:x} function out(x){return angle==="DEG"?x*180/Math.PI:x}
function normalize(s){return s.replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-").replaceAll("π","PI").replace(/(\d|\))(?=PI|e|sin|cos|tan|asin|acos|atan|log|ln|sqrt|\()/g,"$1*")}
function tokenize(s){const re=/\s*(?:(\d+(?:\.\d*)?|\.\d+)|([A-Za-z]+)|(\^|[+\-*/%(),!]))/y,a=[];let p=0;while(p<s.length){re.lastIndex=p;const m=re.exec(s);if(!m)throw Error("syntax");a.push(m[1]??m[2]??m[3]);p=re.lastIndex}return a}
function evaluate(input){let t=tokenize(normalize(input)),i=0;
 const peek=()=>t[i], eat=x=>{if(x&&peek()!==x)throw Error("syntax");return t[i++]};
 function primary(){let x;if(peek()==="-"){eat();return-primary()} if(peek()==="+"){eat();return primary()}
  if(peek()==="("){eat();x=add();eat(")")} else if(peek()==="PI"){eat();x=Math.PI} else if(peek()==="e"){eat();x=Math.E}
  else if(/^[A-Za-z]/.test(peek()||"")){const f=eat();eat("(");const v=add();eat(")");const map={sin:v=>Math.sin(deg(v)),cos:v=>Math.cos(deg(v)),tan:v=>Math.tan(deg(v)),asin:v=>out(Math.asin(v)),acos:v=>out(Math.acos(v)),atan:v=>out(Math.atan(v)),log:v=>Math.log10(v),ln:v=>Math.log(v),sqrt:v=>Math.sqrt(v)};if(!map[f])throw Error("function");x=map[f](v)}
  else{x=Number(eat());if(!Number.isFinite(x))throw Error("number")}
  while(peek()==="!"){eat("!");x=factorial(x)} return x}
 function power(){let x=primary();if(peek()==="^"){eat("^");x=Math.pow(x,power())}return x}
 function mul(){let x=power();while(["*","/","%"].includes(peek())){let o=eat(),y=power();if(o==="*")x*=y;else if(o==="/")x/=y;else x%=y}return x}
 function add(){let x=mul();while(["+","-"].includes(peek())){let o=eat(),y=mul();x=o==="+"?x+y:x-y}return x}
 let v=add();if(i<t.length)throw Error("syntax");if(!Number.isFinite(v))throw Error("math");return v}
function fmt(v){return Number.isInteger(v)?String(v):Number(v.toPrecision(12)).toString()}
function calculate(){let s=expr.value.trim();if(!s)return;try{let v=evaluate(s);ans=v;localStorage.setItem("sc_ans",ans);result.textContent=fmt(v);history.unshift({e:s,r:fmt(v)});history=history.slice(0,50);localStorage.setItem("sc_history",JSON.stringify(history));renderHistory()}catch{result.textContent="خطأ"}}
function insert(v){let start=expr.selectionStart??expr.value.length,end=expr.selectionEnd??start;if(v==="±"){expr.value=expr.value.startsWith("-")?expr.value.slice(1):"-("+expr.value+")";return}expr.value=expr.value.slice(0,start)+v+expr.value.slice(end);expr.focus();expr.setSelectionRange(start+v.length,start+v.length)}
$$("[data-insert]").forEach(b=>b.onclick=()=>insert(b.dataset.insert));$("#equals").onclick=calculate;
$("#clear").onclick=()=>{expr.value="";result.textContent="0"};$("#backspace").onclick=()=>{let p=expr.selectionStart??expr.value.length;expr.value=expr.value.slice(0,Math.max(0,p-1))+expr.value.slice(p);expr.focus()};
$("#angleBtn").onclick=()=>{angle=angle==="DEG"?"RAD":"DEG";$("#angleBtn").textContent=angle;$("#modeLabel").textContent=angle};
$("#ansBtn").onclick=()=>insert(fmt(ans));
$("#mc").onclick=()=>{memory=0;localStorage.setItem("sc_memory",0);$("#memoryLabel").textContent=""};
$("#mr").onclick=()=>insert(fmt(memory));$("#mplus").onclick=()=>{try{memory+=evaluate(expr.value||"0");localStorage.setItem("sc_memory",memory);$("#memoryLabel").textContent="M"}};$("#mminus").onclick=()=>{try{memory-=evaluate(expr.value||"0");localStorage.setItem("sc_memory",memory);$("#memoryLabel").textContent="M"}};
$("#copyBtn").onclick=async()=>{try{await navigator.clipboard.writeText(result.textContent);$("#copyBtn").textContent="تم النسخ";setTimeout(()=>$("#copyBtn").textContent="نسخ",900)}catch{}};
function renderHistory(){$("#historyList").innerHTML=history.length?history.map((x,n)=>'<div class="history-item" data-n="'+n+'"><small>'+x.e.replaceAll("<","&lt;")+'</small><strong>= '+x.r+'</strong></div>').join(""):'<div style="color:var(--muted)">لا توجد عمليات بعد</div>';$$(".history-item").forEach(x=>x.onclick=()=>{expr.value=history[x.dataset.n].e;calculate()})}
$("#historyBtn").onclick=()=>$("#history").classList.toggle("hidden");$("#clearHistoryBtn").onclick=()=>{history=[];localStorage.removeItem("sc_history");renderHistory()};
$("#themeBtn").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("sc_theme",document.body.classList.contains("light")?"light":"dark")};
if(localStorage.getItem("sc_theme")==="light")document.body.classList.add("light");$("#memoryLabel").textContent=memory?"M":"";renderHistory();
expr.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();calculate()}if(e.key==="Escape"){$("#clear").click()}});
document.addEventListener("keydown",e=>{if(e.target===expr)return;const k=e.key;if(/[0-9.()+\-*/%^!]/.test(k))insert(k==="*"?"×":k);else if(k==="Enter")calculate();else if(k==="Backspace")$("#backspace").click()});
