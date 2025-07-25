import React, { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Welcome to Family Tree Management')

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌳 Family Tree</h1>
        <p>{message}</p>
        <div className="info-box">
          <h3>Project Setup Required</h3>
          <p>This project needs proper backend configuration to work fully.</p>
          <p>Please add the following scripts to package.json:</p>
          <pre>
{`{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview"
  }
}`}
          </pre>
        </div>
      </header>
    </div>
  )
}

export default App