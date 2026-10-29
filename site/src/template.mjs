import { body, dayStats, dayUrl } from '../scripts/content.mjs';
import { prefixLocalUrls } from './urls.mjs';

export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const bi = (zh, en, cls = '') => `<span class="${cls}">${escape(zh)}<span class="en" lang="en">${escape(en)}</span></span>`;
const arrow = '<span aria-hidden="true">↗</span>';
const sectionLabel = (number, zh, en) => `<div class="section-label"><span class="index">${number}</span><span>${escape(zh)} <span lang="en">${escape(en)}</span></span></div>`;
const pair = line => `<div class="bilingual-pair"><p class="zh-text">${escape(line.zh)}</p><p class="en translation" lang="en">${escape(line.en)}</p></div>`;
const pairs = section => section.lines.map(pair).join('');
const note = item => item ? `<p class="editor-note">${escape(item.zh)}<span class="en" lang="en">${escape(item.en)}</span></p>` : '';
const translationLabel = item => `<p class="translation-label">${escape(item.zh)} <span lang="en">/ ${escape(item.en)}</span></p>`;
const image = (file, alt, cls = '', eager = false) => `<img class="${cls}" src="/assets/day-001/${escape(file)}" alt="${escape(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high"' : ''}>`;
const dayImage = (day, key, cls = '', eager = false) => `<img class="${cls}" src="${escape(day.images[key].src)}" alt="${escape(day.images[key].alt)}" ${day.images[key].srcSmall ? `srcset="${escape(day.images[key].srcSmall)} 768w, ${escape(day.images[key].src)} ${day.images[key].width}w" sizes="${key === 'hero' ? '100vw' : '(max-width: 600px) 90vw, 48vw'}" width="${day.images[key].width}" height="${day.images[key].height}"` : ''} loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high"' : ''}>`;
const sourceLinks = section => (section.sources || []).map(source => `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)} ${arrow}</a>`).join('');

function shell(title, description, active, main, latest, extra = '', currentPath = '') {
  const origin = process.env.TIBI_SITE_URL || '';
  const pagePath = currentPath || (active === 'home' ? '/' : active === 'day' ? dayUrl(latest) : active === 'archive' ? '/archive/' : title === '关于与来源' ? '/about/' : null);
  const canonical = origin && pagePath ? origin + pagePath : '';
  const social = '<meta property="og:type" content="website"><meta property="og:title" content="' + escape(title + ' · 提笔--练字') + '"><meta property="og:description" content="' + escape(description) + '">' + (canonical ? '<link rel="canonical" href="' + escape(canonical) + '"><meta property="og:url" content="' + escape(canonical) + '"><meta property="og:image" content="' + escape(origin + latest.images.hero.src) + '">' : '');
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · 提笔</title><meta name="description" content="${escape(description)}">${social}<meta name="theme-color" content="#f5f2e9"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"><script src="/app.js" type="module"></script></head><body ${extra}>
  <a class="skip-link" href="#main">跳到正文 / Skip to content</a>
  <header class="site-header"><a class="brand" href="/" aria-label="提笔首页 / Between the Lines home"><span class="seal" aria-hidden="true">字</span><span class="brand-name">提笔<span lang="en">BETWEEN THE LINES</span></span></a>
  <nav aria-label="主导航 / Main navigation"><a ${active === 'home' ? 'aria-current="page"' : ''} href="/">首页 <span>Home</span></a><a ${active === 'day' ? 'aria-current="page"' : ''} href="${dayUrl(latest)}">今日练字 <span>Today</span></a><a ${active === 'archive' ? 'aria-current="page"' : ''} href="/archive/">往日篇章 <span>Archive</span></a></nav><a class="header-write" href="${dayUrl(latest)}#writing">提笔 <span lang="en">Write</span> ↗</a></header>
  <main id="main">${main}</main>
  <footer class="site-footer"><div><a class="footer-brand" href="/">提笔</a><p>一日一页，一笔一行。<span class="en" lang="en">A page a day. A line at a time.</span></p></div><div class="footer-links"><a href="/archive/">往日篇章 / Archive</a><a href="/about/">关于与来源 / About & credits</a><span>© ${latest.date.slice(0, 4)} 提笔 · 私人练字手记</span></div></footer><div class="toast" role="status" aria-live="polite" hidden></div></body></html>`;
  return prefixLocalUrls(html, process.env.TIBI_BASE_PATH || '');
}

function hero(day, home = false) {
  return `<section class="hero ${home ? 'home-hero' : 'day-hero'}" aria-labelledby="hero-title">
    ${dayImage(day, 'hero', 'hero-image', true)}<div class="hero-shade"></div>
    <div class="hero-content"><p class="eyebrow">${day.status === 'draft' ? '编辑预览 / EDITORIAL PREVIEW · ' : ''}第 ${String(day.day).padStart(2, '0')} 天 <span class="hero-dot">·</span> ${escape(day.date)} <span class="hero-dot">·</span> DAILY WRITING</p>
    <h1 id="hero-title" class="art-title">${day.title.display.map(line => `<span>${escape(line)}</span>`).join('')}</h1><p class="hero-english" lang="en">${escape(day.title.en)}</p>
    <p class="hero-intro">${escape(day.intro.zh)}<span class="en" lang="en">${escape(day.intro.en)}</span></p>
    <a class="button button-light" href="${home ? dayUrl(day) : '#cinema'}">${home ? '翻开今日' : '开始阅读'} <span lang="en">${home ? 'Open today’s page' : 'Begin reading'}</span><span aria-hidden="true">↗</span></a></div>
    <div class="hero-bottom"><span>在文字里，慢下来。<span lang="en"> A little slower, between the lines.</span></span><span class="scroll-hint" aria-hidden="true">SCROLL TO EXPLORE ↓</span></div>
  </section>`;
}

function stats(day) {
  const count = dayStats(day).total;
  return `<div class="edition-strip"><div>${bi('今日手记', 'TODAY’S EDITION')}</div><div>${bi(`${count} 字`, 'CHINESE CHARACTERS')}</div><div>${bi('6 类选材', 'SIX PERSPECTIVES')}</div><div>${bi('逐句中英', 'SIDE BY SIDE')}</div><a href="${dayUrl(day)}#writing">${bi('留白，等你来写', 'A SPACE FOR YOUR WORDS')} ↗</a></div>`;
}

export function homePage(days) {
  const latest = days.at(-1);
  const main = `${hero(latest, true)}${stats(latest)}
  <section class="home-letter container"><div>${sectionLabel('01', '关于今日', 'A NOTE FOR TODAY')}<h2>${escape(latest.title.zh)}</h2><p class="en" lang="en">${escape(latest.title.en)}</p></div><div><p>从电影中的一个瞬间，到诗里的一轮月。把值得停留的文字，一笔一画写下来。</p><p class="en" lang="en">From a moment on screen to a moon in a poem. Write down the words worth staying with, one stroke at a time.</p><a class="text-link" href="${dayUrl(latest)}">读这一篇 / Read this edition ${arrow}</a></div></section>
  <section class="home-preview container"><a class="preview-image" href="${dayUrl(latest)}#poetry">${dayImage(latest, 'poem')}<span>诗里山河 / A landscape in verse ↗</span></a><div class="preview-copy"><p class="eyebrow">SELECTED FOR TODAY</p><h2>${escape(latest.poem.work)}</h2>${pair(latest.poem.lines[1] || latest.poem.lines[0])}<a class="text-link" href="${dayUrl(latest)}#poetry">走进诗中 / Enter the poem ${arrow}</a></div></section>
  <section class="home-archive container"><div class="heading-row"><div>${sectionLabel('02', '往日篇章', 'THE JOURNAL')}<h2>把日子，写成一册。</h2><p class="en" lang="en">Let the days become a book.</p></div><a class="text-link" href="/archive/">浏览全部 / All editions ${arrow}</a></div>${archiveRows(days)}</section>`;
  return shell('首页', '提笔：每日中英双语文学、楷书练字与自由写作。', 'home', main, latest);
}

function archiveRows(days) {
  return `<div class="archive-list">${[...days].reverse().map(day => `<a class="archive-row" href="${dayUrl(day)}" data-search="${escape([day.title.zh, day.title.en, day.date, day.day, ...day.tags].join(' ').toLowerCase())}"><span class="archive-number">${String(day.day).padStart(2, '0')}</span><div class="archive-thumb">${dayImage(day, 'hero')}</div><div class="archive-title"><h3>${escape(day.title.zh)}${day.status === 'draft' ? ' <small>草稿 / Draft</small>' : ''}</h3><p lang="en">${escape(day.title.en)}</p><span>${escape(day.tags.join(' · '))}</span></div><time datetime="${day.date}">${day.date}</time><span class="row-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>`;
}

export function archivePage(days) {
  const latest = days.at(-1);
  return shell('往日篇章', '按日期和主题浏览提笔的每日练字手记。', 'archive', `<section class="archive-page container"><p class="eyebrow">THE JOURNAL</p><h1>往日篇章</h1><p class="lead">每一页，都有当时的光。<span class="en" lang="en">Every page holds a little of its day.</span></p><div class="archive-toolbar"><p>${days.filter(day => day.status === 'completed').length} 篇已完成 <span lang="en">completed editions</span></p><label class="search-label"><span class="sr-only">搜索日期或主题 / Search date or theme</span><input type="search" id="archive-search" placeholder="搜索日期、主题 / Search the journal" autocomplete="off"></label></div>${archiveRows(days)}<p class="empty-search" hidden>没有找到这一页，试试另一个关键词。<span class="en" lang="en">No matching page. Try another keyword.</span></p></section>`, latest);
}

function cinema(day) {
  return `<section id="cinema" class="cinema container section-space"><div class="heading-row"><div>${sectionLabel('01', '光影之间', 'LINES FROM THE SCREEN')}<h2>记住一个瞬间。</h2><p class="en" lang="en">Keep a moment with you.</p></div><p class="section-aside">三部电影，三种看见生活的方式。<span class="en" lang="en">Three films. Three ways of seeing.</span></p></div><div class="film-grid">${day.films.map((film, index) => `<article class="film"><div class="film-poster"><img src="${escape(film.poster.src)}" alt="${escape(film.poster.alt)}" loading="lazy" decoding="async"><span class="film-index">0${index + 1}</span></div><div class="film-copy"><p class="film-meta">${film.year} · ${escape(film.director)}</p><h3>${escape(film.work)}<span lang="en">${escape(film.workEn)}</span></h3><blockquote>${pairs(film)}</blockquote>${translationLabel(film.translation)}<div class="source-links">${sourceLinks(film)}<a href="${escape(film.poster.source)}" target="_blank" rel="noopener noreferrer">官方作品页 / Film page ${arrow}</a></div></div></article>`).join('')}</div></section>`;
}

function poetry(day) {
  return `<section id="poetry" class="poetry section-space"><div class="container poetry-layout"><div class="poetry-art">${dayImage(day, 'poem')}<span class="image-caption">${escape(day.poem.imageCaption.zh)}<span lang="en">${escape(day.poem.imageCaption.en)}</span></span></div><article class="poetry-copy">${sectionLabel('02', '诗里山河', 'A LANDSCAPE IN VERSE')}<h2>${escape(day.poem.work)}</h2><p class="work-byline">${escape(day.poem.author)} <span lang="en">/ ${escape(day.poem.workEn)}</span></p><blockquote class="poem-lines">${pairs(day.poem)}</blockquote>${translationLabel(day.poem.translation)}${note(day.poem.note)}<div class="source-links">${sourceLinks(day.poem)}</div></article></div></section>`;
}

function prose(day) {
  return `<section id="prose" class="prose container section-space"><div class="prose-title">${sectionLabel('03', '古文余韵', 'AN ECHO FROM THE PAST')}<h2>${escape(day.prose.heading?.zh || day.prose.work)}</h2><p class="en" lang="en">${escape(day.prose.heading?.en || day.prose.workEn)}</p></div><div class="prose-layout"><article class="prose-paper"><p class="work-byline">${escape(day.prose.author)} · ${escape(day.prose.work)}<span class="en" lang="en">${escape(day.prose.workEn)}</span></p><blockquote>${pairs(day.prose)}</blockquote>${translationLabel(day.prose.translation)}${note(day.prose.note)}<div class="source-links">${sourceLinks(day.prose)}</div></article><figure class="prose-art">${dayImage(day, 'prose')}<figcaption>${escape(day.prose.imageCaption.zh)} <span lang="en">${escape(day.prose.imageCaption.en)}</span></figcaption></figure></div></section>`;
}

function modern(day) {
  return `<section id="modern" class="modern section-space"><div class="container modern-layout"><figure class="modern-art">${dayImage(day, 'modern')}<figcaption>${escape(day.modern.imageCaption.zh)}<span class="en" lang="en">${escape(day.modern.imageCaption.en)}</span></figcaption></figure><article>${sectionLabel('04', '纸上的温度', 'THE WARMTH OF WORDS')}<h2>${escape(day.modern.work)}</h2><p class="work-byline">${escape(day.modern.author)} <span lang="en">/ ${escape(day.modern.workEn)}</span></p><blockquote class="modern-quote">${pairs(day.modern)}</blockquote>${translationLabel(day.modern.translation)}${note(day.modern.note)}<div class="source-links">${sourceLinks(day.modern)}</div></article></div></section>`;
}

function topic(day) {
  return `<section id="topic" class="topic container section-space">${sectionLabel('05', '此刻人间', 'A MOMENT IN OUR WORLD')}<div class="topic-layout"><article><p class="topic-badge">近期话题 / RECENT CULTURE · ${escape(day.topic.verifiedOn)}</p><h2>${escape(day.topic.work)}</h2><p class="en" lang="en">${escape(day.topic.workEn)}</p><blockquote>${pairs(day.topic)}</blockquote>${translationLabel(day.topic.translation)}${note(day.topic.note)}<details class="source-detail"><summary>话题核验与来源 / Verification & sources</summary>${note(day.topic.verification)}<div class="source-links">${sourceLinks(day.topic)}</div></details></article><figure class="topic-art">${dayImage(day, 'topic')}<figcaption>主题插画，非新闻现场影像。<span class="en" lang="en">An interpretive illustration, not a news photograph.</span></figcaption></figure></div></section>`;
}

function reflection(day) {
  return `<section id="reflection" class="reflection section-space"><div class="container">${sectionLabel('06', '今日一念', 'A SMALL REFLECTION')}<blockquote>${pairs(day.original)}</blockquote><p class="reflection-credit">提笔原创 · 英文自译 <span lang="en">Original writing & translation</span></p></div></section>`;
}

function practice(day) {
  return `<section id="practice" class="practice container section-space"><div class="heading-row"><div>${sectionLabel('07', '一笔一画', 'STROKE BY STROKE')}<h2>今天，把这些字写好。</h2><p class="en" lang="en">A few characters to spend time with.</p></div><p class="section-aside">先看结构，再落笔。<span class="en" lang="en">Look at the structure before the stroke.</span></p></div><div class="character-grid">${day.focus.map(item => `<div class="character"><span class="practice-cell">${escape(item.char)}</span><p>${escape(item.zh)}<span class="en" lang="en">${escape(item.en)}</span></p></div>`).join('')}</div></section>`;
}

function fillModule(day) {
  const oldRows = day.writing.fills.map((fill, index) => `<div class="fill-row"><label>${escape(fill.before)}<input name="fill${index + 1}" maxlength="80" aria-label="原第${index + 1}句填空 / Earlier sentence ${index + 1}">${escape(fill.after)}</label><p class="en" lang="en">${escape(fill.en)}</p></div>`).join('');
  if (!day.writing.couplets) return `<fieldset class="fill-module"><legend>补几字，成一句 / Complete a sentence</legend>${oldRows}</fieldset>`;
  return `<fieldset class="fill-module cloze-module"><legend>炼字填空 <span lang="en">One word, a different mood</span></legend><p class="module-instruction">每空填一个字，让上下两句有自己的意境。<span class="en" lang="en">One character in each blank. Give the paired lines a mood of your own.</span></p><div class="couplet-grid">${day.writing.couplets.map((couplet, index) => `<article class="couplet-card"><p class="couplet-number">${String(index + 1).padStart(2, '0')} <span>${escape(couplet.title.zh)} <span lang="en">/ ${escape(couplet.title.en)}</span></span></p><div class="couplet-lines">${couplet.lines.map((line, row) => `<label class="cloze-line">${escape(line.before)}<span class="cloze-bracket" aria-hidden="true">（</span><input name="${escape(line.field)}" maxlength="1" autocomplete="off" spellcheck="false" aria-label="第${index + 1}组${row ? '下' : '上'}句，填一个字 / Pair ${index + 1}, line ${row + 1}" data-before="${escape(line.before)}" data-after="${escape(line.after)}"><span class="cloze-bracket" aria-hidden="true">）</span>${escape(line.after)}</label>`).join('')}</div><p class="en couplet-english" lang="en">${escape(couplet.en)}</p><div class="couplet-preview"><span>我的填句 <span lang="en">MY LINES</span></span><p class="couplet-result" aria-live="polite">${couplet.lines.map(line => escape(line.before + '□' + line.after)).join('')}</p></div></article>`).join('')}</div><p class="small-note">原创句式，自由炼字，不设标准答案。英文仅作句意参考，不随填字自动翻译。<span class="en" lang="en">Original prompts, with no single right answer. English offers a guide to the unfinished lines; it does not translate your choices automatically.</span></p></fieldset><details class="legacy-writing" hidden><summary>以前的填词记录 / Earlier writing</summary>${oldRows}</details>`;
}

function writing(day) {
  return `<section id="writing" class="writing section-space"><div class="container"><div class="heading-row"><div>${sectionLabel('08', '留白，写给你', 'MAKE ROOM FOR YOUR WORDS')}<h2>剩下的，交给你的笔。</h2><p class="en" lang="en">The next lines are yours.</p></div><div class="writing-status" role="status" aria-live="polite">正在读取手记 / Loading your writing…</div></div>
  <form id="writing-form" data-day="${day.id}" autocomplete="off"><script id="writing-context" type="application/json">${JSON.stringify({id:day.id,cycle:day.cycle,day:day.day,date:day.date,title:day.title,...day.writing}).replace(/</g,"\u003c")}</script>${fillModule(day)}
  <div class="freewriting-module"><div><label class="writing-label" for="essay">由今天，写自己的几句话<span lang="en">A few lines inspired by today</span></label><p class="writing-prompt">${escape(day.writing.question.zh)}<span class="en" lang="en">${escape(day.writing.question.en)}</span></p><textarea id="essay" name="essay" class="lined-paper" maxlength="6000" rows="6" placeholder="写2—3句话，也可以再多写一点。 / Write two or three lines, or a little more."></textarea></div><div><label class="writing-label" for="free">还有一些，想写下来<span lang="en">Anything else you want to keep</span></label><p class="writing-prompt">一个念头，一句摘录，或今天的心情。<span class="en" lang="en">A thought, a quotation, or the way today feels.</span></p><textarea id="free" name="free" class="blank-paper" maxlength="6000" rows="6" placeholder="这里没有标准答案。 / There is no right answer here."></textarea></div></div>
  <div class="writing-actions"><button type="submit" class="button">保存手记 <span lang="en">Save writing</span> ↗</button><button type="button" class="button button-outline" data-export>导出文字 <span lang="en">Export text</span></button><button type="reset" class="text-button">清空输入 / Clear fields</button><span class="storage-note">仅保存在此设备 · 可导出备份<span class="en" lang="en">Stored in this browser on this device. Export a copy to keep.</span></span></div><p class="export-result" role="status" hidden></p></form></div></section>`;
}

function credits(day) {
  const stat = dayStats(day);
  return `<section id="sources" class="edition-notes container"><details><summary>本期编辑记录与配图说明 / Editorial record & image notes</summary><p>核心中文正文 ${stat.total} 汉字，六类占比依次为 ${stat.percentages.join('% / ')}%。英文、解析和写作题不计入正文。</p><p class="en" lang="en">${stat.total} Chinese characters. English, commentary and writing prompts are excluded from the count.</p><p>日期 ${day.date}｜第${day.day}天｜${escape(day.title.zh)}｜${day.films.map(f => escape(f.work)).join('、')}｜${escape(day.poem.work)}｜${escape(day.prose.work)}｜${escape(day.modern.work)}｜${escape(day.topic.work)}</p><p class="en" lang="en">This edition is part of the new cycle. Earlier-cycle selections are excluded from its duplicate checks.</p><p>三张电影主题封面为原创设计，非官方海报；附有官方作品页链接。五张 AI 配图表达作品意境，不代表历史现场或新闻记录。</p><p class="en" lang="en">Three original editorial film covers are not official key art. Official film pages are linked. Five generated illustrations interpret the texts and are not historical or news evidence.</p><a class="text-link" href="/reading/${day.id}.txt">阅读纯文本 / Read the plain text ${arrow}</a><a class="text-link" href="/about/">完整说明 / Full credits ${arrow}</a></details></section>`;
}

export function dayPage(day, days) {
  const index = days.findIndex(item => item.id === day.id);
  const previous = days[index - 1], next = days[index + 1];
  const main = `${hero(day)}${stats(day)}<div class="reading-tools"><div class="container"><span>今日目录 <span lang="en">IN THIS EDITION</span></span><nav aria-label="篇内导航 / Edition navigation"><a href="#cinema">光影</a><a href="#poetry">诗词</a><a href="#prose">古文</a><a href="#modern">文学</a><a href="#topic">此刻</a><a href="#writing">写作</a></nav><div class="reading-options"><button type="button" data-reading aria-pressed="false">专注 / Focus</button><button type="button" data-english aria-pressed="false">隐藏英文 / Hide English</button><button type="button" data-print>打印 / Print</button></div></div></div>
  ${cinema(day)}${poetry(day)}${prose(day)}${modern(day)}${topic(day)}${reflection(day)}${practice(day)}${writing(day)}${credits(day)}
  <nav class="edition-nav container" aria-label="相邻篇章 / Adjacent editions">${previous ? `<a href="${dayUrl(previous)}">← 上一期 / Previous</a>` : '<span>这是新周期的第一页。<small lang="en">The first page of a new cycle.</small></span>'}<a href="/archive/">全部篇章 / All editions</a>${next ? `<a href="${dayUrl(next)}">下一期 / Next →</a>` : '<span>下一页，留给明天。<small lang="en">The next page awaits.</small></span>'}</nav>`;
  return shell(`第${day.day}天｜${day.title.zh}`, day.intro.zh, 'day', main, days.at(-1), `data-edition="${day.id}"`, dayUrl(day));
}

export function aboutPage(days) {
  const latest = days.at(-1);
  return shell('关于与来源', '提笔的编辑原则、来源、图片与本地存储说明。', '', `<article class="about-page container"><p class="eyebrow">ABOUT THE JOURNAL</p><h1>把好文字，留在手边。</h1><p class="lead">提笔，是一份慢慢积累的个人练字手记。<span class="en" lang="en">Between the Lines is a personal journal that grows one handwritten page at a time.</span></p><h2>阅读与练字 / Reading & writing</h2><p>每日内容围绕一个主题，中文为练字正文，英文逐句辅助理解。原文、意译和原创均在相应位置标明；来源链接随选句保留。</p><p class="en" lang="en">Each edition follows a theme. Chinese is the practice text, with line-by-line English support. Quotations, translations and original writing are labelled and linked to their sources.</p><h2>写作保存 / Saving your words</h2><p>手记保存在当前设备、当前浏览器的网站存储中，不会上传到网站服务器。清除网站数据、使用无痕模式或更换浏览器可能使手记无法恢复，请及时导出备份。不同设备之间不自动同步。</p><p class="en" lang="en">Writing stays in this browser on this device and is not uploaded to the website server. Clearing site data, private browsing or switching browsers may remove access to it. Export backups; devices do not sync automatically.</p><h2>图片与海报 / Images & posters</h2><p>文学配图根据作品全文或注明的阅读范围策划，由 AI 生成。电影主题封面为本站原创编辑设计，使用抽象的时钟、树影与星光，不使用官方海报、电影剧照或演员肖像。作品名称与短引用于介绍和评读，相关权利归原权利人。</p><p class="en" lang="en">Literary illustrations are AI-generated from documented readings. Original editorial film covers use abstract clocks, leaves and starlight rather than official key art, film stills or actor likenesses. Work titles and brief quotations support commentary; their original rights remain with their owners.</p><h2>开源参考 / Open-source references</h2><ul><li><a href="https://github.com/satnaing/astro-paper" target="_blank" rel="noopener noreferrer">AstroPaper</a>：内容归档与阅读结构 / content archives and readable structure · MIT</li><li><a href="https://github.com/saicaca/fuwari" target="_blank" rel="noopener noreferrer">Fuwari</a>：封面呈现与文章信息组织 / cover presentation and editorial metadata · MIT</li><li><a href="https://github.com/wuyoscar/GPT-Image2-Skill" target="_blank" rel="noopener noreferrer">GPT-Image2-Skill</a>：生图提示与画风策划参考 / image-prompt and composition reference · MIT</li></ul><p>本网站使用自行编写的轻量页面生成器，没有复制以上网站主题的代码或演示素材。</p><p class="en" lang="en">This site uses an original lightweight page generator. No theme code or demo assets were copied from the referenced websites.</p><a class="button" href="${dayUrl(latest)}">回到今日 / Back to today ↗</a></article>`, latest);
}

export function notFoundPage(latest) {
  return shell('这一页还没有写下', '页面未找到。', '', '<section class="not-found container"><p class="eyebrow">404</p><h1>这一页，还没有写下。</h1><p class="en" lang="en">This page has yet to be written.</p><a class="button" href="/">回到首页 / Go home ↗</a></section>', latest);
}
