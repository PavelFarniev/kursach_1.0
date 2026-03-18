from pydantic import BaseModel, EmailStr


class UserProfileResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
