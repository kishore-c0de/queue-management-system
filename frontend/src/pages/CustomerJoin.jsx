import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';

export default function CustomerJoin() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/services').then((res) => {
      setServices(res.data);
      if (res.data.length > 0) setServiceId(res.data[0].id);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !serviceId) {
      setError('Please enter your name and pick a service.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/tokens', {
        customer_name: name.trim(),
        service_id: Number(serviceId),
      });
      navigate(`/status/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong, please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>Join the Queue</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Your Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ravi Kumar"
          />
        </label>

        <label>
          Service
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Joining...' : 'Join Queue'}
        </button>
      </form>
    </div>
  );
}
