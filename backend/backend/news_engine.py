import time
import json
import re
from google import genai
from event_engine import MarketEvent

class NewsEngine:

    def __init__(self, api_keys):
        self.api_keys = api_keys if isinstance(api_keys, list) else [api_keys]
        self.current_idx = 0
        self._init_client()

    def _init_client(self):
        self.client = genai.Client(api_key=self.api_keys[self.current_idx])

    # -------- MAIN FUNCTION --------
    def generate_news(self):

        prompt = self._build_prompt()

        max_attempts = max(3, len(self.api_keys) + 1)
        for attempt in range(max_attempts):
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.0-flash", # Reverting to stable flash model
                    contents=prompt
                )

                raw_text = (response.text or "").strip()

                if not raw_text:
                    return None

                parsed = self._safe_parse(raw_text)

                if isinstance(parsed, list):
                    return parsed
                else:
                    if isinstance(parsed, dict):
                        return [parsed]
                    return None

            except Exception as e:
                if "429" in str(e):
                    self.current_idx = (self.current_idx + 1) % len(self.api_keys)
                    self._init_client()
                    time.sleep(1)
                    continue
                else:
                    time.sleep(1)

        return None

    # -------- PROMPT (STEP 1 SCHEMA) --------
    def _build_prompt(self):
        return """
Generate exactly 4 realistic financial market news events affecting specific Indian blue-chip stocks.

STRICT RULES:
- Output ONLY a valid JSON Array containing EXACTLY 4 objects.
- Each event MUST target exactly ONE of: ["TCS", "Infosys", "HDFC Bank", "Maruti Suzuki"].
- Include a descriptive headline and a detailed description.
- Sentiment must be "positive", "negative", or "neutral".

JSON FORMAT:
[
  {
    "headline": string,
    "description": string,
    "sentiment": "positive" | "negative" | "neutral",
    "sentiment_score": float between -1.0 and 1.0,
    "impact_target": float between 0.1 and 1.0 (magnitude),
    "target": "TCS" | "Infosys" | "HDFC Bank" | "Maruti Suzuki",
    "volume_spike_target": float between 0.1 and 1.0
  },
  ... (3 more objects)
]
"""

    # -------- SAFE PARSE --------
    def _safe_parse(self, text):
        try:
            return json.loads(text)
        except:
            pass

        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except:
                return None
        return None

    # -------- VALIDATION --------
    def validate(self, data):
        if not data: return False
        
        required = ["headline", "description", "sentiment", "sentiment_score", "impact_target", "target"]
        if not all(k in data for k in required):
            return False

        if data["target"] not in ["TCS", "Infosys", "HDFC Bank", "Maruti Suzuki"]:
            return False

        data.setdefault("volume_spike_target", 0.2)
        return True

# -------- CONVERTER (STEP 5 INTEGRATION) --------
def news_to_event(news):

    # Map Step 1 schema to Event Logic
    # sentiment_score is the directional shift
    sentiment = max(min(float(news.get("sentiment_score", 0)), 1.0), -1.0)
    
    # impact_target is the magnitude
    impact = min(max(float(news.get("impact_target", 0.5)), 0.0), 1.0)
    
    # Standard 30 minute duration for simulation impact
    duration = 1800 
    
    # Volume spike target
    volume_spike = min(max(float(news.get("volume_spike_target", 0.3)), 0.0), 1.0)

    return MarketEvent(
        sentiment=sentiment,
        impact=impact,
        duration=duration,
        target=news.get("target", "TCS"),
        volume_spike=volume_spike
    )