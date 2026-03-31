import time
from state import state


class CandleEngine:

    def __init__(self, ticks_per_candle=10):
        self.ticks_per_candle = ticks_per_candle

    def process_tick(self, stock, price, volume):

        # -------- INIT --------
        if stock not in state.current_candle:

            state.current_candle[stock] = {
                "open": price,
                "high": price,
                "low": price,
                "close": price,
                "volume": volume,
                "ticks": 1
            }

        else:
            candle = state.current_candle[stock]

            candle["high"] = max(candle["high"], price)
            candle["low"] = min(candle["low"], price)
            candle["close"] = price
            candle["volume"] += volume
            candle["ticks"] += 1

        # -------- COMPLETE --------
        candle = state.current_candle[stock]

        print(stock, state.current_candle.get(stock, {}).get("ticks", 0))

        if candle["ticks"] >= self.ticks_per_candle:
            
            candle["time"] = int(time.time())
            state.candle_data[stock].append(candle)

            del state.current_candle[stock]
        