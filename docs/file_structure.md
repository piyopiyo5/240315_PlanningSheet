# モダン掲示板 ファイル構成書

## プロジェクトルート (c:/work/250315_PlanningSheet)

```
.
├── docs/                      # プロジェクトドキュメント
│   ├── project_specification.md  # プロジェクト仕様書
│   └── file_structure.md      # ファイル構成書
│
├── css/                       # スタイルシート
│   ├── style.css             # メイン掲示板のスタイル
│
├── js/                        # JavaScriptファイル
│   ├── main.js               # 掲示板機能のメインスクリプト
### フロントエンド

#### index.html
- アプリケーションのメインページ
- 現在時刻の表示
- レスポンシブデザイン対応のHTML構造

#### css/style.css
- 現在時刻表示のスタイル定義

#### js/main.js
- 現在時刻表示のフロントエンド実装
