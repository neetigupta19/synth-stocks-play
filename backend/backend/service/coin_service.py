''''class CoinsService:

    def __init__(self, state):
        self.state = state
        self.users = {}
        self.INIT_COINS = 50000

    def create_user(self, user_id):

        if user_id in self.users:
            return {"status": "error", "message": "User exists"}

        self.users[user_id] = {
            "balance": float(self.INIT_COINS),
            "holdings": {}
        }

        return {"status": "success"}

    def buy(self, user_id, stock, quantity):

        user = self.users.get(user_id)
        if not user:
            return {"status": "error", "message": "User not found"}

        if stock not in self.state.prices:
            return {"status": "error", "message": "Invalid stock"}

        price = self.state.prices[stock]
        cost = price * quantity

        if user["balance"] < cost:
            return {"status": "error", "message": "Insufficient balance"}

        user["balance"] -= cost

        h = user["holdings"]

        if stock in h:
            q = h[stock]["quantity"]
            avg = h[stock]["avg_price"]

            new_q = q + quantity
            new_avg = ((avg * q) + cost) / new_q

            h[stock] = {"quantity": new_q, "avg_price": new_avg}
        else:
            h[stock] = {"quantity": quantity, "avg_price": price}

        return {"status": "success", "price": price}

    def sell(self, user_id, stock, quantity):

        user = self.users.get(user_id)
        if not user:
            return {"status": "error", "message": "User not found"}

        if stock not in user["holdings"]:
            return {"status": "error", "message": "No holdings"}

        if user["holdings"][stock]["quantity"] < quantity:
            return {"status": "error", "message": "Not enough shares"}

        price = self.state.prices[stock]

        user["balance"] += price * quantity
        user["holdings"][stock]["quantity"] -= quantity

        if user["holdings"][stock]["quantity"] == 0:
            del user["holdings"][stock]

        return {"status": "success", "price": price}

    def get_summary(self, user_id):

        user = self.users.get(user_id)
        if not user:
            return {"status": "error", "message": "User not found"}

        holdings_value = sum(
            data["quantity"] * self.state.prices[s]
            for s, data in user["holdings"].items()
        )

        total_value = user["balance"] + holdings_value
        profit = total_value - self.INIT_COINS

        return {
            "status": "success",
            "balance": user["balance"],
            "holdings": user["holdings"],
            "total_value": round(total_value, 2),
            "profit": round(profit, 2)
        }

    def export_profit(self, user_id):

        summary = self.get_summary(user_id)

        return {
            "user_id": user_id,
            "profit": summary["profit"]
        }
    ''''