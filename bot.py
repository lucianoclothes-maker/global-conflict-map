import requests
import xml.etree.ElementTree as ET
import json
import time
import re
import os
from geopy.geocoders import Nominatim

# =============================================================================
# GLOBAL CONFLICT MONITOR BOT v8.2 - PERSISTENT DATA EDITION
# =============================================================================
# Описание: Автоматизиран бот за събиране на геополитически новини.
# Функции: 
#   - Поддържа история (не трие старите новини при ръчно пускане).
#   - Разпознава тип "Evacuation" за задействане на сирена в Dashboard.
#   - Филтрира дубликати и подрежда по дата.
# =============================================================================

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
geolocator = Nominatim(user_agent="conflict_monitor_v8_final")

# Списък с източници на разузнавателни данни (RSS фийдове)
FEEDS = [
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.aljazeera.com/xml/rss/all.xml"
]

# КЕШ ЗА ЛОКАЦИИ: Оптимизира работата и предотвратява блокиране от Nominatim API
LOCATION_CACHE = {
    "tehran": [35.6892, 51.3890],
    "kyiv": [50.4501, 30.5234],
    "tel aviv": [32.0853, 34.7818],
    "beirut": [33.8938, 35.5018],
    "gaza": [31.5047, 34.4648],
    "isfahan": [32.6539, 51.6660],
    "moscow": [55.7558, 37.6173],
    "sevastopol": [44.6167, 33.5254],
    "odesa": [46.4825, 30.7233],
    "kharkiv": [50.0017, 36.2304],
    "lviv": [49.8397, 24.0297],
    "bushehr": [28.9234, 50.8203],
    "tabriz": [38.0962, 46.2731],
    "mashhad": [36.2972, 59.6067],
    "belgorod": [50.5937, 36.5858],
    "engels": [51.4822, 46.1214]
}

def clean_html(raw_html):
    """Премахва HTML тагове от RSS описанията за чист текст."""
    if not raw_html: return ""
    cleanr = re.compile('<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.strip()

def extract_info(text, locations_map):
    """
    Анализира текста за ключови думи.
    Разпознава критични събития като евакуации и военни удари.
    """
    t = text.lower()
    
    # Речник на тактическите събития
    event_map = {
        "Evacuation": ["evacuate", "leave iran", "citizens must leave", "evacuation", "emergency departure", "leave immediately"],
        "Naval": ["ship", "vessel", "navy", "maritime", "carrier", "destroyer", "black sea fleet", "warship", "frigate"],
        "Airstrike": ["airstrike", "missile", "rocket", "bombing", "strikes", "attack", "ballistic", "explosion"],
        "Explosion": ["explosion", "blast", "shelling", "artillery", "fire", "killed", "detonation", "shook"],
        "Drone": ["drone", "uav", "shahed", "fpv", "kamikaze", "quadcopter"],
        "Clashes": ["clashes", "fighting", "battle", "siege", "frontline", "tank", "combat", "skirmish"],
        "Nuclear": ["nuclear", "atomic", "radiation", "npp", "icbm", "uranium", "reactor", "iaea"]
    }

    found_city, found_region = None, "World"
    
    # Търсене на град и регион от базата
    for region, cities in locations_map.items():
        for city in cities:
            if city.lower() in t:
                found_city, found_region = city.capitalize(), region
                break
        if found_city: break

    # Определяне на типа новина
    found_type = "Breaking News"
    for event, keywords in event_map.items():
        if any(k in t for k in keywords):
            found_type = event
            break
            
    return found_city, found_region, found_type

def get_coordinates(city, region):
    """Извлича гео-координати с Nominatim и използва кеш за пестене на ресурси."""
    city_low = city.lower()
    if city_low in LOCATION_CACHE:
        return LOCATION_CACHE[city_low][0], LOCATION_CACHE[city_low][1]
    
    try:
        print(f"🌐 Geocoding Sector: {city}...")
        time.sleep(1.5) # Спазване на Usage Policy
        loc = geolocator.geocode(f"{city}, {region}", timeout=10)
        if loc:
            LOCATION_CACHE[city_low] = [loc.latitude, loc.longitude]
            return loc.latitude, loc.longitude
    except Exception as e:
        print(f"❌ Geocode Error on {city}: {e}")
        return None, None
    return None, None

def load_existing_events():
    """
    ЗАРЕЖДАНЕ НА ИСТОРИЯТА (conflicts.json).
    Това предотвратява загубата на данни при рестарт на бота.
    """
    file_path = 'conflicts.json'
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, IOError):
            print("⚠️ Warning: Could not read conflicts.json. Starting fresh.")
            return []
    return []

def run_bot():
    """Основен цикъл на разузнавателния бот."""
    existing_events = load_existing_events()
    new_found_events = []
    
    # Географска база данни за филтриране
    locations_db = {
        "Iran": ["Tehran", "Isfahan", "Bushehr", "Tabriz", "Mashhad", "Shiraz", "Kermanshah"],
        "Ukraine": ["Kyiv", "Kharkiv", "Odesa", "Lviv", "Donetsk", "Zaporizhzhia", "Dnipro"],
        "Russia": ["Moscow", "Sevastopol", "Belgorod", "Engels", "Kursk", "Rostov"],
        "Israel": ["Tel Aviv", "Jerusalem", "Haifa", "Gaza", "Ashdod", "Eilat"]
    }

    print(f"📡 --- STARTING INTEL SCAN v8.2 (TOTAL PERSISTENCE) ---")
    
    for url in FEEDS:
        domain = url.split('/')[2]
        print(f"🔍 Analyzing: {domain}...")
        try:
            headers = {'User-Agent': USER_AGENT}
            res = requests.get(url, headers=headers, timeout=12)
            if res.status_code != 200:
                print(f"⚠️ Source {domain} skipped (Status {res.status_code})")
                continue
            
            root = ET.fromstring(res.content)
            items = root.findall('.//item')

            for item in items[:20]:
                title_node = item.find('title')
                desc_node = item.find('description')
                link_node = item.find('link')

                raw_title = title_node.text if title_node is not None else ""
                raw_desc = desc_node.text if desc_node is not None else ""
                link = link_node.text if link_node is not None else "#"

                title = clean_html(raw_title)
                desc = clean_html(raw_desc)

                if len(title) < 25: continue
                
                # Търсене на локация и тип събитие
                city, region, event_type = extract_info(title + " " + desc, locations_db)
                
                if city:
                    lat, lon = get_coordinates(city, region)
                    if lat and lon:
                        # Търсене на жертви чрез Регулярни изрази
                        death_match = re.search(r'(\d+)\s+(killed|dead|fatalities|casualties)', (title + " " + desc).lower())
                        fatalities = death_match.group(1) if death_match else "0"
                        
                        event_data = {
                            "country": region,
                            "city": city,
                            "lat": lat,
                            "lon": lon,
                            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
                            "type": event_type, 
                            "title": title[:120],
                            "description": desc[:450] if desc else f"Tactical intelligence report from {city} sector.",
                            "fatalities": fatalities,
                            "link": link,
                            "critical": True if event_type == "Evacuation" else False
                        }
                        new_found_events.append(event_data)
                        print(f"✅ Intel Captured: {city} - {event_type}")

        except Exception as e:
            print(f"💥 Critical Failure during feed analysis: {str(e)}")

    # ОБРАБОТКА НА ДАННИТЕ: Сливане на стари и нови събития
    all_combined = new_found_events + existing_events
    
    # Премахване на дубликати чрез речник (използваме заглавието като уникален ключ)
    unique_events = {}
    for event in all_combined:
        unique_events[event['title']] = event
    
    # ФИНАЛНО СОРТИРАНЕ: Най-новите новини излизат първи
    final_list = list(unique_events.values())
    final_list = sorted(final_list, key=lambda x: x['date'], reverse=True)[:20]

    # ЗАПИСВАНЕ: Персистиране на данните в JSON
    try:
        with open('conflicts.json', 'w', encoding='utf-8') as f:
            json.dump(final_list, f, indent=4, ensure_ascii=False)
        print(f"🚀 DEPLOYMENT SUCCESSFUL. DATABASE SIZE: {len(final_list)} UNITS.")
    except IOError as io_err:
        print(f"📁 ERROR: Database write failed: {io_err}")

# СТАРТИРАНЕ НА СИСТЕМАТА
if __name__ == "__main__":
    start_point = time.time()
    run_bot()
    duration = time.time() - start_point
    print(f"⏱️ Intelligence cycle completed in {round(duration, 2)}s.")
    # Край на bot.py - Готов за GitHub Actions или локален сървър.
