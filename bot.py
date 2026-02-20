import requests
import json
import re
from geopy.geocoders import Nominatim
import time

# Списък с резервни портали за X (Twitter)
INSTANCES = ["https://nitter.net", "https://nitter.cz", "https://nitter.privacydev.net", "https://nitter.unixfox.eu", "https://nitter.poast.org", "https://nitter.moomoo.me", "https://nitter.no-logs.com"]
SOURCE_X = "OSINTtechnical" 
geolocator = Nominatim(user_agent="my_war_tracker_v1")

def get_latest_tweet(username):
    for instance in INSTANCES:
        print(f"📡 Опит през: {instance}...")
        url = f"{instance}/{username}/rss"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                # Извличаме текста на последния пост
                titles = re.findall(r'<title>(.*?)</title>', response.text)
                if len(titles) > 1:
                    return titles[1] # Връщаме съдържанието на поста
        except:
            continue 
    return None

def extract_location(text):
    # Разширен списък за по-добър тест
    cities = ["Kyiv", "Kharkiv", "Odesa", "Bakhmut", "Avdiivka", "Donetsk", "Lviv", "Zaporizhzhia", "Kherson"]
    for city in cities:
        if city.lower() in text.lower():
            return city
    return None

def run_bot():
    tweet = get_latest_tweet(SOURCE_X)
    
    if not tweet:
        print("❌ Всички портали са претоварени в момента. Изчакай 1 минута.")
        return

    print(f"💬 Пост: {tweet[:60]}...")
    city = extract_location(tweet)
    
    if city:
        print(f"📍 Намерен град: {city}. Вземам координати...")
        location = geolocator.geocode(city)
        if location:
            new_entry = {
                "country": "Ukraine",
                "lat": location.latitude,
                "lon": location.longitude,
                "date": time.strftime("%Y-%m-%d"),
                "type": "Airstrike",
                "title": tweet[:100],
                "link": f"https://x.com/{SOURCE_X}"
            }
            
            # Записваме в локалния файл
            with open('conflicts.json', 'w', encoding='utf-8') as f:
                json.dump([new_entry], f, indent=4, ensure_ascii=False)
            print(f"✅ Успех! Картата е обновена за {city}.")
    else:
        print("ℹ️ Роботът прочете поста, но не откри познато име на град.")

if __name__ == "__main__":
    run_bot()