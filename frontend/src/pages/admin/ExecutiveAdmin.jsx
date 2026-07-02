import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import { FileUpload } from '../../components/admin/FileUpload';

const TABS = [
  { key: 'founder', label: 'Patron / Founders' },
  { key: 'council', label: 'Executive Council' },
];

const DESIGNATIONS = {
  council: ['President', 'Vice President', 'General Secretary', 'Joint Secretary', 'Treasurer', 'Editor', 'EC Member'],
  founder: ['Patron / Founder'],
};

const SUB_DIVISIONS = {
  'Joint Secretary': ['Academic', 'Industry', 'ICT'],
  'Vice President': ['Academic', 'Industry'],
  'Treasurer': ['Academic', 'Industry'],
  'Editor': ['Journal', 'Newsletter'],
};

const FRONTEND_SECTIONS = [
  { value: 'office_bearers', label: 'Office Bearers (Card Display)' },
  { value: 'ec_members', label: 'EC Members (Table Display)' },
];

export default function ExecutiveAdmin() {
  const [tab, setTab] = useState('founder');
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [toast, setToast] = useState('');
  const [searchMember, setSearchMember] = useState('');

  const initForm = { member_id: '', name: '', designation: tab === 'founder' ? 'Patron / Founder' : '', sub_division: '', frontend_section: tab === 'founder' ? 'office_bearers' : 'office_bearers', affiliation: '', profile: '', photo_url: '', email: '', phone: '', category: tab, order: 0 };
  const [form, setForm] = useState(initForm);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = () => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/admin/executive`, { params: { category: tab } }),
      axios.get(`${API}/admin/members`, { params: { status: 'approved' } })
    ]).then(([exec, mems]) => {
      setItems(exec.data);
      setMembers(mems.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...initForm, category: tab, designation: tab === 'founder' ? 'Patron / Founder' : '', frontend_section: tab === 'founder' ? 'office_bearers' : 'office_bearers' });
    setSearchMember('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      member_id: item.member_id || '', name: item.name, designation: item.designation,
      sub_division: item.sub_division || '', frontend_section: item.frontend_section || 'office_bearers',
      affiliation: item.affiliation || '', profile: item.profile || '',
      photo_url: item.photo_url || '', email: item.email || '', phone: item.phone || '',
      category: item.category || tab, order: item.order || 0,
    });
    setSearchMember('');
    setShowModal(true);
  };

  const selectMember = (m) => {
    setForm(prev => ({
      ...prev, member_id: m.id, name: m.name, email: m.email || '',
      phone: m.phone || '', photo_url: m.photo_url || '', affiliation: m.organization || '',
    }));
    setSearchMember('');
  };

  const handleSave = async () => {
    if (!form.name) return showToast('Name is required');
    try {
      const payload = { ...form, order: parseInt(form.order) || 0 };
      if (editItem) await axios.put(`${API}/admin/executive/${editItem.id}`, payload);
      else await axios.post(`${API}/admin/executive`, payload);
      showToast('Saved!');
      setShowModal(false);
      load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this entry?')) return;
    await axios.delete(`${API}/admin/executive/${id}`);
    showToast('Removed');
    load();
  };

  const filteredMembers = members.filter(m =>
    (m.name?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.membership_id?.toLowerCase().includes(searchMember.toLowerCase())) &&
    searchMember.length > 0
  );

  const currentDesignations = DESIGNATIONS[tab] || [];
  const currentSubDivisions = SUB_DIVISIONS[form.designation] || [];

  return (
    <div>
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Executive Committee</h1>
        <button onClick={openAdd} className="btn-primary" data-testid="add-executive-btn">
          <Plus size={16} /> Add {tab === 'founder' ? 'Founder' : 'Council Member'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} data-testid={`tab-${t.key}`} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, fontFamily: 'Poppins',
            background: tab === t.key ? '#0c3c60' : 'transparent',
            color: tab === t.key ? 'white' : '#6b7280',
            transition: 'all 0.2s ease'
          }}>{t.label} ({tab === t.key ? items.length : '...'})</button>
        ))}
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" data-testid="executive-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Order</th>
                <th>Name</th>
                <th>Designation</th>
                {tab === 'council' && <th>Sub-Division</th>}
                <th>Affiliation</th>
                {tab === 'council' && <th>Frontend Section</th>}
                <th>Linked</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={tab === 'council' ? 8 : 6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No entries yet.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} data-testid="executive-row">
                  <td style={{ fontWeight: 700, color: '#0c3c60', fontFamily: 'Poppins', fontSize: '13px', textAlign: 'center' }}>{item.order}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.photo_url ? (
                        <img src={item.photo_url?.startsWith('/') ? `${window.location.origin}${item.photo_url}` : item.photo_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0c3c60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', fontFamily: 'Poppins', flexShrink: 0 }}>{item.name?.charAt(0)}</div>
                      )}
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{item.name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-academic">{item.designation}</span></td>
                  {tab === 'council' && <td style={{ fontSize: '12px', color: item.sub_division ? '#d97706' : '#d1d5db' }}>{item.sub_division || '-'}</td>}
                  <td style={{ fontSize: '12px', color: '#4b5563', maxWidth: '220px', lineHeight: 1.5 }}>{item.affiliation || '-'}</td>
                  {tab === 'council' && <td><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: item.frontend_section === 'ec_members' ? '#fef3c7' : '#d1fae5', color: item.frontend_section === 'ec_members' ? '#92400e' : '#065f46', fontWeight: 600 }}>{item.frontend_section === 'ec_members' ? 'EC Table' : 'Office Bearer'}</span></td>}
                  <td style={{ fontSize: '12px', color: item.member_id ? '#1e7a4d' : '#9ca3af' }}>{item.member_id ? 'Yes' : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => openEdit(item)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'Poppins' }}><Edit size={11} /> Edit</button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>
                {editItem ? 'Edit Entry' : `Add ${tab === 'founder' ? 'Patron / Founder' : 'Council Member'}`}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            {/* Member Search */}
            <div className="form-group">
              <label className="form-label">Link from Members (search name, email, or ID)</label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#9ca3af' }} />
                <input value={searchMember} onChange={e => setSearchMember(e.target.value)} className="form-input" style={{ paddingLeft: '32px' }} placeholder="Type to search approved members..." data-testid="search-member-input" />
                {filteredMembers.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto', zIndex: 10, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
                    {filteredMembers.slice(0, 8).map(m => (
                      <div key={m.id} onClick={() => selectMember(m)} data-testid="member-option" style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <div><div style={{ fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: '11px', color: '#6b7280' }}>{m.organization}</div></div>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{m.membership_id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {form.member_id && <div style={{ marginTop: '6px', background: '#d1fae5', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#065f46', fontWeight: 600 }}>Linked: {form.name}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" data-testid="exec-name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Designation *</label>
                <select value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value, sub_division: '' })} className="form-select" data-testid="exec-designation">
                  <option value="">-- Select --</option>
                  {currentDesignations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Sub-Division - only show if applicable */}
              {currentSubDivisions.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Sub-Division</label>
                  <select value={form.sub_division} onChange={e => setForm({ ...form, sub_division: e.target.value })} className="form-select" data-testid="exec-sub-division">
                    <option value="">None</option>
                    {currentSubDivisions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {/* Frontend Section - council only */}
              {tab === 'council' && (
                <div className="form-group">
                  <label className="form-label">Frontend Position</label>
                  <select value={form.frontend_section} onChange={e => setForm({ ...form, frontend_section: e.target.value })} className="form-select" data-testid="exec-frontend-section">
                    {FRONTEND_SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Affiliation / Organization</label>
                <input value={form.affiliation} onChange={e => setForm({ ...form, affiliation: e.target.value })} className="form-input" data-testid="exec-affiliation" />
              </div>

              <div className="form-group">
                <label className="form-label">Display Order</label>
                <input type="number" value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} className="form-input" data-testid="exec-order" />
              </div>
              <div className="form-group">
                <label className="form-label">Photo</label>
                <FileUpload accept="image/*" label="Upload Photo" onUpload={(url) => setForm(f => ({ ...f, photo_url: url }))} />
                {form.photo_url && (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={form.photo_url?.startsWith('/') ? `${window.location.origin}${form.photo_url}` : form.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setForm(f => ({ ...f, photo_url: '' }))} style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Profile / Bio</label>
              <textarea value={form.profile} onChange={e => setForm({ ...form, profile: e.target.value })} className="form-textarea" rows={2} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-executive-btn">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
