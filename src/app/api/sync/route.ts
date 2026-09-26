import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Store the DB in the root of the project
const DB_FILE = path.join(process.cwd(), 'database.json');

export async function GET() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return NextResponse.json({ success: true, data: JSON.parse(data) });
    } else {
      return NextResponse.json({ success: true, data: null });
    }
  } catch (error) {
    console.error("Error reading DB:", error);
    return NextResponse.json({ success: false, error: 'Failed to read database' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error writing DB:", error);
    return NextResponse.json({ success: false, error: 'Failed to write database' }, { status: 500 });
  }
}
