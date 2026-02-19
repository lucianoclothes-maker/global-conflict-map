window.onload = function() {
    // 1. Инициализиране на картата
    var map = L.map('map', {
        worldCopyJump: true,
        minZoom: 2
    }).setView([20, 0], 2);

    // ОСНОВЕН СЛОЙ: Тъмен фон без надписи
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
    }).addTo(map);

    // СЛОЙ ЗА ЕТИКЕТИ: Държави и градове
    var labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        opacity: 0.4,
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

    // 2.1 ЛИНИЯ НА ФРОНТА (Украйна) - НОВ КОД
    fetch('https://raw.githubusercontent.com/uaminna/ukraine-war-data/main/data/frontline.geojson')
        .then(response => response.json())
        .then(frontlineData => {
            L.geoJson(frontlineData, {
                style: {
                    color: '#ff0000', // Червено като на Liveuamap
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '5, 10' // Прекъсната линия за военен стил
                }
            }).addTo(map);
        })
        .catch(err => console.log("Фронтовата линия не е налична в момента."));

    // 3. ЗАРЕЖДАНЕ НА КОНФЛИКТИТЕ (От твоя conflicts.json)
    fetch('conflicts.json')
        .then(response => response.json())
        .then(data => {
            if (!data) return;

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
                    // Центриране при клик
                    map.setView(e.target.getLatLng(), map.getZoom());

                    // Жертвите се показват само ако са над 0
                    let fatalitiesHTML = (point.fatalities && point.fatalities > 0) 
                        ? `<p style="font-size: 16px;">💀 <strong>Жертви:</strong> ${point.fatalities}</p>` 
                        : "";

                    // Обновяване на страничния панел
                    document.getElementById('news-content').innerHTML = `
                        <div style="border-bottom: 2px solid #444; padding-bottom: 10px; margin-bottom: 15px;">
                            <h2 style="color: #ff4d4d; margin: 0; font-size: 22px;">${point.
