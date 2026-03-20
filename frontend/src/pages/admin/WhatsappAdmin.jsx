import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  MessageSquare, Settings, Send, Users, QrCode, Wifi, WifiOff,
  RefreshCw, Save, Phone, ToggleLeft, ToggleRight, Loader2,
  CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Search
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WhatsappAdmin() {
  const [activeTab, setActiveTab] = useState('config');
  const [settings, setSettings] = useState({
    access_token: '', instance_id: '', enabled: false,
    auto_notifications: {
      membership_submitted: true, membership_approved: true, membership_denied: true,
      event_registered: true, room_allotment: true, payment_received: true,
    }
  });
  const [status, setStatus] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
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
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [events, setEvents] = useState([]);

  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/admin/whatsapp-settings`, { headers });
      setSettings(s => ({ ...s, ...r.data }));
    } catch { /* ignore */ }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/admin/whatsapp/status`, { headers });
      setStatus(r.data);
    } catch { setStatus(null); }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/admin/whatsapp/logs?limit=50`, { headers });
      setLogs(r.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchSettings(), fetchStatus(), fetchLogs()]).then(() => setLoading(false));
    axios.get(`${API}/admin/events`, { headers }).then(r => setEvents(r.data || [])).catch(() => {});
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/whatsapp-settings`, settings, { headers });
      showToast('Settings saved successfully');
      await fetchSettings();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Failed to save', 'error');
    }
    setSaving(false);
  };

  const connectInstance = async () => {
    setConnecting(true);
    try {
      const r = await axios.post(`${API}/admin/whatsapp/connect`, { instance_id: settings.instance_id || '' }, { headers });
      if (r.data.instance_id) {
        setSettings(s => ({ ...s, instance_id: r.data.instance_id }));
      }
      if (r.data.status === 'success') {
        showToast('Instance created! Now scan the QR code to activate.');
        // Auto-fetch QR after connecting
        setTimeout(() => fetchQR(), 500);
      } else {
        showToast(r.data.message || 'Connection issue', 'error');
      }
      await fetchStatus();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Connection failed', 'error');
    }
    setConnecting(false);
  };

  const disconnectInstance = async () => {
    try {
      await axios.post(`${API}/admin/whatsapp/disconnect`, {}, { headers });
      showToast('Instance disconnected');
      await fetchStatus();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Disconnect failed', 'error');
    }
  };

  const fetchQR = async () => {
    try {
      const r = await axios.get(`${API}/admin/whatsapp/qr`, { headers });
      setQrData(r.data);
    } catch (e) {
      showToast(e.response?.data?.detail || 'Failed to get QR code', 'error');
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone) return showToast('Enter phone number', 'error');
    setSendingTest(true);
    try {
      const r = await axios.post(`${API}/admin/whatsapp/send-test`, { phone: testPhone, message: testMessage }, { headers });
      if (r.data.status === 'error') {
        showToast(r.data.message || 'Send failed', 'error');
      } else {
        showToast('Test message sent!');
      }
      fetchLogs();
    } catch (e) {
      showToast(e.response?.data?.detail || e.response?.data?.message || 'Send failed', 'error');
    }
    setSendingTest(false);
  };

  const sendBulkMessage = async () => {
    if (!bulkMessage) return showToast('Enter message', 'error');
    setSendingBulk(true);
    try {
      await axios.post(`${API}/admin/whatsapp/send-bulk`, {
        message: bulkMessage, target: bulkTarget,
        event_id: bulkEventId, membership_type: bulkMemberFilter,
      }, { headers });
      showToast('Bulk messaging started in background');
      setBulkMessage('');
      fetchLogs();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Bulk send failed', 'error');
    }
    setSendingBulk(false);
  };

  const toggleNotification = (key) => {
    setSettings(s => ({
      ...s, auto_notifications: { ...s.auto_notifications, [key]: !s.auto_notifications[key] }
    }));
  };

  const isConnected = status && (status.status === 'connected' || status.connected === true || (status.data && status.data.status === 'connected') || status.message === 'Instance is active and connected');
  const isActivated = status && status.status !== 'not_configured' && status.message !== 'This instance ID has not been activated yet';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#1e7a4d' }} />
    </div>
  );

  const tabs = [
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'messaging', label: 'Send Messages', icon: Send },
    { id: 'logs', label: 'Message Logs', icon: MessageSquare },
  ];

  const notificationLabels = {
    membership_submitted: 'Membership Application Submitted',
    membership_approved: 'Membership Approved',
    membership_denied: 'Membership Denied',
    event_registered: 'Event Registration Confirmed',
    room_allotment: 'Room/Accommodation Allotment',
    payment_received: 'Payment Received',
  };

  return (
    <div data-testid="whatsapp-admin" style={{ maxWidth: '1100px' }}>
      {/* Toast */}
      {toast.message && (
        <div data-testid="whatsapp-toast" style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 1000, padding: '12px 20px',
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Inter, sans-serif', fontSize: '14px',
          color: toast.type === 'error' ? '#991b1b' : '#166534',
        }}>
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 data-testid="whatsapp-title" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>
          WhatsApp Integration
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Configure AK Nexus WhatsApp API for automated notifications
        </p>
      </div>

      {/* Connection Status Bar */}
      <div data-testid="whatsapp-status-bar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px',
        background: isConnected ? '#f0fdf4' : '#fefce8', border: `1px solid ${isConnected ? '#bbf7d0' : '#fef08a'}`,
        borderRadius: '10px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isConnected ? <Wifi size={20} style={{ color: '#1e7a4d' }} /> : <WifiOff size={20} style={{ color: '#ca8a04' }} />}
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '14px', color: isConnected ? '#166534' : '#854d0e' }}>
              {isConnected ? 'WhatsApp Connected' : settings.instance_id ? (isActivated ? 'Awaiting Connection' : 'Not Activated - Scan QR Code') : 'Not Configured'}
            </div>
            {settings.instance_id && (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Instance: {settings.instance_id}
              </div>
            )}
            {status?.message && status.message !== 'Instance is active and connected' && (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
                {status.message}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button data-testid="refresh-status-btn" onClick={async () => { await fetchStatus(); showToast('Status refreshed'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {settings.enabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#1e7a4d', borderRadius: '6px', color: 'white', fontFamily: 'Inter', fontSize: '13px', fontWeight: 500 }}>
              <CheckCircle2 size={14} /> Enabled
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button key={t.id} data-testid={`tab-${t.id}`} onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
              background: 'none', border: 'none', borderBottom: activeTab === t.id ? '2px solid #0c3c60' : '2px solid transparent',
              color: activeTab === t.id ? '#0c3c60' : '#94a3b8', fontFamily: 'Poppins, sans-serif',
              fontSize: '14px', fontWeight: activeTab === t.id ? 600 : 500, cursor: 'pointer',
              marginBottom: '-2px', transition: 'color 0.2s, border-color 0.2s',
            }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* ====================== CONFIG TAB ====================== */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* API Configuration */}
          <div data-testid="api-config-section" style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 600, color: '#0c3c60', margin: '0 0 16px 0' }}>
              API Configuration
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Access Token</label>
                <input data-testid="access-token-input" type="text" value={settings.access_token}
                  onChange={e => setSettings(s => ({ ...s, access_token: e.target.value }))}
                  placeholder="Enter AK Nexus access token"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Instance ID (optional)</label>
                <input data-testid="instance-id-input" type="text" value={settings.instance_id || ''}
                  onChange={e => setSettings(s => ({ ...s, instance_id: e.target.value }))}
                  placeholder="Auto-generated if empty"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            {/* Enable toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', padding: '12px 16px', background: settings.enabled ? '#f0fdf4' : '#f8fafc', borderRadius: '8px', border: `1px solid ${settings.enabled ? '#bbf7d0' : '#e2e8f0'}`, cursor: 'pointer' }}
              onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))} data-testid="toggle-whatsapp-enabled">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={18} style={{ color: settings.enabled ? '#1e7a4d' : '#94a3b8' }} />
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: settings.enabled ? '#1e7a4d' : '#64748b' }}>WhatsApp Notifications</span>
              </div>
              {settings.enabled ? <ToggleRight size={28} style={{ color: '#1e7a4d' }} /> : <ToggleLeft size={28} style={{ color: '#94a3b8' }} />}
            </div>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button data-testid="save-settings-btn" onClick={saveSettings} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#1e7a4d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                Save Settings
              </button>
              <button data-testid="connect-btn" onClick={connectInstance} disabled={connecting || !settings.access_token}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#0c3c60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, opacity: (connecting || !settings.access_token) ? 0.6 : 1 }}>
                {connecting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Wifi size={16} />}
                Connect Instance
              </button>
              {isConnected && (
                <button data-testid="disconnect-btn" onClick={disconnectInstance}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', fontWeight: 500 }}>
                  <WifiOff size={16} /> Disconnect
                </button>
              )}
            </div>
          </div>

          {/* QR Code Section */}
          {settings.instance_id && (
            <div data-testid="qr-code-section" style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 600, color: '#0c3c60', margin: 0 }}>
                  QR Code - Link WhatsApp
                </h3>
                <button data-testid="fetch-qr-btn" onClick={fetchQR}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0c3c60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '13px', fontWeight: 500 }}>
                  <QrCode size={14} /> Get QR Code
                </button>
              </div>
              {qrData && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  {qrData.base64 || qrData.qr_code || qrData.qr ? (
                    <div>
                      <img src={qrData.base64 || qrData.qr_code || qrData.qr}
                        alt="WhatsApp QR Code"
                        style={{ maxWidth: '280px', border: '4px solid #e2e8f0', borderRadius: '12px' }} data-testid="qr-code-image" />
                      <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#64748b', marginTop: '12px' }}>
                        Scan this QR code with WhatsApp to link your account
                      </p>
                      {qrData.expires_in && (
                        <p style={{ fontFamily: 'Inter', fontSize: '12px', color: '#ca8a04', marginTop: '4px' }}>
                          Expires in {Math.round(qrData.expires_in / 60)} minutes
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', background: '#fefce8', borderRadius: '8px', border: '1px solid #fef08a' }}>
                      <AlertCircle size={20} style={{ color: '#ca8a04', marginBottom: '8px' }} />
                      <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#854d0e' }}>
                        {qrData.error || qrData.message || 'QR code not available. The instance may already be connected.'}
                      </p>
                      <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', background: '#f8fafc', padding: '10px', borderRadius: '6px', marginTop: '10px', textAlign: 'left', overflow: 'auto', maxHeight: '100px' }}>
                        {JSON.stringify(qrData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Auto Notifications */}
          <div data-testid="auto-notifications-section" style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 600, color: '#0c3c60', margin: '0 0 16px 0' }}>
              Automatic Notifications
            </h3>
            <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Toggle which events trigger automatic WhatsApp messages
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.entries(notificationLabels).map(([key, label]) => {
                const enabled = settings.auto_notifications?.[key] !== false;
                return (
                  <div key={key} data-testid={`notif-toggle-${key}`}
                    onClick={() => toggleNotification(key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
                      background: enabled ? '#f0fdf4' : '#f8fafc', border: `1px solid ${enabled ? '#bbf7d0' : '#e2e8f0'}`,
                      borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
                    }}>
                    <span style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 500, color: enabled ? '#166534' : '#64748b' }}>{label}</span>
                    {enabled ? <ToggleRight size={22} style={{ color: '#1e7a4d' }} /> : <ToggleLeft size={22} style={{ color: '#94a3b8' }} />}
                  </div>
                );
              })}
            </div>
            <button data-testid="save-notifications-btn" onClick={saveSettings} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#1e7a4d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, marginTop: '16px', opacity: saving ? 0.6 : 1 }}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              Save Notification Settings
            </button>
          </div>
        </div>
      )}

      {/* ====================== MESSAGING TAB ====================== */}
      {activeTab === 'messaging' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Send Test Message */}
          <div data-testid="test-message-section" style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 600, color: '#0c3c60', margin: '0 0 16px 0' }}>
              Send Test Message
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Phone Number</label>
                <input data-testid="test-phone-input" type="text" value={testPhone}
                  onChange={e => setTestPhone(e.target.value)} placeholder="e.g. 919876543210"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Message</label>
                <input data-testid="test-message-input" type="text" value={testMessage}
                  onChange={e => setTestMessage(e.target.value)} placeholder="Enter test message"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button data-testid="send-test-btn" onClick={sendTestMessage} disabled={sendingTest}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#1e7a4d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, opacity: sendingTest ? 0.6 : 1 }}>
              {sendingTest ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              Send Test Message
            </button>
          </div>

          {/* Bulk Messaging */}
          <div data-testid="bulk-message-section" style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 600, color: '#0c3c60', margin: '0 0 4px 0' }}>
              Bulk Messaging
            </h3>
            <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Send WhatsApp messages to members or event participants. Use {'{{name}}'} for personalization.
            </p>
            {/* Target Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Target Audience</label>
                <select data-testid="bulk-target-select" value={bulkTarget} onChange={e => setBulkTarget(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
                  <option value="all_members">All Members</option>
                  <option value="event_registered">Event Registrants</option>
                </select>
              </div>
              {bulkTarget === 'all_members' && (
                <div>
                  <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Membership Type</label>
                  <select data-testid="bulk-member-filter" value={bulkMemberFilter} onChange={e => setBulkMemberFilter(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
                    <option value="all">All Types</option>
                    <option value="academic">Academic</option>
                    <option value="entrepreneur">Entrepreneur</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
              )}
              {bulkTarget === 'event_registered' && (
                <div>
                  <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Select Event</label>
                  <select data-testid="bulk-event-select" value={bulkEventId} onChange={e => setBulkEventId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
                    <option value="">Select event...</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
              )}
            </div>
            {/* Message */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Message</label>
              <textarea data-testid="bulk-message-input" value={bulkMessage} onChange={e => setBulkMessage(e.target.value)}
                placeholder="Hello {name}, we have an important update for you..."
                rows={4}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'Inter', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button data-testid="send-bulk-btn" onClick={sendBulkMessage} disabled={sendingBulk}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#0c3c60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, opacity: sendingBulk ? 0.6 : 1 }}>
              {sendingBulk ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Users size={16} />}
              Send Bulk Message
            </button>
          </div>
        </div>
      )}

      {/* ====================== LOGS TAB ====================== */}
      {activeTab === 'logs' && (
        <div data-testid="logs-section" style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: 600, color: '#0c3c60', margin: 0 }}>
              Message Logs ({logs.length})
            </h3>
            <button data-testid="refresh-logs-btn" onClick={fetchLogs}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <MessageSquare size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontFamily: 'Inter', fontSize: '14px' }}>No messages sent yet</p>
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1e7a4d' }}>
                    {['Phone', 'Message', 'Status', 'Type', 'Sent At'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'Poppins', fontSize: '12px', fontWeight: 600, color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'Inter', fontSize: '13px', color: '#374151' }}>{log.phone || '-'}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'Inter', fontSize: '13px', color: '#374151', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.message || log.type === 'bulk' ? `[Bulk] ${log.message || ''}` : '-'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px',
                          borderRadius: '12px', fontSize: '12px', fontFamily: 'Inter', fontWeight: 500,
                          background: log.status === 'sent' ? '#f0fdf4' : '#fef2f2',
                          color: log.status === 'sent' ? '#166534' : '#991b1b',
                        }}>
                          {log.status === 'sent' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {log.status || 'unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'Inter', fontSize: '12px', color: '#64748b' }}>
                        {log.type === 'bulk' ? `Bulk (${log.sent || 0}/${log.total_recipients || 0})` : 'Single'}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'Inter', fontSize: '12px', color: '#64748b' }}>
                        {log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
