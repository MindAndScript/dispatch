import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const configFilePath = path.join(process.cwd(), 'src/data/apiConfig.json');

export async function GET() {
  try {
    if (!fs.existsSync(configFilePath)) {
      return NextResponse.json({ error: 'Config file not found' }, { status: 404 });
    }
    const data = fs.readFileSync(configFilePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    body.lastSaved = new Date().toISOString();
    fs.writeFileSync(configFilePath, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ success: true, config: body });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to write config';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
