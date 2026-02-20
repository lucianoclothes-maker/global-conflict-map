/**
 * GLOBAL CONFLICT DASHBOARD v4.0 - FULL SCALE PRODUCTION CODE
 * Всичко е тук: Карта, Зона Украйна, Статистика, Търсачка с подменю и Икони.
 */

window.onload = function() {
    // --- 1. ИНИЦИАЛИЗАЦИЯ НА КАРТАТА И ОСНОВНИТЕ СЛОЕВЕ ---
    // Настройваме центъра и зуума за глобален преглед
    const map = L.map('map', {
    worldCopyJump: true,
    minZoom: 2,
    zoomControl: true,
    attributionControl: false // ТОВА ПРЕМАХВА НАДПИСИТЕ, КЪДЕТО БЯХА СТРЕЛКИТЕ
}).setView([30.0, 15.0], 3);

    // Слой за маркерите - чистим го и го пълним динамично
    const markersLayer = L.layerGroup().addTo(map);

    // Базова тъмна карта (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CartoDB'
    }).addTo(map);

    // Глобална променлива, в която ще държим данните от JSON за търсачката
    let globalConflictData = [];

    // --- 2. ВОЕННА ЗОНА (УКРАЙНА) - ПОДРЕДЕН МАСИВ ---
    const ukraineFrontline = [
        [51.5, 34.0], [50.1, 38.5], [49.2, 39.8], [48.5, 39.5], 
        [47.1, 38.2], [46.5, 37.0], [45.3, 36.6], [44.4, 34.0], 
        [44.3, 33.5], [45.2, 33.0], [46.3, 32.2], [47.5, 34.5], 
        [48.5, 36.0], [50.0, 34.5], [51.5, 34.0]
    ];

    L.polygon(ukraineFrontline, {
        color: '#ff3333',
        weight: 1,
        fillColor: '#ff0000',
        fillOpacity: 0.15,
        interactive: false // Да не пречи на кликането по маркерите под него
    }).addTo(map);

    // Слой с етикети на държавите (над червената зона)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { 
        opacity: 0.5, 
        pane: 'shadowPane' 
    }).addTo(map);

    // --- 3. СИСТЕМА ЗА ГЕНЕРИРАНЕ НА ТАКТИЧЕСКИ ИКОНИ ---
    function createCustomIcon(symbol, color, shouldPulse = true) {
        return L.divIcon({
            html: `<div style="
                color: ${color}; 
                font-size: 22px; 
                text-shadow: 0 0 10px ${color}, 0 0 5px #000; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                ${shouldPulse ? 'animation: pulse 1.5s infinite;' : ''}">
                ${symbol}
            </div>`,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    // Определяне на иконата според съдържанието на новината
    function getIconForEvent(title, description) {
        const text = (title + " " + (description || "")).toLowerCase();
        
        if (text.includes('missile') || text.includes('strike') || text.includes('drone')) {
            return createCustomIcon('🚀', '#a366ff'); // Лилаво за ракети
        }
        if (text.includes('ship') || text.includes('sea') || text.includes('navy')) {
            return createCustomIcon('🚢', '#3498db'); // Синьо за кораби
        }
        if (text.includes('aid') || text.includes('food') || text.includes('humanitarian')) {
            return createCustomIcon('📦', '#2ecc71'); // Зелено за помощ
        }
        if (text.includes('war') || text.includes('village') || text.includes('clash') || text.includes('lost men')) {
            return createCustomIcon('⚔️', '#ff4d4d'); // Червено за бой
        }
        if (text.includes('warning') || text.includes('alert') || text.includes('threat')) {
            return createCustomIcon('⚠️', '#ffcc00'); // Жълто за напрежение
        }
        return createCustomIcon('●', '#ff4d4d'); // По подразбиране
    }

    // --- 4. ИНТЕЛИГЕНТНА ТЪРСАЧКА С ПОДМЕНЮ (DROPDOWN) ---
    const searchInput = document.querySelector('input[placeholder*="Търсене"]');
    
    // Динамично създаваме контейнера за резултатите под търсачката
    let resultsList = document.getElementById('search-results-list');
    if (!resultsList) {
        resultsList = document.createElement('div');
        resultsList.id = 'search-results-list';
        resultsList.className = 'search-dropdown'; // Сложи си CSS за това
        resultsList.style = "position:absolute; background:rgba(15,15,15,0.95); color:white; width:220px; z-index:2000; border:1px solid #333; max-height:250px; overflow-y:auto; top:40px; left:0; font-family:sans-serif;";
        if (searchInput && searchInput.parentNode) {
            searchInput.parentNode.style.position = 'relative';
            searchInput.parentNode.appendChild(resultsList);
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            resultsList.innerHTML = ''; // Изчистваме старите резултати
            
            if (query.length < 2) {
                resultsList.style.display = 'none';
                return;
            }

            const matches = globalConflictData.filter(item => 
                item.country.toLowerCase().includes(query) || 
                item.title.toLowerCase().includes(query)
            );

            if (matches.length > 0) {
                resultsList.style.display = 'block';
                matches.forEach(match => {
                    const row = document.createElement('div');
                    row.style = "padding:10px; cursor:pointer; border-bottom:1px solid #222; font-size:12px; transition: 0.2s;";
                    row.innerHTML = `<span style="color:#ff4d4d; font-weight:bold;">[${match.country.toUpperCase()}]</span><br>${match.title}`;
                    
                    // Ефект при посочване
                    row.onmouseover = () => row.style.background = "#222";
                    row.onmouseout = () => row.style.background = "transparent";

                    // Клик върху резултат от подменюто
                    row.onclick = () => {
                        map.flyTo([match.lat, match.lon], 8);
                        displayNewsDetails(match);
                        resultsList.style.display = 'none';
                        searchInput.value = match.country;
                    };
                    resultsList.appendChild(row);
                });
            } else {
                resultsList.style.display = 'none';
            }
        });

        // Скриваме менюто, ако кликнем извън него
        document.addEventListener('click', (e) => {
            if (e.target !== searchInput) resultsList.style.display = 'none';
        });
    }

    // Показване на новината в десния панел
    function displayNewsDetails(data) {
        const panel = document.getElementById('news-content');
        if (panel) {
            panel.innerHTML = `
                <div class="news-card animated-fade-in">
                    <div class="tag-row">
                        <span class="country-tag">${data.country}</span>
                        <span class="date-tag">${new Date().toLocaleDateString()}</span>
                    </div>
                    <h3>${data.title}</h3>
                    <p>${data.description || "Няма допълнително описание."}</p>
                    <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
                    <div class="meta-info">Жертви: <strong>${data.fatalities || 0}</strong></div>
                    <a href="${data.link}" target="_blank" class="news-link-btn">ВИЖ ПЪЛНИЯ ДОКЛАД</a>
                </div>`;
        }
    }

    // --- 5. ФУНКЦИЯ ЗА ОПРЕСНЯВАНЕ НА ДАННИТЕ И СТАТИСТИКАТА ---
    function fetchAndSyncData() {
        console.log("Syncing with conflicts.json...");
        
        fetch('conflicts.json?cache_bust=' + Date.now())
            .then(res => res.json())
            .then(data => {
                globalConflictData = data; // Записваме в глобалната променлива за търсачката
                markersLayer.clearLayers();
                
                let totalDeaths = 0;
                let activeCountries = new Set();
                let tickerContent = [];

                data.forEach(item => {
                    // Изчисляване на статистики
                    let deathsCount = parseInt(item.fatalities);
                    if (!isNaN(deathsCount)) totalDeaths += deathsCount;
                    if (item.country) activeCountries.add(item.country);
                    
                    tickerContent.push(`[${item.country.toUpperCase()}]: ${item.title}`);

                    // Създаване на маркер
                    const icon = getIconForEvent(item.title, item.description);
                    const marker = L.marker([item.lat, item.lon], { icon: icon });
                    
                    marker.addTo(markersLayer).on('click', () => {
                        displayNewsDetails(item);
                    });
                });

                // Обновяване на UI статистиката горе
                updateUIElement('active-events', "Active events: " + data.length);
                updateUIElement('total-fatalities', "Total fatalities: " + totalDeaths);
                updateUIElement('countries-affected', "Countries affected: " + activeCountries.size);
                updateUIElement('last-update', new Date().toLocaleTimeString());

                // Обновяване на тикера (Зеления текст)
                const ticker = document.getElementById('news-ticker');
                if (ticker) {
                    ticker.innerText = tickerContent.join('   •   ');
                }
            })
            .catch(err => console.error("Data Fetch Error:", err));
    }

    function updateUIElement(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }

    // Стартираме цикъла
    fetchAndSyncData();
    setInterval(fetchAndSyncData, 60000); // Опресняване на всяка минута
};

// --- 6. UTC ЧАСОВНИК (Винаги работи отделно) ---
setInterval(() => {
    const clock = document.getElementById('utc-clock');
    if (clock) {
        const now = new Date();
        const h = now.getUTCHours().toString().padStart(2, '0');
        const m = now.getUTCMinutes().toString().padStart(2, '0');
        const s = now.getUTCSeconds().toString().padStart(2, '0');
        clock.innerText = `${h}:${m}:${s} UTC`;
    }
}, 1000);
