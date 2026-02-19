var map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Функция за цветовете спрямо типа събитие
function getColor(type) {
    return type === 'Explosion' ? '#f03' :
           type === 'Airstrike' ? '#ff7800' :
           type === 'Armed clash' ? '#7a0177' :
                                    '#3388ff';
}

fetch('conflicts.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(point => {
            // Рисуваме цветно кръгче вместо синя иконка
            L.circleMarker([point.lat, point.lon], {
                radius: 10,
                fillColor: getColor(point.type),
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(map)
            .bindPopup(`<b>${point.country}</b><br>${point.type}<br>Fatalities: ${point.fatalities}`);
        });
    });

// Добавяне на легендата в ъгъла
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend'),
        types = ['Explosion', 'Airstrike', 'Armed clash', 'Other'];
    
    div.innerHTML = '<b style="color: black;">Тип събитие</b><br>';
    for (var i = 0; i < types.length; i++) {
        div.innerHTML += '<i style="background:' + getColor(types[i]) + '"></i> ' + 
                         '<span style="color: black;">' + types[i] + '</span><br>';
    }
    return div;
};
legend.addTo(map);
