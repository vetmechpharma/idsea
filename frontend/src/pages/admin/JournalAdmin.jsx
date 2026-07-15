import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BookOpen, Plus, Trash2, Save, ChevronUp, ChevronDown, Search, X, User, ToggleLeft, ToggleRight, Eye, Settings } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

const BACKEND = API.replace('/api', '');
const inputS = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' };

export default function JournalAdmin() {
  const [settings, setSettings] = useState({ coming_soon: true, journal_name: 'Journal of Dairy Science and Enterprise', abbreviation: 'JDSE', description: '', cover_image: '', meta_title: '', meta_description: '', meta_keywords: '' });
  const [sections, setSections] = useState([]);
  const [toast, setToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeSection, setActiveSection] = useState(null);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    try {
      const [s, b] = await Promise.all([
        axios.get(`${API}/admin/journal/settings`),
        axios.get(`${API}/admin/journal/board`),
      ]);
      setSettings(s.data);
      setSections(b.data);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    try { await axios.put(`${API}/admin/journal/settings`, settings); showToast('Settings saved!'); } catch { showToast('Error saving'); }
  };

  const addSection = async () => {
    try {
      const r = await axios.post(`${API}/admin/journal/board`, { title: 'New Section', order: sections.length, members: [] });
      showToast('Section added'); load();
    } catch { showToast('Error'); }
  };

  const updateSection = async (sec) => {
    try { await axios.put(`${API}/admin/journal/board/${sec.id}`, sec); showToast('Section saved'); load(); } catch { showToast('Error'); }
  };

  const deleteSection = async (id) => {
    if (!window.confirm('Delete this section and all its members?')) return;
    try { await axios.delete(`${API}/admin/journal/board/${id}`); showToast('Deleted'); load(); } catch { showToast('Error'); }
  };

  const moveSection = async (idx, dir) => {
    const items = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    items.forEach((s, i) => { s.order = i; });
    for (const s of items) await axios.put(`${API}/admin/journal/board/${s.id}`, { order: s.order });
    load();
  };

  const addMemberToSection = (secIdx, member) => {
    const updated = [...sections];
    const existing = updated[secIdx].members || [];
    if (existing.find(m => m.name === member.name)) { showToast('Already added'); return; }
    existing.push({
      id: member.id || String(Date.now()),
      name: member.name, designation: member.qualification || '', organization: member.organization || '',
      email: member.email || '', phone: member.phone || '', photo_url: member.photo_url || '',
      member_id: member.id || '', order: existing.length,
    });
    updated[secIdx].members = existing;
    setSections(updated);
    updateSection(updated[secIdx]);
    setSearchQuery(''); setSearchResults([]);
  };

  const addManualMember = (secIdx) => {
    const updated = [...sections];
    const members = updated[secIdx].members || [];
    members.push({ id: String(Date.now()), name: '', designation: '', organization: '', email: '', phone: '', photo_url: '', member_id: '', order: members.length });
    updated[secIdx].members = members;
    setSections(updated);
  };

  const updateMember = (secIdx, memIdx, field, value) => {
    const updated = [...sections];
    updated[secIdx].members[memIdx][field] = value;
    setSections(updated);
  };

  const removeMember = (secIdx, memIdx) => {
    const updated = [...sections];
    updated[secIdx].members.splice(memIdx, 1);
    setSections(updated);
    updateSection(updated[secIdx]);
  };

  const searchMembers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try { const r = await axios.get(`${API}/admin/members/search?q=${encodeURIComponent(q)}`); setSearchResults(r.data); } catch { setSearchResults([]); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try { const r = await axios.post(`${API}/public/upload-photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setSettings({ ...settings, cover_image: r.data.url }); showToast('Image uploaded'); } catch { showToast('Upload failed'); }
  };

  const resolveImg = (u) => u ? (u.startsWith('http') ? u : `${BACKEND}${u.startsWith('/') ? '' : '/'}${u}`) : '';

  return (
    <div data-testid="journal-admin">
      {toast && <div className="toast-success">{toast}</div>}

      <div className="page-header">
        <h1 className="page-title">Journal Management</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/journal" target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> View Page</a>
        </div>
      </div>

      {/* Settings */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} /> Journal Settings
          </h3>
          <button onClick={() => { setSettings({ ...settings, coming_soon: !settings.coming_soon }); }} data-testid="toggle-coming-soon"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600,
              background: settings.coming_soon ? '#fef3c7' : '#d1fae5', color: settings.coming_soon ? '#92400e' : '#065f46' }}>
            {settings.coming_soon ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
            {settings.coming_soon ? 'Coming Soon (Active)' : 'Journal Live'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div><label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Journal Name</label>
            <input value={settings.journal_name || ''} onChange={e => setSettings({ ...settings, journal_name: e.target.value })} style={inputS} /></div>
          <div><label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Abbreviation</label>
            <input value={settings.abbreviation || ''} onChange={e => setSettings({ ...settings, abbreviation: e.target.value })} style={inputS} /></div>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Description</label>
          <textarea value={settings.description || ''} onChange={e => setSettings({ ...settings, description: e.target.value })} style={{ ...inputS, minHeight: '60px' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div><label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cover Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '12px' }} />
            {settings.cover_image && <img src={resolveImg(settings.cover_image)} alt="" style={{ height: '60px', borderRadius: '6px', marginTop: '6px' }} />}</div>
          <div>
            <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cover Image URL (or upload)</label>
            <input value={settings.cover_image || ''} onChange={e => setSettings({ ...settings, cover_image: e.target.value })} style={inputS} placeholder="/api/uploads/journal_cover.jpg" />
          </div>
        </div>

        {/* SEO */}
        <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '14px', marginBottom: '12px', border: '1px solid #bae6fd' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}><Search size={12} /> SEO / Meta Data</h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            <input value={settings.meta_title || ''} onChange={e => setSettings({ ...settings, meta_title: e.target.value })} style={inputS} placeholder="Meta Title" />
            <textarea value={settings.meta_description || ''} onChange={e => setSettings({ ...settings, meta_description: e.target.value })} style={{ ...inputS, minHeight: '50px' }} placeholder="Meta Description" />
            <input value={settings.meta_keywords || ''} onChange={e => setSettings({ ...settings, meta_keywords: e.target.value })} style={inputS} placeholder="Meta Keywords (comma-separated)" />
          </div>
        </div>

        <button onClick={saveSettings} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }} data-testid="save-journal-settings"><Save size={14} /> Save Settings</button>
      </div>

      {/* Editorial Board Sections */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Editorial Board Sections</h2>
        <button onClick={addSection} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} data-testid="add-section-btn"><Plus size={14} /> Add Section</button>
      </div>

      {sections.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>No sections yet. Click &ldquo;Add Section&rdquo; to start building the editorial board.</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {sections.map((sec, secIdx) => (
            <div key={sec.id} className="admin-card" data-testid={`section-${secIdx}`}>
              {/* Section header */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button onClick={() => moveSection(secIdx, -1)} disabled={secIdx === 0} style={{ background: 'none', border: 'none', cursor: secIdx === 0 ? 'default' : 'pointer', color: secIdx === 0 ? '#d1d5db' : '#6b7280', fontSize: '12px', padding: 0 }}>&#9650;</button>
                  <button onClick={() => moveSection(secIdx, 1)} disabled={secIdx === sections.length - 1} style={{ background: 'none', border: 'none', cursor: secIdx === sections.length - 1 ? 'default' : 'pointer', color: secIdx === sections.length - 1 ? '#d1d5db' : '#6b7280', fontSize: '12px', padding: 0 }}>&#9660;</button>
                </div>
                <input value={sec.title} onChange={e => { const u = [...sections]; u[secIdx].title = e.target.value; setSections(u); }}
                  style={{ ...inputS, fontWeight: 700, fontFamily: 'Poppins', fontSize: '15px', flex: 1, color: '#0c3c60' }} data-testid={`section-title-${secIdx}`} />
                <button onClick={() => updateSection(sec)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}><Save size={12} /> Save</button>
                <button onClick={() => deleteSection(sec.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>

              {/* Members in section */}
              <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                {(sec.members || []).map((mem, memIdx) => (
                  <div key={mem.id || memIdx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {/* Avatar */}
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: mem.photo_url ? `url(${resolveImg(mem.photo_url)}) center/cover` : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {!mem.photo_url && <User size={18} style={{ color: 'white' }} />}
                    </div>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <input value={mem.name} onChange={e => updateMember(secIdx, memIdx, 'name', e.target.value)} placeholder="Name" style={{ ...inputS, fontSize: '12px', fontWeight: 600 }} />
                      <input value={mem.designation} onChange={e => updateMember(secIdx, memIdx, 'designation', e.target.value)} placeholder="Designation" style={{ ...inputS, fontSize: '12px' }} />
                      <input value={mem.organization} onChange={e => updateMember(secIdx, memIdx, 'organization', e.target.value)} placeholder="Organization / Affiliation" style={{ ...inputS, fontSize: '12px', gridColumn: '1 / -1' }} />
                      <input value={mem.email} onChange={e => updateMember(secIdx, memIdx, 'email', e.target.value)} placeholder="Email" style={{ ...inputS, fontSize: '12px' }} />
                      <input value={mem.phone} onChange={e => updateMember(secIdx, memIdx, 'phone', e.target.value)} placeholder="Phone" style={{ ...inputS, fontSize: '12px' }} />
                    </div>
                    <button onClick={() => removeMember(secIdx, memIdx)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', flexShrink: 0 }} title="Remove"><X size={12} /></button>
                  </div>
                ))}
              </div>

              {/* Add member controls */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => addManualMember(secIdx)} style={{ background: '#f0fdf4', color: '#1e7a4d', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={12} /> Add Manually
                </button>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <input value={activeSection === secIdx ? searchQuery : ''} placeholder="Search existing member to link..."
                    onFocus={() => setActiveSection(secIdx)}
                    onChange={e => { setActiveSection(secIdx); searchMembers(e.target.value); }}
                    style={{ ...inputS, fontSize: '12px', paddingLeft: '30px' }} data-testid={`search-member-${secIdx}`} />
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }} />
                  {activeSection === secIdx && searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflow: 'auto' }}>
                      {searchResults.map(m => (
                        <button key={m.id} onClick={() => addMemberToSection(secIdx, m)} style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <User size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                          <div><div style={{ fontWeight: 600, color: '#111827' }}>{m.name}</div><div style={{ color: '#9ca3af', fontSize: '11px' }}>{m.organization}</div></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
