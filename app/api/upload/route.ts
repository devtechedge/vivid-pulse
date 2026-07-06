import { NextRequest, NextResponse } from 'next/server';

// Mock endpoint complying with standard Vercel Blob uploader intake schemas
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file stream attached.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Payload exceeds 5MB size ceiling.' }, { status: 413 });
    }

    // Convert to a local high-fidelity mock image or base64 data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    return NextResponse.json({
      url: base64,
      downloadUrl: base64,
      pathname: file.name,
      contentType: file.type,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Stream upload fail.' }, { status: 500 });
  }
}
