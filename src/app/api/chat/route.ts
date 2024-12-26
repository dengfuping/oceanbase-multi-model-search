import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const response = await fetch(process.env.CHAT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response;
  } catch (error) {
    return NextResponse.error();
  }
}
