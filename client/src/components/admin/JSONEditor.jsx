import React, { useRef, useEffect } from 'react';

const JSONEditor = ({ value, onChange, error }) => {
  const textareaRef = useRef(null);
  
  // Line numbers functionality
  const getLineNumbers = () => {
    const lines = (value || '').split('\n');
    return Array.from({ length: lines.length }, (_, i) => i + 1);
  };
  
  // Handle tab key in the textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const { selectionStart, selectionEnd } = e.target;
      const newValue = 
        value.substring(0, selectionStart) + 
        '  ' + 
        value.substring(selectionEnd);
      
      onChange(newValue);
      
      // Set cursor position after tab
      setTimeout(() => {
        textareaRef.current.selectionStart = selectionStart + 2;
        textareaRef.current.selectionEnd = selectionStart + 2;
      }, 0);
    }
  };
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(240, textareaRef.current.scrollHeight)}px`;
    }
  }, [value]);
  
  return (
    <div className={`relative font-mono text-sm ${error ? 'bg-red-50' : 'bg-white'}`}>
      <div className="flex overflow-auto">
        {/* Line numbers */}
        <div className="p-2 pl-3 pr-2 text-right bg-gray-100 select-none">
          {getLineNumbers().map(num => (
            <div key={num} className="text-gray-500">{num}</div>
          ))}
        </div>
        
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full p-2 resize-none overflow-auto outline-none ${
            error ? 'text-red-800' : 'text-gray-800'
          }`}
          spellCheck="false"
          rows={10}
          style={{ minHeight: '240px' }}
        />
      </div>
    </div>
  );
};

export default JSONEditor;