# ファイル構成書

## プロジェクトルート (c:/work/250315_PlanningSheet)

```
.
├── docs/                      # プロジェクトドキュメント
│   ├── project_specification.md  # プロジェクト仕様書
│   └── file_structure.md      # ファイル構成書
│
├── css/                       # スタイルシート
│   ├── style.css             # メイン掲示板とカレンダーのスタイル
│
├── js/                        # JavaScriptファイル
│   ├── main.js               # 掲示板とカレンダー機能のメインスクリプト
│
├── data.db                  # SQLiteデータベースファイル
├── server.py                # FlaskバックエンドAPIサーバー
├── run_server.bat          # サーバー起動スクリプト
└── index.html              # メインページ
```

### フロントエンド

#### index.html
- アプリケーションのメインページ
- 現在時刻の表示
- カレンダーのレイアウト
- レスポンシブデザイン対応のHTML構造

#### css/style.css
- 現在時刻表示のスタイル定義
- カレンダーグリッドレイアウト
- 入力フォームのスタイリング
- レスポンシブデザイン対応

#### js/main.js
- 現在時刻表示の実装
- カレンダー表示と操作の実装
- APIとの通信処理
- データの保存と読み込み

### バックエンド

#### server.py
- FlaskベースのRESTful API
- データベース操作
- カレンダーデータのCRUD操作
- CORS設定

#### messages.db
- SQLite3データベース
- カレンダーデータの永続化
