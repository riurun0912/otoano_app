/**
 * vocab.js — Otoano 統制語彙（UI用）
 * vocab.ttl（RDF語彙）と1対1で対応する。
 * プレイヤー（script.js）・アノテーション投稿エディター（upload.html）・
 * 奏法/用語辞書（terms.html）が、すべてこのファイルを唯一の語彙定義として読み込む。
 *
 *   label … schema:name        desc … schema:description
 *   url   … rdfs:seeAlso の代表1件   gro … otoano:groClass
 *   group / parent … skos:broader
 *   tags  … 検索用の補助キーワード（UI専用。RDF語彙には含めない）
 */

/* 奏法のグループ（otoano:tg-* ／ UIの並び順と見出し） */
const OTOANO_TECH_GROUPS = [
  { id: "basic", label: "基本・コード" },
  { id: "picking", label: "ピッキング" },
  { id: "fingering", label: "フィンガリング" },
  { id: "electric", label: "エレキ特有" },
  { id: "other", label: "その他" }
];

/* 奏法（otoano:Technique）。glossary:false の項目は辞典に載せない受け皿 */
const OTOANO_TECHNIQUES = [
  { id: "stroke", label: "ストローク", group: "basic", gro: null, url: "https://guitar-hakase.com/2774/", links: [{"u":"https://guitar-hakase.com/2774/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%94%E3%83%83%E3%82%AF%E5%A5%8F%E6%B3%95","s":"Wikipedia"}], desc: "複数の弦をまとめて弾く動作。ダウンストロークとアップストロークを組み合わせてリズムを刻む。初心者が最初に覚える基本動作であり、リズムの安定が上達の鍵になる。", tags: ["基礎","コード弾き","リズム"] },
  { id: "cutting", label: "カッティング", group: "basic", gro: null, url: "https://guitar-hakase.com/2735/", links: [{"u":"https://guitar-hakase.com/2735/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%9F%E3%83%A5%E3%83%BC%E3%83%88_(%E3%82%AE%E3%82%BF%E3%83%BC)","s":"Wikipedia"}], desc: "弦を弾いた直後に手を弦へ触れさせ、音を短く切る奏法。ファンクやポップスでリズムを強調する際によく使われる。音の粒がはっきりするため、グルーヴ感の演出に効果的。", tags: ["ファンク","ポップス","リズムギター"] },
  { id: "brushing", label: "ブラッシング", group: "basic", gro: null, url: "https://guitar-hakase.com/2768/", links: [{"u":"https://guitar-hakase.com/2768/","s":"ギター博士"}], desc: "左手で弦を押さえずに軽く触れたまま弾き、音程のない「ジャッ」という打楽器的な音を出す奏法。カッティングの合間に混ぜることでリズムのノリを作る。", tags: ["ファンク","リズム","ミュート"] },
  { id: "bridge-mute", label: "ブリッジミュート", group: "basic", gro: null, url: "https://guitar-hakase.com/2766/", links: [{"u":"https://guitar-hakase.com/2766/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%9F%E3%83%A5%E3%83%BC%E3%83%88_(%E3%82%AE%E3%82%BF%E3%83%BC)","s":"Wikipedia"}], desc: "右手の側面をブリッジ付近の弦に軽く押し当てて、重厚でタイトな音を出す奏法。ロックやパンクのバッキングで必須となる。押し当てる強さで音のこもり具合を調整できる。", tags: ["ロック","パンク","バッキング"] },
  { id: "chord-change", label: "コードチェンジ", group: "basic", gro: null, url: "https://guitar-hakase.com/2403/", links: [{"u":"https://guitar-hakase.com/2403/","s":"ギター博士"}], desc: "押さえるコードを切り替える動作。次のコードと共通する指を離さずに残すと指の移動が減り、音を途切れさせずにつなげられる。初心者が最初につまずきやすい部分。", tags: ["基礎","バッキング","運指"] },
  { id: "barre-chord", label: "バレーコード", group: "basic", gro: "Ceja", url: "https://guitar-hakase.com/5639/", links: [{"u":"https://guitar-hakase.com/5639/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%90%E3%83%AC%E3%83%BC%E3%82%B3%E3%83%BC%E3%83%89","s":"Wikipedia"}], desc: "人差し指で複数の弦をまとめて押さえるフォーム。同じ形を平行移動するだけで多くのコードが弾けるため、覚える押さえ方の数を大幅に減らせる。セーハとも呼ばれる。", tags: ["基礎","フォーム","セーハ"] },
  { id: "power-chord", label: "パワーコード", group: "basic", gro: null, url: "https://guitar-hakase.com/2770/", links: [{"u":"https://guitar-hakase.com/2770/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%91%E3%83%AF%E3%83%BC%E3%82%B3%E3%83%BC%E3%83%89","s":"Wikipedia"}], desc: "ルートと5度（および1オクターブ上のルート）だけを鳴らす和音。長三度・短三度を含まないため明暗が決まらず、強く歪ませても音が濁りにくい。ロックの中核となる響き。", tags: ["ロック","歪み","5度"] },
  { id: "arpeggio", label: "アルペジオ", group: "basic", gro: "Arpeggio", url: "https://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%AB%E3%83%9A%E3%83%83%E3%82%B8%E3%83%A7", links: [{"u":"https://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%AB%E3%83%9A%E3%83%83%E3%82%B8%E3%83%A7","s":"Wikipedia"}], desc: "和音を同時に鳴らさず、構成音を1音ずつ順に鳴らしていく奏法。コード感を保ったまま静かな響きを作れるため、バラードやイントロで多用される。分散和音とも呼ばれる。", tags: ["バラード","イントロ","分散和音"] },
  { id: "octave", label: "オクターブ奏法", group: "basic", gro: "Octave", url: "https://guitar-hakase.com/3709/", links: [{"u":"https://guitar-hakase.com/3709/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%AA%E3%82%AF%E3%82%BF%E3%83%BC%E3%83%B4%E5%A5%8F%E6%B3%95","s":"Wikipedia"}], desc: "同じ音を1オクターブ違いで同時に鳴らす奏法。間に挟まる弦はミュートして2音だけを響かせる。単音より太く、バンドの中でも埋もれにくいメロディになる。", tags: ["メロディ","ジャズ","ファンク"] },
  { id: "alternate-picking", label: "オルタネイトピッキング", group: "picking", gro: null, url: "https://guitar-hakase.com/2764/", links: [{"u":"https://guitar-hakase.com/2764/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%94%E3%83%83%E3%82%AF%E5%A5%8F%E6%B3%95","s":"Wikipedia"}], desc: "ダウンとアップを規則的に交互に繰り返すピッキング。ピックの無駄な動きが減るため、速いフレーズを安定して弾ける。速弾きの土台となる基礎技術。", tags: ["基礎","速弾き","右手"] },
  { id: "tremolo-picking", label: "トレモロピッキング", group: "picking", gro: "Tremolo", url: "https://ja.wikipedia.org/wiki/%E3%83%88%E3%83%AC%E3%83%A2%E3%83%AD", links: [{"u":"https://ja.wikipedia.org/wiki/%E3%83%88%E3%83%AC%E3%83%A2%E3%83%AD","s":"Wikipedia"}], desc: "同じ音を極めて速く連続して刻む奏法。音が途切れず持続しているように聞こえ、緊張感や盛り上がりを作り出せる。", tags: ["速弾き","ロック","持続音"] },
  { id: "sweep-picking", label: "スウィープピッキング", group: "picking", gro: null, url: "https://guitar-hakase.com/2776/", links: [{"u":"https://guitar-hakase.com/2776/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%B9%E3%82%A6%E3%82%A3%E3%83%BC%E3%83%97%E5%A5%8F%E6%B3%95","s":"Wikipedia"}], desc: "隣り合う弦を、箒で掃くようにダウン（またはアップ）方向へ連続して弾く奏法。アルペジオを高速で流れるように鳴らせる。", tags: ["速弾き","アルペジオ","テクニカル"] },
  { id: "picking-harmonics", label: "ピッキングハーモニクス", group: "picking", gro: null, url: "https://guitar-hakase.com/2760/", links: [{"u":"https://guitar-hakase.com/2760/","s":"ギター博士"}], desc: "ピッキングと同時に親指を弦へ軽く触れさせ、倍音を強調した甲高い音を出す奏法。歪ませたリードギターで、叫ぶような効果を作るときに使われる。", tags: ["ロック","リード","倍音"] },
  { id: "hammer-on", label: "ハンマリング・オン", group: "fingering", gro: "Ascending_slur", url: "https://guitar-hakase.com/10535/", links: [{"u":"https://guitar-hakase.com/10535/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%8F%E3%83%B3%E3%83%9E%E3%83%AA%E3%83%B3%E3%82%B0%E3%83%BB%E3%82%AA%E3%83%B3","s":"Wikipedia"}], desc: "押さえている指より高いフレットを別の指で叩きつけて発音する奏法。ピッキングせずに音をつなぐため、なめらかな上行フレーズになる。", tags: ["レガート","スラー","左手"] },
  { id: "pull-off", label: "プリング・オフ", group: "fingering", gro: "Descending_slur", url: "https://guitar-hakase.com/10535/", links: [{"u":"https://guitar-hakase.com/10535/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%97%E3%83%AA%E3%83%B3%E3%82%B0%E3%83%BB%E3%82%AA%E3%83%95","s":"Wikipedia"}], desc: "押さえていた指を弦に引っかけながら離して発音する奏法。ハンマリングと逆方向の動きで、下行フレーズをなめらかにつなぐ。", tags: ["レガート","スラー","左手"] },
  { id: "trill", label: "トリル", group: "fingering", gro: null, url: "https://guitar-hakase.com/2754/", links: [{"u":"https://guitar-hakase.com/2754/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E8%A3%85%E9%A3%BE%E9%9F%B3","s":"Wikipedia"}], desc: "ハンマリングとプリングを高速で繰り返し、隣り合う2つの音を細かく行き来させる装飾技法。緊張感のある持続音として使われる。", tags: ["装飾音","レガート","持続音"] },
  { id: "slide", label: "スライド", group: "fingering", gro: "Slide", url: "https://guitar-hakase.com/2752/", links: [{"u":"https://guitar-hakase.com/2752/","s":"ギター博士"}], desc: "弦を押さえたまま指を滑らせて別のフレットへ移動し、音程を連続的に変化させる奏法。フレーズのつなぎに表情を与える。", tags: ["表現技法","レガート","移動"] },
  { id: "glissando", label: "グリッサンド", group: "fingering", gro: "Glissando", url: "https://guitar-hakase.com/2752/", links: [{"u":"https://guitar-hakase.com/2752/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%B0%E3%83%AA%E3%83%83%E3%82%B5%E3%83%B3%E3%83%89","s":"Wikipedia"}], desc: "到達する音を特定せず、音程を大きく滑らせる奏法。イントロや場面の切り替えで勢いをつける効果として使われる。", tags: ["表現技法","効果","移動"] },
  { id: "choking", label: "チョーキング", group: "fingering", gro: "Choking", url: "https://guitar-hakase.com/2758/", links: [{"u":"https://guitar-hakase.com/2758/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%81%E3%83%A7%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B0","s":"Wikipedia"}], desc: "弦を指で押し上げて音程を変化させる奏法。ギターを歌わせるような表現が可能になり、ソロ演奏で非常に多用される。半音〜全音が一般的で、ビブラートと組み合わせると表現がより豊かになる。", tags: ["ソロ","リードギター","表現技法"] },
  { id: "vibrato", label: "ビブラート", group: "fingering", gro: "Vibrato", url: "https://guitar-hakase.com/2756/", links: [{"u":"https://guitar-hakase.com/2756/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%93%E3%83%96%E3%83%A9%E3%83%BC%E3%83%88","s":"Wikipedia"}], desc: "音を伸ばしている間に音程を細かく揺らし、音に張りと余韻を与える奏法。揺らす速さと幅に奏者の個性が最も表れる部分とされる。", tags: ["表現技法","ソロ","ロングトーン"] },
  { id: "tapping", label: "タッピング", group: "fingering", gro: "Tapping", url: "https://guitar-hakase.com/1235/", links: [{"u":"https://guitar-hakase.com/1235/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%BF%E3%83%83%E3%83%94%E3%83%B3%E3%82%B0%E5%A5%8F%E6%B3%95","s":"Wikipedia"}], desc: "右手の指で指板を叩いて発音する奏法。左手だけでは届かない広い音程差のフレーズを弾ける。ライトハンド奏法とも呼ばれる。", tags: ["テクニカル","両手","ロック"] },
  { id: "harmonics", label: "ハーモニクス", group: "fingering", gro: "Natural_harmonics", url: "https://guitar-hakase.com/2762/", links: [{"u":"https://guitar-hakase.com/2762/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%95%E3%83%A9%E3%82%B8%E3%82%AA%E3%83%AC%E3%83%83%E3%83%88","s":"Wikipedia"}], desc: "弦の特定の位置に指を軽く触れさせたまま弾き、倍音だけを響かせる奏法。澄んだ鐘のような音になる。12・7・5フレット上が代表的な位置。", tags: ["倍音","フラジオレット","効果"] },
  { id: "arming", label: "アーミング", group: "electric", gro: null, url: "https://guitar-hakase.com/26557/", links: [{"u":"https://guitar-hakase.com/26557/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%BC%E3%83%9F%E3%83%B3%E3%82%B0","s":"Wikipedia"}], desc: "ブリッジのアーム（トレモロユニット）を操作して弦の張力を変え、音程を上下させる奏法。細かい揺らしから急激な音程変化まで作れる、エレキギター特有の表現。", tags: ["トレモロユニット","表現技法","ロック"] },
  { id: "slide-bar", label: "ボトルネック奏法", group: "electric", gro: null, url: "https://guitar-hakase.com/1257/", links: [{"u":"https://guitar-hakase.com/1257/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%B9%E3%83%A9%E3%82%A4%E3%83%89%E3%82%AE%E3%82%BF%E3%83%BC","s":"Wikipedia"}], desc: "ガラスや金属の筒（スライドバー）を指にはめ、弦に当てたまま滑らせて演奏する奏法。フレットに区切られない連続的な音程が得られる。ブルースで多用される。", tags: ["ブルース","スライドバー","表現技法"] },
  { id: "volume-swell", label: "ボリューム奏法", group: "electric", gro: null, url: "https://guitar-hakase.com/1253/", links: [{"u":"https://guitar-hakase.com/1253/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%90%E3%82%A4%E3%82%AA%E3%83%AA%E3%83%B3%E5%A5%8F%E6%B3%95","s":"Wikipedia"}], desc: "ボリュームを絞った状態で弦を弾き、直後にボリュームを上げてアタック音を消す奏法。バイオリンのようにふわりと立ち上がる音になる。バイオリン奏法とも呼ばれる。", tags: ["表現技法","ボリューム","バイオリン奏法"] },
  { id: "feedback-play", label: "フィードバック奏法", group: "electric", gro: null, url: "https://guitar-hakase.com/1247/", links: [{"u":"https://guitar-hakase.com/1247/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%95%E3%82%A3%E3%83%BC%E3%83%89%E3%83%90%E3%83%83%E3%82%AF%E5%A5%8F%E6%B3%95","s":"Wikipedia"}], desc: "アンプから出た音をギターのピックアップが拾うことで生じる発振音を、意図的に楽音として使う奏法。音を長く伸ばしたり、叫ぶような効果を作る。", tags: ["ロック","アンプ","発振音"] },
  { id: "other-technique", label: "その他", group: "other", gro: null, url: null, links: [], desc: "統制語彙に該当する奏法がない場合に選ぶ項目。具体的な名称は投稿時に自由入力する。", tags: [], glossary: false }
];

/* 機材カテゴリ（otoano:gearCategory の値・上位8分類） */
const OTOANO_GEAR_CATEGORIES = [
  { id: "guitar", label: "ギター", url: "https://guitar-hakase.com/4004/", links: [{"u":"https://guitar-hakase.com/4004/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%A8%E3%83%AC%E3%82%AF%E3%83%88%E3%83%AA%E3%83%83%E3%82%AF%E3%83%BB%E3%82%AE%E3%82%BF%E3%83%BC","s":"Wikipedia"}], desc: "弦の振動をピックアップで電気信号に変換する楽器。ボディの形状とピックアップの種類によって音の傾向が大きく変わるため、同じ設定でも機種が違えば別の音になる。", tags: ["本体","ピックアップ","ボディ"] },
  { id: "amp", label: "アンプ", url: "https://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%B3%E3%83%97_(%E6%A5%BD%E5%99%A8%E7%94%A8)", links: [{"u":"https://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%B3%E3%83%97_(%E6%A5%BD%E5%99%A8%E7%94%A8)","s":"Wikipedia"}], desc: "ギターの微弱な信号を増幅してスピーカーから鳴らす装置。真空管アンプは温かみのある音、トランジスタアンプはクリアでタイトな音になる。歪みの多くはここで作られる。", tags: ["真空管","トランジスタ","音作り"] },
  { id: "effector", label: "エフェクター", url: "https://guitar-hakase.com/effector/", links: [{"u":"https://guitar-hakase.com/effector/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%A8%E3%83%95%E3%82%A7%E3%82%AF%E3%82%BF%E3%83%BC","s":"Wikipedia"}], desc: "ギターとアンプの間につないで音を加工する機器。歪み・揺らぎ・残響など役割ごとに種類が分かれ、つなぐ順番によっても音が変わる。", tags: ["音作り","ペダル","接続順"] },
  { id: "multi-effector", label: "マルチエフェクター", url: "https://ja.wikipedia.org/wiki/%E3%82%A8%E3%83%95%E3%82%A7%E3%82%AF%E3%82%BF%E3%83%BC", links: [{"u":"https://ja.wikipedia.org/wiki/%E3%82%A8%E3%83%95%E3%82%A7%E3%82%AF%E3%82%BF%E3%83%BC","s":"Wikipedia"}], desc: "多数のエフェクターとアンプの音を1台にまとめた機器。設定を丸ごと保存・呼び出しできるため、曲ごとの音を素早く切り替えられる。", tags: ["一体型","プリセット","切り替え"] },
  { id: "cable", label: "シールド", url: "https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%BC%E3%83%AB%E3%83%89%E3%82%B1%E3%83%BC%E3%83%96%E3%83%AB", links: [{"u":"https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%BC%E3%83%AB%E3%83%89%E3%82%B1%E3%83%BC%E3%83%96%E3%83%AB","s":"Wikipedia"}], desc: "ギターとアンプ、またはエフェクター同士をつなぐケーブル。ノイズを防ぐために内部がシールド構造になっていることからこう呼ばれる。長さや品質が音に影響することもある。", tags: ["ケーブル","接続","ノイズ"] },
  { id: "pick", label: "ピック", url: "https://ja.wikipedia.org/wiki/%E3%83%94%E3%83%83%E3%82%AF", links: [{"u":"https://ja.wikipedia.org/wiki/%E3%83%94%E3%83%83%E3%82%AF","s":"Wikipedia"}], desc: "弦を弾くための小片。厚さと素材でアタック感や音の硬さが変わり、薄いものはストローク向き、厚いものは単音弾き向きとされる。", tags: ["厚さ","素材","アタック"] },
  { id: "strings", label: "弦", url: "https://ja.wikipedia.org/wiki/%E5%BC%A6_(%E6%A5%BD%E5%99%A8)", links: [{"u":"https://ja.wikipedia.org/wiki/%E5%BC%A6_(%E6%A5%BD%E5%99%A8)","s":"Wikipedia"}], desc: "太さ（ゲージ）によって音と弾き心地が変わる。細い弦は押さえやすくチョーキングが楽、太い弦は音が太く張りが出る。消耗品であり定期的な交換が必要。", tags: ["ゲージ","太さ","交換"] },
  { id: "other", label: "その他", url: null, links: [], desc: null, tags: [] }
];

/* 機材カテゴリの下位分類（skos:broader）。parent は上位カテゴリまたは中間の系統のid。
   gearCategory にはこの id をそのまま入れてよい（上位カテゴリのままでも有効＝後方互換）。 */
const OTOANO_GEAR_SUBTYPES = [
  { id: "fx-drive", label: "歪み系", parent: "effector", url: "https://guitar-hakase.com/effector/", links: [{"u":"https://guitar-hakase.com/effector/","s":"ギター博士"}], desc: "音を意図的に歪ませ、太さ・伸び・迫力を加える系統。エレキギターの音作りの中心であり、ロックらしい音のほとんどはここで決まる。", tags: ["音作り","ロック","中核"] },
  { id: "fx-overdrive", label: "オーバードライブ", parent: "fx-drive", url: "https://guitar-hakase.com/40669/", links: [{"u":"https://guitar-hakase.com/40669/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%AA%E3%83%BC%E3%83%90%E3%83%BC%E3%83%89%E3%83%A9%E3%82%A4%E3%83%96_(%E9%9F%B3%E9%9F%BF%E6%A9%9F%E5%99%A8)","s":"Wikipedia"}], desc: "アンプを過大入力させた時のような自然な歪みを得るエフェクター。ピッキングの強弱に反応しやすく、幅広いジャンルで使われる。Tube Screamer（TS-9）やBOSS BD-2などが定番モデル。", tags: ["ナチュラル","TS-9","BD-2"] },
  { id: "fx-distortion", label: "ディストーション", parent: "fx-drive", url: "https://guitar-hakase.com/40574/", links: [{"u":"https://guitar-hakase.com/40574/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%87%E3%82%A3%E3%82%B9%E3%83%88%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3_(%E9%9F%B3%E9%9F%BF%E6%A9%9F%E5%99%A8)","s":"Wikipedia"}], desc: "オーバードライブより深く強い歪みを作るエフェクター。音の粒がそろい伸びが長くなるため、ハードロックやメタルのリフ・ソロに向く。", tags: ["メタル","ハードロック","深い歪み"] },
  { id: "fx-fuzz", label: "ファズ", parent: "fx-drive", url: "https://guitar-hakase.com/40665/", links: [{"u":"https://guitar-hakase.com/40665/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%95%E3%82%A1%E3%82%BA_(%E9%9F%B3%E9%9F%BF%E6%A9%9F%E5%99%A8)","s":"Wikipedia"}], desc: "波形を潰しきったような、荒く毛羽立った歪みを作るエフェクター。歪み系の中で最も古く、1960年代のロックを象徴する音として知られる。", tags: ["ヴィンテージ","60年代","荒い"] },
  { id: "fx-booster", label: "ブースター", parent: "fx-drive", url: "https://guitar-hakase.com/35417/", links: [{"u":"https://guitar-hakase.com/35417/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%96%E3%83%BC%E3%82%B9%E3%82%BF%E3%83%BC_(%E9%9F%B3%E9%9F%BF%E6%A9%9F%E5%99%A8)","s":"Wikipedia"}], desc: "歪ませるのではなく信号そのものを持ち上げるエフェクター。ソロだけ音量を上げたり、後段のアンプをより深く歪ませる「押し込み」に使う。", tags: ["ソロ","音量","前段"] },
  { id: "fx-modulation", label: "モジュレーション系", parent: "effector", url: "https://guitar-hakase.com/effector/", links: [{"u":"https://guitar-hakase.com/effector/","s":"ギター博士"}], desc: "音を時間的に揺らして、うねりや広がりを加える系統。コード弾きに立体感を、単音に色気を与える。", tags: ["揺らぎ","広がり","立体感"] },
  { id: "fx-chorus", label: "コーラス", parent: "fx-modulation", url: "https://guitar-hakase.com/35220/", links: [{"u":"https://guitar-hakase.com/35220/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%BC%E3%83%A9%E3%82%B9_(%E9%9F%B3%E9%9F%BF%E6%A9%9F%E5%99%A8)","s":"Wikipedia"}], desc: "元の音にわずかにずらした音を重ね、複数人で弾いているような厚みと揺らぎを出すエフェクター。クリーントーンのアルペジオと相性がよい。", tags: ["厚み","クリーン","アルペジオ"] },
  { id: "fx-flanger", label: "フランジャー", parent: "fx-modulation", url: "https://guitar-hakase.com/7359/", links: [{"u":"https://guitar-hakase.com/7359/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%95%E3%83%A9%E3%83%B3%E3%82%B8%E3%83%A3%E3%83%BC","s":"Wikipedia"}], desc: "遅らせた音を重ねた際の干渉によって、ジェット機が通り過ぎるような強いうねりを作るエフェクター。コーラスより効果が派手。", tags: ["うねり","派手","ジェット"] },
  { id: "fx-phaser", label: "フェイザー", parent: "fx-modulation", url: "https://guitar-hakase.com/7545/", links: [{"u":"https://guitar-hakase.com/7545/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%95%E3%82%A7%E3%82%A4%E3%82%B6%E3%83%BC_(%E9%9F%B3%E9%9F%BF%E6%A9%9F%E5%99%A8)","s":"Wikipedia"}], desc: "位相をずらした音を重ね、シュワシュワとした周期的な揺れを作るエフェクター。フランジャーより柔らかく、カッティングと好相性。", tags: ["シュワシュワ","カッティング","ファンク"] },
  { id: "fx-tremolo", label: "トレモロ", parent: "fx-modulation", url: "https://guitar-hakase.com/7628/", links: [{"u":"https://guitar-hakase.com/7628/","s":"ギター博士"}], desc: "音量を周期的に上下させ、音が途切れるような揺れを作るエフェクター。速さと深さの設定で、ゆったりした波から細かい刻みまで変化する。", tags: ["音量","周期","ヴィンテージ"] },
  { id: "fx-vibrato", label: "ビブラート", parent: "fx-modulation", url: "https://ja.wikipedia.org/wiki/%E3%83%93%E3%83%96%E3%83%A9%E3%83%BC%E3%83%88", links: [{"u":"https://ja.wikipedia.org/wiki/%E3%83%93%E3%83%96%E3%83%A9%E3%83%BC%E3%83%88","s":"Wikipedia"}], desc: "音程を周期的に揺らすエフェクター。音量を揺らすトレモロとは、揺らす対象が異なる点で区別される。", tags: ["ピッチ","揺れ","表現"] },
  { id: "fx-ambient", label: "空間系", parent: "effector", url: "https://guitar-hakase.com/effector/", links: [{"u":"https://guitar-hakase.com/effector/","s":"ギター博士"}], desc: "残響や音の反復を加え、演奏に奥行きと空間の広さを与える系統。", tags: ["残響","奥行き","広がり"] },
  { id: "fx-reverb", label: "リバーブ", parent: "fx-ambient", url: "https://guitar-hakase.com/38810/", links: [{"u":"https://guitar-hakase.com/38810/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%AA%E3%83%90%E3%83%BC%E3%83%96","s":"Wikipedia"}], desc: "ホールや部屋の残響を再現し、音に奥行きと余韻を与えるエフェクター。かけ過ぎると音の輪郭がぼやけるため、曲の密度に合わせた調整が必要。", tags: ["残響","ホール","余韻"] },
  { id: "fx-delay", label: "ディレイ", parent: "fx-ambient", url: "https://guitar-hakase.com/38783/", links: [{"u":"https://guitar-hakase.com/38783/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%87%E3%82%A3%E3%83%AC%E3%82%A4_(%E9%9F%B3%E9%9F%BF%E6%A9%9F%E5%99%A8)","s":"Wikipedia"}], desc: "音を遅らせて繰り返す、やまびこのような効果を作るエフェクター。繰り返しの間隔を曲のテンポに合わせるとフレーズに立体感が出る。", tags: ["やまびこ","反復","テンポ"] },
  { id: "fx-looper", label: "ルーパー", parent: "fx-ambient", url: "https://guitar-hakase.com/19104/", links: [{"u":"https://guitar-hakase.com/19104/","s":"ギター博士"}], desc: "その場で演奏を録音し、繰り返し再生するエフェクター。一人でバッキングを重ねながらソロを弾けるため、練習にも演出にも使われる。", tags: ["録音","重ね録り","練習"] },
  { id: "fx-filter", label: "フィルター系", parent: "effector", url: "https://guitar-hakase.com/effector/", links: [{"u":"https://guitar-hakase.com/effector/","s":"ギター博士"}], desc: "特定の周波数帯域を強めたり弱めたりして、音色そのものを作り変える系統。", tags: ["周波数","音色","補正"] },
  { id: "fx-eq", label: "イコライザー", parent: "fx-filter", url: "https://guitar-hakase.com/7803/", links: [{"u":"https://guitar-hakase.com/7803/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%A4%E3%82%B3%E3%83%A9%E3%82%A4%E3%82%B6%E3%83%BC_(%E9%9F%B3%E9%9F%BF%E6%A9%9F%E5%99%A8)","s":"Wikipedia"}], desc: "低音・中音・高音などの帯域ごとに音量を増減し、音色を細かく整えるエフェクター。バンドの中で埋もれる帯域を持ち上げるなど、音作りの微調整に使う。", tags: ["帯域","補正","EQ"] },
  { id: "fx-wah", label: "ワウ", parent: "fx-filter", url: "https://guitar-hakase.com/2294/", links: [{"u":"https://guitar-hakase.com/2294/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%AF%E3%82%A6%E3%83%9A%E3%83%80%E3%83%AB","s":"Wikipedia"}], desc: "ペダルの踏み込みに応じて強調される周波数が移動し、「ワウワウ」と喋るような音になるエフェクター。カッティングやソロで多用される。", tags: ["ペダル","ファンク","ソロ"] },
  { id: "fx-noise-gate", label: "ノイズゲート", parent: "fx-filter", url: "https://guitar-hakase.com/18988/", links: [{"u":"https://guitar-hakase.com/18988/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%8E%E3%82%A4%E3%82%BA%E3%82%B2%E3%83%BC%E3%83%88","s":"Wikipedia"}], desc: "設定した音量以下の信号を遮断し、強く歪ませた時に出るノイズを抑えるエフェクター。演奏していない間を静かに保てる。", tags: ["ノイズ対策","歪み","THRESHOLD"] },
  { id: "fx-pitch", label: "ピッチ系", parent: "effector", url: "https://guitar-hakase.com/effector/", links: [{"u":"https://guitar-hakase.com/effector/","s":"ギター博士"}], desc: "元の音に対して音程の違う音を作り出す系統。音に厚みを足したり、演奏では出せない音程変化を作る。", tags: ["音程","ハーモニー","効果"] },
  { id: "fx-octaver", label: "オクターバー", parent: "fx-pitch", url: "https://guitar-hakase.com/20389/", links: [{"u":"https://guitar-hakase.com/20389/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%AA%E3%82%AF%E3%82%BF%E3%83%BC%E3%83%90%E3%83%BC","s":"Wikipedia"}], desc: "元の音の1オクターブ上または下の音を重ねるエフェクター。単音を太く厚くでき、ベースのような低音を足す使い方が代表的。", tags: ["オクターブ","太さ","ファンク"] },
  { id: "fx-pitch-shifter", label: "ピッチシフター", parent: "fx-pitch", url: "https://guitar-hakase.com/7685/", links: [{"u":"https://guitar-hakase.com/7685/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%BF%E3%82%A4%E3%83%A0%E3%82%B9%E3%83%88%E3%83%AC%E3%83%83%E3%83%81/%E3%83%94%E3%83%83%E3%83%81%E3%82%B7%E3%83%95%E3%83%88","s":"Wikipedia"}], desc: "入力された音の音程をずらした音を作り出すエフェクター。ハモリを自動で付けたり、大胆な音程変化の効果音として使う。", tags: ["ハモリ","音程","効果音"] },
  { id: "fx-whammy", label: "ワーミー", parent: "fx-pitch", url: "https://guitar-hakase.com/7719/", links: [{"u":"https://guitar-hakase.com/7719/","s":"ギター博士"}], desc: "ペダル操作で音程を大きく上下させるピッチシフターの一種。DigiTech社の製品名が、この種類の呼び名として定着したもの。", tags: ["ペダル","急激な音程変化","DigiTech"] },
  { id: "fx-utility", label: "ダイナミクス・その他", parent: "effector", url: "https://guitar-hakase.com/effector/", links: [{"u":"https://guitar-hakase.com/effector/","s":"ギター博士"}], desc: "音量や信号の状態を整える、縁の下の役割をもつ系統。派手な変化はないが、演奏のしやすさや音の安定に効く。", tags: ["音量","信号","補助"] },
  { id: "fx-compressor", label: "コンプレッサー", parent: "fx-utility", url: "https://guitar-hakase.com/37538/", links: [{"u":"https://guitar-hakase.com/37538/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%B3%E3%83%97%E3%83%AC%E3%83%83%E3%82%B5%E3%83%BC_(%E9%9F%B3%E9%9F%BF%E6%A9%9F%E5%99%A8)","s":"Wikipedia"}], desc: "大きい音を抑え小さい音を持ち上げて、音量差を均一にするエフェクター。粒のそろったカッティングや、伸びのあるクリーントーンを作れる。", tags: ["粒立ち","サスティン","カッティング"] },
  { id: "fx-volume-pedal", label: "ボリュームペダル", parent: "fx-utility", url: "https://guitar-hakase.com/18997/", links: [{"u":"https://guitar-hakase.com/18997/","s":"ギター博士"}], desc: "足元で音量を連続的に変えるエフェクター。曲中の音量調整のほか、ボリューム奏法によるフェードインにも使われる。", tags: ["足元","フェードイン","音量"] },
  { id: "fx-tuner", label: "ペダルチューナー", parent: "fx-utility", url: "https://guitar-hakase.com/2342/", links: [{"u":"https://guitar-hakase.com/2342/","s":"ギター博士"}], desc: "足元でチューニングを確認できる機器。踏むと音が出なくなる機能をもつものが多く、ライブ中の曲間で音を出さずに調弦できる。", tags: ["チューニング","ライブ","ミュート"] },
  { id: "fx-buffer", label: "バッファー", parent: "fx-utility", url: "https://guitar-hakase.com/34497/", links: [{"u":"https://guitar-hakase.com/34497/","s":"ギター博士"}], desc: "信号のインピーダンスを変換する機器。シールドが長い場合やエフェクターを多数つないだ場合に起きる高音の減衰を防ぐ。", tags: ["信号劣化","高音","接続"] },
  { id: "gt-strat", label: "ストラトキャスター・タイプ", parent: "guitar", url: "https://guitar-hakase.com/24986/", links: [{"u":"https://guitar-hakase.com/24986/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%95%E3%82%A7%E3%83%B3%E3%83%80%E3%83%BC%E3%83%BB%E3%82%B9%E3%83%88%E3%83%A9%E3%83%88%E3%82%AD%E3%83%A3%E3%82%B9%E3%82%BF%E3%83%BC","s":"Wikipedia"}], desc: "フェンダー社の代表機種に由来する形状。シングルコイル3基とアーム、深いカッタウェイを備え、軽快で歯切れのよい音が特徴。ジャンルを選ばない万能型として最も普及している。", tags: ["フェンダー","シングルコイル","万能"] },
  { id: "gt-tele", label: "テレキャスター・タイプ", parent: "guitar", url: "https://guitar-hakase.com/31129/", links: [{"u":"https://guitar-hakase.com/31129/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%95%E3%82%A7%E3%83%B3%E3%83%80%E3%83%BC%E3%83%BB%E3%83%86%E3%83%AC%E3%82%AD%E3%83%A3%E3%82%B9%E3%82%BF%E3%83%BC","s":"Wikipedia"}], desc: "量産型エレキギターの原型となった形状。シンプルな構造とシングルコイル2基により、輪郭のはっきりした硬めの音になる。カッティングやカントリーで愛用される。", tags: ["フェンダー","シンプル","歯切れ"] },
  { id: "gt-lespaul", label: "レスポール・タイプ", parent: "guitar", url: "https://guitar-hakase.com/33277/", links: [{"u":"https://guitar-hakase.com/33277/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%AE%E3%83%96%E3%82%BD%E3%83%B3%E3%83%BB%E3%83%AC%E3%82%B9%E3%83%9D%E3%83%BC%E3%83%AB","s":"Wikipedia"}], desc: "ギブソン社の代表機種に由来する形状。厚いボディとハムバッカー2基により、太く甘く伸びのある音が特徴。ロックの王道とされる。", tags: ["ギブソン","ハムバッカー","太い音"] },
  { id: "gt-sg", label: "SGタイプ", parent: "guitar", url: "https://guitar-hakase.com/4004/", links: [{"u":"https://guitar-hakase.com/4004/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%AE%E3%83%96%E3%82%BD%E3%83%B3%E3%83%BBSG","s":"Wikipedia"}], desc: "レスポールより薄く軽いボディに、両側の深いカッタウェイをもつ形状。ハムバッカーながら中音域が張り出した硬めの音で、高音域も弾きやすい。", tags: ["ギブソン","軽量","ハイポジション"] },
  { id: "gt-offset", label: "ジャズマスター／ジャガー・タイプ", parent: "guitar", url: "https://guitar-hakase.com/4004/", links: [{"u":"https://guitar-hakase.com/4004/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%95%E3%82%A7%E3%83%B3%E3%83%80%E3%83%BC%E3%83%BB%E3%82%B8%E3%83%A3%E3%82%BA%E3%83%9E%E3%82%B9%E3%82%BF%E3%83%BC","s":"Wikipedia"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%95%E3%82%A7%E3%83%B3%E3%83%80%E3%83%BC%E3%83%BB%E3%82%B8%E3%83%A3%E3%82%AC%E3%83%BC","s":"Wikipedia"}], desc: "ボディの上下が非対称にずれた「オフセット」形状。独特のピックアップと回路をもち、オルタナティブロックの流れの中で再評価された。", tags: ["フェンダー","オフセット","オルタナ"] },
  { id: "gt-superstrat", label: "スーパーストラト（ディンキー）タイプ", parent: "guitar", url: "https://guitar-hakase.com/4004/", links: [{"u":"https://guitar-hakase.com/4004/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%B9%E3%83%BC%E3%83%91%E3%83%BC%E3%82%B9%E3%83%88%E3%83%A9%E3%83%88","s":"Wikipedia"}], desc: "ストラトの形状をベースに、ハムバッカーや弦を固定するアーム、より深いカッタウェイを備え、ハードロック／メタルの速弾きに対応させたタイプ。", tags: ["メタル","速弾き","ハムバッカー"] },
  { id: "gt-prs", label: "PRSタイプ", parent: "guitar", url: "https://guitar-hakase.com/4004/", links: [{"u":"https://guitar-hakase.com/4004/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%9D%E3%83%BC%E3%83%AB%E3%83%BB%E3%83%AA%E3%83%BC%E3%83%89%E3%83%BB%E3%82%B9%E3%83%9F%E3%82%B9","s":"Wikipedia"}], desc: "ポール・リード・スミス社に由来する形状。フェンダー系の軽快さとギブソン系の太さの中間を狙った設計で、汎用性が高い。", tags: ["PRS","中間的","汎用"] },
  { id: "gt-v-shape", label: "変形（フライングV／エクスプローラー）タイプ", parent: "guitar", url: "https://guitar-hakase.com/4004/", links: [{"u":"https://guitar-hakase.com/4004/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%AE%E3%83%96%E3%82%BD%E3%83%B3%E3%83%BB%E3%83%95%E3%83%A9%E3%82%A4%E3%83%B3%E3%82%B0V","s":"Wikipedia"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%AE%E3%83%96%E3%82%BD%E3%83%B3%E3%83%BB%E3%82%A8%E3%82%AF%E3%82%B9%E3%83%97%E3%83%AD%E3%83%BC%E3%83%A9%E3%83%BC","s":"Wikipedia"}], desc: "V字や鋭角など、通常のギターと大きく異なる輪郭をもつタイプ。見た目のインパクトが強く、ハードロックやメタルで好まれる。", tags: ["メタル","ハードロック","個性的"] },
  { id: "gt-semi-hollow", label: "セミアコースティック", parent: "guitar", url: "https://ja.wikipedia.org/wiki/%E3%82%A8%E3%83%AC%E3%82%AF%E3%83%88%E3%83%AA%E3%83%83%E3%82%AF%E3%83%BB%E3%82%AE%E3%82%BF%E3%83%BC", links: [{"u":"https://ja.wikipedia.org/wiki/%E3%82%A8%E3%83%AC%E3%82%AF%E3%83%88%E3%83%AA%E3%83%83%E3%82%AF%E3%83%BB%E3%82%AE%E3%82%BF%E3%83%BC","s":"Wikipedia"}], desc: "ボディ内部に空洞をもちながら、中央に芯材を通した構造。豊かな鳴りとハウリングへの強さを両立しており、ジャズやブルースで使われる。", tags: ["空洞","ジャズ","ブルース"] },
  { id: "gt-hollow", label: "フルアコースティック", parent: "guitar", url: "https://ja.wikipedia.org/wiki/%E3%82%A8%E3%83%AC%E3%82%AF%E3%83%88%E3%83%AA%E3%83%83%E3%82%AF%E3%83%BB%E3%82%AE%E3%82%BF%E3%83%BC", links: [{"u":"https://ja.wikipedia.org/wiki/%E3%82%A8%E3%83%AC%E3%82%AF%E3%83%88%E3%83%AA%E3%83%83%E3%82%AF%E3%83%BB%E3%82%AE%E3%82%BF%E3%83%BC","s":"Wikipedia"}], desc: "ボディ全体が空洞になった構造。柔らかく豊かな鳴りが特徴でジャズの定番だが、音量を上げるとハウリングを起こしやすい。", tags: ["空洞","ジャズ","柔らかい"] },
  { id: "gt-multi-string", label: "多弦（7弦以上）ギター", parent: "guitar", url: "https://guitar-hakase.com/4004/", links: [{"u":"https://guitar-hakase.com/4004/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/7%E5%BC%A6%E3%82%AE%E3%82%BF%E3%83%BC","s":"Wikipedia"}], desc: "通常の6弦に低音弦を追加したタイプ。より低い音域が出せるため、重く低い音を求めるメタル系のジャンルで使われる。", tags: ["メタル","低音","7弦"] },
  { id: "amp-form", label: "筐体の形式", parent: "amp", url: "https://guitar-hakase.com/amp/", links: [{"u":"https://guitar-hakase.com/amp/","s":"ギター博士"}], desc: "アンプをどのような箱の構成で使うかによる分類。持ち運びやすさと出せる音量が変わる。", tags: ["形状","設置","音量"] },
  { id: "amp-combo", label: "コンボアンプ", parent: "amp-form", url: "https://guitar-hakase.com/amp/", links: [{"u":"https://guitar-hakase.com/amp/","s":"ギター博士"}], desc: "プリアンプ・パワーアンプ・スピーカーを1台にまとめたタイプ。これだけで音が出せるため、練習からライブまで最も広く使われる。", tags: ["一体型","定番","扱いやすい"] },
  { id: "amp-stack", label: "スタックアンプ", parent: "amp-form", url: "https://guitar-hakase.com/amp/", links: [{"u":"https://guitar-hakase.com/amp/","s":"ギター博士"}], desc: "アンプヘッドとキャビネットを積み重ねて使う構成。大音量と迫力が出せるため、大きな会場やハードロックで使われる。", tags: ["大音量","ライブ","ハードロック"] },
  { id: "amp-head", label: "アンプヘッド", parent: "amp-form", url: "https://guitar-hakase.com/40621/", links: [{"u":"https://guitar-hakase.com/40621/","s":"ギター博士"}], desc: "増幅する部分だけを独立させた機器。スピーカーをもたないため、別途キャビネットにつないで鳴らす。", tags: ["ヘッド","要キャビネット","スタック"] },
  { id: "amp-cabinet", label: "キャビネット", parent: "amp-form", url: "https://guitar-hakase.com/8190/", links: [{"u":"https://guitar-hakase.com/8190/","s":"ギター博士"}], desc: "スピーカーを収めた箱。スピーカーの口径や本数、箱の構造によって音の響き方が変わる。", tags: ["スピーカー","箱鳴り","スタック"] },
  { id: "amp-desktop", label: "デスクトップ・小型アンプ", parent: "amp-form", url: "https://guitar-hakase.com/amp/", links: [{"u":"https://guitar-hakase.com/amp/","s":"ギター博士"}], desc: "机の上に置ける小型のアンプ。自宅練習向けで、ヘッドホン出力や録音用の端子をもつものが多い。", tags: ["自宅練習","小型","ヘッドホン"] },
  { id: "amp-circuit", label: "増幅方式", parent: "amp", url: "https://guitar-hakase.com/amp/", links: [{"u":"https://guitar-hakase.com/amp/","s":"ギター博士"}], desc: "信号をどのような回路で増幅するかによる分類。歪み方と音の質感を最も大きく左右する。", tags: ["回路","歪み方","音質"] },
  { id: "amp-tube", label: "真空管アンプ", parent: "amp-circuit", url: "https://guitar-hakase.com/8044/", links: [{"u":"https://guitar-hakase.com/8044/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E7%9C%9F%E7%A9%BA%E7%AE%A1","s":"Wikipedia"}], desc: "真空管で信号を増幅する方式。音量を上げるにつれて自然に歪み、温かみと粘りのある音になる。チューブアンプとも呼ばれる。", tags: ["チューブ","温かい","自然な歪み"] },
  { id: "amp-transistor", label: "トランジスタアンプ", parent: "amp-circuit", url: "https://guitar-hakase.com/amp/", links: [{"u":"https://guitar-hakase.com/amp/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%88%E3%83%A9%E3%83%B3%E3%82%B8%E3%82%B9%E3%82%BF","s":"Wikipedia"}], desc: "半導体で増幅する方式。クリアでタイトな音になり、扱いやすく壊れにくい。ソリッドステートとも呼ばれる。", tags: ["ソリッドステート","クリア","扱いやすい"] },
  { id: "amp-modeling", label: "モデリングアンプ", parent: "amp-circuit", url: "https://guitar-hakase.com/amp/", links: [{"u":"https://guitar-hakase.com/amp/","s":"ギター博士"}], desc: "さまざまなアンプの音をデジタル処理で再現するタイプ。1台で多くの音色を切り替えられ、設定を保存できるものが多い。", tags: ["デジタル","多音色","プリセット"] },
  { id: "strings-material", label: "素材", parent: "strings", url: "https://guitar-hakase.com/strings/", links: [{"u":"https://guitar-hakase.com/strings/","s":"ギター博士"}], desc: "弦に何を使っているかによる分類。音の明るさ、指ざわり、錆びにくさが変わる。", tags: ["材質","音色","寿命"] },
  { id: "strings-nickel", label: "ニッケル弦", parent: "strings-material", url: "https://guitar-hakase.com/strings/", links: [{"u":"https://guitar-hakase.com/strings/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%8B%E3%83%83%E3%82%B1%E3%83%AB","s":"Wikipedia"}], desc: "最も普及している標準的な素材。音のバランスがよく指へのあたりも柔らかいため、迷ったらこれを選べばよいとされる。", tags: ["標準","バランス","定番"] },
  { id: "strings-stainless", label: "ステンレス弦", parent: "strings-material", url: "https://guitar-hakase.com/strings/", links: [{"u":"https://guitar-hakase.com/strings/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%B9%E3%83%86%E3%83%B3%E3%83%AC%E3%82%B9%E9%8B%BC","s":"Wikipedia"}], desc: "シャープで乾いた音になり、錆びにくいのが特徴。ニッケルより硬いため、指やフレットへのあたりは強くなる。", tags: ["シャープ","錆びにくい","硬い"] },
  { id: "strings-coated", label: "コーティング弦", parent: "strings-material", url: "https://guitar-hakase.com/strings/", links: [{"u":"https://guitar-hakase.com/strings/","s":"ギター博士"}], desc: "表面を薄い膜で覆い、汗や汚れによる劣化を防いだ弦。寿命が長い一方で価格は高めになる。", tags: ["長寿命","コーティング","高価"] },
  { id: "strings-gauge", label: "ゲージ（太さ）", parent: "strings", url: "https://guitar-hakase.com/strings/", links: [{"u":"https://guitar-hakase.com/strings/","s":"ギター博士"}], desc: "弦の太さによる分類。細いほど押さえやすくチョーキングが軽く、太いほど音が太く張りが出る。", tags: ["太さ","弾き心地","音の太さ"] },
  { id: "strings-extra-light", label: "エクストラライト", parent: "strings-gauge", url: "https://guitar-hakase.com/strings/", links: [{"u":"https://guitar-hakase.com/strings/","s":"ギター博士"}], desc: "1弦が.008インチ前後の最も細いゲージ。押さえるのもチョーキングも軽いが、音は細くなりやすい。", tags: [".008","最も細い","軽い"] },
  { id: "strings-super-light", label: "スーパーライト", parent: "strings-gauge", url: "https://guitar-hakase.com/strings/", links: [{"u":"https://guitar-hakase.com/strings/","s":"ギター博士"}], desc: "1弦が.009インチ前後。細さと音のバランスがよく、扱いやすい太さとして広く使われる。", tags: [".009","扱いやすい","定番"] },
  { id: "strings-light", label: "ライト", parent: "strings-gauge", url: "https://guitar-hakase.com/strings/", links: [{"u":"https://guitar-hakase.com/strings/","s":"ギター博士"}], desc: "1弦が.010インチ前後。音の太さと弾きやすさのバランスが取れた標準的なゲージ。", tags: [".010","標準","バランス"] },
  { id: "strings-medium", label: "ミディアム", parent: "strings-gauge", url: "https://guitar-hakase.com/strings/", links: [{"u":"https://guitar-hakase.com/strings/","s":"ギター博士"}], desc: "1弦が.011インチ前後。音は太く張りが出るが、押さえる力とチョーキングの負荷は増す。", tags: [".011","太い音","張り"] },
  { id: "strings-heavy", label: "ヘビー", parent: "strings-gauge", url: "https://guitar-hakase.com/strings/", links: [{"u":"https://guitar-hakase.com/strings/","s":"ギター博士"}], desc: "1弦が.012インチ以上の太いゲージ。低く下げたチューニングや、より太い音を求める場合に使われる。", tags: [".012以上","低いチューニング","メタル"] },
  { id: "pick-shape", label: "形状", parent: "pick", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"}], desc: "ピックの輪郭による分類。持ちやすさと、弦にあたる先端の鋭さが変わる。", tags: ["形","持ち方","先端"] },
  { id: "pick-teardrop", label: "ティアドロップ", parent: "pick-shape", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"}], desc: "涙のしずくのような形。先端が細く、単音弾きにもコード弾きにも対応できる最も標準的な形状。", tags: ["標準","万能","定番"] },
  { id: "pick-triangle", label: "トライアングル（おにぎり型）", parent: "pick-shape", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"}], desc: "三角形で、3つの角すべてを使える形。面積が広く持ちやすいため、ストロークに向く。", tags: ["おにぎり","ストローク","持ちやすい"] },
  { id: "pick-jazz", label: "ジャズ型", parent: "pick-shape", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"}], desc: "小ぶりで先端が鋭い形。ピックの動きが正確になり、速いフレーズや単音弾きに向く。", tags: ["小型","速弾き","単音"] },
  { id: "pick-thumb", label: "サムピック", parent: "pick-shape", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%B5%E3%83%A0%E3%83%94%E3%83%83%E3%82%AF","s":"Wikipedia"}], desc: "親指にはめて使うピック。指弾きと組み合わせられるため、ベース音と伴奏を同時に鳴らす演奏に使われる。", tags: ["親指","指弾き","併用"] },
  { id: "pick-thickness", label: "厚さ", parent: "pick", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"}], desc: "ピックの厚みによる分類。薄いほどしなってストロークが軽やかになり、厚いほど力がそのまま弦に伝わる。", tags: ["しなり","アタック","弾き心地"] },
  { id: "pick-thin", label: "シン（薄い）", parent: "pick-thickness", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"}], desc: "0.5mm前後の薄いピック。よくしなるためストロークが軽やかになるが、単音の芯は出にくい。", tags: ["0.5mm","ストローク","しなる"] },
  { id: "pick-medium", label: "ミディアム", parent: "pick-thickness", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"}], desc: "0.7mm前後の標準的な厚さ。ストロークと単音弾きの両方に対応できる。", tags: ["0.7mm","標準","万能"] },
  { id: "pick-heavy", label: "ヘビー（厚い）", parent: "pick-thickness", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"}], desc: "0.9mm以上の厚いピック。しなりが少なく力がそのまま弦に伝わるため、単音弾きや速弾きに向く。", tags: ["0.9mm以上","単音","速弾き"] },
  { id: "pick-material", label: "素材", parent: "pick", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"}], desc: "ピックに使われている樹脂などによる分類。しなり方、削れにくさ、弦にあたる音の質感が変わる。", tags: ["材質","摩耗","質感"] },
  { id: "pick-celluloid", label: "セルロイド", parent: "pick-material", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%82%BB%E3%83%AB%E3%83%AD%E3%82%A4%E3%83%89","s":"Wikipedia"}], desc: "古くから使われている定番の素材。適度なしなりと滑らかな弾き心地が特徴。", tags: ["定番","適度なしなり","滑らか"] },
  { id: "pick-nylon", label: "ナイロン", parent: "pick-material", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%8A%E3%82%A4%E3%83%AD%E3%83%B3","s":"Wikipedia"}], desc: "しなやかで手になじむ素材。表面に滑り止めの加工がされたものが多い。", tags: ["しなやか","滑り止め","なじむ"] },
  { id: "pick-delrin", label: "デルリン", parent: "pick-material", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"},{"u":"https://ja.wikipedia.org/wiki/%E3%83%87%E3%83%AB%E3%83%AA%E3%83%B3","s":"Wikipedia"}], desc: "摩耗に強く、表面がさらっとした素材。硬さが安定しており削れにくい。", tags: ["耐摩耗","安定","さらっと"] },
  { id: "pick-ultem", label: "ウルテム", parent: "pick-material", url: "https://guitar-hakase.com/pick/", links: [{"u":"https://guitar-hakase.com/pick/","s":"ギター博士"}], desc: "硬く、はっきりしたアタック音が出る素材。べっ甲に近い硬質な弾き心地とされる。", tags: ["硬い","アタック","べっ甲調"] }
];

/* 指定カテゴリの直下の子を返す */
function otoanoGearChildren(parentId) {
  return OTOANO_GEAR_SUBTYPES.filter(s => s.parent === parentId);
}
/* 下位分類をもつ上位カテゴリかどうか */
function otoanoGearHasChildren(id) {
  return OTOANO_GEAR_SUBTYPES.some(s => s.parent === id);
}
/* id から上位カテゴリまでの経路（["エフェクター","歪み系","オーバードライブ"]） */
function otoanoGearCatPath(id) {
  const path = [];
  let cur = id;
  for (var i = 0; i < 8 && cur; i++) {
    const sub = OTOANO_GEAR_SUBTYPES.find(s => s.id === cur);
    if (sub) { path.unshift(sub.label); cur = sub.parent; continue; }
    const top = OTOANO_GEAR_CATEGORIES.find(c => c.id === cur);
    if (top) { path.unshift(top.label); }
    break;
  }
  return path;
}
/* プレイヤーのバッジ表示用。上位と末端が違えば「エフェクター / オーバードライブ」 */
function otoanoGearCatDisplay(id) {
  const p = otoanoGearCatPath(id);
  if (p.length === 0) return id || "";
  if (p.length === 1) return p[0];
  return p[0] + " / " + p[p.length - 1];
}
/* id が属する上位カテゴリのid（逆引き検索用） */
function otoanoGearTopId(id) {
  let cur = id;
  for (var i = 0; i < 8 && cur; i++) {
    if (OTOANO_GEAR_CATEGORIES.some(c => c.id === cur)) return cur;
    const sub = OTOANO_GEAR_SUBTYPES.find(s => s.id === cur);
    if (!sub) return cur;
    cur = sub.parent;
  }
  return cur;
}
/* 奏法・機材のどちらからでも語彙項目を引く（辞書ページ用） */
function otoanoFindConcept(id) {
  return OTOANO_TECHNIQUES.find(t => t.id === id)
      || OTOANO_GEAR_SUBTYPES.find(s => s.id === id)
      || OTOANO_GEAR_CATEGORIES.find(c => c.id === id)
      || null;
}

/* ジャンル（schema:genre の値／otoano:GenreScheme） */
const OTOANO_GENRES = [
  { id: "genre-rock", label: "ロック" },
  { id: "genre-jpop", label: "J-POP" },
  { id: "genre-pop", label: "ポップス" },
  { id: "genre-punk", label: "パンク" },
  { id: "genre-metal", label: "メタル・ハードロック" },
  { id: "genre-alternative", label: "オルタナティブ" },
  { id: "genre-blues", label: "ブルース" },
  { id: "genre-funk", label: "ファンク" },
  { id: "genre-jazz", label: "ジャズ" },
  { id: "genre-ballad", label: "バラード" },
  { id: "genre-folk", label: "フォーク・弾き語り" },
  { id: "genre-anime", label: "アニメ・ゲーム" },
  { id: "genre-other", label: "その他" }
];
function otoanoGenreLabel(id) {
  const g = OTOANO_GENRES.find(g => g.id === id);
  return g ? g.label : (id || "");
}

/* 難易度（otoano:difficulty の値／otoano:DifficultyScheme）。level は易しい順の並び */
const OTOANO_DIFFICULTIES = [
  { id: "diff-beginner", label: "入門", level: 1, desc: "コードを押さえられれば通して弾ける。特殊な奏法をほとんど含まない。" },
  { id: "diff-easy", label: "初級", level: 2, desc: "基本的な奏法の組み合わせで弾ける。テンポやコードチェンジに慣れが必要。" },
  { id: "diff-intermediate", label: "中級", level: 3, desc: "複数の奏法の切り替えや、細かいリズム・音作りの再現が求められる。" },
  { id: "diff-advanced", label: "上級", level: 4, desc: "速弾きや特殊奏法、機材の切り替えを含み、通して弾くには相応の練習を要する。" }
];
function otoanoDifficultyLabel(id) {
  const d = OTOANO_DIFFICULTIES.find(d => d.id === id);
  return d ? d.label : (id || "");
}

/* 用語解説のカテゴリ（otoano:termCategory の値） */
const OTOANO_TERM_CATEGORIES = [
  { id: "theory",    label: "音楽理論" },
  { id: "equipment", label: "機材" },
  { id: "technique", label: "奏法" }
];
function otoanoTermCatLabel(id) {
  const c = OTOANO_TERM_CATEGORIES.find(c => c.id === id);
  return c ? c.label : (id || "");
}

/* つまみの共通概念（otoano:paramConcept の値＝otoano:GearParameter 個体）。
   共通概念に該当しないものは "other-param"（その他）にまとめ、名称は自由入力する。 */
const OTOANO_PARAM_CONCEPTS = [
  { id: "gain", label: "GAIN" },
  { id: "drive", label: "DRIVE" },
  { id: "level", label: "LEVEL" },
  { id: "volume", label: "VOLUME" },
  { id: "tone", label: "TONE" },
  { id: "treble", label: "TREBLE" },
  { id: "middle", label: "MIDDLE" },
  { id: "bass", label: "BASS" },
  { id: "presence", label: "PRESENCE" },
  { id: "master", label: "MASTER" },
  { id: "reverb", label: "REVERB" },
  { id: "depth", label: "DEPTH" },
  { id: "rate", label: "RATE" },
  { id: "mix", label: "MIX" },
  { id: "time", label: "TIME" },
  { id: "feedback", label: "FEEDBACK" },
  { id: "threshold", label: "THRESHOLD" },
  { id: "sustain", label: "SUSTAIN" },
  { id: "attack", label: "ATTACK" },
  { id: "pickup", label: "ピックアップ" },
  { id: "other-param", label: "その他" }
];
/* ギター本体のピックアップ選択位置の候補（値の入力補助。自由入力も可） */
const OTOANO_PICKUP_POSITIONS = [
  "フロント",
  "フロント＋センター",
  "センター",
  "センター＋リア",
  "フロント＋リア",
  "リア",
  "全て"
];
function otoanoParamLabel(id) {
  const p = OTOANO_PARAM_CONCEPTS.find(p => p.id === id);
  return p ? p.label : (id || "");
}
/* 表示名（GAIN等）から概念idを逆引き。見つからなければ other-param */
function otoanoParamId(name) {
  if (!name) return "other-param";
  const p = OTOANO_PARAM_CONCEPTS.find(p => p.label.toUpperCase() === String(name).toUpperCase());
  return p ? p.id : "other-param";
}

/* idから表示名を引く */
function otoanoTechLabel(id) {
  const t = OTOANO_TECHNIQUES.find(t => t.id === id);
  return t ? t.label : id;
}
function otoanoGearCatLabel(id) {
  const c = OTOANO_GEAR_CATEGORIES.find(c => c.id === id);
  if (c) return c.label;
  const s = OTOANO_GEAR_SUBTYPES.find(s => s.id === id);
  return s ? s.label : (id || "");
}
