import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
const DB = path.join(DATA_DIR, 'db.json')
fs.mkdirSync(DATA_DIR, { recursive: true })
function seed() {
  const now = Date.now()
  return {
    boards: [
      {
        id: 'b1', name: '🚀 專案範例', icon: '🚀', color: '#6366f1',
        labels: [
          { id: 'l1', name: '優先', color: '#ef4444' },
          { id: 'l2', name: '設計', color: '#8b5cf6' },
          { id: 'l3', name: '開發', color: '#06b6d4' }
        ],
        lists: [
          { id: 'l-1', title: '待辦', cards: [
            { id: 'c1', title: '規劃 LifeFlow 功能', description: '參考 Trello 設計個人看板，支援拖曳、標籤、到期日', dueDate: new Date(Date.now()+86400000*2).toISOString().slice(0,10), labels: ['l1'], checklist: [{id:'ch1',text:'設計資料結構',done:true},{id:'ch2',text:'實作拖曳',done:false}], createdAt: new Date(now-86400000).toISOString() },
            { id: 'c2', title: '閱讀《原子習慣》', description: '', dueDate: '', labels: [], checklist: [], createdAt: new Date().toISOString() }
          ]},
          { id: 'l-2', title: '進行中', cards: [
            { id: 'c3', title: '開發看板 UI', description: '列表與卡片、側邊欄、今日焦點', dueDate: new Date().toISOString().slice(0,10), labels: ['l3'], checklist: [{id:'ch3',text:'側邊欄',done:true},{id:'ch4',text:'拖曳',done:false}], createdAt: new Date().toISOString() }
          ]},
          { id: 'l-3', title: '已完成', cards: [
            { id: 'c4', title: '建立專案架構', description: 'Vite + React + Express', dueDate: '', labels: [], checklist: [], createdAt: new Date(now-86400000*2).toISOString() }
          ]}
        ]
      },
      {
        id: 'b2', name: '🌱 生活規劃', icon: '🌱', color: '#10b981',
        labels: [
          { id: 'l4', name: '健康', color: '#10b981' },
          { id: 'l5', name: '學習', color: '#f59e0b' },
          { id: 'l6', name: '財務', color: '#06b6d4' }
        ],
        lists: [
          { id: 'l-4', title: '本週目標', cards: [
            { id: 'c5', title: '早睡 23:00 前', description: '連續 5 天', dueDate: '', labels: ['l4'], checklist: [], createdAt: new Date().toISOString() },
            { id: 'c6', title: '運動 3 次', description: '跑步 / 重訓', dueDate: new Date(Date.now()+86400000*3).toISOString().slice(0,10), labels: ['l4'], checklist: [{id:'ch5',text:'週一',done:true},{id:'ch6',text:'週三',done:false},{id:'ch7',text:'週五',done:false}], createdAt: new Date().toISOString() }
          ]},
          { id: 'l-5', title: '習慣追蹤', cards: [
            { id: 'c7', title: '每日閱讀 30 分鐘', description: '', dueDate: '', labels: ['l5'], checklist: [], createdAt: new Date().toISOString() }
          ]},
          { id: 'l-6', title: '靈感', cards: [
            { id: 'c8', title: '想學吉他', description: '找線上課程', dueDate: '', labels: [], checklist: [], createdAt: new Date().toISOString() }
          ]}
        ]
      }
    ]
  }
}
function load() {
  try { if (fs.existsSync(DB)) return JSON.parse(fs.readFileSync(DB, 'utf8')) } catch {}
  const d = seed(); fs.writeFileSync(DB, JSON.stringify(d, null, 2)); return d
}
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.get('/api/data', (req, res) => res.json(load()))
app.put('/api/data', (req, res) => {
  try { fs.mkdirSync(path.dirname(DB), { recursive: true }); fs.writeFileSync(DB, JSON.stringify(req.body, null, 2)); res.json({ ok: true }) } catch (e) { res.status(500).json({ error: String(e) }) }
})
app.get('/api/health', (req, res) => res.json({ ok: true }))
const dist = path.join(__dirname, '..', 'dist')
if (fs.existsSync(dist)) app.use(express.static(dist))
app.get('*', (req, res) => {
  const idx = path.join(dist, 'index.html')
  if (fs.existsSync(idx)) res.sendFile(idx)
  else res.json({ ok: true, msg: 'dev mode - run npm run dev' })
})
app.listen(PORT, () => console.log('LifeFlow server on :' + PORT + ' data:' + DB))
