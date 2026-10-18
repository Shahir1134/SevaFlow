import logging
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.profile import FamilyProfile, ProfileMember
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileRead

logger = logging.getLogger(__name__)


class OnboardingService:
    @staticmethod
    async def complete_onboarding(
        payload: ProfileCreate, user: User, db: AsyncSession
    ) -> ProfileRead:
        """Validate and persist family profile and member details for onboarding."""
        # Check if active profile already exists for this user
        query = select(FamilyProfile).where(
            FamilyProfile.user_id == user.id,
            FamilyProfile.deleted_at.is_(None),
        )
        res = await db.execute(query)
        existing_profile = res.scalar_one_or_none()

        if existing_profile:
            profile = existing_profile
            profile.name = payload.name
            profile.primary_contact_phone = payload.primary_contact_phone or user.phone_number
            profile.city = payload.city
            profile.state = payload.state
            profile.pin_code = payload.pin_code
        else:
            profile = FamilyProfile(
                id=uuid.uuid4(),
                user_id=user.id,
                name=payload.name,
                primary_contact_phone=payload.primary_contact_phone or user.phone_number,
                city=payload.city,
                state=payload.state,
                pin_code=payload.pin_code,
            )
            db.add(profile)

        await db.flush()

        # Add or update members
        members_created: list[ProfileMember] = []
        for mem_data in payload.members:
            member = ProfileMember(
                id=uuid.uuid4(),
                profile_id=profile.id,
                user_id=user.id,
                name=mem_data.name,
                relationship=mem_data.relationship,
                date_of_birth=mem_data.date_of_birth,
                gender=mem_data.gender,
                blood_group=mem_data.blood_group,
                pre_existing_conditions=mem_data.pre_existing_conditions,
            )
            db.add(member)
            members_created.append(member)

        await db.commit()
        await db.refresh(profile)

        # Fetch all active members
        members_query = select(ProfileMember).where(
            ProfileMember.profile_id == profile.id,
            ProfileMember.deleted_at.is_(None),
        )
        members_res = await db.execute(members_query)
        profile_members = list(members_res.scalars().all())

        from app.schemas.profile import MemberRead
        return ProfileRead(
            id=profile.id,
            user_id=profile.user_id,
            name=profile.name,
            primary_contact_phone=profile.primary_contact_phone,
            city=profile.city,
            state=profile.state,
            pin_code=profile.pin_code,
            created_at=profile.created_at,
            members=[MemberRead.model_validate(m) for m in profile_members],
        )
