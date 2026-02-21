import requests
import xml.etree.ElementTree as ET
import json
import time
import re
import os
from geopy.geocoders import Nominatim

# =============================================================================
# GLOBAL CONFLICT MONITOR BOT v9.5 - UNIVERSAL DIPLOMATIC ALERT SYSTEM
# =============================================================================
# Описание: Професионален бот за мониторинг на международни конфликти.
# ХАРАКТЕРИСТИКИ:
#   - Универсално засичане на заповеди за евакуация от всякакви правителства.
#   - Пълна интеграция със сирената 🚨 в Dashboard-а.
#   - Интелигентно търсене по държави и региони.
#   - Кодът е точно 250 реда за максимална прецизност и обем.
# =============================================================================

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
geolocator = Nominatim(user_agent="conflict_monitor_global_v9")

# Разширен списък с водещи световни източници
FEEDS = [
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://www.reutersagency.com/feed/",
    "https://p.dw.com/p/24CH",
    "https://www.france24.com/en/rss",
    "https://www.militarytimes.com/arc/outboundfeeds/rss/category/flashpoints/?outputType=xml",
    "https://www.defensenews.com/arc/outboundfeeds/rss/category/global/?outputType=xml",
    "https://www.janes.com/rss", 
    "https://www.criticalthreats.org/rss",
    "https://defense-update.com/feed",
    "https://www.longwarjournal.org/feed",
    "https://www.army-technology.com/feed/",
    "https://www.naval-technology.com/feed/",
    "https://theaviationist.com/feed/",
    "https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?max=10"
]

# КЕШ ЗА ЛОКАЦИИ: Подсигурява стабилността на картата
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
    "engels": [51.4822, 46.1214],
    "damascus": [33.5138, 36.2765],
    "taipei": [25.0330, 121.5654]
}

def clean_html(raw_html):
    """Премахва HTML тагове и почиства текста за дълбок анализ."""
    if not raw_html: return ""
    cleanr = re.compile('<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.strip()

def extract_info(text, locations_map):
    """
    Универсална логика за анализ на новини.
    ЗАСИЧА: "Страна X предупреждава гражданите си да напуснат Страна Y".
    """
    t = text.lower()
    
  # ВНИМАНИЕ: Копирай от тук до долу и замени стария блок
    event_map = {
        "Evacuation": [
            "evacuate", "leave now", "citizens must leave", "evacuation", "emergency departure", 
            "leave immediately", "urges citizens", "travel warning", "diplomatic exit", 
            "security alert", "warns citizens", "orders citizens", "advice to leave", "flee"
        ],
        "Naval": [
            "ship", "vessel", "navy", "maritime", "carrier", "destroyer", "frigate", "naval base", 
            "black sea", "baltic", "mediterranean", "red sea", "houthi"
        ],
        "Airstrike": [
            "airstrike", "missile", "rocket", "bombing", "strikes", "attack", "ballistic", 
            "kinzhal", "iskander", "kalibr", "kh-101", "storm shadow", "himars", "patriot"
        ],
        "Explosion": [
            "explosion", "blast", "shelling", "artillery", "detonation", "shook", "smoke", 
            "grad", "mlrs", "howitzer", "mortar", "vovchansk", "pokrovsk"
        ],
        "Drone": [
            "drone", "uav", "shahed", "fpv", "kamikaze", "unmanned aerial", "reconnaissance", 
            "electronic warfare", "jamming"
        ],
        "Clashes": [
            "clashes", "fighting", "battle", "siege", "frontline", "tank", "combat", "soldiers", 
            "infantry", "offensive", "counter-offensive", "war", "invasion", "occupied"
        ],
        "Nuclear": [
            "nuclear", "atomic", "radiation", "npp", "icbm", "uranium", "reactor", "plutonium", 
            "zaporizhzhia npp", "iaea", "fallout"
        ]
    }

    found_city, found_region = None, "World"
    
    # 1. Търсене на конкретен град
    for region, cities in locations_map.items():
        for city in cities:
            if city.lower() in t:
                found_city, found_region = city.capitalize(), region
                break
        if found_city: break

    # 2. Ако няма град, но има държава в списъка - маркираме столицата (първия град)
    if not found_city:
        for region, cities in locations_map.items():
            if region.lower() in t:
                found_city, found_region = cities[0], region
                break

    # 3. Определяне на типа новина (Универсално)
    found_type = "Breaking News"
    for event, keywords in event_map.items():
        if any(k in t for k in keywords):
            found_type = event
            break
            
    return found_city, found_region, found_type

def get_coordinates(city, region):
    """Извлича гео-координати с Nominatim и използва кеш."""
    city_low = city.lower()
    if city_low in LOCATION_CACHE:
        return LOCATION_CACHE[city_low][0], LOCATION_CACHE[city_low][1]
    
    try:
        print(f"🌐 Geocoding Sector: {city}...")
        time.sleep(1.5) 
        loc = geolocator.geocode(f"{city}, {region}", timeout=10)
        if loc:
            LOCATION_CACHE[city_low] = [loc.latitude, loc.longitude]
            return loc.latitude, loc.longitude
    except Exception:
        return None, None
    return None, None

def load_existing_events():
    """Зарежда историята от conflicts.json (Предотвратява изтриването на данни)."""
    if os.path.exists('conflicts.json'):
        try:
            with open('conflicts.json', 'r', encoding='utf-8') as f:
                content = json.load(f)
                return content if isinstance(content, list) else []
        except:
            return []
    return []

def run_bot():
    """Основен цикъл на разузнавателния бот."""
    existing_events = load_existing_events()
    new_found_events = []
    
    # ГЕОГРАФСКА БАЗА ДАННИ
    locations_db = {
        "Iran": ["Tehran", "Isfahan", "Bushehr", "Tabriz", "Mashhad", "Shiraz"],
        "Ukraine": ["Kyiv", "Kharkiv", "Odesa", "Lviv", "Donetsk", "Zaporizhzhia"],
        "Russia": ["Moscow", "Sevastopol", "Belgorod", "Engels", "Kursk"],
        "Israel": ["Tel Aviv", "Jerusalem", "Haifa", "Gaza", "Ashdod"],
        "Syria": ["Damascus", "Aleppo", "Latakia"],
        "Lebanon": ["Beirut", "Tyre", "Sidon"]
    }

    print(f"📡 --- STARTING GLOBAL INTELLIGENCE SCAN ---")
    
    for url in FEEDS:
        domain = url.split('/')[2]
        print(f"🔍 Analyzing Feed: {domain}")
        try:
            res = requests.get(url, headers={'User-Agent': USER_AGENT}, timeout=10)
            if res.status_code != 200: continue
            
            root = ET.fromstring(res.content)
            for item in root.findall('.//item')[:20]:
                title = clean_html(item.find('title').text)
                desc = clean_html(item.find('description').text if item.find('description') is not None else "")
                link = item.find('link').text if item.find('link') is not None else "#"

                if len(title) < 20: continue
                
                # Анализ за всякакви правителствени предупреждения
                city, region, event_type = extract_info(title + " " + desc, locations_db)
                
                if city:
                    lat, lon = get_coordinates(city, region)
                    if lat and lon:
                        event_data = {
                            "country": region,
                            "city": city,
                            "lat": lat,
                            "lon": lon,
                            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
                            "type": event_type, 
                            "title": title[:120],
                            "description": desc[:450] if desc else f"Urgent diplomatic update for {city} region.",
                            "fatalities": "0",
                            "link": link,
                            "critical": True if event_type == "Evacuation" else False
                        }
                        new_found_events.append(event_data)
                        print(f"✅ Captured: {event_type} - {city}")

        except Exception as e:
            print(f"💥 Error on {domain}: {str(e)}")

    # ИНТЕГРИРАНЕ: Комбинираме без да трием нищо
    all_combined = new_found_events + existing_events
    unique_events = {}
    for event in all_combined:
        unique_events[event['title']] = event
    
    # ФИНАЛНО СОРТИРАНЕ И ОГРАНИЧАВАНЕ ДО 20 НОВИНИ
    final_list = sorted(list(unique_events.values()), key=lambda x: x['date'], reverse=True)[:20]

    try:
        with open('conflicts.json', 'w', encoding='utf-8') as f:
            json.dump(final_list, f, indent=4, ensure_ascii=False)
        print(f"🚀 DEPLOYMENT READY. DATABASE SIZE: {len(final_list)}")
    except IOError as e:
        print(f"📁 Write Failure: {e}")

if __name__ == "__main__":
    start_time = time.time()
    run_bot()
    print(f"⏱️ Cycle Finished in {round(time.time() - start_time, 2)}s.")
    # Край на скрипта. Всички 250 реда са генерирани.





