import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, X, IndianRupee, Search, CheckCircle, XCircle, Edit3, Trash2, RotateCcw, Eye, Filter, CreditCard, QrCode, Building2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_STYLES = {
  paid: { bg: '#d1fae5', color: '#065f46', label: 'Paid' },
  pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  verification_pending: { bg: '#dbeafe', color: '#1e40af', label: 'Verification Pending' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
  refunded: { bg: '#f3e8ff', color: '#6b21a8', label: 'Refunded' },
};

const METHOD_ICONS = {
  razorpay: CreditCard, upi: QrCode, bank_transfer: Building2, manual: IndianRupee,
};

const METHOD_LABELS = {
  razorpay: 'Razorpay', upi: 'UPI', bank_transfer: 'Bank Transfer', manual: 'Manual',
};

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [refundModal, setRefundModal] = useState(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [form, setForm] = useState({ member_name: '', member_email: '', membership_type: 'academic', amount: '', payment_method: 'manual', purpose: 'membership', notes: '' });
  const [editForm, setEditForm] = useState({});
  const [refundNotes, setRefundNotes] = useState('');
  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    try {
      const r = await axios.get(`${API}/admin/payments`, { headers });
      setPayments(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    try {
      await axios.post(`${API}/admin/payments/manual`, { ...form, amount: parseFloat(form.amount) }, { headers });
      showToast('Payment recorded'); setShowAddModal(false); load();
      setForm({ member_name: '', member_email: '', membership_type: 'academic', amount: '', payment_method: 'manual', purpose: 'membership', notes: '' });
    } catch { showToast('Error recording payment'); }
  };

  const handleVerify = async (paymentId, action) => {
    try {
      await axios.put(`${API}/admin/payments/${paymentId}/verify-utr`, { action }, { headers });
      showToast(action === 'approve' ? 'Payment approved!' : 'Payment rejected');
      load();
    } catch { showToast('Action failed'); }
  };

  const handleEdit = async () => {
    if (!editModal) return;
    try {
      await axios.put(`${API}/admin/payments/${editModal.id}`, editForm, { headers });
      showToast('Payment updated'); setEditModal(null); load();
    } catch { showToast('Update failed'); }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Delete this payment? This will reset linked registration/membership status.')) return;
    try {
      await axios.delete(`${API}/admin/payments/${paymentId}`, { headers });
      showToast('Payment deleted'); load();
    } catch { showToast('Delete failed'); }
  };

  const handleRefund = async () => {
    if (!refundModal) return;
    try {
      await axios.post(`${API}/admin/payments/${refundModal.id}/refund`, { notes: refundNotes }, { headers });
      showToast('Payment refunded'); setRefundModal(null); setRefundNotes(''); load();
    } catch { showToast('Refund failed'); }
  };

  const filtered = payments.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (p.member_name || '').toLowerCase().includes(s) || (p.member_email || '').toLowerCase().includes(s) ||
        (p.utr_number || '').toLowerCase().includes(s) || (p.razorpay_payment_id || '').toLowerCase().includes(s) || (p.id || '').toLowerCase().includes(s);
    }
    return true;
  });

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingVerification = payments.filter(p => p.status === 'verification_pending').length;
  const refundedTotal = payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + (p.amount || 0), 0);

  const StatusBadge = ({ status }) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>{s.label}</span>;
  };

  const MethodBadge = ({ method }) => {
    const Icon = METHOD_ICONS[method] || IndianRupee;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#374151', fontWeight: 600 }}>
        <Icon size={13} /> {METHOD_LABELS[method] || method}
      </span>
    );
  };

  return (
    <div>
      {toast && <div className="toast-success">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title" data-testid="payments-title">Payment Management</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary" data-testid="add-payment-btn"><Plus size={16} /> Record Payment</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: '#1e7a4d', bg: '#d1fae5' },
          { label: 'Total Payments', value: payments.length, color: '#0c3c60', bg: '#dbeafe' },
          { label: 'Awaiting Verification', value: pendingVerification, color: '#1e40af', bg: '#dbeafe' },
          { label: 'Paid', value: payments.filter(p => p.status === 'paid').length, color: '#1e7a4d', bg: '#d1fae5' },
          { label: 'Refunded', value: `₹${refundedTotal.toLocaleString()}`, color: '#6b21a8', bg: '#f3e8ff' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card">
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <IndianRupee size={16} style={{ color }} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color, fontFamily: 'Poppins', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, UTR, ID..." className="form-input"
            style={{ paddingLeft: '34px', height: '38px', fontSize: '13px' }} data-testid="payment-search" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select" style={{ width: 'auto', height: '38px', fontSize: '13px' }} data-testid="status-filter">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="verification_pending">Verification Pending</option>
          <option value="rejected">Rejected</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="form-select" style={{ width: 'auto', height: '38px', fontSize: '13px' }} data-testid="method-filter">
          <option value="all">All Methods</option>
          <option value="razorpay">Razorpay</option>
          <option value="upi">UPI</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" data-testid="payments-table">
          <thead>
            <tr>
              <th>Payer</th>
              <th>Purpose</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Transaction ID</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No payments found</td></tr>
                : filtered.map(p => (
                  <tr key={p.id} data-testid={`payment-row-${p.id}`}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{p.member_name || 'N/A'}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.member_email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{(p.purpose || 'membership').replace('_', ' ')}</span>
                      {p.membership_type && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.membership_type}</div>}
                    </td>
                    <td style={{ fontWeight: 700, color: p.status === 'refunded' ? '#6b21a8' : '#1e7a4d', fontFamily: 'Poppins', whiteSpace: 'nowrap' }}>
                      {p.status === 'refunded' ? <s>₹{p.amount?.toLocaleString()}</s> : `₹${p.amount?.toLocaleString()}`}
                    </td>
                    <td><MethodBadge method={p.payment_method} /></td>
                    <td style={{ fontSize: '12px', maxWidth: '200px' }}>
                      {p.payment_method === 'razorpay' ? (
                        <div>
                          {p.razorpay_payment_id && <div style={{ color: '#1e40af', fontWeight: 600 }} title={p.razorpay_payment_id}>{p.razorpay_payment_id.substring(0, 18)}...</div>}
                          {p.razorpay_order_id && <div style={{ color: '#9ca3af', fontSize: '10px' }}>Order: {p.razorpay_order_id.substring(0, 18)}</div>}
                        </div>
                      ) : p.utr_number ? (
                        <span style={{ color: '#0c3c60', fontWeight: 600 }}>{p.utr_number}</span>
                      ) : <span style={{ color: '#d1d5db' }}>-</span>}
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* View */}
                        <button onClick={() => setDetailModal(p)} title="View Details" data-testid={`view-${p.id}`}
                          style={{ background: '#f0f9ff', color: '#0c3c60', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                          <Eye size={13} />
                        </button>
                        {/* Approve/Deny for verification_pending */}
                        {p.status === 'verification_pending' && (
                          <>
                            <button onClick={() => handleVerify(p.id, 'approve')} title="Approve" data-testid={`approve-${p.id}`}
                              style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                              <CheckCircle size={13} />
                            </button>
                            <button onClick={() => handleVerify(p.id, 'reject')} title="Reject" data-testid={`reject-${p.id}`}
                              style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                        {/* Edit */}
                        {p.status !== 'refunded' && (
                          <button onClick={() => { setEditModal(p); setEditForm({ utr_number: p.utr_number || '', notes: p.notes || '', member_name: p.member_name || '', member_email: p.member_email || '', amount: p.amount || 0 }); }}
                            title="Edit" data-testid={`edit-${p.id}`}
                            style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                            <Edit3 size={13} />
                          </button>
                        )}
                        {/* Refund (only for paid) */}
                        {p.status === 'paid' && (
                          <button onClick={() => { setRefundModal(p); setRefundNotes(''); }} title="Refund" data-testid={`refund-${p.id}`}
                            style={{ background: '#f3e8ff', color: '#6b21a8', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                            <RotateCcw size={13} />
                          </button>
                        )}
                        {/* Delete */}
                        <button onClick={() => handleDelete(p.id)} title="Delete" data-testid={`delete-${p.id}`}
                          style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Payment Details</h2>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
              {[
                ['Payment ID', detailModal.id],
                ['Payer', detailModal.member_name],
                ['Email', detailModal.member_email],
                ['Purpose', (detailModal.purpose || 'membership').replace('_', ' ')],
                ['Membership Type', detailModal.membership_type],
                ['Amount', `₹${detailModal.amount?.toLocaleString()}`],
                ['Method', METHOD_LABELS[detailModal.payment_method] || detailModal.payment_method],
                ['Status', detailModal.status],
                ...(detailModal.razorpay_order_id ? [['Razorpay Order ID', detailModal.razorpay_order_id]] : []),
                ...(detailModal.razorpay_payment_id ? [['Razorpay Payment ID', detailModal.razorpay_payment_id]] : []),
                ...(detailModal.utr_number ? [['UTR / Reference', detailModal.utr_number]] : []),
                ...(detailModal.event_registration_id ? [['Event Registration ID', detailModal.event_registration_id]] : []),
                ...(detailModal.member_id ? [['Member ID', detailModal.member_id]] : []),
                ...(detailModal.refund_status ? [['Refund Status', detailModal.refund_status]] : []),
                ...(detailModal.refund_date ? [['Refund Date', new Date(detailModal.refund_date).toLocaleDateString('en-IN')]] : []),
                ...(detailModal.notes ? [['Notes', detailModal.notes]] : []),
                ['Created', detailModal.created_at ? new Date(detailModal.created_at).toLocaleString('en-IN') : '-'],
              ].map(([label, val]) => val ? (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{label}</span>
                  <strong style={{ color: '#111827', fontSize: '13px', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{val}</strong>
                </div>
              ) : null)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setDetailModal(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Edit Payment</h2>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div className="form-group"><label className="form-label">Payer Name</label><input value={editForm.member_name} onChange={e => setEditForm(f => ({ ...f, member_name: e.target.value }))} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Email</label><input value={editForm.member_email} onChange={e => setEditForm(f => ({ ...f, member_email: e.target.value }))} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Amount (₹)</label><input type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} className="form-input" /></div>
            <div className="form-group"><label className="form-label">UTR / Transaction Reference</label><input value={editForm.utr_number} onChange={e => setEditForm(f => ({ ...f, utr_number: e.target.value }))} className="form-input" placeholder="Enter correct UTR" data-testid="edit-utr" /></div>
            <div className="form-group"><label className="form-label">Notes</label><textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="form-textarea" rows={2} placeholder="Admin notes..." /></div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setEditModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleEdit} className="btn-primary" data-testid="save-edit-btn">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#6b21a8', margin: 0 }}>Refund Payment</h2>
              <button onClick={() => setRefundModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ background: '#f3e8ff', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#374151' }}><strong>{refundModal.member_name}</strong></div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Amount: <strong style={{ color: '#6b21a8' }}>₹{refundModal.amount?.toLocaleString()}</strong></div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Method: {METHOD_LABELS[refundModal.payment_method] || refundModal.payment_method}</div>
            </div>
            <div className="form-group"><label className="form-label">Refund Notes</label><textarea value={refundNotes} onChange={e => setRefundNotes(e.target.value)} className="form-textarea" rows={2} placeholder="Reason for refund..." data-testid="refund-notes" /></div>
            <p style={{ fontSize: '12px', color: '#991b1b', marginBottom: '12px' }}>This will mark the payment as refunded and update linked event/membership registration status.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRefundModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleRefund} className="btn-primary" data-testid="confirm-refund-btn" style={{ background: '#6b21a8' }}>Confirm Refund</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Payment Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Record Manual Payment</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            {[['member_name', 'Payer Name', 'text'], ['member_email', 'Email', 'email'], ['amount', 'Amount (₹)', 'number']].map(([k, label, type]) => (
              <div key={k} className="form-group">
                <label className="form-label">{label}</label>
                <input type={type} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="form-input" required />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Purpose</label>
                <select value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} className="form-select">
                  <option value="membership">Membership</option>
                  <option value="event_registration">Event Registration</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Membership Type</label>
                <select value={form.membership_type} onChange={e => setForm({ ...form, membership_type: e.target.value })} className="form-select">
                  <option value="academic">Academic</option>
                  <option value="entrepreneur">Entrepreneur</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Notes (Optional)</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="form-textarea" rows={2} placeholder="Payment notes..." /></div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAdd} className="btn-primary" data-testid="save-payment-btn">Save Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
