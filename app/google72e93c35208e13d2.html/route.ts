import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('google-site-verification: google72e93c35208e13d2.html', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
