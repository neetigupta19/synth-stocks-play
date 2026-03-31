import random
from collections import defaultdict

class MarketState:

    def __init__(self):

        self.stock_prices = {
            "TCS": 3500,
            "INFY": 1400,
            "HDFCBANK": 1600,
            "MARUTI": 10500
        }

        self.sector_map = {
            "TCS": "IT",
            "INFY": "IT",
            "HDFCBANK": "BANK",
            "MARUTI": "AUTO"
        }

        self.base_volume = {
            "TCS": 2000,
            "INFY": 1800,
            "HDFCBANK": 2500,
            "MARUTI": 1500
        }

        self.tick_data = []
        self.candle_data = defaultdict(list)
        self.current_candle = {}
        
        # --- NEW FOR REAL-TIME SIMULATION ---
        self.live_stream_buffer = defaultdict(list)
        self.stream_index = defaultdict(int)
        self.price_offsets = defaultdict(float) # For news impact persistence
        
        self.base_prices = self.stock_prices.copy()

state = MarketState()