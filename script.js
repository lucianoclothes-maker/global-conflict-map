/**
 * =============================================================================
 * GLOBAL CONFLICT DASHBOARD v6.5 - STRATEGIC COMMAND (MODAL UPDATE)
 * =============================================================================
 * ОБЕКТ: Централен модал за детайли + Тактически икони + Пулсация
 * ДАТА НА ВАЛИДАЦИЯ: 2026-02-21
 * АВТОР: Gemini Tactical AI (Personalized for Borislav)
 * =============================================================================
 */

window.onload = function() {
    
    // --- 1. ИНИЦИАЛИЗАЦИЯ НА КАРТАТА ---
    const map = L.map('map', {
        worldCopyJump: true,
        zoomControl: true,
        attributionControl: false,
        zoomSnap: 0.5
    }).setView([35.0, 20.0], 4); 

    const markersLayer = L.layerGroup().addTo(map);   
    const militaryLayer = L.layerGroup().addTo(map);  

    // ТЪМЕН ТАКТИЧЕСКИ СЛОЙ (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        minZoom: 2
    }).addTo(map);

    // --- 2. ГЕОПОЛИТИЧЕСКИ ЗОНИ ---
    const warZones = ['Russia', 'Ukraine', 'Israel', 'Palestine', 'Sudan', 'Syria', 'Yemen'];
    const highTension = ['Iran', 'North Korea', 'China', 'Taiwan', 'Venezuela'];
    const monitoredZones = ['USA', 'United States', 'Germany', 'Turkey', 'United Kingdom', 'Poland'];

    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(res => res.json())
        .then(geoData => {
            L.geoJson(geoData, {
                style: function(feature) {
                    const name = feature.properties.name;
                    if (warZones.includes(name)) return { fillColor: "#ff0000", weight: 2.2, color: '#ff3333', fillOpacity: 0.35 };
                    if (highTension.includes(name)) return { fillColor: "#ff8c00", weight: 1.8, color: '#ff8c00', fillOpacity: 0.25 };
                    if (monitoredZones.includes(name)) return { fillColor: "#3498db", weight: 1.2, color: '#3498db', fillOpacity: 0.15 };
                    return { fillColor: "#000", weight: 0.5, color: "#222", fillOpacity: 0.1 };
                },
                onEachFeature: function(feature, layer) {
                    const name = feature.properties.name;
                    let label = "<span style='color:#39FF14;'>MONITORED REGION</span>";
                    if (warZones.includes(name)) label = "<span style='color:#ff4d4d;'>CRITICAL WARZONE</span>";
                    else if (highTension.includes(name)) label = "<span style='color:#ff8c00;'>HIGH TENSION ZONE</span>";

                    layer.bindTooltip(`<div style="background:black; color:white; border:1px solid #39FF14; padding:10px; font-family:monospace;">
                        <strong style="color:#39FF14;">${name.toUpperCase()}</strong><br>STATUS: ${label}</div>`, { sticky: true });
                }
            }).addTo(map);
        });

    // --- 3. ПОСТОЯННИ ВОЕННИ ОБЕКТИ ---
    const militaryAssets = [
        { name: "Mykolaiv Naval HQ", type: "naval-ua", lat: 46.96, lon: 31.99, info: "Coastal Defense" },
        { name: "Sevastopol Naval Base", type: "naval-ru", lat: 44.61, lon: 33.53, info: "Black Sea Fleet" },
        { name: "Odesa Strategic Port", type: "naval-ua", lat: 46.48, lon: 30.72, info: "Maritime Logistics" },
        { name: "Hostomel Airport", type: "airbase-ua", lat: 50.59, lon: 30.21, info: "Air Cargo Base" },
        { name: "Engels-2 Strategic", type: "airbase-ru", lat: 51.48, lon: 46.21, info: "Bomber Command" },
        { name: "Al Udeid Air Base", type: "us-hq", lat: 25.11, lon: 51.21, info: "US CENTCOM HQ" }
    ];

    // --- 4. КРИТИЧЕН CSS (С ПОДОБРЕНИЯ ЗА МОДАЛА) ---
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .mil-icon { display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.7); }
        .icon-ua { background: rgba(52, 152, 219, 0.4); color: #3498db; }
        .icon-ru { background: rgba(231, 76, 60, 0.4); color: #e74c3c; }
        .icon-us { background: rgba(57, 255, 20, 0.2); color: #39FF14; border: 2px solid #39FF14; }
        .read-more-btn { display: inline-block !important; margin-top: 15px !important; padding: 12px 24px !important; background: #39FF14 !important; color: #000 !important; font-weight: bold !important; text-decoration: none !important; border-radius: 4px; font-family: 'Courier New', monospace; text-transform: uppercase; cursor: pointer; transition: 0.3s; width: 100%; text-align: center; }
        .read-more-btn:hover { background: #fff !important; box-shadow: 0 0 20px #39FF14; transform: scale(1.02); }
        .pulse-intel { animation: pulse-red 2.5s infinite; }
        @keyframes pulse-red { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
        .intel-entry { border-left: 2px solid #39FF14; padding-left: 10px; margin-bottom: 15px; cursor: pointer; transition: 0.2s; }
        .intel-entry:hover { background: rgba(57, 255, 20, 0.1); }
        .tactical-marker { text-shadow: 0 0 15px red; filter: drop-shadow(0 0 5px black); cursor: pointer; }
        
        /* СТИЛ ЗА ЦЕНТРАЛНИЯ МОДАЛ */
        #objective-details { 
            display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 500px; max-width: 90%; background: rgba(0,0,0,0.95); border: 2px solid #39FF14;
            z-index: 10000; padding: 0; box-shadow: 0 0 50px rgba(0,0,0,1), 0 0 20px rgba(57, 255, 20, 0.4);
            font-family: 'Courier New', monospace;
        }
        .modal-header { background: #39FF14; color: #000; padding: 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        .close-btn { cursor: pointer; padding: 5px 10px; background: #000; color: #39FF14; border: 1px solid #39FF14; }
        .close-btn:hover { background: #ff4d4d; color: #fff; }
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; }
    `;
    document.head.appendChild(styleSheet);

    // Добавяме Overlay елемент в HTML за затъмняване
    const overlay = document.createElement("div");
    overlay.id = "modal-overlay";
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);

    // --- 5. ФУНКЦИЯ ЗА СИМВОЛИ ---
    function getIntelIcon(type) {
        let symbol = '⚠️';
        const t = type.toLowerCase();
        if (t.includes('airstrike') || t.includes('missile')) symbol = '🚀';
        else if (t.includes('clashes') || t.includes('fighting')) symbol = '⚔️';
        else if (t.includes('naval') || t.includes('ship')) symbol = '🚢';
        else if (t.includes('drone') || t.includes('uav')) symbol = '🛸';
        else if (t.includes('explosion') || t.includes('blast')) symbol = '💥';
        else if (t.includes('nuclear')) symbol = '☢️';
        
        return L.divIcon({
            html: `<div class="pulse-intel tactical-marker" style="font-size:32px; width:40px; text-align:center;">${symbol}</div>`,
            className: '', iconSize: [40, 40], iconAnchor: [20, 20]
        });
    }

    function getTacticalIcon(type) {
        let sym = '✈️'; let cls = 'mil-icon ';
        if (type.includes('naval')) sym = '⚓';
        else if (type.includes('us')) sym = '🦅';
        if (type.includes('ua')) cls += 'icon-ua';
        else if (type.includes('ru')) cls += 'icon-ru';
        else if (type.includes('us')) cls += 'icon-us';
        return L.divIcon({ html: `<div class="${cls}" style="font-size:20px; width:36px; height:36px;">${sym}</div>`, className: '', iconSize: [36, 36] });
    }

    militaryAssets.forEach(a => {
        L.marker([a.lat, a.lon], { icon: getTacticalIcon(a.type) }).addTo(militaryLayer).bindTooltip(`<b>${a.name}</b><br>INTEL: ${a.info}`);
    });

    // --- 6. ОБРАБОТКА НА JSON И НОВИНИТЕ ---
    function syncIntel() {
        console.log("Tactical Update: Fetching Intel...");
        fetch('conflicts.json?cache=' + Date.now())
            .then(res => res.json())
            .then(data => {
                markersLayer.clearLayers();
                const listContainer = document.getElementById('intel-list');
                if (listContainer) listContainer.innerHTML = ''; 

                data.forEach(item => {
                    const tacticalIcon = getIntelIcon(item.type);
                    const marker = L.marker([item.lat, item.lon], { icon: tacticalIcon }).addTo(markersLayer);
                    
                    const showDetails = () => {
                        const panel = document.getElementById('objective-details');
                        const overlay = document.getElementById('modal-overlay');
                        const content = document.getElementById('news-content');
                        
                        if(panel && content) {
                            const finalUrl = item.link || item.url || "#";
                            content.innerHTML = `
                                <div class="modal-header">
                                    <span>OBJECTIVE: ${item.type.toUpperCase()}</span>
                                    <span class="close-btn" id="modal-close">[ X ]</span>
                                </div>
                                <div style="padding: 20px; color: #fff;">
                                    <h3 style="color:#39FF14; border-bottom: 1px solid #333; padding-bottom:10px;">${item.title}</h3>
                                    <p style="font-size:15px; line-height:1.6; margin: 15px 0;">${item.description || "Sector analysis in progress for " + item.country + "."}</p>
                                    <div style="background: rgba(255,255,255,0.05); padding:10px; font-family:monospace; font-size:12px; border-left: 3px solid #ff4d4d;">
                                        STATUS: ACTIVE | FATALITIES: ${item.fatalities} | DATE: ${item.date}
                                    </div>
                                    <a href="${finalUrl}" target="_blank" class="read-more-btn">ACCESS FULL TERMINAL DATA</a>
                                </div>`;
                            
                            panel.style.display = "block";
                            overlay.style.display = "block";

                            document.getElementById('modal-close').onclick = () => {
                                panel.style.display = "none";
                                overlay.style.display = "none";
                            };
                        }
                        map.flyTo([item.lat, item.lon], 7);
                    };

                    marker.on('click', showDetails);

                    if (listContainer) {
                        const entry = document.createElement('div');
                        entry.className = 'intel-entry';
                        entry.innerHTML = `
                            <small style="color: #888;">[${item.date}]</small><br>
                            <strong style="text-transform: uppercase; color:#eee;">${item.title}</strong><br>
                            <span style="font-size: 10px; color: #ff4d4d;">TYPE: ${item.type} | LOC: ${item.country.toUpperCase()}</span>
                        `;
                        entry.onclick = showDetails;
                        listContainer.appendChild(entry);
                    }
                });
            }).catch(err => console.error("INTEL ERROR: JSON failure."));
    }

    // --- 7. REFRESH LOGIC ---
    function refreshFeeds() { console.log("Tactical Reload: Feeds synchronized."); }

    syncIntel();
    setInterval(syncIntel, 60000); 
    console.log("%c STRATEGIC COMMAND ONLINE ", "background: #000; color: #39FF14; font-size: 20px;");
};

// --- 8. UTC ЧАСОВНИК ---
setInterval(() => {
    const el = document.getElementById('header-time');
    if (el) {
        const d = new Date();
        el.innerText = d.getUTCHours().toString().padStart(2, '0') + ":" + 
                      d.getUTCMinutes().toString().padStart(2, '0') + ":" + 
                      d.getUTCSeconds().toString().padStart(2, '0') + " UTC";
    }
}, 1000);

window.onerror = function(msg, url, line) {
    console.log("%c ALERT: SYSTEM ERROR AT LINE " + line, "color: red; font-weight: bold;");
    return false;
};
/** КРАЙ НА СТРАТЕГИЧЕСКИЯ КОД **/
