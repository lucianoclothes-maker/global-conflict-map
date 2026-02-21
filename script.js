/**
 * =============================================================================
 * GLOBAL CONFLICT DASHBOARD v10.8 - DATABASE NAME VALIDATION
 * =============================================================================
 * ОБЕКТ: Фиксиране на USA чрез проверка на всички възможни имена в GeoJSON.
 * ЛОГИКА: Добавени United States, USA, United States of America.
 * СТАТУСИ: Върнати (IN WAR / HIGH TENSION) с динамични цветове.
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 18, minZoom: 2
    }).addTo(map);

    // --- 2. ГЕОПОЛИТИЧЕСКИ ЗОНИ ---
    const warZones = ['Russia', 'Ukraine', 'Israel', 'Palestine', 'Sudan', 'Syria', 'Yemen'];
    
    // Тук са всички варианти, за да сме сигурни, че САЩ ще светнат
    const highTension = [
        'Iran', 'North Korea', 'China', 'Taiwan', 'Venezuela', 
        'USA', 'United States', 'United States of America', 
        'Germany', 'Turkey', 'Serbia', 'Bulgaria'
    ];

    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(res => res.json())
        .then(geoData => {
            L.geoJson(geoData, {
                style: function(f) {
                    const n = f.properties.name;
                    if (warZones.includes(n)) return { fillColor: "#ff0000", weight: 2.2, color: '#ff3333', fillOpacity: 0.35 };
                    if (highTension.includes(n)) return { fillColor: "#ff8c00", weight: 1.8, color: '#ff8c00', fillOpacity: 0.25 };
                    return { fillColor: "#0b0b0b", weight: 0.5, color: "#222", fillOpacity: 0.1 };
                },
                onEachFeature: function(f, l) {
                    const n = f.properties.name;
                    let status = "STABLE SECTOR";
                    let statusColor = "#39FF14";

                    if (warZones.includes(n)) {
                        status = "CRITICAL: IN WAR";
                        statusColor = "#ff3131";
                    } else if (highTension.includes(n)) {
                        status = "WARNING: HIGH TENSION";
                        statusColor = "#ff8c00";
                    }

                    l.bindTooltip(`
                        <div style="background:black; color:white; border:1px solid #39FF14; padding:8px; font-family:monospace;">
                            <strong style="color:#39FF14; font-size:14px;">${n.toUpperCase()}</strong><br>
                            <span style="color:${statusColor}; font-size:11px;">STATUS: ${status}</span>
                        </div>
                    `, { sticky: true, opacity: 0.9 });
                }
            }).addTo(map);
        });

    // --- 3. ПОСТОЯННИ ВОЕННИ ОБЕКТИ ---
    const assets = [
        { name: "Mykolaiv Naval HQ", type: "naval-ua", lat: 46.96, lon: 31.99 },
        { name: "Sevastopol Naval Base", type: "naval-ru", lat: 44.61, lon: 33.53 },
        { name: "Odesa Strategic Port", type: "naval-ua", lat: 46.48, lon: 30.72 },
        { name: "Hostomel Airport", type: "airbase-ua", lat: 50.59, lon: 30.21 },
        { name: "Engels-2 Strategic", type: "airbase-ru", lat: 51.48, lon: 46.21 },
        { name: "Al Udeid Air Base", type: "us-hq", lat: 25.11, lon: 51.21 },
        { name: "Tartus Naval Base", type: "naval-ru", lat: 34.89, lon: 35.88 },
        { name: "Kyiv Command Center", type: "ua-hq", lat: 50.45, lon: 30.52 }
    ];

    // --- 4. CSS ЗА ПРОЗРАЧНОСТ И ПАНЕЛИ ---
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .leaflet-marker-icon { background: transparent !important; border: none !important; }
        .mil-icon { display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid #fff; }
        .icon-ua { background: rgba(52, 152, 219, 0.7); } .icon-ru { background: rgba(231, 76, 60, 0.7); }
        .icon-us { background: rgba(57, 255, 20, 0.3); border-color: #39FF14; }
        .pulse-intel { animation: pulse-red 2.5s infinite; cursor: pointer; background: transparent !important; }
        @keyframes pulse-red { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.6; } 100% { transform: scale(1); opacity: 1; } }
        .expanded-intel {
            position: fixed !important; top: 50% !important; left: 50% !important;
            transform: translate(-50%, -50%) !important; width: 620px !important;
            height: auto !important; min-height: 250px; z-index: 10000 !important;
            background: rgba(10, 10, 10, 0.98) !important; border: 2px solid #39FF14 !important;
            box-shadow: 0 0 100px #000 !important; transition: all 0.3s ease-in-out;
        }
        .intel-entry { border-left: 2px solid #39FF14; padding: 10px; margin-bottom: 10px; cursor: pointer; background: rgba(255,255,255,0.05); }
        .close-trigger { cursor: pointer; color: #ff3131; border: 1px solid #ff3131; padding: 2px 10px; font-weight: bold; }
    `;
    document.head.appendChild(styleSheet);

    // --- 5. ФУНКЦИИ ЗА ИКОНИ ---
    function getIntelIcon(type) {
        let sym = '⚠️'; const t = type.toLowerCase();
        if (t.includes('missile')) sym = '🚀'; else if (t.includes('naval')) sym = '🚢';
        else if (t.includes('clashes')) sym = '⚔️'; else if (t.includes('drone')) sym = '🛸';
        return L.divIcon({ html: `<div class="pulse-intel" style="font-size:32px; text-align:center;">${sym}</div>`, iconSize: [40, 40] });
    }

    function getTacticalIcon(type) {
        let sym = '✈️'; let cls = 'mil-icon ';
        if (type.includes('naval')) sym = '⚓'; else if (type.includes('us')) sym = '🦅';
        if (type.includes('ua')) cls += 'icon-ua'; else if (type.includes('ru')) cls += 'icon-ru'; else cls += 'icon-us';
        return L.divIcon({ html: `<div class="${cls}" style="font-size:18px; width:34px; height:34px;">${sym}</div>`, iconSize: [34, 34] });
    }

    assets.forEach(a => L.marker([a.lat, a.lon], { icon: getTacticalIcon(a.type) }).addTo(militaryLayer).bindTooltip(a.name));

    // --- 6. МОДАЛЕН ПАНЕЛ (CENTER) ---
    const openIntelDetails = (item) => {
        const container = document.getElementById('intel-details-container');
        const content = document.getElementById('news-content');
        if (container && content) {
            container.classList.add('expanded-intel');
            content.innerHTML = `
                <div style="display:flex; justify-content:space-between; background:rgba(57,255,20,0.1); padding:10px; border-bottom:1px solid #333;">
                    <span style="font-size:11px; font-weight:bold; color:#39FF14;">TACTICAL REPORT</span>
                    <span id="close-intel-btn" class="close-trigger">CLOSE [X]</span>
                </div>
                <div style="padding:20px; color:#fff;">
                    <h2 style="color:#39FF14; margin:0 0 15px 0;">${item.title.toUpperCase()}</h2>
                    <p style="font-size:16px; line-height:1.6;">${item.description || "Sector: " + item.country}</p>
                    <div style="margin:20px 0; padding:15px; border-left:4px solid #ff3131; background:rgba(255,0,0,0.05);">
                        <strong>THREAT:</strong> HIGH | <strong>CASUALTIES:</strong> ${item.fatalities}
                    </div>
                    <a href="${item.link || "#"}" target="_blank" style="display:block; background:#39FF14; color:#000; padding:12px; text-align:center; font-weight:bold; text-decoration:none;">OPEN SECURE FEED</a>
                </div>`;
            document.getElementById('close-intel-btn').onclick = () => container.classList.remove('expanded-intel');
        }
        map.flyTo([item.lat, item.lon], 7);
    };

    // --- 7. СИНХРОНИЗАЦИЯ ---
    function syncIntel() {
        fetch('conflicts.json?v=' + Date.now()).then(res => res.json()).then(data => {
            markersLayer.clearLayers();
            const list = document.getElementById('intel-list');
            if (list) list.innerHTML = ''; 
            data.forEach(item => {
                const marker = L.marker([item.lat, item.lon], { icon: getIntelIcon(item.type) }).addTo(markersLayer);
                marker.on('click', () => openIntelDetails(item));
                if (list) {
                    const entry = document.createElement('div');
                    entry.className = 'intel-entry';
                    entry.innerHTML = `<small style="color:#888;">[${item.date}]</small> <strong style="color:#39FF14;">${item.title}</strong>`;
                    entry.onclick = () => openIntelDetails(item);
                    list.appendChild(entry);
                }
            });
        });
    }

    syncIntel(); 
    setInterval(syncIntel, 60000);
};

// --- 8. ТАЙМЕР ---
setInterval(() => {
    const el = document.getElementById('header-time');
    if (el) el.innerText = new Date().toUTCString().split(' ')[4] + " UTC";
}, 1000);
