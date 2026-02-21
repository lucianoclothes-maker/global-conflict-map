import requests
import json
import re
from geopy.geocoders import Nominatim
import time
import xml.etree.ElementTree as ET

# --- 1. РАЗШИРЕН СПИСЪК С ЕМИСИИ (OSINT ИЗТОЧНИЦИ) ---
FEEDS = [
    "https://www.politico.eu/rss", 
    "https://rss.cnn.com/rss/edition_world.rss",
    "http://feeds.bbci.co.uk/news/world/rss.xml", 
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://www.theguardian.com/world/rss", 
    "https://www.kyivpost.com/feed",
    "https://www.militarytimes.com/arc/outboundfeeds/rss/", 
    "https://www.longwarjournal.org/feed",
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://www.reutersagency.com/feed/?best-topics=political-general&post_type=best",
    "https://www.france24.com/en/rss", 
    "https://www.dw.com/en/top-stories/s-9097", 
    "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
    "https://www.almasdarnews.com/article/category/syria/feed/",
    "https://warnews247.gr/feed/", 
    "https://www.zerohedge.com/feed", 
    "https://southfront.press/feed/",
    "https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?max=10",
    "https://www.understandingwar.org/rss.xml" # ISW - Ключов за Украйна
]

# Координати за "горещи точки", които често се бъркат от Google/Nominatim
HARDCODED_LOCATIONS = {
    "gaza": {"lat": 31.5, "lon": 34.46},
    "donetsk": {"lat": 48.01, "lon": 37.80},
    "kharkiv": {"lat": 49.99, "lon": 36.23},
    "bakhmut": {"lat": 48.59, "lon": 38.00},
    "taipei": {"lat": 25.03, "lon": 121.56},
    "khartoum": {"lat": 15.50, "lon": 32.55},
    "beirut": {"lat": 33.89, "lon": 35.50}
}

geolocator = Nominatim(user_agent="military_intel_bot_v5")

def clean_html(raw_html):
    if not raw_html: return ""
    # Премахва скриптове, стилове и HTML тагове
    cleanr = re.compile('<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.replace("<![CDATA[", "").replace("]]>", "").strip()

def extract_info(text):
    t = text.lower()
    
    # Разширен списък с локации и ключови думи за региони
    locations = {
        "Ukraine": ["kyiv", "kharkiv", "donetsk", "crimea", "odesa", "donbas", "kursk", "zaporizhzhia", "bakhmut", "avdiivka", "vovchansk"],
        "Russia": ["moscow", "kremlin", "voronezh", "belgorod", "rostov", "novorossiysk", "tuapse", "engels"],
        "Middle East": ["gaza", "israel", "lebanon", "iran", "yemen", "tehran", "tel aviv", "beirut", "red sea", "hamas", "idf", "hezbollah", "houthi"],
        "Africa": ["sudan", "mali", "congo", "khartoum", "darfur", "somalia", "el fasher", "tigray", "niger"],
        "USA": ["washington", "pentagon", "white house", "norfolk", "centcom", "eucom"],
        "China": ["beijing", "taiwan", "south china sea", "strait", "pla", "manila"],
        "North Korea": ["pyongyang", "kim jong un", "dprk", "missile test"]
    }
    
    # По-агресивно мапиране на събития
    event_map = {
        "Naval": ["ship", "vessel", "navy", "maritime", "carrier", "destroyer", "frigate", "submarine", "black sea fleet"],
        "Airstrike": ["airstrike", "missile", "rocket", "bombing", "strikes", "attack", "ballistic", "hypersonic", "f-16"],
        "Explosion": ["explosion", "blast", "shelling", "artillery", "fire", "killed", "detonation", "ied"],
        "Drone": ["drone", "uav", "shahed", "fpv", "kamikaze drone", "mavic"],
        "Clashes": ["clashes", "fighting", "battle", "siege", "frontline", "infantry", "tank", "armored", "offensive"],
        "Nuclear": ["nuclear", "atomic", "radiation", "npp", "icbm", "silo", "tactical nuke"]
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
    print(f"[{time.strftime('%H:%M:%S')}] INTEL SCAN STARTED...")
    
    for url in FEEDS:
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            res = requests.get(url, headers=headers, timeout=15)
            # Използваме XML парсър вместо RegEx за стабилност
            root = ET.fromstring(res.content)
            
            for item in root.findall('.//item'):
                title = item.find('title').text if item.find('title') is not None else ""
                desc = item.find('description').text if item.find('description') is not None else ""
                link = item.find('link').text if item.find('link') is not None else ""
                
                title_text = clean_html(title)
                desc_text = clean_html(desc)
                
                if len(title_text) < 20: continue
                
                # Търсим локация
                city_key, region, event_type = extract_info(title_text + " " + desc_text)
                
                if city_key:
                    lat, lon = None, None
                    
                    # 1. Проверка в Hardcoded списъка (най-точно)
                    low_city = city_key.lower()
                    if low_city in HARDCODED_LOCATIONS:
                        lat = HARDCODED_LOCATIONS[low_city]["lat"]
                        lon = HARDCODED_LOCATIONS[low_city]["lon"]
                    
                    # 2. Ако не е там, питаме Geolocator
                    if not lat:
                        try:
                            loc = geolocator.geocode(f"{city_key}, {region}")
                            if loc:
                                lat, lon = loc.latitude, loc.longitude
                        except: continue

                    if lat and lon:
                        # Проверка за жертви
                        death_match = re.search(r'(\d+)\s+(killed|dead|fatalities|casualties)', (title_text + " " + desc_text).lower())
                        fatalities = death_match.group(1) if death_match else "0"
                        
                        all_events.append({
                            "country": region,
                            "lat": lat, 
                            "lon": lon,
                            "date": time.strftime("%Y-%m-%d"),
                            "type": event_type, 
                            "title": title_text[:120],
                            "description": desc_text[:400] if desc_text else f"Tactical update from {region}.",
                            "fatalities": fatalities,
                            "link": link
                        })
        except Exception as e:
            print(f"Skipping {url} due to connection/format issue.")

    # Филтриране на дубликати (по заглавие, за да не се трупат еднакви новини)
    seen_titles = set()
    unique_events = []
    for e in all_events:
        if e['title'] not in seen_titles:
            unique_events.append(e)
            seen_titles.add(e['title'])
    
    # Запис в JSON
    with open('conflicts.json', 'w', encoding='utf-8') as f:
        json.dump(unique_events, f, indent=4, ensure_ascii=False)
    
    print(f"[{time.strftime('%H:%M:%S')}] SCAN COMPLETE. ACTIVE EVENTS: {len(unique_events)}")

if __name__ == "__main__":
    while True:
        run_bot()
        time.sleep(600) # Изчакване 10 минути между сканиранията
