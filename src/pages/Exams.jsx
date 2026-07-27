import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaFileAlt, FaPlus, FaBookOpen, FaAward, FaHourglassHalf, FaPen } from 'react-icons/fa';

const Exams = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('exams');
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Selection States
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  // Form States
  const [examForm, setExamForm] = useState({ name: '', type: 'Offline', class_id: '', start_date: '', end_date: '', total_marks: 100, passing_marks: 40 });
  const [questionForm, setQuestionForm] = useState({ exam_id: '', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', marks: 5, negative_marks: 0 });

  // Student Online Exam taking state
  const [activeExam, setActiveExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [timer, setTimer] = useState(0);

  // Offline Marks Entry State
  const [marksExamId, setMarksExamId] = useState('');
  const [marksStudents, setMarksStudents] = useState([]);
  const [marksInput, setMarksInput] = useState({}); // student_id: marks_obtained

  // Report Card State
  const [reportStudentId, setReportStudentId] = useState('');
  const [reportExamId, setReportExamId] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    fetchExams();
    fetchClasses();
    if (user?.role === 'student') {
      setReportStudentId(user.id); // Default to current student
    }
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.exams);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = async (cid) => {
    setSelectedClass(cid);
    setSelectedSection('');
    setSubjects([]);
    if (cid) {
      try {
        const secRes = await api.get(`/classes/sections?classId=${cid}`);
        setSections(secRes.data.sections);

        const subRes = await api.get(`/classes/mappings?classId=${cid}`);
        // Extract unique subjects
        const mappedSubs = subRes.data.classSubjects.map(m => ({ id: m.id, name: m.subject_name }));
        setSubjects(mappedSubs);

        // Fetch students for marks entry
        const stuRes = await api.get(`/students?classId=${cid}&limit=100`);
        setAllStudents(stuRes.data.students);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exams', examForm);
      alert('Exam scheduled successfully!');
      setExamForm({ name: '', type: 'Offline', class_id: '', start_date: '', end_date: '', total_marks: 100, passing_marks: 40 });
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Error scheduling exam');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exams/questions', {
        exam_id: questionForm.exam_id,
        questions: [questionForm]
      });
      alert('Question added successfully!');
      setQuestionForm({ exam_id: questionForm.exam_id, question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', marks: 5, negative_marks: 0 });
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding question');
    }
  };

  // Start Online Exam Flow
  const startOnlineExam = async (exam) => {
    try {
      const res = await api.get(`/exams/${exam.id}/questions`);
      setExamQuestions(res.data.questions);
      setActiveExam(exam);
      setStudentAnswers({});
      // Mock timer 30 minutes (1800 seconds)
      setTimer(1800);
      setActiveTab('taking-exam');
    } catch (err) {
      alert('Failed to load exam questions');
    }
  };

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (activeTab === 'taking-exam' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && activeTab === 'taking-exam' && activeExam) {
      // Auto submit on timeout
      submitStudentExam();
    }
    return () => clearInterval(interval);
  }, [timer, activeTab]);

  const submitStudentExam = async () => {
    try {
      const res = await api.post('/exams/submit', {
        exam_id: activeExam.id,
        answers: studentAnswers
      });
      alert(`Exam submitted successfully! Score: ${res.data.score}`);
      setActiveExam(null);
      setActiveTab('exams');
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting exam');
    }
  };

  // Load students for offline marks entry
  const loadMarksStudents = async () => {
    if (!selectedClass || !selectedSection || !marksExamId || !selectedSubject) {
      return alert('Please select Class, Section, Subject, and Exam');
    }
    try {
      const res = await api.get(`/students?classId=${selectedClass}&sectionId=${selectedSection}&limit=100`);
      setMarksStudents(res.data.students);
      // Initialize marks inputs
      const initialMarks = {};
      res.data.students.forEach(s => {
        initialMarks[s.student_id] = '';
      });
      setMarksInput(initialMarks);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarksSubmit = async (e) => {
    e.preventDefault();
    const marksData = Object.keys(marksInput).map(studentId => ({
      student_id: parseInt(studentId),
      marks_obtained: parseFloat(marksInput[studentId] || 0)
    }));

    try {
      await api.post('/exams/marks', {
        exam_id: parseInt(marksExamId),
        subject_id: parseInt(selectedSubject),
        marks: marksData
      });
      alert('Marks entered successfully!');
      setMarksStudents([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error entering marks');
    }
  };

  // Fetch Report Card
  const fetchReportCard = async () => {
    if (!reportStudentId || !reportExamId) return alert('Please select Student and Exam');
    try {
      const res = await api.get(`/exams/report-card?studentId=${reportStudentId}&examId=${reportExamId}`);
      setReportCard(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Report card not found for this selection');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Tab Navigation */}
      {activeTab !== 'taking-exam' && (
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => { setActiveTab('exams'); fetchExams(); }}
            className={`btn ${activeTab === 'exams' ? 'btn-primary' : ''}`}
            style={{ background: activeTab === 'exams' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'exams' ? '#fff' : 'var(--text-secondary)' }}
          >
            <FaFileAlt /> Exams Schedule
          </button>
          {['super_admin', 'school_admin', 'principal', 'teacher'].includes(user?.role) && (
            <>
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`btn ${activeTab === 'schedule' ? 'btn-primary' : ''}`}
                style={{ background: activeTab === 'schedule' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'schedule' ? '#fff' : 'var(--text-secondary)' }}
              >
                <FaPlus /> Create Exam
              </button>
              <button 
                onClick={() => setActiveTab('questions')}
                className={`btn ${activeTab === 'questions' ? 'btn-primary' : ''}`}
                style={{ background: activeTab === 'questions' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'questions' ? '#fff' : 'var(--text-secondary)' }}
              >
                <FaBookOpen /> Add Questions
              </button>
              <button 
                onClick={() => setActiveTab('marks')}
                className={`btn ${activeTab === 'marks' ? 'btn-primary' : ''}`}
                style={{ background: activeTab === 'marks' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'marks' ? '#fff' : 'var(--text-secondary)' }}
              >
                <FaPen /> Enter Marks
              </button>
            </>
          )}
          <button 
            onClick={() => { setActiveTab('report-card'); setReportCard(null); }}
            className={`btn ${activeTab === 'report-card' ? 'btn-primary' : ''}`}
            style={{ background: activeTab === 'report-card' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'report-card' ? '#fff' : 'var(--text-secondary)' }}
          >
            <FaAward /> Report Card
          </button>
        </div>
      )}

      {/* ==========================================================
          TAB 1: EXAMS SCHEDULE
          ========================================================== */}
      {activeTab === 'exams' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Exam Boards</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Type</th>
                  <th>Class</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Total Marks</th>
                  <th>Passing Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>No exams scheduled.</td>
                  </tr>
                ) : (
                  exams.map(ex => (
                    <tr key={ex.id}>
                      <td>{ex.name}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: ex.type === 'Online' ? '#d1fae5' : '#e0e7ff',
                          color: ex.type === 'Online' ? '#10b981' : 'var(--primary-color)'
                        }}>{ex.type}</span>
                      </td>
                      <td>{ex.class_name}</td>
                      <td>{new Date(ex.start_date).toLocaleString()}</td>
                      <td>{new Date(ex.end_date).toLocaleString()}</td>
                      <td>{ex.total_marks}</td>
                      <td>{ex.passing_marks}</td>
                      <td>
                        {ex.type === 'Online' && user?.role === 'student' && (
                          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => startOnlineExam(ex)}>
                            Take Exam
                          </button>
                        )}
                        {ex.type === 'Offline' && (
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>Hall Exam</span>
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

      {/* ==========================================================
          TAB 2: CREATE EXAM
          ========================================================== */}
      {activeTab === 'schedule' && (
        <form onSubmit={handleCreateExam} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '550px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Schedule New Examination</h3>

          <div className="form-group">
            <label>Exam Name *</label>
            <input type="text" className="form-control" placeholder="e.g. Mid-Term 2026" required value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Exam Type *</label>
            <select className="form-control" value={examForm.type} onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}>
              <option value="Offline">Offline (Written/Hall)</option>
              <option value="Online">Online (MCQ)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Class *</label>
            <select className="form-control" required value={examForm.class_id} onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}>
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Start Date & Time *</label>
              <input type="datetime-local" className="form-control" required value={examForm.start_date} onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End Date & Time *</label>
              <input type="datetime-local" className="form-control" required value={examForm.end_date} onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Total Marks *</label>
              <input type="number" className="form-control" required value={examForm.total_marks} onChange={(e) => setExamForm({ ...examForm, total_marks: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Passing Marks *</label>
              <input type="number" className="form-control" required value={examForm.passing_marks} onChange={(e) => setExamForm({ ...examForm, passing_marks: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Schedule Exam</button>
        </form>
      )}

      {/* ==========================================================
          TAB 3: ADD QUESTIONS (ONLINE MCQ ONLY)
          ========================================================== */}
      {activeTab === 'questions' && (
        <form onSubmit={handleAddQuestion} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '550px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Add MCQ Question</h3>

          <div className="form-group">
            <label>Select Online Exam *</label>
            <select className="form-control" required value={questionForm.exam_id} onChange={(e) => setQuestionForm({ ...questionForm, exam_id: e.target.value })}>
              <option value="">-- Choose Online Exam --</option>
              {exams.filter(ex => ex.type === 'Online').map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name} ({ex.class_name})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Question Text *</label>
            <textarea className="form-control" rows="3" placeholder="Enter question..." required value={questionForm.question_text} onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Option A *</label>
              <input type="text" className="form-control" required value={questionForm.option_a} onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Option B *</label>
              <input type="text" className="form-control" required value={questionForm.option_b} onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Option C *</label>
              <input type="text" className="form-control" required value={questionForm.option_c} onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Option D *</label>
              <input type="text" className="form-control" required value={questionForm.option_d} onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label>Correct Option *</label>
              <select className="form-control" value={questionForm.correct_option} onChange={(e) => setQuestionForm({ ...questionForm, correct_option: e.target.value })}>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="form-group">
              <label>Positive Marks</label>
              <input type="number" className="form-control" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Negative Marks</label>
              <input type="number" className="form-control" value={questionForm.negative_marks} onChange={(e) => setQuestionForm({ ...questionForm, negative_marks: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Add to Question Bank</button>
        </form>
      )}

      {/* ==========================================================
          TAB 4: ONLINE EXAM TESTING PORTAL (STUDENT TAKING EXAM)
          ========================================================== */}
      {activeTab === 'taking-exam' && activeExam && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header & Floating Timer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '1rem',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 10
          }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{activeExam.name}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Class: {activeExam.class_name}</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#fee2e2',
              color: '#ef4444',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              fontWeight: 'bold'
            }}>
              <FaHourglassHalf />
              <span>Time Remaining: {formatTime(timer)}</span>
            </div>
          </div>

          {/* Question Sheet */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {examQuestions.map((q, idx) => (
              <div key={q.id} style={{ padding: '1.5rem', background: '#f9fafb', borderRadius: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Q{idx + 1}. {q.question_text} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({q.marks} Marks)</span>
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const optKey = `option_${opt.toLowerCase()}`;
                    return (
                      <label key={opt} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: '#fff',
                        border: studentAnswers[q.id] === opt ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}>
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={studentAnswers[q.id] === opt}
                          onChange={() => setStudentAnswers({ ...studentAnswers, [q.id]: opt })}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: studentAnswers[q.id] === opt ? 'var(--primary-color)' : '#fff',
                          color: studentAnswers[q.id] === opt ? '#fff' : 'var(--text-primary)',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>{opt}</span>
                        <span>{q[optKey]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={submitStudentExam} style={{ alignSelf: 'flex-end', marginTop: '1.5rem' }}>
            Submit Examination
          </button>
        </div>
      )}

      {/* ==========================================================
          TAB 5: ENTER OFFLINE MARKS (TEACHER/ADMIN)
          ========================================================== */}
      {activeTab === 'marks' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Enter Examination Marks</h3>

          {/* Selector Board */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <select className="form-control" value={selectedClass} onChange={(e) => handleClassChange(e.target.value)}>
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select className="form-control" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={!selectedClass}>
              <option value="">-- Choose Section --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select className="form-control" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedClass}>
              <option value="">-- Choose Subject --</option>
              {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>

            <select className="form-control" value={marksExamId} onChange={(e) => setMarksExamId(e.target.value)}>
              <option value="">-- Choose Exam --</option>
              {exams.filter(ex => ex.type === 'Offline').map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>

            <button className="btn btn-primary" onClick={loadMarksStudents}>Load Sheet</button>
          </div>

          {/* Marks entry grid */}
          {marksStudents.length > 0 && (
            <form onSubmit={handleMarksSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Marks Obtained (Max 100)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marksStudents.map(s => (
                      <tr key={s.student_id}>
                        <td>{s.roll_number}</td>
                        <td>{s.name}</td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            placeholder="e.g. 78.50"
                            required
                            value={marksInput[s.student_id] || ''}
                            onChange={(e) => setMarksInput({ ...marksInput, [s.student_id]: e.target.value })}
                            style={{ maxWidth: '180px' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>Submit Marks Sheet</button>
            </form>
          )}
        </div>
      )}

      {/* ==========================================================
          TAB 6: REPORT CARD & GPA
          ========================================================== */}
      {activeTab === 'report-card' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Academic Transcript & Report Card</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {user?.role !== 'student' ? (
              <select className="form-control" value={reportStudentId} onChange={(e) => setReportStudentId(e.target.value)}>
                <option value="">-- Select Student --</option>
                {allStudents.map(s => <option key={s.student_id} value={s.student_id}>{s.name} ({s.roll_number})</option>)}
              </select>
            ) : (
              <input type="text" className="form-control" value={user.name} disabled />
            )}

            <select className="form-control" value={reportExamId} onChange={(e) => setReportExamId(e.target.value)}>
              <option value="">-- Choose Exam Term --</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>

            <button className="btn btn-primary" onClick={fetchReportCard}>Generate Report</button>
          </div>

          {reportCard && (
            <div id="report-card-view" style={{
              padding: '2rem',
              border: '2px solid var(--border-color)',
              borderRadius: '1rem',
              background: '#fff',
              marginTop: '1rem'
            }}>
              {/* Report Card Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ color: 'var(--primary-color)', margin: 0, fontSize: '1.5rem' }}>Secondary School of Modern Education</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0', fontSize: '0.85rem' }}>123 Education Blvd, Silicon Valley | Tel: +1 555-0199</p>
                <h3 style={{ marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Report Card</h3>
              </div>

              {/* Student Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <div>
                  <p><strong>Student Name:</strong> {reportCard.student.name}</p>
                  <p><strong>Roll Number:</strong> {reportCard.student.roll_number}</p>
                  <p><strong>Class:</strong> {reportCard.student.class_name} - {reportCard.student.section_name}</p>
                </div>
                <div>
                  <p><strong>Examination:</strong> {reportCard.exam.name}</p>
                  <p><strong>Term Period:</strong> {new Date(reportCard.exam.start_date).toLocaleDateString()} - {new Date(reportCard.exam.end_date).toLocaleDateString()}</p>
                  <p><strong>Guardian Name:</strong> {reportCard.student.father_name || 'N/A'}</p>
                </div>
              </div>

              {/* Grades Table */}
              <table className="custom-table" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Marks Obtained</th>
                    <th>Grade</th>
                    <th>Grade Point</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCard.marks.map((m, idx) => (
                    <tr key={idx}>
                      <td>{m.subject_code}</td>
                      <td>{m.subject_name}</td>
                      <td>{parseFloat(m.marks_obtained).toFixed(2)} / {parseFloat(reportCard.exam.total_marks).toFixed(2)}</td>
                      <td style={{ fontWeight: 'bold' }}>{m.grade}</td>
                      <td>{m.gp.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '2rem',
                padding: '1rem',
                background: '#f3f4f6',
                borderRadius: '0.5rem'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>Calculated GPA:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{reportCard.gpa}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Exams;
