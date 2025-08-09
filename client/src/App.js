import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [backendMessage, setBackendMessage] = useState('');
  const [dbMessage, setDbMessage] = useState('');

  useEffect(() => {
    // Test backend connection
    fetch('http://localhost:5000/api/test')
      .then(res => res.json())
      .then(data => setBackendMessage(data.message))
      .catch(err => console.error(err));

    // Test database connection
    fetch('http://localhost:5000/api/db-test')
      .then(res => res.json())
      .then(data => setDbMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="App">
      <h1>Full-Stack App</h1>
      <p>Backend: {backendMessage}</p>
      <p>Database: {dbMessage}</p>
    </div>
  );
}

export default App;