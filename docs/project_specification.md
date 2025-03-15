# プロジェクト仕様書

## 1. プロジェクト概要

モダン掲示板は、カレンダーと現在時刻を表示するウェブアプリケーションです。

## 2. 機能仕様

### 2.1 現在時刻表示機能

- 現在時刻を秒単位で表示
- 時刻は1秒ごとに更新

### 2.2 カレンダー機能

- 月単位でのカレンダー表示
- 前月・次月への移動機能
- 各日付に0-99までの数値を入力可能
- データベースへの保存機能

### 3. 技術仕様

#### 3.1 フロントエンド
- HTML5, CSS3, JavaScript (ES6+)
- レスポンシブデザイン対応
- Fetch APIによる非同期データ通信

#### 3.2 バックエンド
- Python/Flask APIサーバー
- RESTful APIエンドポイント
  - GET /calendar/data: カレンダーデータの取得
  - POST /calendar/data: カレンダーデータの保存

#### 3.3 データベース設計
- SQLite3データベース
- テーブル構造:
  ```sql
  CREATE TABLE calendar_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      value INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date)
  )
  ```

## 4. セキュリティ対策

- XSS対策: 入力値のエスケープ処理
- CORS設定による認可済みオリジンからのアクセス制限
- SQLインジェクション対策: パラメータ化クエリの使用

## 5. 実行環境要件

### 5.1 サーバー要件
- Python 3.x
- Flask
- flask-cors
- SQLite3

### 5.2 クライアント要件
- モダンなウェブブラウザ（Chrome, Firefox, Safari, Edge等）
- JavaScript有効化必須
