import requests
import json
import re
from geopy.geocoders import Nominatim
import time

# Твоят списък с емисии
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
    "https://www.voanews.com/api/z_p-itevi-",
    "https://www.voanews.com/api/z_p-itevi-", 
    "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
    "https://news.un.org/feed/subscribe/en/news/all/rss.xml",  
    "https://www.almasdarnews.com/article/category/syria/feed/",
    "https://warnews247.gr/feed/", 
    "https://www.zerohedge.com/feed", 
    "https://halturnerradioshow.com/index.php/en/?format=feed&type=rss", 
    "https://southfront.press/feed/", 
    "https://nova.bg/,
]

geolocator = Nominatim(user_agent="conflict_map_final_v12")

def clean_html(raw_html):
    """Премахва HTML тагове и CDATA за чисто описание"""
    if not raw_html: return ""
    cleanr = re.compile('<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.replace("<![CDATA[", "").replace("]]>", "").strip()

def extract_info(text):
    t = text.lower()
    # ТВОЯТ ОРИГИНАЛЕН СПИСЪК С ЛОКАЦИИ (ЗАПАЗЕН НАПЪЛНО)
    locations = {
        "Ukraine": ["kyiv", "kharkiv", "donetsk", "crimea", "odesa", "donbas", "kursk", "zaporizhzhia"],
        "Russia": ["moscow", "kremlin", "voronezh", "belgorod", "rostov", "st. petersburg", "novorossiysk"],
        "Middle East": ["gaza", "israel", "lebanon", "iran", "yemen", "tehran", "tel aviv", "beirut", "red sea", "hamas", "idf", "palestinian"],
        "Africa": ["sudan", "mali", "congo", "khartoum", "darfur", "somalia", "el fasher", "ethiopia"],
        "USA": ["washington", "pentagon", "white house", "biden", "trump", "new york", "texas border"],
        "China": ["beijing", "taiwan", "south china sea", "xi jinping", "shanghai", "fujian"],
        "North Korea": ["pyongyang", "kim jong un", "north korea", "dprk"],
        "Japan": ["tokyo", "sea of japan", "okinawa", "japanese"],
        "Venezuela": ["caracas", "venezuela", "maduro", "essequibo"]
    }
    
    # ТВОИТЕ ОРИГИНАЛНИ КАТЕГОРИИ (ЗАПАЗЕНИ НАПЪЛНО)
    event_map = {
        "Naval": ["ship", "vessel", "navy", "sea", "maritime", "boat", "port", "carrier", "destroyer"],
        "Airstrike": ["airstrike", "missile", "rocket", "bombing", "strikes", "attack", "hit", "intercepted", "ballistic"],
        "Explosion": ["explosion", "blast", "shelling", "artillery", "fire", "killed", "dead", "destroyed", "fatalities"],
        "Drone": ["drone", "uav", "shahed", "quadcopter", "unmanned"],
        "Clashes": ["clashes", "fighting", "battle", "siege", "forces", "military", "war", "clash", "offensive", "army"],
        "Nuclear": ["nuclear", "atomic", "radiation", "npp", "icbm", "warhead"],
        "Cyber": ["cyber", "hacking", "hacker", "ddos", "malware", "cyberattack"]
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
    print(f"Starting news sync at {time.strftime('%H:%M:%S')}...")
    
    for url in FEEDS:
        try:
            res = requests.get(url, timeout=15)
            # Взимаме целия блок на всяка новина
            items = re.findall(r'<item>(.*?)</item>', res.text, re.DOTALL)
            
            for item in items:
                # Търсим заглавие, описание и линк вътре в item-а
                title = re.search(r'<title>(.*?)</title>', item)
                desc = re.search(r'<description>(.*?)</description>', item)
                link = re.search(r'<link>(.*?)</link>', item)
                
                if not title: continue
                
                title_text = clean_html(title.group(1))
                # ТУК Е МАГИЯТА: Взимаме реалното описание, ако съществува
                desc_text = clean_html(desc.group(1)) if desc else f"Latest report regarding {title_text}."
                link_text = link.group(1) if link else url
                
                if len(title_text) < 15: continue
                
                # Проверяваме за локация в заглавието И описанието
                city, region, event_type = extract_info(title_text + " " + desc_text)
                
                if city:
                    try:
                        loc = geolocator.geocode(city)
                        if loc:
                            death_match = re.search(r'(\d+)\s+(killed|dead|fatalities)', (title_text + " " + desc_text).lower())
                            fatalities = death_match.group(1) if death_match else "0"
                            
                            all_events.append({
                                "country": region,
                                "lat": loc.latitude, 
                                "lon": loc.longitude,
                                "date": time.strftime("%Y-%m-%d"),
                                "type": event_type, 
                                "title": title_text, # Без рязане на символи
                                "description": desc_text, # Дълго автоматично описание
                                "fatalities": fatalities,
                                "link": link_text
                            })
                    except: continue
        except Exception as e: 
            print(f"Error fetching {url}: {e}")
            continue
    
    # Махаме дубликатите
    unique_events = { (e['lat'], e['lon']): e for e in all_events }.values()
    
    # Записваме в JSON
    with open('conflicts.json', 'w', encoding='utf-8') as f:
        json.dump(list(unique_events), f, indent=4, ensure_ascii=False)
    
    print(f"Sync complete. Found {len(unique_events)} unique events with full descriptions.")

if __name__ == "__main__":
    run_bot()



