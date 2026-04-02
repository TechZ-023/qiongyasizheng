import express from 'express'
import cors from 'cors'
import axios from 'axios'

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || ''
const MINIMAX_API_URL = 'https://api.minimaxi.chat/v1/text/chatcompletion_v2'

const app = express()
const PORT = 3001

app.use(cors({ origin: '*' }))
app.use(express.json())

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

// ─── Baidu Search ─────────────────────────────────────────────────────────
async function searchBaidu(query: string, num = 8) {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://www.baidu.com/s?wd=${encoded}&rn=${num}&cl=3&ie=utf-8`
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://www.baidu.com/',
      },
      timeout: 10000,
    })

    const results: { title: string; url: string; desc: string }[] = []
    // 解析百度搜索结果
    const titleMatches = html.match(/<h3 class="c-title">([\s\S]*?)<\/h3>/g) || []
    const descMatches = html.match(/<span class="c-span-last">([\s\S]*?)<\/span>/g) || []
    const linkMatches = html.match(/href="(https?:\/\/[^"]+)"/g) || []

    for (let i = 0; i < Math.min(titleMatches.length, num); i++) {
      const titleMatch = titleMatches[i].replace(/<[^>]+>/g, '').trim()
      const descMatch = descMatches[i] ? descMatches[i].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : ''
      const linkMatch = linkMatches[i] ? linkMatches[i].match(/href="(https?:\/\/[^"]+)"/)?.[1] || '' : ''
      if (titleMatch && linkMatch) {
        results.push({ title: titleMatch, url: linkMatch, desc: descMatch.slice(0, 150) })
      }
    }
    return results
  } catch (error) {
    console.error('[Baidu] search error:', getErrorMessage(error))
    return []
  }
}

// ─── AI Categorization ────────────────────────────────────────────────
function categorize(query: string, title: string, desc: string) {
  const text = `${query} ${title} ${desc}`.toLowerCase()
  const topics: string[] = [], emotions: string[] = []
  if (/红色|革命|娘子军|纵队|母瑞山|红旗|党|抗战|解放|党史/.test(text)) {
    topics.push('红色文化', '革命精神'); emotions.push('爱国情', '使命感')
  }
  if (/自贸港|关税|封关|贸易|改革开放|制度创新|海南/.test(text)) {
    topics.push('自贸港政策'); emotions.push('自豪感', '责任感')
  }
  if (/南海|海洋|深海|海军|岛|航海|丝路|主权/.test(text)) {
    topics.push('海洋文化'); emotions.push('自豪感', '认同感')
  }
  if (/生态|雨林|绿色|环保|青山|保护/.test(text)) {
    topics.push('生态文明'); emotions.push('责任感')
  }
  if (/黎|苗|黎族|苗族|少数民族|非遗/.test(text)) {
    topics.push('黎苗文化', '民族文化'); emotions.push('自豪感', '认同感')
  }
  if (/科技|创新|深海|航天|技术/.test(text)) {
    topics.push('科技创新'); emotions.push('自豪感')
  }
  if (/乡村|振兴|农村|农业|农民/.test(text)) {
    topics.push('乡村振兴'); emotions.push('责任感', '奋斗志')
  }
  if (topics.length === 0) topics.push('其他')
  if (emotions.length === 0) emotions.push('爱国情')
  return { topics, emotions }
}

function detectStage(text: string): string[] {
  const t = text.toLowerCase()
  const s: string[] = []
  if (/小学|儿童/.test(t)) s.push('小学')
  if (/初中|中学|初中生|青少年/.test(t)) s.push('初中')
  if (/高中|高三|高一|高二|高考/.test(t)) s.push('高中')
  if (/大学|高校|大学生|学院|本科/.test(t)) s.push('大学')
  return s.length > 0 ? s : ['初中', '高中', '大学']
}

function detectType(url: string, title: string): string {
  const t = `${url} ${title}`.toLowerCase()
  if (/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)/.test(t)) return 'document'
  if (/视频|video|哔哩|bilibili|youtu\.be|电影|mp4/.test(t)) return 'video'
  if (/图片|image|photo|jpg|png|jpeg/.test(t)) return 'image'
  if (/音频|podcast|喜马拉雅|sound|mp3/.test(t)) return 'audio'
  return 'document'
}

function makeAnnotation(title: string, query: string, topics: string[], emotions: string[], stages: string[]): string {
  return `✅ AI标注：${title}，适合作为${topics[0] || '思政教育'}专题素材。\n📚 知识点：${query}。\n💗 情感标签：${emotions.join('、')}。\n💡 教学建议：建议结合${stages.join('、')}学段学生特点设计教学活动，可作为${topics[0]}专题的导入素材。`
}

// ─── Wikipedia Fallback Search ───────────────────────────────────────────
async function searchWikipedia(query: string) {
  try {
    const url = `https://zh.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=8&format=json&origin=*`
    const { data } = await axios.get(url, { timeout: 8000 })
    if (Array.isArray(data) && data.length >= 4) {
      return data[3].map((url: string, i: number) => ({
        title: data[1][i] || '',
        url: url || '',
        desc: (data[2][i] || '').slice(0, 150),
      })).filter((r: {title: string}) => r.title)
    }
  } catch (error) {
    console.warn('[Wiki] search failed:', getErrorMessage(error))
  }
  return []
}

// ─── Routes ────────────────────────────────────────────────────────────

// 主搜索接口：百度 + 备用
app.get('/api/search', async (req, res) => {
  const { q, type, stage } = req.query as { q?: string; type?: string; stage?: string }
  if (!q) return res.json({ results: [], total: 0, source: 'none' })

  console.log(`[Search] query="${q}", type="${type}", stage="${stage}"`)

  try {
    // 优先：百度搜索
    let baiduResults = await Promise.race([
      searchBaidu(q, 8),
      new Promise<[]>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
    ]).catch(() => []) as { title: string; url: string; desc: string }[]

    console.log(`[Search] Baidu got ${baiduResults.length} results`)

    // 如果百度无结果，启用Wikipedia备用
    if (baiduResults.length === 0) {
      console.log('[Search] Falling back to Wikipedia')
      baiduResults = await searchWikipedia(q)
    }

    // 构建素材对象
    const results = baiduResults.slice(0, 8).map((r, i) => {
      const { topics, emotions } = categorize(q, r.title, r.desc)
      const stages = detectStage(`${r.title} ${r.desc}`)
      const mType = detectType(r.url, r.title)
      const filteredStages = stage ? stages.filter(s => s === stage) : stages
      let hostname = r.url
      try {
        hostname = new URL(r.url).hostname.replace('www.', '')
      } catch {
        hostname = r.url.replace(/^https?:\/\//, '').split('/')[0] || r.url
      }
      return {
        id: Date.now() + i,
        title: r.title,
        type: mType,
        stage: filteredStages.length > 0 ? filteredStages : stages,
        tags: { topic: topics, emotion: emotions, knowledge: [q] },
        desc: r.desc || `${r.title}的相关内容`,
        content: r.desc || '',
        source: 'network',
        sourceName: hostname,
        url: r.url,
        date: new Date().toLocaleDateString('zh-CN'),
        views: Math.floor(Math.random() * 2000) + 100,
        annotation: makeAnnotation(r.title, q, topics, emotions, stages)
      }
    })

    const filtered = results.filter(m => m.stage.length > 0)
    console.log(`[Search] returning ${filtered.length} results`)
    res.json({ results: filtered, total: filtered.length, query: q, source: 'baidu' })
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    console.error('[Search] error:', message)
    // 紧急备用：直接返回空，不崩溃
    res.json({ results: [], error: '搜索引擎暂时不可用，请稍后重试', total: 0, source: 'error' })
  }
})

// Wikipedia开放搜索
app.get('/api/wiki', async (req, res) => {
  const { q } = req.query as { q?: string }
  if (!q) return res.json([])
  try {
    const results = await searchWikipedia(q)
    res.json(results)
  } catch (error: unknown) {
    res.json({ error: getErrorMessage(error) })
  }
})

// AI 生成教学方案
app.post('/api/generate', async (req, res) => {
  const { title, desc, topics, knowledge, stage } = req.body as {
    title?: string; desc?: string; topics?: string[]; knowledge?: string[]; stage?: string[]
  }
  if (!title) return res.status(400).json({ error: '缺少标题' })

  const topicStr = (topics || []).join('、')
  const knowStr = (knowledge || []).join('、')
  const stageStr = (stage || []).join('、')

  const prompt = `你是一位海南省思政教育专家。请为以下思政教育素材生成一份详细的AI辅助教学方案。

【素材标题】${title}
【素材描述】${desc || '暂无'}
【主题标签】${topicStr || '思政教育'}
【知识点】${knowStr || '相关知识点'}
【适用学段】${stageStr || '初中、高中、大学'}

请严格按以下格式生成教学方案（使用中文）：
【教学目标】...
【知识点梳理】...
【适用学段分析】...
【教学方法建议】...（针对各学段分别说明）
【情感升华】...（结合海南自贸港建设谈现实意义）
【延伸思考与实践活动】...（设计2-3个可操作的实践活动）
【课堂导入建议】...（结合时事或海南本地案例）

请确保内容专业、准确、富有教育意义，符合中国思政教育大纲要求。`

  // 无API Key时返回优雅降级
  if (!MINIMAX_API_KEY) {
    const fallback = `【教学目标】理解"${title}"的历史背景与核心内容，认识其在海南思政教育中的重要价值。
【知识点梳理】${knowStr || '相关历史知识点'}。
【适用学段分析】${stageStr || '初中、高中、大学'}各学段学生均可根据认知水平差异进行差异化教学。
【教学方法建议】建议采用情境导入法，通过图片、视频或故事激发学习兴趣；结合小组讨论引导学生主动探究；适时引入角色扮演或实地考察增强体验感。
【情感升华】通过学习"${title}"，培养学生的家国情怀和社会责任感，增强对海南历史文化的认同感和自豪感。
【延伸思考与实践活动】(1) 课后查阅相关资料，撰写学习心得；(2) 以小组为单位制作主题手抄报或短视频；(3) 参观相关纪念场馆，开展实地研学。
【课堂导入建议】可用提问导入："同学们，你们知道${topicStr || '这个主题'}在海南历史上有什么重要意义吗？"引发学生思考和讨论。`
    return res.json({ annotation: fallback, source: 'fallback' })
  }

  try {
    const { data } = await axios.post(MINIMAX_API_URL, {
      model: 'MiniMax-Text-01',
      tokens_to_generate: 600,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
    const annotation = data.choices?.[0]?.text?.trim() || data.choices?.[0]?.message?.content?.trim() || ''
    res.json({ annotation, source: 'minimax' })
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    console.error('[Generate] error:', message)
    res.status(500).json({ error: '生成失败：' + message })
  }
})

// 健康检查
app.get('/api/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }))

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎓 Qiongya Search API running on http://0.0.0.0:${PORT}`)
  console.log('Search endpoints: /api/search?q=关键词')
})

// ─── Cross-disciplinary Teaching Plan (MiniMax) ──────────────────────────────
app.post('/api/crossdisciplinary', async (req, res) => {
  const { knowledge, discipline, materialTitle, prompt } = req.body
  if (!knowledge || !discipline) {
    return res.status(400).json({ error: '缺少 knowledge 或 discipline 参数' })
  }

  if (!MINIMAX_API_KEY) {
    // Fallback: 返回预置跨学科方案
    const plans: Record<string, string> = {
      '语文学科': `【跨学科融合教学方案】素材主题：「${materialTitle}」核心知识点：「${knowledge}」

一、语文文本推荐
结合知识点「${knowledge}」，推荐以下语文阅读文本：
1. 革命故事类文本（可从《语文》教材中选取相关课文）
2. 人物通讯与报告文学（如：《谁是最可爱的人》《荔枝蜜》等）
3. 革命诗词诵读（例：毛泽东诗词中的革命情怀）

二、写作任务设计
- 主题征文：以「${knowledge}」为主题，写一篇不少于600字的作文
- 读后感：结合教材中相关课文，写出个人感悟
- 创意写作：以革命先辈的视角写一封书信

三、口语表达活动
- 主题演讲比赛：围绕「${knowledge}」设计演讲题目
- 小组辩论：结合知识点设计辩论题目
- 故事分享会：学生讲述与知识点相关的革命故事

四、教学建议
建议课时：2课时（1课时文本阅读+讨论，1课时写作与展示）
评价方式：过程性评价（课堂参与）+ 终结性评价（作文质量）`,
      '历史学科': `【历史学科跨学科融合方案】素材主题：「${materialTitle}」核心知识点：「${knowledge}」

一、历史背景梳理
- 还原知识点「${knowledge}」所处的历史时期（年代、社会背景）
- 绘制时间轴，标注关键历史节点
- 分析当时的社会主要矛盾与历史任务

二、历史人物分析
- 选取与知识点相关的1-2位重要历史人物
- 分析其思想主张与历史行动的关系
- 讨论历史人物在当时条件下的抉择与局限

三、史料研读与讨论
- 选取2-3则一手史料（文献、图片、影像等）
- 设计讨论问题，引导学生分析史料、形成历史认识
- 对比不同史料对同一历史事件的叙述差异

四、教学建议
课时安排：建议2课时
教学方法：史料教学法、问题链引导、小组合作探究`,
    }

    const fallback = plans[discipline] || `【${discipline}×思政融合方案】

核心知识点：「${knowledge}」× ${discipline}

一、融合点分析
分析「${knowledge}」与${discipline}的内在联系，找到知识交汇点。

二、教学活动设计
设计2-3个课堂活动，体现跨学科融合特色。

三、评价方式
制定过程性与终结性评价相结合的评价方案。`

    return res.json({ answer: fallback, source: 'fallback' })
  }

  try {
    const disciplineContexts: Record<string, string> = {
      '语文学科': `你是一位资深思政教育专家，擅长将思政内容与语文学科融合。请为知识点「${knowledge}」（来自素材：${materialTitle}）设计一份与语文学科的跨学科融合教学方案，要求：
1. 包含语文文本推荐（革命故事、人物通讯、革命诗词等）
2. 设计写作任务（主题征文、读后感等）
3. 设计口语表达活动（演讲、辩论、故事分享）
4. 提供教学建议（课时安排、评价方式）
请用专业、详细的语言，分模块撰写。`,
      '历史学科': `你是一位资深思政教育专家，擅长将思政内容与历史学科融合。请为知识点「${knowledge}」（来自素材：${materialTitle}）设计一份与历史学科的跨学科融合教学方案，要求：
1. 梳理历史背景（时间、人物、事件）
2. 分析历史人物的思想与行动
3. 设计史料研读与讨论活动
4. 提供教学建议（课时安排、方法建议）
请用专业、详细的语言，分模块撰写。`,
      '地理学科': `你是一位资深思政教育专家，擅长将思政内容与地理学科融合。请为知识点「${knowledge}」（来自素材：${materialTitle}）设计一份与地理学科的跨学科融合教学方案，要求：
1. 分析地理位置与环境因素
2. 区域经济发展对比
3. 人地关系探讨
4. 教学建议（课时、评价）
请分模块详细阐述，语言专业。`,
      '艺术学科': `你是一位资深思政教育专家，擅长将思政内容与艺术学科融合。请为知识点「${knowledge}」（来自素材：${materialTitle}）设计一份与艺术学科（音乐/美术）的跨学科融合教学方案，要求：
1. 推荐相关革命歌曲或美术作品
2. 设计艺术创作活动（绘画、手工、表演等）
3. 组织艺术欣赏与评论活动
4. 提供教学建议（课时、评价）
请用专业语言，分模块详细描述。`,
      '自然科学': `你是一位资深思政教育专家，擅长将思政内容与自然科学融合。请为知识点「${knowledge}」（来自素材：${materialTitle}）设计一份与自然科学的跨学科融合教学方案，要求：
1. 讲解相关科学原理与技术应用
2. 讨论科技发展与社会进步的关系
3. 设计实验或探究活动
4. 提供教学建议（课时、评价）
请分模块详细撰写。`,
      '信息技术': `你是一位资深思政教育专家，擅长将思政内容与信息技术融合。请为知识点「${knowledge}」（来自素材：${materialTitle}）设计一份与信息技术的跨学科融合教学方案，要求：
1. 设计数字资源搜集与整理活动
2. 制作多媒体汇报或微课视频
3. 在线协作学习活动设计
4. 提供教学建议（课时、评价）
请分模块详细描述。`,
    }

    const systemPrompt = '你是一位资深思政教育专家，擅长设计跨学科融合教学方案。请根据提供的知识点和学科，生成专业、详细、可操作的跨学科融合教学方案，语言专业，分模块清晰呈现，适合中小学思政课教师直接使用。'
    const userPrompt = disciplineContexts[discipline] || `请为思政课知识点「${knowledge}」设计与${discipline}的跨学科融合教学方案，素材主题：「${materialTitle}」。

${prompt || '请生成包含融合点分析、教学活动设计、评价方式的完整方案。'}`

    const response = await axios.post(MINIMAX_API_URL, {
      model: 'MiniMax-Text-01',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }, {
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    const answer = response.data?.choices?.[0]?.message?.content || ''
    res.json({ answer, source: 'minimax' })
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    console.error('MiniMax API error:', message)
    res.status(500).json({ error: 'AI生成失败：' + message })
  }
})
