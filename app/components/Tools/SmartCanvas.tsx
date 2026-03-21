'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/app/lib/store';
import { supabase } from '@/app/lib/supabase';

export default function SmartCanvas() {
  const { user, currentModel, addNotification } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#00ff00');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'line' | 'rect' | 'circle'>('pen');
  const [canvasName, setCanvasName] = useState('My Drawing');
  const [savedDrawings, setSavedDrawings] = useState<any[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [aiPrediction, setAiPrediction] = useState('');
  const [showAi, setShowAi] = useState(true);
  const [drawingData, setDrawingData] = useState<any[]>([]);
  
  const startPosRef = useRef({ x: 0, y: 0 });
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    loadDrawings();
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
  }, [drawingData]);

  const loadDrawings = async () => {
    const { data } = await supabase
      .from('canvas_drawings')
      .select('*')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    setSavedDrawings(data || []);
  };

  const autoSave = async () => {
    if (!user || drawingData.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const existing = savedDrawings.find((d) => d.name === canvasName);

    if (existing) {
      await supabase
        .from('canvas_drawings')
        .update({
          drawing_data: { strokes: drawingData, dataUrl },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      const { data } = await supabase
        .from('canvas_drawings')
        .insert({
          user_id: user.id,
          name: canvasName,
          drawing_data: { strokes: drawingData, dataUrl },
        })
        .select()
        .single();

      if (data) {
        setSavedDrawings([data, ...savedDrawings]);
      }
    }
  };

  const getCanvasCoords = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    return { x, y };
  };

  const startDrawing = (e: any) => {
    const coords = getCanvasCoords(e);
    startPosRef.current = coords;
    setIsDrawing(true);

    if (tool === 'pen' || tool === 'eraser') {
      draw(e);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (e.type === 'mousedown' || e.type === 'touchstart') {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
      } else {
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }

      // Save stroke data
      setDrawingData([...drawingData, { tool: 'pen', coords, color, size: brushSize }]);

      // Trigger AI prediction every 10 strokes
      if (drawingData.length % 10 === 0) {
        predictNextAction();
      }
    } else if (tool === 'eraser') {
      ctx.clearRect(coords.x - brushSize / 2, coords.y - brushSize / 2, brushSize, brushSize);
    }
  };

  const stopDrawing = (e: any) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    if (tool === 'line') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.strokeRect(
        startPosRef.current.x,
        startPosRef.current.y,
        coords.x - startPosRef.current.x,
        coords.y - startPosRef.current.y
      );
    } else if (tool === 'circle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      const radius = Math.sqrt(
        Math.pow(coords.x - startPosRef.current.x, 2) +
        Math.pow(coords.y - startPosRef.current.y, 2)
      );
      ctx.beginPath();
      ctx.arc(startPosRef.current.x, startPosRef.current.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    setDrawingData([]);
    setAiPrediction('');
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${canvasName}.png`;
    link.href = canvas.toDataURL();
    link.click();

    addNotification({ type: 'success', message: 'Canvas saved!' });
  };

  const predictNextAction = async () => {
    setShowAi(true);
    setAiPrediction('Analyzing your drawing...');

    try {
      const res = await fetch('/api/ai/canvas-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strokes: drawingData.slice(-20), // Last 20 strokes
          model: currentModel,
        }),
      });

      const data = await res.json();
      setAiPrediction(data.prediction);
    } catch (error) {
      setAiPrediction('AI prediction unavailable');
    }
  };

  const loadDrawing = (drawing: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load image from data URL
    if (drawing.drawing_data?.dataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = drawing.drawing_data.dataUrl;
    }

    setCanvasName(drawing.name);
    setDrawingData(drawing.drawing_data?.strokes || []);
    setShowSaved(false);

    addNotification({ type: 'success', message: 'Drawing loaded!' });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text">🎨 Smart Canvas</h2>
          <p className="text-gray-400 text-sm">AI-powered whiteboard with predictions</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={canvasName}
            onChange={(e) => setCanvasName(e.target.value)}
            placeholder="Canvas name"
            className="w-48 text-sm px-3 py-2"
          />
          <button onClick={() => setShowSaved(!showSaved)} className="btn btn-secondary text-sm">
            📂 Saved ({savedDrawings.length})
          </button>
          <button onClick={clearCanvas} className="btn btn-danger text-sm">
            🗑️ Clear
          </button>
          <button onClick={saveCanvas} className="btn btn-success text-sm">
            💾 Save
          </button>
        </div>
      </div>

      {/* Saved Drawings */}
      {showSaved && (
        <div className="glass p-4 rounded-lg">
          <h3 className="font-bold mb-3">Saved Drawings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {savedDrawings.map((drawing) => (
              <div
                key={drawing.id}
                onClick={() => loadDrawing(drawing)}
                className="glass p-3 rounded cursor-pointer hover:glow transition"
              >
                {drawing.drawing_data?.dataUrl && (
                  <img
                    src={drawing.drawing_data.dataUrl}
                    alt={drawing.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <div className="font-semibold text-sm truncate">{drawing.name}</div>
                <div className="text-xs text-gray-400">
                  {new Date(drawing.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Toolbar */}
        <div className="space-y-4">
          <div className="glass p-4 rounded-lg">
            <h3 className="font-bold mb-3">🛠️ Tools</h3>

            <div className="space-y-2">
              {[
                { id: 'pen', icon: '✏️', name: 'Pen' },
                { id: 'eraser', icon: '🧹', name: 'Eraser' },
                { id: 'line', icon: '📏', name: 'Line' },
                { id: 'rect', icon: '⬜', name: 'Rectangle' },
                { id: 'circle', icon: '⭕', name: 'Circle' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as any)}
                  className={`w-full text-left p-2 rounded transition ${
                    tool === t.id
                      ? 'bg-cyan-500/20 border border-cyan-500/50'
                      : 'glass hover:bg-white/5'
                  }`}
                >
                  {t.icon} {t.name}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-sm font-semibold mb-2 block">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-12 rounded cursor-pointer border-2 border-cyan-500/30"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-semibold mb-2 block">
                Brush Size: {brushSize}px
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Quick Colors */}
          <div className="glass p-4 rounded-lg">
            <h3 className="font-bold mb-3">🎨 Quick Colors</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                '#ffffff', '#000000', '#ff0000', '#00ff00',
                '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
                '#ff8800', '#8800ff', '#00ff88', '#ff0088',
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-10 h-10 rounded border-2 border-white/20 hover:scale-110 transition"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-2">
          <canvas
            ref={canvasRef}
            width={1000}
            height={600}
            className="w-full border border-cyan-500/30 rounded-lg cursor-crosshair bg-gray-900"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          <div className="text-xs text-center text-gray-400 mt-2">
            ✅ Auto-saves every 3 seconds
          </div>
        </div>

        {/* AI Assistant */}
        <div className="space-y-4">
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold">🤖 AI Predictions</div>
              <button onClick={() => setShowAi(!showAi)} className="text-xs">
                {showAi ? '▼' : '▲'}
              </button>
            </div>

            {showAi && (
              <>
                <button
                  onClick={predictNextAction}
                  className="w-full btn btn-primary text-sm mb-3"
                >
                  🔮 Predict Next
                </button>

                <div className="glass p-3 rounded max-h-80 overflow-y-auto text-sm whitespace-pre-wrap">
                  {aiPrediction || 'Start drawing to get AI predictions...'}
                </div>
              </>
            )}
          </div>

          {/* Drawing Stats */}
          <div className="glass p-4 rounded-lg">
            <h3 className="font-bold mb-3">📊 Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Strokes:</span>
                <span className="font-bold">{drawingData.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Tool:</span>
                <span className="font-bold capitalize">{tool}</span>
              </div>
              <div className="flex justify-between">
                <span>Brush Size:</span>
                <span className="font-bold">{brushSize}px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  }
