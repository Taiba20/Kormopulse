import React, { useRef, useEffect, useState } from "react";

function TextEditor({
  label,
  id,
  value,
  onChange,
  placeholder,
  isRequired,
  aiButton,
  description,
  handleGenerate,
  generatingDescription,
  error,
}) {
  const editorRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    const content = editorRef.current.innerHTML;
    onChange({ target: { name: id, value: content } });
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const ToolbarButton = ({ onClick, children, title, isActive = false }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full">
      <label htmlFor={id} className="font-medium flex justify-between my-2.5">
        <div className="flex items-center">
          {label}
          {isRequired && <span className="text-gray-500 ml-2">*</span>}
        </div>
        {aiButton && (
          <div className="flex justify-end">
            <span
              className={`bg-primary w-36 py-1 px-1 text-xs text-white text-center rounded cursor-pointer ${
                generatingDescription ? "hover:cursor-wait" : "hover:bg-primary-dark"
              }`}
              onClick={handleGenerate}
            >
              {generatingDescription
                ? "Generating... ⏳"
                : "✨ Generate using AI"}
            </span>
          </div>
        )}
      </label>
      {description && (
        <span className="text-gray-500 text-sm ml-1.5">{description}</span>
      )}
      
      <div className="mt-2 border border-gray-300 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-300">
          <div className="flex items-center gap-1 mr-2">
            <ToolbarButton
              onClick={() => formatText('bold')}
              title="Bold"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a1 1 0 000 2h1v10H5a1 1 0 100 2h3.5a1 1 0 100-2H8V5h2.5a3 3 0 010 6H9.5a1 1 0 100 2h1a5 5 0 000-10H5z"/>
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => formatText('italic')}
              title="Italic"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h1.5l-3 10H4a1 1 0 100 2h6a1 1 0 100-2H8.5l3-10H13a1 1 0 100-2H7z"/>
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => formatText('underline')}
              title="Underline"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 16a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM6 3a1 1 0 011-1h6a1 1 0 110 2h-1v4a3 3 0 01-6 0V4H5a1 1 0 01-1-1z"/>
              </svg>
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <div className="flex items-center gap-1 mr-2">
            <ToolbarButton
              onClick={() => formatText('insertUnorderedList')}
              title="Bullet List"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 100 2h14a1 1 0 100-2H3zM3 8a1 1 0 100 2h14a1 1 0 100-2H3zM3 12a1 1 0 100 2h14a1 1 0 100-2H3z"/>
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => formatText('insertOrderedList')}
              title="Numbered List"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 100 2h14a1 1 0 100-2H3zM3 8a1 1 0 100 2h14a1 1 0 100-2H3zM3 12a1 1 0 100 2h14a1 1 0 100-2H3z"/>
              </svg>
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <div className="flex items-center gap-1 mr-2">
            <ToolbarButton
              onClick={() => formatText('justifyLeft')}
              title="Align Left"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 100 2h10a1 1 0 100-2H3zM3 8a1 1 0 100 2h14a1 1 0 100-2H3zM3 12a1 1 0 100 2h10a1 1 0 100-2H3z"/>
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => formatText('justifyCenter')}
              title="Align Center"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 100 2h10a1 1 0 100-2H5zM3 8a1 1 0 100 2h14a1 1 0 100-2H3zM5 12a1 1 0 100 2h10a1 1 0 100-2H5z"/>
              </svg>
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <ToolbarButton
            onClick={insertLink}
            title="Insert Link"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => formatText('removeFormat')}
            title="Clear Formatting"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
          </ToolbarButton>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          className={`min-h-80 p-4 outline-none focus:ring-0 ${
            !value && !isActive ? 'text-gray-400' : 'text-gray-900'
          }`}
          style={{ minHeight: '320px' }}
          suppressContentEditableWarning={true}
          data-placeholder={placeholder}
        >
        </div>
      </div>

      {/* Custom CSS for placeholder */}
      <style dangerouslySetInnerHTML={{
        __html: `
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `
      }} />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default TextEditor;
