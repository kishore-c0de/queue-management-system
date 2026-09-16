import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api.js';
import { socket } from '../socket.js';

export default function CustomerStatus() {
  const { tokenId } = useParams();
  const [myToken, setMyToken] = useState(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Full refetch -- used on mount and whenever our token drops out of
    // the "waiting" list broadcast (it might now be serving/completed/skipped).
    async function refetchMine() {
      const res = await api.get('/tokens');
      if (cancelled) return;
      const mine = res.data.find((t) => String(t.id) === tokenId);
      if (mine) setMyToken(mine);
    }

    refetchMine();

    socket.connect();
    socket.on('queue:updated', ({ waiting }) => {
      const idx = waiting.findIndex((t) => String(t.id) === tokenId);
      if (idx === -1) {
        // We're no longer in the waiting list -- either we haven't
        // loaded yet, or our status just changed. Refetch to find out which.
        refetchMine();
      } else {
        setPosition(idx);
        setMyToken((prev) => (prev ? { ...prev, status: 'waiting' } : prev));
      }
    });

    return () => {
      cancelled = true;
      socket.off('queue:updated');
      socket.disconnect();
    };
  }, [tokenId]);

  if (!myToken) {
    return (
      <div className="card">
        <p>Loading your token...</p>
      </div>
    );
  }

  const { status, tokenNumber, service } = myToken;

  return (
    <div className="card">
      <h1>Token #{tokenNumber}</h1>
      <p className="service-name">{service?.name}</p>

      {status === 'waiting' && (
        <p className="position">
          {position === null
            ? 'Calculating your position...'
            : position === 0
              ? "You're next!"
              : `${position} ${position === 1 ? 'person' : 'people'} ahead of you`}
        </p>
      )}
      {status === 'serving' && <p className="status-badge serving">You're being served now</p>}
      {status === 'completed' && <p className="status-badge completed">Completed — thank you!</p>}
      {status === 'skipped' && <p className="status-badge skipped">Marked as no-show</p>}
    </div>
  );
}
