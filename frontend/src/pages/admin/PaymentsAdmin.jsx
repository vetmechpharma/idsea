import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, X, IndianRupee } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ member_name: '', member_email: '', membership_type: 'academic', amount: '', payment_method: 'manual' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => { axios.get(`${API}/admin/payments`).then(r => { setPayments(r.data); setLoading(false); }); };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    try {
      await axios.post(`${API}/admin/payments/manual`, { ...form, amount: parseFloat(form.amount) });
      showToast('Payment recorded'); setShowModal(false); load();
    } catch (e) { showToast('Error recording payment'); }
  };

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const pending = payments.filter(p => p.status === 'pending').length;

  return (
    <div>
      {toast && <div className="toast-success">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Payment Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary" data-testid="add-payment-btn">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: '#1e7a4d', bg: '#d1fae5' },
          { label: 'Total Payments', value: payments.length, color: '#0c3c60', bg: '#dbeafe' },
          { label: 'Pending', value: pending, color: '#d97706', bg: '#fef3c7' },
          { label: 'Paid', value: payments.filter(p => p.status === 'paid').length, color: '#1e7a4d', bg: '#d1fae5' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <IndianRupee size={18} style={{ color }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'Poppins', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontFamily: 'Inter' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" data-testid="payments-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Razorpay Order</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading...</td></tr>
              : payments.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No payments yet</td></tr>
                : payments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{p.member_name || 'N/A'}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.member_email}</div>
                    </td>
                    <td><span className={`badge badge-${p.membership_type}`}>{p.membership_type || '-'}</span></td>
                    <td style={{ fontWeight: 700, color: '#1e7a4d', fontFamily: 'Poppins' }}>₹{p.amount?.toLocaleString()}</td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>{p.payment_method}</td>
                    <td style={{ fontSize: '11px', color: '#9ca3af' }}>{p.razorpay_order_id || '-'}</td>
                    <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                    <td style={{ fontSize: '12px', color: '#9ca3af' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '-'}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Record Manual Payment</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            {[['member_name', 'Member Name', 'text'], ['member_email', 'Member Email', 'email'], ['amount', 'Amount (₹)', 'number']].map(([k, label, type]) => (
              <div key={k} className="form-group">
                <label className="form-label">{label}</label>
                <input type={type} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="form-input" required />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Membership Type</label>
              <select value={form.membership_type} onChange={e => setForm({ ...form, membership_type: e.target.value })} className="form-select">
                <option value="academic">Academic</option>
                <option value="entrepreneur">Entrepreneur</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAdd} className="btn-primary" data-testid="save-payment-btn">Save Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
