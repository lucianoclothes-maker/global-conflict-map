import requests
import xml.etree.ElementTree as ET
import json
import time
import re
import os
from geopy.geocoders import Nominatim
from bs4 import BeautifulSoup

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
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://p.dw.com/p/24CH",
    "https://www.axios.com/world",
    "https://www.whitehouse.gov/briefing-room/"
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
    "taipei": [25.0330, 121.5654],
    "washington": [38.8951, -77.0364],
    "pentagon": [38.8719, -77.0563],
    "warsaw": [52.2297, 21.0122],
    "rzeszow": [50.0412, 21.9991],
    "bucharest": [44.4268, 26.1025],
    "taiwan strait": [24.4786, 119.3490],
    "south china sea": [12.0000, 113.0000],
    "vovchansk": [50.2839, 36.9358],
    "pokrovsk": [48.2819, 37.1762],
    "raleigh": [35.7796, -78.6382],
    "norfolk": [36.8508, -76.2859],
    "san diego": [32.7157, -117.1611],
    "poland": [52.0000, 19.0000],
    "romania": [46.0000, 25.0000],
    "khartoum": [15.5007, 32.5599],
    "mogadishu": [2.0469, 45.3182],
    "niamey": [13.5116, 2.1254],
    "bamako": [12.6392, -8.0029],
    "ouagadougou": [12.3714, -1.5197],
    "sudan": [12.8628, 30.2176],
    "somalia": [5.1521, 46.1996],
    "libya": [26.3351, 17.2283],
    "tripoli": [32.8872, 13.1913],
    "djibouti": [11.5721, 43.1456],
    "kabul": [34.5553, 69.1770],
    "islamabad": [33.6844, 73.0479],
    "karachi": [24.8607, 67.0011],
    "peshawar": [34.0151, 71.5249],
    "kandahar": [31.6289, 65.7372]
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
    
 # ГЛОБАЛЕН ВОЕНЕН ФИЛТЪР (ВКЛЮЧИТЕЛНО ЕВРОПА И НАТО)
    event_map = {
        "Evacuation": [
            "evacuate", "leave now", "citizens must leave", "evacuation", "emergency departure", 
            "leave immediately", "urges citizens", "travel warning", "diplomatic exit", 
            "security alert", "warns citizens", "orders citizens", "advice to leave", "flee"
        ],
        "Naval": [
            "ship", "vessel", "navy", "maritime", "carrier", "destroyer", "frigate", "naval base", 
            "black sea", "baltic", "mediterranean", "red sea", "houthi", "strait", "carrier group",
            "freedom of navigation", "destroyer squadron", "submarine", "warship", "north sea"
        ],
        "Airstrike": [
            "airstrike", "missile", "rocket", "bombing", "strikes", "attack", "ballistic", 
            "kinzhal", "iskander", "kalibr", "kh-101", "storm shadow", "himars", "patriot",
            "intercepted", "air defense", "scramble", "bomber", "airspace violation"
        ],
        "Explosion": [
            "explosion", "blast", "shelling", "artillery", "detonation", "shook", "smoke", 
            "grad", "mlrs", "howitzer", "mortar", "vovchansk", "pokrovsk", "bombardment"
        ],
        "Drone": [
            "drone", "uav", "shahed", "fpv", "kamikaze", "unmanned aerial", "reconnaissance", 
            "electronic warfare", "jamming", "loitering munition"
        ],
        "Clashes": [
            "clashes", "fighting", "battle", "siege", "frontline", "tank", "combat", "soldiers", 
            "infantry", "offensive", "counter-offensive", "war", "invasion", "occupied",
            "military drills", "war games", "troop deployment", "readiness", "military aid",
            "nato task force", "pentagon", "mobilization", "maneuvers", "joint exercise",
            "eastern flank", "nato alliance", "border security", "suwalki gap", "deployment"
        ],
        "Nuclear": [
            "nuclear", "atomic", "radiation", "npp", "icbm", "uranium", "reactor", "plutonium", 
            "zaporizhzhia npp", "iaea", "fallout", "deterrence", "strategic forces"
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
    
# ГЕОГРАФСКА БАЗА ДАННИ - ПЪЛЕН ГЛОБАЛЕН ОБХВАТ
    locations_db = {
        "Ukraine": ["Kyiv", "Kharkiv", "Odesa", "Lviv", "Donetsk", "Zaporizhzhia", "Pokrovsk", "Vovchansk", "Kramatorsk", "Sumy"],
        "Russia": ["Moscow", "Sevastopol", "Belgorod", "Engels", "Kursk", "Rostov", "Novorossiysk", "St. Petersburg"],
        "Israel": ["Tel Aviv", "Jerusalem", "Haifa", "Gaza", "Ashdod", "Rafah", "Eilat"],
        "Iran": ["Tehran", "Isfahan", "Bushehr", "Tabriz", "Mashhad", "Shiraz", "Bandar Abbas"],
        "USA": ["Washington", "New York", "Pentagon", "Norfolk", "San Diego", "Alaska", "Hawaii"],
        "China": ["Beijing", "Shanghai", "Taiwan Strait", "South China Sea", "Hainan", "Fujian"],
        "Europe": ["Brussels", "Warsaw", "Rzeszow", "Bucharest", "Berlin", "Paris", "London", "Poland", "Romania", "Finland", "Sweden" "Bulgaria"],
        "Middle East": ["Beirut", "Tyre", "Sidon", "Damascus", "Aleppo", "Latakia", "Red Sea", "Yemen", "Sanaa"],
        "Asia": ["Tokyo", "Seoul", "Pyongyang", "Manila", "South China Sea", "Afghanistan", "Pakistan"],
        "Africa": ["Khartoum", "Mogadishu", "Niamey", "Bamako", "Ouagadougou", "Sudan", "Somalia", "Mali", "Niger", "Burkina Faso", "Libya", "Tripoli"],
        "Red Sea Region": ["Bab el-Mandeb", "Djibouti", "Eritrea"]
    }

    print(f"📡 --- STARTING GLOBAL INTELLIGENCE SCAN ---")
    
for url in FEEDS:
        domain = url.split('/')[2]
        print(f"🔍 Analyzing: {domain}")
        try:
            res = requests.get(url, headers={'User-Agent': USER_AGENT}, timeout=15)
            if res.status_code != 200:
                print(f"⚠️ Skip {domain}: Status {res.status_code}")
                continue
            
            items = []
            content_type = res.headers.get('Content-Type', '').lower()
            is_xml = "xml" in content_type or url.endswith('.xml') or res.text.strip().startswith('<')
            
            if is_xml:
                root = ET.fromstring(res.content)
                for i in root.findall('.//item')[:15]:
                    t_el = i.find('title')
                    d_el = i.find('description')
                    l_el = i.find('link')
                    if t_el is not None:
                        items.append({
                            'title': clean_html(t_el.text),
                            'desc': clean_html(d_el.text) if d_el is not None else "",
                            'link': l_el.text if l_el is not None else url
                        })
            else:
                soup = BeautifulSoup(res.content, 'html.parser')
                for tag in soup.find_all(['h2', 'h3']):
                    title_text = clean_html(tag.text)
                    if len(title_text) > 35:
                        items.append({
                            'title': title_text,
                            'desc': f"Intelligence report from {domain}",
                            'link': url
                        })

            for item in items:
                title, desc, link = item['title'], item['desc'], item['link']
                if len(title) < 20: continue

                city, region, event_type = extract_info(title + " " + desc, locations_db)
                if city:
                    lat, lon = get_coordinates(city, region)
                    if lat and lon:
                        event_data = {
                            "country": region, "city": city, "lat": lat, "lon": lon,
                            "date": time.strftime("%Y-%m-%d %H:%M:%S"),
                            "type": event_type, "title": title[:120],
                            "description": desc[:450] if desc else f"Update for {city}.",
                            "fatalities": "0", "link": link,
                            "critical": True if event_type in ["Evacuation", "Missile Strike"] else False
                        }
                        new_found_events.append(event_data)
                        print(f"✅ Captured: {event_type} - {city}")

        except Exception as e:
            print(f"❌ Error on {domain}: {str(e)}")

    # СЛЕД КАТО СВЪРШИ ЦИКЪЛА (подравнено с 'for url in FEEDS')
    if len(new_found_events) > 0:
        unique_events = {}
        if os.path.exists('conflicts.json'):
            with open('conflicts.json', 'r', encoding='utf-8') as f:
                try:
                    old_data = json.load(f)
                    for event in old_data:
                        unique_events[event['title']] = event
                except:
                    pass
        
        for event in new_found_events:
            unique_events[event['title']] = event
            
        with open('conflicts.json', 'w', encoding='utf-8') as f:
            json.dump(list(unique_events.values())[-100:], f, indent=4, ensure_ascii=False)
        print(f"📝 Map updated with {len(new_found_events)} new events.")

if __name__ == "__main__":
    run_bot()



















