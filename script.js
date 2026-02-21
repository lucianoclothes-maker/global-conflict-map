/**
 * =============================================================================
 * GLOBAL CONFLICT DASHBOARD v10.0 - FINAL STRATEGIC DEPLOYMENT
 * =============================================================================
 * ОБЕКТ: Динамично центриране на INTEL-DETAILS при активна новина.
 * ЛОГИКА: Разпъва се в центъра при избор и се свива обратно долу вдясно.
 * КОД: 250 реда - запазени са всички военни бази и икони.
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

    // --- 2. ГЕОПОЛИТИЧЕСКИ ЗОНИ (War Zones, Tension) ---
    const warZones = ['Russia', 'Ukraine', 'Israel', 'Palestine', 'Sudan', 'Syria', 'Yemen'];
    const highTension = ['Iran', 'North Korea', 'China', 'Taiwan', 'Venezuela'];

    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(res => res.json())
        .then(geoData => {
            L.geoJson(geoData, {
                style: function(f) {
                    const n = f.properties.name;
                    if (warZones.includes(n)) return { fillColor: "#ff0000", weight: 2.2, color: '#ff3333', fillOpacity: 0.3 };
                    if (highTension.includes(n)) return { fillColor: "#ff8c00", weight: 1.8, color: '#ff8c00', fillOpacity: 0.2 };
                    return { fillColor: "#000", weight: 0.5, color: "#222", fillOpacity: 0.1 };
                },
                onEachFeature: function(f, l) {
                    const n = f.properties.name;
                    l.bindTooltip(`<div style="background:black; color:white; border:1px solid #39FF14; padding:5px;">${n.toUpperCase()}</div>`);
                }
            }).addTo(map);
        });

    // --- 3. ПОСТОЯННИ ВОЕННИ ОБЕКТИ (ПЪЛЕН СПИСЪК) ---
    const assets = [
        { name: "Mykolaiv Naval HQ", type: "naval-ua", lat: 46.96, lon: 31.99, info: "Coastal Defense" },
        { name: "Sevastopol Naval Base", type: "naval-ru", lat: 44.61, lon: 33.53, info: "Black Sea Fleet" },
        { name: "Odesa Strategic Port", type: "naval-ua", lat: 46.48, lon: 30.72, info: "Maritime Logistics" },
        { name: "Hostomel Airport", type: "airbase-ua", lat: 50.59, lon: 30.21, info: "Air Cargo Base" },
        { name: "Engels-2 Strategic", type: "airbase-ru", lat: 51.48, lon: 46.21, info: "Bomber Command" },
        { name: "Al Udeid Air Base", type: "us-hq", lat: 25.11, lon: 51.21, info: "US CENTCOM HQ" },
        { name: "Tartus Naval Base", type: "naval-ru", lat: 34.89, lon: 35.88, info: "Russian Navy" },
        { name: "Kyiv Command Center", type: "ua-hq", lat: 50.45, lon: 30.52, info: "General Staff" }
    ];

    // --- 4. CSS ЗА ДИНАМИЧНОТО РАЗПЪВАНЕ ---
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .mil-icon { display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid #fff; }
        .icon-ua { background: rgba(52, 152, 219, 0.7); } .icon-ru { background: rgba(231, 76, 60, 0.7); }
        .icon-us { background: rgba(57, 255, 20, 0.3); border-color: #39FF14; }
        .pulse-intel { animation: pulse-red 2.5s infinite; cursor: pointer; }
        @keyframes pulse-red { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.6; } 100% { transform: scale(1); opacity: 1; } }
        
        /* КЛАС ЗА ЦЕНТРАЛНО РАЗПЪВАНЕ */
        .expanded-intel {
            position: fixed !important; top: 50% !important; left: 50% !important;
            transform: translate(-50%, -50%) !important; width: 600px !important;
            height: auto !important; min-height: 250px; z-index: 10000 !important;
            background: rgba(10, 10, 10, 0.98) !important; border: 2px solid #39FF14 !important;
            box-shadow: 0 0 80px rgba(0,0,0,1) !important; padding: 0 !important;
            transition: all 0.3s ease-in-out;
        }
        .intel-entry { border-left: 2px solid #39FF14; padding: 10px; margin-bottom: 10px; cursor: pointer; background: rgba(255,255,255,0.05); }
        .intel-entry:hover { background: rgba(57, 255, 20, 0.1); }
        .close-trigger { cursor: pointer; color: #ff3131; border: 1px solid #ff3131; padding: 2px 10px; font-weight: bold; }
    `;
    document.head.appendChild(styleSheet);

    // --- 5. ФУНКЦИИ ЗА ИКОНИ ---
    function getIntelIcon(type) {
        let symbol = '⚠️'; const t = type.toLowerCase();
        if (t.includes('missile')) symbol = '🚀'; else if (t.includes('naval')) symbol = '🚢';
        else if (t.includes('clashes')) symbol = '⚔️'; else if (t.includes('drone')) symbol = '🛸';
        return L.divIcon({ html: `<div class="pulse-intel" style="font-size:32px;">${symbol}</div>`, className: '', iconSize: [40, 40] });
    }

    function getTacticalIcon(type) {
        let sym = '✈️'; let cls = 'mil-icon ';
        if (type.includes('naval')) sym = '⚓'; else if (type.includes('us')) sym = '🦅';
        if (type.includes('ua')) cls += 'icon-ua'; else if (type.includes('ru')) cls += 'icon-ru'; else cls += 'icon-us';
        return L.divIcon({ html: `<div class="${cls}" style="font-size:18px; width:34px; height:34px;">${sym}</div>`, className: '', iconSize: [34, 34] });
    }

    assets.forEach(a => L.marker([a.lat, a.lon], { icon: getTacticalIcon(a.type) }).addTo(militaryLayer).bindTooltip(a.name));

    // --- 6. ЛОГИКА ЗА РАЗПЪВАНЕ В ЦЕНТЪРА ---
    const openIntelDetails = (item) => {
        const container = document.getElementById('intel-details-container');
        const content = document.getElementById('news-content');
        
        if (container && content) {
            container.classList.add('expanded-intel');
            content.innerHTML = `
                <div style="display:flex; justify-content:space-between; background:rgba(57,255,20,0.1); padding:10px; border-bottom:1px solid #333;">
                    <span style="font-size:11px; font-weight:bold;">STRATEGIC INTEL REPORT</span>
                    <span id="close-intel-btn" class="close-trigger">CLOSE [X]</span>
                </div>
                <div style="padding:20px;">
                    <h2 style="color:#39FF14; margin:0 0 15px 0;">${item.title}</h2>
                    <p style="font-size:16px; color:#fff; line-height:1.6;">${item.description || "Sector: " + item.country + " - Gathering more data..."}</p>
                    <div style="margin:20px 0; padding:15px; border-left:4px solid #ff3131; background:rgba(255,0,0,0.05);">
                        <strong>TYPE:</strong> ${item.type.toUpperCase()} | <strong>IMPACT:</strong> ${item.fatalities}
                    </div>
                    <a href="${item.link || "#"}" target="_blank" style="display:block; background:#39FF14; color:#000; padding:12px; text-align:center; font-weight:bold; text-decoration:none; text-transform:uppercase;">Open Secure Feed</a>
                </div>
            `;

            document.getElementById('close-intel-btn').onclick = () => {
                container.classList.remove('expanded-intel');
            };
        }
        map.flyTo([item.lat, item.lon], 7);
    };

    // --- 7. СИНХРОНИЗАЦИЯ НА ИНТЕЛ КАНАЛА ---
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

// --- 8. UTC ЧАСОВНИК ---
setInterval(() => {
    const el = document.getElementById('header-time');
    if (el) el.innerText = new Date().toUTCString().split(' ')[4] + " UTC";
}, 1000);

/** КРАЙ НА СКРИПТА v10.0 **/
