import MemoryClient from 'mem0ai';

let client = null;

function getClient() {
  if (!client) {
    client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });
  }
  return client;
}

function getViewerId(req) {
  const ip = req.headers['x-forwarded-for'] ||
             req.headers['x-real-ip'] ||
             req.connection?.remoteAddress ||
             'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ipShort = ip.toString().substring(0, 8);
  const uaShort = userAgent.toString().substring(0, 8);
  return `${ipShort}_${uaShort}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = getViewerId(req);

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { action, song } = body;

      let message = '';
      if (action === 'play') {
        message = `I listened to "${song.title}" by ${song.artist}`;
      } else if (action === 'like') {
        message = `I really like "${song.title}" by ${song.artist}. This is one of my favorites!`;
      } else if (action === 'skip') {
        message = `I skipped "${song.title}" by ${song.artist}`;
      }

      if (message) {
        await getClient().add(
          [{ role: 'user', content: message }],
          { user_id: userId }
        );
      }

      return res.status(200).json({ status: 'ok', userId });
    }

    if (req.method === 'GET') {
      const action = req.query?.action;

      if (action === 'memories') {
        const memories = await getClient().getAll({ user_id: userId });
        return res.status(200).json({ userId, memories });
      }

      if (action === 'recommendations') {
        const searchResults = await getClient().search(
          'songs and artists I like and listen to frequently',
          { user_id: userId }
        );
        return res.status(200).json({ userId, recommendations: searchResults });
      }

      const memories = await getClient().getAll({ user_id: userId });
      return res.status(200).json({
        userId,
        memoryCount: memories?.length || 0,
        hasMemories: (memories?.length || 0) > 0
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Mem0 API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
