import requests
import json
import re
from geopy.geocoders import Nominatim
import time

# 1. Списък с медии
FEEDS = [
    "https://www.politico.eu/rss", "https://rss.cnn.com/rss/edition_world.rss",
    "http://feeds.bbci.co.uk/news/world/rss.xml", "https://www.aljazeera.com/xml/rss/all.xml",
    "https://www.theguardian.com/world/rss", "https://www.kyivpost.com/feed",
    "https://www.militarytimes.com/arc/outboundfeeds/rss/", "https://www.longwarjournal.org/feed"
]

geolocator = Nominatim(user_agent="global_conflict_monitor_v6")

# --- ТУК Е НОВИЯТ КОД ---
def extract_info(text):
    # Локации
    locations = {
        "Ukraine": ["Kyiv", "Kharkiv", "Donetsk", "Crimea", "Odesa", "Kursk", "Ukraine", "Russia"],
        "Middle East": ["Gaza", "Israel", "Lebanon", "Iran", "Yemen", "Rafah", "Tehran", "Tel Aviv"],
        "Africa": ["Sudan", "Mali", "Congo", "Khartoum"]
    }
    
    # Ключови думи за ИКОНКИ
    event_map = {
        "Airstrike": ["airstrike", "missile", "rocket", "bombing", "strikes"],
        "Explosion": ["explosion", "blast", "shelling", "artillery", "pounding"],
        "Naval": ["ship", "vessel", "navy", "sea", "maritime", "boat", "crossing"],
        "Drone": ["drone", "uav", "shahed"],
        "Clashes": ["clashes", "fighting", "battle", "infantry", "siege"]
    }

    found_city = None
    found_region = "World"
    for region, cities in locations.items():
        for city in cities:
            if city.lower() in text.lower():
                found_city, found_region = city, region

    found_type = "Breaking News"
    for event, keywords in event_map.items():
        if any(k in text.lower() for k in keywords):
            found_type = event
            break
            
    return found_city, found_region, found_type
# ------------------------

def run_bot():
    all_events = []
    print(f"🌍 Стартирам мониторинг с икони...")

    for url in FEEDS:
        try:
            response = requests.get(url, timeout=15)
            titles = re.findall(r'<title>(.*?)</title>', response.text)
            links = re.findall(r'<link>(.*?)</link>', response.text)
            
            for i in range(len(titles)):
                title = titles[i].replace("<![CDATA[", "").replace("]]>", "")
                
                # ИЗПОЛЗВАМЕ НОВАТА ФУНКЦИЯ ТУК
                city, region, event_type = extract_info(title)
                
                if city:
                    location = geolocator.geocode(city)
                    if location:
                        all_events.append({
                            "country": region,
                            "lat": location.latitude,
                            "lon": location.longitude,
                            "date": time.strftime("%Y-%m-%d"),
                            "type": event_type, # Вече записва конкретния тип (Naval, Drone и т.н.)
                            "title": title[:110],
                            "link": links[i] if i < len(links) else url
                        })
        except: continue
    
    unique_events = { (e['lat'], e['lon']): e for e in all_events }.values()
    with open('conflicts.json', 'w', encoding='utf-8') as f:
        json.dump(list(unique_events), f, indent=4, ensure_ascii=False)
    
    print(f"✅ Готово! Намерих {len(unique_events)} събития с категории.")

if __name__ == "__main__":
    run_bot()
