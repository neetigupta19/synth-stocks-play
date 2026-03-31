import numpy as np
from state import state


class TrendEngine:

    def __init__(self, lookback=20):
        self.lookback = lookback

    def get_trend(self, stock):

        ticks = [
            t["price"]
            for t in state.tick_data
            if t["stock"] == stock
        ]

        if len(ticks) < self.lookback:
            return 0

        recent = ticks[-self.lookback:]

        x = np.arange(len(recent))
        slope = np.polyfit(x, recent, 1)[0]

        return slope