import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

const initForm = { title: '', content: '', category: 'general', image_url: '', published_date: new Date().toISOString().split('T')[0], status: 'published' };
const CATEGORIES = ['general', 'scientific', 'conference', 'industry'];

export default function NewsAdmin() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(initForm);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => { axios.get(`${API}/admin/news`).then(r => { setNews(r.data); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(initForm); setShowModal(true); };
  const openEdit = (n) => { setEditItem(n); setForm({ title: n.title, content: n.content, category: n.category, image_url: n.image_url || '', published_date: n.published_date, status: n.status }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editItem) await axios.put(`${API}/admin/news/${editItem.id}`, form);
      else await axios.post(`${API}/admin/news`, form);
      showToast('Saved!'); setShowModal(false); load();
    } catch (e) { showToast('Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this news?')) return;
    await axios.delete(`${API}/admin/news/${id}`);
    showToast('Deleted'); load();
  };

  const CAT_COLORS = { general: '#dbeafe', scientific: '#ede9fe', conference: '#d1fae5', industry: '#fef3c7' };
  const CAT_TEXT = { general: '#1e40af', scientific: '#5b21b6', conference: '#065f46', industry: '#92400e' };

  return (
    <div>
      {toast && <div className="toast-success">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">News & Announcements</h1>
        <button onClick={openAdd} className="btn-primary" data-testid="add-news-btn"><Plus size={16} /> Add News</button>
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {news.length === 0 ? <div className="admin-card" style={{ textAlign: 'center', color: '#9ca3af' }}>No news yet.</div> :
            news.map(n => (
              <div key={n.id} className="admin-card" data-testid="news-row">
                {n.image_url && <img src={n.image_url} alt="" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '12px' }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ background: CAT_COLORS[n.category], color: CAT_TEXT[n.category], padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins' }}>{n.category?.toUpperCase()}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{n.published_date}</span>
                </div>
                <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '8px', lineHeight: 1.4 }}>{n.title}</h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.content}</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <span className={n.status === 'published' ? 'badge badge-approved' : 'badge badge-pending'}>{n.status}</span>
                  <button onClick={() => openEdit(n)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }}><Edit size={13} /> Edit</button>
                  <button onClick={() => handleDelete(n.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }}><Trash2 size={13} /> Delete</button>
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
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{editItem ? 'Edit News' : 'Add News'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div className="form-group"><label className="form-label">Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="form-input" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-select">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Published Date</label>
                <input type="date" value={form.published_date} onChange={e => setForm({ ...form, published_date: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="form-select">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Image URL</label><input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="form-input" /></div>
            </div>
            <div className="form-group"><label className="form-label">Content *</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="form-textarea" rows={6} required /></div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-news-btn">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
