import React, { useRef, useState, useEffect } from 'react';
import ProseMirrorEditor from './components/ProseMirrorEditor';
import type { EditorHandle } from './components/ProseMirrorEditor';
import './App.css';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
/**
 * The App component manages the full AI writing interface. 
 * It handles editor state, themes, sidebar, story/history management, and communicates with the AI 
 * backend to continue stories, showing real-time progress and results in a user-friendly interface
 */

interface Story {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

interface HistoryEntry {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

type Theme = 'light' | 'dark' | 'system';

//  call the Grok API to generate text based on messages 
const generateText = async (messages: ChatMessage[]): Promise<string> => {
  try {
    const response = await fetch("http://localhost:3001/api/grok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const data = await response.json();
        errorMessage = data.error?.message || data.error || JSON.stringify(data);
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("No content returned from API");
    return text;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
// Main App Component
export default function App() {
  const editorRef = useRef<EditorHandle>(null);
  const [theme, setTheme] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'stories' | 'history'>('stories');
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [stories, setStories] = useState<Story[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [generatingText, setGeneratingText] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Detect system theme
  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setEffectiveTheme(isDark ? 'dark' : 'light');
      } else {
        setEffectiveTheme(theme);
      }
    };

    updateTheme();
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  // Load/save stories, history, and theme from/to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-stories');
    if (saved) setStories(JSON.parse(saved));
    
    const savedHistory = localStorage.getItem('ai-history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedTheme = localStorage.getItem('ai-theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Save stories, history, and theme to localStorage on changes
  useEffect(() => {
    if (stories.length > 0) {
      localStorage.setItem('ai-stories', JSON.stringify(stories));
    }
  }, [stories]);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('ai-history', JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    localStorage.setItem('ai-theme', theme);
  }, [theme]);

  // Add entry to history
  const addToHistory = (type: 'user' | 'ai', content: string) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      type,
      content: content.slice(0, 200), // Store first 200 chars
      timestamp: Date.now()
    };
    setHistory(prev => [entry, ...prev].slice(0, 50)); // Keep last 50 entries
  };

  // Handle "Continue Writing" button click
  const handleContinue = async () => {
    setStatus('generating');
    setError('');
    setGeneratingText('Initializing AI...');

    try {
      const currentText = editorRef.current?.getText() ?? '';
      if (!currentText.trim()) {
        throw new Error('Please write something first!');
      }

      setGeneratingText('Reading your story...');
      addToHistory('user', currentText);

      await new Promise(resolve => setTimeout(resolve, 500));
      setGeneratingText('AI is thinking...');

      const messages: ChatMessage[] = [
        { role: 'system', content: 'You are a creative writing assistant. Continue the story naturally in the same style and tone.' },
        { role: 'user', content: `Continue this story:\n\n${currentText}` }
      ];

      setGeneratingText('Generating your continuation...');
      const generatedText = await generateText(messages);
      
      setGeneratingText('Adding text to editor...');
      editorRef.current?.insertTextAtEnd(generatedText);
      addToHistory('ai', generatedText);
      
      setStatus('success');
      setGeneratingText('');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
      setGeneratingText('');
    }
  };
 // Handle Clear button with confirmation
  const handleClear = () => {
    if (showClearConfirm) {
      editorRef.current?.clear();
      setShowClearConfirm(false);
      setCurrentStoryId(null);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  const saveStory = () => {
    const content = editorRef.current?.getText() || '';
    if (!content.trim()) return;

    const title = content.split('\n')[0].slice(0, 50) || 'Untitled Story';
    const newStory: Story = {
      id: Date.now().toString(),
      title,
      content,
      timestamp: Date.now()
    };

    if (currentStoryId) {
      setStories(stories.map(s => s.id === currentStoryId ? { ...s, content, title } : s));
    } else {
      setStories([newStory, ...stories]);
      setCurrentStoryId(newStory.id);
    }
  };

  const loadStory = (story: Story) => {
    editorRef.current?.setText(story.content);
    setCurrentStoryId(story.id);
  };

  const newStory = () => {
    editorRef.current?.clear();
    setCurrentStoryId(null);
  };

  const deleteStory = (id: string) => {
    setStories(stories.filter(s => s.id !== id));
    if (currentStoryId === id) newStory();
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ai-history');
  };

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const bg = effectiveTheme === 'dark' ? '#0a0a0a' : '#f9fafb';
  const cardBg = effectiveTheme === 'dark' ? '#18181b' : '#ffffff';
  const border = effectiveTheme === 'dark' ? '#27272a' : '#e5e7eb';
  const text = effectiveTheme === 'dark' ? '#fafafa' : '#09090b';
  const textMuted = effectiveTheme === 'dark' ? '#a1a1aa' : '#71717a';

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: bg }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '320px' : '0',
        backgroundColor: cardBg,
        borderRight: `1px solid ${border}`,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Sidebar Tabs */}
        <div style={{ 
          padding: '16px', 
          borderBottom: `1px solid ${border}`,
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveTab('stories')}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: activeTab === 'stories' ? (effectiveTheme === 'dark' ? '#3b82f6' : '#2563eb') : 'transparent',
              color: activeTab === 'stories' ? 'white' : text,
              border: `1px solid ${activeTab === 'stories' ? 'transparent' : border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            📚 Stories
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: activeTab === 'history' ? (effectiveTheme === 'dark' ? '#3b82f6' : '#2563eb') : 'transparent',
              color: activeTab === 'history' ? 'white' : text,
              border: `1px solid ${activeTab === 'history' ? 'transparent' : border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            🕐 History
          </button>
        </div>
        
        {/* Stories Tab */}
        {activeTab === 'stories' && (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {stories.length === 0 ? (
                <p style={{ color: textMuted, fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                  No stories yet.<br />Start writing!
                </p>
              ) : (
                stories.map(story => (
                  <div
                    key={story.id}
                    onClick={() => loadStory(story)}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: currentStoryId === story.id ? (effectiveTheme === 'dark' ? '#27272a' : '#f4f4f5') : 'transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: `1px solid ${currentStoryId === story.id ? border : 'transparent'}`,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = effectiveTheme === 'dark' ? '#27272a' : '#f4f4f5'}
                    onMouseLeave={e => {
                      if (currentStoryId !== story.id) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500, color: text, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {story.title}
                    </div>
                    <div style={{ fontSize: '12px', color: textMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{new Date(story.timestamp).toLocaleDateString()}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteStory(story.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: textMuted, fontSize: '16px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={newStory}
              style={{
                margin: '12px',
                padding: '12px',
                backgroundColor: effectiveTheme === 'dark' ? '#3b82f6' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              ✨ New Story
            </button>
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {history.length === 0 ? (
                <p style={{ color: textMuted, fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                  No history yet.<br />Start generating!
                </p>
              ) : (
                history.map(entry => (
                  <div
                    key={entry.id}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: effectiveTheme === 'dark' ? '#27272a' : '#f4f4f5',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${entry.type === 'ai' ? '#3b82f6' : '#10b981'}`
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: entry.type === 'ai' ? '#3b82f6' : '#10b981', marginBottom: '6px' }}>
                      {entry.type === 'ai' ? '🤖 AI Generated' : '✍️ You Wrote'}
                    </div>
                    <div style={{ fontSize: '13px', color: text, lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {entry.content}
                    </div>
                    <div style={{ fontSize: '11px', color: textMuted, marginTop: '6px' }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={clearHistory}
              style={{
                margin: '12px',
                padding: '12px',
                backgroundColor: effectiveTheme === 'dark' ? '#ef4444' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              🗑️ Clear History
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${border}`,
          backgroundColor: cardBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: `1px solid ${border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                color: text,
                fontSize: '18px'
              }}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: text }}>
              AI Creative Writer
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleClear}
              style={{
                padding: '10px 16px',
                backgroundColor: showClearConfirm ? '#ef4444' : (effectiveTheme === 'dark' ? '#27272a' : '#f4f4f5'),
                border: `1px solid ${border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                color: showClearConfirm ? 'white' : text,
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {showClearConfirm ? '⚠️ Click again to confirm' : '🧹 Clear'}
            </button>

            <button
              onClick={saveStory}
              style={{
                padding: '10px 16px',
                backgroundColor: effectiveTheme === 'dark' ? '#27272a' : '#f4f4f5',
                border: `1px solid ${border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                color: text,
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              💾 Save
            </button>
            
            <button
              onClick={cycleTheme}
              style={{
                padding: '10px 16px',
                backgroundColor: effectiveTheme === 'dark' ? '#27272a' : '#f4f4f5',
                border: `1px solid ${border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: text,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {theme === 'light' && '☀️ Light'}
              {theme === 'dark' && '🌙 Dark'}
              {theme === 'system' && '💻 System'}
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <ProseMirrorEditor ref={editorRef} theme={effectiveTheme} />
          
          {/* Generating Overlay */}
          {status === 'generating' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: effectiveTheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              zIndex: 10
            }}>
              <div style={{
                backgroundColor: cardBg,
                padding: '24px 32px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 2s infinite' }}>
                  ✨
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: text, marginBottom: '8px' }}>
                  {generatingText}
                </div>
                <div style={{ fontSize: '14px', color: textMuted }}>
                  Please wait...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${border}`,
          backgroundColor: cardBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button
            onClick={handleContinue}
            disabled={status === 'generating'}
            style={{
              padding: '12px 24px',
              backgroundColor: status === 'generating' ? (effectiveTheme === 'dark' ? '#27272a' : '#e5e7eb') : '#10b981',
              color: status === 'generating' ? textMuted : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: status === 'generating' ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {status === 'generating' ? (
              <>⏳ Generating...</>
            ) : (
              <>✨ Continue Writing</>
            )}
          </button>

          {status === 'success' && (
            <span style={{ color: '#10b981', fontWeight: 600, fontSize: '14px' }}>
              ✓ Text added successfully!
            </span>
          )}

          {status === 'error' && (
            <div style={{
              padding: '8px 16px',
              backgroundColor: effectiveTheme === 'dark' ? '#7f1d1d' : '#fee2e2',
              color: effectiveTheme === 'dark' ? '#fca5a5' : '#991b1b',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
} 