import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('admin_token', res.data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  }

  return (
    <div className="card">
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Log In</button>
      </form>
      <p className="hint">Seeded credentials: admin / admin123 (run the seed script first)</p>
    </div>
  );
}
