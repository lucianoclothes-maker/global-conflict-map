/**
 * =============================================================================
 * GLOBAL CONFLICT DASHBOARD v5.0 - STRATEGIC COMMAND
 * =============================================================================
 * ОБЕКТ: Фикс на "постен" JSON + Котви + Външни линкове без рефреш.
 * ДАТА НА ВАЛИДАЦИЯ: 2026-02-21
 * =============================================================================
 */

window.onload = function() {
    
    // --- 1. ИНИЦИАЛИЗАЦИЯ НА КАРТАТА ---
    // Настройваме центъра към горещите точки (Украйна/Близък Изток)
    const map = L.map('map', {
        worldCopyJump: true,
        zoomControl: true,
        attributionControl: false,
        zoomSnap: 0.5
    }).setView([35.0, 20.0], 4); 

    const markersLayer = L.layerGroup().addTo(map);   
    const militaryLayer = L.layerGroup().addTo(map);  

    // ТЪМЕН ТАКТИЧЕСКИ СЛОЙ
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        minZoom: 2
    }).addTo(map);

    // --- 2. ГЕОПОЛИТИЧЕСКИ ЗОНИ И КАТЕГОРИИ (image_3fefd9.png) ---
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

    // --- 3. ПОСТОЯННИ ВОЕННИ ОБЕКТИ (КОТВИТЕ СА ТУК - image_3ffde6.jpg) ---
    const militaryAssets = [
        { name: "Mykolaiv Naval HQ", type: "naval-ua", lat: 46.96, lon: 31.99, info: "Coastal Defense" },
        { name: "Sevastopol Naval Base", type: "naval-ru", lat: 44.61, lon: 33.53, info: "Black Sea Fleet" },
        { name: "Odesa Strategic Port", type: "naval-ua", lat: 46.48, lon: 30.72, info: "Maritime Logistics" },
        { name: "Hostomel Airport", type: "airbase-ua", lat: 50.59, lon: 30.21, info: "Air Cargo Base" },
        { name: "Engels-2 Strategic", type: "airbase-ru", lat: 51.48, lon: 46.21, info: "Bomber Command" },
        { name: "Al Udeid Air Base", type: "us-hq", lat: 25.11, lon: 51.21, info: "US CENTCOM HQ" }
    ];

    // --- 4. КРИТИЧЕН CSS (image_4054d9.jpg & image_406058.png) ---
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .mil-icon { display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.7); }
        .icon-ua { background: rgba(52, 152, 219, 0.4); color: #3498db; }
        .icon-ru { background: rgba(231, 76, 60, 0.4); color: #e74c3c; }
        .icon-us { background: rgba(57, 255, 20, 0.2); color: #39FF14; border: 2px solid #39FF14; }
        
        .read-more-btn { 
            display: inline-block !important; 
            margin-top: 15px !important; 
            padding: 12px 24px !important; 
            background: #39FF14 !important; 
            color: #000 !important; 
            font-weight: bold !important; 
            text-decoration: none !important; 
            border-radius: 4px; 
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            box-shadow: 0 4px 10px rgba(57, 255, 20, 0.4);
            cursor: pointer;
            transition: 0.3s;
        }
        .read-more-btn:hover { background: #fff !important; box-shadow: 0 0 20px #39FF14; transform: scale(1.05); }
        .pulse-intel { animation: pulse-red 2.5s infinite; }
        @keyframes pulse-red { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    `;
    document.head.appendChild(styleSheet);

    // --- 5. ФУНКЦИЯ ЗА СИМВОЛИ (КОТВИ/САМОЛЕТИ) ---
    function getTacticalIcon(type) {
        let sym = '✈️'; 
        let cls = 'mil-icon ';
        if (type.includes('naval')) sym = '⚓';
        else if (type.includes('us')) sym = '🦅';
        
        if (type.includes('ua')) cls += 'icon-ua';
        else if (type.includes('ru')) cls += 'icon-ru';
        else if (type.includes('us')) cls += 'icon-us';
        
        return L.divIcon({
            html: `<div class="${cls}" style="font-size:20px; width:36px; height:36px;">${sym}</div>`,
            className: '', iconSize: [36, 36]
        });
    }

    militaryAssets.forEach(a => {
        L.marker([a.lat, a.lon], { icon: getTacticalIcon(a.type) }).addTo(militaryLayer)
            .bindTooltip(`<b>${a.name}</b><br>INTEL: ${a.info}`);
    });

    // --- 6. ОБРАБОТКА НА "ПОСТНИЯ" JSON И ФИКС НА ЛИНКОВЕТЕ ---
    function syncIntel() {
        fetch('conflicts.json?cache=' + Date.now())
            .then(res => res.json())
            .then(data => {
                markersLayer.clearLayers();
                data.forEach(item => {
                    const icon = L.divIcon({
                        html: `<div class="pulse-intel" style="color:#ff4d4d; font-size:24px; text-shadow:0 0 10px red;">●</div>`,
                        className: '', iconSize: [25, 25]
                    });
                    
                    L.marker([item.lat, item.lon], { icon: icon }).addTo(markersLayer)
                        .on('click', () => {
                            const panel = document.getElementById('news-content');
                            if(panel) {
                                // ПРЕДОТВРАТЯВАНЕ НА РЕФРЕШ: Използваме target="_blank" и абсолютен URL
                                // Твоят JSON ползва "link", затова го поправяме тук:
                                const finalUrl = item.link || item.url || "#";
                                
                                panel.innerHTML = `
                                    <div style="border-left: 4px solid #39FF14; padding-left: 15px;">
                                        <h3 style="color:#39FF14; text-transform:uppercase; margin-bottom:10px;">${item.title}</h3>
                                        <p style="color:#bbb; font-size:14px; line-height:1.5;">
                                            ${item.description || "No additional intel provided. Monitoring situation in " + item.country + "."}
                                        </p>
                                        <div style="margin: 10px 0; color:#ff4d4d; font-family:monospace;">
                                            <strong>TYPE:</strong> ${item.type} | <strong>FATALITIES:</strong> ${item.fatalities}
                                        </div>
                                        <div style="font-size:11px; color:#666;">DATE: ${item.date} UTC</div>
                                        <a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="read-more-btn">READ FULL REPORT »</a>
                                    </div>
                                `;
                            }
                        });
                });
            }).catch(err => console.error("INTEL ERROR: JSON format mismatch."));
    }
function refreshTelegram() {
    const container = document.querySelector('.telegram-feed-container');
    if (container) {
        // Вземаме всички скриптове вътре
        const scripts = container.querySelectorAll('script');
        const scriptData = Array.from(scripts).map(s => ({
            src: s.src,
            post: s.getAttribute('data-telegram-post'),
            width: s.getAttribute('data-width'),
            dark: s.getAttribute('data-dark')
        }));

        container.innerHTML = ''; // Чистим всичко

        // Наливаме ги наново един по един
        scriptData.forEach(data => {
            const newScript = document.createElement('script');
            newScript.async = true;
            newScript.src = data.src;
            newScript.setAttribute('data-telegram-post', data.post);
            newScript.setAttribute('data-width', data.width);
            newScript.setAttribute('data-dark', data.dark);
            container.appendChild(newScript);
        });
        console.log("Tactical Telegram Intel: Full Reload Complete.");
    }
}
};

// --- 7. UTC ТАКТИЧЕСКИ ЧАСОВНИК ---
setInterval(() => {
    const el = document.getElementById('header-time');
    if (el) {
        const d = new Date();
        el.innerText = d.getUTCHours().toString().padStart(2, '0') + ":" + 
                      d.getUTCMinutes().toString().padStart(2, '0') + ":" + 
                      d.getUTCSeconds().toString().padStart(2, '0') + " UTC";
    }
}, 1000);

/**
 * КРАЙ НА СТРАТЕГИЧЕСКИЯ КОД - 255 РЕДА.
 * ВСИЧКИ СИСТЕМИ СА ОПТИМИЗИРАНИ ЗА JSON ОБМЕН.
 */
