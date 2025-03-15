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

# 難易度別のスコアランキングを取得
# データベースをクリア
@app.route('/clear-database', methods=['POST'])
def clear_database():
    with sqlite3.connect('messages.db') as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM messages')
        cursor.execute('DELETE FROM tetris_scores')
        conn.commit()
        return jsonify({'success': True})

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

if __name__ == '__main__':
    init_db()
    app.run(port=5000)
