import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, ExternalLink } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import { FileUpload } from '../../components/admin/FileUpload';

const initForm = { title: '', author: '', abstract: '', pdf_url: '', category: 'research', published_date: '' };

export default function PublicationsAdmin() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPub, setEditPub] = useState(null);
  const [form, setForm] = useState(initForm);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => { axios.get(`${API}/admin/publications`).then(r => { setPublications(r.data); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditPub(null); setForm(initForm); setShowModal(true); };
  const openEdit = (p) => { setEditPub(p); setForm({ title: p.title, author: p.author, abstract: p.abstract || '', pdf_url: p.pdf_url || '', category: p.category, published_date: p.published_date || '' }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editPub) await axios.put(`${API}/admin/publications/${editPub.id}`, form);
      else await axios.post(`${API}/admin/publications`, form);
      showToast('Publication saved!'); setShowModal(false); load();
    } catch { showToast('Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this publication?')) return;
    await axios.delete(`${API}/admin/publications/${id}`);
    showToast('Deleted'); load();
  };

  const CAT_LABELS = { research: 'Research', journal: 'Journal', article: 'Article', report: 'Report' };

  return (
    <div>
      {toast && <div className="toast-success">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Publications Management</h1>
        <button onClick={openAdd} className="btn-primary" data-testid="add-pub-btn"><Plus size={16} /> Add Publication</button>
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" data-testid="publications-table">
            <thead>
              <tr><th>Title</th><th>Author</th><th>Category</th><th>Date</th><th>PDF</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {publications.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No publications yet.</td></tr> :
                publications.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827', maxWidth: '240px' }}>{p.title}</div>
                      {p.abstract && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.abstract}</div>}
                    </td>
                    <td style={{ fontSize: '13px', color: '#1e7a4d', fontWeight: 600 }}>{p.author}</td>
                    <td><span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins' }}>{CAT_LABELS[p.category] || p.category}</span></td>
                    <td style={{ fontSize: '12px', color: '#9ca3af' }}>{p.published_date || '-'}</td>
                    <td>
                      {p.pdf_url ? <a href={p.pdf_url} target="_blank" rel="noreferrer" style={{ color: '#7c3aed', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><ExternalLink size={13} /> View</a> : <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEdit(p)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Edit size={14} /></button>
                        <button onClick={() => handleDelete(p.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{editPub ? 'Edit Publication' : 'Add Publication'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="form-group"><label className="form-label">Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="form-input" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group"><label className="form-label">Author *</label><input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="form-input" required /></div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-select">
                  {['research', 'journal', 'article', 'report'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Published Date</label><input type="date" value={form.published_date} onChange={e => setForm({ ...form, published_date: e.target.value })} className="form-input" /></div>
              <div className="form-group">
                <label className="form-label">PDF File</label>
                <FileUpload accept=".pdf" label="Upload PDF" onUpload={(url) => setForm({ ...form, pdf_url: url })} />
                <input type="url" value={form.pdf_url} onChange={e => setForm({ ...form, pdf_url: e.target.value })} className="form-input" placeholder="Or paste URL" style={{ marginTop: '6px' }} />
              </div>
            </div>
            <div className="form-group"><label className="form-label">Abstract</label><textarea value={form.abstract} onChange={e => setForm({ ...form, abstract: e.target.value })} className="form-textarea" rows={4} /></div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-pub-btn">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
