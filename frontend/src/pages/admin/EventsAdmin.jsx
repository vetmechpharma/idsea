import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Trash2, Save, X, Calendar, MapPin, Eye, EyeOff, ChevronDown, ChevronUp, Hotel, Users, Upload, Image, FileText, ExternalLink, ClipboardList } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyTier = { name: '', deadline: '', fees: { member: 0, non_member: 0, student: 0, international: 0 }, accommodation_fees: { member: 0, non_member: 0, student: 0, international: 0 } };
const emptyAccom = { enabled: false, self_option: true, free_categories: [], hotels: [] };
const emptyAddon = { name: '', fee_inr: 0, fee_usd: 0, description: '', pdf_url: '' };
const emptyHotel = { name: '', amount: 0, tax_percent: 18, room_types: [{ type: 'Standard', price: 0, price_usd: 0 }], location: '', rating: '' };

const FEE_CATEGORIES = [
  { key: 'member', label: 'IDSEA Member' },
  { key: 'non_member', label: 'Non-Member' },
  { key: 'student', label: 'Student/JRF/SRF/RA/Retired' },
  { key: 'international', label: 'International (USD)' },
];

export default function EventsAdmin() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');

  const initForm = {
    title: '', date: '', end_date: '', venue: '', venue_map_link: '', description: '', registration_fee: 0,
    brochure_url: '', status: 'upcoming', image_url: '',
    registration_enabled: false, allow_membership_registration: false,
    fee_tiers: [], accommodation: { ...emptyAccom },
    additional_person_fee: 0, additional_person_fee_usd: 0, registration_addons: [], premium_hotels: []
  };
  const [form, setForm] = useState(initForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchEvents = async () => {
    try { const r = await axios.get(`${API}/admin/events`, { headers }); setEvents(r.data || []); } catch {}
  };
  useEffect(() => { fetchEvents(); }, []);

  const handleSave = async () => {
    try {
      if (editEvent) await axios.put(`${API}/admin/events/${editEvent.id}`, form, { headers });
      else await axios.post(`${API}/admin/events`, form, { headers });
      setShowModal(false); setEditEvent(null); setForm(initForm); fetchEvents();
    } catch (e) { alert(e.response?.data?.detail || 'Error saving event'); }
  };

  const openEdit = (e) => {
    setEditEvent(e);
    setForm({
      title: e.title, date: e.date, end_date: e.end_date || '', venue: e.venue,
      venue_map_link: e.venue_map_link || '',
      description: e.description || '', registration_fee: e.registration_fee || 0,
      brochure_url: e.brochure_url || '',
      status: e.status, image_url: e.image_url || '',
      registration_enabled: e.registration_enabled || false,
      allow_membership_registration: e.allow_membership_registration || false,
      fee_tiers: e.fee_tiers || [],
      accommodation: e.accommodation || { ...emptyAccom },
      additional_person_fee: e.additional_person_fee || 0,
      additional_person_fee_usd: e.additional_person_fee_usd || 0,
      registration_addons: e.registration_addons || [],
      premium_hotels: e.premium_hotels || []
    });
    setShowModal(true);
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Delete?')) return;
    await axios.delete(`${API}/admin/events/${id}`, { headers }); fetchEvents();
  };

  // Fee tier helpers
  const addTier = () => setForm(f => ({ ...f, fee_tiers: [...f.fee_tiers, { ...emptyTier }] }));
  const removeTier = (idx) => setForm(f => ({ ...f, fee_tiers: f.fee_tiers.filter((_, i) => i !== idx) }));
  const updateTier = (idx, path, val) => {
    setForm(f => {
      const tiers = [...f.fee_tiers];
      const keys = path.split('.');
      if (keys.length === 2) {
        tiers[idx] = { ...tiers[idx], [keys[0]]: { ...tiers[idx][keys[0]], [keys[1]]: parseFloat(val) || 0 } };
      } else {
        tiers[idx] = { ...tiers[idx], [path]: val };
      }
      return { ...f, fee_tiers: tiers };
    });
  };

  // Accommodation helpers
  const updateAccom = (key, val) => setForm(f => ({ ...f, accommodation: { ...f.accommodation, [key]: val } }));
  const toggleFreeCategory = (cat) => {
    const cats = form.accommodation.free_categories || [];
    updateAccom('free_categories', cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]);
  };

  // Add-on helpers
  const addAddon = () => setForm(f => ({ ...f, registration_addons: [...(f.registration_addons || []), { ...emptyAddon }] }));
  const removeAddon = (idx) => setForm(f => ({ ...f, registration_addons: f.registration_addons.filter((_, i) => i !== idx) }));
  const updateAddon = (idx, key, val) => {
    setForm(f => {
      const addons = [...f.registration_addons];
      addons[idx] = { ...addons[idx], [key]: ['fee_inr', 'fee_usd'].includes(key) ? (parseFloat(val) || 0) : val };
      return { ...f, registration_addons: addons };
    });
  };

  // Premium hotel helpers
  const addHotel = () => setForm(f => ({ ...f, premium_hotels: [...(f.premium_hotels || []), { ...emptyHotel }] }));
  const removeHotel = (idx) => setForm(f => ({ ...f, premium_hotels: f.premium_hotels.filter((_, i) => i !== idx) }));
  const updateHotel = (idx, key, val) => {
    setForm(f => {
      const hotels = [...f.premium_hotels];
      hotels[idx] = { ...hotels[idx], [key]: ['amount', 'tax_percent'].includes(key) ? (parseFloat(val) || 0) : val };
      return { ...f, premium_hotels: hotels };
    });
  };
  const updateRoomType = (hotelIdx, rtIdx, key, val) => {
    setForm(f => {
      const hotels = [...f.premium_hotels];
      const rts = [...(hotels[hotelIdx].room_types || [])];
      rts[rtIdx] = { ...rts[rtIdx], [key]: ['price', 'price_usd'].includes(key) ? (parseFloat(val) || 0) : val };
      hotels[hotelIdx] = { ...hotels[hotelIdx], room_types: rts };
      return { ...f, premium_hotels: hotels };
    });
  };
  const addRoomType = (hotelIdx) => {
    setForm(f => {
      const hotels = [...f.premium_hotels];
      hotels[hotelIdx] = { ...hotels[hotelIdx], room_types: [...(hotels[hotelIdx].room_types || []), { type: '', price: 0, price_usd: 0 }] };
      return { ...f, premium_hotels: hotels };
    });
  };
  const removeRoomType = (hotelIdx, rtIdx) => {
    setForm(f => {
      const hotels = [...f.premium_hotels];
      hotels[hotelIdx] = { ...hotels[hotelIdx], room_types: hotels[hotelIdx].room_types.filter((_, i) => i !== rtIdx) };
      return { ...f, premium_hotels: hotels };
    });
  };

  // PDF upload for addons
  const uploadAddonPdf = async (idx) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const fd = new FormData(); fd.append('file', file);
      try {
        const r = await axios.post(`${API}/upload`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
        updateAddon(idx, 'pdf_url', r.data.url);
      } catch { alert('Upload failed'); }
    };
    input.click();
  };

  const sections = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'fees', label: 'Fee Tiers' },
    { id: 'accommodation', label: 'Accommodation' },
    { id: 'hotels', label: 'Premium Hotels' },
    { id: 'addons', label: 'Add-ons' },
  ];

  return (
    <div data-testid="events-admin" style={{ maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Poppins', fontSize: '24px', fontWeight: 700, color: '#0c3c60' }}>Events</h1>
        <button onClick={() => { setEditEvent(null); setForm(initForm); setShowModal(true); }} className="btn-primary" data-testid="create-event-btn"><Plus size={16} /> Create Event</button>
      </div>

      {/* Event List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {events.map(e => (
          <div key={e.id} data-testid={`event-${e.id}`} style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1 }}>
              {e.image_url && (
                <img src={e.image_url.startsWith('http') ? e.image_url : `${process.env.REACT_APP_BACKEND_URL}${e.image_url}`} alt={e.title}
                  style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '15px', color: '#0c3c60', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {e.title}
                  {e.brochure_url && (
                    <a href={e.brochure_url.startsWith('http') ? e.brochure_url : `${process.env.REACT_APP_BACKEND_URL}${e.brochure_url}`} target="_blank" rel="noreferrer"
                      title="Download Brochure" style={{ color: '#1e7a4d' }}><FileText size={14} /></a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                  <span><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {e.date}</span>
                  <span><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {e.venue}</span>
                  {e.venue_map_link && <a href={e.venue_map_link} target="_blank" rel="noreferrer" style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px' }}><ExternalLink size={11} /> Map</a>}
                  <span style={{ padding: '1px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: e.registration_enabled ? '#d1fae5' : '#f1f5f9', color: e.registration_enabled ? '#065f46' : '#94a3b8' }}>
                    {e.registration_enabled ? 'Reg. Open' : 'Reg. Closed'}
                  </span>
                  <span style={{ padding: '1px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: e.is_visible !== false ? '#dbeafe' : '#fee2e2', color: e.is_visible !== false ? '#1e40af' : '#991b1b' }}>
                    {e.is_visible !== false ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={async () => { await axios.put(`${API}/admin/events/${e.id}`, { ...e, is_visible: e.is_visible === false ? true : false }); load(); }} style={{ background: e.is_visible !== false ? '#fee2e2' : '#d1fae5', color: e.is_visible !== false ? '#991b1b' : '#065f46', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins' }} data-testid={`toggle-visibility-${e.id}`}>
                {e.is_visible !== false ? 'Hide' : 'Show'}
              </button>
              <Link to={`/admin/events/${e.id}/details`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins', textDecoration: 'none', cursor: 'pointer' }} data-testid={`edit-details-${e.id}`}>
                Edit Details Page
              </Link>
              {e.registration_enabled && (
                <Link to={`/admin/events/${e.id}/registrations`} className="btn-primary" data-testid={`view-registrations-${e.id}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '6px 14px' }}>
                  <ClipboardList size={14} /> Registrations
                </Link>
              )}
              <button onClick={() => openEdit(e)} className="btn-secondary" data-testid={`edit-event-${e.id}`}><Edit3 size={14} /> Edit</button>
              <button onClick={() => deleteEvent(e.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '40px' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '95%', maxWidth: '1000px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{editEvent ? 'Edit Event' : 'Create Event'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Section Tabs */}
            {form.registration_enabled && (
              <div style={{ display: 'flex', gap: '2px', padding: '8px 24px 0', borderBottom: '1px solid #e2e8f0' }}>
                {sections.map(s => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                    padding: '8px 16px', fontFamily: 'Poppins', fontSize: '13px', fontWeight: activeSection === s.id ? 600 : 400,
                    color: activeSection === s.id ? '#0c3c60' : '#94a3b8', background: 'none', border: 'none',
                    borderBottom: activeSection === s.id ? '2px solid #0c3c60' : '2px solid transparent', cursor: 'pointer', marginBottom: '-1px'
                  }}>{s.label}</button>
                ))}
              </div>
            )}

            {/* Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {/* ===== BASIC INFO ===== */}
              {(activeSection === 'basic' || !form.registration_enabled) && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group"><label className="form-label">Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="form-input" data-testid="event-title-input" /></div>
                    <div className="form-group"><label className="form-label">Venue *</label><input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Start Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">End Date</label><input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Status</label>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="form-input">
                        <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="past">Past</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label"><MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Venue Google Maps Link</label>
                      <input value={form.venue_map_link} onChange={e => setForm(f => ({ ...f, venue_map_link: e.target.value }))} className="form-input" placeholder="https://maps.google.com/..." data-testid="venue-map-link" />
                    </div>
                  </div>
                  <div className="form-group"><label className="form-label">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-input" rows={3} /></div>

                  {/* Event Image Upload */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                    <div className="form-group">
                      <label className="form-label"><Image size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Event Image</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file'; input.accept = 'image/*';
                          input.onchange = async (ev) => {
                            const file = ev.target.files[0]; if (!file) return;
                            setUploadingImage(true);
                            const fd = new FormData(); fd.append('file', file);
                            try {
                              const r = await axios.post(`${API}/public/upload-photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                              setForm(f => ({ ...f, image_url: r.data.url }));
                            } catch { alert('Image upload failed'); }
                            setUploadingImage(false);
                          };
                          input.click();
                        }} className="btn-secondary" data-testid="upload-event-image" style={{ fontSize: '13px', padding: '8px 14px' }}>
                          {uploadingImage ? 'Uploading...' : <><Upload size={14} /> Upload Image</>}
                        </button>
                        {form.image_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={form.image_url.startsWith('http') ? form.image_url : `${process.env.REACT_APP_BACKEND_URL}${form.image_url}`} alt="Event" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                            <button onClick={() => setForm(f => ({ ...f, image_url: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px' }}><X size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Event Brochure Upload */}
                    <div className="form-group">
                      <label className="form-label"><FileText size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Event Brochure (PDF)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file'; input.accept = '.pdf';
                          input.onchange = async (ev) => {
                            const file = ev.target.files[0]; if (!file) return;
                            setUploadingBrochure(true);
                            const fd = new FormData(); fd.append('file', file);
                            try {
                              const r = await axios.post(`${API}/public/upload-pdf`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                              setForm(f => ({ ...f, brochure_url: r.data.url }));
                            } catch { alert('Brochure upload failed'); }
                            setUploadingBrochure(false);
                          };
                          input.click();
                        }} className="btn-secondary" data-testid="upload-brochure" style={{ fontSize: '13px', padding: '8px 14px' }}>
                          {uploadingBrochure ? 'Uploading...' : <><Upload size={14} /> Upload PDF</>}
                        </button>
                        {form.brochure_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <a href={form.brochure_url.startsWith('http') ? form.brochure_url : `${process.env.REACT_APP_BACKEND_URL}${form.brochure_url}`} target="_blank" rel="noreferrer"
                              style={{ fontSize: '12px', color: '#1e7a4d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FileText size={14} /> View Brochure
                            </a>
                            <button onClick={() => setForm(f => ({ ...f, brochure_url: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px' }}><X size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.registration_enabled} onChange={e => setForm(f => ({ ...f, registration_enabled: e.target.checked }))} data-testid="enable-registration" />
                      <span className="form-label" style={{ margin: 0 }}>Enable Registration</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.allow_membership_registration} onChange={e => setForm(f => ({ ...f, allow_membership_registration: e.target.checked }))} />
                      <span className="form-label" style={{ margin: 0 }}>Allow Membership Registration</span>
                    </label>
                  </div>
                </>
              )}

              {/* ===== FEE TIERS ===== */}
              {form.registration_enabled && activeSection === 'fees' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 600, color: '#0c3c60', margin: 0 }}>Fee Tiers (Early Bird / Regular)</h3>
                    <button onClick={addTier} className="btn-secondary" data-testid="add-tier-btn"><Plus size={14} /> Add Tier</button>
                  </div>
                  {form.fee_tiers.map((tier, idx) => (
                    <div key={idx} data-testid={`fee-tier-${idx}`} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '12px', background: '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: 1 }}>
                          <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Tier Name</label>
                            <select value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)} className="form-input">
                              <option value="">Select...</option><option value="Early Bird">Early Bird</option><option value="Regular">Regular</option>
                            </select>
                          </div>
                          <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Deadline</label><input type="date" value={tier.deadline} onChange={e => updateTier(idx, 'deadline', e.target.value)} className="form-input" /></div>
                        </div>
                        <button onClick={() => removeTier(idx)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px', alignSelf: 'start' }}><Trash2 size={14} /></button>
                      </div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#1e7a4d', display: 'block', marginBottom: '6px' }}>Registration Fees</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {FEE_CATEGORIES.map(cat => (
                          <div key={cat.key}><label style={{ fontSize: '11px', color: '#6b7280' }}>{cat.label} {cat.key === 'international' ? '($)' : '(₹)'}</label>
                            <input type="number" value={tier.fees?.[cat.key] || 0} onChange={e => updateTier(idx, `fees.${cat.key}`, e.target.value)} className="form-input" />
                          </div>
                        ))}
                      </div>
                      {form.accommodation?.enabled && (
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#0c3c60', display: 'block', marginBottom: '6px' }}>Default Accommodation Fees</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {FEE_CATEGORIES.filter(c => c.key !== 'international').map(cat => (
                              <div key={cat.key}><label style={{ fontSize: '11px', color: '#6b7280' }}>{cat.label} (₹)</label>
                                <input type="number" value={tier.accommodation_fees?.[cat.key] || 0} onChange={e => updateTier(idx, `accommodation_fees.${cat.key}`, e.target.value)} className="form-input" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* ===== ACCOMMODATION ===== */}
              {form.registration_enabled && activeSection === 'accommodation' && (
                <>
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 600, color: '#0c3c60', margin: '0 0 12px 0' }}>Accommodation Settings</h3>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.accommodation?.enabled || false} onChange={e => updateAccom('enabled', e.target.checked)} data-testid="enable-accommodation" />
                      <span className="form-label" style={{ margin: 0 }}>Enable Accommodation</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.accommodation?.self_option || false} onChange={e => updateAccom('self_option', e.target.checked)} />
                      <span className="form-label" style={{ margin: 0 }}>Self-Accommodation Option</span>
                    </label>
                  </div>
                  {form.accommodation?.enabled && (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#0c3c60', display: 'block', marginBottom: '8px' }}>Free Accommodation Categories</label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {FEE_CATEGORIES.filter(c => c.key !== 'international').map(cat => (
                            <label key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: (form.accommodation.free_categories || []).includes(cat.key) ? '#f0fdf4' : 'white' }}>
                              <input type="checkbox" checked={(form.accommodation.free_categories || []).includes(cat.key)} onChange={() => toggleFreeCategory(cat.key)} />
                              <span style={{ fontSize: '13px' }}>{cat.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#0c3c60', display: 'block', marginBottom: '6px' }}>Additional Person Fee</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280' }}>INR (₹ per person)</label>
                            <input type="number" value={form.additional_person_fee || 0} onChange={e => setForm(f => ({ ...f, additional_person_fee: parseFloat(e.target.value) || 0 }))} className="form-input" data-testid="additional-person-fee" />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280' }}>USD ($ per person) - International</label>
                            <input type="number" value={form.additional_person_fee_usd || 0} onChange={e => setForm(f => ({ ...f, additional_person_fee_usd: parseFloat(e.target.value) || 0 }))} className="form-input" data-testid="additional-person-fee-usd" />
                          </div>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Fee for each additional accommodation person added by registrant</p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ===== PREMIUM HOTELS ===== */}
              {form.registration_enabled && activeSection === 'hotels' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 600, color: '#0c3c60', margin: 0 }}>Premium Hotels (Self-Accommodation)</h3>
                    <button onClick={addHotel} className="btn-secondary"><Plus size={14} /> Add Hotel</button>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>Hotels shown when registrant chooses self-accommodation. Final price = Room Price + Tax%</p>
                  {(form.premium_hotels || []).map((hotel, idx) => (
                    <div key={idx} data-testid={`hotel-${idx}`} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '12px', background: '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#0c3c60' }}><Hotel size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Hotel {idx + 1}</span>
                        <button onClick={() => removeHotel(idx)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Hotel Name</label><input value={hotel.name} onChange={e => updateHotel(idx, 'name', e.target.value)} className="form-input" /></div>
                        <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Tax %</label><input type="number" value={hotel.tax_percent} onChange={e => updateHotel(idx, 'tax_percent', e.target.value)} className="form-input" /></div>
                        <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Location</label><input value={hotel.location || ''} onChange={e => updateHotel(idx, 'location', e.target.value)} className="form-input" /></div>
                        <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Rating</label>
                          <select value={hotel.rating || ''} onChange={e => updateHotel(idx, 'rating', e.target.value)} className="form-input">
                            <option value="">Select</option><option value="3-Star">3-Star</option><option value="4-Star">4-Star</option><option value="5-Star">5-Star</option>
                          </select>
                        </div>
                      </div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#1e7a4d', display: 'block', marginBottom: '6px' }}>Room Types (INR + USD for International Delegates)</label>
                      {(hotel.room_types || []).map((rt, rtIdx) => (
                        <div key={rtIdx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '8px', marginBottom: '6px' }}>
                          <input value={rt.type} onChange={e => updateRoomType(idx, rtIdx, 'type', e.target.value)} className="form-input" placeholder="e.g. Standard, Deluxe" />
                          <input type="number" value={rt.price} onChange={e => updateRoomType(idx, rtIdx, 'price', e.target.value)} className="form-input" placeholder="Price INR (₹)" />
                          <input type="number" value={rt.price_usd || 0} onChange={e => updateRoomType(idx, rtIdx, 'price_usd', e.target.value)} className="form-input" placeholder="Price USD ($)" />
                          <button onClick={() => removeRoomType(idx, rtIdx)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><X size={14} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRoomType(idx)} style={{ background: '#f0fdf4', border: '1px dashed #1e7a4d', color: '#1e7a4d', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>+ Room Type</button>
                    </div>
                  ))}
                </>
              )}

              {/* ===== ADD-ONS ===== */}
              {form.registration_enabled && activeSection === 'addons' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 600, color: '#0c3c60', margin: 0 }}>Optional Add-ons</h3>
                    <button onClick={addAddon} className="btn-secondary" data-testid="add-addon-btn"><Plus size={14} /> Add Add-on</button>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>Pre-conference Workshop / Excursion Trip / Others. INR for regular, USD for international delegates.</p>
                  {(form.registration_addons || []).map((addon, idx) => (
                    <div key={idx} data-testid={`addon-${idx}`} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '10px', background: '#fafafa' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                        <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Name</label><input value={addon.name} onChange={e => updateAddon(idx, 'name', e.target.value)} className="form-input" placeholder="e.g. Pre-conference Workshop" /></div>
                        <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Fee INR (₹)</label><input type="number" value={addon.fee_inr} onChange={e => updateAddon(idx, 'fee_inr', e.target.value)} className="form-input" /></div>
                        <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Fee USD ($)</label><input type="number" value={addon.fee_usd} onChange={e => updateAddon(idx, 'fee_usd', e.target.value)} className="form-input" /></div>
                        <button onClick={() => removeAddon(idx)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', alignSelf: 'end', marginBottom: '4px' }}><Trash2 size={14} /></button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                        <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Description</label><input value={addon.description || ''} onChange={e => updateAddon(idx, 'description', e.target.value)} className="form-input" placeholder="Details about this add-on" /></div>
                        <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Details PDF</label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => uploadAddonPdf(idx)} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 10px' }}>Upload PDF</button>
                            {addon.pdf_url && <a href={`${process.env.REACT_APP_BACKEND_URL}${addon.pdf_url}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#1e7a4d', alignSelf: 'center' }}>View PDF</a>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-event-btn"><Save size={14} /> {editEvent ? 'Update' : 'Create'} Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
