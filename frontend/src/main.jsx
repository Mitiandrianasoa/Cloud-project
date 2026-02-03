import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Si tu as un fichier CSS global, décommente la ligne suivante :
// import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)