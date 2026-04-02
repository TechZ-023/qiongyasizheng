import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import './App.css'
import rawData from './data.json'
import hainnuEduBadge from './assets/hainnu-edu-badge.jpg'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || ''
const FILTER_STORAGE_KEY = 'qiongya_filters_v1'
const ENTRY_STORAGE_KEY = 'qiongya_entry_v1'
const STAGE_OPTIONS = ['小学', '初中', '高中', '大学'] as const
const DEFAULT_STAGE = STAGE_OPTIONS[2]

const STAGE_CLR: Record<string,string> = { '小学':'#fbbf24','初中':'#f97316','高中':'#ef4444','大学':'#a78bfa' }
const STAGE_BG:  Record<string,string> = { '小学':'rgba(251,191,36,0.12)','初中':'rgba(249,115,22,0.12)','高中':'rgba(239,68,68,0.12)','大学':'rgba(167,139,250,0.12)' }
const TICO: Record<string,string> = { document:'📄',image:'🖼',video:'🎬',audio:'🎧',multimedia:'🎭' }
const PERIOD_CLR: Record<string,string> = { '古代史':'#f59e0b','近代史':'#ef4444','现当代':'#22d3ee' }

const ALL_PROVINCES = ['北京市','天津市','河北省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','广西壮族自治区','海南省','重庆市','四川省','贵州省','云南省','西藏自治区','陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区','香港特别行政区','澳门特别行政区','台湾省']
const REGION_GROUPS: Record<string,string[]> = {
  '华北':['北京市','天津市','河北省','山西省','内蒙古自治区'],
  '东北':['辽宁省','吉林省','黑龙江省'],
  '华东':['上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省'],
  '华中':['河南省','湖北省','湖南省'],
  '华南':['广东省','广西壮族自治区','海南省'],
  '西南':['重庆市','四川省','贵州省','云南省','西藏自治区'],
  '西北':['陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区'],
  '港澳台':['香港特别行政区','澳门特别行政区','台湾省'],
}
const ALLIANCE_PROVINCE = '海南省'
const ALLIANCE_KWS = ['思政课一体化', '一体化建设', '区域联盟', '协同育人', '大中小学思政课']

interface Material {
  id: number; title: string; type: string; stage: string[]; tags: { topic: string[]; emotion: string[]; knowledge: string[] }; desc: string
  source: string; sourceName: string; date: string; views: number; annotation: string
  period?: string; province?: string; isFtz?: boolean
}
const DATA: Material[] = rawData as Material[]

interface TextbookItem { stage: string; book: string; lesson: string }
interface CoreLiteracyItem { name: string; desc: string }
interface AppFilterState { q: string; st: string; tp: string; pv: string; rg: string; ftzMode: boolean; allianceMode: boolean }
interface EntryState { stage: string; guestMode: boolean }
type DetailPopupState =
  | { kind: 'core'; item: CoreLiteracyItem }
  | { kind: 'textbook'; item: TextbookItem }
interface PopupAIDiscipline {
  icon: string
  name: string
  cue: string
  themeClass: string
}

const POPUP_AI_TEXTBOOK_MODES: PopupAIDiscipline[] = [
  { icon: '📘', name: '教材内容拆解', cue: '围绕课标与课目要点完成结构化内容解读', themeClass: 'is-humanities' },
  { icon: '🎯', name: '教学目标重构', cue: '将知识目标、能力目标、价值目标细化到可评估', themeClass: 'is-history' },
  { icon: '🧩', name: '活动任务设计', cue: '生成可落地的导入、探究、建构、迁移课堂任务链', themeClass: 'is-geography' },
  { icon: '📊', name: '评价量规生成', cue: '输出过程性与终结性评价指标及评分描述', themeClass: 'is-science' },
  { icon: '🛠️', name: '分层与改进策略', cue: '针对不同学情给出分层支持与二次优化建议', themeClass: 'is-tech' },
]

const POPUP_AI_LITERACY_MODES: PopupAIDiscipline[] = [
  { icon: '🇨🇳', name: '政治认同深化', cue: '强化国家认同、制度认同与历史使命感', themeClass: 'is-humanities' },
  { icon: '🧠', name: '理性精神深化', cue: '聚焦论证推理、证据意识与批判思维训练', themeClass: 'is-science' },
  { icon: '⚖️', name: '法治意识深化', cue: '将规则意识、权责边界与法治实践落地', themeClass: 'is-history' },
  { icon: '🤝', name: '公共参与深化', cue: '设计协作议题与真实情境行动任务', themeClass: 'is-geography' },
  { icon: '🗣️', name: '表达评价深化', cue: '提升观点表达、同伴互评与反思迁移质量', themeClass: 'is-tech' },
]

const POPUP_AI_GENERAL_DISCIPLINE: PopupAIDiscipline = {
  icon: '✨',
  name: '综合统筹',
  cue: '以当前弹窗焦点生成可直接落地的完整教学方案',
  themeClass: 'is-general',
}
interface PopupAIHistoryItem {
  id: number
  createdAt: string
  discipline: string
  focus: string
  prompt: string
}

const POPUP_AI_HISTORY_STORAGE_KEY = 'qiongya_popup_ai_history_v1'
const POPUP_AI_HISTORY_LIMIT = 12

function parsePopupAIHistory(raw: string | null): PopupAIHistoryItem[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is PopupAIHistoryItem =>
        isRecord(item) &&
        typeof item.id === 'number' &&
        typeof item.createdAt === 'string' &&
        typeof item.discipline === 'string' &&
        typeof item.focus === 'string' &&
        typeof item.prompt === 'string',
    )
  } catch {
    return []
  }
}

function getPopupFocusLabel(popup: DetailPopupState): string {
  if (popup.kind === 'core') return `核心素养：${popup.item.name}`
  return `教材：${popup.item.stage}《${popup.item.book}》·${popup.item.lesson}`
}

function buildPopupAIPrompt(
  material: Material,
  popup: DetailPopupState,
  discipline: PopupAIDiscipline,
  currentPlan: string,
): string {
  const stageText = (material.stage || []).join('、') || '全学段'
  const knowledgeText = (material.tags?.knowledge || []).slice(0, 3).join('、') || '价值判断、公共参与、责任担当'
  const popupFocus = popup.kind === 'core'
    ? `核心素养聚焦：${popup.item.name}（${popup.item.desc}）`
    : `教材聚焦：${popup.item.stage}《${popup.item.book}》 - ${popup.item.lesson}`
  const seedPlan = currentPlan || material.annotation || '暂无预存方案，请基于素材重新生成。'
  const systemFrame = popup.kind === 'core' ? '深化素养AI辅助系统' : '教材内容详情与AI辅助教学模式'
  const assistAxis = popup.kind === 'core' ? '素养深化方向' : '教学模式方向'
  const taskChainLabel = popup.kind === 'core' ? '素养深化任务链' : '教材教学任务链'
  const focusRequirement = popup.kind === 'core'
    ? '请突出政治学科核心素养的递进式培养与可观察表现。'
    : '请紧扣该教材课目内容细节，并给出可直接实施的AI辅助教学模式。'

  return `请你扮演资深思政教研专家，参考“${systemFrame}”思路，为当前弹窗焦点生成高质量教学方案。

【资源标题】${material.title}
【资源简介】${material.desc}
【学段】${stageText}
【关键知识点】${knowledgeText}
【弹窗焦点】${popupFocus}
【${assistAxis}】${discipline.name}
【方向提示】${discipline.cue}
【现有方案底稿】${seedPlan}

请输出一份“可直接上课”的创新方案，结构如下：
1. 课程定位与核心目标（含学科核心素养映射）
2. ${taskChainLabel}（导入-探究-建构-迁移，给出活动步骤和产出物）
3. 分层问题设计（基础/进阶/挑战）
4. 课堂评价证据（过程性+终结性，含可观察指标）
5. 作业与延展（至少2个创新实践任务）
6. 教师反思与优化建议（至少3条）

要求：
- 语言专业但可执行，避免空泛表述
- 结合思政课价值引领和学生真实生活情境
- ${focusRequirement}
- 输出分点清晰，便于教师直接复制使用`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getTextbookMappings(material: Material): TextbookItem[] {
  const values = Object.values(material as unknown as Record<string, unknown>)
  for (const value of values) {
    if (!Array.isArray(value) || value.length === 0) continue
    const mapped = value.filter(
      (item): item is TextbookItem =>
        isRecord(item) &&
        typeof item.stage === 'string' &&
        typeof item.book === 'string' &&
        typeof item.lesson === 'string',
    )
    if (mapped.length === value.length && mapped.length > 0) return mapped
  }
  return []
}

function getCoreLiteracy(material: Material): CoreLiteracyItem[] {
  const values = Object.values(material as unknown as Record<string, unknown>)
  for (const value of values) {
    if (!Array.isArray(value) || value.length === 0) continue
    const mapped = value.filter(
      (item): item is CoreLiteracyItem =>
        isRecord(item) &&
        typeof item.name === 'string' &&
        typeof item.desc === 'string',
    )
    if (mapped.length === value.length && mapped.length > 0) return mapped
  }
  return []
}

function getContentDetail(material: Material): string | null {
  const detail = (material as unknown as Record<string, unknown>).contentDetail
  if (typeof detail !== 'string') return null
  const trimmed = detail.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isAllianceMaterial(material: Material): boolean {
  if ((material.province || '') === ALLIANCE_PROVINCE) return true
  const text = [
    material.title,
    material.desc || '',
    ...(material.tags?.topic || []),
    ...(material.tags?.knowledge || []),
  ].join(' ')
  return ALLIANCE_KWS.some(keyword => text.includes(keyword))
}

function loadFilterState(): Partial<AppFilterState> {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return isRecord(parsed) ? parsed as Partial<AppFilterState> : {}
  } catch {
    return {}
  }
}

function loadEntryState(): Partial<EntryState> {
  try {
    const raw = localStorage.getItem(ENTRY_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return isRecord(parsed) ? parsed as Partial<EntryState> : {}
  } catch {
    return {}
  }
}

function normalizeStage(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_STAGE
  return STAGE_OPTIONS.includes(value as (typeof STAGE_OPTIONS)[number]) ? value : DEFAULT_STAGE
}


// ── 教师经验分享墙 ──────────────────────────────────────────────
interface SharePost { id:number; author:string; school:string; content:string; stage:string; likes:number; time:string }
function ShareBoardModal({ onClose }: { onClose: () => void }) {
  const [posts, setPosts] = useState<SharePost[]>(() => {
    try { return JSON.parse(localStorage.getItem('share_posts')||'[]') } catch { return [] }
  })
  const [author, setAuthor] = useState('')
  const [school, setSchool] = useState('')
  const [stage, setStage] = useState('高中')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const STAGES = ['小学','初中','高中','大学','通用']

  const handlePost = () => {
    if(!author.trim()||!content.trim()) { alert('请填写姓名和分享内容'); return }
    setSubmitting(true)
    const newPost: SharePost = {
      id: Date.now(), author: author.trim(), school: school.trim() || '匿名教师',
      content: content.trim(), stage,
      likes: 0, time: new Date().toLocaleDateString('zh-CN')
    }
    const updated = [newPost, ...posts]
    setPosts(updated)
    localStorage.setItem('share_posts', JSON.stringify(updated))
    setAuthor(''); setContent(''); setSchool('')
    setSubmitting(false)
  }

  const handleLike = (id: number) => {
    const updated = posts.map(p => p.id===id ? {...p, likes: p.likes+1} : p)
    setPosts(updated)
    localStorage.setItem('share_posts', JSON.stringify(updated))
  }

  const SAMPLE_POSTS: SharePost[] = [
    { id:-1, author:'王建国', school:'海口市第一中学', content:'在讲授"琼崖革命23年红旗不倒"时，我组织学生到母瑞山革命根据地实地参观，配合VR情景剧，让学生身临其境感受革命先辈的艰辛。学生反馈说"比看书印象深刻一百倍"，这种沉浸式教学值得推广！', stage:'高中', likes:128, time:'2026-03-28' },
    { id:-2, author:'李红梅', school:'三亚市第九小学', content:'小学道德与法治课堂，我会用"红色故事绘本"代替传统说教。一年级孩子最爱听《小英雄王二小》，讲到动情处全班眼泪汪汪的，这才是真情的教育。', stage:'小学', likes:96, time:'2026-03-27' },
    { id:-3, author:'陈志强', school:'海南师范大学附属中学', content:'大学思政课不能只讲理论。我带学生去红色娘子军纪念馆做志愿讲解，既服务社会又深化了对革命精神的理解，一举两得。学生说这比考试有意思多了！', stage:'大学', likes:84, time:'2026-03-26' },
    { id:-4, author:'张丽华', school:'儋州市第二中学', content:'初三道德与法治"改革开放"单元，我联系了当地一位创业成功的校友来课堂分享。从小镇青年到企业家，学生们听得津津有味，梦想的种子就这样悄悄种下。', stage:'初中', likes:72, time:'2026-03-25' },
  ]

  const allPosts = posts.length > 0 ? posts : SAMPLE_POSTS
  const avgLikes = allPosts.length > 0 ? Math.round(allPosts.reduce((s,p)=>s+p.likes,0)/allPosts.length) : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box share-modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="share-header">
          <h2 className="modal-title" style={{ marginBottom: '4px' }}>💬 教室经验分享墙</h2>
          <p className="share-sub">一线思政教师的教学心得与经验交流平台</p>
          <div className="share-stats-row">
            <span className="share-stat-pill">👨‍🏫 {allPosts.length} 条经验</span>
            <span className="share-stat-pill">❤️ 平均 {avgLikes} 赞</span>
            <span className="share-stat-pill">🏫 覆盖全学段</span>
          </div>
        </div>

        {/* 发布区 */}
        <div className="share-form">
          <div className="sf-row">
            <input className="uf-input" style={{ flex: 1 }} placeholder="您的姓名" value={author} onChange={e=>setAuthor(e.target.value)} />
            <input className="uf-input" style={{ flex: 1 }} placeholder="学校/单位（选填）" value={school} onChange={e=>setSchool(e.target.value)} />
          </div>
          <div className="sf-row">
            <div className="uf-radio-row" style={{ flex: 1 }}>
              {STAGES.map(s=>(
                <label key={s} className={`uf-radio${stage===s?' active':''}`}
                  onClick={()=>setStage(s)}
                  style={stage===s?{borderColor:STAGE_CLR[s]||'#dc2626',color:STAGE_CLR[s]||'#dc2626',background:`${STAGE_CLR[s]||'#dc2626'}18`}:{}}>{s}</label>
              ))}
            </div>
          </div>
          <textarea className="uf-textarea" style={{ width: '100%' }} placeholder="分享您的教学经验、心得或案例...（输入内容即表示同意公开显示）" value={content} onChange={e=>setContent(e.target.value)} rows={3} />
          <button className="regen-btn deepseek-btn" style={{ width: '100%', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', padding: '11px 20px', fontSize: '14px', borderRadius: '12px' }} onClick={handlePost} disabled={submitting}>
            {submitting?'发布中...':'🚀 发表经验分享'}
          </button>
        </div>

        {/* 分割线 */}
        <div style={{ borderTop: '1px dashed #e5e7eb', margin: '12px 0' }} />

        {/* 经验列表 */}
        <div className="share-list">
          {allPosts.map(p=>(
            <div key={p.id} className="share-card">
              <div className="share-card-top">
                <div className="share-author-info">
                  <div className="share-avatar">{p.author[0]}</div>
                  <div>
                    <div className="share-author">{p.author} <span className="share-stage" style={{ color: STAGE_CLR[p.stage] || '#dc2626' }}>{p.stage}</span></div>
                    <div className="share-school">{p.school} · {p.time}</div>
                  </div>
                </div>
                <button className="share-like-btn" onClick={()=>handleLike(p.id)}>
                  <span style={{ color: '#dc2626' }}>❤</span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{p.likes}</span>
                </button>
              </div>
              <p className="share-content">{p.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


// ── Splash ──────────────────────────────────────────────
function StageGate({
  selectedStage,
  onSelectStage,
  onContinue,
  onGuest,
}: {
  selectedStage: string
  onSelectStage: (stage: string) => void
  onContinue: () => void
  onGuest: () => void
}) {
  const stageCounts = STAGE_OPTIONS.map((stage) => ({
    stage,
    count: DATA.filter((m) => (m.stage || []).includes(stage)).length,
  }))

  return (
    <div className="stage-gate">
      <div className="stage-gate-card">
        <div className="stage-gate-eyebrow">海南思政智慧资源库</div>
        <h1 className="stage-gate-title">先选择学段，再进入欢迎页</h1>
        <p className="stage-gate-sub">系统将按你选择的学段优先筛选资源，也可使用游客模式浏览全学段内容。</p>
        <div className="stage-gate-grid">
          {stageCounts.map(({ stage, count }) => (
            <button
              key={stage}
              className={`stage-gate-item ${selectedStage === stage ? 'active' : ''}`}
              onClick={() => onSelectStage(stage)}
            >
              <span className="stage-gate-name">{stage}</span>
              <span className="stage-gate-count">{count} 条</span>
            </button>
          ))}
        </div>
        <div className="stage-gate-actions">
          <button className="stage-gate-primary" onClick={onContinue}>
            进入欢迎页（{selectedStage}）
          </button>
          <button className="stage-gate-guest" onClick={onGuest}>
            游客模式（浏览全部学段）
          </button>
        </div>
      </div>
    </div>
  )
}

function Splash({
  onEnter,
  onEnterFtz,
  onEnterAlliance,
  onBackToStage,
  guestMode,
  selectedStage,
}: {
  onEnter: () => void
  onEnterFtz: () => void
  onEnterAlliance: () => void
  onBackToStage: () => void
  guestMode: boolean
  selectedStage: string
}) {
  const ftzCount = DATA.filter(m => m.isFtz).length
  const allianceCount = DATA.filter(isAllianceMaterial).length
  return (
    <div className="splash">
      <div className="splash-corner-brand">
        <img
          className="splash-corner-logo"
          src={hainnuEduBadge}
          alt="海南师范大学教育学院院徽"
        />
        <div className="splash-corner-text">海南师范大学教育学院</div>
      </div>
      <div className="splash-inner">
        <div className="splash-top-line" />
        <div className="splash-eyebrow">🏝️ 海南自由贸易港 · 思政教育数字化平台</div>
        <h1 className="splash-title">AI赋能<br/><span className="splash-title-accent">创新思政</span></h1>
        <p className="splash-sub">智慧资源 · 因材施教 · 全学段覆盖</p>
        <div className="splash-mode-chip">{guestMode ? '当前模式：游客模式（全学段）' : `当前学段：${selectedStage}`}</div>
        <div className="splash-stats">
          <div className="splash-stat"><div className="ss-num">{DATA.length}</div><div className="ss-label">思政素材</div></div>
          <div className="splash-divider" />
          <div className="splash-stat"><div className="ss-num">{new Set(DATA.map(m => m.province)).size}</div><div className="ss-label">省份覆盖</div></div>
          <div className="splash-divider" />
          <div className="splash-stat"><div className="ss-num">{ftzCount}</div><div className="ss-label">自贸港专题</div></div>
          <div className="splash-divider" />
          <div className="splash-stat"><div className="ss-num">4</div><div className="ss-label">学段衔接</div></div>
        </div>
        <div className="splash-features">
          <div className="sf-item"><span className="sf-icon">🧠</span><span>AI实时生成教学方案</span></div>
          <div className="sf-item"><span className="sf-icon">🌐</span><span>全网资源一键拓展</span></div>
          <div className="sf-item"><span className="sf-icon">📖</span><span>核心素养精准对接</span></div>
          <div className="sf-item"><span className="sf-icon">⚡</span><span>点击即用高效备课</span></div>
        </div>
        <div className="splash-btns">
          <button className="splash-enter-btn" onClick={onEnter}>进入海南特色大中小学思政课智慧资源库 →</button>
          <button className="splash-ftz-btn" onClick={onEnterFtz}>🏝️ 海南自由贸易港大思政专题单元（{ftzCount}条）→</button>
          <button className="splash-alliance-btn" onClick={onEnterAlliance}>🤝 海南省大中小学思政课一体化建设区域联盟专题（{allianceCount}条）→</button>
          <button className="splash-stage-switch" onClick={onBackToStage}>切换学段/游客模式</button>
        </div>
        <div className="splash-bottom-line" />
      </div>
    </div>
  )
}


// ── 上传素材 Modal ──────────────────────────────────────────────
function UploadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: Material) => void }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('document')
  const [period, setPeriod] = useState('现当代')
  const [province, setProvince] = useState('海南省')
  const [stage, setStage] = useState<string[]>(['高中'])
  const [topicStr, setTopicStr] = useState('')
  const [emotionStr, setEmotionStr] = useState('')
  const [knowledgeStr, setKnowledgeStr] = useState('')
  const [desc, setDesc] = useState('')
  const [contentDetail, setContentDetail] = useState('')
  const [source, setSource] = useState('')
  const [annotation, setAnnotation] = useState('')
  const [saved, setSaved] = useState(false)

  const toggleStage = (s: string) => setStage(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s])

  const handleSubmit = () => {
    if(!title.trim()) { alert('请填写标题'); return }
    const newMat: Material = {
      id: Date.now(),
      title: title.trim(),
      type,
      stage: stage.length ? stage : ['高中'],
      tags: {
        topic: topicStr.split(/[，,\s]+/).filter(Boolean),
        emotion: emotionStr.split(/[，,\s]+/).filter(Boolean),
        knowledge: knowledgeStr.split(/[，,\s]+/).filter(Boolean),
      },
      desc: desc.trim() || title.trim(),
      source: source.trim() || '自主上传',
      sourceName: source.trim() || '用户上传',
      date: new Date().toISOString().slice(0,10),
      views: 0,
      annotation: annotation.trim() || '暂无教学建议，请点击上方「重新生成」获取AI辅助教学方案',
      period,
      province,
      isFtz: province === '海南省' && (title.includes('自贸港') || title.includes('海南') || title.includes('开放')),
      ...(contentDetail.trim() ? { contentDetail: contentDetail.trim() } : {}),
    }
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('uploaded_materials') || '[]')
    existing.push(newMat)
    localStorage.setItem('uploaded_materials', JSON.stringify(existing))
    onAdd(newMat)
    setSaved(true)
  }

  if(saved) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box upload-modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div style={{textAlign:'center',padding:'32px 0'}}>
          <div style={{fontSize:'56px',marginBottom:'16px'}}>✅</div>
          <h2 style={{color:'#dc2626',marginBottom:'12px'}}>上传成功！</h2>
          <p style={{color:'#666',marginBottom:'8px'}}>素材「{title}」已成功添加到资源库</p>
          <p style={{color:'#999',fontSize:'13px'}}>可在列表顶部或通过搜索找到这条素材</p>
          <button className="regen-btn" style={{marginTop:'20px',background:'var(--red)',color:'#fff',borderColor:'var(--red)'}} onClick={onClose}>好的，返回资源库</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box upload-modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title" style={{fontSize:'18px'}}>📤 上传新素材</h2>
        <div className="upload-form">
          <div className="uf-row">
            <label className="uf-label">素材标题 <span style={{color:'#dc2626'}}>*</span></label>
            <input className="uf-input" placeholder="如：琼崖革命精神与海南经济社会发展" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div className="uf-row">
            <label className="uf-label">素材类型</label>
            <div className="uf-radio-row">
              {['document','video','image','audio','multimedia'].map(t=>(
                <label key={t} className={`uf-radio${type===t?' active':''}`} onClick={()=>setType(t)}>{TICO[t]||'📄'} {t}</label>
              ))}
            </div>
          </div>
          <div className="uf-row">
            <label className="uf-label">所属时期</label>
            <div className="uf-radio-row">
              {['古代史','近代史','现当代'].map(p=>(
                <label key={p} className={`uf-radio${period===p?' active':''}`} onClick={()=>setPeriod(p)} style={period===p?{borderColor:PERIOD_CLR[p],color:PERIOD_CLR[p],background:`${PERIOD_CLR[p]}18`}:{}}>{p}</label>
              ))}
            </div>
          </div>
          <div className="uf-row">
            <label className="uf-label">所属省份</label>
            <select className="uf-input" value={province} onChange={e=>setProvince(e.target.value)}>
              {ALL_PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="uf-row">
            <label className="uf-label">适用学段</label>
            <div className="uf-radio-row">
              {['小学','初中','高中','大学'].map(s=>(
                <label key={s} className={`uf-radio${stage.includes(s)?' active':''}`} onClick={()=>toggleStage(s)} style={stage.includes(s)?{borderColor:STAGE_CLR[s],color:STAGE_CLR[s],background:`${STAGE_CLR[s]}18`}:{}}>{s}</label>
              ))}
            </div>
          </div>
          <div className="uf-row">
            <label className="uf-label">主题标签</label>
            <input className="uf-input" placeholder="多个标签用逗号或空格分隔，如：红色文化 革命精神 海南" value={topicStr} onChange={e=>setTopicStr(e.target.value)} />
          </div>
          <div className="uf-row">
            <label className="uf-label">情感标签</label>
            <input className="uf-input" placeholder="多个标签用逗号或空格分隔，如：爱国 敬业 诚信" value={emotionStr} onChange={e=>setEmotionStr(e.target.value)} />
          </div>
          <div className="uf-row">
            <label className="uf-label">知识点</label>
            <input className="uf-input" placeholder="多个知识点用逗号或空格分隔，如：琼崖革命 23年红旗不倒" value={knowledgeStr} onChange={e=>setKnowledgeStr(e.target.value)} />
          </div>
          <div className="uf-row">
            <label className="uf-label">内容简介</label>
            <textarea className="uf-textarea" placeholder="请输入素材的内容简介..." value={desc} onChange={e=>setDesc(e.target.value)} rows={3} />
          </div>
          <div className="uf-row">
            <label className="uf-label">内容详情（可选）</label>
            <textarea className="uf-textarea" placeholder="更详细的内容说明，如历史背景、教材对应章节等..." value={contentDetail} onChange={e=>setContentDetail(e.target.value)} rows={2} />
          </div>
          <div className="uf-row">
            <label className="uf-label">来源（可选）</label>
            <input className="uf-input" placeholder="如：海南省教育厅、人民日报等" value={source} onChange={e=>setSource(e.target.value)} />
          </div>
          <div className="uf-row">
            <label className="uf-label">AI教学建议（可选）</label>
            <textarea className="uf-textarea" placeholder="可先填写教学建议，或上传后由系统AI生成..." value={annotation} onChange={e=>setAnnotation(e.target.value)} rows={2} />
          </div>
          <div className="uf-actions">
            <button className="regen-btn" style={{flex:1}} onClick={onClose}>取消</button>
            <button className="regen-btn deepseek-btn" style={{flex:2}} onClick={handleSubmit}>✅ 确认上传</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 工具 ──────────────────────────────────────────────
function searchUrl(title: string, type: 'wiki'|'video'|'paper'|'news') {
  const q = encodeURIComponent(title)
  if (type === 'wiki')  return `https://zh.wikipedia.org/w/index.php?search=${q}&title=Special:Search&go=Go`
  if (type === 'video') return `https://search.bilibili.com/all?keyword=${q}&order=totalrank`
  if (type === 'paper') return `https://kns.cnki.net/kns8s/defaultresult?classid=WKDKHT&kw=${q}`
  if (type === 'news')  return `https://www.baidu.com/s?wd=${q}&tn=news`
  return '#'
}

async function callGenerateAPI(m: Material): Promise<string> {
  const endpoint = API_BASE ? `${API_BASE}/api/generate` : '/api/generate'
  const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: m.title, desc: m.desc, topics: m.tags?.topic||[], knowledge: m.tags?.knowledge||[], stage: m.stage||[] }) })
  const data = await r.json()
  return data.annotation || ''
}

function ResourcePanel({ m }: { m: Material }) {
  return (
    <div className="resource-panel">
      <div className="res-title">🌐 全网拓展资源</div>
      <div className="res-sub">点击直达各大平台</div>
      <div className="res-cards">
        <a href={searchUrl(m.title,'wiki')} target="_blank" rel="noopener noreferrer" className="res-card res-wiki"><div className="rc-icon">📖</div><div className="rc-info"><div className="rc-name">百度百科</div><div className="rc-desc">权威词条</div></div></a>
        <a href={searchUrl(m.title,'video')} target="_blank" rel="noopener noreferrer" className="res-card res-video"><div className="rc-icon">🎬</div><div className="rc-info"><div className="rc-name">B站视频</div><div className="rc-desc">纪录片/讲解</div></div></a>
        <a href={searchUrl(m.title,'paper')} target="_blank" rel="noopener noreferrer" className="res-card res-paper"><div className="rc-icon">📚</div><div className="rc-info"><div className="rc-name">学术论文</div><div className="rc-desc">知网搜索</div></div></a>
        <a href={searchUrl(m.title,'news')} target="_blank" rel="noopener noreferrer" className="res-card res-news"><div className="rc-icon">📰</div><div className="rc-info"><div className="rc-name">新闻媒体</div><div className="rc-desc">百度新闻</div></div></a>
      </div>
    </div>
  )
}

function DetailModal({ m, onClose }: { m: Material; onClose: () => void }) {
  const [aiText, setAiText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [regenKey, setRegenKey] = useState(0)
  const [detailPopup, setDetailPopup] = useState<DetailPopupState | null>(null)
  const textbookMappings = useMemo(() => getTextbookMappings(m), [m])
  const coreLiteracy = useMemo(() => getCoreLiteracy(m), [m])
  const contentDetail = useMemo(() => getContentDetail(m), [m])
  const [popupHistory, setPopupHistory] = useState<PopupAIHistoryItem[]>(() =>
    parsePopupAIHistory(localStorage.getItem(POPUP_AI_HISTORY_STORAGE_KEY)),
  )
  const [lastPopupPrompt, setLastPopupPrompt] = useState('')
  const [lastPopupDiscipline, setLastPopupDiscipline] = useState('')

  const loadAI = useCallback(async () => {
    setGenerating(true); setAiText('')
    try { const text = await callGenerateAPI(m); setAiText(text || m.annotation || '暂无标注') }
    catch { setAiText(m.annotation || '暂无标注') }
    finally { setGenerating(false) }
  }, [m])

  useEffect(() => { loadAI() }, [loadAI, regenKey])
  useEffect(() => { setDetailPopup(null) }, [m])
  useEffect(() => {
    localStorage.setItem(
      POPUP_AI_HISTORY_STORAGE_KEY,
      JSON.stringify(popupHistory.slice(0, POPUP_AI_HISTORY_LIMIT)),
    )
  }, [popupHistory])

  const pct = PERIOD_CLR[m.period||'现当代']||'#22d3ee'
  const isLive = !!aiText && aiText !== m.annotation
  const openDeepSeekWithHistory = useCallback((prompt: string, disciplineLabel: string, focusLabel: string) => {
    const popupKnowledge = (m.tags?.knowledge || []).slice(0, 2).join('、') || '课程核心任务'
    const popupDiscipline = `弹窗AI辅助 · ${disciplineLabel}`
    const url = `/deepseek.html?title=${encodeURIComponent(m.title)}&desc=${encodeURIComponent(m.desc)}&knowledge=${encodeURIComponent(popupKnowledge)}&discipline=${encodeURIComponent(popupDiscipline)}&prompt=${encodeURIComponent(prompt)}`
    window.open(url, '_blank')
    const historyItem: PopupAIHistoryItem = {
      id: Date.now(),
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      discipline: disciplineLabel,
      focus: focusLabel,
      prompt,
    }
    setPopupHistory((prev) => [historyItem, ...prev].slice(0, POPUP_AI_HISTORY_LIMIT))
    setLastPopupPrompt(prompt)
    setLastPopupDiscipline(disciplineLabel)
  }, [m])

  const openPopupAIAssistant = useCallback((discipline: PopupAIDiscipline) => {
    if (!detailPopup) return
    const prompt = buildPopupAIPrompt(m, detailPopup, discipline, aiText)
    openDeepSeekWithHistory(prompt, discipline.name, getPopupFocusLabel(detailPopup))
  }, [detailPopup, m, aiText, openDeepSeekWithHistory])

  const openPopupAIRefine = useCallback(() => {
    if (!detailPopup) return
    const basePrompt = lastPopupPrompt || buildPopupAIPrompt(m, detailPopup, POPUP_AI_GENERAL_DISCIPLINE, aiText)
    const refinePrompt = `${basePrompt}

现在请在“上一版方案”基础上进行二次润色（追问）：
1. 输出“修订说明”（至少4条，说明你提升了什么）
2. 补充一段10分钟可执行的课堂高光环节（含师生对话示例）
3. 提供一份可直接评分的简版评价量规（3个维度，每维度3级描述）
4. 给出一套“低门槛替代方案”，用于设备不足或时间压缩场景

请保留结构清晰、可复制到教案中直接使用。`
    const source = lastPopupDiscipline ? `${lastPopupDiscipline} · 二次润色` : '综合统筹 · 二次润色'
    openDeepSeekWithHistory(refinePrompt, source, getPopupFocusLabel(detailPopup))
  }, [detailPopup, m, aiText, lastPopupPrompt, lastPopupDiscipline, openDeepSeekWithHistory])
  const isCorePopup = detailPopup?.kind === 'core'
  const isTextbookPopup = detailPopup?.kind === 'textbook'
  const popupAIModes = isCorePopup ? POPUP_AI_LITERACY_MODES : POPUP_AI_TEXTBOOK_MODES
  const popupAISubtitle = isCorePopup ? '聚焦政治学科核心素养深化' : '聚焦该教材内容详情与AI辅助教学模式'
  const popupAINotice = isCorePopup
    ? '已将核心素养焦点自动注入提示词，点击任一方向即可生成“深化素养AI辅助”方案。'
    : '已将教材课目焦点自动注入提示词，点击任一模式即可生成对应教学方案。'
  const popupPrimaryActionText = isCorePopup ? '一键生成深化素养方案' : '一键生成教材AI教学模式'
  const popupSecondaryActionText = isCorePopup ? '二次润色（深化追问）' : '二次润色（教学模式追问）'
  const popupHelperNote = isCorePopup
    ? '提示词将自动复制到剪贴板，打开页面后可直接发送并继续做素养深化。'
    : '提示词将自动复制到剪贴板，打开页面后可直接发送并继续细化教材教学模式。'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header">
          <span className="type-badge-lg" style={{background:`${pct}22`,color:pct}}>{TICO[m.type]||'📄'} {m.type}</span>
          <div className="modal-stage-row">{(m.stage||[]).map(s => <span key={s} className="stage-badge" style={{color:STAGE_CLR[s]||'#94a3b8',background:STAGE_BG[s]||'rgba(148,163,184,0.12)'}}>{s}</span>)}</div>
          {m.period && <span className="period-badge" style={{color:pct,background:`${pct}18`}}>{m.period}</span>}
        </div>
        <h2 className="modal-title">{m.title}</h2>
        <div className="modal-meta"><span>📍 {m.sourceName}</span></div>
        <div className="modal-tags">
          {(m.tags?.topic||[]).map(t => <span key={t} className="topic-tag">#{t}</span>)}
          {(m.tags?.emotion||[]).map(e => <span key={e} className="emotion-tag">💗 {e}</span>)}
        </div>
        {m.type === 'video' && (
          <div className="video-player-wrap">
            <div className="video-player-label">🎬 视频播放</div>
            <iframe src={`https://search.bilibili.com/all?keyword=${encodeURIComponent(m.title)}&order=totalrank`} className="video-iframe" title="视频" allowFullScreen loading="lazy" />
          </div>
        )}
        <div className="modal-section"><h3>📌 内容简介</h3><p>{m.desc}</p></div>
        <div className="modal-section"><h3>📖 内容详情</h3><p>{contentDetail || m.desc}</p></div>
        <ResourcePanel m={m} />
        <div className="modal-section ai-section">
          <div className="ai-section-header">
            <span>🧠 AI 辅助教学方案</span>
            {generating && <span className="ai-badge">生成中...</span>}
            {!generating && isLive && <span className="ai-badge live">✨ 实时生成</span>}
            {!generating && !isLive && aiText && <span className="ai-badge">📦 预存</span>}
          </div>
          {generating ? (
            <div className="ai-spinner"><svg viewBox="0 0 50 50" width="36" height="36"><circle cx="25" cy="25" r="20" fill="none" stroke="#b91c1c" strokeWidth="4" strokeDasharray="80 40" strokeLinecap="round"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg><span>🧠 AI 生成中...</span></div>
          ) : <div className="ai-plan" data-live={isLive}>{aiText || m.annotation}</div>}
          <div className="copy-hint">💡 提示：点击下方「→ DeepSeek 优化教学方案」按钮，跳转页面已自动复制提示词，打开 DeepSeek 对话框后直接粘贴发送即可获得完整教学方案</div>
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'10px'}}>
            <button className="regen-btn" onClick={e => { e.stopPropagation(); setRegenKey(k => k+1) }}>🔄 重新生成</button>
            <button className="regen-btn deepseek-btn" onClick={e => {
              e.stopPropagation()
              const prompt = `请你扮演一位资深思政教育专家。请为以下思政课素材优化或扩展一份更完整的AI辅助教学方案：\n\n【素材标题】${m.title}\n【内容简介】${m.desc}\n【知识点】${(m.tags?.knowledge||[]).join('、')}\n【现有教学建议】${aiText || m.annotation}\n\n请以此为基础，生成一份更详细、更专业的思政课AI辅助教学方案，包括：教学目标、教学重难点、教学过程设计（含导入、新授、巩固练习环节）、板书设计、作业布置、教学反思等完整环节。格式清晰，分模块详细阐述，适合中小学思政课教师直接使用。`
              const url = `/deepseek.html?title=${encodeURIComponent(m.title)}&desc=${encodeURIComponent(m.desc)}&knowledge=${encodeURIComponent((m.tags?.knowledge||[]).join('、'))}&discipline=${encodeURIComponent('AI教学方案优化')}&prompt=${encodeURIComponent(prompt)}`
              window.open(url, '_blank')
            }}>🔗 → DeepSeek 优化教学方案</button>
          </div>
        </div>
        {coreLiteracy.length > 0 && (
          <div className="modal-section"><h3>🎯 政治学科核心素养</h3>
            <div className="suyang-list">{coreLiteracy.map((s) => (
              <button
                type="button"
                key={s.name}
                className="detail-item-btn suyang-item"
                onClick={(event) => {
                  event.stopPropagation()
                  setDetailPopup({ kind: 'core', item: s })
                }}
              >
                <span className="suyang-name">{s.name}</span>
                <span className="suyang-desc">{s.desc}</span>
                <span className="detail-item-open">查看详情</span>
              </button>
            ))}</div>
          </div>
        )}
        {textbookMappings.length > 0 && (
          <div className="modal-section"><h3>📖 对应教材与课目</h3>
            <div className="jiaocai-list">{textbookMappings.map((j) => (
              <button
                type="button"
                key={`${j.stage}-${j.book}-${j.lesson}`}
                className="detail-item-btn jiaocai-item"
                onClick={(event) => {
                  event.stopPropagation()
                  setDetailPopup({ kind: 'textbook', item: j })
                }}
              >
                <span className="jiaocai-stage">{j.stage}</span>
                <div className="jiaocai-info">
                  <div className="jiaocai-book">📕 {j.book}</div>
                  <div className="jiaocai-lesson">📖 {j.lesson}</div>
                </div>
                <span className="detail-item-open">查看详情</span>
              </button>
            ))}</div>
          </div>
        )}
        {/* 跨学科主题标签 */}
        <div className="modal-section cross-section">
          <h3>🔗 跨学科融合方案 · 点击按钮跳转 DeepSeek 自动填入提示词</h3>
          <div className="cross-intro">👆 点击任意学科按钮 → 自动打开 DeepSeek 网页版 → 点击发送即可获得该知识点与对应学科的跨学科融合教学方案</div>
          <div className="cross-knowledge-list">
            {(m.tags?.knowledge||[]).map((k: string) => {
              const disciplines = [
                { icon: "🎯", name: "语文学科", prompt: `请你扮演一位资深思政教育专家。请为以下思政课素材设计一份与语文学科的跨学科融合教学方案：\n\n【思政素材】主题：${m.title}，简介：${m.desc}，知识点：${k}\n\n请从以下方面详细设计：\n1. 语文阅读文本推荐（革命故事、人物通讯、革命诗词等）\n2. 写作任务设计（主题征文、读后感等）\n3. 口语表达活动（演讲、辩论、故事分享）\n4. 教学课时安排与评价方式建议\n\n要求格式清晰、分模块详细阐述，适合中小学思政课教师直接使用。`, bg: "linear-gradient(135deg,#fff7ed,#ffedd5)", border: "#fb923c", color: "#9a3412" },
                { icon: "📜", name: "历史学科", prompt: `请你扮演一位资深思政教育专家。请为以下思政课素材设计一份与历史学科的跨学科融合教学方案：\n\n【思政素材】主题：${m.title}，简介：${m.desc}，知识点：${k}\n\n请从以下方面详细设计：\n1. 历史背景梳理（时间、人物、事件）\n2. 历史人物分析（思想与行动）\n3. 史料研读与讨论问题设计\n4. 教学课时安排与评价方式建议\n\n要求格式清晰、分模块详细阐述，适合中小学思政课教师直接使用。`, bg: "linear-gradient(135deg,#fef9c3,#fef08a)", border: "#facc15", color: "#713f12" },
                { icon: "🌍", name: "地理学科", prompt: `请你扮演一位资深思政教育专家。请为以下思政课素材设计一份与地理学科的跨学科融合教学方案：\n\n【思政素材】主题：${m.title}，简介：${m.desc}，知识点：${k}\n\n请从以下方面详细设计：\n1. 地理位置与环境因素分析\n2. 区域经济发展对比\n3. 人地关系与可持续发展探讨\n4. 教学课时安排与评价方式建议\n\n要求格式清晰、分模块详细阐述，适合中小学思政课教师直接使用。`, bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", border: "#4ade80", color: "#14532d" },
                { icon: "🎵", name: "艺术学科", prompt: `请你扮演一位资深思政教育专家。请为以下思政课素材设计一份与艺术学科（音乐/美术）的跨学科融合教学方案：\n\n【思政素材】主题：${m.title}，简介：${m.desc}，知识点：${k}\n\n请从以下方面详细设计：\n1. 相关革命歌曲推荐与赏析\n2. 美术作品欣赏与创作活动\n3. 表演类活动设计（朗诵、戏剧等）\n4. 教学课时安排与评价方式建议\n\n要求格式清晰、分模块详细阐述，适合中小学思政课教师直接使用。`, bg: "linear-gradient(135deg,#fce7f3,#fbcfe8)", border: "#f472b6", color: "#831843" },
                { icon: "⚗️", name: "自然科学", prompt: `请你扮演一位资深思政教育专家。请为以下思政课素材设计一份与自然科学的跨学科融合教学方案：\n\n【思政素材】主题：${m.title}，简介：${m.desc}，知识点：${k}\n\n请从以下方面详细设计：\n1. 相关科学原理与技术应用讲解\n2. 科技发展与社会进步的关系分析\n3. 实验或探究活动设计\n4. 教学课时安排与评价方式建议\n\n要求格式清晰、分模块详细阐述，适合中小学思政课教师直接使用。`, bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", border: "#a78bfa", color: "#4c1d95" },
                { icon: "💻", name: "信息技术", prompt: `请你扮演一位资深思政教育专家。请为以下思政课素材设计一份与信息技术的跨学科融合教学方案：\n\n【思政素材】主题：${m.title}，简介：${m.desc}，知识点：${k}\n\n请从以下方面详细设计：\n1. 数字资源搜集与整理活动\n2. 多媒体汇报或微课视频制作\n3. 在线协作学习活动设计\n4. 教学课时安排与评价方式建议\n\n要求格式清晰、分模块详细阐述，适合中小学思政课教师直接使用。`, bg: "linear-gradient(135deg,#e0f2fe,#bae6fd)", border: "#38bdf8", color: "#0c4a6e" },
              ]
              return (
                <div key={k} className="cross-k-row">
                  <div className="cross-k-label">📌 {k}</div>
                  <div className="cross-k-tags">
                    {disciplines.map(d => (
                      <button key={d.name}
                        className="cross-tag-btn"
                        style={{ background: d.bg, borderColor: d.border, color: d.color }}
                        onClick={() => {
                          const url = `/deepseek.html?title=${encodeURIComponent(m.title)}&desc=${encodeURIComponent(m.desc)}&knowledge=${encodeURIComponent(k)}&discipline=${encodeURIComponent(d.name)}&prompt=${encodeURIComponent(d.prompt)}`
                          window.open(url, '_blank')
                        }}>
                        <span>{d.icon}</span>
                        <span>{d.name}</span>
                        <span className="cross-plus">→ DeepSeek</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="modal-section"><h3>📚 知识点</h3>
          <div className="know-list">{(m.tags?.knowledge||[]).map((k: string) => <a key={k} href={`https://www.baidu.com/s?wd=${encodeURIComponent(k)}`} target="_blank" rel="noopener noreferrer" className="know-tag">{k}</a>)}</div>
        </div>
        <div className="modal-footer"><span className="src-badge">📍 来源：{m.sourceName}</span></div>
      </div>
      {detailPopup && (
        <div
          className="detail-popup-overlay"
          onClick={(event) => {
            event.stopPropagation()
            setDetailPopup(null)
          }}
        >
          <div
            className={`detail-popup-box detail-popup-${detailPopup.kind}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="detail-popup-close"
              onClick={(event) => {
                event.stopPropagation()
                setDetailPopup(null)
              }}
            >
              ✕
            </button>
            <div className="detail-popup-topbar">
              <span className="detail-popup-topbar-chip">
                {detailPopup.kind === 'core' ? '核心素养视图' : '教材教研视图'}
              </span>
              <span className="detail-popup-topbar-tip">创新 · 深度 · 可落地</span>
            </div>
            {detailPopup.kind === 'core' ? (
              <>
                <div className="detail-popup-head">
                  <div className="detail-popup-eyebrow">政治学科核心素养</div>
                  <h4>{detailPopup.item.name}</h4>
                  <p>{detailPopup.item.desc}</p>
                </div>
                <div className="detail-popup-meta">
                  <span className="detail-popup-meta-item">关联资源：{m.title}</span>
                  <span className="detail-popup-meta-item">来源：{m.sourceName}</span>
                  <span className="detail-popup-meta-item">学段：{(m.stage || []).join(' / ') || '全学段'}</span>
                </div>
                <div className="detail-popup-grid">
                  <section className="detail-popup-card">
                    <h5>课堂转化建议</h5>
                    <ul>
                      <li>以“{m.title}”为情境，组织价值判断与观点表达任务。</li>
                      <li>围绕 {(m.tags?.knowledge || []).slice(0, 2).join('、') || '核心知识'} 设计问题链，提升思辨深度。</li>
                      <li>采用“小组讨论 + 展示互评”结构，形成可评价学习证据。</li>
                    </ul>
                  </section>
                  <section className="detail-popup-card">
                    <h5>教材协同建议</h5>
                    <ul>
                      {textbookMappings.length > 0 ? textbookMappings.map((book) => (
                        <li key={`${book.stage}-${book.book}-${book.lesson}`}>{book.stage} · 《{book.book}》{book.lesson}</li>
                      )) : <li>暂无教材映射，建议补充校本案例包。</li>}
                    </ul>
                  </section>
                </div>
              </>
            ) : (
              <>
                <div className="detail-popup-head">
                  <div className="detail-popup-eyebrow">教材深度详情</div>
                  <h4>{detailPopup.item.stage} · 《{detailPopup.item.book}》</h4>
                  <p>对应课目：{detailPopup.item.lesson}</p>
                </div>
                <div className="detail-popup-meta">
                  <span className="detail-popup-meta-item">主题资源：{m.title}</span>
                  <span className="detail-popup-meta-item">知识点：{(m.tags?.knowledge || []).slice(0, 2).join('、') || '待补充'}</span>
                  <span className="detail-popup-meta-item">来源：{m.sourceName}</span>
                </div>
                <div className="detail-popup-grid">
                  <section className="detail-popup-card">
                    <h5>教学设计重点</h5>
                    <ul>
                      <li>从教材核心概念切入，连接“{m.title}”真实议题。</li>
                      <li>采用“概念—案例—价值”三段式教学路径。</li>
                      <li>布置课堂即时反馈任务，确保理解与迁移并行。</li>
                    </ul>
                  </section>
                  <section className="detail-popup-card">
                    <h5>对应核心素养</h5>
                    <ul>
                      {coreLiteracy.length > 0 ? coreLiteracy.map((core) => (
                        <li key={core.name}>{core.name}：{core.desc}</li>
                      )) : <li>暂无核心素养数据。</li>}
                    </ul>
                  </section>
                </div>
              </>
            )}
            <section className="detail-popup-ai-system">
              <div className="detail-popup-ai-head">
                <h5>{isCorePopup ? '🧠 深化素养AI辅助' : isTextbookPopup ? '📘 教材内容详情与AI辅助教学模式' : '🧠 AI 辅助系统'}</h5>
                <span>{popupAISubtitle}</span>
              </div>
              <p className="detail-popup-ai-sub">
                {popupAINotice}
              </p>
              <div className="detail-popup-ai-actions">
                <button
                  type="button"
                  className="detail-popup-ai-primary"
                  onClick={() => openPopupAIAssistant(POPUP_AI_GENERAL_DISCIPLINE)}
                >
                  {POPUP_AI_GENERAL_DISCIPLINE.icon} {popupPrimaryActionText}
                </button>
                <button
                  type="button"
                  className="detail-popup-ai-secondary"
                  onClick={openPopupAIRefine}
                >
                  ✍️ {popupSecondaryActionText}
                </button>
              </div>
              <div className="detail-popup-ai-grid">
                {popupAIModes.map((discipline) => (
                  <button
                    type="button"
                    key={discipline.name}
                    className={`detail-popup-ai-btn ${discipline.themeClass}`}
                    onClick={() => openPopupAIAssistant(discipline)}
                  >
                    <div className="detail-popup-ai-btn-top">
                      <span className="detail-popup-ai-icon">{discipline.icon}</span>
                      <span className="detail-popup-ai-name">{discipline.name}</span>
                      <span className="detail-popup-ai-arrow">→ DeepSeek</span>
                    </div>
                    <div className="detail-popup-ai-cue">{discipline.cue}</div>
                  </button>
                ))}
              </div>
              <div className="detail-popup-ai-note">{popupHelperNote}</div>
              <div className="detail-popup-history">
                <div className="detail-popup-history-title">最近生成记录</div>
                {popupHistory.length > 0 ? (
                  <div className="detail-popup-history-list">
                    {popupHistory.slice(0, 5).map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="detail-popup-history-item"
                        onClick={() => openDeepSeekWithHistory(item.prompt, `${item.discipline} · 继续追问`, item.focus)}
                      >
                        <span className="detail-popup-history-line">{item.discipline}</span>
                        <span className="detail-popup-history-meta">{item.focus} · {item.createdAt}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="detail-popup-history-empty">暂无记录，先生成一次方案即可自动沉淀。</div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 主应用 ──────────────────────────────────────────────
export default function App() {
  const initialFilters = useMemo(() => loadFilterState(), [])
  const initialEntry = useMemo(() => loadEntryState(), [])
  const [entered, setEntered] = useState(false)
  const [stageConfirmed, setStageConfirmed] = useState(false)
  const [guestMode, setGuestMode] = useState<boolean>(() => initialEntry.guestMode === true)
  const [selectedStage, setSelectedStage] = useState<string>(() => {
    if (typeof initialEntry.stage === 'string' && initialEntry.stage) return normalizeStage(initialEntry.stage)
    if (typeof initialFilters.st === 'string' && initialFilters.st) return normalizeStage(initialFilters.st)
    return DEFAULT_STAGE
  })
  const [ftzMode, setFtzMode] = useState<boolean>(() => initialFilters.ftzMode === true)
  const [allianceMode, setAllianceMode] = useState<boolean>(() => initialFilters.allianceMode === true)
  const [q, setQ] = useState(() => typeof initialFilters.q === 'string' ? initialFilters.q : '')
  const [st, setSt] = useState(() => {
    if (initialEntry.guestMode === true) return typeof initialFilters.st === 'string' ? initialFilters.st : ''
    if (typeof initialEntry.stage === 'string' && initialEntry.stage) return normalizeStage(initialEntry.stage)
    if (typeof initialFilters.st === 'string' && initialFilters.st) return normalizeStage(initialFilters.st)
    return DEFAULT_STAGE
  })
  const [tp, setTp] = useState(() => typeof initialFilters.tp === 'string' ? initialFilters.tp : '')
  const [pv, setPv] = useState(() => typeof initialFilters.pv === 'string' ? initialFilters.pv : '')
  const [rg, setRg] = useState(() => typeof initialFilters.rg === 'string' ? initialFilters.rg : '')
  const [selected, setSelected] = useState<Material|null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [uploadedMats, setUploadedMats] = useState<Material[]>(() => {
    try { return JSON.parse(localStorage.getItem('uploaded_materials')||'[]') } catch { return [] }
  })
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [page, setPage] = useState(1)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const PAGE_SIZE = 10

  const ftzCount = useMemo(() => DATA.filter(m => m.isFtz).length, [])
  const allianceCount = useMemo(() => DATA.filter(isAllianceMaterial).length, [])
  const sectionTitle = ftzMode
    ? '海南自由贸易港大思政专题单元'
    : allianceMode
      ? '海南省大中小学思政课一体化建设区域联盟专题'
      : '海南特色大中小学思政课智慧资源库'

  useEffect(() => {
    const payload: AppFilterState = { q, st, tp, pv, rg, ftzMode, allianceMode }
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload))
  }, [q, st, tp, pv, rg, ftzMode, allianceMode])

  useEffect(() => {
    const payload: EntryState = { stage: selectedStage, guestMode }
    localStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(payload))
  }, [selectedStage, guestMode])

  useEffect(() => {
    let cancelled = false
    const endpoint = API_BASE ? `${API_BASE}/api/health` : '/api/health'
    const checkHealth = async () => {
      try {
        const res = await fetch(endpoint, { cache: 'no-store' })
        if (!cancelled) setApiStatus(res.ok ? 'online' : 'offline')
      } catch {
        if (!cancelled) setApiStatus('offline')
      }
    }
    void checkHealth()
    const timer = window.setInterval(() => void checkHealth(), 45000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as EventTarget | null
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
      if (event.key === 'Escape' && selected) {
        setSelected(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected])

  const list = useMemo((): Material[] => {
    return [...uploadedMats, ...DATA].filter(m => {
      // FTZ专题：只显示 isFtz=true 的海南素材
      if (ftzMode) {
        if (!m.isFtz) return false
      }
      // 区域联盟专题：优先展示海南与一体化建设相关素材
      if (allianceMode && !isAllianceMaterial(m)) {
        return false
      }
      const matchSelectedStage = guestMode || !selectedStage || (m.stage || []).includes(selectedStage)
      // 关键词搜索
      const textbookSearch = getTextbookMappings(m).flatMap((j) => [j.book, j.lesson])
      const matchQ = !q || [m.title, m.desc||'', ...(m.tags?.topic||[]), ...(m.tags?.knowledge||[]), ...textbookSearch].some((s: string) => s.toLowerCase().includes(q.toLowerCase()))
      const matchS = !st || (m.stage||[]).includes(st)
      const matchT = !tp || m.type === tp
      // 专题模式隐藏省份/大区过滤器
      const lockRegionFilter = ftzMode || allianceMode
      const matchPv = lockRegionFilter ? true : (!pv || (m.province||'') === pv)
      const matchRg = lockRegionFilter ? true : (!rg || (() => { const p = m.province||''; const g = Object.entries(REGION_GROUPS).find(([,ps])=>ps.includes(p))?.[0]; return g === rg })())
      return matchSelectedStage && matchQ && matchS && matchT && matchPv && matchRg
    })
  }, [uploadedMats, q, st, tp, pv, rg, ftzMode, allianceMode, guestMode, selectedStage])

  const paginated = useMemo(() => list.slice(0, page * PAGE_SIZE), [list, page])
  const hasMore = paginated.length < list.length
  const totalPages = Math.ceil(list.length / PAGE_SIZE)
  const curPage = Math.min(Math.ceil(paginated.length / PAGE_SIZE), totalPages)

  const topicCount: Record<string,number> = {}
  const stageCount: Record<string,number> = {}
  list.forEach(m => {
    ;(m.tags?.topic||[]).forEach((t:string) => topicCount[t]=(topicCount[t]||0)+1)
    ;(m.stage||[]).forEach((s:string) => stageCount[s]=(stageCount[s]||0)+1)
  })
  const topTopics = Object.entries(topicCount).sort((a,b)=>b[1]-a[1]).slice(0,12)
  const apiStatusLabel = apiStatus === 'online' ? 'API 在线' : apiStatus === 'offline' ? 'API 离线' : 'API 检查中'
  const showReset = Boolean(q || tp || pv || rg || (guestMode && st))
  const handleLuckyPick = useCallback(() => {
    if (!list.length) return
    const random = list[Math.floor(Math.random() * list.length)]
    setSelected(random)
  }, [list])

  if (!stageConfirmed) {
    return (
      <StageGate
        selectedStage={selectedStage}
        onSelectStage={(stage) => {
          const normalizedStage = normalizeStage(stage)
          setSelectedStage(normalizedStage)
          setSt(normalizedStage)
        }}
        onContinue={() => {
          const normalizedStage = normalizeStage(selectedStage)
          setGuestMode(false)
          setSelectedStage(normalizedStage)
          setSt(normalizedStage)
          setStageConfirmed(true)
          setEntered(false)
          setFtzMode(false)
          setAllianceMode(false)
        }}
        onGuest={() => {
          setGuestMode(true)
          setSt('')
          setStageConfirmed(true)
          setEntered(false)
          setFtzMode(false)
          setAllianceMode(false)
        }}
      />
    )
  }

  if (!entered) {
    return (
      <Splash
        onEnter={() => {
          setEntered(true)
          setFtzMode(false)
          setAllianceMode(false)
        }}
        onEnterFtz={() => {
          setEntered(true)
          setFtzMode(true)
          setAllianceMode(false)
        }}
        onEnterAlliance={() => {
          setEntered(true)
          setFtzMode(false)
          setAllianceMode(true)
        }}
        onBackToStage={() => {
          setStageConfirmed(false)
          setEntered(false)
          setFtzMode(false)
          setAllianceMode(false)
        }}
        guestMode={guestMode}
        selectedStage={selectedStage}
      />
    )
  }

  return (
    <div className="app">
      {selected && <DetailModal m={selected} onClose={()=>setSelected(null)} />}
      {showUpload && <UploadModal onClose={()=>setShowUpload(false)} onAdd={(m)=>{setUploadedMats(prev=>[...prev,m]);setShowUpload(false);setEntered(true)}} />}
      {showShare && <ShareBoardModal onClose={()=>setShowShare(false)} />}

      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-brand">
          <span className="topbar-logo">🏝️</span>
          <span className="topbar-name">{sectionTitle}</span>
          <span className="entry-mode-pill">{guestMode ? '游客模式' : `学段：${selectedStage}`}</span>
        </div>
        <div className="topbar-tools">
          <button className="topbar-lucky-btn" onClick={handleLuckyPick} disabled={list.length === 0}>🎲 随机一条</button>
          <span className={`api-pill ${apiStatus}`}>{apiStatusLabel}</span>
        </div>
        <button className="topbar-back" onClick={() => { setEntered(false); setFtzMode(false); setAllianceMode(false) }}>← 返回首页</button>
        <button className="topbar-mode-btn" onClick={() => { setStageConfirmed(false); setEntered(false); setFtzMode(false); setAllianceMode(false) }}>切换学段/模式</button>
        <button className="topbar-upload-btn" onClick={() => setShowUpload(true)}>📤 上传素材</button>
        <button className="topbar-share-btn" onClick={() => setShowShare(true)}>💬 经验分享</button>
        <button
          className={`topbar-ftz-btn${ftzMode ? ' is-active' : ''}`}
          onClick={() => {
            if (ftzMode) {
              setFtzMode(false)
              return
            }
            setFtzMode(true)
            setAllianceMode(false)
          }}
        >
          {ftzMode ? '🏠 返回资源库' : `🏝️ 自贸港专题(${ftzCount})`}
        </button>
        <button
          className={`topbar-alliance-btn${allianceMode ? ' is-active' : ''}`}
          onClick={() => {
            if (allianceMode) {
              setAllianceMode(false)
              return
            }
            setAllianceMode(true)
            setFtzMode(false)
          }}
        >
          {allianceMode ? '🏠 返回资源库' : `🤝 区域联盟专题(${allianceCount})`}
        </button>
      </div>

      {/* FTZ Banner */}
      {ftzMode && (
        <div className="ftz-banner">
          <div className="ftz-banner-inner">
            <div className="ftz-banner-left">
              <div className="ftz-banner-title">🏝️ 海南自由贸易港大思政专题单元</div>
              <div className="ftz-banner-sub">海南自贸港 · 改革开放 · 制度创新 · 绿色发展 · 国际门户 · 2025全岛封关</div>
            </div>
            <div className="ftz-banner-right">
              <div className="ftz-stat"><div className="ftz-stat-num">{list.length}</div><div className="ftz-stat-lbl">专题素材</div></div>
              <div className="ftz-stat"><div className="ftz-stat-num">4</div><div className="ftz-stat-lbl">学段覆盖</div></div>
              <div className="ftz-stat"><div className="ftz-stat-num">2025</div><div className="ftz-stat-lbl">最新成果</div></div>
            </div>
          </div>
        </div>
      )}
      {allianceMode && (
        <div className="alliance-banner">
          <div className="alliance-banner-inner">
            <div className="alliance-banner-left">
              <div className="alliance-banner-title">🤝 海南省大中小学思政课一体化建设区域联盟专题</div>
              <div className="alliance-banner-sub">课程共建 · 教研共研 · 学段衔接 · 资源共享 · 协同育人</div>
            </div>
            <div className="alliance-banner-right">
              <div className="alliance-stat"><div className="alliance-stat-num">{list.length}</div><div className="alliance-stat-lbl">专题素材</div></div>
              <div className="alliance-stat"><div className="alliance-stat-num">4</div><div className="alliance-stat-lbl">学段贯通</div></div>
              <div className="alliance-stat"><div className="alliance-stat-num">1</div><div className="alliance-stat-lbl">区域联盟</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="search-area">
        <div className="search-wrap">
          <span className="si">🔍</span>
          <input
            ref={searchInputRef}
            className="sbi"
            placeholder={
              ftzMode
                ? '搜索海南自贸港专题素材，如：零关税、封关、GDP...'
                : allianceMode
                  ? '搜索区域联盟专题素材，如：一体化、课程衔接、协同育人...'
                  : '输入关键词 / 课程标题 / 章节序号搜索，如：七年级道德与法治 第一课...'
            }
            value={q}
            onChange={e=>{setQ(e.target.value);setPage(1)}}
          />
          {q&&<button className="scb" onClick={()=>setQ('')}>✕</button>}
        </div>
        <div className="filter-row filter-row-stack">
          {!ftzMode && !allianceMode && (
            <div className="filter-line filter-line-region">
              <span className="filter-line-label">地区筛选</span>
              <select className="prov-select filter-select" value={rg} onChange={e=>{setRg(e.target.value);setPv('');setPage(1)}}>
                <option value="">全部地区</option>
                {Object.keys(REGION_GROUPS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}
          {!ftzMode && !allianceMode && (
            <div className="filter-line filter-line-province">
              <span className="filter-line-label">省份筛选</span>
              <select className="prov-select filter-select" value={pv} onChange={e=>{setPv(e.target.value);setRg('');setPage(1)}}>
                <option value="">全部省份</option>
                {ALL_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}
          {guestMode ? (
            <div className="filter-line filter-line-stage">
              <span className="filter-line-label">学段筛选</span>
              <div className="filter-chip-group">
                {['', ...STAGE_OPTIONS].map(s => <button key={s} className={`fb ${st===s?'active':''}`} onClick={()=>{setSt(s);setPage(1)}}>{s||'全部'}</button>)}
              </div>
            </div>
          ) : (
            <div className="filter-line filter-line-stage filter-section-stage-lock">
              <span className="filter-line-label">学段筛选</span>
              <div className="stage-lock-row">
                <span className="stage-lock-pill">{selectedStage}（已自动筛选）</span>
                <button
                  className="fb stage-guest-switch"
                  onClick={() => {
                    setGuestMode(true)
                    setSt('')
                    setPage(1)
                  }}
                >
                  切换游客模式
                </button>
              </div>
            </div>
          )}
          <div className="filter-line filter-line-type">
            <span className="filter-line-label">类型筛选</span>
            <div className="filter-chip-group">
              {[['document','📄','文档'],['video','🎬','视频'],['image','🖼','图片'],['audio','🎧','音频'],['multimedia','🎭','多媒体']].map(([k,icon,label]) => <button key={k} className={`fb ${tp===k?'active':''}`} onClick={()=>{setTp(tp===k?'':k);setPage(1)}}>{icon} {label}</button>)}
              {showReset&&<button className="fb reset filter-reset-btn" onClick={()=>{setQ('');setSt(guestMode ? '' : selectedStage);setTp('');setPv('');setRg('');setPage(1)}}>⟳ 重置</button>}
            </div>
          </div>
        </div>
        <div className="result-bar">
          <span><strong>{list.length}</strong> 条素材</span>
          {q&&<span> · 搜索 <strong>"{q}"</strong></span>}
          {list.length>0&&<span className="page-info"> — 第 {curPage}/{totalPages} 页 · 显示 {paginated.length} 条</span>}
          <span className="kbd-hint"> · 快捷键: `/` 聚焦搜索, `Esc` 关闭详情</span>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="card-list">
          {list.length===0?(
            <div className="empty-card"><div className="empty-icon">🔍</div><h3>暂无此内容</h3><p>试试其他关键词或调整筛选条件</p></div>
          ):(
            <>
              {paginated.map(m=>{
                const pct2=PERIOD_CLR[m.period||'现当代']||'#22d3ee'
                const RED_KWS = ['革命','红色','抗日','解放','党史','长征','红军','起义','纪念','烈士','英烈','抗战','武装斗争','根据地','琼崖','娘子军','母瑞山','八路军','新四军','游击队','解放战争','建党','五四','马克思主义','共产主义','社会主义','共产主义','中央苏区','苏维埃','红色娘子军','红色基因','政治认同','政治认同','革命先烈','革命先驱','革命传统','革命精神','红船','红船精神','井冈山','延安精神','西柏坡','赶考精神','两弹一星','焦裕禄精神','铁人精神','抗美援朝','志愿军','保家卫国','革命英雄','革命故事','革命歌曲']
                const isRed = m.period==='近代史' || RED_KWS.some(kw => (m.title+m.desc+(m.tags?.topic||[]).join('')).includes(kw))
                return (
                  <div key={m.id} className={`mat-card${isRed?' mat-card-red':''}`} onClick={()=>setSelected(m)}>
                    <div className="mat-badges">
                      <span className="type-badge-sm" style={{color:pct2,background:`${pct2}18`}}>{TICO[m.type]||'📄'} {m.type}</span>
                      <span className="period-badge-sm" style={{color:pct2,background:`${pct2}18`}}>{m.period||'现当代'}</span>
                    </div>
                    <h3 className="mat-title">{m.title}</h3>
                    <p className="mat-desc">{m.desc}</p>
                    <div className="mat-tags">
                      {(m.stage||[]).map(s => <span key={s} className="stage-pill" style={{color:STAGE_CLR[s]||'#94a3b8',background:STAGE_BG[s]||'rgba(148,163,184,0.12)'}}>{s}</span>)}
                      {(m.tags?.topic||[]).slice(0,4).map(t => <span key={t} className="topic-pill">#{t}</span>)}
                    </div>
                    <div className="mat-footer">
                      <span className="ai-hint">🧠 AI教学方案</span>
                      <span className="res-hint">🌐 全网资源</span>
                      <span className="live-hint">⚡ 点击实时生成</span>
                    </div>
                  </div>
                )
              })}
              {hasMore&&<button className="load-more-btn" onClick={()=>setPage(p=>p+1)}>加载更多 ↓ ({paginated.length}/{list.length})</button>}
              {!hasMore&&list.length>0&&<div className="all-done">✅ 已加载全部 {list.length} 条素材</div>}
            </>
          )}
        </div>
        <div className="sidebar">
          <div className="s-card">
            <div className="s-title">📂 主题分类</div>
            {topTopics.map(([t,c])=>(<div key={t} className="s-topic-row"><span className="s-topic-name">#{t}</span><span className="s-topic-cnt">{c}</span></div>))}
          </div>
          <div className="s-card">
            <div className="s-title">🎓 学段分布</div>
            {(['小学','初中','高中','大学'] as string[]).map(s=>{
              const c=stageCount[s]||0; const p=list.length>0?Math.round(c/list.length*100):0
              return <div key={s} className="s-bar-row"><span className="s-bar-label">{s}</span><div className="s-bar"><div style={{height:'100%',width:p+'%',background:STAGE_CLR[s]||'#94a3b8',borderRadius:4}}/></div><span className="s-bar-cnt">{c}</span></div>
            })}
          </div>
          {!ftzMode && !allianceMode && (
            <div className="s-card">
              <div className="s-title">🗺️ 省份分布 TOP10</div>
              {Object.entries(Object.entries(list.reduce((acc,m)=>{const p=m.province||'全国';acc[p]=(acc[p]||0)+1;return acc},{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,10)).map(([p,c])=>{
                const p4=list.length>0?Math.round(Number(c)/list.length*100):0
                return <div key={p} className="s-bar-row"><span className="s-bar-label" style={{fontSize:11}}>{p}</span><div className="s-bar"><div style={{height:'100%',width:p4+'%',background:'#dc2626',borderRadius:4}}/></div><span className="s-bar-cnt">{c}</span></div>
              })}
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-logo">🏝️</div>
        <div>
          <div className="footer-title">{sectionTitle}</div>
          <div className="footer-sub">© 2026 思政教育智慧平台 · Powered by MiniMax AI · 海南自由贸易港</div>
        </div>
      </footer>
    </div>
  )
}
