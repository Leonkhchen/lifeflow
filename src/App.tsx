import { useEffect, useMemo, useRef, useState } from 'react'
import type { Board, Card, Data, Label, List } from './types'
const uid = () => Math.random().toString(36).slice(2, 9)
const todayStr = () => new Date().toISOString().slice(0,10)
const isOverdue = (d:string)=> d && d < todayStr()
const isToday = (d:string)=> d === todayStr()
export default function App(){
  const [data,setData]=useState<Data|null>(null)
  const [active,setActive]=useState<string>('')
  const [view,setView]=useState<'board'|'today'>('board')
  const [search,setSearch]=useState('')
  const [dragCard,setDragCard]=useState<{cardId:string,fromListId:string}|null>(null)
  const [dragOver,setDragOver]=useState<{listId:string,index:number}|null>(null)
  const [dragList,setDragList]=useState<string|null>(null)
  const [dragOverList,setDragOverList]=useState<number|null>(null)
  const [editingCard,setEditingCard]=useState<{boardId:string,listId:string,card:Card}|null>(null)
  const [addingList,setAddingList]=useState(false)
  const [newListName,setNewListName]=useState('')
  const saveRef=useRef<number|null>(null)
  const [saving,setSaving]=useState(false)
  const KEY='lifeflow-data-v1'
  const seed=():Data=>{
    const now=new Date().toISOString()
    const d=(n:number)=>new Date(Date.now()+86400000*n).toISOString().slice(0,10)
    return {boards:[
      {id:'b1',name:'🚀 專案範例',icon:'🚀',color:'#6366f1',labels:[{id:'l1',name:'優先',color:'#ef4444'},{id:'l2',name:'設計',color:'#8b5cf6'},{id:'l3',name:'開發',color:'#06b6d4'}],lists:[
        {id:'l-1',title:'待辦',cards:[{id:'c1',title:'規劃 LifeFlow 功能',description:'支援拖曳、標籤、到期日、核對清單',dueDate:d(2),labels:['l1'],checklist:[{id:'ch1',text:'設計資料結構',done:true},{id:'ch2',text:'實作拖曳',done:false}],createdAt:now},{id:'c2',title:'閱讀《原子習慣》',description:'',dueDate:'',labels:[],checklist:[],createdAt:now}]},
        {id:'l-2',title:'進行中',cards:[{id:'c3',title:'開發看板 UI',description:'列表與卡片、側邊欄、今日焦點',dueDate:d(0),labels:['l3'],checklist:[{id:'ch3',text:'側邊欄',done:true},{id:'ch4',text:'拖曳',done:false}],createdAt:now}]},
        {id:'l-3',title:'已完成',cards:[{id:'c4',title:'建立專案架構',description:'Vite + React',dueDate:'',labels:[],checklist:[],createdAt:now}]}]},
      {id:'b2',name:'🌱 生活規劃',icon:'🌱',color:'#10b981',labels:[{id:'l4',name:'健康',color:'#10b981'},{id:'l5',name:'學習',color:'#f59e0b'}],lists:[
        {id:'l-4',title:'本週目標',cards:[{id:'c5',title:'早睡 23:00 前',description:'連續 5 天',dueDate:'',labels:['l4'],checklist:[],createdAt:now}]},
        {id:'l-5',title:'習慣追蹤',cards:[{id:'c7',title:'每日閱讀 30 分鐘',description:'',dueDate:'',labels:['l5'],checklist:[],createdAt:now}]},
        {id:'l-6',title:'靈感',cards:[{id:'c8',title:'想學吉他',description:'找線上課程',dueDate:'',labels:[],checklist:[],createdAt:now}]}]}
    ]}
  }
  useEffect(()=>{
    try{
      const raw=localStorage.getItem(KEY)
      if(raw){ const d=JSON.parse(raw) as Data; setData(d); if(d.boards[0]) setActive(d.boards[0].id); return }
    }catch{}
    fetch('/api/data').then(r=>r.json()).then((d:Data)=>{
      if(d && (d as Data).boards){ setData(d); if(d.boards[0]) setActive(d.boards[0].id); try{localStorage.setItem(KEY,JSON.stringify(d))}catch{} }
      else throw 0
    }).catch(()=>{
      const d=seed(); setData(d); if(d.boards[0]) setActive(d.boards[0].id); try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}
    })
  },[])
  useEffect(()=>{
    if(!data) return
    if(saveRef.current) window.clearTimeout(saveRef.current)
    setSaving(true)
    saveRef.current = window.setTimeout(()=>{
      try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}
      fetch('/api/data',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(data)}).catch(()=>{}).finally(()=>setSaving(false))
    },600)
  },[data])
  const activeBoard = useMemo(()=> data?.boards.find(b=>b.id===active) || null,[data,active])
  const stats = useMemo(()=>{
    if(!data) return {total:0,overdue:0,today:0,boards:0}
    let total=0, overdue=0, today=0
    data.boards.forEach(b=>b.lists.forEach(l=>{
      const done = l.title.includes('完成')
      l.cards.forEach(c=>{
        total++; if(!done){ if(isOverdue(c.dueDate)) overdue++; else if(isToday(c.dueDate)) today++ }
      })
    }))
    return {total,overdue,today,boards:data.boards.length}
  },[data])
  useEffect(()=>{ if(data && !activeBoard && data.boards[0]) setActive(data.boards[0].id) },[data,activeBoard])
  if(!data) return <div style={{display:'grid',placeItems:'center',height:'100vh',color:'#8b93a7'}}>載入中…</div>
  if(!activeBoard) return <div style={{display:'grid',placeItems:'center',height:'100vh',color:'#8b93a7'}}><div><p>尚無看板，請新增一個</p><button className="btn btn-primary" style={{marginTop:12}} onClick={()=>{const id=uid(); setData(p=>p?{boards:[...p.boards,{id,name:'新看板',icon:'📋',color:'#6366f1',labels:[],lists:[{id:uid(),title:'待辦',cards:[]},{id:uid(),title:'進行中',cards:[]},{id:uid(),title:'已完成',cards:[]}]}]}:p); setActive(id)}}>＋ 新增看板</button></div></div>
  const update = (fn:(d:Data)=>Data)=> setData(p=>p?fn(structuredClone(p)):p)
  const moveCard = (cardId:string, from:string, to:string, toIndex:number)=>{
    update(d=>{
      let card:Card|null=null
      d.boards.forEach(b=>b.lists.forEach(l=>{
        const i=l.cards.findIndex(c=>c.id===cardId)
        if(i>=0){ card=l.cards.splice(i,1)[0] }
      }))
      if(!card) return d
      d.boards.forEach(b=>b.lists.forEach(l=>{
        if(l.id===to){ l.cards.splice(toIndex,0,card!) }
      }))
      return d
    })
  }
  const reorderList = (boardId:string, fromIdx:number, toIdx:number)=>{
    update(d=>{
      const b=d.boards.find(x=>x.id===boardId); if(!b) return d
      const [m]=b.lists.splice(fromIdx,1); b.lists.splice(toIdx,0,m); return d
    })
  }
  const filtered = (cards:Card[])=> cards.filter(c=>{
    if(!search) return true
    const q=search.toLowerCase()
    return c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  })
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">◈</div>
          <div><h1>LifeFlow</h1><p>個人專案 · 生活規劃</p></div>
        </div>
        <div className="nav">
          <button className={`nav-btn ${view==='today'?'active':''}`} onClick={()=>setView('today')}>◎ 今日焦點 {stats.overdue||stats.today?`· ${stats.overdue+stats.today}`:''}</button>
          <button className={`nav-btn ${view==='board'?'active':''}`} onClick={()=>setView('board')}>▦ 看板</button>
        </div>
        <div className="boards-head"><span>專案集</span><button className="btn" style={{padding:'2px 6px',fontSize:11}} onClick={()=>{
          const id=uid(); update(d=>{d.boards.push({id,name:'新看板',icon:'📋',color:'#6366f1',labels:[],lists:[{id:uid(),title:'待辦',cards:[]},{id:uid(),title:'進行中',cards:[]},{id:uid(),title:'已完成',cards:[]}]});return d}); setActive(id); setView('board')
        }}>＋ 新增</button></div>
        <div style={{overflow:'auto',paddingBottom:12}}>
          {data.boards.map(b=>(
            <div key={b.id} className={`board-item ${active===b.id&&view==='board'?'active':''}`} onClick={()=>{setActive(b.id);setView('board')}}>
              <span className="board-dot" style={{background:b.color}}/><span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.icon} {b.name}</span>
            </div>
          ))}
        </div>
        <div style={{marginTop:'auto',padding:12,borderTop:'1px solid #2a303f',fontSize:11,color:'#8b93a7'}}>
          {saving?'儲存中…':'已儲存'} · {stats.total} 張卡片
        </div>
      </aside>
      <div className="main">
        {view==='today'? (
          <div className="today">
            <h2 style={{fontSize:18,marginBottom:6}}>今日焦點</h2><p style={{color:'#8b93a7',fontSize:13,marginBottom:16}}>{todayStr()} · 掌握所有到期與重要任務</p>
            <div className="stat-grid">
              <div className="stat"><b>{stats.boards}</b><p>看板</p></div>
              <div className="stat"><b>{stats.total}</b><p>總卡片</p></div>
              <div className="stat" style={{borderColor:'#5a2222'}}><b style={{color:'#ff8a8a'}}>{stats.overdue}</b><p>已逾期</p></div>
              <div className="stat" style={{borderColor:'#4a3d1a'}}><b style={{color:'#ffd166'}}>{stats.today}</b><p>今日到期</p></div>
            </div>
            {(()=>{
              const groups:{title:string,cards:{b:Board,l:List,c:Card}[]}[]=[
                {title:'⚠️ 已逾期',cards:[]},{title:'📅 今日到期',cards:[]},{title:'⏩ 近期 7 天',cards:[]},{title:'📝 無日期',cards:[]}
              ]
              const now = new Date(todayStr()); const in7 = new Date(now); in7.setDate(in7.getDate()+7)
              data.boards.forEach(b=>b.lists.forEach(l=>{
                const done=l.title.includes('完成')
                l.cards.forEach(c=>{
                  if(done) return
                  if(isOverdue(c.dueDate)) groups[0].cards.push({b,l,c})
                  else if(isToday(c.dueDate)) groups[1].cards.push({b,l,c})
                  else if(c.dueDate && new Date(c.dueDate) <= in7) groups[2].cards.push({b,l,c})
                  else if(!c.dueDate) groups[3].cards.push({b,l,c})
                })
              }))
              return groups.map(g=>(
                <div key={g.title}>
                  <h3>{g.title} · {g.cards.length}</h3>
                  <div className="group">
                    {g.cards.length===0?<div style={{color:'#8b93a7',fontSize:12,padding:8}}>無</div>:g.cards.slice(0,12).map(({b,l,c})=>(
                      <div key={c.id} className="group-item" onClick={()=>{setActive(b.id);setView('board'); setTimeout(()=>document.getElementById('card-'+c.id)?.scrollIntoView({behavior:'smooth',block:'center'}),100)}}>
                        <div><div style={{fontSize:13}}>{c.title}</div><div style={{fontSize:11,color:'#8b93a7'}}>{b.name} › {l.title} {c.dueDate?`· ${c.dueDate}`:''}</div></div>
                        <span style={{fontSize:11,background:b.color,color:'#fff',padding:'2px 6px',borderRadius:10}}>{b.icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            })()}
          </div>
        ): (
          <>
            <div className="topbar">
              <h2><span style={{width:10,height:10,background:activeBoard.color,borderRadius:'50%',display:'inline-block'}}/>{activeBoard.icon} <input value={activeBoard.name} onChange={e=>update(d=>{const b=d.boards.find(x=>x.id===active)!; b.name=e.target.value; return d})} style={{background:'transparent',border:'1px solid transparent',color:'#e6e8ee',fontWeight:600,fontSize:15,outline:'none',minWidth:120}} /> <span style={{fontSize:11,color:'#8b93a7',fontWeight:400}}>{activeBoard.lists.reduce((a,l)=>a+l.cards.length,0)} 張</span></h2>
              <div className="search"><span>⌕</span><input placeholder="搜尋卡片…" value={search} onChange={e=>setSearch(e.target.value)} /></div>
              <button className="btn btn-ghost" onClick={()=>{
                if(confirm('刪除此看板？')) update(d=>{d.boards=d.boards.filter(b=>b.id!==active); return d})
              }}>刪除看板</button>
            </div>
            <div className="board-wrap">
              {activeBoard.lists.map((list,li)=> {
                const isDragOverList = dragList===list.id
                return (
                <div key={list.id}
                  className="list"
                  style={{opacity:isDragOverList?0.5:1}}
                  draggable={!!dragList}
                  onDragOver={e=>{
                    if(dragList){ e.preventDefault(); setDragOverList(li) }
                    if(dragCard){ e.preventDefault(); if(!dragOver || dragOver.listId!==list.id) setDragOver({listId:list.id,index:list.cards.length}) }
                  }}
                  onDragLeave={e=>{ if(dragCard && !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDragOver(null)}}
                  onDrop={e=>{
                    e.preventDefault()
                    if(dragList && dragOverList!==null && dragList!==list.id){
                      const fromIdx=activeBoard.lists.findIndex(x=>x.id===dragList)
                      reorderList(active,fromIdx, dragOverList)
                    }
                    if(dragCard && dragOver){
                      moveCard(dragCard.cardId, dragCard.fromListId, dragOver.listId, dragOver.index)
                    }
                    setDragCard(null); setDragOver(null); setDragList(null); setDragOverList(null)
                  }}
                >
                  <div className="list-head" draggable onDragStart={()=>setDragList(list.id)} onDragEnd={()=>setDragList(null)}>
                    <input value={list.title} onChange={e=>update(d=>{d.boards.find(b=>b.id===active)!.lists[li].title=e.target.value; return d})} />
                    <span className="list-count">{filtered(list.cards).length}</span>
                    <button className="btn btn-ghost" style={{padding:'2px 6px'}} onClick={()=>{ if(confirm('刪除此列表？')) update(d=>{d.boards.find(b=>b.id===active)!.lists.splice(li,1); return d}) }}>×</button>
                  </div>
                  <div className="cards" onDragOver={e=>{ if(dragCard) e.preventDefault() }}>
                    {filtered(list.cards).map((card,ci)=>{
                      const realIdx=list.cards.findIndex(c=>c.id===card.id)
                      const showPlaceholder = dragOver && dragOver.listId===list.id && dragOver.index===realIdx
                      return (
                        <div key={card.id}>
                          {showPlaceholder && <div className="placeholder" />}
                          <div id={'card-'+card.id} className={`card ${dragCard?.cardId===card.id?'dragging':''}`} draggable onDragStart={e=>{setDragCard({cardId:card.id,fromListId:list.id}); e.dataTransfer.effectAllowed='move'}}
                            onDragOver={e=>{
                              e.preventDefault(); e.stopPropagation()
                              const rect=(e.currentTarget as HTMLElement).getBoundingClientRect()
                              const before = e.clientY < rect.top + rect.height/2
                              setDragOver({listId:list.id,index: before? realIdx : realIdx+1})
                            }}
                            onDragEnd={()=>{setDragCard(null); setDragOver(null)}}
                            onClick={()=>setEditingCard({boardId:active,listId:list.id,card})}
                          >
                            <div className="card-title">{card.title}</div>
                            {card.description && <div className="card-desc">{card.description.slice(0,60)}</div>}
                            {(card.labels.length>0 || card.dueDate || card.checklist.length>0) && (
                              <div className="card-meta">
                                {card.labels.map(lid=>{
                                  const lab=activeBoard.labels.find(x=>x.id===lid); if(!lab) return null
                                  return <span key={lid} className="label" style={{background:lab.color}}>{lab.name}</span>
                                })}
                                {card.dueDate && <span className={`badge ${isOverdue(card.dueDate)?'overdue':isToday(card.dueDate)?'today':''}`}>{isOverdue(card.dueDate)?'⚠':isToday(card.dueDate)?'●':''} {card.dueDate}</span>}
                                {card.checklist.length>0 && <span className="badge">{card.checklist.filter(x=>x.done).length}/{card.checklist.length} ☑</span>}
                              </div>
                            )}
                            {card.checklist.length>0 && <div className="progress" style={{marginTop:8}}><i style={{width:(card.checklist.filter(x=>x.done).length/card.checklist.length*100)+'%'}}/></div>}
                          </div>
                        </div>
                      )
                    })}
                    {dragOver && dragOver.listId===list.id && dragOver.index===list.cards.length && <div className="placeholder" />}
                    <AddCard onAdd={title=>{
                      const c:Card={id:uid(),title,description:'',dueDate:'',labels:[],checklist:[],createdAt:new Date().toISOString()}
                      update(d=>{d.boards.find(b=>b.id===active)!.lists[li].cards.push(c); return d})
                    }} />
                  </div>
                </div>
              )})}
              {dragOverList!==null && <div className="list-placeholder" />}
              <div className="list" style={{background:'transparent',borderStyle:'dashed',justifyContent:'center',alignItems:'center',padding:16}}>
                {!addingList? <button className="btn" onClick={()=>setAddingList(true)}>＋ 新增列表</button>:
                <div style={{display:'flex',gap:6,width:'100%'}}><input autoFocus value={newListName} onChange={e=>setNewListName(e.target.value)} placeholder="列表標題" style={{flex:1,background:'#0f1115',border:'1px solid #2a303f',color:'#e6e8ee',padding:'7px 8px',borderRadius:8}}/>
                <button className="btn btn-primary" onClick={()=>{ if(!newListName.trim()) return; update(d=>{d.boards.find(b=>b.id===active)!.lists.push({id:uid(),title:newListName.trim(),cards:[]});return d}); setNewListName(''); setAddingList(false)}}>新增</button><button className="btn btn-ghost" onClick={()=>setAddingList(false)}>×</button></div>}
              </div>
            </div>
          </>
        )}
      </div>
      {editingCard && <CardModal card={editingCard.card} board={data.boards.find(b=>b.id===editingCard.boardId)!} onClose={()=>setEditingCard(null)} onSave={(patch)=>{
        update(d=>{
          const b=d.boards.find(x=>x.id===editingCard.boardId)!; const l=b.lists.find(x=>x.id===editingCard.listId)!; const idx=l.cards.findIndex(x=>x.id===patch.id); if(idx>=0) l.cards[idx]=patch
          if(patch._moveTo){ const to=patch._moveTo as string; if(to!==editingCard.listId){ const [m]=l.cards.splice(idx,1); const nl=b.lists.find(x=>x.id===to)!; nl.cards.push(m) } delete (patch as any)._moveTo }
          return d
        }); setEditingCard(null)
      }} onDelete={()=>{
        update(d=>{const b=d.boards.find(x=>x.id===editingCard.boardId)!; const l=b.lists.find(x=>x.id===editingCard.listId)!; l.cards=l.cards.filter(x=>x.id!==editingCard.card.id); return d}); setEditingCard(null)
      }} />}
    </div>
  )
}
function AddCard({onAdd}:{onAdd:(t:string)=>void}){
  const [open,setOpen]=useState(false); const [v,setV]=useState('')
  if(!open) return <button className="add-card" onClick={()=>setOpen(true)}>＋ 新增卡片</button>
  return <div className="add-input"><input autoFocus value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){if(v.trim()) onAdd(v.trim()); setV(''); setOpen(false)} if(e.key==='Escape') setOpen(false)}} placeholder="卡片標題" /><button className="btn btn-primary" onClick={()=>{if(v.trim()) onAdd(v.trim()); setV(''); setOpen(false)}}>新增</button><button className="btn btn-ghost" onClick={()=>setOpen(false)}>×</button></div>
}
function CardModal({card,board,onClose,onSave,onDelete}:{card:Card,board:Board,onClose:()=>void,onSave:(c:any)=>void,onDelete:()=>void}){
  const [title,setTitle]=useState(card.title)
  const [desc,setDesc]=useState(card.description)
  const [due,setDue]=useState(card.dueDate)
  const [labels,setLabels]=useState<string[]>([...card.labels])
  const [checks,setChecks]=useState([...card.checklist])
  const [moveTo,setMoveTo]=useState('')
  const [newCheck,setNewCheck]=useState('')
  const [newLabel,setNewLabel]=useState('')
  const doSave=()=> onSave({...card,title,description:desc,dueDate:due,labels,checklist:checks,_moveTo:moveTo||undefined})
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="卡片標題" /><button className="btn btn-ghost" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="field"><label>描述</label><textarea rows={3} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="新增詳細描述…" /></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="field"><label>到期日</label><input type="date" value={due} onChange={e=>setDue(e.target.value)} /></div>
            <div className="field"><label>移動到</label><select value={moveTo} onChange={e=>setMoveTo(e.target.value)} style={{width:'100%',background:'#0f1115',border:'1px solid #2a303f',color:'#e6e8ee',padding:'7px 8px',borderRadius:8}}><option value="">不移動</option>{board.lists.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></div>
          </div>
          <div className="field"><label>標籤</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
              {board.labels.map(l=>(
                <button key={l.id} onClick={()=>setLabels(p=>p.includes(l.id)?p.filter(x=>x!==l.id):[...p,l.id])} style={{padding:'4px 8px',borderRadius:10,border:labels.includes(l.id)?'2px solid #fff':'1px solid #2a303f',background:l.color,color:'#fff',fontSize:11,cursor:'pointer'}}>{l.name}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:6}}><input type="text" value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="新標籤名稱" style={{flex:1}} /><button className="btn" onClick={()=>{
              if(!newLabel.trim()) return; const id=uid(); const colors=['#ef4444','#f59e0b','#10b981','#06b6d4','#8b5cf6','#ec4899']; const c=colors[Math.floor(Math.random()*colors.length)]; board.labels.push({id,name:newLabel.trim(),color:c}); setLabels([...labels,id]); setNewLabel('')
            }}>新增標籤</button></div>
          </div>
          <div className="field"><label>核對清單 {checks.length?`${checks.filter(x=>x.done).length}/${checks.length}`:''}</label>
            {checks.map((it,idx)=><div key={it.id} className="check-item"><input type="checkbox" checked={it.done} onChange={e=>{const n=[...checks]; n[idx]={...it,done:e.target.checked}; setChecks(n)}} /><input value={it.text} onChange={e=>{const n=[...checks]; n[idx]={...it,text:e.target.value}; setChecks(n)}} style={{flex:1,background:'transparent',border:'none',color:'#e6e8ee',outline:'none'}} /><button className="btn btn-ghost" style={{padding:'2px 6px'}} onClick={()=>setChecks(checks.filter(x=>x.id!==it.id))}>×</button></div>)}
            <div className="progress" style={{marginTop:8}}><i style={{width: checks.length? (checks.filter(x=>x.done).length/checks.length*100)+'%':'0%'}}/></div>
            <div style={{display:'flex',gap:6,marginTop:8}}><input type="text" value={newCheck} onChange={e=>setNewCheck(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newCheck.trim()){setChecks([...checks,{id:uid(),text:newCheck.trim(),done:false}]); setNewCheck('')}}} placeholder="新增項目" style={{flex:1,background:'#0f1115',border:'1px solid #2a303f',color:'#e6e8ee',padding:'7px 8px',borderRadius:8}} /><button className="btn" onClick={()=>{if(newCheck.trim()){setChecks([...checks,{id:uid(),text:newCheck.trim(),done:false}]); setNewCheck('')}}}>新增</button></div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:4}}>
            <button className="btn" style={{color:'#ff8a8a',borderColor:'#5a2222'}} onClick={onDelete}>刪除卡片</button>
            <div style={{display:'flex',gap:8}}><button className="btn btn-ghost" onClick={onClose}>取消</button><button className="btn btn-primary" onClick={doSave}>儲存</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}
