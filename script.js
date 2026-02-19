window.onload = function() {
    // 1. Инициализиране на картата
    var map = L.map('map', {
        worldCopyJump: true,
        minZoom: 2
    }).setView([20, 0], 2);

    // ОСНОВЕН СЛОЙ: Тъмен фон без никакви надписи (за да не се дублират)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    // НОВО: СЛОЙ ЗА ЕТИКЕТИ (Държави и градове)
    // Тези етикети ще бъдат прозрачни в началото и ярко бели при приближаване
    var labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        opacity: 0.5,
        pane: 'shadowPane' // Слагаме ги над границите, но под точките
    }).addTo(map);

    // 2. ДИНАМИЧЕН ЗУУМ: Градовете светват в ярко бяло при приближаване
    map.on('zoomend', function() {
        var zoom = map.getZoom();
        if (zoom >= 5) {
            labels.setOpacity(1); // Ярко бяло
        } else {
            labels.setOpacity(0.5); // По-бледо
        }
    });

    // 3. ЗЕЛЕНИ ГРАНИЦИ С ИНТЕРАКТИВНОСТ
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(response => response.json())
        .then(geojsonData => {
            L.geoJson(geojsonData, {
                style: {
                    color: '#00ff00',
                    weight: 1,
                    opacity: 0.3,
                    fillOpacity: 0.02 // Много леко запълване за по-лесно посочване
                },
                onEachFeature: function(feature, layer) {
                    // Когато мишката е над държава - границите светват
                    layer.on('mouseover', function() {
                        this.setStyle({ opacity: 0.8, weight: 2 });
                    });
                    layer.on('mouseout', function() {
                        this.setStyle({ opacity: 0.3, weight: 1 });
                    });
                }
            }).addTo(map);
        })
        .catch(err => console.log("Границите се бавят..."));

    // 4. Функция за цветовете
    function getColor(type) {
        const colors = {
            'Explosion': '#ff4d4d',
            'Airstrike': '#ffae42',
            'Armed clash': '#9d4edd',
            'News Alert': '#3388ff'
        };
        return colors[type] || '#3388ff';
    }

    // 5. Зареждане на новините
    fetch('conflicts.json')
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) return;

            let totalFatalities = 0;
            let countries = new Set();

            data.forEach(point => {
                // СЪЗДАВАНЕ НА ПУЛСИРАЩ МАРКЕР
                // className: 'pulse' свързва маркера с CSS анимацията
                let marker = L.circleMarker([point.lat, point.lon], {
                    radius: 10,
                    fillColor: getColor(point.type),
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8,
                    className: 'pulse' 
                }).addTo(map);

                // Добавяме малко балонче с името на държавата при посочване
                marker.bindTooltip(point.country, { permanent: false, direction: 'top' });

                marker.on('click', function() {
                    document.getElementById('news-content').innerHTML = `
                        <div style="padding-top: 10px; border-bottom: 2px solid #444; padding-bottom: 10px; margin-bottom: 15px;">
                            <h2 style="color: #ff4d4d; margin: 0; text-transform: uppercase;">${point.country}</h2>
                            <small style="color: #aaa;">${point.date} | ТИП: ${point.type}</small>
                        </div>
                        <div style="background: #222; padding: 20px; border-radius: 10px; border-left: 5px solid ${getColor(point.type)}; box-shadow: 0 0 15px rgba(0,0,0,0.5);">
                            <p style="font-size: 1.1em; line-height: 1.6; margin: 0; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                ${point.title}
                            </p>
                        </div>
                        <div style="margin-top: 25px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 5px;">
                            <p style="color: #ff4d4d; font-size: 1.2em; margin: 0;">💀 <strong>Жертви:</strong> ${point.fatalities}</p>
                            <br>
