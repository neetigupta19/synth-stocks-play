import numpy as np
import time
from state import state

class MarketEngine:
    """
    Step 4: LIVE DATA STREAMING & Step 5: NEWS IMPACT INTEGRATION
    Mocks a real-time evolution by fetching the 75% CSV data as a baseline
    and then adding AI-driven NEWS OFFSETS for dynamic simulation.
    """

    def __init__(self, state, event_engine):
        self.state = state
        self.event_engine = event_engine
        # Base volatility noise for realistic small-scale movement
        self.sigma = 0.001 

    def get_streaming_tick(self, stock):
        """
        Step 4: Fetch next data point from buffer every 1 second
        Step 5: Apply news impact dynamically to the baseline CSV price
        """
        st = self.state
        idx = st.stream_index[stock]
        
        # Guard if we run out of CSV data
        if idx >= len(st.live_stream_buffer[stock]):
            print(f"⚠️ Simulation ended for {stock}!")
            return None

        # --- STEP 4: FETCH CSV BASELINE ---
        baseline_record = st.live_stream_buffer[stock][idx]
        csv_price = float(baseline_record["close"])
        csv_volume = float(baseline_record["volume"])

        # --- STEP 5: INTEGRATE NEWS IMPACT (OFFSET ENGINE) ---
        # Drift adjustment from event_engine (sentiment * impact * decay)
        drift_adj, vol_adj, volume_mult = self.event_engine.get_effect(stock)

        # Update persistent price offset for this stock
        # drift_adj is a fraction of the price (e.g., 0.0004 per tick)
        # to get the rupee/cent shift per second
        st.price_offsets[stock] += csv_price * drift_adj
        
        # Small random noise (volatility) for "Live" look
        noise = np.random.normal(0, self.sigma * csv_price)

        # Final simulated price = Baseline CSV + News Offset + Noise
        simulated_price = csv_price + st.price_offsets[stock] + noise
        simulated_price = max(simulated_price, 1.0) # Safety Floor

        # --- STEP 5: INTEGRATE VOLUME SPIKES ---
        # Volume spike is independent of sentiment according to specs
        simulated_volume = int(csv_volume * volume_mult)

        # Increment index for next iteration
        st.stream_index[stock] += 1
        
        # Update current global price for trading / UI state
        st.stock_prices[stock] = simulated_price

        return {
            "time": int(time.time()),
            "stock": stock,
            "price": simulated_price,
            "volume": simulated_volume,
            "open": simulated_price, # Latest ticks represent interim OHLC
            "high": simulated_price,
            "low": simulated_price,
            "close": simulated_price
        }

    def aggregate_candle(self, stock, tick_buffer):
        """
        Calculates OHLC for the 5-second interval required in Step 4.
        """
        if not tick_buffer: return None
        
        prices = [t["price"] for t in tick_buffer]
        volumes = [t["volume"] for t in tick_buffer]
        
        return {
            "open": prices[0],
            "high": max(prices),
            "low": min(prices),
            "close": prices[-1],
            "volume": sum(volumes),
            "time": tick_buffer[-1]["time"]
        }

    # LEGACY generate_tick (removed in favor of streaming engine)
    def generate_tick(self, candle_engine):
        pass