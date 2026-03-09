import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('idsea_token');
    const adminData = localStorage.getItem('idsea_admin');
    if (token && adminData) {
      try {
        setAdmin(JSON.parse(adminData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        localStorage.removeItem('idsea_token');
        localStorage.removeItem('idsea_admin');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, admin: adminData } = res.data;
    localStorage.setItem('idsea_token', access_token);
    localStorage.setItem('idsea_admin', JSON.stringify(adminData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setAdmin(adminData);
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem('idsea_token');
    localStorage.removeItem('idsea_admin');
    delete axios.defaults.headers.common['Authorization'];
    setAdmin(null);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { API };
