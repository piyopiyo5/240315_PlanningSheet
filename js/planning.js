import Calendar from './calendar.js';

/**
 * タスク計画機能のメインクラス
 */
class TaskPlanner {
    constructor() {
        this.calendar = null;
        this.currentProject = null;
        this.tasks = [];
        this.initializeUI();
        this.setupEventListeners();
    }

    /**
     * UIの初期化
     */
    async initializeUI() {
        console.log('UI初期化開始');
        const container = document.querySelector('.planning-container');
        if (!container) {
            console.error('planning-containerが見つかりません');
            return;
        }

        console.log('ツールバーの生成');
        container.appendChild(this.createToolbar());
        
        // プロジェクト選択の生成
        container.appendChild(await this.createProjectSelector());
        
        // プランニンググリッドの生成
        const gridContainer = document.createElement('div');
        gridContainer.className = 'planning-grid';
        container.appendChild(gridContainer);

        // CSV入出力フォームの生成
        container.appendChild(this.createCSVControls());

        // 現在の年月でカレンダーを初期化
        const now = new Date();
        this.calendar = new Calendar.PlanningCalendar(now.getFullYear(), now.getMonth());
        this.refreshCalendar();
    }

    /**
     * ツールバーの生成
     */
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'planning-toolbar';

        const addTaskButton = document.createElement('button');
        addTaskButton.textContent = '新規タスク';
        addTaskButton.onclick = () => this.showTaskDialog();

        const saveButton = document.createElement('button');
        saveButton.textContent = '保存';
        saveButton.onclick = () => this.saveAllTasks();

        toolbar.appendChild(addTaskButton);
        toolbar.appendChild(saveButton);

        return toolbar;
    }

    /**
     * プロジェクト選択の生成
     */
    async createProjectSelector() {
        console.log('プロジェクトセレクター生成開始');
        const container = document.createElement('div');
        container.className = 'project-selector';

        const select = document.createElement('select');
        console.log('プロジェクト一覧取得開始');
        const projects = await this.fetchProjects();
        console.log('取得したプロジェクト:', projects);
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            select.appendChild(option);
        });

        select.onchange = () => this.loadProject(select.value);
        container.appendChild(select);

        return container;
    }

    /**
     * CSV入出力フォームの生成
     */
    createCSVControls() {
        const container = document.createElement('div');
        container.className = 'csv-controls';

        // インポート
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.onchange = (e) => this.handleCSVImport(e);

        // エクスポート
        const exportButton = document.createElement('button');
        exportButton.textContent = 'CSVエクスポート';
        exportButton.onclick = () => this.handleCSVExport();

        container.appendChild(fileInput);
        container.appendChild(exportButton);

        return container;
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        document.addEventListener('keydown', async (e) => {
            // Ctrl+V: ペースト
            if (e.ctrlKey && e.key === 'v') {
                await Calendar.PlanningUtils.pasteFromClipboard(this.calendar);
            }
        });

        // ドラッグ＆ドロップの処理
        let isDragging = false;
        let startCell = null;

        document.addEventListener('mousedown', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                isDragging = true;
                startCell = cell;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const currentCell = e.target.closest('.cell');
                if (currentCell) {
                    this.calendar.handleCellSelection(startCell, currentCell);
                }
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * カレンダーの更新
     */
    refreshCalendar() {
        const grid = document.querySelector('.planning-grid');
        if (!grid || !this.calendar) return;

        grid.innerHTML = '';
        grid.appendChild(this.calendar.generateHeader());

        this.tasks.forEach(task => {
            grid.appendChild(this.calendar.generateTaskRow(task));
        });

        grid.appendChild(this.calendar.generateTotalRow());
        this.calendar.updateTotalHours();
    }

    /**
     * タスク編集ダイアログの表示
     */
    showTaskDialog(task = null) {
        const dialog = document.createElement('div');
        dialog.className = 'task-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>${task ? 'タスクの編集' : '新規タスク'}</h3>
                <div>
                    <label>タスク名:</label>
                    <input type="text" id="taskName" value="${task?.name || ''}">
                </div>
                <div>
                    <label>担当者:</label>
                    <input type="text" id="taskAssignee" value="${task?.assignee || ''}">
                </div>
                <div class="dialog-buttons">
                    <button id="saveTask">保存</button>
                    <button id="cancelTask">キャンセル</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // イベントハンドラ
        dialog.querySelector('#saveTask').onclick = () => {
            const name = dialog.querySelector('#taskName').value;
            const assignee = dialog.querySelector('#taskAssignee').value;

            if (task) {
                // 既存タスクの更新
                task.name = name;
                task.assignee = assignee;
            } else {
                // 新規タスクの作成
                this.tasks.push({
                    id: Date.now().toString(),
                    name,
                    assignee,
                    hours: {}
                });
            }

            this.refreshCalendar();
            dialog.remove();
        };

        dialog.querySelector('#cancelTask').onclick = () => dialog.remove();
    }

    /**
     * プロジェクトの読み込み
     */
    async loadProject(projectId) {
        try {
            const response = await fetch(`/api/projects/${projectId}`);
            if (!response.ok) throw new Error('プロジェクトの読み込みに失敗しました');
            
            const data = await response.json();
            this.currentProject = data.project;
            this.tasks = data.tasks;
            this.refreshCalendar();
        } catch (err) {
            console.error('プロジェクト読み込みエラー:', err);
            alert('プロジェクトの読み込みに失敗しました');
        }
    }

    /**
     * 全タスクの保存
     */
    async saveAllTasks() {
        if (!this.currentProject) return;

        try {
            const response = await fetch(`/api/projects/${this.currentProject.id}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tasks: this.tasks }),
            });

            if (!response.ok) throw new Error('タスクの保存に失敗しました');
            alert('保存が完了しました');
        } catch (err) {
            console.error('タスク保存エラー:', err);
            alert('タスクの保存に失敗しました');
        }
    }

    /**
     * プロジェクト一覧の取得
     */
    async fetchProjects() {
        try {
            console.log('APIリクエスト送信');
            const response = await fetch('/api/projects');
            console.log('APIレスポンス:', response);
            if (!response.ok) throw new Error('プロジェクト一覧の取得に失敗しました');
            const data = await response.json();
            console.log('取得したデータ:', data);
            return data;
        } catch (err) {
            console.error('プロジェクト一覧取得エラー:', err);
            return [];
        }
    }

    /**
     * CSVのインポート
     */
    handleCSVImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const tasks = Calendar.PlanningUtils.importFromCSV(e.target.result);
                this.tasks = tasks;
                this.refreshCalendar();
            } catch (err) {
                console.error('CSVインポートエラー:', err);
                alert('CSVのインポートに失敗しました');
            }
        };
        reader.readAsText(file);
    }

    /**
     * CSVのエクスポート
     */
    handleCSVExport() {
        try {
            const csvContent = Calendar.PlanningUtils.exportToCSV(
                this.tasks,
                this.calendar.year,
                this.calendar.month
            );

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `task_plan_${this.calendar.year}_${this.calendar.month + 1}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('CSVエクスポートエラー:', err);
            alert('CSVのエクスポートに失敗しました');
        }
    }
}

export { TaskPlanner };
