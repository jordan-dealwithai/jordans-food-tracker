import { useState, useRef, useCallback, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const STORAGE_KEY = "nutrition_tracker_v3";
const SEED_MEALS = [
  { id: 1, meal: "🍗 Chicken Strips & Protein Yogurt", mealType: "Snack",   date: "2026-04-24", calories: 530,  protein: 65, fat: 22,  carbs: 20  },
  { id: 2, meal: "🌮 7 Asada Tacos with Green Salsa",  mealType: "Dinner",  date: "2026-04-24", calories: 1400, protein: 98, fat: 49,  carbs: 126 },
  { id: 3, meal: "🍬 Rice Krispies Treat",              mealType: "Snack",   date: "2026-04-25", calories: 150,  protein: 1,  fat: 3.5, carbs: 33  },
  { id: 4, meal: "🍣 2 Salmon + 2 Tuna Hand Rolls",    mealType: "Lunch",   date: "2026-04-25", calories: 780,  protein: 68, fat: 20,  carbs: 80  },
  { id: 5, meal: "🥩 Ribeye Steak & Rice",              mealType: "Dinner",  date: "2026-04-25", calories: 1000, protein: 71, fat: 56,  carbs: 45  },
  { id: 6, meal: "🫐 Ratio Yogurt + Isopure + Blueberries", mealType: "Snack", date: "2026-04-26", calories: 290, protein: 50, fat: 9, carbs: 9 },
];

const saveMeals = async (m) => { try { await window.storage.set(STORAGE_KEY, JSON.stringify(m)); } catch {} };
const loadMeals = async () => {
  try { const r = await window.storage.get(STORAGE_KEY); if (r) return JSON.parse(r.value); await saveMeals(SEED_MEALS); return SEED_MEALS; }
  catch { return SEED_MEALS; }
};

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
const groupByDate = (meals) => { const m={}; meals.forEach(x=>{(m[x.date]=m[x.date]||[]).push(x);}); return Object.entries(m).sort((a,b)=>b[0].localeCompare(a[0])); };
const sumDay = (meals) => meals.reduce((a,m)=>({calories:a.calories+(+m.calories||0),protein:a.protein+(+m.protein||0),fat:a.fat+(+m.fat||0),carbs:a.carbs+(+m.carbs||0)}),{calories:0,protein:0,fat:0,carbs:0});

const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snack"];
const PIE_COLORS = ["#3de8c8","#ff8c00","#7b9fff"];
const PROTEIN_GOAL = 130;
const MIKA_SRC = "data:image/jpeg;base64,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";

const MikaBadge = () => (
  <div style={{display:"flex",alignItems:"center",gap:8}}>
    <span style={{fontSize:7,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--muted)"}}>Mika says eat your protein!</span>
    <div style={{width:36,height:36,borderRadius:6,overflow:"hidden",border:"1px solid rgba(91,184,245,0.35)",boxShadow:"0 0 10px rgba(91,184,245,0.15)",flexShrink:0}}>
      <img src={MIKA_SRC} alt="Mika" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
    </div>
  </div>
);

const ProteinBar = ({ protein, size="lg" }) => {
  const pct = Math.min(100, Math.round((protein / PROTEIN_GOAL) * 100));
  const color = pct >= 100 ? "#3de8c8" : pct >= 70 ? "#5bb8f5" : "#7b9fff";
  if (size === "sm") return (
    <div style={{margin:"7px 0 4px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:7,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--muted)"}}>Protein</span>
        <span style={{fontSize:9,color,fontFamily:"Orbitron,monospace"}}>{Math.round(protein)}g <span style={{color:"var(--muted)",fontSize:8}}>/ {PROTEIN_GOAL}g</span></span>
      </div>
      <div style={{height:3,background:"var(--panel2)",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:color,borderRadius:2,boxShadow:`0 0 6px ${color}60`,transition:"width .5s ease"}} />
      </div>
    </div>
  );
  return (
    <div style={{margin:"14px 0 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:8,letterSpacing:"0.24em",textTransform:"uppercase",color:"var(--muted)"}}>// Protein Goal</span>
        <span style={{fontFamily:"Orbitron,monospace",fontSize:11,color}}>{Math.round(protein)}g <span style={{color:"var(--muted)",fontSize:9}}>/ {PROTEIN_GOAL}g &nbsp;{pct}%</span></span>
      </div>
      <div style={{height:6,background:"var(--panel2)",border:"1px solid var(--border)",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:`linear-gradient(90deg,${color}99,${color})`,boxShadow:`0 0 10px ${color}60`,transition:"width .6s ease"}} />
      </div>
    </div>
  );
};

const CustomTooltip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  return <div style={{background:"var(--panel2)",border:"1px solid var(--border2)",borderRadius:4,padding:"9px 13px",fontSize:9,boxShadow:"0 6px 24px rgba(0,0,0,.6)"}}>
    <div style={{color:"var(--muted)",letterSpacing:"0.14em",marginBottom:4,textTransform:"uppercase",fontSize:8}}>{label}</div>
    {payload.map(p=><div key={p.name} style={{color:p.color,marginTop:2,letterSpacing:"0.08em"}}>{p.name}: {Math.round(p.value)}{p.name==="calories"?" cal":"g"}</div>)}
  </div>;
};

const S = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#080808;--surface:#0f0f0f;--surface2:#141414;--surface3:#1c1c1c;
  --ink:#ececec;--muted:#444;--border:#1e1e1e;--border2:#272727;
  --green:#00ff87;--orange:#ff8c00;--red:#ff3b3b;--blue:#5bb8f5;--teal:#3de8c8;--purple:#7b9fff;--yellow:#ffe600;
  --panel:#0a1628;--panel2:#0d1f35;--panel3:#102440;
  --radius:6px;
}
html,body{background:#060d14 !important;}
body{
  color:var(--ink);font-family:Share Tech Mono,monospace;min-height:100vh;
  background-image:linear-gradient(rgba(40,100,160,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(40,100,160,0.07) 1px,transparent 1px);
  background-size:28px 28px;
}
.app{display:flex;flex-direction:column;min-height:100vh;max-width:920px;margin:0 auto;padding:0 0 80px;background:#060d14;}
.app::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px);pointer-events:none;z-index:1000;}
.nav{display:flex;align-items:center;justify-content:space-between;padding:18px 24px 16px;border-bottom:1px solid #1a3a5a;background:rgba(6,13,20,0.98);position:relative;}
.nav::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#3a9de8,#3de8c8,#3a9de8,transparent);}
.nav-logo{display:flex;flex-direction:column;line-height:1;gap:3px;}
.nav-logo-name{font-family:Orbitron,monospace;font-size:15px;font-weight:700;letter-spacing:0.12em;color:#5bb8f5;text-shadow:0 0 20px rgba(91,184,245,0.5);}
.nav-logo-sub{font-size:8px;letter-spacing:0.3em;text-transform:uppercase;color:var(--muted);}
.nav-tabs{display:flex;gap:2px;background:var(--panel);border:1px solid rgba(50,120,200,0.2);border-radius:6px;padding:3px;}
.nav-tab{font-size:9px;letter-spacing:0.16em;text-transform:uppercase;padding:7px 14px;border:none;background:transparent;cursor:pointer;border-radius:4px;color:var(--muted);transition:all .15s;font-family:Share Tech Mono,monospace;}
.nav-tab.active{background:var(--panel3);color:#5bb8f5;border:1px solid rgba(70,150,220,0.35);box-shadow:0 0 12px rgba(91,184,245,0.1);}
.nav-tab.active.chattab{color:#3de8c8;border-color:rgba(61,232,200,0.35);}
.nav-tab.active.addtab{color:#00ff87;border-color:rgba(0,255,135,0.35);}
.section{padding:20px 24px;background:#060d14;}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;}
.stat-card{background:var(--panel);border:1px solid rgba(50,120,200,0.2);border-radius:6px;padding:14px 16px;position:relative;overflow:hidden;}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;}
.stat-card::after{content:'';position:absolute;top:0;left:0;bottom:0;width:2px;}
.stat-card.cal::before,.stat-card.cal::after{background:#ffe600;}
.stat-card.pro::before,.stat-card.pro::after{background:#3de8c8;}
.stat-card.fat::before,.stat-card.fat::after{background:#ff3b3b;}
.stat-card.carb::before,.stat-card.carb::after{background:#5bb8f5;}
.stat-label{font-size:8px;letter-spacing:0.28em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
.stat-value{font-family:Orbitron,monospace;font-size:30px;line-height:1;font-weight:600;}
.stat-sub{font-size:8px;color:var(--muted);margin-top:4px;letter-spacing:0.14em;text-transform:uppercase;}
.stat-card.cal .stat-value{color:#ffe600;text-shadow:0 0 15px rgba(255,230,0,0.4);}
.stat-card.pro .stat-value{color:#3de8c8;text-shadow:0 0 15px rgba(61,232,200,0.4);}
.stat-card.fat .stat-value{color:#ff3b3b;text-shadow:0 0 15px rgba(255,59,59,0.4);}
.stat-card.carb .stat-value{color:#5bb8f5;text-shadow:0 0 15px rgba(91,184,245,0.4);}
.chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
.chart-card{background:var(--panel);border:1px solid rgba(50,120,200,0.2);border-radius:6px;padding:16px;}
.chart-card.full{grid-column:1/-1;}
.chart-title{font-size:8px;letter-spacing:0.26em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.chart-title::before{content:'//';color:#3a9de8;margin-right:2px;}
.chart-title::after{content:'';flex:1;height:1px;background:rgba(50,120,200,0.2);}
.pie-wrap{display:flex;align-items:center;gap:20px;}
.pie-legend{display:flex;flex-direction:column;gap:10px;}
.pie-item{display:flex;align-items:center;gap:8px;font-size:10px;}
.pie-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.day-group{margin-bottom:24px;}
.day-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(50,120,200,0.2);}
.day-label{font-family:Orbitron,monospace;font-size:14px;font-weight:600;letter-spacing:0.08em;color:#5bb8f5;}
.day-totals{display:flex;gap:7px;flex-wrap:wrap;}
.day-total-pill{font-size:8px;letter-spacing:0.12em;padding:3px 9px;border-radius:3px;border:1px solid;text-transform:uppercase;}
.day-total-pill.cal{color:#ffe600;border-color:rgba(255,230,0,.25);background:rgba(255,230,0,.05);}
.day-total-pill.pro{color:#3de8c8;border-color:rgba(61,232,200,.25);background:rgba(61,232,200,.05);}
.day-total-pill.fat{color:#ff3b3b;border-color:rgba(255,59,59,.25);background:rgba(255,59,59,.05);}
.day-total-pill.carb{color:#5bb8f5;border-color:rgba(91,184,245,.25);background:rgba(91,184,245,.05);}
.meal-row{background:var(--panel);border:1px solid rgba(50,120,200,0.2);border-radius:6px;padding:11px 14px;margin-bottom:6px;display:flex;align-items:center;gap:11px;transition:border-color .15s;}
.meal-row:hover{border-color:rgba(70,150,220,0.5);}
.meal-type-badge{font-size:7px;letter-spacing:0.18em;text-transform:uppercase;padding:3px 8px;border-radius:3px;flex-shrink:0;border:1px solid;}
.meal-type-badge.breakfast{color:#f5c842;border-color:rgba(245,200,66,.25);background:rgba(245,200,66,.06);}
.meal-type-badge.lunch{color:#3de8c8;border-color:rgba(61,232,200,.25);background:rgba(61,232,200,.06);}
.meal-type-badge.dinner{color:#c084fc;border-color:rgba(192,132,252,.25);background:rgba(192,132,252,.06);}
.meal-type-badge.snack{color:#5bb8f5;border-color:rgba(91,184,245,.25);background:rgba(91,184,245,.06);}
.meal-name{font-size:12px;flex:1;color:var(--ink);}
.meal-macros{display:flex;gap:8px;flex-shrink:0;}
.meal-macro{font-size:10px;color:var(--muted);}
.meal-delete{background:none;border:none;cursor:pointer;color:var(--muted);font-size:14px;padding:2px 5px;opacity:0;transition:opacity .15s;}
.meal-row:hover .meal-delete{opacity:1;}
.log-card{background:var(--panel);border:1px solid rgba(50,120,200,0.2);border-radius:6px;overflow:hidden;margin-bottom:20px;}
.upload-zone{width:100%;min-height:130px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;cursor:pointer;border-bottom:1px solid rgba(50,120,200,0.2);transition:background .15s;position:relative;overflow:hidden;}
.upload-zone:hover{background:var(--panel2);}
.upload-zone.has-img{min-height:200px;padding:0;}
.upload-preview{width:100%;height:200px;object-fit:cover;opacity:0.85;}
.upload-overlay{position:absolute;inset:0;background:rgba(6,13,20,.7);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .18s;}
.upload-zone:hover .upload-overlay{opacity:1;}
.upload-overlay span{color:#3de8c8;font-size:9px;letter-spacing:0.24em;text-transform:uppercase;border:1px solid rgba(61,232,200,.35);padding:6px 14px;border-radius:3px;}
.form-body{padding:14px;display:flex;flex-direction:column;gap:10px;}
.row{display:flex;gap:9px;}
.field{display:flex;flex-direction:column;gap:5px;flex:1;}
.field label{font-size:8px;letter-spacing:0.24em;text-transform:uppercase;color:var(--muted);}
.field input,.field select,.field textarea{background:var(--panel2);border:1px solid rgba(50,120,200,0.2);border-radius:4px;padding:8px 11px;color:var(--ink);font-family:Share Tech Mono,monospace;font-size:12px;outline:none;transition:border-color .15s;width:100%;color-scheme:dark;}
.field input:focus,.field select:focus,.field textarea:focus{border-color:#3a9de8;box-shadow:0 0 0 3px rgba(58,157,232,.08);}
.field textarea{resize:none;height:52px;}
.field select option{background:#0d1f35;color:var(--ink);}
.macro-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.ai-btn{width:100%;padding:10px;background:transparent;border:1px dashed rgba(61,232,200,.2);border-radius:4px;color:var(--muted);font-family:Share Tech Mono,monospace;font-size:9px;letter-spacing:0.2em;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px;text-transform:uppercase;}
.ai-btn:hover:not(:disabled){border-color:rgba(61,232,200,.5);color:#3de8c8;background:rgba(61,232,200,.03);}
.ai-btn:disabled{opacity:.2;cursor:not-allowed;}
.submit-btn{width:100%;padding:12px;background:linear-gradient(135deg,rgba(58,157,232,0.15),rgba(91,184,245,0.08));border:1px solid rgba(70,150,220,0.35);border-radius:4px;color:#5bb8f5;font-family:Share Tech Mono,monospace;font-size:11px;letter-spacing:0.18em;cursor:pointer;transition:all .2s;text-transform:uppercase;}
.submit-btn:hover:not(:disabled){background:linear-gradient(135deg,rgba(58,157,232,0.25),rgba(91,184,245,0.15));box-shadow:0 0 20px rgba(91,184,245,0.15);border-color:#5bb8f5;transform:translateY(-1px);}
.submit-btn:disabled{opacity:.2;cursor:not-allowed;transform:none;}
.spinner{width:12px;height:12px;border:1px solid rgba(91,184,245,.3);border-top-color:#5bb8f5;border-radius:50%;animation:spin .6s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg)}}
.pulse-dot{width:6px;height:6px;background:#3de8c8;border-radius:50%;display:inline-block;box-shadow:0 0 8px #3de8c8;animation:pulse 2s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
.chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 120px);max-height:700px;}
.chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;scrollbar-width:thin;scrollbar-color:rgba(50,120,200,0.3) transparent;}
.msg{display:flex;flex-direction:column;gap:4px;animation:fadeUp 0.2s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.msg.user{align-items:flex-end;}
.msg.assistant{align-items:flex-start;}
.msg-bubble{max-width:80%;padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.5;}
.msg.user .msg-bubble{background:var(--panel3);border:1px solid rgba(70,150,220,0.35);border-bottom-right-radius:3px;}
.msg.assistant .msg-bubble{background:var(--panel2);border:1px solid rgba(50,120,200,0.2);border-bottom-left-radius:3px;}
.msg-img{max-width:180px;border-radius:6px;border:1px solid rgba(70,150,220,0.35);opacity:0.85;margin-bottom:4px;}
.msg-label{font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);padding:0 4px;}
.chat-logged-card{background:rgba(61,232,200,0.06);border:1px solid rgba(61,232,200,0.25);border-radius:8px;padding:10px 12px;margin-top:4px;}
.clog-name{color:#3de8c8;font-weight:500;margin-bottom:6px;font-size:12px;}
.clog-macros{display:flex;gap:7px;flex-wrap:wrap;}
.clog-pill{font-size:9px;padding:2px 8px;border-radius:3px;border:1px solid;letter-spacing:0.08em;}
.clog-pill.cal{color:#ffe600;border-color:rgba(255,230,0,.3);}
.clog-pill.pro{color:#3de8c8;border-color:rgba(61,232,200,.3);}
.clog-pill.fat{color:#ff3b3b;border-color:rgba(255,59,59,.3);}
.clog-pill.carb{color:#5bb8f5;border-color:rgba(91,184,245,.3);}
.chat-confirm-btns{display:flex;gap:6px;margin-top:8px;}
.chat-confirm-btn{padding:5px 12px;border-radius:4px;border:1px solid;font-family:Share Tech Mono,monospace;font-size:9px;letter-spacing:0.14em;cursor:pointer;text-transform:uppercase;transition:all .15s;}
.chat-confirm-btn.yes{color:#3de8c8;border-color:rgba(61,232,200,.35);background:rgba(61,232,200,.06);}
.chat-confirm-btn.yes:hover{background:rgba(61,232,200,.12);}
.chat-confirm-btn.no{color:var(--muted);border-color:rgba(50,120,200,0.2);}
.chat-input-row{display:flex;gap:8px;padding:12px 16px;border-top:1px solid rgba(50,120,200,0.2);align-items:center;background:var(--panel);}
.chat-input{flex:1;background:var(--panel2);border:1px solid rgba(70,150,220,0.35);border-radius:6px;padding:9px 12px;color:var(--ink);font-family:Share Tech Mono,monospace;font-size:12px;outline:none;transition:border-color .15s;}
.chat-input:focus{border-color:#3a9de8;}
.chat-photo-btn{background:transparent;border:1px solid rgba(70,150,220,0.35);border-radius:6px;padding:9px 12px;cursor:pointer;color:var(--muted);font-size:15px;transition:all .15s;flex-shrink:0;}
.chat-photo-btn:hover{border-color:#5bb8f5;color:#5bb8f5;}
.chat-send-btn{background:var(--panel3);border:1px solid rgba(70,150,220,0.35);border-radius:6px;padding:9px 14px;cursor:pointer;color:#5bb8f5;font-family:Share Tech Mono,monospace;font-size:10px;letter-spacing:0.14em;transition:all .15s;flex-shrink:0;text-transform:uppercase;}
.chat-send-btn:hover:not(:disabled){border-color:#5bb8f5;box-shadow:0 0 10px rgba(91,184,245,.12);}
.chat-send-btn:disabled{opacity:.3;cursor:not-allowed;}
.chat-img-preview{position:relative;display:inline-block;margin:0 16px 4px;}
.chat-img-preview img{height:56px;border-radius:5px;border:1px solid rgba(70,150,220,0.35);opacity:.85;}
.chat-img-preview button{position:absolute;top:-6px;right:-6px;background:var(--panel3);border:1px solid rgba(70,150,220,0.35);border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;color:var(--muted);display:flex;align-items:center;justify-content:center;}
.chat-typing{display:flex;gap:4px;align-items:center;padding:4px 2px;}
.chat-typing span{width:5px;height:5px;background:var(--muted);border-radius:50%;animation:blink 1.2s infinite;}
.chat-typing span:nth-child(2){animation-delay:.2s;}
.chat-typing span:nth-child(3){animation-delay:.4s;}
@keyframes blink{0%,80%,100%{opacity:.2;}40%{opacity:1;}}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--panel);border:1px solid rgba(70,150,220,0.35);color:var(--ink);border-radius:4px;padding:10px 20px;font-size:10px;letter-spacing:0.1em;z-index:9999;transition:transform .3s cubic-bezier(.34,1.56,.64,1);white-space:nowrap;text-transform:uppercase;}
.toast.show{transform:translateX(-50%) translateY(0);}
.toast.err{border-color:rgba(255,59,59,.4);color:#ff6060;}
.empty{text-align:center;padding:48px 24px;color:var(--muted);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;border:1px dashed rgba(40,100,180,.2);border-radius:6px;}
input[type=file]{display:none;}
@media(max-width:600px){.stats-row{grid-template-columns:repeat(2,1fr);}.chart-grid{grid-column:1;grid-template-columns:1fr;}.meal-macros{flex-wrap:wrap;gap:5px;}.nav{padding:14px 16px 12px;}.section{padding:14px 16px;}}
`;

export default function JordanFoodTracker() {
  const [tab,setTab] = useState("dashboard");
  const [meals,setMeals] = useState([]);
  const [loaded,setLoaded] = useState(false);
  const [image,setImage] = useState(null);
  const [imageB64,setImageB64] = useState(null);
  const [dragging,setDragging] = useState(false);
  const [analyzing,setAnalyzing] = useState(false);
  const [logging,setLogging] = useState(false);
  const [toast,setToast] = useState({show:false,msg:"",err:false});
  const [selectedDate,setSelectedDate] = useState(today());
  const [dashDate,setDashDate] = useState(today());
  const [form,setForm] = useState({meal:"",mealType:"Snack",date:today(),calories:"",protein:"",fat:"",carbs:"",notes:""});
  const fileRef = useRef();
  const [manualImage,setManualImage] = useState(null);
  const [manualImageB64,setManualImageB64] = useState(null);

  const [chatMessages,setChatMessages] = useState([{role:"assistant",text:"Hey Jordan! 🐾 Send me a photo or describe what you ate and I'll log it instantly."}]);
  const [chatInput,setChatInput] = useState("");
  const [chatImage,setChatImage] = useState(null);
  const [chatImageB64,setChatImageB64] = useState(null);
  const [chatTyping,setChatTyping] = useState(false);
  const [pendingLog,setPendingLog] = useState(null);
  const chatFileRef = useRef();
  const chatBottomRef = useRef();

  useEffect(()=>{loadMeals().then(m=>{setMeals(m);setLoaded(true);});},[]);
  useEffect(()=>{if(loaded)saveMeals(meals);},[meals,loaded]);
  useEffect(()=>{chatBottomRef.current?.scrollIntoView({behavior:"smooth"});},[chatMessages,chatTyping]);
  useEffect(()=>{setSelectedDate(dashDate);},[dashDate]);

  const showToast=(msg,err=false)=>{setToast({show:true,msg,err});setTimeout(()=>setToast(t=>({...t,show:false})),2800);};
  const addMsg=(role,text,extra={})=>setChatMessages(m=>[...m,{role,text,...extra}]);

  const handleFile=(file)=>{
    if(!file?.type.startsWith("image/"))return;
    setImage(URL.createObjectURL(file));
    const r=new FileReader();r.onload=e=>setImageB64(e.target.result.split(",")[1]);r.readAsDataURL(file);
  };
  const handleChatFile=(file)=>{
    if(!file?.type.startsWith("image/"))return;
    setChatImage(URL.createObjectURL(file));
    const r=new FileReader();r.onload=e=>setChatImageB64(e.target.result.split(",")[1]);r.readAsDataURL(file);
  };
  const onDrop=useCallback((e)=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);},[]);

  const analyzeManualImage=async()=>{
    if(!manualImageB64)return;setAnalyzing(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:manualImageB64}},{type:"text",text:'Analyze this food. Return ONLY JSON no markdown: {"meal":"emoji name","mealType":"Breakfast|Lunch|Dinner|Snack","calories":0,"protein":0,"fat":0,"carbs":0,"notes":"brief description"}'}]}]})});
      const d=await res.json();
      const parsed=JSON.parse(d.content?.find(b=>b.type==="text")?.text.replace(/```json|```/g,"").trim()||"{}");
      setForm(f=>({...f,meal:parsed.meal||f.meal,mealType:parsed.mealType||f.mealType,calories:parsed.calories??f.calories,protein:parsed.protein??f.protein,fat:parsed.fat??f.fat,carbs:parsed.carbs??f.carbs,notes:parsed.notes||f.notes}));
      showToast("// analysis complete");
    }catch{showToast("analysis failed",true);}
    setAnalyzing(false);
  };

  const analyzeImage=async()=>{
    if(!imageB64)return;setAnalyzing(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:imageB64}},{type:"text",text:'Analyze this food. Return ONLY JSON no markdown: {"meal":"emoji name","mealType":"Breakfast|Lunch|Dinner|Snack","calories":0,"protein":0,"fat":0,"carbs":0,"notes":"brief description"}'}]}]})});
      const d=await res.json();
      const parsed=JSON.parse(d.content?.find(b=>b.type==="text")?.text.replace(/```json|```/g,"").trim()||"{}");
      setForm(f=>({...f,meal:parsed.meal||f.meal,mealType:parsed.mealType||f.mealType,calories:parsed.calories??f.calories,protein:parsed.protein??f.protein,fat:parsed.fat??f.fat,carbs:parsed.carbs??f.carbs,notes:parsed.notes||f.notes}));
      showToast("// analysis complete");
    }catch{showToast("analysis failed",true);}
    setAnalyzing(false);
  };

  const handleSubmit=()=>{
    if(!form.meal.trim())return showToast("enter meal name",true);
    setLogging(true);
    const entry={id:Date.now(),...form,calories:+form.calories||0,protein:+form.protein||0,fat:+form.fat||0,carbs:+form.carbs||0};
    setTimeout(()=>{setMeals(m=>[entry,...m]);setForm({meal:"",mealType:"Snack",date:today(),calories:"",protein:"",fat:"",carbs:"",notes:""});setImage(null);setImageB64(null);setManualImage(null);setManualImageB64(null);showToast("// "+entry.meal+" logged");setLogging(false);setTab("log");}
    ,400);
  };

  const confirmLog=(entry)=>{setMeals(m=>[entry,...m]);setPendingLog(null);addMsg("assistant","✓ Logged! "+entry.meal+" added to "+fmtDate(entry.date)+".");showToast("// "+entry.meal+" logged");};
  const rejectLog=()=>{setPendingLog(null);addMsg("assistant","No problem — tell me what to adjust or send a clearer photo.");};

  const sendChatMessage=async()=>{
    const text=chatInput.trim();
    if(!text&&!chatImageB64)return;
    addMsg("user",text||"📷 Photo",{image:chatImage});
    setChatInput("");
    const imgB64=chatImageB64;const imgUrl=chatImage;
    setChatImage(null);setChatImageB64(null);setChatTyping(true);
    try{
      const content=[];
      if(imgB64)content.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:imgB64}});
      if(text)content.push({type:"text",text});
      if(!text&&imgB64)content.push({type:"text",text:"What food is this?"});
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:"You are a food logging assistant. When given a food photo or description, return ONLY a JSON object (no markdown): {\"meal\":\"emoji name\",\"mealType\":\"Breakfast|Lunch|Dinner|Snack\",\"date\":\""+today()+"\"，\"calories\":0,\"protein\":0,\"fat\":0,\"carbs\":0,\"confirm_message\":\"1-sentence friendly summary with macro highlights\"}. Use real numbers.",messages:[{role:"user",content}]})});
      const d=await res.json();
      const raw=d.content?.find(b=>b.type==="text")?.text||"";
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      const entry={id:Date.now(),...parsed,calories:+parsed.calories||0,protein:+parsed.protein||0,fat:+parsed.fat||0,carbs:+parsed.carbs||0};
      setChatTyping(false);setPendingLog(entry);
      addMsg("assistant",parsed.confirm_message,{pendingEntry:entry});
    }catch(e){setChatTyping(false);addMsg("assistant","Sorry, couldn't analyze that. Try a clearer photo or describe the meal!");}
  };

  const deleteMeal=(id)=>setMeals(m=>m.filter(x=>x.id!==id));
  const grouped=groupByDate(meals);
  const todayMeals=meals.filter(m=>m.date===today());
  const todayTotals=sumDay(todayMeals);
  const dashMeals=meals.filter(m=>m.date===dashDate);
  const dashTotals=sumDay(dashMeals);
  const selDayMeals=meals.filter(m=>m.date===selectedDate);
  const selTotals=sumDay(selDayMeals);
  const totalCalMacros=selTotals.protein*4+selTotals.carbs*4+selTotals.fat*9;
  const pieData=[{name:"Protein",value:selTotals.protein*4},{name:"Carbs",value:selTotals.carbs*4},{name:"Fat",value:selTotals.fat*9}].filter(d=>d.value>0);
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const ds=d.toISOString().split("T")[0];const t=sumDay(meals.filter(m=>m.date===ds));return{date:d.toLocaleDateString("en-US",{month:"short",day:"numeric"}),...t};});
  const tagClass=(t)=>t?.toLowerCase()||"snack";

  return (<>
    <style>{S}</style>
    <div className="app">
      <div className="nav">
        <div className="nav-logo">
          <span className="nav-logo-name">JORDAN'S FOOD TRACKER</span>
          <span className="nav-logo-sub">// Daily Nutrition Log</span>
        </div>
        <div className="nav-tabs">
          {[["dashboard","Dashboard"],["log","Meal Log"],["chat","📸 Log","chattab"],["add","+ Manual","addtab"]].map(([id,label,extra=""])=>(
            <button key={id} className={"nav-tab "+(tab===id?"active ":"")+extra} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </div>
      </div>

      {tab==="dashboard"&&<div className="section">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:"var(--muted)",fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase"}}>//</span>
            <button onClick={()=>{const dates=groupByDate(meals).map(([d])=>d);const idx=dates.indexOf(dashDate);if(idx<dates.length-1)setDashDate(dates[idx+1]);}} style={{background:"transparent",border:"1px solid rgba(50,120,200,0.25)",borderRadius:4,color:"#5bb8f5",cursor:"pointer",padding:"3px 8px",fontSize:11,lineHeight:1}}>‹</button>
            <span style={{color:"#5bb8f5",fontSize:10,letterSpacing:"0.1em",fontFamily:"Orbitron,monospace",minWidth:120,textAlign:"center"}}>{fmtDate(dashDate)}</span>
            <button onClick={()=>{const dates=groupByDate(meals).map(([d])=>d);const idx=dates.indexOf(dashDate);if(idx>0)setDashDate(dates[idx-1]);}} disabled={dashDate===today()} style={{background:"transparent",border:"1px solid rgba(50,120,200,0.25)",borderRadius:4,color:dashDate===today()?"var(--muted)":"#5bb8f5",cursor:dashDate===today()?"not-allowed":"pointer",padding:"3px 8px",fontSize:11,lineHeight:1,opacity:dashDate===today()?0.3:1}}>›</button>
            {dashDate!==today()&&<button onClick={()=>setDashDate(today())} style={{background:"rgba(91,184,245,0.08)",border:"1px solid rgba(91,184,245,0.25)",borderRadius:4,color:"#5bb8f5",cursor:"pointer",padding:"3px 9px",fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase"}}>Today</button>}
          </div>
          <MikaBadge />
        </div>
        <div className="stats-row">
          {[{cls:"cal",label:"Calories",val:Math.round(dashTotals.calories),sub:"kcal"},{cls:"pro",label:"Protein",val:Math.round(dashTotals.protein),sub:"grams"},{cls:"fat",label:"Fat",val:Math.round(dashTotals.fat),sub:"grams"},{cls:"carb",label:"Carbs",val:Math.round(dashTotals.carbs),sub:"grams"}].map(s=>(
            <div key={s.cls} className={"stat-card "+s.cls}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
        <ProteinBar protein={dashTotals.protein} size="lg" />
        <div className="chart-grid" style={{marginTop:16}}>
          <div className="chart-card full">
            <div className="chart-title">7-Day Calorie Trend</div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={last7} margin={{top:4,right:4,bottom:0,left:-24}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,100,160,0.15)" />
                <XAxis dataKey="date" tick={{fontSize:8,fontFamily:"Share Tech Mono",fill:"#3a6888"}} />
                <YAxis tick={{fontSize:8,fontFamily:"Share Tech Mono",fill:"#3a6888"}} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="calories" stroke="#5bb8f5" strokeWidth={1.5} dot={{r:3,fill:"#5bb8f5",strokeWidth:0}} name="calories" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-title">7-Day Macros</div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={last7} margin={{top:4,right:4,bottom:0,left:-24}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,100,160,0.15)" />
                <XAxis dataKey="date" tick={{fontSize:8,fontFamily:"Share Tech Mono",fill:"#3a6888"}} />
                <YAxis tick={{fontSize:8,fontFamily:"Share Tech Mono",fill:"#3a6888"}} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="protein" fill="#3de8c8" name="protein" radius={[2,2,0,0]} opacity={0.85} />
                <Bar dataKey="carbs" fill="#a3d4f7" name="carbs" radius={[2,2,0,0]} opacity={0.85} />
                <Bar dataKey="fat" fill="#7b9fff" name="fat" radius={[2,2,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-title" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>Macro Split</span>
              <select value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={{fontSize:8,background:"var(--panel2)",border:"1px solid rgba(50,120,200,0.2)",borderRadius:3,padding:"3px 7px",fontFamily:"Share Tech Mono",color:"var(--muted)",outline:"none",colorScheme:"dark"}}>
                {grouped.map(([d])=><option key={d} value={d}>{fmtDate(d)}</option>)}
              </select>
            </div>
            {pieData.length>0?<div className="pie-wrap">
              <PieChart width={120} height={120}>
                <Pie data={pieData} cx={55} cy={55} innerRadius={30} outerRadius={52} paddingAngle={3} dataKey="value">
                  {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} opacity={0.9} />)}
                </Pie>
              </PieChart>
              <div className="pie-legend">
                {pieData.map((d,i)=>(
                  <div key={d.name} className="pie-item">
                    <div className="pie-dot" style={{background:PIE_COLORS[i],boxShadow:`0 0 6px ${PIE_COLORS[i]}`}} />
                    <span>{d.name}</span>
                    <span style={{fontFamily:"Orbitron,monospace",fontSize:15,fontWeight:600,marginLeft:"auto",paddingLeft:14,color:PIE_COLORS[i]}}>
                      {totalCalMacros>0?Math.round(d.value/totalCalMacros*100):0}%
                    </span>
                  </div>
                ))}
                <div style={{fontSize:9,color:"var(--muted)",marginTop:4,letterSpacing:"0.12em",fontFamily:"Orbitron,monospace"}}>{Math.round(selTotals.calories)} KCAL</div>
              </div>
            </div>:<div style={{textAlign:"center",padding:"28px 0",color:"var(--muted)",fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase"}}>//No Data</div>}
          </div>
        </div>
      </div>}

      {tab==="log"&&<div className="section">
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><MikaBadge /></div>
        {grouped.length===0?<div className="empty">// no meals logged</div>:grouped.map(([date,dayMeals])=>{
          const t=sumDay(dayMeals);
          return <div key={date} className="day-group">
            <div className="day-header">
              <div className="day-label">{fmtDate(date)}</div>
              <div className="day-totals">
                <span className="day-total-pill cal">{Math.round(t.calories)} cal</span>
                <span className="day-total-pill pro">{Math.round(t.protein)}g pro</span>
                <span className="day-total-pill fat">{Math.round(t.fat)}g fat</span>
                <span className="day-total-pill carb">{Math.round(t.carbs)}g carb</span>
              </div>
            </div>
            <ProteinBar protein={t.protein} size="sm" />
            {dayMeals.map(m=>(
              <div key={m.id} className="meal-row">
                <span className={"meal-type-badge "+tagClass(m.mealType)}>{m.mealType}</span>
                <div className="meal-name">{m.meal}</div>
                <div className="meal-macros">
                  <span className="meal-macro"><span style={{color:"#ffe600"}}>{m.calories}</span> cal</span>
                  <span className="meal-macro"><span style={{color:"#3de8c8"}}>{m.protein}g</span> pro</span>
                </div>
                <button className="meal-delete" onClick={()=>deleteMeal(m.id)}>×</button>
              </div>
            ))}
          </div>;
        })}
      </div>}

      {tab==="chat"&&<div className="section" style={{padding:0,display:"flex",flexDirection:"column",height:"calc(100vh - 120px)"}}>
        <div className="chat-wrap">
          <div className="chat-messages">
            {chatMessages.map((msg,i)=>(
              <div key={i} className={"msg "+msg.role}>
                {msg.role==="assistant"&&<span className="msg-label">// Mika</span>}
                {msg.role==="user"&&<span className="msg-label">You</span>}
                {msg.image&&<img src={msg.image} alt="" className="msg-img" />}
                <div className="msg-bubble">{msg.text}</div>
                {msg.pendingEntry&&pendingLog&&pendingLog.id===msg.pendingEntry.id&&(
                  <div className="chat-logged-card">
                    <div className="clog-name">{msg.pendingEntry.meal}</div>
                    <div className="clog-macros">
                      <span className="clog-pill cal">{msg.pendingEntry.calories} cal</span>
                      <span className="clog-pill pro">{msg.pendingEntry.protein}g pro</span>
                      <span className="clog-pill fat">{msg.pendingEntry.fat}g fat</span>
                      <span className="clog-pill carb">{msg.pendingEntry.carbs}g carb</span>
                    </div>
                    <div className="chat-confirm-btns">
                      <button className="chat-confirm-btn yes" onClick={()=>confirmLog(msg.pendingEntry)}>✓ Log it</button>
                      <button className="chat-confirm-btn no" onClick={rejectLog}>✕ Adjust</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {chatTyping&&<div className="msg assistant">
              <span className="msg-label">// Mika</span>
              <div className="msg-bubble"><div className="chat-typing"><span/><span/><span/></div></div>
            </div>}
            <div ref={chatBottomRef} />
          </div>
          {chatImage&&<div className="chat-img-preview">
            <img src={chatImage} alt="" />
            <button onClick={()=>{setChatImage(null);setChatImageB64(null);}}>×</button>
          </div>}
          <div className="chat-input-row">
            <label htmlFor="chat-file-input" style={{background:"transparent",border:"1px solid rgba(70,150,220,0.35)",borderRadius:6,padding:"9px 12px",cursor:"pointer",color:"var(--muted)",fontSize:15,transition:"all .15s",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#5bb8f5";e.currentTarget.style.color="#5bb8f5";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(70,150,220,0.35)";e.currentTarget.style.color="var(--muted)";}}>
              📎
            </label>
            <input id="chat-file-input" type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(!f)return;setChatImage(URL.createObjectURL(f));const r=new FileReader();r.onload=ev=>setChatImageB64(ev.target.result.split(",")[1]);r.readAsDataURL(f);e.target.value="";}} style={{display:"none"}} />
            <input className="chat-input" placeholder="Describe your meal, or attach a photo 📎..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChatMessage();}}} />
            <button className="chat-send-btn" onClick={sendChatMessage} disabled={chatTyping||(!chatInput.trim()&&!chatImageB64)}>Send →</button>
          </div>
        </div>
      </div>}

      {tab==="add"&&<div className="section">
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><MikaBadge /></div>
        <div className="log-card">
          <label htmlFor="manual-photo-input" style={{display:"block",cursor:"pointer"}}>
            <div style={{minHeight:image?0:110,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:9,borderBottom:"1px solid rgba(50,120,200,0.2)",position:"relative",overflow:"hidden",background:"var(--panel)"}}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f?.type.startsWith("image/")){setImage(URL.createObjectURL(f));const r=new FileReader();r.onload=ev=>setImageB64(ev.target.result.split(",")[1]);r.readAsDataURL(f);}}}>
              {image
                ?<><img src={image} alt="" style={{width:"100%",height:160,objectFit:"cover",display:"block",opacity:.85}}/><div style={{position:"absolute",top:6,right:8,background:"rgba(6,13,20,.75)",border:"1px solid rgba(61,232,200,.35)",borderRadius:4,padding:"3px 9px",fontSize:9,color:"#3de8c8",letterSpacing:"0.14em",textTransform:"uppercase"}}>Tap to change</div></>
                :<><div style={{fontSize:26,opacity:.5}}>📷</div><div style={{textAlign:"center"}}><strong style={{display:"block",fontSize:11,fontWeight:400,marginBottom:3,color:"var(--ink)"}}>Tap to add a photo</strong><span style={{fontSize:9,color:"var(--muted)"}}>camera or photo library</span></div></>
              }
            </div>
          </label>
          <input id="manual-photo-input" type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;setImage(URL.createObjectURL(f));const r=new FileReader();r.onload=ev=>setImageB64(ev.target.result.split(",")[1]);r.readAsDataURL(f);e.target.value="";}} />
          <div className="form-body">
            {image&&<button className="ai-btn" onClick={analyzeImage} disabled={analyzing}>
              {analyzing?<><span className="spinner" style={{borderTopColor:"#3de8c8"}} /> Analyzing...</>:<><span className="pulse-dot" /> AI Auto-fill from photo</>}
            </button>}
            <div className="row">
              <div className="field" style={{flex:2}}>
                <label>Meal Name</label>
                <input value={form.meal} onChange={e=>setForm(f=>({...f,meal:e.target.value}))} placeholder="e.g. Ribeye & Rice" />
              </div>
              <div className="field">
                <label>Type</label>
                <select value={form.mealType} onChange={e=>setForm(f=>({...f,mealType:e.target.value}))}>
                  {MEAL_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
            <div className="field">
              <label>Macros</label>
              <div className="macro-grid">
                {[["Cal","calories"],["Protein","protein"],["Fat","fat"],["Carbs","carbs"]].map(([l,k])=>(
                  <div key={k} className="field"><label>{l}</label><input type="number" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder="0" style={{textAlign:"center"}} /></div>
                ))}
              </div>
            </div>
            <div className="field"><label>Notes</label><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Portion size, ingredients..." /></div>
            <button className="submit-btn" onClick={handleSubmit} disabled={logging||!form.meal.trim()}>
              {logging?<span className="spinner" />:"// Log Meal →"}
            </button>
          </div>
        </div>
      </div>}
    </div>
    <div className={"toast "+(toast.err?"err ":"")+(toast.show?"show":"")}>{toast.msg}</div>
  </>);
}