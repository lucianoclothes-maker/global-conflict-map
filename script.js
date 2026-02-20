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

    const iconExplosion = createNeonIcon(explosionPath, '#e67e22');
    const iconClash = createNeonIcon(clashPath, '#ff4d4d');
    const iconShip = createNeonIcon(shipPath, '#5dade2');
    const iconAlert = createNeonIcon(alertPath, '#f1c40f');

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
                
                let twitterHTML = "";
                if (p.twitter_link) {
                    twitterHTML = `<div style="margin-top: 15px; max-height: 400px; overflow-y: auto; border-radius: 8px;">
                        <blockquote class="twitter-tweet" data-theme="dark"><a href="${p.twitter_link}"></a></blockquote>
                    </div>`;
                }

                document.getElementById('news-content').innerHTML = `
                    <div style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
                        <h2 style="color: #ff4d4d; margin: 0; font-weight: 300;">${p.country}</h2>
                        <small style="color: #666; letter-spacing: 1px; text-transform: uppercase;">${p.date} | ${p.type}</small>
                    </div>
                    <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 4px; border-left: 3px solid #ff4d4d;">
                        <p style="color: #ccc; line-height: 1.6; margin: 0;">${p.title}</p>
                    </div>
                    ${twitterHTML}
                    <div style="margin-top: 25px;">
                        ${deathsHTML}
                        <a href="${p.link}" target="_blank" class="news-btn" style="display:block; text-align:center; text-decoration:none; border: 1px solid #ff4d4d; color: #ff4d4d; padding: 12px;">ДЕТАЙЛИ</a>
                    </div>`;

                if (window.twttr) { window.twttr.widgets.load(); }
            });
            deaths += (parseInt(p.fatalities) || 0);
            countries.add(p.country);
        });
fetch('conflicts.json')
    .then(response => response.json())
    .then(data => {
        allConflictData = data; // <--- ДОБАВИ ТОЗИ РЕД ТУК
        // ... останалият ти код за активни събития, новини и т.н.
        document.getElementById('active-events').innerText = "Active events: " + data.length;
        document.getElementById('total-fatalities').innerText = "Total fatalities: " + deaths;
        document.getElementById('countries-affected').innerText = "Countries affected: " + countries.size;
        document.getElementById('news-ticker').innerText = data.map(p => `[${p.country.toUpperCase()}: ${p.title}]`).join(' +++ ');
        document.getElementById('last-update').innerText = "Last update: " + new Date().toLocaleDateString();
    }); 
                                                         // 1. ПРИНУДИТЕЛНО ПУСКАНЕ НА КАРТАТА (Фикс за черния екран)
    setTimeout(() => { 
        if (typeof map !== 'undefined') {
            map.invalidateSize(); 
        }
    }, 800);

    // 2. ЛОГИКА НА ТЪРСАЧКАТА
    const searchInput = document.getElementById('map-search');
    const resultsDiv = document.getElementById('search-results');

    if (searchInput && resultsDiv) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            resultsDiv.innerHTML = '';
            
            if (term.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }

            // Търсим в allConflictData, който напълнихме на ред 101
            const matches = allConflictData.filter(p => 
                p.country.toLowerCase().includes(term) || 
                p.title.toLowerCase().includes(term)
            );

            if (matches.length > 0) {
                resultsDiv.style.display = 'block';
                matches.forEach(match => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    div.innerText = `${match.country}: ${match.title}`;
                    div.onclick = () => {
                        map.flyTo([match.lat, match.lng], 8);
                        searchInput.value = match.country;
                        resultsDiv.style.display = 'none';
                    };
                    resultsDiv.appendChild(div);
                });
            } else {
                resultsDiv.style.display = 'none';
        }
    });
}
};
// 3. ЧАСОВНИК (Извън onload, за да е независим)
setInterval(() => {
    const clockEl = document.getElementById('utc-clock');
    if (clockEl) {
        const now = new Date();
        const timeStr = now.getUTCHours().toString().padStart(2, '0') + ":" +
                      now.getUTCMinutes().toString().padStart(2, '0') + ":" +
                      now.getUTCSeconds().toString().padStart(2, '0') + " UTC";
        clockEl.innerText = timeStr;
    }
}, 1000);
