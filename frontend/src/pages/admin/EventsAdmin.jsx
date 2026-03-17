import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, Bell, CheckCircle, Users, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import { FileUpload } from '../../components/admin/FileUpload';

const emptyTier = { name: '', deadline: '', fees: { academic: 0, entrepreneur: 0, corporate: 0, non_member: 0 } };
const emptyHotel = { name: '', fee: 0, description: '' };
const emptyAccom = { enabled: false, self_option: true, free_categories: [], hotels: [] };

const initForm = {
  title: '', date: '', end_date: '', venue: '', description: '', registration_fee: 0,
  brochure_url: '', speaker_details: '', status: 'upcoming', image_url: '',
  registration_enabled: false, allow_membership_registration: false,
  fee_tiers: [], accommodation: { ...emptyAccom }
};

export default function EventsAdmin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState(initForm);
  const [toast, setToast] = useState('');
  const [showNotify, setShowNotify] = useState(null);
  const [notifyType, setNotifyType] = useState('all');
  const [showRegs, setShowRegs] = useState(null);
  const [regs, setRegs] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => { axios.get(`${API}/admin/events`).then(r => { setEvents(r.data); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditEvent(null); setForm({ ...initForm, accommodation: { ...emptyAccom } }); setShowModal(true); };
  const openEdit = (e) => {
    setEditEvent(e);
    setForm({
      title: e.title, date: e.date, end_date: e.end_date || '', venue: e.venue,
      description: e.description || '', registration_fee: e.registration_fee || 0,
      brochure_url: e.brochure_url || '', speaker_details: e.speaker_details || '',
      status: e.status, image_url: e.image_url || '',
      registration_enabled: e.registration_enabled || false,
      allow_membership_registration: e.allow_membership_registration || false,
      fee_tiers: e.fee_tiers || [],
      accommodation: e.accommodation || { ...emptyAccom }
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, registration_fee: parseFloat(form.registration_fee) || 0 };
      if (editEvent) await axios.put(`${API}/admin/events/${editEvent.id}`, payload);
      else await axios.post(`${API}/admin/events`, payload);
      showToast('Event saved!'); setShowModal(false); load();
    } catch (e) { showToast('Error saving event'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await axios.delete(`${API}/admin/events/${id}`);
    showToast('Event deleted'); load();
  };

  const handleNotify = async (eventId) => {
    try {
      const r = await axios.post(`${API}/admin/events/${eventId}/notify?membership_type=${notifyType}`);
      showToast(r.data.message || 'Notification queued!');
      setShowNotify(null);
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
  };

  const handleCloseEvent = async (eventId) => {
    if (!window.confirm('Close this event? This will send participation certificates.')) return;
    try {
      const r = await axios.put(`${API}/admin/events/${eventId}/close`);
      showToast(r.data.message || 'Event closed!'); load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
  };

  const viewRegistrations = async (event) => {
    setShowRegs(event); setRegsLoading(true);
    try {
      const r = await axios.get(`${API}/admin/events/${event.id}/registrations`);
      setRegs(r.data);
    } catch { showToast('Failed to load registrations'); }
    setRegsLoading(false);
  };

  const exportRegistrations = async (eventId) => {
    try {
      const r = await axios.get(`${API}/admin/events/${eventId}/registrations/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'registrations.xlsx'; a.click();
    } catch { showToast('Export failed'); }
  };

  const updatePayment = async (regId, status) => {
    try {
      await axios.put(`${API}/admin/event-registrations/${regId}/payment`, { payment_status: status });
      showToast('Payment updated');
      if (showRegs) viewRegistrations(showRegs);
    } catch { showToast('Update failed'); }
  };

  // Fee tier helpers
  const addTier = () => setForm(f => ({ ...f, fee_tiers: [...f.fee_tiers, { ...emptyTier }] }));
  const removeTier = (idx) => setForm(f => ({ ...f, fee_tiers: f.fee_tiers.filter((_, i) => i !== idx) }));
  const updateTier = (idx, key, val) => {
    setForm(f => {
      const tiers = [...f.fee_tiers];
      if (key.startsWith('fees.')) {
        const feeKey = key.split('.')[1];
        tiers[idx] = { ...tiers[idx], fees: { ...tiers[idx].fees, [feeKey]: parseFloat(val) || 0 } };
      } else {
        tiers[idx] = { ...tiers[idx], [key]: val };
      }
      return { ...f, fee_tiers: tiers };
    });
  };

  // Accommodation helpers
  const updateAccom = (key, val) => setForm(f => ({ ...f, accommodation: { ...f.accommodation, [key]: val } }));
  const addHotel = () => updateAccom('hotels', [...(form.accommodation.hotels || []), { ...emptyHotel }]);
  const removeHotel = (idx) => updateAccom('hotels', (form.accommodation.hotels || []).filter((_, i) => i !== idx));
  const updateHotel = (idx, key, val) => {
    const hotels = [...(form.accommodation.hotels || [])];
    hotels[idx] = { ...hotels[idx], [key]: key === 'fee' ? (parseFloat(val) || 0) : val };
    updateAccom('hotels', hotels);
  };
  const toggleFreeCategory = (cat) => {
    const cats = form.accommodation.free_categories || [];
    updateAccom('free_categories', cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]);
  };

  const STATUS_COLORS = { upcoming: '#1e7a4d', ongoing: '#d97706', completed: '#6b7280' };

  return (
    <div>
      {toast && <div className="toast-success">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title" data-testid="events-admin-title">Events Management</h1>
        <button onClick={openAdd} className="btn-primary" data-testid="add-event-btn"><Plus size={16} /> Add Event</button>
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {events.length === 0 ? <div className="admin-card" style={{ textAlign: 'center', color: '#9ca3af', padding: '60px' }}>No events yet.</div> :
            events.map(event => (
              <div key={event.id} className="admin-card" data-testid="event-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{event.title}</h3>
                      <span style={{ background: STATUS_COLORS[event.status] + '20', color: STATUS_COLORS[event.status], padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{event.status?.toUpperCase()}</span>
                      {event.registration_enabled && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>REG. OPEN</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#6b7280' }}>
                      <span>Date: {event.date}{event.end_date ? ` - ${event.end_date}` : ''}</span>
                      <span>Venue: {event.venue}</span>
                      {event.fee_tiers?.length > 0 && <span>{event.fee_tiers.length} fee tier(s)</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {event.registration_enabled && (
                      <button onClick={() => viewRegistrations(event)} data-testid="view-regs-btn"
                        style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins', fontWeight: 500 }}>
                        <Users size={14} /> Registrations
                      </button>
                    )}
                    {event.status !== 'completed' && (
                      <>
                        <button onClick={() => setShowNotify(event)} style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins', fontWeight: 500 }} data-testid="notify-event-btn">
                          <Bell size={14} /> Notify
                        </button>
                        <button onClick={() => handleCloseEvent(event.id)} style={{ background: '#ede9fe', color: '#5b21b6', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins', fontWeight: 500 }} data-testid="close-event-btn">
                          <CheckCircle size={14} /> Close
                        </button>
                      </>
                    )}
                    <button onClick={() => openEdit(event)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins', fontWeight: 500 }}>
                      <Edit size={14} /> Edit
                    </button>
                    <button onClick={() => handleDelete(event.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins', fontWeight: 500 }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{editEvent ? 'Edit Event' : 'Add Event'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            {/* Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Event Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="form-input" data-testid="event-title-input" />
              </div>
              <div className="form-group"><label className="form-label">Start Date *</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="form-input" data-testid="event-date-input" /></div>
              <div className="form-group"><label className="form-label">End Date</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="form-input" /></div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Venue *</label><input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className="form-input" data-testid="event-venue-input" /></div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="form-select"><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select>
              </div>
              <div className="form-group"><label className="form-label">Speaker Details</label><input value={form.speaker_details} onChange={e => setForm({ ...form, speaker_details: e.target.value })} className="form-input" /></div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="form-textarea" rows={3} /></div>
              <div className="form-group"><label className="form-label">Brochure</label><FileUpload accept=".pdf,.doc,.docx" label="Upload Brochure" onUpload={(url) => setForm({ ...form, brochure_url: url })} /><input type="url" value={form.brochure_url} onChange={e => setForm({ ...form, brochure_url: e.target.value })} className="form-input" placeholder="Or paste URL" style={{ marginTop: '6px' }} /></div>
              <div className="form-group"><label className="form-label">Event Image</label><FileUpload accept="image/*" label="Upload Image" onUpload={(url) => setForm({ ...form, image_url: url })} /><input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="form-input" placeholder="Or paste URL" style={{ marginTop: '6px' }} /></div>
            </div>

            {/* Registration Settings */}
            <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '20px', marginTop: '20px', border: '1px solid #bae6fd' }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: '0 0 16px' }}>Registration Settings</h3>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Poppins' }}>
                  <input type="checkbox" checked={form.registration_enabled} onChange={e => setForm(f => ({ ...f, registration_enabled: e.target.checked }))} data-testid="reg-enabled-checkbox" style={{ width: '16px', height: '16px' }} />
                  Enable Event Registration
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Poppins' }}>
                  <input type="checkbox" checked={form.allow_membership_registration} onChange={e => setForm(f => ({ ...f, allow_membership_registration: e.target.checked }))} data-testid="allow-membership-checkbox" style={{ width: '16px', height: '16px' }} />
                  Allow Membership Registration
                </label>
              </div>

              {form.registration_enabled && (
                <>
                  {/* Fee Tiers */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', margin: 0 }}>Fee Tiers</h4>
                      <button onClick={addTier} data-testid="add-tier-btn" style={{ background: '#1e7a4d', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Poppins', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={14} /> Add Tier
                      </button>
                    </div>
                    {form.fee_tiers.length === 0 && <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>No fee tiers. Add tiers for deadline-based pricing.</p>}
                    {form.fee_tiers.map((tier, idx) => (
                      <div key={idx} data-testid={`fee-tier-${idx}`} style={{ background: 'white', borderRadius: '8px', padding: '16px', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Tier {idx + 1}</span>
                          <button onClick={() => removeTier(idx)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}><Trash2 size={12} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Tier Name</label><input value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)} className="form-input" placeholder="e.g. Early Bird" data-testid={`tier-name-${idx}`} /></div>
                          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Deadline Date</label><input type="date" value={tier.deadline} onChange={e => updateTier(idx, 'deadline', e.target.value)} className="form-input" data-testid={`tier-deadline-${idx}`} /></div>
                          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Academic (₹)</label><input type="number" value={tier.fees?.academic || 0} onChange={e => updateTier(idx, 'fees.academic', e.target.value)} className="form-input" /></div>
                          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Entrepreneur (₹)</label><input type="number" value={tier.fees?.entrepreneur || 0} onChange={e => updateTier(idx, 'fees.entrepreneur', e.target.value)} className="form-input" /></div>
                          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Corporate (₹)</label><input type="number" value={tier.fees?.corporate || 0} onChange={e => updateTier(idx, 'fees.corporate', e.target.value)} className="form-input" /></div>
                          <div className="form-group" style={{ margin: 0 }}><label className="form-label">Non-Member (₹)</label><input type="number" value={tier.fees?.non_member || 0} onChange={e => updateTier(idx, 'fees.non_member', e.target.value)} className="form-input" /></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Accommodation */}
                  <div>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 600, color: '#0c3c60', margin: '0 0 12px' }}>Accommodation Options</h4>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins' }}>
                        <input type="checkbox" checked={form.accommodation?.enabled || false} onChange={e => updateAccom('enabled', e.target.checked)} data-testid="accom-enabled" style={{ width: '16px', height: '16px' }} />
                        Enable Accommodation
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins' }}>
                        <input type="checkbox" checked={form.accommodation?.self_option || false} onChange={e => updateAccom('self_option', e.target.checked)} style={{ width: '16px', height: '16px' }} />
                        Self-Accommodation Option
                      </label>
                    </div>

                    {form.accommodation?.enabled && (
                      <>
                        <div style={{ marginBottom: '12px' }}>
                          <label className="form-label">Free Accommodation Categories</label>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {['academic', 'entrepreneur', 'corporate'].map(cat => (
                              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins', textTransform: 'capitalize' }}>
                                <input type="checkbox" checked={(form.accommodation.free_categories || []).includes(cat)} onChange={() => toggleFreeCategory(cat)} style={{ width: '14px', height: '14px' }} />
                                {cat}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <label className="form-label" style={{ margin: 0 }}>Hotels</label>
                          <button onClick={addHotel} data-testid="add-hotel-btn" style={{ background: '#1e7a4d', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Poppins', fontWeight: 600 }}><Plus size={12} /> Add Hotel</button>
                        </div>
                        {(form.accommodation.hotels || []).map((hotel, idx) => (
                          <div key={idx} data-testid={`hotel-${idx}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
                            <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Hotel Name</label><input value={hotel.name} onChange={e => updateHotel(idx, 'name', e.target.value)} className="form-input" placeholder="Hotel name" /></div>
                            <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Fee (₹)</label><input type="number" value={hotel.fee} onChange={e => updateHotel(idx, 'fee', e.target.value)} className="form-input" /></div>
                            <div><label style={{ fontSize: '11px', color: '#6b7280' }}>Description</label><input value={hotel.description} onChange={e => updateHotel(idx, 'description', e.target.value)} className="form-input" placeholder="Room type" /></div>
                            <button onClick={() => removeHotel(idx)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', marginBottom: '0' }}><Trash2 size={14} /></button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-event-btn">Save Event</button>
            </div>
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegs && (
        <div className="modal-overlay" onClick={() => setShowRegs(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Registrations - {showRegs.title}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => exportRegistrations(showRegs.id)} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}><Download size={14} /> Export Excel</button>
                <button onClick={() => setShowRegs(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
              </div>
            </div>

            {regsLoading ? <div className="loading-spinner">Loading...</div> : regs.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>No registrations yet.</p>
            ) : (
              <>
                <div style={{ marginBottom: '12px', fontSize: '13px', color: '#6b7280' }}>Total: {regs.length} registrations | Paid: {regs.filter(r => r.payment_status === 'paid').length}</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Name</th><th>Phone</th><th>Category</th><th>Member</th><th>Accommodation</th><th>Total (₹)</th><th>Payment</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regs.map((reg, i) => (
                        <tr key={reg.id}>
                          <td>{i + 1}</td>
                          <td><div style={{ fontWeight: 600 }}>{reg.name}</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>{reg.email}</div></td>
                          <td>{reg.phone}</td>
                          <td><span className={`badge badge-${reg.member_category || 'pending'}`}>{reg.member_category || reg.membership_type || '-'}</span></td>
                          <td>{reg.is_member ? <span style={{ color: '#1e7a4d', fontWeight: 600 }}>{reg.member_id}</span> : 'No'}</td>
                          <td>{reg.accommodation_choice === 'hotel' ? reg.hotel_name : reg.accommodation_choice || '-'}</td>
                          <td style={{ fontWeight: 700 }}>₹{reg.total_amount}</td>
                          <td><span className={`badge badge-${reg.payment_status}`}>{reg.payment_status}</span></td>
                          <td>
                            {reg.payment_status !== 'paid' && (
                              <button onClick={() => updatePayment(reg.id, 'paid')} style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Mark Paid</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notify Members Modal */}
      {showNotify && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Notify Members</h2>
              <button onClick={() => setShowNotify(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '16px' }}>Send notification for <strong>{showNotify.title}</strong>.</p>
            <div className="form-group">
              <label className="form-label">Send to</label>
              <select value={notifyType} onChange={e => setNotifyType(e.target.value)} className="form-select" data-testid="notify-type-select">
                <option value="all">All Approved Members</option>
                <option value="academic">Academic Only</option>
                <option value="entrepreneur">Entrepreneur Only</option>
                <option value="corporate">Corporate Only</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNotify(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleNotify(showNotify.id)} className="btn-primary" data-testid="confirm-notify-btn"><Bell size={14} /> Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
