import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import { FileUpload } from '../../components/admin/FileUpload';

const Section = ({ title, children }) => (
  <div className="admin-card" style={{ marginBottom: '20px' }}>
    <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>{title}</h3>
    {children}
  </div>
);

export default function EventDetailEditor() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [d, setD] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    axios.get(`${API}/admin/events`).then(r => { const ev = r.data.find(e => e.id === eventId); setEvent(ev); });
    axios.get(`${API}/admin/events/${eventId}/details`).then(r => setD(r.data || {})).catch(() => {});
  }, [eventId]);

  const up = (k, v) => setD(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/events/${eventId}/details`, d);
      showToast('Event details saved!');
    } catch { showToast('Save failed'); }
    setSaving(false);
  };

  // Array field helpers
  const addItem = (key, item) => up(key, [...(d[key] || []), item]);
  const removeItem = (key, idx) => up(key, (d[key] || []).filter((_, i) => i !== idx));
  const updateItem = (key, idx, field, val) => up(key, (d[key] || []).map((item, i) => i === idx ? { ...item, [field]: val } : item));

  const inputS = { width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
  const labelS = { fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '4px', display: 'block' };
  const textareaS = { ...inputS, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' };

  if (!event) return <div className="loading-spinner">Loading...</div>;

  return (
    <div data-testid="event-detail-editor">
      {toast && <div className="toast-success">{toast}</div>}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/admin/events')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Event Detail Page Editor</h1>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{event.title}</p>
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary" disabled={saving} data-testid="save-details-btn">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* Countdown */}
      <Section title="Countdown Timer">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><label style={labelS}>Countdown Date (ISO format)</label><input value={d.countdown_date || ''} onChange={e => up('countdown_date', e.target.value)} style={inputS} type="datetime-local" data-testid="countdown-date" /></div>
          <div><label style={labelS}>Countdown Label</label><input value={d.countdown_label || ''} onChange={e => up('countdown_label', e.target.value)} style={inputS} placeholder="Registration Closes In" /></div>
        </div>
      </Section>

      {/* About / Welcome */}
      <Section title="About / Welcome Content">
        <div><label style={labelS}>Detailed Description (overrides event description)</label><textarea value={d.about_content || ''} onChange={e => up('about_content', e.target.value)} style={textareaS} rows={6} placeholder="Detailed welcome text about the event..." data-testid="about-content" /></div>
        <div style={{ marginTop: '12px' }}><label style={labelS}>Key Objectives (one per line)</label><textarea value={d.objectives || ''} onChange={e => up('objectives', e.target.value)} style={textareaS} rows={4} placeholder="One objective per line..." /></div>
        <div style={{ marginTop: '12px' }}><label style={labelS}>Conference Highlights (one per line)</label><textarea value={d.highlights || ''} onChange={e => up('highlights', e.target.value)} style={textareaS} rows={4} placeholder="One highlight per line..." /></div>
      </Section>

      {/* Themes */}
      <Section title="Conference Themes">
        <label style={labelS}>Themes (one per line)</label>
        <textarea value={(d.themes || []).join('\n')} onChange={e => up('themes', e.target.value.split('\n'))} style={textareaS} rows={5} placeholder="Theme 1\nTheme 2\nTheme 3..." data-testid="themes-textarea" />
      </Section>

      {/* Important Dates */}
      <Section title="Important Dates">
        {(d.important_dates || []).map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <input value={item.label} onChange={e => updateItem('important_dates', i, 'label', e.target.value)} style={{ ...inputS, flex: 1 }} placeholder="Label (e.g. Abstract Submission)" />
            <input value={item.date} onChange={e => updateItem('important_dates', i, 'date', e.target.value)} style={{ ...inputS, width: '180px' }} placeholder="Date (e.g. 30 Aug 2026)" />
            <button onClick={() => removeItem('important_dates', i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} color="#dc2626" /></button>
          </div>
        ))}
        <button onClick={() => addItem('important_dates', { label: '', date: '' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#0369a1' }}><Plus size={14} /> Add Date</button>
      </Section>

      {/* Awards */}
      <Section title="Awards (one per line)">
        <textarea value={d.awards || ''} onChange={e => up('awards', e.target.value)} style={textareaS} rows={4} placeholder="Best Paper Award\nYoung Scientist Award\n..." />
      </Section>

      {/* Sponsorship Packages */}
      <Section title="Sponsorship Packages">
        {(d.sponsors || []).map((s, i) => (
          <div key={i} style={{ background: '#fafbfc', borderRadius: '8px', padding: '12px', marginBottom: '10px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={s.name} onChange={e => updateItem('sponsors', i, 'name', e.target.value)} style={{ ...inputS, flex: 1 }} placeholder="Tier name (Platinum)" />
              <input value={s.amount} onChange={e => updateItem('sponsors', i, 'amount', e.target.value)} style={{ ...inputS, width: '140px' }} placeholder="₹5,00,000" />
              <input value={s.color || ''} onChange={e => updateItem('sponsors', i, 'color', e.target.value)} style={{ ...inputS, width: '80px' }} type="color" />
              <button onClick={() => removeItem('sponsors', i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} color="#dc2626" /></button>
            </div>
            <textarea value={s.benefits || ''} onChange={e => updateItem('sponsors', i, 'benefits', e.target.value)} style={{ ...inputS, minHeight: '50px' }} placeholder="Benefits (one per line)" />
          </div>
        ))}
        <button onClick={() => addItem('sponsors', { name: '', amount: '', color: '#7c3aed', benefits: '' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#7c3aed' }}><Plus size={14} /> Add Sponsor Tier</button>
      </Section>

      {/* Committee */}
      <Section title="Conference Committee">
        {(d.committee || []).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={c.role} onChange={e => updateItem('committee', i, 'role', e.target.value)} style={{ ...inputS, width: '140px' }} placeholder="Role (Patron)" />
            <input value={c.name} onChange={e => updateItem('committee', i, 'name', e.target.value)} style={{ ...inputS, flex: 1, minWidth: '140px' }} placeholder="Full Name" />
            <input value={c.affiliation || ''} onChange={e => updateItem('committee', i, 'affiliation', e.target.value)} style={{ ...inputS, flex: 1, minWidth: '140px' }} placeholder="Affiliation" />
            <input value={c.phone || ''} onChange={e => updateItem('committee', i, 'phone', e.target.value)} style={{ ...inputS, width: '130px' }} placeholder="Phone" />
            <button onClick={() => removeItem('committee', i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} color="#dc2626" /></button>
          </div>
        ))}
        <button onClick={() => addItem('committee', { role: '', name: '', affiliation: '', phone: '' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#0369a1' }}><Plus size={14} /> Add Committee Member</button>
      </Section>

      {/* Venue & Travel Info */}
      <Section title="Venue & Travel Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div><label style={labelS}>Venue Name</label><input value={d.venue_info?.name || ''} onChange={e => up('venue_info', { ...(d.venue_info || {}), name: e.target.value })} style={inputS} placeholder="Conference venue name" /></div>
          <div><label style={labelS}>Full Address</label><input value={d.venue_info?.address || ''} onChange={e => up('venue_info', { ...(d.venue_info || {}), address: e.target.value })} style={inputS} placeholder="Full address" /></div>
        </div>
        <div><label style={labelS}>How to Reach</label><textarea value={d.how_to_reach || ''} onChange={e => up('how_to_reach', e.target.value)} style={textareaS} rows={3} placeholder="By Air: ...\nBy Rail: ...\nBy Road: ..." /></div>
        <div style={{ marginTop: '12px' }}><label style={labelS}>Weather Information</label><textarea value={d.weather || ''} onChange={e => up('weather', e.target.value)} style={textareaS} rows={2} placeholder="Expected weather during the event..." /></div>
        <div style={{ marginTop: '12px' }}><label style={labelS}>Sightseeing / Local Attractions</label><textarea value={d.sightseeing || ''} onChange={e => up('sightseeing', e.target.value)} style={textareaS} rows={2} placeholder="Local attractions and sightseeing info..." /></div>
      </Section>

      {/* Contact Persons */}
      <Section title="Contact Persons">
        {(d.contacts || []).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
            <input value={c.name} onChange={e => updateItem('contacts', i, 'name', e.target.value)} style={{ ...inputS, flex: 1 }} placeholder="Name" />
            <input value={c.role || ''} onChange={e => updateItem('contacts', i, 'role', e.target.value)} style={{ ...inputS, width: '140px' }} placeholder="Role" />
            <input value={c.phone || ''} onChange={e => updateItem('contacts', i, 'phone', e.target.value)} style={{ ...inputS, width: '130px' }} placeholder="Phone" />
            <input value={c.email || ''} onChange={e => updateItem('contacts', i, 'email', e.target.value)} style={{ ...inputS, width: '170px' }} placeholder="Email" />
            <button onClick={() => removeItem('contacts', i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} color="#dc2626" /></button>
          </div>
        ))}
        <button onClick={() => addItem('contacts', { name: '', role: '', phone: '', email: '' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#0369a1' }}><Plus size={14} /> Add Contact</button>
      </Section>

      {/* Bottom Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0' }}>
        <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ padding: '12px 32px' }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save All Details'}
        </button>
      </div>
    </div>
  );
}
