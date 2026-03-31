# backend/server.py

from fastapi import FastAPI, WebSocket
import asyncio
import json
import time
import os
import sys
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from collections import defaultdict

# -------- LOAD ENV --------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
load_dotenv(os.path.join(BASE_DIR, ".env"))

API_KEYS = []
for key_name in ["GEMINI_API_KEY", "GEMINI_API_KEY1", "GEMINI_API_KEY2"]:
    val = os.getenv(key_name)
    if val:
        API_KEYS.append(val)

if not API_KEYS:
    raise ValueError("❌ No GEMINI_API_KEY found in .env")


# -------- IMPORT YOUR SYSTEM --------
from market_engine import MarketEngine
from candle_engine import CandleEngine
from event_engine import EventEngine
from news_engine import NewsEngine, news_to_event
from state import state
from csv_loader import load_csv_history
from analytics.pattern_engine import PatternEngine
from analytics.risk_engine import RiskEngine

# -------- INITIALIZE SYSTEM --------
event_engine = EventEngine(state.sector_map)
engine = MarketEngine(state, event_engine)
candle_engine = CandleEngine()
news_engine = NewsEngine(API_KEYS)
pattern_engine = PatternEngine()
risk_engine = RiskEngine()
clients = []


# -------- BROADCAST FUNCTION --------
async def broadcast(data):
    for client in clients:
        try:
            await client.send_text(json.dumps(data))
        except:
            pass # Handle disconnected clients gracefully


# -------- LIFESPAN AND SIMULATION LOOP --------
@asynccontextmanager
async def lifespan(app: FastAPI):

    # Step 2: Load and Split CSV (25% history, 75% streaming)
    load_csv_history()

    async def loop():
        # STEP 1: INITIAL NEWS GENERATION (MANDATORY START)
        print("🚀 STEP 1: Generating Initial Market News...")
        initial_news = news_engine.generate_news()
        if initial_news:
            valid_news = []
            # we only take 4
            for news in initial_news[:4]:
                if news_engine.validate(news):
                    event = news_to_event(news)
                    event_engine.add_event(event)
                    valid_news.append({
                        "headline": news["headline"],
                        "description": news["description"],
                        "target": news["target"]
                    })
            if valid_news:
                await broadcast({"type": "news_batch", "news": valid_news, "time": time.time()})
        
        last_news_time = time.time()
        tick_counter = 0
        tick_buffers = defaultdict(list)

        print("📈 STEP 4/5: Starting Live Simulation Loop...")
        while True:
            # -------- TICK UPDATE (Every 1s) --------
            for stock in ["TCS", "INFY", "HDFCBANK", "MARUTI"]:
                tick = engine.get_streaming_tick(stock)
                if tick:
                    tick_buffers[stock].append(tick)
                    # Broadcast Tick (1s)
                    await broadcast({
                        "type": "tick",
                        "stock": stock,
                        "price": tick["price"],
                        "time": tick["time"]
                    })
                    
                    # Broadcast Analytics (Sync with data)
                    pattern = pattern_engine.detect(stock)
                    risk_reward = risk_engine.get_ratio(stock)
                    await broadcast({
                        "type": "analytics",
                        "stock": stock,
                        "pattern": pattern,
                        "riskReward": risk_reward,
                        "time": tick["time"]
                    })

            # -------- CANDLE UPDATE (Every 5s) --------
            tick_counter += 1
            if tick_counter >= 5:
                for stock in ["TCS", "INFY", "HDFCBANK", "MARUTI"]:
                    candle = engine.aggregate_candle(stock, tick_buffers[stock])
                    if candle:
                        await broadcast({
                            "type": "candle",
                            "stock": stock,
                            "open": candle["open"],
                            "high": candle["high"],
                            "low": candle["low"],
                            "close": candle["close"],
                            "volume": candle["volume"],
                            "time": candle["time"]
                        })
                tick_buffers = defaultdict(list)
                tick_counter = 0

            # -------- PERIODIC NEWS (Step 1 - Every 10 mins) --------
            current_time = time.time()
            if current_time - last_news_time > 600:
                new_news = news_engine.generate_news()
                if new_news:
                    valid_news = []
                    for news in new_news[:4]:
                        if news_engine.validate(news):
                            event = news_to_event(news)
                            event_engine.add_event(event)
                            valid_news.append({
                                "headline": news["headline"],
                                "description": news["description"],
                                "target": news["target"]
                            })
                    if valid_news:
                        await broadcast({"type": "news_batch", "news": valid_news, "time": current_time})
                last_news_time = current_time

            # EVENT CLEANUP
            event_engine.cleanup()
            
            await asyncio.sleep(1)

    task = asyncio.create_task(loop())
    yield
    task.cancel()


# -------- APP INIT --------
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------- WEBSOCKET ENDPOINT --------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.append(ws)

    # Step 3: INITIAL GRAPH RENDERING (Send 25% History)
    for stock in state.stock_prices:
        if state.candle_data[stock]:
            await ws.send_text(json.dumps({
                "type": "history",
                "stock": stock,
                "data": state.candle_data[stock]
            }))

    try:
        while True:
            await asyncio.sleep(1)
    except:
        if ws in clients:
            clients.remove(ws)


# -------- ENTRY POINT --------
if __name__ == "__main__":
    uvicorn.run("server:app", host="localhost", port=8080, reload=True)