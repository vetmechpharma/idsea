import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Calendar, Users, BookOpen, ArrowRight, Award, FlaskConical } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HERO_IMG = "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=900&q=80";
const ABOUT_IMG = "https://images.unsplash.com/photo-1532094349884-543559059a6d?w=600&q=80";

export default function HomePage() {
  const [stats, setStats] = useState({ total_members: 0, total_events: 0, total_publications: 0, upcoming_events: 0 });
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [executive, setExecutive] = useState([]);

  useEffect(() => {
    axios.get(`${API}/public/stats`).then(r => setStats(r.data)).catch(() => {});
    axios.get(`${API}/public/events`).then(r => setEvents(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${API}/public/news`).then(r => setNews(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${API}/public/executive`).then(r => setExecutive(r.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div style={{ background: 'white' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#0c3c60', zIndex: 0 }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          backgroundImage: `url(${HERO_IMG})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.2
        }} />
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 2, width: '100%' }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(30,122,77,0.2)', border: '1px solid rgba(30,122,77,0.4)',
              padding: '6px 14px', borderRadius: '20px', marginBottom: '24px'
            }}>
              <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#4ade80', fontSize: '13px', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>National Professional Body</span>
            </div>

            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '20px' }}>
              Indian Dairy Scientists<br />
              <span style={{ color: '#4ade80' }}>& Entrepreneurs</span> Association
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.7, marginBottom: '36px', fontFamily: 'Inter, sans-serif', maxWidth: '560px' }}>
              Bridging dairy science, innovation, and entrepreneurship for the sustainable growth of India's dairy sector. One platform for scientists, academicians, and entrepreneurs.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link to="/apply" data-testid="hero-join-btn" style={{
                background: '#1e7a4d', color: 'white', textDecoration: 'none',
                padding: '14px 28px', borderRadius: '8px', fontWeight: 700,
                fontFamily: 'Poppins, sans-serif', fontSize: '15px',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'background 0.2s ease, transform 0.1s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#166534'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1e7a4d'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Become a Member <ArrowRight size={16} />
              </Link>
              <Link to="/about" style={{
                background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none',
                padding: '14px 28px', borderRadius: '8px', fontWeight: 600,
                fontFamily: 'Poppins, sans-serif', fontSize: '15px',
                border: '1px solid rgba(255,255,255,0.3)',
                transition: 'background 0.2s ease'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ background: '#f8fafc', padding: '60px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
            {[
              { icon: Users, value: stats.total_members, label: 'Total Members', color: '#0c3c60', bg: '#dbeafe' },
              { icon: Calendar, value: stats.upcoming_events, label: 'Upcoming Events', color: '#1e7a4d', bg: '#d1fae5' },
              { icon: BookOpen, value: stats.total_publications, label: 'Publications', color: '#7c3aed', bg: '#ede9fe' },
              { icon: Award, value: stats.total_events, label: 'Events Conducted', color: '#d97706', bg: '#fef3c7' },
            ].map(({ icon: Icon, value, label, color, bg }) => (
              <div key={label} className="stat-card" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color, fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#1e7a4d', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'Poppins, sans-serif' }}>About IDSEA</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: '#0c3c60', lineHeight: 1.3, marginBottom: '20px' }}>
              A Platform for Dairy Science & Entrepreneurship
            </h2>
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>
              IDSEA is a national professional and scientific body that bridges the gap between dairy scientists and industry professionals. We bring together academicians, technologists, entrepreneurs, and students under one umbrella.
            </p>
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.8, marginBottom: '28px', fontFamily: 'Inter, sans-serif' }}>
              Headquartered at VCRI, Namakkal, Tamil Nadu, we operate with an all-India mandate to foster innovation, research, and sustainable growth.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/about" className="btn-primary" style={{ textDecoration: 'none' }}>Know More <ArrowRight size={14} /></Link>
              <Link to="/members" style={{ color: '#0c3c60', textDecoration: 'none', padding: '10px 20px', fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                View Members <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <img src={ABOUT_IMG} alt="Dairy Science" style={{ width: '100%', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', objectFit: 'cover', height: '400px' }} />
            <div style={{
              position: 'absolute', bottom: '-20px', left: '-20px',
              background: '#1e7a4d', color: 'white', padding: '20px 24px', borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(30,122,77,0.3)'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Poppins, sans-serif' }}>3</div>
              <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', opacity: 0.9 }}>Membership Types</div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Types */}
      <section style={{ background: '#f8fafc', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">Membership Types</h2>
            <p className="section-subtitle">Join IDSEA and be part of India's premier dairy science community</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {[
              { type: 'Academic Member', fee: '₹3,100', desc: 'For scientists, researchers, academicians, and educators in dairy science', color: '#0c3c60', bg: '#dbeafe', features: ['Regular newsletters', 'Event discounts', 'Journal access', 'Technical sessions'] },
              { type: 'Entrepreneur Member', fee: '₹5,100', desc: 'For dairy entrepreneurs, startups, MSMEs, and FPOs', color: '#1e7a4d', bg: '#d1fae5', features: ['All Academic benefits', 'Business networking', 'Industry interactions', 'Capacity building'], popular: true },
              { type: 'Corporate Member', fee: '₹25,100', desc: 'For dairy corporates, cooperatives, and institutional bodies', color: '#7c3aed', bg: '#ede9fe', features: ['All Entrepreneur benefits', 'Priority participation', 'Advisory committee seat', 'Sponsor events'] },
            ].map(({ type, fee, desc, color, bg, features, popular }) => (
              <div key={type} style={{
                background: 'white', borderRadius: '16px',
                padding: '28px', boxShadow: popular ? '0 8px 32px rgba(30,122,77,0.15)' : '0 4px 12px rgba(0,0,0,0.06)',
                border: popular ? '2px solid #1e7a4d' : '1px solid #e5e7eb',
                position: 'relative', transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = popular ? '0 8px 32px rgba(30,122,77,0.15)' : '0 4px 12px rgba(0,0,0,0.06)'; }}
              >
                {popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#1e7a4d', color: 'white', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>POPULAR</div>}
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <FlaskConical size={22} style={{ color }} />
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{type}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 800, color, fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>{fee}</div>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>{desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                      <span style={{ color: '#1e7a4d', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link to="/apply" style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none',
                  padding: '10px', borderRadius: '8px', fontWeight: 600,
                  fontFamily: 'Poppins, sans-serif', fontSize: '14px',
                  background: popular ? '#1e7a4d' : 'transparent',
                  color: popular ? 'white' : color,
                  border: popular ? 'none' : `2px solid ${color}`,
                  transition: 'all 0.2s ease'
                }}>
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      {events.length > 0 && (
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className="section-title">Upcoming Events</h2>
                <p style={{ color: '#6b7280', margin: 0, fontFamily: 'Inter, sans-serif' }}>Conferences, workshops, and seminars</p>
              </div>
              <Link to="/events" style={{ color: '#1e7a4d', textDecoration: 'none', fontWeight: 600, fontSize: '14px', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {events.map(event => (
                <div key={event.id} className="event-card">
                  <div style={{ background: '#0c3c60', padding: '20px', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' }}>
                    {event.image_url && <img src={event.image_url} alt={event.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ background: '#1e7a4d', display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', color: 'white', fontWeight: 600, fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>
                        {event.status?.toUpperCase()}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>{event.date}</div>
                    </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '8px', lineHeight: 1.4 }}>{event.title}</h3>
                    <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'Inter, sans-serif', marginBottom: '4px' }}>{event.venue}</div>
                    {event.registration_fee > 0 && (
                      <div style={{ fontSize: '13px', color: '#1e7a4d', fontWeight: 600, fontFamily: 'Poppins, sans-serif', marginTop: '8px' }}>
                        Registration: ₹{event.registration_fee}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* News Section */}
      {news.length > 0 && (
        <section style={{ background: '#f8fafc', padding: '80px 24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className="section-title">Latest News</h2>
                <p style={{ color: '#6b7280', margin: 0, fontFamily: 'Inter, sans-serif' }}>Scientific updates and announcements</p>
              </div>
              <Link to="/events" style={{ color: '#1e7a4d', textDecoration: 'none', fontWeight: 600, fontSize: '14px', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {news.map(item => (
                <div key={item.id} className="news-card">
                  {item.image_url && <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />}
                  <div style={{ padding: '20px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e7a4d', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Poppins, sans-serif' }}>{item.category}</span>
                    <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '15px', fontWeight: 700, color: '#111827', margin: '8px 0', lineHeight: 1.4 }}>{item.title}</h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.content}
                    </p>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px', fontFamily: 'Inter, sans-serif' }}>{item.published_date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section style={{ background: '#0c3c60', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', color: 'white', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, marginBottom: '16px' }}>
            Join the IDSEA Community Today
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.7, marginBottom: '32px', fontFamily: 'Inter, sans-serif' }}>
            Become part of India's premier dairy science and entrepreneurship network. Connect, collaborate, and grow.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/apply" data-testid="cta-apply-btn" style={{
              background: '#1e7a4d', color: 'white', textDecoration: 'none',
              padding: '14px 32px', borderRadius: '8px', fontWeight: 700,
              fontFamily: 'Poppins, sans-serif', fontSize: '15px',
              transition: 'background 0.2s ease'
            }}>Apply for Membership</Link>
            <Link to="/contact" style={{
              background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none',
              padding: '14px 32px', borderRadius: '8px', fontWeight: 600,
              fontFamily: 'Poppins, sans-serif', fontSize: '15px',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>Contact Us</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
