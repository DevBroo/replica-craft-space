import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppearanceProvider } from './contexts/AppearanceContext'

createRoot(document.getElementById("root")!).render(
  <AppearanceProvider>
    <App />
  </AppearanceProvider>
);