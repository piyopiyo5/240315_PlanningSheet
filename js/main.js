document.addEventListener('DOMContentLoaded', () => {
    const currentTimeElement = document.getElementById('currentTime');
    const calendarDatesElement = document.getElementById('calendarDates');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const saveButton = document.getElementById('saveButton');

    let currentDate = new Date();
    let calendarData = {};

    const updateTime = () => {
        const now = new Date();
        const formattedTime = now.toLocaleTimeString('ja-JP', { hour12: false });
        currentTimeElement.textContent = formattedTime;
    };

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const loadCalendarData = async () => {
        try {
            const response = await fetch('http://localhost:5000/calendar/data');
            if (response.ok) {
                calendarData = await response.json();
            }
        } catch (error) {
            console.error('カレンダーデータの読み込みに失敗しました:', error);
        }
    };

    const saveCalendarData = async () => {
        const inputs = document.querySelectorAll('.calendar-date input');
        const updates = [];

        inputs.forEach(input => {
            if (input.value) {
                updates.push({
                    date: input.getAttribute('data-date'),
                    value: parseInt(input.value, 10)
                });
            }
        });

        for (const update of updates) {
            try {
                const response = await fetch('http://localhost:5000/calendar/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(update)
                });

                if (!response.ok) {
                    throw new Error('保存に失敗しました');
                }
            } catch (error) {
                console.error('データの保存に失敗しました:', error);
            }
        }

        alert('保存が完了しました');
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        currentMonthElement.textContent = `${year}年 ${month + 1}月`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 先月の日数を取得
        const prevMonthLastDay = new Date(year, month, 0);
        const startDay = firstDay.getDay();
        
        calendarDatesElement.innerHTML = '';
        
        // 先月の日付を表示
        for (let i = startDay - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
            const dateElement = createDateElement(date, true);
            calendarDatesElement.appendChild(dateElement);
        }
        
        // 今月の日付を表示
        for (let date = 1; date <= lastDay.getDate(); date++) {
            const currentDateObj = new Date(year, month, date);
            const dateElement = createDateElement(currentDateObj, false);
            calendarDatesElement.appendChild(dateElement);
        }
        
        // 来月の日付を表示
        const remainingDays = 42 - (startDay + lastDay.getDate()); // 6週間分のグリッドを確保
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            const dateElement = createDateElement(date, true);
            calendarDatesElement.appendChild(dateElement);
        }
    };

    const createDateElement = (date, isOtherMonth) => {
        const div = document.createElement('div');
        div.className = 'calendar-date' + 
            (isOtherMonth ? ' other-month' : '') +
            (isSameDate(date, new Date()) ? ' today' : '');
        
        const dateDisplay = document.createElement('div');
        dateDisplay.textContent = date.getDate();
        div.appendChild(dateDisplay);
        
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0;
        input.max = 99;
        input.setAttribute('data-date', formatDate(date));
        
        // 保存済みのデータがあれば表示
        const savedValue = calendarData[formatDate(date)];
        if (savedValue !== undefined) {
            input.value = savedValue;
        }
        
        // 入力値の制限
        input.addEventListener('input', () => {
            const value = parseInt(input.value, 10);
            if (value > 99) input.value = 99;
            if (value < 0) input.value = 0;
        });
        
        div.appendChild(input);
        return div;
    };

    const isSameDate = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    };

    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    saveButton.addEventListener('click', saveCalendarData);

    // 初期化
    loadCalendarData().then(() => {
        renderCalendar();
    });

    updateTime();
    setInterval(updateTime, 1000);
});
