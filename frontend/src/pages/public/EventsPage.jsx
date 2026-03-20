import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Calendar, MapPin, IndianRupee, ArrowRight, Download, ExternalLink } from 'lucide-react';
import { API } from '../../contexts/AuthContext';

const STATUS_COLORS = { upcoming: '#1e7a4d', ongoing: '#d97706', completed: '#6b7280' };

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/public/events`).then(r => { setEvents(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter);

  return (
    <div style={{ background: '#f8fafc' }}>
      <PublicNavbar />
      <div style={{ paddingTop: '170px' }}>
        <div style={{ background: '#0c3c60', padding: '60px 24px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, marginBottom: '12px' }}>Events & Conferences</h1>
          <p style={{ fontSize: '15px', opacity: 0.8, fontFamily: 'Inter, sans-serif' }}>Dairy science conferences, workshops, and seminars</p>
        </div>

        <div style={{ background: 'white', padding: '16px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'upcoming', 'ongoing', 'completed'].map(s => (
              <button key={s} onClick={() => setFilter(s)} data-testid={`events-filter-${s}`} style={{
                padding: '7px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px',
                fontFamily: 'Poppins, sans-serif', fontWeight: 500, transition: 'all 0.2s ease',
                background: filter === s ? '#0c3c60' : '#f1f5f9',
                color: filter === s ? 'white' : '#374151'
              }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
          {loading ? <div className="loading-spinner">Loading events...</div> : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
              <Calendar size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
              <p style={{ fontFamily: 'Poppins, sans-serif' }}>No events found.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '24px' }}>
              {filtered.map(event => {
                const imgSrc = event.image_url ? (event.image_url.startsWith('http') ? event.image_url : `${process.env.REACT_APP_BACKEND_URL}${event.image_url}`) : '';
                const brochureSrc = event.brochure_url ? (event.brochure_url.startsWith('http') ? event.brochure_url : `${process.env.REACT_APP_BACKEND_URL}${event.brochure_url}`) : '';
                return (
                <div key={event.id} data-testid="event-card" style={{
                  background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  border: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: imgSrc ? '240px 1fr' : '1fr',
                  overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                >
                  {imgSrc && <img src={imgSrc} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '200px' }} />}
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span style={{ background: STATUS_COLORS[event.status] + '20', color: STATUS_COLORS[event.status], padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>
                        {event.status?.toUpperCase()}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '12px', lineHeight: 1.4 }}>{event.title}</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#6b7280', fontSize: '13px' }}>
                        <Calendar size={14} style={{ color: '#1e7a4d' }} />
                        <span>{event.date}{event.end_date ? ` - ${event.end_date}` : ''}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#6b7280', fontSize: '13px' }}>
                        <MapPin size={14} style={{ color: '#1e7a4d' }} />
                        <span>{event.venue}</span>
                        {event.venue_map_link && (
                          <a href={event.venue_map_link} target="_blank" rel="noreferrer" data-testid="venue-map-link"
                            style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                            <ExternalLink size={11} /> View on Map
                          </a>
                        )}
                      </div>
                      {event.registration_fee > 0 && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#6b7280', fontSize: '13px' }}>
                          <IndianRupee size={14} style={{ color: '#1e7a4d' }} />
                          <span>{event.registration_fee}</span>
                        </div>
                      )}
                    </div>
                    {event.description && <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.6, margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>{event.description}</p>}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
                      {event.registration_enabled && event.status !== 'completed' && (
                        <Link to={`/events/${event.id}/register`} data-testid="event-register-btn" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                          Register Now <ArrowRight size={14} />
                        </Link>
                      )}
                      {brochureSrc && (
                        <a href={brochureSrc} target="_blank" rel="noreferrer" download data-testid="download-brochure-btn"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px',
                            background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#1e7a4d', fontSize: '13px',
                            fontFamily: 'Poppins, sans-serif', fontWeight: 600, textDecoration: 'none', cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#d1fae5'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; }}>
                          <Download size={14} /> Download Brochure
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
