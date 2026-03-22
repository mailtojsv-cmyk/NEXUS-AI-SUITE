'use client';

import { useState, useRef, useEffect } from 'react';

export default function FloatingTools() {
  const [activeTool, setActiveTool] = useState<string | null>('music');
  const [minimized, setMinimized] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 340, y: window.innerHeight - 120 });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!activeTool) {
    return (
      <div className="fixed bottom-4 right-4 z-[1000]">
        <button onClick={() => setActiveTool('music')} className="btn btn-primary rounded-full w-12 h-12 flex items-center justify-center text-xl shadow-lg">
          🎵
        </button>
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      className="glass fixed z-[1000] rounded-xl shadow-2xl border border-cyan-500/30"
      style={{ left: position.x, top: position.y, width: minimized ? 200 : 320 }}
    >
      <div
        className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 py-2 cursor-move flex items-center justify-between rounded-t-xl border-b border-cyan-500/30"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1">
          {['music', 'calc', 'currency', 'whatsapp'].map((t) => (
            <button key={t} onClick={() => setActiveTool(t)}
              className={`no-drag text-xs px-2 py-1 rounded ${activeTool === t ? 'bg-cyan-500/30' : 'hover:bg-white/10'}`}>
              {t === 'music' ? '🎵' : t === 'calc' ? '🧮' : t === 'currency' ? '💱' : '💬'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(!minimized)} className="no-drag text-xs hover:bg-white/10 px-1 rounded">
            {minimized ? '▲' : '▼'}
          </button>
          <button onClick={() => setActiveTool(null)} className="no-drag text-xs hover:bg-white/10 px-1 rounded">✕</button>
        </div>
      </div>

      {!minimized && (
        <div className="p-3 no-drag">
          {activeTool === 'music' && <MusicWidget />}
          {activeTool === 'calc' && <CalcWidget />}
          {activeTool === 'currency' && <CurrencyWidget />}
          {activeTool === 'whatsapp' && <WhatsAppWidget />}
        </div>
      )}
    </div>
  );
}

function MusicWidget() {
  return (
    <div>
      <div className="text-center text-sm font-semibold mb-2">🎵 Music Player</div>
      <iframe
        width="100%"
        height="152"
        src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0&controls=1"
        title="Music"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="rounded-lg"
      />
    </div>
  );
}

function CalcWidget() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState('');
  const [op, setOp] = useState('');

  const handleNum = (n: string) => setDisplay(display === '0' ? n : display + n);
  const handleOp = (o: string) => { setPrev(display); setOp(o); setDisplay('0'); };
  const calculate = () => {
    const a = parseFloat(prev);
    const b = parseFloat(display);
    let r = 0;
    if (op === '+') r = a + b;
    if (op === '-') r = a - b;
    if (op === '*') r = a * b;
    if (op === '/') r = a / b;
    setDisplay(r.toString());
    setPrev('');
    setOp('');
  };

  return (
    <div>
      <div className="glass p-2 rounded mb-2 text-right text-xl font-mono">{display}</div>
      <div className="grid grid-cols-4 gap-1">
        {['7','8','9','/','4','5','6','*','1','2','3','-','0','C','=','+'].map((b) => (
          <button key={b} onClick={() => {
            if (b === 'C') { setDisplay('0'); setPrev(''); setOp(''); }
            else if (b === '=') calculate();
            else if (['+','-','*','/'].includes(b)) handleOp(b);
            else handleNum(b);
          }} className={`btn ${b === '=' ? 'btn-primary' : 'btn-secondary'} text-sm p-2`}>{b}</button>
        ))}
      </div>
    </div>
  );
}

function CurrencyWidget() {
  const [amount, setAmount] = useState('100');
  const [result, setResult] = useState('');
  return (
    <div>
      <div className="text-center text-sm font-semibold mb-2">💱 INR to USD</div>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹ Amount" className="mb-2" />
      <button onClick={() => setResult(`₹${amount} = $${(parseFloat(amount) / 83).toFixed(2)}`)} className="btn btn-primary w-full mb-2 text-sm">Convert</button>
      {result && <div className="glass p-2 rounded text-center text-sm text-green-400">{result}</div>}
    </div>
  );
}

function WhatsAppWidget() {
  const [text, setText] = useState('');
  return (
    <div>
      <div className="text-center text-sm font-semibold mb-2">💬 WhatsApp Format</div>
      <div className="text-xs text-gray-400 mb-1">*bold* _italic_ ~strike~</div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type message..." className="h-20 mb-2 text-sm" />
      <button onClick={() => { navigator.clipboard.writeText(text); alert('Copied!'); }} className="btn btn-success w-full text-sm">📋 Copy</button>
    </div>
  );
}
