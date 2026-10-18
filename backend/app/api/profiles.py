import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.profile import FamilyProfile, ProfileMember
from app.models.user import User
from app.schemas.profile import MemberCreate, MemberRead, ProfileCreate, ProfileRead, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["Family Profiles"])


@router.post("", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = FamilyProfile(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=payload.name,
        primary_contact_phone=payload.primary_contact_phone or current_user.phone_number,
        city=payload.city,
        state=payload.state,
        pin_code=payload.pin_code,
    )
    db.add(profile)
    await db.flush()

    members_created: list[ProfileMember] = []
    for m in payload.members:
        member = ProfileMember(
            id=uuid.uuid4(),
            profile_id=profile.id,
            user_id=current_user.id,
            name=m.name,
            relationship=m.relationship,
            date_of_birth=m.date_of_birth,
            gender=m.gender,
            blood_group=m.blood_group,
            pre_existing_conditions=m.pre_existing_conditions,
        )
        db.add(member)
        members_created.append(member)

    await db.commit()
    await db.refresh(profile)

    return ProfileRead(
        id=profile.id,
        user_id=profile.user_id,
        name=profile.name,
        primary_contact_phone=profile.primary_contact_phone,
        city=profile.city,
        state=profile.state,
        pin_code=profile.pin_code,
        created_at=profile.created_at,
        members=[MemberRead.model_validate(m) for m in members_created],
    )


@router.get("", response_model=list[ProfileRead])
async def list_profiles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(FamilyProfile)
        .where(
            FamilyProfile.user_id == current_user.id,
            FamilyProfile.deleted_at.is_(None),
        )
        .order_by(FamilyProfile.created_at.desc())
    )
    res = await db.execute(stmt)
    profiles = res.scalars().all()

    results: list[ProfileRead] = []
    for p in profiles:
        mem_stmt = select(ProfileMember).where(
            ProfileMember.profile_id == p.id,
            ProfileMember.deleted_at.is_(None),
        )
        mem_res = await db.execute(mem_stmt)
        members = mem_res.scalars().all()
        results.append(
            ProfileRead(
                id=p.id,
                user_id=p.user_id,
                name=p.name,
                primary_contact_phone=p.primary_contact_phone,
                city=p.city,
                state=p.state,
                pin_code=p.pin_code,
                created_at=p.created_at,
                members=[MemberRead.model_validate(m) for m in members],
            )
        )
    return results


@router.get("/{profile_id}", response_model=ProfileRead)
async def get_profile(
    profile_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(FamilyProfile).where(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id,
        FamilyProfile.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    mem_stmt = select(ProfileMember).where(
        ProfileMember.profile_id == profile.id,
        ProfileMember.deleted_at.is_(None),
    )
    mem_res = await db.execute(mem_stmt)
    members = mem_res.scalars().all()

    return ProfileRead(
        id=profile.id,
        user_id=profile.user_id,
        name=profile.name,
        primary_contact_phone=profile.primary_contact_phone,
        city=profile.city,
        state=profile.state,
        pin_code=profile.pin_code,
        created_at=profile.created_at,
        members=[MemberRead.model_validate(m) for m in members],
    )


@router.put("/{profile_id}", response_model=ProfileRead)
async def update_profile(
    profile_id: uuid.UUID,
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(FamilyProfile).where(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id,
        FamilyProfile.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    if payload.name is not None:
        profile.name = payload.name
    if payload.primary_contact_phone is not None:
        profile.primary_contact_phone = payload.primary_contact_phone
    if payload.city is not None:
        profile.city = payload.city
    if payload.state is not None:
        profile.state = payload.state
    if payload.pin_code is not None:
        profile.pin_code = payload.pin_code

    await db.commit()
    await db.refresh(profile)

    mem_stmt = select(ProfileMember).where(
        ProfileMember.profile_id == profile.id,
        ProfileMember.deleted_at.is_(None),
    )
    mem_res = await db.execute(mem_stmt)
    members = mem_res.scalars().all()

    return ProfileRead(
        id=profile.id,
        user_id=profile.user_id,
        name=profile.name,
        primary_contact_phone=profile.primary_contact_phone,
        city=profile.city,
        state=profile.state,
        pin_code=profile.pin_code,
        created_at=profile.created_at,
        members=[MemberRead.model_validate(m) for m in members],
    )


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(FamilyProfile).where(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id,
        FamilyProfile.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    profile.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return None


@router.post("/{profile_id}/members", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
async def add_member(
    profile_id: uuid.UUID,
    payload: MemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify profile ownership
    stmt = select(FamilyProfile).where(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id,
        FamilyProfile.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    member = ProfileMember(
        id=uuid.uuid4(),
        profile_id=profile.id,
        user_id=current_user.id,
        name=payload.name,
        relationship=payload.relationship,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        blood_group=payload.blood_group,
        pre_existing_conditions=payload.pre_existing_conditions,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    return MemberRead.model_validate(member)


@router.get("/{profile_id}/members", response_model=list[MemberRead])
async def list_members(
    profile_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify profile ownership
    stmt = select(FamilyProfile).where(
        FamilyProfile.id == profile_id,
        FamilyProfile.user_id == current_user.id,
        FamilyProfile.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    mem_stmt = select(ProfileMember).where(
        ProfileMember.profile_id == profile.id,
        ProfileMember.deleted_at.is_(None),
    )
    mem_res = await db.execute(mem_stmt)
    members = mem_res.scalars().all()
    return [MemberRead.model_validate(m) for m in members]


@router.delete("/{profile_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(
    profile_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ProfileMember).where(
        ProfileMember.id == member_id,
        ProfileMember.profile_id == profile_id,
        ProfileMember.user_id == current_user.id,
        ProfileMember.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    member = res.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")

    member.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return None
