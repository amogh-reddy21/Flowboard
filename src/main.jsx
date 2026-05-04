import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1F2538',
                  color:      '#F0F2FF',
                  border:     '1px solid rgba(255,255,255,0.1)',
                  fontSize:   '12px',
                },
              }}
            />
            <App />
          </DataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
