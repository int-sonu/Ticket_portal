import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { loadConfig } from './Axios/config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

loadConfig().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
}).catch((err) => {
  console.error("Failed to load config.json:", err);
  // Optionally render a fallback error UI here
  document.getElementById('root')!.innerHTML = '<div style="color: red; padding: 20px;">Failed to initialize application. Missing configuration.</div>';
});
