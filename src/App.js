"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
var react_1 = require("react");
require("./App.css");
var data_json_1 = require("./data.json");
var API_BASE = import.meta.env.VITE_API_BASE || '';
var STAGE_CLR = { '小学': '#fbbf24', '初中': '#f97316', '高中': '#ef4444', '大学': '#a78bfa' };
var STAGE_BG = { '小学': 'rgba(251,191,36,0.12)', '初中': 'rgba(249,115,22,0.12)', '高中': 'rgba(239,68,68,0.12)', '大学': 'rgba(167,139,250,0.12)' };
var TICO = { document: '📄', image: '🖼', video: '🎬', audio: '🎧', multimedia: '🎭' };
var TLBL = { document: '文档', image: '图片', video: '视频', audio: '音频', multimedia: '多媒体' };
var PERIOD_CLR = { '古代史': '#f59e0b', '近代史': '#ef4444', '现当代': '#22d3ee' };
var ALL_PROVINCES = ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省', '云南省', '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区', '香港特别行政区', '澳门特别行政区', '台湾省'];
var REGION_COLORS = {
    '华北': '#ef4444', '东北': '#3b82f6', '华东': '#22c55e',
    '华中': '#f97316', '华南': '#06b6d4', '西南': '#8b5cf6', '西北': '#f59e0b', '港澳': '#ec4899', '台湾': '#14b8a6'
};
var REGION_GROUPS = {
    '华北': ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区'],
    '东北': ['辽宁省', '吉林省', '黑龙江省'],
    '华东': ['上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省'],
    '华中': ['河南省', '湖北省', '湖南省'],
    '华南': ['广东省', '广西壮族自治区', '海南省'],
    '西南': ['重庆市', '四川省', '贵州省', '云南省', '西藏自治区'],
    '西北': ['陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区'],
    '港澳台': ['香港特别行政区', '澳门特别行政区', '台湾省'],
};
var DATA = data_json_1.default;
// ── 工具函数 ──────────────────────────────────────────
function searchUrl(title, type) {
    var q = encodeURIComponent(title);
    if (type === 'wiki')
        return "https://zh.wikipedia.org/w/index.php?search=".concat(q, "&title=Special:Search&go=Go");
    if (type === 'video')
        return "https://search.bilibili.com/all?keyword=".concat(q, "&order=totalrank");
    if (type === 'paper')
        return "https://kns.cnki.net/kns8s/defaultresult?classid=WKDKHT&kw=".concat(q);
    if (type === 'news')
        return "https://www.baidu.com/s?wd=".concat(q, "&tn=news");
    return '#';
}
function callGenerateAPI(m) {
    return __awaiter(this, void 0, void 0, function () {
        var endpoint, r, data;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    endpoint = API_BASE ? "".concat(API_BASE, "/api/generate") : '/api/generate';
                    return [4 /*yield*/, fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ title: m.title, desc: m.desc, topics: ((_a = m.tags) === null || _a === void 0 ? void 0 : _a.topic) || [], knowledge: ((_b = m.tags) === null || _b === void 0 ? void 0 : _b.knowledge) || [], stage: m.stage || [] })
                        })];
                case 1:
                    r = _c.sent();
                    return [4 /*yield*/, r.json()];
                case 2:
                    data = _c.sent();
                    return [2 /*return*/, data.annotation || ''];
            }
        });
    });
}
// ── 资源面板 ─────────────────────────────────────────
function ResourcePanel(_a) {
    var _b;
    var m = _a.m;
    return (<div className="resource-panel">
      <div className="res-title">🌐 全网拓展资源</div>
      <div className="res-sub">点击直达各大平台 · 素材主题相关内容</div>
      <div className="res-cards">
        <a href={searchUrl(m.title, 'wiki')} target="_blank" rel="noopener noreferrer" className="res-card res-wiki">
          <div className="rc-icon">📖</div><div className="rc-info"><div className="rc-name">百度百科</div><div className="rc-desc">权威词条解释</div></div>
          <div className="rc-arrow">↗</div>
        </a>
        <a href={searchUrl(m.title, 'video')} target="_blank" rel="noopener noreferrer" className="res-card res-video">
          <div className="rc-icon">🎬</div><div className="rc-info"><div className="rc-name">B站视频</div><div className="rc-desc">相关纪录片/讲解</div></div>
          <div className="rc-arrow">↗</div>
        </a>
        <a href={searchUrl(m.title, 'paper')} target="_blank" rel="noopener noreferrer" className="res-card res-paper">
          <div className="rc-icon">📚</div><div className="rc-info"><div className="rc-name">学术论文</div><div className="rc-desc">中国知网 学术搜索</div></div>
          <div className="rc-arrow">↗</div>
        </a>
        <a href={searchUrl(m.title, 'news')} target="_blank" rel="noopener noreferrer" className="res-card res-news">
          <div className="rc-icon">📰</div><div className="rc-info"><div className="rc-name">新闻媒体</div><div className="rc-desc">百度新闻 搜索结果</div></div>
          <div className="rc-arrow">↗</div>
        </a>
      </div>
      {(((_b = m.tags) === null || _b === void 0 ? void 0 : _b.knowledge) || []).length > 0 && (<div className="res-tags">
          <div className="res-tags-label">📚 延伸知识点：</div>
          {m.tags.knowledge.map(function (k) { return (<span key={k} className="know-tag-wrap">
              <a href={"https://zh.wikipedia.org/w/index.php?search=".concat(encodeURIComponent(k), "&title=Special:Search&go=Go")} target="_blank" rel="noopener noreferrer" className="res-tag">🔎 {k}</a>
              <a href={"https://www.baidu.com/s?wd=".concat(encodeURIComponent(k), "&tn=news")} target="_blank" rel="noopener noreferrer" className="know-baidu-tag">百度</a>
            </span>); })}
        </div>)}
    </div>);
}
// ── 详情弹窗 ─────────────────────────────────────────
function DetailModal(_a) {
    var _this = this;
    var _b, _c, _d;
    var m = _a.m, onClose = _a.onClose;
    var _e = (0, react_1.useState)(''), aiText = _e[0], setAiText = _e[1];
    var _f = (0, react_1.useState)(false), generating = _f[0], setGenerating = _f[1];
    var _g = (0, react_1.useState)(0), regenKey = _g[0], setRegenKey = _g[1];
    var loadAI = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var text, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setGenerating(true);
                    setAiText('');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, callGenerateAPI(m)];
                case 2:
                    text = _b.sent();
                    if (text) {
                        setAiText(text);
                    }
                    else {
                        setAiText(m.annotation || '暂无标注');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    setAiText(m.annotation || '暂无标注');
                    return [3 /*break*/, 5];
                case 4:
                    setGenerating(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [m]);
    // 首次加载 或 regenKey 变化时触发
    (0, react_1.useEffect)(function () { loadAI(); }, [loadAI, regenKey]);
    var pct = PERIOD_CLR[m.period || '现当代'] || '#22d3ee';
    var isLive = !!aiText && aiText !== m.annotation;
    return (<div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={function (e) { return e.stopPropagation(); }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header">
          <span className="type-badge-lg" style={{ background: "".concat(pct, "22"), color: pct }}>{TICO[m.type] || '📄'} {TLBL[m.type] || m.type}</span>
          <div className="modal-stage-row">{(m.stage || []).map(function (s) { return <span key={s} className="stage-badge" style={{ color: STAGE_CLR[s] || '#94a3b8', background: STAGE_BG[s] || 'rgba(148,163,184,0.12)' }}>{s}</span>; })}</div>
          {m.period && <span className="period-badge" style={{ color: pct, background: "".concat(pct, "18") }}>📅 {m.period}</span>}
        </div>
        <h2 className="modal-title">{m.title}</h2>
        <div className="modal-meta">
          <span>📍 {m.sourceName}</span><span>📅 {m.date}</span><span>👁 {m.views.toLocaleString()} 次浏览</span>
        </div>
        <div className="modal-tags">
          {(((_b = m.tags) === null || _b === void 0 ? void 0 : _b.topic) || []).map(function (t) { return <span key={t} className="topic-tag">#{t}</span>; })}
          {(((_c = m.tags) === null || _c === void 0 ? void 0 : _c.emotion) || []).map(function (e) { return <span key={e} className="emotion-tag">💗 {e}</span>; })}
        </div>

        {m.type === 'video' && (<div className="video-player-wrap">
            <div className="video-player-label">🎬 视频播放 · 点击搜索结果观看</div>
            <iframe src={"https://search.bilibili.com/all?keyword=".concat(encodeURIComponent(m.title), "&order=totalrank")} className="video-iframe" title="视频播放" allowFullScreen loading="lazy"/>
            <div className="video-tip">💡 如视频未加载，请点击上方卡片跳转 B站 观看</div>
          </div>)}

        <div className="modal-section">
          <h3>📌 内容简介</h3>
          <p>{m.desc}</p>
        </div>
        <ResourcePanel m={m}/>

        <div className="modal-section ai-section">
          <div className="ai-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🧠 AI 辅助教学方案</span>
              {generating && <span className="ai-badge">生成中...</span>}
              {!generating && isLive && <span className="ai-badge live">✨ 实时生成</span>}
              {!generating && !isLive && aiText && <span className="ai-badge">📦 预存版本</span>}
            </div>
          </div>
          {generating ? (<div className="ai-spinner">
              <svg viewBox="0 0 50 50" width="36" height="36">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#b91c1c" strokeWidth="4" strokeDasharray="80 40" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                </circle>
              </svg>
              <span>🧠 AI 正在生成教学方案，请稍候...</span>
            </div>) : (<div className="ai-plan" data-live={isLive}>{aiText || m.annotation}</div>)}
          <button className="regen-btn" onClick={function (e) { e.stopPropagation(); setRegenKey(function (k) { return k + 1; }); }}>
            🔄 重新生成
          </button>
        </div>

        {/* 核心素养 */}
        {m.核心素养 && m.核心素养.length > 0 && (<div className="modal-section">
            <h3>🎯 政治学科核心素养</h3>
            <div className="suyang-list">
              {m.核心素养.map(function (s) { return (<div key={s.name} className="suyang-item">
                  <span className="suyang-name">{s.name}</span>
                  <span className="suyang-desc">{s.desc}</span>
                </div>); })}
            </div>
          </div>)}

        {/* 对应教材 */}
        {m.对应教材 && m.对应教材.length > 0 && (<div className="modal-section">
            <h3>📖 对应教材与课目</h3>
            <div className="jiaocai-list">
              {m.对应教材.map(function (j) { return (<div key={j.stage} className="jiaocai-item">
                  <span className="jiaocai-stage">{j.stage}</span>
                  <div className="jiaocai-info">
                    <div className="jiaocai-book">📕 {j.book}</div>
                    <div className="jiaocai-lesson">📖 {j.lesson}</div>
                  </div>
                </div>); })}
            </div>
          </div>)}

        <div className="modal-section">
          <h3>📚 知识点</h3>
          <div className="know-list">{(((_d = m.tags) === null || _d === void 0 ? void 0 : _d.knowledge) || []).map(function (k) { return <span key={k} className="know-tag">{k}</span>; })}</div>
        </div>
        <div className="modal-footer">
          <span className="src-badge">📍 来源：{m.sourceName}</span>
        </div>
      </div>
    </div>);
}
// ── 主应用 ───────────────────────────────────────────
function App() {
    var _a = (0, react_1.useState)(''), q = _a[0], setQ = _a[1];
    var _b = (0, react_1.useState)(''), st = _b[0], setSt = _b[1];
    var _c = (0, react_1.useState)(''), tp = _c[0], setTp = _c[1];
    var _d = (0, react_1.useState)(''), pv = _d[0], setPv = _d[1];
    var _e = (0, react_1.useState)(''), rg = _e[0], setRg = _e[1];
    var _f = (0, react_1.useState)(null), selected = _f[0], setSelected = _f[1];
    var _g = (0, react_1.useState)(1), page = _g[0], setPage = _g[1];
    var PAGE_SIZE = 10;
    var list = (0, react_1.useMemo)(function () { return DATA.filter(function (m) {
        var _a, _b;
        var matchQ = !q || __spreadArray(__spreadArray([m.title, m.desc || ''], (((_a = m.tags) === null || _a === void 0 ? void 0 : _a.topic) || []), true), (((_b = m.tags) === null || _b === void 0 ? void 0 : _b.knowledge) || []), true).some(function (s) { return s.toLowerCase().includes(q.toLowerCase()); });
        var matchS = !st || (m.stage || []).includes(st);
        var matchT = !tp || m.type === tp;
        var matchPv = !pv || (m.province || '') === pv;
        var matchRg = !rg || (function () {
            var _a;
            var p = m.province || '';
            var g = (_a = Object.entries(REGION_GROUPS).find(function (_a) {
                var _ = _a[0], ps = _a[1];
                return ps.includes(p);
            })) === null || _a === void 0 ? void 0 : _a[0];
            return g === rg;
        })();
        return matchQ && matchS && matchT && matchPv && matchRg;
    }, [q, st, tp, pv, rg]); });
    var paginated = (0, react_1.useMemo)(function () { return list.slice(0, page * PAGE_SIZE); }, [list, page]);
    var hasMore = paginated.length < list.length;
    var totalPages = Math.ceil(list.length / PAGE_SIZE);
    var curPage = Math.min(Math.ceil(paginated.length / PAGE_SIZE), totalPages);
    var topicCount = {};
    var stageCount = {};
    list.forEach(function (m) {
        var _a;
        ;
        (((_a = m.tags) === null || _a === void 0 ? void 0 : _a.topic) || []).forEach(function (t) { return topicCount[t] = (topicCount[t] || 0) + 1; });
        (m.stage || []).forEach(function (s) { return stageCount[s] = (stageCount[s] || 0) + 1; });
    });
    var topTopics = Object.entries(topicCount).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8);
    var periodDist = {};
    DATA.forEach(function (m) { var p = m.period || '现当代'; periodDist[p] = (periodDist[p] || 0) + 1; });
    return (<div className="app">
      {selected && <DetailModal m={selected} onClose={function () { return setSelected(null); }}/>}
      <div className="hero">
        <div className="hero-ribbon"/>
        <div className="hero-brand">
          <div className="hero-logo">🏝️</div>
          <div>
            <div className="hero-name">琼崖思政学段自适应AI引擎</div>
            <div className="hero-sub">思政教育智慧平台 · 2026</div>
          </div>
        </div>
        <div className="hero-banner">
          <div className="hero-left">
            <div className="hero-eyebrow">🔴 红色文化 · 思政育人</div>
            <h1 className="hero-title">海南思政<br /><span className="hero-highlight">智慧资源宝库</span></h1>
            <p className="hero-desc">源自琼崖革命精神，融合现代AI技术。<br />覆盖古代·近代·当代三大历史维度，四大学段适配。</p>
            <div className="hero-chips">
              {['红色文化', '自贸港', '海洋强国', '生态文明', '黎苗文化'].map(function (t) { return <span key={t} className="h-chip">{t}</span>; })}
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-card">
              <div className="hc-title">📊 资源总览</div>
              <div className="hc-grid">
                <div className="hc-item"><div className="hcv">{DATA.length}</div><div className="hcl">总素材</div></div>
                <div className="hc-item"><div className="hcv">{Object.keys(periodDist).length}</div><div className="hcl">历史分期</div></div>
                <div className="hc-item"><div className="hcv">4</div><div className="hcl">学段覆盖</div></div>
                <div className="hc-item"><div className="hcv accent">✨</div><div className="hcl">实时AI</div></div>
              </div>
              <div className="hc-periods">
                {Object.entries(periodDist).map(function (_a) {
            var p = _a[0], c = _a[1];
            return (<div key={p} className="hp-row">
                    <span style={{ color: PERIOD_CLR[p] || '#94a3b8' }}>{p}</span>
                    <span className="hp-bar"><span style={{ width: Math.round(c / DATA.length * 100) + '%', background: PERIOD_CLR[p] || '#94a3b8' }}/></span>
                    <span className="hp-cnt">{c}条</span>
                  </div>);
        })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="wave"><svg viewBox="0 0 1440 60" preserveAspectRatio="none"><defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7f1d1d"/><stop offset="50%" stopColor="#991b1b"/><stop offset="100%" stopColor="#1e3a5f"/></linearGradient></defs><path d="M0 60L48 52C96 44 192 28 288 22 384 16 480 20 576 28 672 36 768 48 864 50 960 52 1056 44 1152 36 1248 28 1344 20 1392 16L1440 12V60H0Z" fill="url(#wg)"/></svg></div>

      <main className="main">
        <div className="search-bar-wrap">
          <div className="search-bar">
            <span className="si">🔍</span>
            <input className="sbi" placeholder="输入关键词搜索素材标题、描述、标签..." value={q} onChange={function (e) { setQ(e.target.value); setPage(1); }}/>
            {q && <button className="scb" onClick={function () { return setQ(''); }}>✕</button>}
          </div>
          <div className="filter-row">
            <span className="fl">省份：</span>
            <select className="prov-select" value={pv} onChange={function (e) { setPv(e.target.value); setRg(''); setPage(1); }}>
              <option value="">全部省份</option>
              {ALL_PROVINCES.map(function (p) { return <option key={p} value={p}>{p}</option>; })}
            </select>
            <span className="fl" style={{ marginLeft: 8 }}>大区：</span>
            <select className="prov-select" value={rg} onChange={function (e) { setRg(e.target.value); setPv(''); setPage(1); }}>
              <option value="">全部大区</option>
              {Object.keys(REGION_GROUPS).map(function (r) { return <option key={r} value={r}>{r}</option>; })}
            </select>
            <span className="fl" style={{ marginLeft: 8 }}>学段：</span>
            {['', '小学', '初中', '高中', '大学'].map(function (s) { return <button key={s} className={"fb ".concat(st === s ? 'active' : '')} onClick={function () { setSt(s); setPage(1); }}>{s || '全部'}</button>; })}
            <span className="fl" style={{ marginLeft: 8 }}>类型：</span>
            {[['document', '📄'], ['video', '🎬'], ['image', '🖼'], ['audio', '🎧'], ['multimedia', '🎭']].map(function (_a) {
        var k = _a[0], l = _a[1];
        return <button key={k} className={"fb ".concat(tp === k ? 'active' : '')} onClick={function () { setTp(k || ''); setPage(1); }}>{l}</button>;
    })}
            {(q || st || tp || pv || rg) && <button className="fb reset" onClick={function () { setQ(''); setSt(''); setTp(''); setPv(''); setRg(''); setPage(1); }} style={{ marginLeft: 'auto' }}>⟳ 重置</button>}
          </div>
        </div>

        <div className="content-grid">
          <div className="left">
            <div className="result-bar">
              <span>📚 <strong>{list.length}</strong> 条素材</span>
              {q && <><span> · 搜索 </span><strong>"{q}"</strong></>}
              {list.length > 0 && <span className="page-info"> — 第 {curPage}/{totalPages} 页 · 显示 {paginated.length} 条</span>}
            </div>
            {list.length === 0 ? (<div className="empty"><div className="empty-icon">🔍</div><h3>暂无此内容</h3><p>试试其他关键词或调整筛选条件</p></div>) : (<>
                <div className="mat-grid">
                  {paginated.map(function (m) {
                var _a;
                var pct2 = PERIOD_CLR[m.period || '现当代'] || '#22d3ee';
                return (<div key={m.id} className="mat-card" onClick={function () { return setSelected(m); }} style={{ cursor: 'pointer' }}>
                        <div className="mat-card-inner">
                          <div className="mat-accent-bar" style={{ background: pct2 }}/>
                          <div className="mat-body">
                            <div className="mat-top">
                              <span className="type-badge" style={{ background: "".concat(pct2, "22"), color: pct2 }}>{TICO[m.type] || '📄'} {TLBL[m.type] || m.type}</span>
                              <span className="period-tag" style={{ color: pct2, background: "".concat(pct2, "18") }}>{m.period || '现当代'}</span>
                              <span className="meta">📅 {m.date}</span>
                              <span className="meta">👁 {m.views.toLocaleString()}</span>
                            </div>
                            <h3 className="mat-title">{m.title}</h3>
                            <p className="mat-desc">{m.desc}</p>
                            <div className="mat-bottom">
                              <div className="stage-row">{(m.stage || []).map(function (s) { return <span key={s} className="stage-badge" style={{ color: STAGE_CLR[s] || '#94a3b8', background: STAGE_BG[s] || 'rgba(148,163,184,0.12)' }}>{s}</span>; })}</div>
                              <div className="tag-row">{(((_a = m.tags) === null || _a === void 0 ? void 0 : _a.topic) || []).slice(0, 3).map(function (t) { return <span key={t} className="topic-tag">#{t}</span>; })}</div>
                              <div className="ai-hint-row">
                                <span className="ai-hint">🧠 AI教学方案</span>
                                <span className="res-hint">🌐 全网资源</span>
                                <span className="live-hint">⚡ 点击实时生成</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>);
            })}
                </div>
                {hasMore && <button className="load-more" onClick={function () { return setPage(function (p) { return p + 1; }); }}>加载更多素材 ↓ ({paginated.length}/{list.length})</button>}
                {!hasMore && list.length > 0 && <div className="all-loaded">✅ 已加载全部 {list.length} 条素材</div>}
              </>)}
          </div>
          <div className="sidebar">
            <div className="scard">
              <div className="stitle">📂 主题分类</div>
              {topTopics.map(function (_a) {
        var t = _a[0], c = _a[1];
        return <div key={t} className="topic-row"><span className="tr-l">#{t}</span><span className="tr-r">{c}条</span></div>;
    })}
            </div>
            <div className="scard">
              <div className="stitle">🎓 学段分布</div>
              {['小学', '初中', '高中', '大学'].map(function (s) {
            var c = stageCount[s] || 0;
            var p = list.length > 0 ? Math.round(c / list.length * 100) : 0;
            return <div key={s}>
                  <div className="topic-row"><span className="tr-l">{s}</span><span className="tr-r">{c}条</span></div>
                  <div style={{ height: 4, background: 'rgba(0,0,0,0.05)', borderRadius: 4, margin: '2px 0 8px' }}>
                    <div style={{ height: '100%', width: p + '%', background: STAGE_CLR[s] || '#94a3b8', borderRadius: 4, transition: 'width 0.4s' }}/>
                  </div>
                </div>;
        })}
            </div>
            <div className="scard">
              <div className="stitle">🗺️ 省份分布 TOP10</div>
              {Object.entries((Object.entries(list.reduce(function (acc, m) { var p = m.province || '全国'; acc[p] = (acc[p] || 0) + 1; return acc; }, {})).sort(function (a, b) { return b[1] - a[1]; })).slice(0, 10)).map(function (_a) {
            var _b;
            var p = _a[0], c = _a[1];
            var total = list.length || 1;
            var barP = Math.round(c / total * 100);
            var reg = ((_b = Object.entries(REGION_GROUPS).find(function (_a) {
                var _ = _a[0], ps = _a[1];
                return ps.includes(p);
            })) === null || _b === void 0 ? void 0 : _b[0]) || '全国';
            var rc = REGION_COLORS[reg] || '#94a3b8';
            return <div key={p}>
                  <div className="topic-row"><span className="tr-l" style={{ fontSize: 12 }}>{p}</span><span className="tr-r">{c}条</span></div>
                  <div style={{ height: 3, background: 'rgba(0,0,0,0.05)', borderRadius: 4, margin: '1px 0 6px' }}>
                    <div style={{ height: '100%', width: barP + '%', background: rc, borderRadius: 4, transition: 'width 0.5s' }}/>
                  </div>
                </div>;
        })}
            </div>
            <div className="scard red-card">
              <div className="stitle">🔴 红色精神</div>
              <div className="red-quote">"二十三年红旗不倒"<br />琼崖革命精神永放光芒</div>
              <div className="red-items">
                <div className="red-item"><span className="ri-num">23</span><span className="ri-label">年持续斗争</span></div>
                <div className="red-item"><span className="ri-num">3</span><span className="ri-label">大历史分期</span></div>
                <div className="red-item"><span className="ri-num">✨</span><span className="ri-label">实时AI</span></div>
              </div>
            </div>
            <div className="ai-note">🧠 <strong>点击任意素材</strong>，实时生成AI教学方案 + 全网视频·百科·论文资源</div>
          </div>
        </div>
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">🏝️</div>
          <div>
            <div className="footer-title">琼崖思政学段自适应AI引擎</div>
            <div className="footer-sub">© 2026 思政教育智慧平台 · Powered by MiniMax AI · 海南自由贸易港</div>
          </div>
        </div>
      </footer>
    </div>);
}
