import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Download, FileText, Search, X, Mail, MessageSquare, Edit2, ChevronLeft, Hotel, MapPin, CheckCircle, ExternalLink, BedDouble, Plus, Trash2, Eye, Users, Filter, CreditCard, UserCheck, Globe, GraduationCap, User } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;

const CAT_MAP = {
  member: { label: 'IDSEA Member', color: '#1e7a4d', bg: '#d1fae5', icon: UserCheck },
  non_member: { label: 'Non-Member', color: '#d97706', bg: '#fef3c7', icon: User },
  student: { label: 'Student/JRF/SRF/RA/Retired', color: '#7c3aed', bg: '#ede9fe', icon: GraduationCap },
  international: { label: 'International', color: '#1e40af', bg: '#dbeafe', icon: Globe },
};
const ACCOM_MAP = {
  default: { label: 'Default', color: '#0c3c60' }, premium_hotel: { label: 'Premium Hotel', color: '#7c3aed' },
  self: { label: 'Self', color: '#6b7280' }, none: { label: 'None', color: '#9ca3af' },
  free: { label: 'Free', color: '#1e7a4d' }, hotel: { label: 'Premium Hotel', color: '#7c3aed' },
};
const PAY_MAP = {
  paid: { label: 'Paid', color: '#1e7a4d', bg: '#d1fae5' }, pending: { label: 'Pending', color: '#d97706', bg: '#fef3c7' },
  verification_pending: { label: 'Verifying', color: '#2563eb', bg: '#dbeafe' }, rejected: { label: 'Rejected', color: '#dc2626', bg: '#fee2e2' },
  refunded: { label: 'Refunded', color: '#6b7280', bg: '#f1f5f9' },
};
const LOC_TYPES = ['Hotel', 'College', 'University', 'Guest House', 'Other'];

export default function EventRegistrations() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccom, setFilterAccom] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [selectedReg, setSelectedReg] = useState(null);
  const [accomForm, setAccomForm] = useState({ assigned_room_no: '', assigned_location: '', assigned_location_type: '', assigned_map_link: '' });
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [manualModal, setManualModal] = useState(false);
  const [manualForm, setManualForm] = useState(initManualForm());
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [selectingMember, setSelectingMember] = useState(false);

  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 4000); };

  function initManualForm() {
    return {
      name: '', email: '', phone: '', qualification: '', organization: '',
      registration_category: 'non_member', is_member: false, member_id: '', member_category: '',
      address_line1: '', address_line2: '', district: '', address_state: '', country: 'India', pincode: '',
      college: '', university: '',
      accommodation_choice: 'none', hotel_name: '', hotel_room_type: '',
      selected_addons: [], wants_membership: false, membership_type: '',
      registration_fee: 0, accommodation_fee: 0, addon_fee: 0, membership_fee: 0, additional_persons_fee: 0,
      total_amount: 0, payment_status: 'pending', payment_mode: 'offline',
    };
  }

  const load = async () => {
    try {
      const [evRes, regRes] = await Promise.all([
        axios.get(`${API}/admin/events`, { headers }),
        axios.get(`${API}/admin/events/${eventId}/registrations`, { headers })
      ]);
      setEvent(evRes.data.find(e => e.id === eventId) || { title: 'Event' });
      setRegs(regRes.data);
    } catch { showToast('Failed to load data'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [eventId]);

  const filtered = useMemo(() => {
    let list = [...regs];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.phone?.includes(q) || r.member_id?.toLowerCase().includes(q));
    }
    if (filterPayment) list = list.filter(r => r.payment_status === filterPayment);
    if (filterCategory) list = list.filter(r => r.registration_category === filterCategory);
    if (filterAccom) list = list.filter(r => r.accommodation_choice === filterAccom);
    if (filterRoom === 'assigned') list = list.filter(r => r.assigned_room_no);
    if (filterRoom === 'unassigned') list = list.filter(r => !r.assigned_room_no && r.accommodation_choice && r.accommodation_choice !== 'self' && r.accommodation_choice !== 'none');
    return list;
  }, [regs, search, filterPayment, filterCategory, filterAccom, filterRoom]);

  const stats = useMemo(() => {
    const byCat = {};
    Object.keys(CAT_MAP).forEach(k => { byCat[k] = regs.filter(r => r.registration_category === k).length; });
    return {
      total: regs.length,
      paid: regs.filter(r => r.payment_status === 'paid').length,
      pending: regs.filter(r => r.payment_status === 'pending' || r.payment_status === 'verification_pending').length,
      totalRevenue: regs.filter(r => r.payment_status === 'paid').reduce((s, r) => s + (r.total_amount || 0), 0),
      needAccom: regs.filter(r => r.accommodation_choice && !['self', 'none'].includes(r.accommodation_choice)).length,
      assigned: regs.filter(r => r.assigned_room_no).length,
      byCat,
    };
  }, [regs]);

  const hasFilters = search || filterPayment || filterCategory || filterAccom || filterRoom;
  const clearFilters = () => { setSearch(''); setFilterPayment(''); setFilterCategory(''); setFilterAccom(''); setFilterRoom(''); };

  const updatePayment = async (id, status) => {
    try { await axios.put(`${API}/admin/event-registrations/${id}/payment`, { payment_status: status }, { headers }); showToast('Payment updated'); load(); } catch { showToast('Update failed'); }
  };
  const openAccomEdit = (reg) => {
    setSelectedReg(reg);
    setAccomForm({ assigned_room_no: reg.assigned_room_no || '', assigned_location: reg.assigned_location || reg.hotel_name || '', assigned_location_type: reg.assigned_location_type || '', assigned_map_link: reg.assigned_map_link || '' });
  };
  const saveAccom = async () => {
    if (!selectedReg) return;
    try { await axios.put(`${API}/admin/event-registrations/${selectedReg.id}/accommodation`, accomForm, { headers }); showToast('Accommodation updated'); setSelectedReg(null); load(); } catch { showToast('Update failed'); }
  };
  const sendNotification = async (regId, channel) => {
    try { const r = await axios.post(`${API}/admin/event-registrations/${regId}/send-accommodation`, { channel }, { headers }); if (channel === 'whatsapp' && r.data.whatsapp_url) window.open(r.data.whatsapp_url, '_blank'); showToast(r.data.message); load(); } catch (e) { showToast('Failed: ' + (e.response?.data?.detail || 'Error')); }
  };
  const sendBulk = async (channel) => {
    if (!window.confirm(`Send accommodation details to ALL assigned registrants via ${channel}?`)) return;
    try { const r = await axios.post(`${API}/admin/events/${eventId}/registrations/send-all-accommodation`, { channel }, { headers }); showToast(r.data.message); } catch (e) { showToast('Failed: ' + (e.response?.data?.detail || 'Error')); }
  };
  const deleteReg = async (regId, regName) => {
    if (!window.confirm(`Delete registration for "${regName}"?`)) return;
    try { await axios.delete(`${API}/admin/event-registrations/${regId}`, { headers }); showToast('Deleted'); load(); } catch { showToast('Delete failed'); }
  };

  const downloadFile = async (url, filename) => {
    try { const r = await axios.get(url, { headers, responseType: 'blob' }); const a = document.createElement('a'); a.href = window.URL.createObjectURL(new Blob([r.data])); a.download = filename; a.click(); } catch { showToast('Download failed'); }
  };

  // Edit
  const openEditModal = (reg) => {
    setEditModal(reg);
    setEditForm({
      name: reg.name || '', email: reg.email || '', phone: reg.phone || '',
      qualification: reg.qualification || '', organization: reg.organization || '',
      registration_category: reg.registration_category || 'non_member',
      is_member: reg.is_member || false, member_id: reg.member_id || '', member_category: reg.member_category || '',
      address_line1: reg.address_line1 || '', address_line2: reg.address_line2 || '', district: reg.district || '',
      address_state: reg.address_state || reg.state || '', country: reg.country || 'India', pincode: reg.pincode || '',
      college: reg.college || '', university: reg.university || '',
      accommodation_choice: reg.accommodation_choice || 'none', hotel_name: reg.hotel_name || '', hotel_room_type: reg.hotel_room_type || '',
      registration_fee: reg.registration_fee || 0, accommodation_fee: reg.accommodation_fee || 0,
      addon_fee: reg.addon_fee || 0, membership_fee: reg.membership_fee || 0, additional_persons_fee: reg.additional_persons_fee || 0,
      total_amount: reg.total_amount || 0,
      payment_status: reg.payment_status || 'pending', payment_mode: reg.payment_mode || 'offline',
    });
  };
  const editTotal = () => parseFloat(editForm.registration_fee || 0) + parseFloat(editForm.accommodation_fee || 0) + parseFloat(editForm.addon_fee || 0) + parseFloat(editForm.membership_fee || 0) + parseFloat(editForm.additional_persons_fee || 0);
  const saveEdit = async () => {
    if (!editModal) return;
    try {
      const payload = { ...editForm, total_amount: editTotal() };
      await axios.put(`${API}/admin/event-registrations/${editModal.id}`, payload, { headers });
      showToast('Updated'); setEditModal(null); load();
    } catch (e) { showToast('Failed: ' + (e.response?.data?.detail || 'Error')); }
  };

  // Manual
  const manualTotal = () => parseFloat(manualForm.registration_fee || 0) + parseFloat(manualForm.accommodation_fee || 0) + parseFloat(manualForm.addon_fee || 0) + parseFloat(manualForm.membership_fee || 0) + parseFloat(manualForm.additional_persons_fee || 0);
  const saveManual = async () => {
    if (!manualForm.name || !manualForm.email) { showToast('Name and email required'); return; }
    try {
      const payload = { ...manualForm, total_amount: manualTotal() };
      await axios.post(`${API}/admin/events/${eventId}/register-manual`, payload, { headers });
      showToast('Registered'); setManualModal(false); setManualForm(initManualForm()); setSelectingMember(false); setMemberSearch(''); setMemberResults([]); load();
    } catch (e) { showToast('Failed: ' + (e.response?.data?.detail || 'Error')); }
  };
  const searchMembers = async (q) => {
    setMemberSearch(q);
    if (q.length < 2) { setMemberResults([]); return; }
    setMemberSearching(true);
    try { const r = await axios.get(`${API}/admin/members`, { params: { search: q, status: 'approved' }, headers }); setMemberResults(r.data.slice(0, 10)); } catch { setMemberResults([]); }
    setMemberSearching(false);
  };
  const selectMember = (m) => {
    setManualForm(f => ({
      ...f, name: `${m.prefix || ''} ${m.name}`.trim(), email: m.email || '', phone: m.phone || '',
      qualification: m.qualification || '', organization: m.organization || '',
      address_state: m.permanent_address?.state || m.state || '', is_member: true,
      member_id: m.membership_id || m.id || '', member_category: m.membership_type || '',
      registration_category: 'member',
    }));
    setMemberSearch(''); setMemberResults([]);
  };

  if (loading) return <div className="loading-spinner" style={{ padding: '60px' }}>Loading registrations...</div>;

  const CatBadge = ({ cat }) => {
    const c = CAT_MAP[cat] || CAT_MAP.non_member;
    const Icon = c.icon;
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}><Icon size={11} />{c.label}</span>;
  };
  const PayBadge = ({ status }) => {
    const p = PAY_MAP[status] || PAY_MAP.pending;
    return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: p.bg, color: p.color }}>{p.label}</span>;
  };

  return (
    <div data-testid="event-registrations-page">
      {toast && <div className="toast-success">{toast}</div>}

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/admin/events" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}><ChevronLeft size={14} /> Back to Events</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: '#0c3c60', margin: 0 }} data-testid="registrations-title">{event?.title}</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{event?.date}{event?.end_date ? ` — ${event.end_date}` : ''} | {event?.venue}</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => setManualModal(true)} className="btn-primary" style={{ fontSize: '12px', padding: '8px 14px' }} data-testid="manual-register-btn"><Plus size={13} /> Register Participant</button>
            <button onClick={() => downloadFile(`${API}/admin/events/${eventId}/registrations/export`, 'registrations.xlsx')} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 12px' }} data-testid="export-excel"><Download size={13} /> Excel</button>
            <button onClick={() => downloadFile(`${API}/admin/events/${eventId}/registrations/export/pdf`, 'registrations.pdf')} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 12px' }} data-testid="export-pdf"><FileText size={13} /> PDF</button>
            <button onClick={() => downloadFile(`${API}/admin/events/${eventId}/registrations/accommodation-report`, 'accommodation.xlsx')} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 12px' }} data-testid="export-accom"><BedDouble size={13} /> Accom Report</button>
            <button onClick={() => sendBulk('email')} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 12px', background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}><Mail size={13} /> Email All</button>
            <button onClick={() => sendBulk('whatsapp')} className="btn-secondary" style={{ fontSize: '12px', padding: '8px 12px', background: '#d1fae5', color: '#065f46', border: '1px solid #86efac' }}><MessageSquare size={13} /> WhatsApp All</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Total', value: stats.total, color: '#0c3c60', bg: '#f0f9ff' },
          { label: 'Paid', value: stats.paid, color: '#1e7a4d', bg: '#f0fdf4' },
          { label: 'Pending', value: stats.pending, color: '#d97706', bg: '#fffbeb' },
          { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, color: '#0c3c60', bg: '#f0f9ff' },
          { label: 'Members', value: stats.byCat.member || 0, color: '#1e7a4d', bg: '#f0fdf4' },
          { label: 'Non-Members', value: stats.byCat.non_member || 0, color: '#d97706', bg: '#fffbeb' },
          { label: 'Students', value: stats.byCat.student || 0, color: '#7c3aed', bg: '#faf5ff' },
          { label: 'International', value: stats.byCat.international || 0, color: '#1e40af', bg: '#eff6ff' },
          { label: 'Need Accom', value: stats.needAccom, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Room Assigned', value: stats.assigned, color: '#1e7a4d', bg: '#f0fdf4' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '14px 12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: s.color, fontFamily: 'Poppins' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'Poppins', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} className="form-input" placeholder="Search name, email, phone, member ID..." data-testid="search-input" style={{ paddingLeft: '32px', height: '38px', fontSize: '13px' }} />
          </div>
          <button onClick={() => setShowFilters(v => !v)} className="btn-secondary" style={{ height: '38px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} data-testid="toggle-filters">
            <Filter size={13} /> Filters {hasFilters ? `(${[filterPayment, filterCategory, filterAccom, filterRoom].filter(Boolean).length})` : ''}
          </button>
          {hasFilters && <button onClick={clearFilters} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, height: '38px' }}><X size={12} /> Clear All</button>}
          <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: 'auto' }}>{filtered.length} of {regs.length} registrations</span>
        </div>
        {showFilters && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="form-select" style={{ height: '36px', fontSize: '12px', minWidth: '140px' }} data-testid="filter-category">
              <option value="">All Categories</option>
              <option value="member">IDSEA Member</option>
              <option value="non_member">Non-Member</option>
              <option value="student">Student/JRF/SRF/RA/Retired</option>
              <option value="international">International</option>
            </select>
            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="form-select" style={{ height: '36px', fontSize: '12px', minWidth: '120px' }} data-testid="filter-payment">
              <option value="">All Payments</option>
              <option value="paid">Paid</option><option value="pending">Pending</option><option value="verification_pending">Verifying</option>
            </select>
            <select value={filterAccom} onChange={e => setFilterAccom(e.target.value)} className="form-select" style={{ height: '36px', fontSize: '12px', minWidth: '140px' }} data-testid="filter-accom">
              <option value="">All Accommodation</option>
              <option value="default">Default</option><option value="premium_hotel">Premium Hotel</option><option value="self">Self</option><option value="none">None</option>
            </select>
            <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="form-select" style={{ height: '36px', fontSize: '12px', minWidth: '130px' }} data-testid="filter-room">
              <option value="">All Room Status</option>
              <option value="assigned">Room Assigned</option><option value="unassigned">Unassigned</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <table className="admin-table" data-testid="registrations-table" style={{ minWidth: '900px' }}>
          <thead><tr>
            <th style={{ width: '40px' }}>#</th><th>Participant</th><th>Category</th><th>Accommodation</th><th>Room</th><th style={{ textAlign: 'right' }}>Amount (₹)</th><th>Payment</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>No registrations found</td></tr>
            ) : filtered.map((reg, i) => (
              <tr key={reg.id} data-testid={`reg-row-${i}`} style={{ transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ color: '#9ca3af', fontSize: '12px' }}>{i + 1}</td>
                <td>
                  <button onClick={() => setShowDetail(reg)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    <div style={{ fontWeight: 600, color: '#0c3c60', fontSize: '13px' }}>{reg.name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{reg.phone} | {reg.email}</div>
                    {reg.member_id && <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace' }}>ID: {reg.member_id}</div>}
                  </button>
                </td>
                <td><CatBadge cat={reg.registration_category} /></td>
                <td>
                  <span style={{ fontSize: '12px', color: ACCOM_MAP[reg.accommodation_choice]?.color || '#6b7280', fontWeight: 600 }}>
                    {ACCOM_MAP[reg.accommodation_choice]?.label || reg.accommodation_choice || '—'}
                  </span>
                  {reg.hotel_name && <div style={{ fontSize: '10px', color: '#6b7280' }}>{reg.hotel_name}{reg.hotel_room_type ? ` (${reg.hotel_room_type})` : ''}</div>}
                  {(reg.additional_persons || []).length > 0 && <div style={{ fontSize: '10px', color: '#7c3aed' }}>+{reg.additional_persons.length} person(s)</div>}
                </td>
                <td>
                  {reg.assigned_room_no ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#1e7a4d', fontSize: '13px' }}>{reg.assigned_room_no}</span>
                      {reg.accommodation_notified && <CheckCircle size={12} style={{ color: '#1e7a4d' }} />}
                    </div>
                  ) : !['self', 'none'].includes(reg.accommodation_choice) ? (
                    <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>Unassigned</span>
                  ) : <span style={{ color: '#d1d5db', fontSize: '11px' }}>—</span>}
                </td>
                <td style={{ fontWeight: 700, fontFamily: 'Poppins', fontSize: '13px', textAlign: 'right', color: '#0c3c60' }}>₹{(reg.total_amount || 0).toLocaleString('en-IN')}</td>
                <td><PayBadge status={reg.payment_status} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowDetail(reg)} title="View" data-testid={`view-btn-${i}`} style={{ background: '#f0f9ff', color: '#0c3c60', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Eye size={13} /></button>
                    <button onClick={() => openEditModal(reg)} title="Edit" data-testid={`edit-btn-${i}`} style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Edit2 size={13} /></button>
                    {reg.payment_status !== 'paid' && <button onClick={() => updatePayment(reg.id, 'paid')} title="Mark Paid" style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><CreditCard size={13} /></button>}
                    {!['self', 'none'].includes(reg.accommodation_choice) && <button onClick={() => openAccomEdit(reg)} title="Assign Room" data-testid={`assign-room-${i}`} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Hotel size={13} /></button>}
                    {reg.assigned_room_no && <>
                      <button onClick={() => sendNotification(reg.id, 'email')} title="Email" style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Mail size={13} /></button>
                      <button onClick={() => sendNotification(reg.id, 'whatsapp')} title="WhatsApp" style={{ background: '#d1fae5', color: '#065f46', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><MessageSquare size={13} /></button>
                    </>}
                    <button onClick={() => deleteReg(reg.id, reg.name)} title="Delete" data-testid={`delete-btn-${i}`} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========== DETAIL MODAL ========== */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: 0 }} data-testid="detail-modal">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Registration Details</h3>
              <button onClick={() => setShowDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {/* Category & Status */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <CatBadge cat={showDetail.registration_category} />
                <PayBadge status={showDetail.payment_status} />
                {showDetail.wants_membership && <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#faf5ff', color: '#7c3aed' }}>+ Membership</span>}
              </div>

              {/* Sections */}
              <Section title="Personal Information">
                <Row label="Name" value={showDetail.name} />
                <Row label="Email" value={showDetail.email} />
                <Row label="Phone" value={showDetail.phone} />
                <Row label="Qualification" value={showDetail.qualification} />
                <Row label="Organization" value={showDetail.organization} />
                {showDetail.is_member && <Row label="Member ID" value={showDetail.member_id} />}
                {showDetail.is_member && <Row label="Member Type" value={showDetail.member_category} capitalize />}
              </Section>

              {/* Address */}
              {(showDetail.address_line1 || showDetail.address_state) && (
                <Section title="Address">
                  {showDetail.address_line1 && <Row label="Address" value={`${showDetail.address_line1}${showDetail.address_line2 ? ', ' + showDetail.address_line2 : ''}`} />}
                  {showDetail.district && <Row label="District" value={showDetail.district} />}
                  {(showDetail.address_state || showDetail.state) && <Row label="State" value={showDetail.address_state || showDetail.state} />}
                  {showDetail.country && showDetail.country !== 'India' && <Row label="Country" value={showDetail.country} />}
                  {showDetail.pincode && <Row label="Pincode/Postal Code" value={showDetail.pincode} />}
                </Section>
              )}

              {/* Student/College */}
              {(showDetail.college || showDetail.university) && (
                <Section title="College / University">
                  {showDetail.college && <Row label="College" value={showDetail.college} />}
                  {showDetail.university && <Row label="University" value={showDetail.university} />}
                </Section>
              )}

              {/* Documents */}
              {(showDetail.identity_proof_url || showDetail.bonafide_cert_url) && (
                <Section title="Uploaded Documents">
                  {showDetail.identity_proof_url && <Row label="Identity Proof" value={<a href={`${BACKEND}${showDetail.identity_proof_url}`} target="_blank" rel="noreferrer" style={{ color: '#1e40af', fontWeight: 600, fontSize: '13px' }}>View PDF <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /></a>} />}
                  {showDetail.bonafide_cert_url && <Row label="Bonafide Certificate" value={<a href={`${BACKEND}${showDetail.bonafide_cert_url}`} target="_blank" rel="noreferrer" style={{ color: '#1e40af', fontWeight: 600, fontSize: '13px' }}>View PDF <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /></a>} />}
                </Section>
              )}

              {/* Accommodation */}
              <Section title="Accommodation">
                <Row label="Choice" value={ACCOM_MAP[showDetail.accommodation_choice]?.label || showDetail.accommodation_choice || 'None'} />
                {showDetail.hotel_name && <Row label="Hotel" value={showDetail.hotel_name} />}
                {showDetail.hotel_room_type && <Row label="Room Type" value={showDetail.hotel_room_type} />}
                {showDetail.hotel_base_amount > 0 && <Row label="Hotel Amount" value={`₹${showDetail.hotel_base_amount}`} />}
                {showDetail.hotel_tax_amount > 0 && <Row label="Hotel Tax" value={`₹${showDetail.hotel_tax_amount} (${showDetail.hotel_tax_percent || 0}%)`} />}
              </Section>

              {/* Additional Persons */}
              {(showDetail.additional_persons || []).length > 0 && (
                <Section title={`Additional Persons (${showDetail.additional_persons.length})`}>
                  {showDetail.additional_persons.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>{idx + 1}. {p.name}</span>
                      <span style={{ color: '#6b7280' }}>Age: {p.age || '-'}</span>
                      <span style={{ color: '#6b7280' }}>Mobile: {p.mobile || '-'}</span>
                    </div>
                  ))}
                  {showDetail.additional_persons_fee > 0 && <Row label="Additional Persons Fee" value={`₹${showDetail.additional_persons_fee}`} />}
                </Section>
              )}

              {/* Add-ons */}
              {(showDetail.selected_addons || []).length > 0 && (
                <Section title="Selected Add-ons">
                  {showDetail.selected_addons.map((a, i) => <div key={i} style={{ padding: '4px 0', fontSize: '13px', color: '#374151' }}>{a}</div>)}
                  {showDetail.addon_fee > 0 && <Row label="Add-on Fee" value={`₹${showDetail.addon_fee}`} />}
                </Section>
              )}

              {/* Membership */}
              {showDetail.wants_membership && (
                <Section title="Membership Registration">
                  <Row label="Type" value={showDetail.membership_type} capitalize />
                  <Row label="Fee" value={`₹${showDetail.membership_fee || 0}`} />
                </Section>
              )}

              {/* Fee Breakdown */}
              <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '16px', marginTop: '16px', border: '1px solid #bae6fd' }}>
                <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0c3c60', margin: '0 0 10px' }}>Fee Breakdown</h4>
                <FeeRow label="Registration Fee" amount={showDetail.registration_fee} />
                <FeeRow label="Accommodation Fee" amount={showDetail.accommodation_fee} />
                {showDetail.additional_persons_fee > 0 && <FeeRow label="Additional Persons" amount={showDetail.additional_persons_fee} />}
                {showDetail.addon_fee > 0 && <FeeRow label="Add-ons" amount={showDetail.addon_fee} />}
                {showDetail.membership_fee > 0 && <FeeRow label="Membership" amount={showDetail.membership_fee} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0c3c60', paddingTop: '8px', marginTop: '8px' }}>
                  <span style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#0c3c60' }}>Total</span>
                  <span style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '18px', color: '#0c3c60' }}>₹{(showDetail.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#6b7280' }}>Payment: <strong>{showDetail.payment_mode || 'offline'}</strong></span>
                  <PayBadge status={showDetail.payment_status} />
                </div>
              </div>

              {/* Assigned Accommodation */}
              {showDetail.assigned_room_no && (
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '16px', marginTop: '12px', border: '1px solid #bbf7d0' }}>
                  <h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#065f46', margin: '0 0 10px' }}>Assigned Accommodation</h4>
                  <Row label="Room No" value={showDetail.assigned_room_no} />
                  <Row label="Location" value={showDetail.assigned_location} />
                  <Row label="Type" value={showDetail.assigned_location_type} />
                  {showDetail.assigned_map_link && <Row label="Map" value={<a href={showDetail.assigned_map_link} target="_blank" rel="noreferrer" style={{ color: '#1e40af' }}>{showDetail.assigned_map_link.slice(0, 40)}... <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /></a>} />}
                  <Row label="Notified" value={showDetail.accommodation_notified ? 'Yes' : 'No'} />
                </div>
              )}
            </div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'white' }}>
              {!['self', 'none'].includes(showDetail.accommodation_choice) && <button onClick={() => { setShowDetail(null); openAccomEdit(showDetail); }} className="btn-secondary" style={{ fontSize: '13px' }}><Hotel size={14} /> Assign Room</button>}
              <button onClick={() => { setShowDetail(null); openEditModal(showDetail); }} className="btn-secondary" style={{ fontSize: '13px' }}><Edit2 size={14} /> Edit</button>
              <button onClick={() => setShowDetail(null)} className="btn-primary" style={{ fontSize: '13px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== ACCOMMODATION MODAL ========== */}
      {selectedReg && (
        <div className="modal-overlay" onClick={() => setSelectedReg(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }} data-testid="accom-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Assign Accommodation</h3>
              <button onClick={() => setSelectedReg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <strong>{selectedReg.name}</strong> — {ACCOM_MAP[selectedReg.accommodation_choice]?.label}{selectedReg.hotel_name ? ` (${selectedReg.hotel_name})` : ''}
            </div>
            <div className="form-group"><label className="form-label">Location Type</label>
              <select value={accomForm.assigned_location_type} onChange={e => setAccomForm(f => ({ ...f, assigned_location_type: e.target.value }))} className="form-select" data-testid="accom-loc-type">
                <option value="">Select type</option>{LOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Location Name</label><input value={accomForm.assigned_location} onChange={e => setAccomForm(f => ({ ...f, assigned_location: e.target.value }))} className="form-input" placeholder="e.g., Hotel Taj" data-testid="accom-location" /></div>
            <div className="form-group"><label className="form-label">Room Number</label><input value={accomForm.assigned_room_no} onChange={e => setAccomForm(f => ({ ...f, assigned_room_no: e.target.value }))} className="form-input" placeholder="e.g., 201-A" data-testid="accom-room" /></div>
            <div className="form-group"><label className="form-label">Google Maps Link</label><input value={accomForm.assigned_map_link} onChange={e => setAccomForm(f => ({ ...f, assigned_map_link: e.target.value }))} className="form-input" placeholder="https://maps.google.com/..." data-testid="accom-map" /></div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setSelectedReg(null)} className="btn-secondary">Cancel</button>
              <button onClick={saveAccom} className="btn-primary" data-testid="save-accom-btn"><MapPin size={14} /> Save & Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== EDIT MODAL ========== */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '660px', maxHeight: '90vh', overflowY: 'auto' }} data-testid="edit-reg-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Edit Registration</h3>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Name *</label><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="form-input" data-testid="edit-reg-name" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Email *</label><input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Phone</label><input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Organization</label><input value={editForm.organization} onChange={e => setEditForm(f => ({ ...f, organization: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Category</label>
                <select value={editForm.registration_category} onChange={e => setEditForm(f => ({ ...f, registration_category: e.target.value }))} className="form-select">
                  <option value="member">IDSEA Member</option><option value="non_member">Non-Member</option><option value="student">Student/JRF/SRF/RA/Retired</option><option value="international">International</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Accommodation</label>
                <select value={editForm.accommodation_choice} onChange={e => setEditForm(f => ({ ...f, accommodation_choice: e.target.value }))} className="form-select">
                  <option value="none">None</option><option value="default">Default</option><option value="premium_hotel">Premium Hotel</option><option value="self">Self</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Address Line 1</label><input value={editForm.address_line1} onChange={e => setEditForm(f => ({ ...f, address_line1: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">State</label><input value={editForm.address_state} onChange={e => setEditForm(f => ({ ...f, address_state: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Pincode</label><input value={editForm.pincode} onChange={e => setEditForm(f => ({ ...f, pincode: e.target.value }))} className="form-input" /></div>
              {editForm.registration_category === 'international' && <div className="form-group" style={{ margin: 0 }}><label className="form-label">Country</label><input value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} className="form-input" /></div>}
              {editForm.registration_category === 'student' && <div className="form-group" style={{ margin: 0 }}><label className="form-label">College</label><input value={editForm.college} onChange={e => setEditForm(f => ({ ...f, college: e.target.value }))} className="form-input" /></div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label" style={{ fontSize: '11px' }}>Reg Fee</label><input type="number" value={editForm.registration_fee} onChange={e => setEditForm(f => ({ ...f, registration_fee: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label" style={{ fontSize: '11px' }}>Accom Fee</label><input type="number" value={editForm.accommodation_fee} onChange={e => setEditForm(f => ({ ...f, accommodation_fee: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label" style={{ fontSize: '11px' }}>Add-on Fee</label><input type="number" value={editForm.addon_fee} onChange={e => setEditForm(f => ({ ...f, addon_fee: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label" style={{ fontSize: '11px' }}>Membership</label><input type="number" value={editForm.membership_fee} onChange={e => setEditForm(f => ({ ...f, membership_fee: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label" style={{ fontSize: '11px' }}>Add. Persons</label><input type="number" value={editForm.additional_persons_fee} onChange={e => setEditForm(f => ({ ...f, additional_persons_fee: e.target.value }))} className="form-input" /></div>
            </div>
            <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px', marginTop: '10px', fontSize: '14px', color: '#0c3c60', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
              <span>Total:</span><span>₹{editTotal().toLocaleString('en-IN')}</span>
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

      {/* ========== MANUAL REGISTRATION MODAL ========== */}
      {manualModal && (
        <div className="modal-overlay" onClick={() => { setManualModal(false); setSelectingMember(false); setMemberSearch(''); setMemberResults([]); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '660px', maxHeight: '90vh', overflowY: 'auto' }} data-testid="manual-reg-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Register Participant</h3>
              <button onClick={() => { setManualModal(false); setSelectingMember(false); setMemberSearch(''); setMemberResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            {/* Member Selector */}
            <div style={{ background: selectingMember ? '#f0fdf4' : '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '16px', border: `1px solid ${selectingMember ? '#bbf7d0' : '#e5e7eb'}` }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: selectingMember ? '12px' : 0 }}>
                <input type="checkbox" checked={selectingMember} onChange={e => {
                  setSelectingMember(e.target.checked);
                  if (!e.target.checked) { setMemberSearch(''); setMemberResults([]); setManualForm(f => ({ ...f, ...initManualForm(), registration_category: 'non_member' })); }
                }} style={{ width: '18px', height: '18px', accentColor: '#1e7a4d' }} data-testid="toggle-member-select" />
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: selectingMember ? '#1e7a4d' : '#374151' }}>Select from existing members</span>
              </label>
              {selectingMember && (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input value={memberSearch} onChange={e => searchMembers(e.target.value)} placeholder="Search by name, email, or ID..." className="form-input" style={{ paddingLeft: '34px', fontSize: '13px' }} data-testid="member-search-input" autoFocus />
                  </div>
                  {memberSearching && <div style={{ fontSize: '12px', color: '#9ca3af', padding: '8px 0' }}>Searching...</div>}
                  {memberResults.length > 0 && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '6px', maxHeight: '200px', overflowY: 'auto', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} data-testid="member-results-list">
                      {memberResults.map(m => (
                        <div key={m.id} onClick={() => selectMember(m)} data-testid={`member-option-${m.id}`}
                          style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0c3c60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>{m.name?.charAt(0)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{m.prefix ? `${m.prefix} ` : ''}{m.name}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{m.email} {m.membership_id && <span style={{ color: '#0c3c60', fontWeight: 600, fontFamily: 'monospace' }}>| {m.membership_id}</span>}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {manualForm.is_member && manualForm.member_id && (
                    <div style={{ marginTop: '8px', background: '#d1fae5', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-testid="selected-member-badge">
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>Selected: {manualForm.name} <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#6b7280' }}>{manualForm.member_id}</span></span>
                      <button onClick={() => { setManualForm(f => ({ ...f, ...initManualForm() })); setMemberSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}><X size={14} /></button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Full Name *</label><input value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} className="form-input" data-testid="manual-name" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Email *</label><input value={manualForm.email} onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))} className="form-input" data-testid="manual-email" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Phone</label><input value={manualForm.phone} onChange={e => setManualForm(f => ({ ...f, phone: e.target.value }))} className="form-input" data-testid="manual-phone" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Category</label>
                <select value={manualForm.registration_category} onChange={e => setManualForm(f => ({ ...f, registration_category: e.target.value, is_member: e.target.value === 'member' }))} className="form-select" data-testid="manual-category">
                  <option value="member">IDSEA Member</option><option value="non_member">Non-Member</option><option value="student">Student/JRF/SRF/RA/Retired</option><option value="international">International</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Organization</label><input value={manualForm.organization} onChange={e => setManualForm(f => ({ ...f, organization: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Qualification</label><input value={manualForm.qualification} onChange={e => setManualForm(f => ({ ...f, qualification: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Address Line 1</label><input value={manualForm.address_line1} onChange={e => setManualForm(f => ({ ...f, address_line1: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">State</label><input value={manualForm.address_state} onChange={e => setManualForm(f => ({ ...f, address_state: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Pincode</label><input value={manualForm.pincode} onChange={e => setManualForm(f => ({ ...f, pincode: e.target.value }))} className="form-input" /></div>
              {manualForm.registration_category === 'international' && <div className="form-group" style={{ margin: 0 }}><label className="form-label">Country</label><input value={manualForm.country} onChange={e => setManualForm(f => ({ ...f, country: e.target.value }))} className="form-input" /></div>}
              {manualForm.registration_category === 'student' && <div className="form-group" style={{ margin: 0 }}><label className="form-label">College</label><input value={manualForm.college} onChange={e => setManualForm(f => ({ ...f, college: e.target.value }))} className="form-input" /></div>}
              <div className="form-group" style={{ margin: 0 }}><label className="form-label">Accommodation</label>
                <select value={manualForm.accommodation_choice} onChange={e => setManualForm(f => ({ ...f, accommodation_choice: e.target.value }))} className="form-select">
                  <option value="none">None</option><option value="default">Default</option><option value="premium_hotel">Premium Hotel</option><option value="self">Self</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label" style={{ fontSize: '11px' }}>Reg Fee</label><input type="number" value={manualForm.registration_fee} onChange={e => setManualForm(f => ({ ...f, registration_fee: e.target.value }))} className="form-input" data-testid="manual-reg-fee" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label" style={{ fontSize: '11px' }}>Accom Fee</label><input type="number" value={manualForm.accommodation_fee} onChange={e => setManualForm(f => ({ ...f, accommodation_fee: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label" style={{ fontSize: '11px' }}>Add-on Fee</label><input type="number" value={manualForm.addon_fee} onChange={e => setManualForm(f => ({ ...f, addon_fee: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label" style={{ fontSize: '11px' }}>Membership</label><input type="number" value={manualForm.membership_fee} onChange={e => setManualForm(f => ({ ...f, membership_fee: e.target.value }))} className="form-input" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="form-label" style={{ fontSize: '11px' }}>Add. Persons</label><input type="number" value={manualForm.additional_persons_fee} onChange={e => setManualForm(f => ({ ...f, additional_persons_fee: e.target.value }))} className="form-input" /></div>
            </div>
            <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px', marginTop: '10px', fontSize: '14px', color: '#0c3c60', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
              <span>Total:</span><span>₹{manualTotal().toLocaleString('en-IN')}</span>
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

// Helper components
function Section({ title, children }) {
  return (
    <div style={{ marginTop: '16px' }}>
      <h4 style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 700, color: '#0c3c60', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>{children}</div>
    </div>
  );
}

function Row({ label, value, capitalize }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
      <span style={{ width: '160px', flexShrink: 0, color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 500, color: '#111827', textTransform: capitalize ? 'capitalize' : 'none' }}>{value}</span>
    </div>
  );
}

function FeeRow({ label, amount }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#0c3c60' }}>₹{(amount || 0).toLocaleString('en-IN')}</span>
    </div>
  );
}
