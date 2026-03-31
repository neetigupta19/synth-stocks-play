from .trend_engine import TrendEngine
from .volatility_engine import VolatilityEngine


class RiskEngine:

    def __init__(self):
        self.trend_engine = TrendEngine()
        self.vol_engine = VolatilityEngine()

    def get_ratio(self, stock):

        trend = abs(self.trend_engine.get_trend(stock))
        risk = self.vol_engine.get_volatility(stock)

        if risk == 0:
            return 0

        return trend / risk