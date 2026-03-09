import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, Plus, Trash2, X } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';

export default function RolesAdmin() {
  const { admin: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'admin' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => { axios.get(`${API}/admin/users`).then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.username || !form.email || !form.password) return showToast('All fields are required');
    try {
      await axios.post(`${API}/admin/users`, form);
      showToast('Admin user created!');
      setShowModal(false);
      setForm({ username: '', email: '', password: '', role: 'admin' });
      load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed to create user')); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admin user?')) return;
    try {
      await axios.delete(`${API}/admin/users/${id}`);
      showToast('User deleted'); load();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || 'Failed')); }
  };

  const ROLE_COLORS = { super_admin: { bg: '#fee2e2', text: '#991b1b' }, admin: { bg: '#dbeafe', text: '#1e40af' }, membership_manager: { bg: '#d1fae5', text: '#065f46' }, event_manager: { bg: '#ede9fe', text: '#5b21b6' } };

  return (
    <div>
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">Admin Role Management</h1>
        {currentAdmin?.role === 'super_admin' && (
          <button onClick={() => setShowModal(true)} className="btn-primary" data-testid="add-admin-btn">
            <Plus size={16} /> Add Admin User
          </button>
        )}
      </div>

      {currentAdmin?.role !== 'super_admin' && (
        <div className="admin-card" style={{ marginBottom: '20px', background: '#fef3c7', border: '1px solid #fde68a' }}>
          <p style={{ fontSize: '13px', color: '#92400e', margin: 0, fontFamily: 'Inter' }}>
            <Shield size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Only Super Admins can create or delete admin users. You have read-only access.
          </p>
        </div>
      )}

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {users.map(u => {
            const roleColor = ROLE_COLORS[u.role] || ROLE_COLORS.admin;
            return (
              <div key={u.id} className="admin-card" data-testid="admin-user-card">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#0c3c60', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', fontFamily: 'Poppins', flexShrink: 0 }}>
                    {u.username?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{u.username}</h3>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{u.email}</div>
                    <span style={{ background: roleColor.bg, color: roleColor.text, padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins' }}>
                      {u.role?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {currentAdmin?.role === 'super_admin' && u.email !== currentAdmin.email && (
                    <button onClick={() => handleDelete(u.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Add Admin User</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>
            <div className="form-group"><label className="form-label">Username *</label><input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="form-input" data-testid="admin-username-input" required /></div>
            <div className="form-group"><label className="form-label">Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="form-input" data-testid="admin-email-input" required /></div>
            <div className="form-group"><label className="form-label">Password *</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="form-input" data-testid="admin-password-input" required /></div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="form-select" data-testid="admin-role-select">
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="membership_manager">Membership Manager</option>
                <option value="event_manager">Event Manager</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn-primary" data-testid="create-admin-btn">Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
