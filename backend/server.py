from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, hmac, hashlib, smtplib, io, asyncio, base64
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import openpyxl
import aiofiles

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

UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)


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


class FeeTier(BaseModel):
    name: str = ""
    deadline: str = ""
    fees: dict = {}  # {academic: 0, entrepreneur: 0, corporate: 0, non_member: 0}


class HotelOption(BaseModel):
    name: str = ""
    fee: float = 0
    description: Optional[str] = ""


class AccommodationConfig(BaseModel):
    enabled: bool = False
    self_option: bool = True
    free_categories: List[str] = []
    hotels: List[dict] = []


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
    registration_enabled: bool = False
    allow_membership_registration: bool = False
    fee_tiers: List[dict] = []
    accommodation: dict = {}
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
    registration_enabled: bool = False
    allow_membership_registration: bool = False
    fee_tiers: List[dict] = []
    accommodation: dict = {}


class EventRegistration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    is_member: bool = False
    member_id: Optional[str] = ""
    member_category: Optional[str] = ""
    name: str
    email: str
    phone: str
    qualification: Optional[str] = ""
    organization: Optional[str] = ""
    state: Optional[str] = ""
    accommodation_choice: Optional[str] = ""
    hotel_name: Optional[str] = ""
    wants_membership: bool = False
    membership_type: Optional[str] = ""
    registration_fee: float = 0
    accommodation_fee: float = 0
    membership_fee: float = 0
    total_amount: float = 0
    payment_status: str = "pending"
    payment_mode: str = "offline"
    created_at: str = Field(default_factory=now_iso)


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
    member_id: Optional[str] = ""
    name: str
    designation: str
    affiliation: Optional[str] = ""
    profile: Optional[str] = ""
    photo_url: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    category: str = "council"
    order: int = 0
    created_at: str = Field(default_factory=now_iso)


class ExecutiveCreate(BaseModel):
    member_id: Optional[str] = ""
    name: str
    designation: str
    affiliation: Optional[str] = ""
    profile: Optional[str] = ""
    photo_url: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    category: str = "council"
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


class Slider(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: Optional[str] = ""
    subtitle: Optional[str] = ""
    image_url: str
    link_url: Optional[str] = ""
    order: int = 0
    is_active: bool = True
    created_at: str = Field(default_factory=now_iso)


class SliderCreate(BaseModel):
    title: Optional[str] = ""
    subtitle: Optional[str] = ""
    image_url: str
    link_url: Optional[str] = ""
    order: int = 0
    is_active: bool = True


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
    logo_url: Optional[str] = ""
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


def send_email_smtp(recipients: List[str], subject: str, body: str, smtp_settings: dict = None, attachments: list = None):
    host = smtp_settings.get("smtp_host", SMTP_HOST) if smtp_settings else SMTP_HOST
    port = int(smtp_settings.get("smtp_port", SMTP_PORT_VAL) if smtp_settings else SMTP_PORT_VAL)
    user = smtp_settings.get("smtp_user", SMTP_USER) if smtp_settings else SMTP_USER
    passwd = smtp_settings.get("smtp_pass", SMTP_PASS) if smtp_settings else SMTP_PASS
    from_email = smtp_settings.get("from_email", FROM_EMAIL) if smtp_settings else FROM_EMAIL
    if not host or not user:
        logging.warning("SMTP not configured, email skipped")
        return False
    try:
        msg = MIMEMultipart('mixed')
        msg['Subject'] = subject
        msg['From'] = f"IDSEA <{from_email}>"
        msg['To'] = ', '.join(recipients[:50])
        msg.attach(MIMEText(body, 'html'))
        if attachments:
            for att in attachments:
                part = MIMEApplication(att["data"], Name=att["filename"])
                part['Content-Disposition'] = f'attachment; filename="{att["filename"]}"'
                msg.attach(part)
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, passwd)
            server.sendmail(from_email, recipients, msg.as_string())
        return True
    except Exception as e:
        logging.error(f"Email error: {e}")
        return False


# =================== EMAIL TEMPLATE ENGINE ===================

DEFAULT_EMAIL_TEMPLATES = {
    "registration_submitted": {
        "name": "Registration Submitted",
        "subject": "IDSEA - Membership Application Received",
        "description": "Sent when a new member submits their application",
        "variables": ["member_name", "email", "phone", "qualification", "organization", "membership_type", "state", "payment_status", "application_date"],
        "body": """<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: #0c3c60; padding: 32px 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">IDSEA</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 12px;">Indian Dairy Scientists and Entrepreneurs Association</p>
  </div>
  <div style="padding: 36px 28px;">
    <h2 style="color: #0c3c60; font-size: 20px; margin: 0 0 12px;">Application Received!</h2>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Dear <strong>{{member_name}}</strong>,</p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Thank you for submitting your membership application to IDSEA. We have received your details and our team will review your application shortly.</p>
    <div style="background: #f0f9ff; border-radius: 10px; padding: 20px; margin: 24px 0; border-left: 4px solid #0c3c60;">
      <h3 style="color: #0c3c60; margin: 0 0 14px; font-size: 15px;">Application Summary</h3>
      <table style="width: 100%; font-size: 13px; color: #374151;">
        <tr><td style="padding: 6px 0; color: #6b7280; width: 40%;">Full Name</td><td style="padding: 6px 0; font-weight: 600;">{{member_name}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Email</td><td style="padding: 6px 0;">{{email}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Phone</td><td style="padding: 6px 0;">{{phone}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Qualification</td><td style="padding: 6px 0;">{{qualification}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Organization</td><td style="padding: 6px 0;">{{organization}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Membership Type</td><td style="padding: 6px 0;"><span style="background: #dbeafe; color: #1e40af; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600;">{{membership_type}}</span></td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">State</td><td style="padding: 6px 0;">{{state}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Payment Status</td><td style="padding: 6px 0;"><span style="background: #fef3c7; color: #92400e; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600;">{{payment_status}}</span></td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Application Date</td><td style="padding: 6px 0;">{{application_date}}</td></tr>
      </table>
    </div>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Our membership committee will review your application and notify you once it is approved. If you have any questions, please contact us.</p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Warm regards,<br><strong style="color: #0c3c60;">IDSEA Team</strong></p>
  </div>
  <div style="background: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; font-size: 11px; margin: 0;">Indian Dairy Scientists and Entrepreneurs Association (IDSEA)</p>
    <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0;">This is an automated email. Please do not reply directly.</p>
  </div>
</div>"""
    },
    "membership_approved": {
        "name": "Membership Approved",
        "subject": "Welcome to IDSEA! - Membership Approved",
        "description": "Sent when membership is approved (with certificate attached)",
        "variables": ["member_name", "email", "membership_id", "membership_type", "qualification", "organization", "state", "join_date"],
        "body": """<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: #0c3c60; padding: 32px 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">IDSEA</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 12px;">Indian Dairy Scientists and Entrepreneurs Association</p>
  </div>
  <div style="padding: 36px 28px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; background: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">&#10003;</div>
    </div>
    <h2 style="color: #1e7a4d; font-size: 22px; margin: 0 0 12px; text-align: center;">Welcome to IDSEA!</h2>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7; text-align: center;">Dear <strong>{{member_name}}</strong>, your membership has been approved.</p>
    <div style="background: #f0fdf4; border-radius: 10px; padding: 24px; margin: 24px 0; border: 1px solid #bbf7d0; text-align: center;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px;">Your Membership ID</p>
      <p style="color: #0c3c60; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: 2px;">{{membership_id}}</p>
    </div>
    <div style="background: #f0f9ff; border-radius: 10px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #0c3c60; margin: 0 0 14px; font-size: 15px;">Membership Details</h3>
      <table style="width: 100%; font-size: 13px; color: #374151;">
        <tr><td style="padding: 6px 0; color: #6b7280; width: 40%;">Full Name</td><td style="padding: 6px 0; font-weight: 600;">{{member_name}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Email</td><td style="padding: 6px 0;">{{email}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Membership Type</td><td style="padding: 6px 0;"><span style="background: #d1fae5; color: #065f46; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600;">{{membership_type}}</span></td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Qualification</td><td style="padding: 6px 0;">{{qualification}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Organization</td><td style="padding: 6px 0;">{{organization}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">State</td><td style="padding: 6px 0;">{{state}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Member Since</td><td style="padding: 6px 0;">{{join_date}}</td></tr>
      </table>
    </div>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Your membership certificate is attached to this email. Please keep it for your records.</p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">We look forward to your active participation in IDSEA activities.</p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Warm regards,<br><strong style="color: #0c3c60;">IDSEA Team</strong></p>
  </div>
  <div style="background: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; font-size: 11px; margin: 0;">Indian Dairy Scientists and Entrepreneurs Association (IDSEA)</p>
    <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0;">This is an automated email. Please do not reply directly.</p>
  </div>
</div>"""
    },
    "event_notification": {
        "name": "New Event Notification",
        "subject": "IDSEA - New Event: {{event_title}}",
        "description": "Sent to approved members when a new event is created (batch: 50 per 30 mins)",
        "variables": ["member_name", "event_title", "event_date", "event_end_date", "event_venue", "event_description", "registration_fee", "speaker_details"],
        "body": """<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: #0c3c60; padding: 32px 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">IDSEA</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 12px;">Indian Dairy Scientists and Entrepreneurs Association</p>
  </div>
  <div style="padding: 36px 28px;">
    <h2 style="color: #0c3c60; font-size: 20px; margin: 0 0 8px;">New Event Announcement</h2>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Dear <strong>{{member_name}}</strong>,</p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">We are excited to announce a new event:</p>
    <div style="background: #f0f9ff; border-radius: 10px; padding: 24px; margin: 20px 0; border-left: 4px solid #0c3c60;">
      <h3 style="color: #0c3c60; margin: 0 0 16px; font-size: 18px;">{{event_title}}</h3>
      <table style="width: 100%; font-size: 13px; color: #374151;">
        <tr><td style="padding: 6px 0; color: #6b7280; width: 35%;">Date</td><td style="padding: 6px 0; font-weight: 600;">{{event_date}} - {{event_end_date}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Venue</td><td style="padding: 6px 0;">{{event_venue}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Registration Fee</td><td style="padding: 6px 0; font-weight: 600;">₹{{registration_fee}}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Speakers</td><td style="padding: 6px 0;">{{speaker_details}}</td></tr>
      </table>
    </div>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">{{event_description}}</p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">We encourage all members to participate. For registration and queries, please contact us.</p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Warm regards,<br><strong style="color: #0c3c60;">IDSEA Team</strong></p>
  </div>
  <div style="background: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; font-size: 11px; margin: 0;">Indian Dairy Scientists and Entrepreneurs Association (IDSEA)</p>
    <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0;">This is an automated email. Please do not reply directly.</p>
  </div>
</div>"""
    },
    "event_participation": {
        "name": "Event Participation Certificate",
        "subject": "IDSEA - Thank You for Participating in {{event_title}}",
        "description": "Sent to participants when event is closed (with certificate attached)",
        "variables": ["member_name", "membership_id", "event_title", "event_date", "event_venue"],
        "body": """<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: #0c3c60; padding: 32px 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">IDSEA</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 12px;">Indian Dairy Scientists and Entrepreneurs Association</p>
  </div>
  <div style="padding: 36px 28px;">
    <h2 style="color: #0c3c60; font-size: 20px; margin: 0 0 12px;">Thank You for Your Participation!</h2>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Dear <strong>{{member_name}}</strong>,</p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Thank you for participating in <strong>{{event_title}}</strong> held at {{event_venue}} on {{event_date}}.</p>
    <div style="background: #f0fdf4; border-radius: 10px; padding: 24px; margin: 24px 0; text-align: center; border: 1px solid #bbf7d0;">
      <p style="color: #1e7a4d; font-size: 16px; font-weight: 700; margin: 0;">Your participation certificate is attached!</p>
      <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">Member ID: {{membership_id}}</p>
    </div>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">We hope you found the event valuable. Please keep the attached certificate for your records.</p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">We look forward to seeing you at future IDSEA events!</p>
    <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">Warm regards,<br><strong style="color: #0c3c60;">IDSEA Team</strong></p>
  </div>
  <div style="background: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; font-size: 11px; margin: 0;">Indian Dairy Scientists and Entrepreneurs Association (IDSEA)</p>
    <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0;">This is an automated email. Please do not reply directly.</p>
  </div>
</div>"""
    },
}


def render_template(template_body: str, variables: dict) -> str:
    """Replace {{variable_name}} placeholders with actual values"""
    rendered = template_body
    for key, value in variables.items():
        rendered = rendered.replace("{{" + key + "}}", str(value or ""))
    return rendered


def generate_certificate_pdf_bytes(member_name: str, membership_id: str, cert_type: str = "membership", event_name: str = "", issue_date: str = "") -> bytes:
    """Generate certificate PDF in memory and return bytes (NOT stored in DB)"""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=landscape(A4))
    w, h = landscape(A4)
    if not issue_date:
        issue_date = datetime.now().strftime("%d %B %Y")

    c.setStrokeColor(colors.HexColor('#0c3c60'))
    c.setLineWidth(4)
    c.rect(30, 30, w - 60, h - 60)
    c.setStrokeColor(colors.HexColor('#1e7a4d'))
    c.setLineWidth(2)
    c.rect(40, 40, w - 80, h - 80)

    c.setFillColor(colors.HexColor('#0c3c60'))
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(w / 2, h - 100, "Indian Dairy Scientists and")
    c.drawCentredString(w / 2, h - 135, "Entrepreneurs Association")
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor('#6b7280'))
    c.drawCentredString(w / 2, h - 158, "IDSEA")

    cert_type_label = {"membership": "Certificate of Membership", "event": "Certificate of Participation", "appreciation": "Certificate of Appreciation"}.get(cert_type, "Certificate")
    c.setFillColor(colors.HexColor('#1e7a4d'))
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(w / 2, h - 210, cert_type_label)

    c.setFillColor(colors.HexColor('#374151'))
    c.setFont("Helvetica", 14)
    c.drawCentredString(w / 2, h - 260, "This is to certify that")

    c.setFillColor(colors.HexColor('#0c3c60'))
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(w / 2, h - 300, member_name)

    c.setFillColor(colors.HexColor('#6b7280'))
    c.setFont("Helvetica", 12)
    if membership_id:
        c.drawCentredString(w / 2, h - 325, f"Member ID: {membership_id}")

    c.setFillColor(colors.HexColor('#374151'))
    c.setFont("Helvetica", 13)
    if cert_type == "event" and event_name:
        c.drawCentredString(w / 2, h - 358, "has successfully participated in")
        c.setFont("Helvetica-Bold", 15)
        c.setFillColor(colors.HexColor('#1e7a4d'))
        c.drawCentredString(w / 2, h - 380, event_name)
    elif cert_type == "membership":
        c.drawCentredString(w / 2, h - 358, "is a registered member of IDSEA")
    else:
        c.drawCentredString(w / 2, h - 358, "is recognized by IDSEA for their contributions")

    c.setFillColor(colors.HexColor('#6b7280'))
    c.setFont("Helvetica", 11)
    c.drawString(80, 90, f"Date: {issue_date}")
    c.line(w - 280, 100, w - 80, 100)
    c.setFont("Helvetica", 11)
    c.drawCentredString(w - 180, 82, "Authorized Signatory")
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(w - 180, 110, "IDSEA")

    c.save()
    buf.seek(0)
    return buf.getvalue()


async def send_templated_email(template_key: str, recipients: list, variables: dict, attachments: list = None):
    """Send email using template from DB (or default), with optional attachments"""
    template = await db.email_templates.find_one({"key": template_key}, {"_id": 0})
    if not template:
        template = DEFAULT_EMAIL_TEMPLATES.get(template_key)
    if not template:
        logging.error(f"Email template not found: {template_key}")
        return

    subject = render_template(template.get("subject", ""), variables)
    body = render_template(template.get("body", ""), variables)
    smtp_settings = await db.smtp_settings.find_one({}, {"_id": 0})

    log = {
        "id": str(uuid.uuid4()),
        "subject": subject,
        "body": body[:300],
        "recipients_count": len(recipients),
        "recipient_group": template_key,
        "sent_by": "system",
        "sent_at": now_iso(),
        "status": "queued"
    }
    await db.email_logs.insert_one(log)
    send_email_smtp(recipients, subject, body, smtp_settings, attachments)
    logging.info(f"Templated email [{template_key}] sent to {len(recipients)} recipients")


async def batch_event_notification(event: dict, membership_type_filter: str = "all"):
    """Send event notification in batches of 50 every 30 mins"""
    query = {"status": "approved"}
    if membership_type_filter and membership_type_filter not in ("all", ""):
        query["membership_type"] = membership_type_filter

    members = await db.members.find(query, {"_id": 0}).to_list(10000)
    members_with_email = [m for m in members if m.get("email")]
    batch_size = 50
    smtp_settings = await db.smtp_settings.find_one({}, {"_id": 0})

    template = await db.email_templates.find_one({"key": "event_notification"}, {"_id": 0})
    if not template:
        template = DEFAULT_EMAIL_TEMPLATES["event_notification"]

    for i in range(0, len(members_with_email), batch_size):
        batch = members_with_email[i:i + batch_size]
        for member in batch:
            variables = {
                "member_name": member.get("name", "Member"),
                "event_title": event.get("title", ""),
                "event_date": event.get("date", ""),
                "event_end_date": event.get("end_date", ""),
                "event_venue": event.get("venue", ""),
                "event_description": event.get("description", ""),
                "registration_fee": str(event.get("registration_fee", 0)),
                "speaker_details": event.get("speaker_details", ""),
            }
            subject = render_template(template.get("subject", ""), variables)
            body = render_template(template.get("body", ""), variables)
            send_email_smtp([member["email"]], subject, body, smtp_settings)

        sent_count = min(i + batch_size, len(members_with_email))
        await db.email_logs.insert_one({
            "id": str(uuid.uuid4()),
            "subject": f"Event: {event.get('title', '')} (batch {i // batch_size + 1})",
            "body": f"Batch notification for event",
            "recipients_count": len(batch),
            "recipient_group": f"event_batch_{membership_type_filter}",
            "sent_by": "system",
            "sent_at": now_iso(),
            "status": "sent"
        })
        logging.info(f"Event notification batch {i // batch_size + 1}: sent to {len(batch)} members ({sent_count}/{len(members_with_email)})")

        if i + batch_size < len(members_with_email):
            await asyncio.sleep(1800)  # 30 minutes between batches


async def send_event_participation_certificates(event: dict):
    """Send participation certificates to all approved members when event closes"""
    members = await db.members.find({"status": "approved"}, {"_id": 0}).to_list(10000)
    members_with_email = [m for m in members if m.get("email")]
    smtp_settings = await db.smtp_settings.find_one({}, {"_id": 0})

    template = await db.email_templates.find_one({"key": "event_participation"}, {"_id": 0})
    if not template:
        template = DEFAULT_EMAIL_TEMPLATES["event_participation"]

    batch_size = 50
    for i in range(0, len(members_with_email), batch_size):
        batch = members_with_email[i:i + batch_size]
        for member in batch:
            variables = {
                "member_name": member.get("name", ""),
                "membership_id": member.get("membership_id", ""),
                "event_title": event.get("title", ""),
                "event_date": event.get("date", ""),
                "event_venue": event.get("venue", ""),
            }
            subject = render_template(template.get("subject", ""), variables)
            body = render_template(template.get("body", ""), variables)

            # Generate certificate on-the-fly (NOT stored in DB)
            cert_pdf = generate_certificate_pdf_bytes(
                member_name=member.get("name", ""),
                membership_id=member.get("membership_id", ""),
                cert_type="event",
                event_name=event.get("title", ""),
                issue_date=datetime.now().strftime("%d %B %Y")
            )
            attachments = [{"filename": f"IDSEA_Certificate_{event.get('title', 'Event').replace(' ', '_')}.pdf", "data": cert_pdf}]
            send_email_smtp([member["email"]], subject, body, smtp_settings, attachments)

        await db.email_logs.insert_one({
            "id": str(uuid.uuid4()),
            "subject": f"Participation Cert: {event.get('title', '')} (batch {i // batch_size + 1})",
            "body": "Auto-generated participation certificates",
            "recipients_count": len(batch),
            "recipient_group": "event_participation",
            "sent_by": "system",
            "sent_at": now_iso(),
            "status": "sent"
        })
        if i + batch_size < len(members_with_email):
            await asyncio.sleep(1800)


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
async def apply_membership(data: MemberCreate, background_tasks: BackgroundTasks):
    existing = await db.members.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    member = Member(**data.model_dump())
    member.join_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.members.insert_one(member.model_dump())

    # Send registration email
    if member.email:
        variables = {
            "member_name": member.name,
            "email": member.email,
            "phone": member.phone or "",
            "qualification": member.qualification or "",
            "organization": member.organization or "",
            "membership_type": member.membership_type,
            "state": member.state or "",
            "payment_status": member.payment_status,
            "application_date": member.join_date,
        }
        background_tasks.add_task(send_templated_email, "registration_submitted", [member.email], variables)

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
    return await db.executive_committee.find({"category": "council"}, {"_id": 0}).sort("order", 1).to_list(100)


@api_router.get("/public/founders")
async def get_public_founders():
    return await db.executive_committee.find({"category": "founder"}, {"_id": 0}).sort("order", 1).to_list(50)


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
async def approve_member(member_id: str, background_tasks: BackgroundTasks, admin=Depends(get_current_admin)):
    member = await db.members.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    count = await db.members.count_documents({"status": "approved"})
    membership_id = f"IDSEA{datetime.now().year}{str(count+1).zfill(4)}"
    await db.members.update_one(
        {"id": member_id},
        {"$set": {"status": "approved", "membership_id": membership_id, "updated_at": now_iso()}}
    )

    # Send welcome email with membership certificate attached
    if member.get("email"):
        variables = {
            "member_name": member.get("name", ""),
            "email": member.get("email", ""),
            "membership_id": membership_id,
            "membership_type": member.get("membership_type", ""),
            "qualification": member.get("qualification", ""),
            "organization": member.get("organization", ""),
            "state": member.get("state", ""),
            "join_date": datetime.now().strftime("%d %B %Y"),
        }
        # Generate certificate on-the-fly (NOT stored in DB)
        cert_pdf = generate_certificate_pdf_bytes(
            member_name=member.get("name", ""),
            membership_id=membership_id,
            cert_type="membership",
        )
        attachments = [{"filename": f"IDSEA_Membership_Certificate_{membership_id}.pdf", "data": cert_pdf}]
        background_tasks.add_task(send_templated_email, "membership_approved", [member["email"]], variables, attachments)

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
async def admin_create_event(data: EventCreate, background_tasks: BackgroundTasks, admin=Depends(get_current_admin)):
    event = Event(**data.model_dump())
    await db.events.insert_one(event.model_dump())
    return event.model_dump()


@api_router.post("/admin/events/{event_id}/notify")
async def notify_event(event_id: str, background_tasks: BackgroundTasks, membership_type: str = "all", admin=Depends(get_current_admin)):
    """Send event notification to approved members in batches (50 per 30 mins)"""
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    background_tasks.add_task(batch_event_notification, event, membership_type)
    return {"message": f"Event notification queued for '{membership_type}' members (batch: 50 per 30 mins)"}


@api_router.put("/admin/events/{event_id}/close")
async def close_event(event_id: str, background_tasks: BackgroundTasks, admin=Depends(get_current_admin)):
    """Close event and auto-send participation certificates to all approved members"""
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.events.update_one({"id": event_id}, {"$set": {"status": "completed", "updated_at": now_iso()}})
    background_tasks.add_task(send_event_participation_certificates, event)
    return {"message": "Event closed. Participation certificates are being sent to all approved members."}


@api_router.put("/admin/events/{event_id}")
async def admin_update_event(event_id: str, data: EventCreate, admin=Depends(get_current_admin)):
    await db.events.update_one({"id": event_id}, {"$set": data.model_dump()})
    return {"message": "Event updated"}


@api_router.delete("/admin/events/{event_id}")
async def admin_delete_event(event_id: str, admin=Depends(get_current_admin)):
    await db.events.delete_one({"id": event_id})
    return {"message": "Event deleted"}


# =================== EVENT REGISTRATION ===================

MEMBERSHIP_FEES = {"academic": 3100, "entrepreneur": 5100, "corporate": 25100}


@api_router.get("/public/events/{event_id}/registration-info")
async def get_event_registration_info(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event.get("registration_enabled"):
        raise HTTPException(status_code=400, detail="Registration not enabled for this event")
    return {
        "id": event["id"],
        "title": event["title"],
        "date": event.get("date", ""),
        "end_date": event.get("end_date", ""),
        "venue": event.get("venue", ""),
        "fee_tiers": event.get("fee_tiers", []),
        "accommodation": event.get("accommodation", {}),
        "allow_membership_registration": event.get("allow_membership_registration", False),
        "membership_fees": MEMBERSHIP_FEES,
    }


@api_router.get("/public/members/lookup")
async def lookup_member_by_phone(phone: str):
    if not phone or len(phone) < 5:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    member = await db.members.find_one(
        {"phone": {"$regex": phone.strip().replace("+", "\\+"), "$options": "i"}, "status": "approved"},
        {"_id": 0, "name": 1, "email": 1, "phone": 1, "membership_type": 1, "membership_id": 1, "organization": 1, "qualification": 1, "state": 1, "id": 1}
    )
    if not member:
        return {"found": False}
    return {"found": True, "member": member}


@api_router.post("/public/events/{event_id}/register")
async def register_for_event(event_id: str, data: dict):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event.get("registration_enabled"):
        raise HTTPException(status_code=400, detail="Registration not enabled")

    reg = EventRegistration(
        event_id=event_id,
        is_member=data.get("is_member", False),
        member_id=data.get("member_id", ""),
        member_category=data.get("member_category", ""),
        name=data.get("name", ""),
        email=data.get("email", ""),
        phone=data.get("phone", ""),
        qualification=data.get("qualification", ""),
        organization=data.get("organization", ""),
        state=data.get("state", ""),
        accommodation_choice=data.get("accommodation_choice", ""),
        hotel_name=data.get("hotel_name", ""),
        wants_membership=data.get("wants_membership", False),
        membership_type=data.get("membership_type", ""),
        registration_fee=float(data.get("registration_fee", 0)),
        accommodation_fee=float(data.get("accommodation_fee", 0)),
        membership_fee=float(data.get("membership_fee", 0)),
        total_amount=float(data.get("total_amount", 0)),
        payment_status="pending",
        payment_mode=data.get("payment_mode", "offline"),
    )
    await db.event_registrations.insert_one(reg.model_dump())

    # If wants membership, create a pending member application
    if reg.wants_membership and reg.membership_type:
        existing = await db.members.find_one({"email": reg.email})
        if not existing:
            from pydantic import BaseModel as _BM
            new_member = Member(
                name=reg.name,
                email=reg.email,
                phone=reg.phone,
                qualification=reg.qualification or "",
                organization=reg.organization or "",
                state=reg.state or "",
                membership_type=reg.membership_type,
                status="pending",
                payment_status="pending",
            )
            new_member.join_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            await db.members.insert_one(new_member.model_dump())

    result = reg.model_dump()
    result.pop("_id", None)
    return {"message": "Registration successful", "registration": result}


@api_router.get("/admin/events/{event_id}/registrations")
async def admin_get_event_registrations(event_id: str, admin=Depends(get_current_admin)):
    regs = await db.event_registrations.find({"event_id": event_id}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    return regs


@api_router.get("/admin/events/{event_id}/registrations/export")
async def admin_export_event_registrations(event_id: str, admin=Depends(get_current_admin)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    regs = await db.event_registrations.find({"event_id": event_id}, {"_id": 0}).sort("created_at", -1).to_list(5000)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Registrations"
    headers = ["S.No", "Name", "Email", "Phone", "Organization", "State", "Member", "Member ID", "Category", "Accommodation", "Hotel", "Reg Fee", "Accom Fee", "Membership Fee", "Total", "Payment Status"]
    header_fill = openpyxl.styles.PatternFill(start_color="0C3C60", end_color="0C3C60", fill_type="solid")
    header_font = openpyxl.styles.Font(bold=True, color="FFFFFF", size=11)
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.fill = header_fill
        cell.font = header_font

    for i, r in enumerate(regs, 1):
        ws.cell(row=i + 1, column=1, value=i)
        ws.cell(row=i + 1, column=2, value=r.get("name", ""))
        ws.cell(row=i + 1, column=3, value=r.get("email", ""))
        ws.cell(row=i + 1, column=4, value=r.get("phone", ""))
        ws.cell(row=i + 1, column=5, value=r.get("organization", ""))
        ws.cell(row=i + 1, column=6, value=r.get("state", ""))
        ws.cell(row=i + 1, column=7, value="Yes" if r.get("is_member") else "No")
        ws.cell(row=i + 1, column=8, value=r.get("member_id", ""))
        ws.cell(row=i + 1, column=9, value=r.get("member_category", ""))
        ws.cell(row=i + 1, column=10, value=r.get("accommodation_choice", ""))
        ws.cell(row=i + 1, column=11, value=r.get("hotel_name", ""))
        ws.cell(row=i + 1, column=12, value=r.get("registration_fee", 0))
        ws.cell(row=i + 1, column=13, value=r.get("accommodation_fee", 0))
        ws.cell(row=i + 1, column=14, value=r.get("membership_fee", 0))
        ws.cell(row=i + 1, column=15, value=r.get("total_amount", 0))
        ws.cell(row=i + 1, column=16, value=r.get("payment_status", ""))

    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 3, 40)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    title_clean = event.get("title", "Event").replace(" ", "_")[:30]
    return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                           headers={"Content-Disposition": f"attachment; filename=IDSEA_{title_clean}_Registrations.xlsx"})


@api_router.put("/admin/event-registrations/{reg_id}/payment")
async def admin_update_registration_payment(reg_id: str, data: dict, admin=Depends(get_current_admin)):
    status = data.get("payment_status", "paid")
    await db.event_registrations.update_one({"id": reg_id}, {"$set": {"payment_status": status}})
    return {"message": "Payment status updated"}


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
async def admin_get_executive(category: Optional[str] = None, admin=Depends(get_current_admin)):
    query = {}
    if category:
        query["category"] = category
    return await db.executive_committee.find(query, {"_id": 0}).sort("order", 1).to_list(100)


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
    smtp_settings = await db.smtp_settings.find_one({}, {"_id": 0})
    background_tasks.add_task(send_email_smtp, recipients, data.subject, data.body, smtp_settings)
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
    # Remove MongoDB _id before returning
    certificate.pop("_id", None)
    return certificate


@api_router.get("/admin/certificates")
async def admin_get_certificates(admin=Depends(get_current_admin)):
    return await db.certificates.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


# =================== CERTIFICATE PDF ===================

@api_router.get("/admin/certificates/{cert_id}/pdf")
async def download_certificate_pdf(cert_id: str, admin=Depends(get_current_admin)):
    cert = await db.certificates.find_one({"id": cert_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=landscape(A4))
    w, h = landscape(A4)

    # Border
    c.setStrokeColor(colors.HexColor('#0c3c60'))
    c.setLineWidth(4)
    c.rect(30, 30, w - 60, h - 60)
    c.setStrokeColor(colors.HexColor('#1e7a4d'))
    c.setLineWidth(2)
    c.rect(40, 40, w - 80, h - 80)

    # Header
    c.setFillColor(colors.HexColor('#0c3c60'))
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(w / 2, h - 100, "Indian Dairy Scientists and")
    c.drawCentredString(w / 2, h - 135, "Entrepreneurs Association")
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor('#6b7280'))
    c.drawCentredString(w / 2, h - 158, "IDSEA")

    # Certificate type
    cert_type_label = {
        "membership": "Certificate of Membership",
        "event": "Certificate of Participation",
        "appreciation": "Certificate of Appreciation"
    }.get(cert.get("certificate_type", ""), "Certificate")

    c.setFillColor(colors.HexColor('#1e7a4d'))
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(w / 2, h - 210, cert_type_label)

    # "This is to certify..."
    c.setFillColor(colors.HexColor('#374151'))
    c.setFont("Helvetica", 14)
    c.drawCentredString(w / 2, h - 260, "This is to certify that")

    # Name
    c.setFillColor(colors.HexColor('#0c3c60'))
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(w / 2, h - 300, cert.get("member_name", ""))

    # Membership ID
    c.setFillColor(colors.HexColor('#6b7280'))
    c.setFont("Helvetica", 12)
    mid = cert.get("membership_id", "")
    if mid:
        c.drawCentredString(w / 2, h - 325, f"Member ID: {mid}")

    # Body text
    c.setFillColor(colors.HexColor('#374151'))
    c.setFont("Helvetica", 13)
    if cert.get("certificate_type") == "event" and cert.get("event_name"):
        c.drawCentredString(w / 2, h - 358, f"has successfully participated in")
        c.setFont("Helvetica-Bold", 15)
        c.setFillColor(colors.HexColor('#1e7a4d'))
        c.drawCentredString(w / 2, h - 380, cert["event_name"])
    elif cert.get("certificate_type") == "membership":
        c.drawCentredString(w / 2, h - 358, "is a registered member of IDSEA")
    else:
        c.drawCentredString(w / 2, h - 358, "is recognized by IDSEA for their contributions")

    # Date and signature
    c.setFillColor(colors.HexColor('#6b7280'))
    c.setFont("Helvetica", 11)
    c.drawString(80, 90, f"Date: {cert.get('issue_date', '')}")
    c.drawString(80, 75, f"Certificate ID: {cert_id}")
    c.line(w - 280, 100, w - 80, 100)
    c.setFont("Helvetica", 11)
    c.drawCentredString(w - 180, 82, "Authorized Signatory")
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(w - 180, 110, cert.get("issued_by", "IDSEA"))

    c.save()
    buf.seek(0)
    filename = f"IDSEA_Certificate_{cert_id}.pdf"
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})


# =================== MEMBER EXPORT ===================

@api_router.get("/admin/members/export/excel")
async def export_members_excel(status: Optional[str] = None, membership_type: Optional[str] = None, admin=Depends(get_current_admin)):
    query = {}
    if status:
        query["status"] = status
    if membership_type:
        query["membership_type"] = membership_type
    members = await db.members.find(query, {"_id": 0}).sort("created_at", -1).to_list(5000)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Members"

    headers = ["S.No", "Member ID", "Name", "Email", "Phone", "Qualification", "Organization", "State", "Membership Type", "Status", "Payment Status", "Join Date"]
    header_fill = openpyxl.styles.PatternFill(start_color="0C3C60", end_color="0C3C60", fill_type="solid")
    header_font = openpyxl.styles.Font(bold=True, color="FFFFFF", size=11)
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.fill = header_fill
        cell.font = header_font

    for i, m in enumerate(members, 1):
        ws.cell(row=i + 1, column=1, value=i)
        ws.cell(row=i + 1, column=2, value=m.get("membership_id", ""))
        ws.cell(row=i + 1, column=3, value=m.get("name", ""))
        ws.cell(row=i + 1, column=4, value=m.get("email", ""))
        ws.cell(row=i + 1, column=5, value=m.get("phone", ""))
        ws.cell(row=i + 1, column=6, value=m.get("qualification", ""))
        ws.cell(row=i + 1, column=7, value=m.get("organization", ""))
        ws.cell(row=i + 1, column=8, value=m.get("state", ""))
        ws.cell(row=i + 1, column=9, value=m.get("membership_type", ""))
        ws.cell(row=i + 1, column=10, value=m.get("status", ""))
        ws.cell(row=i + 1, column=11, value=m.get("payment_status", ""))
        ws.cell(row=i + 1, column=12, value=m.get("join_date", ""))

    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 3, 40)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                           headers={"Content-Disposition": "attachment; filename=IDSEA_Members.xlsx"})


@api_router.get("/admin/members/export/pdf")
async def export_members_pdf(status: Optional[str] = None, membership_type: Optional[str] = None, admin=Depends(get_current_admin)):
    query = {}
    if status:
        query["status"] = status
    if membership_type:
        query["membership_type"] = membership_type
    members = await db.members.find(query, {"_id": 0}).sort("created_at", -1).to_list(5000)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), topMargin=30, bottomMargin=30, leftMargin=30, rightMargin=30)
    elements = []

    title_style = ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=16, alignment=TA_CENTER, spaceAfter=6, textColor=colors.HexColor('#0c3c60'))
    subtitle_style = ParagraphStyle('subtitle', fontName='Helvetica', fontSize=10, alignment=TA_CENTER, spaceAfter=16, textColor=colors.HexColor('#6b7280'))
    elements.append(Paragraph("IDSEA - Member Directory", title_style))
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%d %B %Y')} | Total: {len(members)} members", subtitle_style))

    data = [["#", "Member ID", "Name", "Email", "Organization", "State", "Type", "Status"]]
    for i, m in enumerate(members, 1):
        data.append([
            str(i), m.get("membership_id", "")[:12], m.get("name", "")[:25],
            m.get("email", "")[:28], m.get("organization", "")[:30],
            m.get("state", "")[:15], m.get("membership_type", "")[:12],
            m.get("status", "")
        ])

    col_widths = [30, 70, 120, 140, 150, 80, 70, 60]
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0c3c60')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)
    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=IDSEA_Members.pdf"})


# =================== FILE UPLOAD ===================

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    unique_name = f"{uuid.uuid4().hex[:12]}{ext}"
    file_path = UPLOAD_DIR / unique_name
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)

    file_record = {
        "id": str(uuid.uuid4()),
        "original_name": file.filename,
        "stored_name": unique_name,
        "file_url": f"/api/uploads/{unique_name}",
        "file_type": ext,
        "file_size": len(content),
        "uploaded_by": admin["email"],
        "uploaded_at": now_iso()
    }
    await db.uploads.insert_one(file_record)
    return {"file_url": file_record["file_url"], "original_name": file.filename, "id": file_record["id"]}


@api_router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    ext = file_path.suffix.lower()
    content_types = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
        '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
    ct = content_types.get(ext, 'application/octet-stream')
    return StreamingResponse(open(file_path, 'rb'), media_type=ct)


# =================== SMTP SETTINGS ===================

@api_router.get("/admin/smtp-settings")
async def admin_get_smtp_settings(admin=Depends(get_current_admin)):
    settings = await db.smtp_settings.find_one({}, {"_id": 0})
    if settings:
        settings["smtp_pass"] = "••••••••" if settings.get("smtp_pass") else ""
    return settings or {"smtp_host": SMTP_HOST, "smtp_port": SMTP_PORT_VAL, "smtp_user": SMTP_USER, "smtp_pass": "••••••••" if SMTP_PASS else "", "from_email": FROM_EMAIL, "is_configured": bool(SMTP_HOST and SMTP_USER)}


@api_router.put("/admin/smtp-settings")
async def admin_update_smtp_settings(data: dict, admin=Depends(get_current_admin)):
    if admin.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admin can update SMTP settings")
    settings = {"smtp_host": data.get("smtp_host", ""), "smtp_port": int(data.get("smtp_port", 587)), "smtp_user": data.get("smtp_user", ""), "from_email": data.get("from_email", "noreply@idsea.org"), "updated_at": now_iso()}
    if data.get("smtp_pass") and data["smtp_pass"] != "••••••••":
        settings["smtp_pass"] = data["smtp_pass"]
    else:
        existing = await db.smtp_settings.find_one({}, {"_id": 0})
        if existing:
            settings["smtp_pass"] = existing.get("smtp_pass", "")
    settings["is_configured"] = bool(settings["smtp_host"] and settings["smtp_user"])
    await db.smtp_settings.update_one({}, {"$set": settings}, upsert=True)
    return {"message": "SMTP settings updated", "is_configured": settings["is_configured"]}


@api_router.post("/admin/smtp-settings/test")
async def test_smtp_settings(admin=Depends(get_current_admin)):
    settings = await db.smtp_settings.find_one({}, {"_id": 0})
    if not settings or not settings.get("smtp_host"):
        return {"success": False, "message": "SMTP not configured. Please save settings first."}
    success = send_email_smtp([admin["email"]], "IDSEA - SMTP Test Email", "<h2>SMTP Configuration Test</h2><p>This is a test email from IDSEA admin panel. If you received this, your SMTP settings are working correctly!</p>", settings)
    return {"success": success, "message": "Test email sent to " + admin["email"] if success else "Failed to send. Check SMTP credentials."}


# =================== EMAIL TEMPLATES ===================

@api_router.get("/admin/email-templates")
async def admin_get_email_templates(admin=Depends(get_current_admin)):
    templates = await db.email_templates.find({}, {"_id": 0}).to_list(20)
    # Merge with defaults for any missing templates
    existing_keys = {t["key"] for t in templates}
    for key, default in DEFAULT_EMAIL_TEMPLATES.items():
        if key not in existing_keys:
            templates.append({"key": key, **default, "is_default": True})
        else:
            for t in templates:
                if t["key"] == key:
                    t["is_default"] = False
    return sorted(templates, key=lambda t: list(DEFAULT_EMAIL_TEMPLATES.keys()).index(t["key"]) if t["key"] in DEFAULT_EMAIL_TEMPLATES else 99)


@api_router.get("/admin/email-templates/{template_key}")
async def admin_get_email_template(template_key: str, admin=Depends(get_current_admin)):
    template = await db.email_templates.find_one({"key": template_key}, {"_id": 0})
    if not template:
        default = DEFAULT_EMAIL_TEMPLATES.get(template_key)
        if default:
            return {"key": template_key, **default, "is_default": True}
        raise HTTPException(status_code=404, detail="Template not found")
    template["is_default"] = False
    return template


@api_router.put("/admin/email-templates/{template_key}")
async def admin_update_email_template(template_key: str, data: dict, admin=Depends(get_current_admin)):
    if template_key not in DEFAULT_EMAIL_TEMPLATES:
        raise HTTPException(status_code=400, detail="Unknown template key")
    update = {
        "key": template_key,
        "name": data.get("name", DEFAULT_EMAIL_TEMPLATES[template_key]["name"]),
        "subject": data.get("subject", ""),
        "body": data.get("body", ""),
        "description": data.get("description", ""),
        "variables": DEFAULT_EMAIL_TEMPLATES[template_key]["variables"],
        "updated_at": now_iso(),
        "updated_by": admin["email"]
    }
    await db.email_templates.update_one({"key": template_key}, {"$set": update}, upsert=True)
    return {"message": f"Template '{template_key}' updated"}


@api_router.post("/admin/email-templates/{template_key}/reset")
async def admin_reset_email_template(template_key: str, admin=Depends(get_current_admin)):
    if template_key not in DEFAULT_EMAIL_TEMPLATES:
        raise HTTPException(status_code=400, detail="Unknown template key")
    await db.email_templates.delete_one({"key": template_key})
    return {"message": f"Template '{template_key}' reset to default"}


@api_router.post("/admin/email-templates/{template_key}/preview")
async def admin_preview_email_template(template_key: str, admin=Depends(get_current_admin)):
    template = await db.email_templates.find_one({"key": template_key}, {"_id": 0})
    if not template:
        template = DEFAULT_EMAIL_TEMPLATES.get(template_key)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    sample_vars = {
        "member_name": "Dr. John Doe",
        "email": "john.doe@example.com",
        "phone": "+91 98765 43210",
        "qualification": "Ph.D. (Dairy Science)",
        "organization": "National Dairy Research Institute",
        "membership_type": "Academic",
        "membership_id": "IDSEA20260001",
        "state": "Tamil Nadu",
        "payment_status": "Pending",
        "application_date": datetime.now().strftime("%d %B %Y"),
        "join_date": datetime.now().strftime("%d %B %Y"),
        "event_title": "International Dairy Conference 2026",
        "event_date": "15 March 2026",
        "event_end_date": "17 March 2026",
        "event_venue": "VCRI Namakkal, Tamil Nadu",
        "event_description": "A premier conference bringing together dairy scientists and entrepreneurs.",
        "registration_fee": "2,500",
        "speaker_details": "Dr. A. Elango, Dr. G. Kumaresan",
    }
    rendered_subject = render_template(template.get("subject", ""), sample_vars)
    rendered_body = render_template(template.get("body", ""), sample_vars)
    return {"subject": rendered_subject, "body": rendered_body, "variables": template.get("variables", [])}


# =================== ADVANCED REPORTS ===================

@api_router.get("/admin/reports/monthly-growth")
async def admin_monthly_growth(admin=Depends(get_current_admin)):
    pipeline = [
        {"$addFields": {"month": {"$substr": ["$created_at", 0, 7]}}},
        {"$group": {"_id": "$month", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
        {"$limit": 12}
    ]
    member_growth = await db.members.aggregate(pipeline).to_list(12)

    payment_pipeline = [
        {"$match": {"status": "paid"}},
        {"$addFields": {"month": {"$substr": ["$created_at", 0, 7]}}},
        {"$group": {"_id": "$month", "revenue": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
        {"$limit": 12}
    ]
    revenue_growth = await db.payments.aggregate(payment_pipeline).to_list(12)

    type_pipeline = [
        {"$match": {"status": "approved"}},
        {"$group": {"_id": "$membership_type", "count": {"$sum": 1}}}
    ]
    type_dist = await db.members.aggregate(type_pipeline).to_list(10)

    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_dist = await db.members.aggregate(status_pipeline).to_list(10)

    state_pipeline = [
        {"$match": {"status": "approved", "state": {"$nin": ["", None]}}},
        {"$group": {"_id": "$state", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]
    state_dist = await db.members.aggregate(state_pipeline).to_list(15)

    return {
        "member_growth": [{"month": m["_id"], "members": m["count"]} for m in member_growth],
        "revenue_growth": [{"month": r["_id"], "revenue": r["revenue"], "transactions": r["count"]} for r in revenue_growth],
        "type_distribution": [{"type": t["_id"], "count": t["count"]} for t in type_dist if t["_id"]],
        "status_distribution": [{"status": s["_id"], "count": s["count"]} for s in status_dist if s["_id"]],
        "state_distribution": [{"state": s["_id"], "count": s["count"]} for s in state_dist if s["_id"]],
    }


# =================== SLIDER MANAGEMENT ===================

@api_router.get("/public/sliders")
async def get_public_sliders():
    sliders = await db.sliders.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(20)
    return sliders


@api_router.get("/admin/sliders")
async def admin_get_sliders(admin=Depends(get_current_admin)):
    return await db.sliders.find({}, {"_id": 0}).sort("order", 1).to_list(50)


@api_router.post("/admin/sliders")
async def admin_create_slider(data: SliderCreate, admin=Depends(get_current_admin)):
    slider = Slider(**data.model_dump())
    await db.sliders.insert_one(slider.model_dump())
    result = slider.model_dump()
    result.pop("_id", None)
    return result


@api_router.put("/admin/sliders/reorder")
async def admin_reorder_sliders(data: dict, admin=Depends(get_current_admin)):
    """Reorder sliders - must be before {slider_id} route"""
    items = data.get("items", [])
    for item in items:
        await db.sliders.update_one({"id": item["id"]}, {"$set": {"order": item["order"]}})
    return {"message": "Sliders reordered"}


@api_router.put("/admin/sliders/{slider_id}")
async def admin_update_slider(slider_id: str, data: SliderCreate, admin=Depends(get_current_admin)):
    update_data = data.model_dump()
    await db.sliders.update_one({"id": slider_id}, {"$set": update_data})
    return {"message": "Slider updated"}


@api_router.delete("/admin/sliders/{slider_id}")
async def admin_delete_slider(slider_id: str, admin=Depends(get_current_admin)):
    await db.sliders.delete_one({"id": slider_id})
    return {"message": "Slider deleted"}


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

    # Migrate: if old executive data exists without category field, clear and re-seed
    old_exec = await db.executive_committee.find_one({"category": {"$exists": False}})
    if old_exec:
        await db.executive_committee.delete_many({})
        logger.info("Cleared old executive data for migration")

    # Seed all founders & EC members as approved members + executive entries
    if await db.executive_committee.count_documents({}) == 0:
        # All people who need to be members first
        seed_people = [
            # Founders / Officers
            {"name": "Dr. A. Elango", "qualification": "Ph.D.", "membership_type": "academic", "organization": "Veterinary College and Research Institute, Salem - 636112", "state": "Tamil Nadu"},
            {"name": "Dr. G. Kumaresan", "qualification": "Ph.D.", "membership_type": "academic", "organization": "Dept. of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002", "state": "Tamil Nadu"},
            {"name": "Dr. N. Karthikeyan", "qualification": "Ph.D.", "membership_type": "academic", "organization": "Dept. of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002", "state": "Tamil Nadu"},
            {"name": "Dr. C. Pandiyan", "qualification": "Ph.D.", "membership_type": "academic", "organization": "Dept. of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002", "state": "Tamil Nadu"},
            {"name": "Dr. C. R. Prasanna", "qualification": "IAS", "membership_type": "corporate", "organization": "Indian Administrative Service (IAS), Government of India", "state": "Tamil Nadu"},
            {"name": "Dr. L. Vijay", "qualification": "M.V.Sc.", "membership_type": "academic", "organization": "Dept. of Animal Husbandry, Government of Tamil Nadu", "state": "Tamil Nadu"},
            # EC Members
            {"name": "Dr. R. Subash", "qualification": "Ph.D.", "membership_type": "academic", "organization": "Bargur Cattle Research Station, Anthiyur Taluk, Erode District - 638501", "state": "Tamil Nadu"},
            {"name": "Dr. T. Lokesh", "qualification": "B.V.Sc. & A.H.", "membership_type": "academic", "organization": "Tirupur District Co-operative Milk Producers Union Ltd., Tirupur", "state": "Tamil Nadu"},
            {"name": "Dr. K. Prabu", "qualification": "M.V.Sc.", "membership_type": "academic", "organization": "Dept. of Animal Husbandry, Government of Tamil Nadu", "state": "Tamil Nadu"},
            {"name": "Dr. B. R. Kadam", "qualification": "Ph.D.", "membership_type": "academic", "organization": "Dept. of Livestock Products Technology, KNP College of Veterinary Science, MAFSU, Shirwal, Satara District, Maharashtra", "state": "Maharashtra"},
            {"name": "Dr. Neha Thakur", "qualification": "Ph.D.", "membership_type": "academic", "organization": "Dept. of Livestock Products Technology, College of Veterinary Science, LUVASU, Hisar, Haryana - 125004", "state": "Haryana"},
            {"name": "Dr. Anindita Mali", "qualification": "M.V.Sc.", "membership_type": "academic", "organization": "Assam Animal Husbandry and Veterinary Department, Government of Assam", "state": "Assam"},
            {"name": "Dr. A. R. Praveen", "qualification": "Ph.D.", "membership_type": "academic", "organization": "Dept. of Dairy Technology, Dairy Science College, KVAFSU, Hebbal, Bengaluru - 560024", "state": "Karnataka"},
            {"name": "Mr. D. Senthil Kumar", "qualification": "", "membership_type": "entrepreneur", "organization": "Refindia Enterprises Pvt. Ltd, Namakkal", "state": "Tamil Nadu"},
            {"name": "Mr. C. Balakrishnan", "qualification": "", "membership_type": "entrepreneur", "organization": "Krishna Food Products, Rasipuram, Namakkal", "state": "Tamil Nadu"},
            {"name": "Mrs. A. Archana Karthikeyan", "qualification": "", "membership_type": "entrepreneur", "organization": "Thaai Herbals, Karur", "state": "Tamil Nadu"},
            {"name": "Mr. K. M. Sajeeshkumar", "qualification": "", "membership_type": "entrepreneur", "organization": "Elanadu Milk Pvt. Ltd., Elanadu - Vaniyampara MLA Rd, Kerala - 680586", "state": "Kerala"},
            {"name": "Mr. M. Karthikeyan", "qualification": "", "membership_type": "entrepreneur", "organization": "Healthy Day Milk Products, Sulur, Coimbatore", "state": "Tamil Nadu"},
            {"name": "Mr. Pradeep Ponnusamy", "qualification": "", "membership_type": "entrepreneur", "organization": "Anyra Foods, 1/40, Komara Gaundan Palayam, Sokkanur (Po), Kunnathur - 638103, Tirupur District", "state": "Tamil Nadu"},
            {"name": "Mr. M. Saravanan", "qualification": "", "membership_type": "entrepreneur", "organization": "STM Control Tech, 156, Sangeeth Nagar, 3rd street, Koodal Nagar, Madurai", "state": "Tamil Nadu"},
        ]

        # Create all as approved members if they don't exist
        member_ids = {}
        for i, person in enumerate(seed_people):
            existing = await db.members.find_one({"name": person["name"]})
            if existing:
                member_ids[person["name"]] = existing["id"]
            else:
                m = Member(
                    name=person["name"],
                    qualification=person.get("qualification", ""),
                    organization=person["organization"],
                    email="",
                    membership_type=person["membership_type"],
                    status="approved",
                    state=person.get("state", ""),
                    membership_id=f"IDSEA-{str(i+1).zfill(4)}",
                )
                await db.members.insert_one(m.model_dump())
                member_ids[person["name"]] = m.id

        # Seed Founders
        founders = [
            {"name": "Dr. A. Elango", "designation": "Patron / Founder", "affiliation": "Dean, Veterinary College and Research Institute, Salem - 636112", "order": 1},
            {"name": "Dr. G. Kumaresan", "designation": "Patron / Founder", "affiliation": "Professor and Head, Department of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002", "order": 2},
            {"name": "Dr. N. Karthikeyan", "designation": "Patron / Founder", "affiliation": "Professor, Department of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002", "order": 3},
            {"name": "Dr. C. Pandiyan", "designation": "Patron / Founder", "affiliation": "Professor, Department of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002", "order": 4},
            {"name": "Dr. C. R. Prasanna", "designation": "Patron / Founder", "affiliation": "Indian Administrative Service (IAS), Government of India", "order": 5},
            {"name": "Dr. L. Vijay", "designation": "Patron / Founder", "affiliation": "Veterinary Assistant Surgeon, Department of Animal Husbandry, Government of Tamil Nadu", "order": 6},
        ]
        for f in founders:
            await db.executive_committee.insert_one(ExecutiveCommittee(
                member_id=member_ids.get(f["name"], ""),
                name=f["name"], designation=f["designation"], affiliation=f["affiliation"],
                category="founder", order=f["order"]
            ).model_dump())

        # Seed Executive Council
        council = [
            {"name": "Dr. A. Elango", "designation": "President", "affiliation": "Dean, Veterinary College and Research Institute, Salem - 636112", "order": 1},
            {"name": "Dr. G. Kumaresan", "designation": "Vice President", "affiliation": "Professor and Head, Department of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002", "order": 2},
            {"name": "Dr. N. Karthikeyan", "designation": "General Secretary", "affiliation": "Professor, Department of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002", "order": 3},
            {"name": "Dr. C. Pandiyan", "designation": "Joint Secretary", "affiliation": "Professor, Department of Livestock Products Technology (Dairy Science), VCRI, Namakkal - 637002", "order": 4},
            {"name": "Dr. L. Vijay", "designation": "Treasurer", "affiliation": "Veterinary Assistant Surgeon, Department of Animal Husbandry, Government of Tamil Nadu", "order": 5},
            {"name": "Dr. R. Subash", "designation": "EC Member", "affiliation": "Assistant Professor, Bargur Cattle Research Station, Anthiyur Taluk, Erode District - 638501", "order": 6},
            {"name": "Dr. T. Lokesh", "designation": "EC Member", "affiliation": "Veterinary Consultant, Tirupur District Co-operative Milk Producers Union Ltd., Tirupur", "order": 7},
            {"name": "Dr. K. Prabu", "designation": "EC Member", "affiliation": "Veterinary Assistant Surgeon, Department of Animal Husbandry, Government of Tamil Nadu", "order": 8},
            {"name": "Dr. B. R. Kadam", "designation": "EC Member", "affiliation": "Professor and Head, Department of Livestock Products Technology, KNP College of Veterinary Science, MAFSU, Shirwal, Satara District, Maharashtra", "order": 9},
            {"name": "Dr. Neha Thakur", "designation": "EC Member", "affiliation": "Assistant Professor, Department of Livestock Products Technology, College of Veterinary Science, LUVASU, Hisar, Haryana - 125004", "order": 10},
            {"name": "Dr. Anindita Mali", "designation": "EC Member", "affiliation": "Veterinary Officer, Assam Animal Husbandry and Veterinary Department, Government of Assam", "order": 11},
            {"name": "Dr. A. R. Praveen", "designation": "EC Member", "affiliation": "Assistant Professor, Department of Dairy Technology, Dairy Science College, KVAFSU, Hebbal, Bengaluru - 560024", "order": 12},
            {"name": "Mr. D. Senthil Kumar", "designation": "EC Member", "affiliation": "Refindia Enterprises Pvt. Ltd, Namakkal", "order": 13},
            {"name": "Mr. C. Balakrishnan", "designation": "EC Member", "affiliation": "Krishna Food Products, Rasipuram, Namakkal", "order": 14},
            {"name": "Mrs. A. Archana Karthikeyan", "designation": "EC Member", "affiliation": "Thaai Herbals, Karur", "order": 15},
            {"name": "Mr. K. M. Sajeeshkumar", "designation": "EC Member", "affiliation": "Managing Director, Elanadu Milk Pvt. Ltd., Elanadu - Vaniyampara MLA Rd, Kerala - 680586", "order": 16},
            {"name": "Mr. M. Karthikeyan", "designation": "EC Member", "affiliation": "Healthy Day Milk Products, Sulur, Coimbatore", "order": 17},
            {"name": "Mr. Pradeep Ponnusamy", "designation": "EC Member", "affiliation": "Anyra Foods, 1/40, Komara Gaundan Palayam, Sokkanur (Po), Kunnathur - 638103, Tirupur District", "order": 18},
            {"name": "Mr. M. Saravanan", "designation": "EC Member", "affiliation": "STM Control Tech, 156, Sangeeth Nagar, 3rd street, Koodal Nagar, Madurai", "order": 19},
        ]
        for c in council:
            await db.executive_committee.insert_one(ExecutiveCommittee(
                member_id=member_ids.get(c["name"], ""),
                name=c["name"], designation=c["designation"], affiliation=c["affiliation"],
                category="council", order=c["order"]
            ).model_dump())
        logger.info("Seeded %d founders and %d council members", len(founders), len(council))

    if await db.cms_settings.count_documents({}) == 0:
        await db.cms_settings.insert_one({
            "website_name": "IDSEA",
            "logo_url": "/api/uploads/idsea_logo.png",
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
