import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Edit, Eye, RotateCcw, X, Save, Code } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

export default function EmailTemplatesAdmin() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTemplate, setEditTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = () => {
    axios.get(`${API}/admin/email-templates`).then(r => { setTemplates(r.data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openEdit = (t) => {
    setEditTemplate({ key: t.key, name: t.name, subject: t.subject, body: t.body, description: t.description, variables: t.variables || [] });
  };

  const handleSave = async () => {
    if (!editTemplate) return;
    setSaving(true);
    try {
      await axios.put(`${API}/admin/email-templates/${editTemplate.key}`, editTemplate);
      showToast('Template saved!');
      setEditTemplate(null);
      load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
    setSaving(false);
  };

  const handleReset = async (key) => {
    if (!window.confirm('Reset this template to default? Your customizations will be lost.')) return;
    try {
      await axios.post(`${API}/admin/email-templates/${key}/reset`);
      showToast('Template reset to default');
      load();
    } catch (e) { showToast('Error resetting'); }
  };

  const handlePreview = async (key) => {
    try {
      const r = await axios.post(`${API}/admin/email-templates/${key}/preview`);
      setPreviewSubject(r.data.subject);
      setPreviewHtml(r.data.body);
      setShowPreview(true);
    } catch (e) { showToast('Error loading preview'); }
  };

  const TEMPLATE_ICONS = {
    registration_submitted: { color: '#d97706', bg: '#fef3c7', label: 'Registration' },
    membership_approved: { color: '#1e7a4d', bg: '#d1fae5', label: 'Approval' },
    event_notification: { color: '#0c3c60', bg: '#dbeafe', label: 'Event' },
    event_participation: { color: '#7c3aed', bg: '#ede9fe', label: 'Participation' },
  };

  if (loading) return <div className="loading-spinner">Loading templates...</div>;

  return (
    <div>
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Email Templates</h1>
      </div>

      <div className="admin-card" style={{ marginBottom: '20px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
        <p style={{ fontSize: '13px', color: '#0c3c60', margin: 0, lineHeight: 1.7, fontFamily: 'Inter' }}>
          <strong>How it works:</strong> These templates are used for automated emails. Edit the HTML body and subject line.
          Use <code style={{ background: '#dbeafe', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>{'{{variable_name}}'}</code> placeholders for dynamic content. Click "Preview" to see how it looks with sample data.
        </p>
      </div>

      {/* Template Cards */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {templates.map(t => {
          const ti = TEMPLATE_ICONS[t.key] || { color: '#6b7280', bg: '#f1f5f9', label: 'Custom' };
          return (
            <div key={t.key} className="admin-card" data-testid={`template-card-${t.key}`}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: ti.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={20} style={{ color: ti.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>{t.name}</h3>
                    <span style={{ background: ti.bg, color: ti.color, padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins' }}>{ti.label}</span>
                    {t.is_default && <span style={{ background: '#f1f5f9', color: '#6b7280', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600 }}>Default</span>}
                    {!t.is_default && <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600 }}>Customized</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 8px', fontFamily: 'Inter' }}>{t.description}</p>
                  <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'Inter' }}>
                    <strong>Subject:</strong> {t.subject}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                    <strong>Variables:</strong> {(t.variables || []).map(v => <code key={v} style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', marginRight: '4px', fontSize: '10px' }}>{`{{${v}}}`}</code>)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => handlePreview(t.key)} style={{ background: '#f1f5f9', color: '#374151', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }} data-testid={`preview-${t.key}`}>
                    <Eye size={13} /> Preview
                  </button>
                  <button onClick={() => openEdit(t)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }} data-testid={`edit-${t.key}`}>
                    <Edit size={13} /> Edit
                  </button>
                  {!t.is_default && (
                    <button onClick={() => handleReset(t.key)} style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }} data-testid={`reset-${t.key}`}>
                      <RotateCcw size={13} /> Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editTemplate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>
                Edit Template: {editTemplate.name}
              </h2>
              <button onClick={() => setEditTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#0c3c60', margin: 0 }}>
                <Code size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                <strong>Available variables:</strong> {editTemplate.variables?.map(v => (
                  <code key={v} style={{ background: '#dbeafe', padding: '1px 6px', borderRadius: '4px', marginLeft: '4px', fontSize: '11px', cursor: 'pointer' }}
                    onClick={() => { navigator.clipboard.writeText(`{{${v}}}`); showToast(`Copied {{${v}}}`); }}
                  >{`{{${v}}}`}</code>
                ))}
                <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '8px' }}>(click to copy)</span>
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Subject Line</label>
              <input value={editTemplate.subject} onChange={e => setEditTemplate({ ...editTemplate, subject: e.target.value })} className="form-input" data-testid="template-subject-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Body (HTML)</label>
              <textarea
                value={editTemplate.body}
                onChange={e => setEditTemplate({ ...editTemplate, body: e.target.value })}
                className="form-textarea"
                rows={18}
                style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.5 }}
                data-testid="template-body-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => handlePreview(editTemplate.key)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={14} /> Preview
              </button>
              <button onClick={() => setEditTemplate(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" disabled={saving} data-testid="save-template-btn">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflow: 'auto', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <h2 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Email Preview</h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Subject: {previewSubject}</p>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px', background: '#f1f5f9' }}>
              <div style={{ maxWidth: '600px', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                data-testid="template-preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
