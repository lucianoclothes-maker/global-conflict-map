window.onload = function() {
    // --- 1. ИНИЦИАЛИЗИРАНЕ НА ЗВУК И ПРОМЕНЛИВИ ---
    const alertSound = new Audio('alert.mp3');
    let previousEventCount = 0; 
    let allConflictData = [];
    let markersLayer = L.layerGroup();

    // --- 2. ИНИЦИАЛИЗИРАНЕ НА КАРТАТА ---
    var map = L.map('map', { 
        worldCopyJump: true, 
        minZoom: 2 
    }).setView([35.0, 30.0], 4); 

    markersLayer.addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        opacity: 0.4, pane: 'shadowPane'
    }).addTo(map);

    // --- 3. ДЕФИНИРАНЕ НА НЕОНОВИТЕ SVG ИКОНИ ---
    const createNeonIcon = (svgPath, color) => {
        return L.divIcon({
            html: `<div style="filter: drop-shadow(0 0 6px ${color}); display: flex; justify-content: center;">
                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="${color}" stroke-width="2">
                        ${svgPath}
                    </svg>
                   </div>`,
            className: '', iconSize: [30, 30], iconAnchor: [15, 15]
        });
    };

    const explosionPath = '<path d="M7 2l2 4 5-2-1 5 6 2-5 3 3 6-6-2-4 5V15l-5 2 3-5-4-4 5-1z"/>'; 
    const clashPath = '<path d="M7 5l-2 2 5 5-5 5 2 2 5-5 5 5 2-2-5-5 5-5-2-2-5 5-5-5z"/>';
    const shipPath = '<path d="M2 17l2-2h16l2 2H2zM5 15V8l5-3v10M11 15V3h2v12M14 15V7l5 8"/>';
    const alertPath = '<path d="M12 2L1 21h22L12 2zm0 7v5m0 4h.01"/>';
    const dronePath = '<path d="M21 16l-2-3h-5l-1-4h3V7h-3V4h-2v3h-3v2h3l1 4H7l-2 3v2h16v-2z"/>';
    const airstrikePath = '<path d="M13 2v9h9L13 2zM11 22v-9H2l9 9z"/>';
    const nuclearPath = '<circle cx="12" cy="12" r="2"/><path d="M12 7V2m7.8 4.2l-3.5 3.5m4.7 6.3h-5m-3.5 6.5l-3.5-3.5M2 12h5m4.2-7.8l3.5 3.5"/>';
    const cyberPath = '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>';

    const iconExplosion = createNeonIcon(explosionPath, '#e67e22'); 
    const iconClash = createNeonIcon(clashPath, '#ff4d4d');      
    const iconShip = createNeonIcon(shipPath, '#5dade2');      
    const iconAlert = createNeonIcon(alertPath, '#f1c40f');      
    const iconDrone = createNeonIcon(dronePath, '#a569bd');      
    const iconAirstrike = createNeonIcon(airstrikePath, '#ec7063'); 
    const iconNuclear = createNeonIcon(nuclearPath, '#39FF14'); 
    const iconCyber = createNeonIcon(cyberPath, '#00FFFF');

    function getTacticalIcon(type) {
        if (type === 'Naval') return iconShip;
        if (type === 'Clashes') return iconClash;
        if (type === 'Airstrike') return iconAirstrike;
        if (type === 'Explosion') return iconExplosion;
        if (type === 'Drone') return iconDrone;
        if (type === 'Nuclear') return iconNuclear;
        if (type === 'Cyber') return iconCyber;
        return iconAlert; 
    }

    // --- 4. ЗАРЕЖДАНЕ НА ГРАНИЦИ ---
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(res => res.json()).then(data => {
            L.geoJson(data, {
                style: { color: '#00ff00', weight: 1, opacity: 0.15, fillOpacity: 0 },
                onEachFeature: (f, l) => {
                    l.on('mouseover', () => l.setStyle({ opacity: 0.6, weight: 1.5 }));
                    l.on('mouseout', () => l.setStyle({ opacity: 0.15, weight: 1 }));
                }
            }).addTo(map);
        });

    // Декоративни линии и зони (Украйна пример)
    var fLine = [[46.5, 32.3], [48.0, 37.6], [50.1, 37.8]];
    L.polyline(fLine, { color: '#ff0000', weight: 3, opacity: 0.5, dashArray: '10, 15' }).addTo(map);

    var oZone = [[46.0, 33.0], [47.2, 37.8], [50.0, 38.5], [44.0, 40.0], [44.0, 33.0]];
    L.polygon(oZone, { color: '#ff4d4d', fillColor: '#ff0000', fillOpacity: 0.08, weight: 1 }).addTo(map);

    // --- 5. ОСНОВНА ФУНКЦИЯ ЗА ДАННИТЕ ---
    function loadMapData() {
        fetch('conflicts.json?t=' + new Date().getTime())
            .then(res => res.json())
            .then(data => {
                // ПРОВЕРКА ЗА ЗВУК: Изпълнява се само при увеличение на събитията
                if (previousEventCount !== 0 && data.length > previousEventCount) {
                    alertSound.play().catch(e => console.log("Sound autoplay blocked. Wait for user interaction."));
                }
                previousEventCount = data.length;

                allConflictData = data;
                markersLayer.clearLayers(); 
                
                let countries = new Set();
                let totalDeaths = 0;

                data.forEach(p => {
                    if (p.fatalities) {
                        totalDeaths += parseInt(p.fatalities);
                    }

                    let marker = L.marker([p.lat, p.lon], { icon: getTacticalIcon(p.type) });
                    marker.addTo(markersLayer);
                    
                    marker.on('click', () => {
                        map.setView([p.lat, p.lon], 6, { animate: true });
                        let twitterHTML = p.twitter_link ? `<div style="margin-top: 15px; max-height: 400px; overflow-y: auto;"><blockquote class="twitter-tweet" data-theme="dark"><a href="${p.twitter_link}"></a></blockquote></div>` : "";

                        document.getElementById('news-content').innerHTML = `
                            <div style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
                                <h2 style="color: #ff4d4d; margin: 0;">${p.country}</h2>
                                <small>${p.date} | ${p.type}</small>
                            </div>
                            <p style="color: #ccc;">${p.title}</p>
                            ${twitterHTML}
                            <a href="${p.link}" target="_blank" class="news-btn" style="display:block; text-align:center; text-decoration:none; border: 1px solid #ff4d4d; color: #ff4d4d; padding: 10px; margin-top:10px;">ДЕТАЙЛИ</a>`;
                        if (window.twttr) { window.twttr.widgets.load(); }
                    });

                    countries.add(p.country);
                });

                // Обновяване на UI
                document.getElementById('active-events').innerText = "Active events: " + data.length;
                document.getElementById('total-fatalities').innerText = "Total fatalities: " + totalDeaths;
                document.getElementById('countries-affected').innerText = "Countries affected: " + countries.size;
                document.getElementById('last-update').innerText = "Last update: " + new Date().toLocaleTimeString();
                document.getElementById('news-ticker').innerText = data.map(p => `[${p.country.toUpperCase()}: ${p.title}]`).join(' +++ ');
            });
    }

    // Стартиране и интервал за опресняване
    loadMapData();
    setInterval(loadMapData, 60000);

    // --- 6. ТЪРСЕНЕ ---
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
                    div.innerText = `${match.country}: ${match.title}`;
                    div.onclick = () => { map.flyTo([match.lat, match.lon], 8); resultsDiv.style.display = 'none'; };
                    resultsDiv.appendChild(div);
                });
            }
        });
    }
};

// --- 7. UTC ЧАСОВНИК ---
setInterval(() => {
    const clockEl = document.getElementById('utc-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.getUTCHours().toString().padStart(2, '0') + ":" + 
                          now.getUTCMinutes().toString().padStart(2, '0') + ":" + 
                          now.getUTCSeconds().toString().padStart(2, '0') + " UTC";
    }
}, 1000);
