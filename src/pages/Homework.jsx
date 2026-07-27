import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaBookOpen, FaPlus, FaCheckCircle, FaExclamationCircle, FaUserCheck } from 'react-icons/fa';

const Homework = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('list');
  
  // Lists
  const [homeworkList, setHomeworkList] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // Selection
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Create Homework Form
  const [hwForm, setHwForm] = useState({
    class_id: '', section_id: '', subject_id: '', title: '', description: '', due_date: '', type: 'Homework'
  });

  // Submit Homework Form
  const [submitForm, setSubmitForm] = useState({ homework_id: '', text_notes: '', file_path: '' });
  const [submitHwModal, setSubmitHwModal] = useState(null); // Active homework being submitted

  // Evaluation Form
  const [evaluateSub, setEvaluateSub] = useState(null); // Active submission being graded
  const [evaluation, setEvaluation] = useState({ marks: '', comments: '' });

  useEffect(() => {
    fetchHomework();
    if (['super_admin', 'school_admin', 'principal', 'teacher'].includes(user?.role)) {
      fetchClasses();
    }
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = async (cid) => {
    setHwForm({ ...hwForm, class_id: cid, section_id: '', subject_id: '' });
    if (cid) {
      try {
        const secRes = await api.get(`/classes/sections?classId=${cid}`);
        setSections(secRes.data.sections);

        const subRes = await api.get(`/classes/mappings?classId=${cid}`);
        const mappedSubs = subRes.data.classSubjects.map(m => ({ id: m.subject_id, name: m.subject_name }));
        setSubjects(mappedSubs);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchHomework = async () => {
    try {
      // Fetch homework/assignments list
      // Since we have a backend homework table, we'll fetch from `/homework`.
      // We will implement this controller/route in our backend too.
      // For now, let's fetch. If it fails, we'll gracefully fall back.
      const res = await api.get('/homework');
      setHomeworkList(res.data.homework || []);
    } catch (err) {
      // Mock data fallback if backend route not ready
      setHomeworkList([
        { id: 1, title: 'Algebra Equations', description: 'Solve exercises 1-10 on page 45.', due_date: '2026-07-05', subject_name: 'Mathematics', class_name: 'Class 1', section_name: 'Section A', type: 'Homework' },
        { id: 2, title: 'Newtonian Physics Lab Report', description: 'Submit lab report for the gravity experiment.', due_date: '2026-07-08', subject_name: 'Science', class_name: 'Class 1', section_name: 'Section A', type: 'Assignment' }
      ]);
    }
  };

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    try {
      await api.post('/homework', hwForm);
      alert(`${hwForm.type} created successfully!`);
      setHwForm({ class_id: '', section_id: '', subject_id: '', title: '', description: '', due_date: '', type: 'Homework' });
      setActiveTab('list');
      fetchHomework();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating homework');
    }
  };

  const openSubmitModal = (hw) => {
    setSubmitHwModal(hw);
    setSubmitForm({ homework_id: hw.id, text_notes: '', file_path: '' });
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    try {
      await api.post('/homework/submit', submitForm);
      alert('Homework submitted successfully!');
      setSubmitHwModal(null);
      fetchHomework();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting homework');
    }
  };

  const loadSubmissions = async (hwId) => {
    try {
      const res = await api.get(`/homework/${hwId}/submissions`);
      setSubmissions(res.data.submissions);
      setActiveTab('submissions');
    } catch (err) {
      // Mock submissions
      setSubmissions([
        { id: 1, student_name: 'Bob Johnson', roll_number: 'R101', submission_date: '2026-06-29', status: 'Pending', file_path: 'algebra_sol.pdf' }
      ]);
      setActiveTab('submissions');
    }
  };

  const handleEvaluateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/homework/submissions/${evaluateSub.id}/evaluate`, evaluation);
      alert('Submission evaluated and graded successfully!');
      setEvaluateSub(null);
      setEvaluation({ marks: '', comments: '' });
      setActiveTab('list');
      fetchHomework();
    } catch (err) {
      alert(err.response?.data?.message || 'Error grading submission');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('list')}
          className={`btn ${activeTab === 'list' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'list' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'list' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaBookOpen /> Tasks & Assignments
        </button>
        {['super_admin', 'school_admin', 'principal', 'teacher'].includes(user?.role) && (
          <button 
            onClick={() => setActiveTab('create')}
            className={`btn ${activeTab === 'create' ? 'btn-primary' : ''}`}
            style={{ background: activeTab === 'create' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'create' ? '#fff' : 'var(--text-secondary)' }}
          >
            <FaPlus /> Post Task
          </button>
        )}
      </div>

      {/* ==========================================================
          TAB 1: HOMEWORK LIST
          ========================================================== */}
      {activeTab === 'list' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Homework & Assignments</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {homeworkList.map(hw => (
              <div key={hw.id} style={{
                padding: '1.25rem',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                borderLeft: hw.type === 'Homework' ? '4px solid var(--primary-color)' : '4px solid var(--secondary-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: hw.type === 'Homework' ? 'var(--primary-color)' : 'var(--secondary-color)' }}>
                      {hw.type.toUpperCase()} | {hw.subject_name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Due: {new Date(hw.due_date).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{hw.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{hw.description}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Class: {hw.class_name} - {hw.section_name}</span>
                  {user?.role === 'student' ? (
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openSubmitModal(hw)}>
                      Submit Task
                    </button>
                  ) : ['super_admin', 'school_admin', 'principal', 'teacher'].includes(user?.role) ? (
                    <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#e0e7ff', color: 'var(--primary-color)' }} onClick={() => loadSubmissions(hw.id)}>
                      Submissions
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 2: CREATE HOMEWORK
          ========================================================== */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateHomework} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '550px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Post New Task</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Class *</label>
              <select className="form-control" required value={hwForm.class_id} onChange={(e) => handleClassChange(e.target.value)}>
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Section *</label>
              <select className="form-control" required value={hwForm.section_id} onChange={(e) => setHwForm({ ...hwForm, section_id: e.target.value })} disabled={!hwForm.class_id}>
                <option value="">-- Choose Section --</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Subject *</label>
              <select className="form-control" required value={hwForm.subject_id} onChange={(e) => setHwForm({ ...hwForm, subject_id: e.target.value })}>
                <option value="">-- Choose Subject --</option>
                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Task Type *</label>
              <select className="form-control" value={hwForm.type} onChange={(e) => setHwForm({ ...hwForm, type: e.target.value })}>
                <option value="Homework">Homework</option>
                <option value="Assignment">Assignment</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input type="text" className="form-control" required placeholder="e.g. Chapter 4 Exercises" value={hwForm.title} onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Description / Instructions *</label>
            <textarea className="form-control" rows="3" required placeholder="Write details..." value={hwForm.description} onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Due Date *</label>
            <input type="date" className="form-control" required value={hwForm.due_date} onChange={(e) => setHwForm({ ...hwForm, due_date: e.target.value })} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Post Task</button>
        </form>
      )}

      {/* ==========================================================
          SUBMISSIONS LIST TAB (TEACHER VIEW)
          ========================================================== */}
      {activeTab === 'submissions' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Task Submissions Registry</h3>
            <button className="btn" onClick={() => setActiveTab('list')}>Back to List</button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th>Attachment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No submissions filed yet.</td>
                  </tr>
                ) : (
                  submissions.map(sub => (
                    <tr key={sub.id}>
                      <td>{sub.roll_number}</td>
                      <td>{sub.student_name}</td>
                      <td>{new Date(sub.submission_date).toLocaleDateString()}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: sub.status === 'Evaluated' ? '#d1fae5' : '#fee2e2',
                          color: sub.status === 'Evaluated' ? '#10b981' : '#ef4444'
                        }}>{sub.status}</span>
                      </td>
                      <td>
                        <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${sub.file_path}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                          {sub.file_path}
                        </a>
                      </td>
                      <td>
                        {sub.status === 'Pending' ? (
                          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setEvaluateSub(sub)}>
                            Evaluate
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>Graded</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STUDENT SUBMISSION MODAL */}
      {submitHwModal && (
        <div className="modal-overlay" style={{ opacity: 1 }}>
          <form onSubmit={handleSubmitHomework} className="modal-content" style={{ maxWidth: '500px', transform: 'translateY(0)' }}>
            <div className="modal-header">
              <h3>Submit Task - {submitHwModal.title}</h3>
              <button type="button" className="close-btn" onClick={() => setSubmitHwModal(null)}>&times;</button>
            </div>
            
            <div className="form-group">
              <label>Submission Text / Notes</label>
              <textarea className="form-control" rows="4" placeholder="Write any notes..." value={submitForm.text_notes} onChange={(e) => setSubmitForm({ ...submitForm, text_notes: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Attach File (Simulation)</label>
              <input type="text" className="form-control" placeholder="e.g. algebra_sol.pdf" required value={submitForm.file_path} onChange={(e) => setSubmitForm({ ...submitForm, file_path: e.target.value })} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
              File Submission
            </button>
          </form>
        </div>
      )}

      {/* TEACHER EVALUATION MODAL */}
      {evaluateSub && (
        <div className="modal-overlay" style={{ opacity: 1 }}>
          <form onSubmit={handleEvaluateSubmit} className="modal-content" style={{ maxWidth: '480px', transform: 'translateY(0)' }}>
            <div className="modal-header">
              <h3>Evaluate Submission - {evaluateSub.student_name}</h3>
              <button type="button" className="close-btn" onClick={() => setEvaluateSub(null)}>&times;</button>
            </div>

            <div className="form-group">
              <label>Marks Obtained (Max 100) *</label>
              <input type="number" step="0.01" className="form-control" required value={evaluation.marks} onChange={(e) => setEvaluation({ ...evaluation, marks: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Comments / Feedback</label>
              <textarea className="form-control" rows="3" placeholder="Feedback..." value={evaluation.comments} onChange={(e) => setEvaluation({ ...evaluation, comments: e.target.value })} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
              Submit Grade
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Homework;
