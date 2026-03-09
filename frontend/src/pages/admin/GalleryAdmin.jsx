import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, X, Image } from 'lucide-react';
import { API } from '../../contexts/AuthContext';
import { FileUpload } from '../../components/admin/FileUpload';

export default function GalleryAdmin() {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [albumForm, setAlbumForm] = useState({ title: '', description: '', cover_image: '', category: 'conference' });
  const [photoForm, setPhotoForm] = useState({ image_url: '', title: '' });
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadAlbums = () => axios.get(`${API}/admin/gallery/albums`).then(r => setAlbums(r.data));
  const loadPhotos = (albumId) => axios.get(`${API}/admin/gallery/photos/${albumId}`).then(r => setPhotos(r.data));

  useEffect(() => { loadAlbums(); }, []);

  const openAlbum = (album) => { setSelectedAlbum(album); loadPhotos(album.id); };

  const createAlbum = async () => {
    try {
      await axios.post(`${API}/admin/gallery/albums`, albumForm);
      showToast('Album created!'); setShowAlbumModal(false); setAlbumForm({ title: '', description: '', cover_image: '', category: 'conference' }); loadAlbums();
    } catch { showToast('Error'); }
  };

  const deleteAlbum = async (id) => {
    if (!window.confirm('Delete album and all its photos?')) return;
    await axios.delete(`${API}/admin/gallery/albums/${id}`);
    showToast('Album deleted'); loadAlbums(); if (selectedAlbum?.id === id) setSelectedAlbum(null);
  };

  const addPhoto = async () => {
    try {
      await axios.post(`${API}/admin/gallery/photos`, { ...photoForm, album_id: selectedAlbum.id });
      showToast('Photo added!'); setShowPhotoModal(false); setPhotoForm({ image_url: '', title: '' }); loadPhotos(selectedAlbum.id);
    } catch { showToast('Error'); }
  };

  const deletePhoto = async (id) => {
    await axios.delete(`${API}/admin/gallery/photos/${id}`);
    showToast('Photo deleted'); loadPhotos(selectedAlbum.id);
  };

  return (
    <div>
      {toast && <div className="toast-success">{toast}</div>}
      {selectedAlbum ? (
        <div>
          <div className="page-header">
            <div>
              <button onClick={() => setSelectedAlbum(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e7a4d', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600, padding: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>← Back to Albums</button>
              <h1 className="page-title">{selectedAlbum.title}</h1>
            </div>
            <button onClick={() => setShowPhotoModal(true)} className="btn-primary" data-testid="add-photo-btn"><Plus size={16} /> Add Photo</button>
          </div>
          {photos.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}><Image size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} /><p>No photos yet. Add your first photo!</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {photos.map(photo => (
                <div key={photo.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: '#f1f5f9' }}>
                  <img src={photo.image_url} alt={photo.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s ease', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '8px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                  >
                    <button onClick={() => deletePhoto(photo.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {photo.title && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '6px', fontSize: '11px', color: 'white' }}>{photo.title}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="page-header">
            <h1 className="page-title">Gallery Management</h1>
            <button onClick={() => setShowAlbumModal(true)} className="btn-primary" data-testid="add-album-btn"><Plus size={16} /> Create Album</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {albums.length === 0 ? <div className="admin-card" style={{ textAlign: 'center', color: '#9ca3af' }}>No albums yet.</div> :
              albums.map(album => (
                <div key={album.id} className="admin-card" data-testid="album-card" style={{ cursor: 'pointer', padding: '0', overflow: 'hidden' }}>
                  <div onClick={() => openAlbum(album)} style={{ position: 'relative' }}>
                    <div style={{ height: '140px', background: '#0c3c60', position: 'relative', overflow: 'hidden' }}>
                      {album.cover_image ? <img src={album.cover_image} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Image size={32} style={{ color: 'rgba(255,255,255,0.3)' }} /></div>}
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{album.photo_count || 0} photos</div>
                    </div>
                    <div style={{ padding: '14px' }}>
                      <h3 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{album.title}</h3>
                      <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontFamily: 'Poppins', fontWeight: 600 }}>{album.category}</span>
                    </div>
                  </div>
                  <div style={{ padding: '0 14px 14px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => deleteAlbum(album.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Poppins' }}><Trash2 size={13} /> Delete</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {showAlbumModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Create Album</h2>
              <button onClick={() => setShowAlbumModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="form-group"><label className="form-label">Album Title *</label><input value={albumForm.title} onChange={e => setAlbumForm({ ...albumForm, title: e.target.value })} className="form-input" required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea value={albumForm.description} onChange={e => setAlbumForm({ ...albumForm, description: e.target.value })} className="form-textarea" rows={2} /></div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select value={albumForm.category} onChange={e => setAlbumForm({ ...albumForm, category: e.target.value })} className="form-select">
                {['conference', 'fieldvisit', 'workshop', 'research', 'other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cover Image</label>
              <FileUpload accept="image/*" label="Upload Cover Image" onUpload={(url) => setAlbumForm({ ...albumForm, cover_image: url })} />
              <input type="url" value={albumForm.cover_image} onChange={e => setAlbumForm({ ...albumForm, cover_image: e.target.value })} className="form-input" placeholder="Or paste URL" style={{ marginTop: '6px' }} />
              {albumForm.cover_image && <img src={albumForm.cover_image} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', marginTop: '6px' }} onError={e => e.target.style.display='none'} />}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAlbumModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={createAlbum} className="btn-primary" data-testid="save-album-btn">Create Album</button>
            </div>
          </div>
        </div>
      )}

      {showPhotoModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: 700, color: '#0c3c60', margin: 0 }}>Add Photo</h2>
              <button onClick={() => setShowPhotoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Photo *</label>
              <FileUpload accept="image/*" label="Upload Photo" onUpload={(url) => setPhotoForm({ ...photoForm, image_url: url })} />
              <input type="url" value={photoForm.image_url} onChange={e => setPhotoForm({ ...photoForm, image_url: e.target.value })} className="form-input" placeholder="Or paste URL" style={{ marginTop: '6px' }} />
            </div>
            <div className="form-group"><label className="form-label">Caption (Optional)</label><input value={photoForm.title} onChange={e => setPhotoForm({ ...photoForm, title: e.target.value })} className="form-input" /></div>
            {photoForm.image_url && <img src={photoForm.image_url} alt="preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} onError={e => e.target.style.display = 'none'} />}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPhotoModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={addPhoto} className="btn-primary" data-testid="save-photo-btn">Add Photo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
