import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Download, FileText, Search, Filter, X, Mail, MessageSquare, Edit2, ChevronLeft, Hotel, MapPin, CheckCircle, Send, ExternalLink, BedDouble, Plus, Trash2, Eye } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ACCOM_LABELS = { default: 'Default', free: 'Free', hotel: 'Premium Hotel', self: 'Self', none: 'None' };
const LOC_TYPES = ['Hotel', 'College', 'University', 'Guest House', 'Other'];

export default function EventRegistrations() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [filterAccom, setFilterAccom] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);
  const [accomForm, setAccomForm] = useState({ assigned_room_no: '', assigned_location: '', assigned_location_type: '', assigned_map_link: '' });
  const [showDetail, setShowDetail] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [manualModal, setManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', email: '', phone: '', qualification: '', organization: '', state: '', is_member: false, member_id: '', member_category: '', accommodation_choice: 'none', registration_fee: 0, accommodation_fee: 0, membership_fee: 0, total_amount: 0, payment_status: 'pending' });
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [selectingMember, setSelectingMember] = useState(false);

  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 4000); };

  const load = async () => {
    try {
      const [evRes, regRes] = await Promise.all([
        axios.get(`${API}/admin/events`, { headers }),
        axios.get(`${API}/admin/events/${eventId}/registrations`, { headers })
      ]);
      const ev = evRes.data.find(e => e.id === eventId);
      setEvent(ev || { title: 'Event' });
      setRegs(regRes.data);
    } catch { showToast('Failed to load data'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [eventId]);

  const filtered = useMemo(() => {
    let list = [...regs];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.phone?.includes(q));
    }
    if (filterPayment) list = list.filter(r => r.payment_status === filterPayment);
    if (filterMember === 'member') list = list.filter(r => r.is_member);
    if (filterMember === 'non_member') list = list.filter(r => !r.is_member);
    if (filterAccom) list = list.filter(r => r.accommodation_choice === filterAccom);
    if (filterCategory) list = list.filter(r => (r.member_category || r.membership_type) === filterCategory);
    return list;
  }, [regs, search, filterPayment, filterMember, filterAccom, filterCategory]);

  const stats = useMemo(() => ({
    total: regs.length,
    paid: regs.filter(r => r.payment_status === 'paid').length,
    pending: regs.filter(r => r.payment_status === 'pending').length,
    totalRevenue: regs.reduce((s, r) => s + (r.total_amount || 0), 0),
    needAccom: regs.filter(r => r.accommodation_choice && r.accommodation_choice !== 'self' && r.accommodation_choice !== 'none').length,
    assigned: regs.filter(r => r.assigned_room_no).length,
  }), [regs]);

  const updatePayment = async (id, status) => {
    await axios.put(`${API}/admin/event-registrations/${id}/payment`, { payment_status: status }, { headers });
    showToast('Payment updated'); load();
  };

  const openAccomEdit = (reg) => {
    setSelectedReg(reg);
    setAccomForm({
      assigned_room_no: reg.assigned_room_no || '',
      assigned_location: reg.assigned_location || reg.hotel_name || '',
      assigned_location_type: reg.assigned_location_type || '',
      assigned_map_link: reg.assigned_map_link || '',
    });
  };

  const saveAccom = async () => {
    if (!selectedReg) return;
    await axios.put(`${API}/admin/event-registrations/${selectedReg.id}/accommodation`, accomForm, { headers });
    showToast('Accommodation updated'); setSelectedReg(null); load();
  };

  const sendNotification = async (regId, channel) => {
    try {
      const r = await axios.post(`${API}/admin/event-registrations/${regId}/send-accommodation`, { channel }, { headers });
      if (channel === 'whatsapp' && r.data.whatsapp_url) {
        window.open(r.data.whatsapp_url, '_blank');
      }
      showToast(r.data.message); load();
    } catch (e) { showToast('Failed: ' + (e.response?.data?.detail || 'Error')); }
  };

  const sendBulk = async (channel) => {
    if (!window.confirm(`Send accommodation details to ALL assigned registrants via ${channel}?`)) return;
    try {
      const r = await axios.post(`${API}/admin/events/${eventId}/registrations/send-all-accommodation`, { channel }, { headers });
      showToast(r.data.message); load();
    } catch (e) { showToast('Failed: ' + (e.response?.data?.detail || 'Error')); }
  };

  const exportExcel = () => window.open(`${API}/admin/events/${eventId}/registrations/export?token=${token}`, '_blank');
  const exportPDF = () => window.open(`${API}/admin/events/${eventId}/registrations/export/pdf?token=${token}`, '_blank');
  const exportAccom = () => window.open(`${API}/admin/events/${eventId}/registrations/accommodation-report?token=${token}`, '_blank');

  const openEditModal = (reg) => {
    setEditModal(reg);
    setEditForm({
      name: reg.name || '', email: reg.email || '', phone: reg.phone || '',
      qualification: reg.qualification || '', organization: reg.organization || '', state: reg.state || '',
      is_member: reg.is_member || false, member_category: reg.member_category || '',
      accommodation_choice: reg.accommodation_choice || 'none', hotel_name: reg.hotel_name || '',
      registration_fee: reg.registration_fee || 0, accommodation_fee: reg.accommodation_fee || 0,
      membership_fee: reg.membership_fee || 0, total_amount: reg.total_amount || 0,
      payment_status: reg.payment_status || 'pending', payment_mode: reg.payment_mode || 'offline',
    });
  };

  const saveEdit = async () => {
    if (!editModal) return;
    try {
      const payload = { ...editForm };
      payload.total_amount = parseFloat(payload.registration_fee || 0) + parseFloat(payload.accommodation_fee || 0) + parseFloat(payload.membership_fee || 0);
      await axios.put(`${API}/admin/event-registrations/${editModal.id}`, payload, { headers });
      showToast('Registration updated'); setEditModal(null); load();
    } catch (e) { showToast('Update failed: ' + (e.response?.data?.detail || 'Error')); }
  };

  const deleteReg = async (regId, regName) => {
    if (!window.confirm(`Delete registration for "${regName}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/admin/event-registrations/${regId}`, { headers });
      showToast('Registration deleted'); load();
    } catch { showToast('Delete failed'); }
  };

  const saveManual = async () => {
    if (!manualForm.name || !manualForm.email) { showToast('Name and email required'); return; }
    try {
      const payload = { ...manualForm };
      payload.total_amount = parseFloat(payload.registration_fee || 0) + parseFloat(payload.accommodation_fee || 0) + parseFloat(payload.membership_fee || 0);
      await axios.post(`${API}/admin/events/${eventId}/register-manual`, payload, { headers });
      showToast('Registration created'); setManualModal(false);
      setManualForm({ name: '', email: '', phone: '', qualification: '', organization: '', state: '', is_member: false, member_id: '', member_category: '', accommodation_choice: 'none', registration_fee: 0, accommodation_fee: 0, membership_fee: 0, total_amount: 0, payment_status: 'pending' });
      setSelectingMember(false); setMemberSearch(''); setMemberResults([]);
      load();
    } catch (e) { showToast('Failed: ' + (e.response?.data?.detail || 'Error')); }
  };

  const searchMembers = async (q) => {
    setMemberSearch(q);
    if (q.length < 2) { setMemberResults([]); return; }
    setMemberSearching(true);
    try {
      const r = await axios.get(`${API}/admin/members`, { params: { search: q, status: 'approved' }, headers });
      setMemberResults(r.data.slice(0, 10));
    } catch { setMemberResults([]); }
    setMemberSearching(false);
  };

  const selectMember = (m) => {
    setManualForm(f => ({
      ...f,
      name: `${m.prefix || ''} ${m.name}`.trim(),
      email: m.email || '',
      phone: m.phone || '',
      qualification: m.qualification || '',
      organization: m.organization || '',
      state: m.state || m.permanent_address?.state || '',
      is_member: true,
      member_id: m.membership_id || m.id || '',
      member_category: m.membership_type || '',
    }));
    setMemberSearch('');
    setMemberResults([]);
  };

  const downloadFile = async (url, filename) => {
    try {
      const r = await axios.get(url, { headers, responseType: 'blob' });
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([r.data]));
      a.download = filename; a.click();
    } catch { showToast('Download failed'); }
  };

  if (loading) return <div className="loading-spinner" style={{ padding: '60px' }}>Loading registrations...</div>;

  const hasFilters = search || filterPayment || filterMember || filterAccom || filterCategory;
  const clearFilters = () => { setSearch(''); setFilterPayment(''); setFilterMember(''); setFilterAccom(''); setFilterCategory(''); };

  return (
    <div>
      {toast && <div className="toast-success">{toast}</div>}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/admin/events" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
          <ChevronLeft size={14} /> Back to Events
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title" data-testid="registrations-title" style={{ margin: 0 }}>{event?.title}</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{event?.date}{event?.end_date ? ` — ${event.end_date}` : ''} | {event?.venue}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setManualModal(true)} className="btn-primary" style={{ fontSize: '12px', padding: '7px 12px' }} data-testid="manual-register-btn"><Plus size={13} /> Register Participant</button>
            <button onClick={() => downloadFile(`${API}/admin/events/${eventId}/registrations/export`, 'registrations.xlsx')} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }} data-testid="export-excel"><Download size={13} /> Excel</button>
            <button onClick={() => downloadFile(`${API}/admin/events/${eventId}/registrations/export/pdf`, 'registrations.pdf')} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }} data-testid="export-pdf"><FileText size={13} /> PDF</button>
            <button onClick={() => downloadFile(`${API}/admin/events/${eventId}/registrations/accommodation-report`, 'accommodation.xlsx')} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }} data-testid="export-accom"><BedDouble size={13} /> Accommodation</button>
            <button onClick={() => sendBulk('email')} className="btn-primary" style={{ fontSize: '12px', padding: '7px 12px' }} data-testid="bulk-email"><Mail size={13} /> Email All</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total', value: stats.total, color: '#0c3c60' },
          { label: 'Paid', value: stats.paid, color: '#1e7a4d' },
          { label: 'Pending', value: stats.pending, color: '#d97706' },
          { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, color: '#0c3c60' },
          { label: 'Need Accom', value: stats.needAccom, color: '#6366f1' },
          { label: 'Assigned', value: stats.assigned, color: '#1e7a4d' },
        ].map(s => (
          <div key={s.label} className="admin-card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'Poppins' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Poppins' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ padding: '14px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} className="form-input" placeholder="Search name, email, phone" data-testid="search-input" style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }} />
          </div>
          <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="form-select" style={{ height: '36px', fontSize: '12px', minWidth: '110px' }} data-testid="filter-payment">
            <option value="">All Payments</option><option value="paid">Paid</option><option value="pending">Pending</option>
          </select>
          <select value={filterMember} onChange={e => setFilterMember(e.target.value)} className="form-select" style={{ height: '36px', fontSize: '12px', minWidth: '110px' }} data-testid="filter-member">
            <option value="">All Types</option><option value="member">Members</option><option value="non_member">Non-Members</option>
          </select>
          <select value={filterAccom} onChange={e => setFilterAccom(e.target.value)} className="form-select" style={{ height: '36px', fontSize: '12px', minWidth: '130px' }} data-testid="filter-accom">
            <option value="">All Accommodation</option><option value="default">Default</option><option value="free">Free</option><option value="hotel">Premium Hotel</option><option value="self">Self</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="form-select" style={{ height: '36px', fontSize: '12px', minWidth: '110px' }} data-testid="filter-category">
            <option value="">All Categories</option><option value="academic">Academic</option><option value="entrepreneur">Entrepreneur</option><option value="corporate">Corporate</option>
          </select>
          {hasFilters && <button onClick={clearFilters} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}><X size={12} /> Clear</button>}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" data-testid="registrations-table">
          <thead>
            <tr><th>#</th><th>Name</th><th>Phone</th><th>Category</th><th>Accommodation</th><th>Room</th><th>Total (₹)</th><th>Payment</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>No registrations found</td></tr>
            ) : filtered.map((reg, i) => (
              <tr key={reg.id} data-testid={`reg-row-${i}`}>
                <td>{i + 1}</td>
                <td>
                  <button onClick={() => setShowDetail(reg)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    <div style={{ fontWeight: 600, color: '#0c3c60', fontSize: '13px' }}>{reg.name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{reg.email}</div>
                  </button>
                </td>
                <td style={{ fontSize: '13px' }}>{reg.phone}</td>
                <td>
                  <span className={`badge badge-${reg.is_member ? 'approved' : 'pending'}`} style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                    {reg.is_member ? (reg.member_category || 'Member') : 'Non-Member'}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: '#374151' }}>{ACCOM_LABELS[reg.accommodation_choice] || reg.accommodation_choice || '-'}</span>
                  {reg.hotel_name && <div style={{ fontSize: '10px', color: '#6b7280' }}>{reg.hotel_name}</div>}
                </td>
                <td>
                  {reg.assigned_room_no ? (
                    <div>
                      <span style={{ fontWeight: 600, color: '#1e7a4d', fontSize: '13px' }}>{reg.assigned_room_no}</span>
                      {reg.accommodation_notified && <CheckCircle size={12} style={{ color: '#1e7a4d', marginLeft: '4px', verticalAlign: 'middle' }} />}
                    </div>
                  ) : (
                    reg.accommodation_choice !== 'self' && reg.accommodation_choice !== 'none' ?
                    <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>Unassigned</span> : <span style={{ color: '#9ca3af', fontSize: '11px' }}>—</span>
                  )}
                </td>
                <td style={{ fontWeight: 700, fontFamily: 'Poppins', fontSize: '13px' }}>₹{reg.total_amount}</td>
                <td>
                  {reg.payment_status === 'paid' ?
                    <span className="badge badge-approved" style={{ fontSize: '11px' }}>Paid</span> :
                    <button onClick={() => updatePayment(reg.id, 'paid')} style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>Mark Paid</button>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => setShowDetail(reg)} title="View Details" data-testid={`view-btn-${i}`}
                      style={{ background: '#f0f9ff', color: '#0c3c60', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                      <Eye size={13} />
                    </button>
                    <button onClick={() => openEditModal(reg)} title="Edit Registration" data-testid={`edit-btn-${i}`}
                      style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => deleteReg(reg.id, reg.name)} title="Delete Registration" data-testid={`delete-btn-${i}`}
                      style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                    {reg.accommodation_choice && reg.accommodation_choice !== 'self' && reg.accommodation_choice !== 'none' && (
                      <button onClick={() => openAccomEdit(reg)} title="Assign Room" data-testid={`assign-room-${i}`}
                        style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Hotel size={13} />
                      </button>
                    )}
                    {reg.assigned_room_no && (
                      <>
                        <button onClick={() => sendNotification(reg.id, 'email')} title="Email Details" data-testid={`email-btn-${i}`}
                          style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                          <Mail size={13} />
                        </button>
                        <button onClick={() => sendNotification(reg.id, 'whatsapp')} title="WhatsApp" data-testid={`whatsapp-btn-${i}`}
                          style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}>
                          <MessageSquare size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }} data-testid="detail-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Registration Details</h3>
              <button onClick={() => setShowDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
              {[
                ['Name', showDetail.name], ['Email', showDetail.email], ['Phone', showDetail.phone],
                ['Organization', showDetail.organization], ['Qualification', showDetail.qualification], ['State', showDetail.state],
                ['Member', showDetail.is_member ? `Yes (${showDetail.member_id})` : 'No'],
                ['Category', showDetail.member_category || showDetail.membership_type || '-'],
                ['Accommodation', ACCOM_LABELS[showDetail.accommodation_choice] || showDetail.accommodation_choice],
                ['Hotel/Location', showDetail.hotel_name || '-'],
                ['Registration Fee', `₹${showDetail.registration_fee}`], ['Accommodation Fee', `₹${showDetail.accommodation_fee}`],
                ['Membership Fee', `₹${showDetail.membership_fee}`], ['Total', `₹${showDetail.total_amount}`],
                ['Payment Status', showDetail.payment_status],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                  <span style={{ width: '140px', flexShrink: 0, color: '#6b7280', fontSize: '13px' }}>{k}</span>
                  <span style={{ fontWeight: 500, color: '#111827' }}>{v || '-'}</span>
                </div>
              ))}
              {showDetail.assigned_room_no && (
                <>
                  <div style={{ borderTop: '2px solid #0c3c60', marginTop: '8px', paddingTop: '12px' }}>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', margin: '0 0 8px' }}>Assigned Accommodation</h4>
                  </div>
                  {[
                    ['Room No', showDetail.assigned_room_no],
                    ['Location', showDetail.assigned_location],
                    ['Type', showDetail.assigned_location_type],
                    ['Map Link', showDetail.assigned_map_link ? <a href={showDetail.assigned_map_link} target="_blank" rel="noreferrer" style={{ color: '#1e40af' }}>{showDetail.assigned_map_link.slice(0, 40)}... <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></a> : '-'],
                    ['Notified', showDetail.accommodation_notified ? 'Yes' : 'No'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                      <span style={{ width: '140px', flexShrink: 0, color: '#6b7280', fontSize: '13px' }}>{k}</span>
                      <span style={{ fontWeight: 500, color: '#111827' }}>{v || '-'}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
              {showDetail.accommodation_choice && showDetail.accommodation_choice !== 'self' && (
                <button onClick={() => { setShowDetail(null); openAccomEdit(showDetail); }} className="btn-secondary" style={{ fontSize: '13px' }}>
                  <Hotel size={14} /> Assign Room
                </button>
              )}
              <button onClick={() => setShowDetail(null)} className="btn-primary" style={{ fontSize: '13px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Accommodation Assignment Modal */}
      {selectedReg && (
        <div className="modal-overlay" onClick={() => setSelectedReg(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }} data-testid="accom-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Assign Accommodation</h3>
              <button onClick={() => setSelectedReg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <strong>{selectedReg.name}</strong> — {selectedReg.accommodation_choice === 'hotel' ? selectedReg.hotel_name : ACCOM_LABELS[selectedReg.accommodation_choice]}
            </div>

            <div className="form-group">
              <label className="form-label">Location Type</label>
              <select value={accomForm.assigned_location_type} onChange={e => setAccomForm(f => ({ ...f, assigned_location_type: e.target.value }))} className="form-select" data-testid="accom-loc-type">
                <option value="">Select type</option>
                {LOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Location Name</label>
              <input value={accomForm.assigned_location} onChange={e => setAccomForm(f => ({ ...f, assigned_location: e.target.value }))} className="form-input" placeholder="e.g., Hotel Taj Namakkal / VCRI Guest House" data-testid="accom-location" />
            </div>
            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input value={accomForm.assigned_room_no} onChange={e => setAccomForm(f => ({ ...f, assigned_room_no: e.target.value }))} className="form-input" placeholder="e.g., 201-A" data-testid="accom-room" />
            </div>
            <div className="form-group">
              <label className="form-label">Google Maps Link (optional)</label>
              <input value={accomForm.assigned_map_link} onChange={e => setAccomForm(f => ({ ...f, assigned_map_link: e.target.value }))} className="form-input" placeholder="https://maps.google.com/..." data-testid="accom-map" />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setSelectedReg(null)} className="btn-secondary">Cancel</button>
              <button onClick={saveAccom} className="btn-primary" data-testid="save-accom-btn"><MapPin size={14} /> Save & Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Registration Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }} data-testid="edit-reg-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Edit Registration</h3>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Name *</label><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="form-input" data-testid="edit-reg-name" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Email *</label><input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="form-input" data-testid="edit-reg-email" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Phone</label><input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Organization</label><input value={editForm.organization} onChange={e => setEditForm(f => ({ ...f, organization: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Qualification</label><input value={editForm.qualification} onChange={e => setEditForm(f => ({ ...f, qualification: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">State</label><input value={editForm.state} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Category</label>
                <select value={editForm.member_category} onChange={e => setEditForm(f => ({ ...f, member_category: e.target.value }))} className="form-select">
                  <option value="">Non-Member</option><option value="academic">Academic</option><option value="entrepreneur">Entrepreneur</option><option value="corporate">Corporate</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Accommodation</label>
                <select value={editForm.accommodation_choice} onChange={e => setEditForm(f => ({ ...f, accommodation_choice: e.target.value }))} className="form-select">
                  <option value="none">None</option><option value="default">Default</option><option value="free">Free</option><option value="hotel">Premium Hotel</option><option value="self">Self</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Reg Fee (₹)</label><input type="number" value={editForm.registration_fee} onChange={e => setEditForm(f => ({ ...f, registration_fee: e.target.value }))} className="form-input" data-testid="edit-reg-fee" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Accom Fee (₹)</label><input type="number" value={editForm.accommodation_fee} onChange={e => setEditForm(f => ({ ...f, accommodation_fee: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Membership Fee (₹)</label><input type="number" value={editForm.membership_fee} onChange={e => setEditForm(f => ({ ...f, membership_fee: e.target.value }))} className="form-input" /></div>
            </div>
            <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px', marginTop: '12px', fontSize: '14px', color: '#0c3c60', fontWeight: 700 }}>
              Total: ₹{(parseFloat(editForm.registration_fee || 0) + parseFloat(editForm.accommodation_fee || 0) + parseFloat(editForm.membership_fee || 0)).toLocaleString()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Payment Status</label>
                <select value={editForm.payment_status} onChange={e => setEditForm(f => ({ ...f, payment_status: e.target.value }))} className="form-select" data-testid="edit-payment-status">
                  <option value="pending">Pending</option><option value="paid">Paid</option><option value="verification_pending">Verification Pending</option><option value="rejected">Rejected</option><option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Payment Mode</label>
                <select value={editForm.payment_mode} onChange={e => setEditForm(f => ({ ...f, payment_mode: e.target.value }))} className="form-select">
                  <option value="offline">Offline</option><option value="razorpay">Razorpay</option><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option><option value="manual">Manual</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setEditModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={saveEdit} className="btn-primary" data-testid="save-edit-reg-btn">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Registration Modal */}
      {manualModal && (
        <div className="modal-overlay" onClick={() => { setManualModal(false); setSelectingMember(false); setMemberSearch(''); setMemberResults([]); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }} data-testid="manual-reg-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Register Participant</h3>
              <button onClick={() => { setManualModal(false); setSelectingMember(false); setMemberSearch(''); setMemberResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Manually register a participant for <strong>{event?.title}</strong></p>

            {/* Member Selection Toggle */}
            <div style={{ background: selectingMember ? '#f0fdf4' : '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '16px', border: `1px solid ${selectingMember ? '#bbf7d0' : '#e5e7eb'}`, transition: 'all 0.2s' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: selectingMember ? '12px' : 0 }}>
                <input type="checkbox" checked={selectingMember} onChange={e => {
                  setSelectingMember(e.target.checked);
                  if (!e.target.checked) {
                    setMemberSearch(''); setMemberResults([]);
                    setManualForm(f => ({ ...f, is_member: false, member_id: '', member_category: '', name: '', email: '', phone: '', qualification: '', organization: '', state: '' }));
                  }
                }} style={{ width: '18px', height: '18px', accentColor: '#1e7a4d' }} data-testid="toggle-member-select" />
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: selectingMember ? '#1e7a4d' : '#374151' }}>Select from existing members</span>
              </label>
              {selectingMember && (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input value={memberSearch} onChange={e => searchMembers(e.target.value)} placeholder="Search member by name, email, or ID..." className="form-input"
                      style={{ paddingLeft: '34px', fontSize: '13px' }} data-testid="member-search-input" autoFocus />
                  </div>
                  {memberSearching && <div style={{ fontSize: '12px', color: '#9ca3af', padding: '8px 0' }}>Searching...</div>}
                  {memberResults.length > 0 && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '6px', maxHeight: '200px', overflowY: 'auto', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} data-testid="member-results-list">
                      {memberResults.map(m => (
                        <div key={m.id} onClick={() => selectMember(m)} data-testid={`member-option-${m.id}`}
                          style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          {m.photo_url ? <img src={m.photo_url.startsWith('/api') ? `${API.replace('/api', '')}${m.photo_url}` : m.photo_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0c3c60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>{m.name?.charAt(0)}</div>}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{m.prefix ? `${m.prefix} ` : ''}{m.name}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', gap: '8px' }}>
                              <span>{m.email}</span>
                              {m.membership_id && <span style={{ color: '#0c3c60', fontWeight: 600, fontFamily: 'monospace' }}>{m.membership_id}</span>}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'capitalize', fontWeight: 600 }}>{m.membership_type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {manualForm.is_member && manualForm.member_id && (
                    <div style={{ marginTop: '8px', background: '#d1fae5', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-testid="selected-member-badge">
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>Selected: {manualForm.name}</span>
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>{manualForm.member_id}</span>
                      </div>
                      <button onClick={() => { setManualForm(f => ({ ...f, is_member: false, member_id: '', member_category: '', name: '', email: '', phone: '', qualification: '', organization: '', state: '' })); setMemberSearch(''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}><X size={14} /></button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="form-label">Full Name *</label><input value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="Full name" data-testid="manual-name" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Email *</label><input value={manualForm.email} onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))} className="form-input" placeholder="Email" data-testid="manual-email" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Phone</label><input value={manualForm.phone} onChange={e => setManualForm(f => ({ ...f, phone: e.target.value }))} className="form-input" placeholder="Phone" data-testid="manual-phone" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Organization</label><input value={manualForm.organization} onChange={e => setManualForm(f => ({ ...f, organization: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Qualification</label><input value={manualForm.qualification} onChange={e => setManualForm(f => ({ ...f, qualification: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">State</label><input value={manualForm.state} onChange={e => setManualForm(f => ({ ...f, state: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Category</label>
                <select value={manualForm.member_category} onChange={e => setManualForm(f => ({ ...f, member_category: e.target.value, is_member: !!e.target.value }))} className="form-select">
                  <option value="">Non-Member</option><option value="academic">Academic</option><option value="entrepreneur">Entrepreneur</option><option value="corporate">Corporate</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Accommodation</label>
                <select value={manualForm.accommodation_choice} onChange={e => setManualForm(f => ({ ...f, accommodation_choice: e.target.value }))} className="form-select">
                  <option value="none">None</option><option value="default">Default</option><option value="free">Free</option><option value="hotel">Premium Hotel</option><option value="self">Self</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Reg Fee (₹)</label><input type="number" value={manualForm.registration_fee} onChange={e => setManualForm(f => ({ ...f, registration_fee: e.target.value }))} className="form-input" data-testid="manual-reg-fee" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Accom Fee (₹)</label><input type="number" value={manualForm.accommodation_fee} onChange={e => setManualForm(f => ({ ...f, accommodation_fee: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Membership Fee (₹)</label><input type="number" value={manualForm.membership_fee} onChange={e => setManualForm(f => ({ ...f, membership_fee: e.target.value }))} className="form-input" /></div>
            </div>
            <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px', marginTop: '12px', fontSize: '14px', color: '#0c3c60', fontWeight: 700 }}>
              Total: ₹{(parseFloat(manualForm.registration_fee || 0) + parseFloat(manualForm.accommodation_fee || 0) + parseFloat(manualForm.membership_fee || 0)).toLocaleString()}
            </div>
            <div className="form-group" style={{ marginTop: '12px' }}><label className="form-label">Payment Status</label>
              <select value={manualForm.payment_status} onChange={e => setManualForm(f => ({ ...f, payment_status: e.target.value }))} className="form-select" data-testid="manual-payment-status">
                <option value="pending">Pending</option><option value="paid">Paid</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setManualModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveManual} className="btn-primary" data-testid="save-manual-reg-btn"><Plus size={14} /> Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
