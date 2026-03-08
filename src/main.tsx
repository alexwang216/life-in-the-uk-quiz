import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

// WHY pass basename here?
// GitHub Pages serves the app at /life-in-the-uk-quiz/, not at /.
// Without basename, React Router won't match routes correctly on GitHub Pages
// because it sees "/life-in-the-uk-quiz/" as the path instead of "/".
// import.meta.env.BASE_URL is set by Vite's `base` config — it returns
// "/life-in-the-uk-quiz/" in production and "/" in local dev automatically.
createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
