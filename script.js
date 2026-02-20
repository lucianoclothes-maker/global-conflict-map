window.onload = function() {
    // --- 1. ИНИЦИАЛИЗИРАНЕ НА КАРТАТА ---
    var map = L.map('map', { 
        worldCopyJump: true, 
        minZoom: 2 
    }).setView([35.0, 30.0], 4); 

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        opacity: 0.4, pane: 'shadowPane'
    }).addTo(map);

    // --- 2. ДЕФИНИРАНЕ НА НЕОНОВИТЕ SVG ИКОНИ ---
    // Функция за създаване на светеща икона
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

    // Специфични SVG пътища (Shapes)
    // Новата икона за ЕКСПЛОЗИЯ (назъбена форма)
    const explosionPath = '<path d="M7 2l2 4 5-2-1 5 6 2-5 3 3 6-6-2-4 5V15l-5 2 3-5-4-4 5-1z"/>'; 
    const clashPath = '<path d="M7 5l-2 2 5 5-5 5 2 2 5-5 5 5 2-2-5-5 5-5-2-2-5 5-5-5z"/>';
    const shipPath = '<path d="M2 17l2-2h16l2 2H2zM5 15V8l5-3v10M11 15V3h2v12M14 15V7l5 8"/>';
    const alertPath = '<path d="M12 2L1 21h22L12 2zm0 7v5m0 4h.01"/>';

    // Финални икони
    const iconExplosion = createNeonIcon(explosionPath, '#e67e22'); // Оранжево
    const iconClash = createNeonIcon(clashPath, '#ff4d4d');         // Червено
    const iconShip = createNeonIcon(shipPath, '#5dade2');          // Синьо
    const iconAlert = createNeonIcon(alertPath, '#f1c40f');        // Жълто

    // --- 3. ЛОГИКА ЗА ИЗБОР НА ИКОНА ---
    function getTacticalIcon(type) {
        if (type === 'Carrier' || type === 'Warship') return iconShip;
        if (type === 'Armed clash') return iconClash;
        if (type === 'Airstrike' || type === 'Explosion') return iconExplosion;
        return iconAlert;
    }

    // --- 4. ГЕОПОЛИТИЧЕСКИ ГРАНИЦИ (ЗЕЛЕН КОНТУР) ---
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

    // --- 5. ТАКТИЧЕСКИ ЗОНИ (УКРАЙНА) ---
    var fLine = [[46.5, 32.3], [48.0, 37.6], [50.1, 37.8]];
    L.polyline(fLine, { color: '#ff0000', weight: 3, opacity: 0.5, dashArray: '10, 15' }).addTo(map);

    var oZone = [[46.0, 33.0], [47.2, 37.8], [50.0, 38.5], [44.0, 40.0], [44.0, 33.0]];
    L.polygon(oZone, { color: '#ff4d4d', fillColor: '#ff0000', fillOpacity: 0.08, weight: 1 }).addTo(map);

    // --- 6. ЗАРЕЖДАНЕ НА ДАННИ (conflicts.json) ---
    fetch('conflicts.json').then(res => res.json()).then(data => {
        let deaths = 0, countries = new Set();
        data.forEach(p => {
            let marker = L.marker([p.lat, p.lon], { icon: getTacticalIcon(p.type) }).addTo(map);
            
            marker.on('click', () => {
                map.setView([p.lat, p.lon], 6, { animate: true });
                let deathsHTML = p.fatalities > 0 ? `<p style="color:#ff4d4d; font-size:18px;">💀 Жертви: ${p.fatalities}</p>` : "";
                
                document.getElementById('news-content').innerHTML = `
                    <div style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
                        <h2 style="color: #ff4d4d; margin: 0; font-weight: 300;">${p.country}</h2>
                        <small style="color: #666; letter-spacing: 1px; text-transform: uppercase;">${p.date} | ${p.type}</small>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 4px; border-left: 3px solid #ff4d4d;">
                        <p style="color: #ccc; line-height: 1.6; margin: 0;">${p.title}</p>
                    </div>
                    <div style="margin-top: 25px;">
                        ${deathsHTML}
                        <a href="${p.link}" target="_blank" class="news-btn" style="display:block; text-align:center; text-decoration:none; border: 1px solid #ff4d4d; color: #ff4d4d; padding: 12px;">ДЕТАЙЛИ</a>
                    </div>`;
            });
            deaths += (parseInt(p.fatalities) || 0);
            countries.add(p.country);
        });

        document.getElementById('active-events').innerText = "Active events: " + data.length;
        document.getElementById('total-fatalities').innerText = "Total fatalities: " + deaths;
        document.getElementById('countries-affected').innerText = "Countries affected: " + countries.size;
        document.getElementById('last-update').innerText = "Last update: " + new Date().toLocaleDateString();
    });

    setTimeout(() => map.invalidateSize(), 600);
};
