import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { code, model, action } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY!);
    const gemini = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = '';

    if (action === 'suggest') {
      prompt = `You are a Python coding assistant. Analyze this code and suggest improvements, optimizations, or next steps:\n\n${code}\n\nProvide specific, actionable suggestions.`;
    } else if (action === 'explain') {
      prompt = `Explain this Python code in simple terms, line by line:\n\n${code}\n\nMake it easy to understand for students.`;
    } else if (action === 'fix') {
      prompt = `Find and fix any bugs or errors in this Python code:\n\n${code}\n\nProvide the corrected code and explain what was wrong.`;
    }

    const result = await gemini.generateContent(prompt);
    const suggestion = result.response.text();

    // Try to extract fixed code if action is 'fix'
    let fixedCode = null;
    if (action === 'fix') {
      const codeMatch = suggestion.match(/```python\n([\s\S]*?)\n```/);
      if (codeMatch) {
        fixedCode = codeMatch[1];
      }
    }

    return NextResponse.json({ suggestion, fixedCode });
  } catch (error: any) {
    return NextResponse.json(
      { suggestion: 'AI assist failed: ' + error.message },
      { status: 500 }
    );
  }
}
