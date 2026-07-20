import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, GripVertical, Eye, EyeOff, Save, X, ArrowUp, ArrowDown } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SliderAdmin() {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ image_url: '', order: 0, is_active: true });

  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchSliders = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/sliders`, { headers });
      setSliders(res.data);
    } catch { showToast('Failed to load sliders'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSliders(); }, [fetchSliders]);

  const openAdd = () => {
    setEditing(null);
    setForm({ image_url: '', order: sliders.length, is_active: true });
    setShowModal(true);
  };

  const openEdit = (slider) => {
    setEditing(slider);
    setForm({ image_url: slider.image_url || '', order: slider.order || 0, is_active: slider.is_active !== false });
    setShowModal(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`${API}/upload`, fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, image_url: res.data.file_url }));
      showToast('Image uploaded');
    } catch { showToast('Upload failed'); }
    setUploading(false);
  };

  const resolveImg = (url) => url ? (url.startsWith('http') ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : '';

  const handleSave = async () => {
    if (!form.image_url) { showToast('Please upload an image'); return; }
    try {
      if (editing) {
        await axios.put(`${API}/admin/sliders/${editing.id}`, form, { headers });
        showToast('Slider updated');
      } else {
        await axios.post(`${API}/admin/sliders`, form, { headers });
        showToast('Slider added');
      }
      setShowModal(false);
      fetchSliders();
    } catch { showToast('Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slider?')) return;
    try {
      await axios.delete(`${API}/admin/sliders/${id}`, { headers });
      showToast('Slider deleted');
      fetchSliders();
    } catch { showToast('Delete failed'); }
  };

  const handleToggleActive = async (slider) => {
    try {
      await axios.put(`${API}/admin/sliders/${slider.id}`, { ...slider, is_active: !slider.is_active }, { headers });
      fetchSliders();
    } catch { showToast('Update failed'); }
  };

  const handleMove = async (index, direction) => {
    const newSliders = [...sliders];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newSliders.length) return;
    [newSliders[index], newSliders[swapIndex]] = [newSliders[swapIndex], newSliders[index]];
    const items = newSliders.map((s, i) => ({ id: s.id, order: i }));
    try {
      await axios.put(`${API}/admin/sliders/reorder`, { items }, { headers });
      fetchSliders();
    } catch { showToast('Reorder failed'); }
  };

  if (loading) return <div className="loading-spinner">Loading sliders...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title" data-testid="slider-admin-title">Slider Management</h2>
        <button className="btn-primary" onClick={openAdd} data-testid="add-slider-btn"><Plus size={16} /> Add Image</button>
      </div>

      {sliders.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <p style={{ color: '#6b7280', fontSize: '15px', fontFamily: 'Inter, sans-serif' }}>No slider images yet. Add your first homepage slider image.</p>
          <button className="btn-primary" onClick={openAdd} style={{ marginTop: '16px' }}><Plus size={16} /> Add Image</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {sliders.map((slider, idx) => (
            <div key={slider.id} className="admin-card" data-testid={`slider-item-${idx}`}
              style={{ padding: '0', overflow: 'hidden', opacity: slider.is_active ? 1 : 0.5, position: 'relative' }}>
              <div style={{ width: '100%', height: '160px', background: '#f1f5f9' }}>
                {slider.image_url && <img src={resolveImg(slider.image_url)} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} data-testid={`slider-up-${idx}`}
                    style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#d1d5db' : '#6b7280', padding: '2px' }}>
                    <ArrowUp size={14} />
                  </button>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'Poppins' }}>#{idx + 1}</span>
                  <button onClick={() => handleMove(idx, 1)} disabled={idx === sliders.length - 1} data-testid={`slider-down-${idx}`}
                    style={{ background: 'none', border: 'none', cursor: idx === sliders.length - 1 ? 'default' : 'pointer', color: idx === sliders.length - 1 ? '#d1d5db' : '#6b7280', padding: '2px' }}>
                    <ArrowDown size={14} />
                  </button>
                  <span className={`badge ${slider.is_active ? 'badge-approved' : 'badge-rejected'}`} style={{ fontSize: '10px' }}>{slider.is_active ? 'Active' : 'Off'}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleToggleActive(slider)} data-testid={`slider-toggle-${idx}`}
                    style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: slider.is_active ? '#1e7a4d' : '#9ca3af' }}>
                    {slider.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => openEdit(slider)} data-testid={`slider-edit-${idx}`}
                    style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: '#0c3c60' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(slider.id)} data-testid={`slider-delete-${idx}`}
                    style={{ background: 'none', border: '1px solid #fee2e2', borderRadius: '6px', padding: '5px', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} data-testid="slider-modal" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', color: '#0c3c60', fontSize: '18px' }}>{editing ? 'Change Image' : 'Add Slider Image'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Slider Image *</label>
              {form.image_url && (
                <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={resolveImg(form.image_url)} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleUpload} data-testid="slider-image-input"
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
              {uploading && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Uploading...</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Or paste image URL</label>
              <input className="form-input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..." data-testid="slider-image-url-input" />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Poppins', fontSize: '14px', color: '#374151' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  data-testid="slider-active-checkbox" style={{ width: '16px', height: '16px' }} />
                Active
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} data-testid="slider-save-btn">
                <Save size={16} /> {editing ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-success">{toast}</div>}
    </div>
  );
}
