import React, { useState, useEffect, useCallback } from 'react';
import { Delete, History, Calculator as CalcIcon } from 'lucide-react';
import { CalcMode } from '../types';

export const ScientificCalculator: React.FC = () => {
  const [display, setDisplay] = useState('');
  const [result, setResult] = useState('');
  const [mode, setMode] = useState<CalcMode>(CalcMode.DEG);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Safe evaluation of mathematical expressions
  const evaluateExpression = useCallback((expr: string): string => {
    try {
      // Replace visual operators with JS operators
      let cleanExpr = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**')
        .replace(/√\(/g, 'Math.sqrt(');

      // Handle trigonometry based on mode
      const trigFuncs = ['sin', 'cos', 'tan'];
      trigFuncs.forEach(func => {
        const regex = new RegExp(`${func}\\(`, 'g');
        if (mode === CalcMode.DEG) {
           // Convert degrees to radians for JS Math functions
           // This is a naive replacement, for a robust app a tokenizer is better,
           // but sufficient for this demo level.
           // Replacing sin(x) with sin((x) * Math.PI / 180) is hard with regex alone without matching parens.
           // Instead, we wrapper the functions:
           // We'll define custom functions in the evaluation scope.
        }
      });

      // Construct a safe evaluation context
      const scope = {
        sin: (x: number) => mode === CalcMode.DEG ? Math.sin(x * Math.PI / 180) : Math.sin(x),
        cos: (x: number) => mode === CalcMode.DEG ? Math.cos(x * Math.PI / 180) : Math.cos(x),
        tan: (x: number) => mode === CalcMode.DEG ? Math.tan(x * Math.PI / 180) : Math.tan(x),
        asin: (x: number) => mode === CalcMode.DEG ? Math.asin(x) * 180 / Math.PI : Math.asin(x),
        acos: (x: number) => mode === CalcMode.DEG ? Math.acos(x) * 180 / Math.PI : Math.acos(x),
        atan: (x: number) => mode === CalcMode.DEG ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
        log: Math.log10,
        ln: Math.log,
        sqrt: Math.sqrt,
        abs: Math.abs,
        PI: Math.PI,
        E: Math.E,
        pow: Math.pow
      };

      const keys = Object.keys(scope);
      const values = Object.values(scope);
      
      // Basic sanitization
      if (!/^[0-9+\-*/()., \w]+$/.test(cleanExpr)) {
        return "Error";
      }

      // Use Function constructor to evaluate with scope
      // Note: "with" is deprecated/strict mode restricted, so we manually prefix if needed or just rely on simple replacements for this UI demo.
      // For this demo, we will just use explicit replacements for the scope keys if they exist in the string.
      
      // Let's use a simpler approach: define the math functions in the function body string.
      const funcBody = `
        const { sin, cos, tan, asin, acos, atan, log, ln, sqrt, abs, PI, E, pow } = scope;
        return ${cleanExpr};
      `;
      
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const func = new Function('scope', funcBody);
      const val = func(scope);
      
      // Round to avoid floating point errors
      const rounded = Math.round(val * 1e10) / 1e10;
      return String(rounded);

    } catch (e) {
      return "Error";
    }
  }, [mode]);

  const handlePress = (val: string) => {
    if (val === '=') {
      const res = evaluateExpression(display);
      setResult(res);
      if (res !== "Error") {
        setHistory(prev => [`${display} = ${res}`, ...prev].slice(0, 10));
        setDisplay(res);
      }
    } else if (val === 'C') {
      setDisplay('');
      setResult('');
    } else if (val === 'DEL') {
      setDisplay(prev => prev.slice(0, -1));
    } else {
      setDisplay(prev => prev + val);
    }
  };

  const buttons = [
    { label: '2nd', type: 'func' },
    { label: 'deg', type: 'func', action: () => setMode(m => m === CalcMode.DEG ? CalcMode.RAD : CalcMode.DEG), active: mode === CalcMode.DEG },
    { label: 'sin', type: 'func', val: 'sin(' },
    { label: 'cos', type: 'func', val: 'cos(' },
    { label: 'tan', type: 'func', val: 'tan(' },

    { label: 'pow', type: 'func', val: '^' },
    { label: 'log', type: 'func', val: 'log(' },
    { label: 'ln', type: 'func', val: 'ln(' },
    { label: '(', type: 'func' },
    { label: ')', type: 'func' },

    { label: '√', type: 'func', val: 'sqrt(' },
    { label: 'C', type: 'danger' },
    { label: 'DEL', type: 'danger' },
    { label: '%', type: 'func', val: '/100' },
    { label: '÷', type: 'op' },

    { label: '7', type: 'num' },
    { label: '8', type: 'num' },
    { label: '9', type: 'num' },
    { label: '×', type: 'op' },
    { label: '4', type: 'num' }, // Grid layout adjustment

    { label: '4', type: 'num' },
    { label: '5', type: 'num' },
    { label: '6', type: 'num' },
    { label: '-', type: 'op' },
    { label: '', type: 'empty' }, // Filler

    { label: '1', type: 'num' },
    { label: '2', type: 'num' },
    { label: '3', type: 'num' },
    { label: '+', type: 'op' },
    { label: '', type: 'empty' }, // Filler

    { label: '0', type: 'num', span: 2 },
    { label: '.', type: 'num' },
    { label: '=', type: 'primary' },
  ];
  
  // Re-organize for a standard grid layout
  // 5 columns
  const gridButtons = [
    // Row 1
    { label: mode === CalcMode.DEG ? 'DEG' : 'RAD', action: () => setMode(m => m === CalcMode.DEG ? CalcMode.RAD : CalcMode.DEG), type: 'meta' },
    { label: 'sin', val: 'sin(', type: 'func' },
    { label: 'cos', val: 'cos(', type: 'func' },
    { label: 'tan', val: 'tan(', type: 'func' },
    { label: 'C', type: 'danger' },

    // Row 2
    { label: 'x^y', val: '^', type: 'func' },
    { label: 'log', val: 'log(', type: 'func' },
    { label: 'ln', val: 'ln(', type: 'func' },
    { label: '(', val: '(', type: 'func' },
    { label: ')', val: ')', type: 'func' },

    // Row 3
    { label: '√', val: '√(', type: 'func' },
    { label: '7', type: 'num' },
    { label: '8', type: 'num' },
    { label: '9', type: 'num' },
    { label: '÷', type: 'op' },

    // Row 4
    { label: 'π', val: 'π', type: 'func' },
    { label: '4', type: 'num' },
    { label: '5', type: 'num' },
    { label: '6', type: 'num' },
    { label: '×', type: 'op' },

    // Row 5
    { label: 'e', val: 'e', type: 'func' },
    { label: '1', type: 'num' },
    { label: '2', type: 'num' },
    { label: '3', type: 'num' },
    { label: '-', type: 'op' },

    // Row 6
    { label: 'Ans', action: () => setDisplay(prev => prev + result), type: 'func' },
    { label: '0', type: 'num' },
    { label: '.', type: 'num' },
    { label: '=', type: 'primary' },
    { label: '+', type: 'op' },
  ];


  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Display */}
        <div className="p-8 bg-gradient-to-b from-slate-900 to-slate-800 border-b border-slate-700 relative">
          <div className="absolute top-4 right-4 flex gap-2">
             <button onClick={() => setDisplay(prev => prev.slice(0, -1))} className="text-slate-400 hover:text-white transition">
                <Delete size={20} />
             </button>
             <button onClick={() => setShowHistory(!showHistory)} className={`transition ${showHistory ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                <History size={20} />
             </button>
          </div>
          
          <div className="h-24 flex flex-col items-end justify-end space-y-2">
            <div className="text-slate-400 text-sm h-6 overflow-hidden w-full text-right">{result ? `${display} =` : ''}</div>
            <input 
              type="text" 
              value={display} 
              readOnly 
              className="w-full bg-transparent text-right text-4xl sm:text-5xl font-light text-white outline-none placeholder-slate-600"
              placeholder="0"
            />
          </div>
        </div>

        {/* History Overlay */}
        {showHistory && (
          <div className="absolute top-[160px] left-0 w-full h-64 bg-slate-900/95 backdrop-blur z-20 border-b border-slate-700 p-4 overflow-y-auto">
             <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">History</span>
                 <button onClick={() => setHistory([])} className="text-xs text-red-400 hover:text-red-300">Clear</button>
             </div>
             {history.length === 0 ? <p className="text-slate-500 text-center text-sm mt-8">No history</p> : (
                 <div className="space-y-2">
                     {history.map((h, i) => (
                         <div key={i} className="text-right p-2 hover:bg-slate-800 rounded cursor-pointer transition" onClick={() => {
                             const parts = h.split('=');
                             setDisplay(parts[0].trim());
                             setShowHistory(false);
                         }}>
                             <span className="text-slate-300">{h}</span>
                         </div>
                     ))}
                 </div>
             )}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-5 gap-px bg-slate-800 flex-1">
           {gridButtons.map((btn, idx) => {
             let bgClass = 'bg-slate-900 hover:bg-slate-800 text-white';
             if (btn.type === 'primary') bgClass = 'bg-blue-600 hover:bg-blue-500 text-white font-bold';
             if (btn.type === 'danger') bgClass = 'bg-red-500/10 hover:bg-red-500/20 text-red-400';
             if (btn.type === 'op') bgClass = 'bg-slate-800 hover:bg-slate-700 text-blue-400 text-xl';
             if (btn.type === 'meta') bgClass = 'bg-slate-900 text-xs font-bold text-slate-500';
             if (btn.type === 'func') bgClass = 'bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm';
             
             return (
               <button 
                 key={idx}
                 onClick={() => btn.action ? btn.action() : handlePress(btn.val || btn.label)}
                 className={`${bgClass} p-4 sm:p-5 flex items-center justify-center transition active:scale-95`}
               >
                 {btn.label}
               </button>
             )
           })}
        </div>
      </div>
      
      <div className="absolute bottom-8 text-slate-500 animate-bounce cursor-pointer flex flex-col items-center gap-2"
           onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
          <span className="text-xs uppercase tracking-[0.2em]">Ask AI</span>
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-slate-500"></div>
      </div>
    </div>
  );
};
