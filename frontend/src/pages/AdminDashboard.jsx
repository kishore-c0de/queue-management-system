import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import { socket } from '../socket.js';

export default function AdminDashboard() {
  const [tokens, setTokens] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const navigate = useNavigate();

  async function loadTokens() {
    const res = await api.get('/tokens');
    setTokens(res.data);
  }

  useEffect(() => {
    loadTokens();
    socket.connect();
    socket.on('queue:updated', loadTokens);
    return () => {
      socket.off('queue:updated', loadTokens);
      socket.disconnect();
    };
  }, []);

  async function updateStatus(id, status) {
    try {
      await api.patch(`/tokens/${id}/status`, { status });
      loadTokens();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    }
  }

  async function generateSummary() {
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await api.get('/summary/today');
      setSummary(res.data);
    } catch (err) {
      setSummaryError(err.response?.data?.error || 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  }

  const waiting = tokens.filter((t) => t.status === 'waiting');
  const others = tokens.filter((t) => t.status !== 'waiting');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={logout} className="secondary">Log Out</button>
      </div>

      <section>
        <h2>Waiting ({waiting.length})</h2>
        {waiting.length === 0 && <p className="muted">No one is waiting.</p>}
        <ul className="token-list">
          {waiting.map((t) => (
            <li key={t.id} className="token-row">
              <span className="token-number">#{t.tokenNumber}</span>
              <span>{t.customerName}</span>
              <span className="muted">{t.service?.name}</span>
              <div className="actions">
                <button onClick={() => updateStatus(t.id, 'serving')}>Serve</button>
                <button onClick={() => updateStatus(t.id, 'skipped')} className="secondary">Skip</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Serving / Done Today</h2>
        <ul className="token-list">
          {others.map((t) => (
            <li key={t.id} className="token-row">
              <span className="token-number">#{t.tokenNumber}</span>
              <span>{t.customerName}</span>
              <span className={`status-badge ${t.status}`}>{t.status}</span>
              {t.status === 'serving' && (
                <div className="actions">
                  <button onClick={() => updateStatus(t.id, 'completed')}>Complete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>AI Daily Summary</h2>
        <button onClick={generateSummary} disabled={summaryLoading}>
          {summaryLoading ? 'Generating...' : 'Generate Summary'}
        </button>
        {summaryError && <p className="error">{summaryError}</p>}
        {summary && (
          <div className="summary-box">
            <p>{summary.summary}</p>
            <div className="stats-grid">
              <div><strong>{summary.stats.total_customers}</strong><span>Total</span></div>
              <div><strong>{summary.stats.total_completed}</strong><span>Completed</span></div>
              <div><strong>{summary.stats.total_no_show}</strong><span>No-shows</span></div>
              <div><strong>{summary.stats.average_wait_minutes ?? '—'}</strong><span>Avg wait (min)</span></div>
              <div><strong>{summary.stats.peak_hour ?? '—'}</strong><span>Peak hour</span></div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
