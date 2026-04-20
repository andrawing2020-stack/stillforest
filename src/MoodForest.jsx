import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid, ScatterChart, Scatter, ZAxis } from "recharts";

const MOODS = [
  { score: 1, label: "최악", emoji: "🌧️", color: "#4a6741" },
  { score: 2, label: "힘듦", emoji: "🍂", color: "#5a7750" },
  { score: 3, label: "우울", emoji: "☁️", color: "#6a8760" },
  { score: 4, label: "침체", emoji: "🌫️", color: "#7a9770" },
  { score: 5, label: "보통", emoji: "🌿", color: "#8aA780" },
  { score: 6, label: "괜찮음", emoji: "🌱", color: "#7CB342" },
  { score: 7, label: "좋음", emoji: "🌳", color: "#66BB6A" },
  { score: 8, label: "활기참", emoji: "🌻", color: "#43A047" },
  { score: 9, label: "행복", emoji: "☀️", color: "#2E7D32" },
  { score: 10, label: "최고", emoji: "🌈", color: "#1B5E20" },
];

const TAGS = ["집중잘됨","산만함","불안","평온","의욕없음","창의적","피곤","에너지충만","외로움","감사함","예민함","설렘"];
const TIME_LABELS = ["새벽(0-6)","오전(6-12)","오후(12-18)","밤(18-24)"];
function getTimeSlot(h){return h<6?0:h<12?1:h<18?2:3;}
function fmtTime(d){const dt=new Date(d);return `${dt.getHours()}:${String(dt.getMinutes()).padStart(2,'0')}`;}
function fmtDate(ds){const d=new Date(ds),wd=["일","월","화","수","목","금","토"];return `${d.getMonth()+1}/${d.getDate()}(${wd[d.getDay()]})`;}
function getWeekday(ds){return ["일","월","화","수","목","금","토"][new Date(ds).getDay()];}
function todayKey(){return new Date().toISOString().slice(0,10);}
function timeGreeting(){const h=new Date().getHours();if(h<6)return"늦은 밤이네요 🌙";if(h<12)return"좋은 아침이에요 🌅";if(h<18)return"오후를 보내고 있군요 🌤️";return"하루를 마무리하는 시간이에요 🌙";}

function load(key){try{const v=localStorage.getItem(key);return v?JSON.parse(v):null;}catch{return null;}}
function save(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch{}}

export default function MoodForest(){
  const [moodEntries,setMoodEntries]=useState([]);
  const [journals,setJournals]=useState([]);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState("mood");
  const [score,setScore]=useState(5);
  const [tags,setTags]=useState([]);
  const [productivity,setProd]=useState(5);
  const [memo,setMemo]=useState("");
  const [moodSaved,setMoodSaved]=useState(false);
  const [hovered,setHovered]=useState(null);
  const [jMode,setJMode]=useState("morning");
  const [morningText,setMorningText]=useState("");
  const [evSatisfied,setEvSatisfied]=useState("");
  const [tmrFirst,setTmrFirst]=useState("");
  const [jSaved,setJSaved]=useState(false);
  const [calMonth,setCalMonth]=useState(()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),1);});
  const [selectedDate,setSelectedDate]=useState(todayKey());

  useEffect(()=>{
    setMoodEntries(load("sf-moods")||[]);
    setJournals(load("sf-journals")||[]);
    const draft=load("sf-draft-"+todayKey());
    if(draft){draft.morning&&setMorningText(draft.morning);draft.evSatisfied&&setEvSatisfied(draft.evSatisfied);draft.tmrFirst&&setTmrFirst(draft.tmrFirst);}
    setJMode(new Date().getHours()<15?"morning":"evening");
    setLoading(false);
  },[]);

  useEffect(()=>{if(!loading)save("sf-draft-"+todayKey(),{morning:morningText,evSatisfied,tmrFirst});},[morningText,evSatisfied,tmrFirst,loading]);

  const saveMood=()=>{
    const now=new Date();
    const entry={id:Date.now(),date:now.toISOString(),dateKey:todayKey(),hour:now.getHours(),minute:now.getMinutes(),timeSlot:getTimeSlot(now.getHours()),score,productivity,tags,memo};
    const up=[entry,...moodEntries];
    setMoodEntries(up);save("sf-moods",up);
    setScore(5);setTags([]);setProd(5);setMemo("");
    setMoodSaved(true);setTimeout(()=>setMoodSaved(false),2000);
  };

  const saveJournal=()=>{
    const now=new Date();
    const entry={id:Date.now(),date:now.toISOString(),dateKey:todayKey(),type:jMode,morning:jMode==="morning"?morningText:null,evSatisfied:jMode==="evening"?evSatisfied:null,tmrFirst:jMode==="evening"?tmrFirst:null};
    const up=[entry,...journals];
    setJournals(up);save("sf-journals",up);
    if(jMode==="morning")setMorningText("");else{setEvSatisfied("");setTmrFirst("");}
    setJSaved(true);setTimeout(()=>setJSaved(false),2000);
  };

  const delMood=(id)=>{const up=moodEntries.filter(e=>e.id!==id);setMoodEntries(up);save("sf-moods",up);};
  const delJournal=(id)=>{const up=journals.filter(e=>e.id!==id);setJournals(up);save("sf-journals",up);};

  const exportData=()=>{
    const data={
      exportDate:new Date().toISOString(),
      moodEntries:moodEntries.map(e=>({
        날짜:fmtDate(e.date),시간:fmtTime(e.date),시간대:TIME_LABELS[e.timeSlot],
        기분점수:e.score,기분:MOODS[e.score-1]?.label,집중력:e.productivity,
        태그:(e.tags||[]).join(", "),메모:e.memo||""
      })),
      journals:journals.map(e=>({
        날짜:fmtDate(e.date),유형:e.type==="morning"?"아침 다짐":"저녁 회고",
        되고싶은나:e.morning||"",만족한순간:e.evSatisfied||"",내일첫할일:e.tmrFirst||""
      })),
      _raw:{moods:moodEntries,journals}
    };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`still-forest-backup-${todayKey()}.json`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV=()=>{
    const header="날짜,시간,시간대,유형,기분점수,기분,집중력,태그,메모,되고싶은나,만족한순간,내일첫할일\n";
    const moodRows=moodEntries.map(e=>
      `${fmtDate(e.date)},${fmtTime(e.date)},${TIME_LABELS[e.timeSlot]},기분체크,${e.score},${MOODS[e.score-1]?.label},${e.productivity},"${(e.tags||[]).join("/")}","${e.memo||""}",,,`
    ).join("\n");
    const journalRows=journals.map(e=>
      `${fmtDate(e.date)},,${e.type==="morning"?"아침":"저녁"},다짐/회고,,,,,,${e.morning||""},"${e.evSatisfied||""}","${e.tmrFirst||""}"`
    ).join("\n");
    const csv="\uFEFF"+header+moodRows+"\n"+journalRows;
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`still-forest-${todayKey()}.csv`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [importMsg,setImportMsg]=useState(null);

  const importData=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(data._raw&&data._raw.moods&&data._raw.journals){
          const newMoods=[...data._raw.moods,...moodEntries];
          const newJournals=[...data._raw.journals,...journals];
          // Deduplicate by id
          const uniqMoods=[...new Map(newMoods.map(e=>[e.id,e])).values()].sort((a,b)=>new Date(b.date)-new Date(a.date));
          const uniqJournals=[...new Map(newJournals.map(e=>[e.id,e])).values()].sort((a,b)=>new Date(b.date)-new Date(a.date));
          setMoodEntries(uniqMoods);save("sf-moods",uniqMoods);
          setJournals(uniqJournals);save("sf-journals",uniqJournals);
          setImportMsg(`✅ 불러오기 완료! 기분 ${data._raw.moods.length}개, 다짐/회고 ${data._raw.journals.length}개`);
        }else{
          setImportMsg("❌ 올바른 백업 파일이 아니에요");
        }
      }catch{
        setImportMsg("❌ 파일을 읽을 수 없어요");
      }
      setTimeout(()=>setImportMsg(null),3000);
    };
    reader.readAsText(file);
    e.target.value="";
  };

  const todayMoods=useMemo(()=>moodEntries.filter(e=>e.dateKey===todayKey()),[moodEntries]);
  const todayJournals=useMemo(()=>journals.filter(e=>e.dateKey===todayKey()),[journals]);
  const hasMorningJ=todayJournals.some(e=>e.type==="morning");
  const hasEveningJ=todayJournals.some(e=>e.type==="evening");

  const yesterdayTask=useMemo(()=>{
    const y=new Date();y.setDate(y.getDate()-1);
    return journals.find(e=>e.dateKey===y.toISOString().slice(0,10)&&e.tmrFirst)?.tmrFirst||null;
  },[journals]);

  const timePattern=useMemo(()=>{
    const s=[0,1,2,3].map(i=>({name:TIME_LABELS[i],avgMood:0,avgProd:0,count:0,mT:0,pT:0}));
    moodEntries.forEach(e=>{s[e.timeSlot].mT+=e.score;s[e.timeSlot].pT+=(e.productivity||5);s[e.timeSlot].count++;});
    s.forEach(x=>{x.avgMood=x.count?+(x.mT/x.count).toFixed(1):0;x.avgProd=x.count?+(x.pT/x.count).toFixed(1):0;});
    return s;
  },[moodEntries]);

  const weekdayData=useMemo(()=>{
    const d=["월","화","수","목","금","토","일"].map(n=>({name:n,avgMood:0,count:0,total:0}));
    const dm={"월":0,"화":1,"수":2,"목":3,"금":4,"토":5,"일":6};
    const byDate={};
    moodEntries.forEach(e=>{const k=e.date.slice(0,10);if(!byDate[k])byDate[k]=[];byDate[k].push(e.score);});
    Object.entries(byDate).forEach(([date,scores])=>{
      const dayAvg=scores.reduce((a,b)=>a+b,0)/scores.length;
      const w=getWeekday(date),i=dm[w];
      if(i!==undefined){d[i].total+=dayAvg;d[i].count++;}
    });
    d.forEach(x=>{x.avgMood=x.count?+(x.total/x.count).toFixed(1):0;});
    return d;
  },[moodEntries]);

  const recentTrend=useMemo(()=>{
    const bd={};
    moodEntries.slice(0,80).forEach(e=>{const k=e.date.slice(0,10);if(!bd[k])bd[k]={s:[],p:[]};bd[k].s.push(e.score);bd[k].p.push(e.productivity||5);});
    return Object.entries(bd).map(([d,v])=>({date:fmtDate(d),mood:+(v.s.reduce((a,b)=>a+b,0)/v.s.length).toFixed(1),prod:+(v.p.reduce((a,b)=>a+b,0)/v.p.length).toFixed(1)})).reverse();
  },[moodEntries]);

  const hourlyScatter=useMemo(()=>moodEntries.slice(0,100).map(e=>({hour:e.hour,score:e.score,prod:e.productivity||5})),[moodEntries]);

  const tagFreq=useMemo(()=>{
    const f={};moodEntries.forEach(e=>(e.tags||[]).forEach(t=>{f[t]=(f[t]||0)+1;}));
    return Object.entries(f).sort((a,b)=>b[1]-a[1]).slice(0,8);
  },[moodEntries]);

  const avgScore=moodEntries.length?(moodEntries.reduce((a,e)=>a+e.score,0)/moodEntries.length).toFixed(1):"-";
  const cm=MOODS[(hovered||score)-1];

  if(loading)return(<div style={S.loadWrap}><div style={{fontSize:48}}>🌿</div></div>);

  return(
    <div style={S.container}>
      <div style={S.bgTexture}/><div style={S.bgPattern}/>

      <header style={S.header}>
        <div style={S.titleRow}>
          <span style={{fontSize:28}}>🌲</span>
          <div><h1 style={S.title}>Still Forest</h1><p style={S.subtitle}>감정 기록소</p></div>
        </div>
        {moodEntries.length>0&&<div style={S.statBadge}><span style={S.statNum}>{avgScore}</span><span style={S.statLbl}>평균</span></div>}
      </header>

      <nav style={S.nav}>
        {[{k:"mood",l:"기분체크",i:"🎯"},{k:"journal",l:"다짐/회고",i:"📝"},{k:"history",l:"기록",i:"📋"},{k:"insights",l:"분석",i:"📊"}].map(t=>(
          <button key={t.k} onClick={()=>setView(t.k)} style={{...S.navBtn,...(view===t.k?S.navAct:{})}}>
            <span style={{fontSize:14}}>{t.i}</span><span>{t.l}</span>
          </button>
        ))}
      </nav>

      {view==="mood"&&(
        <div style={S.card}>
          <div style={S.greeting}>{timeGreeting()}</div>
          {moodSaved&&<div style={S.savedBanner}>🌿 기분이 기록됐어요 · {fmtTime(new Date())}</div>}
          {todayMoods.length>0&&(
            <div style={S.todayTimeline}>
              <div style={S.tlLabel}>오늘의 기분 흐름</div>
              <div style={S.tlDots}>
                {todayMoods.slice().reverse().map(e=>{const m=MOODS[e.score-1];return(<div key={e.id} style={S.tlDot}><span style={{fontSize:20}}>{m.emoji}</span><span style={{fontSize:11,color:m.color,fontWeight:700}}>{e.score}</span><span style={{fontSize:10,color:"#999"}}>{fmtTime(e.date)}</span></div>);})}
              </div>
            </div>
          )}
          <div style={S.section}>
            <label style={S.label}>지금 기분은?</label>
            <div style={S.moodDisplay}>
              <span style={{fontSize:48,lineHeight:1}}>{cm.emoji}</span>
              <span style={{...S.moodScore,color:cm.color}}>{hovered||score}점</span>
              <span style={{...S.moodLbl,color:cm.color}}>{cm.label}</span>
            </div>
            <div style={S.scoreRow}>
              {MOODS.map(m=>(
                <button key={m.score} onMouseEnter={()=>setHovered(m.score)} onMouseLeave={()=>setHovered(null)}
                  onClick={()=>{setScore(m.score);setHovered(null);}}
                  style={{...S.scoreBtn,background:score===m.score?m.color:score>=m.score?`${m.color}44`:"rgba(255,255,255,0.5)",color:score===m.score?"#fff":m.color,transform:score===m.score?"scale(1.25)":"scale(1)",boxShadow:score===m.score?`0 2px 12px ${m.color}66`:"none"}}>{m.score}</button>
              ))}
            </div>
          </div>
          <div style={S.section}>
            <label style={S.label}>집중력/에너지</label>
            <div style={S.prodRow}><span style={S.pLabel}>낮음</span><input type="range" min={1} max={10} value={productivity} onChange={e=>setProd(+e.target.value)} style={S.slider}/><span style={S.pLabel}>높음</span><span style={S.prodVal}>{productivity}</span></div>
          </div>
          <div style={S.section}>
            <label style={S.label}>상태 태그</label>
            <div style={S.tagGrid}>{TAGS.map(t=>(<button key={t} onClick={()=>setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} style={{...S.tag,...(tags.includes(t)?S.tagAct:{})}}>{t}</button>))}</div>
          </div>
          <div style={S.section}>
            <label style={S.label}>한 줄 메모 <span style={{fontWeight:400,color:"#aaa"}}>(선택)</span></label>
            <input type="text" value={memo} onChange={e=>setMemo(e.target.value)} placeholder="지금 이 순간 떠오르는 한마디..." style={S.textInput} maxLength={100}/>
          </div>
          <button onClick={saveMood} style={S.saveBtn}><span>🌿</span> 지금 기분 기록하기</button>
          <div style={S.autoNote}>⏱ 현재 시각이 자동으로 기록돼요</div>
        </div>
      )}

      {view==="journal"&&(
        <div style={S.card}>
          <div style={S.modeWrap}>
            <button onClick={()=>setJMode("morning")} style={{...S.modeBtn,...(jMode==="morning"?S.modeBtnAct:{})}}>
              <span style={{fontSize:22}}>🌅</span><span style={{fontSize:13,fontWeight:700}}>아침 다짐</span>
              {hasMorningJ&&<span style={S.doneBadge}>✓</span>}
            </button>
            <button onClick={()=>setJMode("evening")} style={{...S.modeBtn,...(jMode==="evening"?S.modeBtnEvAct:{})}}>
              <span style={{fontSize:22}}>🌙</span><span style={{fontSize:13,fontWeight:700}}>저녁 회고</span>
              {hasEveningJ&&<span style={S.doneBadge}>✓</span>}
            </button>
          </div>
          {jSaved&&<div style={S.savedBanner}>{jMode==="morning"?"🌅 아침 다짐이 심어졌어요":"🌙 오늘 하루가 기록됐어요"}</div>}
          {jMode==="morning"&&(
            <div>
              {yesterdayTask&&(<div style={S.reminder}><div style={{fontSize:20}}>📌</div><div><div style={S.remLabel}>어젯밤 정한 오늘의 첫 할 일</div><div style={S.remText}>{yesterdayTask}</div></div></div>)}
              <div style={S.jHeader}><span style={{fontSize:20}}>🌅</span><div><div style={S.jTitle}>오늘 내가 되고 싶은 모습</div><div style={S.jHint}>하루를 시작하기 전, 오늘의 나를 그려봐요</div></div></div>
              <textarea value={morningText} onChange={e=>setMorningText(e.target.value)} placeholder="예: 차분하게 하나씩 해내는 사람..." style={S.jInput} rows={4} maxLength={200}/>
              <div style={S.charCnt}>{morningText.length}/200</div>
              <button onClick={saveJournal} style={{...S.saveBtn,background:"linear-gradient(135deg,#43A047,#66BB6A)"}}><span>🌅</span> 아침 다짐 남기기</button>
            </div>
          )}
          {jMode==="evening"&&(
            <div>
              <div style={S.jHeader}><span style={{fontSize:20}}>🌙</span><div><div style={S.jTitle}>저녁 회고</div><div style={S.jHint}>오늘 하루를 돌아보며 마무리해요</div></div></div>
              <div style={{marginBottom:16}}>
                <label style={S.fieldLabel}>✨ 오늘 만족했던 순간</label>
                <textarea value={evSatisfied} onChange={e=>setEvSatisfied(e.target.value)} placeholder="작은 것도 괜찮아요..." style={S.jInput} rows={3} maxLength={200}/>
                <div style={S.charCnt}>{evSatisfied.length}/200</div>
              </div>
              <div style={{marginBottom:20}}>
                <label style={S.fieldLabel}>🌱 내일 아침, 가장 먼저 할 일</label>
                <input type="text" value={tmrFirst} onChange={e=>setTmrFirst(e.target.value)} placeholder="내일의 나에게 하나만 부탁한다면?" style={S.textInput} maxLength={100}/>
              </div>
              <button onClick={saveJournal} style={{...S.saveBtn,background:"linear-gradient(135deg,#2E7D32,#1B5E20)"}}><span>🌙</span> 하루 마무리하기</button>
            </div>
          )}
        </div>
      )}

      {view==="history"&&(
        <div style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h2 style={{...S.secTitle,marginBottom:0}}>기록 달력</h2>
            <div style={{display:"flex",gap:6}}>
              {(moodEntries.length>0||journals.length>0)&&<>
                <button onClick={exportCSV} style={S.exportBtn}>📊 엑셀</button>
                <button onClick={exportData} style={S.exportBtn}>💾 내보내기</button>
              </>}
              <button onClick={()=>document.getElementById("importFile").click()} style={S.exportBtn}>📂 불러오기</button>
              <input id="importFile" type="file" accept=".json" onChange={importData} style={{display:"none"}}/>
            </div>
          </div>
          {importMsg&&<div style={{...S.savedBanner,marginBottom:12}}>{importMsg}</div>}

          {/* Calendar Navigation */}
          <div style={S.calNav}>
            <button onClick={()=>setCalMonth(new Date(calMonth.getFullYear(),calMonth.getMonth()-1,1))} style={S.calArrow}>◀</button>
            <span style={S.calMonthLabel}>{calMonth.getFullYear()}년 {calMonth.getMonth()+1}월</span>
            <button onClick={()=>setCalMonth(new Date(calMonth.getFullYear(),calMonth.getMonth()+1,1))} style={S.calArrow}>▶</button>
          </div>

          {/* Calendar Grid */}
          <div style={S.calGrid}>
            {["월","화","수","목","금","토","일"].map(d=><div key={d} style={S.calDayHeader}>{d}</div>)}
            {(()=>{
              const year=calMonth.getFullYear(),month=calMonth.getMonth();
              const firstDay=(new Date(year,month,1).getDay()+6)%7;
              const daysInMonth=new Date(year,month+1,0).getDate();
              const cells=[];
              for(let i=0;i<firstDay;i++) cells.push(<div key={"e"+i} style={S.calCell}/>);
              for(let d=1;d<=daysInMonth;d++){
                const dk=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const dayMoods=moodEntries.filter(e=>e.dateKey===dk);
                const dayJournals=journals.filter(e=>e.dateKey===dk);
                const hasData=dayMoods.length>0||dayJournals.length>0;
                const avgM=dayMoods.length?(dayMoods.reduce((a,e)=>a+e.score,0)/dayMoods.length):0;
                const isSelected=dk===selectedDate;
                const isToday=dk===todayKey();
                cells.push(
                  <button key={dk} onClick={()=>setSelectedDate(dk)} style={{
                    ...S.calCell,...S.calCellBtn,
                    ...(isSelected?S.calCellSelected:{}),
                    ...(isToday&&!isSelected?S.calCellToday:{}),
                    opacity:isSelected?1:hasData?1:0.4,
                  }}>
                    <span style={{fontSize:13,fontWeight:isToday||isSelected?700:500}}>{d}</span>
                    {hasData&&(
                      <div style={{display:"flex",gap:2,justifyContent:"center",marginTop:2}}>
                        {dayMoods.length>0&&<div style={{...S.calDot,background:avgM>=7?"#2E7D32":avgM>=4?"#66BB6A":"#AED581"}}/>}
                        {dayJournals.some(e=>e.type==="morning")&&<div style={{...S.calDot,background:"#FFB74D"}}/>}
                        {dayJournals.some(e=>e.type==="evening")&&<div style={{...S.calDot,background:"#7E57C2"}}/>}
                      </div>
                    )}
                  </button>
                );
              }
              return cells;
            })()}
          </div>

          {/* Legend */}
          <div style={S.calLegend}>
            <span style={S.calLegItem}><span style={{...S.calDot,background:"#2E7D32"}}/>기분</span>
            <span style={S.calLegItem}><span style={{...S.calDot,background:"#FFB74D"}}/>아침</span>
            <span style={S.calLegItem}><span style={{...S.calDot,background:"#7E57C2"}}/>저녁</span>
          </div>

          {/* Selected Day Detail */}
          {(()=>{
            const dayMoods=moodEntries.filter(e=>e.dateKey===selectedDate);
            const dayJournals=journals.filter(e=>e.dateKey===selectedDate);
            if(dayMoods.length===0&&dayJournals.length===0) return(
              <div style={S.dayEmpty}>{fmtDate(selectedDate+"T00:00")} — 기록이 없는 날이에요 🍃</div>
            );
            return(
              <div style={S.dayDetail}>
                <div style={S.dayDetailTitle}>{fmtDate(selectedDate+"T00:00")} 기록</div>

                {dayMoods.length>0&&(
                  <div style={{marginBottom:12}}>
                    <div style={S.daySubTitle}>🎯 기분 체크 ({dayMoods.length}회)</div>
                    {dayMoods.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(entry=>{
                      const mood=MOODS[entry.score-1];
                      return(
                        <div key={entry.id} style={{...S.entryCard,borderLeft:"3px solid "+mood.color,marginBottom:8}}>
                          <div style={S.entryTop}>
                            <div style={S.entryLeft}>
                              <span style={{fontSize:22}}>{mood.emoji}</span>
                              <div>
                                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                  <span style={{...S.eScore,color:mood.color}}>{entry.score}점</span>
                                  <span style={S.eProd}>집중 {entry.productivity||"?"}</span>
                                  <span style={S.etime}>{fmtTime(entry.date)}</span>
                                </div>
                              </div>
                            </div>
                            <button onClick={()=>delMood(entry.id)} style={S.delBtn}>×</button>
                          </div>
                          {entry.tags?.length>0&&<div style={S.eTags}>{entry.tags.map(t=><span key={t} style={S.eTag}>{t}</span>)}</div>}
                          {entry.memo&&<p style={S.eMemo}>"{entry.memo}"</p>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {dayJournals.length>0&&(
                  <div>
                    <div style={S.daySubTitle}>📝 다짐 / 회고</div>
                    {dayJournals.map(entry=>{
                      const isM=entry.type==="morning";
                      return(
                        <div key={entry.id} style={{...S.entryCard,borderLeft:`3px solid ${isM?"#66BB6A":"#1B5E20"}`,background:isM?"rgba(232,245,233,0.4)":"rgba(200,230,201,0.3)",marginBottom:8}}>
                          <div style={S.entryTop}>
                            <div style={S.entryLeft}>
                              <span style={{fontSize:22}}>{isM?"🌅":"🌙"}</span>
                              <span style={{fontSize:13,fontWeight:700,color:isM?"#43A047":"#1B5E20"}}>{isM?"아침 다짐":"저녁 회고"}</span>
                            </div>
                            <button onClick={()=>delJournal(entry.id)} style={S.delBtn}>×</button>
                          </div>
                          {entry.morning&&<div style={S.jEntry}><span style={S.jELbl}>🌅 되고 싶은 나</span><p style={S.jETxt}>{entry.morning}</p></div>}
                          {entry.evSatisfied&&<div style={S.jEntry}><span style={S.jELbl}>✨ 만족한 순간</span><p style={S.jETxt}>{entry.evSatisfied}</p></div>}
                          {entry.tmrFirst&&<div style={S.jEntry}><span style={S.jELbl}>🌱 내일 첫 할 일</span><p style={S.jETxt}>{entry.tmrFirst}</p></div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {view==="insights"&&(
        <div style={S.card}>
          <h2 style={S.secTitle}>📊 패턴 분석</h2>
          {moodEntries.length<3?(
            <div style={S.empty}><span style={{fontSize:40}}>🔍</span><p>기분 체크 3개 이상 필요해요.<br/>수시로 기분을 기록해보세요!</p></div>
          ):(<>
            <div style={S.sumRow}>
              {[{v:moodEntries.length,l:"기분 기록"},{v:avgScore,l:"평균 기분"},{v:(moodEntries.reduce((a,e)=>a+(e.productivity||5),0)/moodEntries.length).toFixed(1),l:"평균 집중"},{v:journals.length,l:"다짐/회고"}].map((s,i)=>(
                <div key={i} style={S.sumCard}><div style={S.sumVal}>{s.v}</div><div style={S.sumLbl}>{s.l}</div></div>
              ))}
            </div>

            {hourlyScatter.length>3&&(
              <div style={S.chartSec}>
                <h3 style={S.cTitle}>🕐 시간 × 기분 분포</h3>
                <p style={S.cDesc}>어떤 시간대에 기분이 좋고 나빴는지 한눈에</p>
                <ResponsiveContainer width="100%" height={180}>
                  <ScatterChart margin={{top:10,right:10,left:-15,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc"/>
                    <XAxis dataKey="hour" type="number" domain={[0,23]} tick={{fontSize:11,fill:"#6a8760"}}/>
                    <YAxis dataKey="score" type="number" domain={[0,10]} tick={{fontSize:11,fill:"#6a8760"}}/>
                    <ZAxis dataKey="prod" range={[30,200]}/>
                    <Tooltip contentStyle={{background:"#f0f5ed",border:"1px solid #c8d8c0",borderRadius:8,fontSize:12}}/>
                    <Scatter data={hourlyScatter} fill="#2E7D32" fillOpacity={0.6}/>
                  </ScatterChart>
                </ResponsiveContainer>
                <div style={{fontSize:11,color:"#999",textAlign:"center",marginTop:4}}>점 크기 = 집중력</div>
              </div>
            )}

            {recentTrend.length>1&&(
              <div style={S.chartSec}>
                <h3 style={S.cTitle}>📈 일별 기분 & 집중 추이</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={recentTrend} margin={{top:5,right:10,left:-20,bottom:0}}>
                    <defs>
                      <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3}/><stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/></linearGradient>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#81C784" stopOpacity={0.3}/><stop offset="95%" stopColor="#81C784" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc"/>
                    <XAxis dataKey="date" tick={{fontSize:10,fill:"#6a8760"}}/>
                    <YAxis domain={[0,10]} tick={{fontSize:11,fill:"#6a8760"}}/>
                    <Tooltip contentStyle={{background:"#f0f5ed",border:"1px solid #c8d8c0",borderRadius:8,fontSize:13}} formatter={(v,n)=>[v+"점",n==="mood"?"기분":"집중"]}/>
                    <Area type="monotone" dataKey="mood" stroke="#2E7D32" strokeWidth={2.5} fill="url(#mg)" dot={{r:3,fill:"#2E7D32"}}/>
                    <Area type="monotone" dataKey="prod" stroke="#81C784" strokeWidth={2} fill="url(#pg)" dot={{r:2,fill:"#81C784"}}/>
                  </AreaChart>
                </ResponsiveContainer>
                <div style={S.legRow}><span style={S.legItem}><span style={{...S.legDot,background:"#2E7D32"}}/>기분</span><span style={S.legItem}><span style={{...S.legDot,background:"#81C784"}}/>집중</span></div>
              </div>
            )}

            <div style={S.chartSec}>
              <h3 style={S.cTitle}>⏰ 시간대별 평균</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={timePattern} margin={{top:5,right:10,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc"/>
                  <XAxis dataKey="name" tick={{fontSize:11,fill:"#6a8760"}}/>
                  <YAxis domain={[0,10]} tick={{fontSize:11,fill:"#6a8760"}}/>
                  <Tooltip contentStyle={{background:"#f0f5ed",border:"1px solid #c8d8c0",borderRadius:8,fontSize:13}} formatter={(v,n)=>[v+"점",n==="avgMood"?"기분":"집중"]}/>
                  <Bar dataKey="avgMood" radius={[4,4,0,0]} barSize={20}>{timePattern.map((_,i)=><Cell key={i} fill="#2E7D32" opacity={0.85}/>)}</Bar>
                  <Bar dataKey="avgProd" radius={[4,4,0,0]} barSize={20}>{timePattern.map((_,i)=><Cell key={i} fill="#81C784" opacity={0.85}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={S.legRow}><span style={S.legItem}><span style={{...S.legDot,background:"#2E7D32"}}/>기분</span><span style={S.legItem}><span style={{...S.legDot,background:"#81C784"}}/>집중</span></div>
            </div>

            <div style={S.chartSec}>
              <h3 style={S.cTitle}>📅 요일별 기분</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekdayData} margin={{top:5,right:10,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e8dc"/>
                  <XAxis dataKey="name" tick={{fontSize:12,fill:"#6a8760"}}/>
                  <YAxis domain={[0,10]} tick={{fontSize:11,fill:"#6a8760"}}/>
                  <Tooltip contentStyle={{background:"#f0f5ed",border:"1px solid #c8d8c0",borderRadius:8,fontSize:13}} formatter={v=>[v+"점","평균 기분"]}/>
                  <Bar dataKey="avgMood" radius={[6,6,0,0]} barSize={28}>{weekdayData.map((d,i)=><Cell key={i} fill={d.avgMood>=7?"#2E7D32":d.avgMood>=4?"#66BB6A":"#AED581"}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {tagFreq.length>0&&(
              <div style={S.chartSec}>
                <h3 style={S.cTitle}>🏷️ 자주 기록한 상태</h3>
                <div style={S.tfList}>
                  {tagFreq.map(([tag,cnt],i)=>(
                    <div key={tag} style={S.tfItem}><span style={S.tfRank}>#{i+1}</span><span style={S.tfName}>{tag}</span><div style={S.tfBar}><div style={{...S.tfFill,width:`${(cnt/tagFreq[0][1])*100}%`}}/></div><span style={S.tfCnt}>{cnt}회</span></div>
                  ))}
                </div>
              </div>
            )}

            <div style={S.insightBox}>
              <div style={{fontSize:24,flexShrink:0}}>💡</div>
              <div>
                <strong style={{color:"#2E7D32"}}>맞춤 인사이트</strong>
                <p style={S.insightText}>
                  {(()=>{
                    const best=timePattern.reduce((a,b)=>b.avgMood>a.avgMood?b:a,timePattern[0]);
                    const worst=timePattern.filter(t=>t.count>0).reduce((a,b)=>b.avgMood<a.avgMood?b:a,timePattern[0]);
                    if(best.count&&worst.count&&best.name!==worst.name)
                      return `${best.name}에 기분이 가장 좋고, ${worst.name}에 낮은 편이에요. 중요한 일은 ${best.name}에 배치해보세요.`;
                    return "기록이 쌓일수록 내 감정의 리듬이 보여요. 다양한 시간대에 기분을 체크해보세요!";
                  })()}
                </p>
              </div>
            </div>
          </>)}
        </div>
      )}

      <footer style={S.footer}><span>🍃</span><span>Still Forest · every emotion grows into a forest</span><span>🍃</span></footer>
    </div>
  );
}

const S={
  container:{position:"relative",minHeight:"100vh",fontFamily:"'Noto Sans KR','Pretendard',sans-serif",color:"#2c3e2c",maxWidth:520,margin:"0 auto",padding:"0 16px 40px"},
  bgTexture:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse at 20% 0%,rgba(46,125,50,0.08) 0%,transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(129,199,132,0.1) 0%,transparent 60%),linear-gradient(180deg,#f5f9f3 0%,#eaf2e6 50%,#f0f5ed 100%)",zIndex:-2},
  bgPattern:{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%232E7D32' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,zIndex:-1},
  loadWrap:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:16},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0 12px"},
  titleRow:{display:"flex",alignItems:"center",gap:10},
  title:{fontSize:20,fontWeight:800,color:"#1B5E20",margin:0,fontFamily:"'Noto Serif KR',serif"},
  subtitle:{fontSize:11,color:"#6a8760",margin:"2px 0 0"},
  statBadge:{background:"rgba(46,125,50,0.1)",borderRadius:12,padding:"7px 12px",display:"flex",flexDirection:"column",alignItems:"center"},
  statNum:{fontSize:18,fontWeight:800,color:"#2E7D32"},
  statLbl:{fontSize:10,color:"#6a8760"},
  nav:{display:"flex",gap:4,marginBottom:12,background:"rgba(255,255,255,0.6)",borderRadius:14,padding:3,border:"1px solid rgba(46,125,50,0.1)"},
  navBtn:{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"9px 4px",border:"none",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600,color:"#6a8760",background:"transparent",fontFamily:"inherit"},
  navAct:{background:"#2E7D32",color:"#fff",boxShadow:"0 2px 12px rgba(46,125,50,0.25)"},
  card:{background:"rgba(255,255,255,0.8)",borderRadius:20,padding:18,border:"1px solid rgba(46,125,50,0.1)",boxShadow:"0 4px 24px rgba(0,0,0,0.04)"},
  section:{marginBottom:22},
  label:{display:"block",fontSize:14,fontWeight:700,color:"#2E7D32",marginBottom:10},
  greeting:{fontSize:15,fontWeight:600,color:"#43A047",marginBottom:14,textAlign:"center"},
  savedBanner:{background:"rgba(46,125,50,0.1)",color:"#2E7D32",padding:"10px 14px",borderRadius:12,marginBottom:14,textAlign:"center",fontSize:13,fontWeight:600},
  todayTimeline:{background:"rgba(46,125,50,0.04)",borderRadius:14,padding:12,marginBottom:16,border:"1px solid rgba(46,125,50,0.08)"},
  tlLabel:{fontSize:12,fontWeight:700,color:"#2E7D32",marginBottom:8},
  tlDots:{display:"flex",gap:10,overflowX:"auto",paddingBottom:4},
  tlDot:{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:44},
  moodDisplay:{display:"flex",flexDirection:"column",alignItems:"center",gap:4,marginBottom:14},
  moodScore:{fontSize:32,fontWeight:800},
  moodLbl:{fontSize:14,fontWeight:600},
  scoreRow:{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,justifyItems:"center",maxWidth:240,margin:"0 auto"},
  scoreBtn:{width:36,height:36,borderRadius:"50%",border:"2px solid rgba(46,125,50,0.2)",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"},
  prodRow:{display:"flex",alignItems:"center",gap:10},
  pLabel:{fontSize:12,color:"#999"},
  slider:{flex:1,accentColor:"#2E7D32"},
  prodVal:{background:"#2E7D32",color:"#fff",borderRadius:8,padding:"4px 10px",fontSize:14,fontWeight:700,minWidth:32,textAlign:"center"},
  tagGrid:{display:"flex",flexWrap:"wrap",gap:7},
  tag:{padding:"5px 12px",borderRadius:20,border:"1.5px solid #c8d8c0",background:"rgba(255,255,255,0.8)",cursor:"pointer",fontSize:12,color:"#5a7750",fontWeight:500,fontFamily:"inherit"},
  tagAct:{background:"#2E7D32",color:"#fff",borderColor:"#2E7D32"},
  textInput:{width:"100%",padding:"11px 14px",borderRadius:12,border:"1.5px solid #c8d8c0",background:"rgba(255,255,255,0.9)",fontSize:14,color:"#2c3e2c",outline:"none",boxSizing:"border-box",fontFamily:"inherit"},
  saveBtn:{width:"100%",padding:"13px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#2E7D32,#43A047)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 16px rgba(46,125,50,0.3)",fontFamily:"inherit"},
  autoNote:{textAlign:"center",fontSize:11,color:"#aaa",marginTop:8},
  modeWrap:{display:"flex",gap:8,marginBottom:18},
  modeBtn:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 8px",borderRadius:14,border:"2px solid #d4e4d0",background:"rgba(255,255,255,0.6)",cursor:"pointer",color:"#6a8760",position:"relative",fontFamily:"inherit"},
  modeBtnAct:{borderColor:"#66BB6A",background:"linear-gradient(135deg,rgba(102,187,106,0.12),rgba(67,160,71,0.08))",color:"#43A047"},
  modeBtnEvAct:{borderColor:"#2E7D32",background:"linear-gradient(135deg,rgba(46,125,50,0.1),rgba(27,94,32,0.06))",color:"#1B5E20"},
  doneBadge:{position:"absolute",top:6,right:8,fontSize:10,background:"#43A047",color:"#fff",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700},
  reminder:{display:"flex",gap:12,alignItems:"flex-start",background:"linear-gradient(135deg,#fff8e1,#fff3e0)",borderRadius:14,padding:14,marginBottom:18,border:"1px solid #ffe0b2"},
  remLabel:{fontSize:11,color:"#e65100",fontWeight:700,marginBottom:2},
  remText:{fontSize:14,color:"#bf360c",fontWeight:600},
  jHeader:{display:"flex",alignItems:"center",gap:10,marginBottom:12},
  jTitle:{fontSize:15,fontWeight:700,color:"#2E7D32"},
  jHint:{fontSize:12,color:"#8aA780"},
  jInput:{width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid #c8d8c0",background:"rgba(255,255,255,0.9)",fontSize:14,color:"#2c3e2c",outline:"none",boxSizing:"border-box",fontFamily:"inherit",resize:"none",lineHeight:1.6},
  charCnt:{textAlign:"right",fontSize:11,color:"#aaa",marginTop:4},
  fieldLabel:{display:"block",fontSize:13,fontWeight:600,color:"#43A047",marginBottom:8},
  secTitle:{fontSize:17,fontWeight:800,color:"#1B5E20",marginTop:0,marginBottom:14,fontFamily:"'Noto Serif KR',serif"},
  empty:{textAlign:"center",padding:"36px 0",color:"#8aA780",lineHeight:1.8},
  entryList:{display:"flex",flexDirection:"column",gap:10},
  entryCard:{background:"rgba(255,255,255,0.8)",borderRadius:13,padding:13,border:"1px solid rgba(46,125,50,0.08)"},
  entryTop:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},
  entryLeft:{display:"flex",alignItems:"center",gap:9},
  eScore:{fontSize:17,fontWeight:800},
  eProd:{fontSize:10,color:"#8aA780",background:"#eef4ec",borderRadius:6,padding:"2px 7px"},
  etime:{fontSize:10,color:"#fff",background:"#8aA780",borderRadius:6,padding:"2px 7px",fontWeight:600},
  eDate:{fontSize:11,color:"#8aA780",marginTop:2,display:"block"},
  eTags:{display:"flex",flexWrap:"wrap",gap:5,marginTop:7},
  eTag:{fontSize:10,background:"#eef4ec",color:"#5a7750",padding:"2px 9px",borderRadius:10},
  eMemo:{fontSize:12,color:"#5a7750",marginTop:6,fontStyle:"italic",margin:"6px 0 0"},
  delBtn:{background:"none",border:"none",color:"#c0c0c0",fontSize:18,cursor:"pointer",padding:"0 4px",lineHeight:1},
  jEntry:{marginTop:8,background:"rgba(46,125,50,0.04)",borderRadius:10,padding:"7px 11px"},
  jELbl:{fontSize:10,fontWeight:700,color:"#66BB6A"},
  jETxt:{fontSize:12,color:"#3e5e3e",margin:"3px 0 0",lineHeight:1.6},
  sumRow:{display:"flex",gap:8,marginBottom:18},
  sumCard:{flex:1,background:"rgba(46,125,50,0.06)",borderRadius:12,padding:"12px 6px",textAlign:"center"},
  sumVal:{fontSize:20,fontWeight:800,color:"#2E7D32"},
  sumLbl:{fontSize:10,color:"#6a8760",marginTop:2},
  chartSec:{marginBottom:22},
  cTitle:{fontSize:14,fontWeight:700,color:"#2E7D32",marginBottom:4,marginTop:0},
  cDesc:{fontSize:11,color:"#8aA780",marginBottom:10,marginTop:0},
  legRow:{display:"flex",justifyContent:"center",gap:14,marginTop:8},
  legItem:{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#6a8760"},
  legDot:{width:9,height:9,borderRadius:"50%",display:"inline-block"},
  tfList:{display:"flex",flexDirection:"column",gap:7},
  tfItem:{display:"flex",alignItems:"center",gap:7},
  tfRank:{fontSize:10,color:"#8aA780",fontWeight:700,width:22},
  tfName:{fontSize:12,color:"#2c3e2c",fontWeight:600,width:65},
  tfBar:{flex:1,height:7,background:"#eef4ec",borderRadius:4,overflow:"hidden"},
  tfFill:{height:"100%",background:"linear-gradient(90deg,#66BB6A,#2E7D32)",borderRadius:4},
  tfCnt:{fontSize:11,color:"#8aA780",width:34,textAlign:"right"},
  insightBox:{background:"linear-gradient(135deg,rgba(46,125,50,0.08),rgba(129,199,132,0.1))",borderRadius:14,padding:14,display:"flex",gap:10,alignItems:"flex-start",border:"1px solid rgba(46,125,50,0.12)"},
  insightText:{fontSize:12,color:"#3e5e3e",lineHeight:1.7,margin:"4px 0 0"},
  footer:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"22px 0 8px",fontSize:11,color:"#8aA780"},
  exportBtn:{padding:"6px 12px",borderRadius:10,border:"1.5px solid #c8d8c0",background:"rgba(255,255,255,0.8)",fontSize:12,fontWeight:600,color:"#2E7D32",cursor:"pointer",fontFamily:"inherit"},
  calNav:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12},
  calArrow:{background:"none",border:"1.5px solid #c8d8c0",borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:14,color:"#2E7D32",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"},
  calMonthLabel:{fontSize:16,fontWeight:700,color:"#1B5E20"},
  calGrid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:10},
  calDayHeader:{textAlign:"center",fontSize:11,fontWeight:700,color:"#8aA780",padding:"4px 0"},
  calCell:{textAlign:"center",padding:4,minHeight:44},
  calCellBtn:{background:"rgba(255,255,255,0.5)",borderRadius:10,border:"1.5px solid transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"inherit"},
  calCellSelected:{background:"#2E7D32",color:"#fff",borderColor:"#2E7D32"},
  calCellToday:{borderColor:"#66BB6A",background:"rgba(102,187,106,0.15)"},
  calDot:{width:6,height:6,borderRadius:"50%",display:"inline-block"},
  calLegend:{display:"flex",justifyContent:"center",gap:14,marginBottom:16},
  calLegItem:{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#6a8760"},
  dayEmpty:{textAlign:"center",padding:"24px 0",color:"#aaa",fontSize:13},
  dayDetail:{marginTop:4},
  dayDetailTitle:{fontSize:15,fontWeight:700,color:"#1B5E20",marginBottom:12},
  daySubTitle:{fontSize:13,fontWeight:700,color:"#2E7D32",marginBottom:8},
};
