''''from fastapi import APIRouter
from backend.state import state
from backend.services.coins_service import CoinsService

router = APIRouter()

coins = CoinsService(state)


@router.post("/user/{user_id}")
def create_user(user_id: str):
    return coins.create_user(user_id)


@router.post("/buy")
def buy(user_id: str, stock: str, quantity: int):
    return coins.buy(user_id, stock, quantity)


@router.post("/sell")
def sell(user_id: str, stock: str, quantity: int):
    return coins.sell(user_id, stock, quantity)


@router.get("/summary/{user_id}")
def summary(user_id: str):
    return coins.get_summary(user_id)


@router.post("/export/{user_id}")
def export(user_id: str):
    return coins.export_profit(user_id)''''