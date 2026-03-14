import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Globe } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import { FileUpload } from '../../components/admin/FileUpload';

export default function CMSAdmin() {
  const [form, setForm] = useState({
    website_name: '', logo_url: '', hero_title: '', hero_subtitle: '',
    about_content: '', vision: '', mission: '',
    contact_email: '', contact_phone: '', contact_address: '',
    facebook_url: '', twitter_url: '', linkedin_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    axios.get(`${API}/admin/cms`).then(r => {
      if (r.data && Object.keys(r.data).length > 0) setForm(prev => ({ ...prev, ...r.data }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/cms`, form);
      showToast('CMS settings saved!');
    } catch (e) { showToast('Error saving settings'); }
    setSaving(false);
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="loading-spinner">Loading CMS settings...</div>;

  const Section = ({ title, children }) => (
    <div className="admin-card" style={{ marginBottom: '20px' }}>
      <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div>
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">CMS & Website Settings</h1>
        <button onClick={handleSave} className="btn-primary" disabled={saving} data-testid="save-cms-btn">
          <Save size={16} /> {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <Section title="Branding & Hero">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group"><label className="form-label">Website Name</label><input value={form.website_name} onChange={e => updateField('website_name', e.target.value)} className="form-input" data-testid="cms-website-name" /></div>
          <div className="form-group">
            <label className="form-label">Website Logo</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {form.logo_url && (
                <img src={form.logo_url.startsWith('http') ? form.logo_url : `${window.location.origin}${form.logo_url}`} alt="Logo" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '2px' }} />
              )}
              <div style={{ flex: 1 }}>
                <FileUpload accept="image/*" label="Upload New Logo" onUpload={(url) => updateField('logo_url', url)} />
                <input type="url" value={form.logo_url} onChange={e => updateField('logo_url', e.target.value)} className="form-input" placeholder="Or paste logo URL" style={{ marginTop: '6px' }} data-testid="cms-logo-url" />
              </div>
            </div>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Hero Title</label><input value={form.hero_title} onChange={e => updateField('hero_title', e.target.value)} className="form-input" data-testid="cms-hero-title" /></div>
        <div className="form-group"><label className="form-label">Hero Subtitle</label><textarea value={form.hero_subtitle} onChange={e => updateField('hero_subtitle', e.target.value)} className="form-textarea" rows={2} /></div>
      </Section>

      <Section title="About IDSEA">
        <div className="form-group"><label className="form-label">About Content</label><textarea value={form.about_content} onChange={e => updateField('about_content', e.target.value)} className="form-textarea" rows={4} data-testid="cms-about" /></div>
      </Section>

      <Section title="Vision & Mission">
        <div className="form-group"><label className="form-label">Vision</label><textarea value={form.vision} onChange={e => updateField('vision', e.target.value)} className="form-textarea" rows={3} data-testid="cms-vision" /></div>
        <div className="form-group"><label className="form-label">Mission</label><textarea value={form.mission} onChange={e => updateField('mission', e.target.value)} className="form-textarea" rows={3} data-testid="cms-mission" /></div>
      </Section>

      <Section title="Contact Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group"><label className="form-label">Contact Email</label><input type="email" value={form.contact_email} onChange={e => updateField('contact_email', e.target.value)} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Contact Phone</label><input value={form.contact_phone} onChange={e => updateField('contact_phone', e.target.value)} className="form-input" /></div>
        </div>
        <div className="form-group"><label className="form-label">Address</label><textarea value={form.contact_address} onChange={e => updateField('contact_address', e.target.value)} className="form-textarea" rows={2} /></div>
      </Section>

      <Section title="Social Media Links">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group"><label className="form-label">Facebook URL</label><input type="url" value={form.facebook_url} onChange={e => updateField('facebook_url', e.target.value)} className="form-input" placeholder="https://facebook.com/..." /></div>
          <div className="form-group"><label className="form-label">Twitter URL</label><input type="url" value={form.twitter_url} onChange={e => updateField('twitter_url', e.target.value)} className="form-input" placeholder="https://twitter.com/..." /></div>
          <div className="form-group"><label className="form-label">LinkedIn URL</label><input type="url" value={form.linkedin_url} onChange={e => updateField('linkedin_url', e.target.value)} className="form-input" placeholder="https://linkedin.com/..." /></div>
        </div>
      </Section>

      <div style={{ position: 'sticky', bottom: '0', background: '#f4f6f9', padding: '16px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ padding: '12px 32px' }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
