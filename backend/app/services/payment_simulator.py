from typing import Optional
from dataclasses import dataclass
from decimal import Decimal
import uuid


@dataclass
class PaymentSimulationResult:
    success: bool
    gateway_reference: str
    failure_code: Optional[str] = None
    message: Optional[str] = None


class PaymentSimulator:
    """
    Deterministic simulated payment gateway component with controllable outcomes.
    Supports SUCCESS, FAILURE, and optional error code injection without calling real external APIs.
    """

    @staticmethod
    def process_payment(
        amount: Decimal,
        currency: str,
        method: str = "mock",
        idempotency_key: str = "",
        simulate_failure: bool = False,
        failure_code: Optional[str] = None
    ) -> PaymentSimulationResult:
        if simulate_failure:
            return PaymentSimulationResult(
                success=False,
                gateway_reference=f"gw_fail_{uuid.uuid4().hex[:12]}",
                failure_code=failure_code or "card_declined",
                message="Simulated payment authorization failed"
            )

        return PaymentSimulationResult(
            success=True,
            gateway_reference=f"gw_succ_{uuid.uuid4().hex[:12]}",
            failure_code=None,
            message="Payment successfully authorized and captured"
        )
