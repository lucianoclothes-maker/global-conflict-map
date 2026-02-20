window.onload = function() {

    // --- 1. ИНИЦИАЛИЗИРАНЕ НА КАРТАТА ---
    // Настройваме изгледа да обхваща Украйна и Близкия Изток
    var map = L.map('map', {
        worldCopyJump: true,
        minZoom: 2
    }).setView([35.0, 30.0], 4); 

    // Основен тъмен слой
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    // Слой с етикети на държавите
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        opacity: 0.6,
        pane: 'shadowPane'
    }).addTo(map);


    // --- 2. ДЕФИНИРАНЕ НА ВОЕННИ ИКОНИ (С FIX ПРОТИВ КЕШИРАНЕ) ---
    // Добавяме ?time= + дата, за да изхвърлим "везните" и "книгите" от паметта на браузъра
    var cb = "?t=" + new Date().getTime();
    
    const iconClash = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3532/3532247.png' + cb,
        iconSize: [32, 32], 
        iconAnchor: [16, 16]
    });

    const iconShip = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2893/2893603.png' + cb,
        iconSize: [36, 36], 
        iconAnchor: [18, 18]
    });

    const iconExplosion = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/595/595067.png' + cb,
        iconSize: [32, 32], 
        iconAnchor: [16, 16]
    });

    const iconAlert = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/179/179386.png' + cb,
        iconSize: [28, 28], 
        iconAnchor: [14, 14]
    });


    // --- 3. ФУНКЦИЯ ЗА ОПРЕДЕЛЯНЕ НА ИКОНАТА ---
    function getTacticalIcon(type) {
        // Проверка за Самолетоносач (от твоя JSON)
        if (type === 'Carrier' || type === 'Warship') {
            return iconShip;
        }
        // Проверка за Въоръжен сблъсък
        if (type === 'Armed clash') {
            return iconClash;
        }
        // Проверка за Експлозии
        if (type === 'Explosion' || type === 'Airstrike') {
            return iconExplosion;
        }
        // Всичко останало
        return iconAlert;
    }


    // --- 4. ЗЕЛЕНИ ГРАНИЦИ НА ДЪРЖАВИТЕ ---
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(res => res.json())
        .then(data => {
            L.geoJson(data, {
                style: { color: '#00ff00', weight: 1, opacity: 0.2, fillOpacity: 0 },
                onEachFeature: function(feature, layer) {
                    layer.on('mouseover', function() { this.setStyle({ opacity: 0.7, weight: 2 }); });
                    layer.on('mouseout', function() { this.setStyle({ opacity: 0.2, weight: 1 }); });
                }
            }).addTo(map);
        });


    // --- 5. ТАКТИЧЕСКИ ЕЛЕМЕНТИ (Украйна) ---
    var frontLine = [[46.5, 32.3], [46.8, 33.5], [47.5, 35.3], [48.0, 37.6], [48.6, 38.0], [49.5, 38.0], [50.1, 37.8]];
    L.polyline(frontLine, { color: '#ff0000', weight: 4, opacity: 0.8, dashArray: '10, 15' }).addTo(map);

    var occupation = [[46.0, 33.0], [46.8, 34.5], [47.2, 37.8], [48.5, 39.5], [50.0, 38.5], [50.0, 40.0], [44.0, 40.0], [44.0, 33.0]];
    L.polygon(occupation, { color: '#ff0000', fillColor: '#ff0000', fillOpacity: 0.12, weight: 1 }).addTo(map);


    // --- 6. ЗАРЕЖДАНЕ НА JSON ДАННИТЕ ---
    fetch('conflicts.json')
        .then(res => res.json())
        .then(data => {
            let totalDeaths = 0;
            let countriesAffected = new Set();

            data.forEach(point => {
                // Използваме функцията, за да сложим правилната икона
                let marker = L.marker([point.lat, point.lon], { 
                    icon: getTacticalIcon(point.type) 
                }).addTo(map);
                
                marker.bindTooltip(`<b>${point.country}</b>`);

                marker.on('click', function() {
                    map.setView([point.lat, point.lon], 6, { animate: true });
                    
                    let fatalitiesText = (point.fatalities > 0) ? `<p style="color:#ff4d4d; font-size:18px;">💀 Жертви: ${point.fatalities}</p>` : "";
                    
                    document.getElementById('news-content').innerHTML = `
                        <div style="border-bottom: 2px solid #444; padding-bottom: 10px; margin-bottom: 15px;">
                            <h2 style="color: #ff4d4d; margin: 0;">${point.country}</h2>
                            <small style="color: #aaa;">${point.date} | ${point.type}</small>
                        </div>
                        <div style="background: #111; padding: 15px; border-radius: 8px; border-left: 5px solid #ff4d4d;">
                            <p style="color: #fff; line-height: 1.5;">${point.title}</p>
                        </div>
                        <div style="margin-top: 20px;">
                            ${fatalitiesText}
                            <a href="${point.link}" target="_blank" class="news-btn" style="display: block; text-align: center; text-decoration: none;">ПРОЧЕТИ ПОВЕЧЕ</a>
                        </div>
                    `;
                });

                totalDeaths += (parseInt(point.fatalities) || 0);
                countriesAffected.add(point.country);
            });

            // Статистическо табло
            document.getElementById('active-events').innerText = "Active events: " + data.length;
            document.getElementById('total-fatalities').innerText = "Total fatalities: " + totalDeaths;
            document.getElementById('countries-affected').innerText = "Countries affected: " + countriesAffected.size;
            document.getElementById('last-update').innerText = "Last update: " + new Date().toLocaleDateString();
        })
        .catch(err => console.error("Грешка при четене на JSON:", err));

    setTimeout(function() { map.invalidateSize(); }, 600);
};
