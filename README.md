AI Creative Writer ✨
An intelligent writing assistant powered by Groq's LLaMA 3.3 AI model. This application helps writers overcome creative blocks by seamlessly continuing their stories in the same style and tone.

🌟 Features

AI-Powered Continuation: Uses Groq's LLaMA 3.3 70B model to continue your stories naturally
Rich Text Editor: Clean, distraction-free writing environment with a simple textarea interface
Story Management: Save, load, and organize multiple stories with timestamps
Writing History: Track all your user inputs and AI generations with a detailed history view
Theme Support: Choose between light, dark, or system theme modes
Collapsible Sidebar: Access your stories and history without cluttering the writing space
Real-time Status: Visual feedback during AI generation with animated loading states
Local Storage: All your stories and history are saved locally in your browser

Prerequisites

Node.js 18.x or higher
npm or yarn
A Groq API key (get one at console.groq.com)

Installation

1. Clone the repository
git clone https://github.com/yourusername/ai-creative-writer.git
   cd ai-creative-writer
2. Install dependencies
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server
   npm install
   cd ..
3. Set up environment variables
Create a .env file in the server directory:
GROQ_API_KEY=your_groq_api_key_here
   PORT=3001
4. Start the development servers
In one terminal, start the backend server:
cd server
   npm start
In another terminal, start the React frontend:
npm run dev
5. Open the application
Navigate to http://localhost:5173 (or the port shown in your terminal)
🎯 Usage
Writing Your First Story

Click on the editor and start typing your story
When you need inspiration, click the "✨ Continue Writing" button
The AI will analyze your text and generate a natural continuation
The generated text will be automatically added to your editor

Managing Stories

Save: Click the "💾 Save" button to save your current work
New Story: Click "✨ New Story" in the sidebar to start fresh
Load Story: Click on any saved story in the sidebar to load it
Delete Story: Click the 🗑️ icon next to any story to remove it

Viewing History

Switch to the "🕐 History" tab in the sidebar
See all your past inputs and AI generations with timestamps
Click "🗑️ Clear History" to remove all history entries

Clearing the Editor

Click the "🧹 Clear" button once
The button will change to "⚠️ Click again to confirm"
Click again within 3 seconds to clear the editor

🏗️ Project Structure

ai-creative-writer/
├── src/
│   ├── components/
│   │   └── ProseMirrorEditor.tsx    # Text editor component
│   ├── lib/
│   │   ├── api.ts                   # API utility functions
│   │   └── machines/
│   │       └── aiMachine.ts         # XState machine for state management
│   ├── App.tsx                      # Main application component
│   ├── App.css                      # Application styles
│   └── main.tsx                     # Application entry point
├── server/
│   └── index.js                     # Express server with Groq API proxy
├── public/                          # Static assets
└── package.json                     # Project dependencies

🛠️ Tech Stack
Frontend

React 18 - UI library
TypeScript - Type safety
Vite - Build tool and dev server
XState - State machine management (prepared for future use)

Backend

Node.js - Runtime environment
Express - Web server framework
CORS - Cross-origin resource sharing
dotenv - Environment variable management

AI Integration

Groq API - Fast AI inference
LLaMA 3.3 70B Versatile - Language model

⚙️ Configuration
Model Settings
The AI uses these default settings (configurable in App.tsx):

{
  model: 'llama-3.3-70b-versatile',
  max_tokens: 512,
  temperature: 0.7
}

API Endpoint
The backend server proxies requests to Groq's API:

Endpoint: http://localhost:3001/api/grok
Method: POST
Body: { messages: ChatMessage[] }

🔒 Privacy & Data

All stories and history are stored locally in your browser using localStorage
No data is sent to any server except for AI generation requests
Your Groq API key is stored securely in server environment variables

🐛 Troubleshooting
"Set GROQ_API_KEY in .env" Error

Make sure you've created a .env file in the server directory
Verify your API key is correct and has proper permissions

"HTTP error! status: 401"

Your API key may be invalid or expired
Check your Groq console for API key status

Stories Not Saving

Check browser console for localStorage errors
Ensure your browser allows localStorage
Try clearing browser cache and reloading

AI Generation Fails

Check that the backend server is running on port 3001
Verify network connectivity
Check server logs for detailed error messages

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments

Groq for providing fast AI inference
Meta for the LLaMA model
The React and TypeScript communities

📧 Support
If you encounter any issues or have questions:

Open an issue on GitHub
Check the troubleshooting section above
Review Groq's documentation at console.groq.com/docs

