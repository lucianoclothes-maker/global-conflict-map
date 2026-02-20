import requests
import json
import re
from geopy.geocoders import Nominatim
import time

# Портали (Nitter) - разширен списък
INSTANCES = ["https://nitter.net", "https://nitter.cz", "https://nitter.privacydev.net", "https://nitter.poast.org", "https://nitter.moomoo.me"]

# Топ акаунти за история
ACCOUNTS = ["OSINTtechnical", "DeepStateUA", "UAWeapons", "Liveuamap", "IAPonomarenko"]

geolocator = Nominatim(user_agent="history_war_tracker_v4")

def extract_data(text):
    cities = ["Kyiv", "Kharkiv", "Odesa", "Bakhmut", "Avdiivka", "Donetsk", "Lviv", "Zaporizhzhia", "Kherson", "Dnipro", "Mariupol", "Kursk", "Sudzha", "Belgorod", "Crimea"]
    found_city = next((c for c in cities if c.lower() in text.lower()), None)
    return found_city

def run_bot():
    all_events = []
    print("📜 Започвам изтегляне на историята от акаунтите...")

    for user in ACCOUNTS:
        for instance in INSTANCES:
            url = f"{instance}/{user}/rss"
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    # Извличаме ВСИЧКИ заглавия от историята (обикновено последните 20)
                    posts = re.findall(r'<title>(.*?)</title>', response.text)
                    print(f"✅ Взех {len(posts)} поста от историята на {user}")
                    
                    for post in posts[1:]: # Прескачаме първото заглавие (името на акаунта)
                        city = extract_data(post)
                        if city:
                            location = geolocator.geocode(city)
                            if location:
                                all_events.append({
                                    "country": "Region",
                                    "lat": location.latitude,
                                    "lon": location.longitude,
                                    "date": time.strftime("%Y-%m-%d"),
                                    "type": "History Update",
                                    "title": f"[{user}] {city}: {post[:60]}...",
                                    "link": f"https://x.com/{user}"
                                })
                    break # Ако един портал работи за този акаунт, не хабим другите
            except:
                continue

    # Махаме дублиращи се точки за един и същ град, за да е чист мапа
    unique_events = { (e['lat'], e['lon']): e for e in all_events }.values()

    with open('conflicts.json', 'w', encoding='utf-8') as f:
        json.dump(list(unique_events), f, indent=4, ensure_ascii=False)
    
    print(f"🚀 Успех! Напълнихме картата с {len(unique_events)} исторически точки.")

if __name__ == "__main__":
    run_bot()
