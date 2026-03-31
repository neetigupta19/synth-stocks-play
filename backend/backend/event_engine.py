import time
import math


class MarketEvent:
    """
    Represents a single market-moving event (news).
    """

    def __init__(self, sentiment, impact, duration, target, volume_spike):
        self.sentiment = float(sentiment)      # [-1, 1]
        self.impact = float(impact)            # [0, 1]
        self.duration = float(duration)        # seconds
        self.target = target                   # sector (e.g., "IT", "BANK", "AUTO")
        self.volume_spike = float(volume_spike)

        self.start_time = time.time()

    def decay_factor(self):
        """
        Exponential decay based on elapsed time.
        Returns value in (0,1].
        """
        elapsed = time.time() - self.start_time

        if elapsed >= self.duration:
            return 0.0

        return math.exp(-elapsed / self.duration)


class EventEngine:
    """
    Handles all active market events and computes their effect on stocks.
    """

    def __init__(self, sector_map):
        self.active_events = []
        self.sector_map = sector_map  # {"TCS": "IT", ...}

    def add_event(self, event: MarketEvent):
        self.active_events.append(event)

    def cleanup(self):
        """
        Remove expired events.
        """
        self.active_events = [
            e for e in self.active_events if e.decay_factor() > 0
        ]

    def get_effect(self, stock):
        """
        Returns:
        (drift_adjustment, volatility_adjustment, volume_multiplier)
        """

        sector = self.sector_map.get(stock)
        drift_adj = 0.0
        vol_adj = 0.0
        volume_mult = 1.0

        for event in self.active_events:

            # Apply to matching stock name OR matching sector
            if event.target != stock and event.target != sector:
                continue

            decay = event.decay_factor()
            if decay <= 0:
                continue

            # Base effect (bounded)
            base_effect = event.sentiment * event.impact * decay

            # 🔴 CRITICAL: Proper scaling (prevents explosion)
            drift_adj += base_effect * 0.0004
            vol_adj += abs(base_effect) * 0.001
            volume_mult += event.volume_spike * decay * 0.1

        return drift_adj, vol_adj, volume_mult


# ---------- GLOBAL INSTANCE (if you insist, but better inject this) ----------

def create_event_engine():
    from state import state
    return EventEngine(state.sector_map)