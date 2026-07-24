import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Plus, Edit3, Trash2, Save, X, Crown, ToggleLeft, ToggleRight, Hash, Check, Award, Link2, ChevronDown } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MembershipAdmin() {
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState({ key: '', label: '', fee_inr: 0, fee_usd: 0, enabled: true, description: '', validity_months: 0 });
  const [idConfigs, setIdConfigs] = useState([]);
  const [editingPrefix, setEditingPrefix] = useState(null);
  const [prefixValue, setPrefixValue] = useState('');
  const [prefixSaving, setPrefixSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [certTemplates, setCertTemplates] = useState([]);
  const [openCertDropdown, setOpenCertDropdown] = useState(null);
  const [linkingPlan, setLinkingPlan] = useState(null);
  const token = localStorage.getItem('idsea_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchPlans = async () => {
    try {
      const r = await axios.get(`${API}/admin/membership-plans`, { headers });
      setPlans(r.data || []);
    } catch {}
  };

  const fetchIdConfigs = async () => {
    try {
      const r = await axios.get(`${API}/admin/membership-id-config`, { headers });
      setIdConfigs(r.data || []);
    } catch {}
  };

  const fetchCertTemplates = async () => {
    try {
      const r = await axios.get(`${API}/admin/certificate-templates`, { headers });
      setCertTemplates(r.data || []);
    } catch {}
  };

  useEffect(() => { fetchPlans(); fetchIdConfigs(); fetchCertTemplates(); }, []);

  // Close cert dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (openCertDropdown && !e.target.closest('[data-cert-dropdown]')) setOpenCertDropdown(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openCertDropdown]);

  const openCreate = () => {
    setEditPlan(null);
    setForm({ key: '', label: '', fee_inr: 0, fee_usd: 0, enabled: true, description: '', validity_months: 0 });
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditPlan(plan);
    setForm({
      key: plan.key || '',
      label: plan.label || '',
      fee_inr: plan.fee_inr || 0,
      fee_usd: plan.fee_usd || 0,
      enabled: plan.enabled !== false,
      description: plan.description || '',
      validity_months: plan.validity_months || 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.label) { alert('Label is required'); return; }
    const payload = {
      ...form,
      key: form.key || form.label.toLowerCase().replace(/\s+/g, '_'),
    };
    try {
      if (editPlan) {
        await axios.put(`${API}/admin/membership-plans/${editPlan.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/admin/membership-plans`, payload, { headers });
      }
      setShowModal(false);
      fetchPlans();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error saving plan');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this membership plan?')) return;
    try {
      await axios.delete(`${API}/admin/membership-plans/${id}`, { headers });
      fetchPlans();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error deleting plan');
    }
  };

  const toggleEnabled = async (plan) => {
    try {
      await axios.put(`${API}/admin/membership-plans/${plan.id}`, { enabled: !plan.enabled }, { headers });
      fetchPlans();
    } catch {}
  };

  const linkCertTemplate = async (planKey, templateId) => {
    setLinkingPlan(planKey);
    try {
      if (templateId) {
        // Add this plan to the template's linked types
        await axios.put(`${API}/admin/certificate-templates/${templateId}/link-plan`, { membership_type: planKey, action: 'add' }, { headers });
      } else {
        // Remove this plan from whichever template has it
        const linked = certTemplates.find(t => (t.linked_membership_types || []).includes(planKey) || t.linked_membership_type === planKey);
        if (linked) {
          await axios.put(`${API}/admin/certificate-templates/${linked.id}/link-plan`, { membership_type: planKey, action: 'remove' }, { headers });
        }
      }
      setToast(templateId ? 'Certificate template linked!' : 'Certificate template unlinked');
      setTimeout(() => setToast(''), 3000);
      fetchCertTemplates();
    } catch (e) {
      setToast('Error: ' + (e.response?.data?.detail || 'Failed to link'));
      setTimeout(() => setToast(''), 3000);
    }
    setLinkingPlan(null);
    setOpenCertDropdown(null);
  };

  const getLinkedTemplate = (planKey) => certTemplates.find(t => (t.linked_membership_types || []).includes(planKey) || t.linked_membership_type === planKey);

  return (
    <div data-testid="membership-admin" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '24px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Membership Plans</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontFamily: 'Inter, sans-serif' }}>Manage membership types and fees for IDSEA</p>
        </div>
        <button onClick={openCreate} className="btn-primary" data-testid="create-plan-btn">
          <Plus size={16} /> Add Plan
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {plans.map(plan => {
          const linkedTpl = getLinkedTemplate(plan.key);
          const isDropdownOpen = openCertDropdown === plan.key;
          return (
          <div key={plan.id} data-testid={`plan-${plan.id}`} style={{
            background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0',
            padding: '18px 22px',
            opacity: plan.enabled ? 1 : 0.6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Crown size={16} style={{ color: '#d4a017' }} />
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '15px', color: '#0c3c60' }}>{plan.label}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                  background: plan.enabled ? '#d1fae5' : '#f1f5f9',
                  color: plan.enabled ? '#065f46' : '#94a3b8'
                }}>
                  {plan.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '6px', fontSize: '13px', color: '#64748b' }}>
                <span>Key: <strong style={{ color: '#334155' }}>{plan.key}</strong></span>
                <span>INR: <strong style={{ color: '#1e7a4d' }}>&#8377;{plan.fee_inr?.toLocaleString('en-IN')}</strong></span>
                <span>USD: <strong style={{ color: '#0c3c60' }}>${plan.fee_usd}</strong></span>
                {plan.validity_months > 0 && <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '11px' }}>{plan.validity_months} months</span>}
                {plan.validity_months === 0 && <span style={{ background: '#d1fae5', color: '#065f46', padding: '1px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '11px' }}>Lifetime</span>}
                {plan.description && <span style={{ color: '#94a3b8' }}>{plan.description}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => toggleEnabled(plan)} data-testid={`toggle-plan-${plan.id}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: plan.enabled ? '#1e7a4d' : '#94a3b8' }}
                title={plan.enabled ? 'Disable' : 'Enable'}>
                {plan.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
              <button onClick={() => openEdit(plan)} className="btn-secondary" data-testid={`edit-plan-${plan.id}`}>
                <Edit3 size={14} /> Edit
              </button>
              <button onClick={() => handleDelete(plan.id)} data-testid={`delete-plan-${plan.id}`}
                style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <Trash2 size={14} />
              </button>
            </div>
            </div>

            {/* Certificate Template Link */}
            <div data-cert-dropdown style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={14} style={{ color: linkedTpl ? '#1e7a4d' : '#94a3b8' }} />
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Certificate Template:</span>
                <button
                  onClick={() => setOpenCertDropdown(isDropdownOpen ? null : plan.key)}
                  disabled={linkingPlan === plan.key}
                  data-testid={`cert-link-${plan.key}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    border: linkedTpl ? '1px solid #bbf7d0' : '1px dashed #cbd5e1',
                    background: linkedTpl ? '#f0fdf4' : '#fafbfc',
                    color: linkedTpl ? '#065f46' : '#64748b',
                  }}>
                  {linkingPlan === plan.key ? 'Linking...' : linkedTpl ? (
                    <><Link2 size={12} /> {linkedTpl.name || 'Untitled Template'}</>
                  ) : (
                    <><Plus size={12} /> Assign Template</>
                  )}
                  <ChevronDown size={12} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                </button>
              </div>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: '0', zIndex: 50, marginTop: '4px',
                  background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '280px', padding: '4px',
                }}>
                  {linkedTpl && (
                    <button
                      onClick={() => linkCertTemplate(plan.key, '')}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: '#fef2f2', color: '#991b1b', cursor: 'pointer', fontSize: '12px', borderRadius: '6px', fontWeight: 600, marginBottom: '2px' }}>
                      Remove link
                    </button>
                  )}
                  {certTemplates.length === 0 && (
                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                      No certificate templates found. Create one first in the Certificate Designer.
                    </div>
                  )}
                  {certTemplates.map(tpl => {
                    const tplTypes = tpl.linked_membership_types || (tpl.linked_membership_type ? [tpl.linked_membership_type] : []);
                    const isLinked = tplTypes.includes(plan.key);
                    const otherPlans = tplTypes.filter(t => t !== plan.key);
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => !isLinked && linkCertTemplate(plan.key, tpl.id)}
                        data-testid={`cert-option-${tpl.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left',
                          padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: isLinked ? 'default' : 'pointer',
                          background: isLinked ? '#d1fae5' : 'transparent', fontSize: '12px',
                          color: isLinked ? '#065f46' : '#374151',
                          fontWeight: isLinked ? 700 : 400,
                        }}>
                        <Award size={14} style={{ flexShrink: 0, color: isLinked ? '#1e7a4d' : '#94a3b8' }} />
                        <div style={{ flex: 1 }}>
                          <div>{tpl.name || 'Untitled Template'}</div>
                          {otherPlans.length > 0 && (
                            <div style={{ fontSize: '10px', color: '#6b7280' }}>
                              Also linked: {otherPlans.join(', ')}
                            </div>
                          )}
                        </div>
                        {isLinked && <Check size={14} style={{ color: '#1e7a4d' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          );
        })}
        {plans.length === 0 && (
          <div style={{ background: 'white', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No membership plans yet. Click &ldquo;Add Plan&rdquo; to create one.
          </div>
        )}
      </div>

      {/* ═══ Membership ID Prefix Config ═══ */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Hash size={18} style={{ color: '#0c3c60' }} />
          <h2 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Membership ID Prefix</h2>
        </div>
        <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#0369a1', lineHeight: 1.6 }}>
          Configure the prefix for each membership category. Format: <strong>PREFIX/IDSEA/SERIAL</strong> (continuous numbering)
        </div>
        <div style={{ display: 'grid', gap: '10px' }}>
          {idConfigs.map(c => (
            <div key={c.type} data-testid={`id-config-${c.type}`} style={{
              background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0',
              padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '14px', color: '#0c3c60', textTransform: 'capitalize' }}>{c.type}</div>
                {editingPrefix === c.type ? (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                    <input
                      value={prefixValue}
                      onChange={e => setPrefixValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      style={{ padding: '5px 10px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: '13px', fontWeight: 700, width: '100px', fontFamily: 'monospace' }}
                      data-testid={`prefix-input-${c.type}`}
                      autoFocus
                    />
                    <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>/IDSEA/{['student','students_membership'].includes(c.type) ? `${new Date().getFullYear()}/000001` : '0001'}</span>
                    <button onClick={async () => {
                      if (!prefixValue) return;
                      setPrefixSaving(true);
                      try {
                        await axios.put(`${API}/admin/membership-id-config/${c.type}`, { prefix: prefixValue }, { headers });
                        setToast(`Prefix updated to ${prefixValue}`);
                        setTimeout(() => setToast(''), 3000);
                        setEditingPrefix(null);
                        fetchIdConfigs();
                      } catch (e) { setToast('Error: ' + (e.response?.data?.detail || 'Failed')); setTimeout(() => setToast(''), 3000); }
                      setPrefixSaving(false);
                    }} disabled={prefixSaving} style={{ background: '#1e7a4d', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px' }} data-testid={`save-prefix-${c.type}`}>
                      <Check size={12} /> {prefixSaving ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setEditingPrefix(null)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}><X size={12} /></button>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>
                    Sample: <strong style={{ color: '#1e7a4d' }}>{c.sample_id}</strong>
                    {c.is_default && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#94a3b8' }}>(default)</span>}
                  </div>
                )}
              </div>
              {editingPrefix !== c.type && (
                <button onClick={() => { setEditingPrefix(c.type); setPrefixValue(c.prefix); }}
                  className="btn-secondary" style={{ fontSize: '12px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  data-testid={`edit-prefix-${c.type}`}>
                  <Edit3 size={12} /> Change
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {toast && <div className="toast-success" data-testid="toast-prefix">{toast}</div>}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '95%', maxWidth: '520px', padding: '0' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>
                {editPlan ? 'Edit Plan' : 'Create Plan'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div className="form-group">
                <label className="form-label">Plan Name *</label>
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="form-input" data-testid="plan-label-input" placeholder="e.g. Academic, Corporate, International" />
              </div>
              <div className="form-group">
                <label className="form-label">Key (auto-generated if empty)</label>
                <input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} className="form-input" data-testid="plan-key-input" placeholder="e.g. academic" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Fee INR (&#8377;)</label>
                  <input type="number" value={form.fee_inr} onChange={e => setForm(f => ({ ...f, fee_inr: parseFloat(e.target.value) || 0 }))} className="form-input" data-testid="plan-fee-inr" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fee USD ($)</label>
                  <input type="number" value={form.fee_usd} onChange={e => setForm(f => ({ ...f, fee_usd: parseFloat(e.target.value) || 0 }))} className="form-input" data-testid="plan-fee-usd" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-input" placeholder="Brief description of this plan" />
              </div>
              <div className="form-group">
                <label className="form-label">Validity (months) <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>0 = Lifetime</span></label>
                <input type="number" value={form.validity_months} onChange={e => setForm(f => ({ ...f, validity_months: parseInt(e.target.value) || 0 }))} className="form-input" placeholder="0 for lifetime, 12 for 1 year" data-testid="plan-validity" min="0" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
                <span className="form-label" style={{ margin: 0 }}>Enabled (visible to public)</span>
              </label>
            </div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary" data-testid="save-plan-btn"><Save size={14} /> {editPlan ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
