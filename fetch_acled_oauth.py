import json

data = [
    {"country": "Ukraine", "date": "2024-05-20", "fatalities": 5, "type": "Explosion", "lat": 48.37, "lon": 38.01},
    {"country": "Gaza", "date": "2024-05-20", "fatalities": 12, "type": "Airstrike", "lat": 31.5, "lon": 34.4},
    {"country": "Sudan", "date": "2024-05-19", "fatalities": 3, "type": "Armed clash", "lat": 15.5, "lon": 32.5}
]

with open("conflicts.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Файлът conflicts.json е готов!")
{"country": "Bulgaria", "date": "2024-05-21", "fatalities": 0, "type": "Event", "lat": 42.69, "lon": 23.32},
