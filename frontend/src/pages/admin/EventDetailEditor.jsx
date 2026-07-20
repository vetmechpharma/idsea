import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Plus, Trash2, Loader2, Search, Image, X } from 'lucide-react';
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
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState({});
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    axios.get(`${API}/admin/events`).then(r => { const ev = r.data.find(e => e.id === eventId); setEvent(ev); });
    axios.get(`${API}/admin/events/${eventId}/details`).then(r => setD(r.data || {})).catch(() => {});
    axios.get(`${API}/admin/members`, { params: { status: 'approved' } }).then(r => setMembers(r.data || [])).catch(() => {});
  }, [eventId]);

  const up = (k, v) => setD(prev => ({ ...prev, [k]: v }));
  const handleSave = async () => {
    setSaving(true);
    try { await axios.put(`${API}/admin/events/${eventId}/details`, d); showToast('Event details saved!'); } catch { showToast('Save failed'); }
    setSaving(false);
  };
  const addItem = (key, item) => up(key, [...(d[key] || []), item]);
  const removeItem = (key, idx) => up(key, (d[key] || []).filter((_, i) => i !== idx));
  const updateItem = (key, idx, field, val) => up(key, (d[key] || []).map((item, i) => i === idx ? { ...item, [field]: val } : item));

  const searchMembers = (query) => {
    if (!query || query.length < 2) return [];
    return members.filter(m => m.name?.toLowerCase().includes(query.toLowerCase()) || m.email?.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  };

  const linkMember = (key, idx, member) => {
    updateItem(key, idx, 'name', member.name);
    updateItem(key, idx, 'photo_url', member.photo_url || '');
    updateItem(key, idx, 'affiliation', member.organization || '');
    updateItem(key, idx, 'phone', member.phone || '');
    updateItem(key, idx, 'member_id', member.id);
    setMemberSearch({});
  };

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

      {/* Banner Gallery */}
      <Section title="Event Banner Gallery">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {(d.gallery_images || []).map((img, i) => (
            <div key={i} style={{ position: 'relative', width: '100px', height: '65px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <img src={img.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${img}` : img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => up('gallery_images', (d.gallery_images || []).filter((_, j) => j !== i))} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={10} color="white" /></button>
            </div>
          ))}
        </div>
        <FileUpload accept="image/*" label="Add Banner Image" onUpload={(url) => up('gallery_images', [...(d.gallery_images || []), url])} />
      </Section>

      {/* Countdown */}
      <Section title="Countdown Timer">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><label style={labelS}>Countdown Date</label><input value={d.countdown_date || ''} onChange={e => up('countdown_date', e.target.value)} style={inputS} type="datetime-local" /></div>
          <div><label style={labelS}>Label</label><input value={d.countdown_label || ''} onChange={e => up('countdown_label', e.target.value)} style={inputS} placeholder="Registration Closes In" /></div>
        </div>
      </Section>

      {/* About */}
      <Section title="About / Welcome Content">
        <div><label style={labelS}>Detailed Description</label><textarea value={d.about_content || ''} onChange={e => up('about_content', e.target.value)} style={textareaS} rows={6} /></div>
        <div style={{ marginTop: '12px' }}><label style={labelS}>Key Objectives (one per line)</label><textarea value={d.objectives || ''} onChange={e => up('objectives', e.target.value)} style={textareaS} rows={4} /></div>
        <div style={{ marginTop: '12px' }}><label style={labelS}>Conference Highlights (one per line)</label><textarea value={d.highlights || ''} onChange={e => up('highlights', e.target.value)} style={textareaS} rows={4} /></div>
      </Section>

      {/* Themes */}
      <Section title="Conference Themes (one per line)">
        <textarea value={(d.themes || []).join('\n')} onChange={e => up('themes', e.target.value.split('\n'))} style={textareaS} rows={5} />
      </Section>

      {/* Important Dates */}
      <Section title="Important Dates">
        {(d.important_dates || []).map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <input value={item.label} onChange={e => updateItem('important_dates', i, 'label', e.target.value)} style={{ ...inputS, flex: 1 }} placeholder="Label" />
            <input value={item.date} onChange={e => updateItem('important_dates', i, 'date', e.target.value)} style={{ ...inputS, width: '160px' }} placeholder="Date" />
            <select value={item.color || 'blue'} onChange={e => updateItem('important_dates', i, 'color', e.target.value)} style={{ ...inputS, width: '100px' }}>
              <option value="blue">Blue</option><option value="green">Green</option><option value="red">Red</option>
              <option value="amber">Amber</option><option value="purple">Purple</option><option value="pink">Pink</option>
            </select>
            <select value={item.status || ''} onChange={e => updateItem('important_dates', i, 'status', e.target.value)} style={{ ...inputS, width: '110px' }}>
              <option value="">Upcoming</option><option value="active">Active Now</option><option value="closed">Closed</option>
            </select>
            <button onClick={() => removeItem('important_dates', i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} color="#dc2626" /></button>
          </div>
        ))}
        <button onClick={() => addItem('important_dates', { label: '', date: '', color: 'blue', status: '' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#0369a1' }}><Plus size={14} /> Add Date</button>
      </Section>

      {/* Awards */}
      <Section title="Awards (one per line)">
        <textarea value={d.awards || ''} onChange={e => up('awards', e.target.value)} style={textareaS} rows={4} />
      </Section>

      {/* Sponsorship */}
      <Section title="Sponsorship Packages">
        {(d.sponsors || []).map((s, i) => (
          <div key={i} style={{ background: '#fafbfc', borderRadius: '8px', padding: '12px', marginBottom: '10px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={s.name} onChange={e => updateItem('sponsors', i, 'name', e.target.value)} style={{ ...inputS, flex: 1 }} placeholder="Tier (Platinum)" />
              <input value={s.amount} onChange={e => updateItem('sponsors', i, 'amount', e.target.value)} style={{ ...inputS, width: '140px' }} placeholder="₹5,00,000" />
              <input value={s.color || ''} onChange={e => updateItem('sponsors', i, 'color', e.target.value)} style={{ ...inputS, width: '60px' }} type="color" />
              <button onClick={() => removeItem('sponsors', i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} color="#dc2626" /></button>
            </div>
            <textarea value={s.benefits || ''} onChange={e => updateItem('sponsors', i, 'benefits', e.target.value)} style={{ ...inputS, minHeight: '50px' }} placeholder="Benefits (one per line)" />
          </div>
        ))}
        <button onClick={() => addItem('sponsors', { name: '', amount: '', color: '#7c3aed', benefits: '' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#7c3aed' }}><Plus size={14} /> Add Tier</button>
      </Section>

      {/* Committee with Photo + Member Linking */}
      <Section title="Conference Committee (with Photos)">
        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>Search to link existing IDSEA members (auto-fills name, photo, affiliation). Or enter manually.</p>
        {(d.committee || []).map((c, i) => {
          const searchKey = `committee_${i}`;
          const results = searchMembers(memberSearch[searchKey] || '');
          const photoSrc = c.photo_url ? (c.photo_url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${c.photo_url}` : c.photo_url) : '';
          return (
            <div key={i} style={{ background: '#fafbfc', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                {/* Photo */}
                <div style={{ flexShrink: 0 }}>
                  {photoSrc ? (
                    <div style={{ position: 'relative' }}>
                      <img src={photoSrc} alt="" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
                      <button onClick={() => updateItem('committee', i, 'photo_url', '')} style={{ position: 'absolute', top: -4, right: -4, background: '#dc2626', border: 'none', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={8} color="white" /></button>
                    </div>
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileUpload accept="image/*" label="" onUpload={(url) => updateItem('committee', i, 'photo_url', url)}>
                        <Image size={20} style={{ color: '#9ca3af', cursor: 'pointer' }} />
                      </FileUpload>
                    </div>
                  )}
                </div>
                {/* Fields */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div style={{ position: 'relative', gridColumn: '1 / -1' }}>
                    <input value={memberSearch[searchKey] ?? ''} onChange={e => setMemberSearch(prev => ({ ...prev, [searchKey]: e.target.value }))} style={{ ...inputS, paddingLeft: '28px' }} placeholder="Search member to link..." />
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '10px', color: '#9ca3af' }} />
                    {results.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', maxHeight: '150px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {results.map(m => (
                          <div key={m.id} onClick={() => linkMember('committee', i, m)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid #f5f5f5' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <strong>{m.name}</strong> <span style={{ color: '#9ca3af' }}>— {m.organization}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input value={c.role || ''} onChange={e => updateItem('committee', i, 'role', e.target.value)} style={inputS} placeholder="Role (Patron, Chairman...)" />
                  <input value={c.name || ''} onChange={e => updateItem('committee', i, 'name', e.target.value)} style={inputS} placeholder="Full Name" />
                  <input value={c.affiliation || ''} onChange={e => updateItem('committee', i, 'affiliation', e.target.value)} style={inputS} placeholder="Affiliation / Organization" />
                  <input value={c.phone || ''} onChange={e => updateItem('committee', i, 'phone', e.target.value)} style={inputS} placeholder="Phone" />
                </div>
                <button onClick={() => removeItem('committee', i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={14} color="#dc2626" /></button>
              </div>
            </div>
          );
        })}
        <button onClick={() => addItem('committee', { role: '', name: '', affiliation: '', phone: '', photo_url: '', member_id: '' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#0369a1' }}><Plus size={14} /> Add Committee Member</button>
      </Section>

      {/* Venue & Map */}
      <Section title="Venue, Map & Travel">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div><label style={labelS}>Venue Name</label><input value={d.venue_info?.name || ''} onChange={e => up('venue_info', { ...(d.venue_info || {}), name: e.target.value })} style={inputS} /></div>
          <div><label style={labelS}>Full Address</label><input value={d.venue_info?.address || ''} onChange={e => up('venue_info', { ...(d.venue_info || {}), address: e.target.value })} style={inputS} /></div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={labelS}>Google Maps Embed URL</label>
          <input value={d.venue_info?.map_embed_url || ''} onChange={e => up('venue_info', { ...(d.venue_info || {}), map_embed_url: e.target.value })} style={inputS} placeholder="https://www.google.com/maps/embed?pb=..." />
          <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px' }}>Google Maps → Share → Embed a map → Copy iframe src URL</p>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={labelS}>Map QR Code Link (for visitors to scan & navigate)</label>
          <input value={d.venue_info?.map_qr_link || ''} onChange={e => up('venue_info', { ...(d.venue_info || {}), map_qr_link: e.target.value })} style={inputS} placeholder="https://maps.google.com/?q=..." />
          <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px' }}>Direct Google Maps link. QR code will be generated for visitors to scan & get directions.</p>
        </div>
        <div><label style={labelS}>How to Reach</label><textarea value={d.how_to_reach || ''} onChange={e => up('how_to_reach', e.target.value)} style={textareaS} rows={3} placeholder="By Air: ...\nBy Rail: ...\nBy Road: ..." /></div>
        <div style={{ marginTop: '12px' }}><label style={labelS}>Weather</label><textarea value={d.weather || ''} onChange={e => up('weather', e.target.value)} style={textareaS} rows={2} /></div>
      </Section>

      {/* Sightseeing with Images */}
      <Section title="Nearby Sightseeing / Attractions (with Images)">
        {(d.sightseeing_places || []).map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
            <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
              {p.image_url ? (
                <img src={p.image_url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${p.image_url}` : p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Image size={16} style={{ color: '#d1d5db' }} /></div>
              )}
            </div>
            <input value={p.name || ''} onChange={e => updateItem('sightseeing_places', i, 'name', e.target.value)} style={{ ...inputS, flex: 1 }} placeholder="Place Name" />
            <input value={p.distance || ''} onChange={e => updateItem('sightseeing_places', i, 'distance', e.target.value)} style={{ ...inputS, width: '80px' }} placeholder="12 km" />
            <div style={{ width: '70px', flexShrink: 0 }}>
              <FileUpload accept="image/*" label="Img" onUpload={(url) => updateItem('sightseeing_places', i, 'image_url', url)} />
            </div>
            <button onClick={() => removeItem('sightseeing_places', i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} color="#dc2626" /></button>
          </div>
        ))}
        <button onClick={() => addItem('sightseeing_places', { name: '', distance: '', image_url: '' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#065f46' }}><Plus size={14} /> Add Place</button>
      </Section>

      {/* Contacts */}
      <Section title="Contact Persons">
        {(d.contacts || []).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
            <input value={c.name} onChange={e => updateItem('contacts', i, 'name', e.target.value)} style={{ ...inputS, flex: 1 }} placeholder="Name" />
            <input value={c.role || ''} onChange={e => updateItem('contacts', i, 'role', e.target.value)} style={{ ...inputS, width: '130px' }} placeholder="Role" />
            <input value={c.phone || ''} onChange={e => updateItem('contacts', i, 'phone', e.target.value)} style={{ ...inputS, width: '120px' }} placeholder="Phone" />
            <input value={c.email || ''} onChange={e => updateItem('contacts', i, 'email', e.target.value)} style={{ ...inputS, width: '160px' }} placeholder="Email" />
            <button onClick={() => removeItem('contacts', i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} color="#dc2626" /></button>
          </div>
        ))}
        <button onClick={() => addItem('contacts', { name: '', role: '', phone: '', email: '' })} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#0369a1' }}><Plus size={14} /> Add Contact</button>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0' }}>
        <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ padding: '12px 32px' }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save All Details'}
        </button>
      </div>
    </div>
  );
}
