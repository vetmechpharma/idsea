import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Image, X } from 'lucide-react';
import SEOHead from '../../components/SEOHead';
import { API } from '../../contexts/AuthContext';

export default function GalleryPage() {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pc, setPc] = useState({});

  useEffect(() => {
    axios.get(`${API}/public/gallery`).then(r => { setAlbums(r.data); setLoading(false); }).catch(() => setLoading(false));
    axios.get(`${API}/public/page-content/gallery`).then(r => setPc(r.data)).catch(() => {});
  }, []);

  return (
    <div style={{ background: '#f8fafc' }}>
      <SEOHead page="gallery" fallback={{ title: 'IDSEA Photo Gallery', description: 'Browse photos from IDSEA conferences, field visits, workshops and events.' }} />
      <PublicNavbar />
      <div style={{ paddingTop: '170px' }}>
        <div style={{ background: '#0c3c60', padding: '60px 24px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, marginBottom: '12px' }}>{pc.hero_title || 'Photo Gallery'}</h1>
          <p style={{ fontSize: '15px', opacity: 0.8, fontFamily: 'Inter, sans-serif' }}>{pc.hero_subtitle || 'Conferences, field visits, workshops, and research events'}</p>
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
          {selectedAlbum ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', fontWeight: 700, color: '#0c3c60', margin: '0 0 4px' }}>{selectedAlbum.title}</h2>
                  {selectedAlbum.description && <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>{selectedAlbum.description}</p>}
                </div>
                <button onClick={() => setSelectedAlbum(null)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#374151' }}>
                  &larr; Back to Albums
                </button>
              </div>
              {selectedAlbum.photos?.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0' }}>No photos in this album yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {selectedAlbum.photos?.map(photo => (
                    <div key={photo.id} onClick={() => setLightboxImg(photo)} style={{ cursor: 'pointer', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1', position: 'relative' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <img src={photo.image_url} alt={photo.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="loading-spinner">Loading gallery...</div>
          ) : albums.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
              <Image size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
              <p style={{ fontFamily: 'Poppins, sans-serif' }}>No albums yet. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {albums.map(album => (
                <div key={album.id} data-testid="gallery-album-card" onClick={() => setSelectedAlbum(album)} style={{
                  background: 'white', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ height: '180px', background: '#0c3c60', position: 'relative', overflow: 'hidden' }}>
                    {album.cover_image ? (
                      <img src={album.cover_image} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Image size={40} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontFamily: 'Poppins, sans-serif' }}>
                      {album.photo_count} photos
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>{album.category}</span>
                    <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: 700, color: '#111827', margin: '8px 0 4px' }}>{album.title}</h3>
                    {album.description && <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, fontFamily: 'Inter, sans-serif' }}>{album.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <button onClick={() => setLightboxImg(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
          <img src={lightboxImg.image_url} alt={lightboxImg.title || ''} onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }} />
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
