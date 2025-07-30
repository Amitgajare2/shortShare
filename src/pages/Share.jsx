import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import CountdownTimer from '../components/CountdownTimer';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import { MdOutlineImage, MdOndemandVideo, MdCode, MdOutlinePeople } from "react-icons/md";
import { BsFiletypeDoc, BsClockHistory } from "react-icons/bs";
import { GrView, GrDownload } from "react-icons/gr";

const Share = () => {
  const { id } = useParams();
  const [share, setShare] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const codeRef = useRef(null);
  const [realtimeViewers, setRealtimeViewers] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchShare = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch share by share_id
        const { data, error: shareError } = await supabase
          .from('shares')
          .select('*')
          .eq('share_id', id)
          .single();
        if (shareError || !data) {
          setError('Share not found or expired.');
          setShare(null);
          setFiles([]);
          setLoading(false);
          return;
        }
        setShare(data);
        if (data.type === 'files') {
          // Fetch file metadata
          const { data: fileData, error: fileError } = await supabase
            .from('share_files')
            .select('*')
            .eq('share_id', data.id);
          if (fileError) throw fileError;
          setFiles(fileData || []);
        } else {
          setFiles([]);
        }
      } catch (err) {
        setError(err.message || 'An error occurred.');
        setShare(null);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShare();
  }, [id]);

  useEffect(() => {
    if (share && share.type === 'code' && codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [share]);

  useEffect(() => {
    if (share && share.id && share.expires_at && Date.parse(share.expires_at) > Date.now()) {
      // Increment view count
      supabase.from('shares').update({ view_count: (share.view_count || 0) + 1 }).eq('id', share.id).then(() => {});
    }
    // eslint-disable-next-line
  }, [share && share.id]);

  useEffect(() => {
    if (!share || !share.share_id) return;
    // Setup Supabase Realtime presence channel
    const channel = supabase.channel(`share-presence-${share.share_id}`, {
      config: { presence: { key: share.share_id } }
    });
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      setRealtimeViewers(count);
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ user: crypto.randomUUID() });
      }
    });
    return () => {
      channel.unsubscribe();
    };
  }, [share && share.share_id]);

  // Download handler
  const handleDownload = async () => {
    if (share && share.id && share.expires_at && Date.parse(share.expires_at) > Date.now()) {
      await supabase.from('shares').update({ download_count: (share.download_count || 0) + 1 }).eq('id', share.id);
    }
  };

  // Copy share link
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Helper to get file type icon
  const getFileTypeIcon = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (["jpg","jpeg","png","gif","bmp","webp","svg"].includes(ext)) return <MdOutlineImage></MdOutlineImage>;
    if (["mp4","mov","avi","mkv","webm","flv","wmv"].includes(ext)) return <MdOndemandVideo></MdOndemandVideo>;
    if (["pdf","doc","docx","xls","xlsx","ppt","pptx","txt","rtf","zip","rar","7z"].includes(ext)) return <BsFiletypeDoc></BsFiletypeDoc>;
    if (["js","jsx","ts","tsx","py","java","c","cpp","cs","html","css","json","sh","php","rb","go","rs","swift"].includes(ext)) return <MdCode></MdCode>;
    return "📦";
  };

  // Helper to get total file size
  const getTotalSize = () => {
    if (!files.length) return 0;
    return files.reduce((sum, f) => sum + f.size, 0);
  };

  if (loading) return <div className="share-loading">Loading...</div>;
  if (error) return <div className="share-error">{error}</div>;
  if (!share) return <div className="share-notfound">Share not found.</div>;

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '10px' }}>
      {/* Summary Card */}
      <div className="summary-card" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(124,58,237,0.07)', padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1.35rem' }}>Shared Content</div>
          <button className="share-btn" style={{ background: '#fff', color: '#7c3aed', border: '1.5px solid #ede9fe', borderRadius: 8, fontWeight: 500, fontSize: '1rem', padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={handleCopy}>
          Share
          </button>
        </div>
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="stat-item"><span className="stat-icon"><GrView /></span> {share.view_count} views</span>
          <span className="stat-item"><span className="stat-icon"><GrDownload /></span> {share.download_count} downloads</span>
          <span className="stat-item"><span className="stat-icon"><MdOutlinePeople /></span> {realtimeViewers} online</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#222', fontWeight: 500, fontSize: '1.08rem' }}>
          <span style={{ fontSize: '1.1em' }}><BsClockHistory></BsClockHistory></span>
          <CountdownTimer expiresAt={share.expires_at} />
        </div>
        {copied && <div style={{ color: '#7c3aed', fontWeight: 500 }}>Link copied!</div>}
      </div>

      {/* Files Card */}
      {share.type === 'files' && files.length > 0 && (
        <div className="files-card" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(124,58,237,0.07)', padding: '1.2rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Files ({files.length})</div>
            <span style={{ background: '#f3e8ff', color: '#7c3aed', borderRadius: 8, padding: '0.2rem 0.8rem', fontSize: '0.97rem', fontWeight: 500 }}>{getTotalSize()} Bytes</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {files.map((file) => (
              <div key={file.id} style={{ background: '#fafaff', borderRadius: 10, display: 'flex', alignItems: 'center', padding: '0.7rem 1rem', boxShadow: '0 1px 4px rgba(124,58,237,0.04)' }}>
                <span style={{ background: '#a78bfa', color: '#fff', borderRadius: 8, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginRight: 16 }}>
                  {getFileTypeIcon(file)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '1.07rem', color: '#222' }}>{file.name}</div>
                  <div style={{ color: '#888', fontSize: '0.97rem' }}>{file.size} Bytes</div>
                </div>
                <a
                  href={
                    supabase.storage.from('share-files').getPublicUrl(file.storage_path).data.publicUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  onClick={handleDownload}
                  style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontWeight: 600, fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 16 }}
                >
                  <span style={{ fontSize: '1.2em' }}><GrDownload></GrDownload></span> Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text/Code Card */}
      {share.type === 'text' && (
        <div className="files-card" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(124,58,237,0.07)', padding: '1.2rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 12 }}>Text</div>
          <div className="share-text">
            <pre className='text-box'>{share.content}</pre>
          </div>
        </div>
      )}
      {share.type === 'code' && (
        <div className="files-card" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(124,58,237,0.07)', padding: '1.2rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 12 }}>Code <span style={{ background: '#f3e8ff', color: '#7c3aed', borderRadius: 8, padding: '0.2rem 0.8rem', fontSize: '0.97rem', fontWeight: 500, marginLeft: 8 }}>{share.language}</span></div>
          <div className="share-code">
            <pre className='text-box'>
              <code
                ref={codeRef}
                className={`language-${share.language || 'plaintext'}`}
              >
                {share.content}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Share; 
