import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
let scriptCache = null;

export default function CustomScripts() {
  const [cms, setCms] = useState(scriptCache);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (scriptCache) {
      setCms(scriptCache);
      return;
    }
    axios.get(`${API}/public/cms`).then(r => {
      scriptCache = r.data || {};
      setCms(r.data || {});
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cms || injectedRef.current) return;
    injectedRef.current = true;

    // Inject head scripts
    if (cms.custom_head_scripts) {
      injectHTML(cms.custom_head_scripts, document.head);
    }

    // Inject body start scripts (after body open)
    if (cms.custom_body_start_scripts) {
      const container = document.createElement('div');
      container.id = 'custom-body-start';
      container.style.display = 'none';
      document.body.insertBefore(container, document.body.firstChild);
      injectHTML(cms.custom_body_start_scripts, container);
      container.style.display = '';
    }

    // Inject body end scripts (before body close)
    if (cms.custom_body_end_scripts) {
      const container = document.createElement('div');
      container.id = 'custom-body-end';
      document.body.appendChild(container);
      injectHTML(cms.custom_body_end_scripts, container);
    }
  }, [cms]);

  return null;
}

function injectHTML(htmlString, parent) {
  const temp = document.createElement('div');
  temp.innerHTML = htmlString;

  Array.from(temp.childNodes).forEach(node => {
    if (node.nodeName === 'SCRIPT') {
      const script = document.createElement('script');
      // Copy attributes
      Array.from(node.attributes || []).forEach(attr => {
        script.setAttribute(attr.name, attr.value);
      });
      script.textContent = node.textContent;
      parent.appendChild(script);
    } else {
      parent.appendChild(node.cloneNode(true));
    }
  });
}
