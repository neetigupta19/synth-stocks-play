import yfinance as yf
import pandas as pd
import os

# Define tickers
tickers = {
    'TCS': 'TCS.NS',
    'Infosys': 'INFY.NS',
    'HDFC_Bank': 'HDFCBANK.NS',
    'Maruti_Suzuki': 'MARUTI.NS'
}

# The folder where this script is located
output_dir = os.path.dirname(os.path.abspath(__file__))

for name, ticker in tickers.items():
    print(f"Downloading data for {name} ({ticker})...")
    
    # Download historical data (max period makes sure we capture as much as yfinance has)
    stock_data = yf.download(ticker, period="max")
    
    # Save to CSV
    csv_path = os.path.join(output_dir, f"{name}.csv")
    stock_data.to_csv(csv_path)
    print(f"Saved {name} data to {csv_path}")

print("All downloads completed.")
