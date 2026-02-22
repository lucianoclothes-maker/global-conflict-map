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


// ТУК СЛАГАШ ЗВУКОВАТА ФУНКЦИЯ
function playTacticalPing() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine'; 
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5); 

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);


      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
  } 
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
const warZones = ['Russia', 'Ukraine', 'Syria', 'Sudan'];
const blueZone = ['France', 'Germany', 'United Kingdom', 'Italy', 'Poland', 'Bulgaria', 'Romania', 'Greece', 'Norway', 'Jordan', 'Lebanon', 'Turkey', 'Saudi Arabia', 'Lithuania', 'Belarus', 'Finland', 'Sweden'];
const tensionZones = ['Iran', 'North Korea', 'China', 'Taiwan', 'Venezuela', 'USA', 'United States', 'Iraq', 'Yemen', 'Israel', 'Latvia', 'Estonia', 'Pakistan', 'Afghanistan'];

fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
    .then(res => res.json())
    .then(geoData => {
        L.geoJson(geoData, {
            style: function(feature) {
                const countryName = feature.properties.name;
                if (warZones.includes(countryName)) return { fillColor: "#ff0000", weight: 2.2, color: '#ff3333', fillOpacity: 0.3 };
                if (blueZone.includes(countryName)) return { fillColor: "#0055ff", weight: 2.0, color: '#00a2ff', fillOpacity: 0.25 };
                if (tensionZones.includes(countryName)) return { fillColor: "#ff8c00", weight: 1.8, color: '#ff8c00', fillOpacity: 0.2 };
                return { fillColor: "#000", weight: 0.6, color: "#333", fillOpacity: 0.1 };
            },
            onEachFeature: function(feature, layer) {
                const n = feature.properties.name;
                let statusText = "";
                let statusColor = "#39FF14"; // Зелено по подразбиране

                // ЛОГИКА ЗА АВТОМАТИЧЕН СТАТУС В НАДПИСА
                if (warZones.includes(n)) {
                    statusText = " - IN WAR";
                    statusColor = "#ff3131"; 
                } else if (tensionZones.includes(n)) {
                    statusText = " - CRITICAL";
                    statusColor = "#ff8c00"; 
                } else if (blueZone.includes(n)) {
                    statusText = " - MONITORING";
                    statusColor = "#00a2ff"; 
                }

                layer.bindTooltip(`
                    <div style="
                        background: #000; 
                        color: ${statusColor}; 
                        border: 2px solid #ccc; 
                        padding: 6px 10px; 
                        font-family: monospace; 
                        font-weight: bold;
                        text-transform: uppercase;
                    ">
                        ${n}${statusText}
                    </div>`, { sticky: true, offset: [0, -10] });
                
                layer.on('mouseover', function() { this.setStyle({ fillOpacity: 0.45, weight: 3 }); });
                layer.on('mouseout', function() { 
                    this.setStyle({ 
                        fillOpacity: warZones.includes(n) ? 0.3 : tensionZones.includes(n) ? 0.2 : 0.1, 
                        weight: warZones.includes(n) ? 2.2 : 0.6 
                    }); 
                });
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
        { name: "Kaliningrad HQ", type: "ru-hq", lat: 54.71, lon: 20.45 },
        { name: "Muwaffaq Salti Air Base (Jordan)", type: "us-air", lat: 31.83, lon: 36.78 },
        { name: "USS Abraham Lincoln (CVN-72) Strike Group", type: "us-naval", lat: 21.00, lon: 61.50 }, 
        { name: "USS Gerald R. Ford (CVN-78) Strike Group", type: "us-naval", lat: 35.50, lon: 15.00 },  
        { name: "USS George H.W. Bush (CVN-77)", type: "us-naval", lat: 37.00, lon: -75.00 },
        { name: "Bandar Abbas (Joint Drills)", type: "ir-pvo", lat: 27.20, lon: 56.37 },
        { name: "Qeshm Island Drone Base", type: "ir-pvo", lat: 26.72, lon: 55.95 },
        { name: "Kashan Drone Center", type: "ir-pvo", lat: 33.89, lon: 51.57 },
        { name: "Haji Abad Missile Complex", type: "ir-pvo", lat: 28.04, lon: 55.91 },
        { name: "IRIS Shahid Bagheri (Drone Carrier)", type: "ir-naval", lat: 27.00, lon: 56.10 },
        { name: "Natanz Enrichment Complex", type: "ir-pvo", lat: 33.72, lon: 51.72 },
        { name: "Fordow Underground Facility", type: "ir-pvo", lat: 34.88, lon: 50.99 },
        { name: "Arak Heavy Water Plant", type: "ir-pvo", lat: 34.37, lon: 49.24 },
        { name: "Bushehr Nuclear Plant", type: "ir-pvo", lat: 28.82, lon: 50.88 },
        { name: "Khorramabad Missile Base", type: "ir-missile", lat: 33.45, lon: 48.35 }, 
        { name: "Tabriz Missile Silos", type: "ir-missile", lat: 38.08, lon: 46.29 }, 
        { name: "Kermanshah Missile Site", type: "ir-missile", lat: 34.31, lon: 47.07 },
        { name: "Eagle 44 Underground Base", type: "ir-air", lat: 28.05, lon: 55.51 }, 
        { name: "Anarak Drone Test Range", type: "ir-air", lat: 33.32, lon: 53.70 },
        { name: "Semnan Missile Port", type: "ir-missile", lat: 35.23, lon: 53.92 },
        { name: "Shahroud Space Center", type: "ir-missile", lat: 36.42, lon: 55.01 },
        { name: "Al Dhafra Air Base (UAE)", type: "us-air", lat: 24.24, lon: 54.54 }, 
        { name: "Prince Sultan Air Base (KSA)", type: "us-air", lat: 24.06, lon: 47.58 },
        { name: "Ali Al Salem Air Base (Kuwait)", type: "us-air", lat: 29.34, lon: 47.52 },
        { name: "Camp Arifjan (Kuwait)", type: "us-naval", lat: 28.88, lon: 48.16 },
        { name: "USS McFaul (Hormuz Patrol)", type: "us-naval", lat: 26.50, lon: 56.50 }, 
        { name: "USS Delbert D. Black (Red Sea)", type: "us-naval", lat: 20.00, lon: 39.00 }, 
        { name: "Souda Bay Base (Crete)", type: "us-naval", lat: 35.48, lon: 24.14 },
        { name: "Thumrait Air Base (Oman)", type: "us-air", lat: 17.66, lon: 54.02 },
        { name: "RAF Akrotiri (Cyprus)", type: "us-air", lat: 34.59, lon: 32.98 },
        { name: "UA 3rd Assault Brigade (Avdiivka Sector)", type: "ua-infantry", lat: 48.13, lon: 37.74 },
        { name: "UA Defense Line (Kupiansk)", type: "ua-infantry", lat: 49.71, lon: 37.61 },
        { name: "UA Marine Corps (Krinky Bridgehead)", type: "ua-infantry", lat: 46.73, lon: 33.09 },
        { name: "Chasiv Yar Fortifications", type: "ua-infantry", lat: 48.58, lon: 37.83 },
        { name: "RU 1st Guards Tank Army (Lyman Direction)", type: "ru-infantry", lat: 49.01, lon: 37.99 },
        { name: "RU Assault Units (Bakhmut Sector)", type: "ru-infantry", lat: 48.59, lon: 38.00 },
        { name: "RU 58th Army (Robotyne Front)", type: "ru-infantry", lat: 47.44, lon: 35.83 },
        { name: "Donetsk Grouping", type: "ru-infantry", lat: 47.99, lon: 37.67 },
        { name: "Tower 22 (US Logistics Hub)", type: "us-air", lat: 33.31, lon: 38.70 },
        { name: "USS Carney (Destroyer - Red Sea)", type: "us-naval", lat: 15.50, lon: 41.20 },
        { name: "Nevatim Airbase (Israel F-35)", type: "us-air", lat: 31.20, lon: 35.01 },
        { name: "Machulishchy Air Base (RU-BY)", type: "ru-air", lat: 53.7741, lon: 27.5776 },
        { name: "Baranovichi Air Base (RU-BY)", type: "ru-air", lat: 53.1167, lon: 26.0494 },
        { name: "Luninets Air Base", type: "ru-air", lat: 52.2748, lon: 26.7863 },
        { name: "Lida Air Base", type: "ru-air", lat: 53.8824, lon: 25.3023 },
        { name: "Zyabrovka Missile Site", type: "ru-missile", lat: 52.3082, lon: 31.1627 },
        { name: "Brest Training Ground", type: "ru-infantry", lat: 52.0977, lon: 23.6877 },
        { name: "Gomel Logistics Hub", type: "ru-infantry", lat: 52.4345, lon: 30.9754 }
    ];
// --- СЕКЦИЯ: ВРЕДНИ ЗОНИ (ОБХВАТ НА УДАР) ---
strategicAssets.forEach(asset => {
    // Проверяваме за ирански ядрени и ракетни обекти
    if (asset.type === 'ir-pvo' || asset.type === 'ir-missile' || asset.type === 'ir-air') {
        L.circle([asset.lat, asset.lon], {
            color: '#ff4444',      // Червен контур
            fillColor: '#ff4444',  // Червено запълване
            fillOpacity: 0.1,     // Много прозрачно, за да не пречи
            radius: 80000          // 80 км обхват (можеш да го промениш)
        }).addTo(map);
    }
});
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
    let symbol = '⚪'; // Символ по подразбиране
    let styleClass = 'mil-icon-box ';

    // 1. ПРОВЕРКА ЗА ПЕХОТА (ВОЙНИЦИ)
    if (type === 'ua-infantry') {
        symbol = '⚔';
        styleClass += 'icon-us-nato'; // Синьо/Зелено за Украйна
    } 
    else if (type === 'ru-infantry') {
        symbol = '⚔';
        styleClass += 'icon-ru-ua'; // Червено за Русия
    }
    // 2. ПРОВЕРКА ЗА ИРАНСКИ СПЕЦИАЛНИ ОБЕКТИ
    else if (type === 'ir-nuclear') {
        symbol = '☢️';
        styleClass += 'icon-iran-tension';
    } 
    else if (type === 'ir-missile') {
        symbol = '🚀';
        styleClass += 'icon-iran-tension';
    }
    // 3. ПРОВЕРКА ЗА ВЪЗДУШНИ И МОРСКИ БАЗИ
    else if (type.includes('naval')) {
        symbol = '⚓';
        styleClass += (type.startsWith('us-')) ? 'icon-us-nato' : 'icon-ru-ua';
    } 
    else if (type.includes('air')) {
        symbol = '🦅';
        styleClass += (type.startsWith('us-')) ? 'icon-us-nato' : 'icon-iran-tension';
    }

    return L.divIcon({
        html: `<div class="${styleClass}" style="font-size:18px; display:flex; align-items:center; justify-content:center;">${symbol}</div>`,
        iconSize: [32, 32]
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

   // --- ОБНОВЕНА СЕКЦИЯ СЪС СИСТЕМЕН ЗВУК (Auto-Alert при всяка нова новина) ---
if (data.length > 0 && data[0].title !== globalLastEventTitle) {
    
    // Премахнахме проверката за 'critical', за да чуваш сигнал винаги
    playTacticalPing(); 
    
    // Обновяваме последното заглавие, за да не свири повторно за същата новина
    globalLastEventTitle = data[0].title;
}


   // --- ОБНОВЕНА СЕКЦИЯ 7: ОБРАБОТКА НА НОВИНИТЕ С ЦВЕТОВЕ И ИКОНИ ---
    data.forEach(item => {
        // 1. Избор на символ (Emoji) според типа на събитието
        let iconSymbol = '⚠️'; 
        if (item.type === "Nuclear" || item.type === "Airstrike") iconSymbol = '🚀';
        else if (item.type === "Drone") iconSymbol = '🛸';
        else if (item.type === "Evacuation") iconSymbol = '🚨';
        else if (item.type === "Clashes") iconSymbol = '⚔️';

        // 2. Дефиниране на филтър за цвят (светещ ефект) според опасността
        let statusFilter = "";
        let severityLabel = item.severity || (item.critical ? 'critical' : 'normal');

        if (severityLabel === 'critical') {
            statusFilter = "drop-shadow(0 0 12px #ff3131)"; // Силно червено
        } else if (severityLabel === 'middle') {
            statusFilter = "drop-shadow(0 0 10px #ff8c00) sepia(1) hue-rotate(-50deg)"; // Оранжево
        } else {
            statusFilter = "drop-shadow(0 0 5px #00a2ff) grayscale(0.4)"; // Синьо/Сиво
        }

        // 3. Създаване на маркера върху картата
        const marker = L.marker([item.lat, item.lon], { 
            icon: L.divIcon({ 
                html: `<div class="alert-pulse" style="font-size:38px; filter: ${statusFilter};">${iconSymbol}</div>`, 
                iconSize: [45, 45] 
            }) 
        }).addTo(markersLayer);

        marker.on('click', () => showIntelDetails(item));

        // 4. Добавяне в страничния списък (Sidebar) с динамичен цвят на текста
        if (sidebar) {
            const entry = document.createElement('div');
            entry.className = 'intel-list-item';
            
            // Определяме цвета на заглавието в списъка
            let titleColor = (severityLabel === 'critical') ? '#ff3131' : (severityLabel === 'middle' ? '#ff8c00' : '#39FF14');
            
            entry.innerHTML = `
                <small style="color:#888;">[${item.date}]</small><br>
                <strong style="color:${titleColor};">${item.title}</strong>
            `;
            entry.onclick = () => showIntelDetails(item);
            sidebar.appendChild(entry);
        }
    });

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

// 354 | 1. Добавяме памет за броя събития (извън функцията)
let lastCount = 0; 

function updateDashboardStats() {
    fetch('conflicts.json?v=' + Date.now())
        .then(response => response.json())
        .then(data => {
            const count = data.length; // Взема реалния брой новини
            
            // 2. ПРОВЕРКА ЗА ЗВУК: Използвай !== за правилна проверка
            if (count > lastCount && lastCount !== 0) {
                playTacticalPing(); 
            }
            lastCount = count; 

            // Обновява числото в хедъра
            const eventCounter = document.getElementById('active-events');
            if (eventCounter) {
                eventCounter.innerText = count;
            }

            // Автоматична промяна на THREAT LEVEL
            const threatLevel = document.querySelector('header span[style*="#ff3131"]');
            if (threatLevel) {
                if (count > 71) {
                    threatLevel.innerText = "CRITICAL";
                    threatLevel.style.textShadow = "0 0 10px #ff3131";
                } else if (count > 40) {
                    threatLevel.innerText = "ELEVATED";
                    threatLevel.style.textShadow = "none";
                } else {
                    threatLevel.innerText = "LOW";
                    threatLevel.style.color = "#39FF14";
                    threatLevel.style.textShadow = "none";
                }
            }
        })
        .catch(err => console.error("Грешка при статистиката:", err));
}

// --- ИЗВИКВАНЕ НА ФУНКЦИИТЕ ---

// 1. Първоначално зареждане при пускане на сайта
updateDashboardStats();
syncTacticalData();

// 2. Автоматично обновяване на всеки 30 секунди
setInterval(() => {
    console.log("Системата се обновява..."); // За да виждаш в F12, че работи
    updateDashboardStats(); 
    syncTacticalData();     
}, 30000);

