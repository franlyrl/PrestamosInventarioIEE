import { useEffect } from 'react';
import axios from 'axios';

// Configurar axios con la URL base
const api = axios.create({
  baseURL: 'http://localhost:4000/api'
});

// Interceptor para incluir el token en todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('utn_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  useEffect(() => {
    // Obtener token del localStorage
    const token = localStorage.getItem('utn_token');

    if (!token) {
      return;
    }


    // Probar conexión con token
    api.get('/insumos')
      .then(res => {
      })
      .catch(err => {
        console.error("❌ Error de conexión:", err.response?.data || err.message);

        if (err.response?.status === 401) {
          localStorage.removeItem('utn_token');
          localStorage.removeItem('utn_user');
        }
      });

    // También probar otros endpoints
    api.get('/activos')
      .then(res => {
      })
      .catch(err => {
        console.error("❌ Error cargando activos:", err.response?.data?.message || err.message);
      });

  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 Test de Conexión con Backend</h1>
      <p>Revisa la consola para ver los resultados de las peticiones.</p>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>📋 Estado de la prueba:</h3>
        <ul>
          <li>🔑 Verificando token en localStorage</li>
          <li>🌐 Probando conexión con /api/insumos</li>
          <li>📦 Probando conexión con /api/activos</li>
          <li>👤 Token incluido automáticamente en headers</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Credenciales de prueba:</strong></p>
        <p>Usuario: 604550123</p>
        <p>Contraseña: 12345678</p>
        <p><a href="/login.html" style={{ color: '#00447c' }}>Ir a login</a></p>
      </div>
    </div>
  );
}

export default App;
