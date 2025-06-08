const ESP_API_URL = "http://sterowanieesp12.duckdns.org:8080"; 

let ldrChart; 

document.addEventListener('DOMContentLoaded', () => {
    initLdrChart();
    fetchStatus();
    setInterval(fetchStatus, 2000);
});

function updateUI(data) {
    updateStatusWeatherPanel(data);
    updateLedControl(data.ledState, data.ledSource, data.timeRemaining);
    updateLdrPanel(data.ldrValue, data.ldrThresholdLow, data.ldrThresholdHigh, data.controlMode);
    updateLogs(data.logs);
}

function initLdrChart() {
    const ctx = document.getElementById('ldrChart').getContext('2d');
    ldrChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 1023],
                backgroundColor: ['rgb(0, 170, 255)', 'rgba(255, 255, 255, 0.1)'],
                borderColor: ['rgba(0,0,0,0)','rgba(0,0,0,0)'],
                borderWidth: 0,
                circumference: 270,
                rotation: 225,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            cutout: '80%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

function updateStatusWeatherPanel(data) {
    const { temperature, weatherId, weatherDescription, sunriseTime, sunsetTime, isPirActive, locationName } = data;
    
    document.getElementById('temperature').innerText = temperature ? `${Math.round(temperature)}°C` : '--°C';
    document.getElementById('weatherDescription').innerText = weatherDescription || 'Brak danych';
    document.getElementById('weatherIcon').className = getWeatherIconClass(weatherId);

    document.getElementById('sunrise').innerText = sunriseTime || 'N/A';
    document.getElementById('sunset').innerText = sunsetTime || 'N/A';
    
    document.getElementById('locationName').innerText = locationName || 'Brak lokalizacji';

    const pirStatus = document.getElementById('pirStatus');
    pirStatus.innerHTML = isPirActive 
        ? `<i class="fa-solid fa-person-rays"></i> PIR jest Aktywny`
        : `<i class="fa-solid fa-moon"></i> PIR jest Nieaktywny`;
    pirStatus.className = isPirActive ? 'pir-status active' : 'pir-status inactive';
}

function updateLedControl(state, source, timeRemaining) {
    const statusText = document.getElementById('ledStatus');
    const timerText = document.getElementById('ledTimer');
    const progressBg = document.getElementById('ledProgressBg');
    const progressBar = document.getElementById('ledProgressBar');
    const ledCard = document.getElementById('ledControlCard');

    if (state) {
        ledCard.classList.add('card-active');
        statusText.innerText = `Oświetlenie Włączone`;
        if (timeRemaining > 0) {
            const totalDuration = (source === "WWW" ? 5*60 : (source === "Przycisk" ? 2*60*60 : 60));
            timerText.innerText = `Wyłączy się za ${Math.floor(timeRemaining / 60)}m ${String(timeRemaining % 60).padStart(2, '0')}s`;
            progressBar.style.width = `${Math.min(100, (timeRemaining / totalDuration) * 100)}%`;
            progressBg.style.display = 'block';
        } else {
            timerText.innerText = `(Tryb: ${source})`;
            progressBg.style.display = 'none';
        }
    } else {
        ledCard.classList.remove('card-active');
        statusText.innerText = 'Oświetlenie Wyłączone';
        timerText.innerText = '';
        progressBg.style.display = 'none';
    }
}

function updateLdrPanel(ldrValue, low, high, controlMode) {
    if (ldrChart) {
        ldrChart.data.datasets[0].data = [ldrValue, 1023 - ldrValue];
        ldrChart.update('none');
    }
    document.getElementById('ldrValue').innerText = ldrValue;

    document.getElementById('ldrThresholdLowSlider').value = low;
    document.getElementById('ldrThresholdLow').value = low;
    document.getElementById('ldrThresholdHighSlider').value = high;
    document.getElementById('ldrThresholdHigh').value = high;
    document.getElementById('modeSelect').checked = (controlMode == 1);
}

function updateLogs(logs) {
    const logsList = document.getElementById('logsList');
    if (!logs || logs.length === 0) {
        logsList.innerHTML = `<div class="log-item"><i class="fa-solid fa-inbox"></i>Brak logów.</div>`;
        return;
    }
    
    const logIcons = { 'PIR': 'fa-person-rays', 'WWW': 'fa-globe', 'Przycisk': 'fa-hand-pointer', 'BTN': 'fa-hand-pointer', 'LDR': 'fa-gauge-high', 'TRYB': 'fa-gears', 'Wyłączony': 'fa-power-off', 'Automatyczne': 'fa-clock', 'Błąd': 'fa-triangle-exclamation', 'ERR': 'fa-triangle-exclamation', 'Słońce': 'fa-sun', 'WiFi': 'fa-wifi', 'NTP': 'fa-clock-rotate-left', 'OTA': 'fa-upload' };
    const logClasses = { 'PIR': 'pir', 'WWW': 'www', 'Przycisk': 'btn', 'BTN': 'btn', 'LDR': 'ldr', 'TRYB': 'mode', 'Błąd': 'error', 'ERR': 'error' };

    logsList.innerHTML = logs.map(log => {
        let iconClass = 'fa-solid fa-info-circle';
        let itemClass = 'log-item';
        for (const key in logIcons) { if (log.includes(key)) { iconClass = `fa-solid ${logIcons[key]}`; break; } }
        for (const key in logClasses) { if (log.includes(key)) { itemClass += ` ${logClasses[key]}`; break; } }
        const cleanLog = log.substring(log.indexOf(']') + 2);
        return `<div class="${itemClass}"><i class="${iconClass}"></i><span>${cleanLog}</span></div>`;
    }).join('');
}

function getWeatherIconClass(weatherId) {
    if (!weatherId) return 'fa-solid fa-question weather-icon';
    if (weatherId >= 200 && weatherId < 300) return 'fa-solid fa-cloud-bolt weather-icon';
    if (weatherId >= 300 && weatherId < 400) return 'fa-solid fa-cloud-drizzle weather-icon';
    if (weatherId >= 500 && weatherId < 600) return 'fa-solid fa-cloud-showers-heavy weather-icon';
    if (weatherId >= 600 && weatherId < 700) return 'fa-solid fa-snowflake weather-icon';
    if (weatherId >= 700 && weatherId < 800) return 'fa-solid fa-smog weather-icon';
    if (weatherId === 800) return 'fa-solid fa-sun weather-icon';
    if (weatherId === 801) return 'fa-solid fa-cloud-sun weather-icon';
    if (weatherId > 801) return 'fa-solid fa-cloud weather-icon';
    return 'fa-solid fa-question weather-icon';
}

async function apiPost(endpoint) {
    try {
        const response = await fetch(`${ESP_API_URL}/${endpoint}`, { method: 'POST' });
        if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
        await fetchStatus();
    } catch (error) {
        console.error(`Błąd podczas wywołania ${endpoint}:`, error);
        alert(`Wystąpił błąd komunikacji z urządzeniem. Sprawdź konsolę (F12).`);
    }
}

async function apiGet(endpoint, params) {
    try {
        const response = await fetch(`${ESP_API_URL}/${endpoint}?${params}`);
        if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
    } catch (error) {
        console.error(`Błąd podczas wywołania ${endpoint}:`, error);
    }
}

function toggleLed() { apiPost('toggle_www'); }
function resetLdrSettings() { if(confirm("Resetować progi LDR?")) apiPost('reset_ldr'); }
function setControlMode(mode) { apiGet('set_control_mode', `mode=${mode}`); }

const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

const updateLdrRange = debounce(() => {
    let low = document.getElementById('ldrThresholdLow').value;
    let high = document.getElementById('ldrThresholdHigh').value;
    apiGet('set_ldr_threshold_range', `low=${low}&high=${high}`);
}, 500);

function onRangeInputNum() {
    let low = parseInt(document.getElementById('ldrThresholdLow').value);
    let high = parseInt(document.getElementById('ldrThresholdHigh').value);
    if (low > high) [low, high] = [high, low];
    document.getElementById('ldrThresholdLowSlider').value = low;
    document.getElementById('ldrThresholdHighSlider').value = high;
    updateLdrRange();
}

function onRangeInputSliderLow() {
    let low = parseInt(document.getElementById('ldrThresholdLowSlider').value);
    let high = parseInt(document.getElementById('ldrThresholdHighSlider').value);
    if (low > high) {
        high = low;
        document.getElementById('ldrThresholdHighSlider').value = high;
    }
    document.getElementById('ldrThresholdLow').value = low;
    updateLdrRange();
}

function onRangeInputSliderHigh() {
    let low = parseInt(document.getElementById('ldrThresholdLowSlider').value);
    let high = parseInt(document.getElementById('ldrThresholdHighSlider').value);
    if (high < low) {
        low = high;
        document.getElementById('ldrThresholdLowSlider').value = low;
    }
    document.getElementById('ldrThresholdHigh').value = high;
    updateLdrRange();
}

async function fetchStatus() {
    try {
        const response = await fetch(`${ESP_API_URL}/status`);
        if (!response.ok) throw new Error(`Błąd połączenia: ${response.status}`);
        const data = await response.json();
        updateUI(data);
    } catch(error) {
        console.error("Nie udało się pobrać statusu z ESP.", error);
    }
}