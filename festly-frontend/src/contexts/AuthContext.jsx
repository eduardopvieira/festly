import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

function normalizarUsuario(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const tipo = payload.tipoUsuario ?? payload.tipo_usuario;
  let tipoUsuario = tipo;
  if (tipo && typeof tipo === 'object' && 'name' in tipo) {
    tipoUsuario = tipo.name;
  }
  return {
    ...payload,
    tipoUsuario: typeof tipoUsuario === 'string' ? tipoUsuario.toUpperCase() : tipoUsuario,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUser() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(normalizarUsuario(data));
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, senha: password });
    localStorage.setItem('token', data.token);
    setUser(normalizarUsuario({ id: data.id, nome: data.nome, email: data.email, tipoUsuario: data.tipoUsuario ?? data.tipo_usuario }));
    return data;
  }

  async function register(userData) {
    const { data } = await api.post('/auth/register', userData);
    return data;
  }

  async function verify(email, codigo) {
    const { data } = await api.post('/auth/verify', { email, codigo });
    localStorage.setItem('token', data.token);
    setUser(normalizarUsuario({ id: data.id, nome: data.nome, email: data.email, tipoUsuario: data.tipoUsuario ?? data.tipo_usuario }));
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verify, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}
