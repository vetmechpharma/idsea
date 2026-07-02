import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Globe, Home, Info, Calendar, Image, BookOpen, Users, Phone, Navigation, Footprints, Loader2, Search, Code } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import { FileUpload } from '../../components/admin/FileUpload';

const PAGES = [
  { key: 'global', label: 'Branding & Global', icon: Globe },
  { key: 'seo', label: 'SEO & Indexing', icon: Search },
  { key: 'scripts', label: 'Custom Scripts', icon: Code },
  { key: 'home', label: 'Home Page', icon: Home },
  { key: 'about', label: 'About Page', icon: Info },
  { key: 'events', label: 'Events Page', icon: Calendar },
  { key: 'gallery', label: 'Gallery Page', icon: Image },
  { key: 'publications', label: 'Publications Page', icon: BookOpen },
  { key: 'members', label: 'Members Page', icon: Users },
  { key: 'contact', label: 'Contact Page', icon: Phone },
  { key: 'navbar', label: 'Navbar', icon: Navigation },
  { key: 'footer', label: 'Footer', icon: Footprints },
];

export default function CMSAdmin() {
  const [activeTab, setActiveTab] = useState('global');
  const [cmsForm, setCmsForm] = useState({});
  const [pageContents, setPageContents] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const loadAll = async () => {
      try {
        const contentPages = PAGES.filter(p => p.key !== 'global' && p.key !== 'seo' && p.key !== 'scripts');
        const [cmsRes, ...pageRes] = await Promise.all([
          axios.get(`${API}/admin/cms`),
          ...contentPages.map(p => axios.get(`${API}/admin/page-content/${p.key}`))
        ]);
        setCmsForm(cmsRes.data || {});
        const contents = {};
        contentPages.forEach((p, i) => {
          contents[p.key] = pageRes[i].data || {};
        });
        setPageContents(contents);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'global') {
        await axios.put(`${API}/admin/cms`, cmsForm);
      } else if (activeTab === 'scripts') {
        await axios.put(`${API}/admin/cms`, cmsForm);
      } else if (activeTab === 'seo') {
        // Save SEO fields for all pages
        const seoPages = ['home', 'about', 'events', 'gallery', 'publications', 'members', 'contact'];
        await Promise.all(seoPages.map(p => axios.put(`${API}/admin/page-content/${p}`, pageContents[p] || {})));
        // Save favicon to CMS
        await axios.put(`${API}/admin/cms`, cmsForm);
      } else {
        await axios.put(`${API}/admin/page-content/${activeTab}`, pageContents[activeTab] || {});
      }
      showToast(`${PAGES.find(p => p.key === activeTab)?.label} saved!`);
    } catch (e) { showToast('Error saving'); }
    setSaving(false);
  };

  const updateCms = (field, value) => setCmsForm(prev => ({ ...prev, [field]: value }));
  const updatePage = (field, value) => setPageContents(prev => ({
    ...prev,
    [activeTab]: { ...prev[activeTab], [field]: value }
  }));

  const pc = pageContents[activeTab] || {};

  if (loading) return <div className="loading-spinner">Loading CMS...</div>;

  const Section = ({ title, children }) => (
    <div className="admin-card" style={{ marginBottom: '20px' }}>
      <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, value, onChange, type = 'text', rows, placeholder }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} className="form-textarea" rows={rows || 3} placeholder={placeholder} data-testid={`cms-field-${label.toLowerCase().replace(/\s+/g, '-')}`} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="form-input" placeholder={placeholder} data-testid={`cms-field-${label.toLowerCase().replace(/\s+/g, '-')}`} />
      )}
    </div>
  );

  const renderGlobal = () => (
    <>
      <Section title="Branding & Hero">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Website Name" value={cmsForm.website_name} onChange={v => updateCms('website_name', v)} />
          <div className="form-group">
            <label className="form-label">Website Logo</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {cmsForm.logo_url && (
                <img src={cmsForm.logo_url?.startsWith('http') ? cmsForm.logo_url : `${window.location.origin}${cmsForm.logo_url}`} alt="Logo" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '2px' }} />
              )}
              <div style={{ flex: 1 }}>
                <FileUpload accept="image/*" label="Upload New Logo" onUpload={(url) => updateCms('logo_url', url)} />
                <input type="url" value={cmsForm.logo_url || ''} onChange={e => updateCms('logo_url', e.target.value)} className="form-input" placeholder="Or paste logo URL" style={{ marginTop: '6px' }} data-testid="cms-logo-url" />
              </div>
            </div>
          </div>
        </div>
        <Field label="Hero Title" value={cmsForm.hero_title} onChange={v => updateCms('hero_title', v)} />
        <Field label="Hero Subtitle" value={cmsForm.hero_subtitle} onChange={v => updateCms('hero_subtitle', v)} type="textarea" rows={2} />
      </Section>

      <Section title="About IDSEA">
        <Field label="About Content" value={cmsForm.about_content} onChange={v => updateCms('about_content', v)} type="textarea" rows={4} />
      </Section>

      <Section title="Vision & Mission">
        <Field label="Vision" value={cmsForm.vision} onChange={v => updateCms('vision', v)} type="textarea" rows={3} />
        <Field label="Mission" value={cmsForm.mission} onChange={v => updateCms('mission', v)} type="textarea" rows={3} />
      </Section>

      <Section title="Contact Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Contact Email" value={cmsForm.contact_email} onChange={v => updateCms('contact_email', v)} type="email" />
          <Field label="Contact Phone" value={cmsForm.contact_phone} onChange={v => updateCms('contact_phone', v)} />
        </div>
        <Field label="Address" value={cmsForm.contact_address} onChange={v => updateCms('contact_address', v)} type="textarea" rows={2} />
      </Section>

      <Section title="Social Media Links">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Facebook URL" value={cmsForm.facebook_url} onChange={v => updateCms('facebook_url', v)} type="url" placeholder="https://facebook.com/..." />
          <Field label="Twitter URL" value={cmsForm.twitter_url} onChange={v => updateCms('twitter_url', v)} type="url" placeholder="https://twitter.com/..." />
          <Field label="LinkedIn URL" value={cmsForm.linkedin_url} onChange={v => updateCms('linkedin_url', v)} type="url" placeholder="https://linkedin.com/..." />
        </div>
      </Section>
    </>
  );

  const renderHome = () => (
    <>
      <Section title="About Section (on Home Page)">
        <Field label="Section Title" value={pc.about_title} onChange={v => updatePage('about_title', v)} />
        <Field label="Section Subtitle" value={pc.about_subtitle} onChange={v => updatePage('about_subtitle', v)} />
        <Field label="Description Paragraph 1" value={pc.about_description} onChange={v => updatePage('about_description', v)} type="textarea" rows={3} />
        <Field label="Description Paragraph 2" value={pc.about_description2} onChange={v => updatePage('about_description2', v)} type="textarea" rows={3} />
        <div className="form-group">
          <label className="form-label">About Image</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {pc.about_image && <img src={pc.about_image?.startsWith('/') ? `${window.location.origin}${pc.about_image}` : pc.about_image} alt="About" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />}
            <div style={{ flex: 1 }}>
              <FileUpload accept="image/*" label="Upload Image" onUpload={(url) => updatePage('about_image', url)} />
              <input type="url" value={pc.about_image || ''} onChange={e => updatePage('about_image', e.target.value)} className="form-input" placeholder="Or paste image URL" style={{ marginTop: '6px' }} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Membership Section">
        <Field label="Section Title" value={pc.membership_title} onChange={v => updatePage('membership_title', v)} />
        <Field label="Section Subtitle" value={pc.membership_subtitle} onChange={v => updatePage('membership_subtitle', v)} />
      </Section>

      <Section title="Events Section">
        <Field label="Section Title" value={pc.events_title} onChange={v => updatePage('events_title', v)} />
        <Field label="Section Subtitle" value={pc.events_subtitle} onChange={v => updatePage('events_subtitle', v)} />
      </Section>

      <Section title="News Section">
        <Field label="Section Title" value={pc.news_title} onChange={v => updatePage('news_title', v)} />
        <Field label="Section Subtitle" value={pc.news_subtitle} onChange={v => updatePage('news_subtitle', v)} />
      </Section>

      <Section title="Call-to-Action Section">
        <Field label="CTA Title" value={pc.cta_title} onChange={v => updatePage('cta_title', v)} />
        <Field label="CTA Description" value={pc.cta_description} onChange={v => updatePage('cta_description', v)} type="textarea" rows={2} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="CTA Button Text" value={pc.cta_button_text} onChange={v => updatePage('cta_button_text', v)} />
          <Field label="CTA Button Link" value={pc.cta_button_link} onChange={v => updatePage('cta_button_link', v)} placeholder="/apply" />
        </div>
      </Section>
    </>
  );

  const renderAbout = () => (
    <>
      <Section title="Hero Section">
        <Field label="Hero Title" value={pc.hero_title} onChange={v => updatePage('hero_title', v)} />
        <Field label="Hero Subtitle" value={pc.hero_subtitle} onChange={v => updatePage('hero_subtitle', v)} type="textarea" rows={2} />
      </Section>

      <Section title="Objectives (one per line)">
        <Field label="Objectives List" value={pc.objectives} onChange={v => updatePage('objectives', v)} type="textarea" rows={10} placeholder="One objective per line..." />
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Enter each objective on a new line. They will be displayed as numbered items.</p>
      </Section>

      <Section title="Executive Council Section">
        <Field label="Council Title" value={pc.council_title} onChange={v => updatePage('council_title', v)} />
        <Field label="Council Subtitle" value={pc.council_subtitle} onChange={v => updatePage('council_subtitle', v)} />
        <Field label="Founders Title" value={pc.founders_title} onChange={v => updatePage('founders_title', v)} />
        <Field label="Founders Subtitle" value={pc.founders_subtitle} onChange={v => updatePage('founders_subtitle', v)} />
      </Section>

      <Section title="Registration Certificate">
        <Field label="Section Title" value={pc.cert_title} onChange={v => updatePage('cert_title', v)} placeholder="Registration Certificate" />
        <Field label="Section Subtitle" value={pc.cert_subtitle} onChange={v => updatePage('cert_subtitle', v)} placeholder="Official registration details" />
        <Field label="Organization Name on Certificate" value={pc.cert_org_name} onChange={v => updatePage('cert_org_name', v)} />
        <Field label="Registration Number" value={pc.cert_reg_number} onChange={v => updatePage('cert_reg_number', v)} placeholder="e.g. SRG/Namakkal/1/2025" />
        <Field label="Registration Act" value={pc.cert_act} onChange={v => updatePage('cert_act', v)} placeholder="Tamil Nadu Societies Registration Act, 1975" />
        <div className="form-group">
          <label className="form-label">Certificate Image</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {pc.cert_image_url && <img src={pc.cert_image_url?.startsWith('/') ? `${window.location.origin}${pc.cert_image_url}` : pc.cert_image_url} alt="Certificate" style={{ width: '120px', height: '80px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e5e7eb' }} />}
            <div style={{ flex: 1 }}>
              <FileUpload accept="image/*,.pdf" label="Upload Certificate" onUpload={(url) => updatePage('cert_image_url', url)} />
              <input type="url" value={pc.cert_image_url || ''} onChange={e => updatePage('cert_image_url', e.target.value)} className="form-input" placeholder="Or paste image URL" style={{ marginTop: '6px' }} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Headquarters Section">
        <Field label="Section Title" value={pc.hq_title} onChange={v => updatePage('hq_title', v)} />
      </Section>
    </>
  );

  const renderSimpleHero = (pageLabel) => (
    <Section title={`${pageLabel} Hero Section`}>
      <Field label="Hero Title" value={pc.hero_title} onChange={v => updatePage('hero_title', v)} />
      <Field label="Hero Subtitle" value={pc.hero_subtitle} onChange={v => updatePage('hero_subtitle', v)} type="textarea" rows={2} />
    </Section>
  );

  const renderContact = () => (
    <>
      <Section title="Hero Section">
        <Field label="Hero Title" value={pc.hero_title} onChange={v => updatePage('hero_title', v)} />
        <Field label="Hero Subtitle" value={pc.hero_subtitle} onChange={v => updatePage('hero_subtitle', v)} />
      </Section>

      <Section title="Contact Form">
        <Field label="Form Title" value={pc.form_title} onChange={v => updatePage('form_title', v)} />
        <Field label="Success Title" value={pc.form_success_title} onChange={v => updatePage('form_success_title', v)} />
        <Field label="Success Message" value={pc.form_success_message} onChange={v => updatePage('form_success_message', v)} type="textarea" rows={2} />
      </Section>

      <Section title="Membership CTA Box">
        <Field label="CTA Title" value={pc.membership_cta_title} onChange={v => updatePage('membership_cta_title', v)} />
        <Field label="CTA Description" value={pc.membership_cta_description} onChange={v => updatePage('membership_cta_description', v)} type="textarea" rows={2} />
      </Section>
    </>
  );

  const renderNavbar = () => (
    <Section title="Navigation Bar">
      <Field label="Organization Name" value={pc.org_name} onChange={v => updatePage('org_name', v)} />
      <Field label="Short Name / Abbreviation" value={pc.org_short} onChange={v => updatePage('org_short', v)} placeholder="(IDSEA)" />
    </Section>
  );

  const renderFooter = () => (
    <>
      <Section title="Footer Content">
        <Field label="Description" value={pc.description} onChange={v => updatePage('description', v)} type="textarea" rows={3} />
        <Field label="Copyright Text" value={pc.copyright_text} onChange={v => updatePage('copyright_text', v)} />
      </Section>
    </>
  );

  const updateSeoPage = (pageName, field, value) => {
    setPageContents(prev => ({
      ...prev,
      [pageName]: { ...prev[pageName], [field]: value }
    }));
  };

  const SEO_PAGES = [
    { key: 'home', label: 'Home Page', path: '/' },
    { key: 'about', label: 'About Page', path: '/about' },
    { key: 'events', label: 'Events Page', path: '/events' },
    { key: 'gallery', label: 'Gallery Page', path: '/gallery' },
    { key: 'publications', label: 'Publications Page', path: '/publications' },
    { key: 'members', label: 'Members Page', path: '/members' },
    { key: 'contact', label: 'Contact Page', path: '/contact' },
  ];

  const renderSeo = () => (
    <>
      <Section title="Website Favicon">
        <div className="form-group">
          <label className="form-label">Favicon Image</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {cmsForm.favicon_url && <img src={cmsForm.favicon_url?.startsWith('/') ? `${window.location.origin}${cmsForm.favicon_url}` : cmsForm.favicon_url} alt="Favicon" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: '4px', border: '1px solid #e5e7eb' }} />}
            <div style={{ flex: 1 }}>
              <FileUpload accept="image/png,image/x-icon,image/svg+xml" label="Upload Favicon" onUpload={(url) => updateCms('favicon_url', url)} />
              <input type="url" value={cmsForm.favicon_url || ''} onChange={e => updateCms('favicon_url', e.target.value)} className="form-input" placeholder="Or paste favicon URL" style={{ marginTop: '6px' }} />
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Recommended: 32x32px or 64x64px PNG. Used as browser tab icon.</p>
        </div>
      </Section>

      <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', border: '1px solid #bae6fd' }}>
        <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: 600, fontFamily: 'Poppins, sans-serif', marginBottom: '4px' }}>Google Indexing & SEO</div>
        <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
          All pages include meta robots "index, follow" tags, Open Graph, and Twitter card tags. A <code>sitemap.xml</code> and <code>robots.txt</code> are auto-generated. Submit your sitemap URL to Google Search Console for faster indexing.
        </div>
      </div>

      {SEO_PAGES.map(sp => {
        const pg = pageContents[sp.key] || {};
        return (
          <Section key={sp.key} title={`${sp.label} SEO (${sp.path})`}>
            <Field label="Meta Title" value={pg.seo_title} onChange={v => updateSeoPage(sp.key, 'seo_title', v)} placeholder={`${sp.label} | IDSEA`} />
            <Field label="Meta Description" value={pg.seo_description} onChange={v => updateSeoPage(sp.key, 'seo_description', v)} type="textarea" rows={2} placeholder="Brief description for search engines (150-160 chars)" />
            <Field label="Meta Keywords" value={pg.seo_keywords} onChange={v => updateSeoPage(sp.key, 'seo_keywords', v)} placeholder="keyword1, keyword2, keyword3..." />
          </Section>
        );
      })}
    </>
  );

  const renderScripts = () => (
    <>
      <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', border: '1px solid #fcd34d' }}>
        <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 600, fontFamily: 'Poppins, sans-serif', marginBottom: '4px' }}>Custom HTML / Scripts</div>
        <div style={{ fontSize: '12px', color: '#78716c', lineHeight: 1.5 }}>
          Add custom HTML, JavaScript, or third-party widget scripts. These will be injected into every public page. Use this for Google Analytics, Tag Manager, chat widgets, pixel tracking, custom CSS, etc.
        </div>
      </div>

      <Section title="Head Scripts (inside <head>)">
        <div className="form-group">
          <label className="form-label">Custom &lt;head&gt; HTML / Scripts</label>
          <textarea
            value={cmsForm.custom_head_scripts || ''}
            onChange={e => updateCms('custom_head_scripts', e.target.value)}
            className="form-textarea"
            rows={8}
            placeholder={'<!-- Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag("js", new Date());\n  gtag("config", "G-XXXXXXX");\n</script>'}
            style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '12px', lineHeight: '1.5', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px' }}
            data-testid="custom-head-scripts"
          />
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Injected inside &lt;head&gt; tag. Use for meta tags, analytics, stylesheets, fonts, Google Tag Manager head snippet, etc.</p>
        </div>
      </Section>

      <Section title="Body Start Scripts (after <body>)">
        <div className="form-group">
          <label className="form-label">Custom HTML after &lt;body&gt; open</label>
          <textarea
            value={cmsForm.custom_body_start_scripts || ''}
            onChange={e => updateCms('custom_body_start_scripts', e.target.value)}
            className="form-textarea"
            rows={6}
            placeholder={'<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>'}
            style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '12px', lineHeight: '1.5', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px' }}
            data-testid="custom-body-start-scripts"
          />
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Injected right after &lt;body&gt; tag. Use for GTM noscript fallback, chat widgets that need early loading, etc.</p>
        </div>
      </Section>

      <Section title="Body End Scripts (before </body>)">
        <div className="form-group">
          <label className="form-label">Custom HTML before &lt;/body&gt; close</label>
          <textarea
            value={cmsForm.custom_body_end_scripts || ''}
            onChange={e => updateCms('custom_body_end_scripts', e.target.value)}
            className="form-textarea"
            rows={8}
            placeholder={'<!-- Tawk.to Chat Widget -->\n<script type="text/javascript">\nvar Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();\n(function(){\nvar s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];\ns1.async=true;\ns1.src="https://embed.tawk.to/XXXXXXX/default";\ns1.charset="UTF-8";\ns0.parentNode.insertBefore(s1,s0);\n})();\n</script>\n\n<!-- Facebook Pixel -->\n<!-- WhatsApp Chat Button -->\n<!-- Any other widgets -->'}
            style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '12px', lineHeight: '1.5', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px' }}
            data-testid="custom-body-end-scripts"
          />
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Injected before &lt;/body&gt; close tag. Use for chat widgets, pixel scripts, third-party integrations, WhatsApp buttons, etc.</p>
        </div>
      </Section>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'global': return renderGlobal();
      case 'seo': return renderSeo();
      case 'scripts': return renderScripts();
      case 'home': return renderHome();
      case 'about': return renderAbout();
      case 'events': return renderSimpleHero('Events');
      case 'gallery': return renderSimpleHero('Gallery');
      case 'publications': return renderSimpleHero('Publications');
      case 'members': return renderSimpleHero('Members');
      case 'contact': return renderContact();
      case 'navbar': return renderNavbar();
      case 'footer': return renderFooter();
      default: return null;
    }
  };

  return (
    <div data-testid="cms-admin-page">
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}
      <div className="page-header">
        <h1 className="page-title">CMS & Page Content Manager</h1>
        <button onClick={handleSave} className="btn-primary" disabled={saving} data-testid="save-cms-btn">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Tab Navigation */}
        <div style={{ width: '220px', flexShrink: 0, background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {PAGES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              data-testid={`cms-tab-${key}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '12px 16px', border: 'none', cursor: 'pointer',
                background: activeTab === key ? '#0c3c60' : 'transparent',
                color: activeTab === key ? 'white' : '#374151',
                fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: activeTab === key ? 600 : 400,
                textAlign: 'left', transition: 'all 0.15s ease',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
            <span style={{ fontSize: '13px', color: '#0369a1', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
              Editing: {PAGES.find(p => p.key === activeTab)?.label}
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
              Changes are saved per section. Click "Save Changes" to apply.
            </span>
          </div>
          {renderContent()}
        </div>
      </div>

      <div style={{ position: 'sticky', bottom: '0', background: '#f4f6f9', padding: '16px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ padding: '12px 32px' }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
