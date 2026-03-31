import numpy as np
from state import state


class VolatilityEngine:

    def __init__(self, lookback=20):
        self.lookback = lookback

    def get_volatility(self, stock):

        prices = [
            t["price"]
            for t in state.tick_data
            if t["stock"] == stock
        ]

        if len(prices) < self.lookback:
            return 0

        returns = np.diff(prices[-self.lookback:])
        vol = np.std(returns)

        return vol