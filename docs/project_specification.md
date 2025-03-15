# モダン掲示板 プロジェクト仕様書

## 1. プロジェクト概要

モダン掲示板は、従来の掲示板機能にテトリスゲームを組み込んだウェブアプリケーションです。ユーザーは掲示板での投稿とテトリスゲームの両方を楽しむことができます。

## 2. 機能仕様

### 2.1 掲示板機能

#### 2.1.1 投稿機能
- ユーザー名とメッセージを入力して投稿可能
- 投稿は即時に表示され、5秒ごとに自動更新
- 投稿一覧は新しい順に表示
- 投稿内容のXSS対策実装済み
- データベースクリア機能あり

### 2.2 テトリスゲーム機能

#### 2.2.1 基本仕様
- プレイヤー名と難易度を選択してゲーム開始
- 次のピースのプレビュー表示
- リアルタイムスコア表示

#### 2.2.2 難易度設定
| 難易度 | 落下速度 | 次のピース表示数 | スコア倍率 |
|--------|----------|------------------|------------|
| かんたん | 1000ms | 3個 | x1 |
| ふつう | 750ms | 2個 | x2 |
| むずかしい | 500ms | 1個 | x3 |

#### 2.2.3 操作方法
- ←→: 左右移動
- ↓: 下に移動（+1点）
- ↑: 回転
- スペース: 即時落下（+2点/マス）

#### 2.2.4 スコアシステム
- ライン消去: 1行=40点、2行=100点、3行=300点、4行=1200点
- 難易度による倍率が適用

#### 2.2.5 ランキング機能
- 難易度別のトップ10を表示
- プレイヤー名、スコア、プレイ時間、プレイ日時を記録

## 3. 技術仕様

### 3.1 フロントエンド
- HTML5, CSS3, JavaScript (ES6+)
- レスポンシブデザイン対応
- アニメーション効果の実装
- モダンな配色とUIデザイン

### 3.2 バックエンド
- Python (Flask)
- SQLite3データベース
- REST API
- CORS対応

### 3.3 データベース設計

#### messages テーブル
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### tetris_scores テーブル
```sql
CREATE TABLE tetris_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    play_time INTEGER NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
