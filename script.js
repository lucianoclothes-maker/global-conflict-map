/**
 * GLOBAL CONFLICT DASHBOARD v3.0 - ULTIMATE EDITION
 * Включва: Автоматична статистика, Тактически икони, Фронтова линия и Новинарски тикер.
 */

window.onload = function() {
    // --- 1. ОСНОВНИ НАСТРОЙКИ НА КАРТАТА ---
    const map = L.map('map', { 
        worldCopyJump: true, 
        minZoom: 2,
        zoomControl: true 
    }).setView([48.0, 37.0], 5);

    // Слоеве за обектите (Иконите трябва да са най-отгоре)
    const markersLayer = L.layerGroup().addTo(map);

    // Тъмна карта (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB'
    }).addTo(map);

    // --- 2. ГЕО-ПОЛИТИЧЕСКА ЗОНА (УКРАЙНА - ФИКСИРАНА) ---
    // Точките са подредени по часовниковата стрелка за предотвратяване на зиг-заг
    const ukraineZonePoints = [
        [51.5, 34.0], [50.5, 36.5], [50.1, 38.5], [49.2, 39.8], // Север
        [48.5, 39.5], [47.1, 38.2], [46.5, 37.0], [45.3, 36.6], // Донбас / Азов
        [44.4, 34.0], [44.3, 33.5], [45.2, 33.0], [46.3, 32.2], // Крим / Херсон
        [47.5, 34.5], [48.5, 36.0], [50.0, 34.5], [51.5, 34.0]  // Затваряне
    ];

    L.polygon(ukraineZonePoints, {
        color: '#ff3333',
        weight: 1.5,
        fillColor: '#ff0000',
        fillOpacity: 0.15,
        dashArray: '5, 10',
        interactive: false // Критично: позволява кликане върху иконите под полигона
    }).addTo(map);

    // Имената на държавите
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { 
        opacity: 0.4, 
        pane: 'shadowPane' 
    }).addTo(map);

    // --- 3. РАЗШИРЕНА СИСТЕМА ЗА ТАКТИЧЕСКИ ИКОНИ ---
    // Създава неонов ефект и пулсация за по-добра видимост
    const createTacticalIcon = (symbol, color, pulse = false) => L.divIcon({
        html: `<div style="
            color: ${color}; 
            font-size: 22px; 
            text-shadow: 0 0 10px ${color}, 0 0 5px #000; 
            font-weight: bold; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            ${pulse ? 'animation: pulse 1.5s infinite;' : ''}">
            ${symbol}
        </div>`,
        className: '', iconSize: [32, 32], iconAnchor: [16, 16]
    });

    const iconSet = {
        combat:  createTacticalIcon('⚔️', '#ff4d4d', true), // Бойни действия
        missile: createTacticalIcon('🚀', '#a366ff'),      // Ракети/Дронове
        navy:    createTacticalIcon('🚢', '#3498db'),      // Кораби
        alert:   createTacticalIcon('⚠️', '#ffcc00'),      // Напрежение
        aid:     createIcon('📦', '#2ecc71'),              // Хуманитарна помощ (Сомалия/Газа)
        cyber:   createIcon('💻', '#00f2ff'),              // Кибератаки
        nuke:    createIcon('☢️', '#76ff03'),              // Ядрена заплаха
        default: createTacticalIcon('●', '#ff4d4d', true)  // Стандартна точка
    };

    // Функция за разпознаване на типа събитие по ключови думи
    function determineIcon(title, description) {
        const fullText = (title + " " + (description || "")).toLowerCase();
        
        if (fullText.includes('missile') || fullText.includes('drone') || fullText.includes('strike') || fullText.includes('explosion')) return iconSet.missile;
        if (fullText.includes('ship') || fullText.includes('navy') || fullText.includes('sea') || fullText.includes('vessel')) return iconSet.navy;
        if (fullText.includes('aid') || fullText.includes('food') || fullText.includes('humanitarian') || fullText.includes('hunger')) return iconSet.aid;
        if (fullText.includes('nuclear') || fullText.includes('radiation') || fullText.includes('zaporizhzhia')) return iconSet.nuke;
        if (fullText.includes('cyber') || fullText.includes('hacking') || fullText.includes('internet')) return iconSet.cyber;
        if (fullText.includes('warning') || fullText.includes('threat') || fullText.includes('alert') || fullText.includes('border')) return iconSet.alert;
        if (fullText.includes('war') || fullText.includes('village') || fullText.includes('killing') || fullText.includes('clash') || fullText.includes('battle')) return iconSet.combat;
        
        return iconSet.default;
    }

    // --- 4. ОСНОВНА ФУНКЦИЯ ЗА ДАННИТЕ ---
    function updateLiveDashboard() {
        console.log("Fetching latest conflict data...");
        
        fetch('conflicts.json?cache_bust=' + Date.now())
            .then(res => res.json())
            .then(data => {
                markersLayer.clearLayers();
                
                let totalFatalities = 0;
                let countriesSet = new Set();
                let newsList = [];

                data.forEach(item => {
                    // Агрегиране на статистика
                    let fatalities = parseInt(item.fatalities);
                    if (!isNaN(fatalities)) totalFatalities += fatalities;
                    if (item.country) countriesSet.add(item.country);
                    
                    newsList.push(`[${item.country.toUpperCase()}]: ${item.title}`);

                    // Поставяне на маркер с правилната икона
                    const tacticalIcon = determineIcon(item.title, item.description);
                    const marker = L.marker([item.lat, item.lon], { icon: tacticalIcon });
                    
                    marker.addTo(markersLayer).on('click', () => {
                        const panel = document.getElementById('news-content');
                        if (panel) {
                            panel.innerHTML = `
                                <div class="news-card">
                                    <div class="card-header">
                                        <span class="country-tag">${item.country}</span>
                                        <span class="time-tag">${new Date().toLocaleDateString()}</span>
                                    </div>
                                    <h3>${item.title}</h3>
                                    <p>${item.description || "Няма налично допълнително описание за това събитие."}</p>
                                    <div class="card-footer">
                                        <strong>Потвърдени жертви: ${item.fatalities || 0}</strong>
                                        <a href="${item.link}" target="_blank" class="news-link">ПЪЛЕН АНАЛИЗ →</a>
                                    </div>
                                </div>`;
                        }
                    });
                });

                // Обновяване на UI елементите (Статистика)
                updateElement('active-events', "Active events: " + data.length);
                updateElement('total-fatalities', "Total fatalities: " + totalFatalities);
                updateElement('countries-affected', "Countries affected: " + countriesSet.size);
                updateElement('last-update', new Date().toLocaleTimeString() + " (Auto-refresh)");

                // Обновяване на тикера (Зеления текст)
                const ticker = document.getElementById('news-ticker');
                if (ticker) ticker.innerText = newsList.join('   •   ');
            })
            .catch(error => {
                console.error("Critical error loading conflicts.json:", error);
            });
    }

    // Помощна функция за UI
    function updateElement(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }

    // Първоначално зареждане и цикъл
    updateLiveDashboard();
    setInterval(updateLiveDashboard, 60000); // На всеки 60 секунди
};

// --- 5. UTC СИСТЕМЕН ЧАСОВНИК ---
setInterval(() => {
