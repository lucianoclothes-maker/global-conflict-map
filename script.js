/**
 * GLOBAL CONFLICT DASHBOARD v4.0 - FINAL PRODUCTION CODE
 * Всичко е поправено: Карта, САЩ, Интерактивни статуси и Статистика.
 */

window.onload = function() {
    // --- 1. ИНИЦИАЛИЗАЦИЯ НА КАРТАТА ---
    const map = L.map('map', {
        worldCopyJump: true,
        minZoom: 2,
        zoomControl: true,
        attributionControl: false 
    }).setView([30.0, 15.0], 3);

    const markersLayer = L.layerGroup().addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CartoDB'
    }).addTo(map);

    // --- 2. ТАКТИЧЕСКО ОЦВЕТЯВАНЕ И ИНТЕРАКТИВНОСТ ---
    const warZones = ['Russia', 'Ukraine', 'Israel', 'Palestine', 'Sudan', 'Syria', 'Yemen'];
    const tensionZones = ['United States', 'United States of America', 'USA', 'Iran', 'North Korea', 'South Korea', 'China', 'Taiwan'];

    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(res => res.json())
        .then(geoData => {
            L.geoJson(geoData, {
                style: function(feature) {
                    const name = feature.properties.name;
                    if (warZones.includes(name)) {
                        return { fillColor: "#ff0000", weight: 1, opacity: 1, color: '#ff3333', fillOpacity: 0.25 };
                    }
                    if (tensionZones.includes(name)) {
                        return { fillColor: "#ff8c00", weight: 1, opacity: 1, color: '#ff8c00', fillOpacity: 0.15 };
                    }
                    return { fillColor: "#000", weight: 0.5, color: "#222", fillOpacity: 0.1 };
                },
                onEachFeature: function(feature, layer) {
                    const name = feature.properties.name;
                    let statusText = "STATUS: <span style='color:#888;'>NO ACTIVITIES</span>";
                    
                    if (warZones.includes(name)) {
                        statusText = "STATUS: <span style='color:#ff4d4d; font-weight:bold;'>HIGH DANGER (IN WAR)</span>";
                    } else if (tensionZones.includes(name)) {
                        statusText = "STATUS: <span style='color:#ff8c00; font-weight:bold;'>ELEVATED TENSION (MEDIUM)</span>";
                    }

                    layer.bindTooltip(`
                        <div style="background:rgba(0,0,0,0.95); color:#fff; border:1px solid #39FF14; padding:5px; font-family:monospace; font-size:11px;">
                            <strong style="color:#39FF14;">${name.toUpperCase()}</strong><br>
                            ${statusText}
                        </div>`, 
                        { sticky: true, opacity: 0.9, direction: 'top' }
                    );

                    layer.on('mouseover', function() {
                        this.setStyle({ fillOpacity: 0.4, weight: 2, color: '#39FF14' });
                    });
                    layer.on('mouseout', function() {
                        const isWar = warZones.includes(name);
                        const isTension = tensionZones.includes(name);
                        this.setStyle({ 
                            fillOpacity: isWar ? 0.25 : (isTension ? 0.15 : 0.1), 
                            weight: 1,
                            color: isWar ? '#ff3333' : (isTension ? '#ff8c00' : '#222')
                        });
                    });
                }
            }).addTo(map);
        });

    let globalConflictData = [];

    // --- 3. ВОЕННА ЗОНА (УКРАЙНА - ФРОНТОВА ЛИНИЯ) ---
    const ukraineFrontline = [
        [51.5, 34.0], [50.1, 38.5], [49.2, 39.8], [48.5, 39.5], 
        [47.1, 38.2], [46.5, 37.0], [45.3, 36.6], [44.4, 34.0], 
        [44.3, 33.5], [45.2, 33.0], [46.3, 32.2], [47.5, 34.5], 
        [48.5, 36.0], [50.0, 34.5], [51.5, 34.0]
    ];

    L.polygon(ukraineFrontline, {
        color: '#ff3333', weight: 2, fillColor: '#ff0000', fillOpacity: 0.3, interactive: false
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { 
        opacity: 0.6, pane: 'shadowPane' 
    }).addTo(map);

    // --- 4. СИСТЕМА ЗА ИКОНИ ---
    function createCustomIcon(symbol, color, shouldPulse = true) {
        return L.divIcon({
            html:
