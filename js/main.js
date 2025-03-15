import { TaskPlanner } from './planning.js';

document.addEventListener('DOMContentLoaded', async () => {
    // タスク計画機能の初期化
    const planningBtn = document.getElementById('planningBtn');
    const planningModal = document.getElementById('planningModal');
    // タスク計画機能の初期化
    let taskPlanner = null;
    const initializeTaskPlanner = async () => {
        try {
            // 初期プロジェクトの作成
            await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'テストプロジェクト',
                    description: '初期プロジェクト'
                })
            });
            
            // TaskPlannerのインスタンス化
            taskPlanner = new TaskPlanner();
        } catch (error) {
            console.error('TaskPlanner初期化エラー:', error);
        }
    };

    // 初期化を実行
    await initializeTaskPlanner();
    
    planningBtn.addEventListener('click', async () => {
        planningModal.style.display = 'block';
        planningModal.classList.add('active');
    });

    // モーダルの閉じる処理
    const closeButtons = document.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.planning-modal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        });
    });

    // モーダル外クリックで閉じる
    planningModal.addEventListener('click', (e) => {
        if (e.target === planningModal) {
            planningModal.style.display = 'none';
            planningModal.classList.remove('active');
        }
    });

    // メッセージフォームの処理
    const messageForm = document.getElementById('messageForm');
    const nameInput = document.getElementById('nameInput');
    const messageInput = document.getElementById('messageInput');
    const messageList = document.getElementById('messageList');
    
    // エラーメッセージ表示用の要素を作成
    const errorContainer = document.createElement('div');
    errorContainer.id = 'errorContainer';
    errorContainer.style.display = 'none';
    errorContainer.style.backgroundColor = '#ffebee';
    errorContainer.style.color = '#c62828';
    errorContainer.style.padding = '10px';
    errorContainer.style.marginBottom = '10px';
    errorContainer.style.borderRadius = '4px';
    messageList.parentNode.insertBefore(errorContainer, messageList);
    
    let isLoading = false;
    const REFRESH_INTERVAL = 5000; // 5秒ごとに更新

    // サーバーからメッセージを読み込む
    const loadMessages = async () => {
        if (isLoading) return;
        isLoading = true;
        try {
            const response = await fetch('http://localhost:5000/messages');
            const messages = await response.json();
            errorContainer.style.display = 'none'; // エラーメッセージを非表示
            displayMessages(messages);
        } catch (error) {
            console.error('メッセージの取得に失敗しました:', error);
            errorContainer.textContent = 'サーバーに接続できません。サーバーが起動しているか確認してください。';
            errorContainer.style.display = 'block';
            messageList.innerHTML = ''; // メッセージリストをクリア
        } finally {
            isLoading = false;
        }
    };

    // メッセージを表示する関数
    const displayMessages = (messages) => {
        messageList.innerHTML = '';
        messages.forEach(message => {
            const messageCard = document.createElement('div');
            messageCard.className = 'message-card';
            messageCard.innerHTML = `
                <div class="message-header">
                    <span>${escapeHtml(message.name)}</span>
                </div>
                <div class="message-content">${escapeHtml(message.content)}</div>
            `;
            messageList.insertBefore(messageCard, messageList.firstChild);
        });
    };

    // HTML特殊文字をエスケープする関数
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // データベースクリアボタンの処理
    const clearDbBtn = document.getElementById('clearDbBtn');
    clearDbBtn.addEventListener('click', async () => {
        if (confirm('本当にデータベースをクリアしますか？\n全ての投稿とテトリスのスコアが削除されます。')) {
            try {
                const response = await fetch('http://localhost:5000/clear-database', {
                    method: 'POST',
                });

                if (!response.ok) {
                    throw new Error('データベースのクリアに失敗しました');
                }

                // メッセージリストをクリアして再読み込み
                messageList.innerHTML = '';
                await loadMessages();
            } catch (error) {
                console.error('データベースのクリアに失敗しました:', error);
                errorContainer.textContent = 'データベースのクリアに失敗しました。サーバーが起動しているか確認してください。';
                errorContainer.style.display = 'block';
            }
        }
    });

    // フォーム送信時の処理
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const content = messageInput.value.trim();

        if (name && content) {
            try {
                // 新しいメッセージを投稿
                const response = await fetch('http://localhost:5000/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, content })
                });

                if (!response.ok) {
                    throw new Error('投稿に失敗しました');
                }

                const newMessage = await response.json();
                errorContainer.style.display = 'none'; // エラーメッセージを非表示

                // フォームをリセット
                messageForm.reset();

                // メッセージを1件だけ追加（アニメーション効果を活かすため）
                const messageCard = document.createElement('div');
                messageCard.className = 'message-card';
                messageCard.innerHTML = `
                    <div class="message-header">
                        <span>${escapeHtml(newMessage.name)}</span>
                    </div>
                    <div class="message-content">${escapeHtml(newMessage.content)}</div>
                `;
                messageList.insertBefore(messageCard, messageList.firstChild);
            } catch (error) {
                console.error('投稿に失敗しました:', error);
                errorContainer.textContent = 'メッセージの投稿に失敗しました。サーバーが起動しているか確認してください。';
                errorContainer.style.display = 'block';
            }
        }
    });

    // 自動更新の開始
    const startAutoRefresh = () => {
        return setInterval(async () => {
            await loadMessages();
        }, REFRESH_INTERVAL);
    };

    // 初期表示と自動更新の開始
    loadMessages();
    const intervalId = startAutoRefresh();

    // ページが閉じられたときのクリーンアップ
    window.addEventListener('unload', () => {
        clearInterval(intervalId);
    });
});
