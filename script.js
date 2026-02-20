window.onload = function() {
    // 1. Инициализиране на картата
    var map = L.map('map', {
        worldCopyJump: true,
        minZoom: 2
    }).setView([48.3, 35.5], 5); // Фокус върху Украйна при зареждане

    // ОСНОВЕН СЛОЙ: Тъмен фон
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    // СЛОЙ ЗА ЕТИКЕТИ: Държави и градове
    var labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        opacity: 0.6,
        pane: 'shadowPane'
    }).addTo(map);

    function getColor(type) {
        const colors = {
            'Explosion': '#ff4d4d',
            'Airstrike': '#ffae42',
            'Armed clash': '#9d4edd',
            'News Alert': '#3388ff'
        };
        return colors[type] || '#3388ff';
    }

    // 2. ЗЕЛЕНИ ГРАНИЦИ (Държави)
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(response => response.json())
        .then(geojsonData => {
            L.geoJson(geojsonData, {
                style: { color: '#00ff00', weight: 1, opacity: 0.3, fillOpacity: 0 }
            }).addTo(map);
        });

    // --- НОВО: ЛИНИЯ НА ФРОНТА И ОКУПИРАНИ ЗОНИ (Директно в кода) ---
    
    // Координати за фронтовата линия (през ключови точки)
    var frontLineCoords = [
        [46.5, 32.3], [46.8, 33.5], [47.5, 35.3], [48.0, 37.6], 
        [48.6, 38.0], [49.5, 38.0], [50.1, 37.8]
    ];
    
    // Червена прекъсната линия (Tactical Line)
    L.polyline(frontLineCoords, {
        color: '#ff0000',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 12'
    }).addTo(map).bindTooltip("АКТИВЕН ФРОНТ");

    // Червена зона (Окупирана територия - Крим и Донбас)
    var occupationZone = [
        [46.0, 33.0], [46.8, 34.5], [47.2, 37.8], [48.5, 39.5], 
        [50.0, 38.5], [50.0, 40.0], [44.0, 40.0], [44.0, 33.0]
    ];
    
    L.polygon(occupationZone, {
        color: 'red',
        fillColor: '#ff0000',
        fillOpacity: 0.15, // Бледо червено фоново оцветяване
        weight: 1
    }).addTo(map);

    // -----------------------------------------------------------

    // 3. ЗАРЕЖДАНЕ НА КОНФЛИКТИТЕ (conflicts.json)
    fetch('conflicts.json')
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) return;

            let totalFatalities = 0;
            let countries = new Set();

            data.forEach(point => {
                let marker = L.circleMarker([point.lat, point.lon], {
                    radius: 12, // Малко по-големи точки за видимост
                    fillColor: getColor(point.type),
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9,
                    className: 'pulse'
                }).addTo(map);

                marker.bindTooltip(point.country);

                marker.on('click', function(e) {
                    map.setView(e.target.getLatLng(), 6);

                    let fatalitiesHTML = (point.fatalities && point.fatalities > 0) 
                        ? `<p style="font-size: 16px; color: #eee; margin: 10px 0;">💀 <strong>Жертви:</strong> ${point.fatalities}</p>` 
                        : "";

                    document.getElementById('news-content').innerHTML = `
                        <div style="border-bottom: 2px solid #444; padding-bottom: 10px; margin-bottom: 15px;">
                            <h2 style="color: #ff4d4d; margin: 0; font-size: 22px;">${point.country}</h2>
                            <small style="color: #aaa;">${point.date} | ${point.type}</small>
                        </div>
                        <div style="background: #222; padding: 15px; border-radius: 8px; border-left: 5px solid ${getColor(point.type)};">
                            <p style="color: #fff; margin: 0; font-size: 15px; line-height: 1.5;">${point.title}</p>
                        </div>
                        <div style="margin-top: 20px;">
                            ${fatalitiesHTML}
                            <a href="${point.link}" target="_blank" class="news-btn" style="text-decoration: none; display: block; text-align: center;">ПРОЧЕТИ ПЪЛНАТА НОВИНА</a>
                        </div>
                    `;
                });

                totalFatalities += (parseInt(point.fatalities) || 0);
                if (point.country) countries.add(point.country);
            });

            document.getElementById('active-events').innerText = `Active events: ${data.length}`;
            document.getElementById('total-fatalities').innerText = `Total fatalities: ${totalFatalities}`;
            document.getElementById('countries-affected').innerText = `Countries affected: ${countries.size}`;
            document.getElementById('last-update').innerText = `Last update: ${new Date().toLocaleDateString()} г.`;
        })
        .catch(err => {
            console.error("Грешка:", err);
            document.getElementById('news-content').innerHTML = "<p style='color:red;'>Провери conflicts.json за грешки!</p>";
        });

    setTimeout(function() { map.invalidateSize(); }, 500);
};
