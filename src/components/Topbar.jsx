import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaUserCircle, FaBell, FaSun, FaMoon, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Topbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <div className="topbar" style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      padding: '1rem 2rem',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: '1rem',
      zIndex: 90
    }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Welcome, {user?.name || 'User'}
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Academic Session: 2026-2027
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleDarkMode} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.2rem' }}
        >
          {darkMode ? <FaSun style={{ color: '#fbbf24' }} /> : <FaMoon />}
        </button>

        {/* Notifications Icon */}
        <div style={{ position: 'relative', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>
          <FaBell />
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'var(--danger-color)',
            color: '#fff',
            borderRadius: '50%',
            width: '15px',
            height: '15px',
            fontSize: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>3</span>
        </div>

        {/* User Profile */}
        <div style={{ position: 'relative' }}>
          <div 
            className="user-profile" 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '2rem',
              background: '#f3f4f6',
              cursor: 'pointer'
            }}
          >
            {user?.avatar ? (
              <img 
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`} 
                alt="Avatar" 
                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <FaUserCircle size={26} style={{ color: 'var(--primary-color)' }} />
            )}
            <div style={{ display: 'none', flexDirection: 'column', alignItems: 'flex-start' }} className="md:flex">
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</span>
            </div>
          </div>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '0.5rem',
              background: '#fff',
              borderRadius: '0.5rem',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.5rem',
              minWidth: '150px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              zIndex: 100
            }}>
              <Link 
                to="/profile" 
                onClick={() => setShowDropdown(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--text-primary)'
                }}
              >
                <FaUser /> Profile
              </Link>
              <button 
                onClick={() => { setShowDropdown(false); logout(); }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--danger-color)',
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
