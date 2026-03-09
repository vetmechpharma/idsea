from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, hmac, hashlib, smtplib
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_client = AsyncIOMotorClient(mongo_url)
db = db_client[os.environ['DB_NAME']]

app = FastAPI(title="IDSEA API")
api_router = APIRouter(prefix="/api")

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'idsea-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT_VAL = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@idsea.org')


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# =================== MODELS ===================

class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    role: str = "admin"
    created_at: str = Field(default_factory=now_iso)


class AdminLogin(BaseModel):
    email: str
    password: str


class Member(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    qualification: Optional[str] = ""
    specialization: Optional[str] = ""
    organization: Optional[str] = ""
    address: Optional[str] = ""
    state: Optional[str] = ""
    phone: Optional[str] = ""
    email: str
    photo_url: Optional[str] = ""
    membership_type: str
    membership_id: Optional[str] = ""
    join_date: Optional[str] = ""
    payment_status: str = "pending"
    status: str = "pending"
    amount_paid: Optional[float] = 0
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class MemberCreate(BaseModel):
    name: str
    qualification: Optional[str] = ""
    specialization: Optional[str] = ""
    organization: Optional[str] = ""
    address: Optional[str] = ""
    state: Optional[str] = ""
    phone: Optional[str] = ""
    email: str
    photo_url: Optional[str] = ""
    membership_type: str
    payment_status: str = "pending"


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    organization: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    membership_type: Optional[str] = None
    payment_status: Optional[str] = None
    status: Optional[str] = None


class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    date: str
    end_date: Optional[str] = ""
    venue: str
    description: Optional[str] = ""
    registration_fee: Optional[float] = 0
    brochure_url: Optional[str] = ""
    speaker_details: Optional[str] = ""
    status: str = "upcoming"
    image_url: Optional[str] = ""
    created_at: str = Field(default_factory=now_iso)


class EventCreate(BaseModel):
    title: str
    date: str
    end_date: Optional[str] = ""
    venue: str
    description: Optional[str] = ""
    registration_fee: Optional[float] = 0
    brochure_url: Optional[str] = ""
    speaker_details: Optional[str] = ""
    status: str = "upcoming"
    image_url: Optional[str] = ""


class News(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    category: str = "general"
    image_url: Optional[str] = ""
    published_date: str
    status: str = "published"
    created_at: str = Field(default_factory=now_iso)


class NewsCreate(BaseModel):
    title: str
    content: str
    category: str = "general"
    image_url: Optional[str] = ""
    published_date: str
    status: str = "published"


class GalleryAlbum(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = ""
    cover_image: Optional[str] = ""
    category: str = "conference"
    created_at: str = Field(default_factory=now_iso)


class GalleryAlbumCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    cover_image: Optional[str] = ""
    category: str = "conference"


class GalleryPhoto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    album_id: str
    title: Optional[str] = ""
    image_url: str
    created_at: str = Field(default_factory=now_iso)


class GalleryPhotoCreate(BaseModel):
    album_id: str
    title: Optional[str] = ""
    image_url: str


class Publication(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    author: str
    abstract: Optional[str] = ""
    pdf_url: Optional[str] = ""
    category: str = "research"
    published_date: Optional[str] = ""
    created_at: str = Field(default_factory=now_iso)


class PublicationCreate(BaseModel):
    title: str
    author: str
    abstract: Optional[str] = ""
    pdf_url: Optional[str] = ""
    category: str = "research"
    published_date: Optional[str] = ""


class ExecutiveCommittee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    designation: str
    profile: Optional[str] = ""
    photo_url: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    order: int = 0
    created_at: str = Field(default_factory=now_iso)


class ExecutiveCreate(BaseModel):
    name: str
    designation: str
    profile: Optional[str] = ""
    photo_url: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    order: int = 0


class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_id: Optional[str] = ""
    member_name: Optional[str] = ""
    member_email: Optional[str] = ""
    membership_type: Optional[str] = ""
    amount: float
    currency: str = "INR"
    payment_method: str = "razorpay"
    razorpay_order_id: Optional[str] = ""
    razorpay_payment_id: Optional[str] = ""
    status: str = "pending"
    created_at: str = Field(default_factory=now_iso)


class PaymentOrder(BaseModel):
    amount: float
    currency: str = "INR"
    member_id: Optional[str] = ""
    member_name: Optional[str] = ""
    member_email: Optional[str] = ""
    membership_type: Optional[str] = ""


class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    payment_id: str


class EmailRequest(BaseModel):
    recipients: List[str] = []
    subject: str
    body: str
    recipient_group: Optional[str] = "custom"


class CertificateRequest(BaseModel):
    member_id: str
    certificate_type: str
    event_name: Optional[str] = ""
    issue_date: Optional[str] = ""


class CMSSettings(BaseModel):
    about_content: Optional[str] = ""
    vision: Optional[str] = ""
    mission: Optional[str] = ""
    contact_email: Optional[str] = ""
    contact_phone: Optional[str] = ""
    contact_address: Optional[str] = ""
    facebook_url: Optional[str] = ""
    twitter_url: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    website_name: Optional[str] = "IDSEA"
    hero_title: Optional[str] = ""
    hero_subtitle: Optional[str] = ""


# =================== AUTH UTILS ===================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id = payload.get("sub")
        if not admin_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        return admin
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_razorpay_client():
    if RAZORPAY_AVAILABLE and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
        return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    return None


def send_email_smtp(recipients: List[str], subject: str, body: str):
    if not SMTP_HOST or not SMTP_USER:
        logging.warning("SMTP not configured, email skipped")
        return False
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"IDSEA <{FROM_EMAIL}>"
        msg['To'] = ', '.join(recipients[:50])
        msg.attach(MIMEText(body, 'html'))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT_VAL) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, recipients, msg.as_string())
        return True
    except Exception as e:
        logging.error(f"Email error: {e}")
        return False


# =================== AUTH ROUTES ===================

@api_router.post("/auth/login")
async def admin_login(data: AdminLogin):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not admin or not verify_password(data.password, admin.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": admin["id"], "role": admin["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {"id": admin["id"], "email": admin["email"], "role": admin["role"], "username": admin["username"]}
    }


@api_router.get("/auth/me")
async def get_me(admin=Depends(get_current_admin)):
    return {"id": admin["id"], "email": admin["email"], "role": admin["role"], "username": admin["username"]}


# =================== PUBLIC ROUTES ===================

@api_router.get("/public/stats")
async def get_public_stats():
    return {
        "total_members": await db.members.count_documents({"status": "approved"}),
        "total_events": await db.events.count_documents({}),
        "total_publications": await db.publications.count_documents({}),
        "upcoming_events": await db.events.count_documents({"status": "upcoming"})
    }


@api_router.get("/public/members")
async def get_public_members(
    state: Optional[str] = None,
    specialization: Optional[str] = None,
    membership_type: Optional[str] = None,
    search: Optional[str] = None
):
    query: dict = {"status": "approved"}
    if state and state != "all":
        query["state"] = state
    if specialization:
        query["specialization"] = {"$regex": specialization, "$options": "i"}
    if membership_type and membership_type != "all":
        query["membership_type"] = membership_type
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"organization": {"$regex": search, "$options": "i"}},
            {"specialization": {"$regex": search, "$options": "i"}}
        ]
    members = await db.members.find(query, {"_id": 0, "phone": 0, "address": 0}).to_list(500)
    return members


@api_router.post("/public/members/apply")
async def apply_membership(data: MemberCreate):
    existing = await db.members.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    member = Member(**data.model_dump())
    member.join_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.members.insert_one(member.model_dump())
    return {"message": "Application submitted successfully", "id": member.id}


@api_router.get("/public/events")
async def get_public_events():
    return await db.events.find({}, {"_id": 0}).sort("date", -1).to_list(100)


@api_router.get("/public/events/{event_id}")
async def get_public_event(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@api_router.get("/public/news")
async def get_public_news(category: Optional[str] = None):
    query: dict = {"status": "published"}
    if category and category != "all":
        query["category"] = category
    return await db.news.find(query, {"_id": 0}).sort("published_date", -1).to_list(50)


@api_router.get("/public/gallery")
async def get_public_gallery():
    albums = await db.gallery_albums.find({}, {"_id": 0}).to_list(50)
    for album in albums:
        photos = await db.gallery_photos.find({"album_id": album["id"]}, {"_id": 0}).to_list(50)
        album["photos"] = photos
        album["photo_count"] = len(photos)
    return albums


@api_router.get("/public/publications")
async def get_public_publications(category: Optional[str] = None):
    query: dict = {}
    if category and category != "all":
        query["category"] = category
    return await db.publications.find(query, {"_id": 0}).to_list(100)


@api_router.get("/public/executive")
async def get_public_executive():
    return await db.executive_committee.find({}, {"_id": 0}).sort("order", 1).to_list(50)


@api_router.get("/public/cms")
async def get_public_cms():
    settings = await db.cms_settings.find_one({}, {"_id": 0})
    return settings or {}


# =================== ADMIN MEMBER ROUTES ===================

@api_router.get("/admin/members")
async def admin_get_members(
    status: Optional[str] = None,
    membership_type: Optional[str] = None,
    search: Optional[str] = None,
    admin=Depends(get_current_admin)
):
    query: dict = {}
    if status and status != "all":
        query["status"] = status
    if membership_type and membership_type != "all":
        query["membership_type"] = membership_type
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"organization": {"$regex": search, "$options": "i"}}
        ]
    return await db.members.find(query, {"_id": 0}).to_list(1000)


@api_router.get("/admin/members/{member_id}")
async def admin_get_member(member_id: str, admin=Depends(get_current_admin)):
    member = await db.members.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


@api_router.post("/admin/members")
async def admin_create_member(data: MemberCreate, admin=Depends(get_current_admin)):
    existing = await db.members.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    member = Member(**data.model_dump(), status="approved")
    member.join_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    count = await db.members.count_documents({"status": "approved"})
    member.membership_id = f"IDSEA{datetime.now().year}{str(count+1).zfill(4)}"
    await db.members.insert_one(member.model_dump())
    return member.model_dump()


@api_router.put("/admin/members/{member_id}")
async def admin_update_member(member_id: str, data: MemberUpdate, admin=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = now_iso()
    await db.members.update_one({"id": member_id}, {"$set": update_data})
    return {"message": "Member updated"}


@api_router.delete("/admin/members/{member_id}")
async def admin_delete_member(member_id: str, admin=Depends(get_current_admin)):
    await db.members.delete_one({"id": member_id})
    return {"message": "Member deleted"}


@api_router.put("/admin/members/{member_id}/approve")
async def approve_member(member_id: str, admin=Depends(get_current_admin)):
    count = await db.members.count_documents({"status": "approved"})
    membership_id = f"IDSEA{datetime.now().year}{str(count+1).zfill(4)}"
    await db.members.update_one(
        {"id": member_id},
        {"$set": {"status": "approved", "membership_id": membership_id, "updated_at": now_iso()}}
    )
    return {"message": "Member approved", "membership_id": membership_id}


@api_router.put("/admin/members/{member_id}/reject")
async def reject_member(member_id: str, admin=Depends(get_current_admin)):
    await db.members.update_one(
        {"id": member_id},
        {"$set": {"status": "rejected", "updated_at": now_iso()}}
    )
    return {"message": "Member rejected"}


# =================== ADMIN EVENT ROUTES ===================

@api_router.get("/admin/events")
async def admin_get_events(admin=Depends(get_current_admin)):
    return await db.events.find({}, {"_id": 0}).sort("date", -1).to_list(200)


@api_router.post("/admin/events")
async def admin_create_event(data: EventCreate, admin=Depends(get_current_admin)):
    event = Event(**data.model_dump())
    await db.events.insert_one(event.model_dump())
    return event.model_dump()


@api_router.put("/admin/events/{event_id}")
async def admin_update_event(event_id: str, data: EventCreate, admin=Depends(get_current_admin)):
    await db.events.update_one({"id": event_id}, {"$set": data.model_dump()})
    return {"message": "Event updated"}


@api_router.delete("/admin/events/{event_id}")
async def admin_delete_event(event_id: str, admin=Depends(get_current_admin)):
    await db.events.delete_one({"id": event_id})
    return {"message": "Event deleted"}


# =================== ADMIN NEWS ROUTES ===================

@api_router.get("/admin/news")
async def admin_get_news(admin=Depends(get_current_admin)):
    return await db.news.find({}, {"_id": 0}).sort("published_date", -1).to_list(200)


@api_router.post("/admin/news")
async def admin_create_news(data: NewsCreate, admin=Depends(get_current_admin)):
    news_item = News(**data.model_dump())
    await db.news.insert_one(news_item.model_dump())
    return news_item.model_dump()


@api_router.put("/admin/news/{news_id}")
async def admin_update_news(news_id: str, data: NewsCreate, admin=Depends(get_current_admin)):
    await db.news.update_one({"id": news_id}, {"$set": data.model_dump()})
    return {"message": "News updated"}


@api_router.delete("/admin/news/{news_id}")
async def admin_delete_news(news_id: str, admin=Depends(get_current_admin)):
    await db.news.delete_one({"id": news_id})
    return {"message": "News deleted"}


# =================== ADMIN GALLERY ROUTES ===================

@api_router.get("/admin/gallery/albums")
async def admin_get_albums(admin=Depends(get_current_admin)):
    albums = await db.gallery_albums.find({}, {"_id": 0}).to_list(100)
    for album in albums:
        photos = await db.gallery_photos.find({"album_id": album["id"]}, {"_id": 0}).to_list(100)
        album["photos"] = photos
        album["photo_count"] = len(photos)
    return albums


@api_router.post("/admin/gallery/albums")
async def admin_create_album(data: GalleryAlbumCreate, admin=Depends(get_current_admin)):
    album = GalleryAlbum(**data.model_dump())
    await db.gallery_albums.insert_one(album.model_dump())
    return album.model_dump()


@api_router.put("/admin/gallery/albums/{album_id}")
async def admin_update_album(album_id: str, data: GalleryAlbumCreate, admin=Depends(get_current_admin)):
    await db.gallery_albums.update_one({"id": album_id}, {"$set": data.model_dump()})
    return {"message": "Album updated"}


@api_router.delete("/admin/gallery/albums/{album_id}")
async def admin_delete_album(album_id: str, admin=Depends(get_current_admin)):
    await db.gallery_albums.delete_one({"id": album_id})
    await db.gallery_photos.delete_many({"album_id": album_id})
    return {"message": "Album deleted"}


@api_router.get("/admin/gallery/photos/{album_id}")
async def admin_get_photos(album_id: str, admin=Depends(get_current_admin)):
    return await db.gallery_photos.find({"album_id": album_id}, {"_id": 0}).to_list(200)


@api_router.post("/admin/gallery/photos")
async def admin_add_photo(data: GalleryPhotoCreate, admin=Depends(get_current_admin)):
    photo = GalleryPhoto(**data.model_dump())
    await db.gallery_photos.insert_one(photo.model_dump())
    album = await db.gallery_albums.find_one({"id": data.album_id})
    if album and not album.get("cover_image"):
        await db.gallery_albums.update_one({"id": data.album_id}, {"$set": {"cover_image": data.image_url}})
    return photo.model_dump()


@api_router.delete("/admin/gallery/photos/{photo_id}")
async def admin_delete_photo(photo_id: str, admin=Depends(get_current_admin)):
    await db.gallery_photos.delete_one({"id": photo_id})
    return {"message": "Photo deleted"}


# =================== ADMIN PUBLICATIONS ===================

@api_router.get("/admin/publications")
async def admin_get_publications(admin=Depends(get_current_admin)):
    return await db.publications.find({}, {"_id": 0}).to_list(200)


@api_router.post("/admin/publications")
async def admin_create_publication(data: PublicationCreate, admin=Depends(get_current_admin)):
    pub = Publication(**data.model_dump())
    await db.publications.insert_one(pub.model_dump())
    return pub.model_dump()


@api_router.put("/admin/publications/{pub_id}")
async def admin_update_publication(pub_id: str, data: PublicationCreate, admin=Depends(get_current_admin)):
    await db.publications.update_one({"id": pub_id}, {"$set": data.model_dump()})
    return {"message": "Publication updated"}


@api_router.delete("/admin/publications/{pub_id}")
async def admin_delete_publication(pub_id: str, admin=Depends(get_current_admin)):
    await db.publications.delete_one({"id": pub_id})
    return {"message": "Publication deleted"}


# =================== ADMIN EXECUTIVE ===================

@api_router.get("/admin/executive")
async def admin_get_executive(admin=Depends(get_current_admin)):
    return await db.executive_committee.find({}, {"_id": 0}).sort("order", 1).to_list(50)


@api_router.post("/admin/executive")
async def admin_create_executive(data: ExecutiveCreate, admin=Depends(get_current_admin)):
    exec_member = ExecutiveCommittee(**data.model_dump())
    await db.executive_committee.insert_one(exec_member.model_dump())
    return exec_member.model_dump()


@api_router.put("/admin/executive/{exec_id}")
async def admin_update_executive(exec_id: str, data: ExecutiveCreate, admin=Depends(get_current_admin)):
    await db.executive_committee.update_one({"id": exec_id}, {"$set": data.model_dump()})
    return {"message": "Updated"}


@api_router.delete("/admin/executive/{exec_id}")
async def admin_delete_executive(exec_id: str, admin=Depends(get_current_admin)):
    await db.executive_committee.delete_one({"id": exec_id})
    return {"message": "Deleted"}


# =================== ADMIN EMAIL ===================

@api_router.post("/admin/email/send")
async def admin_send_email(data: EmailRequest, background_tasks: BackgroundTasks, admin=Depends(get_current_admin)):
    recipients = list(data.recipients)
    if data.recipient_group != "custom":
        query: dict = {"status": "approved"}
        if data.recipient_group in ["academic", "entrepreneur", "corporate"]:
            query["membership_type"] = data.recipient_group
        members = await db.members.find(query, {"email": 1, "_id": 0}).to_list(1000)
        recipients = [m["email"] for m in members if m.get("email")]
    log = {
        "id": str(uuid.uuid4()),
        "subject": data.subject,
        "body": data.body[:300],
        "recipients_count": len(recipients),
        "recipient_group": data.recipient_group,
        "sent_by": admin["email"],
        "sent_at": now_iso(),
        "status": "queued"
    }
    await db.email_logs.insert_one(log)
    background_tasks.add_task(send_email_smtp, recipients, data.subject, data.body)
    return {"message": f"Email queued for {len(recipients)} recipients", "log_id": log["id"]}


@api_router.get("/admin/email/logs")
async def admin_get_email_logs(admin=Depends(get_current_admin)):
    logs = await db.email_logs.find({}, {"_id": 0}).sort("sent_at", -1).to_list(100)
    return logs


# =================== PAYMENTS ===================

@api_router.post("/payments/create-order")
async def create_payment_order(data: PaymentOrder):
    payment = Payment(
        member_id=data.member_id,
        member_name=data.member_name,
        member_email=data.member_email,
        membership_type=data.membership_type,
        amount=data.amount,
        currency=data.currency
    )
    razorpay_order_id = ""
    rzp_client = get_razorpay_client()
    if rzp_client:
        try:
            order = rzp_client.order.create({
                "amount": int(data.amount * 100),
                "currency": data.currency,
                "payment_capture": 1,
                "receipt": f"rcpt_{payment.id[:20]}"
            })
            razorpay_order_id = order["id"]
            payment.razorpay_order_id = razorpay_order_id
        except Exception as e:
            logging.error(f"Razorpay error: {e}")
    await db.payments.insert_one(payment.model_dump())
    return {
        "payment_id": payment.id,
        "razorpay_order_id": razorpay_order_id,
        "amount": data.amount,
        "currency": data.currency,
        "key_id": RAZORPAY_KEY_ID
    }


@api_router.post("/payments/verify")
async def verify_payment(data: PaymentVerify):
    if RAZORPAY_KEY_SECRET:
        msg = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode('utf-8'),
            msg.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, data.razorpay_signature):
            raise HTTPException(status_code=400, detail="Payment verification failed")
    await db.payments.update_one(
        {"id": data.payment_id},
        {"$set": {"razorpay_payment_id": data.razorpay_payment_id, "status": "paid"}}
    )
    payment = await db.payments.find_one({"id": data.payment_id}, {"_id": 0})
    if payment and payment.get("member_id"):
        await db.members.update_one(
            {"id": payment["member_id"]},
            {"$set": {"payment_status": "paid", "amount_paid": payment["amount"]}}
        )
    return {"message": "Payment verified", "status": "paid"}


@api_router.get("/admin/payments")
async def admin_get_payments(admin=Depends(get_current_admin)):
    return await db.payments.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.post("/admin/payments/manual")
async def admin_add_manual_payment(data: dict, admin=Depends(get_current_admin)):
    payment = Payment(
        member_id=data.get("member_id", ""),
        member_name=data.get("member_name", ""),
        member_email=data.get("member_email", ""),
        membership_type=data.get("membership_type", ""),
        amount=float(data.get("amount", 0)),
        payment_method="manual",
        status="paid"
    )
    await db.payments.insert_one(payment.model_dump())
    return payment.model_dump()


# =================== REPORTS & DASHBOARD ===================

@api_router.get("/admin/reports/stats")
async def admin_reports_stats(admin=Depends(get_current_admin)):
    total_members = await db.members.count_documents({})
    approved = await db.members.count_documents({"status": "approved"})
    pending = await db.members.count_documents({"status": "pending"})
    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    new_month = await db.members.count_documents({"created_at": {"$gte": start_of_month}})
    paid_payments = await db.payments.find({"status": "paid"}, {"amount": 1, "_id": 0}).to_list(1000)
    total_revenue = sum(p.get("amount", 0) for p in paid_payments)
    academic = await db.members.count_documents({"membership_type": "academic", "status": "approved"})
    entrepreneur = await db.members.count_documents({"membership_type": "entrepreneur", "status": "approved"})
    corporate = await db.members.count_documents({"membership_type": "corporate", "status": "approved"})
    pipeline = [
        {"$match": {"status": "approved", "state": {"$nin": ["", None]}}},
        {"$group": {"_id": "$state", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    state_stats = await db.members.aggregate(pipeline).to_list(10)
    state_stats = [{"state": s["_id"], "count": s["count"]} for s in state_stats if s["_id"]]
    return {
        "total_members": total_members,
        "approved_members": approved,
        "pending_members": pending,
        "new_this_month": new_month,
        "total_revenue": total_revenue,
        "membership_types": {"academic": academic, "entrepreneur": entrepreneur, "corporate": corporate},
        "events": {
            "total": await db.events.count_documents({}),
            "upcoming": await db.events.count_documents({"status": "upcoming"})
        },
        "state_stats": state_stats
    }


@api_router.get("/admin/dashboard")
async def admin_dashboard(admin=Depends(get_current_admin)):
    total_members = await db.members.count_documents({})
    pending_approvals = await db.members.count_documents({"status": "pending"})
    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    new_this_month = await db.members.count_documents({"created_at": {"$gte": start_of_month}})
    upcoming_events = await db.events.count_documents({"status": "upcoming"})
    recent_members = await db.members.find({}, {"_id": 0, "name": 1, "membership_type": 1, "status": 1, "created_at": 1, "email": 1}).sort("created_at", -1).to_list(5)
    recent_payments = await db.payments.find({}, {"_id": 0, "member_name": 1, "amount": 1, "status": 1, "created_at": 1, "membership_type": 1}).sort("created_at", -1).to_list(5)
    return {
        "total_members": total_members,
        "pending_approvals": pending_approvals,
        "new_this_month": new_this_month,
        "upcoming_events": upcoming_events,
        "recent_members": recent_members,
        "recent_payments": recent_payments
    }


# =================== CMS ===================

@api_router.get("/admin/cms")
async def admin_get_cms(admin=Depends(get_current_admin)):
    settings = await db.cms_settings.find_one({}, {"_id": 0})
    return settings or {}


@api_router.put("/admin/cms")
async def admin_update_cms(data: CMSSettings, admin=Depends(get_current_admin)):
    settings_dict = data.model_dump()
    settings_dict["updated_at"] = now_iso()
    await db.cms_settings.update_one({}, {"$set": settings_dict}, upsert=True)
    return {"message": "CMS updated"}


# =================== ADMIN USER MANAGEMENT ===================

@api_router.get("/admin/users")
async def admin_get_users(admin=Depends(get_current_admin)):
    return await db.admins.find({}, {"_id": 0, "password_hash": 0}).to_list(100)


@api_router.post("/admin/users")
async def admin_create_user(data: dict, admin=Depends(get_current_admin)):
    if admin.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admin can create users")
    new_admin = AdminUser(
        username=data["username"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        role=data.get("role", "admin")
    )
    await db.admins.insert_one(new_admin.model_dump())
    return {"id": new_admin.id, "email": new_admin.email, "role": new_admin.role, "username": new_admin.username}


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(get_current_admin)):
    if admin.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admin can delete users")
    await db.admins.delete_one({"id": user_id})
    return {"message": "User deleted"}


# =================== CERTIFICATES ===================

@api_router.post("/admin/certificates/generate")
async def generate_certificate(data: CertificateRequest, admin=Depends(get_current_admin)):
    member = await db.members.find_one({"id": data.member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    cert_id = str(uuid.uuid4())[:8].upper()
    issue_date = data.issue_date or datetime.now().strftime("%d %B %Y")
    certificate = {
        "id": cert_id,
        "member_id": data.member_id,
        "member_name": member["name"],
        "membership_id": member.get("membership_id", ""),
        "certificate_type": data.certificate_type,
        "event_name": data.event_name,
        "issue_date": issue_date,
        "issued_by": admin["username"],
        "created_at": now_iso()
    }
    await db.certificates.insert_one(certificate)
    return certificate


@api_router.get("/admin/certificates")
async def admin_get_certificates(admin=Depends(get_current_admin)):
    return await db.certificates.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


# =================== APP SETUP ===================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    if not await db.admins.find_one({"email": "admin@idsea.org"}):
        await db.admins.insert_one(AdminUser(
            username="Super Admin",
            email="admin@idsea.org",
            password_hash=hash_password("Admin@123"),
            role="super_admin"
        ).model_dump())
        logger.info("Default admin created: admin@idsea.org / Admin@123")

    if await db.executive_committee.count_documents({}) == 0:
        execs = [
            {"name": "Dr. A. Elango", "designation": "President", "profile": "Dean, Veterinary College and Research Institute, Salem", "order": 1, "email": "", "phone": "", "photo_url": ""},
            {"name": "Dr. G. Kumaresan", "designation": "Vice President", "profile": "Professor and Head, Dept. of Livestock Products Technology, VCRI Namakkal", "order": 2, "email": "", "phone": "", "photo_url": ""},
            {"name": "Dr. N. Karthikeyan", "designation": "General Secretary", "profile": "Professor, Dept. of Livestock Products Technology, VCRI Namakkal", "order": 3, "email": "", "phone": "", "photo_url": ""},
            {"name": "Dr. C. Pandiyan", "designation": "Joint Secretary", "profile": "Professor, Dept. of Livestock Products Technology, VCRI Namakkal", "order": 4, "email": "", "phone": "", "photo_url": ""},
            {"name": "Dr. L. Vijay", "designation": "Treasurer", "profile": "Veterinary Assistant Surgeon, Dept. of Animal Husbandry, Govt. of Tamil Nadu", "order": 5, "email": "", "phone": "", "photo_url": ""},
        ]
        for e in execs:
            await db.executive_committee.insert_one(ExecutiveCommittee(**e).model_dump())

    if await db.cms_settings.count_documents({}) == 0:
        await db.cms_settings.insert_one({
            "website_name": "IDSEA",
            "hero_title": "Indian Dairy Scientists and Entrepreneurs Association",
            "hero_subtitle": "Bridging Dairy Science, Innovation & Entrepreneurship for Sustainable Growth",
            "about_content": "IDSEA is a national professional and scientific body established to bridge the gap between dairy scientists and dairy entrepreneurs. We bring together dairy scientists, academicians, technologists, entrepreneurs, industry experts, startups, cooperatives, corporate bodies, and students under one umbrella.",
            "vision": "To be a premier national and international platform integrating dairy science, innovation, and entrepreneurship for the sustainable growth of the Indian dairy sector.",
            "mission": "To promote advancement and dissemination of knowledge in dairy science, facilitate academia-industry-startup collaboration, and support dairy entrepreneurs through knowledge sharing and capacity building.",
            "contact_email": "info@idsea.org",
            "contact_phone": "+91 98765 43210",
            "contact_address": "Dept. of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002, Tamil Nadu, India",
            "facebook_url": "", "twitter_url": "", "linkedin_url": "",
            "updated_at": now_iso()
        })


@app.on_event("shutdown")
async def shutdown_db_client():
    db_client.close()
