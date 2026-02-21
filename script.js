/**
 * =============================================================================
 * GLOBAL CONFLICT DASHBOARD v12.9 - HARDENED BUILD
 * =============================================================================
 * ПОТРЕБИТЕЛ: BORISLAV | СТАТУС: ФИНАЛНА ОПТИМИЗАЦИЯ (250 РЕДА)
 * -----------------------------------------------------------------------------
 * ОПИСАНИЕ:
 * - Размер на прозореца за детайли: 650px (Балансиран).
 * - Пълна поддръжка на звук: alert.mp3.
 * - Интерактивни зони: Русия, Украйна, Иран, САЩ, Израел, Близкия Изток.
 * - Пълна съвместимост с bot.py и conflicts.json.
 * =============================================================================
 */

window.onload = function() {
    
    // ПАМЕТ НА СИСТЕМАТА ЗА ГОРЕЩИ СЪБИТИЯ
    // Използва се за избягване на повторни звукови сигнали
    let globalLastEventTitle = ""; 

    // --- СЕКЦИЯ 1: КОНФИГУРАЦИЯ НА КАРТАТА ---
    // Настройваме координатите за централен изглед към Евразия и Близкия изток
    const map = L.map('map', {
        worldCopyJump: true,    // Позволява безкрайно превъртане на изток/запад
        zoomControl: true,      // Стандартни бутони за навигация
        attributionControl: false, // Премахване на лога за по-чист интерфейс
        zoomSnap: 0.1,          // Прецизен контрол на мащаба
        wheelDebounceTime: 60   // Оптимизация на скрола с мишката
    }).setView([35.0, 40.0], 4.2); 

    // Дефиниране на слоеве за различни типове данни
    const markersLayer = L.layerGroup().addTo(map);   // Динамични новини
    const militaryLayer = L.layerGroup().addTo(map);  // Статични бази и активи

    // ИЗБОР НА ТАКТИЧЕСКИ ТАЙЛОВЕ (DARK MATTER)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 18, 
        minZoom: 2, 
        crossOrigin: true
    }).addTo(map);

    // --- СЕКЦИЯ 2: ГЕОПОЛИТИЧЕСКИ ДАННИ И ГРАНИЦИ ---
    // Списък на държави според техния текущ статус
    const warZones = ['Russia', 'Ukraine', 'Israel', 'Palestine', 'Sudan', 'Syria', 'Yemen', 'Iraq', 'Lebanon'];
    const blueZone = ['France', 'Germany', 'United Kingdom', 'Italy', 'Poland', 'Bulgaria', 'Romania', 'Greece', 'Norway'];
    const tensionZones = ['Iran', 'North Korea', 'China', 'Taiwan', 'Venezuela', 'USA', 'Turkey', 'Saudi Arabia'];

    // Зареждане на GeoJSON данни за държавите
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(res => res.json())
        .then(geoData => {
            L.geoJson(geoData, {
                style: function(feature) {
                    const countryName = feature.properties.name;
                    // Цветово кодиране на териториите
                    if (warZones.includes(countryName)) return { fillColor: "#ff0000", weight: 2.2, color: '#ff3333', fillOpacity: 0.3 };
                    if (blueZone.includes(countryName)) return { fillColor: "#0055ff", weight: 2.0, color: '#00a2ff', fillOpacity: 0.25 };
                    if (tensionZones.includes(countryName)) return { fillColor: "#ff8c00", weight: 1.8, color: '#ff8c00', fillOpacity: 0.2 };
                    return { fillColor: "#000", weight: 0.6, color: "#333", fillOpacity: 0.1 };
                },
                onEachFeature: function(feature, layer) {
                    const n = feature.properties.name;
                    // Добавяне на Tooltip при задържане на мишката
                    layer.bindTooltip(`<div style="background:#000; color:#39FF14; border:1px solid #333; padding:4px; font-family:monospace;">${n.toUpperCase()}</div>`, { sticky: true });
                    
                    // Визуални ефекти при посочване
                    layer.on('mouseover', function() { this.setStyle({ fillOpacity: 0.45, weight: 3 }); });
                    layer.on('mouseout', function() { this.setStyle({ fillOpacity: 0.25, weight: 2 }); });
                }
            }).addTo(map);
        });

    // --- СЕКЦИЯ 3: ВОЕННИ БАЗИ И ТАКТИЧЕСКИ АКТИВИ ---
    // Разширена база данни за по-плътна карта
    const strategicAssets = [
        { name: "US 5th Fleet HQ (Bahrain)", type: "us-naval", lat: 26.21, lon: 50.60 },
        { name: "Al Udeid Air Base (Qatar)", type: "us-air", lat: 25.11, lon: 51.21 },
        { name: "Tehran Central Command", type: "ir-pvo", lat: 35.68, lon: 51.41 },
        { name: "Bushehr Nuclear Defense", type: "ir-pvo", lat: 28.82, lon: 50.88 },
        { name: "Sevastopol Naval Base", type: "ru-naval", lat: 44.61, lon: 33.53 },
        { name: "Tartus Port (Russia)", type: "ru-naval", lat: 34.88, lon: 35.88 },
        { name: "Odesa Strategic Port", type: "ua-port", lat: 46.48, lon: 30.72 },
        { name: "Kyiv Defense Bunker", type: "ua-hq", lat: 50.45, lon: 30.52 },
        { name: "Incirlik Air Base (NATO)", type: "us-air", lat: 37.00, lon: 35.42 },
        { name: "Aviano Air Base (Italy)", type: "us-air", lat: 46.03, lon: 12.59 },
        { name: "Diego Garcia Base", type: "us-naval", lat: -7.31, lon: 72.41 },
        { name: "Kaliningrad HQ", type: "ru-hq", lat: 54.71, lon: 20.45 }
    ];

    // --- СЕКЦИЯ 4: РАЗШИРЕН CSS СТИЛ (UI ОПТИМИЗАЦИЯ) ---
    const customStyles = document.createElement("style");
    customStyles.innerText = `
        .leaflet-marker-icon { background: none !important; border: none !important; }
        .mil-icon-box { display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid #fff; box-shadow: 0 0 8px #000; transition: 0.3s; }
        .icon-us-nato { background: rgba(57, 255, 20, 0.45); border-color: #39FF14; }
        .icon-iran-tension { background: rgba(255, 140, 0, 0.45); border-color: #ff8c00; }
        .icon-ru-ua { background: rgba(255, 0, 0, 0.45); border-color: #ff3131; }
        
        /* ПУЛСИРАЩА АНИМАЦИЯ ЗА НОВИНИ */
        .alert-pulse { animation: alert-anim 2s infinite alternate; cursor: pointer; filter: drop-shadow(0 0 15px #ff3131); }
        @keyframes alert-anim { from { transform: scale(1); opacity: 1; } to { transform: scale(1.35); opacity: 0.5; } }
        
        /* ТАКТИЧЕСКИ МОДАЛЕН ПРОЗОРЕЦ - 650PX */
        .expanded-intel-panel {
            position: fixed !important; top: 50% !important; left: 50% !important;
            transform: translate(-50%, -50%) !important; width: 650px !important;
            min-height: 480px !important; z-index: 100000 !important;
            background: rgba(8, 8, 8, 0.98) !important; border: 2px solid #39FF14 !important;
            box-shadow: 0 0 150px #000; padding: 0 !important; display: flex; flex-direction: column;
            font-family: 'Courier New', monospace;
        }
        .intel-list-item { border-left: 3px solid #39FF14; padding: 12px; margin-bottom: 8px; cursor: pointer; background: rgba(255,255,255,0.03); transition: 0.2s; }
        .intel-list-item:hover { background: rgba(57, 255, 20, 0.1); }
        .close-sys-btn { cursor: pointer; color: #ff3131; border: 1px solid #ff3131; padding: 4px 12px; font-weight: bold; font-size: 14px; }
    `;
    document.head.appendChild(customStyles);

    // --- СЕКЦИЯ 5: ГЕНЕРИРАНЕ НА ТАКТИЧЕСКИ ИКОНИ ---
    function createAssetIcon(type) {
        let symbol = '✈️'; 
        let styleClass = 'mil-icon-box ';
        
        if (type.startsWith('us-')) {
            styleClass += 'icon-us-nato';
            symbol = type.includes('naval') ? '⚓' : '🦅';
        } else if (type.startsWith('ir-')) {
            styleClass += 'icon-iran-tension';
            symbol = type.includes('pvo') ? '📡' : '☢️';
        } else {
            styleClass += 'icon-ru-ua';
            symbol = type.includes('naval') ? '⚓' : '🚢';
        }

        return L.divIcon({ 
            html: `<div class="${styleClass}" style="font-size:18px; width:34px; height:34px;">${symbol}</div>`, 
            iconSize: [34, 34] 
        });
    }

    // Поставяне на статичните обекти върху картата
    strategicAssets.forEach(asset => {
        L.marker([asset.lat, asset.lon], { icon: createAssetIcon(asset.type) })
         .addTo(militaryLayer)
         .bindTooltip(asset.name);
    });

    // --- СЕКЦИЯ 6: МОДАЛЕН ДИСПЛЕЙ (650PX ОПТИМИЗАЦИЯ) ---
    const showIntelDetails = (data) => {
        const container = document.getElementById('intel-details-container');
        const content = document.getElementById('news-content');
        if (!container || !content) return;

        container.classList.add('expanded-intel-panel');
        content.innerHTML = `
            <div style="background:#111; padding:15px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#39FF14; font-weight:bold; letter-spacing:1px;">>> ENCRYPTED DATA FEED</span>
                <span id="close-report" class="close-sys-btn">CLOSE [X]</span>
            </div>
            <div style="padding:35px; color:white; overflow-y:auto;">
                <h1 style="color:#39FF14; font-size:30px; margin-top:0; border-bottom:1px solid #222; padding-bottom:10px;">${data.title.toUpperCase()}</h1>
                <p style="font-size:19px; line-height:1.6; color:#ccc; margin-bottom:25px;">${data.description || "Intelligence stream is active. Monitoring for updates..."}</p>
                <div style="background:rgba(255,50,50,0.1); padding:20px; border-left:5px solid #ff3131; font-size:17px; margin:25px 0;">
                    <strong style="color:#ff3131;">STATUS:</strong> CRITICAL ALERT<br>
                    <strong>SECTOR:</strong> ${data.country || "Global Operations"}<br>
                    <strong>COORDINATES:</strong> ${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}
                </div>
                <div style="margin-top:30px; text-align:center;">
                    <a href="${data.link || "#"}" target="_blank" style="display:inline-block; background:#39FF14; color:#000; padding:15px 40px; text-decoration:none; font-weight:bold; font-size:18px;">ACCESS LIVE SOURCE</a>
                </div>
            </div>`;
        
        document.getElementById('close-report').onclick = () => container.classList.remove('expanded-intel-panel');
        map.flyTo([data.lat, data.lon], 7);
    };

    // --- СЕКЦИЯ 7: СИНХРОНИЗАЦИЯ С CONFLICTS.JSON И ЗВУК ---
    function syncTacticalData() {
        fetch('conflicts.json?v=' + Date.now()).then(res => res.json()).then(data => {
            if (!Array.isArray(data)) return;
            markersLayer.clearLayers();
            const sidebar = document.getElementById('intel-list');
            if (sidebar) sidebar.innerHTML = '';

            // Проверка за нови събития и активиране на alert.mp3
            if (data.length > 0 && data[0].title !== globalLastEventTitle) {
                if (data[0].critical === true || data[0].type === "Evacuation") {
                    const audio = new Audio('alert.mp3');
                    audio.play().catch(e => console.log("User interaction required for audio."));
                }
                globalLastEventTitle = data[0].title;
            }

            // Обработка на всяка новина
            data.forEach(item => {
                const icon = (item.critical || item.type === "Evacuation") ? '🚨' : '⚠️';
                const marker = L.marker([item.lat, item.lon], { 
                    icon: L.divIcon({ html: `<div class="alert-pulse" style="font-size:38px;">${icon}</div>`, iconSize:[45,45] }) 
                }).addTo(markersLayer);

                marker.on('click', () => showIntelDetails(item));

                if (sidebar) {
                    const entry = document.createElement('div');
                    entry.className = 'intel-list-item';
                    entry.innerHTML = `<small style="color:#888;">[${item.date}]</small><br><strong style="color:#39FF14;">${item.title}</strong>`;
                    entry.onclick = () => showIntelDetails(item);
                    sidebar.appendChild(entry);
                }
            });
        });
    }

    // Първоначално стартиране и настройка на интервал
    syncTacticalData(); 
    setInterval(syncTacticalData, 60000); 
};

// --- СЕКЦИЯ 8: UTC СИСТЕМЕН ЧАСОВНИК ---
// Поддържане на точно време за тактически нужди
setInterval(() => {
    const timeDisplay = document.getElementById('header-time');
    if (timeDisplay) {
        const utcNow = new Date().toUTCString().split(' ')[4];
        timeDisplay.innerText = utcNow + " UTC";
    }
}, 1000);

/** * =============================================================================
 * КРАЙ НА ФАЙЛА - GLOBAL CONFLICT DASHBOARD v12.9
 * ВСИЧКИ МОДУЛИ СА ЗАРЕДЕНИ УСПЕШНО.
 * =============================================================================
 */
