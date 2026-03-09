import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import { FileUpload } from '../../components/admin/FileUpload';

const initForm = { title: '', date: '', end_date: '', venue: '', description: '', registration_fee: 0, brochure_url: '', speaker_details: '', status: 'upcoming', image_url: '' };

export default function EventsAdmin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState(initForm);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => { axios.get(`${API}/admin/events`).then(r => { setEvents(r.data); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditEvent(null); setForm(initForm); setShowModal(true); };
  const openEdit = (e) => { setEditEvent(e); setForm({ title: e.title, date: e.date, end_date: e.end_date || '', venue: e.venue, description: e.description || '', registration_fee: e.registration_fee || 0, brochure_url: e.brochure_url || '', speaker_details: e.speaker_details || '', status: e.status, image_url: e.image_url || '' }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editEvent) await axios.put(`${API}/admin/events/${editEvent.id}`, { ...form, registration_fee: parseFloat(form.registration_fee) });
      else await axios.post(`${API}/admin/events`, { ...form, registration_fee: parseFloat(form.registration_fee) });
      showToast('Event saved!'); setShowModal(false); load();
    } catch (e) { showToast('Error saving event'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await axios.delete(`${API}/admin/events/${id}`);
    showToast('Event deleted'); load();
  };

  const STATUS_COLORS = { upcoming: '#1e7a4d', ongoing: '#d97706', completed: '#6b7280' };

  return (
    <div>
      {toast && <div className="toast-success">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Events Management</h1>
        <button onClick={openAdd} className="btn-primary" data-testid="add-event-btn"><Plus size={16} /> Add Event</button>
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {events.length === 0 ? <div className="admin-card" style={{ textAlign: 'center', color: '#9ca3af', padding: '60px' }}>No events yet. Add your first event!</div> :
            events.map(event => (
              <div key={event.id} className="admin-card" data-testid="event-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{event.title}</h3>
                      <span style={{ background: STATUS_COLORS[event.status] + '20', color: STATUS_COLORS[event.status], padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins' }}>{event.status?.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#6b7280' }}>
                      <span>Date: {event.date}</span>
                      <span>Venue: {event.venue}</span>
                      {event.registration_fee > 0 && <span>Fee: ₹{event.registration_fee}</span>}
                    </div>
                    {event.description && <p style={{ fontSize: '13px', color: '#9ca3af', margin: '8px 0 0', lineHeight: 1.5, fontFamily: 'Inter' }}>{event.description?.substring(0, 150)}...</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{editEvent ? 'Edit Event' : 'Add Event'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Event Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="form-input" required />
              </div>
              <div className="form-group"><label className="form-label">Start Date *</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="form-input" required /></div>
              <div className="form-group"><label className="form-label">End Date</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="form-input" /></div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Venue *</label>
                <input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className="form-input" required />
              </div>
              <div className="form-group"><label className="form-label">Registration Fee (₹)</label><input type="number" value={form.registration_fee} onChange={e => setForm({ ...form, registration_fee: e.target.value })} className="form-input" /></div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="form-select">
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="form-textarea" rows={3} />
              </div>
              <div className="form-group"><label className="form-label">Speaker Details</label><input value={form.speaker_details} onChange={e => setForm({ ...form, speaker_details: e.target.value })} className="form-input" placeholder="Speaker names and credentials" /></div>
              <div className="form-group">
                <label className="form-label">Brochure</label>
                <FileUpload accept=".pdf,.doc,.docx" label="Upload Brochure (PDF)" onUpload={(url) => setForm({ ...form, brochure_url: url })} />
                <input type="url" value={form.brochure_url} onChange={e => setForm({ ...form, brochure_url: e.target.value })} className="form-input" placeholder="Or paste URL" style={{ marginTop: '6px' }} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Event Image</label>
                <FileUpload accept="image/*" label="Upload Event Image" onUpload={(url) => setForm({ ...form, image_url: url })} />
                <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="form-input" placeholder="Or paste URL" style={{ marginTop: '6px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-event-btn">Save Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
