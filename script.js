window.onload = function() {
    let markersLayer = L.layerGroup();

    // 1. КАРТА (Центрирана над Украйна/Близкия Изток)
    var map = L.map('map', { worldCopyJump: true, minZoom: 2 }).setView([48.0, 37.0], 4);
    markersLayer.addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png').addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { opacity: 0.5, pane: 'shadowPane' }).addTo(map);

    // 2. СТИЛ НА ИКОНИТЕ
    const createNeonIcon = (symbol, color) => L.divIcon({
        html: `<div style="color: ${color}; font-size: 22px; text-shadow: 0 0 10px ${color}, 0 0 15px ${color}; font-weight: bold; display: flex; align-items: center; justify-content: center;">${symbol}</div>`,
        className: '', iconSize: [30, 30], iconAnchor: [15, 15]
    });

    const icons = {
        clash: createNeonIcon('✖', '#ff4d4d'),
        warning: createNeonIcon('⚠️', '#ffcc00'),
        ship: createNeonIcon('🚢', '#3498db'),
        missile: createNeonIcon('🚀', '#8e44ad')
    };

    function getTacticalIcon(title) {
        const t = title.toLowerCase();
        if (t.includes('military') || t.includes('missile') || t.includes('drone')) return icons.missile;
        if (t.includes('iran') || t.includes('ship') || t.includes('sea') || t.includes('naval')) return icons.ship;
        if (t.includes('war') || t.includes('killings') || t.includes('genocide')) return icons.warning;
        return icons.clash;
    }

    // 3. ЗАРЕЖДАНЕ НА ДАННИ (ГЛАВНА ФУНКЦИЯ)
    function loadMapData() {
        fetch('conflicts.json?t=' + new Date().getTime())
            .then(res => res.json())
            .then(data => {
                markersLayer.clearLayers();
                let countries = new Set(), totalDeaths = 0;

                // --- ФИКС ЗА ЗЕЛЕНИЯ ТЕКСТ (ГОРЕ) ---
                const tickerEl = document.getElementById('news-ticker');
                if (tickerEl) {
                    tickerEl.innerText = data.map(p => `[${p.country.toUpperCase()}]: ${p.title}`).join('  •  ');
                }

                data.forEach(p => {
                    if (p.fatalities) totalDeaths += parseInt(p.fatalities);
                    countries.add(p.country);

                    L.marker([p.lat, p.lon], { icon: getTacticalIcon(p.title) })
                        .addTo(markersLayer)
                        .on('click', () => {
                            document.getElementById('news-content').innerHTML = `
                                <div class="news-card">
                                    <h3>${p.country}</h3>
                                    <p>${p.title}</p>
                                    <a href="${p.link}" target="_blank" class="news-link">ПЪЛЕН ДОКЛАД</a>
                                </div>`;
                        });
                });

                // ОБНОВЯВАНЕ НА СТАТИСТИКАТА В HEADER-А
                document.getElementById('active-events').innerText = "Active events: " + data.length;
                document.getElementById('total-fatalities').innerText = "Total fatalities: " + totalDeaths;
                document.getElementById('countries-affected').innerText = "Countries affected: " + countries.size;
                document.getElementById('last-update').innerText = "Last update: " + new Date().toLocaleTimeString();
            })
            .catch(err => console.error("Грешка при зареждане на JSON:", err));
    }

    loadMapData();
    setInterval(loadMapData, 60000);
};

// 4. UTC ЧАСОВНИК (СИНХРОНИЗИРАН С id="utc-clock")
setInterval(() => {
    const clockEl = document.getElementById('utc-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.getUTCHours().toString().padStart(2, '0') + ":" + 
                          now.getUTCMinutes().toString().padStart(2, '0') + ":" + 
                          now.getUTCSeconds().toString().padStart(2, '0') + " UTC";
    }
}, 1000);
