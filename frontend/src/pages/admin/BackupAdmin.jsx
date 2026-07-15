import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { HardDrive, Download, Upload, Trash2, AlertTriangle, Database, Image, RefreshCw, Info, CheckCircle, Loader2, FolderOpen } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

export default function BackupAdmin() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [restoring, setRestoring] = useState('');
  const [showFactoryReset, setShowFactoryReset] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetOptions, setResetOptions] = useState({ keep_admin: true, clear_uploads: false });
  const [resetting, setResetting] = useState(false);
  const dbFileRef = useRef(null);
  const uploadsFileRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const loadInfo = () => {
    setLoading(true);
    axios.get(`${API}/admin/backup/info`).then(r => { setInfo(r.data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { loadInfo(); }, []);

  const downloadBackup = async (type) => {
    try {
      showToast(`Preparing ${type} backup...`);
      const r = await axios.get(`${API}/admin/backup/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = r.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || `idsea_${type}_backup.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`${type} backup downloaded!`);
    } catch (e) { showToast('Error downloading backup'); }
  };

  const handleRestore = async (type) => {
    const fileRef = type === 'database' ? dbFileRef : uploadsFileRef;
    const file = fileRef.current?.files[0];
    if (!file) { showToast('Select a ZIP file first'); return; }
    if (!file.name.endsWith('.zip')) { showToast('Only ZIP files accepted'); return; }
    if (!window.confirm(`Restore ${type} from "${file.name}"? This will OVERWRITE existing ${type === 'database' ? 'data' : 'files'}.`)) return;

    setRestoring(type);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const r = await axios.post(`${API}/admin/restore/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      showToast(r.data.message);
      fileRef.current.value = '';
      loadInfo();
    } catch (e) { showToast('Restore failed: ' + (e.response?.data?.detail || e.message)); }
    setRestoring('');
  };

  const handleFactoryReset = async () => {
    if (resetConfirm !== 'DELETE_ALL_DATA') { showToast('Type DELETE_ALL_DATA to confirm'); return; }
    setResetting(true);
    try {
      const r = await axios.post(`${API}/admin/factory-reset`, {
        confirm: 'DELETE_ALL_DATA',
        keep_admin: resetOptions.keep_admin,
        clear_uploads: resetOptions.clear_uploads,
      });
      showToast(r.data.message);
      setShowFactoryReset(false);
      setResetConfirm('');
      loadInfo();
    } catch (e) { showToast('Error: ' + (e.response?.data?.detail || e.message)); }
    setResetting(false);
  };

  const cardS = { background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };
  const labelS = { fontSize: '12px', color: '#6b7280', fontWeight: 600, fontFamily: 'Poppins', marginBottom: '4px' };
  const inputS = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div data-testid="backup-admin">
      {toast && <div className="toast-success" data-testid="toast">{toast}</div>}

      <div className="page-header">
        <h1 className="page-title">Backup & Restore</h1>
        <button onClick={loadInfo} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <RefreshCw size={14} /> Refresh Info
        </button>
      </div>

      {/* System Info */}
      {info && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div style={{ ...cardS, textAlign: 'center' }} data-testid="stat-documents">
            <Database size={22} style={{ color: '#0c3c60', marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0c3c60', fontFamily: 'Poppins' }}>{info.database.total_documents}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Documents</div>
          </div>
          <div style={{ ...cardS, textAlign: 'center' }} data-testid="stat-collections">
            <FolderOpen size={22} style={{ color: '#7c3aed', marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed', fontFamily: 'Poppins' }}>{Object.keys(info.database.collections).length}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Collections</div>
          </div>
          <div style={{ ...cardS, textAlign: 'center' }} data-testid="stat-files">
            <Image size={22} style={{ color: '#1e7a4d', marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e7a4d', fontFamily: 'Poppins' }}>{info.uploads.file_count}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Uploaded Files ({info.uploads.size_mb} MB)</div>
          </div>
        </div>
      )}

      {/* Download Backups */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Database Backup */}
        <div style={cardS} data-testid="backup-database-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={20} style={{ color: '#0c3c60' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Database Backup</h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>All collections as JSON in ZIP</p>
            </div>
          </div>
          {info && (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '14px', fontSize: '12px', color: '#374151', lineHeight: 1.7 }}>
              {Object.entries(info.database.collections).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => downloadBackup('database')} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} data-testid="download-db-btn">
            <Download size={15} /> Download Database Backup
          </button>
        </div>

        {/* Uploads Backup */}
        <div style={cardS} data-testid="backup-uploads-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image size={20} style={{ color: '#1e7a4d' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Uploads / Photos Backup</h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>All images, brochures, certificates</p>
            </div>
          </div>
          {info && (
            <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '12px', marginBottom: '14px', fontSize: '12px', color: '#374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Files</span><strong>{info.uploads.file_count}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Size</span><strong>{info.uploads.size_mb} MB</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Server Path</span><strong style={{ fontSize: '10px', color: '#6b7280' }}>{info.uploads.restore_path}</strong></div>
            </div>
          )}
          <button onClick={() => downloadBackup('uploads')} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#1e7a4d' }} data-testid="download-uploads-btn">
            <Download size={15} /> Download Uploads Backup
          </button>
        </div>
      </div>

      {/* Restore Section */}
      <div style={{ ...cardS, marginBottom: '24px' }} data-testid="restore-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Upload size={20} style={{ color: '#d97706' }} />
          <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Restore from Backup</h3>
        </div>

        <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} style={{ color: '#92400e', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: 1.6 }}>
            <strong>Warning:</strong> Restoring will <strong>OVERWRITE</strong> existing data. Make sure you have a current backup before restoring. Database restore replaces entire collections. Uploads restore adds/overwrites files.
          </p>
        </div>

        {info && (
          <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}><Info size={13} /> <strong>Restore Paths (for manual restore via SSH)</strong></div>
            <div style={{ fontSize: '11px', color: '#374151', fontFamily: 'monospace' }}>
              <div>Database: <strong>mongorestore --db idsea_db &lt;backup_folder&gt;</strong></div>
              <div>Uploads: <strong>{info.uploads.restore_path}</strong></div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelS}>Restore Database (ZIP)</label>
            <input ref={dbFileRef} type="file" accept=".zip" style={inputS} data-testid="restore-db-file" />
            <button onClick={() => handleRestore('database')} className="btn-secondary" disabled={!!restoring} style={{ marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }} data-testid="restore-db-btn">
              {restoring === 'database' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {restoring === 'database' ? 'Restoring...' : 'Restore Database'}
            </button>
          </div>
          <div>
            <label style={labelS}>Restore Uploads (ZIP)</label>
            <input ref={uploadsFileRef} type="file" accept=".zip" style={inputS} data-testid="restore-uploads-file" />
            <button onClick={() => handleRestore('uploads')} className="btn-secondary" disabled={!!restoring} style={{ marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }} data-testid="restore-uploads-btn">
              {restoring === 'uploads' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {restoring === 'uploads' ? 'Restoring...' : 'Restore Uploads'}
            </button>
          </div>
        </div>
      </div>

      {/* Factory Reset */}
      <div style={{ ...cardS, border: '2px solid #fca5a5' }} data-testid="factory-reset-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={20} style={{ color: '#dc2626' }} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#dc2626', margin: 0 }}>Factory Reset</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Delete ALL data and start fresh. This cannot be undone.</p>
          </div>
        </div>

        {!showFactoryReset ? (
          <button onClick={() => setShowFactoryReset(true)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: '6px' }} data-testid="show-factory-reset-btn">
            <AlertTriangle size={14} /> Start Factory Reset
          </button>
        ) : (
          <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '20px', border: '1px solid #fca5a5' }}>
            <div style={{ background: '#dc2626', color: 'white', borderRadius: '8px', padding: '14px', marginBottom: '14px', textAlign: 'center' }}>
              <AlertTriangle size={24} style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'Poppins' }}>DANGER ZONE</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>This will permanently delete ALL members, events, payments, certificates, and CMS content.</div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={resetOptions.keep_admin} onChange={e => setResetOptions({ ...resetOptions, keep_admin: e.target.checked })} />
                Keep admin account
              </label>
              <label style={{ fontSize: '12px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={resetOptions.clear_uploads} onChange={e => setResetOptions({ ...resetOptions, clear_uploads: e.target.checked })} />
                Also delete uploaded files
              </label>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ ...labelS, color: '#dc2626' }}>Type DELETE_ALL_DATA to confirm</label>
              <input value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} style={{ ...inputS, borderColor: '#fca5a5' }} placeholder="DELETE_ALL_DATA" data-testid="factory-reset-confirm" />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowFactoryReset(false); setResetConfirm(''); }} className="btn-secondary">Cancel</button>
              <button onClick={handleFactoryReset} disabled={resetConfirm !== 'DELETE_ALL_DATA' || resetting} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: resetConfirm === 'DELETE_ALL_DATA' ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 700, fontFamily: 'Poppins', opacity: resetConfirm === 'DELETE_ALL_DATA' ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '6px' }} data-testid="factory-reset-btn">
                {resetting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {resetting ? 'Resetting...' : 'Factory Reset Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
