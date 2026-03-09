import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

const initForm = { name: '', designation: '', profile: '', photo_url: '', email: '', phone: '', order: 0 };

export default function ExecutiveAdmin() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(initForm);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => { axios.get(`${API}/admin/executive`).then(r => { setMembers(r.data); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(initForm); setShowModal(true); };
  const openEdit = (m) => {
    setEditItem(m);
    setForm({ name: m.name, designation: m.designation, profile: m.profile || '', photo_url: m.photo_url || '', email: m.email || '', phone: m.phone || '', order: m.order || 0 });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, order: parseInt(form.order) || 0 };
      if (editItem) await axios.put(`${API}/admin/executive/${editItem.id}`, payload);
      else await axios.post(`${API}/admin/executive`, payload);
      showToast('Saved!'); setShowModal(false); load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this committee member?')) return;
    await axios.delete(`${API}/admin/executive/${id}`);
    showToast('Removed'); load();
  };

  return (
    <div>
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Executive Committee</h1>
        <button onClick={openAdd} className="btn-primary" data-testid="add-executive-btn"><Plus size={16} /> Add Member</button>
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {members.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', color: '#9ca3af', padding: '60px' }}>No committee members yet.</div>
          ) : members.map(m => (
            <div key={m.id} className="admin-card" data-testid="executive-card">
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#0c3c60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', fontFamily: 'Poppins', flexShrink: 0 }}>
                    {m.name?.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{m.name}</h3>
                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins' }}>{m.designation}</span>
                  {m.profile && <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0', lineHeight: 1.5 }}>{m.profile}</p>}
                  {m.email && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{m.email}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', marginRight: 'auto' }}>Order: {m.order}</span>
                <button onClick={() => openEdit(m)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }}><Edit size={13} /> Edit</button>
                <button onClick={() => handleDelete(m.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }}><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{editItem ? 'Edit Member' : 'Add Committee Member'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group"><label className="form-label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" required /></div>
              <div className="form-group"><label className="form-label">Designation *</label><input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="form-input" placeholder="e.g. President, Vice President" required /></div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="form-input" /></div>
              <div className="form-group"><label className="form-label">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="form-input" /></div>
              <div className="form-group"><label className="form-label">Display Order</label><input type="number" value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} className="form-input" /></div>
              <div className="form-group"><label className="form-label">Photo URL</label><input type="url" value={form.photo_url} onChange={e => setForm({ ...form, photo_url: e.target.value })} className="form-input" /></div>
            </div>
            <div className="form-group"><label className="form-label">Profile / Bio</label><textarea value={form.profile} onChange={e => setForm({ ...form, profile: e.target.value })} className="form-textarea" rows={3} /></div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-executive-btn">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
