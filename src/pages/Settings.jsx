import { useState } from 'react';
import { FaDatabase, FaLanguage, FaPaintBrush } from 'react-icons/fa';

const Settings = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState('English');
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const toggleTheme = (selectedTheme) => {
    setTheme(selectedTheme);
    localStorage.setItem('theme', selectedTheme);
    if (selectedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const handleBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      alert('Database backup completed successfully! eSkooly_Backup.sql has been downloaded.');
      
      // Simulate file download
      const element = document.createElement("a");
      const file = new Blob(["-- eSkooly Database Backup\n-- Generated on " + new Date().toLocaleString() + "\n\nCREATE DATABASE IF NOT EXISTS eskooly_clone;"], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "eSkooly_Backup.sql";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 2000);
  };

  const handleRestore = (e) => {
    e.preventDefault();
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      alert('Database restored successfully from backup file!');
    }, 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
      
      {/* 1. Theme and Aesthetics */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <FaPaintBrush style={{ color: 'var(--primary-color)' }} /> Theme Settings
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Select Portal Theme</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => toggleTheme('light')} 
              className="btn" 
              style={{ flex: 1, justifyContent: 'center', background: theme === 'light' ? 'var(--primary-color)' : '#f3f4f6', color: theme === 'light' ? '#fff' : 'var(--text-primary)' }}
            >
              Light Mode
            </button>
            <button 
              onClick={() => toggleTheme('dark')} 
              className="btn" 
              style={{ flex: 1, justifyContent: 'center', background: theme === 'dark' ? 'var(--primary-color)' : '#f3f4f6', color: theme === 'dark' ? '#fff' : 'var(--text-primary)' }}
            >
              Dark Mode
            </button>
          </div>
        </div>
      </div>

      {/* 2. Language Settings */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <FaLanguage style={{ color: '#f59e0b' }} /> Language Settings
        </h3>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Select Portal Language</label>
          <select className="form-control" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="English">English (United States)</option>
            <option value="Spanish">Español (Spanish)</option>
            <option value="Arabic">العربية (Arabic)</option>
            <option value="French">Français (French)</option>
          </select>
        </div>
      </div>

      {/* 3. Database Maintenance */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <FaDatabase style={{ color: '#10b981' }} /> Database Maintenance
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleBackup} 
            disabled={backingUp}
            style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
          >
            <FaDatabase /> {backingUp ? 'Backing Up Database...' : 'Backup Database'}
          </button>

          <form onSubmit={handleRestore} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Restore from Backup file</label>
            <input type="file" className="form-control" required style={{ padding: '0.35rem' }} accept=".sql" />
            <button type="submit" className="btn" disabled={restoring} style={{ width: '100%', justifyContent: 'center', background: '#e0e7ff', color: 'var(--primary-color)' }}>
              {restoring ? 'Restoring...' : 'Restore Database'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Settings;
