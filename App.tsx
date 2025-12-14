import React from 'react';
import { ScientificCalculator } from './components/ScientificCalculator';
import { ChatInterface } from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 selection:bg-blue-500/30">
      <ScientificCalculator />
      <ChatInterface />
    </div>
  );
};

export default App;
