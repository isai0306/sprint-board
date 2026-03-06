const clientsByUserId = new Map();

function writeEvent(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function addRealtimeClient(userId, res) {
  if (!clientsByUserId.has(userId)) {
    clientsByUserId.set(userId, new Set());
  }
  clientsByUserId.get(userId).add(res);
  writeEvent(res, "connected", { ok: true });

  return () => {
    const clients = clientsByUserId.get(userId);
    if (!clients) return;
    clients.delete(res);
    if (!clients.size) {
      clientsByUserId.delete(userId);
    }
  };
}

export function publishRealtimeEvent(userIds, event, payload) {
  for (const userId of userIds) {
    const clients = clientsByUserId.get(userId);
    if (!clients || !clients.size) continue;

    for (const client of clients) {
      writeEvent(client, event, payload);
    }
  }
}
