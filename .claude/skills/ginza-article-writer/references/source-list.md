# 銀座エリアの情報源

銀座Nowの記事候補を探すときに巡回する情報源。上から順に優先度が高い。

- **一次情報**（主催者・施設の公式ページ）で会期・時間・会場・料金を確認してから記事にする。まとめサイトは発見用に使い、`sources` には一次情報を先に並べる。
- 「アクセス」欄は 2026-11-04 時点の確認結果。`curl` 可＝素の HTTP 取得で一覧が読める。`403` / `ボット対策` ＝ curl や WebFetch で弾かれることがあるため、WebSearch（`site:` 指定）で個別ページを探す。`要許可` ＝クラウドセッションのネットワーク設定で許可されていないドメイン。
- 対象エリア: 銀座1〜8丁目、有楽町、日比谷、東銀座・築地、京橋・銀座一丁目。丸の内・日本橋は銀座から徒歩圏の大型イベント（イルミネーション等）に限って扱う。

## エリア総合・行政

- **GINZA OFFICIAL（銀座の総合情報サイト）**
  - 一覧: https://www.ginza.jp/event
  - 詳細: `https://www.ginza.jp/event/{ID}`、店舗ニュースは `https://www.ginza.jp/shopnews/{店舗}/{ID}`
  - メモ: 運営は Ginza Information Management。銀座通連合会の主催イベント（GINZA GILC NIGHT、ゆかたで銀ぶら、オータムギンザ、歩行者天国関連など）と加盟店の催事が載る。銀座通連合会の公式サイトではない点に注意（ラベルは「GINZA OFFICIAL」）。アクセス: curl 可
- **中央区観光協会 イベント情報**
  - 一覧: https://www.chuo-kanko.or.jp/blogs/event
  - 月別タグ: `https://www.chuo-kanko.or.jp/blogs/event/tagged/2026年11月`（URLエンコードして使う）
  - メモ: 区の観光イベント、まち歩き、中央区観光商業まつりなど。エリアタグ（銀座エリア・築地エリア）で絞り込める。アクセス: curl 可
- **銀座なび イベント掲示板**
  - 一覧: https://www.ginza-web.com/event/
  - メモ: 店舗・ギャラリーの投稿型掲示板。更新が止まっている投稿も多いので、必ず公式ページで裏取りする。アクセス: curl 可
- **中央区 公式サイト**
  - https://www.city.chuo.lg.jp/
  - メモ: 区主催の催し、銀座の歩行者天国（中央通り）の実施・中止情報。アクセス: curl 可

## 商業施設・百貨店

- **GINZA SIX ニュース**
  - 一覧: https://ginza6.tokyo/news/
  - イベントのみ: https://ginza6.tokyo/news/news_category/events
  - ポップアップ: https://ginza6.tokyo/news/news_category/the-pop-up
  - 詳細: `/news/detail/shopnews/{ID}`、館のお知らせは `/news/detail/info/{ID}`
  - メモ: 館の季節企画（XMAS、屋上スケートリンク、屋上ライブ）は PR TIMES の GINZA SIX リテールマネジメント配信にも出る。銀座 蔦屋書店（6F）のイベントもここに載ることがある。アクセス: curl 可
- **松屋銀座 イベント**
  - 一覧: https://www.matsuyaginza.com/jp/ginza/events
  - 詳細: `/jp/ginza/events/{fairs|pop-up|exhibition|campaign}/{slug}/{code}`
  - メモ: 8F イベントスクエアの展覧会、催事、ポップアップ。旧URL（matsuya.com/ginza/）はここへリダイレクトされる。並木通り館（ギンザミライミュージアム）の IP 展もここに載る。アクセス: curl 可
- **銀座三越 イベントカレンダー**
  - 一覧: https://www.mistore.jp/store/ginza/event_calendar.html
  - 詳細例: `https://www.mistore.jp/shopping/event/ginza_e/{slug}`
  - メモ: 新館7F 催物会場（物産展・グルメフェス・キャラクター催事）、新館8F アートアクアリウム美術館 GINZA（2027-01-06 で営業終了予定）。アクセス: 403（ボット対策）。WebSearch `site:mistore.jp ginza_e` で個別ページを探す
- **東京ミッドタウン日比谷 イベント・ニュース**
  - 一覧: https://www.hibiya.tokyo-midtown.com/jp/event/ 、https://www.hibiya.tokyo-midtown.com/jp/news/
  - 詳細: `/jp/event/{ID}/`
  - メモ: HIBIYA Magic Time Illumination、日比谷ステップ広場のイベント、館内フェア。館のフェアやキャンペーンは記事価値が低いものが多いので、広場イベント・イルミネーション・期間限定出店を優先。アクセス: curl 可
- **GinzaNovo（ギンザノボ、旧 東急プラザ銀座）**
  - イベント: https://www.ginzanovo.com/event/ 、ショップニュース: https://www.ginzanovo.com/shopnews/
  - メモ: 東急プラザのポータル（https://www.tokyu-plaza.com/info/）に「東急プラザ銀座は GinzaNovo に名称変更」と案内あり。2026-11-01 付で「閉店のお知らせ」が掲載されている（詳細未確認、記事化する場合は要確認）。アクセス: WebFetch 可
- **有楽町マルイ**
  - https://www.0101.co.jp/086/
  - メモ: アニメ・キャラクターのポップアップが多い。アクセス: curl 可
- **ルミネ有楽町**
  - https://www.lumine.ne.jp/yurakucho/
  - メモ: 期間限定ショップ、館のキャンペーン。アクセス: curl 可
- **マロニエゲート銀座**
  - https://www.marronniergate.com/
  - メモ: 館内フェア（例: 銀座はちみつフェア）。プレスリリース PDF が `/theme/mg/upload/pressrelease/` 配下に出る。アクセス: 503（ボット対策）。WebSearch で確認
- **銀座 伊東屋**
  - https://www.ito-ya.co.jp/ginza/
  - メモ: 文具の企画展・ポップアップ。アクセス: curl 可

## アート・ギャラリー・ミュージアム

- **銀座メゾンエルメス フォーラム**
  - https://www.hermes.com/jp/ja/story/maison-ginza/forum/
  - メモ: 無料の現代アート展。会期が長い（約4か月）。アクセス: 403（ボット対策）。レッツエンジョイ東京や美術手帖で会期を拾い、エルメス公式ページを sources に入れる
- **資生堂ギャラリー**
  - 展覧会: https://gallery.shiseido.com/jp/exhibition/
  - メモ: 銀座8丁目、入場無料。アクセス: curl 可
- **ポーラ ミュージアム アネックス**
  - 展覧会: https://www.po-holdings.co.jp/m-annex/exhibition/index.html
  - メモ: 銀座1丁目、入場無料。アクセス: curl 可（トップページは 403 のことがある）
- **ギンザ・グラフィック・ギャラリー（ggg）**
  - スケジュール: https://www.dnpfcp.jp/CGI/gallery/schedule/list.cgi?l=1&t=1
  - メモ: グラフィックデザインの企画展、入場無料。旧URL https://www.dnpfcp.jp/gallery/ggg/jp/ からリダイレクト。アクセス: curl 可
- **アーティゾン美術館**（京橋）
  - https://www.artizon.museum/
  - メモ: 京橋エリア。大型企画展は記事価値が高い。アクセス: curl 可
- **アートアクアリウム美術館 GINZA**
  - https://artaquarium.jp/
  - メモ: 銀座三越 新館8F。2027-01-06 で銀座三越での営業終了予定。アクセス: curl 可
- **東京国際フォーラム イベント情報**（YURAKUCHO MUSEUM を含む）
  - https://www.t-i-forum.co.jp/visitors/event/
  - メモ: 展示ホール・ホールの催し、地下の YURAKUCHO MUSEUM（アニメ・漫画系の大型展）。YURAKUCHO MUSEUM の公式ドメインは要許可（クラウドセッションで未解決）のため、フォーラムのページやレッツエンジョイ東京で確認する

## 劇場・伝統芸能

- **歌舞伎座（歌舞伎美人）**
  - 公演一覧: https://www.kabuki-bito.jp/theaters/kabukiza/play/
  - 劇場サイト: https://www.kabuki-za.co.jp/
  - メモ: 毎月の公演（演目・会期・休演日）。演目と出演者は必ず歌舞伎美人の公演ページで確認する（チケット販売サイトの情報は前年分が混ざることがある）。東銀座エリアの主要ソース。アクセス: curl 可
- **新橋演舞場（歌舞伎美人）**
  - https://www.kabuki-bito.jp/theaters/shinbashi
  - メモ: 東銀座。アクセス: curl 可
- **日生劇場**
  - スケジュール: https://www.nissaytheatre.or.jp/schedule/
  - メモ: 日比谷。ミュージカル・ファミリー公演。アクセス: curl 可
- **東宝 演劇ラインナップ**（帝国劇場・シアタークリエ）
  - https://www.toho.co.jp/stage/lineup/
  - メモ: 日比谷の劇場。帝国劇場は建て替え休館中のため、シアタークリエ中心。アクセス: curl 可
- **宝塚歌劇 東京宝塚劇場スケジュール**
  - https://kageki.hankyu.co.jp/schedule/tokyo.html
  - メモ: 日比谷。公演の初日・千秋楽。アクセス: curl 可

## 築地・日比谷公園・周辺

- **築地場外市場 イベント**
  - https://www.tsukiji.or.jp/event/
  - メモ: 東銀座・築地エリア。食のイベント、年末の営業情報。アクセス: curl 可
- **日比谷公園（東京都公園協会）**
  - お知らせ: https://www.tokyo-park.or.jp/park/hibiya/news/
  - メモ: 日比谷公園で開かれる大型イベント（Hibiya Art Park、オクトーバーフェスト、各種フェス）。アクセス: curl 可
- **丸の内 イベント**（隣接エリア）
  - https://www.marunouchi.com/pickup/event/
  - メモ: 丸の内イルミネーションなど、銀座から徒歩圏の大型イベントのみ扱う。アクセス: curl 可

## まとめ・ニュース（発見用）

- **レッツエンジョイ東京 銀座エリア**
  - 一覧: https://www.enjoytokyo.jp/event/list/area1304/ （72件程度、15件ずつページ送り）
  - 詳細: `https://www.enjoytokyo.jp/event/{ID}/`
  - メモ: 会期・時間・料金・公式URLが整理されていて最も効率がよい。画像は `rstatic.enjoytokyo.jp/assets/images/event/.../img_N.jpg?p=t&w=1200` で取得でき、実体は WebP のことが多い（拡張子を `file` で確認）。アクセス: curl 可
- **ウォーカープラス 銀座・有楽町のイベント**
  - https://www.walkerplus.com/event_list/ar0313/
  - アクセス: curl 可
- **PR TIMES キーワード「銀座」**
  - https://prtimes.jp/topics/keywords/銀座 （URLエンコードして使う）
  - メモ: 施設・ブランドの一次リリース。画像は `prcdn.freetls.fastly.net/release_image/...` から取得。リリース本文の会期・料金を優先する。アクセス: curl 可
- **Fashion Press**
  - https://www.fashion-press.net/news/
  - メモ: ブランドの旗艦店オープン、ポップアップ、展覧会。WebSearch `site:fashion-press.net 銀座` が早い。アクセス: curl 可
- **FASHIONSNAP**
  - https://www.fashionsnap.com/
  - メモ: 商業施設・旗艦店のオープン情報。アクセス: curl 可
- **美術手帖 展覧会情報**
  - https://bijutsutecho.com/exhibitions
  - メモ: ギャラリー・美術館の会期確認。アクセス: curl 可
- **Tokyo Art Beat**
  - https://www.tokyoartbeat.com/events/top
  - メモ: エリア一覧（`/events/search/localArea`）から銀座を選ぶ。一覧はJS描画のため WebFetch では中身が取れないことがある。アクセス: curl 可（一覧の中身は要ブラウザ）
- **コラボカフェ（collabo-cafe.com）**
  - https://collabo-cafe.com/
  - メモ: 有楽町マルイ・松屋銀座 並木通り館などのアニメコラボ、ポップアップの発見用。アクセス: curl 可
- **GO TOKYO 銀座**
  - https://www.gotokyo.org/jp/destinations/central-tokyo/ginza/index.html
  - メモ: 観光向けの基本情報。イベント発見より施設情報の確認用。アクセス: curl 可

## SNS

- **GINZA OFFICIAL 公式X**: https://x.com/ginza_official
  - メモ: 歩行者天国の中止や当日のお知らせ。X はログインなしでは本文が読めないことがあるため、公式サイトで裏取りする

## クラウドセッションで未確認のドメイン

以下はネットワーク設定で許可されていないか、名前解決できなかった。ローカル環境か、ネットワーク設定で許可してから確認する。

- Ginza Sony Park（https://www.sonypark.com/）
- YURAKUCHO MUSEUM（https://www.yurakucho-museum.com/）
- 銀座 蔦屋書店（https://store.tsite.jp/ginza/ ※403）
- 帝国劇場、日比谷公園の各イベント独自ドメイン、銀座の各ギャラリー独自ドメイン
