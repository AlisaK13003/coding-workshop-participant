import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ui'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Hash URLs (/#/admin): the server only ever serves index.html for "/", so refreshes and
        bookmarks work on S3/CloudFront without extra hosting rules. */}
    <HashRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </HashRouter>
  </StrictMode>,
)
