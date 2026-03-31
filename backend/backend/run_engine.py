import sys
import os
import time
from dotenv import load_dotenv

sys.path.append("D:/stocksimulator")

from market_engine import MarketEngine
from candle_engine import CandleEngine
from state import state

from analytics.risk_engine import RiskEngine
from analytics.pattern_engine import PatternEngine

from event_engine import EventEngine
from news_engine import NewsEngine, news_to_event
from csv_loader import load_csv_history

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))
API_KEYS = []
for key_name in ["GEMINI_API_KEY", "GEMINI_API_KEY1", "GEMINI_API_KEY2"]:
    val = os.getenv(key_name)
    if val:
        API_KEYS.append(val)

print("LOADED KEYS:", len(API_KEYS))

if not API_KEYS:
    raise ValueError("❌ No GEMINI_API_KEY found")


# -------- INIT SYSTEM --------
# ✅ FIX: pass sector_map
event_engine = EventEngine(state.sector_map)

engine = MarketEngine(state, event_engine)
candle_engine = CandleEngine()

risk_engine = RiskEngine()
pattern_engine = PatternEngine()

news_engine = NewsEngine(API_KEYS)

load_csv_history()

# -------- RATE CONTROL --------
last_news_time = 0
NEWS_INTERVAL = 600   # 10 minutes


# -------- MAIN LOOP --------
while True:

    # -------- STEP 1: MARKET UPDATE --------
    engine.generate_tick(candle_engine)

    # -------- STEP 2: EVENT CLEANUP (FIXED) --------
    event_engine.cleanup()

    print("\n========== MARKET SNAPSHOT ==========")

    print("\nLive Prices:")
    for stock, price in state.stock_prices.items():
        print(stock, round(price, 2))

    if state.tick_data:
        last = state.tick_data[-1]
        print("\nLatest Tick Volume:", last["stock"], last["volume"])

    print("\nCandles formed:")
    for stock in state.stock_prices:
        print(stock, len(state.candle_data[stock]))

    print("\nAnalytics:")
    for stock in state.stock_prices:
        ratio = risk_engine.get_ratio(stock)
        pattern = pattern_engine.detect(stock)
        print(stock,
              "RiskRatio:", round(ratio, 4),
              "Pattern:", pattern)

    print("\nActive Events:", len(event_engine.active_events))

    # -------- STEP 3: AI NEWS --------
    current_time = time.time()

    if current_time - last_news_time > NEWS_INTERVAL:

        print("\n🧠 Generating AI News...")

        news_list = news_engine.generate_news()

        if news_list and isinstance(news_list, list):
            for i, news in enumerate(news_list[:4]):
                if news_engine.validate(news):
                    print(f"📰 NEWS {i+1}:", news["headline"])
                    event = news_to_event(news)
                    event_engine.add_event(event)
                else:
                    print(f"⚠️ Invalid news struct skipped")
        else:
            print("⚠️ Invalid or empty news list skipped")

        last_news_time = time.time()

    # -------- LOOP DELAY --------
    time.sleep(1)