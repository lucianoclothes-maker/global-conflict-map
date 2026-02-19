import feedparser
import json
from geopy.geocoders import Nominatim
import time

# Списък с източници (ReliefWeb и Politico)
SOURCES = [
    "https://reliefweb.int/updates/rss.xml",
    "https://www.politico.eu/rss-source/defense/" # Секцията за отбрана и конфликти на Politico
]

geolocator = Nominatim(user_agent="politico_conflict_tracker")

def fetch_news():
    new_data = []
    hotspots = ["Ukraine", "Russia", "Sudan", "Gaza", "Israel", "Syria", "Yemen", "Congo", "Myanmar", "Taiwan", "Iran"]

    for url in SOURCES:
        feed = feedparser.parse(url)
        print(f"Проверка на източник: {url}")

        for entry in feed.entries[:15]:
            title = entry.title
            found_country = None
            
            for country in hotspots:
                if country.lower() in title.lower():
                    found_country = country
                    break
            
            if found_country:
                location = geolocator.geocode(found_country)
                if location:
                    # Разпознаваме дали новината е от Politico за по-интересен Popup
                    source_name = "Politico" if "politico" in url else "ReliefWeb"
                    
                    new_data.append({
                        "country": found_country,
                        "date": time.strftime("%Y-%m-%d"),
                        "fatalities": 10,
                        "type": "News Alert",
                        "lat": location.latitude,
                        "lon": location.longitude,
                        "title": f"[{source_name}] {title[:80]}..."
                    })

    # Защита: ако няма новини, връщаме примерни данни
    if not new_data:
        new_data = [{"country": "Global", "date": "2026-02-20", "fatalities": 0, "type": "Other", "lat": 20, "lon": 0, "title": "No news found"}]

    with open('conflicts.json', 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=4)

if __name__ == "__main__":
    fetch_news()

if __name__ == "__main__":
    fetch_news()
