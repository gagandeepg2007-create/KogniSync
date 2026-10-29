from fastapi import APIRouter, HTTPException, status
from app.services.ai.schemas import ParseIntentRequest, ParseIntentResponse
from app.services.ai.gemini import intent_service
from app.core.logging import logger

router = APIRouter(prefix="/api/ai", tags=["AI Orchestration"])


@router.post(
    "/parse-travel-intent",
    response_model=ParseIntentResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract structured travel intent from natural language using Gemini",
)
async def parse_travel_intent(request: ParseIntentRequest):
    """
    Extracts travel origin, destination, date, time/deadline, budget, preferences,
    and transport modes from natural language using real Gemini AI.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Input text is required for travel intent extraction.",
        )

    try:
        intent = intent_service.parse_travel_intent(
            text=request.text.strip(),
            current_context=request.current_context,
        )
        return ParseIntentResponse(intent=intent)
    except ValueError as e:
        logger.warning(f"Validation error in travel intent extraction: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except PermissionError as e:
        logger.error(f"Gemini authentication failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Gemini API authentication failed. Please verify API configuration.",
        )
    except TimeoutError as e:
        logger.warning(f"Gemini timeout: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Gemini API request timed out. Please try again.",
        )
    except RuntimeError as e:
        err_str = str(e)
        logger.error(f"Gemini runtime error: {err_str}")
        if "429" in err_str:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Gemini API rate limit or quota exceeded. Please try again shortly.",
            )
        elif "503" in err_str:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API is temporarily experiencing high demand. Please try again.",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini service error: {err_str}",
        )
    except Exception as e:
        logger.error(f"Unexpected error parsing travel intent: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error processing travel intent.",
        )
