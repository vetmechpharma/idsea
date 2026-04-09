import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../contexts/AuthContext';
import {
  ArrowLeft, Save, Eye, Type, Image, PenLine, Minus, Trash2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Upload, Copy, Layers, Braces, Plus, X, GripVertical, FileText
} from 'lucide-react';

const CANVAS_W = 1000, CANVAS_H = 707;
const CANVAS_W_P = 707, CANVAS_H_P = 1000;
const FONTS = ['Helvetica', 'Times-Roman', 'Courier'];
const FONT_WEB = { 'Helvetica': 'Arial, Helvetica, sans-serif', 'Times-Roman': 'Times New Roman, serif', 'Courier': 'Courier New, monospace' };
const PLACEHOLDERS = [
  { key: 'name', label: 'Name' }, { key: 'membership_id', label: 'Membership ID' },
  { key: 'date', label: 'Date' }, { key: 'year', label: 'Year' },
  { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
  { key: 'qualification', label: 'Qualification' }, { key: 'specialization', label: 'Specialization' },
  { key: 'organization', label: 'Organization' }, { key: 'membership_type', label: 'Membership Type' },
  { key: 'state', label: 'State' }, { key: 'country', label: 'Country' },
  { key: 'event_title', label: 'Event Title' }, { key: 'event_date', label: 'Event Date' },
  { key: 'event_venue', label: 'Event Venue' }, { key: 'registration_id', label: 'Registration ID' },
  { key: 'paper_title', label: 'Paper Title' },
];

const uid = () => 'el_' + Math.random().toString(36).slice(2, 9);

const defaultEl = (type, cw, ch) => {
  const base = { id: uid(), type, x: cw / 2 - 100, y: ch / 2 - 15, width: 200, height: 30, color: '#000000', font_family: 'Helvetica', font_size: 16, font_weight: 'normal', font_style: 'normal', text_align: 'center', text_decoration: 'none' };
  if (type === 'text') return { ...base, content: 'New Text' };
  if (type === 'placeholder') return { ...base, placeholder_key: 'name', content: '{{name}}', color: '#0c3c60', font_size: 24, font_weight: 'bold' };
  if (type === 'image') return { ...base, image_url: '', width: 120, height: 120 };
  if (type === 'signature_block') return { ...base, y: ch - 120, width: 160, height: 100, signer_name: 'Name', signer_title: 'Title', signature_image_url: '', font_size: 11 };
  if (type === 'line') return { ...base, width: 200, height: 4, line_color: '#000000', line_width: 2 };
  return base;
};

export default function CertificateDesigner() {
  const { id: tplId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [tpl, setTpl] = useState({
    name: 'Untitled Template', type: 'custom', orientation: 'landscape',
    page_width: CANVAS_W, page_height: CANVAS_H,
    background_color: '#ffffff', background_image_url: '', elements: []
  });
  const [selId, setSelId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [scale, setScale] = useState(1);

  const cw = tpl.orientation === 'landscape' ? CANVAS_W : CANVAS_W_P;
  const ch = tpl.orientation === 'landscape' ? CANVAS_H : CANVAS_H_P;
  const selEl = tpl.elements.find(e => e.id === selId);
  const BACKEND = process.env.REACT_APP_BACKEND_URL;

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (tplId && tplId !== 'new') {
      axios.get(`${API}/admin/certificate-templates/${tplId}`).then(r => setTpl(r.data)).catch(() => showToast('Failed to load template'));
    }
  }, [tplId]);

  useEffect(() => {
    const fit = () => {
      const avail = Math.min(window.innerWidth - 340, 900);
      setScale(Math.min(avail / cw, 0.85));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [cw]);

  const updateEl = useCallback((id, patch) => {
    setTpl(t => ({ ...t, elements: t.elements.map(e => e.id === id ? { ...e, ...patch } : e) }));
  }, []);

  const addElement = (type, extra = {}) => {
    const el = { ...defaultEl(type, cw, ch), ...extra };
    setTpl(t => ({ ...t, elements: [...t.elements, el] }));
    setSelId(el.id);
    setShowPlaceholders(false);
  };

  const deleteEl = () => {
    if (!selId) return;
    setTpl(t => ({ ...t, elements: t.elements.filter(e => e.id !== selId) }));
    setSelId(null);
  };

  const dupEl = () => {
    if (!selEl) return;
    const ne = { ...selEl, id: uid(), x: selEl.x + 20, y: selEl.y + 20 };
    setTpl(t => ({ ...t, elements: [...t.elements, ne] }));
    setSelId(ne.id);
  };

  const moveLayer = (dir) => {
    if (!selId) return;
    setTpl(t => {
      const els = [...t.elements];
      const idx = els.findIndex(e => e.id === selId);
      if (idx < 0) return t;
      const ni = dir === 'up' ? Math.min(idx + 1, els.length - 1) : Math.max(idx - 1, 0);
      [els[idx], els[ni]] = [els[ni], els[idx]];
      return { ...t, elements: els };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tplId && tplId !== 'new') {
        await axios.put(`${API}/admin/certificate-templates/${tplId}`, tpl);
      } else {
        const r = await axios.post(`${API}/admin/certificate-templates`, tpl);
        navigate(`/admin/certificates/design/${r.data.id}`, { replace: true });
      }
      showToast('Template saved!');
    } catch { showToast('Save failed'); }
    setSaving(false);
  };

  const handlePreview = async () => {
    try {
      const payload = tplId && tplId !== 'new' ? {} : tpl;
      let url;
      if (tplId && tplId !== 'new') {
        await axios.put(`${API}/admin/certificate-templates/${tplId}`, tpl);
        const r = await axios.post(`${API}/admin/certificate-templates/${tplId}/preview`, {}, { responseType: 'blob' });
        url = URL.createObjectURL(r.data);
      } else {
        const cr = await axios.post(`${API}/admin/certificate-templates`, tpl);
        navigate(`/admin/certificates/design/${cr.data.id}`, { replace: true });
        const r = await axios.post(`${API}/admin/certificate-templates/${cr.data.id}/preview`, {}, { responseType: 'blob' });
        url = URL.createObjectURL(r.data);
      }
      window.open(url, '_blank');
    } catch { showToast('Preview failed'); }
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await axios.post(`${API}/public/upload-photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTpl(t => ({ ...t, background_image_url: r.data.file_url }));
      showToast('Background uploaded');
    } catch { showToast('Upload failed'); }
  };

  const handleImgUpload = async (e, elId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await axios.post(`${API}/public/upload-photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateEl(elId, { image_url: r.data.file_url });
    } catch { showToast('Upload failed'); }
  };

  const handleSigUpload = async (e, elId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await axios.post(`${API}/public/upload-photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateEl(elId, { signature_image_url: r.data.file_url });
    } catch { showToast('Upload failed'); }
  };

  const getImgUrl = (p) => p ? (p.startsWith('http') ? p : `${BACKEND}${p.startsWith('/') ? '' : '/'}${p}`) : '';

  // Mouse handlers
  const onElMouseDown = (e, el) => {
    e.stopPropagation();
    setSelId(el.id);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragging({ id: el.id, ox: (e.clientX - rect.left) / scale - el.x, oy: (e.clientY - rect.top) / scale - el.y });
  };

  const onResizeMouseDown = (e, el) => {
    e.stopPropagation();
    setSelId(el.id);
    const rect = canvasRef.current.getBoundingClientRect();
    setResizing({ id: el.id, sx: (e.clientX - rect.left) / scale, sy: (e.clientY - rect.top) / scale, ow: el.width, oh: el.height });
  };

  const onCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / scale, my = (e.clientY - rect.top) / scale;
    if (dragging) {
      const nx = Math.max(0, Math.min(cw - 20, mx - dragging.ox));
      const ny = Math.max(0, Math.min(ch - 20, my - dragging.oy));
      updateEl(dragging.id, { x: Math.round(nx), y: Math.round(ny) });
    }
    if (resizing) {
      const dw = mx - resizing.sx, dh = my - resizing.sy;
      updateEl(resizing.id, { width: Math.max(30, Math.round(resizing.ow + dw)), height: Math.max(10, Math.round(resizing.oh + dh)) });
    }
  };

  const onCanvasMouseUp = () => { setDragging(null); setResizing(null); };
  const onCanvasClick = (e) => { if (e.target === canvasRef.current) setSelId(null); };

  const renderElement = (el) => {
    const isSel = el.id === selId;
    const webFont = FONT_WEB[el.font_family] || 'Arial, sans-serif';
    const base = {
      position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
      cursor: dragging?.id === el.id ? 'grabbing' : 'grab',
      outline: isSel ? '2px solid #3b82f6' : 'none', outlineOffset: '1px',
      zIndex: isSel ? 100 : 1,
    };

    if (el.type === 'text' || el.type === 'placeholder') {
      const content = el.type === 'placeholder' ? `{{${el.placeholder_key}}}` : el.content;
      return (
        <div key={el.id} style={{
          ...base, color: el.color, fontFamily: webFont,
          fontSize: el.font_size, fontWeight: el.font_weight === 'bold' ? 700 : 400,
          fontStyle: el.font_style === 'italic' ? 'italic' : 'normal',
          textAlign: el.text_align, textDecoration: el.text_decoration === 'underline' ? 'underline' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: el.text_align === 'center' ? 'center' : el.text_align === 'right' ? 'flex-end' : 'flex-start',
          background: el.type === 'placeholder' ? 'rgba(59,130,246,0.08)' : 'transparent',
          border: el.type === 'placeholder' ? '1px dashed rgba(59,130,246,0.4)' : 'none',
          borderRadius: el.type === 'placeholder' ? '4px' : 0, overflow: 'hidden', whiteSpace: 'nowrap',
          userSelect: 'none', lineHeight: 1.2, padding: '0 4px', boxSizing: 'border-box',
        }} onMouseDown={e => onElMouseDown(e, el)} data-testid={`canvas-el-${el.id}`}>
          <span>{content}</span>
          {isSel && <div onMouseDown={e => onResizeMouseDown(e, el)} style={{ position: 'absolute', right: -4, bottom: -4, width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', cursor: 'se-resize' }} />}
        </div>
      );
    }

    if (el.type === 'image') {
      const src = getImgUrl(el.image_url);
      return (
        <div key={el.id} style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', background: src ? 'transparent' : 'rgba(0,0,0,0.05)', border: src ? 'none' : '1px dashed #ccc' }}
          onMouseDown={e => onElMouseDown(e, el)} data-testid={`canvas-el-${el.id}`}>
          {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} /> : <Image size={20} style={{ color: '#aaa' }} />}
          {isSel && <div onMouseDown={e => onResizeMouseDown(e, el)} style={{ position: 'absolute', right: -4, bottom: -4, width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', cursor: 'se-resize' }} />}
        </div>
      );
    }

    if (el.type === 'signature_block') {
      const sigSrc = getImgUrl(el.signature_image_url);
      return (
        <div key={el.id} style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}
          onMouseDown={e => onElMouseDown(e, el)} data-testid={`canvas-el-${el.id}`}>
          {sigSrc && <img src={sigSrc} alt="sig" style={{ maxHeight: '40%', maxWidth: '80%', objectFit: 'contain' }} draggable={false} />}
          <div style={{ width: '80%', height: '1px', background: '#999', margin: '2px 0' }} />
          <div style={{ fontSize: Math.max(8, el.font_size * 0.85), fontWeight: 700, color: el.color, fontFamily: FONT_WEB[el.font_family], textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{el.signer_name}</div>
          <div style={{ fontSize: Math.max(7, el.font_size * 0.7), color: el.color, fontFamily: FONT_WEB[el.font_family], textAlign: 'center', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{el.signer_title}</div>
          {isSel && <div onMouseDown={e => onResizeMouseDown(e, el)} style={{ position: 'absolute', right: -4, bottom: -4, width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', cursor: 'se-resize' }} />}
        </div>
      );
    }

    if (el.type === 'line') {
      return (
        <div key={el.id} style={{ ...base, display: 'flex', alignItems: 'center' }}
          onMouseDown={e => onElMouseDown(e, el)} data-testid={`canvas-el-${el.id}`}>
          <div style={{ width: '100%', height: el.line_width || 2, background: el.line_color || '#000' }} />
          {isSel && <div onMouseDown={e => onResizeMouseDown(e, el)} style={{ position: 'absolute', right: -4, bottom: -4, width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', cursor: 'se-resize' }} />}
        </div>
      );
    }
    return null;
  };

  // Properties Panel
  const PropsPanel = () => {
    if (!selEl) return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
        <Layers size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <p>Select an element on the canvas to edit its properties</p>
      </div>
    );

    const upd = (k, v) => updateEl(selId, { [k]: v });
    const inputStyle = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', background: '#fff' };
    const labelStyle = { fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '4px', display: 'block' };
    const rowStyle = { marginBottom: '10px' };

    return (
      <div style={{ padding: '12px', fontSize: '12px' }}>
        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ textTransform: 'capitalize' }}>{selEl.type.replace('_', ' ')}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={dupEl} title="Duplicate" style={{ background: '#f3f4f6', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}><Copy size={12} /></button>
            <button onClick={deleteEl} title="Delete" style={{ background: '#fee2e2', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={12} /></button>
          </div>
        </div>

        {/* Position */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', ...rowStyle }}>
          <div><label style={labelStyle}>X</label><input type="number" value={selEl.x} onChange={e => upd('x', +e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Y</label><input type="number" value={selEl.y} onChange={e => upd('y', +e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Width</label><input type="number" value={selEl.width} onChange={e => upd('width', +e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Height</label><input type="number" value={selEl.height} onChange={e => upd('height', +e.target.value)} style={inputStyle} /></div>
        </div>

        {/* Text / Placeholder props */}
        {(selEl.type === 'text' || selEl.type === 'placeholder') && (
          <>
            {selEl.type === 'text' && (
              <div style={rowStyle}><label style={labelStyle}>Content</label><input value={selEl.content} onChange={e => upd('content', e.target.value)} style={inputStyle} data-testid="prop-content" /></div>
            )}
            {selEl.type === 'placeholder' && (
              <div style={rowStyle}><label style={labelStyle}>Placeholder Field</label>
                <select value={selEl.placeholder_key} onChange={e => { upd('placeholder_key', e.target.value); upd('content', `{{${e.target.value}}}`); }} style={inputStyle} data-testid="prop-placeholder-key">
                  {PLACEHOLDERS.map(p => <option key={p.key} value={p.key}>{p.label} ({`{{${p.key}}}`})</option>)}
                </select>
              </div>
            )}
            <div style={rowStyle}><label style={labelStyle}>Font</label>
              <select value={selEl.font_family} onChange={e => upd('font_family', e.target.value)} style={inputStyle}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', ...rowStyle }}>
              <div><label style={labelStyle}>Size</label><input type="number" value={selEl.font_size} onChange={e => upd('font_size', +e.target.value)} style={inputStyle} min={6} max={120} /></div>
              <div><label style={labelStyle}>Color</label><input type="color" value={selEl.color} onChange={e => upd('color', e.target.value)} style={{ ...inputStyle, padding: '2px', height: '32px' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: '4px', ...rowStyle }}>
              {[['bold', Bold, 'font_weight'], ['italic', Italic, 'font_style']].map(([val, Icon, key]) => (
                <button key={val} onClick={() => upd(key, selEl[key] === val ? 'normal' : val)}
                  style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', background: selEl[key] === val ? '#dbeafe' : '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                  <Icon size={14} />
                </button>
              ))}
              <button onClick={() => upd('text_decoration', selEl.text_decoration === 'underline' ? 'none' : 'underline')}
                style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', background: selEl.text_decoration === 'underline' ? '#dbeafe' : '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                <Underline size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '4px', ...rowStyle }}>
              {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([val, Icon]) => (
                <button key={val} onClick={() => upd('text_align', val)}
                  style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', background: selEl.text_align === val ? '#dbeafe' : '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Image props */}
        {selEl.type === 'image' && (
          <div style={rowStyle}>
            <label style={labelStyle}>Image</label>
            {selEl.image_url ? (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <img src={getImgUrl(selEl.image_url)} alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: '4px', border: '1px solid #e5e7eb' }} />
                <button onClick={() => upd('image_url', '')} style={{ background: '#fee2e2', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: '#dc2626' }}>Remove</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                <Upload size={14} /> Upload Image
                <input type="file" accept="image/*" onChange={e => handleImgUpload(e, selEl.id)} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        )}

        {/* Signature props */}
        {selEl.type === 'signature_block' && (
          <>
            <div style={rowStyle}><label style={labelStyle}>Signer Name</label><input value={selEl.signer_name} onChange={e => upd('signer_name', e.target.value)} style={inputStyle} data-testid="prop-signer-name" /></div>
            <div style={rowStyle}><label style={labelStyle}>Signer Title</label><input value={selEl.signer_title} onChange={e => upd('signer_title', e.target.value)} style={inputStyle} data-testid="prop-signer-title" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', ...rowStyle }}>
              <div><label style={labelStyle}>Font Size</label><input type="number" value={selEl.font_size} onChange={e => upd('font_size', +e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Color</label><input type="color" value={selEl.color} onChange={e => upd('color', e.target.value)} style={{ ...inputStyle, padding: '2px', height: '32px' }} /></div>
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Signature Image</label>
              {selEl.signature_image_url ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <img src={getImgUrl(selEl.signature_image_url)} alt="" style={{ width: 60, height: 30, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
                  <button onClick={() => upd('signature_image_url', '')} style={{ background: '#fee2e2', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: '#dc2626' }}>Remove</button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  <Upload size={14} /> Upload Signature
                  <input type="file" accept="image/*" onChange={e => handleSigUpload(e, selEl.id)} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </>
        )}

        {/* Line props */}
        {selEl.type === 'line' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', ...rowStyle }}>
            <div><label style={labelStyle}>Color</label><input type="color" value={selEl.line_color || '#000'} onChange={e => upd('line_color', e.target.value)} style={{ ...inputStyle, padding: '2px', height: '32px' }} /></div>
            <div><label style={labelStyle}>Thickness</label><input type="number" value={selEl.line_width || 2} onChange={e => upd('line_width', +e.target.value)} style={inputStyle} min={1} max={20} /></div>
          </div>
        )}

        {/* Layer controls */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', marginTop: '10px' }}>
          <label style={labelStyle}>Layer Order</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => moveLayer('up')} style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '11px' }}>Bring Forward</button>
            <button onClick={() => moveLayer('down')} style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '11px' }}>Send Back</button>
          </div>
        </div>
      </div>
    );
  };

  const bgImgUrl = getImgUrl(tpl.background_image_url);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)', margin: '-24px', background: '#f0f2f5' }}>
      {toast && <div style={{ position: 'fixed', top: 80, right: 24, background: '#065f46', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, zIndex: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast}</div>}

      {/* Top Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }} data-testid="designer-toolbar">
        <button onClick={() => navigate('/admin/certificates')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }} data-testid="back-btn"><ArrowLeft size={18} /></button>
        <input value={tpl.name} onChange={e => setTpl(t => ({ ...t, name: e.target.value }))} style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '15px', color: '#111', border: 'none', background: 'transparent', width: '250px', outline: 'none' }} data-testid="template-name-input" />
        <select value={tpl.type} onChange={e => setTpl(t => ({ ...t, type: e.target.value }))} style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', background: '#f9fafb', color: '#374151' }} data-testid="template-type-select">
          <option value="membership">Membership</option><option value="event">Event/Conference</option><option value="custom">Custom</option>
        </select>
        <select value={tpl.orientation} onChange={e => { const o = e.target.value; setTpl(t => ({ ...t, orientation: o, page_width: o === 'landscape' ? CANVAS_W : CANVAS_W_P, page_height: o === 'landscape' ? CANVAS_H : CANVAS_H_P })); }}
          style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', background: '#f9fafb' }} data-testid="orientation-select">
          <option value="landscape">Landscape</option><option value="portrait">Portrait</option>
        </select>

        <div style={{ flex: 1 }} />

        {/* Element tools */}
        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
          <button onClick={() => addElement('text')} title="Add Text" style={toolBtnStyle} data-testid="add-text-btn"><Type size={14} /><span style={toolLabelStyle}>Text</span></button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowPlaceholders(!showPlaceholders)} title="Add Placeholder" style={toolBtnStyle} data-testid="add-placeholder-btn"><Braces size={14} /><span style={toolLabelStyle}>Field</span></button>
            {showPlaceholders && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '6px', zIndex: 150, width: '200px', maxHeight: '260px', overflowY: 'auto' }}>
                {PLACEHOLDERS.map(p => (
                  <button key={p.key} onClick={() => addElement('placeholder', { placeholder_key: p.key, content: `{{${p.key}}}` })}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', borderRadius: '4px', color: '#374151' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <span style={{ fontWeight: 600 }}>{p.label}</span> <span style={{ color: '#9ca3af', fontSize: '10px' }}>{`{{${p.key}}}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => addElement('image')} title="Add Image" style={toolBtnStyle} data-testid="add-image-btn"><Image size={14} /><span style={toolLabelStyle}>Image</span></button>
          <button onClick={() => addElement('signature_block')} title="Add Signature" style={toolBtnStyle} data-testid="add-signature-btn"><PenLine size={14} /><span style={toolLabelStyle}>Signature</span></button>
          <button onClick={() => addElement('line')} title="Add Line" style={toolBtnStyle} data-testid="add-line-btn"><Minus size={14} /><span style={toolLabelStyle}>Line</span></button>
        </div>

        <div style={{ width: '1px', height: '28px', background: '#e5e7eb' }} />

        <button onClick={handlePreview} style={{ ...actionBtnStyle, background: '#f0f9ff', color: '#1e40af' }} data-testid="preview-btn"><Eye size={14} /> Preview</button>
        <button onClick={handleSave} disabled={saving} style={{ ...actionBtnStyle, background: '#0c3c60', color: '#fff' }} data-testid="save-template-btn"><Save size={14} /> {saving ? 'Saving...' : 'Save'}</button>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel - element list + background */}
        <div style={{ width: '200px', background: '#fff', borderRight: '1px solid #e5e7eb', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Background</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Color</label>
              <input type="color" value={tpl.background_color} onChange={e => setTpl(t => ({ ...t, background_color: e.target.value }))} style={{ width: '100%', height: '28px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} data-testid="bg-color-input" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Background Image</label>
              {tpl.background_image_url ? (
                <div style={{ position: 'relative' }}>
                  <img src={bgImgUrl} alt="bg" style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  <button onClick={() => setTpl(t => ({ ...t, background_image_url: '' }))} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><X size={10} /></button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#f9fafb', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', border: '1px dashed #d1d5db', justifyContent: 'center' }}>
                  <Upload size={12} /> Upload
                  <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} data-testid="bg-upload-input" />
                </label>
              )}
            </div>

            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>Elements ({tpl.elements.length})</div>
            {tpl.elements.map((el, i) => (
              <div key={el.id} onClick={() => setSelId(el.id)} data-testid={`layer-${el.id}`}
                style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px',
                  background: el.id === selId ? '#dbeafe' : 'transparent', color: el.id === selId ? '#1e40af' : '#374151' }}>
                <GripVertical size={10} style={{ color: '#ccc' }} />
                {el.type === 'text' && <Type size={10} />}
                {el.type === 'placeholder' && <Braces size={10} />}
                {el.type === 'image' && <Image size={10} />}
                {el.type === 'signature_block' && <PenLine size={10} />}
                {el.type === 'line' && <Minus size={10} />}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {el.type === 'text' ? el.content?.slice(0, 18) : el.type === 'placeholder' ? `{{${el.placeholder_key}}}` : el.type === 'signature_block' ? el.signer_name : el.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', background: '#e5e7eb', padding: '20px' }}>
          <div ref={canvasRef} onMouseMove={onCanvasMouseMove} onMouseUp={onCanvasMouseUp} onMouseLeave={onCanvasMouseUp} onClick={onCanvasClick}
            style={{
              width: cw, height: ch, position: 'relative', background: tpl.background_color,
              backgroundImage: bgImgUrl ? `url(${bgImgUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)', transform: `scale(${scale})`, transformOrigin: 'center center',
              borderRadius: '2px', overflow: 'hidden',
            }} data-testid="certificate-canvas">
            {tpl.elements.map(renderElement)}
          </div>
        </div>

        {/* Right panel - properties */}
        <div style={{ width: '260px', background: '#fff', borderLeft: '1px solid #e5e7eb', overflowY: 'auto', flexShrink: 0 }} data-testid="properties-panel">
          <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Properties</div>
          </div>
          <PropsPanel />
        </div>
      </div>
    </div>
  );
}

const toolBtnStyle = { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', border: 'none', borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '12px', color: '#374151', whiteSpace: 'nowrap' };
const toolLabelStyle = { fontSize: '11px' };
const actionBtnStyle = { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins' };
