/**
 * カレンダーグリッドの管理クラス
 */
class PlanningCalendar {
    constructor(year, month) {
        this.year = year;
        this.month = month;
        this.holidays = this.getHolidays();
        this.selectedCells = new Set();
    }

    /**
     * カレンダーグリッドのヘッダー行を生成
     */
    generateHeader() {
        const header = document.createElement('div');
        header.className = 'grid-header';

        // タスク情報用の空セル
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cell';
        header.appendChild(emptyCell);

        // 日付セルの生成
        const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const date = new Date(this.year, this.month, day);
            
            // 曜日の取得と表示形式の設定
            const dayOfWeek = date.getDay();
            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
            cell.textContent = `${day}\n(${dayNames[dayOfWeek]})`;

            // 土日と祝日の色分け
            if (dayOfWeek === 0) cell.classList.add('weekend');
            if (dayOfWeek === 6) cell.classList.add('weekend');
            if (this.isHoliday(date)) cell.classList.add('holiday');

            header.appendChild(cell);
        }

        return header;
    }

    /**
     * タスク行を生成
     */
    generateTaskRow(task) {
        const row = document.createElement('div');
        row.className = 'task-row';
        row.dataset.taskId = task.id;

        // タスク情報セル
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        taskInfo.innerHTML = `
            <div>${task.name}</div>
            <div style="font-size: 0.8em; color: #666;">
                担当: ${task.assignee || '未割当'}
            </div>
        `;
        row.appendChild(taskInfo);

        // 日付ごとの工数入力セル
        const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'hours-input';
            input.value = task.hours?.[day] || '';
            input.dataset.day = day;
            
            // 工数入力のバリデーション
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value && !/^\d*\.?\d*$/.test(value)) {
                    e.target.value = value.replace(/[^\d.]/g, '');
                }
                if (value && parseFloat(value) > 24) {
                    e.target.value = '24';
                }
                this.updateTotalHours();
            });

            cell.appendChild(input);
            row.appendChild(cell);
        }

        return row;
    }

    /**
     * 合計行を生成
     */
    generateTotalRow() {
        const row = document.createElement('div');
        row.className = 'task-row total-row';

        const totalInfo = document.createElement('div');
        totalInfo.className = 'task-info';
        totalInfo.textContent = '合計時間';
        row.appendChild(totalInfo);

        const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'cell total-cell';
            cell.dataset.day = day;
            cell.textContent = '0';
            row.appendChild(cell);
        }

        return row;
    }

    /**
     * 工数の合計を更新
     */
    updateTotalHours() {
        const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            let total = 0;
            const inputs = document.querySelectorAll(`.hours-input[data-day="${day}"]`);
            inputs.forEach(input => {
                const value = parseFloat(input.value) || 0;
                total += value;
            });
            const totalCell = document.querySelector(`.total-cell[data-day="${day}"]`);
            if (totalCell) {
                totalCell.textContent = total.toFixed(1);
            }
        }
    }

    /**
     * 祝日判定（仮実装）
     */
    isHoliday(date) {
        // 実際の実装では祝日判定ライブラリや祝日APIを使用
        return this.holidays.some(holiday => 
            holiday.getFullYear() === date.getFullYear() &&
            holiday.getMonth() === date.getMonth() &&
            holiday.getDate() === date.getDate()
        );
    }

    /**
     * 祝日データの取得（仮実装）
     */
    getHolidays() {
        // 実際の実装では祝日データを外部から取得
        return [];
    }

    /**
     * 選択範囲の管理
     */
    handleCellSelection(startCell, endCell) {
        this.selectedCells.clear();
        const cells = document.querySelectorAll('.cell');
        let selecting = false;

        cells.forEach(cell => {
            if (cell === startCell || cell === endCell) {
                selecting = !selecting;
            }
            if (selecting || cell === startCell || cell === endCell) {
                cell.classList.add('selected');
                this.selectedCells.add(cell);
            }
        });
    }

    /**
     * 選択範囲の一括入力
     */
    setValueToSelection(value) {
        this.selectedCells.forEach(cell => {
            const input = cell.querySelector('.hours-input');
            if (input) {
                input.value = value;
            }
        });
        this.updateTotalHours();
    }
}

// カレンダー操作のユーティリティ関数
const PlanningUtils = {
    /**
     * 工数データをCSV形式に変換
     */
    exportToCSV(tasks, year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const headers = ['タスクID', 'タスク名', '担当者'];
        for (let day = 1; day <= daysInMonth; day++) {
            headers.push(`${month + 1}/${day}`);
        }

        const rows = [headers];
        tasks.forEach(task => {
            const row = [task.id, task.name, task.assignee];
            for (let day = 1; day <= daysInMonth; day++) {
                row.push(task.hours?.[day] || '');
            }
            rows.push(row);
        });

        return rows.map(row => row.join(',')).join('\n');
    },

    /**
     * CSVデータを解析してタスクデータに変換
     */
    importFromCSV(csvContent) {
        const rows = csvContent.split('\n').map(row => row.split(','));
        const headers = rows.shift();
        
        return rows.map(row => {
            const task = {
                id: row[0],
                name: row[1],
                assignee: row[2],
                hours: {}
            };
            
            for (let i = 3; i < row.length; i++) {
                if (row[i]) {
                    task.hours[i - 2] = parseFloat(row[i]);
                }
            }
            
            return task;
        });
    },

    /**
     * クリップボードからデータをペースト
     */
    async pasteFromClipboard(calendar) {
        try {
            const text = await navigator.clipboard.readText();
            const rows = text.split('\n').map(row => row.split('\t'));
            
            calendar.selectedCells.forEach((cell, index) => {
                const input = cell.querySelector('.hours-input');
                if (input && rows[0][index]) {
                    input.value = rows[0][index];
                }
            });
            
            calendar.updateTotalHours();
        } catch (err) {
            console.error('クリップボードの読み取りに失敗:', err);
        }
    }
};

// デフォルトエクスポート
export default {
    PlanningCalendar,
    PlanningUtils
};
