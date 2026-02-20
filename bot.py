import requests
import json
import re
from geopy.geocoders import Nominatim
import time

# 1. По-стабилни портали
INSTANCES = ["https://nitter.net", "https://nitter.cz", "https://nitter.privacydev.net", "https://nitter.poast.org"]

# 2. 10 ТОП OSINT Акаунта
SOURCES = [
    "OSINTtechnical", "DeepStateUA", "UAWeapons", "Liveuamap", 
    "IAPonomarenko", "war_noir", "EuromaidanPress", "Gerashchenko_en",
    "clashreport", "Tendar"
]

# 3. Речник на конфликта
KEYWORDS = ["shelling", "explosion", "airstrike", "himars", "drone", "missile", "clashes", "fire", "attack", "destroyed"]
OBJECTS = ["bridge", "airfield", "plant", "refinery", "dam", "warehouse", "base"]

geolocator = Nominatim(user_agent="advanced_war_tracker_v3")

def get_latest_tweet(username):
    for instance in INSTANCES:
        url = f"{instance}/{username}/rss"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                titles = re.findall(r'<title>(.*?)</title>', response.text)
                return titles[1] if len(titles) > 1 else None
        except: continue
    return None

def extract_data(text):
    # Търсим град
    cities = ["Kyiv", "Kharkiv", "Odesa", "Bakhmut", "Avdiivka", "Donetsk", "Lviv", "Zaporizhzhia", "Kherson", "Dnipro", "Mariupol", "Kursk", "Sudzha", "Belgorod", "Crimea"]
    found_city = next((c for c in cities if c.lower() in text.lower()), None)
    
    # Търсим тип събитие
    found_type = next((k.capitalize() for k in KEYWORDS if k.lower() in text.lower()), "Update")
    
    # Търсим обект
    found_obj = next((o for o in OBJECTS if o.lower() in text.lower()), "")
    
    return found_city, found_type, found_obj

def run_bot():
    all_events = []
    print("🚀 Сканирам за горещи новини...")

    for user in SOURCES:
        tweet = get_latest_tweet(user)
        if tweet:
            city, event_type, obj = extract_data(tweet)
            if city:
                location = geolocator.geocode(city)
                if location:
                    title = f"{event_type}: {obj} в {city}" if obj else f"{event_type} в {city}"
                    all_events.append({
                        "country": "Region",
                        "lat": location.latitude,
                        "lon": location.longitude,
                        "date": time.strftime("%Y-%m-%d %H:%M"),
                        "type": event_type,
                        "title": f"[{user}] {title}",
                        "description": tweet[:120] + "...",
                        "link": f"https://x.com/{user}"
                    })
        time.sleep(1.5)

    if all_events:
        with open('conflicts.json', 'w', encoding='utf-8') as f:
            json.dump(all_events, f, indent=4, ensure_ascii=False)
        print(f"✅ Картата е заредена с {len(all_events)} събития!")

if __name__ == "__main__":
    run_bot()
