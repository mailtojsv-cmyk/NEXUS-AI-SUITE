'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/app/lib/store';
import { supabase } from '@/app/lib/supabase';
import {
  ROBOT_COMPONENTS,
  COMPONENT_CATEGORIES,
  getComponentsByCategory,
  calculateTotalPrice,
  validateDesign,
} from '@/app/lib/robotComponents';

interface PlacedComponent {
  instanceId: number;
  id: string;
  name: string;
  category: string;
  price: number;
  specs: string;
  position: { x: number; y: number };
  rotation: number;
  color: string;
}

const GRID_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const CATEGORY_COLORS: Record<string, string> = {
  chassis: '#3b82f6',
  motor: '#f59e0b',
  sensor: '#10b981',
  controller: '#8b5cf6',
  power: '#ef4444',
  wheel: '#6b7280',
  accessory: '#06b6d4',
};

export default function RoboBuilder3D() {
  const { user, currentModel, addNotification } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([]);
  const [designName, setDesignName] = useState('My Robot');
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [aiAssistant, setAiAssistant] = useState('');
  const [showAi, setShowAi] = useState(true);
  const [dragging, setDragging] = useState<PlacedComponent | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<PlacedComponent | null>(null);
  const [viewMode, setViewMode] = useState<'top' | 'front' | 'side'>('top');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    loadDesigns();
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [placedComponents, viewMode, zoom, selectedComponent]);

  useEffect(() => {
    const timer = setTimeout(() => autoSave(), 5000);
    return () => clearTimeout(timer);
  }, [placedComponents, designName]);

  const loadDesigns = async () => {
    const { data } = await supabase
      .from('robot_designs')
      .select('*')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })
      .limit(10);
    setSavedDesigns(data || []);
  };

  const autoSave = async () => {
    if (!user || placedComponents.length === 0) return;
    const totalPrice = calculateTotalPrice(placedComponents.map((c) => c.id));
    const existing = savedDesigns.find((d) => d.name === designName);

    if (existing) {
      await supabase
        .from('robot_designs')
        .update({ components: placedComponents, total_price: totalPrice, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      const { data } = await supabase
        .from('robot_designs')
        .insert({ user_id: user.id, name: designName, components: placedComponents, total_price: totalPrice })
        .select()
        .single();
      if (data) setSavedDesigns([data, ...savedDesigns]);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += GRID_SIZE * zoom) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += GRID_SIZE * zoom) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw axis labels
    ctx.fillStyle = 'rgba(14, 165, 233, 0.5)';
    ctx.font = '12px monospace';
    if (viewMode === 'top') {
      ctx.fillText('X →', CANVAS_WIDTH - 40, CANVAS_HEIGHT - 10);
      ctx.fillText('Z ↑', 10, 20);
      ctx.fillText('TOP VIEW', CANVAS_WIDTH / 2 - 30, 20);
    } else if (viewMode === 'front') {
      ctx.fillText('X →', CANVAS_WIDTH - 40, CANVAS_HEIGHT - 10);
      ctx.fillText('Y ↑', 10, 20);
      ctx.fillText('FRONT VIEW', CANVAS_WIDTH / 2 - 40, 20);
    } else {
      ctx.fillText('Z →', CANVAS_WIDTH - 40, CANVAS_HEIGHT - 10);
      ctx.fillText('Y ↑', 10, 20);
      ctx.fillText('SIDE VIEW', CANVAS_WIDTH / 2 - 35, 20);
    }

    // Draw center crosshair
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT / 2);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw 3D floor (isometric illusion)
    if (viewMode === 'top') {
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.15)';
      for (let i = -10; i <= 10; i++) {
        const cx = CANVAS_WIDTH / 2 + i * GRID_SIZE * zoom;
        const cy = CANVAS_HEIGHT / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 100 * zoom);
        ctx.lineTo(cx + 50 * zoom, cy + 100 * zoom);
        ctx.stroke();
      }
    }

    // Draw components
    placedComponents.forEach((comp) => {
      const isSelected = selectedComponent?.instanceId === comp.instanceId;
      const baseColor = CATEGORY_COLORS[comp.category] || '#0ea5e9';

      // 3D-like rendering
      const x = comp.position.x;
      const y = comp.position.y;
      const w = 60 * zoom;
      const h = 40 * zoom;
      const depth = 10 * zoom;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x + 4, y + 4, w, h);

      // Side face (3D effect)
      ctx.fillStyle = adjustColor(baseColor, -30);
      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.lineTo(x + w + depth, y - depth);
      ctx.lineTo(x + w + depth, y + h - depth);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();

      // Top face (3D effect)
      ctx.fillStyle = adjustColor(baseColor, 30);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + depth, y - depth);
      ctx.lineTo(x + w + depth, y - depth);
      ctx.lineTo(x + w, y);
      ctx.closePath();
      ctx.fill();

      // Front face
      ctx.fillStyle = baseColor;
      ctx.fillRect(x, y, w, h);

      // Selection border
      if (isSelected) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);

        // Selection handles
        ctx.fillStyle = '#00ff00';
        [
          [x - 4, y - 4],
          [x + w, y - 4],
          [x - 4, y + h],
          [x + w, y + h],
        ].forEach(([hx, hy]) => {
          ctx.fillRect(hx, hy, 8, 8);
        });
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
      }

      // Category icon
      const icons: Record<string, string> = {
        chassis: '🚗',
        motor: '⚙️',
        sensor: '📡',
        controller: '🧠',
        power: '🔋',
        wheel: '⚪',
        accessory: '🔌',
      };
      ctx.font = `${16 * zoom}px sans-serif`;
      ctx.fillText(icons[comp.category] || '📦', x + 5, y + h / 2 + 5);

      // Component name
      ctx.fillStyle = '#fff';
      ctx.font = `${9 * zoom}px sans-serif`;
      const shortName = comp.name.length > 12 ? comp.name.substring(0, 12) + '..' : comp.name;
      ctx.fillText(shortName, x + 22 * zoom, y + h / 2 + 3);
    });

    // Draw measurement if two components selected
    if (placedComponents.length >= 2) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.setLineDash([3, 3]);
      for (let i = 0; i < placedComponents.length - 1; i++) {
        const a = placedComponents[i];
        const b = placedComponents[i + 1];
        ctx.beginPath();
        ctx.moveTo(a.position.x + 30 * zoom, a.position.y + 20 * zoom);
        ctx.lineTo(b.position.x + 30 * zoom, b.position.y + 20 * zoom);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  };

  const adjustColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const addComponent = (component: any) => {
    const newComp: PlacedComponent = {
      ...component,
      instanceId: Date.now(),
      position: {
        x: CANVAS_WIDTH / 2 - 30 + Math.random() * 100 - 50,
        y: CANVAS_HEIGHT / 2 - 20 + Math.random() * 100 - 50,
      },
      rotation: 0,
      color: CATEGORY_COLORS[component.category] || '#0ea5e9',
    };

    setPlacedComponents([...placedComponents, newComp]);
    addNotification({ type: 'success', message: `Added ${component.name}` });
    getAiHelp('add', component);
  };

  const removeComponent = (instanceId: number) => {
    setPlacedComponents(placedComponents.filter((c) => c.instanceId !== instanceId));
    setSelectedComponent(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked component
    const clicked = [...placedComponents].reverse().find((comp) => {
      const w = 60 * zoom;
      const h = 40 * zoom;
      return x >= comp.position.x && x <= comp.position.x + w && y >= comp.position.y && y <= comp.position.y + h;
    });

    if (clicked) {
      setDragging(clicked);
      setSelectedComponent(clicked);
    } else {
      setSelectedComponent(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - 30 * zoom;
    const y = e.clientY - rect.top - 20 * zoom;

    // Snap to grid
    const snappedX = Math.round(x / (GRID_SIZE * zoom)) * (GRID_SIZE * zoom);
    const snappedY = Math.round(y / (GRID_SIZE * zoom)) * (GRID_SIZE * zoom);

    setPlacedComponents(
      placedComponents.map((c) =>
        c.instanceId === dragging.instanceId ? { ...c, position: { x: snappedX, y: snappedY } } : c
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setDragging(null);
  };

  const getAiHelp = async (action: string, component: any) => {
    setShowAi(true);
    setAiAssistant('Analyzing...');

    try {
      const res = await fetch('/api/ai/robo-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, component, currentDesign: placedComponents, model: currentModel }),
      });
      const data = await res.json();
      setAiAssistant(data.suggestion);
    } catch (error) {
      setAiAssistant('AI assist unavailable');
    }
  };

  const validateDesignNow = () => {
    const validation = validateDesign(placedComponents);
    if (validation.valid) {
      setAiAssistant('✅ Design is valid! All required components present.\n\nReady to build!');
      addNotification({ type: 'success', message: 'Design validated!' });
    } else {
      setAiAssistant('❌ Issues found:\n\n' + validation.errors.map((e) => '• ' + e).join('\n'));
      addNotification({ type: 'error', message: 'Design has issues' });
    }
  };

  const generateBOM = () => {
    const totalPrice = calculateTotalPrice(placedComponents.map((c) => c.id));
    let bom = '📋 BILL OF MATERIALS\n';
    bom += '═══════════════════════════════\n\n';

    const counts: Record<string, { comp: any; qty: number }> = {};
    placedComponents.forEach((c) => {
      if (counts[c.id]) {
        counts[c.id].qty++;
      } else {
        counts[c.id] = { comp: c, qty: 1 };
      }
    });

    Object.values(counts).forEach(({ comp, qty }) => {
      const subtotal = comp.price * qty;
      bom += `${comp.name}\n`;
      bom += `  Category: ${comp.category}\n`;
      bom += `  Qty: ${qty} × ₹${comp.price} = ₹${subtotal}\n\n`;
    });

    bom += '═══════════════════════════════\n';
    bom += `TOTAL COST: ₹${totalPrice}\n`;
    bom += '═══════════════════════════════\n\n';
    bom += '🛒 Where to buy (India):\n';
    bom += '• https://robu.in\n';
    bom += '• https://www.amazon.in\n';
    bom += '• https://www.electronicscomp.com\n';
    bom += '• https://robokits.co.in\n';

    setAiAssistant(bom);
  };

  const generateCode = async () => {
    setAiAssistant('Generating Arduino code...');
    try {
      const res = await fetch('/api/ai/robo-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_code',
          component: null,
          currentDesign: placedComponents,
          model: currentModel,
        }),
      });
      const data = await res.json();
      setAiAssistant(data.suggestion);
    } catch (error) {
      setAiAssistant('Code generation failed');
    }
  };

  const exportDesign = () => {
    const data = {
      name: designName,
      components: placedComponents,
      totalPrice: calculateTotalPrice(placedComponents.map((c) => c.id)),
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${designName}.json`;
    a.click();
    addNotification({ type: 'success', message: 'Design exported!' });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text">🤖 RoboBuilder 3D</h2>
          <p className="text-gray-400 text-sm">Drag-and-drop robot designer with AI assistant</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input value={designName} onChange={(e) => setDesignName(e.target.value)} placeholder="Design name" className="w-40 text-sm px-3 py-2" />
          <button onClick={() => setShowSaved(!showSaved)} className="btn btn-secondary text-sm">📂 ({savedDesigns.length})</button>
          <button onClick={validateDesignNow} className="btn btn-primary text-sm">✅ Validate</button>
          <button onClick={generateBOM} className="btn btn-success text-sm">📋 BOM</button>
          <button onClick={generateCode} className="btn btn-secondary text-sm">💻 Code</button>
          <button onClick={exportDesign} className="btn btn-secondary text-sm">💾 Export</button>
        </div>
      </div>

      {/* Saved Designs */}
      {showSaved && (
        <div className="glass p-4 rounded-lg">
          <h3 className="font-bold mb-3">Saved Designs</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {savedDesigns.map((design) => (
              <div key={design.id} onClick={() => { setPlacedComponents(design.components || []); setDesignName(design.name); setShowSaved(false); }} className="glass p-3 rounded cursor-pointer hover:glow transition">
                <div className="font-semibold text-sm">{design.name}</div>
                <div className="text-xs text-gray-400">{(design.components || []).length} parts • ₹{design.total_price}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Component Library */}
        <div className="space-y-4">
          <div className="glass p-4 rounded-lg">
            <h3 className="font-bold mb-3">🔧 Components</h3>
            <div className="space-y-1 mb-3">
              {COMPONENT_CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full text-left p-2 rounded transition text-sm ${selectedCategory === cat.id ? 'bg-cyan-500/20 border border-cyan-500/50' : 'hover:bg-white/5'}`}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getComponentsByCategory(selectedCategory).map((comp) => (
                <div key={comp.id} className="glass p-2 rounded">
                  <div className="font-semibold text-xs">{comp.name}</div>
                  <div className="text-xs text-gray-400">{comp.specs}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-green-400">₹{comp.price}</span>
                    <button onClick={() => addComponent(comp)} className="btn btn-primary text-xs px-2 py-1">+ Add</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="lg:col-span-2 space-y-2">
          {/* View Controls */}
          <div className="flex items-center justify-between glass p-2 rounded-lg">
            <div className="flex gap-2">
              {(['top', 'front', 'side'] as const).map((view) => (
                <button key={view} onClick={() => setViewMode(view)} className={`px-3 py-1 rounded text-sm ${viewMode === view ? 'btn-primary' : 'btn-secondary'}`}>
                  {view === 'top' ? '⬆️ Top' : view === 'front' ? '👁️ Front' : '↔️ Side'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="btn btn-secondary text-xs px-2 py-1">-</button>
              <span className="text-xs">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(2, zoom + 0.25))} className="btn btn-secondary text-xs px-2 py-1">+</button>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full border border-cyan-500/30 rounded-lg cursor-crosshair bg-gray-900"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />

          {/* Placed Components List */}
          {placedComponents.length > 0 && (
            <div className="glass p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">Components ({placedComponents.length})</span>
                <span className="text-sm font-bold text-green-400">Total: ₹{calculateTotalPrice(placedComponents.map((c) => c.id))}</span>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {placedComponents.map((comp) => (
                  <div key={comp.instanceId} className={`flex items-center justify-between p-2 rounded text-sm ${selectedComponent?.instanceId === comp.instanceId ? 'bg-cyan-500/20 border border-cyan-500/50' : 'glass'}`}>
                    <span onClick={() => setSelectedComponent(comp)} className="cursor-pointer flex-1">{comp.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-400">₹{comp.price}</span>
                      <button onClick={() => removeComponent(comp.instanceId)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-center text-gray-400">
            ✅ Click component to select • Drag to move • Auto-saves every 5s
          </div>
        </div>

        {/* AI Panel */}
        <div className="space-y-4">
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold">🤖 AI Assistant</div>
              <button onClick={() => setShowAi(!showAi)} className="text-xs">{showAi ? '▼' : '▲'}</button>
            </div>
            {showAi && (
              <div className="glass p-3 rounded max-h-96 overflow-y-auto text-sm whitespace-pre-wrap">
                {aiAssistant || 'Add components to get AI suggestions...'}
              </div>
            )}
          </div>

          <div className="glass p-4 rounded-lg">
            <h3 className="font-bold mb-3 text-sm">📊 Design Stats</h3>
            <div className="space-y-1 text-xs">
              {Object.entries(
                placedComponents.reduce((acc: any, c) => {
                  acc[c.category] = (acc[c.category] || 0) + 1;
                  return acc;
                }, {})
              ).map(([cat, count]) => (
                <div key={cat} className="flex justify-between">
                  <span className="capitalize">{cat}:</span>
                  <span className="font-bold">{count as number}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-cyan-500/30 flex justify-between font-bold">
                <span>Total Cost:</span>
                <span className="text-green-400">₹{calculateTotalPrice(placedComponents.map((c) => c.id))}</span>
              </div>
            </div>
          </div>

          {/* Color Legend */}
          <div className="glass p-4 rounded-lg">
            <h3 className="font-bold mb-3 text-sm">🎨 Legend</h3>
            <div className="space-y-1">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                  <span className="capitalize">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
      }
