# Otoano（おとあの）

音作りや機材を参考に、誰でも好きな曲のコピーに挑戦できる楽器演奏者向けWebプラットフォーム。  
YouTube動画に連動したタイムスタンプ付きアノテーション（セグメント）で、コード進行・楽譜・奏法・機材情報を動画と同期して表示する。

---

## ファイル構成

```
プロジェクトルート/
├── index.html          楽曲検索・ホーム
├── player.html         アノテーションプレイヤー（メイン機能）
├── search.html         横断検索
├── upload.html         アノテーション投稿エディター
├── guide.html          エレキギター初心者ガイド
├── band-guide.html     ロックバンド活動ガイド
├── terms.html          奏法・機材解説
├── usage-guide.html    サイト利用ガイド
├── account.html        アカウント
├── history.html        プレイ履歴
├── posts.html          投稿管理
│
├── songs.json          ★楽曲一覧データ（曲を追加するときはここだけ編集）
├── songs.js            楽曲カード生成の共有関数（index・search が読み込む）
├── annotations.json    デフォルトのアノテーションデータ（プレイヤー用）
├── script.js           プレイヤーのメインロジック
├── style.css           全ページ共通スタイル
│
├── imgs/               カバー画像・楽譜画像
└── cards/              MusicXML / MXLファイル
```

---

## ページ構成

| ファイル | タイトル | 役割 |
|---------|---------|------|
| `index.html` | 楽曲検索・ホーム | トップ。注目楽曲の一覧、検索バー、各種ガイドへのバナー |
| `player.html` | Otoano Player | アノテーション付き楽曲プレイヤー（メイン機能） |
| `search.html` | 横断検索 | キーワード・年代・ジャンル・難易度・機材でフィルタリング |
| `upload.html` | アノテーション投稿エディター | annotations.json を実際に生成・ダウンロードできる機能エディター |
| `guide.html` | エレキギター初心者ガイド | 必要機材・ギター選び・音の出し方・練習の始め方を4ステップで解説 |
| `band-guide.html` | ロックバンド活動ガイド | メンバー集め・個人練習・スタジオ予約・スタジオ入りを4チャプターで解説 |
| `terms.html` | 奏法・機材解説 | 奏法26・機材67の計93項目をカード形式で一覧。**統制語彙 `vocab.js` から自動生成**され、キーワード検索に対応。外部リンクは飛び先（ギター博士 / Wikipedia）を明示 |
| `usage-guide.html` | サイト利用ガイド | 「使う」「作る」2つの楽しみ方をタブ切り替えで解説 |
| `account.html` | アカウント | プロフィール表示・編集、パスワード変更（デモUI） |
| `history.html` | プレイ履歴 | 総再生数・学習時間のサマリー、日付別タイムライン（デモUI） |
| `posts.html` | 投稿管理 | 自分の投稿一覧・閲覧数・評価・編集・削除（デモUI） |

---

## 楽曲データの管理（songs.json）

楽曲情報は `songs.json` に一元管理されている。  
**曲を追加・編集する場合はこのファイルだけを変更すればよい**。HTMLは触る必要がない。

### songs.json の構造

```json
{
  "songs": [
    {
      "id": "shishamo-ashitamo",
      "title": "明日も",
      "artist": "SHISHAMO",
      "playerFile": "annotations.json",
      "coverImage": "imgs/ashita-mo-cover.jpg",
      "difficulty": "normal",
      "difficultyLabel": "初級〜中級",
      "duration": "3:45",
      "era": "2010",
      "genre": "j-pop",
      "gear": "strat",
      "rating": 4.8,
      "featured": true,
      "contributor": { "name": "ユーザー A", "avatar": "👤" },
      "comment": "マルチエフェクター一個で再現してみました！"
    }
  ]
}
```

### フィールド一覧

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string | 一意のID（英数字・ハイフン） |
| `title` | string | 楽曲名 |
| `artist` | string | アーティスト名 |
| `playerFile` | string \| null | 対応する annotations.json のファイル名。`null` にすると「準備中」バッジ付きの非リンクカードになる |
| `coverImage` | string | カバー画像のパス（`imgs/` フォルダ推奨） |
| `difficulty` | string | `easy` / `normal` / `hard` のいずれか（フィルターで使用） |
| `difficultyLabel` | string | 画面に表示する難易度テキスト（「初級〜中級」など） |
| `duration` | string | 曲の長さ（表示用: 「3:45」など） |
| `era` | string | 年代（`"2000"` / `"2010"` / `"2020"`）（フィルターで使用） |
| `genre` | string | ジャンル（`"j-pop"` / `"rock"` / `"anime"`）（フィルターで使用） |
| `gear` | string | 使用機材（`"strat"` / `"lp"` / `"multi"`）（フィルターで使用） |
| `rating` | number | 総合評価（小数可: 4.8 など） |
| `featured` | boolean | `true` にするとホーム画面「注目の楽曲」にも表示される |
| `contributor.name` | string | 投稿者の表示名 |
| `contributor.avatar` | string | 投稿者のアイコン（絵文字など） |
| `comment` | string | 投稿者のひとことコメント |

### 仕組みのフロー

```
songs.json（データ）
     ↓  fetch() で読み込む
songs.js（共有関数: buildCard / loadSongs）
     ↓  呼び出す
index.html  → featured:true の曲をグリッド表示
search.html → 全曲を表示、フィルター・キーワード検索で絞り込み
```

---

## 共通UI

### ハンバーガーナビゲーション

全ページ共通。ヘッダー左端の `≡` ボタンで左サイドパネルが開く。  
ヘッダーはスクロールしても常に画面上部に固定（`position: sticky`）。

```
ナビパネルの構成：
  メイン       ホーム / 横断検索
  ガイド       サイト利用ガイド / エレキギター初心者ガイド / バンド活動ガイド
  辞書         奏法・機材解説
  ユーザー情報  アカウント / プレイ履歴 / 投稿管理 / アノテーション投稿エディター
```

現在開いているページは `Otoano / ページ名` の形式でヘッダーに表示され、ナビパネル内で青くハイライトされる。

---

## 楽曲検索・ホーム（index.html）

- ヒーローセクション：キャッチコピー＋検索バー
  - テキストを入力して「検索」ボタンか `Enter` を押すと横断検索へ遷移
  - キーワードは `search.html?q=キーワード` として引き継がれる
- 注目の楽曲グリッド：`songs.json` の `featured: true` の曲を動的生成
- 3つのガイドバナー（エレキギター初心者ガイド／奏法・機材解説／WEBサイト利用ガイド）
- フッター：コンテンツ・サポート・SNSリンク

---

## 横断検索（search.html）

- `songs.json` からすべての楽曲を動的に読み込んでカードを生成
- キーワード検索（曲名・アーティスト名・投稿者コメントを対象）
- フィルター（即時反映）：

| フィルター | 対応フィールド | 選択肢 |
|-----------|------------|-------|
| 年代 | `era` | 2000年代 / 2010年代 / 2020年代 |
| ジャンル | `genre` | J-POP / ROCK / アニメ・映画 |
| 難易度 | `difficulty` | 初級 / 中級 / 上級 |
| 機材 | `gear` | ストラト / レスポール / マルチ |

- URLパラメータ `?q=キーワード` で検索バーに自動入力（ホームから遷移時に利用）
- 検索結果件数をリアルタイム表示

---

## アノテーションプレイヤー（player.html）

### レイアウト

```
ヘッダー: [≡] [Otoano] [楽曲名（横断検索リンク）] ... [使用機材] [用語解説]

左カラム:  セグメント一覧（カテゴリフィルター付き、収納トグルあり）
右カラム:  メイン演奏動画
           現在のセグメント（タイトル・説明・関連カード）
           アノテーションの評価（口コミ一覧・星評価・投稿フォーム）
```

### ヘッダーのモーダルボタン

| ボタン | 内容 |
|-------|------|
| 使用機材 | `annotations.json` の `gearInfo` に定義した機材一覧をモーダル表示 |
| 用語解説 | `knowledgeInfo` に定義した用語解説カードをモーダル表示 |

### セグメント一覧

- 再生位置に追従してアクティブなセグメントをハイライト
- カテゴリフィルター（セレクトボックス）で絞り込み可能
- クリックでその開始時刻にシーク
- サイドバー収納トグルボタン（◀/▶）あり

### アノテーションの評価

- 総合評価（星・件数）表示
- ユーザーレビュー一覧
- 星評価クリック入力＋感想テキストエリア＋投稿ボタン（デモUI）

---

## アノテーション投稿エディター（upload.html）

annotations.json を実際に生成・ダウンロードできる機能エディター。

### 実装済みの機能

| 機能 | 説明 |
|------|------|
| YouTube URL解析 | URLを入力して「読み込む」→ 動画IDを自動抽出、プレビュー再生 |
| セグメント追加・編集 | タイトル・開始/終了時刻・カテゴリ・説明文を入力。アコーディオン形式 |
| 時刻の自動入力 | 動画再生中に「現在位置を開始時刻に」ボタンでその秒数をセット |
| 関連カード追加 | リンク・メモ・YouTube動画・画像の4タイプを各セグメントに追加 |
| JSONダウンロード | 「JSONをダウンロード」で `annotations.json` として保存 |
| 下書き保存 | ブラウザのlocalStorageに保存、次回起動時に自動復元 |
| JSONから再編集 | 既存の `annotations.json` をファイル選択で読み込んで編集続行 |

### 使い方の流れ

```
1. YouTube URL を入力 → 「読み込む」
2. 楽曲名・アーティスト名・投稿者コメントを入力
3. 「+ セグメントを追加」で区間を作成
4. 動画を再生しながら時刻ボタンで開始・終了をセット
5. 関連カードを必要に応じて追加
6. 「JSONをダウンロード」でファイルを取得
7. ダウンロードした .json をプロジェクトフォルダに置く
8. songs.json に曲情報を追記（playerFile にファイル名を指定）
9. player.html?a=ファイル名.json で再生確認
```

---

## ユーザー情報ページ（デモUI）

### アカウント（account.html）

- プロフィールカード：アバター・表示名・統計（投稿数・平均評価・プレイ数）
- プロフィール設定フォーム：表示名・ユーザーID・自己紹介・使用機材
- アカウント設定フォーム：メールアドレス・パスワード変更
- 危険ゾーン：アカウント削除ボタン

### プレイ履歴（history.html）

- サマリー：総再生数・よく聴く曲・合計学習時間
- 日付グループ別タイムライン（今日・昨日・3日前 etc.）
- 各エントリ：楽曲名・難易度・プレイ時刻・進捗バー

### 投稿管理（posts.html）

- サマリー：総投稿数・総閲覧数・平均評価・口コミ数
- 投稿一覧：カバー画像・楽曲名・ステータス（公開中/下書き）・閲覧数・評価
- 編集・削除ボタン、新規投稿への誘導

---

## ガイドページのUI

| ページ | ナビゲーション方式 |
|-------|-----------------|
| `guide.html` | 丸いステップナビ（1〜4）でページを切り替え、次へ/戻るボタン付き |
| `band-guide.html` | 4つのチャプターボタンで切り替え、フェードアニメーション付き |
| `usage-guide.html` | 「使う」「作る」のタブ切り替え |
| `terms.html` | 左サイドバーに目次＋スクロールスパイ、キーワード検索でカードを絞り込み |

---

## RDF / JSON-LD 対応

アノテーションデータは **JSON-LD** として設計されており、`context.jsonld` によって
すべてのキーが RDF 語彙（schema.org / Dublin Core / 独自語彙 `otoano:`）へ写像される。
つまり `annotations.json` はそのまま機械可読な RDF（LOD）として解釈できる。

| ファイル | 役割 |
|---------|------|
| `context.jsonld` | JSONキー → RDF語彙のマッピング定義（JSON-LD 1.1） |
| `vocab.ttl` | 独自語彙 `otoano:` の正式定義（Segment / usesTechnique / GearUsage / hasSetting 等）。奏法はGuitar Rendition Ontology・Wikipedia・guitar-hakase へ `rdfs:seeAlso` で接続 |
| `vocab.js` | UI用の統制語彙（奏法26種・機材カテゴリ8種＋下位分類39種・パラメータ名候補）。vocab.ttl と1対1対応 |

### 統制語彙は単一の情報源

`vocab.ttl` に書いた語彙は `vocab.js` に1対1で写され、**3つの画面がすべてこの1ファイルだけを参照する**。

| 画面 | vocab.js の使われ方 |
|------|--------------------|
| アノテーション投稿エディター（`upload.html`） | 奏法チップ（グループ見出し付き）・機材カテゴリの2段セレクトの選択肢 |
| プレイヤー（`script.js`） | 奏法タグの表示名と解説リンク、機材カテゴリのバッジ（階層表示）、用語カードから辞書への内部リンク解決 |
| 奏法・機材解説（`terms.html`） | 93枚の解説カードそのもの（`label` / `desc` / `tags` / `links` / 階層を描画） |
| 横断検索（`search.html`） | 画面上部を横断する全幅の検索バー（空なら全曲表示）＋その下に開閉式（表示/非表示トグル）の絞り込みパネル。パネルは各軸を横に並べて広げ、難易度・ジャンルはトグルボタン、年代は開始〜終了の範囲プルダウン、奏法・機材はプルダウン。機材は `skos:broader` をたどるので上位カテゴリを選ぶと下位も含まれる。結果は横並びのカードグリッド |

語彙を1か所直せば3画面に同時に反映されるため、辞書だけが古くなるといったずれが起きない。
`desc` は `vocab.ttl` の `schema:description` と同一で、**辞書ページは語彙定義そのものの可視化**になっている。

### 統制語彙の階層（`skos:broader`）

奏法と機材カテゴリは、どちらも上位・下位の階層を `skos:broader` でもつ。
投稿者は**分かる範囲の粒度**で選べばよく、上位カテゴリのままでも有効（後方互換）。

```
奏法（26種／4グループ）
  基本・コード      ストローク / カッティング / ブラッシング / ブリッジミュート /
                    コードチェンジ / バレーコード / パワーコード / アルペジオ / オクターブ奏法
  ピッキング        オルタネイトピッキング / トレモロピッキング / スウィープピッキング /
                    ピッキングハーモニクス
  フィンガリング    ハンマリング・オン / プリング・オフ / トリル / スライド / グリッサンド /
                    チョーキング / ビブラート / タッピング / ハーモニクス
  エレキ特有        アーミング / ボトルネック奏法 / ボリューム奏法 / フィードバック奏法

機材カテゴリ（上位8種＋下位73種）
  エフェクター  ─ 歪み系              オーバードライブ / ディストーション / ファズ / ブースター
                ─ モジュレーション系  コーラス / フランジャー / フェイザー / トレモロ / ビブラート
                ─ 空間系              リバーブ / ディレイ / ルーパー
                ─ フィルター系        イコライザー / ワウ / ノイズゲート
                ─ ピッチ系            オクターバー / ピッチシフター / ワーミー
                ─ ダイナミクス・その他 コンプレッサー / ボリュームペダル / ペダルチューナー / バッファー
  ギター        ─ ストラト / テレキャス / レスポール / SG / ジャズマスター・ジャガー /
                  スーパーストラト / PRS / 変形 / セミアコ / フルアコ / 多弦（計11種）
  アンプ        ─ 筐体の形式          コンボ / スタック / アンプヘッド / キャビネット / デスクトップ
                ─ 増幅方式            真空管 / トランジスタ / モデリング
  弦            ─ 素材                ニッケル / ステンレス / コーティング
                ─ ゲージ              エクストラライト / スーパーライト / ライト / ミディアム / ヘビー
  ピック        ─ 形状                ティアドロップ / トライアングル / ジャズ型 / サムピック
                ─ 厚さ                シン / ミディアム / ヘビー
                ─ 素材                セルロイド / ナイロン / デルリン / ウルテム
  マルチエフェクター / シールド / その他（下位分類なし）
```

### ジャンルと難易度

投稿時に指定でき、横断検索のファセットになる。どちらも独自クラスを作らず SKOS の `ConceptScheme` でまとめている。

| 項目 | RDF | 値 |
|------|-----|-----|
| ジャンル | `schema:genre`（そのまま再利用） | ロック / J-POP / ポップス / パンク / メタル・ハードロック / オルタナティブ / ブルース / ファンク / ジャズ / バラード / フォーク / アニメ・ゲーム / その他（13種・複数選択可） |
| 難易度 | `otoano:difficulty`（`schema:educationalLevel` の下位） | 入門 / 初級 / 中級 / 上級（`skos:notation` の1〜4が易しい順） |

- 値はすべて `gearCategory` / `techniques` にそのまま入る（例：`"gearCategory": "fx-overdrive"`）
- 全26奏法・全39下位分類に、実在を確認した外部解説（Wikipedia日本語版 / guitar-hakase）を `rdfs:seeAlso` で接続済み
- 分類の出典：<https://guitar-hakase.com/effector/>（エフェクター）、<https://guitar-hakase.com/4004/>（ギターの種類）

### 語彙の役割分担

| 語彙 | 担当 |
|------|------|
| **schema.org** | 一般概念（名前・URL・画像・DefinedTerm・PropertyValue 等） |
| **Dublin Core（dcterms）** | **来歴と権利**：`creator`（投稿者）/ `created`（投稿日）/ `modified`（更新日）/ `license`（二次利用条件） |
| **SKOS** | 統制語彙の項目であることの明示（Technique / GearParameter / GearCategory / TermCategory の4語彙をすべて `skos:Concept` の下位として統一）と、`skos:broader` による**語彙の階層化**（奏法グループ、エフェクターの系統、ギターのタイプ） |
| **Music Ontology** | 楽曲・パートの関係 |
| **otoano:（独自）** | 上記で表せない固有概念のみ（Segment / GearUsage / hasSetting 等） |

投稿エディターは `creator` / `created` / `modified` / `license` を自動的に出力するため、
**誰の投稿で、いつ作られ、どう再利用してよいか**が機械可読な形で必ず記録される。

### 機材の二層記述（hasPart と usesGear）

機材は **2つの粒度**で記述される。JSON-LDはキー単位で語彙へ写像するため、
`items` 内の型によって出し分けることはできない。そこで役割を分けている。

| 記述 | 出力先 | 意味 |
|------|--------|------|
| `items` の gear カード | `schema:hasPart` → `otoano:GearUsage` | **設定の詳細**（つまみの値・写真・メモ）を持つ使用記録 |
| `usesGear` | `otoano:usesGear` → 製品URL | **製品レベルの参照**。「この機材を使っている楽曲」の逆引き検索に使う |

`usesGear` は投稿エディターが gear カードのURLから自動生成する（楽曲全体＋セグメント単位）。

### アノテーションJSONのトップレベル構造

用途ごとに独立した配列を持ち、**エディターが出力する形とプレイヤーが読む形が完全に一致**する。
そのため、投稿済みのアノテーションをエディターに読み込んで編集し直せる（引き継ぎ編集）。

| キー | RDF | 中身 | プレイヤーでの表示 |
|------|-----|------|------------------|
| `annotations` | `otoano:hasSegment` | セグメント（奏法ブロックを含む） | 本体 |
| `gearInfo` | `otoano:hasGearInfo` | 楽曲全体で使った機材 | 「使用機材」ボタン |
| `knowledgeInfo` | `otoano:hasGlossary` | この曲の用語解説 | 「用語解説」ボタン |
| `genre` / `difficulty` | `schema:genre` / `otoano:difficulty` | ジャンル・難易度 | 横断検索のファセット |

旧形式（`globalInfo` に機材・音源・リンクが混在した入れ物）は、プレイヤー・エディターの
どちらもカードの種類で自動的に振り分けて読むため、そのままでも表示・編集できる。

### 引き継ぎ編集（共創のための導線）

プレイヤーの「**このアノテーションについて**」カードに、投稿者・公開日・ライセンス（`dcterms:`）を表示し、
「**このアノテーションを引き継いで編集する**」ボタンを置く。押すと `upload.html?a=<JSON>` に遷移し、
エディターがその内容を読み込む。このとき:

- 原典を `isBasedOn`（→ `schema:isBasedOn`）に記録する
- `@id` は新しく採番し直す（別リソースになるため）
- 投稿者名は空にし、ライセンスは原典から引き継ぐ（CC BY-SA の継承条件に沿う）
- 引き継ぎ中であることをエディター上部のバナーで明示する

`?a=` に受け付けるのは同一サイト内の `.json` パスだけに限定し、外部URLや `..` を含む指定は拒否する。
これにより「CCライセンスを明示し、帰属を辿れる形で他者の投稿を改良できる」という共創の流れが、
データ構造（`isBasedOn`）と画面の両方で成立する。

### 構造化の要点

- **奏法**：セグメントの `items` は「奏法ブロック」（`type:"group"` ＋ `aboutTechnique`）を単位とし、関連するリンク・メモ・画像・動画・機材設定をその中にまとめる（`schema:hasPart`）。`techniques`（→ `otoano:usesTechnique`）はブロックから導出される。統制語彙に該当がない奏法は `other-technique` を選び、名称を自由入力する
- **区間の機材**：特定の奏法に紐づかない機材設定は、奏法ブロックを介さずセグメント直下に `type:"gear"` カードとして置ける（エディターの「機材を追加」）。どちらに置いてもつまみの設定値（`otoano:hasSetting`）を記述できる
- **ギター本体の操作**：機材カテゴリがギター（`guitar` / `gt-*`）のとき、gear カードに「ギター本体の操作」欄（ピックアップ位置・ボリューム・トーン）が現れる。曲中で変わる値をセグメントごとに記録でき、いずれも `otoano:hasSetting` の `GearSetting` として保存される（`paramConcept` は `otoano:pickup` / `otoano:volume` / `otoano:tone`。pickup の値は選択位置の文字列）
- **音作り・機材設定**：`type: "gear"` カードで製品・カテゴリ・パラメータ表を構造化 → `otoano:GearUsage` / `otoano:hasSetting`（`schema:PropertyValue` 互換）。`gearCategory` は上位カテゴリ（`effector`）でも下位分類（`fx-overdrive`）でも指定でき、両者は `skos:broader` で接続されているため上位からの検索でたどれる
- **外部接続**：`sameAs` で MusicBrainz 等へリンク
- 投稿エディターが生成するJSONも同じJSON-LD構造（`@context` / `@id` / `@type` 付き）

### gear カード（機材設定）の記法

```json
{
  "type": "gear",
  "title": "アンプ基本設定（Fender '59 Bassman）",
  "gearCategory": "amp",
  "url": "https://jp.fender.com/products/59-bassman-ltd",
  "src": "imgs/amp.jpg",
  "settings": [
    { "name": "GAIN",   "value": "3", "unit": "0-12" },
    { "name": "TREBLE", "value": "6", "unit": "0-12" }
  ],
  "note": "クリーン〜クランチ設定"
}
```

`gearCategory`: `guitar` / `amp` / `effector` / `multi-effector` / `cable` / `pick` / `strings` / `other`

---

## annotations.json 記法

プレイヤーが読み込む楽曲アノテーションデータ。  
`songs.json` の `playerFile` フィールドで指定されたファイルが読み込まれる。

### 基本構造

```json
{
  "version": 1,
  "title": "楽曲名 / バンド名",
  "videoId": "YouTubeの動画ID",
  "comment": "投稿者のひとことコメント",
  "gearInfo": [],
  "knowledgeInfo": [],
  "categories": [
    { "id": "all",       "label": "すべて" },
    { "id": "technique", "label": "奏法" },
    { "id": "equipment", "label": "機材設定" },
    { "id": "other",     "label": "その他" }
  ],
  "annotations": []
}
```

### セグメント (annotation)

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `id` | string | 必須 | 一意のID |
| `start` | number | 必須 | 開始秒数 |
| `end` | number | 必須 | 終了秒数（`start` より大きい値） |
| `title` | string | — | セグメント名 |
| `description` | string | — | 説明文（`\n` で改行） |
| `category` | string | — | カテゴリID（`technique` / `equipment` / `other`） |
| `items` | array | — | 関連カードの配列 |

---

## アイテムタイプ

### video — YouTube関連動画

```json
{ "type": "video", "title": "タイトル", "videoId": "xxxxxxxxxxx", "startTime": 60, "note": "補足" }
```

サムネイルをクリックするとインラインiframeで自動再生される。

### link — 外部リンク

```json
{ "type": "link", "title": "タイトル", "url": "https://example.com", "note": "補足" }
```

### image — 画像

```json
{ "type": "image", "title": "タイトル", "src": "imgs/example.jpg", "note": "説明" }
```

クリックで別タブに開く。`src` はローカルパスまたは外部URL。

### text — テキストメモ

```json
{ "type": "text", "title": "タイトル", "text": "本文" }
```

### chord — コード進行

コード進行をABC記法（ベース譜表）で楽譜表示し、Web Audio APIで再生できる。

```json
{
  "type": "chord",
  "title": "サビのコード",
  "syncStart": 45,
  "timeSignature": [4, 4],
  "progression": [
    { "chord": "FM7", "beat": 1, "beats": 2, "start": 0,   "end": 1.5 },
    { "chord": "Em7", "beat": 3, "beats": 2, "start": 1.5, "end": 3.0 }
  ]
}
```

| フィールド | 説明 |
|-----------|------|
| `progression` | コードの配列（必須） |
| `timeSignature` | 拍子 `[分子, 分母]`（デフォルト: `[4, 4]`） |
| `syncStart` | 再生ボタン押下時に動画をシークする秒数 |
| `chord` | コード名（Tonal.js形式: `C`, `Dm7`, `FM7/E` など） |
| `beat` | 小節内の拍位置（1始まり） |
| `beats` | 持続拍数（デフォルト: 1） |
| `start` / `end` | 再生ハイライトのオフセット（秒） |

### score — 楽譜（MEI / MusicXML）

VerovioでSVGレンダリングし、MIDIとして再生できる。

```json
{
  "type": "score",
  "format": "musicxml",
  "title": "メロディ",
  "src": "cards/melody.musicxml",
  "renderOptions": { "scale": 35 }
}
```

`src` の代わりに `data` フィールドにインライン文字列も指定可能。

---

## 使用ライブラリ

| ライブラリ | 用途 | 読み込みタイミング |
|-----------|------|--------------------|
| [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference) | 動画埋め込み・再生制御 | 起動時（常時） |
| [abcjs @6](https://www.abcjs.net/) | ABC記法によるコード進行の楽譜描画 | 遅延（chordアイテム使用時） |
| [Tonal.js](https://github.com/tonaljs/tonal) | コード解析・音名変換・MIDI変換 | 遅延（chordアイテム使用時） |
| [Verovio](https://www.verovio.org/) | MEI/MusicXML楽譜レンダリング＋MIDI変換 | 遅延（scoreアイテム使用時） |
| [soundfont-player](https://github.com/danigb/soundfont-player) | MusyngKiteピアノ音源（高音質再生） | 遅延（chord/scoreアイテム使用時） |

ライブラリは `annotations.json` の内容を解析し、必要なアイテムタイプが存在する場合のみ非同期で読み込まれる。読み込み完了前はテキストフォールバック表示となり、完了後に自動で再描画される。

---

## ローカル開発

`file://` プロトコルでは `fetch()` が動作しないため、Webサーバー経由でアクセスすること。

```bash
# Viteを使う場合
vite --open index.html

# シンプルなHTTPサーバーでも可
npx serve .
```

---

## URLパラメータ

| URL例 | 効果 |
|------|------|
| `player.html` | デフォルトの `annotations.json` を読み込む |
| `player.html?a=song2.json` | 指定したアノテーションファイルを読み込む |
| `search.html?q=SHISHAMO` | 横断検索を指定キーワードで自動実行 |

---

## キーボード操作（プレイヤー画面）

| キー | 操作 |
|-----|------|
| `Space` | 再生 / 一時停止 |
