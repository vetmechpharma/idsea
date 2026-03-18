import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, CreditCard, Building2, QrCode, Settings } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyBank = { bank_name: '', account_no: '', ifsc: '', branch: '', holder_name: '' };
const emptyUpi = { upi_id: '', name: '' };

export default function PaymentSettings() {
  const [settings, setSettings] = useState({ bank_accounts: [], upi_ids: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    axios.get(`${API}/admin/payment-settings`, { headers }).then(r => { setSettings(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    try {
      await axios.put(`${API}/admin/payment-settings`, { bank_accounts: settings.bank_accounts, upi_ids: settings.upi_ids }, { headers });
      showToast('Payment settings saved!');
    } catch { showToast('Save failed'); }
  };

  const addBank = () => setSettings(s => ({ ...s, bank_accounts: [...s.bank_accounts, { ...emptyBank }] }));
  const removeBank = (i) => setSettings(s => ({ ...s, bank_accounts: s.bank_accounts.filter((_, idx) => idx !== i) }));
  const updateBank = (i, key, val) => setSettings(s => {
    const banks = [...s.bank_accounts]; banks[i] = { ...banks[i], [key]: val }; return { ...s, bank_accounts: banks };
  });

  const addUpi = () => setSettings(s => ({ ...s, upi_ids: [...s.upi_ids, { ...emptyUpi }] }));
  const removeUpi = (i) => setSettings(s => ({ ...s, upi_ids: s.upi_ids.filter((_, idx) => idx !== i) }));
  const updateUpi = (i, key, val) => setSettings(s => {
    const upis = [...s.upi_ids]; upis[i] = { ...upis[i], [key]: val }; return { ...s, upi_ids: upis };
  });

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div>
      {toast && <div className="toast-success">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title" data-testid="payment-settings-title">Payment Settings</h1>
        <button onClick={save} className="btn-primary" data-testid="save-payment-settings"><Save size={14} /> Save Settings</button>
      </div>

      {/* Razorpay Status */}
      <div className="admin-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <CreditCard size={20} style={{ color: '#0c3c60' }} />
          <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Razorpay Gateway</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: settings.razorpay_configured ? '#1e7a4d' : '#ef4444' }} />
          <span style={{ fontSize: '13px', color: settings.razorpay_configured ? '#1e7a4d' : '#ef4444', fontWeight: 600 }}>
            {settings.razorpay_configured ? 'Configured' : 'Not Configured'}
          </span>
          {settings.razorpay_key_id && <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>Key: {settings.razorpay_key_id.slice(0, 12)}...</span>}
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>Razorpay keys are configured via environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)</p>
      </div>

      {/* Bank Accounts */}
      <div className="admin-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} style={{ color: '#0c3c60' }} />
            <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Bank Accounts</h3>
          </div>
          <button onClick={addBank} className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }} data-testid="add-bank-btn"><Plus size={13} /> Add Bank</button>
        </div>

        {settings.bank_accounts.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No bank accounts added. Add one for bank transfer payments.</p>
        ) : (
          settings.bank_accounts.map((bank, i) => (
            <div key={i} data-testid={`bank-${i}`} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Bank Account {i + 1}</span>
                <button onClick={() => removeBank(i)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={13} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Bank Name</label><input value={bank.bank_name} onChange={e => updateBank(i, 'bank_name', e.target.value)} className="form-input" placeholder="e.g., State Bank of India" /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Account Holder</label><input value={bank.holder_name} onChange={e => updateBank(i, 'holder_name', e.target.value)} className="form-input" placeholder="IDSEA" /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Account Number</label><input value={bank.account_no} onChange={e => updateBank(i, 'account_no', e.target.value)} className="form-input" placeholder="1234567890" /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">IFSC Code</label><input value={bank.ifsc} onChange={e => updateBank(i, 'ifsc', e.target.value)} className="form-input" placeholder="SBIN0001234" /></div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="form-label">Branch</label><input value={bank.branch} onChange={e => updateBank(i, 'branch', e.target.value)} className="form-input" placeholder="Main Branch, City" /></div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* UPI IDs */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <QrCode size={20} style={{ color: '#0c3c60' }} />
            <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>UPI IDs</h3>
          </div>
          <button onClick={addUpi} className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }} data-testid="add-upi-btn"><Plus size={13} /> Add UPI</button>
        </div>

        {settings.upi_ids.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No UPI IDs added. Add one for automatic QR code generation.</p>
        ) : (
          settings.upi_ids.map((upi, i) => (
            <div key={i} data-testid={`upi-${i}`} style={{ display: 'flex', gap: '10px', alignItems: 'end', marginBottom: '10px' }}>
              <div className="form-group" style={{ margin: 0, flex: 1 }}><label className="form-label">UPI ID</label><input value={upi.upi_id} onChange={e => updateUpi(i, 'upi_id', e.target.value)} className="form-input" placeholder="idsea@upi" /></div>
              <div className="form-group" style={{ margin: 0, flex: 1 }}><label className="form-label">Name/Label</label><input value={upi.name} onChange={e => updateUpi(i, 'name', e.target.value)} className="form-input" placeholder="IDSEA Official" /></div>
              <button onClick={() => removeUpi(i)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', marginBottom: '0' }}><Trash2 size={14} /></button>
            </div>
          ))
        )}
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>QR codes are auto-generated with the exact payment amount using the first UPI ID.</p>
      </div>
    </div>
  );
}
