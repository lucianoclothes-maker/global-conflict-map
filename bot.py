import requests
import json
import re
from geopy.geocoders import Nominatim
import time

FEEDS = [
    "https://www.politico.eu/rss", "https://rss.cnn.com/rss/edition_world.rss",
    "http://feeds.bbci.co.uk/news/world/rss.xml", "https://www.aljazeera.com/xml/rss/all.xml",
    "https://www.theguardian.com/world/rss", "https://www.kyivpost.com/feed",
    "https://www.militarytimes.com/arc/outboundfeeds/rss/", "https://www.longwarjournal.org/feed"
]

geolocator = Nominatim(user_agent="conflict_map_final_v10")

def extract_info(text):
    t = text.lower()
    # Локации
    locations = {
        "Ukraine": ["kyiv", "kharkiv", "donetsk", "crimea", "odesa", "ukraine", "russia", "donbas"],
        "Middle East": ["gaza", "israel", "lebanon", "iran", "yemen", "tehran", "tel aviv", "beirut", "red sea", "hamas", "idf"],
        "Africa": ["sudan", "mali", "congo", "khartoum", "darfur", "somalia"]
    }
    
    # КЛЮЧОВИ ДУМИ, КОИТО ВЕЧЕ СЪВПАДАТ СЪС SCRIPT.JS
    # Добавих общи думи като 'attack' и 'killed', за да се сменят иконите по-често
    event_map = {
        "Naval": ["ship", "vessel", "navy", "sea", "maritime", "boat", "port", "water"],
        "Airstrike": ["airstrike", "missile", "rocket", "bombing", "strikes", "attack", "hit", "targeted"],
        "Explosion": ["explosion", "blast", "shelling", "artillery", "fire", "killed", "dead", "destroyed"],
        "Drone": ["drone", "uav", "shahed", "quadcopter", "air"],
        "Clashes": ["clashes", "fighting", "battle", "siege", "forces", "military", "war", "army", "offensive"]
    }

    found_city, found_region = None, "World"
    for region, cities in locations.items():
        for city in cities:
            if city in t:
                found_city, found_region = city.capitalize(), region
                break
        if found_city: break

    found_type = "Breaking News"
    for event, keywords in event_map.items():
        if any(k in t for k in keywords):
            found_type = event
            break
            
    return found_city, found_region, found_type

def run_bot():
    all_events = []
    for url in FEEDS:
        try:
            res = requests.get(url, timeout=15)
            titles = re.findall(r'<title>(.*?)</title>', res.text)
            links = re.findall(r'<link>(.*?)</link>', res.text)
            for i in range(len(titles)):
                title = titles[i].replace("<![CDATA[", "").replace("]]>", "").strip()
                if len(title) < 15: continue
                city, region, event_type = extract_info(title)
                if city:
                    try:
                        loc = geolocator.geocode(city)
                        if loc:
                            all_events.append({
                                "country": region,
                                "lat": loc.latitude, "lon": loc.longitude,
                                "date": time.strftime("%Y-%m-%d"),
                                "type": event_type, 
                                "title": title[:120],
                                "link": links[i] if i < len(links) else url
                            })
                    except: continue
        except: continue
    
    unique_events = { (e['lat'], e['lon']): e for e in all_events }.values()
    with open('conflicts.json', 'w', encoding='utf-8') as f:
        json.dump(list(unique_events), f, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    run_bot()
