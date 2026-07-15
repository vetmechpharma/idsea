import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FileText, Edit, Eye, RotateCcw, X, Save, Code, Plus, Trash2, Send, Clock, CheckCircle, AlertCircle, RefreshCw, Mail, Settings, BarChart3, Bold, Italic, Heading1, Link2, List, Image, Type, Palette, Variable, Copy } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

const TEMPLATE_ICONS = {
  registration_submitted: { color: '#d97706', bg: '#fef3c7', label: 'Registration' },
  membership_approved: { color: '#1e7a4d', bg: '#d1fae5', label: 'Approval' },
  membership_rejected: { color: '#dc2626', bg: '#fef2f2', label: 'Rejection' },
  event_notification: { color: '#0c3c60', bg: '#dbeafe', label: 'Event' },
  event_participation: { color: '#7c3aed', bg: '#ede9fe', label: 'Participation' },
  event_registration_confirmed: { color: '#059669', bg: '#d1fae5', label: 'Reg. Confirm' },
  certificate_issued: { color: '#2563eb', bg: '#dbeafe', label: 'Certificate' },
};

function RichTextToolbar({ textareaRef, value, onChange }) {
  const insertTag = (before, after = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end) || 'text';
    const newVal = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + before.length, start + before.length + selected.length); }, 50);
  };

  const insertAtCursor = (text) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const newVal = value.substring(0, start) + text + value.substring(start);
    onChange(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + text.length, start + text.length); }, 50);
  };

  const btnS = { background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '12px' };
  const sepS = { width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' };

  return (
    <div data-testid="rich-text-toolbar" style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px 8px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none', alignItems: 'center' }}>
      <button type="button" onClick={() => insertTag('<strong>', '</strong>')} style={btnS} title="Bold"><Bold size={14} /></button>
      <button type="button" onClick={() => insertTag('<em>', '</em>')} style={btnS} title="Italic"><Italic size={14} /></button>
      <button type="button" onClick={() => insertTag('<h2 style="color: #0c3c60; font-size: 20px; margin: 0 0 12px;">', '</h2>')} style={btnS} title="Heading"><Heading1 size={14} /></button>
      <div style={sepS} />
      <button type="button" onClick={() => insertTag('<a href="URL" style="color: #2563eb; text-decoration: underline;">', '</a>')} style={btnS} title="Link"><Link2 size={14} /></button>
      <button type="button" onClick={() => insertAtCursor('<img src="IMAGE_URL" alt="" style="max-width: 100%; border-radius: 8px;" />')} style={btnS} title="Image"><Image size={14} /></button>
      <button type="button" onClick={() => insertAtCursor('<ul style="padding-left: 20px; margin: 12px 0;">\n  <li style="margin-bottom: 6px;">Item 1</li>\n  <li style="margin-bottom: 6px;">Item 2</li>\n</ul>')} style={btnS} title="List"><List size={14} /></button>
      <div style={sepS} />
      <button type="button" onClick={() => insertTag('<span style="color: #1e7a4d; font-weight: 600;">', '</span>')} style={btnS} title="Green Text"><Palette size={14} /><span style={{ width: 8, height: 8, borderRadius: 2, background: '#1e7a4d', marginLeft: 3 }} /></button>
      <button type="button" onClick={() => insertTag('<span style="color: #dc2626; font-weight: 600;">', '</span>')} style={btnS} title="Red Text"><Palette size={14} /><span style={{ width: 8, height: 8, borderRadius: 2, background: '#dc2626', marginLeft: 3 }} /></button>
      <button type="button" onClick={() => insertTag('<span style="background: #dbeafe; color: #1e40af; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600;">', '</span>')} style={btnS} title="Badge"><Type size={14} /></button>
      <div style={sepS} />
      <button type="button" onClick={() => insertAtCursor('<div style="background: #f0f9ff; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #0c3c60;">\n  <p>Your content here</p>\n</div>')} style={{ ...btnS, fontSize: '11px', fontFamily: 'Poppins', gap: '4px' }}>
        <Code size={12} /> Info Box
      </button>
      <button type="button" onClick={() => insertAtCursor('<table style="width: 100%; font-size: 13px; color: #374151;">\n  <tr><td style="padding: 6px 0; color: #6b7280; width: 40%;">Label</td><td style="padding: 6px 0; font-weight: 600;">Value</td></tr>\n</table>')} style={{ ...btnS, fontSize: '11px', fontFamily: 'Poppins', gap: '4px' }}>
        <BarChart3 size={12} /> Table
      </button>
      <button type="button" onClick={() => insertAtCursor('<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />')} style={{ ...btnS, fontSize: '11px', fontFamily: 'Poppins' }}>
        HR
      </button>
    </div>
  );
}

export default function EmailTemplatesAdmin() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTemplate, setEditTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ key: '', name: '', subject: '', description: '', variables: '' });
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [queue, setQueue] = useState([]);
  const [queueStats, setQueueStats] = useState({});
  const [emailLogs, setEmailLogs] = useState([]);
  const [showCampaign, setShowCampaign] = useState(false);
  const [campaign, setCampaign] = useState({ template_key: '', recipient_group: 'all_members', campaign_name: '' });
  const bodyRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = () => {
    axios.get(`${API}/admin/email-templates`).then(r => { setTemplates(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const loadQueue = () => {
    axios.get(`${API}/admin/email-queue?limit=50`).then(r => setQueue(r.data)).catch(() => {});
    axios.get(`${API}/admin/email-queue/stats`).then(r => setQueueStats(r.data)).catch(() => {});
  };

  const loadLogs = () => {
    axios.get(`${API}/admin/email/logs`).then(r => setEmailLogs(r.data)).catch(() => {});
  };

  useEffect(() => { load(); loadQueue(); loadLogs(); }, []);

  const openEdit = (t) => {
    setEditTemplate({ key: t.key, name: t.name, subject: t.subject, body: t.body, description: t.description, variables: t.variables || [], is_custom: t.is_custom });
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

  const handleCreate = async () => {
    if (!newTemplate.key || !newTemplate.name || !newTemplate.subject) {
      showToast('Key, name, and subject are required'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...newTemplate,
        variables: newTemplate.variables ? newTemplate.variables.split(',').map(v => v.trim()).filter(Boolean) : []
      };
      await axios.post(`${API}/admin/email-templates`, payload);
      showToast('Template created!');
      setShowCreate(false);
      setNewTemplate({ key: '', name: '', subject: '', description: '', variables: '' });
      load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
    setSaving(false);
  };

  const handleDelete = async (key) => {
    if (!window.confirm('Delete this custom template permanently?')) return;
    try {
      await axios.delete(`${API}/admin/email-templates/${key}`);
      showToast('Template deleted');
      load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
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

  const handleRetry = async (id) => {
    try {
      await axios.post(`${API}/admin/email-queue/${id}/retry`);
      showToast('Email re-queued');
      loadQueue();
    } catch (e) { showToast('Error retrying'); }
  };

  const handleRetryAll = async () => {
    try {
      const r = await axios.post(`${API}/admin/email-queue/retry-all-failed`);
      showToast(r.data.message);
      loadQueue();
    } catch (e) { showToast('Error'); }
  };

  const handleClearSent = async () => {
    if (!window.confirm('Clear all sent emails from the queue?')) return;
    try {
      const r = await axios.delete(`${API}/admin/email-queue/clear-sent`);
      showToast(r.data.message);
      loadQueue();
    } catch (e) { showToast('Error'); }
  };

  const handleSendCampaign = async () => {
    if (!campaign.template_key || !campaign.campaign_name) {
      showToast('Select a template and enter campaign name'); return;
    }
    setSaving(true);
    try {
      const r = await axios.post(`${API}/admin/email-campaign/send`, campaign);
      showToast(r.data.message);
      setShowCampaign(false);
      setCampaign({ template_key: '', recipient_group: 'all_members', campaign_name: '' });
      loadQueue();
      loadLogs();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
    setSaving(false);
  };

  const tabS = (active) => ({
    padding: '10px 20px', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    fontFamily: 'Poppins', border: 'none', borderBottom: active ? '3px solid #0c3c60' : '3px solid transparent',
    background: active ? 'white' : 'transparent', color: active ? '#0c3c60' : '#6b7280',
    display: 'flex', alignItems: 'center', gap: '6px'
  });

  const inputS = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', fontFamily: 'Inter', boxSizing: 'border-box' };
  const labelS = { fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '5px', display: 'block', fontFamily: 'Poppins' };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div data-testid="email-templates-admin">
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}

      <div className="page-header">
        <h1 className="page-title">Email Management</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowCampaign(true)} className="btn-secondary" data-testid="send-campaign-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Send size={14} /> Send Campaign
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary" data-testid="create-template-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={14} /> Create Template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
        <button style={tabS(activeTab === 'templates')} onClick={() => setActiveTab('templates')} data-testid="tab-templates">
          <FileText size={14} /> Templates ({templates.length})
        </button>
        <button style={tabS(activeTab === 'queue')} onClick={() => { setActiveTab('queue'); loadQueue(); }} data-testid="tab-queue">
          <Clock size={14} /> Queue {queueStats.pending ? `(${queueStats.pending})` : ''}
        </button>
        <button style={tabS(activeTab === 'logs')} onClick={() => { setActiveTab('logs'); loadLogs(); }} data-testid="tab-logs">
          <Mail size={14} /> Email Logs
        </button>
      </div>

      {/* ═══ TEMPLATES TAB ═══ */}
      {activeTab === 'templates' && (
        <div>
          <div className="admin-card" style={{ marginBottom: '16px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <p style={{ fontSize: '13px', color: '#0c3c60', margin: 0, lineHeight: 1.7, fontFamily: 'Inter' }}>
              <strong>How it works:</strong> These templates are used for automated emails. Edit HTML body and subject.
              Use <code style={{ background: '#dbeafe', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>{'{{variable_name}}'}</code> for dynamic content. Emails are queued and sent in batches of <strong>{queueStats.batch_size || 50}</strong> every <strong>{queueStats.batch_interval_mins || 5} minutes</strong>.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {templates.map(t => {
              const ti = TEMPLATE_ICONS[t.key] || { color: '#6b7280', bg: '#f1f5f9', label: 'Custom' };
              return (
                <div key={t.key} className="admin-card" data-testid={`template-card-${t.key}`}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: ti.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={18} style={{ color: ti.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>{t.name}</h3>
                        <span style={{ background: ti.bg, color: ti.color, padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, fontFamily: 'Poppins' }}>{ti.label}</span>
                        {t.is_custom && <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600 }}>Custom</span>}
                        {t.is_default && !t.is_custom && <span style={{ background: '#f1f5f9', color: '#6b7280', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600 }}>Default</span>}
                        {!t.is_default && !t.is_custom && <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600 }}>Modified</span>}
                      </div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 6px', fontFamily: 'Inter' }}>{t.description}</p>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}><strong>Subject:</strong> {t.subject}</div>
                      {(t.variables || []).length > 0 && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          <strong>Variables:</strong> {t.variables.map(v => <code key={v} style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', marginRight: '3px', fontSize: '10px' }}>{`{{${v}}}`}</code>)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button onClick={() => handlePreview(t.key)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} data-testid={`preview-${t.key}`}>
                        <Eye size={12} /> Preview
                      </button>
                      <button onClick={() => openEdit(t)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }} data-testid={`edit-${t.key}`}>
                        <Edit size={12} /> Edit
                      </button>
                      {!t.is_default && !t.is_custom && (
                        <button onClick={() => handleReset(t.key)} style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }} data-testid={`reset-${t.key}`}>
                          <RotateCcw size={12} /> Reset
                        </button>
                      )}
                      {t.is_custom && (
                        <button onClick={() => handleDelete(t.key)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }} data-testid={`delete-${t.key}`}>
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ QUEUE TAB ═══ */}
      {activeTab === 'queue' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Pending', value: queueStats.pending || 0, color: '#d97706', bg: '#fef3c7', icon: Clock },
              { label: 'Sent', value: queueStats.sent || 0, color: '#1e7a4d', bg: '#d1fae5', icon: CheckCircle },
              { label: 'Failed', value: queueStats.failed || 0, color: '#dc2626', bg: '#fef2f2', icon: AlertCircle },
              { label: 'Processing', value: queueStats.processing || 0, color: '#2563eb', bg: '#dbeafe', icon: RefreshCw },
            ].map(s => (
              <div key={s.label} className="admin-card" style={{ textAlign: 'center', padding: '16px' }} data-testid={`queue-stat-${s.label.toLowerCase()}`}>
                <s.icon size={20} style={{ color: s.color, marginBottom: '6px' }} />
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'Poppins' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'Poppins' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="admin-card" style={{ marginBottom: '12px', background: '#f8fafc', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Inter' }}>
                Scheduler: <strong style={{ color: queueStats.scheduler_running ? '#1e7a4d' : '#dc2626' }}>{queueStats.scheduler_running ? 'Running' : 'Stopped'}</strong>
                {' | '}Batch: <strong>{queueStats.batch_size || 50}</strong> emails / <strong>{queueStats.batch_interval_mins || 5}</strong> min
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={handleRetryAll} className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }} data-testid="retry-all-btn">
                  <RefreshCw size={12} /> Retry All Failed
                </button>
                <button onClick={handleClearSent} className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }} data-testid="clear-sent-btn">
                  <Trash2 size={12} /> Clear Sent
                </button>
                <button onClick={loadQueue} className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }} data-testid="refresh-queue-btn">
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <Mail size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', margin: 0 }}>Email queue is empty</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {queue.map(q => (
                <div key={q.id} className="admin-card" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: q.status === 'sent' ? '#1e7a4d' : q.status === 'failed' ? '#dc2626' : q.status === 'processing' ? '#2563eb' : '#d97706', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: 'Poppins', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.recipient_name || q.recipient_email}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.subject}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', fontFamily: 'Poppins',
                        background: q.status === 'sent' ? '#d1fae5' : q.status === 'failed' ? '#fef2f2' : q.status === 'processing' ? '#dbeafe' : '#fef3c7',
                        color: q.status === 'sent' ? '#065f46' : q.status === 'failed' ? '#991b1b' : q.status === 'processing' ? '#1e40af' : '#92400e',
                      }}>{q.status}</span>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{q.created_at?.slice(0, 16)?.replace('T', ' ')}</div>
                    </div>
                    {q.status === 'failed' && (
                      <button onClick={() => handleRetry(q.id)} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }} data-testid={`retry-${q.id}`}>
                        <RefreshCw size={10} />
                      </button>
                    )}
                  </div>
                  {q.error && <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px', padding: '6px 8px', background: '#fef2f2', borderRadius: '6px' }}>{q.error}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ LOGS TAB ═══ */}
      {activeTab === 'logs' && (
        <div>
          {emailLogs.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <Mail size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', margin: 0 }}>No email logs yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {emailLogs.map((log, i) => (
                <div key={log.id || i} className="admin-card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', fontFamily: 'Poppins' }}>{log.subject}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        Recipients: <strong>{log.recipients_count || 0}</strong>
                        {log.recipient_group && <span> | Group: {log.recipient_group}</span>}
                        {log.sent_by && <span> | By: {log.sent_by}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase',
                        background: log.status === 'sent' ? '#d1fae5' : log.status === 'queued' ? '#fef3c7' : '#fef2f2',
                        color: log.status === 'sent' ? '#065f46' : log.status === 'queued' ? '#92400e' : '#991b1b',
                      }}>{log.status}</span>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px' }}>{log.sent_at?.slice(0, 16)?.replace('T', ' ')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ EDIT TEMPLATE MODAL ═══ */}
      {editTemplate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '860px', maxHeight: '92vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>
                Edit: {editTemplate.name}
              </h2>
              <button onClick={() => setEditTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: '#0c3c60', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <Variable size={12} /> <strong>Variables (click to copy):</strong>
                {editTemplate.variables?.map(v => (
                  <code key={v} style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                    onClick={() => { navigator.clipboard.writeText(`{{${v}}}`); showToast(`Copied {{${v}}}`); }}
                    data-testid={`var-${v}`}
                  >{`{{${v}}}`} <Copy size={9} /></code>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelS}>Subject Line</label>
              <input value={editTemplate.subject} onChange={e => setEditTemplate({ ...editTemplate, subject: e.target.value })} style={inputS} data-testid="template-subject-input" />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelS}>Email Body (HTML)</label>
              <RichTextToolbar textareaRef={bodyRef} value={editTemplate.body} onChange={(v) => setEditTemplate({ ...editTemplate, body: v })} />
              <textarea
                ref={bodyRef}
                value={editTemplate.body}
                onChange={e => setEditTemplate({ ...editTemplate, body: e.target.value })}
                style={{ ...inputS, minHeight: '300px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.6, borderRadius: '0 0 8px 8px', borderTop: 'none', resize: 'vertical' }}
                data-testid="template-body-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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

      {/* ═══ CREATE TEMPLATE MODAL ═══ */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Create Custom Template</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div><label style={labelS}>Template Key (unique, no spaces)</label><input value={newTemplate.key} onChange={e => setNewTemplate({ ...newTemplate, key: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })} style={inputS} placeholder="e.g. welcome_back" data-testid="new-template-key" /></div>
              <div><label style={labelS}>Template Name</label><input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} style={inputS} placeholder="Welcome Back Email" data-testid="new-template-name" /></div>
              <div><label style={labelS}>Subject Line</label><input value={newTemplate.subject} onChange={e => setNewTemplate({ ...newTemplate, subject: e.target.value })} style={inputS} placeholder="IDSEA - Welcome Back, {{member_name}}!" data-testid="new-template-subject" /></div>
              <div><label style={labelS}>Description</label><input value={newTemplate.description} onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })} style={inputS} placeholder="When to use this template" /></div>
              <div><label style={labelS}>Variables (comma-separated)</label><input value={newTemplate.variables} onChange={e => setNewTemplate({ ...newTemplate, variables: e.target.value })} style={inputS} placeholder="member_name, email, custom_field" /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn-primary" disabled={saving} data-testid="create-template-submit">
                <Plus size={14} /> {saving ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SEND CAMPAIGN MODAL ═══ */}
      {showCampaign && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Send Email Campaign</h2>
              <button onClick={() => setShowCampaign(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div className="admin-card" style={{ background: '#fef3c7', border: '1px solid #fcd34d', marginBottom: '16px', padding: '12px' }}>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                Emails will be <strong>queued</strong> and sent in batches of 50 every 5 minutes to respect email provider limits.
              </p>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={labelS}>Campaign Name</label>
                <input value={campaign.campaign_name} onChange={e => setCampaign({ ...campaign, campaign_name: e.target.value })} style={inputS} placeholder="July Newsletter" data-testid="campaign-name" />
              </div>
              <div>
                <label style={labelS}>Email Template</label>
                <select value={campaign.template_key} onChange={e => setCampaign({ ...campaign, template_key: e.target.value })} style={inputS} data-testid="campaign-template">
                  <option value="">Select template...</option>
                  {templates.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Recipient Group</label>
                <select value={campaign.recipient_group} onChange={e => setCampaign({ ...campaign, recipient_group: e.target.value })} style={inputS} data-testid="campaign-group">
                  <option value="all_members">All Approved Members</option>
                  <option value="academic">Academic Members Only</option>
                  <option value="entrepreneur">Entrepreneur Members Only</option>
                  <option value="corporate">Corporate Members Only</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setShowCampaign(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSendCampaign} className="btn-primary" disabled={saving} data-testid="send-campaign-submit">
                <Send size={14} /> {saving ? 'Sending...' : 'Queue Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PREVIEW MODAL ═══ */}
      {showPreview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflow: 'auto', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <h2 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Email Preview</h2>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '3px 0 0' }}>Subject: {previewSubject}</p>
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
