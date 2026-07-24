/** ================================
 *  Config: annotation json URL
 *  - default: annotations.json
 *  - override: ?a=foo.json
 * ================================= */
const params = new URLSearchParams(location.search);
const ANNOTATION_URL = params.get("a") || "annotations.json";

/** runtime state loaded from JSON */
let VIDEO_ID = null;
let ANNOTATIONS = [];
let ANNOTATION_TITLE = null;
let GEAR_INFO = null;
let KNOWLEDGE_INFO = null;
let CREDIT = null;   // 投稿者・ライセンス等（dcterms:）と原典（schema:isBasedOn）
let CATEGORIES = [];
let currentCategory = "all";

let player = null;
let pollTimer = null;
let lastActiveId = null;

/** ---------- system messages ---------- */
let systemMsgId = 0;
function addSystemMessage(text, type = "info", dismissable = true) {
  const container = document.getElementById("systemMessages");
  if (!container) return null;
  const id = `sysmsg-${++systemMsgId}`;
  const icons = { info: "ℹ️", warn: "⚠️", error: "❌" };
  const div = document.createElement("div");
  div.className = `system-msg ${type}`;
  div.id = id;
  div.innerHTML = `
    <span class="msg-icon">${icons[type] || icons.info}</span>
    <span class="msg-text">${escapeHtml(text)}</span>
    ${dismissable ? `<button class="msg-dismiss" aria-label="閉じる">×</button>` : ""}
  `;
  if (dismissable) {
    div.querySelector(".msg-dismiss").addEventListener("click", () => div.remove());
  }
  container.appendChild(div);
  return id;
}
function removeSystemMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/** ---------- lazy library loading ---------- */
const libraryState = {
  abcjs: { loaded: false, loading: null, error: null },
  tonal: { loaded: false, loading: null, error: null },
  verovio: { loaded: false, loading: null, error: null },
  soundfont: { loaded: false, loading: null, error: null }
};

let pianoInstrument = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}

async function loadAbcjs() {
  if (libraryState.abcjs.loaded) return true;
  if (libraryState.abcjs.loading) return libraryState.abcjs.loading;
  libraryState.abcjs.loading = (async () => {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/abcjs@6/dist/abcjs-basic-min.js");
      if (!window.ABCJS) throw new Error("ABCJS not available after load");
      libraryState.abcjs.loaded = true;
      return true;
    } catch (e) {
      libraryState.abcjs.error = e;
      console.error("[abcjs]", e);
      addSystemMessage("abcjs の読み込みに失敗しました。コード進行の楽譜表示が利用できません。", "warn");
      return false;
    }
  })();
  return libraryState.abcjs.loading;
}

async function loadTonal() {
  if (libraryState.tonal.loaded) return true;
  if (libraryState.tonal.loading) return libraryState.tonal.loading;
  libraryState.tonal.loading = (async () => {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/tonal/browser/tonal.min.js");
      if (!window.Tonal) throw new Error("Tonal not available after load");
      libraryState.tonal.loaded = true;
      return true;
    } catch (e) {
      libraryState.tonal.error = e;
      console.error("[tonal]", e);
      addSystemMessage("Tonal.js の読み込みに失敗しました。コード解析機能が利用できません。", "warn");
      return false;
    }
  })();
  return libraryState.tonal.loading;
}

async function loadVerovio() {
  if (libraryState.verovio.loaded) return true;
  if (libraryState.verovio.loading) return libraryState.verovio.loading;
  libraryState.verovio.loading = (async () => {
    try {
      await loadScript("https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js");
      // Wait for WASM initialization
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Verovio WASM init timeout")), 10000);
        const check = () => {
          if (window.verovio && window.verovio.module) {
            if (window.verovio.module.calledRun) {
              clearTimeout(timeout);
              resolve();
            } else {
              window.verovio.module.onRuntimeInitialized = () => {
                clearTimeout(timeout);
                resolve();
              };
            }
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
      window.__verovioToolkit = new window.verovio.toolkit();
      libraryState.verovio.loaded = true;
      return true;
    } catch (e) {
      libraryState.verovio.error = e;
      console.error("[verovio]", e);
      addSystemMessage("Verovio の読み込みに失敗しました。楽譜表示・再生機能が利用できません。", "warn");
      return false;
    }
  })();
  return libraryState.verovio.loading;
}

async function loadSoundfont() {
  if (libraryState.soundfont.loaded) return true;
  if (libraryState.soundfont.loading) return libraryState.soundfont.loading;
  libraryState.soundfont.loading = (async () => {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js");
      if (!window.Soundfont) throw new Error("Soundfont not available after load");
      // Preload piano instrument
      const ctx = getAudioContext();
      pianoInstrument = await Soundfont.instrument(ctx, "acoustic_grand_piano", {
        soundfont: "MusyngKite",
        nameToUrl: (name, sf) => `https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/${sf}/${name}-mp3.js`
      });
      libraryState.soundfont.loaded = true;
      console.log("[soundfont] piano loaded");
      return true;
    } catch (e) {
      libraryState.soundfont.error = e;
      console.error("[soundfont]", e);
      addSystemMessage("サウンドフォントの読み込みに失敗しました。合成音で再生します。", "warn");
      return false;
    }
  })();
  return libraryState.soundfont.loading;
}

async function loadChordLibraries() {
  const [abcOk, tonalOk] = await Promise.all([loadAbcjs(), loadTonal()]);
  return abcOk && tonalOk;
}

async function loadScoreLibraries() {
  return loadVerovio();
}

function hasItemType(type) {
  return ANNOTATIONS.some(seg => seg.items && seg.items.some(it => it.type === type));
}

/** ---------- boot orchestration ---------- */
(async function boot() {
  try {
    const data = await loadAnnotations(ANNOTATION_URL);
    applyAnnotationData(data);

    renderCategoryFilter();
    renderSegments(); // list can be rendered before player
    renderGearInfo(); // Render gear info card content
    renderKnowledgeInfo(); // Render knowledge info card content
    renderCredit();        // 出典・ライセンスと引き継ぎ編集ボタン
    initModalControls(); // Set up all modal open/close events

    await loadYouTubeApi();
    await createPlayer(VIDEO_ID);

    // Lazy load libraries based on content
    const libraryLoads = [];
    if (hasItemType("chord")) {
      libraryLoads.push(loadChordLibraries().then(ok => {
        if (ok) console.log("[lazy] chord libraries loaded");
      }));
    }
    if (hasItemType("score")) {
      libraryLoads.push(loadScoreLibraries().then(ok => {
        if (ok) console.log("[lazy] score libraries loaded");
      }));
    }
    // Preload soundfont for better playback quality (chord/score items)
    if (hasItemType("chord") || hasItemType("score")) {
      libraryLoads.push(loadSoundfont().then(ok => {
        if (ok) console.log("[lazy] soundfont loaded");
      }));
    }
    // Don't block boot on library loading
    if (libraryLoads.length > 0) {
      Promise.all(libraryLoads).catch(e => console.warn("[lazy] library load error", e));
    }

    const t = readHashTime();
    if (Number.isFinite(t)) safeSeek(t);
    startPolling();
  } catch (e) {
    console.error(e);
    addSystemMessage("起動に失敗しました: " + (e?.message || String(e)), "error", false);
    document.getElementById("activeDesc").textContent =
      "起動に失敗しました。console を確認しつつ、annotations.json の videoId / JSON構文 / サーバ配信を確認してください。";
  }
})();

function initModalControls() {
  const setup = (modalId, openBtnId, closeBtnId) => {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);

    if (!modal || !openBtn || !closeBtn) return;

    openBtn.addEventListener("click", () => {
      modal.style.display = "flex";
    });
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  };
  
  setup("gearInfoModal", "gearInfoBtn", "gearInfoCloseBtn");
  setup("knowledgeModal", "knowledgeBtn", "knowledgeCloseBtn");
}

/** ---------- annotation JSON ---------- */
async function loadAnnotations(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`failed to fetch annotations (${res.status}) from ${url}`);
  const data = await res.json();
  validateAnnotationData(data);
  return data;
}

function validateAnnotationData(data) {
  if (!data || typeof data !== "object") throw new Error("annotations.json must be an object");
  if (!data.videoId || typeof data.videoId !== "string") throw new Error("annotations.json: videoId (string) is required");
  if (!Array.isArray(data.annotations)) throw new Error("annotations.json: annotations (array) is required");

  // soft checks
  for (const a of data.annotations) {
    if (!a.id) throw new Error("each annotation needs id");
    if (typeof a.start !== "number" || typeof a.end !== "number") throw new Error(`annotation ${a.id}: start/end must be numbers`);
    if (a.end <= a.start) throw new Error(`annotation ${a.id}: end must be > start`);
  }
}

/* 配列そのもの / {title, items} のどちらで来ても、カードの配列にそろえる（後方互換）。
   旧形式のグループ（type:"group"）は展開して平らにする。 */
function toItems(v) {
  const src = Array.isArray(v) ? v : (v && Array.isArray(v.items) ? v.items : []);
  const out = [];
  const walk = (list) => list.forEach(it => {
    if (!it || typeof it !== "object") return;
    if (it.type === "group" && Array.isArray(it.items)) { walk(it.items); return; }
    out.push(it);
  });
  walk(src);
  return out;
}

function applyAnnotationData(data) {
  VIDEO_ID = data.videoId;
  ANNOTATIONS = data.annotations.map(seg => {
    // Ensure 'categories' exists as an array, migrating from single 'category' if needed
    if (!seg.categories) {
      seg.categories = seg.category ? [seg.category] : ["other"];
    }
    return seg;
  });
  ANNOTATION_TITLE = data.title || null;

  // 楽曲全体の機材（otoano:hasGearInfo）。旧形式（globalInfo に全部入り）は gear だけ拾う
  let gear = data.gearInfo;
  if (!gear && data.globalInfo && Array.isArray(data.globalInfo.items)) {
    const g = [];
    const sort = (it) => {
      if (!it || typeof it !== "object") return;
      if (it.type === "group") { (it.items || []).forEach(sort); return; }
      if (it.type === "gear") g.push(it);
    };
    data.globalInfo.items.forEach(sort);
    gear = g;
  }
  GEAR_INFO  = { title: "使用機材", items: toItems(gear) };

  KNOWLEDGE_INFO = { title: "用語解説", items: toItems(data.knowledgeInfo) };
  // 来歴・権利表示（Dublin Core）と原典。引き継ぎ編集の根拠として画面に出す
  CREDIT = {
    creator: data.creator || "",
    created: data.created || "",
    modified: data.modified || "",
    license: data.license || "",
    isBasedOn: data.isBasedOn || ""
  };
  CATEGORIES = data.categories || [];

  document.title = ANNOTATION_TITLE ? `Otoano Player - ${ANNOTATION_TITLE}` : document.title;
  
  // 楽曲タイトルとバンド名を独立させ、横断検索へのリンクにする
  const titleDisplay = document.getElementById("songTitleDisplay");
  if (titleDisplay && ANNOTATION_TITLE) {
    const parts = ANNOTATION_TITLE.split(" / ");
    const songName = parts[0];
    const bandName = parts[1] || "";
    
    titleDisplay.innerHTML = `
      <a href="search.html?q=${encodeURIComponent(bandName)}" class="header-search-link">🎸 バンド：${escapeHtml(bandName)}</a>
      <span style="margin: 0 8px; opacity: 0.5;">/</span>
      <a href="search.html?q=${encodeURIComponent(songName)}" class="header-search-link">🎵 楽曲：${escapeHtml(songName)}</a>
    `;
  }
}

/** ---------- YouTube API ---------- */
function loadYouTubeApi() {
  return new Promise((resolve, reject) => {
    // already loaded
    if (window.YT && window.YT.Player) return resolve();

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = () => reject(new Error("failed to load YouTube iframe API"));
    document.head.appendChild(tag);

    // YouTube IFrame API calls global callback
    window.onYouTubeIframeAPIReady = () => resolve();
  });
}

function createPlayer(videoId) {
  return new Promise((resolve, reject) => {
    if (!window.YT || !window.YT.Player) return reject(new Error("YT.Player not available"));

    player = new YT.Player("player", {
      videoId,
      playerVars: {
        origin: window.location.origin, // 推奨（file://直開きは避けて http(s) で）
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: () => resolve(),
        onError: (e) => reject(new Error(`YouTube player error: ${e?.data}`)),
        onStateChange: () => { /* 必要なら状態でポーリング制御 */ }
      }
    });
  });
}

/** ---------- core logic ---------- */
function startPolling() {
  if (pollTimer) return;
  pollTimer = window.setInterval(() => {
    if (!player || typeof player.getCurrentTime !== "function") return;
    const t = player.getCurrentTime();
    updateActiveByTime(t);
  }, 200);
}

function updateActiveByTime(t) {
  const activeSegments = findAllActiveSegments(t);
  const activeIds = activeSegments.map(s => s.id).join(",");
  if (activeIds === lastActiveId) return;
  lastActiveId = activeIds;

  // highlight list
  for (const el of document.querySelectorAll(".seg")) {
    const isIdActive = activeSegments.some(s => s.id === el.dataset.id);
    el.classList.toggle("active", isIdActive);
  }
  renderActive(activeSegments, t);
}

function findAllActiveSegments(t) {
  return ANNOTATIONS.filter(s => t >= s.start && t < s.end);
}

function safeSeek(sec) {
  if (!player) return;
  const s = Math.max(0, Number(sec) || 0);
  player.seekTo(s, true);
  setHashTime(Math.floor(s));
}

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** ---------- rendering ---------- */
function renderCategoryFilter() {
  const wrap = document.getElementById("categoryFilterWrap");
  const select = document.getElementById("categorySelect");
  if (!wrap || !select || CATEGORIES.length === 0) {
    if (wrap) wrap.style.display = "none";
    return;
  }

  wrap.style.display = "block";
  select.innerHTML = "";
  for (const cat of CATEGORIES) {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.label;
    select.appendChild(opt);
  }

  select.value = currentCategory;
  select.addEventListener("change", (e) => {
    currentCategory = e.target.value;
    renderSegments();
  });
}

function renderSegments() {
  const box = document.getElementById("segments");
  box.innerHTML = "";

  const filtered = currentCategory === "all"
    ? ANNOTATIONS
    : ANNOTATIONS.filter(seg => seg.categories && seg.categories.includes(currentCategory));

  for (const seg of filtered) {
    const div = document.createElement("div");
    div.className = "seg";
    div.dataset.id = seg.id;
    
    const catHtml = (seg.categories || []).map(catId => {
      const cat = CATEGORIES.find(c => c.id === catId);
      if (!cat || cat.id === 'all') return "";
      return `<span class="cat-badge" data-cat="${catId}">${escapeHtml(cat.label)}</span>`;
    }).join("");

    div.innerHTML = `
      <div class="t">
        ${fmtTime(seg.start)} – ${fmtTime(seg.end)}
      </div>
      <div class="ttl">${escapeHtml(seg.title || seg.id)}${catHtml}</div>
    `;
    div.addEventListener("click", () => safeSeek(seg.start));
    box.appendChild(div);
  }
}

function renderGearInfo() {
  const openBtn = document.getElementById("gearInfoBtn");
  const header = document.getElementById("gearInfoHeader");
  const itemsContainer = document.getElementById("gearInfoItems");
  if (!openBtn || !itemsContainer || !GEAR_INFO) {
    if (openBtn) openBtn.style.display = "none";
    return;
  }
  openBtn.style.display = "inline-block";
  header.textContent = GEAR_INFO.title || "使用機材";
  itemsContainer.innerHTML = "";
  for (const it of (GEAR_INFO.items || [])) itemsContainer.appendChild(renderItemCard(it));
}

/* ライセンスURIを、人が読める名称と「引き継ぎ時に何が求められるか」に変換する */
const LICENSES = {
  "https://creativecommons.org/licenses/by/4.0/":
    { name: "CC BY 4.0（表示）", note: "投稿者を明記すれば、自由に編集・再配布できます。" },
  "https://creativecommons.org/licenses/by-sa/4.0/":
    { name: "CC BY-SA 4.0（表示・継承）", note: "投稿者を明記し、同じライセンスで公開すれば、自由に編集・再配布できます。" },
  "https://creativecommons.org/licenses/by-nc/4.0/":
    { name: "CC BY-NC 4.0（表示・非営利）", note: "投稿者を明記すれば、非営利の範囲で自由に編集・再配布できます。" },
  "https://creativecommons.org/publicdomain/zero/1.0/":
    { name: "CC0 1.0（権利放棄）", note: "権利が放棄されているため、条件なく自由に利用できます。" }
};

function renderCredit() {
  const card = document.getElementById("creditCard");
  const btn = document.getElementById("forkBtn");
  if (!card || !CREDIT) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || "—"; };
  set("creditCreator", CREDIT.creator);
  set("creditCreated", CREDIT.created);
  set("creditModified", CREDIT.modified);

  const lic = LICENSES[CREDIT.license];
  const licEl = document.getElementById("creditLicense");
  if (licEl) {
    licEl.innerHTML = CREDIT.license
      ? `<a href="${escapeHtml(CREDIT.license)}" target="_blank" rel="noopener noreferrer">${escapeHtml(lic ? lic.name : CREDIT.license)} ↗</a>`
      : "指定なし";
  }

  // 引き継いで作られたアノテーションなら、原典も示す
  if (CREDIT.isBasedOn) {
    const row = document.getElementById("creditBasedOnRow");
    if (row) row.style.display = "";
    set("creditBasedOn", CREDIT.isBasedOn);
  }

  const note = document.getElementById("creditNote");
  if (note) {
    note.textContent = (lic ? lic.note : "ライセンスが指定されていないため、再利用の可否は投稿者にご確認ください。")
      + "「引き継いで編集する」を押すと、この内容が投稿エディターに読み込まれ、原典への参照が自動で記録されます。";
  }
  if (btn) {
    btn.addEventListener("click", () => {
      window.location.href = "upload.html?a=" + encodeURIComponent(ANNOTATION_URL);
    });
  }
  card.style.display = "";
}

function renderKnowledgeInfo() {
  const openBtn = document.getElementById("knowledgeBtn");
  const header = document.getElementById("knowledgeHeader");
  const itemsContainer = document.getElementById("knowledgeItems");
  if (!openBtn || !itemsContainer || !KNOWLEDGE_INFO) {
    if (openBtn) openBtn.style.display = "none";
    return;
  }

  openBtn.style.display = "inline-block";
  header.textContent = KNOWLEDGE_INFO.title || "用語解説";
  itemsContainer.innerHTML = "";
  for (const it of (KNOWLEDGE_INFO.items || [])) {
    itemsContainer.appendChild(renderItemCard(it));
  }
}

function renderActive(activeSegments, now) {
  const container = document.querySelector(".activeArea .activeBody");
  if (!container) return;
  
  container.innerHTML = "";

  if (activeSegments.length === 0) {
    container.innerHTML = `
      <div class="activeTitle">（該当セグメントなし）</div>
      <div class="activeMeta">現在: ${fmtTime(now)} (${now.toFixed(2)}s)</div>
      <div class="activeDesc">この秒数をカバーするセグメントが未定義です。annotations.json に追加してください。</div>
      <div class="items" id="activeItems"></div>
    `;
    return;
  }

  activeSegments.forEach((seg, index) => {
    const segWrap = document.createElement("div");
    segWrap.className = "active-segment-layer";
    if (index > 0) {
      segWrap.style.marginTop = "24px";
      segWrap.style.paddingTop = "24px";
      segWrap.style.borderTop = "2px dashed var(--line)";
    }

    const title = document.createElement("div");
    title.className = "activeTitle";
    title.textContent = seg.title || seg.id;
    segWrap.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "activeMeta";
    meta.textContent = `範囲: ${fmtTime(seg.start)}–${fmtTime(seg.end)} / 現在: ${fmtTime(now)} / id: ${seg.id}`;
    segWrap.appendChild(meta);

    // 奏法タグ（統制語彙 otoano:usesTechnique）
    if (Array.isArray(seg.techniques) && seg.techniques.length > 0) {
      const techWrap = document.createElement("div");
      techWrap.className = "tech-tags";
      for (const tid of seg.techniques) {
        const label = (typeof otoanoTechLabel === "function") ? otoanoTechLabel(tid) : tid;
        const tech = (typeof OTOANO_TECHNIQUES !== "undefined")
          ? OTOANO_TECHNIQUES.find(t => t.id === tid) : null;
        const tag = document.createElement(tech && tech.url ? "a" : "span");
        tag.className = "tech-tag";
        tag.textContent = label;
        if (tech && tech.url) {
          tag.href = tech.url;
          tag.target = "_blank";
          tag.rel = "noopener noreferrer";
          tag.title = "奏法の解説を見る";
        }
        techWrap.appendChild(tag);
      }
      segWrap.appendChild(techWrap);
    }

    const desc = document.createElement("div");
    desc.className = "activeDesc";
    desc.textContent = seg.description || "";
    segWrap.appendChild(desc);

    const itemsLabel = document.createElement("div");
    itemsLabel.className = "pill";
    itemsLabel.style.display = "inline-block";
    itemsLabel.style.marginBottom = "10px";
    itemsLabel.textContent = "関連カード";
    segWrap.appendChild(itemsLabel);

    const items = document.createElement("div");
    items.className = "items";
    for (const it of (seg.items || [])) {
      items.appendChild(renderItemCard(it));
    }
    segWrap.appendChild(items);

    container.appendChild(segWrap);
  });
}

function renderItemCard(it) {
  const card = document.createElement("div");
  card.className = "item";

  if (it.type === "group") {
    // 奏法ブロック（otoano:aboutTechnique 付き）は、奏法名を見出しにして辞典へリンクする
    card.className = it.aboutTechnique ? "item-group item-tech-group" : "item-group";
    const isKnown = it.aboutTechnique && it.aboutTechnique !== "other-technique"
      && (typeof OTOANO_TECHNIQUES !== "undefined")
      && OTOANO_TECHNIQUES.some(t => t.id === it.aboutTechnique);
    const head = it.aboutTechnique
      ? `<p class="itTitle"><span class="tech-mark">${it.aboutTechnique === "other-technique" ? "その他" : "奏法"}</span>${escapeHtml(it.title || "")}${
          isKnown ? ` <a class="tech-dict-link" href="terms.html#${encodeURIComponent(it.aboutTechnique)}" title="奏法・機材解説で見る">解説 ↗</a>` : ""
        }</p>`
      : `<p class="itTitle">${escapeHtml(it.title || "Group")}</p>`;
    card.innerHTML = head;
    const subItemsContainer = document.createElement("div");
    subItemsContainer.className = "items";
    for (const subItem of (it.items || [])) {
      subItemsContainer.appendChild(renderItemCard(subItem));
    }
    card.appendChild(subItemsContainer);
    return card;
  }

  if (it.type === "video" && it.videoId) {
    const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(it.videoId)}/hqdefault.jpg`;
    const startTime = it.startTime || 0;
    const thumbContainer = document.createElement("div");
    thumbContainer.className = "thumb-container";
    thumbContainer.innerHTML = `
      <img class="thumb" src="${thumb}" alt="" />
      <div class="play-overlay">▶</div>
    `;
    card.appendChild(thumbContainer);

    const body = document.createElement("div");
    body.className = "itBody";
    body.innerHTML = `
      <p class="itTitle">${escapeHtml(it.title || "Related video")}</p>
      <p class="itNote">${escapeHtml(it.note || "")}</p>
    `;
    card.appendChild(body);

    thumbContainer.addEventListener("click", (e) => {
      e.stopPropagation();
      const iframe = document.createElement("iframe");
      iframe.className = "thumb";
      iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(it.videoId)}?autoplay=1&start=${startTime}`;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      thumbContainer.replaceWith(iframe);
    });
    return card;
  }

  if (it.type === "videofile" && it.src) {
    const thumbContainer = document.createElement("div");
    thumbContainer.className = "thumb-container";
    thumbContainer.innerHTML = `
      <div class="thumb" style="display:flex;align-items:center;justify-content:center;color:#3a4258;font-size:32px;">🎬</div>
      <div class="play-overlay">▶</div>
    `;
    card.appendChild(thumbContainer);

    const body = document.createElement("div");
    body.className = "itBody";
    body.innerHTML = `
      <p class="itTitle">${escapeHtml(it.title || "動画")}</p>
      <p class="itNote">${escapeHtml(it.note || "")}</p>
    `;
    card.appendChild(body);

    thumbContainer.addEventListener("click", (e) => {
      e.stopPropagation();
      const video = document.createElement("video");
      video.className = "thumb";
      video.src = it.src;
      video.controls = true;
      video.autoplay = true;
      if (it.startTime) video.currentTime = it.startTime;
      thumbContainer.replaceWith(video);
    });
    return card;
  }

  if (it.type === "chord" && it.progression) {
    card.className = "item item-chord";

    const chordDisplay = document.createElement("div");
    chordDisplay.className = "chord-display";

    // abcjs 用の描画コンテナ
    const abcContainer = document.createElement("div");
    abcContainer.className = "abc-container";
    chordDisplay.appendChild(abcContainer);

    let visualObj = null;

    // ライブラリがロードされているか確認して描画
    if (libraryState.abcjs.loaded && libraryState.tonal.loaded && window.ABCJS && window.Tonal) {
      const abcNotation = generateAbcFromProgression(it);
      visualObj = ABCJS.renderAbc(abcContainer, abcNotation, {
        responsive: "resize",
        add_classes: true,
        staffwidth: 250
      });
    } else {
      // ライブラリ未ロード: テキストフォールバック
      const chordText = it.progression.map(p => p.chord).join(" → ");
      abcContainer.innerHTML = `<div style="padding:12px;color:var(--muted);font-size:13px;">
        ${escapeHtml(chordText)}
        <br><small style="opacity:0.7;">（ライブラリ読み込み中…）</small>
      </div>`;
      // 遅延ロードを試みる
      loadChordLibraries().then(ok => {
        if (ok && window.ABCJS && window.Tonal) {
          abcContainer.innerHTML = "";
          const abcNotation = generateAbcFromProgression(it);
          visualObj = ABCJS.renderAbc(abcContainer, abcNotation, {
            responsive: "resize",
            add_classes: true,
            staffwidth: 250
          });
        } else {
          abcContainer.innerHTML = `<div style="padding:12px;color:var(--muted);font-size:13px;">
            ${escapeHtml(chordText)}
          </div>`;
        }
      });
    }

    const playBtn = document.createElement("button");
    playBtn.className = "chord-play-btn";
    playBtn.textContent = "▶ 再生";
    chordDisplay.appendChild(playBtn);

    card.appendChild(chordDisplay);

    const body = document.createElement("div");
    body.className = "itBody";
    body.innerHTML = `
      <p class="itTitle">${escapeHtml(it.title || "コード進行")}</p>
      <p class="itNote">${escapeHtml(it.note || "")}</p>
    `;
    card.appendChild(body);

    playBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      // 再生時にもライブラリチェック
      if (!libraryState.tonal.loaded) {
        const ok = await loadTonal();
        if (!ok) {
          addSystemMessage("コード再生にはTonal.jsが必要です", "warn");
          return;
        }
      }
      playChordProgression(it, abcContainer, visualObj);
    });
    return card;
  }

  if (it.type === "score") {
    card.className = "item item-score";

    const scoreDisplay = document.createElement("div");
    scoreDisplay.className = "score-display";

    const scoreContainer = document.createElement("div");
    scoreContainer.className = "score-container";
    scoreDisplay.appendChild(scoreContainer);

    const playBtn = document.createElement("button");
    playBtn.className = "score-play-btn";
    playBtn.textContent = "▶ 再生";
    scoreDisplay.appendChild(playBtn);
    card.appendChild(scoreDisplay);

    const body = document.createElement("div");
    body.className = "itBody";
    body.innerHTML = `
      <p class="itTitle">${escapeHtml(it.title || "Score")}</p>
      <p class="itNote">${escapeHtml(it.note || "")}</p>
    `;
    card.appendChild(body);

    // ライブラリ読み込み状態に応じて描画
    if (libraryState.verovio.loaded) {
      renderScoreItem(it, scoreContainer);
    } else {
      scoreContainer.textContent = "楽譜ライブラリを読み込み中…";
      loadScoreLibraries().then(ok => {
        if (ok) {
          renderScoreItem(it, scoreContainer);
        } else {
          scoreContainer.textContent = "楽譜ライブラリの読み込みに失敗しました";
        }
      });
    }

    playBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!libraryState.verovio.loaded) {
        const ok = await loadScoreLibraries();
        if (!ok) {
          addSystemMessage("楽譜再生にはVerovioが必要です", "warn");
          return;
        }
      }
      playScoreItem(it, playBtn);
    });
    return card;
  }

  if (it.type === "gear") {
    // 機材設定カード（otoano:GearUsage）: 製品情報＋パラメータ表で音作りを構造的に提示
    card.className = "item item-gear";
    // 下位分類（例: fx-overdrive）なら「エフェクター / オーバードライブ」と上位もあわせて示す
    const catLabel = (typeof otoanoGearCatDisplay === "function")
      ? otoanoGearCatDisplay(it.gearCategory)
      : ((typeof otoanoGearCatLabel === "function") ? otoanoGearCatLabel(it.gearCategory) : (it.gearCategory || ""));

    let html = "";
    if (it.src) {
      html += `<img class="thumb" src="${escapeHtml(it.src)}" alt="" />`;
    }
    html += `<div class="itBody">
      <p class="itTitle">${escapeHtml(it.title || "機材設定")}${catLabel ? ` <span class="gear-cat">${escapeHtml(catLabel)}</span>` : ""}</p>`;

    if (Array.isArray(it.settings) && it.settings.length > 0) {
      html += `<table class="gear-table"><tbody>`;
      for (const s of it.settings) {
        html += `<tr>
          <td class="gear-param">${escapeHtml(s.name || "")}</td>
          <td class="gear-value">${escapeHtml(String(s.value ?? ""))}</td>
          <td class="gear-unit">${escapeHtml(s.unit || "")}</td>
        </tr>`;
      }
      html += `</tbody></table>`;
    }

    if (it.note) html += `<p class="itNote">${escapeHtml(it.note)}</p>`;
    if (it.url) html += `<a class="gear-link" href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">製品ページ ↗</a>`;
    html += `</div>`;

    card.innerHTML = html;
    // 設定写真はクリックで拡大（画像カードと同じ操作感を維持）
    const gearImg = card.querySelector("img.thumb");
    if (gearImg) {
      gearImg.style.cursor = "zoom-in";
      gearImg.addEventListener("click", (e) => {
        e.stopPropagation();
        window.open(it.src, "_blank", "noopener,noreferrer");
      });
    }
    // 機材の中に入れた参考資料（schema:hasPart）
    if (Array.isArray(it.items) && it.items.length > 0) {
      const sub = document.createElement("div");
      sub.className = "items gear-subitems";
      for (const subItem of it.items) sub.appendChild(renderItemCard(subItem));
      card.querySelector(".itBody").appendChild(sub);
    }
    return card;
  }

  if (it.type === "image" && it.src) {
    card.innerHTML = `
      <img class="thumb" src="${escapeHtml(it.src)}" alt="" />
      <div class="itBody">
        <p class="itTitle">${escapeHtml(it.title || "Image")}</p>
        <p class="itNote">${escapeHtml(it.note || "")}</p>
      </div>
    `;
    card.addEventListener("click", () => {
      window.open(it.src, "_blank", "noopener,noreferrer");
    });
    return card;
  }

  if (it.type === "link" && it.url) {
    // 用語解説（terms.html）への内部リンク解決。
    // 統制語彙 vocab.js のラベルと照合するので、語彙を増やせば辞書へのリンク対象も自動で増える。
    const glossaryId = (text) => {
      if (!text) return null;
      const pool = [];
      if (typeof OTOANO_TECHNIQUES !== "undefined") pool.push(...OTOANO_TECHNIQUES);
      if (typeof OTOANO_GEAR_SUBTYPES !== "undefined") pool.push(...OTOANO_GEAR_SUBTYPES);
      if (typeof OTOANO_GEAR_CATEGORIES !== "undefined") pool.push(...OTOANO_GEAR_CATEGORIES.filter(c => c.desc));
      // 長いラベルから照合する（「ブリッジミュート」が「ミュート」に先取りされないように）
      const hit = pool.slice()
        .sort((a, b) => b.label.length - a.label.length)
        .find(c => text.includes(c.label));
      return hit ? hit.id : null;
    };
    // 統制語彙に含まれない音楽理論の項目（terms.html 側で定義）
    const THEORY_MAP = { "ダイアトニック": "diatonic", "五度圏": "fifth" };

    let targetUrl = it.url;
    let isInternal = it.url.startsWith("terms.html");

    if (!isInternal) {
      let tid = glossaryId(it.title) || glossaryId(it.url);
      if (!tid) {
        for (const [key, id] of Object.entries(THEORY_MAP)) {
          if ((it.title && it.title.includes(key)) || (it.url && it.url.includes(key))) { tid = id; break; }
        }
      }
      if (tid) { targetUrl = "terms.html#" + tid; isInternal = true; }
    }

    const note = it.note || it.url;
    const displayNote = isInternal ? `奏法・機材解説で見る \n${note}` : note;

    card.innerHTML = `
      <div class="itBody">
        <p class="itTitle">${escapeHtml(it.title || "Link")}</p>
        <p class="itNote" style="white-space: pre-wrap;">${escapeHtml(displayNote)}</p>
      </div>
    `;

    card.addEventListener("click", () => {
      if (isInternal) {
        window.location.href = targetUrl;
      } else {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    });
    return card;
  }

  if (it.type === "term") {
    // 用語解説カード（schema:DefinedTerm）: 分類バッジ＋解説＋任意の画像・リンク
    card.className = "item item-term";
    const catLabel = (typeof otoanoTermCatLabel === "function")
      ? otoanoTermCatLabel(it.termCategory) : (it.termCategory || "");
    let html = "";
    if (it.src) html += `<img class="thumb" src="${escapeHtml(it.src)}" alt="" onerror="this.style.display='none'" />`;
    html += `<div class="itBody">
      <p class="itTitle">${escapeHtml(it.title || "用語")}${catLabel ? ` <span class="gear-cat">${escapeHtml(catLabel)}</span>` : ""}</p>`;
    if (it.text) html += `<p class="itNote">${escapeHtml(it.text)}</p>`;
    if (it.url)  html += `<a class="gear-link" href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">参考リンク ↗</a>`;
    html += `</div>`;
    card.innerHTML = html;
    return card;
  }

  // text fallback（任意で画像・リンクを添付可能）
  let textHtml = "";
  if (it.src) textHtml += `<img class="thumb" src="${escapeHtml(it.src)}" alt="" onerror="this.style.display='none'" />`;
  textHtml += `<div class="itBody">
    <p class="itTitle">${escapeHtml(it.title || "Note")}</p>
    <p class="itNote">${escapeHtml(it.text || it.note || "")}</p>`;
  if (it.url) textHtml += `<a class="gear-link" href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">参考リンク ↗</a>`;
  textHtml += `</div>`;
  card.innerHTML = textHtml;
  if (it.url && !it.src) {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => window.open(it.url, "_blank", "noopener,noreferrer"));
  }
  return card;
}

/** ---------- keyboard controls ---------- */
document.addEventListener("keydown", (e) => {
  // 入力フィールドにフォーカス中は無視
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  if (e.code === "Space") {
    e.preventDefault();
    togglePlayPause();
  }
});

function togglePlayPause() {
  if (!player || typeof player.getPlayerState !== "function") return;
  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

/** ---------- header controls ---------- */
document.getElementById("sidebarToggle").addEventListener("click", () => {
  document.querySelector("main").classList.toggle("sidebar-collapsed");
});

/** ---------- chord player (abcjs + Web Audio API) ---------- */
let audioCtx = null;
let chordPlayerActive = false;
let chordIdCounter = 0;
let verovioToolkit = null;
let verovioDebugCount = 0;
let scorePlayerActive = false;

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// 音名をABC記法に変換（例: "F#" → "^F", "Eb" → "_E"）
function noteToAbc(noteName, octave = 3) {
  // Tonal の音名（例: "C", "F#", "Eb", "E3"）をABC記法に変換
  let letter = "";
  let accidental = "";
  let finalOctave = octave;

  if (window.Tonal && Tonal.Note && typeof Tonal.Note.get === "function") {
    const parsed = Tonal.Note.get(noteName);
    if (parsed && !parsed.empty && parsed.pc) {
      letter = parsed.pc[0].toUpperCase();
      accidental = parsed.pc.slice(1).replace(/#/g, '^').replace(/b/g, '_');
      if (typeof parsed.oct === "number") {
        finalOctave = parsed.oct;
      } else if (typeof parsed.octave === "number") {
        finalOctave = parsed.octave;
      }
    }
  }

  if (!letter) {
    const match = noteName.match(/^([A-Ga-g])([#b]*)$/);
    if (match) {
      letter = match[1].toUpperCase();
      accidental = match[2].replace(/#/g, '^').replace(/b/g, '_');
    } else {
      // フォールバック: 記号が後置の形式を前置に寄せる
      const fallback = noteName.replace(/#/g, '^').replace(/b/g, '_');
      const fallbackMatch = fallback.match(/^([A-Ga-g])([_^]+)$/);
      if (fallbackMatch) {
        letter = fallbackMatch[1].toUpperCase();
        accidental = fallbackMatch[2];
      } else {
        letter = fallback ? fallback[0].toUpperCase() : "";
        accidental = fallback ? fallback.slice(1) : "";
      }
    }
  }

  // ABC記法のオクターブ表記
  // C4 = C, C5 = c, C6 = c', C3 = C,, C2 = C,,
  let suffix = "";
  if (finalOctave >= 5) {
    letter = letter.toLowerCase();
    if (finalOctave > 5) suffix = "'".repeat(finalOctave - 5);
  } else if (finalOctave === 4) {
    // そのまま（大文字）
  } else {
    suffix = ",".repeat(4 - finalOctave);
  }
  return `${accidental}${letter}${suffix}`;
}

function chordNotesWithOctave(chordNameOrObj, baseOctave = 3) {
  if (!window.Tonal || !Tonal.Chord) return [];
  const chord = typeof chordNameOrObj === "string"
    ? Tonal.Chord.get(chordNameOrObj)
    : chordNameOrObj;
  if (!chord || !chord.tonic || !chord.intervals || chord.intervals.length === 0) {
    return [];
  }
  if (!Tonal.Note || typeof Tonal.Note.transpose !== "function") {
    return [];
  }
  const root = `${chord.tonic}${baseOctave}`;
  return chord.intervals.map(interval => Tonal.Note.transpose(root, interval));
}

// コード名からABC記法の和音を生成
function chordToAbcNotes(chordName, baseOctave = 3) {
  if (!window.Tonal || !Tonal.Chord) return 'z';
  const chord = Tonal.Chord.get(chordName);
  if (!chord.notes || chord.notes.length === 0) {
    return 'z'; // フォールバック: 休符
  }
  const notesWithOctave = chordNotesWithOctave(chord, baseOctave);
  const sourceNotes = notesWithOctave.length > 0 ? notesWithOctave : chord.notes;
  const abcNotes = sourceNotes.map(note => noteToAbc(note, baseOctave));
  return '[' + abcNotes.join('') + ']';
}

// progression から ABC記法を生成
function generateAbcFromProgression(item) {
  const progression = item.progression || [];
  const timeSignature = item.timeSignature || [4, 4];
  const [beatsPerMeasure, beatUnit] = timeSignature;

  // L: 音価の基本単位を決定（拍子の分母に基づく）
  const unitLength = `1/${beatUnit}`;

  let abc = `X:1\n`;
  abc += `M:${beatsPerMeasure}/${beatUnit}\n`;
  abc += `L:${unitLength}\n`;
  abc += `K:C clef=bass\n`;

  // コードを拍位置に配置
  let currentBeat = 1;
  let currentAbsBeat = 1;
  let measures = [];
  let currentMeasure = [];
  const useAbsoluteBeat = progression.some(p => Number.isFinite(p.beat) && p.beat > beatsPerMeasure);

  for (const chord of progression) {
    const beats = Number.isFinite(chord.beats) && chord.beats > 0 ? chord.beats : 1;
    let beat = Number.isFinite(chord.beat)
      ? chord.beat
      : (useAbsoluteBeat ? currentAbsBeat : currentBeat);

    if (useAbsoluteBeat) {
      if (beat < currentAbsBeat) beat = currentAbsBeat;
      // 拍位置までの休符を埋める（絶対拍）
      while (currentAbsBeat < beat) {
        currentMeasure.push('z');
        currentBeat++;
        currentAbsBeat++;
        if (currentBeat > beatsPerMeasure) {
          measures.push(currentMeasure.join(''));
          currentMeasure = [];
          currentBeat = 1;
        }
      }
    } else {
      // 拍位置までの休符を埋める（小節内の拍）
      while (currentBeat < beat) {
        currentMeasure.push('z');
        currentBeat++;
        if (currentBeat > beatsPerMeasure) {
          measures.push(currentMeasure.join(''));
          currentMeasure = [];
          currentBeat = 1;
        }
      }
    }

    // コードを和音として配置
    const duration = beats > 1 ? beats : '';
    const abcChord = chordToAbcNotes(chord.chord);
    currentMeasure.push(`"${chord.chord}"${abcChord}${duration}`);
    currentBeat += beats;
    currentAbsBeat += beats;

    // 小節をまたぐ場合
    while (currentBeat > beatsPerMeasure) {
      measures.push(currentMeasure.join(''));
      currentMeasure = [];
      currentBeat -= beatsPerMeasure;
    }
  }

  // 残りの小節を閉じる
  if (currentMeasure.length > 0) {
    // 小節の残りを休符で埋める
    while (currentBeat <= beatsPerMeasure) {
      currentMeasure.push('z');
      currentBeat++;
    }
    measures.push(currentMeasure.join(''));
  }

  abc += measures.join(' | ') + ' |]\n';
  return abc;
}

/** ---------- score renderer (verovio) ---------- */
function getVerovioToolkit() {
  if (window.__verovioToolkit) return window.__verovioToolkit;
  if (!libraryState.verovio.loaded) {
    logVerovioStatus("not loaded yet");
    return null;
  }
  if (!window.verovio || typeof window.verovio.toolkit !== "function") {
    logVerovioStatus("toolkit missing");
    return null;
  }
  if (!verovioToolkit) {
    try {
      verovioToolkit = new window.verovio.toolkit();
      window.__verovioToolkit = verovioToolkit;
    } catch (e) {
      console.error("[verovio] toolkit init failed", e);
      logVerovioStatus("toolkit init failed");
      return null;
    }
  }
  return verovioToolkit;
}

function logVerovioStatus(context) {
  verovioDebugCount += 1;
  const scriptTag = document.querySelector('script[src*="verovio-toolkit"]');
  console.warn("[verovio]", context, {
    count: verovioDebugCount,
    hasWindowVerovio: !!window.verovio,
    toolkitType: window.verovio ? typeof window.verovio.toolkit : "missing",
    scriptSrc: scriptTag ? scriptTag.getAttribute("src") : "missing",
    readyState: document.readyState,
    hasModule: !!(window.verovio && window.verovio.module),
    hasToolkitInstance: !!window.__verovioToolkit,
    libraryState: libraryState.verovio
  });
}

async function waitForVerovioToolkit(timeoutMs = 5000) {
  if (window.__verovioToolkit) return window.__verovioToolkit;
  // Try loading if not already
  if (!libraryState.verovio.loaded && !libraryState.verovio.loading) {
    const ok = await loadVerovio();
    if (!ok) return null;
  } else if (libraryState.verovio.loading) {
    await libraryState.verovio.loading;
  }
  return window.__verovioToolkit || null;
}

function renderScoreItem(item, container) {
  const format = String(item.format || "mei").toLowerCase();
  const options = item.renderOptions || {};
  logVerovioStatus("render start");

  const renderData = (data) => {
    const toolkit = getVerovioToolkit();
    if (!toolkit) {
      container.textContent = "Loading Verovio…";
      waitForVerovioToolkit().then((readyToolkit) => {
        if (!readyToolkit) {
          container.textContent = "Verovio not loaded";
          logVerovioStatus("render blocked");
          return;
        }
        renderData(data);
      });
      return;
    }
    const width = Math.max(320, container.clientWidth || 600);
    const pageWidth = Number.isFinite(options.pageWidth)
      ? options.pageWidth
      : Math.round(width * 10);
    const pageHeight = Number.isFinite(options.pageHeight)
      ? options.pageHeight
      : Math.round(pageWidth * 1.4);
    const scale = Number.isFinite(options.scale) ? options.scale : 35;

    toolkit.setOptions({
      scale,
      pageWidth,
      pageHeight,
      adjustPageWidth: true,
      adjustPageHeight: true
    });

    try {
      toolkit.loadData(data);
      const svg = toolkit.renderToSVG(1, {});
      container.innerHTML = svg;
      item.__scoreData = data;
    } catch (e) {
      console.error(e);
      container.textContent = "Score render failed";
    }
  };

  if (item.data) {
    container.textContent = "Rendering score…";
    renderData(item.data);
    return;
  }

  if (item.src) {
    container.textContent = "Loading score…";
    fetch(item.src, { cache: "no-store" })
      .then(res => {
        if (!res.ok) throw new Error(`failed to fetch score (${res.status})`);
        return res.text();
      })
      .then(data => renderData(data))
      .catch(e => {
        console.error(e);
        container.textContent = "Score load failed";
      });
    return;
  }

  container.textContent = "Score data missing";
}

function parseMidiData(bytes) {
  const view = bytes;
  let p = 0;
  const readU32 = () => {
    const v = (view[p] << 24) | (view[p + 1] << 16) | (view[p + 2] << 8) | view[p + 3];
    p += 4;
    return v >>> 0;
  };
  const readU16 = () => {
    const v = (view[p] << 8) | view[p + 1];
    p += 2;
    return v;
  };
  const readVar = () => {
    let v = 0;
    while (p < view.length) {
      const b = view[p++];
      v = (v << 7) | (b & 0x7f);
      if ((b & 0x80) === 0) break;
    }
    return v;
  };
  const readStr4 = () => {
    const s = String.fromCharCode(view[p], view[p + 1], view[p + 2], view[p + 3]);
    p += 4;
    return s;
  };

  if (readStr4() !== "MThd") throw new Error("Invalid MIDI header");
  const headerLen = readU32();
  const format = readU16();
  const nTracks = readU16();
  const division = readU16();
  p += Math.max(0, headerLen - 6);

  const ticksPerQuarter = division > 0 ? division : 480;
  const tempoEvents = [];
  const notes = [];

  for (let t = 0; t < nTracks; t++) {
    const tag = readStr4();
    if (tag !== "MTrk") throw new Error("Invalid MIDI track");
    const trackLen = readU32();
    const end = p + trackLen;
    let tick = 0;
    let running = null;
    const active = new Map();
    while (p < end) {
      const delta = readVar();
      tick += delta;
      let status = view[p];
      if (status < 0x80) {
        if (running == null) continue;
        status = running;
      } else {
        p += 1;
        running = status;
      }
      if (status === 0xff) {
        const metaType = view[p++];
        const len = readVar();
        if (metaType === 0x51 && len === 3) {
          const tempo = (view[p] << 16) | (view[p + 1] << 8) | view[p + 2];
          tempoEvents.push({ tick, tempo });
        }
        p += len;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) {
        const len = readVar();
        p += len;
        continue;
      }

      const type = status & 0xf0;
      const channel = status & 0x0f;
      const data1 = view[p++];
      const data2 = (type === 0xc0 || type === 0xd0) ? null : view[p++];

      if (type === 0x90 || type === 0x80) {
        const note = data1;
        const velocity = data2 ?? 0;
        const key = `${channel}-${note}`;
        if (type === 0x90 && velocity > 0) {
          active.set(key, { tick, velocity, channel, note });
        } else {
          const on = active.get(key);
          if (on) {
            notes.push({ startTick: on.tick, endTick: tick, note, velocity: on.velocity, channel });
            active.delete(key);
          }
        }
      }
    }
  }

  return { ticksPerQuarter, tempoEvents, notes, format };
}

function buildTempoMap(tempoEvents, ticksPerQuarter) {
  const map = [];
  let tempo = 500000;
  if (tempoEvents && tempoEvents.length) {
    const sorted = [...tempoEvents].sort((a, b) => a.tick - b.tick);
    for (const evt of sorted) {
      if (evt.tick === 0) tempo = evt.tempo;
    }
    map.push({ tick: 0, tempo, timeSec: 0 });
    let lastTick = 0;
    let lastTempo = tempo;
    let timeSec = 0;
    for (const evt of sorted) {
      if (evt.tick <= 0) continue;
      timeSec += (evt.tick - lastTick) * lastTempo / (ticksPerQuarter * 1000000);
      map.push({ tick: evt.tick, tempo: evt.tempo, timeSec });
      lastTick = evt.tick;
      lastTempo = evt.tempo;
    }
  } else {
    map.push({ tick: 0, tempo: 500000, timeSec: 0 });
  }
  return map;
}

function ticksToSeconds(tick, tempoMap, ticksPerQuarter) {
  let entry = tempoMap[0];
  for (let i = 0; i < tempoMap.length; i++) {
    if (tempoMap[i].tick <= tick) entry = tempoMap[i];
    else break;
  }
  return entry.timeSec + (tick - entry.tick) * entry.tempo / (ticksPerQuarter * 1000000);
}

function midiDataToUint8(midiData) {
  if (midiData instanceof Uint8Array) return midiData;
  if (midiData instanceof ArrayBuffer) return new Uint8Array(midiData);
  if (typeof midiData === "string") {
    const b64 = midiData.includes(",") ? midiData.split(",").pop() : midiData;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return null;
}

async function playScoreItem(item, buttonEl) {
  if (scorePlayerActive) return;
  scorePlayerActive = true;
  if (buttonEl) buttonEl.textContent = "再生中…";

  const toolkit = getVerovioToolkit();
  if (!toolkit) {
    scorePlayerActive = false;
    if (buttonEl) buttonEl.textContent = "▶ 再生";
    return;
  }

  const getData = async () => {
    if (item.data) return item.data;
    if (item.__scoreData) return item.__scoreData;
    if (item.src) {
      const res = await fetch(item.src, { cache: "no-store" });
      if (!res.ok) throw new Error(`failed to fetch score (${res.status})`);
      const text = await res.text();
      item.__scoreData = text;
      return text;
    }
    return null;
  };

  try {
    const data = await getData();
    if (!data) throw new Error("Score data missing");
    toolkit.loadData(data);
    if (typeof toolkit.renderToMIDI !== "function") {
      throw new Error("renderToMIDI unavailable");
    }
    const midiData = toolkit.renderToMIDI();
    const bytes = midiDataToUint8(midiData);
    if (!bytes) throw new Error("Invalid MIDI data");
    const parsed = parseMidiData(bytes);
    const tempoMap = buildTempoMap(parsed.tempoEvents, parsed.ticksPerQuarter);

    const ctx = getAudioContext();
    await ctx.resume();

    // soundfont の読み込みを試みる（非同期、失敗しても続行）
    if (!libraryState.soundfont.loaded && !libraryState.soundfont.loading) {
      loadSoundfont().catch(() => {});
    }

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(ctx.destination);
    const baseTime = ctx.currentTime + 0.1;

    let totalDuration = 0;
    for (const n of parsed.notes) {
      const startSec = ticksToSeconds(n.startTick, tempoMap, parsed.ticksPerQuarter);
      const endSec = ticksToSeconds(n.endTick, tempoMap, parsed.ticksPerQuarter);
      const duration = Math.max(0, endSec - startSec);
      if (duration <= 0) continue;
      totalDuration = Math.max(totalDuration, endSec);
      const velocity = Math.max(0.1, Math.min(1, (n.velocity || 80) / 127));

      if (pianoInstrument) {
        // soundfont版（高音質）
        playPianoNoteSF(n.note, baseTime + startSec, duration * 0.98, velocity);
      } else {
        // フォールバック: 合成音
        playPianoNote(midiToFreq(n.note), baseTime + startSec, duration * 0.98, ctx, masterGain, velocity);
      }
    }

    setTimeout(() => {
      scorePlayerActive = false;
      if (buttonEl) buttonEl.textContent = "▶ 再生";
    }, (totalDuration + 0.2) * 1000);
  } catch (e) {
    console.error(e);
    scorePlayerActive = false;
    if (buttonEl) buttonEl.textContent = "▶ 再生";
  }
}

// Tonal.js を使用したコード解析
function parseChord(chordName, baseOctave = 3) {
  if (!window.Tonal || !Tonal.Chord || !Tonal.Note) {
    // フォールバック: Cメジャー相当
    return { notes: [48, 52, 55], bass: 36 };
  }
  const chord = Tonal.Chord.get(chordName);
  if (!chord.notes || chord.notes.length === 0) {
    // フォールバック
    return { notes: [48], bass: 36 };
  }

  const notesWithOctave = chordNotesWithOctave(chord, baseOctave);
  const sourceNotes = notesWithOctave.length > 0
    ? notesWithOctave
    : chord.notes.map(note => `${note}${baseOctave}`);
  const notes = sourceNotes
    .map(note => Tonal.Note.midi(note))
    .filter(midi => typeof midi === "number");

  // ベース音（スラッシュコードの場合は指定されたベース、なければルート）
  let bassMidi;
  if (chord.bass) {
    bassMidi = Tonal.Note.midi(chord.bass + (baseOctave - 1));
  } else {
    bassMidi = Tonal.Note.midi(chord.tonic + (baseOctave - 1));
  }

  return { notes, bass: bassMidi };
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ピアノ風の音を鳴らす
function playPianoNote(freq, startTime, duration, ctx, destination, velocity = 1) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'triangle';
  osc1.frequency.value = freq;
  osc2.type = 'sine';
  osc2.frequency.value = freq * 2; // 1オクターブ上の倍音

  const oscGain1 = ctx.createGain();
  const oscGain2 = ctx.createGain();
  oscGain1.gain.value = 0.6;
  oscGain2.gain.value = 0.2;

  osc1.connect(oscGain1);
  osc2.connect(oscGain2);
  oscGain1.connect(gain);
  oscGain2.connect(gain);
  gain.connect(destination);

  // ADSR エンベロープ
  const attack = 0.02;
  const decay = 0.1;
  const sustain = 0.4;
  const release = 0.3;
  const peakGain = 0.3 * Math.max(0.05, Math.min(1, velocity));

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
  gain.gain.linearRampToValueAtTime(peakGain * sustain, startTime + attack + decay);
  gain.gain.setValueAtTime(peakGain * sustain, startTime + duration - release);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc1.start(startTime);
  osc1.stop(startTime + duration + 0.1);
  osc2.start(startTime);
  osc2.stop(startTime + duration + 0.1);
}

// soundfont-player を使った再生（高音質）
function playPianoNoteSF(midiNote, startTime, duration, gain = 1) {
  if (!pianoInstrument) return null;
  return pianoInstrument.play(midiNote, startTime, {
    duration: duration,
    gain: gain * 0.8
  });
}

function playChord(chordName, startTime, duration, ctx, destination) {
  const { notes, bass } = parseChord(chordName);
  const velocity = 0.7;

  if (pianoInstrument) {
    // soundfont版
    playPianoNoteSF(bass, startTime, duration, velocity);
    for (const midi of notes) {
      playPianoNoteSF(midi, startTime, duration, velocity);
    }
  } else {
    // フォールバック: 合成音
    playPianoNote(midiToFreq(bass), startTime, duration, ctx, destination);
    for (const midi of notes) {
      playPianoNote(midiToFreq(midi), startTime, duration, ctx, destination);
    }
  }
}

// コード進行を再生
async function playChordProgression(item, abcContainer, visualObj) {
  if (chordPlayerActive) return;
  chordPlayerActive = true;

  const ctx = getAudioContext();
  await ctx.resume();

  // soundfont の読み込みを試みる（非同期、失敗しても続行）
  if (!libraryState.soundfont.loaded && !libraryState.soundfont.loading) {
    loadSoundfont().catch(() => {});
  }

  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.5;
  masterGain.connect(ctx.destination);

  const syncStart = item.syncStart;
  const progression = item.progression || [];

  // YouTube動画の音量を下げて再生
  if (player && typeof player.setVolume === 'function' && syncStart !== undefined) {
    player.setVolume(25);
    player.seekTo(syncStart, true);
    player.playVideo();
  }

  const baseTime = ctx.currentTime + 0.1;

  // 各コードの再生とハイライト
  for (let i = 0; i < progression.length; i++) {
    const chord = progression[i];
    const startOffset = chord.start || 0;
    const endOffset = chord.end || (startOffset + 1);
    const duration = endOffset - startOffset;

    // 音を鳴らす
    playChord(chord.chord, baseTime + startOffset, duration * 0.95, ctx, masterGain);

    // abcjs のコード表示をハイライト
    if (abcContainer) {
      setTimeout(() => {
        // 全てのコード表示からハイライトを除去
        abcContainer.querySelectorAll('.abcjs-chord').forEach(el => {
          el.classList.remove('chord-highlight');
        });
        // 現在のコードをハイライト
        const chordElements = abcContainer.querySelectorAll('.abcjs-chord');
        if (chordElements[i]) {
          chordElements[i].classList.add('chord-highlight');
        }
      }, startOffset * 1000);
    }
  }

  // 終了後に音量を戻す・ハイライト解除
  const totalDuration = Math.max(...progression.map(c => c.end || 0), 0);
  setTimeout(() => {
    if (player && typeof player.setVolume === 'function') {
      player.setVolume(100);
    }
    if (abcContainer) {
      abcContainer.querySelectorAll('.abcjs-chord').forEach(el => {
        el.classList.remove('chord-highlight');
      });
    }
    chordPlayerActive = false;
  }, (totalDuration + 0.5) * 1000);
}

/** ---------- utilities ---------- */
function readHashTime() {
  const m = (window.location.hash || "").match(/t=(\d+)/);
  if (!m) return NaN;
  return Number(m[1]);
}
function setHashTime(sec) {
  const s = Math.max(0, Number(sec) || 0);
  history.replaceState(null, "", `${location.search ? location.search : ""}#t=${s}`);
}
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
