import os
import pandas as pd
import time
from state import state

def load_csv_history():
    """
    Step 2: INITIAL DATA LOADING
    Loads CSV data for each stock and splits it into:
    - 25% Static History (plotted immediately)
    - 75% Live Streaming Data (for Step 4)
    """
    print("Loading CSV datasets for simulation engine...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "real_stock_data")
    
    mapping = {
        "TCS": "TCS.csv",
        "INFY": "Infosys.csv",
        "HDFCBANK": "HDFC_Bank.csv",
        "MARUTI": "Maruti_Suzuki.csv"
    }

    candle_time_interval = 5  # Standard 5s candle interval from requirements
    now = time.time()
    
    for stock, filename in mapping.items():
        path = os.path.join(data_dir, filename)
        if not os.path.exists(path):
            print(f"⚠️ Dataset missing: {path}")
            continue

        try:
            # Step 2: Load full dataset
            # Columns: Date, Close, High, Low, Open, Volume
            df = pd.read_csv(path, skiprows=3, names=['Date', 'Close', 'High', 'Low', 'Open', 'Volume'])
            df = df.dropna()
            
            total_rows = len(df)
            if total_rows < 10:
                print(f"⚠️ Not enough data in {filename}")
                continue

            # Step 2: Split 25/75
            static_count = int(total_rows * 0.25)
            
            static_df = df.iloc[:static_count].copy()
            live_df = df.iloc[static_count:].copy()

            # --- PROCESS STATIC DATA (Step 3) ---
            # Set time for history points working backward from now
            static_start_time = now - (static_count * candle_time_interval)
            
            static_list = []
            for idx, row in enumerate(static_df.itertuples()):
                c_time = int(static_start_time + (idx * candle_time_interval))
                
                static_list.append({
                    "open": float(row.Open),
                    "high": float(row.High),
                    "low": float(row.Low),
                    "close": float(row.Close),
                    "volume": float(row.Volume) if pd.notna(row.Volume) else 1000,
                    "ticks": 10,
                    "time": c_time
                })
            
            state.candle_data[stock] = static_list
            print(f"✅ Initialized {stock} with {len(static_list)} static candles (25%)")

            # --- PROCESS LIVE STREAMING BUFFER (Step 4) ---
            live_list = []
            for idx, row in enumerate(live_df.itertuples()):
                # Prepare live baseline data from CSV
                live_list.append({
                    "open": float(row.Open),
                    "high": float(row.High),
                    "low": float(row.Low),
                    "close": float(row.Close),
                    "volume": float(row.Volume) if pd.notna(row.Volume) else 1000,
                })
            
            state.live_stream_buffer[stock] = live_list
            state.stream_index[stock] = 0
            
            # Initialize current price to end of history
            if static_list:
                state.stock_prices[stock] = static_list[-1]["close"]
                state.base_prices[stock] = static_list[-1]["close"]

        except Exception as e:
            print(f"❌ Critical error loading {stock}: {e}")

    print(f"✅ Simulation buffer populated. Ready for live stream.")
