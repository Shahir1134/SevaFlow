import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.database import get_db
from app.dependencies import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    limiter,
    verify_password,
)
from app.models.user import RefreshToken, User
from app.schemas.auth import LoginRequest, RefreshTokenRequest, RegisterRequest, TokenResponse, UserRead

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(
    request: Request,
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check if user with email already exists
    existing_stmt = select(User).where(User.email == payload.email, User.deleted_at.is_(None))
    res = await db.execute(existing_stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Create new user
    user = User(
        id=uuid.uuid4(),
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # Generate tokens
    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    refresh_token_str = create_refresh_token({"sub": str(user.id)})

    # Record refresh token in database
    token_record = RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.fromtimestamp(
            decode_token(refresh_token_str)["exp"], tz=timezone.utc
        ),
    )
    db.add(token_record)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.email == payload.email, User.deleted_at.is_(None))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    refresh_token_str = create_refresh_token({"sub": str(user.id)})

    token_record = RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.fromtimestamp(
            decode_token(refresh_token_str)["exp"], tz=timezone.utc
        ),
    )
    db.add(token_record)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    token_payload = decode_token(payload.refresh_token)
    if token_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for refresh.",
        )

    user_id_str = token_payload.get("sub")
    try:
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token identity.",
        )

    # Check refresh token validity in DB
    stmt = select(RefreshToken).where(
        RefreshToken.token == payload.refresh_token,
        RefreshToken.revoked_at.is_(None),
    )
    res = await db.execute(stmt)
    db_token = res.scalar_one_or_none()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked or expired.",
        )

    # Rotate refresh token: revoke current one
    db_token.revoked_at = datetime.now(timezone.utc)

    # Fetch user
    user_stmt = select(User).where(User.id == user_uuid, User.deleted_at.is_(None))
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or deleted.",
        )

    new_access_token = create_access_token({"sub": str(user.id), "email": user.email})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})

    new_token_record = RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        token=new_refresh_token,
        expires_at=datetime.fromtimestamp(
            decode_token(new_refresh_token)["exp"], tz=timezone.utc
        ),
    )
    db.add(new_token_record)
    await db.commit()

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post("/logout")
async def logout(
    payload: RefreshTokenRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(RefreshToken).where(
        RefreshToken.token == payload.refresh_token,
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked_at.is_(None),
    )
    res = await db.execute(stmt)
    token_record = res.scalar_one_or_none()

    if token_record:
        token_record.revoked_at = datetime.now(timezone.utc)
        await db.commit()

    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
