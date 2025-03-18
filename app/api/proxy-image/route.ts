import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
