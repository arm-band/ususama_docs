### `config.yml`

全般的な設定項目です。

- `commons`: 共通設定
    - `sitename`: (str) サイト名
    - `description`: (str) サイトの説明(`<meta description>`)
    - `year`: (num) コピーライトに表示する年数
    - `author`: (str) コピーライトに表示する著者情報
    - `url`: (str) サイトのURL
- `param`:
    - `news`: 新着情報に関する設定
        - `title`: (str) 新着情報一覧ページの名称を変更できます(e.g. 「新着情報」「ニュース」「更新履歴」)
        - `baseurl`: (str) 記事ページのベースURL(`npm run new`した際にFront Matterに代入される値)を変更できます
        - `indexcount`: (num) トップページに表示する新着情報の件数
        - `newscount`: (num) 新着情報一覧ページに表示する新着情報の件数(1ページ当たり)
    - `ogp`:
        - `ogpimage`: (str) OGPで使用する画像ファイルのパス
        - `twitteraccount`: (str) OGPで使用するTwitterアカウント
        - `newsthumbnail`: (str) 新着情報一覧ページで表示する記事のサムネイル画像(デフォルト画像)
    - `analytics`: (str) アナリティクスID(Google Analytics用)
    - `searchconsole`: (str) Verification Code(Google Search Console用)
    - `articlesns`: 記事ページの各種SNSシェア用ボタンを表示するか否か
        - `twitter`: (bool)
        - `facebook`: (bool)
        - `hatena`: (bool)
        - `line`: (bool)
        - `pocket`: (bool)
        - `feedly`: (bool)

### `commonvar.yml`

ejs, Scssで共通で使用する設定です。

- `color`: (str) 文字色
- `bg-color`: (str) メインコンテンツ部分の背景色
- `main-color`: (str) メインカラーの指定(サイトのメインカラーの他、テーマカラーでも使用します)
- `navbar-height`: (str) ヘッダ(Bootstrapのナビゲーションバー)の高さの指定。アイキャッチ画像の上に`margin-top`を追加したり、`body`タグに`data-offset`をセットします
- `footer-height`: (str) フッタの高さ。`l-upper`クラスと合わせて、コンテンツ表示領域が画面高さに及ばない場合にフッタが下端に来るように調整します

### `ftpconfig.yml`

FTPアップロード機能(プラグイン)で使用する値です。

- `user`: (str) FTPのユーザIDの初期値です(実際に使用する値は別ファイルに生成します)
- `password`: (str) FTPのパスワードの初期値です(実際に使用する値は別ファイルに生成します)
- `host`: (str) FTPホストの指定です
- `port`: (num) FTPポートの値です
- `localRoot`: (str) ローカルのディレクトリ初期位置です
- `remoteRoot`: (str) サーバのディレクトリ初期位置です
- `include`: (array) アップロード対象の指定です
- `deleteRemote`: (bool) アップロード前にサーバのデータを削除するか否かの指定です