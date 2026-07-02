import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SITE_NAME = 'IDSEA';

let seoCache = {};

export default function SEOHead({ page, fallback = {} }) {
  const [seo, setSeo] = useState(seoCache[page] || {});
  const [cms, setCms] = useState(seoCache['_cms'] || {});

  useEffect(() => {
    if (!seoCache[page]) {
      axios.get(`${API}/public/page-content/${page}`).then(r => {
        seoCache[page] = r.data || {};
        setSeo(r.data || {});
      }).catch(() => {});
    }
    if (!seoCache['_cms']) {
      axios.get(`${API}/public/cms`).then(r => {
        seoCache['_cms'] = r.data || {};
        setCms(r.data || {});
      }).catch(() => {});
    }
  }, [page]);

  const title = seo.seo_title || fallback.title || `${SITE_NAME} - Indian Dairy Scientists and Entrepreneurs Association`;
  const description = seo.seo_description || fallback.description || 'IDSEA is a national professional body bridging dairy science, innovation, and entrepreneurship for India\'s dairy sector.';
  const keywords = seo.seo_keywords || fallback.keywords || 'IDSEA, dairy science, dairy entrepreneurs, dairy research, India dairy, veterinary science, dairy technology';
  const favicon = cms.favicon_url || '/api/uploads/idsea_logo.png';
  const faviconUrl = favicon.startsWith('http') ? favicon : `${process.env.REACT_APP_BACKEND_URL}${favicon}`;
  const canonical = `${window.location.origin}${window.location.pathname}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonical} />
      <link rel="icon" href={faviconUrl} type="image/png" />
      <link rel="shortcut icon" href={faviconUrl} type="image/png" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonical} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
