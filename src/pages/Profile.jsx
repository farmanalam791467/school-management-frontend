import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaUserCircle, FaShieldAlt, FaKey, FaUserCheck, FaQrcode } from 'react-icons/fa';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [profileDetails, setProfileDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 2FA Setup States
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [setupQR, setSetupQR] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [showingSetup, setShowingSetup] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfileDetails(res.data.details);
      setIs2FAEnabled(res.data.user.is_two_factor_enabled);
      setName(res.data.user.name);
      setPhone(res.data.user.phone || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', { name, phone });
      alert('Profile updated successfully!');
      setUser({ ...user, name, phone });
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      alert('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error changing password');
    }
  };

  // 2FA Flow
  const handleInitiate2FA = async () => {
    try {
      const res = await api.post('/auth/setup-2fa');
      setSetupQR(res.data.qrCodeUrl);
      setSetupSecret(res.data.secret);
      setShowingSetup(true);
    } catch (err) {
      alert('Error setting up 2FA');
    }
  };

  const handleEnable2FA = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/enable-2fa', { code: verifyCode });
      alert('Two-factor authentication enabled successfully!');
      setIs2FAEnabled(true);
      setShowingSetup(false);
      setVerifyCode('');
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid verification code');
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication?')) return;
    try {
      await api.post('/auth/disable-2fa');
      alert('Two-factor authentication disabled!');
      setIs2FAEnabled(false);
      fetchProfile();
    } catch (err) {
      alert('Error disabling 2FA');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Profile...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
      
      {/* 1. Profile Info & Update */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <FaUserCheck style={{ color: 'var(--primary-color)' }} /> Account Profile
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          <FaUserCircle size={70} style={{ color: 'var(--primary-color)' }} />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{user?.name}</h2>
            <span style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'capitalize' }}>
              Role: {user?.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Name *</label>
            <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Email Address (read-only)</label>
            <input type="email" className="form-control" disabled value={user?.email || ''} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Phone Number</label>
            <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Update Details</button>
        </form>
      </div>

      {/* 2. Security Options (Change Password & 2FA) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <FaKey style={{ color: '#f59e0b' }} /> Change Password
          </h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Current Password *</label>
            <input type="password" className="form-control" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>New Password *</label>
            <input type="password" className="form-control" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Update Password</button>
        </form>

        {/* Two-Factor Authentication */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <FaShieldAlt style={{ color: '#10b981' }} /> Two-Factor Authentication (2FA)
          </h3>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Secure your account with Google Authenticator. Enabling this will require you to enter a 6-digit code from your phone when logging in.
          </p>

          {is2FAEnabled ? (
            <div>
              <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', background: '#d1fae5', color: '#10b981', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                STATUS: ENABLED
              </span>
              <button onClick={handleDisable2FA} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
                Disable 2FA Protection
              </button>
            </div>
          ) : (
            <div>
              <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#ef4444', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                STATUS: DISABLED
              </span>
              {!showingSetup ? (
                <button onClick={handleInitiate2FA} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Set Up 2FA Protection
                </button>
              ) : (
                <form onSubmit={handleEnable2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{
                    padding: '0.5rem',
                    background: '#fff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.25rem'
                  }}>
                    <img src={setupQR} alt="QR Code" style={{ width: '140px', height: '140px' }} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Scan this QR code in Google Authenticator, then enter the 6-digit code below to verify:
                  </p>
                  <div className="form-group" style={{ width: '100%' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="000000" 
                      required 
                      value={verifyCode} 
                      onChange={(e) => setVerifyCode(e.target.value)} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Verify & Enable</button>
                    <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowingSetup(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
