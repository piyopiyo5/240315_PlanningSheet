document.addEventListener('DOMContentLoaded', () => {
    const currentTimeElement = document.getElementById('currentTime');

    const updateTime = () => {
        const now = new Date();
        const formattedTime = now.toLocaleTimeString('ja-JP', { hour12: false });
        currentTimeElement.textContent = formattedTime;
    };

    updateTime();
    setInterval(updateTime, 1000);
});
