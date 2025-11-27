import React, { forwardRef, useImperativeHandle, useRef } from 'react';
/**
 * This code creates a React text editor using a <textarea> and gives the parent useful
 * methods like getText(), setText(), insertTextAtEnd(), and clear() — all controlled through a
 * forwarded ref.
 */
export type EditorHandle = {
  getText: () => string;
  setText: (text: string) => void;
  insertTextAtEnd: (text: string) => void;
  clear: () => void;
};

// ediotr props 
interface EditorProps {
  theme: 'light' | 'dark';
}

const ProseMirrorEditor = forwardRef<EditorHandle, EditorProps>(({ theme }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    getText: () => textareaRef.current?.value || '',
    setText: (text: string) => {
      if (textareaRef.current) {
        textareaRef.current.value = text;
      }
    },
    
    insertTextAtEnd: (text: string) => {
      if (textareaRef.current) {
        const currentVal = textareaRef.current.value;
        const prefix = currentVal && !currentVal.endsWith('\n') ? '\n' : '';
        textareaRef.current.value = currentVal + prefix + text;
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        textareaRef.current.focus();
      }
    },
    clear: () => {
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }
    }
  }));

  return (
    <textarea
      ref={textareaRef}
      placeholder="✨ Start writing your story here... Let AI help you continue when inspiration strikes!"
      className={`editor ${theme}`}
      style={{
        width: '100%',
        height: '100%',
        padding: '24px',
        border: 'none',
        outline: 'none',
        fontSize: '16px',
        lineHeight: '1.8',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        resize: 'none',
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        color: theme === 'dark' ? '#e4e4e7' : '#18181b',
        transition: 'all 0.3s ease'
      }}
    />
  );
});

ProseMirrorEditor.displayName = 'ProseMirrorEditor';
export default ProseMirrorEditor;

