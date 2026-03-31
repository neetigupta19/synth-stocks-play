class PortfolioService:

    def __init__(self):
        self.users = {}

    # =========================
    # 👤 CREATE PROFILE
    # =========================
    def create_profile(self, user_id):

        if user_id in self.users:
            return {"status": "error", "message": "User exists"}

        self.users[user_id] = {
            "total_profit": 0.0
        }

        return {"status": "success", "user_id": user_id}

    # =========================
    # ➕ ADD PROFIT
    # =========================
    def add_profit(self, user_id, profit):

        if user_id not in self.users:
            return {"status": "error", "message": "User not found"}

        self.users[user_id]["total_profit"] += profit

        return {
            "status": "success",
            "total_profit": round(self.users[user_id]["total_profit"], 2)
        }

    # =========================
    # 📊 GET PROFILE
    # =========================
    def get_profile(self, user_id):

        if user_id not in self.users:
            return {"status": "error", "message": "User not found"}

        return {
            "status": "success",
            "total_profit": round(self.users[user_id]["total_profit"], 2)
        }