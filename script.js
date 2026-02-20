window.onload = function() {
    // 1. СЪЗДАВАМЕ СЛОЕВЕТЕ В ПРАВИЛЕН РЕД
    var map = L.map('map', { worldCopyJump: true, minZoom: 2 }).setView([48.0, 37.0], 5);
    let markersLayer = L.layerGroup(); // Слоевете с икони

    // Базова тъмна карта
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png').addTo(map);

    // 2. ЧЕРВЕНА ЗОНА (ПОДРЕДЕНА БЕЗ ZIG-ZAG)
    var zonePoints = [
        [50.5, 35.5], [49.5, 39.5], [47.1, 39.1], // Граница с Русия
        [47.0, 37.5], [46.8, 36.8], [45.3, 36.6], // Азовско море / Керч
        [44.4, 33.5], [45.3, 32.5], [46.5, 32.3], // Крим / Херсон
        [47.2, 35.1], [48.0, 37.8], [48.6, 38.0], // Запорожие / Бахмут
        [50.5, 35.5] // Затваряне на кръга
    ];

    L.polygon(zonePoints, {
        color: '#ff3333',
        weight: 2,
        fillColor: '#ff0000',
        fillOpacity: 0.2, // По-прозрачно, за да се виждат иконите
        dashArray: '5, 10'
    }).addTo(map);

    // Етикетите на картата (над червената зона)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { opacity: 0.6, pane: 'shadowPane' }).addTo(map);

    // ИКОНИТЕ НАЙ-ОТГОРЕ
    markersLayer.addTo(map);

    // СТИЛОВЕ ЗА ИКОНИТЕ
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
        if (t.includes('missile') || t.includes('drone') || t.includes('strike')) return icons.missile;
        if (t.includes('ship') || t.includes('sea') || t.includes('navy')) return icons.ship;
        if (t.includes('war') || t.includes('alert')) return icons.warning;
        return icons.clash;
    }

    // 3. ЗАРЕЖДАНЕ НА ДАННИТЕ
    function loadMapData() {
        fetch('conflicts.json?t=' + new Date().getTime())
            .then(res => res.json())
            .then(data => {
                markersLayer.clearLayers();
                const tickerEl = document.getElementById('news-ticker');
                if (tickerEl) tickerEl.innerText = data.map(p => `[${p.country.toUpperCase()}]: ${p.title}`).join('  •  ');

                data.forEach(p => {
                    L.marker([p.lat, p.lon], { icon: getTacticalIcon(p.title) })
                        .addTo(markersLayer)
                        .on('click', () => {
                            document.getElementById('news-content').innerHTML = `
                                <div class="news-card"><h3>${p.country}</h3><p>${p.title}</p>
                                <a href="${p.link}" target="_blank" class="news-link">ПЪЛЕН ДОКЛАД</a></div>`;
                        });
                });
            }).catch(err => console.error("Грешка при conflicts.json:", err));
    }

    loadMapData();
    setInterval(loadMapData, 60000);
};

// ЧАСОВНИК
setInterval(() => {
    const clockEl = document.getElementById('utc-clock');
    if (clockEl) clockEl.innerText = new Date().toUTCString().split(' ')[4] + " UTC";
}, 1000);
