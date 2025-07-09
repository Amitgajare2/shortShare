import React, { useState } from 'react';
import UploadForm from '../components/UploadForm';
import { IoShareSocialOutline } from "react-icons/io5";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaRegClock, FaShieldAlt  } from "react-icons/fa";
import { BsLightningCharge } from "react-icons/bs";

const Home = () => {
  const [activeTab, setActiveTab] = useState('files');

  return (
    <div>
      <div className="app-header">
        <div className="app-icon"><IoShareSocialOutline /></div>
        <div className="app-title">ShortShare</div>
        <div className="app-desc">
          Share files instantly with automatic cleanup. No registration required. Up to 50MB, expires in 2 hours.
        </div>
        <div className="feature-badges">
          <span className="badge"><MdOutlineFileUpload/>50MB Max</span>
          <span className="badge"><FaRegClock></FaRegClock>2 Hour Limit</span>
          <span className="badge"><FaShieldAlt></FaShieldAlt>Anonymous</span>
          <span className="badge"><BsLightningCharge></BsLightningCharge>Instant Share</span>
        </div>
      </div>
      <div className="center-card">
        <div className="tabs">
          <button className={`tab${activeTab === 'files' ? ' active' : ''}`} onClick={() => setActiveTab('files')}>Files</button>
          <button className={`tab${activeTab === 'text' ? ' active' : ''}`} onClick={() => setActiveTab('text')}>Text &amp; Code</button>
        </div>
        <UploadForm activeTab={activeTab} />
      </div>
    </div>
  );
};

export default Home; 