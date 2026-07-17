import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Edit, Eye, RotateCcw, Save, Loader2, Image, FileText, Trash2, ToggleLeft, ToggleRight, Variable, Copy, Upload, X } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const TYPE_COLORS = {
  membership_submitted: { color: '#d97706', bg: '#fef3c7', label: 'Registration' },
  membership_approved: { color: '#1e7a4d', bg: '#d1fae5', label: 'Approval' },
  membership_denied: { color: '#dc2626', bg: '#fef2f2', label: 'Rejection' },
  event_registered: { color: '#0c3c60', bg: '#dbeafe', label: 'Event Reg' },
  room_allotment: { color: '#7c3aed', bg: '#ede9fe', label: 'Room' },
  payment_received: { color: '#059669', bg: '#d1fae5', label: 'Payment' },
  payment_reminder: { color: '#ea580c', bg: '#fff7ed', label: 'Reminder' },
  event_invite: { color: '#2563eb', bg: '#eff6ff', label: 'Event Invite' },
  event_certificate: { color: '#7c3aed', bg: '#f5f3ff', label: 'Event Cert' },
  membership_renewal: { color: '#b45309', bg: '#fef3c7', label: 'Renewal' },
  event_payment_confirmed: { color: '#16a34a', bg: '#f0fdf4', label: 'Event Pay' },
  certificate_issued: { color: '#0369a1', bg: '#e0f2fe', label: 'Certificate' },
  custom_message: { color: '#6b7280', bg: '#f3f4f6', label: 'Custom' },
};

export default function WhatsappTemplatesAdmin() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTemplate, setEditTemplate] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef(null);
  const pdfRef = useRef(null);

  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchTemplates = async () => {
    try {
      const r = await axios.get(`${API}/admin/whatsapp-templates`, { headers });
      setTemplates(r.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openEdit = (t) => {
    setEditTemplate({ ...t });
    setPreview(null);
  };

  const saveTemplate = async () => {
    if (!editTemplate) return;
    setSaving(true);
    try {
      await axios.put(`${API}/admin/whatsapp-templates/${editTemplate.key}`, editTemplate, { headers });
      showToast('Template saved!');
      fetchTemplates();
    } catch { showToast('Save failed'); }
    setSaving(false);
  };

  const resetTemplate = async (key) => {
    if (!window.confirm('Reset this template to default? Your customizations will be lost.')) return;
    try {
      await axios.post(`${API}/admin/whatsapp-templates/${key}/reset`, {}, { headers });
      showToast('Template reset to default');
      setEditTemplate(null);
      fetchTemplates();
    } catch { showToast('Reset failed'); }
  };

  const loadPreview = async (key) => {
    try {
      const r = await axios.post(`${API}/admin/whatsapp-templates/${key}/preview`, {}, { headers });
      setPreview(r.data);
    } catch { showToast('Preview failed'); }
  };

  const handleAttachmentUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const ep = type === 'image' ? 'upload-photo' : 'upload-pdf';
      const r = await axios.post(`${API}/public/${ep}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = r.data.file_url;
      const fullUrl = url.startsWith('http') ? url : `${BACKEND}${url.startsWith('/') ? '' : '/'}${url}`;
      setEditTemplate(t => ({ ...t, attachment_url: fullUrl, attachment_type: type }));
      showToast(`${type === 'image' ? 'Image' : 'Document'} attached`);
    } catch { showToast('Upload failed'); }
    setUploading(false);
    if (imgRef.current) imgRef.current.value = '';
    if (pdfRef.current) pdfRef.current.value = '';
  };

  const copyVariable = (v) => {
    navigator.clipboard.writeText(`{${v}}`);
    showToast(`Copied {${v}}`);
  };

  const cardS = { background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' };
  const inputS = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', background: '#fff' };
  const labelS = { fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}><Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 10px' }} /> Loading...</div>;

  return (
    <div data-testid="wa-templates-admin">
      {toast && (
        <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 200, padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: '#065f46' }} data-testid="wa-toast">
          {toast}
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title" data-testid="page-title">WhatsApp Message Templates</h1>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Customize auto-notification messages with optional attachments</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editTemplate ? '340px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
        {/* Template List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {templates.map(t => {
            const meta = TYPE_COLORS[t.key] || { color: '#6b7280', bg: '#f3f4f6', label: t.key };
            const isActive = editTemplate?.key === t.key;
            return (
              <div key={t.key} data-testid={`wa-tpl-${t.key}`}
                onClick={() => openEdit(t)}
                style={{
                  ...cardS, padding: '14px 16px', cursor: 'pointer',
                  border: `1px solid ${isActive ? '#0c3c60' : '#e5e7eb'}`,
                  background: isActive ? '#f0f9ff' : 'white',
                  transition: 'all 0.15s ease',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#111', fontFamily: 'Poppins' }}>{t.name}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: meta.bg, color: meta.color }}>{meta.label}</span>
                </div>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>{t.description}</p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                  {t.enabled !== false ? (
                    <span style={{ fontSize: '10px', color: '#065f46', fontWeight: 600 }}>Active</span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600 }}>Disabled</span>
                  )}
                  {t.attachment_url && (
                    <span style={{ fontSize: '10px', color: '#1e40af', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {t.attachment_type === 'image' ? <Image size={10} /> : <FileText size={10} />}
                      + Attachment
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Editor Panel */}
        {editTemplate && (
          <div style={cardS}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={16} /> {editTemplate.name}
              </h3>
              <button onClick={() => setEditTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>
            </div>

            {/* Enable/Disable */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', cursor: 'pointer', padding: '10px 14px', background: editTemplate.enabled !== false ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${editTemplate.enabled !== false ? '#bbf7d0' : '#fecaca'}` }}
              onClick={() => setEditTemplate(t => ({ ...t, enabled: !(t.enabled !== false) }))}>
              {editTemplate.enabled !== false ? <ToggleRight size={24} color="#22c55e" /> : <ToggleLeft size={24} color="#dc2626" />}
              <span style={{ fontSize: '13px', fontWeight: 600, color: editTemplate.enabled !== false ? '#065f46' : '#dc2626' }}>
                {editTemplate.enabled !== false ? 'Template Enabled' : 'Template Disabled'}
              </span>
            </div>

            {/* Variables */}
            {editTemplate.variables?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelS}><Variable size={12} style={{ display: 'inline', marginRight: '4px' }} />Available Variables (click to copy)</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {editTemplate.variables.map(v => (
                    <button key={v} onClick={() => copyVariable(v)} data-testid={`var-${v}`}
                      style={{ padding: '4px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace', color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Copy size={10} /> {`{${v}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Editor */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelS}>Message Template</label>
              <textarea
                value={editTemplate.message}
                onChange={e => setEditTemplate(t => ({ ...t, message: e.target.value }))}
                style={{ ...inputS, minHeight: '200px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.7 }}
                placeholder="Hello {name},&#10;&#10;Your message here...&#10;&#10;Regards,&#10;IDSEA Team"
                data-testid="wa-tpl-message"
              />
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                Use *text* for bold in WhatsApp. Variables like {'{name}'} will be replaced with actual values.
              </div>
            </div>

            {/* Attachment */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelS}><Upload size={12} style={{ display: 'inline', marginRight: '4px' }} />Attachment (optional)</label>
              {editTemplate.attachment_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#d1fae5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  {editTemplate.attachment_type === 'image' ? <Image size={18} style={{ color: '#065f46' }} /> : <FileText size={18} style={{ color: '#065f46' }} />}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#065f46' }}>
                      {editTemplate.attachment_type === 'image' ? 'Image' : 'PDF Document'} attached
                    </span>
                    <span style={{ display: 'block', fontSize: '10px', color: '#6b7280', wordBreak: 'break-all' }}>{editTemplate.attachment_url.split('/').pop()}</span>
                  </div>
                  <button onClick={() => setEditTemplate(t => ({ ...t, attachment_url: '', attachment_type: '' }))}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} data-testid="remove-attachment">
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', cursor: uploading ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />} Attach Image
                    <input ref={imgRef} type="file" accept="image/*" onChange={e => handleAttachmentUpload(e, 'image')} style={{ display: 'none' }} data-testid="wa-tpl-img-upload" />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', cursor: uploading ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#92400e' }}>
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Attach PDF
                    <input ref={pdfRef} type="file" accept=".pdf" onChange={e => handleAttachmentUpload(e, 'document')} style={{ display: 'none' }} data-testid="wa-tpl-pdf-upload" />
                  </label>
                </div>
              )}
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>
                Attachment will be sent along with every notification of this type (image or PDF).
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div style={{ marginBottom: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', marginBottom: '8px' }}>Message Preview (sample data)</div>
                <div style={{ fontSize: '13px', color: '#111', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
                  {preview.preview}
                </div>
                {preview.attachment_url && (
                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: 'rgba(255,255,255,0.6)', borderRadius: '6px' }}>
                    {preview.attachment_type === 'image' ? <Image size={14} /> : <FileText size={14} />}
                    + {preview.attachment_type === 'image' ? 'Image' : 'PDF Document'} will be sent
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={saveTemplate} disabled={saving} className="btn-primary" data-testid="wa-tpl-save">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Template
              </button>
              <button onClick={() => loadPreview(editTemplate.key)} className="btn-secondary" data-testid="wa-tpl-preview">
                <Eye size={14} /> Preview
              </button>
              <button onClick={() => resetTemplate(editTemplate.key)}
                style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                data-testid="wa-tpl-reset">
                <RotateCcw size={14} /> Reset to Default
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!editTemplate && (
          <div style={{ ...cardS, textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <MessageSquare size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>Select a template to edit</p>
            <p style={{ fontSize: '12px', margin: 0 }}>Click any template on the left to customize its message and add attachments</p>
          </div>
        )}
      </div>
    </div>
  );
}
