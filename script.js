window.onload = function() {
    // 1. Инициализиране на картата
    var map = L.map('map', {
        worldCopyJump: true,
        minZoom: 2
    }).setView([48, 31], 5); // Центрирано към Украйна за начало

    // ОСНОВЕН СЛОЙ: Тъмен фон
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    // СЛОЙ ЗА ЕТИКЕТИ: Държави и градове
    var labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        opacity: 0.4,
        pane: 'shadowPane'
    }).addTo(map);

    // Динамичен зуум за ярки градове
    map.on('zoomend', function() {
        labels.setOpacity(map.getZoom() >= 5 ? 1 : 0.4);
    });

    function getColor(type) {
        const colors = {
            'Explosion': '#ff4d4d',
            'Airstrike': '#ffae42',
            'Armed clash': '#9d4edd',
            'News Alert': '#3388ff'
        };
        return colors[type] || '#3388ff';
    }

    // 2. ЗЕЛЕНИ ГРАНИЦИ
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(response => response.json())
        .then(geojsonData => {
            L.geoJson(geojsonData, {
                style: {
                    color: '#00ff00',
                    weight: 1,
                    opacity: 0.3,
                    fillOpacity: 0
                },
                onEachFeature: function(feature, layer) {
                    layer.on('mouseover', function() { this.setStyle({ opacity: 0.8, weight: 2 }); });
                    layer.on('mouseout', function() { this.setStyle({ opacity: 0.3, weight: 1 }); });
                }
            }).addTo(map);
        });

    // 2.1 ЛИНИЯ НА ФРОНТА (Червената линия от Liveuamap)
    fetch('https://raw.githubusercontent.com/uaminna/ukraine-war-data/main/data/frontline.geojson')
        .then(response => response.json())
        .then(frontlineData => {
            L.geoJson(frontlineData, {
                style: {
                    color: '#ff0000',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '5, 10'
                }
            }).addTo(map);
        })
        .catch(err => console.log("Фронтовата линия не е заредена."));

    // 3. ЗАРЕЖДАНЕ НА КОНФЛИКТИТЕ
    fetch('conflicts.json')
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) return;

            let totalFatalities = 0;
            let countries = new Set();

            data.forEach(point => {
                let marker = L.circleMarker([point.lat, point.lon], {
                    radius: 10,
                    fillColor: getColor(point.type),
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8,
                    className: 'pulse'
                }).addTo(map);

                marker.bindTooltip(point.country);

                marker.on('click', function(e) {
                    map.setView(e.target.getLatLng(), map.getZoom());

                    // Показваме жертви само ако са > 0
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
                            <a href="${point.link}" target="_blank" class="news-btn" style="text-decoration: none; display: block;">ПРОЧЕТИ ПЪЛНАТА НОВИНА</a>
                        </div>
                    `;
                });

                totalFatalities += (parseInt(point.fatalities) || 0);
                if (point.country) countries.add(point.country);
            });

            // Обновяване на статистиката в хедъра
            document.getElementById('active-events').innerText = `Active events: ${data.length}`;
            document.getElementById('total-fatalities').innerText = `Total fatalities: ${totalFatalities}`;
            document.getElementById('countries-affected').innerText = `Countries affected: ${countries.size}`;
            document.getElementById('last-update').innerText = `Last update: ${new Date().toLocaleDateString()} г.`;
        })
        .catch(err => {
            console.error("Грешка:", err);
            document.getElementById('news-content').innerHTML = "<p style='color:red;'>Грешка в conflicts.json!</p>";
        });

    setTimeout(function() { map.invalidateSize(); }, 800);
};
