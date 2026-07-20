import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

export function FileUpload({ onUpload, accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx", label = "Upload File" }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Max 10MB allowed'); return; }
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await axios.post(`${API}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Store relative path only (works on any domain)
      const fileUrl = r.data.file_url;
      setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
      onUpload(fileUrl, r.data.original_name);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: '2px dashed #d1d5db', borderRadius: '10px', padding: '16px',
          textAlign: 'center', cursor: uploading ? 'wait' : 'pointer',
          background: '#fafafa', transition: 'border-color 0.2s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#0c3c60'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}
        data-testid="file-upload-zone"
      >
        <input ref={inputRef} type="file" accept={accept} onChange={handleFile} style={{ display: 'none' }} />
        {uploading ? (
          <div style={{ color: '#6b7280', fontSize: '13px', fontFamily: 'Inter' }}>Uploading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <Upload size={20} style={{ color: '#9ca3af' }} />
            <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'Inter' }}>{label}</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Max 10MB</span>
          </div>
        )}
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
    </div>
  );
}
