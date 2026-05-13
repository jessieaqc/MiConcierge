import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database.session import get_db
from models.models import Tip, User, UserRole, Response
from schemas.schemas import TipCreate, TipOut
from utils.jwt import get_current_user

load_dotenv()

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")
PAYPAL_BASE_URL = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")

router = APIRouter()


async def get_paypal_access_token() -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_BASE_URL}/v1/oauth2/token",
            auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
            data={"grant_type": "client_credentials"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Error al conectar con PayPal")
    return resp.json()["access_token"]


async def create_paypal_order(amount: float, currency: str) -> dict:
    access_token = await get_paypal_access_token()
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {"currency_code": currency, "value": f"{amount:.2f}"}
            }
        ],
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders",
            json=payload,
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        )
    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Error al crear orden en PayPal")
    return resp.json()


async def capture_paypal_order(order_id: str) -> dict:
    access_token = await get_paypal_access_token()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture",
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        )
    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Error al capturar pago en PayPal")
    return resp.json()


@router.post("/tip/create-order", status_code=status.HTTP_201_CREATED)
async def create_tip_order(
    data: TipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.tourist:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los turistas pueden enviar propinas"
        )
    response = db.query(Response).filter(Response.id == data.response_id).first()
    if not response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Respuesta no encontrada")
    if response.author_id != data.receiver_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El receptor no coincide con el autor de la respuesta")

    order = await create_paypal_order(data.amount, data.currency)
    return {"paypal_order_id": order["id"], "status": order["status"], "links": order["links"]}


@router.post("/tip/capture/{order_id}", response_model=TipOut)
async def capture_tip(
    order_id: str,
    response_id: int,
    receiver_id: int,
    amount: float,
    currency: str = "USD",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    capture = await capture_paypal_order(order_id)
    tip_status = capture.get("status", "UNKNOWN")

    tip = Tip(
        amount=amount,
        currency=currency,
        paypal_order_id=order_id,
        paypal_status=tip_status,
        sender_id=current_user.id,
        receiver_id=receiver_id,
        response_id=response_id,
    )
    db.add(tip)
    db.commit()
    db.refresh(tip)
    return tip
