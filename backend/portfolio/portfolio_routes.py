from fastapi import APIRouter
from portfolio.portfolio_service import PortfolioService

router = APIRouter()

portfolio = PortfolioService()


@router.post("/create/{user_id}")
def create_profile(user_id: str):
    return portfolio.create_profile(user_id)


@router.post("/add_profit")
def add_profit(user_id: str, profit: float):
    return portfolio.add_profit(user_id, profit)


@router.get("/profile/{user_id}")
def get_profile(user_id: str):
    return portfolio.get_profile(user_id)