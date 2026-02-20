window.onload = function() {
    const alertSound = new Audio('alert.mp3');
    let previousEventCount = 0; 
    let allConflictData = [];
    let markersLayer = L.layerGroup();

    // --- 1. ИНИЦИАЛИЗИРАНЕ НА КАРТАТА ---
    var map = L.map('map', { 
        worldCopyJump: true, 
        minZoom: 2 
    }).setView([48.0, 37.0], 5); 

    markersLayer.addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        opacity: 0.5, pane: 'shadowPane'
    }).addTo(map);

    // --- ВРЪЩАНЕ НА СТАРИТЕ ИКОНИ ---
    const createOldIcon = (symbol, color) => {
        return L.divIcon({
            html: `<div style="color: ${color}; font-size: 20px; text-shadow: 0 0 5px #000; font-weight: bold;">${symbol}</div>`,
            className: '', 
            iconSize: [24, 24], 
            iconAnchor: [12, 12]
        });
    };

     // Дефиниране според твоята легенда
    const iconClash = createOldIcon('✖', '#ff4d4d');     // Червен хикс
    const iconExplosion = createOldIcon('⚠️', '#ffcc00'); // Жълт триъгълник
    const iconNaval = createOldIcon('🚢', '#3498db');     // Син кораб
    const iconMissile = createOldIcon('🚀', '#8e44ad');   // Лилава ракета

    const paths = {
        clash: '<path d="M21 7L17 3L13.5 6.5L14.5 7.5L11 11L9 9L3 15L5 17L9 13L11 15L15.5 10.5L16.5 11.5L21 7Z"/>',
        explosion: '<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>',
        ship: '<path d="M20 18L18 20H6L4 18V17H20V18ZM19 13L17 15H7L5 13V10H19V13ZM12 2L15 8H9L12 2Z"/>',
        missile: '<path d="M13.31 11.05L19.67 4.69L17.55 2.56L11.19 8.92L8.36 8.22L2 14.59L5.54 18.12L2.71 20.95L3.41 21.66L6.24 18.83L9.77 22.36L16.14 16L15.44 13.17L13.31 11.05Z"/>'
    };

    const iconClash = createLiveIcon(paths.clash, '#e74c3c');
    const iconExplosion = createLiveIcon(paths.explosion, '#f39c12');
    const iconNaval = createLiveIcon(paths.ship, '#3498db');
    const iconMissile = createLiveIcon(paths.missile, '#8e44ad');

    function getTacticalIcon(type, title) {
        const t = title.toLowerCase();
        if (t.includes('missile') || t.includes('ракет') || t.includes('drone') || t.includes('дрон') || t.includes('uav')) return iconMissile;
        if (type === 'Naval' || t.includes('ship') || t.includes('кораб')) return iconNaval;
        if (type === 'Explosion' || type === 'Airstrike' || t.includes('strike') || t.includes('удар') || t.includes('взрив')) return iconExplosion;
        return iconClash;
    }

    // --- 3. ВОЕННИ ЗОНИ И ЕТИКЕТИ ---
    var occupiedArea = [[46.1, 32.9], [44.4, 33.5], [44.5, 34.2], [45.4, 36.5], [47.1, 37.6], [48.1, 39.5], [49.6, 40.1], [50.2, 38.5], [46.1, 32.9]];
    L.polygon(occupiedArea, { color: '#ff0000', weight: 1, fillColor: '#ff0000', fillOpacity: 0.2 }).addTo(map);

    const addFrontLabel = (coords, text) => {
        L.marker(coords, { icon: L.divIcon({ className: 'front-text-label', html: text, iconSize: [80, 20] }) }).addTo(map);
    };
    addFrontLabel([48.2, 37.2], "ПОКРОВСК");
    addFrontLabel([49.4, 37.6], "КУПЯНСК");
    addFrontLabel([46.6, 32.6], "ХЕРСОН");

    // --- 4. ЗАРЕЖДАНЕ НА ДАННИ И СТАТИСТИКА ---
    function loadMapData() {
        fetch('conflicts.json?t=' + new Date().getTime())
            .then(res => res.json())
            .then(data => {
                // Логика за звук
                if (previousEventCount !== 0 && data.length > previousEventCount) {
                    const latest = data[0];
                    const criticalKeywords = ['missile', 'rocket', 'explosion', 'ракет', 'удар'];
                    if (criticalKeywords.some(word => latest.title.toLowerCase().includes(word))) {
                        alertSound.play().catch(e => {});
                    }
                }

                previousEventCount = data.length;
                allConflictData = data;
                markersLayer.clearLayers(); 

                // --- ИНИЦИАЛИЗИРАНЕ НА БРОЯЧИТЕ ---
                let countriesSet = new Set();
                let fatalitiesTotal = 0;

                data.forEach(p => {
                    // Добавяне към статистиката
                    if (p.country) countriesSet.add(p.country);
                    if (p.fatalities) fatalitiesTotal += parseInt(p.fatalities) || 0;

                    // Поставяне на маркер
                    let marker = L.marker([p.lat, p.lon], { icon: getTacticalIcon(p.type, p.title) });
                    marker.addTo(markersLayer);
                    
                    marker.on('click', () => {
                        map.setView([p.lat, p.lon], 7);
                        document.getElementById('news-content').innerHTML = `
                            <div class="news-card">
                                <h3>${p.country}</h3>
                                <small>${p.date || ''}</small>
                                <p>${p.title}</p>
                                <a href="${p.link}" target="_blank" class="news-link">ПЪЛЕН ДОКЛАД</a>
                            </div>`;
                    });
                });

                // --- ОБНОВЯВАНЕ НА UI ЕЛЕМЕНТИТЕ ---
                document.getElementById('active-events').innerText = "Активни събития: " + data.length;
                document.getElementById('total-fatalities').innerText = "Total fatalities: " + fatalitiesTotal;
                document.getElementById('countries-affected').innerText = "Countries affected: " + countriesSet.size;
                document.getElementById('last-update').innerText = "Last update: " + new Date().toLocaleTimeString();
                document.getElementById('news-ticker').innerText = data.slice(0, 5).map(p => `[${p.country.toUpperCase()}: ${p.title}]`).join(' +++ ');
            })
            .catch(err => console.error("Грешка при зареждане:", err));
    }

    loadMapData();
    setInterval(loadMapData, 60000);

    // --- 5. ТЪРСЕНЕ ---
    const searchInput = document.getElementById('map-search');
    const resultsDiv = document.getElementById('search-results');
    if (searchInput && resultsDiv) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            resultsDiv.innerHTML = '';
            if (term.length < 2) { resultsDiv.style.display = 'none'; return; }
            const matches = allConflictData.filter(p => p.country.toLowerCase().includes(term) || p.title.toLowerCase().includes(term));
            if (matches.length > 0) {
                resultsDiv.style.display = 'block';
                matches.forEach(match => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    div.innerText = match.title;
                    div.onclick = () => { map.flyTo([match.lat, match.lon], 8); resultsDiv.style.display = 'none'; };
                    resultsDiv.appendChild(div);
                });
            }
        });
    }
};

// Часовник
setInterval(() => {
    const clockEl = document.getElementById('utc-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.getUTCHours().toString().padStart(2, '0') + ":" + 
                          now.getUTCMinutes().toString().padStart(2, '0') + ":" + 
                          now.getUTCSeconds().toString().padStart(2, '0') + " UTC";
    }
}, 1000);
