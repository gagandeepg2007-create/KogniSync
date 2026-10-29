class RepositoryError(Exception):
    """Base exception for repository layer errors."""
    pass


class InventoryNotFoundError(RepositoryError):
    """Raised when a requested inventory_calendar record is not found."""
    pass


class InsufficientInventoryError(RepositoryError):
    """Raised when available units (total - booked - held) are insufficient."""
    pass


class RepositoryConflictError(RepositoryError):
    """Raised when a unique constraint or idempotency conflict occurs."""
    pass


class IdempotencyPayloadConflictError(RepositoryConflictError):
    """Raised when an idempotency key is reused with a materially different request payload."""
    pass


class HoldNotFoundError(RepositoryError):
    """Raised when a specified hold is not found."""
    pass


class HoldExpiredError(RepositoryError):
    """Raised when an operation is attempted on an expired hold."""
    pass


class HoldNotActiveError(RepositoryError):
    """Raised when a hold is not in active state."""
    pass


class BookingNotFoundError(RepositoryError):
    """Raised when a specified booking is not found."""
    pass


class PaymentFailedError(RepositoryError):
    """Raised when simulated or real payment processing fails."""
    pass
