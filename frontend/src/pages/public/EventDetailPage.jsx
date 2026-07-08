import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import SEOHead from '../../components/SEOHead';
import { Calendar, MapPin, Clock, Download, ArrowRight, Users, Award, IndianRupee, Phone, Mail, Hotel, Globe, ChevronRight, ExternalLink, Target } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;
const resolveUrl = (u) => u ? (u.startsWith('http') ? u : `${BACKEND}${u.startsWith('/') ? '' : '/'}${u}`) : '';

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
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'white', fontFamily: 'Poppins', lineHeight: 1 }}>{String(v).padStart(2, '0')}</div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{l}</div>
    </div>
  );
  return (
    <div style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', borderRadius: '16px', padding: '24px 32px', display: 'inline-block', border: '1px solid rgba(255,255,255,0.15)' }}>
      {label && <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px', textAlign: 'center', fontFamily: 'Poppins' }}>{label}</div>}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Box v={time.d} l="Days" /><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '28px', fontWeight: 300 }}>:</span>
        <Box v={time.h} l="Hours" /><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '28px', fontWeight: 300 }}>:</span>
        <Box v={time.m} l="Minutes" /><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '28px', fontWeight: 300 }}>:</span>
        <Box v={time.s} l="Seconds" />
      </div>
    </div>
  );
}

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
  if (!event) return <div style={{ minHeight: '100vh' }}><PublicNavbar /><div style={{ paddingTop: '200px', textAlign: 'center', color: '#9ca3af' }}><h2>Event not found</h2><Link to="/events">Back to Events</Link></div><PublicFooter /></div>;

  const imgSrc = resolveUrl(event.image_url);
  const brochureSrc = resolveUrl(event.brochure_url);
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
  const sightseeing = details.sightseeing || '';
  const weather = details.weather || '';
  const howToReach = details.how_to_reach || '';

  const SECTION_BG = ['#fafbfc', 'white'];

  return (
    <div style={{ background: '#fafbfc' }}>
      <SEOHead page="events" fallback={{ title: `${event.title} | IDSEA`, description: event.description?.slice(0, 160) }} />
      <PublicNavbar />

      {/* Hero Banner */}
      <div style={{ position: 'relative', minHeight: '70vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#0c3c60', zIndex: 0 }} />
        {imgSrc && <div style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.25 }} />}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(180deg, rgba(12,60,96,0.6) 0%, rgba(12,60,96,0.95) 100%)' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '200px 24px 60px', position: 'relative', zIndex: 3, width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ background: event.status === 'upcoming' ? '#1e7a4d' : event.status === 'ongoing' ? '#d97706' : '#6b7280', color: 'white', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'Poppins', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{event.status}</span>
            {event.registration_enabled && <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, fontFamily: 'Poppins', border: '1px solid rgba(255,255,255,0.25)' }}>Registration Open</span>}
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '16px', maxWidth: '900px', margin: '0 auto 16px' }}>{event.title}</h1>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontFamily: 'Inter, sans-serif', marginBottom: '28px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={15} style={{ color: '#4ade80' }} />{event.date}{event.end_date ? ` - ${event.end_date}` : ''}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={15} style={{ color: '#4ade80' }} />{event.venue}</span>
          </div>
          {countdownDate && <Countdown targetDate={countdownDate} label={countdownLabel} />}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
            {brochureSrc && <a href={brochureSrc} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', color: 'white', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, fontFamily: 'Poppins', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', transition: 'background 0.2s' }} data-testid="brochure-btn"><Download size={16} /> Download Brochure</a>}
            {event.registration_enabled && event.status !== 'completed' && <Link to={`/events/${event.id}/register`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1e7a4d', color: 'white', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, fontFamily: 'Poppins', textDecoration: 'none', boxShadow: '0 4px 16px rgba(30,122,77,0.35)' }} data-testid="hero-register-btn">Register Now <ArrowRight size={16} /></Link>}
          </div>
        </div>
      </div>

      {/* About / Welcome */}
      {aboutContent && (
        <section style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px', textAlign: 'center' }}>About the Event</h2>
            <div style={{ width: '50px', height: '4px', background: '#1e7a4d', borderRadius: '2px', margin: '0 auto 28px' }} />
            <p style={{ color: '#374151', fontSize: '15px', lineHeight: 1.9, fontFamily: 'Inter, sans-serif', whiteSpace: 'pre-wrap' }}>{aboutContent}</p>
            {objectives.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px' }}>Key Objectives</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {objectives.map((o, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                      <Target size={16} style={{ color: '#1e7a4d', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, fontFamily: 'Inter' }}>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {highlights.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, color: '#0c3c60', marginBottom: '16px' }}>Conference Highlights</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
                  {highlights.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '12px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                      <ChevronRight size={14} style={{ color: '#2563eb', flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, fontFamily: 'Inter' }}>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Conference Themes */}
      {themes.length > 0 && (
        <section style={{ padding: '80px 24px', background: '#fafbfc' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px', textAlign: 'center' }}>Conference Themes</h2>
            <div style={{ width: '50px', height: '4px', background: '#d97706', borderRadius: '2px', margin: '0 auto 36px' }} />
            <div style={{ display: 'grid', gap: '16px' }}>
              {themes.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', padding: '20px', background: 'white', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e8edf2' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0c3c60, #164e7e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '15px', fontWeight: 800, fontFamily: 'Poppins', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.7, fontFamily: 'Inter' }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Important Dates */}
      {importantDates.length > 0 && (
        <section style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px', textAlign: 'center' }}>Important Dates</h2>
            <div style={{ width: '50px', height: '4px', background: '#dc2626', borderRadius: '2px', margin: '0 auto 36px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {importantDates.map((d, i) => (
                <div key={i} style={{ background: '#fafbfc', borderRadius: '14px', padding: '24px', textAlign: 'center', border: '1px solid #e8edf2', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <Clock size={20} style={{ color: '#dc2626', marginBottom: '10px' }} />
                  <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'Inter', marginBottom: '6px' }}>{d.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0c3c60', fontFamily: 'Poppins' }}>{d.date}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Registration Fee */}
      {feeTiers.length > 0 && (
        <section style={{ padding: '80px 24px', background: '#fafbfc' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px', textAlign: 'center' }}>Registration Fee</h2>
            <div style={{ width: '50px', height: '4px', background: '#1e7a4d', borderRadius: '2px', margin: '0 auto 36px' }} />
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e8edf2' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(90deg, #0c3c60, #164e7e)' }}>
                      <th style={{ padding: '14px 16px', color: 'white', textAlign: 'left', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600 }}>Tier / Deadline</th>
                      <th style={{ padding: '14px 16px', color: 'white', textAlign: 'center', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600 }}>Member</th>
                      <th style={{ padding: '14px 16px', color: 'white', textAlign: 'center', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600 }}>Non-Member</th>
                      <th style={{ padding: '14px 16px', color: 'white', textAlign: 'center', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600 }}>Student</th>
                      <th style={{ padding: '14px 16px', color: 'white', textAlign: 'center', fontSize: '13px', fontFamily: 'Poppins', fontWeight: 600 }}>International</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeTiers.map((t, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0c3c60', fontSize: '14px', fontFamily: 'Poppins' }}>{t.name}</div>
                          {t.deadline && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Deadline: {t.deadline}</div>}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#1e7a4d', fontSize: '14px' }}>{t.fees?.member ? `₹${Number(t.fees.member).toLocaleString()}` : '-'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '14px' }}>{t.fees?.non_member ? `₹${Number(t.fees.non_member).toLocaleString()}` : '-'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#7c3aed', fontSize: '14px' }}>{t.fees?.student ? `₹${Number(t.fees.student).toLocaleString()}` : '-'}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#2563eb', fontSize: '14px' }}>{t.fees?.international ? `$${Number(t.fees.international).toLocaleString()}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Awards */}
      {awards.length > 0 && (
        <section style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px', textAlign: 'center' }}>Awards</h2>
            <div style={{ width: '50px', height: '4px', background: '#d97706', borderRadius: '2px', margin: '0 auto 36px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {awards.map((a, i) => (
                <div key={i} style={{ background: '#fffbeb', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #fcd34d' }}>
                  <Award size={20} style={{ color: '#d97706', marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', fontFamily: 'Poppins' }}>{a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sponsorship Packages */}
      {sponsors.length > 0 && (
        <section style={{ padding: '80px 24px', background: '#fafbfc' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px', textAlign: 'center' }}>Sponsorship Packages</h2>
            <div style={{ width: '50px', height: '4px', background: '#7c3aed', borderRadius: '2px', margin: '0 auto 36px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {sponsors.map((s, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '28px 20px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e8edf2', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: s.color || '#7c3aed' }} />
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 800, color: '#0c3c60', marginBottom: '8px', textTransform: 'uppercase' }}>{s.name}</h3>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e7a4d', fontFamily: 'Poppins', marginBottom: '16px' }}>{s.amount}</div>
                  {s.benefits && <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, fontFamily: 'Inter', textAlign: 'left' }}>{s.benefits.split('\n').map((b, j) => <div key={j} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}><span style={{ color: '#1e7a4d' }}>✓</span>{b}</div>)}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Committee */}
      {committee.length > 0 && (
        <section style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px', textAlign: 'center' }}>Conference Committee</h2>
            <div style={{ width: '50px', height: '4px', background: '#0c3c60', borderRadius: '2px', margin: '0 auto 36px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {committee.map((c, i) => (
                <div key={i} style={{ background: '#fafbfc', borderRadius: '14px', padding: '20px', border: '1px solid #e8edf2' }}>
                  <div style={{ fontSize: '11px', color: '#1e7a4d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Poppins', marginBottom: '6px' }}>{c.role}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', fontFamily: 'Poppins', marginBottom: '4px' }}>{c.name}</div>
                  {c.affiliation && <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'Inter', lineHeight: 1.5 }}>{c.affiliation}</div>}
                  {c.phone && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={11} />{c.phone}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hotels */}
      {hotels.length > 0 && (
        <section style={{ padding: '80px 24px', background: '#fafbfc' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px', textAlign: 'center' }}>Accommodation</h2>
            <div style={{ width: '50px', height: '4px', background: '#d97706', borderRadius: '2px', margin: '0 auto 36px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {hotels.map((h, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e8edf2' }}>
                  <Hotel size={20} style={{ color: '#d97706', marginBottom: '10px' }} />
                  <h3 style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{h.name}</h3>
                  {h.location && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'flex', gap: '4px' }}><MapPin size={12} />{h.location}</div>}
                  {h.room_types?.map((r, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#374151' }}>{r.type}</span>
                      <span style={{ fontWeight: 600, color: '#1e7a4d' }}>₹{Number(r.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Venue & Travel */}
      {(venueInfo.address || howToReach || weather || sightseeing) && (
        <section style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#0c3c60', marginBottom: '8px', textAlign: 'center' }}>Venue & Travel</h2>
            <div style={{ width: '50px', height: '4px', background: '#2563eb', borderRadius: '2px', margin: '0 auto 36px' }} />
            {venueInfo.address && (
              <div style={{ background: 'linear-gradient(135deg, #0c3c60, #164e7e)', borderRadius: '16px', padding: '32px', color: 'white', textAlign: 'center', marginBottom: '24px' }}>
                <MapPin size={24} style={{ color: '#4ade80', marginBottom: '12px' }} />
                <h3 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{venueInfo.name || event.venue}</h3>
                <p style={{ fontSize: '14px', opacity: 0.85, lineHeight: 1.7, margin: 0 }}>{venueInfo.address}</p>
                {event.venue_map_link && <a href={event.venue_map_link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', color: '#4ade80', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}><ExternalLink size={14} /> View on Map</a>}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {howToReach && <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '20px', border: '1px solid #bae6fd' }}><h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#0369a1', marginBottom: '10px' }}>How to Reach</h4><p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{howToReach}</p></div>}
              {weather && <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '20px', border: '1px solid #fcd34d' }}><h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#92400e', marginBottom: '10px' }}>Weather</h4><p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{weather}</p></div>}
              {sightseeing && <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '20px', border: '1px solid #bbf7d0' }}><h4 style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: 700, color: '#065f46', marginBottom: '10px' }}>Sightseeing</h4><p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{sightseeing}</p></div>}
            </div>
          </div>
        </section>
      )}

      {/* Contacts */}
      {contacts.length > 0 && (
        <section style={{ padding: '60px 24px', background: '#fafbfc' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: '#0c3c60', marginBottom: '24px', textAlign: 'center' }}>Contact</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {contacts.map((c, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '18px', textAlign: 'center', border: '1px solid #e8edf2' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827', fontFamily: 'Poppins' }}>{c.name}</div>
                  {c.role && <div style={{ fontSize: '11px', color: '#1e7a4d', fontWeight: 600, marginTop: '2px' }}>{c.role}</div>}
                  {c.phone && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Phone size={11} />{c.phone}</div>}
                  {c.email && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Mail size={11} />{c.email}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Register CTA */}
      {event.registration_enabled && event.status !== 'completed' && (
        <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #0c3c60, #164e7e)', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Poppins', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: 'white', marginBottom: '14px' }}>Register Now</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.7, fontFamily: 'Inter', marginBottom: '28px' }}>
              Secure your spot at {event.title}. Don't miss this opportunity!
            </p>
            <Link to={`/events/${event.id}/register`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#1e7a4d', color: 'white', padding: '16px 40px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, fontFamily: 'Poppins', textDecoration: 'none', boxShadow: '0 4px 20px rgba(30,122,77,0.4)', transition: 'transform 0.2s' }} data-testid="bottom-register-btn">
              Register for Event <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}

      <PublicFooter />
    </div>
  );
}
