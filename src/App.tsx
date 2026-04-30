import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import './App.css'
import rawData from './data.json'
import hainnuEduBadge from './assets/hainnu-edu-badge.jpg'
import allianceHainnuLogo from './assets/alliance-logos/hainnu-logo.jpg'
import allianceHainanuLogo from './assets/alliance-logos/hainanu-logo.jpg'
import allianceHntouLogo from './assets/alliance-logos/hntou-logo.jpg'
import allianceQtnuLogo from './assets/alliance-logos/qtnu-logo.jpg'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || ''
const FILTER_STORAGE_KEY = 'qiongya_filters_v1'
const ENTRY_STORAGE_KEY = 'qiongya_entry_v1'
const THEME_STORAGE_KEY = 'qiongya_theme_v1'
const STAGE_OPTIONS = ['小学', '初中', '高中', '大学'] as const
type StageOption = (typeof STAGE_OPTIONS)[number]
const DEFAULT_STAGE = STAGE_OPTIONS[2]

const STAGE_CLR: Record<string,string> = { '小学':'#fbbf24','初中':'#f97316','高中':'#ef4444','大学':'#a78bfa' }
const STAGE_BG:  Record<string,string> = { '小学':'rgba(251,191,36,0.12)','初中':'rgba(249,115,22,0.12)','高中':'rgba(239,68,68,0.12)','大学':'rgba(167,139,250,0.12)' }
const TICO: Record<string,string> = { document:'📄',image:'🖼',video:'🎬',audio:'🎧',multimedia:'🎭' }
const TYPE_LABELS: Record<string,string> = { document:'文档',image:'图片',video:'视频',audio:'音频',multimedia:'多媒体' }
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
const ALLIANCE_INTRO_REGION_NODES = [
  '北部联盟（海南师范大学牵头）',
  '西部联盟（海南大学牵头）',
  '南部联盟（海南热带海洋学院牵头）',
  '东部联盟（琼台师范学院牵头）',
]
const ALLIANCE_INTRO_HIGHLIGHTS = [
  '在海南省教育厅统筹下，形成“高校牵头+市县联动+中小学参与”的协同推进机制。',
  '围绕同题异构、集体备课、实践基地共建、教师发展等场景，常态化开展跨学段教研。',
  '聚焦课程衔接、资源共建共享与协同育人，推动思政课从分段实施走向全程贯通。',
]

interface AllianceResourceEntry {
  title: string
  org: string
  date: string
  tag: string
  url: string
  summary: string
}

interface AllianceConsultEntry {
  channel: string
  target: string
  detail: string
  actionLabel: string
  url: string
}

interface AllianceColumnItem {
  column: string
  scene: string
  examples: string
  existingResources: Array<{
    title: string
    source: string
    date: string
    url: string
  }>
}

interface AllianceSchoolEntry {
  name: string
  role: string
  logo: string
  logoSource: string
  site: string
}

interface AllianceMilestone {
  title: string
  node: string
  desc: string
}

interface AllianceActionEntry {
  title: string
  detail: string
  actionLabel: string
  url: string
}

interface FtzScorecardItem {
  metric: string
  value: string
  detail: string
  source: string
  sourceLabel: string
  date: string
}

type UploadScene = 'general' | 'alliance_same_class'

const FTZ_HUNDRED_DAY_SCORECARD: FtzScorecardItem[] = [
  {
    metric: '新增备案外贸企业',
    value: '7503家',
    detail: '同比增长 65.7%',
    source: 'https://www.chinanews.com.cn/cj/2026/03-26/10593215.shtml',
    sourceLabel: '中国新闻网',
    date: '2026-03-26',
  },
  {
    metric: '“零关税”享惠主体',
    value: '11773家',
    detail: '封关百日累计获批',
    source: 'https://www.chinanews.com.cn/cj/2026/03-26/10593215.shtml',
    sourceLabel: '中国新闻网',
    date: '2026-03-26',
  },
  {
    metric: '“零关税”商品税目',
    value: '6637项',
    detail: '税目比例由 21% 提升至 74%',
    source: 'https://www.chinanews.com.cn/cj/2026/03-26/10593215.shtml',
    sourceLabel: '中国新闻网',
    date: '2026-03-26',
  },
  {
    metric: '外贸进出口额',
    value: '超800亿元',
    detail: '同比增长 32.9%',
    source: 'https://www.chinanews.com.cn/cj/2026/03-28/10594235.shtml',
    sourceLabel: '工人日报（中新网转载）',
    date: '2026-03-28',
  },
  {
    metric: '进出境旅客',
    value: '86.1万人次',
    detail: '其中免签入境 21.7 万人次',
    source: 'https://www.chinanews.com.cn/cj/2026/03-28/10594235.shtml',
    sourceLabel: '工人日报（中新网转载）',
    date: '2026-03-28',
  },
  {
    metric: '离岛免税销售额',
    value: '156.2亿元',
    detail: '购物人数 196.84 万人次',
    source: 'https://www.chinanews.com.cn/cj/2026/03-28/10594235.shtml',
    sourceLabel: '工人日报（中新网转载）',
    date: '2026-03-28',
  },
]

const ALLIANCE_OFFICIAL_RESOURCES: AllianceResourceEntry[] = [
  {
    title: '教育部办公厅关于开展大中小学思政课一体化共同体建设的通知',
    org: '教育部',
    date: '2023-01-10',
    tag: '国家政策',
    url: 'https://www.moe.gov.cn/srcsite/A13/moe_772/202301/t20230109_1038750.html',
    summary: '明确共同体建设总体目标与重点任务，是区域联盟组织实施的重要政策依据。',
  },
  {
    title: '中小学思政课建设工作座谈会召开',
    org: '教育部',
    date: '2025-05-23',
    tag: '国家动态',
    url: 'https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/moe_1485/202505/t20250523_1191664.html',
    summary: '部署新时代思政课建设重点任务，为各地推进一体化建设提供工作指引。',
  },
  {
    title: '思政课从“分段独奏”到“全程交响”',
    org: '教育部',
    date: '2025-11-06',
    tag: '改革解读',
    url: 'https://www.moe.gov.cn/jyb_xwfb/xw_zt/moe_357/2025/2025_zt18/szqhjszyx/202511/t20251118_1420773.html',
    summary: '专题阐释一体化建设路径，强调大中小学纵向贯通、协同育人。',
  },
  {
    title: '海南省“大中小学思政课一体化共同体”工作交流研讨会在海师大召开',
    org: '海南师范大学',
    date: '2025-08-09',
    tag: '省域联盟',
    url: 'https://webplus.hainnu.edu.cn/_s3/2025/0809/c1648a157596/page.psp',
    summary: '面向全省交流一体化共同体建设进展，推进四大片区协同机制落地。',
  },
  {
    title: '2025年海南省大中小学思政课一体化“同题异构”教学比赛在海师大举行',
    org: '海南师范大学',
    date: '2025-10-18',
    tag: '教学竞赛',
    url: 'https://webplus.hainnu.edu.cn/_s3/2025/1018/c1648a159720/page.psp',
    summary: '汇聚多学段教师同题异构展示，强化课程衔接与教研共研。',
  },
  {
    title: '全国思政课战线集体备课会在海口举行',
    org: '海南师范大学',
    date: '2025-12-27',
    tag: '高端研修',
    url: 'https://webplus.hainnu.edu.cn/_s3/2025/1227/c1648a162320/page.psp',
    summary: '围绕党的创新理论融入思政课，开展跨学段集体备课与教学研讨。',
  },
  {
    title: '海南大学区域联盟举办同题异构选拔赛',
    org: '海南大学马克思主义学院',
    date: '2025-07-05',
    tag: '西部片区',
    url: 'https://mks.hainanu.edu.cn/info/1064/11372.htm',
    summary: '聚焦区域联盟课堂展示与赛课研课，促进高校与中小学课堂协同。',
  },
  {
    title: '海南大学一体化建设首次集体备课活动举办',
    org: '海南大学马克思主义学院',
    date: '2025-05-26',
    tag: '集体备课',
    url: 'https://mks.hainanu.edu.cn/info/1293/11232.htm',
    summary: '围绕共同教学主题开展跨学段共备，沉淀可复用教案与教学任务链。',
  },
  {
    title: '海南大学10月集体备课活动举行',
    org: '海南大学马克思主义学院',
    date: '2024-10-10',
    tag: '西部片区',
    url: 'https://mks.hainanu.edu.cn/info/1064/8102.htm',
    summary: '持续推进月度集体备课机制，强化议题共研与资源共建。',
  },
  {
    title: '南部片区“万名师生同讲海南故事”教学展示活动举行',
    org: '海南热带海洋学院',
    date: '2025-05-10',
    tag: '南部片区',
    url: 'https://www.hntou.edu.cn/xwzx/xxyw/202505/t20250510_95835.html',
    summary: '依托“大思政课”实践基地推进区域联盟实践教学与协同育人。',
  },
  {
    title: '海南热带海洋学院区域联盟同题异构选拔赛举行',
    org: '海南热带海洋学院',
    date: '2025-06-22',
    tag: '教学竞赛',
    url: 'https://www.hntou.edu.cn/xwzx/xywh/202506/t20250622_96980.html',
    summary: '面向一体化建设开展课堂教学选拔，推动南部片区教研联动。',
  },
  {
    title: '海南热带海洋学院推进高校与实践基地协同育人',
    org: '海南热带海洋学院',
    date: '2025-04-14',
    tag: '协同育人',
    url: 'https://www.hntou.edu.cn/xwzx/xxyw/202504/t20250414_95174.html',
    summary: '以校地协同机制推动思政课实践教学资源整合与育人闭环。',
  },
  {
    title: '琼台师范学院区域联盟在同题异构比赛中获佳绩',
    org: '琼台师范学院',
    date: '2025-10-19',
    tag: '东部片区',
    url: 'https://www.qtnu.edu.cn/info/1151/73851.htm',
    summary: '展示东部片区教师团队建设成效与一体化教学实践成果。',
  },
]

const ALLIANCE_CONSULT_CHANNELS: AllianceConsultEntry[] = [
  {
    channel: '海南省教育厅官网咨询',
    target: '政策解读、活动安排、业务咨询',
    detail: '通过海南省教育厅官网“互动交流/咨询”渠道提交问题；公开页面展示咨询服务热线：0898-65322302（以官网最新公示为准）。',
    actionLabel: '进入省厅官网',
    url: 'https://edu.hainan.gov.cn/',
  },
  {
    channel: '北部联盟咨询入口',
    target: '大中小学思政课一体化北部片区活动',
    detail: '由海南师范大学牵头，可通过海师大发布的共同体工作交流信息对接北部片区教研活动。',
    actionLabel: '查看海师大片区动态',
    url: 'https://webplus.hainnu.edu.cn/_s3/2025/0809/c1648a157596/page.psp',
  },
  {
    channel: '西部联盟咨询入口',
    target: '西部片区同题异构与实践教学活动',
    detail: '由海南大学牵头，可通过海南大学马院发布的集体备课与赛事通知持续跟进片区活动。',
    actionLabel: '查看海南大学马院',
    url: 'https://mks.hainanu.edu.cn/info/1293/11232.htm',
  },
  {
    channel: '南部联盟咨询入口',
    target: '实践教学基地、教学展示与协同育人活动',
    detail: '可通过海南热带海洋学院发布的南部片区区域联盟活动信息对接教研与实践资源。',
    actionLabel: '查看南部片区活动',
    url: 'https://www.hntou.edu.cn/xwzx/xxyw/202505/t20250510_95835.html',
  },
  {
    channel: '东部联盟咨询入口',
    target: '教学比赛、教研展示与教师发展活动',
    detail: '可通过琼台师范学院区域联盟赛事与成果页面，了解东部片区最新工作安排。',
    actionLabel: '查看东部片区成果',
    url: 'https://www.qtnu.edu.cn/info/1151/73851.htm',
  },
  {
    channel: '国家层面政策咨询入口',
    target: '共同体建设政策口径与标准依据',
    detail: '教育部一体化共同体建设通知页面是跨区域工作对齐的重要政策依据。',
    actionLabel: '查看教育部通知',
    url: 'https://www.moe.gov.cn/srcsite/A13/moe_772/202301/t20230109_1038750.html',
  },
]

const ALLIANCE_CONTENT_COLUMNS: AllianceColumnItem[] = [
  {
    column: '同题异构课例',
    scene: '跨学段衔接课、展示课、公开课',
    examples: '上传“同一主题在小学/初中/高中/大学”的教学设计与课堂实录。',
    existingResources: [
      {
        title: '2025年海南省大中小学思政课一体化“同题异构”教学比赛在海师大举行',
        source: '海南师范大学',
        date: '2025-10-18',
        url: 'https://webplus.hainnu.edu.cn/_s3/2025/1018/c1648a159720/page.psp',
      },
      {
        title: '海南大学区域联盟举办同题异构选拔赛',
        source: '海南大学马克思主义学院',
        date: '2025-07-05',
        url: 'https://mks.hainanu.edu.cn/info/1064/11372.htm',
      },
    ],
  },
  {
    column: '集体备课成果',
    scene: '联盟片区集备、校际联合教研',
    examples: '上传主备稿、说课稿、共案修订记录、教学反思。',
    existingResources: [
      {
        title: '海南大学一体化建设首次集体备课活动举办',
        source: '海南大学马克思主义学院',
        date: '2025-05-26',
        url: 'https://mks.hainanu.edu.cn/info/1293/11232.htm',
      },
      {
        title: '海南大学10月集体备课活动举行',
        source: '海南大学马克思主义学院',
        date: '2024-10-10',
        url: 'https://mks.hainanu.edu.cn/info/1064/8102.htm',
      },
    ],
  },
  {
    column: '教学资源包',
    scene: '课件、任务单、评价量规、素材包',
    examples: '上传可直接复用的课堂素材，注明适用学段和课时建议。',
    existingResources: [
      {
        title: '教育部办公厅关于开展大中小学思政课一体化共同体建设的通知',
        source: '教育部',
        date: '2023-01-10',
        url: 'https://www.moe.gov.cn/srcsite/A13/moe_772/202301/t20230109_1038750.html',
      },
      {
        title: '思政课从“分段独奏”到“全程交响”',
        source: '教育部',
        date: '2025-11-06',
        url: 'https://www.moe.gov.cn/jyb_xwfb/xw_zt/moe_357/2025/2025_zt18/szqhjszyx/202511/t20251118_1420773.html',
      },
    ],
  },
  {
    column: '实践育人案例',
    scene: '红色研学、社会调查、主题实践',
    examples: '上传活动方案、学生作品与过程性评价证据。',
    existingResources: [
      {
        title: '南部片区“万名师生同讲海南故事”教学展示活动举行',
        source: '海南热带海洋学院',
        date: '2025-05-10',
        url: 'https://www.hntou.edu.cn/xwzx/xxyw/202505/t20250510_95835.html',
      },
      {
        title: '海南热带海洋学院推进高校与实践基地协同育人',
        source: '海南热带海洋学院',
        date: '2025-04-14',
        url: 'https://www.hntou.edu.cn/xwzx/xxyw/202504/t20250414_95174.html',
      },
    ],
  },
  {
    column: '教师发展专题',
    scene: '教学竞赛、示范课观摩、培训研修',
    examples: '上传竞赛成果、培训讲义和可复制的教研组织方式。',
    existingResources: [
      {
        title: '海南热带海洋学院区域联盟同题异构选拔赛举行',
        source: '海南热带海洋学院',
        date: '2025-06-22',
        url: 'https://www.hntou.edu.cn/xwzx/xywh/202506/t20250622_96980.html',
      },
      {
        title: '琼台师范学院区域联盟在同题异构比赛中获佳绩',
        source: '琼台师范学院',
        date: '2025-10-19',
        url: 'https://www.qtnu.edu.cn/info/1151/73851.htm',
      },
    ],
  },
  {
    column: '校地协同项目',
    scene: '高校-中小学-地方协同育人',
    examples: '上传联盟共建项目方案、阶段成果与推广建议。',
    existingResources: [
      {
        title: '海南省“大中小学思政课一体化共同体”工作交流研讨会在海师大召开',
        source: '海南师范大学',
        date: '2025-08-09',
        url: 'https://webplus.hainnu.edu.cn/_s3/2025/0809/c1648a157596/page.psp',
      },
      {
        title: '全国思政课战线集体备课会在海口举行',
        source: '海南师范大学',
        date: '2025-12-27',
        url: 'https://webplus.hainnu.edu.cn/_s3/2025/1227/c1648a162320/page.psp',
      },
    ],
  },
]

const ALLIANCE_SCHOOLS: AllianceSchoolEntry[] = [
  {
    name: '海南师范大学',
    role: '北部联盟牵头高校',
    logo: allianceHainnuLogo,
    logoSource: 'https://www.hainnu.edu.cn/_upload/tpl/00/11/17/template17/images/logo.svg',
    site: 'https://www.hainnu.edu.cn/',
  },
  {
    name: '海南大学',
    role: '西部联盟牵头高校',
    logo: allianceHainanuLogo,
    logoSource: 'https://mks.hainanu.edu.cn/dfiles/16222/home2021/imgs/logom2022.png',
    site: 'https://www.hainanu.edu.cn/',
  },
  {
    name: '海南热带海洋学院',
    role: '南部联盟牵头高校',
    logo: allianceHntouLogo,
    logoSource: 'https://www.hntou.edu.cn/images/logo.png',
    site: 'https://www.hntou.edu.cn/',
  },
  {
    name: '琼台师范学院',
    role: '东部联盟牵头高校',
    logo: allianceQtnuLogo,
    logoSource: 'https://www.qtnu.edu.cn/images/logo0801.png',
    site: 'https://www.qtnu.edu.cn/',
  },
]

const ALLIANCE_MILESTONES: AllianceMilestone[] = [
  {
    title: '目标同频',
    node: '省厅统筹 + 片区联动',
    desc: '以省级统筹目标为牵引，将课程目标、教研计划、实践任务分层落实到四大片区。',
  },
  {
    title: '教研同题',
    node: '同题异构 + 集体备课',
    desc: '围绕关键主题常态化开展跨学段同题异构、联合磨课与成果复盘，形成可复用教研模板。',
  },
  {
    title: '资源同享',
    node: '资源沉淀 + 评价闭环',
    desc: '按栏目沉淀优质课例与实践案例，配套咨询入口与反馈机制，推动联盟成果持续迭代。',
  },
]

const ALLIANCE_ACTIONS: AllianceActionEntry[] = [
  {
    title: '政策对标清单',
    detail: '先对齐教育部一体化建设要求，再映射到省级与片区执行任务，避免方向偏移。',
    actionLabel: '查看政策依据',
    url: 'https://www.moe.gov.cn/srcsite/A13/moe_772/202301/t20230109_1038750.html',
  },
  {
    title: '片区教研联动',
    detail: '以牵头高校为节点，按北部/西部/南部/东部片区推进同题异构、赛课与集备协同。',
    actionLabel: '查看片区动态',
    url: 'https://webplus.hainnu.edu.cn/_s3/2025/0809/c1648a157596/page.psp',
  },
  {
    title: '实践育人协同',
    detail: '将课堂教学、基地实践和社会议题结合，打通“课程-活动-评价”一体化链路。',
    actionLabel: '查看实践案例',
    url: 'https://www.hntou.edu.cn/xwzx/xxyw/202505/t20250510_95835.html',
  },
]

const ALLIANCE_UPLOAD_RESULT_TYPES = [
  '会议记录',
  '教案课件',
  '课堂实录',
  '说课评课',
  '集体备课纪要',
  '跨学段衔接案例',
] as const

const ALLIANCE_UPLOAD_TYPE_MAP: Record<(typeof ALLIANCE_UPLOAD_RESULT_TYPES)[number], string> = {
  会议记录: 'document',
  教案课件: 'document',
  课堂实录: 'video',
  说课评课: 'video',
  集体备课纪要: 'document',
  跨学段衔接案例: 'multimedia',
}

interface Material {
  id: number; title: string; type: string; stage: string[]; tags: { topic: string[]; emotion: string[]; knowledge: string[] }; desc: string
  source: string; sourceName: string; date: string; views: number; annotation: string
  period?: string; province?: string; isFtz?: boolean
}
const DATA: Material[] = rawData as Material[]

interface TextbookItem { stage: string; book: string; lesson: string }
interface CoreLiteracyItem { name: string; desc: string }
interface AppFilterState { q: string; st: string; tp: string; pv: string; rg: string; topic: string; ftzMode: boolean; allianceMode: boolean }
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

interface EvalDimension {
  name: string
  desc: string
}

interface EvalMethod {
  title: string
  scene: string
  actors: string
  evidence: string
  feedback: string
}

interface EvalStageScheme {
  stage: StageOption
  goal: string
  dimensions: EvalDimension[]
  evidence: string[]
  cadence: string
  evaluationMethods: EvalMethod[]
}

interface EvalTaskTemplate {
  id: string
  title: string
  summary: string
  dimension: string
  actions: string[]
  output: string
  recommendedEvidence: string[]
}

interface EvalRunResult {
  score: number
  level: string
  summary: string
  tips: string[]
  timestamp: string
}

const EVAL_CORE_PRINCIPLES = [
  {
    title: '多主体协同',
    desc: '教师评价、学生自评、同伴互评与家庭反馈共同参与，形成更完整的成长画像。',
  },
  {
    title: '过程性优先',
    desc: '以课堂表现、任务完成、项目产出等过程证据为核心，不只看一次终结性分数。',
  },
  {
    title: '关注成长',
    desc: '比较学生从起点到当前水平的变化，突出持续改进和个体进步。',
  },
  {
    title: '反馈可行动',
    desc: '每一次评价结果都要能转化为教学调整、学生改进和后续任务安排。',
  },
]

const EVAL_STAGE_SCHEMES: EvalStageScheme[] = [
  {
    stage: STAGE_OPTIONS[0],
    goal: '通过可观察行为培养学习兴趣、规则习惯和基础公民意识。',
    dimensions: [
      { name: '学习参与', desc: '关注度、参与度和表达意愿。' },
      { name: '合作与规则', desc: '小组协作、倾听分享和班级规则实践。' },
      { name: '价值启蒙', desc: '日常行动中的责任意识与集体意识。' },
    ],
    evidence: ['课堂观察记录', '学习单与作品', '活动照片或视频', '成长档案袋'],
    cadence: '每周反馈 + 单元小结 + 学期回顾',
    evaluationMethods: [
      {
        title: '课堂星级观察',
        scene: '适合低中年级课堂讨论、情境表演、规则养成活动。',
        actors: '教师主评，学生用贴纸或星卡完成自评。',
        evidence: '观察记录、星级卡、学习单、课堂照片。',
        feedback: '用一句肯定加一个小目标反馈，避免抽象分数化。',
      },
      {
        title: '成长档案袋',
        scene: '适合单元主题学习、红色故事绘本、劳动与责任实践。',
        actors: '学生收集作品，教师点评，家长补充家庭观察。',
        evidence: '绘画、手抄报、讲故事音视频、家校责任打卡页。',
        feedback: '按月挑选代表作品，形成“我进步了什么”的可视化记录。',
      },
      {
        title: '游戏化闯关评价',
        scene: '适合规则意识、文明礼仪、集体合作等启蒙主题。',
        actors: '小组互评与教师即时评价结合。',
        evidence: '闯关任务单、小组合作记录、奖励徽章。',
        feedback: '以徽章、口头鼓励和下一关任务引导持续参与。',
      },
    ],
  },
  {
    stage: STAGE_OPTIONS[1],
    goal: '发展概念理解、理性表达和真实情境中的参与能力。',
    dimensions: [
      { name: '知识建构', desc: '概念理解以及在情境中的迁移运用。' },
      { name: '理性表达', desc: '观点、证据与口头或书面表达质量。' },
      { name: '公共参与', desc: '围绕班级或社区议题的参与与反思。' },
    ],
    evidence: ['讨论记录', '探究报告', '同伴互评表', '反思日志'],
    cadence: '双周反馈 + 月度诊断 + 学期档案',
    evaluationMethods: [
      {
        title: '议题式表现评价',
        scene: '适合校园治理、网络文明、法治意识、生态保护等公共议题。',
        actors: '教师评价论证质量，学生开展自评与同伴互评。',
        evidence: '观点卡、证据清单、辩论记录、课堂追问记录。',
        feedback: '围绕“观点是否清楚、证据是否充分、表达是否尊重”给出等级反馈。',
      },
      {
        title: '社区微探究评价',
        scene: '适合把课堂概念迁移到社区观察、访谈和问卷任务。',
        actors: '学生小组互评，教师评价探究过程，社区或家长提供观察反馈。',
        evidence: '访谈提纲、问卷结果、调研报告、行动建议。',
        feedback: '用问题清单帮助学生修正研究方法和公共参与方式。',
      },
      {
        title: '反思日志评价',
        scene: '适合价值辨析、青春成长、责任担当等需要持续内化的主题。',
        actors: '学生自评为主，教师进行周期性批注。',
        evidence: '双周反思日志、学习目标达成记录、同伴建议。',
        feedback: '关注观点变化和行为改进，形成月度成长摘要。',
      },
    ],
  },
  {
    stage: STAGE_OPTIONS[2],
    goal: '提升核心素养、跨学科整合能力与社会责任意识。',
    dimensions: [
      { name: '核心素养', desc: '问题分析、系统思维与价值判断。' },
      { name: '综合实践', desc: '项目设计、资料研究与公开展示。' },
      { name: '自主成长', desc: '目标管理、策略运用与迭代改进。' },
    ],
    evidence: ['项目成果', '研究档案', '展示答辩记录', '成长曲线'],
    cadence: '单元反馈 + 阶段评价 + 年度发展报告',
    evaluationMethods: [
      {
        title: '项目化学习评价',
        scene: '适合自贸港建设、生态文明、科技创新、红色文化研究等综合主题。',
        actors: '教师评价研究质量，小组成员互评贡献，学生完成自评复盘。',
        evidence: '项目计划书、资料卡、阶段成果、最终报告。',
        feedback: '按“问题意识、证据整合、价值判断、行动方案”形成量规反馈。',
      },
      {
        title: '展示答辩评价',
        scene: '适合阶段成果展示、同题异构汇报、跨学科探究汇报。',
        actors: '教师、同伴和外部嘉宾共同评价。',
        evidence: 'PPT、答辩记录、追问回应、展示录像。',
        feedback: '突出逻辑表达、证据回应和现场修正能力，给出下一轮迭代建议。',
      },
      {
        title: '成长数据画像',
        scene: '适合高一到高三持续跟踪核心素养与自主学习能力。',
        actors: '学生维护个人数据，教师定期诊断，班主任协同跟进。',
        evidence: '阶段测评、任务完成率、成长曲线、行动清单。',
        feedback: '将结果转化为个人改进计划，支持分层指导和升学发展规划。',
      },
    ],
  },
  {
    stage: STAGE_OPTIONS[3],
    goal: '对接专业能力、创新能力和社会贡献，形成面向真实问题的综合评价。',
    dimensions: [
      { name: '专业融合', desc: '在专业任务中融入价值理解与社会认知。' },
      { name: '创新研究', desc: '问题界定、方法选择与成果质量。' },
      { name: '实践责任', desc: '服务学习、实习实践与团队贡献。' },
    ],
    evidence: ['课程项目或论文', '实践或实习评价', '团队贡献记录', '电子档案袋'],
    cadence: '课程反馈 + 学期成果复盘 + 年度评价',
    evaluationMethods: [
      {
        title: '课程项目制评价',
        scene: '适合专业课程融入思政、社会问题研究、创新创业项目。',
        actors: '任课教师、团队成员和学生本人共同评价。',
        evidence: '项目方案、研究论文、数据材料、版本迭代记录。',
        feedback: '强调专业能力、价值判断和解决真实问题的综合质量。',
      },
      {
        title: '服务学习评价',
        scene: '适合乡村振兴、社区服务、红色文化传播、志愿讲解等实践活动。',
        actors: '实践导师、服务对象、团队成员和学生共同参与。',
        evidence: '服务日志、对象反馈、实践报告、社会影响记录。',
        feedback: '从服务成效、伦理责任、团队贡献和反思深度四方面反馈。',
      },
      {
        title: '同行与行业反馈',
        scene: '适合毕业设计、实习实践、创新竞赛和公开路演。',
        actors: '教师评价基础质量，同行互评可行性，行业导师评价真实适配度。',
        evidence: '路演记录、专家意见、实习评价、作品集。',
        feedback: '将评价意见沉淀为作品集修订清单和职业发展建议。',
      },
    ],
  },
]

const EVAL_TEMPLATE_BANK: Record<StageOption, EvalTaskTemplate[]> = {
  [STAGE_OPTIONS[0]]: [
    {
      id: 'primary-class-citizen',
      title: '班级规则小任务',
      summary: '围绕规则意识设计 15 分钟观察任务。',
      dimension: '合作与规则',
      actions: ['展示一个情境案例', '小组提出三条班级规则', '每组说明一条可执行规则'],
      output: '生成一张班级规则观察表，用于一周跟踪。',
      recommendedEvidence: ['课堂观察记录', '学习单与作品'],
    },
    {
      id: 'primary-home-school',
      title: '家校责任打卡',
      summary: '把课堂价值引导延伸到家庭实践记录。',
      dimension: '价值启蒙',
      actions: ['学生记录一次周内责任行动', '家长写一句反馈', '班级分享并完成反思'],
      output: '将责任实践页纳入成长档案袋。',
      recommendedEvidence: ['成长档案袋', '活动照片或视频'],
    },
  ],
  [STAGE_OPTIONS[1]]: [
    {
      id: 'junior-debate',
      title: '议题辩论任务',
      summary: '围绕校园公共议题开展结构化辩论。',
      dimension: '理性表达',
      actions: ['正反双方各提供三条证据', '辩论后开展同伴互评', '教师点评证据质量'],
      output: '形成“观点-证据-反思”学习单。',
      recommendedEvidence: ['讨论记录', '同伴互评表'],
    },
    {
      id: 'junior-community',
      title: '社区微调研',
      summary: '将课堂学习应用到一个真实本地公共议题。',
      dimension: '公共参与',
      actions: ['选择一个议题', '完成三次访谈或问卷', '展示一份行动建议'],
      output: '提交反思日志和简版调研报告。',
      recommendedEvidence: ['探究报告', '反思日志'],
    },
  ],
  [STAGE_OPTIONS[2]]: [
    {
      id: 'high-research',
      title: '研究项目冲刺',
      summary: '完成一个跨学科微型研究项目。',
      dimension: '综合实践',
      actions: ['明确问题与角色分工', '检索并整合证据', '进行公开答辩与追问'],
      output: '形成项目报告和答辩记录。',
      recommendedEvidence: ['项目成果', '展示答辩记录'],
    },
    {
      id: 'high-growth',
      title: '成长诊断闭环',
      summary: '依据过程数据确定下一轮学习行动。',
      dimension: '自主成长',
      actions: ['复盘阶段数据', '自评策略有效性', '设定两条可执行改进措施'],
      output: '生成个人成长曲线和行动清单。',
      recommendedEvidence: ['成长曲线', '研究档案'],
    },
  ],
  [STAGE_OPTIONS[3]]: [
    {
      id: 'college-practice',
      title: '实践影响评价',
      summary: '结合角色证据和影响证据评价社会实践。',
      dimension: '实践责任',
      actions: ['明确服务对象与时间线', '跟踪个人角色贡献', '撰写效果与改进说明'],
      output: '形成实践报告和团队贡献快照。',
      recommendedEvidence: ['实践或实习评价', '团队贡献记录'],
    },
    {
      id: 'college-innovation',
      title: '创新提案迭代',
      summary: '围绕真实问题构建并迭代解决方案。',
      dimension: '创新研究',
      actions: ['界定问题与方法路径', '提交多轮迭代稿', '完成最终路演与复盘'],
      output: '提交项目包和版本迭代记录。',
      recommendedEvidence: ['课程项目或论文', '电子档案袋'],
    },
  ],
}

const EVAL_LEVEL_RULES = [
  { min: 90, level: 'A 优秀', tip: '表现稳定且质量较高，可进入迁移提升任务。' },
  { min: 80, level: 'B 良好', tip: '基础较扎实，建议增加挑战性任务。' },
  { min: 70, level: 'C 达标', tip: '达到基本要求，下一步聚焦薄弱点改进。' },
  { min: 60, level: 'D 待提升', tip: '部分指标低于目标，需要教师提供结构化练习支持。' },
  { min: 0, level: 'E 重点支持', tip: '建议建立“一生一策”跟进方案。' },
]

const EVAL_IMPLEMENTATION_STEPS = [
  '从课程目标中提取可观察、可记录、可反馈的评价指标。',
  '设计课堂、项目、展示等分层任务，覆盖不同学习表现。',
  '汇集教师、学生、同伴与家庭侧证据，形成多主体评价数据。',
  '生成诊断结果与针对性改进建议，避免只给分不反馈。',
  '定期复盘评价数据，并据此更新教学策略与学习支持。',
]

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
        <div className="stage-gate-eyebrow">海南思政教育智慧资源平台</div>
        <h1 className="stage-gate-title">选择学段，进入欢迎页</h1>
        <p className="stage-gate-sub">选择学段后，将进入欢迎页，再由欢迎页选择资源库、专题或多元评价入口。</p>
        <div className="stage-gate-grid">
          {stageCounts.map(({ stage, count }) => (
            <button
              key={stage}
              className={`stage-gate-item ${selectedStage === stage ? 'active' : ''}`}
              onClick={() => onSelectStage(stage)}
            >
              <span className="stage-gate-name">{stage}</span>
              <span className="stage-gate-count">{count} 条素材</span>
            </button>
          ))}
        </div>
        <div className="stage-gate-actions">
          <button className="stage-gate-primary" onClick={onContinue}>
            进入{selectedStage}欢迎页
          </button>
          <button className="stage-gate-guest" onClick={onGuest}>
            游客模式（全学段）
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
  onEnterEvaluation,
  onBackToStage,
  guestMode,
  selectedStage,
}: {
  onEnter: () => void
  onEnterFtz: () => void
  onEnterAlliance: () => void
  onEnterEvaluation: () => void
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
        <div className="splash-school-ribbon" aria-label="联盟学校校徽">
          {ALLIANCE_SCHOOLS.map((school) => (
            <a
              key={`splash-${school.name}`}
              className="splash-school-chip"
              href={school.site}
              target="_blank"
              rel="noopener noreferrer"
              title={school.name}
            >
              <span className="splash-school-logo-wrap">
                <img className="splash-school-logo" src={school.logo} alt={`${school.name}校徽`} loading="lazy" />
              </span>
              <span>{school.name}</span>
            </a>
          ))}
        </div>
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
          <button className="splash-eval-btn" onClick={onEnterEvaluation}>🧩 学生多元评价体系入口 →</button>
          <button className="splash-stage-switch" onClick={onBackToStage}>切换学段/游客模式</button>
        </div>
        <div className="splash-bottom-line" />
      </div>
    </div>
  )
}

function DiverseEvaluationPage({
  onBackToSplash,
  onBackToStage,
  onGoToLibrary,
  onSelectStage,
  guestMode,
  selectedStage,
}: {
  onBackToSplash: () => void
  onBackToStage: () => void
  onGoToLibrary: () => void
  onSelectStage: (stage: StageOption) => void
  guestMode: boolean
  selectedStage: string
}) {
  const initialStage = useMemo(
    () => normalizeStage(selectedStage) as StageOption,
    [selectedStage],
  )
  const [activeStage, setActiveStage] = useState<StageOption>(initialStage)
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([])
  const [activeDimension, setActiveDimension] = useState('')
  const [appliedTemplateId, setAppliedTemplateId] = useState('')
  const [teacherScore, setTeacherScore] = useState(82)
  const [selfScore, setSelfScore] = useState(78)
  const [peerScore, setPeerScore] = useState(80)
  const [runResult, setRunResult] = useState<EvalRunResult | null>(null)

  useEffect(() => {
    setActiveStage(initialStage)
  }, [initialStage])

  const activeScheme = useMemo(
    () => EVAL_STAGE_SCHEMES.find((scheme) => scheme.stage === activeStage) ?? EVAL_STAGE_SCHEMES[0],
    [activeStage],
  )

  const activeTemplates = useMemo(
    () => EVAL_TEMPLATE_BANK[activeStage] ?? [],
    [activeStage],
  )

  useEffect(() => {
    setActiveDimension(activeScheme.dimensions[0]?.name ?? '')
    setSelectedEvidence([])
    setAppliedTemplateId('')
    setRunResult(null)
  }, [activeScheme])

  const activeDimensionInfo = useMemo(
    () => activeScheme.dimensions.find((dimension) => dimension.name === activeDimension) ?? activeScheme.dimensions[0],
    [activeDimension, activeScheme],
  )

  const appliedTemplate = useMemo(
    () => activeTemplates.find((template) => template.id === appliedTemplateId) ?? null,
    [activeTemplates, appliedTemplateId],
  )

  const toggleEvidence = (item: string) => {
    setSelectedEvidence((prev) =>
      prev.includes(item) ? prev.filter((entry) => entry !== item) : [...prev, item],
    )
  }

  const applyTemplate = (template: EvalTaskTemplate) => {
    setAppliedTemplateId(template.id)
    if (activeScheme.dimensions.some((dimension) => dimension.name === template.dimension)) {
      setActiveDimension(template.dimension)
    }
    const matchedEvidence = template.recommendedEvidence.filter((entry) => activeScheme.evidence.includes(entry))
    const defaultEvidence = activeScheme.evidence.slice(0, Math.min(3, activeScheme.evidence.length))
    setSelectedEvidence(matchedEvidence.length > 0 ? matchedEvidence : defaultEvidence)
    setRunResult(null)
  }

  const runEvaluationDemo = () => {
    const weightedScore = teacherScore * 0.5 + selfScore * 0.25 + peerScore * 0.25
    const evidenceBonus = Math.min(selectedEvidence.length * 2, 10)
    const finalScore = Math.min(100, Math.round(weightedScore + evidenceBonus))
    const levelRule = EVAL_LEVEL_RULES.find((rule) => finalScore >= rule.min) ?? EVAL_LEVEL_RULES[EVAL_LEVEL_RULES.length - 1]

    const tips: string[] = []
    if (teacherScore < 70) tips.push('教师评价偏低：建议将任务拆分为示范练习与展示表达两个环节。')
    if (selfScore < 70) tips.push('学生自评偏低：建议加入每周反思卡，并要求写明具体证据。')
    if (peerScore < 70) tips.push('同伴互评偏低：建议先展示评价量规样例，再组织互评。')
    if (selectedEvidence.length < 2) tips.push('过程证据不足：请至少选择两类过程性证据。')
    if (activeDimensionInfo) {
      tips.push(`当前维度：${activeDimensionInfo.name} - ${activeDimensionInfo.desc}`)
    }
    if (tips.length === 0) {
      tips.push('当前表现稳定，可增加迁移应用任务提升挑战度。')
    }

    setRunResult({
      score: finalScore,
      level: levelRule.level,
      summary: `加权得分 ${Math.round(weightedScore)}，过程证据加分 ${evidenceBonus}。${levelRule.tip}`,
      tips: tips.slice(0, 4),
      timestamp: new Date().toLocaleString(),
    })
  }

  const handleStageTab = (stage: StageOption) => {
    setActiveStage(stage)
    onSelectStage(stage)
  }

  return (
    <div className="eval-page">
      <section className="eval-hero">
        <div className="eval-hero-badge">多元评价系统</div>
        <h1 className="eval-hero-title">{activeStage}多元评价首页</h1>
        <p className="eval-hero-sub">
          当前模式：{guestMode ? '游客模式（可切换全学段）' : `学段模式（${activeStage}）`}。
          本页支持学段切换、维度选择、证据勾选、任务模板套用与即时评分演示。
        </p>
        <div className="eval-stage-tabs" role="tablist" aria-label="stage tabs">
          {STAGE_OPTIONS.map((stage) => (
            <button
              key={stage}
              type="button"
              role="tab"
              className={`eval-stage-tab ${activeStage === stage ? 'active' : ''}`}
              onClick={() => handleStageTab(stage as StageOption)}
              aria-selected={activeStage === stage}
            >
              {stage}
            </button>
          ))}
        </div>
        <div className="eval-hero-actions">
          <button className="eval-action-primary" onClick={onGoToLibrary}>进入资源库</button>
          <button className="eval-action-secondary" onClick={onBackToSplash}>返回欢迎页</button>
          <button className="eval-action-secondary" onClick={onBackToStage}>切换学段/模式</button>
        </div>
      </section>

      <section className="eval-section">
        <h2 className="eval-section-title">学段画像</h2>
        <div className="eval-current-grid">
          <article className="eval-stage-summary">
            <h3>{activeScheme.stage}评价目标</h3>
            <p>{activeScheme.goal}</p>
            <div className="eval-cadence-chip">评价节奏：{activeScheme.cadence}</div>
            <div className="eval-dimension-grid">
              {activeScheme.dimensions.map((dimension) => (
                <button
                  key={dimension.name}
                  type="button"
                  className={`eval-dimension-btn ${activeDimension === dimension.name ? 'active' : ''}`}
                  onClick={() => setActiveDimension(dimension.name)}
                >
                  <strong>{dimension.name}</strong>
                  <span>{dimension.desc}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="eval-evidence-panel">
            <h3>证据清单</h3>
            <div className="eval-evidence-list">
              {activeScheme.evidence.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`eval-evidence-chip ${selectedEvidence.includes(item) ? 'active' : ''}`}
                  onClick={() => toggleEvidence(item)}
                >
                  {selectedEvidence.includes(item) ? '已选择' : '选择'}：{item}
                </button>
              ))}
            </div>
            <p className="eval-evidence-tip">已选择 {selectedEvidence.length} 类证据，建议至少选择两类。</p>
          </article>
        </div>
      </section>

      <section className="eval-section">
        <h2 className="eval-section-title">多元评价方式</h2>
        <div className="eval-method-grid">
          {activeScheme.evaluationMethods.map((method) => (
            <article key={method.title} className="eval-method-card">
              <div className="eval-method-head">
                <h3>{method.title}</h3>
                <span>{activeScheme.stage}</span>
              </div>
              <p className="eval-method-scene">{method.scene}</p>
              <dl className="eval-method-list">
                <div>
                  <dt>评价主体</dt>
                  <dd>{method.actors}</dd>
                </div>
                <div>
                  <dt>证据材料</dt>
                  <dd>{method.evidence}</dd>
                </div>
                <div>
                  <dt>反馈方式</dt>
                  <dd>{method.feedback}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="eval-section">
        <h2 className="eval-section-title">任务模板</h2>
        <div className="eval-template-grid">
          {activeTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`eval-template-card ${appliedTemplateId === template.id ? 'active' : ''}`}
              onClick={() => applyTemplate(template)}
            >
              <span className="eval-template-title">{template.title}</span>
              <span className="eval-template-summary">{template.summary}</span>
              <span className="eval-template-dimension">评价维度：{template.dimension}</span>
            </button>
          ))}
        </div>

        {appliedTemplate ? (
          <div className="eval-template-output">
            <h3>已套用模板：{appliedTemplate.title}</h3>
            <ul>
              {appliedTemplate.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
            <p><strong>产出要求：</strong> {appliedTemplate.output}</p>
          </div>
        ) : (
          <div className="eval-template-empty">点击任一模板，将自动关联评价维度与推荐证据。</div>
        )}
      </section>

      <section className="eval-section">
        <h2 className="eval-section-title">运行评价演示</h2>
        <div className="eval-run-grid">
          <div className="eval-run-controls">
            <label className="eval-slider-row">
              教师评价：<span>{teacherScore}</span>
              <input type="range" min={0} max={100} value={teacherScore} onChange={(event) => setTeacherScore(Number(event.target.value))} />
            </label>
            <label className="eval-slider-row">
              学生自评：<span>{selfScore}</span>
              <input type="range" min={0} max={100} value={selfScore} onChange={(event) => setSelfScore(Number(event.target.value))} />
            </label>
            <label className="eval-slider-row">
              同伴互评：<span>{peerScore}</span>
              <input type="range" min={0} max={100} value={peerScore} onChange={(event) => setPeerScore(Number(event.target.value))} />
            </label>
            <button type="button" className="eval-run-btn" onClick={runEvaluationDemo}>生成评价结果</button>
          </div>

          <div className="eval-run-result">
            {runResult ? (
              <>
                <div className="eval-result-head">
                  <strong>综合得分：{runResult.score}</strong>
                  <span>{runResult.level}</span>
                </div>
                <p>{runResult.summary}</p>
                <ul>
                  {runResult.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
                <div className="eval-result-time">生成时间：{runResult.timestamp}</div>
              </>
            ) : (
              <div className="eval-result-empty">拖动滑块并点击生成评价结果，即可获得可执行反馈。</div>
            )}
          </div>
        </div>
      </section>

      <section className="eval-section">
        <h2 className="eval-section-title">核心原则</h2>
        <div className="eval-principle-grid">
          {EVAL_CORE_PRINCIPLES.map((item) => (
            <article key={item.title} className="eval-principle-card">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="eval-section eval-section-note">
        <h2 className="eval-section-title">实施步骤</h2>
        <ol className="eval-step-list">
          {EVAL_IMPLEMENTATION_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  )
}


function UploadModal({ scene, onClose, onAdd }: { scene: UploadScene; onClose: () => void; onAdd: (m: Material) => void }) {
  const allianceScene = scene === 'alliance_same_class'
  const [title, setTitle] = useState(allianceScene ? '【同课异构】' : '')
  const [type, setType] = useState(allianceScene ? 'document' : 'document')
  const [period, setPeriod] = useState('现当代')
  const [province, setProvince] = useState('海南省')
  const [stage, setStage] = useState<string[]>(allianceScene ? [...STAGE_OPTIONS] : ['高中'])
  const [topicStr, setTopicStr] = useState(allianceScene ? '同课异构 思政课一体化 区域联盟' : '')
  const [emotionStr, setEmotionStr] = useState('')
  const [knowledgeStr, setKnowledgeStr] = useState('')
  const [desc, setDesc] = useState(allianceScene ? '用于上传大中小学思政课“同课异构”成果（会议记录、教案课件、课堂实录等）。' : '')
  const [contentDetail, setContentDetail] = useState('')
  const [source, setSource] = useState(allianceScene ? '区域联盟共建上传' : '')
  const [annotation, setAnnotation] = useState('')
  const [allianceResultType, setAllianceResultType] = useState<(typeof ALLIANCE_UPLOAD_RESULT_TYPES)[number]>('会议记录')
  const [saved, setSaved] = useState(false)

  const toggleStage = (s: string) => setStage(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s])

  const handleSubmit = () => {
    if(!title.trim()) { alert('请填写标题'); return }
    const topicTags = topicStr.split(/[，,\s]+/).filter(Boolean)
    if (allianceScene) {
      topicTags.push('同课异构', '思政课一体化', '区域联盟', allianceResultType)
    }
    const newMat: Material = {
      id: Date.now(),
      title: title.trim(),
      type,
      stage: stage.length ? stage : ['高中'],
      tags: {
        topic: Array.from(new Set(topicTags)),
        emotion: emotionStr.split(/[，,\s]+/).filter(Boolean),
        knowledge: knowledgeStr.split(/[，,\s]+/).filter(Boolean),
      },
      desc: desc.trim() || (allianceScene ? `大中小学思政课“同课异构”${allianceResultType}成果。` : title.trim()),
      source: source.trim() || (allianceScene ? '区域联盟共建上传' : '自主上传'),
      sourceName: source.trim() || (allianceScene ? '区域联盟上传' : '用户上传'),
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
        <h2 className="modal-title" style={{fontSize:'18px'}}>
          {allianceScene ? '📤 上传大中小学思政课“同课异构”成果' : '📤 上传新素材'}
        </h2>
        {allianceScene && (
          <div className="upload-scene-tip">
            当前为区域联盟专用入口，请上传同课异构成果，如会议记录、教案课件、课堂实录等。
          </div>
        )}
        <div className="upload-form">
          <div className="uf-row">
            <label className="uf-label">素材标题 <span style={{color:'#dc2626'}}>*</span></label>
            <input
              className="uf-input"
              placeholder={allianceScene ? '如：【同课异构】“诚信”主题跨学段教学设计与课堂实录' : '如：琼崖革命精神与海南经济社会发展'}
              value={title}
              onChange={e=>setTitle(e.target.value)}
            />
          </div>
          {allianceScene && (
            <div className="uf-row">
              <label className="uf-label">同课异构成果类别</label>
              <div className="uf-radio-row">
                {ALLIANCE_UPLOAD_RESULT_TYPES.map((item) => (
                  <label
                    key={item}
                    className={`uf-radio${allianceResultType===item?' active':''}`}
                    onClick={() => {
                      setAllianceResultType(item)
                      setType(ALLIANCE_UPLOAD_TYPE_MAP[item] || 'document')
                    }}
                  >
                    {item}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="uf-row">
            <label className="uf-label">素材类型</label>
            <div className="uf-radio-row">
              {['document','video','image','audio','multimedia'].map(t=>(
                <label key={t} className={`uf-radio${type===t?' active':''}`} onClick={()=>setType(t)}>{TICO[t]||'📄'} {TYPE_LABELS[t] || t}</label>
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
  const [aiActionMessage, setAiActionMessage] = useState('')

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
    window.open(url, '_blank', 'noopener,noreferrer')
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
  const knowledgeText = (m.tags?.knowledge || []).join('、')
  const currentPlanText = aiText || m.annotation || '暂无教学建议'
  const deepSeekPrompt = useMemo(() => `请你扮演一位资深思政教育专家。请为以下思政课素材优化或扩展一份更完整的AI辅助教学方案：

【素材标题】${m.title}
【内容简介】${m.desc}
【知识点】${knowledgeText || '暂无'}
【现有教学建议】${currentPlanText}

请以此为基础，生成一份更详细、更专业的思政课AI辅助教学方案，包括：教学目标、教学重难点、教学过程设计（含导入、新授、巩固练习环节）、板书设计、作业布置、教学反思等完整环节。格式清晰，分模块详细阐述，适合中小学思政课教师直接使用。`, [m.title, m.desc, knowledgeText, currentPlanText])

  const setAiToast = useCallback((message: string) => {
    setAiActionMessage(message)
    window.setTimeout(() => setAiActionMessage(''), 2200)
  }, [])

  const copyText = useCallback(async (text: string, successMessage: string) => {
    const payload = text.trim()
    if (!payload) {
      setAiToast('暂无可复制内容')
      return
    }
    try {
      await navigator.clipboard.writeText(payload)
      setAiToast(successMessage)
      return
    } catch {
      // fallback for restricted clipboard environments
      const textarea = document.createElement('textarea')
      textarea.value = payload
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      setAiToast(copied ? successMessage : '复制失败，请手动复制')
    }
  }, [setAiToast])

  const openMainDeepSeek = useCallback(() => {
    const url = `/deepseek.html?title=${encodeURIComponent(m.title)}&desc=${encodeURIComponent(m.desc)}&knowledge=${encodeURIComponent(knowledgeText)}&discipline=${encodeURIComponent('AI教学方案优化')}&prompt=${encodeURIComponent(deepSeekPrompt)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [m.title, m.desc, knowledgeText, deepSeekPrompt])

  const copyPlan = useCallback(() => {
    void copyText(currentPlanText, '方案已复制，可直接粘贴到教案中')
  }, [copyText, currentPlanText])

  const copyPrompt = useCallback(() => {
    void copyText(deepSeekPrompt, '提示词已复制，去 DeepSeek 可直接发送')
  }, [copyText, deepSeekPrompt])

  const planCharCount = currentPlanText.replace(/\s+/g, '').length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header">
          <span className="type-badge-lg" style={{background:`${pct}22`,color:pct}}>{TICO[m.type]||'📄'} {TYPE_LABELS[m.type] || m.type}</span>
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
          ) : <div className="ai-plan" data-live={isLive}>{currentPlanText}</div>}
          <div className="ai-meta-row">
            <span className="ai-meta-chip">{isLive ? '实时生成' : '预存方案'}</span>
            <span className="ai-meta-chip">约 {planCharCount} 字</span>
            <span className="ai-meta-chip">学段：{(m.stage || []).join(' / ') || '全学段'}</span>
          </div>
          <div className="copy-hint">💡 提示：点击下方「→ DeepSeek 优化教学方案」按钮，跳转页面已自动复制提示词，打开 DeepSeek 对话框后直接粘贴发送即可获得完整教学方案</div>
          <div className="ai-actions">
            <button className="regen-btn" onClick={e => { e.stopPropagation(); setRegenKey(k => k+1) }}>🔄 重新生成</button>
            <button className="regen-btn ai-copy-btn" onClick={e => { e.stopPropagation(); copyPlan() }}>📄 复制方案</button>
            <button className="regen-btn ai-copy-btn" onClick={e => { e.stopPropagation(); copyPrompt() }}>🧩 复制提示词</button>
            <button className="regen-btn deepseek-btn" onClick={e => {
              e.stopPropagation()
              openMainDeepSeek()
            }}>🔗 → DeepSeek 优化教学方案</button>
          </div>
          {aiActionMessage && <div className="ai-action-status">{aiActionMessage}</div>}
          <details className="ai-prompt-details">
            <summary>查看将发送到 DeepSeek 的提示词</summary>
            <pre>{deepSeekPrompt}</pre>
          </details>
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
                          window.open(url, '_blank', 'noopener,noreferrer')
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
  const [evaluationOpened, setEvaluationOpened] = useState(false)
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
  const [topic, setTopic] = useState(() => typeof initialFilters.topic === 'string' ? initialFilters.topic : '')
  const [selected, setSelected] = useState<Material|null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadScene, setUploadScene] = useState<UploadScene>('general')
  const [showShare, setShowShare] = useState(false)
  const [uploadedMats, setUploadedMats] = useState<Material[]>(() => {
    try { return JSON.parse(localStorage.getItem('uploaded_materials')||'[]') } catch { return [] }
  })
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
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
    const payload: AppFilterState = { q, st, tp, pv, rg, topic, ftzMode, allianceMode }
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload))
  }, [q, st, tp, pv, rg, topic, ftzMode, allianceMode])

  useEffect(() => {
    const payload: EntryState = { stage: selectedStage, guestMode }
    localStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(payload))
  }, [selectedStage, guestMode])

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode)
    document.body.classList.toggle('theme-dark', themeMode === 'dark')
    document.body.style.colorScheme = themeMode
    return () => {
      document.body.classList.remove('theme-dark')
      document.body.style.colorScheme = ''
    }
  }, [themeMode])

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
      const matchTopic = !topic || (m.tags?.topic || []).includes(topic)
      // 专题模式隐藏省份/大区过滤器
      const lockRegionFilter = ftzMode || allianceMode
      const matchPv = lockRegionFilter ? true : (!pv || (m.province||'') === pv)
      const matchRg = lockRegionFilter ? true : (!rg || (() => { const p = m.province||''; const g = Object.entries(REGION_GROUPS).find(([,ps])=>ps.includes(p))?.[0]; return g === rg })())
      return matchSelectedStage && matchQ && matchS && matchT && matchTopic && matchPv && matchRg
    })
  }, [uploadedMats, q, st, tp, pv, rg, topic, ftzMode, allianceMode, guestMode, selectedStage])
  const allianceStageCoverage = useMemo(() => {
    const covered = new Set<string>()
    list.forEach((material) => {
      ;(material.stage || []).forEach((stage) => {
        if ((STAGE_OPTIONS as readonly string[]).includes(stage)) {
          covered.add(stage)
        }
      })
    })
    return covered.size
  }, [list])
  const allianceUploadedCount = useMemo(
    () => uploadedMats.filter(isAllianceMaterial).length,
    [uploadedMats]
  )

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
  const availableProvinceOptions = useMemo(() => (rg ? REGION_GROUPS[rg] || [] : []), [rg])
  useEffect(() => {
    if (pv && (!rg || !availableProvinceOptions.includes(pv))) {
      setPv('')
      setPage(1)
    }
  }, [availableProvinceOptions, pv, rg])
  const provinceDistribution = useMemo(() => {
    const provinceCount: Record<string, number> = {}
    list.forEach((material) => {
      const provinceName = material.province || '全国'
      provinceCount[provinceName] = (provinceCount[provinceName] || 0) + 1
    })
    const top10 = Object.entries(provinceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count], index) => ({
        name,
        count,
        rank: index + 1,
        percent: list.length > 0 ? Math.round((count / list.length) * 100) : 0,
      }))
    return {
      top10,
      coveredProvinceCount: Object.keys(provinceCount).length,
      selectedCount: pv ? provinceCount[pv] || 0 : 0,
    }
  }, [list, pv])
  const apiStatusLabel = apiStatus === 'online' ? 'API 在线' : apiStatus === 'offline' ? 'API 离线' : 'API 检查中'
  const showReset = Boolean(q || tp || pv || rg || topic || (guestMode && st))
  const handleLuckyPick = useCallback(() => {
    if (!list.length) return
    const random = list[Math.floor(Math.random() * list.length)]
    setSelected(random)
  }, [list])
  const handleSidebarStageClick = useCallback((stage: string) => {
    if (!guestMode) {
      setGuestMode(true)
      setSt(stage)
      setPage(1)
      return
    }
    setSt(st === stage ? '' : stage)
    setPage(1)
  }, [guestMode, st])

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
          setEvaluationOpened(false)
          setEntered(false)
          setFtzMode(false)
          setAllianceMode(false)
        }}
        onGuest={() => {
          setGuestMode(true)
          setSt('')
          setStageConfirmed(true)
          setEvaluationOpened(false)
          setEntered(false)
          setFtzMode(false)
          setAllianceMode(false)
        }}
      />
    )
  }

  if (evaluationOpened) {
    return (
      <DiverseEvaluationPage
        onBackToSplash={() => {
          setEvaluationOpened(false)
          setEntered(false)
          setFtzMode(false)
          setAllianceMode(false)
        }}
        onBackToStage={() => {
          setEvaluationOpened(false)
          setStageConfirmed(false)
          setEntered(false)
          setFtzMode(false)
          setAllianceMode(false)
        }}
        onGoToLibrary={() => {
          setEvaluationOpened(false)
          setEntered(true)
          setFtzMode(false)
          setAllianceMode(false)
        }}
        onSelectStage={(stage) => {
          const normalizedStage = normalizeStage(stage)
          setSelectedStage(normalizedStage)
          if (!guestMode) {
            setSt(normalizedStage)
          }
        }}
        guestMode={guestMode}
        selectedStage={selectedStage}
      />
    )
  }

  if (!entered) {
    return (
      <Splash
        onEnter={() => {
          setEvaluationOpened(false)
          setEntered(true)
          setFtzMode(false)
          setAllianceMode(false)
        }}
        onEnterFtz={() => {
          setEvaluationOpened(false)
          setEntered(true)
          setFtzMode(true)
          setAllianceMode(false)
        }}
        onEnterAlliance={() => {
          setEvaluationOpened(false)
          setEntered(true)
          setFtzMode(false)
          setAllianceMode(true)
        }}
        onEnterEvaluation={() => {
          setEvaluationOpened(true)
          setEntered(false)
          setFtzMode(false)
          setAllianceMode(false)
        }}
        onBackToStage={() => {
          setEvaluationOpened(false)
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
    <div className={`app${ftzMode ? ' app-ftz' : ''}${allianceMode ? ' app-alliance' : ''}`}>
      {selected && <DetailModal m={selected} onClose={()=>setSelected(null)} />}
      {showUpload && (
        <UploadModal
          scene={uploadScene}
          onClose={() => {
            setShowUpload(false)
            setUploadScene('general')
          }}
          onAdd={(m)=>{
            setUploadedMats(prev=>[...prev,m])
            setShowUpload(false)
            setUploadScene('general')
            setEntered(true)
          }}
        />
      )}
      {showShare && <ShareBoardModal onClose={()=>setShowShare(false)} />}

      {/* Top bar */}
      <div className={`topbar${ftzMode ? ' topbar-ftz' : ''}${allianceMode ? ' topbar-alliance' : ''}`}>
        <div className="topbar-brand">
          <span className="topbar-logo">🏝️</span>
          <span className="topbar-name">{sectionTitle}</span>
          <span className="entry-mode-pill">{guestMode ? '游客模式' : `学段：${selectedStage}`}</span>
        </div>
        <div className="topbar-emblem-strip" aria-label="联盟学校校徽导航">
          {ALLIANCE_SCHOOLS.map((school) => (
            <a
              key={`topbar-${school.name}`}
              className="topbar-emblem-item"
              href={school.site}
              target="_blank"
              rel="noopener noreferrer"
              title={school.name}
            >
              <img className="topbar-emblem-logo" src={school.logo} alt={`${school.name}校徽`} loading="lazy" />
            </a>
          ))}
        </div>
        <div className="topbar-tools">
          <button className="topbar-lucky-btn" onClick={handleLuckyPick} disabled={list.length === 0}>🎲 随机一条</button>
          <button
            className={`topbar-theme-btn${themeMode === 'dark' ? ' is-dark' : ''}`}
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            aria-label={themeMode === 'dark' ? '切换浅色模式' : '切换深色模式'}
            title={themeMode === 'dark' ? '切换浅色模式' : '切换深色模式'}
          >
            {themeMode === 'dark' ? '☀ 浅色' : '🌙 深色'}
          </button>
          <span className={`api-pill ${apiStatus}`}>{apiStatusLabel}</span>
        </div>
        <button className="topbar-back" onClick={() => { setEvaluationOpened(false); setEntered(false); setFtzMode(false); setAllianceMode(false) }}>← 返回首页</button>
        <button className="topbar-mode-btn" onClick={() => { setEvaluationOpened(false); setStageConfirmed(false); setEntered(false); setFtzMode(false); setAllianceMode(false) }}>切换学段/模式</button>
        <button className="topbar-eval-btn" onClick={() => { setEvaluationOpened(true); setFtzMode(false); setAllianceMode(false) }}>🧩 多元评价</button>
        <button
          className="topbar-upload-btn"
          onClick={() => {
            setUploadScene(allianceMode ? 'alliance_same_class' : 'general')
            setShowUpload(true)
          }}
        >
          📤 上传素材
        </button>
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
      <div className="global-school-ribbon" aria-label="联盟学校校徽（常显）">
        {ALLIANCE_SCHOOLS.map((school) => (
          <a
            key={`global-ribbon-${school.name}`}
            className="global-school-chip"
            href={school.site}
            target="_blank"
            rel="noopener noreferrer"
            title={school.name}
          >
            <span className="global-school-logo-wrap">
              <img className="global-school-logo" src={school.logo} alt={`${school.name}校徽`} loading="lazy" />
            </span>
            <span>{school.name}</span>
          </a>
        ))}
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
      {ftzMode && (
        <section className="ftz-scorecard" aria-label="封关百日成绩单">
          <div className="ftz-scorecard-inner">
            <div className="ftz-scorecard-head">
              <div className="ftz-scorecard-kicker">封关百日成绩单</div>
              <h3>海南自贸港封关运作准备进展（真实可点击）</h3>
              <p>数据区间：2025-12-18 至 2026-03-25。点击下方卡片可查看对应报道原文。</p>
            </div>
            <div className="ftz-scorecard-grid">
              {FTZ_HUNDRED_DAY_SCORECARD.map((item) => (
                <a
                  key={`${item.metric}-${item.value}`}
                  className="ftz-scorecard-card"
                  href={item.source}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="ftz-scorecard-metric">{item.metric}</span>
                  <span className="ftz-scorecard-value">{item.value}</span>
                  <span className="ftz-scorecard-detail">{item.detail}</span>
                  <span className="ftz-scorecard-meta">{item.sourceLabel} · {item.date} · 点击查看</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
      {allianceMode && (
        <div className="alliance-banner">
          <div className="alliance-banner-inner">
            <div className="alliance-banner-left">
              <div className="alliance-banner-title">🤝 海南省大中小学思政课一体化建设区域联盟专题</div>
              <div className="alliance-banner-sub">课程共建 · 教研共研 · 学段衔接 · 资源共享 · 协同育人</div>
              <div className="alliance-banner-emblems" aria-label="区域联盟学校">
                {ALLIANCE_SCHOOLS.map((school) => (
                  <a
                    key={`banner-${school.name}`}
                    className="alliance-banner-emblem"
                    href={school.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={school.name}
                  >
                    <img src={school.logo} alt={`${school.name}校徽`} loading="lazy" />
                    <span>{school.name}</span>
                  </a>
                ))}
              </div>
            </div>
            <div className="alliance-banner-right">
              <div className="alliance-stat"><div className="alliance-stat-num">{list.length}</div><div className="alliance-stat-lbl">专题素材</div></div>
              <div className="alliance-stat"><div className="alliance-stat-num">{ALLIANCE_SCHOOLS.length}</div><div className="alliance-stat-lbl">牵头高校</div></div>
              <div className="alliance-stat"><div className="alliance-stat-num">{allianceStageCoverage}/4</div><div className="alliance-stat-lbl">学段贯通</div></div>
            </div>
          </div>
        </div>
      )}
      {allianceMode && (
        <section className="alliance-hub">
          <div className="alliance-overview-grid">
            <div className="alliance-overview-panel">
              <div className="alliance-overview-title">🚀 一体化建设推进看板</div>
              <div className="alliance-metric-grid">
                <div className="alliance-metric-card">
                  <div className="alliance-metric-num">{ALLIANCE_OFFICIAL_RESOURCES.length}</div>
                  <div className="alliance-metric-label">已验链官方资源</div>
                </div>
                <div className="alliance-metric-card">
                  <div className="alliance-metric-num">{ALLIANCE_CONTENT_COLUMNS.length}</div>
                  <div className="alliance-metric-label">共建内容栏目</div>
                </div>
                <div className="alliance-metric-card">
                  <div className="alliance-metric-num">{allianceUploadedCount}</div>
                  <div className="alliance-metric-label">联盟上传资源</div>
                </div>
                <div className="alliance-metric-card">
                  <div className="alliance-metric-num">{ALLIANCE_CONSULT_CHANNELS.length}</div>
                  <div className="alliance-metric-label">咨询对接入口</div>
                </div>
              </div>
            </div>
            <div className="alliance-overview-panel alliance-overview-roadmap">
              <div className="alliance-overview-title">🧩 联盟协同路径</div>
              <div className="alliance-milestone-list">
                {ALLIANCE_MILESTONES.map((step) => (
                  <article key={step.title} className="alliance-milestone-item">
                    <div className="alliance-milestone-head">
                      <span className="alliance-milestone-title">{step.title}</span>
                      <span className="alliance-milestone-node">{step.node}</span>
                    </div>
                    <p className="alliance-milestone-desc">{step.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
          <div className="alliance-hub-inner">
            <div className="alliance-upload-hero">
              <div className="alliance-upload-kicker">联盟共建入口</div>
              <h3>📤 显著上传资源渠道</h3>
              <p>
                欢迎上传课堂实录、同题异构教案、跨学段衔接案例、实践育人素材。提交后会进入“我的上传资源”并参与联盟共建。
              </p>
              <button
                className="alliance-upload-hero-btn"
                onClick={() => {
                  setUploadScene('alliance_same_class')
                  setShowUpload(true)
                }}
              >
                立即上传联盟资源
              </button>
            </div>
            <div className="alliance-resource-board">
              <div className="alliance-library-intro">
                <div className="alliance-library-kicker">区域联盟介绍</div>
                <h3 className="alliance-library-title">海南省大中小学思政课一体化建设区域联盟</h3>
                <p className="alliance-library-desc">
                  联盟以“纵向贯通、横向协同、资源共享、协同育人”为核心目标，围绕课程共建、教研共研、实践共育持续开展区域联动，
                  构建大中小学思政课一体化建设的海南样板。
                </p>
                <div className="alliance-library-chip-list">
                  {ALLIANCE_INTRO_REGION_NODES.map((node) => (
                    <span key={node} className="alliance-library-chip">{node}</span>
                  ))}
                </div>
                <ul className="alliance-library-bullets">
                  {ALLIANCE_INTRO_HIGHLIGHTS.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <div className="alliance-action-grid">
                  {ALLIANCE_ACTIONS.map((item) => (
                    <a
                      key={item.title}
                      className="alliance-action-card"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="alliance-action-title">{item.title}</div>
                      <p className="alliance-action-detail">{item.detail}</p>
                      <span className="alliance-action-link">{item.actionLabel} ↗</span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="alliance-board-title">
                📚 海南省思政课一体化联盟官方资源（已验链 {ALLIANCE_OFFICIAL_RESOURCES.length} 条）
              </div>
              <div className="alliance-resource-layout">
                <div className="alliance-content-column">
                  <div className="alliance-content-column-title">🗂 联盟资源内容栏</div>
                  <div className="alliance-content-column-list">
                    {ALLIANCE_CONTENT_COLUMNS.map((item) => (
                      <div key={item.column} className="alliance-content-item">
                        <div className="alliance-content-item-title">{item.column}</div>
                        <div className="alliance-content-item-scene">适用场景：{item.scene}</div>
                        <p className="alliance-content-item-examples">{item.examples}</p>
                        <div className="alliance-content-existing-list">
                          {item.existingResources.map((resource) => (
                            <a
                              key={`${item.column}-${resource.url}`}
                              className="alliance-content-existing-item"
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="alliance-content-existing-title">{resource.title}</span>
                              <span className="alliance-content-existing-meta">{resource.source} · {resource.date}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="alliance-content-upload-btn"
                    onClick={() => {
                      setUploadScene('alliance_same_class')
                      setShowUpload(true)
                    }}
                  >
                    按栏目上传资源
                  </button>
                </div>
                <div className="alliance-resource-grid">
                  {ALLIANCE_OFFICIAL_RESOURCES.map((item) => (
                    <a key={item.url} className="alliance-resource-card" href={item.url} target="_blank" rel="noopener noreferrer">
                      <div className="alliance-resource-head">
                        <span className="alliance-resource-tag">{item.tag}</span>
                        <span className="alliance-resource-date">{item.date}</span>
                      </div>
                      <div className="alliance-resource-title">{item.title}</div>
                      <div className="alliance-resource-org">{item.org}</div>
                      <p className="alliance-resource-summary">{item.summary}</p>
                      <span className="alliance-resource-link">查看原文 ↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="alliance-consult-wrap">
            <div className="alliance-board-title">🧭 联盟咨询渠道（真实可查）</div>
            <div className="alliance-consult-grid">
              {ALLIANCE_CONSULT_CHANNELS.map((item) => (
                <a key={`${item.channel}-${item.url}`} className="alliance-consult-card" href={item.url} target="_blank" rel="noopener noreferrer">
                  <div className="alliance-consult-channel">{item.channel}</div>
                  <div className="alliance-consult-target">{item.target}</div>
                  <p className="alliance-consult-detail">{item.detail}</p>
                  <span className="alliance-consult-link">{item.actionLabel} ↗</span>
                </a>
              ))}
            </div>
            <p className="alliance-consult-note">
              注：以上入口均来自教育部、海南省教育系统及高校官方公开页面，并已完成当前版本验链；请以对应网站最新公告为准。
            </p>
          </div>
        </section>
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
              <select
                className="prov-select filter-select"
                value={pv}
                disabled={!rg}
                onChange={e=>{setPv(e.target.value);setPage(1)}}
              >
                <option value="">{rg ? '全部省份' : '请先选择地区'}</option>
                {availableProvinceOptions.map(p => <option key={p} value={p}>{p}</option>)}
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
              {showReset&&<button className="fb reset filter-reset-btn" onClick={()=>{setQ('');setSt(guestMode ? '' : selectedStage);setTp('');setPv('');setRg('');setTopic('');setPage(1)}}>⟳ 重置</button>}
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
                      <span className="type-badge-sm" style={{color:pct2,background:`${pct2}18`}}>{TICO[m.type]||'📄'} {TYPE_LABELS[m.type] || m.type}</span>
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
            {topTopics.map(([t,c])=>(
              <button
                key={t}
                type="button"
                className={`s-topic-row${topic===t?' is-active':''}`}
                onClick={() => { setTopic(topic===t ? '' : t); setPage(1) }}
                aria-pressed={topic===t}
              >
                <span className="s-topic-name">#{t}</span>
                <span className="s-topic-cnt">{c}</span>
              </button>
            ))}
          </div>
          <div className="s-card">
            <div className="s-title">🎓 学段分布</div>
            {(['小学','初中','高中','大学'] as string[]).map(s=>{
              const c=stageCount[s]||0; const p=list.length>0?Math.round(c/list.length*100):0
              return (
                <button
                  key={s}
                  type="button"
                  className={`s-bar-row${st===s?' is-active':''}`}
                  onClick={() => handleSidebarStageClick(s)}
                  aria-pressed={st===s}
                >
                  <span className="s-bar-label">{s}</span>
                  <div className="s-bar"><div style={{height:'100%',width:p+'%',background:STAGE_CLR[s]||'#94a3b8',borderRadius:4}}/></div>
                  <span className="s-bar-cnt">{c}</span>
                </button>
              )
            })}
          </div>
          {!ftzMode && !allianceMode && (
            <div className="s-card">
              <div className="s-title-row">
                <div className="s-title">🗺️ 省份分布 TOP10</div>
                <span className="s-title-meta">覆盖 {provinceDistribution.coveredProvinceCount}</span>
              </div>
              <div className="province-window-tip">
                {!rg ? '请先选择地区，再筛选对应省份' : pv ? `已筛选：${pv}（${provinceDistribution.selectedCount}）` : '点击省份可快速筛选'}
              </div>
              {provinceDistribution.top10.length === 0 ? (
                <div className="province-window-empty">暂无省份数据</div>
              ) : provinceDistribution.top10.map(({ name, count, rank, percent }) => (
                  <button
                    key={name}
                    type="button"
                    className={`s-bar-row s-bar-row-province${pv===name?' is-active':''}`}
                    disabled={!rg}
                    onClick={() => {
                      if (!rg) return
                      setPv(pv===name ? '' : name)
                      setPage(1)
                    }}
                    aria-pressed={pv===name}
                    title={`${name}：${count} 条，占比 ${percent}%`}
                  >
                    <span className="s-rank-badge">{rank}</span>
                    <span className="s-bar-label s-bar-label-province">{name}</span>
                    <div className="s-bar s-bar-province">
                      <div className="s-fill s-fill-province" style={{width:percent+'%'}}/>
                    </div>
                    <span className="s-bar-cnt">{count}</span>
                    <span className="s-bar-pct">{percent}%</span>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-logo">🏝️</div>
            <div>
              <div className="footer-title">{sectionTitle}</div>
              <div className="footer-sub">© 2026 思政教育智慧平台 · Powered by MiniMax AI · 海南自由贸易港</div>
            </div>
          </div>
          <div className="footer-school-wall">
            {ALLIANCE_SCHOOLS.map((school) => (
              <a
                key={`footer-${school.name}`}
                className="footer-school-item"
                href={school.site}
                target="_blank"
                rel="noopener noreferrer"
                title={school.name}
              >
                <img className="footer-school-logo" src={school.logo} alt={`${school.name}校徽`} loading="lazy" />
                <span>{school.name}</span>
              </a>
            ))}
          </div>
        </div>
      </footer>
      {allianceMode && (
        <button
          className="alliance-float-upload-btn"
          onClick={() => {
            setUploadScene('alliance_same_class')
            setShowUpload(true)
          }}
        >
          📤 上传联盟资源
        </button>
      )}
    </div>
  )
}
