import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, Save, Eye, Bold, Italic, Heading1, Link2, List, Image, Code, Type, Palette, Search, FileText } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

const BACKEND = API.replace('/api', '');
const initForm = { title: '', content: '', category: 'general', image_url: '', published_date: new Date().toISOString().split('T')[0], status: 'published', meta_title: '', meta_description: '', meta_keywords: '' };
const CATEGORIES = ['general', 'scientific', 'conference', 'industry', 'academic', 'event', 'achievement'];

function RichToolbar({ textareaRef, value, onChange }) {
  const insert = (before, after = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = value.substring(s, e) || 'text';
    onChange(value.substring(0, s) + before + sel + after + value.substring(e));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); }, 50);
  };
  const insertAt = (text) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    onChange(value.substring(0, s) + text + value.substring(s));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + text.length, s + text.length); }, 50);
  };

  const btn = { background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' };
  const sep = { width: '1px', height: '24px', background: '#e2e8f0', margin: '0 3px' };

  return (
    <div data-testid="rich-toolbar" style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px 8px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none', alignItems: 'center' }}>
      <button type="button" onClick={() => insert('<strong>', '</strong>')} style={btn} title="Bold"><Bold size={14} /></button>
      <button type="button" onClick={() => insert('<em>', '</em>')} style={btn} title="Italic"><Italic size={14} /></button>
      <button type="button" onClick={() => insert('<h2 style="color:#0c3c60;font-size:20px;margin:16px 0 8px;">', '</h2>')} style={btn} title="Heading"><Heading1 size={14} /></button>
      <button type="button" onClick={() => insert('<h3 style="color:#1e7a4d;font-size:16px;margin:14px 0 6px;">', '</h3>')} style={btn} title="Subheading"><Type size={14} /></button>
      <div style={sep} />
      <button type="button" onClick={() => insert('<a href="URL" style="color:#2563eb;text-decoration:underline;">', '</a>')} style={btn} title="Link"><Link2 size={14} /></button>
      <button type="button" onClick={() => insertAt('<img src="IMAGE_URL" alt="" style="max-width:100%;border-radius:8px;margin:12px 0;" />')} style={btn} title="Image"><Image size={14} /></button>
      <button type="button" onClick={() => insertAt('<ul style="padding-left:20px;margin:12px 0;">\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>')} style={btn} title="List"><List size={14} /></button>
      <div style={sep} />
      <button type="button" onClick={() => insert('<span style="color:#1e7a4d;font-weight:600;">', '</span>')} style={btn} title="Green"><Palette size={14} /><span style={{ width: 8, height: 8, borderRadius: 2, background: '#1e7a4d', marginLeft: 3 }} /></button>
      <button type="button" onClick={() => insert('<span style="color:#dc2626;font-weight:600;">', '</span>')} style={btn} title="Red"><Palette size={14} /><span style={{ width: 8, height: 8, borderRadius: 2, background: '#dc2626', marginLeft: 3 }} /></button>
      <button type="button" onClick={() => insertAt('<blockquote style="border-left:4px solid #0c3c60;padding:12px 16px;margin:16px 0;background:#f0f9ff;border-radius:0 8px 8px 0;font-style:italic;color:#374151;">Quote text</blockquote>')} style={{ ...btn, fontSize: '11px', fontFamily: 'Poppins', gap: '3px' }}><Code size={12} /> Quote</button>
      <button type="button" onClick={() => insertAt('<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;">\n  <p>Highlight box content</p>\n</div>')} style={{ ...btn, fontSize: '11px', fontFamily: 'Poppins', gap: '3px' }}><FileText size={12} /> Box</button>
      <button type="button" onClick={() => insertAt('<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />')} style={{ ...btn, fontSize: '11px', fontFamily: 'Poppins' }}>HR</button>
    </div>
  );
}

export default function NewsAdmin() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(initForm);
  const [toast, setToast] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const bodyRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => { axios.get(`${API}/admin/news`).then(r => { setNews(r.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(initForm); setShowSeo(false); setShowModal(true); };
  const openEdit = (n) => {
    setEditItem(n);
    setForm({
      title: n.title, content: n.content, category: n.category, image_url: n.image_url || '',
      published_date: n.published_date, status: n.status,
      meta_title: n.meta_title || '', meta_description: n.meta_description || '', meta_keywords: n.meta_keywords || '',
    });
    setShowSeo(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Title is required'); return; }
    try {
      if (editItem) await axios.put(`${API}/admin/news/${editItem.id}`, form);
      else await axios.post(`${API}/admin/news`, form);
      showToast('Saved!'); setShowModal(false); load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement permanently?')) return;
    await axios.delete(`${API}/admin/news/${id}`);
    showToast('Deleted'); load();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await axios.post(`${API}/public/upload-photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ ...form, image_url: r.data.url });
      showToast('Image uploaded');
    } catch { showToast('Upload failed'); }
  };

  const resolveImg = (u) => u ? (u.startsWith('http') ? u : `${BACKEND}${u.startsWith('/') ? '' : '/'}${u}`) : '';

  const CAT_COLORS = { general: '#dbeafe', scientific: '#ede9fe', conference: '#d1fae5', industry: '#fef3c7', academic: '#d1fae5', event: '#fef3c7', achievement: '#fce7f3' };
  const CAT_TEXT = { general: '#1e40af', scientific: '#5b21b6', conference: '#065f46', industry: '#92400e', academic: '#065f46', event: '#92400e', achievement: '#831843' };
  const inputS = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' };

  return (
    <div data-testid="news-admin">
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Announcements</h1>
        <button onClick={openAdd} className="btn-primary" data-testid="add-news-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={16} /> Add Announcement</button>
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {news.length === 0 ? <div className="admin-card" style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>No announcements yet.</div> :
            news.map(n => (
              <div key={n.id} className="admin-card" data-testid="news-row" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px' }}>
                {n.image_url && <img src={resolveImg(n.image_url)} alt="" style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ background: CAT_COLORS[n.category] || '#f1f5f9', color: CAT_TEXT[n.category] || '#6b7280', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, fontFamily: 'Poppins' }}>{n.category?.toUpperCase()}</span>
                    <span className={n.status === 'published' ? 'badge badge-approved' : 'badge badge-pending'} style={{ fontSize: '10px' }}>{n.status}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{n.published_date}</span>
                    {n.meta_title && <span style={{ fontSize: '10px', color: '#1e7a4d', display: 'flex', alignItems: 'center', gap: '2px' }}><Search size={9} /> SEO</span>}
                  </div>
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.4 }}>{n.title}</h3>
                  <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.content?.replace(/<[^>]*>/g, '').slice(0, 120)}</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => openEdit(n)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'Poppins' }}><Edit size={12} /> Edit</button>
                  <button onClick={() => handleDelete(n.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'Poppins' }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '92vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>{editItem ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ ...inputS, fontSize: '16px', fontWeight: 600, fontFamily: 'Poppins' }} placeholder="Announcement title" data-testid="news-title" />
            </div>

            {/* Meta row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputS} data-testid="news-category">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Date</label>
                <input type="date" value={form.published_date} onChange={e => setForm({ ...form, published_date: e.target.value })} style={inputS} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputS}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Featured Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '11px', width: '100%' }} />
              </div>
            </div>

            {/* Image preview */}
            {form.image_url && (
              <div style={{ marginBottom: '14px', position: 'relative', display: 'inline-block' }}>
                <img src={resolveImg(form.image_url)} alt="" style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <button onClick={() => setForm({ ...form, image_url: '' })} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
              </div>
            )}

            {/* Content Editor */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Content (HTML)</label>
              <RichToolbar textareaRef={bodyRef} value={form.content} onChange={v => setForm({ ...form, content: v })} />
              <textarea
                ref={bodyRef}
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                style={{ ...inputS, minHeight: '250px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.6, borderRadius: '0 0 8px 8px', borderTop: 'none', resize: 'vertical' }}
                placeholder="Write your announcement content here... Use the toolbar above for formatting."
                data-testid="news-content"
              />
            </div>

            {/* SEO Section (collapsible) */}
            <div style={{ marginBottom: '14px' }}>
              <button onClick={() => setShowSeo(!showSeo)} style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'space-between' }} data-testid="toggle-seo">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Search size={13} /> SEO / Meta Data</span>
                <span>{showSeo ? '▲' : '▼'}</span>
              </button>
              {showSeo && (
                <div style={{ background: '#f8fafc', borderRadius: '0 0 8px 8px', padding: '14px', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Meta Title (for search engines)</label>
                    <input value={form.meta_title} onChange={e => setForm({ ...form, meta_title: e.target.value })} style={inputS} placeholder={form.title || 'Auto-uses announcement title'} data-testid="news-meta-title" />
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>{(form.meta_title || form.title || '').length}/60 chars</span>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Meta Description</label>
                    <textarea value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} style={{ ...inputS, minHeight: '60px' }} placeholder="Brief description for search results (auto-generated from content if empty)" data-testid="news-meta-desc" />
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>{(form.meta_description || '').length}/160 chars</span>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Meta Keywords (comma-separated)</label>
                    <input value={form.meta_keywords} onChange={e => setForm({ ...form, meta_keywords: e.target.value })} style={inputS} placeholder="dairy science, IDSEA, conference" data-testid="news-meta-keywords" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPreview(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> Preview</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-news-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Save size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PREVIEW MODAL ═══ */}
      {showPreview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Preview</h3>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '24px' }}>
              {form.image_url && <img src={resolveImg(form.image_url)} alt="" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '10px', marginBottom: '18px' }} />}
              <h1 style={{ fontFamily: 'Poppins', fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>{form.title || 'Untitled'}</h1>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>{form.published_date} | {form.category}</div>
              <div style={{ fontSize: '15px', color: '#374151', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: form.content }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
