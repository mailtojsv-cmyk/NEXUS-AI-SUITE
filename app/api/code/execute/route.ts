import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    // Using Piston API (free code execution)
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: language || 'python',
        version: '3.10.0',
        files: [
          {
            name: 'main.py',
            content: code,
          },
        ],
      }),
    });

    const data = await res.json();

    if (data.run) {
      return NextResponse.json({
        output: data.run.stdout || data.run.stderr || 'No output',
      });
    }

    return NextResponse.json({ output: 'Execution failed' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ output: 'Error: ' + error.message }, { status: 500 });
  }
}
