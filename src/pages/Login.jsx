import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSchool, FaLock, FaEnvelope, FaKey, FaShieldAlt } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const { login, verify2FA } = useContext(AuthContext);
  const navigate = useNavigate();

  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA Flow
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Forgot Password Flow
  const [forgotFlow, setForgotFlow] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Handle standard login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.twoFactorRequired) {
        setTwoFactorRequired(true);
        setTempToken(res.tempToken);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA verification
  const handle2FAVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verify2FA(twoFactorCode, tempToken);
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle sending password reset OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email: forgotEmail });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle verifying password reset OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, { email: forgotEmail, otp: otpCode });
      setResetToken(res.data.resetToken);
      setOtpVerified(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { resetToken, newPassword });
      alert('Password reset successful. Please login.');
      // Reset state back to login
      setForgotFlow(false);
      setOtpSent(false);
      setOtpVerified(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'linear-gradient(-45deg, #4f46e5, #3b82f6, #10b981, #4f46e5)',
      backgroundSize: '400% 400%',
      animation: 'gradientBG 15s ease infinite',
      zIndex: 9999
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '1.5rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <FaSchool size={45} style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Secondary School of Modern Education</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>School Management Portal</p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#ef4444',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        {/* 1. TWO-FACTOR AUTHENTICATION SCREEN */}
        {twoFactorRequired && (
          <form onSubmit={handle2FAVerify}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <FaShieldAlt size={30} style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Two-Factor Authentication</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enter the 6-digit code from your authenticator app</p>
            </div>
            <div className="form-group">
              <label>Authenticator Code</label>
              <div style={{ position: 'relative' }}>
                <FaKey style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </button>
          </form>
        )}

        {/* 2. FORGOT PASSWORD FLOW */}
        {!twoFactorRequired && forgotFlow && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Reset Password</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {!otpSent ? 'Enter your email to receive a verification OTP' : !otpVerified ? 'Enter the OTP sent to your email' : 'Set your new password'}
              </p>
            </div>

            {/* Step A: Send OTP */}
            {!otpSent && (
              <form onSubmit={handleSendOTP}>
                <div className="form-group">
                  <label>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <FaEnvelope style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                    <input
                      type="email"
                      className="form-control"
                      placeholder="admin@eskooly.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {/* Step B: Verify OTP */}
            {otpSent && !otpVerified && (
              <form onSubmit={handleVerifyOTP}>
                <div className="form-group">
                  <label>Enter 6-Digit OTP</label>
                  <div style={{ position: 'relative' }}>
                    <FaKey style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}

            {/* Step C: Reset Password */}
            {otpVerified && (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <FaLock style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={() => { setForgotFlow(false); setOtpSent(false); setOtpVerified(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* 3. STANDARD LOGIN SCREEN */}
        {!twoFactorRequired && !forgotFlow && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                <input
                  type="email"
                  className="form-control"
                  placeholder="admin@eskooly.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember Me
              </label>
              <button
                type="button"
                onClick={() => setForgotFlow(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
