import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { Calendar, Users, BookOpen, ArrowRight, Award, FlaskConical, ChevronLeft, ChevronRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FALLBACK_HERO = "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=900&q=80";

function SlickArrow({ className, onClick, direction }) {
  return (
    <button
      data-testid={`slider-arrow-${direction}`}
      onClick={onClick}
      style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        [direction === 'prev' ? 'left' : 'right']: '20px',
        zIndex: 10, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%',
        width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'white', transition: 'background 0.2s ease'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
    >
      {direction === 'prev' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </button>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({ total_members: 0, total_events: 0, total_publications: 0, upcoming_events: 0 });
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [executive, setExecutive] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [pc, setPc] = useState({});

  useEffect(() => {
    axios.get(`${API}/public/stats`).then(r => setStats(r.data)).catch(() => {});
    axios.get(`${API}/public/events`).then(r => setEvents(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${API}/public/news`).then(r => setNews(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${API}/public/executive`).then(r => setExecutive(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${API}/public/sliders`).then(r => setSliders(r.data)).catch(() => {});
    axios.get(`${API}/public/page-content/home`).then(r => setPc(r.data)).catch(() => {});
    axios.get(`${API}/public/membership-plans`).then(r => setPlans(r.data)).catch(() => {});
  }, []);

  const sliderSettings = {
    dots: true, infinite: sliders.length > 1, speed: 600,
    slidesToShow: 1, slidesToScroll: 1, autoplay: true, autoplaySpeed: 5000,
    pauseOnHover: true, fade: true,
    prevArrow: <SlickArrow direction="prev" />,
    nextArrow: <SlickArrow direction="next" />,
    appendDots: dots => (
      <div style={{ position: 'absolute', bottom: '24px', width: '100%' }}>
        <ul style={{ margin: 0, padding: 0, display: 'flex', justifyContent: 'center', gap: '8px', listStyle: 'none' }}>{dots}</ul>
      </div>
    ),
    customPaging: () => (
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)', transition: 'all 0.3s ease', cursor: 'pointer' }} />
    ),
  };

  const resolveImg = (url) => {
    if (!url) return FALLBACK_HERO;
    return url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${url}` : url;
  };

  const PLAN_COLORS = ['#0c3c60', '#1e7a4d', '#7c3aed', '#d97706'];
  const PLAN_BGS = ['#dbeafe', '#d1fae5', '#ede9fe', '#fef3c7'];

  const renderHero = () => {
    if (sliders.length === 0) {
      return (
        <section data-testid="hero-fallback" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '170px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: '#0c3c60', zIndex: 0 }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundImage: `url(${FALLBACK_HERO})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 2, width: '100%' }}>
            <div style={{ maxWidth: '680px' }}>
              <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '20px' }}>
                Indian Dairy Scientists<br /><span style={{ color: '#4ade80' }}>& Entrepreneurs</span> Association
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.7, marginBottom: '36px', fontFamily: 'Inter, sans-serif', maxWidth: '560px' }}>
                Bridging dairy science, innovation, and entrepreneurship for the sustainable growth of India's dairy sector.
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link to="/apply" data-testid="hero-join-btn" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 28px', fontSize: '15px' }}>Become a Member <ArrowRight size={16} /></Link>
                <Link to="/about" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', padding: '14px 28px', borderRadius: '8px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', fontSize: '15px', border: '1px solid rgba(255,255,255,0.3)' }}>Learn More</Link>
              </div>
            </div>
          </div>
        </section>
      );
    }
    return (
      <section data-testid="hero-slider" style={{ position: 'relative', paddingTop: '170px' }}>
        <style>{`
          .hero-slider .slick-dots li div { background: rgba(255,255,255,0.4); }
          .hero-slider .slick-dots li.slick-active div { background: white !important; transform: scale(1.3); }
          .hero-slider .slick-slide > div { line-height: 0; }
        `}</style>
        <Slider {...sliderSettings} className="hero-slider">
          {sliders.map((slide, idx) => (
            <div key={slide.id}>
              <div style={{ position: 'relative', minHeight: 'calc(100vh - 170px)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: '#0c3c60', zIndex: 0 }} />
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundImage: `url(${resolveImg(slide.image_url)})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35 }} />
                <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to right, rgba(12,60,96,0.85) 0%, rgba(12,60,96,0.4) 100%)' }} />
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 3, width: '100%', display: 'flex', alignItems: 'center', minHeight: 'calc(100vh - 170px)' }}>
                  <div style={{ maxWidth: '680px' }}>
                    {slide.title && <h1 data-testid={`slider-title-${idx}`} style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '20px' }}>{slide.title}</h1>}
                    {slide.subtitle && <p data-testid={`slider-subtitle-${idx}`} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '17px', lineHeight: 1.7, marginBottom: '36px', fontFamily: 'Inter, sans-serif', maxWidth: '560px' }}>{slide.subtitle}</p>}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <Link to={slide.link_url || '/apply'} data-testid="hero-join-btn" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 28px', fontSize: '15px' }}>Become a Member <ArrowRight size={16} /></Link>
                      <Link to="/about" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', padding: '14px 28px', borderRadius: '8px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', fontSize: '15px', border: '1px solid rgba(255,255,255,0.3)' }}>Learn More</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </section>
    );
  };

  return (
    <div style={{ background: 'white' }}>
      <PublicNavbar />
      {renderHero()}

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
            <div style={{ color: '#1e7a4d', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'Poppins, sans-serif' }}>{pc.about_title || 'About IDSEA'}</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: '#0c3c60', lineHeight: 1.3, marginBottom: '20px' }}>
              {pc.about_subtitle || 'A Platform for Dairy Science & Entrepreneurship'}
            </h2>
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.8, marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>
              {pc.about_description || 'IDSEA is a national professional and scientific body that bridges the gap between dairy scientists and industry professionals.'}
            </p>
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.8, marginBottom: '28px', fontFamily: 'Inter, sans-serif' }}>
              {pc.about_description2 || 'Headquartered at VCRI, Namakkal, Tamil Nadu, we operate with an all-India mandate to foster innovation, research, and sustainable growth.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/about" className="btn-primary" style={{ textDecoration: 'none' }}>Know More <ArrowRight size={14} /></Link>
              <Link to="/members" style={{ color: '#0c3c60', textDecoration: 'none', padding: '10px 20px', fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                View Members <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <img src={pc.about_image || 'https://images.unsplash.com/photo-1532094349884-543559059a6d?w=600&q=80'} alt="Dairy Science" style={{ width: '100%', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', objectFit: 'cover', height: '400px' }} />
            <div style={{
              position: 'absolute', bottom: '-20px', left: '-20px',
              background: '#1e7a4d', color: 'white', padding: '20px 24px', borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(30,122,77,0.3)'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Poppins, sans-serif' }}>{plans.length || 3}</div>
              <div style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', opacity: 0.9 }}>Membership Types</div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Types */}
      <section style={{ background: '#f8fafc', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">{pc.membership_title || 'Membership Types'}</h2>
            <p className="section-subtitle">{pc.membership_subtitle || "Join IDSEA and be part of India's premier dairy science community"}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {(plans.length > 0 ? plans : [
              { name: 'Academic Member', fee: 3100, currency: 'INR', description: 'For scientists, researchers, academicians, and educators', features: ['Regular newsletters', 'Event discounts', 'Journal access', 'Technical sessions'] },
              { name: 'Entrepreneur Member', fee: 5100, currency: 'INR', description: 'For dairy entrepreneurs, startups, MSMEs, and FPOs', features: ['All Academic benefits', 'Business networking', 'Industry interactions', 'Capacity building'] },
              { name: 'Corporate Member', fee: 25100, currency: 'INR', description: 'For dairy corporates, cooperatives, and institutional bodies', features: ['All Entrepreneur benefits', 'Priority participation', 'Advisory committee seat', 'Sponsor events'] },
            ]).map((plan, idx) => {
              const color = PLAN_COLORS[idx % PLAN_COLORS.length];
              const bg = PLAN_BGS[idx % PLAN_BGS.length];
              const popular = idx === 1;
              const feeStr = plan.currency === 'USD' ? `$${plan.fee}` : `\u20B9${plan.fee?.toLocaleString()}`;
              const features = plan.features || [];
              return (
                <div key={plan.name} style={{
                  background: 'white', borderRadius: '16px', padding: '28px',
                  boxShadow: popular ? '0 8px 32px rgba(30,122,77,0.15)' : '0 4px 12px rgba(0,0,0,0.06)',
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
                  <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{plan.name}</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color, fontFamily: 'Poppins, sans-serif', marginBottom: '8px' }}>{feeStr}</div>
                  <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>{plan.description}</p>
                  {features.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {features.map(f => (
                        <li key={f} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                          <span style={{ color: '#1e7a4d', fontWeight: 700, flexShrink: 0 }}>&#10003;</span>{f}
                        </li>
                      ))}
                    </ul>
                  )}
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Events Section */}
      {events.length > 0 && (
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className="section-title">{pc.events_title || 'Upcoming Events'}</h2>
                <p style={{ color: '#6b7280', margin: 0, fontFamily: 'Inter, sans-serif' }}>{pc.events_subtitle || 'Conferences, workshops, and seminars'}</p>
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
                        Registration: &#8377;{event.registration_fee}
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
                <h2 className="section-title">{pc.news_title || 'Latest News'}</h2>
                <p style={{ color: '#6b7280', margin: 0, fontFamily: 'Inter, sans-serif' }}>{pc.news_subtitle || 'Scientific updates and announcements'}</p>
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
            {pc.cta_title || 'Join the IDSEA Community Today'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.7, marginBottom: '32px', fontFamily: 'Inter, sans-serif' }}>
            {pc.cta_description || 'Become part of India\'s premier dairy science and entrepreneurship network. Connect, collaborate, and grow.'}
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={pc.cta_button_link || '/apply'} data-testid="cta-apply-btn" style={{
              background: '#1e7a4d', color: 'white', textDecoration: 'none',
              padding: '14px 32px', borderRadius: '8px', fontWeight: 700,
              fontFamily: 'Poppins, sans-serif', fontSize: '15px', transition: 'background 0.2s ease'
            }}>{pc.cta_button_text || 'Apply for Membership'}</Link>
            <Link to="/contact" style={{
              background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none',
              padding: '14px 32px', borderRadius: '8px', fontWeight: 600,
              fontFamily: 'Poppins, sans-serif', fontSize: '15px', border: '1px solid rgba(255,255,255,0.3)'
            }}>Contact Us</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
