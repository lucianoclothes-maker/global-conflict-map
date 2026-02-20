window.onload = function() {
    let markersLayer = L.layerGroup();
    var map = L.map('map', { worldCopyJump: true, minZoom: 2 }).setView([48.0, 37.0], 5);
    markersLayer.addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png').addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { opacity: 0.5, pane: 'shadowPane' }).addTo(map);

    // ПОДРЕДЕНИ КООРДИНАТИ ЗА ПЛАВНА ЛИНИЯ
    var frontlinePoints = [
        [51.0, 35.0], [50.5, 35.5], [50.0, 36.5], [49.5, 37.5], // Север
        [49.0, 38.5], [48.5, 38.0], [48.0, 37.5], [47.5, 37.5], // Донбас
        [47.0, 37.5], [46.5, 36.5], [46.3, 35.0], [46.5, 33.5], // Юг / Бряг
        [46.0, 32.5], [45.0, 33.0], [44.4, 33.5], [44.5, 34.5], // Крим
        [45.3, 36.5], [46.8, 37.5], [47.2, 38.5], [51.0, 35.0]  // Затваряне
    ];

    L.polygon(frontlinePoints, {
        color: '#ff3333',
        weight: 2,
        fillColor: '#ff0000',
        fillOpacity: 0.15,
        dashArray: '4, 4' // Пунктир за по-професионален вид
    }).addTo(map);

    // ВСИЧКИ ИКОНИ ОСТАВАТ ТУК
    const createNeonIcon = (symbol, color, isPulsing = false) => L.divIcon({
        html: `<div style="color: ${color}; font-size: 22px; text-shadow: 0 0 10px ${color}; font-weight: bold; display: flex; align-items: center; justify-content: center; ${isPulsing ? 'animation: pulse 1.5s infinite;' : ''}">${symbol}</div>`,
        className: '', iconSize: [30, 30], iconAnchor: [15, 15]
    });

    const icons = {
        clash: createNeonIcon('●', '#ff4d4d', true),
        warning: createNeonIcon('⚠️', '#ffcc00'),
        ship: createNeonIcon('🚢', '#3498db'),
        missile: createNeonIcon('🚀', '#8e44ad')
    };

    function getTacticalIcon(title) {
        const t = title.toLowerCase();
        if (t.includes('missile') || t.includes('drone')) return icons.missile;
        if (t.includes('ship') || t.includes('sea')) return icons.ship;
        return icons.clash;
    }

    function loadMapData() {
        fetch('conflicts.json?t=' + new Date().getTime())
            .then(res => res.json())
            .then(data => {
                markersLayer.clearLayers();
                const tickerEl = document.getElementById('news-ticker');
                if (tickerEl) tickerEl.innerText = data.map(p => `[${p.country.toUpperCase()}]: ${p.title}`).join('  •  ');
                data.forEach(p => {
                    L.marker([p.lat, p.lon], { icon: getTacticalIcon(p.title) }).addTo(markersLayer).on('click', () => {
                        document.getElementById('news-content').innerHTML = `
                            <div class="news-card"><h3>${p.country}</h3><p>${p.title}</p>
                            <a href="${p.link}" target="_blank" class="news-link">ПЪЛЕН ДОКЛАД</a></div>`;
                    });
                });
            });
    }
    loadMapData();
    setInterval(loadMapData, 60000);
};

setInterval(() => {
    const clockEl = document.getElementById('utc-clock');
    if (clockEl) clockEl.innerText = new Date().toUTCString().split(' ')[4] + " UTC";
}, 1000);
