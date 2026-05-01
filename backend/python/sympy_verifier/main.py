from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

app = FastAPI(title="GATE NAT Answer Verifier", version="1.0.0")

TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application,)


class VerifyRequest(BaseModel):
    correct_answer: str
    user_answer: str
    tolerance: float = 0.01


class VerifyResponse(BaseModel):
    is_correct: bool
    parsed_correct: str
    parsed_user: str
    error: str | None = None


def parse_numeric(expr_str: str) -> float | None:
    try:
        expr = parse_expr(expr_str.strip(), transformations=TRANSFORMATIONS)
        return float(expr.evalf())
    except Exception:
        try:
            return float(expr_str.strip())
        except Exception:
            return None


@app.post("/verify", response_model=VerifyResponse)
def verify_answer(req: VerifyRequest) -> VerifyResponse:
    correct = parse_numeric(req.correct_answer)
    user = parse_numeric(req.user_answer)

    if correct is None:
        raise HTTPException(status_code=422, detail=f"Cannot parse correct answer: {req.correct_answer}")

    if user is None:
        return VerifyResponse(
            is_correct=False,
            parsed_correct=str(correct),
            parsed_user="<unparseable>",
            error=f"Cannot parse user answer: {req.user_answer}",
        )

    is_correct = abs(user - correct) <= req.tolerance

    return VerifyResponse(
        is_correct=is_correct,
        parsed_correct=str(correct),
        parsed_user=str(user),
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "sympy-verifier"}
