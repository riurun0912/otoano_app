/**
 * songs.js — 楽曲カードの共有レンダリング関数
 * index.html と search.html から読み込まれる。
 */

/* HTML エスケープ */
function escHtml(s) {
  return String(s || '').replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'": '&#39;' }[c];
  });
}

/**
 * 1枚の楽曲カードHTMLを生成して返す。
 * @param {Object} song - songs.json の songs 配列の1要素
 * @returns {string} HTML文字列
 */
/* songs.json の値は統制語彙（vocab.js）のid。表示名は語彙から引く */
function songDifficultyLabel(song) {
  if (typeof otoanoDifficultyLabel === 'function' && song.difficulty) {
    var l = otoanoDifficultyLabel(song.difficulty);
    if (l && l !== song.difficulty) return l;
  }
  return song.difficultyLabel || '';
}
function asArray(v) { return Array.isArray(v) ? v : (v ? [v] : []); }

function buildCard(song) {
  var hasPlayer = !!song.playerFile;
  var href      = hasPlayer
    ? 'player.html?a=' + encodeURIComponent(song.playerFile)
    : '#';

  return [
    '<a href="', escHtml(href), '" class="song-card"',
    ' data-title="',      escHtml(song.title),      '"',
    ' data-band="',       escHtml(song.artist),     '"',
    ' data-era="',        escHtml(song.era),         '"',
    ' data-genre="',      escHtml(asArray(song.genre).join(' ')), '"',
    ' data-difficulty="', escHtml(song.difficulty),  '"',
    ' data-gear="',       escHtml(asArray(song.gear).join(' ')),  '"',
    hasPlayer ? '' : ' style="opacity:0.75;cursor:default;" onclick="return false;"',
    '>',

    '<div class="img-wrap">',
      '<img src="', escHtml(song.coverImage), '"',
      ' alt="', escHtml(song.title), ' / ', escHtml(song.artist), '"',
      ' onerror="this.parentElement.style.background=\'var(--line)\'" />',
    '</div>',

    '<div class="content">',
      '<div class="contributor-info">',
        '<div class="avatar" style="width:20px;height:20px;font-size:11px;">',
          escHtml(song.contributor.avatar),
        '</div>',
        '<span class="contributor-name">', escHtml(song.contributor.name), '</span>',
        hasPlayer ? '' :
          '<span style="margin-left:auto;font-size:10px;color:var(--muted);background:var(--line);padding:2px 7px;border-radius:99px;">準備中</span>',
      '</div>',

      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">',
        '<h3 style="margin:0 0 8px;">', escHtml(song.title), ' / ', escHtml(song.artist), '</h3>',
        '<div class="stars" style="font-size:13px;white-space:nowrap;flex-shrink:0;">',
          '★', (Math.round(song.rating * 10) / 10).toFixed(1),
        '</div>',
      '</div>',

      '<div class="meta">',
        '<span>', escHtml(songDifficultyLabel(song)), '</span>',
        '<span>', escHtml(song.duration), '</span>',
      '</div>',

      '<div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:10px;margin-top:10px;">',
        '<p style="font-size:12px;color:var(--accent);margin:0 0 4px;font-weight:bold;">投稿者のコメント</p>',
        '<p style="font-size:13px;margin:0;color:#d6def0;line-height:1.4;">', escHtml(song.comment), '</p>',
      '</div>',
    '</div>',

    '</a>'
  ].join('');
}

/**
 * songs.json を fetch して、コールバックに songs 配列を渡す。
 * @param {function(Array)} callback
 */
function loadSongs(callback) {
  fetch('songs.json?_=' + Date.now())
    .then(function(r) {
      if (!r.ok) throw new Error('songs.json の読み込みに失敗 (' + r.status + ')');
      return r.json();
    })
    .then(function(data) { callback(data.songs || []); })
    .catch(function(e) {
      console.error(e);
      callback([]);
    });
}
