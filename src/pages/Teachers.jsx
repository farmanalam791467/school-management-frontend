import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaUserPlus, FaSearch, FaBriefcase, FaGraduationCap, FaTrash, FaEye, FaEnvelope, FaWhatsapp } from 'react-icons/fa';

const Teachers = () => {
  const [activeTab, setActiveTab] = useState('directory');
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Form States
  const [teacherForm, setTeacherForm] = useState({
    name: '', email: '', password: '', phone: '', employee_id: '', designation: '',
    department: '', qualification: '', experience: '', salary: '', hire_date: ''
  });

  // Modal State
  const [viewTeacher, setViewTeacher] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, [statusFilter]);

  const fetchTeachers = async () => {
    try {
      const res = await api.get(`/teachers?search=${search}&status=${statusFilter}`);
      setTeachers(res.data.teachers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teachers', teacherForm);
      alert('Teacher registered successfully!');
      setActiveTab('directory');
      fetchTeachers();
      // Reset form
      setTeacherForm({
        name: '', email: '', password: '', phone: '', employee_id: '', designation: '',
        department: '', qualification: '', experience: '', salary: '', hire_date: ''
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering teacher');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to set this teacher as inactive?')) return;
    try {
      await api.delete(`/teachers/${id}`);
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting teacher');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('directory')}
          className={`btn ${activeTab === 'directory' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'directory' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'directory' ? '#fff' : 'var(--text-secondary)' }}
        >
          Teacher Directory
        </button>
        <button 
          onClick={() => setActiveTab('register')}
          className={`btn ${activeTab === 'register' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'register' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'register' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaUserPlus /> Register Teacher
        </button>
      </div>

      {/* ==========================================================
          TAB 1: TEACHER DIRECTORY
          ========================================================== */}
      {activeTab === 'directory' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search name, ID, email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTeachers()}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <select 
              className="form-control" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="active">Active Teachers</option>
              <option value="inactive">Inactive Teachers</option>
            </select>

            <button className="btn btn-primary" onClick={fetchTeachers}>Search</button>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>No teachers found.</td>
                  </tr>
                ) : (
                  teachers.map(t => (
                    <tr key={t.id}>
                      <td>{t.employee_id}</td>
                      <td>{t.name}</td>
                      <td>{t.department}</td>
                      <td>{t.designation}</td>
                      <td>{t.email}</td>
                      <td>{t.phone || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn" style={{ padding: '0.4rem', background: '#e0e7ff', color: 'var(--primary-color)' }} onClick={() => setViewTeacher(t)}>
                            <FaEye />
                          </button>
                          <button className="btn" style={{ padding: '0.4rem', background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(t.id)}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 2: REGISTER TEACHER
          ========================================================== */}
      {activeTab === 'register' && (
        <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Professional Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" className="form-control" required value={teacherForm.name} onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" className="form-control" required value={teacherForm.email} onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-control" placeholder="Default: teacher123" value={teacherForm.password} onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" className="form-control" value={teacherForm.phone} onChange={(e) => setTeacherForm({...teacherForm, phone: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Employee ID *</label>
              <input type="text" className="form-control" required value={teacherForm.employee_id} onChange={(e) => setTeacherForm({...teacherForm, employee_id: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Department *</label>
              <input type="text" className="form-control" placeholder="e.g. Mathematics" required value={teacherForm.department} onChange={(e) => setTeacherForm({...teacherForm, department: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Designation *</label>
              <input type="text" className="form-control" placeholder="e.g. Senior Lecturer" required value={teacherForm.designation} onChange={(e) => setTeacherForm({...teacherForm, designation: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Qualification *</label>
              <input type="text" className="form-control" placeholder="e.g. M.Sc in Mathematics" required value={teacherForm.qualification} onChange={(e) => setTeacherForm({...teacherForm, qualification: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Experience</label>
              <input type="text" className="form-control" placeholder="e.g. 5 Years" value={teacherForm.experience} onChange={(e) => setTeacherForm({...teacherForm, experience: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Basic Salary *</label>
              <input type="number" className="form-control" required value={teacherForm.salary} onChange={(e) => setTeacherForm({...teacherForm, salary: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Hire Date</label>
              <input type="date" className="form-control" value={teacherForm.hire_date} onChange={(e) => setTeacherForm({...teacherForm, hire_date: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Register Teacher</button>
        </form>
      )}

      {/* VIEW TEACHER DETAIL MODAL */}
      {viewTeacher && (
        <TeacherDetailModal teacher={viewTeacher} onClose={() => setViewTeacher(null)} />
      )}
    </div>
  );
};

// Teacher Details Component with Classes Taught
const TeacherDetailModal = ({ teacher, onClose }) => {
  const { user } = useContext(AuthContext);
  const [classesTaught, setClassesTaught] = useState([]);

  useEffect(() => {
    api.get(`/teachers/${teacher.id}`).then(res => {
      setClassesTaught(res.data.classes);
    }).catch(console.error);
  }, [teacher.id]);

  return (
    <div className="modal-overlay" style={{ opacity: 1 }}>
      <div className="modal-content" style={{ maxWidth: '650px', transform: 'translateY(0)' }}>
        <div className="modal-header">
          <h3>Teacher Profile - {teacher.name}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          <div>
            <p><strong>Employee ID:</strong> {teacher.employee_id}</p>
            <p><strong>Department:</strong> {teacher.department}</p>
            <p><strong>Designation:</strong> {teacher.designation}</p>
            <p><strong>Qualification:</strong> {teacher.qualification}</p>
            <p><strong>Hire Date:</strong> {new Date(teacher.hire_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p><strong>Email:</strong> {teacher.email}</p>
            <p><strong>Phone:</strong> {teacher.phone || 'N/A'}</p>
            <p><strong>Salary:</strong> ₹{parseFloat(teacher.salary).toFixed(2)}</p>
            <p><strong>Experience:</strong> {teacher.experience || 'N/A'}</p>
            <p><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{teacher.user_status}</span></p>
          </div>
        </div>

        <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
          <FaBriefcase /> Classes & Subjects Assigned
        </h4>
        
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {classesTaught.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No classes assigned yet.</p>
          ) : (
            <table className="custom-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {classesTaught.map((c, idx) => (
                  <tr key={idx}>
                    <td>{c.class_name}</td>
                    <td>{c.section_name}</td>
                    <td>{c.subject_name} ({c.subject_code})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Messaging Actions */}
        {['super_admin', 'school_admin'].includes(user?.role) && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            {teacher.email && (
              <a 
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${teacher.email}&su=Message from School Admin&body=Dear ${teacher.name},`}
                target="_blank" 
                rel="noreferrer"
                className="btn"
                style={{ background: '#fee2e2', color: '#dc2626', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <FaEnvelope /> Gmail Teacher
              </a>
            )}
            {teacher.phone && (
              <a 
                href={`https://api.whatsapp.com/send?phone=${teacher.phone.replace(/[^0-9]/g, '')}`}
                target="_blank" 
                rel="noreferrer"
                className="btn"
                style={{ background: '#d1fae5', color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <FaWhatsapp /> WhatsApp Teacher
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teachers;
