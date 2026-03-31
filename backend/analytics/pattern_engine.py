from .trend_engine import TrendEngine


class PatternEngine:

    def __init__(self):
        self.trend_engine = TrendEngine()

    def detect(self, stock):

        slope = self.trend_engine.get_trend(stock)

        if slope > 0:
            return "Bullish"

        elif slope < 0:
            return "Bearish"

        else:
            return "Sideways"