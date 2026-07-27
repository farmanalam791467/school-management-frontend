import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaBullhorn, FaPlus, FaTrash } from 'react-icons/fa';

const Notices = () => {
  const { user } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  
  // Form State
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', target_audience: 'All' });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data.notices);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notices', noticeForm);
      alert('Notice posted successfully!');
      setNoticeForm({ title: '', content: '', target_audience: 'All' });
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.message || 'Error posting notice');
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/notices/${noticeId}`);
      fetchNotices();
    } catch (err) {
      alert('Error deleting notice');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
      {/* Feed */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaBullhorn style={{ color: 'var(--primary-color)' }} /> Notices & Announcements
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxH: '550px' }}>
          {notices.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No notices posted yet.</p>
          ) : (
            notices.map(notice => (
              <div key={notice.id} style={{
                padding: '1.25rem',
                borderRadius: '0.5rem',
                background: '#f9fafb',
                borderLeft: '4px solid var(--primary-color)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{notice.title}</h4>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    background: '#e0e7ff',
                    color: 'var(--primary-color)'
                  }}>Audience: {notice.target_audience}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{notice.content}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', alignItems: 'center' }}>
                  <span>Posted by: <strong>{notice.author_name}</strong></span>
                  <span>{new Date(notice.created_at).toLocaleString()}</span>
                </div>

                {['super_admin', 'school_admin', 'principal'].includes(user?.role) && (
                  <button 
                    onClick={() => handleDeleteNotice(notice.id)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '1rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form (Admins/Leaders only) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {['super_admin', 'school_admin', 'principal', 'vice_principal'].includes(user?.role) ? (
          <form onSubmit={handleCreateNotice} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}><FaPlus /> Post Announcement</h3>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notice Title *</label>
              <input type="text" className="form-control" placeholder="e.g. Sports Day Schedule" required value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notice Content *</label>
              <textarea className="form-control" rows="5" placeholder="Write bulletin content..." required value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Target Audience</label>
              <select className="form-control" value={noticeForm.target_audience} onChange={(e) => setNoticeForm({ ...noticeForm, target_audience: e.target.value })}>
                <option value="All">All Roles</option>
                <option value="Teachers">Teachers Only</option>
                <option value="Students">Students Only</option>
                <option value="Parents">Parents Only</option>
                <option value="Staff">Non-Teaching Staff</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Post Notice</button>
          </form>
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            Only administrators can post new bulletins.
          </div>
        )}
      </div>
    </div>
  );
};

export default Notices;
