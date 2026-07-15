import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import SEOHead from '../../components/SEOHead';
import {
  Calendar, MapPin, Clock, Download, ArrowRight, ArrowLeft,
  Users, Award, IndianRupee, Phone, Mail, Hotel, Globe,
  ChevronRight, ChevronLeft, ExternalLink, Target, Navigation,
  Plane, Train, Cloud, Camera, User, QrCode
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;
const resolveUrl = (u) => u ? (u.startsWith('http') ? u : `${BACKEND}${u.startsWith('/') ? '' : '/'}${u}`) : '';

const COLOR_MAP = {
  blue: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', accent: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
  green: { bg: '#f0fdf4', border: '#86efac', text: '#166534', accent: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #15803d)' },
  red: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', accent: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
  amber: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', accent: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  purple: { bg: '#faf5ff', border: '#c4b5fd', text: '#581c87', accent: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #7e22ce)' },
  pink: { bg: '#fdf2f8', border: '#f9a8d4', text: '#831843', accent: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #be185d)' },
};

const STATUS_BADGE = {
  active: { label: 'Open Now', bg: '#22c55e' },
  closed: { label: 'Closed', bg: '#6b7280' },
  '': { label: 'Upcoming', bg: '#3b82f6' },
};

/* ─── Countdown Timer ─── */
function Countdown({ targetDate, label }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setExpired(true); return; }
      setTime({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [targetDate]);
  if (expired) return null;
  const Box = ({ v, l }) => (
    <div style={{ textAlign: 'center', minWidth: '60px' }}>
      <div style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, color: 'white', fontFamily: 'Poppins', lineHeight: 1, background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 6px', backdropFilter: 'blur(4px)' }}>{String(v).padStart(2, '0')}</div>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '6px', fontWeight: 600 }}>{l}</div>
    </div>
  );
  return (
    <div data-testid="countdown-timer" style={{ display: 'inline-block' }}>
      {label && <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', textAlign: 'center', fontFamily: 'Poppins' }}>{label}</div>}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
        <Box v={time.d} l="Days" /><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '28px', fontWeight: 300, marginTop: '-14px' }}>:</span>
        <Box v={time.h} l="Hours" /><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '28px', fontWeight: 300, marginTop: '-14px' }}>:</span>
        <Box v={time.m} l="Mins" /><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '28px', fontWeight: 300, marginTop: '-14px' }}>:</span>
        <Box v={time.s} l="Secs" />
      </div>
    </div>
  );
}

/* ─── Gallery Slider ─── */
function GallerySlider({ images }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const resolved = images.map(resolveUrl).filter(Boolean);
  const len = resolved.length;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % len), 5000);
  }, [len]);

  useEffect(() => {
    if (len > 1) resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [len, resetTimer]);

  if (len === 0) return null;
  const go = (dir) => { setIdx(p => (p + dir + len) % len); resetTimer(); };

  return (
    <div data-testid="gallery-slider" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      {resolved.map((src, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: i === idx ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }} />
      ))}
      {len > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 5, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}><ChevronLeft size={20} color="white" /></button>
          <button onClick={() => go(1)} aria-label="Next" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 5, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}><ChevronRight size={20} color="white" /></button>
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 5 }}>
            {resolved.map((_, i) => (
              <button key={i} onClick={() => { setIdx(i); resetTimer(); }} style={{ width: i === idx ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === idx ? 'white' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Section Heading ─── */
function SectionTitle({ title, color = '#1e7a4d', icon: Icon }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
      {Icon && <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '14px', background: `${color}12`, marginBottom: '12px' }}><Icon size={22} style={{ color }} /></div>}
      <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '0', lineHeight: 1.3 }}>{title}</h2>
      <div style={{ width: '50px', height: '4px', background: color, borderRadius: '2px', margin: '10px auto 0' }} />
    </div>
  );
}

/* ─── Fallback Avatar ─── */
function Avatar({ src, name, size = 80 }) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveUrl(src);
  if (resolved && !failed) {
    return <img src={resolved} alt={name} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
      <User size={size * 0.4} style={{ color: 'white' }} />
    </div>
  );
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */
export default function EventDetailPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/public/events/${eventId}`).then(r => setEvent(r.data)),
      axios.get(`${API}/public/events/${eventId}/details`).then(r => setDetails(r.data)).catch(() => {}),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PublicNavbar /><div className="loading-spinner">Loading event...</div></div>;
  if (!event) return <div style={{ minHeight: '100vh' }}><PublicNavbar /><div style={{ paddingTop: '200px', textAlign: 'center', color: '#9ca3af' }}><h2>Event not found</h2><Link to="/events" style={{ color: '#2563eb' }}>Back to Events</Link></div><PublicFooter /></div>;

  const imgSrc = resolveUrl(event.image_url);
  const brochureSrc = resolveUrl(event.brochure_url);
  const galleryImages = details.gallery_images || [];
  const themes = (details.themes || []).filter(t => t.trim());
  const importantDates = details.important_dates || [];
  const sponsors = details.sponsors || [];
  const committee = details.committee || [];
  const hotels = event.premium_hotels || details.hotels || [];
  const contacts = details.contacts || [];
  const feeTiers = event.fee_tiers || [];
  const venueInfo = details.venue_info || {};
  const aboutContent = details.about_content || event.description || '';
  const objectives = (details.objectives || '').split('\n').filter(o => o.trim());
  const highlights = (details.highlights || '').split('\n').filter(h => h.trim());
  const awards = (details.awards || '').split('\n').filter(a => a.trim());
  const countdownDate = details.countdown_date || '';
  const countdownLabel = details.countdown_label || 'Registration Closes In';
  const sightseeingPlaces = details.sightseeing_places || [];
  const weather = details.weather || '';
  const howToReach = details.how_to_reach || '';
  const hasVenueSection = venueInfo.address || venueInfo.map_embed_url || howToReach || weather || sightseeingPlaces.length > 0;

  return (
    <div data-testid="event-detail-page" style={{ background: '#f8fafc' }}>
      <SEOHead page="events" fallback={{ title: `${event.title} | IDSEA`, description: event.description?.slice(0, 160) }} />
      <PublicNavbar />

      {/* ═══ HERO BANNER ═══ */}
      <div data-testid="event-hero" style={{ position: 'relative', minHeight: '75vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#0c3c60', zIndex: 0 }} />
        {galleryImages.length > 0 ? (
          <GallerySlider images={galleryImages} />
        ) : imgSrc ? (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }} />
        ) : null}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(180deg, rgba(12,60,96,0.55) 0%, rgba(12,60,96,0.92) 70%, rgba(12,60,96,0.98) 100%)' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '180px 24px 70px', position: 'relative', zIndex: 3, width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span data-testid="event-status-badge" style={{ background: event.status === 'upcoming' ? '#1e7a4d' : event.status === 'ongoing' ? '#d97706' : '#6b7280', color: 'white', padding: '5px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'Poppins', textTransform: 'uppercase', letterSpacing: '1px' }}>{event.status}</span>
            {event.registration_enabled && <span style={{ background: 'rgba(255,255,255,0.12)', color: 'white', padding: '5px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>Registration Open</span>}
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px, 4.5vw, 48px)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '20px', maxWidth: '900px', margin: '0 auto 20px', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>{event.title}</h1>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', color: 'rgba(255,255,255,0.9)', fontSize: '15px', fontFamily: 'Inter, sans-serif', marginBottom: '32px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} style={{ color: '#4ade80' }} />{event.date}{event.end_date ? ` - ${event.end_date}` : ''}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} style={{ color: '#4ade80' }} />{event.venue}</span>
          </div>
          {countdownDate && <Countdown targetDate={countdownDate} label={countdownLabel} />}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
            {brochureSrc && (
              <a href={brochureSrc} target="_blank" rel="noreferrer" data-testid="brochure-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '14px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, fontFamily: 'Poppins', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}>
                <Download size={16} /> Download Brochure
              </a>
            )}
            {event.registration_enabled && event.status !== 'completed' && (
              <Link to={`/events/${event.id}/register`} data-testid="hero-register-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #1e7a4d, #15803d)', color: 'white', padding: '14px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, fontFamily: 'Poppins', textDecoration: 'none', boxShadow: '0 4px 20px rgba(30,122,77,0.4)', transition: 'transform 0.2s' }}>
                Register Now <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ABOUT / WELCOME ═══ */}
      {aboutContent && (
        <section data-testid="about-section" style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <SectionTitle title="About the Event" color="#1e7a4d" icon={Globe} />
            <p style={{ color: '#374151', fontSize: '15px', lineHeight: 1.9, fontFamily: 'Inter, sans-serif', whiteSpace: 'pre-wrap', textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>{aboutContent}</p>
            {objectives.length > 0 && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={18} style={{ color: '#1e7a4d' }} /> Key Objectives</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {objectives.map((o, i) => (
                    <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px 18px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', alignItems: 'flex-start' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: '#1e7a4d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                        <span style={{ color: 'white', fontSize: '11px', fontWeight: 800, fontFamily: 'Poppins' }}>{i + 1}</span>
                      </div>
                      <span style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, fontFamily: 'Inter' }}>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {highlights.length > 0 && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '18px' }}>Conference Highlights</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                  {highlights.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '14px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', alignItems: 'flex-start' }}>
                      <ChevronRight size={16} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, fontFamily: 'Inter' }}>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ CONFERENCE THEMES ═══ */}
      {themes.length > 0 && (
        <section data-testid="themes-section" style={{ padding: '80px 24px', background: '#f8fafc' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <SectionTitle title="Conference Themes" color="#d97706" icon={Target} />
            <div style={{ display: 'grid', gap: '14px' }}>
              {themes.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', padding: '20px 24px', background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #e8edf2', transition: 'box-shadow 0.2s' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #0c3c60, #1a5f8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 800, fontFamily: 'Poppins', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.7, fontFamily: 'Inter', paddingTop: '2px' }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ IMPORTANT DATES (Colorful) ═══ */}
      {importantDates.length > 0 && (
        <section data-testid="important-dates-section" style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <SectionTitle title="Important Dates" color="#dc2626" icon={Calendar} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {importantDates.map((d, i) => {
                const c = COLOR_MAP[d.color] || COLOR_MAP.blue;
                const st = STATUS_BADGE[d.status || ''] || STATUS_BADGE[''];
                return (
                  <div key={i} data-testid={`date-card-${i}`} style={{ background: c.bg, borderRadius: '16px', padding: '28px 20px', textAlign: 'center', border: `2px solid ${c.border}`, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: c.gradient }} />
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: c.gradient, marginBottom: '14px' }}>
                      <Clock size={20} style={{ color: 'white' }} />
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'Inter', marginBottom: '8px', fontWeight: 500 }}>{d.label}</div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: c.text, fontFamily: 'Poppins', marginBottom: '10px' }}>{d.date}</div>
                    <span style={{ display: 'inline-block', background: st.bg, color: 'white', padding: '3px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Poppins' }}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ REGISTRATION FEE TABLE ═══ */}
      {feeTiers.length > 0 && (
        <section data-testid="fee-section" style={{ padding: '80px 24px', background: '#f8fafc' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <SectionTitle title="Registration Fee" color="#1e7a4d" icon={IndianRupee} />
            <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e8edf2' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(90deg, #0c3c60, #1a5f8a)' }}>
                      <th style={{ padding: '16px 18px', color: 'white', textAlign: 'left', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600 }}>Tier / Deadline</th>
                      <th style={{ padding: '16px 18px', color: 'white', textAlign: 'center', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600 }}>Member</th>
                      <th style={{ padding: '16px 18px', color: 'white', textAlign: 'center', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600 }}>Non-Member</th>
                      <th style={{ padding: '16px 18px', color: 'white', textAlign: 'center', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600 }}>Student</th>
                      <th style={{ padding: '16px 18px', color: 'white', textAlign: 'center', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600 }}>International</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeTiers.map((t, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#0c3c60', fontSize: '14px', fontFamily: 'Poppins' }}>{t.name}</div>
                          {t.deadline && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Deadline: {t.deadline}</div>}
                        </td>
                        <td style={{ padding: '16px 18px', textAlign: 'center', fontWeight: 700, color: '#1e7a4d', fontSize: '14px' }}>{t.fees?.member ? `\u20B9${Number(t.fees.member).toLocaleString()}` : '-'}</td>
                        <td style={{ padding: '16px 18px', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '14px' }}>{t.fees?.non_member ? `\u20B9${Number(t.fees.non_member).toLocaleString()}` : '-'}</td>
                        <td style={{ padding: '16px 18px', textAlign: 'center', fontWeight: 600, color: '#7c3aed', fontSize: '14px' }}>{t.fees?.student ? `\u20B9${Number(t.fees.student).toLocaleString()}` : '-'}</td>
                        <td style={{ padding: '16px 18px', textAlign: 'center', fontWeight: 600, color: '#2563eb', fontSize: '14px' }}>{t.fees?.international ? `$${Number(t.fees.international).toLocaleString()}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ AWARDS (Badge + Ribbon Style) ═══ */}
      {awards.length > 0 && (
        <section data-testid="awards-section" style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <SectionTitle title="Awards & Recognitions" color="#d97706" icon={Award} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
              {awards.map((a, i) => {
                const badgeColors = [
                  { medal: 'linear-gradient(145deg, #fbbf24, #f59e0b, #d97706)', ribbon: '#b45309', ring: '#fcd34d', shine: '#fef3c7' },
                  { medal: 'linear-gradient(145deg, #c0c0c0, #a8a8a8, #909090)', ribbon: '#6b7280', ring: '#d1d5db', shine: '#f3f4f6' },
                  { medal: 'linear-gradient(145deg, #d4a574, #cd7f32, #a0522d)', ribbon: '#78350f', ring: '#d97706', shine: '#fef3c7' },
                  { medal: 'linear-gradient(145deg, #a78bfa, #8b5cf6, #7c3aed)', ribbon: '#5b21b6', ring: '#c4b5fd', shine: '#ede9fe' },
                  { medal: 'linear-gradient(145deg, #34d399, #10b981, #059669)', ribbon: '#065f46', ring: '#6ee7b7', shine: '#ecfdf5' },
                  { medal: 'linear-gradient(145deg, #60a5fa, #3b82f6, #2563eb)', ribbon: '#1e40af', ring: '#93c5fd', shine: '#eff6ff' },
                ];
                const c = badgeColors[i % badgeColors.length];
                return (
                  <div key={i} data-testid={`award-badge-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    {/* Badge Medal */}
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      {/* Ribbon tails */}
                      <div style={{ position: 'absolute', bottom: '-18px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '28px', zIndex: 0 }}>
                        <div style={{ position: 'absolute', left: '0', top: '0', width: '28px', height: '28px', background: c.ribbon, clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 70%)', opacity: 0.9 }} />
                        <div style={{ position: 'absolute', right: '0', top: '0', width: '28px', height: '28px', background: c.ribbon, clipPath: 'polygon(0 0, 100% 0, 100% 70%, 30% 100%)', opacity: 0.9 }} />
                      </div>
                      {/* Outer ring */}
                      <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: c.medal, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.3)`, position: 'relative', zIndex: 1 }}>
                        {/* Inner circle */}
                        <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: c.shine, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${c.ring}`, boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.08)' }}>
                          <Award size={26} style={{ color: c.ribbon }} />
                        </div>
                      </div>
                    </div>
                    {/* Award Name */}
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', fontFamily: 'Poppins', lineHeight: 1.4, marginTop: '14px', maxWidth: '160px' }}>{a}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ SPONSORSHIP PACKAGES ═══ */}
      {sponsors.length > 0 && (
        <section data-testid="sponsors-section" style={{ padding: '80px 24px', background: '#f8fafc' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <SectionTitle title="Sponsorship Packages" color="#7c3aed" icon={Users} />
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(sponsors.length, 4)}, 1fr)`, gap: '20px' }}>
              {sponsors.map((s, i) => {
                const tierColor = s.color || '#7c3aed';
                return (
                  <div key={i} data-testid={`sponsor-card-${i}`} style={{ background: 'white', borderRadius: '18px', padding: '0', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #e8edf2', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Colored header strip */}
                    <div style={{ background: tierColor, padding: '22px 20px 18px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)' }} />
                      <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0, position: 'relative', zIndex: 1 }}>{s.name}</h3>
                    </div>
                    {/* Amount */}
                    <div style={{ padding: '20px 20px 0' }}>
                      <div style={{ fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 800, color: '#0c3c60', fontFamily: 'Poppins', lineHeight: 1.2 }}>{s.amount}</div>
                    </div>
                    {/* Benefits */}
                    {s.benefits && (
                      <div style={{ padding: '16px 20px 24px', flex: 1, textAlign: 'left' }}>
                        <div style={{ width: '36px', height: '2px', background: tierColor, margin: '0 auto 14px', opacity: 0.5, borderRadius: '1px' }} />
                        {s.benefits.split('\n').filter(b => b.trim()).map((b, j) => (
                          <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start', fontSize: '13px', color: '#4b5563', lineHeight: 1.5, fontFamily: 'Inter' }}>
                            <span style={{ color: tierColor, fontWeight: 700, flexShrink: 0, fontSize: '14px' }}>&#10003;</span>
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CONFERENCE COMMITTEE (with Photos) ═══ */}
      {committee.length > 0 && (
        <section data-testid="committee-section" style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <SectionTitle title="Conference Committee" color="#0c3c60" icon={Users} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {committee.map((c, i) => (
                <div key={i} data-testid={`committee-card-${i}`} style={{ background: '#f8fafc', borderRadius: '18px', padding: '28px 18px', textAlign: 'center', border: '1px solid #e2e8f0', transition: 'box-shadow 0.2s, transform 0.2s', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(135deg, #0c3c60, #1a5f8a)', borderRadius: '18px 18px 0 0' }} />
                  <div style={{ position: 'relative', zIndex: 1, marginTop: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
                    <Avatar src={c.photo_url} name={c.name} size={76} />
                  </div>
                  {c.role && <div style={{ fontSize: '10px', color: '#1e7a4d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Poppins', marginBottom: '6px', background: '#f0fdf4', display: 'inline-block', padding: '3px 10px', borderRadius: '6px' }}>{c.role}</div>}
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', fontFamily: 'Poppins', marginBottom: '4px', lineHeight: 1.3 }}>{c.name}</div>
                  {c.affiliation && <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Inter', lineHeight: 1.5, marginBottom: '6px' }}>{c.affiliation}</div>}
                  {c.phone && <div style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}><Phone size={10} />{c.phone}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ ACCOMMODATION ═══ */}
      {hotels.length > 0 && (
        <section data-testid="hotels-section" style={{ padding: '80px 24px', background: '#f8fafc' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <SectionTitle title="Accommodation" color="#d97706" icon={Hotel} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {hotels.map((h, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '28px 22px', boxShadow: '0 2px 14px rgba(0,0,0,0.05)', border: '1px solid #e8edf2' }}>
                  <Hotel size={22} style={{ color: '#d97706', marginBottom: '12px' }} />
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>{h.name}</h3>
                  {h.location && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px', display: 'flex', gap: '4px', alignItems: 'center' }}><MapPin size={12} />{h.location}</div>}
                  {h.room_types?.map((r, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#374151' }}>{r.type}</span>
                      <span style={{ fontWeight: 700, color: '#1e7a4d' }}>{'\u20B9'}{Number(r.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ VENUE, MAP & TRAVEL ═══ */}
      {hasVenueSection && (
        <section data-testid="venue-section" style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <SectionTitle title="Venue & Travel" color="#2563eb" icon={MapPin} />

            {/* Venue Card with Map */}
            {(venueInfo.name || venueInfo.address) && (
              <div style={{ background: 'linear-gradient(135deg, #0c3c60, #1a5f8a)', borderRadius: '20px', padding: '36px 32px', color: 'white', marginBottom: '28px', overflow: 'hidden' }}>
                <div className={`event-venue-grid${venueInfo.map_embed_url ? ' has-map' : ''}`}>
                  <div className="venue-text" style={{ textAlign: venueInfo.map_embed_url ? 'left' : 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.12)', marginBottom: '16px' }}>
                      <MapPin size={22} style={{ color: '#4ade80' }} />
                    </div>
                    <h3 style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>{venueInfo.name || event.venue}</h3>
                    {venueInfo.address && <p style={{ fontSize: '14px', opacity: 0.85, lineHeight: 1.7, margin: '0 0 16px' }}>{venueInfo.address}</p>}
                    <div className="venue-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: venueInfo.map_embed_url ? 'flex-start' : 'center' }}>
                      {(venueInfo.map_qr_link || event.venue_map_link) && (
                        <a href={venueInfo.map_qr_link || event.venue_map_link} target="_blank" rel="noreferrer" data-testid="map-directions-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <Navigation size={14} /> Get Directions
                        </a>
                      )}
                    </div>
                    {/* Map QR Code */}
                    {venueInfo.map_qr_link && (
                      <div className="venue-qr" style={{ marginTop: '20px' }}>
                        <div style={{ display: 'inline-block', background: 'white', borderRadius: '12px', padding: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                          <img
                            data-testid="venue-qr-code"
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(venueInfo.map_qr_link)}&color=0c3c60`}
                            alt="Scan for directions"
                            style={{ width: '120px', height: '120px', display: 'block' }}
                          />
                          <div style={{ fontSize: '10px', color: '#0c3c60', textAlign: 'center', marginTop: '6px', fontWeight: 600, fontFamily: 'Poppins' }}>Scan for Directions</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Google Maps Embed */}
                  {venueInfo.map_embed_url && (
                    <div data-testid="google-map-embed" style={{ borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', border: '3px solid rgba(255,255,255,0.15)' }}>
                      <iframe
                        src={venueInfo.map_embed_url}
                        width="100%"
                        height="300"
                        style={{ border: 0, display: 'block' }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Venue Location"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Travel Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: sightseeingPlaces.length > 0 ? '36px' : '0' }}>
              {howToReach && (
                <div data-testid="how-to-reach" style={{ background: '#f0f9ff', borderRadius: '16px', padding: '24px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plane size={14} color="white" /></div>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#0369a1', margin: 0 }}>How to Reach</h4>
                  </div>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{howToReach}</p>
                </div>
              )}
              {weather && (
                <div data-testid="weather-info" style={{ background: '#fffbeb', borderRadius: '16px', padding: '24px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Cloud size={14} color="white" /></div>
                    <h4 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#92400e', margin: 0 }}>Weather</h4>
                  </div>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{weather}</p>
                </div>
              )}
            </div>

            {/* Sightseeing Places with Images */}
            {sightseeingPlaces.length > 0 && (
              <div data-testid="sightseeing-section">
                <h3 style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: 700, color: '#0c3c60', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Camera size={20} style={{ color: '#1e7a4d' }} /> Nearby Sightseeing
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {sightseeingPlaces.map((p, i) => {
                    const pImg = resolveUrl(p.image_url);
                    return (
                      <div key={i} data-testid={`sightseeing-card-${i}`} style={{ borderRadius: '14px', overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
                        <div style={{ height: '130px', background: pImg ? `url(${pImg}) center/cover no-repeat` : 'linear-gradient(135deg, #e2e8f0, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {!pImg && <Camera size={28} style={{ color: '#94a3b8' }} />}
                        </div>
                        <div style={{ padding: '14px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: 'Poppins', marginBottom: '4px' }}>{p.name}</div>
                          {p.distance && <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} style={{ color: '#1e7a4d' }} />{p.distance}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ CONTACTS ═══ */}
      {contacts.length > 0 && (
        <section data-testid="contacts-section" style={{ padding: '60px 24px', background: '#f8fafc' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <SectionTitle title="Contact" color="#0c3c60" icon={Phone} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {contacts.map((c, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '22px 18px', textAlign: 'center', border: '1px solid #e8edf2', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', fontFamily: 'Poppins' }}>{c.name}</div>
                  {c.role && <div style={{ fontSize: '11px', color: '#1e7a4d', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.role}</div>}
                  {c.phone && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Phone size={12} style={{ color: '#2563eb' }} />{c.phone}</div>}
                  {c.email && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Mail size={12} style={{ color: '#2563eb' }} />{c.email}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ REGISTER CTA ═══ */}
      {event.registration_enabled && event.status !== 'completed' && (
        <section data-testid="register-cta" style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #0c3c60, #1a5f8a)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: 'white', marginBottom: '14px' }}>Register Now</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.7, fontFamily: 'Inter', marginBottom: '28px' }}>
              Secure your spot at {event.title}. Don't miss this opportunity!
            </p>
            <Link to={`/events/${event.id}/register`} data-testid="bottom-register-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #1e7a4d, #15803d)', color: 'white', padding: '16px 42px', borderRadius: '14px', fontSize: '16px', fontWeight: 700, fontFamily: 'Poppins', textDecoration: 'none', boxShadow: '0 4px 24px rgba(30,122,77,0.4)', transition: 'transform 0.2s' }}>
              Register for Event <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}

      <PublicFooter />
    </div>
  );
}
