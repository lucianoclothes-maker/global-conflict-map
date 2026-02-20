window.onload = function() {
    // 1. ИНИЦИАЛИЗИРАНЕ
    var map = L.map('map', { worldCopyJump: true, minZoom: 2 }).setView([35.0, 30.0], 4); 

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        opacity: 0.5, pane: 'shadowPane'
    }).addTo(map);

    // 2. СТИЛИЗИРАНИ ТАКТИЧЕСКИ SVG ИКОНИ (ПРОЗРАЧНИ СЪС СИЯНИЕ)
    // Използваме вграден CSS за филтър "drop-shadow", за да накараме иконите да "светят"
    const createTacticalIcon = (svgContent, color) => {
        return L.divIcon({
            html: `<div style="filter: drop-shadow(0 0 5px ${color}); display: flex; justify-content: center;">${svgContent}</div>`,
            className: '', iconSize: [30, 30], iconAnchor: [15, 15]
        });
    };

    // Дизайни на самите символи (минималистични линии)
    const shipSVG = `<svg viewBox="0 0 24 24" width="32" height="32"><path d="M4 15l-1 3h18l-1-3H4zm1-1l5-10v10H5zm6 0V2h2v12h-2zm3 0V7l5 7h-5z" fill="none" stroke="#5dade2" stroke-width="1.5"/></svg>`;
    const clashSVG = `<svg viewBox="0 0 24 24" width="28" height="28"><path d="M7 5l-2 2 5 5-5 5 2 2 5-5 5 5 2-2-5-5 5-5-2-2-5 5-5-5z" fill="none" stroke="#ff4d4d" stroke-width="2"/></svg>`;
    const alertSVG = `<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 4v4h2v-4h-2zm0 6v2h2v-2h-2z" fill="none" stroke="#f1c40f" stroke-width="1.5"/></svg>`;
    const strikeSVG = `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 2l2 5h5l-4 3 2 6-5-4-5 4 2-6-4-3h5l2-5z" fill="none" stroke="#e67e22" stroke-width="1.5"/></svg>`;

    const iconShip = createTacticalIcon(shipSVG, '#5dade2');
    const iconClash = createTacticalIcon(clashSVG, '#ff4d4d');
    const iconAlert = createTacticalIcon(alertSVG, '#f1c40f');
    const iconStrike = createTacticalIcon(strikeSVG, '#e67e22');

    // 3. ЛОГИКА ЗА ТИПОВЕТЕ (Carrier, Armed clash и т.н.)
    function getTacticalIcon(type) {
        if (type === 'Carrier' || type === 'Warship') return iconShip; // За Иран
        if (type === 'Armed clash') return iconClash;
        if (type === 'Airstrike' || type === 'Explosion') return iconStrike;
        return iconAlert;
    }

    // 4. ГРАНИЦИ (ЗЕЛЕН КОНТУР)
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(res => res.json()).then(data => {
            L.geoJson(data, {
                style: { color: '#00ff00', weight: 1, opacity: 0.2, fillOpacity: 0 },
                onEachFeature: (f, l) => {
                    l.on('mouseover', () => l.setStyle({ opacity: 0.6, weight: 1.5 }));
                    l.on('mouseout', () => l.setStyle({ opacity: 0.2, weight: 1 }));
                }
            }).addTo(map);
        });

    // 5. УКРАЙНА ТАКТИКА
    var fLine = [[46.5, 32.3], [46.8, 33.5], [47.5, 35.3], [48.0, 37.6], [48.6, 38.0], [49.5, 38.0], [50.1, 37.8]];
    L.polyline(fLine, { color: '#ff0000', weight: 3, opacity: 0.6, dashArray: '8, 12' }).addTo(map);

    var oZone = [[46.0, 33.0], [46.8, 34.5], [47.2, 37.8], [48.5, 39.5], [50.0, 38.5], [50.0, 40.0], [44.0, 40.0], [44.0, 33.0]];
    L.polygon(oZone, { color: '#ff0000', fillColor: '#ff0000', fillOpacity: 0.1, weight: 1 }).addTo(map);

    // 6. ЗАРЕЖДАНЕ НА ДАННИ
    fetch('conflicts.json').then(res => res.json()).then(data => {
        let deaths = 0, countries = new Set();
        data.forEach(p => {
            let marker = L.marker([p.lat, p.lon], { icon: getTacticalIcon(p.type) }).addTo(map);
            marker.on('click', () => {
                map.setView([p.lat, p.lon], 6, { animate: true });
                let fHTML = p.fatalities > 0 ? `<p style="color:#ff4d4d; font-size:18px;">💀 Жертви: ${p.fatalities}</p>` : "";
                document.getElementById('news-content').innerHTML = `
                    <div style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
                        <h2 style="color: #ff4d4d; margin: 0; font-weight: 300;">${p.country}</h2>
                        <small style="color: #666; letter-spacing: 1px;">${p.date} | ${p.type.toUpperCase()}</small>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 4px; border-left: 3px solid #ff4d4d;">
                        <p style="color: #ccc; line-height: 1.6; margin: 0;">${p.title}</p>
                    </div>
                    <div style="margin-top: 25px;">
                        ${fHTML}
                        <a href="${p.link}" target="_blank" class="news-btn" style="display:block; text-align:center; text-decoration:none; border: 1px solid #ff4d4d; color: #ff4d4d; padding: 10px; transition: 0.3s;">ДЕТАЙЛИ</a>
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
