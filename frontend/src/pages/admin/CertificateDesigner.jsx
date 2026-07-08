import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../contexts/AuthContext';
import {
  ArrowLeft, Save, Eye, Type, Image, PenLine, Minus, Trash2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Upload, Copy, Layers, Braces, X, GripVertical, ZoomIn, ZoomOut,
  RotateCcw, Link2, Unlink, ChevronDown, Move, QrCode
} from 'lucide-react';

const CANVAS_L = { w: 1000, h: 707 };
const CANVAS_P = { w: 707, h: 1000 };
const DRAG_THRESHOLD = 4;

const FONTS = [
  { value: 'Helvetica', label: 'Helvetica (Sans)', web: 'Arial, Helvetica, sans-serif' },
  { value: 'Times-Roman', label: 'Times Roman (Serif)', web: '"Times New Roman", Georgia, serif' },
  { value: 'Courier', label: 'Courier (Mono)', web: '"Courier New", Courier, monospace' },
];
const FONT_WEB_MAP = Object.fromEntries(FONTS.map(f => [f.value, f.web]));

const PLACEHOLDERS = [
  { key: 'name', label: 'Participant Name' }, { key: 'membership_id', label: 'Membership ID' },
  { key: 'date', label: 'Date (DD.MM.YYYY)' }, { key: 'year', label: 'Year' },
  { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
  { key: 'qualification', label: 'Qualification' }, { key: 'specialization', label: 'Specialization' },
  { key: 'organization', label: 'Organization' }, { key: 'membership_type', label: 'Membership Type' },
  { key: 'state', label: 'State' }, { key: 'country', label: 'Country' },
  { key: 'event_title', label: 'Event Title' }, { key: 'event_date', label: 'Event Date' },
  { key: 'event_venue', label: 'Event Venue' }, { key: 'registration_id', label: 'Registration ID' },
  { key: 'paper_title', label: 'Paper Title' },
];

const PLAN_OPTIONS = [
  { value: '', label: 'Not Linked' },
  { value: 'academic', label: 'Academic Member' },
  { value: 'entrepreneur', label: 'Entrepreneur Member' },
  { value: 'corporate', label: 'Corporate Member' },
  { value: 'international', label: 'International Delegate' },
];

const uid = () => 'el_' + Math.random().toString(36).slice(2, 9);

const mkEl = (type, cw, ch, extra = {}) => {
  const base = {
    id: uid(), type, x: cw / 2 - 150, y: ch / 2 - 20, width: 300, height: 40,
    color: '#000000', font_family: 'Helvetica', font_size: 16,
    font_weight: 'normal', font_style: 'normal', text_align: 'center',
    text_decoration: 'none', opacity: 100
  };
  const defs = {
    text: { content: 'New Text', height: 35 },
    placeholder: { placeholder_key: 'name', content: '{{name}}', color: '#0c3c60', font_size: 24, font_weight: 'bold', height: 40 },
    image: { image_url: '', width: 120, height: 120 },
    signature_block: { y: ch - 130, width: 180, height: 110, signer_name: 'Signatory Name', signer_title: 'Designation', signature_image_url: '', font_size: 11 },
    line: { width: 300, height: 6, line_color: '#000000', line_width: 2 },
    qrcode: { x: cw - 140, y: ch - 140, width: 100, height: 100, verify_url: '', font_size: 8 },
  };
  return { ...base, ...(defs[type] || {}), ...extra };
};

export default function CertificateDesigner() {
  const { id: tplId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [tpl, setTpl] = useState({
    name: 'Untitled Template', type: 'membership', orientation: 'landscape',
    page_width: CANVAS_L.w, page_height: CANVAS_L.h,
    background_color: '#ffffff', background_image_url: '', linked_membership_type: '', elements: []
  });
  const [selId, setSelId] = useState(null);
  const [dragState, setDragState] = useState(null); // { id, ox, oy, startX, startY, isDragging }
  const [resizing, setResizing] = useState(null);
  const [editingId, setEditingId] = useState(null); // inline text editing
  const [showPH, setShowPH] = useState(false);
  const [scale, setScale] = useState(0.7);
  const [showLinkMenu, setShowLinkMenu] = useState(false);

  const isNew = !tplId || tplId === 'new';
  const cw = tpl.orientation === 'landscape' ? CANVAS_L.w : CANVAS_P.w;
  const ch = tpl.orientation === 'landscape' ? CANVAS_L.h : CANVAS_P.h;
  const selEl = tpl.elements.find(e => e.id === selId);
  const BACKEND = process.env.REACT_APP_BACKEND_URL;

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    if (!isNew) {
      axios.get(`${API}/admin/certificate-templates/${tplId}`).then(r => setTpl(r.data)).catch(() => showToast('Failed to load template'));
    }
  }, [tplId, isNew]);

  // Auto-fit scale on load
  useEffect(() => {
    const fit = () => {
      const avail = Math.min(window.innerWidth - 500, 960);
      setScale(Math.min(avail / cw, 0.78));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [cw]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (editingId) return; // Don't capture keys while inline editing
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selId) {
        e.preventDefault();
        setTpl(t => ({ ...t, elements: t.elements.filter(el => el.id !== selId) }));
        setSelId(null);
      }
      if (e.key === 'Escape') {
        setSelId(null);
        setEditingId(null);
      }
      // Arrow keys to nudge
      if (selId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const delta = { ArrowUp: { y: -step }, ArrowDown: { y: step }, ArrowLeft: { x: -step }, ArrowRight: { x: step } }[e.key];
        setTpl(t => ({
          ...t, elements: t.elements.map(el => {
            if (el.id !== selId) return el;
            return {
              ...el,
              x: Math.max(0, Math.min(cw - 20, (el.x || 0) + (delta.x || 0))),
              y: Math.max(0, Math.min(ch - 20, (el.y || 0) + (delta.y || 0)))
            };
          })
        }));
      }
      // Ctrl+D to duplicate
      if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selId) {
        e.preventDefault();
        const el = tpl.elements.find(el => el.id === selId);
        if (el) {
          const ne = { ...el, id: uid(), x: el.x + 15, y: el.y + 15 };
          setTpl(t => ({ ...t, elements: [...t.elements, ne] }));
          setSelId(ne.id);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selId, editingId, cw, ch, tpl.elements]);

  // Mouse wheel zoom on canvas
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setScale(s => Math.max(0.2, Math.min(2.0, s - e.deltaY * 0.001)));
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const updateEl = useCallback((id, patch) => {
    setTpl(t => ({ ...t, elements: t.elements.map(e => e.id === id ? { ...e, ...patch } : e) }));
  }, []);

  const addElement = (type, extra = {}) => {
    const el = mkEl(type, cw, ch, extra);
    setTpl(t => ({ ...t, elements: [...t.elements, el] }));
    setSelId(el.id); setShowPH(false); setEditingId(null);
  };

  const deleteEl = () => {
    if (selId) {
      setTpl(t => ({ ...t, elements: t.elements.filter(e => e.id !== selId) }));
      setSelId(null); setEditingId(null);
    }
  };

  const dupEl = () => {
    if (selEl) {
      const ne = { ...selEl, id: uid(), x: selEl.x + 15, y: selEl.y + 15 };
      setTpl(t => ({ ...t, elements: [...t.elements, ne] }));
      setSelId(ne.id);
    }
  };

  const moveLayer = (dir) => {
    if (!selId) return;
    setTpl(t => {
      const els = [...t.elements];
      const i = els.findIndex(e => e.id === selId);
      if (i < 0) return t;
      const ni = dir === 'up' ? Math.min(i + 1, els.length - 1) : Math.max(i - 1, 0);
      [els[i], els[ni]] = [els[ni], els[i]];
      return { ...t, elements: els };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!isNew) {
        await axios.put(`${API}/admin/certificate-templates/${tplId}`, tpl);
      } else {
        const r = await axios.post(`${API}/admin/certificate-templates`, tpl);
        navigate(`/admin/certificates/design/${r.data.id}`, { replace: true });
      }
      showToast('Saved!');
    } catch { showToast('Save failed'); }
    setSaving(false);
  };

  const handlePreview = async () => {
    try {
      if (!isNew) {
        await axios.put(`${API}/admin/certificate-templates/${tplId}`, tpl);
        const r = await axios.post(`${API}/admin/certificate-templates/${tplId}/preview`, {}, { responseType: 'blob' });
        window.open(URL.createObjectURL(r.data), '_blank');
      } else {
        const cr = await axios.post(`${API}/admin/certificate-templates`, tpl);
        navigate(`/admin/certificates/design/${cr.data.id}`, { replace: true });
        const r = await axios.post(`${API}/admin/certificate-templates/${cr.data.id}/preview`, {}, { responseType: 'blob' });
        window.open(URL.createObjectURL(r.data), '_blank');
      }
    } catch { showToast('Preview failed'); }
  };

  const handleLinkPlan = async (mtype) => {
    setTpl(t => ({ ...t, linked_membership_type: mtype }));
    if (!isNew) {
      try { await axios.put(`${API}/admin/certificate-templates/${tplId}/link-plan`, { membership_type: mtype }); showToast(mtype ? `Linked to ${mtype}` : 'Unlinked'); } catch { showToast('Link failed'); }
    }
    setShowLinkMenu(false);
  };

  const uploadFile = async (file) => {
    const fd = new FormData(); fd.append('file', file);
    const r = await axios.post(`${API}/public/upload-photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return r.data.file_url;
  };
  const handleBgUpload = async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const url = await uploadFile(f); setTpl(t => ({ ...t, background_image_url: url })); showToast('Background uploaded'); } catch { showToast('Upload failed'); } };
  const handleImgUpload = async (e, elId) => { const f = e.target.files?.[0]; if (!f) return; try { const url = await uploadFile(f); updateEl(elId, { image_url: url }); } catch { showToast('Upload failed'); } };
  const handleSigUpload = async (e, elId) => { const f = e.target.files?.[0]; if (!f) return; try { const url = await uploadFile(f); updateEl(elId, { signature_image_url: url }); } catch { showToast('Upload failed'); } };

  const getUrl = (p) => p ? (p.startsWith('http') ? p : `${BACKEND}${p.startsWith('/') ? '' : '/'}${p}`) : '';

  // Mouse coordinate transformation (screen -> canvas space)
  const toCanvas = useCallback((e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const r = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  }, [scale]);

  // Mouse handlers with drag threshold
  const onElDown = (e, el) => {
    e.stopPropagation();
    if (editingId === el.id) return; // Don't drag while inline editing
    const c = toCanvas(e);
    setDragState({
      id: el.id, ox: c.x - el.x, oy: c.y - el.y,
      startX: e.clientX, startY: e.clientY, isDragging: false
    });
    setSelId(el.id);
  };

  const onElDoubleClick = (e, el) => {
    e.stopPropagation();
    if (el.type === 'text') {
      setEditingId(el.id);
      setSelId(el.id);
    }
  };

  const onResizeDown = (e, el, corner = 'se') => {
    e.stopPropagation();
    setSelId(el.id);
    const c = toCanvas(e);
    setResizing({ id: el.id, corner, sx: c.x, sy: c.y, ow: el.width, oh: el.height, ox: el.x, oy: el.y });
  };

  const onMove = useCallback((e) => {
    if (dragState) {
      const dx = Math.abs(e.clientX - dragState.startX);
      const dy = Math.abs(e.clientY - dragState.startY);
      if (!dragState.isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
        setDragState(prev => prev ? { ...prev, isDragging: true } : null);
      }
      if (dragState.isDragging || dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        const c = toCanvas(e);
        updateEl(dragState.id, {
          x: Math.round(Math.max(0, Math.min(cw - 20, c.x - dragState.ox))),
          y: Math.round(Math.max(0, Math.min(ch - 20, c.y - dragState.oy)))
        });
      }
    }
    if (resizing) {
      const c = toCanvas(e);
      const dx = c.x - resizing.sx;
      const dy = c.y - resizing.sy;
      if (resizing.corner === 'se') {
        updateEl(resizing.id, {
          width: Math.max(30, Math.round(resizing.ow + dx)),
          height: Math.max(10, Math.round(resizing.oh + dy))
        });
      } else if (resizing.corner === 'sw') {
        const newW = Math.max(30, Math.round(resizing.ow - dx));
        updateEl(resizing.id, {
          x: Math.round(resizing.ox + resizing.ow - newW),
          width: newW,
          height: Math.max(10, Math.round(resizing.oh + dy))
        });
      } else if (resizing.corner === 'ne') {
        updateEl(resizing.id, {
          width: Math.max(30, Math.round(resizing.ow + dx)),
          height: Math.max(10, Math.round(resizing.oh - dy)),
          y: Math.round(resizing.oy + resizing.oh - Math.max(10, Math.round(resizing.oh - dy)))
        });
      } else if (resizing.corner === 'nw') {
        const newW = Math.max(30, Math.round(resizing.ow - dx));
        const newH = Math.max(10, Math.round(resizing.oh - dy));
        updateEl(resizing.id, {
          x: Math.round(resizing.ox + resizing.ow - newW),
          y: Math.round(resizing.oy + resizing.oh - newH),
          width: newW, height: newH
        });
      }
    }
  }, [dragState, resizing, toCanvas, updateEl, cw, ch]);

  const onUp = useCallback(() => {
    setDragState(null);
    setResizing(null);
  }, []);

  const onCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.dataset.canvasbg) {
      setSelId(null);
      setEditingId(null);
    }
  };

  // Inline text editing handler
  const handleInlineEdit = (elId, newContent) => {
    updateEl(elId, { content: newContent });
  };

  const finishInlineEdit = () => {
    setEditingId(null);
  };

  // Resize handle component
  const ResizeHandles = ({ el }) => {
    const isSel = el.id === selId;
    if (!isSel) return null;
    const hs = { position: 'absolute', width: 10, height: 10, background: '#3b82f6', borderRadius: '50%', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', zIndex: 200 };
    return (
      <>
        <div onMouseDown={e => onResizeDown(e, el, 'nw')} style={{ ...hs, top: -5, left: -5, cursor: 'nw-resize' }} />
        <div onMouseDown={e => onResizeDown(e, el, 'ne')} style={{ ...hs, top: -5, right: -5, cursor: 'ne-resize' }} />
        <div onMouseDown={e => onResizeDown(e, el, 'sw')} style={{ ...hs, bottom: -5, left: -5, cursor: 'sw-resize' }} />
        <div onMouseDown={e => onResizeDown(e, el, 'se')} style={{ ...hs, bottom: -5, right: -5, cursor: 'se-resize' }} />
      </>
    );
  };

  // Canvas element rendering
  const renderEl = (el) => {
    const isSel = el.id === selId;
    const isEditing = editingId === el.id;
    const wf = FONT_WEB_MAP[el.font_family] || 'Arial, sans-serif';
    const base = {
      position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
      cursor: dragState?.isDragging && dragState?.id === el.id ? 'grabbing' : 'grab',
      outline: isSel ? '2px solid #3b82f6' : 'none', outlineOffset: '2px',
      zIndex: isSel ? 100 : 1, opacity: (el.opacity || 100) / 100,
    };

    if (el.type === 'text' || el.type === 'placeholder') {
      const txt = el.type === 'placeholder' ? `{{${el.placeholder_key}}}` : el.content;
      return (
        <div key={el.id} style={{
          ...base,
          color: el.color, fontFamily: wf, fontSize: el.font_size,
          fontWeight: el.font_weight === 'bold' ? 700 : 400,
          fontStyle: el.font_style === 'italic' ? 'italic' : 'normal',
          textAlign: el.text_align,
          textDecoration: el.text_decoration === 'underline' ? 'underline' : 'none',
          display: 'flex', alignItems: 'flex-start',
          justifyContent: el.text_align === 'center' ? 'center' : el.text_align === 'right' ? 'flex-end' : 'flex-start',
          background: el.type === 'placeholder' ? 'rgba(59,130,246,0.06)' : (isSel ? 'rgba(59,130,246,0.03)' : 'transparent'),
          border: isSel ? 'none' : (el.type === 'placeholder' ? '1px dashed rgba(59,130,246,0.35)' : 'none'),
          borderRadius: el.type === 'placeholder' ? '3px' : 0,
          overflow: isEditing ? 'visible' : 'hidden',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          userSelect: isEditing ? 'text' : 'none',
          lineHeight: 1.3, padding: '2px 4px', boxSizing: 'border-box',
          cursor: isEditing ? 'text' : base.cursor,
          minHeight: el.height,
        }}
          onMouseDown={e => !isEditing && onElDown(e, el)}
          onDoubleClick={e => onElDoubleClick(e, el)}
          data-testid={`canvas-el-${el.id}`}
        >
          {isEditing ? (
            <textarea
              autoFocus
              value={el.content}
              onChange={e => handleInlineEdit(el.id, e.target.value)}
              onBlur={finishInlineEdit}
              onKeyDown={e => { if (e.key === 'Escape') finishInlineEdit(); }}
              style={{
                width: '100%', height: '100%', minHeight: el.height - 4,
                border: '2px solid #3b82f6', borderRadius: '2px',
                outline: 'none', resize: 'none',
                fontFamily: wf, fontSize: el.font_size, color: el.color,
                fontWeight: el.font_weight === 'bold' ? 700 : 400,
                fontStyle: el.font_style === 'italic' ? 'italic' : 'normal',
                textAlign: el.text_align, lineHeight: 1.3,
                background: 'rgba(255,255,255,0.95)', padding: '2px 4px',
                boxSizing: 'border-box',
              }}
              data-testid={`inline-edit-${el.id}`}
            />
          ) : (
            <span style={{ width: '100%', pointerEvents: 'none' }}>{txt}</span>
          )}
          {!isEditing && <ResizeHandles el={el} />}
        </div>
      );
    }

    if (el.type === 'image') {
      const src = getUrl(el.image_url);
      return (
        <div key={el.id} style={{
          ...base, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: src ? 'transparent' : 'rgba(0,0,0,0.04)',
          border: src ? 'none' : '1px dashed #ccc', borderRadius: '4px'
        }}
          onMouseDown={e => onElDown(e, el)} data-testid={`canvas-el-${el.id}`}>
          {src ? (
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#9ca3af', fontSize: 11 }}>
              <Image size={24} style={{ color: '#bbb' }} />
              <span>Click to upload</span>
              <input type="file" accept="image/*" onChange={e => handleImgUpload(e, el.id)} style={{ display: 'none' }} />
            </label>
          )}
          <ResizeHandles el={el} />
        </div>
      );
    }

    if (el.type === 'signature_block') {
      const sigSrc = getUrl(el.signature_image_url);
      return (
        <div key={el.id} style={{
          ...base, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end', gap: 1, padding: '4px'
        }}
          onMouseDown={e => onElDown(e, el)} data-testid={`canvas-el-${el.id}`}>
          {sigSrc && <img src={sigSrc} alt="sig" style={{ maxHeight: '38%', maxWidth: '75%', objectFit: 'contain' }} draggable={false} />}
          <div style={{ width: '75%', height: '1px', background: '#888', margin: '3px 0 2px' }} />
          <div style={{ fontSize: Math.max(8, el.font_size * 0.9), fontWeight: 700, color: el.color, fontFamily: wf, textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{el.signer_name}</div>
          <div style={{ fontSize: Math.max(7, el.font_size * 0.75), color: el.color, fontFamily: wf, textAlign: 'center', lineHeight: 1.1, whiteSpace: 'nowrap', opacity: 0.75 }}>{el.signer_title}</div>
          <ResizeHandles el={el} />
        </div>
      );
    }

    if (el.type === 'line') {
      return (
        <div key={el.id} style={{ ...base, display: 'flex', alignItems: 'center' }}
          onMouseDown={e => onElDown(e, el)} data-testid={`canvas-el-${el.id}`}>
          <div style={{ width: '100%', height: el.line_width || 2, background: el.line_color || '#000', borderRadius: el.line_width > 3 ? '2px' : 0 }} />
          <ResizeHandles el={el} />
        </div>
      );
    }

    if (el.type === 'qrcode') {
      return (
        <div key={el.id} style={{
          ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: isSel ? 'rgba(59,130,246,0.05)' : '#fafafa',
          border: isSel ? 'none' : '1px dashed #94a3b8', borderRadius: '6px',
        }}
          onMouseDown={e => onElDown(e, el)} data-testid={`canvas-el-${el.id}`}>
          <div style={{ width: '70%', height: '70%', background: 'white', border: '2px solid #111', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <QrCode size={Math.min(el.width, el.height) * 0.45} style={{ color: '#111' }} />
          </div>
          <div style={{ fontSize: Math.max(6, el.font_size * 0.7), color: '#6b7280', marginTop: '3px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>IDSEA-XXXX-XXXX</div>
          <ResizeHandles el={el} />
        </div>
      );
    }

    return null;
  };

  // Properties panel styles
  const inputS = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', background: '#fff', boxSizing: 'border-box' };
  const labelS = { fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '3px', display: 'block' };
  const rowS = { marginBottom: '10px' };

  const PropsPanel = () => {
    if (!selEl) return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
        <Layers size={28} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
        <p style={{ margin: '0 0 8px' }}>Click an element to edit</p>
        <div style={{ fontSize: '11px', color: '#c5c8cd', lineHeight: 1.5 }}>
          <div>Double-click text to edit inline</div>
          <div>Arrow keys to nudge (Shift+Arrow = 10px)</div>
          <div>Delete key to remove</div>
          <div>Ctrl+D to duplicate</div>
          <div>Ctrl+Scroll to zoom</div>
        </div>
      </div>
    );
    const upd = (k, v) => updateEl(selId, { [k]: v });

    return (
      <div style={{ padding: '12px', fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'capitalize', color: '#111' }}>{selEl.type.replace('_', ' ')}</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            <button onClick={dupEl} title="Duplicate (Ctrl+D)" style={iconBtnS} data-testid="prop-duplicate"><Copy size={12} /></button>
            <button onClick={deleteEl} title="Delete" style={{ ...iconBtnS, background: '#fee2e2', color: '#dc2626' }} data-testid="prop-delete"><Trash2 size={12} /></button>
          </div>
        </div>

        {/* Position & Size */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', ...rowS }}>
          {[['X', 'x'], ['Y', 'y'], ['W', 'width'], ['H', 'height']].map(([l, k]) => (
            <div key={k}><label style={labelS}>{l}</label><input type="number" value={Math.round(selEl[k] || 0)} onChange={e => upd(k, +e.target.value)} style={inputS} data-testid={`prop-${k}`} /></div>
          ))}
        </div>

        {/* Opacity */}
        <div style={rowS}>
          <label style={labelS}>Opacity ({selEl.opacity || 100}%)</label>
          <input type="range" min={10} max={100} value={selEl.opacity || 100} onChange={e => upd('opacity', +e.target.value)} style={{ width: '100%', accentColor: '#3b82f6' }} data-testid="prop-opacity" />
        </div>

        {/* Text & Placeholder props */}
        {(selEl.type === 'text' || selEl.type === 'placeholder') && (
          <>
            {selEl.type === 'text' && (
              <div style={rowS}>
                <label style={labelS}>Content <span style={{ color: '#3b82f6', fontWeight: 400, fontSize: '10px' }}>(or double-click on canvas)</span></label>
                <textarea
                  value={selEl.content}
                  onChange={e => upd('content', e.target.value)}
                  style={{ ...inputS, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.4' }}
                  data-testid="prop-content" rows={3}
                />
              </div>
            )}
            {selEl.type === 'placeholder' && (
              <div style={rowS}>
                <label style={labelS}>Dynamic Field</label>
                <select value={selEl.placeholder_key} onChange={e => { upd('placeholder_key', e.target.value); upd('content', `{{${e.target.value}}}`); }} style={inputS} data-testid="prop-placeholder-key">
                  {PLACEHOLDERS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
            )}

            <div style={rowS}><label style={labelS}>Font Family</label>
              <select value={selEl.font_family} onChange={e => upd('font_family', e.target.value)} style={inputS} data-testid="prop-font-family">
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', ...rowS }}>
              <div><label style={labelS}>Font Size</label><input type="number" value={selEl.font_size} onChange={e => upd('font_size', Math.max(6, Math.min(120, +e.target.value)))} style={inputS} min={6} max={120} data-testid="prop-font-size" /></div>
              <div><label style={labelS}>Color</label><input type="color" value={selEl.color} onChange={e => upd('color', e.target.value)} style={{ ...inputS, padding: '2px', height: '32px', cursor: 'pointer' }} data-testid="prop-color" /></div>
            </div>

            {/* Style toggles */}
            <div style={{ display: 'flex', gap: '3px', ...rowS }}>
              {[{ val: 'bold', icon: Bold, key: 'font_weight' }, { val: 'italic', icon: Italic, key: 'font_style' }].map(({ val, icon: Icon, key }) => (
                <button key={val} onClick={() => upd(key, selEl[key] === val ? 'normal' : val)}
                  style={{ ...toggleBtnS, background: selEl[key] === val ? '#dbeafe' : '#f9fafb', borderColor: selEl[key] === val ? '#93c5fd' : '#d1d5db' }}
                  data-testid={`prop-${val}`}>
                  <Icon size={13} />
                </button>
              ))}
              <button onClick={() => upd('text_decoration', selEl.text_decoration === 'underline' ? 'none' : 'underline')}
                style={{ ...toggleBtnS, background: selEl.text_decoration === 'underline' ? '#dbeafe' : '#f9fafb', borderColor: selEl.text_decoration === 'underline' ? '#93c5fd' : '#d1d5db' }}
                data-testid="prop-underline">
                <Underline size={13} />
              </button>
              <div style={{ width: '1px', background: '#e5e7eb', margin: '0 2px' }} />
              {[{ val: 'left', icon: AlignLeft }, { val: 'center', icon: AlignCenter }, { val: 'right', icon: AlignRight }].map(({ val, icon: Icon }) => (
                <button key={val} onClick={() => upd('text_align', val)}
                  style={{ ...toggleBtnS, background: selEl.text_align === val ? '#dbeafe' : '#f9fafb', borderColor: selEl.text_align === val ? '#93c5fd' : '#d1d5db' }}
                  data-testid={`prop-align-${val}`}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Image props */}
        {selEl.type === 'image' && (
          <div style={rowS}>
            <label style={labelS}>Image</label>
            {selEl.image_url ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <img src={getUrl(selEl.image_url)} alt="" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                <button onClick={() => upd('image_url', '')} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>Remove</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px', background: '#f9fafb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', border: '1px dashed #d1d5db', justifyContent: 'center', fontWeight: 600, color: '#374151' }}>
                <Upload size={14} /> Upload Image
                <input type="file" accept="image/*" onChange={e => handleImgUpload(e, selEl.id)} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        )}

        {/* Signature props */}
        {selEl.type === 'signature_block' && (
          <>
            <div style={rowS}><label style={labelS}>Signer Name</label><input value={selEl.signer_name} onChange={e => upd('signer_name', e.target.value)} style={inputS} data-testid="prop-signer-name" /></div>
            <div style={rowS}><label style={labelS}>Designation / Title</label><input value={selEl.signer_title} onChange={e => upd('signer_title', e.target.value)} style={inputS} data-testid="prop-signer-title" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', ...rowS }}>
              <div><label style={labelS}>Font Size</label><input type="number" value={selEl.font_size} onChange={e => upd('font_size', +e.target.value)} style={inputS} /></div>
              <div><label style={labelS}>Color</label><input type="color" value={selEl.color} onChange={e => upd('color', e.target.value)} style={{ ...inputS, padding: '2px', height: '32px' }} /></div>
            </div>
            <div style={rowS}>
              <label style={labelS}>Signature Image</label>
              {selEl.signature_image_url ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <img src={getUrl(selEl.signature_image_url)} alt="" style={{ width: 64, height: 32, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
                  <button onClick={() => upd('signature_image_url', '')} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>Remove</button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px', background: '#f9fafb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', border: '1px dashed #d1d5db', justifyContent: 'center', fontWeight: 600, color: '#374151' }}>
                  <Upload size={14} /> Upload Signature
                  <input type="file" accept="image/*" onChange={e => handleSigUpload(e, selEl.id)} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <div style={rowS}><label style={labelS}>Font</label>
              <select value={selEl.font_family} onChange={e => upd('font_family', e.target.value)} style={inputS}>
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Line props */}
        {selEl.type === 'line' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', ...rowS }}>
            <div><label style={labelS}>Color</label><input type="color" value={selEl.line_color || '#000'} onChange={e => upd('line_color', e.target.value)} style={{ ...inputS, padding: '2px', height: '32px' }} /></div>
            <div><label style={labelS}>Thickness</label><input type="number" value={selEl.line_width || 2} onChange={e => upd('line_width', Math.max(1, +e.target.value))} style={inputS} min={1} max={20} /></div>
          </div>
        )}

        {/* QR Code props */}
        {selEl.type === 'qrcode' && (
          <>
            <div style={rowS}>
              <label style={labelS}>Verification URL Base</label>
              <input value={selEl.verify_url || ''} onChange={e => upd('verify_url', e.target.value)} style={inputS} placeholder="https://yoursite.com/verify" data-testid="prop-verify-url" />
              <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px' }}>QR will encode: [URL]?id=[cert_id]. Leave empty for just cert ID.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', ...rowS }}>
              <div><label style={labelS}>ID Font Size</label><input type="number" value={selEl.font_size || 8} onChange={e => upd('font_size', +e.target.value)} style={inputS} min={4} max={16} /></div>
              <div><label style={labelS}>Text Color</label><input type="color" value={selEl.color || '#000'} onChange={e => upd('color', e.target.value)} style={{ ...inputS, padding: '2px', height: '32px' }} /></div>
            </div>
          </>
        )}

        {/* Layer controls */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', marginTop: '8px' }}>
          <label style={labelS}>Layer Order</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => moveLayer('up')} style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#f9fafb', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }} data-testid="prop-layer-up">Bring Forward</button>
            <button onClick={() => moveLayer('down')} style={{ flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#f9fafb', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }} data-testid="prop-layer-down">Send Back</button>
          </div>
        </div>
      </div>
    );
  };

  const bgUrl = getUrl(tpl.background_image_url);
  const linkedPlan = PLAN_OPTIONS.find(p => p.value === tpl.linked_membership_type);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)', margin: '-24px', background: '#eef1f5' }}>
      {toast && <div style={{ position: 'fixed', top: 80, right: 20, background: '#065f46', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, zIndex: 300, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} data-testid="designer-toast">{toast}</div>}

      {/* Toolbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }} data-testid="designer-toolbar">
        <button onClick={() => navigate('/admin/certificates')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }} data-testid="back-btn"><ArrowLeft size={18} /></button>
        <input value={tpl.name} onChange={e => setTpl(t => ({ ...t, name: e.target.value }))} style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '14px', color: '#111', border: 'none', background: 'transparent', width: '200px', outline: 'none' }} data-testid="template-name-input" />

        <select value={tpl.type} onChange={e => setTpl(t => ({ ...t, type: e.target.value }))} style={selectS} data-testid="template-type-select">
          <option value="membership">Membership</option><option value="event">Event</option><option value="custom">Custom</option>
        </select>
        <select value={tpl.orientation} onChange={e => { const o = e.target.value; setTpl(t => ({ ...t, orientation: o, page_width: o === 'landscape' ? CANVAS_L.w : CANVAS_P.w, page_height: o === 'landscape' ? CANVAS_L.h : CANVAS_P.h })); }}
          style={selectS} data-testid="orientation-select">
          <option value="landscape">Landscape</option><option value="portrait">Portrait</option>
        </select>

        {/* Plan link */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowLinkMenu(!showLinkMenu)} style={{ ...toolBtnS, background: tpl.linked_membership_type ? '#d1fae5' : '#f3f4f6', color: tpl.linked_membership_type ? '#065f46' : '#6b7280' }} data-testid="link-plan-btn">
            {tpl.linked_membership_type ? <Link2 size={13} /> : <Unlink size={13} />}
            <span style={{ fontSize: '11px' }}>{linkedPlan?.label || 'Link Plan'}</span>
            <ChevronDown size={12} />
          </button>
          {showLinkMenu && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', padding: '4px', zIndex: 200, width: '200px', marginTop: '4px' }}>
              {PLAN_OPTIONS.map(p => (
                <button key={p.value} onClick={() => handleLinkPlan(p.value)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', border: 'none', background: tpl.linked_membership_type === p.value ? '#d1fae5' : 'transparent', cursor: 'pointer', fontSize: '12px', borderRadius: '4px', color: '#374151', fontWeight: tpl.linked_membership_type === p.value ? 700 : 400 }}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Element tools */}
        <div style={{ display: 'flex', gap: '2px', background: '#f3f4f6', borderRadius: '8px', padding: '3px' }}>
          <button onClick={() => addElement('text')} title="Add Text" style={toolBtnS} data-testid="add-text-btn"><Type size={13} /><span style={{ fontSize: '11px' }}>Text</span></button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowPH(!showPH)} title="Add Placeholder" style={toolBtnS} data-testid="add-placeholder-btn"><Braces size={13} /><span style={{ fontSize: '11px' }}>Field</span></button>
            {showPH && (
              <div style={{ position: 'absolute', top: '100%', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', padding: '4px', zIndex: 200, width: '220px', maxHeight: '280px', overflowY: 'auto', marginTop: '4px' }}>
                {PLACEHOLDERS.map(p => (
                  <button key={p.key} onClick={() => addElement('placeholder', { placeholder_key: p.key, content: `{{${p.key}}}` })}
                    style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '7px 10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', borderRadius: '4px', color: '#374151' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <span style={{ fontWeight: 600 }}>{p.label}</span>
                    <span style={{ color: '#9ca3af', fontSize: '10px', fontFamily: 'monospace' }}>{`{{${p.key}}}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => addElement('image')} title="Add Image" style={toolBtnS} data-testid="add-image-btn"><Image size={13} /><span style={{ fontSize: '11px' }}>Image</span></button>
          <button onClick={() => addElement('signature_block')} title="Add Signature" style={toolBtnS} data-testid="add-signature-btn"><PenLine size={13} /><span style={{ fontSize: '11px' }}>Sign</span></button>
          <button onClick={() => addElement('line')} title="Add Line" style={toolBtnS} data-testid="add-line-btn"><Minus size={13} /><span style={{ fontSize: '11px' }}>Line</span></button>
          <button onClick={() => addElement('qrcode')} title="Add QR Code" style={toolBtnS} data-testid="add-qrcode-btn"><QrCode size={13} /><span style={{ fontSize: '11px' }}>QR</span></button>
        </div>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button onClick={() => setScale(s => Math.max(0.2, +(s - 0.1).toFixed(1)))} style={iconBtnS} data-testid="zoom-out-btn"><ZoomOut size={13} /></button>
          <span style={{ fontSize: '11px', color: '#6b7280', minWidth: '36px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(2.0, +(s + 0.1).toFixed(1)))} style={iconBtnS} data-testid="zoom-in-btn"><ZoomIn size={13} /></button>
          <button onClick={() => { const avail = Math.min(window.innerWidth - 500, 960); setScale(Math.min(avail / cw, 0.78)); }} title="Fit to view" style={iconBtnS} data-testid="zoom-fit-btn"><RotateCcw size={13} /></button>
        </div>

        <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />
        <button onClick={handlePreview} style={{ ...actionBtnS, background: '#f0f9ff', color: '#1e40af' }} data-testid="preview-btn"><Eye size={14} /> Preview PDF</button>
        <button onClick={handleSave} disabled={saving} style={{ ...actionBtnS, background: '#0c3c60', color: '#fff' }} data-testid="save-template-btn"><Save size={14} /> {saving ? '...' : 'Save'}</button>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{ width: '190px', background: '#fff', borderRight: '1px solid #e5e7eb', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '10px' }}>
            <div style={sectionTitleS}>Background</div>
            <div style={{ marginBottom: '8px' }}>
              <label style={labelS}>Color</label>
              <input type="color" value={tpl.background_color} onChange={e => setTpl(t => ({ ...t, background_color: e.target.value }))} style={{ width: '100%', height: '26px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} data-testid="bg-color-input" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelS}>Image</label>
              {tpl.background_image_url ? (
                <div style={{ position: 'relative' }}>
                  <img src={bgUrl} alt="bg" style={{ width: '100%', height: '55px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  <button onClick={() => setTpl(t => ({ ...t, background_image_url: '' }))} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={10} color="white" /></button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#f9fafb', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', border: '1px dashed #d1d5db', justifyContent: 'center', fontWeight: 600, color: '#6b7280' }}>
                  <Upload size={12} /> Upload BG
                  <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} data-testid="bg-upload-input" />
                </label>
              )}
            </div>

            <div style={{ ...sectionTitleS, borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>Elements ({tpl.elements.length})</div>
            {tpl.elements.length === 0 && <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>No elements yet. Use toolbar to add.</p>}
            {tpl.elements.map(el => (
              <div key={el.id} onClick={() => { setSelId(el.id); setEditingId(null); }} data-testid={`layer-${el.id}`}
                style={{ padding: '5px 7px', borderRadius: '5px', cursor: 'pointer', marginBottom: '1px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px',
                  background: el.id === selId ? '#dbeafe' : 'transparent', color: el.id === selId ? '#1e40af' : '#555' }}>
                <GripVertical size={9} style={{ color: '#ccc', flexShrink: 0 }} />
                {el.type === 'text' && <Type size={10} />}{el.type === 'placeholder' && <Braces size={10} />}
                {el.type === 'image' && <Image size={10} />}{el.type === 'signature_block' && <PenLine size={10} />}
                {el.type === 'line' && <Minus size={10} />}
                {el.type === 'qrcode' && <QrCode size={10} />}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {el.type === 'text' ? (el.content?.slice(0, 16) || 'Text') : el.type === 'placeholder' ? `{{${el.placeholder_key}}}` : el.type === 'signature_block' ? el.signer_name : el.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div ref={canvasWrapRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', background: '#dde0e5', padding: '16px' }}>
          <div ref={canvasRef} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onClick={onCanvasClick}
            style={{
              width: cw, height: ch, position: 'relative', background: tpl.background_color,
              backgroundImage: bgUrl ? `url(${bgUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
              boxShadow: '0 4px 30px rgba(0,0,0,0.2)', transform: `scale(${scale})`, transformOrigin: 'center center',
              borderRadius: '2px', overflow: 'hidden', flexShrink: 0,
            }} data-testid="certificate-canvas">
            <div data-canvasbg="true" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
            {tpl.elements.map(renderEl)}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: '250px', background: '#fff', borderLeft: '1px solid #e5e7eb', overflowY: 'auto', flexShrink: 0 }} data-testid="properties-panel">
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Properties</div>
          </div>
          <PropsPanel />
        </div>
      </div>
    </div>
  );
}

const toolBtnS = { display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 9px', border: 'none', borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '12px', color: '#374151', whiteSpace: 'nowrap' };
const iconBtnS = { background: '#f3f4f6', border: 'none', borderRadius: '5px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const toggleBtnS = { flex: 1, padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f9fafb' };
const actionBtnS = { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins' };
const selectS = { padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', background: '#f9fafb', color: '#374151' };
const sectionTitleS = { fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' };
