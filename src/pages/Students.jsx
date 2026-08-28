import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaUserPlus, FaSearch, FaIdCard, FaGraduationCap, FaTrash, FaEdit, FaEye, FaEnvelope, FaWhatsapp } from 'react-icons/fa';

const Students = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('directory');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]); // Directory filter
  const [admissionSections, setAdmissionSections] = useState([]); // Admission form
  const [promotionSections, setPromotionSections] = useState([]); // Promotion form
  
  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form States
  const [admissionForm, setAdmissionForm] = useState({
    name: '', email: '', password: '', phone: '', gender: 'Male', dob: '', roll_number: '', admission_no: '',
    class_id: '', section_id: '', blood_group: 'O+', medical_history: '',
    father_name: '', father_phone: '', father_occupation: '', mother_name: '', mother_phone: '', mother_occupation: '', address: '',
    avatar: ''
  });

  // Promotion States
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [targetClass, setTargetClass] = useState('');
  const [targetSection, setTargetSection] = useState('');

  // ID Card State
  const [idCardStudent, setIdCardStudent] = useState(null);

  // Modal State
  const [viewStudent, setViewStudent] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, [page, classFilter, sectionFilter]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = async (classId) => {
    setClassFilter(classId);
    setSectionFilter('');
    if (classId) {
      try {
        const res = await api.get(`/classes/sections?classId=${classId}`);
        setSections(res.data.sections);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSections([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/students?page=${page}&search=${search}&classId=${classFilter}&sectionId=${sectionFilter}`);
      setStudents(res.data.students);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdmissionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', admissionForm);
      alert('Student admitted successfully!');
      setActiveTab('directory');
      fetchStudents();
      // Reset form
      setAdmissionForm({
        name: '', email: '', password: '', phone: '', gender: 'Male', dob: '', roll_number: '', admission_no: '',
        class_id: '', section_id: '', blood_group: 'O+', medical_history: '',
        father_name: '', father_phone: '', father_occupation: '', mother_name: '', mother_phone: '', mother_occupation: '', address: '',
        avatar: ''
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Error during admission');
    }
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (selectedStudents.length === 0) return alert('Please select at least one student');
    if (!targetClass || !targetSection) return alert('Please select target class and section');

    try {
      await api.post('/students/promote', {
        studentIds: selectedStudents,
        targetClassId: targetClass,
        targetSectionId: targetSection
      });
      alert('Students promoted successfully!');
      setSelectedStudents([]);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error during promotion');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to set this student as inactive?')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting student');
    }
  };

  const toggleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
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
          Student Directory
        </button>
        <button 
          onClick={() => setActiveTab('admission')}
          className={`btn ${activeTab === 'admission' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'admission' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'admission' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaUserPlus /> Admission Form
        </button>
        <button 
          onClick={() => setActiveTab('promotion')}
          className={`btn ${activeTab === 'promotion' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'promotion' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'promotion' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaGraduationCap /> Bulk Promotion
        </button>
        <button 
          onClick={() => setActiveTab('idcard')}
          className={`btn ${activeTab === 'idcard' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'idcard' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'idcard' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaIdCard /> ID Card Generator
        </button>
      </div>

      {/* ==========================================================
          TAB 1: STUDENT DIRECTORY
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
                placeholder="Search name, roll, email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <select 
              className="form-control" 
              value={classFilter} 
              onChange={(e) => handleClassChange(e.target.value)}
            >
              <option value="">Filter by Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select 
              className="form-control" 
              value={sectionFilter} 
              onChange={(e) => setSectionFilter(e.target.value)}
              disabled={!classFilter}
            >
              <option value="">Filter by Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <button className="btn btn-primary" onClick={fetchStudents}>Search</button>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Guardian</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>No students found.</td>
                  </tr>
                ) : (
                  students.map(s => (
                    <tr key={s.student_id}>
                      <td>{s.roll_number}</td>
                      <td>{s.name}</td>
                      <td>{s.class_name}</td>
                      <td>{s.section_name}</td>
                      <td>{s.email}</td>
                      <td>{s.gender}</td>
                      <td>{s.father_name || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn" style={{ padding: '0.4rem', background: '#e0e7ff', color: 'var(--primary-color)' }} onClick={() => setViewStudent(s)}>
                            <FaEye />
                          </button>
                          <button className="btn" style={{ padding: '0.4rem', background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(s.student_id)}>
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

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
              <button className="btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 2: ADMISSION FORM
          ========================================================== */}
      {activeTab === 'admission' && (
        <form onSubmit={handleAdmissionSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Academic & Personal Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" className="form-control" required value={admissionForm.name} onChange={(e) => setAdmissionForm({...admissionForm, name: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" className="form-control" required value={admissionForm.email} onChange={(e) => setAdmissionForm({...admissionForm, email: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Portal Password</label>
              <input type="password" className="form-control" placeholder="Default: student123" value={admissionForm.password} onChange={(e) => setAdmissionForm({...admissionForm, password: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Roll Number *</label>
              <input type="text" className="form-control" required value={admissionForm.roll_number} onChange={(e) => setAdmissionForm({...admissionForm, roll_number: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Admission Number</label>
              <input type="text" className="form-control" placeholder="Auto-generated if blank" value={admissionForm.admission_no} onChange={(e) => setAdmissionForm({...admissionForm, admission_no: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Class *</label>
              <select className="form-control" required value={admissionForm.class_id} onChange={(e) => {
                setAdmissionForm({...admissionForm, class_id: e.target.value, section_id: ''});
                // Fetch sections for form
                if (e.target.value) {
                  api.get(`/classes/sections?classId=${e.target.value}`).then(res => setAdmissionSections(res.data.sections));
                } else {
                  setAdmissionSections([]);
                }
              }}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Section *</label>
              <select className="form-control" required value={admissionForm.section_id} onChange={(e) => setAdmissionForm({...admissionForm, section_id: e.target.value})}>
                <option value="">Select Section</option>
                {admissionSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <select className="form-control" required value={admissionForm.gender} onChange={(e) => setAdmissionForm({...admissionForm, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date of Birth *</label>
              <input type="date" className="form-control" required value={admissionForm.dob} onChange={(e) => setAdmissionForm({...admissionForm, dob: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Blood Group</label>
              <select className="form-control" value={admissionForm.blood_group} onChange={(e) => setAdmissionForm({...admissionForm, blood_group: e.target.value})}>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="form-group">
              <label>Profile Photo URL</label>
              <input type="text" className="form-control" placeholder="e.g. https://images.unsplash.com/photo-..." value={admissionForm.avatar} onChange={(e) => setAdmissionForm({...admissionForm, avatar: e.target.value})} />
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1rem' }}>Guardian & Contact Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Father's / Guardian Name *</label>
              <input type="text" className="form-control" required value={admissionForm.father_name} onChange={(e) => setAdmissionForm({...admissionForm, father_name: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Father's Phone *</label>
              <input type="text" className="form-control" required value={admissionForm.father_phone} onChange={(e) => setAdmissionForm({...admissionForm, father_phone: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Father's Occupation</label>
              <input type="text" className="form-control" value={admissionForm.father_occupation} onChange={(e) => setAdmissionForm({...admissionForm, father_occupation: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Mother's Name</label>
              <input type="text" className="form-control" value={admissionForm.mother_name} onChange={(e) => setAdmissionForm({...admissionForm, mother_name: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Residential Address *</label>
              <textarea className="form-control" required rows="3" value={admissionForm.address} onChange={(e) => setAdmissionForm({...admissionForm, address: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Admit Student</button>
        </form>
      )}

      {/* ==========================================================
          TAB 3: BULK PROMOTION
          ========================================================== */}
      {activeTab === 'promotion' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Bulk Student Promotion</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select students from the list, choose target class and section, and promote them.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '2rem' }}>
            {/* Student selection list */}
            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Select Students</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {students.map(s => (
                  <label key={s.student_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#fff', borderRadius: '0.25rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(s.student_id)} 
                      onChange={() => toggleSelectStudent(s.student_id)}
                    />
                    <span>{s.name} ({s.roll_number}) - {s.class_name} {s.section_name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Target class settings */}
            <form onSubmit={handlePromoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '1rem' }}>Target Class Details</h4>
              
              <div className="form-group">
                <label>Target Class</label>
                <select className="form-control" required value={targetClass} onChange={(e) => {
                  setTargetClass(e.target.value);
                  setTargetSection('');
                  if (e.target.value) {
                    api.get(`/classes/sections?classId=${e.target.value}`).then(res => setPromotionSections(res.data.sections));
                  } else {
                    setPromotionSections([]);
                  }
                }}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Target Section</label>
                <select className="form-control" required value={targetSection} onChange={(e) => setTargetSection(e.target.value)}>
                  <option value="">Select Section</option>
                  {promotionSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Promote Selected ({selectedStudents.length})
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 4: ID CARD GENERATOR
          ========================================================== */}
      {activeTab === 'idcard' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Student ID Card Generator</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
            <div>
              <label>Select Student</label>
              <select className="form-control" onChange={(e) => {
                const s = students.find(stud => stud.student_id === e.target.value);
                setIdCardStudent(s);
              }}>
                <option value="">-- Choose Student --</option>
                {students.map(s => <option key={s.student_id} value={s.student_id}>{s.name} ({s.roll_number})</option>)}
              </select>

              {idCardStudent && (
                <>
                  <style>{`
                    @media print {
                      body * {
                        visibility: hidden;
                      }
                      #student-id-card, #student-id-card * {
                        visibility: visible;
                      }
                      #student-id-card {
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        border: 2px solid var(--primary-color) !important;
                        box-shadow: none !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                    }
                  `}</style>
                  <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => window.print()}>
                    Print ID Card
                  </button>
                </>
              )}
            </div>

            {/* Printable ID Card Mockup */}
            <div>
              {idCardStudent ? (
                <div id="student-id-card" style={{
                  width: '260px',
                  height: '400px',
                  border: '2px solid var(--primary-color)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'center',
                  position: 'relative',
                  fontFamily: 'sans-serif'
                }}>
                  {/* Header */}
                  <div style={{ borderBottom: '1px solid #e5e7eb', width: '100%', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '0.85rem' }}>Secondary School of Modern Education</h4>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>STUDENT ID CARD</span>
                  </div>

                  {/* Photo */}
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid var(--primary-color)',
                    overflow: 'hidden',
                    marginTop: '0.5rem'
                  }}>
                    {idCardStudent.avatar ? (
                      <img 
                        src={idCardStudent.avatar.startsWith('http') ? idCardStudent.avatar : `https://school-management-backend-fxie.onrender.com${idCardStudent.avatar}`} 
                        alt="Profile" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>PHOTO</span>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ marginTop: '0.5rem', width: '100%' }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>{idCardStudent.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Roll No: <strong>{idCardStudent.roll_number}</strong></p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Class: {idCardStudent.class_name}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Section: {idCardStudent.section_name}</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Blood Group: <span style={{ color: 'red', fontWeight: 'bold' }}>{idCardStudent.blood_group || 'O+'}</span></p>
                  </div>

                  {/* Barcode Mock */}
                  <div style={{ width: '100%', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '120px',
                      height: '25px',
                      background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 6px)',
                      border: '1px solid #000'
                    }}></div>
                    <span style={{ fontSize: '0.6rem', letterSpacing: '2px', marginTop: '2px' }}>{idCardStudent.admission_no}</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  width: '260px',
                  height: '400px',
                  border: '2px dashed #9ca3af',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '0.9rem'
                }}>
                  Select student to preview card
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW STUDENT DETAIL MODAL */}
      {viewStudent && (
        <div className="modal-overlay" style={{ opacity: 1 }}>
          <div className="modal-content" style={{ maxWidth: '600px', transform: 'translateY(0)' }}>
            <div className="modal-header">
              <h3>Student Profile - {viewStudent.name}</h3>
              <button className="close-btn" onClick={() => setViewStudent(null)}>&times;</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <p><strong>Roll Number:</strong> {viewStudent.roll_number}</p>
                <p><strong>Admission No:</strong> {viewStudent.admission_no}</p>
                <p><strong>Class:</strong> {viewStudent.class_name}</p>
                <p><strong>Section:</strong> {viewStudent.section_name}</p>
                <p><strong>Gender:</strong> {viewStudent.gender}</p>
                <p><strong>DOB:</strong> {new Date(viewStudent.dob).toLocaleDateString()}</p>
                <p><strong>Blood Group:</strong> {viewStudent.blood_group || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Father Name:</strong> {viewStudent.father_name || 'N/A'}</p>
                <p><strong>Father Phone:</strong> {viewStudent.father_phone || 'N/A'}</p>
                <p><strong>Email Address:</strong> {viewStudent.email}</p>
                <p><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{viewStudent.user_status}</span></p>
              </div>
            </div>

            {/* Quick Messaging Actions */}
            {['super_admin', 'school_admin'].includes(user?.role) && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                {viewStudent.email && (
                  <a 
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${viewStudent.email}&su=Notice from Secondary School of Modern Education&body=Dear ${viewStudent.name},`}
                    target="_blank" 
                    rel="noreferrer"
                    className="btn"
                    style={{ background: '#fee2e2', color: '#dc2626', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    <FaEnvelope /> Gmail Student
                  </a>
                )}
                {viewStudent.father_phone && (
                  <a 
                    href={`https://api.whatsapp.com/send?phone=${viewStudent.father_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="btn"
                    style={{ background: '#d1fae5', color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    <FaWhatsapp /> WhatsApp Parent
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
