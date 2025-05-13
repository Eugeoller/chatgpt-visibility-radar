
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer';
import App from './App.tsx'
import './index.css'

// Add Buffer for edge functions
window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
