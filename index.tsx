
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Error Boundary Simples para Produção
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Crash do App detectado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6 text-center">
          <h1 className="text-3xl font-black text-[#002855] uppercase italic">Sistema <span className="text-yellow-500">Indisponível</span></h1>
          <p className="text-slate-500 font-bold mt-4">Houve um erro crítico na renderização.</p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} 
            className="mt-8 bg-[#002855] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-900 transition-all shadow-xl"
          >
            Limpar Cache e Reiniciar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  const fallback = document.getElementById('error-fallback');
  if (fallback) fallback.style.display = 'flex';
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
