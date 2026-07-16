import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import PaymentPage from '../../components/PaymentPage';
import { CheckCircle, Upload, X, Camera, FileText, Globe, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PREFIXES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Shri', 'Smt.'];
const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

const STATE_DISTRICTS = {
  'Tamil Nadu': ['Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kancheepuram','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupattur','Tirupur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore','Viluppuram','Virudhunagar'],
  'Maharashtra': ['Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara','Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban','Nagpur','Nanded','Nandurbar','Nashik','Osmanabad','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal'],
  'Karnataka': ['Bagalkot','Bangalore Rural','Bangalore Urban','Belgaum','Bellary','Bidar','Chamarajanagar','Chikballapur','Chikmagalur','Chitradurga','Dakshina Kannada','Davanagere','Dharwad','Gadag','Gulbarga','Hassan','Haveri','Kodagu','Kolar','Koppal','Mandya','Mysore','Raichur','Ramanagara','Shimoga','Tumkur','Udupi','Uttara Kannada','Yadgir'],
  'Kerala': ['Alappuzha','Ernakulam','Idukki','Kannur','Kasaragod','Kollam','Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta','Thiruvananthapuram','Thrissur','Wayanad'],
  'Andhra Pradesh': ['Anantapur','Chittoor','East Godavari','Guntur','Kadapa','Krishna','Kurnool','Nellore','Prakasam','Srikakulam','Visakhapatnam','Vizianagaram','West Godavari'],
  'Telangana': ['Adilabad','Bhadradri Kothagudem','Hyderabad','Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Komaram Bheem','Mahabubabad','Mahbubnagar','Mancherial','Medak','Medchal Malkajgiri','Mulugu','Nagarkurnool','Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla','Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy','Warangal Rural','Warangal Urban','Yadadri Bhuvanagiri'],
  'Gujarat': ['Ahmedabad','Amreli','Anand','Aravalli','Banaskantha','Bharuch','Bhavnagar','Botad','Chhota Udaipur','Dahod','Dang','Devbhoomi Dwarka','Gandhinagar','Gir Somnath','Jamnagar','Junagadh','Kutch','Kheda','Mahisagar','Mehsana','Morbi','Narmada','Navsari','Panchmahal','Patan','Porbandar','Rajkot','Sabarkantha','Surat','Surendranagar','Tapi','Vadodara','Valsad'],
  'Rajasthan': ['Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara','Bikaner','Bundi','Chittorgarh','Churu','Dausa','Dholpur','Dungarpur','Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur','Karauli','Kota','Nagaur','Pali','Pratapgarh','Rajsamand','Sawai Madhopur','Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'],
  'Uttar Pradesh': ['Agra','Aligarh','Ambedkar Nagar','Amethi','Amroha','Auraiya','Ayodhya','Azamgarh','Baghpat','Bahraich','Ballia','Balrampur','Banda','Barabanki','Bareilly','Basti','Bhadohi','Bijnor','Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah','Etawah','Farrukhabad','Fatehpur','Firozabad','Gautam Buddh Nagar','Ghaziabad','Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur','Hardoi','Hathras','Jalaun','Jaunpur','Jhansi','Kannauj','Kanpur Dehat','Kanpur Nagar','Kasganj','Kaushambi','Kushinagar','Lakhimpur Kheri','Lalitpur','Lucknow','Maharajganj','Mahoba','Mainpuri','Mathura','Mau','Meerut','Mirzapur','Moradabad','Muzaffarnagar','Pilibhit','Pratapgarh','Prayagraj','Rae Bareli','Rampur','Saharanpur','Sambhal','Sant Kabir Nagar','Shahjahanpur','Shamli','Shravasti','Siddharthnagar','Sitapur','Sonbhadra','Sultanpur','Unnao','Varanasi'],
  'Punjab': ['Amritsar','Barnala','Bathinda','Faridkot','Fatehgarh Sahib','Fazilka','Ferozepur','Gurdaspur','Hoshiarpur','Jalandhar','Kapurthala','Ludhiana','Mansa','Moga','Mohali','Muktsar','Nawanshahr','Pathankot','Patiala','Rupnagar','Sangrur','Tarn Taran'],
  'Haryana': ['Ambala','Bhiwani','Charkhi Dadri','Faridabad','Fatehabad','Gurugram','Hisar','Jhajjar','Jind','Kaithal','Karnal','Kurukshetra','Mahendragarh','Nuh','Palwal','Panchkula','Panipat','Rewari','Rohtak','Sirsa','Sonipat','Yamunanagar'],
  'West Bengal': ['Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur','Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong','Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas','Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman','Purba Medinipur','Purulia','South 24 Parganas','Uttar Dinajpur'],
  'Bihar': ['Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur','Bhojpur','Buxar','Darbhanga','East Champaran','Gaya','Gopalganj','Jamui','Jehanabad','Kaimur','Katihar','Khagaria','Kishanganj','Lakhisarai','Madhepura','Madhubani','Munger','Muzaffarpur','Nalanda','Nawada','Patna','Purnia','Rohtas','Saharsa','Samastipur','Saran','Sheikhpura','Sheohar','Sitamarhi','Siwan','Supaul','Vaishali','West Champaran'],
  'Madhya Pradesh': ['Agar Malwa','Alirajpur','Anuppur','Ashoknagar','Balaghat','Barwani','Betul','Bhind','Bhopal','Burhanpur','Chhatarpur','Chhindwara','Damoh','Datia','Dewas','Dhar','Dindori','Guna','Gwalior','Harda','Hoshangabad','Indore','Jabalpur','Jhabua','Katni','Khandwa','Khargone','Mandla','Mandsaur','Morena','Narsinghpur','Neemuch','Panna','Raisen','Rajgarh','Ratlam','Rewa','Sagar','Satna','Sehore','Seoni','Shahdol','Shajapur','Sheopur','Shivpuri','Sidhi','Singrauli','Tikamgarh','Ujjain','Umaria','Vidisha'],
  'Assam': ['Baksa','Barpeta','Biswanath','Bongaigaon','Cachar','Charaideo','Chirang','Darrang','Dhemaji','Dhubri','Dibrugarh','Dima Hasao','Goalpara','Golaghat','Hailakandi','Hojai','Jorhat','Kamrup','Kamrup Metropolitan','Karbi Anglong','Karimganj','Kokrajhar','Lakhimpur','Majuli','Morigaon','Nagaon','Nalbari','Sivasagar','Sonitpur','South Salmara-Mankachar','Tinsukia','Udalguri','West Karbi Anglong'],
  'Odisha': ['Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh','Cuttack','Deogarh','Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi','Kandhamal','Kendrapara','Kendujhar','Khordha','Koraput','Malkangiri','Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Subarnapur','Sundargarh'],
  'Jharkhand': ['Bokaro','Chatra','Deoghar','Dhanbad','Dumka','East Singhbhum','Garhwa','Giridih','Godda','Gumla','Hazaribagh','Jamtara','Khunti','Koderma','Latehar','Lohardaga','Pakur','Palamu','Ramgarh','Ranchi','Sahebganj','Seraikela Kharsawan','Simdega','West Singhbhum'],
  'Chhattisgarh': ['Balod','Baloda Bazar','Balrampur','Bastar','Bemetara','Bijapur','Bilaspur','Dantewada','Dhamtari','Durg','Gariaband','Janjgir-Champa','Jashpur','Kabirdham','Kanker','Kondagaon','Korba','Koriya','Mahasamund','Mungeli','Narayanpur','Raigarh','Raipur','Rajnandgaon','Sukma','Surajpur','Surguja'],
};
const PREFIX_MAP = { academic: 'ACD', entrepreneur: 'ENT', corporate: 'COP', international: 'INT' };
const emptyAddr = { line1: '', line2: '', line3: '', state: '', district: '', pincode: '', country: '' };

// Separate components to prevent remount on parent re-render
function IndianAddressFields({ addr, which, onChange }) {
  const districts = STATE_DISTRICTS[addr.state] || [];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
      <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
        <label className="form-label">Address Line 1 *</label>
        <input value={addr.line1} onChange={e => onChange(which, 'line1', e.target.value)} className="form-input" placeholder="House/Flat No, Building Name" required data-testid={`${which}-line1`} />
      </div>
      <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
        <label className="form-label">Address Line 2 *</label>
        <input value={addr.line2} onChange={e => onChange(which, 'line2', e.target.value)} className="form-input" placeholder="Street, Area, Locality" required data-testid={`${which}-line2`} />
      </div>
      <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
        <label className="form-label">Address Line 3 *</label>
        <input value={addr.line3} onChange={e => onChange(which, 'line3', e.target.value)} className="form-input" placeholder="Landmark, Village, Town" required data-testid={`${which}-line3`} />
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">State *</label>
        <select value={addr.state} onChange={e => { onChange(which, 'state', e.target.value); onChange(which, 'district', ''); }} className="form-select" required data-testid={`${which}-state`}>
          <option value="">Select State</option>
          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">District *</label>
        {districts.length > 0 ? (
          <select value={addr.district} onChange={e => onChange(which, 'district', e.target.value)} className="form-select" required data-testid={`${which}-district`}>
            <option value="">Select District</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        ) : (
          <input value={addr.district} onChange={e => onChange(which, 'district', e.target.value)} className="form-input" placeholder="Enter district" required data-testid={`${which}-district`} />
        )}
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Pincode *</label>
        <input value={addr.pincode} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); onChange(which, 'pincode', v); }} className="form-input" placeholder="6-digit pincode" inputMode="numeric" pattern="[0-9]{6}" required data-testid={`${which}-pincode`} />
      </div>
    </div>
  );
}

function InternationalAddressFields({ addr, which, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
      <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
        <label className="form-label">Address Line 1 *</label>
        <input value={addr.line1} onChange={e => onChange(which, 'line1', e.target.value)} className="form-input" placeholder="Street address" required data-testid={`${which}-line1`} />
      </div>
      <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
        <label className="form-label">Address Line 2 *</label>
        <input value={addr.line2} onChange={e => onChange(which, 'line2', e.target.value)} className="form-input" placeholder="Apartment, suite, unit, etc." required data-testid={`${which}-line2`} />
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">City / State *</label>
        <input value={addr.state} onChange={e => onChange(which, 'state', e.target.value)} className="form-input" placeholder="City, State/Province" required data-testid={`${which}-state`} />
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Country *</label>
        <input value={addr.country} onChange={e => onChange(which, 'country', e.target.value)} className="form-input" placeholder="Country" required data-testid={`${which}-country`} />
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Postal / ZIP Code *</label>
        <input value={addr.pincode} onChange={e => onChange(which, 'pincode', e.target.value)} className="form-input" placeholder="Postal / ZIP code" required data-testid={`${which}-pincode`} />
      </div>
    </div>
  );
}

export default function MembershipApplyPage() {
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [memberId, setMemberId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [idProofUploading, setIdProofUploading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef(null);
  const idProofRef = useRef(null);

  const [form, setForm] = useState({
    prefix: 'Mr.', name: '', email: '', phone: '', qualification: '', specialization: '',
    organization: '', photo_url: '', identity_proof_url: '', membership_type: 'academic',
    payment_status: 'pending', country: 'India',
    permanent_address: { ...emptyAddr }, contact_address: { ...emptyAddr }, contact_same_as_permanent: false
  });

  useEffect(() => {
    axios.get(`${API}/public/membership-plans`).then(r => {
      setPlans(r.data || []);
      setPlansLoading(false);
    }).catch(() => setPlansLoading(false));
  }, []);

  const isInternational = form.membership_type === 'international';
  const currentPlan = plans.find(p => p.key === form.membership_type);
  const fee = isInternational ? (currentPlan?.fee_usd || 100) : (currentPlan?.fee_inr || 0);
  const currSym = isInternational ? '$' : '\u20B9';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const updateAddr = useCallback((which, key, val) => {
    setForm(f => ({ ...f, [which]: { ...f[which], [key]: val } }));
  }, []);

  const toggleSameAddress = (checked) => {
    setForm(f => ({ ...f, contact_same_as_permanent: checked, ...(checked ? { contact_address: { ...f.permanent_address } } : {}) }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return; }
    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setPhotoUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await axios.post(`${API}/public/upload-photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, photo_url: r.data.file_url }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Photo upload failed');
      setPhotoPreview('');
    }
    setPhotoUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleIdProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { setError('Only PDF files allowed for identity proof'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB'); return; }
    setIdProofUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await axios.post(`${API}/public/upload-pdf`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, identity_proof_url: r.data.file_url }));
    } catch (err) { setError(err.response?.data?.detail || 'Upload failed'); }
    setIdProofUploading(false);
    if (idProofRef.current) idProofRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    const missing = [];
    if (!form.name) missing.push('Full Name');
    if (!form.email) missing.push('Email');
    if (!form.phone) missing.push('Phone');
    if (!form.qualification) missing.push('Qualification');
    if (!form.organization) missing.push('Organization');
    if (!form.photo_url) missing.push('Profile Photo');
    if (!form.permanent_address?.line1) missing.push('Address Line 1');
    if (!form.permanent_address?.line2) missing.push('Address Line 2');
    if (!form.permanent_address?.line3 && !isInternational) missing.push('Address Line 3');
    if (isInternational) {
      if (!form.identity_proof_url) missing.push('Identity Proof');
      if (!form.permanent_address?.country) missing.push('Country');
    } else {
      if (!form.permanent_address?.state) missing.push('State');
      if (!form.permanent_address?.district) missing.push('District');
    }
    if (!form.permanent_address?.pincode) missing.push('Pincode');

    if (missing.length > 0) {
      setError(`Please fill required fields: ${missing.join(', ')}`);
      return;
    }

    setLoading(true); setError('');
    try {
      const payload = { ...form };
      if (form.contact_same_as_permanent) payload.contact_address = { ...form.permanent_address };
      if (isInternational) {
        payload.state = form.permanent_address?.country || form.country || '';
        payload.country = form.permanent_address?.country || form.country || '';
      } else {
        payload.state = form.permanent_address?.state || '';
        payload.country = 'India';
      }
      const res = await axios.post(`${API}/public/members/apply`, payload);
      setMemberId(res.data.id);
      setStep('payment');
    } catch (err) { setError(err.response?.data?.detail || 'Submission failed'); }
    setLoading(false);
  };

  const handlePaymentSuccess = (method) => {
    setPaymentStatus(method === 'razorpay' ? 'paid' : 'verification_pending');
    setStep('success');
  };
  const handlePaymentSkip = () => { setPaymentStatus('pending'); setStep('success'); };

  const photoUrl = photoPreview || (form.photo_url ? (form.photo_url.startsWith('/api') ? `${API.replace('/api', '')}${form.photo_url}` : form.photo_url) : '');

  if (step === 'success') {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <PublicNavbar />
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '200px 24px 40px', textAlign: 'center' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '72px', height: '72px', background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><CheckCircle size={36} style={{ color: '#1e7a4d' }} /></div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: 700, color: '#0c3c60', marginBottom: '12px' }}>Application Submitted!</h2>
            <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.6, marginBottom: '8px' }}>Your membership application has been submitted successfully.</p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>Reference: <strong style={{ color: '#0c3c60' }}>{memberId?.substring(0, 8).toUpperCase()}</strong></p>
            <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ display: 'grid', gap: '6px', fontSize: '14px' }}>
                <div><span style={{ color: '#6b7280' }}>Membership:</span> <strong style={{ textTransform: 'capitalize' }}>{currentPlan?.label || form.membership_type}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Fee:</span> <strong>{currSym}{fee.toLocaleString()}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Payment:</span>{' '}
                  {paymentStatus === 'paid' ? <span style={{ color: '#1e7a4d', fontWeight: 600 }}>Paid</span>
                    : paymentStatus === 'verification_pending' ? <span style={{ color: '#d97706', fontWeight: 600 }}>Verification Pending</span>
                      : <span style={{ color: '#d97706', fontWeight: 600 }}>Pending</span>}
                </div>
              </div>
            </div>
            {paymentStatus === 'verification_pending' && <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>Your payment reference has been submitted and will be verified shortly.</p>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Go to Home</Link>
            </div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <PublicNavbar />
        <div>
          <div style={{ background: '#0c3c60', padding: '170px 24px 30px', textAlign: 'center', color: 'white' }}>
            <h1 style={{ fontFamily: 'Poppins', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 800, marginBottom: '8px' }}>Complete Membership Payment</h1>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>{form.prefix} {form.name} - {currentPlan?.label || form.membership_type}</p>
            {isInternational && <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.15)', display: 'inline-block', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>Payment in USD via Razorpay</div>}
          </div>
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} data-testid="membership-payment-step">
              <PaymentPage amount={fee} name={`${form.prefix} ${form.name}`.trim()} email={form.email} phone={form.phone}
                purpose="membership" memberId={memberId} membershipType={form.membership_type}
                onSuccess={handlePaymentSuccess} onCancel={handlePaymentSkip}
                currency={isInternational ? 'USD' : 'INR'} isInternational={isInternational} />
            </div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <PublicNavbar />
      <div>
        <div style={{ background: '#0c3c60', padding: '180px 24px 40px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, marginBottom: '12px' }}>Apply for Membership</h1>
          <p style={{ fontSize: '15px', opacity: 0.8, fontFamily: 'Inter, sans-serif' }}>Join the Indian Dairy Scientists and Entrepreneurs Association</p>
        </div>

        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 24px' }}>
          {/* Membership Type Selection */}
          {plansLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} /> Loading plans...</div>
          ) : (
            <div style={{ marginBottom: '28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }} data-testid="plans-grid">
              {plans.map(plan => {
                const prefix = PREFIX_MAP[plan.key] || 'MEM';
                const isIntl = plan.key === 'international';
                const planFee = isIntl ? plan.fee_usd : plan.fee_inr;
                const sym = isIntl ? '$' : '\u20B9';
                return (
                  <div key={plan.key} onClick={() => setForm(f => ({ ...f, membership_type: plan.key }))} data-testid={`membership-type-${plan.key}`} style={{
                    background: 'white', borderRadius: '12px', padding: '20px', cursor: 'pointer',
                    border: form.membership_type === plan.key ? `2px solid ${isIntl ? '#1e40af' : '#1e7a4d'}` : '2px solid #e5e7eb',
                    boxShadow: form.membership_type === plan.key ? `0 4px 12px ${isIntl ? 'rgba(30,64,175,0.15)' : 'rgba(30,122,77,0.15)'}` : '0 2px 6px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease', position: 'relative'
                  }}>
                    {isIntl && <div style={{ position: 'absolute', top: '10px', right: '10px' }}><Globe size={16} style={{ color: '#1e40af' }} /></div>}
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '4px' }}>{plan.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: isIntl ? '#1e40af' : '#1e7a4d', fontFamily: 'Poppins, sans-serif', marginBottom: '4px' }}>{sym}{planFee.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'Inter, sans-serif', marginBottom: '6px' }}>{plan.description}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>ID: {prefix}/IDSEA/{new Date().getFullYear()}/XXXX</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Application Form */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            {isInternational && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }} data-testid="international-badge">
                <Globe size={18} style={{ color: '#1e40af', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '14px', color: '#1e40af' }}>International Delegate Registration</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Profile photo and identity proof (passport/ID) upload required. Payment in USD via Razorpay only.</div>
                </div>
              </div>
            )}

            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '24px' }}>Personal Information</h2>
            {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }} data-testid="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Prefix + Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Prefix *</label>
                  <select name="prefix" value={form.prefix} onChange={handleChange} className="form-select" data-testid="prefix-select" required>
                    {PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="Full Name" required data-testid="apply-name" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="form-input" placeholder="your@email.com" required data-testid="apply-email" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone (with country code) *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="form-input" placeholder={isInternational ? '12345678900' : '919XXXXXXXXX'} required data-testid="apply-phone" />
                  <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'block' }}>Enter without + or spaces (e.g. 919876543210)</span>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Qualification *</label>
                  <input name="qualification" value={form.qualification} onChange={handleChange} className="form-input" placeholder="Ph.D., M.V.Sc., B.Tech..." required data-testid="apply-qualification" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Specialization</label>
                  <input name="specialization" value={form.specialization} onChange={handleChange} className="form-input" placeholder="Dairy Technology, Dairy Science..." data-testid="apply-specialization" />
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label className="form-label">Organization / Institution *</label>
                  <input name="organization" value={form.organization} onChange={handleChange} className="form-input" placeholder="University / Company name" required data-testid="apply-organization" />
                </div>
              </div>

              {/* Photo Upload */}
              <div style={{ margin: '16px 0' }}>
                <label className="form-label">Passport Size Photo *</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div onClick={() => !photoUploading && fileInputRef.current?.click()}
                    style={{
                      width: '100px', height: '100px', borderRadius: '12px',
                      border: photoUrl ? 'none' : `2px dashed ${isInternational ? '#93c5fd' : '#d1d5db'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: photoUploading ? 'wait' : 'pointer', background: photoUrl ? 'none' : (isInternational ? '#eff6ff' : '#fafafa'),
                      overflow: 'hidden', position: 'relative'
                    }}
                    data-testid="photo-upload-area"
                  >
                    {photoUrl ? (
                      <>
                        <img src={photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        <div onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, photo_url: '' })); setPhotoPreview(''); }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} color="white" /></div>
                      </>
                    ) : photoUploading ? (
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>Uploading...</span>
                    ) : (
                      <>
                        <Camera size={20} style={{ color: isInternational ? '#3b82f6' : '#9ca3af', marginBottom: '4px' }} />
                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>Upload Photo</span>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ display: 'none' }} data-testid="photo-file-input" />
                  <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.6 }}>
                    Upload a passport-size photo<br />
                    Formats: JPG, PNG, WebP (Max 5MB)<br />
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>Required for all applicants</span>
                  </div>
                </div>
              </div>

              {/* Identity Proof Upload - International Only */}
              {isInternational && (
                <div style={{ margin: '16px 0', background: '#f0f9ff', borderRadius: '10px', padding: '16px', border: '1px solid #bae6fd' }} data-testid="id-proof-section">
                  <label className="form-label" style={{ color: '#1e40af' }}>Identity Proof (Passport / National ID) * <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>PDF only</span></label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                    {form.identity_proof_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#d1fae5', borderRadius: '8px', padding: '10px 14px', flex: 1 }}>
                        <FileText size={18} style={{ color: '#065f46' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#065f46', flex: 1 }}>Identity proof uploaded</span>
                        <button type="button" onClick={() => setForm(f => ({ ...f, identity_proof_url: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}><X size={16} /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => idProofRef.current?.click()} disabled={idProofUploading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #93c5fd', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#1e40af' }}
                        data-testid="upload-id-proof-btn">
                        {idProofUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {idProofUploading ? 'Uploading...' : 'Upload Identity Proof (PDF)'}
                      </button>
                    )}
                    <input ref={idProofRef} type="file" accept=".pdf" onChange={handleIdProofUpload} style={{ display: 'none' }} data-testid="id-proof-file-input" />
                  </div>
                </div>
              )}

              {/* Permanent Address */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ background: isInternational ? '#f0f9ff' : '#f8fafc', borderRadius: '12px', padding: '20px', border: isInternational ? '1px solid #bae6fd' : '1px solid #e5e7eb' }}>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0c3c60', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isInternational && <Globe size={16} style={{ color: '#1e40af' }} />}
                    {isInternational ? 'Address' : 'Permanent Address'}
                  </div>
                  {isInternational ? (
                    <InternationalAddressFields addr={form.permanent_address} which="permanent_address" onChange={updateAddr} />
                  ) : (
                    <IndianAddressFields addr={form.permanent_address} which="permanent_address" onChange={updateAddr} />
                  )}
                </div>
              </div>

              {/* Same Address Checkbox - domestic only */}
              {!isInternational && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                    <input type="checkbox" checked={form.contact_same_as_permanent} onChange={e => toggleSameAddress(e.target.checked)} data-testid="same-address-checkbox"
                      style={{ width: '18px', height: '18px', accentColor: '#1e7a4d' }} />
                    <span style={{ fontWeight: 600 }}>Contact address is same as permanent address</span>
                  </label>
                  {!form.contact_same_as_permanent && (
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0c3c60', marginBottom: '14px' }}>Contact Address</div>
                      <IndianAddressFields addr={form.contact_address} which="contact_address" onChange={updateAddr} />
                    </div>
                  )}
                </>
              )}

              <div style={{ background: isInternational ? '#eff6ff' : '#f0f9ff', border: `1px solid ${isInternational ? '#bfdbfe' : '#bae6fd'}`, borderRadius: '10px', padding: '16px', margin: '20px 0', fontSize: '13px', color: isInternational ? '#1e40af' : '#0369a1' }}>
                <strong>Membership Fee:</strong> {currSym}{fee.toLocaleString()} — Permanent Membership
                {isInternational && <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>Payment in USD via Razorpay only</span>}
                <br /><span style={{ fontSize: '12px' }}>You will be directed to the payment page after submission.</span>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" data-testid="apply-submit-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}>
                {loading ? 'Submitting...' : 'Submit & Proceed to Payment'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
