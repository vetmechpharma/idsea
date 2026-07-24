import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit3, Trash2, Key, Shield, ShieldCheck, ShieldAlert, Users, X, Save, Eye, EyeOff } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: '#dc2626', bg: '#fef2f2', icon: ShieldAlert, desc: 'Full access to everything' },
  { value: 'admin', label: 'Admin', color: '#2563eb', bg: '#eff6ff', icon: ShieldCheck, desc: 'All features except user management' },
  { value: 'event_manager', label: 'Event Manager', color: '#059669', bg: '#ecfdf5', icon: Shield, desc: 'Events, registrations, certificates, gallery' },
];

const ALL_MODULES = [
  { key: 'members', label: 'Members' }, { key: 'events', label: 'Events' },
  { key: 'certificates', label: 'Certificates' }, { key: 'cms', label: 'CMS' },
  { key: 'email', label: 'Email' }, { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'payments', label: 'Payments' }, { key: 'gallery', label: 'Gallery' },
  { key: 'announcements', label: 'Announcements' }, { key: 'publications', label: 'Publications' },
  { key: 'executive', label: 'Executive Committee' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'admin', permissions: [] });
  const [resetModal, setResetModal] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [toast, setToast] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const r = await axios.get(`${API}/admin/users`, { headers });
      setUsers(r.data);
    } catch {}
    try {
      const me = await axios.get(`${API}/auth/me`, { headers });
      setCurrentUser(me.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave = async () => {
    try {
      if (editUser) {
        await axios.put(`${API}/admin/users/${editUser.id}`, { username: form.username, email: form.email, role: form.role, permissions: form.permissions }, { headers });
        flash('User updated');
      } else {
        if (!form.password) { flash('Password required'); return; }
        await axios.post(`${API}/admin/users`, form, { headers });
        flash('User created');
      }
      setShowModal(false); setEditUser(null);
      setForm({ username: '', email: '', password: '', role: 'admin', permissions: [] });
      load();
    } catch (e) { flash(e.response?.data?.detail || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admin user?')) return;
    try { await axios.delete(`${API}/admin/users/${id}`, { headers }); flash('User deleted'); load(); }
    catch (e) { flash(e.response?.data?.detail || 'Error'); }
  };

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) { flash('Password must be at least 6 characters'); return; }
    try {
      await axios.put(`${API}/admin/users/${resetModal.id}/reset-password`, { password: newPass }, { headers });
      flash('Password reset successful'); setResetModal(null); setNewPass('');
    } catch (e) { flash(e.response?.data?.detail || 'Error'); }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ username: u.username, email: u.email, password: '', role: u.role, permissions: u.permissions || [] });
    setShowModal(true);
  };

  const roleInfo = (r) => ROLES.find(x => x.value === r) || ROLES[1];

  if (currentUser && currentUser.role !== 'super_admin') {
    return <div style={{ padding: '60px 24px', textAlign: 'center', color: '#dc2626', fontFamily: 'Poppins' }}>
      <ShieldAlert size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
      <h2>Access Denied</h2>
      <p style={{ color: '#6b7280' }}>Only Super Admin can manage users.</p>
    </div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#0c3c60', color: 'white', padding: '12px 20px', borderRadius: '10px', zIndex: 999, fontSize: '13px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>
            <Users size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Admin Users
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Manage admin accounts and role permissions</p>
        </div>
        <button onClick={() => { setEditUser(null); setForm({ username: '', email: '', password: '', role: 'admin', permissions: [] }); setShowModal(true); }}
          className="btn-primary" data-testid="add-admin-btn">
          <Plus size={14} /> Add Admin
        </button>
      </div>

      {/* Role Legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {ROLES.map(r => (
          <div key={r.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: r.bg, padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: r.color }}>
            <r.icon size={14} /> {r.label}: {r.desc}
          </div>
        ))}
      </div>

      {/* Users List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {users.map(u => {
          const ri = roleInfo(u.role);
          const isMe = currentUser?.id === u.id;
          return (
            <div key={u.id} data-testid={`admin-user-${u.id}`} style={{
              background: 'white', borderRadius: '10px', border: `1px solid ${isMe ? '#bfdbfe' : '#e2e8f0'}`,
              padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: isMe ? '0 0 0 2px rgba(37,99,235,0.1)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: ri.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ri.icon size={20} style={{ color: ri.color }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                    {u.username} {isMe && <span style={{ fontSize: '10px', color: '#2563eb', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>You</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{u.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: ri.bg, color: ri.color, textTransform: 'capitalize' }}>
                  {ri.label}
                </span>
                <button onClick={() => openEdit(u)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', color: '#374151' }} data-testid={`edit-user-${u.id}`}>
                  <Edit3 size={14} />
                </button>
                <button onClick={() => { setResetModal(u); setNewPass(''); }} style={{ background: '#fef3c7', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', color: '#92400e' }} title="Reset Password" data-testid={`reset-pass-${u.id}`}>
                  <Key size={14} />
                </button>
                {!isMe && (
                  <button onClick={() => handleDelete(u.id)} style={{ background: '#fee2e2', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', color: '#991b1b' }} data-testid={`delete-user-${u.id}`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '480px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '18px', color: '#0c3c60', margin: 0 }}>{editUser ? 'Edit Admin' : 'Create Admin'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="form-group"><label className="form-label">Username *</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="form-input" data-testid="admin-username" />
            </div>
            <div className="form-group"><label className="form-label">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="form-input" data-testid="admin-email" />
            </div>
            {!editUser && (
              <div className="form-group"><label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="form-input" data-testid="admin-password" />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
            <div className="form-group"><label className="form-label">Role *</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: form.role === r.value ? `2px solid ${r.color}` : '1px solid #e5e7eb', background: form.role === r.value ? r.bg : 'white', color: form.role === r.value ? r.color : '#6b7280', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins' }}>
                    <r.icon size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            {form.role === 'event_manager' && (
              <div className="form-group">
                <label className="form-label">Additional Permissions</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ALL_MODULES.filter(m => !['events', 'certificates', 'gallery'].includes(m.key)).map(m => (
                    <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: form.permissions.includes(m.key) ? '#d1fae5' : '#f1f5f9', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: form.permissions.includes(m.key) ? '#065f46' : '#6b7280' }}>
                      <input type="checkbox" checked={form.permissions.includes(m.key)}
                        onChange={e => setForm(f => ({ ...f, permissions: e.target.checked ? [...f.permissions, m.key] : f.permissions.filter(p => p !== m.key) }))}
                        style={{ width: '14px', height: '14px' }} />
                      {m.label}
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Event Manager already has: Events, Certificates, Gallery. Check additional modules above.</p>
              </div>
            )}
            <button onClick={handleSave} className="btn-primary" style={{ width: '100%', marginTop: '16px' }} data-testid="save-admin-btn">
              <Save size={14} /> {editUser ? 'Update' : 'Create'} Admin
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '400px' }}>
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '18px', color: '#0c3c60', margin: '0 0 16px' }}>Reset Password</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Reset password for <strong>{resetModal.username}</strong> ({resetModal.email})</p>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="form-input" placeholder="Min 6 characters" data-testid="new-password" />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setResetModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleResetPassword} className="btn-primary" style={{ flex: 1 }} data-testid="confirm-reset-btn">
                <Key size={14} /> Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
