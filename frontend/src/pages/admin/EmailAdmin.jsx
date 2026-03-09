import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Send, Clock, Settings, X, TestTube } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

export default function EmailAdmin() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSmtp, setShowSmtp] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ subject: '', body: '', recipient_group: 'all', recipients: '' });
  const [smtp, setSmtp] = useState({ smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', from_email: 'noreply@idsea.org' });
  const [smtpLoading, setSmtpLoading] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadLogs = () => { axios.get(`${API}/admin/email/logs`).then(r => { setLogs(r.data); setLoading(false); }).catch(() => setLoading(false)); };
  const loadSmtp = () => { axios.get(`${API}/admin/smtp-settings`).then(r => setSmtp(prev => ({ ...prev, ...r.data }))).catch(() => {}); };

  useEffect(() => { loadLogs(); loadSmtp(); }, []);

  const handleSend = async () => {
    if (!form.subject || !form.body) return showToast('Subject and body required');
    setSending(true);
    try {
      const payload = { subject: form.subject, body: form.body, recipient_group: form.recipient_group };
      if (form.recipient_group === 'custom') {
        payload.recipients = form.recipients.split(',').map(e => e.trim()).filter(Boolean);
      }
      const r = await axios.post(`${API}/admin/email/send`, payload);
      showToast(r.data.message || 'Email queued!');
      setShowModal(false);
      setForm({ subject: '', body: '', recipient_group: 'all', recipients: '' });
      loadLogs();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed to send')); }
    setSending(false);
  };

  const handleSaveSmtp = async () => {
    setSmtpLoading(true);
    try {
      await axios.put(`${API}/admin/smtp-settings`, smtp);
      showToast('SMTP settings saved!');
      loadSmtp();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
    setSmtpLoading(false);
  };

  const handleTestSmtp = async () => {
    setSmtpLoading(true);
    try {
      const r = await axios.post(`${API}/admin/smtp-settings/test`);
      showToast(r.data.message);
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Test failed')); }
    setSmtpLoading(false);
  };

  const GROUPS = [
    { value: 'all', label: 'All Approved Members' },
    { value: 'academic', label: 'Academic Members' },
    { value: 'entrepreneur', label: 'Entrepreneur Members' },
    { value: 'corporate', label: 'Corporate Members' },
    { value: 'custom', label: 'Custom Recipients' },
  ];

  return (
    <div>
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Email System</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowSmtp(!showSmtp)} className="btn-secondary" data-testid="smtp-settings-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Settings size={16} /> SMTP Settings
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary" data-testid="compose-email-btn">
            <Send size={16} /> Compose Email
          </button>
        </div>
      </div>

      {/* SMTP Settings Panel */}
      {showSmtp && (
        <div className="admin-card" style={{ marginBottom: '20px', border: '1px solid #dbeafe' }} data-testid="smtp-settings-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>SMTP Configuration</h3>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '10px', fontWeight: 600, fontFamily: 'Poppins', background: smtp.is_configured ? '#d1fae5' : '#fef3c7', color: smtp.is_configured ? '#065f46' : '#92400e' }}>
                {smtp.is_configured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">SMTP Host</label>
              <input value={smtp.smtp_host} onChange={e => setSmtp({ ...smtp, smtp_host: e.target.value })} className="form-input" placeholder="smtp.gmail.com" data-testid="smtp-host" />
            </div>
            <div className="form-group">
              <label className="form-label">Port</label>
              <input type="number" value={smtp.smtp_port} onChange={e => setSmtp({ ...smtp, smtp_port: e.target.value })} className="form-input" data-testid="smtp-port" />
            </div>
            <div className="form-group">
              <label className="form-label">From Email</label>
              <input value={smtp.from_email} onChange={e => setSmtp({ ...smtp, from_email: e.target.value })} className="form-input" placeholder="noreply@idsea.org" />
            </div>
            <div className="form-group">
              <label className="form-label">Username / Email</label>
              <input value={smtp.smtp_user} onChange={e => setSmtp({ ...smtp, smtp_user: e.target.value })} className="form-input" placeholder="your-email@gmail.com" data-testid="smtp-user" />
            </div>
            <div className="form-group">
              <label className="form-label">Password / App Password</label>
              <input type="password" value={smtp.smtp_pass} onChange={e => setSmtp({ ...smtp, smtp_pass: e.target.value })} className="form-input" placeholder="Enter password" data-testid="smtp-pass" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button onClick={handleTestSmtp} className="btn-secondary" disabled={smtpLoading} data-testid="test-smtp-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TestTube size={14} /> Send Test Email
            </button>
            <button onClick={handleSaveSmtp} className="btn-primary" disabled={smtpLoading} data-testid="save-smtp-btn">
              {smtpLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Email Logs */}
      <div className="admin-card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} style={{ color: '#6b7280' }} />
          <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Email Logs</h3>
        </div>
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" data-testid="email-logs-table">
            <thead>
              <tr><th>Subject</th><th>Group</th><th>Recipients</th><th>Sent By</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No emails sent yet</td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600, fontSize: '13px', color: '#111827', maxWidth: '240px' }}>{log.subject}</td>
                  <td><span className="badge badge-academic">{log.recipient_group}</span></td>
                  <td style={{ fontSize: '13px', color: '#6b7280' }}>{log.recipients_count} recipients</td>
                  <td style={{ fontSize: '13px', color: '#6b7280' }}>{log.sent_by}</td>
                  <td style={{ fontSize: '12px', color: '#9ca3af' }}>{log.sent_at ? new Date(log.sent_at).toLocaleDateString('en-IN') : '-'}</td>
                  <td><span className={`badge badge-${log.status === 'queued' ? 'pending' : 'approved'}`}>{log.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Compose Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Compose Email</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Recipient Group</label>
              <select value={form.recipient_group} onChange={e => setForm({ ...form, recipient_group: e.target.value })} className="form-select" data-testid="email-group-select">
                {GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            {form.recipient_group === 'custom' && (
              <div className="form-group">
                <label className="form-label">Email Addresses (comma separated)</label>
                <input value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })} className="form-input" placeholder="user1@email.com, user2@email.com" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="form-input" data-testid="email-subject" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Body (HTML supported) *</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="form-textarea" rows={8} data-testid="email-body" required />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSend} className="btn-primary" disabled={sending} data-testid="send-email-btn">
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
