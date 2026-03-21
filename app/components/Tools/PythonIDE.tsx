'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '@/app/lib/store';
import { supabase } from '@/app/lib/supabase';

export default function PythonIDE() {
  const { user, currentModel, addNotification } = useStore();
  const [code, setCode] = useState('# Python IDE with AI Copilot\nprint("Hello, Nexus AI!")');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [snippetName, setSnippetName] = useState('Untitled');
  const [savedSnippets, setSavedSnippets] = useState<any[]>([]);
  const [showSnippets, setShowSnippets] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(true);
  
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    loadSnippets();
  }, []);

  // Auto-save every 3 seconds
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [code]);

  const loadSnippets = async () => {
    const { data } = await supabase
      .from('code_snippets')
      .select('*')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    setSavedSnippets(data || []);
  };

  const autoSave = async () => {
    if (!user || !code) return;

    // Check if snippet exists
    const existing = savedSnippets.find((s) => s.name === snippetName);

    if (existing) {
      // Update
      await supabase
        .from('code_snippets')
        .update({ code, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Create new
      const { data } = await supabase
        .from('code_snippets')
        .insert({
          user_id: user.id,
          name: snippetName,
          code,
          language: 'python',
        })
        .select()
        .single();

      if (data) {
        setSavedSnippets([data, ...savedSnippets]);
      }
    }
  };

  const runCode = async () => {
    setLoading(true);
    setOutput('Running...');

    try {
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'python' }),
      });

      const data = await res.json();
      setOutput(data.output || 'No output');

      // Save output
      const existing = savedSnippets.find((s) => s.name === snippetName);
      if (existing) {
        await supabase
          .from('code_snippets')
          .update({ output: data.output })
          .eq('id', existing.id);
      }

      addNotification({ type: 'success', message: 'Code executed successfully!' });
    } catch (error: any) {
      setOutput('Error: ' + error.message);
      addNotification({ type: 'error', message: 'Execution failed' });
    }

    setLoading(false);
  };

  const getAiSuggestion = async () => {
    if (!code) return;

    setShowAiPanel(true);
    setAiSuggestion('Generating suggestion...');

    try {
      const res = await fetch('/api/ai/code-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          model: currentModel,
          action: 'suggest',
        }),
      });

      const data = await res.json();
      setAiSuggestion(data.suggestion);
    } catch (error) {
      setAiSuggestion('Failed to get AI suggestion');
    }
  };

  const explainCode = async () => {
    if (!code) return;

    setShowAiPanel(true);
    setAiSuggestion('Analyzing code...');

    try {
      const res = await fetch('/api/ai/code-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          model: currentModel,
          action: 'explain',
        }),
      });

      const data = await res.json();
      setAiSuggestion(data.suggestion);
    } catch (error) {
      setAiSuggestion('Failed to explain code');
    }
  };

  const fixCode = async () => {
    if (!code) return;

    setShowAiPanel(true);
    setAiSuggestion('Finding bugs...');

    try {
      const res = await fetch('/api/ai/code-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          model: currentModel,
          action: 'fix',
        }),
      });

      const data = await res.json();
      setAiSuggestion(data.suggestion);

      if (data.fixedCode) {
        setCode(data.fixedCode);
      }
    } catch (error) {
      setAiSuggestion('Failed to fix code');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text">⚡ Python IDE</h2>
          <p className="text-gray-400 text-sm">AI-powered coding assistant</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={snippetName}
            onChange={(e) => setSnippetName(e.target.value)}
            placeholder="Snippet name"
            className="w-48 text-sm px-3 py-2"
          />
          <button onClick={() => setShowSnippets(!showSnippets)} className="btn btn-secondary text-sm">
            📂 Saved ({savedSnippets.length})
          </button>
          <button onClick={runCode} disabled={loading} className="btn btn-primary">
            {loading ? '⏳ Running...' : '▶️ Run Code'}
          </button>
        </div>
      </div>

      {/* Saved Snippets */}
      {showSnippets && (
        <div className="glass p-4 rounded-lg">
          <h3 className="font-bold mb-3">Saved Snippets</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {savedSnippets.map((snippet) => (
              <div
                key={snippet.id}
                onClick={() => {
                  setCode(snippet.code);
                  setSnippetName(snippet.name);
                  setShowSnippets(false);
                }}
                className="p-3 glass rounded cursor-pointer hover:glow transition"
              >
                <div className="font-semibold text-sm">{snippet.name}</div>
                <div className="text-xs text-gray-400">
                  {new Date(snippet.updated_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="monaco-container">
            <Editor
              height="500px"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>

          {/* Output */}
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold">Output</div>
              <button
                onClick={() => setOutput('')}
                className="text-xs btn btn-secondary"
              >
                Clear
              </button>
            </div>
            <pre className="text-sm whitespace-pre-wrap text-green-400 font-mono">
              {output || 'Run code to see output...'}
            </pre>
          </div>
        </div>

        {/* AI Copilot Panel */}
        <div className="space-y-4">
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold">🤖 AI Copilot</div>
              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="text-xs"
              >
                {showAiPanel ? '▼' : '▲'}
              </button>
            </div>

            {showAiPanel && (
              <>
                <div className="space-y-2 mb-3">
                  <button onClick={getAiSuggestion} className="w-full btn btn-primary text-sm">
                    💡 Get Suggestion
                  </button>
                  <button onClick={explainCode} className="w-full btn btn-secondary text-sm">
                    📖 Explain Code
                  </button>
                  <button onClick={fixCode} className="w-full btn btn-danger text-sm">
                    🔧 Fix Bugs
                  </button>
                </div>

                <div className="glass p-3 rounded max-h-80 overflow-y-auto text-sm whitespace-pre-wrap">
                  {aiSuggestion || 'Click a button to get AI assistance'}
                </div>
              </>
            )}
          </div>

          {/* Quick Templates */}
          <div className="glass p-4 rounded-lg">
            <div className="font-bold mb-3">📝 Quick Templates</div>
            <div className="space-y-2">
              {[
                { name: 'Hello World', code: 'print("Hello, World!")' },
                { name: 'For Loop', code: 'for i in range(10):\n    print(i)' },
                { name: 'Function', code: 'def my_function(x):\n    return x * 2\n\nprint(my_function(5))' },
                { name: 'List Comprehension', code: 'squares = [x**2 for x in range(10)]\nprint(squares)' },
              ].map((template) => (
                <button
                  key={template.name}
                  onClick={() => setCode(template.code)}
                  className="w-full text-left p-2 glass rounded hover:glow transition text-sm"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      <div className="text-xs text-center text-gray-400">
        ✅ Auto-saves every 3 seconds
      </div>
    </div>
  );
}
