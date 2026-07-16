import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  MessageSquare, Settings, Send, Users, Wifi, WifiOff,
  RefreshCw, Save, Loader2, CheckCircle2, XCircle,
  ToggleLeft, ToggleRight, Megaphone, Upload, FileText,
  Image, Clock, Hash, Trash2, Eye, Play
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function WhatsappAdmin() {
  const [activeTab, setActiveTab] = useState('config');
  const [settings, setSettings] = useState({
    server_url: '', api_key: '', session_id: 'primary', enabled: false,
    auto_notifications: {
      membership_submitted: true, membership_approved: true, membership_denied: true,
      event_registered: true, room_allotment: true, payment_received: true,
    }
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test message from IDSEA Admin Panel.');
  const [sendingTest, setSendingTest] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkTarget, setBulkTarget] = useState('all_members');
  const [bulkMemberFilter, setBulkMemberFilter] = useState('all');
  const [bulkEventId, setBulkEventId] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);

  // Campaign state
  const [campaigns, setCampaigns] = useState([]);
  const [campName, setCampName] = useState('');
  const [campMsg, setCampMsg] = useState('');
  const [campBatch, setCampBatch] = useState(10);
  const [campInterval, setCampInterval] = useState(30);
  const [campTarget, setCampTarget] = useState('all_members');
  const [campPlanFilter, setCampPlanFilter] = useState('all');
  const [campEventId, setCampEventId] = useState('');
  const [campCustomPhones, setCampCustomPhones] = useState('');
  const [campMediaUrl, setCampMediaUrl] = useState('');
  const [campMediaType, setCampMediaType] = useState('');
  const [campAddRef, setCampAddRef] = useState(true);
  const [campSending, setCampSending] = useState(false);
  const [campUploading, setCampUploading] = useState(false);
  const imgRef = useRef(null);
  const pdfRef = useRef(null);
  const pollRef = useRef(null);

  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/admin/whatsapp-settings`, { headers });
      if (r.data) setSettings(s => ({ ...s, ...r.data }));
    } catch { }
    setLoading(false);
  }, []);

  const fetchStatus = async () => {
    try {
      const r = await axios.get(`${API}/admin/whatsapp/status`, { headers });
      setStatus(r.data);
    } catch { setStatus({ status: 'error', message: 'Failed to check status' }); }
  };

  const fetchLogs = async () => {
    try {
      const r = await axios.get(`${API}/admin/whatsapp/logs?limit=100`, { headers });
      setLogs(r.data || []);
    } catch { }
  };

  const fetchEvents = async () => {
    try {
      const r = await axios.get(`${API}/admin/events`, { headers });
      setEvents(r.data || []);
    } catch { }
  };

  const fetchCampaigns = async () => {
    try {
      const r = await axios.get(`${API}/admin/whatsapp/campaigns`, { headers });
      setCampaigns(r.data || []);
    } catch { }
  };

  useEffect(() => {
    fetchSettings();
    fetchStatus();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
    if (activeTab === 'marketing') fetchCampaigns();
  }, [activeTab]);

  // Poll running campaigns
  useEffect(() => {
    if (activeTab !== 'marketing') return;
    const hasRunning = campaigns.some(c => c.status === 'running');
    if (!hasRunning) return;
    pollRef.current = setInterval(fetchCampaigns, 5000);
    return () => clearInterval(pollRef.current);
  }, [activeTab, campaigns]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/whatsapp-settings`, settings, { headers });
      showToast('Settings saved');
      fetchStatus();
    } catch { showToast('Save failed', 'error'); }
    setSaving(false);
  };

  const sendTestMsg = async () => {
    if (!testPhone) return showToast('Enter phone number', 'error');
    setSendingTest(true);
    try {
      const r = await axios.post(`${API}/admin/whatsapp/send-test`, { phone: testPhone, message: testMessage }, { headers });
      showToast(r.data.status === 'success' ? 'Test message sent!' : r.data.message || 'Failed', r.data.status === 'success' ? 'success' : 'error');
    } catch (e) { showToast(e.response?.data?.detail || 'Failed', 'error'); }
    setSendingTest(false);
  };

  const sendBulk = async () => {
    if (!bulkMessage) return showToast('Enter message', 'error');
    setSendingBulk(true);
    try {
      await axios.post(`${API}/admin/whatsapp/send-bulk`, {
        message: bulkMessage, target: bulkTarget,
        membership_type: bulkMemberFilter, event_id: bulkEventId,
      }, { headers });
      showToast('Bulk sending started in background');
      setBulkMessage('');
    } catch (e) { showToast(e.response?.data?.detail || 'Failed', 'error'); }
    setSendingBulk(false);
  };

  // Campaign handlers
  const handleMediaUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCampUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const ep = type === 'image' ? 'upload-photo' : 'upload-pdf';
      const r = await axios.post(`${API}/public/${ep}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = r.data.file_url;
      const fullUrl = url.startsWith('http') ? url : `${BACKEND}${url.startsWith('/') ? '' : '/'}${url}`;
      setCampMediaUrl(fullUrl);
      setCampMediaType(type);
      showToast(`${type === 'image' ? 'Image' : 'PDF'} uploaded`);
    } catch { showToast('Upload failed', 'error'); }
    setCampUploading(false);
    if (imgRef.current) imgRef.current.value = '';
    if (pdfRef.current) pdfRef.current.value = '';
  };

  const startCampaign = async () => {
    if (!campMsg.trim()) return showToast('Enter message', 'error');
    setCampSending(true);
    try {
      let customPhones = [];
      if (campTarget === 'custom' && campCustomPhones.trim()) {
        customPhones = campCustomPhones.split('\n').filter(l => l.trim()).map(l => {
          const [phone, ...nameParts] = l.split(',').map(s => s.trim());
          return { phone, name: nameParts.join(',') || 'Member' };
        });
      }
      const payload = {
        name: campName || `Campaign ${new Date().toLocaleDateString()}`,
        message: campMsg, batch_size: campBatch, interval_seconds: campInterval,
        target: campTarget, membership_type: campPlanFilter, event_id: campEventId,
        custom_phones: customPhones, media_url: campMediaUrl, media_type: campMediaType,
        add_reference_code: campAddRef,
      };
      const r = await axios.post(`${API}/admin/whatsapp/campaign`, payload, { headers });
      showToast(`Campaign started! ID: ${r.data.campaign_id?.substring(0, 8)}`);
      fetchCampaigns();
      setCampMsg(''); setCampName(''); setCampMediaUrl(''); setCampMediaType(''); setCampCustomPhones('');
    } catch (e) { showToast(e.response?.data?.detail || 'Failed', 'error'); }
    setCampSending(false);
  };

  const inputS = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', background: '#fff' };
  const labelS = { fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' };
  const cardS = { background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '16px' };

  const tabs = [
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'send', label: 'Send Messages', icon: Send },
    { id: 'marketing', label: 'Marketing Campaign', icon: Megaphone },
    { id: 'logs', label: 'Logs', icon: MessageSquare },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}><Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 10px' }} /> Loading...</div>;

  return (
    <div data-testid="whatsapp-admin">
      {toast.message && (
        <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 200, padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: toast.type === 'error' ? '#dc2626' : '#065f46' }} data-testid="toast">
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title" data-testid="page-title">WhatsApp Management</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: status?.status === 'success' ? '#22c55e' : '#ef4444' }} />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{status?.status === 'success' ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '20px', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} data-testid={`tab-${t.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Poppins', whiteSpace: 'nowrap', background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? '#0c3c60' : '#6b7280', boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* CONFIG TAB */}
      {activeTab === 'config' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={cardS}>
            <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px' }}>WhatsApp Server Settings</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelS}>Server URL</label>
              <input value={settings.server_url} onChange={e => setSettings(s => ({ ...s, server_url: e.target.value }))} style={inputS} placeholder="https://your-whatsapp-server.com" data-testid="server-url-input" />
              <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px', display: 'block' }}>Your WhatsApp server endpoint (whatsapp-server-4)</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelS}>API Key (Bearer Token)</label>
              <input value={settings.api_key} onChange={e => setSettings(s => ({ ...s, api_key: e.target.value }))} style={inputS} placeholder="YOUR_API_KEY" data-testid="api-key-input" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelS}>Session ID</label>
              <input value={settings.session_id} onChange={e => setSettings(s => ({ ...s, session_id: e.target.value }))} style={inputS} placeholder="primary" data-testid="session-id-input" />
              <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px', display: 'block' }}>WhatsApp session slug (default: primary)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', cursor: 'pointer' }} onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}>
              {settings.enabled ? <ToggleRight size={28} color="#22c55e" /> : <ToggleLeft size={28} color="#9ca3af" />}
              <span style={{ fontSize: '13px', fontWeight: 600, color: settings.enabled ? '#065f46' : '#6b7280' }}>{settings.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Auto Notifications</h4>
            {Object.entries(settings.auto_notifications || {}).map(([key, val]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>
                <input type="checkbox" checked={val} onChange={() => setSettings(s => ({ ...s, auto_notifications: { ...s.auto_notifications, [key]: !val } }))} style={{ accentColor: '#1e7a4d' }} />
                {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </label>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={saveSettings} disabled={saving} className="btn-primary" data-testid="save-settings-btn">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Settings
              </button>
              <button onClick={fetchStatus} className="btn-secondary" data-testid="check-status-btn">
                <RefreshCw size={14} /> Check Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND TAB */}
      {activeTab === 'send' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={cardS}>
            <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Send size={16} /> Test Message</h3>
            <div style={{ marginBottom: '10px' }}><label style={labelS}>Phone Number</label><input value={testPhone} onChange={e => setTestPhone(e.target.value)} style={inputS} placeholder="919876543210" data-testid="test-phone-input" /></div>
            <div style={{ marginBottom: '10px' }}><label style={labelS}>Message</label><textarea value={testMessage} onChange={e => setTestMessage(e.target.value)} style={{ ...inputS, minHeight: '80px' }} data-testid="test-message-input" /></div>
            <button onClick={sendTestMsg} disabled={sendingTest} className="btn-primary" data-testid="send-test-btn">
              {sendingTest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Test
            </button>
          </div>

          <div style={cardS}>
            <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Quick Bulk Message</h3>
            <div style={{ marginBottom: '10px' }}><label style={labelS}>Target</label>
              <select value={bulkTarget} onChange={e => setBulkTarget(e.target.value)} style={inputS} data-testid="bulk-target">
                <option value="all_members">All Members</option><option value="event_registered">Event Registrations</option>
              </select>
            </div>
            {bulkTarget === 'all_members' && (
              <div style={{ marginBottom: '10px' }}><label style={labelS}>Filter by Plan</label>
                <select value={bulkMemberFilter} onChange={e => setBulkMemberFilter(e.target.value)} style={inputS}>
                  <option value="all">All Plans</option><option value="academic">Academic</option><option value="entrepreneur">Entrepreneur</option><option value="corporate">Corporate</option><option value="international">International</option>
                </select>
              </div>
            )}
            {bulkTarget === 'event_registered' && (
              <div style={{ marginBottom: '10px' }}><label style={labelS}>Event</label>
                <select value={bulkEventId} onChange={e => setBulkEventId(e.target.value)} style={inputS}>
                  <option value="">Select Event</option>{events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
            )}
            <div style={{ marginBottom: '10px' }}><label style={labelS}>Message <span style={{ color: '#9ca3af', fontWeight: 400 }}>Use {'{name}'} for personalization</span></label>
              <textarea value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} style={{ ...inputS, minHeight: '80px' }} placeholder="Dear {name}, ..." data-testid="bulk-message-input" />
            </div>
            <button onClick={sendBulk} disabled={sendingBulk || !bulkMessage} className="btn-primary" data-testid="send-bulk-btn">
              {sendingBulk ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Bulk
            </button>
          </div>
        </div>
      )}

      {/* MARKETING CAMPAIGN TAB */}
      {activeTab === 'marketing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Composer */}
          <div style={cardS}>
            <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={16} /> New Campaign
            </h3>

            <div style={{ marginBottom: '10px' }}><label style={labelS}>Campaign Name</label>
              <input value={campName} onChange={e => setCampName(e.target.value)} style={inputS} placeholder="e.g., IDSEA Conference 2026 Invite" data-testid="camp-name" />
            </div>

            <div style={{ marginBottom: '10px' }}><label style={labelS}>Message <span style={{ color: '#9ca3af', fontWeight: 400 }}>({'{name}'} = recipient name)</span></label>
              <textarea value={campMsg} onChange={e => setCampMsg(e.target.value)} style={{ ...inputS, minHeight: '100px', lineHeight: '1.5' }} placeholder={`Dear {name},\n\nWe are pleased to invite you to...\n\nRegards,\nIDSEA Team`} data-testid="camp-message" />
            </div>

            {/* Media Attachments */}
            <div style={{ marginBottom: '12px' }}>
              <label style={labelS}>Attachment (optional)</label>
              {campMediaUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#d1fae5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  {campMediaType === 'image' ? <Image size={16} style={{ color: '#065f46' }} /> : <FileText size={16} style={{ color: '#065f46' }} />}
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#065f46' }}>
                    {campMediaType === 'image' ? 'Image' : 'PDF'} attached
                  </span>
                  <button onClick={() => { setCampMediaUrl(''); setCampMediaType(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', cursor: campUploading ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>
                    {campUploading ? <Loader2 size={12} className="animate-spin" /> : <Image size={12} />} Image
                    <input ref={imgRef} type="file" accept="image/*" onChange={e => handleMediaUpload(e, 'image')} style={{ display: 'none' }} data-testid="camp-img-upload" />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', cursor: campUploading ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#92400e' }}>
                    {campUploading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />} PDF
                    <input ref={pdfRef} type="file" accept=".pdf" onChange={e => handleMediaUpload(e, 'document')} style={{ display: 'none' }} data-testid="camp-pdf-upload" />
                  </label>
                </div>
              )}
            </div>

            {/* Target */}
            <div style={{ marginBottom: '10px' }}><label style={labelS}>Target Audience</label>
              <select value={campTarget} onChange={e => setCampTarget(e.target.value)} style={inputS} data-testid="camp-target">
                <option value="all_members">All Approved Members</option>
                <option value="event_registered">Event Registrations</option>
                <option value="custom">Custom Phone List</option>
              </select>
            </div>
            {campTarget === 'all_members' && (
              <div style={{ marginBottom: '10px' }}><label style={labelS}>Filter by Plan</label>
                <select value={campPlanFilter} onChange={e => setCampPlanFilter(e.target.value)} style={inputS} data-testid="camp-plan-filter">
                  <option value="all">All Plans</option><option value="academic">Academic</option><option value="entrepreneur">Entrepreneur</option><option value="corporate">Corporate</option><option value="international">International</option>
                </select>
              </div>
            )}
            {campTarget === 'event_registered' && (
              <div style={{ marginBottom: '10px' }}><label style={labelS}>Event</label>
                <select value={campEventId} onChange={e => setCampEventId(e.target.value)} style={inputS} data-testid="camp-event-select">
                  <option value="">Select Event</option>{events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              </div>
            )}
            {campTarget === 'custom' && (
              <div style={{ marginBottom: '10px' }}><label style={labelS}>Phone Numbers <span style={{ color: '#9ca3af', fontWeight: 400 }}>One per line: phone,name</span></label>
                <textarea value={campCustomPhones} onChange={e => setCampCustomPhones(e.target.value)}
                  style={{ ...inputS, minHeight: '80px', fontFamily: 'monospace', fontSize: '12px' }}
                  placeholder={`919876543210,Dr. Sharma\n918765432100,Prof. Kumar`} data-testid="camp-custom-phones" />
              </div>
            )}

            {/* Batch Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div><label style={labelS}><Hash size={11} style={{ display: 'inline', marginRight: '4px' }} />Batch Size</label>
                <input type="number" value={campBatch} onChange={e => setCampBatch(Math.max(1, Math.min(50, +e.target.value)))} style={inputS} min={1} max={50} data-testid="camp-batch" />
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Messages per batch (1-50)</span>
              </div>
              <div><label style={labelS}><Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />Interval (sec)</label>
                <input type="number" value={campInterval} onChange={e => setCampInterval(Math.max(5, +e.target.value))} style={inputS} min={5} data-testid="camp-interval" />
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Delay between batches</span>
              </div>
            </div>

            {/* Reference Code */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer', fontSize: '12px', color: '#374151', padding: '10px', background: campAddRef ? '#eff6ff' : '#f9fafb', borderRadius: '8px', border: `1px solid ${campAddRef ? '#bfdbfe' : '#e5e7eb'}` }}
              data-testid="camp-ref-toggle">
              <input type="checkbox" checked={campAddRef} onChange={() => setCampAddRef(!campAddRef)} style={{ accentColor: '#1e40af', width: '16px', height: '16px' }} />
              <div>
                <span style={{ fontWeight: 600 }}>Add Random Reference Code</span>
                <span style={{ display: 'block', fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Appends unique "Ref: IDSEA-X7K3M9" to each message to avoid WhatsApp blocking</span>
              </div>
            </label>

            {/* Preview */}
            {campMsg && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', marginBottom: '6px' }}>Message Preview</div>
                <div style={{ fontSize: '12px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {campMsg.replace('{name}', 'Dr. Sample Person')}
                  {campAddRef && <span style={{ color: '#6b7280' }}>{'\n\n'}Ref: IDSEA-A3K7X9</span>}
                </div>
                {campMediaUrl && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {campMediaType === 'image' ? <Image size={12} /> : <FileText size={12} />}
                    + {campMediaType === 'image' ? 'Image' : 'PDF Document'} attached
                  </div>
                )}
              </div>
            )}

            <button onClick={startCampaign} disabled={campSending || !campMsg.trim()} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} data-testid="start-campaign-btn">
              {campSending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {campSending ? 'Starting...' : 'Start Campaign'}
            </button>
          </div>

          {/* Campaign History */}
          <div>
            <div style={{ ...cardS, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Campaign History</h3>
                <button onClick={fetchCampaigns} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><RefreshCw size={14} /></button>
              </div>

              {campaigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '13px' }}>No campaigns yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
                  {campaigns.map(c => {
                    const progress = c.total > 0 ? Math.round(((c.sent + c.failed) / c.total) * 100) : 0;
                    const statusColor = c.status === 'completed' ? '#065f46' : c.status === 'running' ? '#1e40af' : '#dc2626';
                    const statusBg = c.status === 'completed' ? '#d1fae5' : c.status === 'running' ? '#dbeafe' : '#fee2e2';
                    return (
                      <div key={c.id} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fafafa' }} data-testid={`campaign-${c.id}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>{c.name}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: statusBg, color: statusColor, textTransform: 'capitalize' }}>{c.status}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>
                          {c.target === 'custom' ? 'Custom list' : c.target === 'event_registered' ? 'Event registrations' : `Members${c.membership_type !== 'all' ? ` (${c.membership_type})` : ''}`}
                          {c.media_type && <span> + {c.media_type === 'image' ? 'Image' : 'PDF'}</span>}
                        </div>
                        {/* Progress bar */}
                        <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '6px', marginBottom: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${progress}%`, height: '100%', background: c.status === 'running' ? '#3b82f6' : '#22c55e', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
                          <span><CheckCircle2 size={10} style={{ display: 'inline', color: '#22c55e' }} /> {c.sent} sent</span>
                          <span><XCircle size={10} style={{ display: 'inline', color: '#ef4444' }} /> {c.failed} failed</span>
                          <span>Total: {c.total}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>{new Date(c.created_at).toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === 'logs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Recent Logs ({logs.length})</h3>
            <button onClick={fetchLogs} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><RefreshCw size={12} /> Refresh</button>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Phone', 'Type', 'Message', 'Status', 'Time'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontSize: '11px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 50).map((l, i) => (
                    <tr key={l.id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '11px' }}>{l.phone}</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: l.msg_type === 'image' ? '#dbeafe' : l.msg_type === 'document' ? '#fef3c7' : '#f3f4f6', fontWeight: 600 }}>{l.msg_type || l.type || 'text'}</span></td>
                      <td style={{ padding: '8px 12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.message}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: l.status === 'sent' ? '#065f46' : '#dc2626' }}>
                          {l.status === 'sent' ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{l.sent_at ? new Date(l.sent_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>No logs yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
