// server/index.js

 
// When the frontend sends a POST request to /api/grok with messages, the server forwards 
// them to Groq’s chat API using a llama-3 AI model. It then sends the AI’s response back to 
// the frontend. If something goes wrong with the API or server, it logs the error and returns
//  it to the client. The server listens on a specified port and prints a message when it’s running.

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;  // ←GROQ_API_KEY
if (!GROQ_API_KEY) {
  console.error('Set GROQ_API_KEY in .env');  // error message
  process.exit(1);
}

app.post('/api/grok', async (req, res) => {
  try {
    const { messages } = req.body;

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {  //  URL
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,  //  variable
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',  //  model
        messages,
        max_tokens: 512,
        temperature: 0.7
      })
    });

    const data = await r.json();
    
    if (!r.ok) {
      console.error('Groq API error:', data);
      return res.status(r.status).json(data);
    }
    
    res.json(data);

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'proxy error', details: err.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server listening on port ${port}`));