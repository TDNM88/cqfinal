import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const imageBuffer = await response.buffer();

    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/png');
    res.setHeader('Cache-Control', 'no-store'); // Không cache vì URL có thể hết hạn
    res.send(imageBuffer);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
