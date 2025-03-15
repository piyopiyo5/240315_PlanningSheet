from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# データベースの初期化
def init_db():
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        
        # テーブルの作成
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tetris_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name TEXT NOT NULL,
                score INTEGER NOT NULL,
                difficulty TEXT NOT NULL,
                play_time INTEGER NOT NULL,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                assignee TEXT,
                estimated_hours REAL DEFAULT 0,
                actual_hours REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS task_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                date DATE NOT NULL,
                planned_hours REAL DEFAULT 0,
                actual_hours REAL DEFAULT 0,
                FOREIGN KEY (task_id) REFERENCES tasks(id)
            )
        ''')
        conn.commit()

        # サンプルプロジェクトの作成
        cursor.execute('SELECT COUNT(*) FROM projects')
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
                INSERT INTO projects (name, description)
                VALUES (?, ?)
            ''', ('サンプルプロジェクト', 'テスト用プロジェクト'))
            
            project_id = cursor.lastrowid
            
            # サンプルタスクの作成
            sample_tasks = [
                ('タスク1', '担当者A'),
                ('タスク2', '担当者B'),
                ('タスク3', '担当者C')
            ]
            
            for task_name, assignee in sample_tasks:
                cursor.execute('''
                    INSERT INTO tasks (project_id, name, assignee)
                    VALUES (?, ?, ?)
                ''', (project_id, task_name, assignee))
            
            conn.commit()

# 投稿一覧を取得
@app.route('/messages', methods=['GET'])
def get_messages():
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM messages ORDER BY created_at DESC')
        messages = cursor.fetchall()
        return jsonify([{
            'id': msg[0],
            'name': msg[1],
            'content': msg[2],
            'created_at': msg[3]
        } for msg in messages])

# 新規投稿
@app.route('/messages', methods=['POST'])
def create_message():
    data = request.get_json()
    name = data.get('name')
    content = data.get('content')
    
    if not name or not content:
        return jsonify({'error': '名前とメッセージを入力してください'}), 400
    
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO messages (name, content) VALUES (?, ?)',
            (name, content)
        )
        conn.commit()
        
        # 追加したメッセージを取得
        cursor.execute(
            'SELECT * FROM messages WHERE id = ?',
            (cursor.lastrowid,)
        )
        message = cursor.fetchone()
        
        return jsonify({
            'id': message[0],
            'name': message[1],
            'content': message[2],
            'created_at': message[3]
        })

# テトリスのスコアを保存
@app.route('/tetris/scores', methods=['POST'])
def save_tetris_score():
    data = request.get_json()
    player_name = data.get('player_name')
    score = data.get('score')
    difficulty = data.get('difficulty')
    play_time = data.get('play_time')
    
    if not all([player_name, score, difficulty, play_time]):
        return jsonify({'error': '必要な情報が不足しています'}), 400
    
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO tetris_scores (player_name, score, difficulty, play_time) VALUES (?, ?, ?, ?)',
            (player_name, score, difficulty, play_time)
        )
        conn.commit()
        
        return jsonify({'success': True})

# データベースをクリア
@app.route('/clear-database', methods=['POST'])
def clear_database():
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM messages')
        cursor.execute('DELETE FROM tetris_scores')
        cursor.execute('DELETE FROM task_schedules')
        cursor.execute('DELETE FROM tasks')
        cursor.execute('DELETE FROM projects')
        conn.commit()

        # サンプルプロジェクトの作成
        cursor.execute('''
            INSERT INTO projects (name, description)
            VALUES (?, ?)
        ''', ('サンプルプロジェクト', 'テスト用プロジェクト'))
        
        return jsonify({'success': True})

# テトリススコアの取得
@app.route('/tetris/scores/<difficulty>', methods=['GET'])
def get_tetris_scores(difficulty):
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT player_name, score, play_time, played_at 
            FROM tetris_scores 
            WHERE difficulty = ? 
            ORDER BY score DESC 
            LIMIT 10
        ''', (difficulty,))
        scores = cursor.fetchall()
        
        return jsonify([{
            'player_name': score[0],
            'score': score[1],
            'play_time': score[2],
            'played_at': score[3]
        } for score in scores])

# プロジェクト関連のエンドポイント
@app.route('/api/projects', methods=['GET'])
def get_projects():
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM projects ORDER BY created_at DESC')
        projects = cursor.fetchall()
        return jsonify([{
            'id': p[0],
            'name': p[1],
            'description': p[2],
            'created_at': p[3]
        } for p in projects])

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    
    if not name:
        return jsonify({'error': 'プロジェクト名は必須です'}), 400
    
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO projects (name, description) VALUES (?, ?)',
            (name, description)
        )
        conn.commit()
        return jsonify({'id': cursor.lastrowid, 'name': name, 'description': description})

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        
        # プロジェクト情報の取得
        cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
        project = cursor.fetchone()
        if not project:
            return jsonify({'error': 'プロジェクトが見つかりません'}), 404
        
        # タスク一覧の取得
        cursor.execute('''
            SELECT t.*, GROUP_CONCAT(json_object(
                'date', ts.date,
                'planned_hours', ts.planned_hours,
                'actual_hours', ts.actual_hours
            )) as schedules
            FROM tasks t
            LEFT JOIN task_schedules ts ON t.id = ts.task_id
            WHERE t.project_id = ?
            GROUP BY t.id
        ''', (project_id,))
        tasks = cursor.fetchall()
        
        return jsonify({
            'project': {
                'id': project[0],
                'name': project[1],
                'description': project[2],
                'created_at': project[3]
            },
            'tasks': [{
                'id': t[0],
                'name': t[2],
                'assignee': t[3],
                'estimated_hours': t[4],
                'actual_hours': t[5],
                'schedules': t[7] or []
            } for t in tasks]
        })

# タスク関連のエンドポイント
@app.route('/api/projects/<int:project_id>/tasks', methods=['POST'])
def update_tasks(project_id):
    data = request.get_json()
    tasks = data.get('tasks', [])
    
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        
        # プロジェクトの存在確認
        cursor.execute('SELECT id FROM projects WHERE id = ?', (project_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'プロジェクトが見つかりません'}), 404
        
        # 既存のタスクとスケジュールを削除
        cursor.execute('DELETE FROM task_schedules WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)', (project_id,))
        cursor.execute('DELETE FROM tasks WHERE project_id = ?', (project_id,))
        
        # 新しいタスクとスケジュールを登録
        for task in tasks:
            cursor.execute('''
                INSERT INTO tasks (project_id, name, assignee, estimated_hours, actual_hours)
                VALUES (?, ?, ?, ?, ?)
            ''', (project_id, task['name'], task['assignee'], task.get('estimated_hours', 0), task.get('actual_hours', 0)))
            task_id = cursor.lastrowid
            
            # スケジュールの登録
            schedules = task.get('schedules', {})
            for date, hours in schedules.items():
                cursor.execute('''
                    INSERT INTO task_schedules (task_id, date, planned_hours, actual_hours)
                    VALUES (?, ?, ?, ?)
                ''', (task_id, date, hours.get('planned', 0), hours.get('actual', 0)))
        
        conn.commit()
        return jsonify({'success': True})

if __name__ == '__main__':
    # データベースの初期化とサンプルデータの作成
    init_db()
    app.run(port=5000)
