import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { MdOutlineFileUpload, MdOutlineImage, MdOndemandVideo, MdCode } from "react-icons/md";
import { BsFiletypeDoc } from "react-icons/bs";
import { LuLetterText } from "react-icons/lu";


const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const LANGUAGES = [
  'Plain Text', 'JavaScript', 'Python', 'Java', 'C', 'C++', 'C#', 'TypeScript', 'Go', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Rust', 'HTML', 'CSS', 'JSON', 'Shell', 'SQL', 'Other'
];

const UploadForm = ({ activeTab }) => {
  const [files, setFiles] = useState([]);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('Plain Text');
  const [textMode, setTextMode] = useState('text'); // 'text' or 'code'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const fileInputRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_FILE_SIZE) {
      setError('Total file size exceeds 50MB limit.');
      setFiles([]);
    } else {
      setError('');
      setFiles(selectedFiles);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileChange({ target: { files: droppedFiles } });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleChooseFiles = () => {
    fileInputRef.current.click();
  };

  // Text/Code logic
  const handleTextChange = (e) => setText(e.target.value);
  const handleLanguageChange = (e) => setLanguage(e.target.value);
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setShareUrl('');
    if (activeTab === 'files') {
      if (!files.length) { setError('Please select files to share.'); return; }
    } else if (activeTab === 'text') {
      if (!text.trim()) { setError('Please enter some text or code to share.'); return; }
    }
    setLoading(true);
    try {
      let share_id = crypto.randomUUID();
      if (activeTab === 'files') {
        let shareInsertData = { share_id, type: 'files', content: null, language: null };
        const { data: shareData, error: shareError } = await supabase.from('shares').insert([shareInsertData]).select();
        if (shareError) throw shareError;
        const shareRow = shareData && shareData[0];
        for (const file of files) {
          const storagePath = `${share_id}/${file.name}`;
          const { error: uploadError } = await supabase.storage.from('share-files').upload(storagePath, file, { upsert: false });
          if (uploadError) throw uploadError;
          const { error: fileMetaError } = await supabase.from('share_files').insert([
            { share_id: shareRow.id, name: file.name, size: file.size, type: file.type, storage_path: storagePath },
          ]);
          if (fileMetaError) throw fileMetaError;
        }
        setSuccess('Share created!'); setFiles([]); setShareUrl(`${window.location.origin}/share/${share_id}`);
      } else if (activeTab === 'text') {
        const isCode = textMode === 'code';
        const langValue = isCode && language !== 'Plain Text' ? language.toLowerCase() : null;
        const { data, error: insertError } = await supabase.from('shares').insert([
          {
            share_id,
            type: isCode ? 'code' : 'text',
            content: text,
            language: langValue,
          },
        ]).select();
        if (insertError) throw insertError;
        setSuccess('Share created!'); setText(''); setLanguage('Plain Text'); setShareUrl(`${window.location.origin}/share/${share_id}`);
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get file type icon
  const getFileTypeIcon = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) return <MdOutlineImage />;
    if (["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"].includes(ext)) return <MdOndemandVideo />;
    if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "zip", "rar", "7z"].includes(ext)) return <BsFiletypeDoc />;
    if (["js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "cs", "html", "css", "json", "sh", "php", "rb", "go", "rs", "swift"].includes(ext)) return "💻";
    return <MdCode />;
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      {activeTab === 'files' && (
        <>
          <div
            className={`upload-area${dragOver ? ' dragover' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-icon"><MdOutlineFileUpload></MdOutlineFileUpload> </div>
            <div className="upload-instructions">Share your files instantly</div>
            <div className="upload-meta">Drag &amp; drop files or click to browse<br /><br />Maximum file size: 50MB • Auto delete in 2 hours</div>
            <div className="file-type-filters">
              <span className="file-type"><MdOutlineImage></MdOutlineImage> Images</span>
              <span className="file-type"><MdOndemandVideo></MdOndemandVideo> Videos</span>
              <span className="file-type"><BsFiletypeDoc></BsFiletypeDoc> Documents</span>
              <span className="file-type"><MdCode></MdCode> Code</span>
            </div>
            <button type="button" className="choose-btn" onClick={handleChooseFiles}>Choose Files</button>
            <input
              type="file"
              multiple
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          {files.length > 0 && (
            <div className="ready-card">
              <div className="ready-header">Ready to Share ({files.length} file{files.length > 1 ? 's' : ''})</div>
              <ul className="file-list">
                {files.map((file, idx) => (
                  <li className="file-list-item" key={idx}>
                    <span className="file-icon">{getFileTypeIcon(file)}</span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{file.size} bytes</span>
                  </li>
                ))}
              </ul>
              <button className="share-btn" type="submit" disabled={loading}>{loading ? 'Sharing...' : 'Share Files'}</button>
            </div>
          )}
        </>
      )}
      {activeTab === 'text' && (
        <div className="ready-card">
          <div className="ready-header">Share Text or Code</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
            <button type="button" className={`choose-btn${textMode === 'text' ? ' active' : ''}`} style={{ padding: '0.4rem 1.2rem', background: textMode === 'text' ? '#7c3aed' : '#f3e8ff', color: textMode === 'text' ? '#fff' : '#7c3aed', border: 'none' }} onClick={() => setTextMode('text')}><LuLetterText></LuLetterText></button>
            <button type="button" className={`choose-btn${textMode === 'code' ? ' active' : ''}`} style={{ padding: '0.4rem 1.2rem', background: textMode === 'code' ? '#7c3aed' : '#f3e8ff', color: textMode === 'code' ? '#fff' : '#7c3aed', border: 'none' }} onClick={() => setTextMode('code')}><MdCode></MdCode></button>
          </div>
          {textMode === 'code' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>Language</label>
              <select value={language} onChange={handleLanguageChange} style={{ width: '100%', borderRadius: 6, border: '1px solid #ede9fe', padding: '0.7rem', fontSize: '1rem' }}>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          )}
          <textarea
            className="upload-form-textarea"
            placeholder={textMode === 'code' ? 'Paste your code here...' : 'Type or paste your text here...'}
            value={text}
            onChange={handleTextChange}
            rows={7}
            style={{ width: '100%', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #ede9fe', padding: '0.7rem', fontSize: '1rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: '#9c9c9c', fontSize: '0.8rem' }}>
            <span>{charCount} characters &nbsp; {wordCount} words</span>
            {textMode === 'code' && <span style={{ background: '#f3e8ff', color: '#7c3aed', borderRadius: 6, padding: '0.2rem 0.7rem', fontSize: '0.97rem' }}>{language}</span>}
          </div>
          <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>Content will be available for 2 hours</div>
          <button className="share-btn" type="submit" disabled={loading} style={{ width: '180px', float: 'right', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: '1.07rem' }}>{loading ? 'Sharing...' : (textMode === 'code' ? <>Share Code</> : <>Share Text</>)}</button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      {shareUrl && (
        <div className="share-url">
          Share URL: <a href={shareUrl}>{shareUrl}</a>
        </div>
      )}
    </form>
  );
};

export default UploadForm; 
