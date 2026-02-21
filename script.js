/**
 * =============================================================================
 * GLOBAL CONFLICT DASHBOARD v21.0 - FULL SYSTEM RESTORATION
 * =============================================================================
 * ПОТРЕБИТЕЛ: BORISLAV | РЕДАКЦИЯ: МАЩАБЕН ОДИТ И ВЪЗСТАНОВЯВАНЕ
 * ЦЕЛ: 200-250 РЕДА КОД (БЕЗ СЪКРАЩЕНИЯ)
 * -----------------------------------------------------------------------------
 * ФУНКЦИОНАЛНОСТ:
 * 1. Пълна поддръжка на Tooltips (Имена на държави при Hover)
 * 2. Всички тактически военни активи (Бази, Пристанища, Летища)
 * 3. Пулсираща анимация (Мащабиране без въртене)
 * 4. Огромен тактически прозорец (800px ширина)
 * 5. Аудио интеграция за alert.mp3
 * =============================================================================
 */

window.onload = function() {
    
    // Глобална памет за засичане на нови събития
    let currentLastEventId = ""; 

    // --- СЕКЦИЯ 1: ИНИЦИАЛИЗАЦИЯ НА ГЕО-ИНТЕРФЕЙСА ---
    // Настройваме картата с плавни движения и тактически зуум
    const map = L.map('map', {
        worldCopyJump: true,    // Позволява преминаване през датата (пасифик)
        zoomControl: true,      // Стандартни бутони за контрол
        attributionControl: false, // Изчистване на ненужни лога
        zoomSnap: 0.1,          // Прецизно позициониране
        wheelDebounceTime: 40   // Бърза реакция при скрол
    }).setView([34.0, 42.0], 4.5); 

    // Дефинираме слоевете за обекти (Маркери и Военни активи)
    const markersLayer = L.layerGroup().addTo(map);   
    const militaryLayer = L.layerGroup().addTo(map);  

    // Използваме Dark Matter основа за визия тип "War Room"
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 18, 
        minZoom: 2, 
        crossOrigin: true
    }).addTo(map);

    // --- СЕКЦИЯ 2: ГЕОПОЛИТИЧЕСКИ ЗОНИ И ИНТЕРАКТИВНОСТ (HOVER) ---
    const warZones = ['Russia', 'Ukraine', 'Israel', 'Palestine', 'Sudan', 'Syria', 'Yemen', 'Iraq'];
    const blueZone = ['France', 'Germany', 'United Kingdom', 'Italy', 'Poland', 'Bulgaria', 'Romania', 'Greece'];
    const tensionAreas = ['Iran', 'North Korea', 'China', 'Taiwan', 'Venezuela', 'USA', 'Turkey', 'Saudi Arabia'];

    // Зареждане на границите и добавяне на имената на държавите
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(res => res.json())
        .then(geoData => {
            L.geoJson(geoData, {
                style: function(f) {
                    const countryName = f.properties.name;
                    // Цветово кодиране на регионите
                    if (warZones.includes(countryName)) return { fillColor: "#ff0000", weight: 2.5, color: '#ff3333', fillOpacity: 0.35 };
                    if (blueZone.includes(countryName)) return { fillColor: "#0055ff", weight: 2.0, color: '#00a2ff', fillOpacity: 0.25 };
                    if (tensionAreas.includes(countryName)) return { fillColor: "#ff8c00", weight: 2.0, color: '#ff8c00', fillOpacity: 0.25 };
                    return { fillColor: "#111", weight: 0.8, color: "#333", fillOpacity: 0.1 };
                },
                // ДОБАВЯНЕ НА ИМЕНАТА НА ДЪРЖАВИТЕ (TOOLTIPS)
                onEachFeature: function(feature, layer) {
                    if (feature.properties && feature.properties.name) {
                        layer.bindTooltip(feature.properties.name, {
                            sticky: true,
                            className: 'tactical-country-tooltip'
                        });
                        // Визуална реакция при посочване с мишката
                        layer.on('mouseover', function() {
                            this.setStyle({ fillOpacity: 0.5, weight: 3 });
                        });
                        layer.on('mouseout', function() {
                            this.setStyle({ fillOpacity: 0.35, weight: 2.5 });
                        });
                    }
                }
            }).addTo(map);
        });

    // --- СЕКЦИЯ 3: ВОЕННИ БАЗИ И ПРИСТАНИЩА (ASSET DATABASE) ---
    // Пълен списък с тактически обекти за картата
    const militaryAssets = [
        { name: "US 5th Fleet HQ", type: "us-navy", lat: 26.21, lon: 50.60, sym: '⚓' },
        { name: "Al Udeid Air Base", type: "us-air", lat: 25.11, lon: 51.21, sym: '🦅' },
        { name: "Sevastopol Naval HQ", type: "ru-navy", lat: 44.61, lon: 33.53, sym: '⚓' },
        { name: "Tehran Command Center", type: "ir-hq", lat: 35.68, lon: 51.41, sym: '📡' },
        { name: "Odesa Strategic Port", type: "ua-port", lat: 46.48, lon: 30.72, sym: '🚢' },
        { name: "Kyiv Defensive Bunker", type: "ua-hq", lat: 50.45, lon: 30.52, sym: '🏰' },
        { name: "Tartus Logistics Hub", type: "ru-syria", lat: 34.88, lon: 35.88, sym: '⚓' },
        { name: "Hmeimim Air Base", type: "ru-air", lat: 35.41, lon: 35.95, sym: '✈️' },
        { name: "Haifa Naval Base", type: "il-navy", lat: 32.82, lon: 34.99, sym: '⚓' },
        { name: "Incirlik NATO Base", type: "nato-air", lat: 37.00, lon: 35.42, sym: '📡' }
    ];

    // --- СЕКЦИЯ 4: РАЗШИРЕН CSS (ПУЛСАЦИЯ + ГОЛЯМ МОДАЛ) ---
    const customStyles = document.createElement("style");
    customStyles.innerText = `
        .leaflet-marker-icon { background: none !important; border: none !important; }
        .mil-icon-box { display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid #fff; box-shadow: 0 0 10px #000; }
        .icon-us-nato { background: rgba(57, 255, 20, 0.6); border-color: #39FF14; }
        .icon-ru-ua { background: rgba(255, 0, 0, 0.6); border-color: #ff3131; }
        .icon-iran { background: rgba(255, 140, 0, 0.6); border-color: #ff8c00; }
        .tactical-country-tooltip { background: #000 !important; color: #39FF14 !important; border: 1px solid #39FF14 !important; font-family: 'Courier New', monospace; font-weight: bold; }
        
        /* ПУЛСИРАЩА АНИМАЦИЯ - SCALE ЕФЕКТ */
        .pulse-intel { animation: p-green 2.5s infinite; cursor: pointer; }
        .pulse-critical { animation: p-red 0.8s infinite alternate; cursor: pointer; filter: drop-shadow(0 0 20px #ff3131); }
        
        @keyframes p-green { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes p-red { from { transform: scale(1); } to { transform: scale(1.4); } }

        /* ГОЛЯМ ТАКТИЧЕСКИ ПРОЗОРЕЦ (800PX) */
        .expanded-intel-window { 
            position: fixed !important; top: 50% !important; left: 50% !important; 
            transform: translate(-50%, -50%) !important; width: 800px !important; 
            min-height: 550px !important; z-index: 100000 !important; 
            background: rgba(5, 5, 5, 0.98) !important; border: 3px solid #39FF14 !important; 
            box-shadow: 0 0 250px #000 !important; display: flex; flex-direction: column; 
            font-family: 'Courier New', monospace;
        }
    `;
    document.head.appendChild(customStyles);

    // --- СЕКЦИЯ 5: ГЕНЕРИРАНЕ НА ВОЕННИ МАРКЕРИ ---
    militaryAssets.forEach(asset => {
        let factionClass = 'icon-iran';
        if (asset.type.includes('us') || asset.type.includes('nato')) factionClass = 'icon-us-nato';
        if (asset.type.includes('ru') || asset.type.includes('ua')) factionClass = 'icon-ru-ua';

        L.marker([asset.lat, asset.lon], {
            icon: L.divIcon({ 
                html: `<div class="mil-icon-box ${factionClass}" style="font-size:18px; width:34px; height:34px;">${asset.sym}</div>`, 
                iconSize: [34, 34] 
            })
        }).addTo(militaryLayer).bindTooltip(asset.name);
    });

    // --- СЕКЦИЯ 6: МОДАЛЕН ПАНЕЛ (MAXI-SIZE ОПТИМИЗАЦИЯ) ---
    const openIntelReport = (data) => {
        const modal = document.getElementById('intel-details-container');
        const content = document.getElementById('news-content');
        if (!modal || !content) return;

        modal.classList.add('expanded-intel-window');
        const uiColor = (data.type === "Evacuation" || data.critical) ? '#ff3131' : '#39FF14';

        content.innerHTML = `
            <div style="background:#111; padding:20px; border-bottom:2px solid #333; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#39FF14; font-weight:bold; letter-spacing:2px;">>> TACTICAL DATA DECRYPTED</span>
                <span id="close-report" style="cursor:pointer; color:#ff3131; border:1px solid #ff3131; padding:8px 20px; font-weight:bold;">EXIT SYSTEM [X]</span>
            </div>
            <div style="padding:50px; color:white; overflow-y:auto; flex-grow:1;">
                <h1 style="color:${uiColor}; font-size:42px; text-transform:uppercase; margin-bottom:25px; border-bottom:3px solid ${uiColor}; padding-bottom:15px;">${data.title}</h1>
                <p style="font-size:26px; line-height:1.7; color:#fff; margin-bottom:40px; background:rgba(255,255,255,0.03); padding:20px;">${data.description}</p>
                <div style="background:rgba(255,255,255,0.05); padding:30px; border-left:12px solid ${uiColor}; font-size:22px;">
                    <strong>THREAT STATUS:</strong> ${data.critical ? 'CRITICAL ALERT' : 'ACTIVE MONITORING'}<br>
                    <strong>COORDINATES:</strong> ${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}<br>
                    <strong>SECTOR:</strong> ${data.type.toUpperCase()}
                </div>
                <div style="margin-top:50px;">
                    <a href="${data.link}" target="_blank" style="display:inline-block; background:${uiColor}; color:#000; padding:22px 60px; text-decoration:none; font-weight:bold; font-size:24px; text-transform:uppercase;">Connect to Live Feed</a>
                </div>
            </div>`;
        
        document.getElementById('close-report').onclick = () => modal.classList.remove('expanded-intel-window');
        map.flyTo([data.lat, data.lon], 7);
    };

    // --- СЕКЦИЯ 7: СИНХРОНИЗАЦИЯ С CONFLICTS.JSON И АУДИО ---
    function performIntelSync() {
        fetch('conflicts.json?v=' + Date.now()).then(res => res.json()).then(data => {
            if (!Array.isArray(data)) return;
            markersLayer.clearLayers();
            const sidebar = document.getElementById('intel-list');
            if (sidebar) sidebar.innerHTML = '';

            // Логика за аудио известяване (alert.mp3)
            if (data.length > 0) {
                const latestNews = data[0];
                if (latestNews.title !== currentLastEventId) {
                    if (latestNews.type === "Evacuation" || latestNews.critical === true) {
                        new Audio('alert.mp3').play().catch(e => console.log("Sound ready for user event."));
                    }
                    currentLastEventId = latestNews.title;
                }
            }

            data.forEach(item => {
                const isRed = item.type === "Evacuation" || item.critical === true;
                const iconSymbol = isRed ? '🚨' : (item.type.includes('strike') ? '💥' : '⚠️');
                const pulseClass = isRed ? 'pulse-critical' : 'pulse-intel';
                
                const eventMarker = L.marker([item.lat, item.lon], { 
                    icon: L.divIcon({ html: `<div class="${pulseClass}" style="font-size:42px;">${iconSymbol}</div>`, iconSize:[55,55] }) 
                }).addTo(markersLayer);

                eventMarker.on('click', () => openIntelReport(item));

                if (sidebar) {
                    const entry = document.createElement('div');
                    entry.style.cssText = `border-left: 5px solid ${isRed ? '#ff3131' : '#39FF14'}; padding:18px; margin-bottom:12px; background:rgba(255,255,255,0.03); cursor:pointer; transition: 0.3s;`;
                    entry.innerHTML = `<small style="color:#888;">[${item.date}]</small><br><strong style="color:${isRed ? '#ff3131' : '#39FF14'}; font-size:18px;">${iconSymbol} ${item.title}</strong>`;
                    entry.onclick = () => openIntelReport(item);
                    sidebar.appendChild(entry);
                }
            });
        }).catch(err => console.error("Sync Error:", err));
    }

    // Стартиране на мониторинга
    performIntelSync(); 
    setInterval(performIntelSync, 60000); 
};

// --- СЕКЦИЯ 8: UTC ЧАСОВНИК ---
setInterval(() => {
    const timeEl = document.getElementById('header-time');
    if (timeEl) timeEl.innerText = new Date().toUTCString().split(' ')[4] + " UTC";
}, 1000);

// --- END OF FILE (SYSTEM READY) ---
