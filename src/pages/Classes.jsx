import { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { FaPlus, FaSchool, FaBook, FaUserTie } from 'react-icons/fa';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [mappings, setMappings] = useState([]);

  // Form States
  const [classForm, setClassForm] = useState({ name: '' });
  const [sectionForm, setSectionForm] = useState({ class_id: '', name: '', room_no: '', capacity: 30 });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', type: 'Theory' });
  const [mappingForm, setMappingForm] = useState({ class_id: '', section_id: '', subject_id: '', teacher_id: '' });

  // Temp sections for mapping form
  const [mappingSections, setMappingSections] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const classRes = await api.get('/classes');
      setClasses(classRes.data.classes);

      const sectionRes = await api.get('/classes/sections');
      setSections(sectionRes.data.sections);

      const subjectRes = await api.get('/classes/subjects');
      setSubjects(subjectRes.data.subjects);

      const teacherRes = await api.get('/teachers?status=active');
      setTeachers(teacherRes.data.teachers);

      const mappingRes = await api.get('/classes/mappings');
      setMappings(mappingRes.data.classSubjects);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', classForm);
      alert('Class created successfully!');
      setClassForm({ name: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating class');
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes/sections', sectionForm);
      alert('Section created successfully!');
      setSectionForm({ class_id: '', name: '', room_no: '', capacity: 30 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating section');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes/subjects', subjectForm);
      alert('Subject created successfully!');
      setSubjectForm({ name: '', code: '', type: 'Theory' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating subject');
    }
  };

  const handleMappingSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes/mappings', mappingForm);
      alert('Subject and Teacher assigned successfully!');
      setMappingForm({ class_id: '', section_id: '', subject_id: '', teacher_id: '' });
      setMappingSections([]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error assigning mapping');
    }
  };

  const handleMappingClassChange = async (classId) => {
    setMappingForm({ ...mappingForm, class_id: classId, section_id: '' });
    if (classId) {
      try {
        const res = await api.get(`/classes/sections?classId=${classId}`);
        setMappingSections(res.data.sections);
      } catch (err) {
        console.error(err);
      }
    } else {
      setMappingSections([]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* 1. Setup Forms Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem'
      }}>
        
        {/* Create Class */}
        <form onSubmit={handleCreateClass} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaSchool style={{ color: 'var(--primary-color)' }} /> Create Class
          </h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Class Name *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Class 6" 
              required 
              value={classForm.name} 
              onChange={(e) => setClassForm({ name: e.target.value })} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}><FaPlus /> Add Class</button>
        </form>

        {/* Create Section */}
        <form onSubmit={handleCreateSection} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaSchool style={{ color: 'var(--secondary-color)' }} /> Create Section
          </h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Class *</label>
            <select 
              className="form-control" 
              required 
              value={sectionForm.class_id} 
              onChange={(e) => setSectionForm({ ...sectionForm, class_id: e.target.value })}
            >
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Section Name *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Section A" 
              required 
              value={sectionForm.name} 
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Room No</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Room 104" 
              value={sectionForm.room_no} 
              onChange={(e) => setSectionForm({ ...sectionForm, room_no: e.target.value })} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}><FaPlus /> Add Section</button>
        </form>

        {/* Create Subject */}
        <form onSubmit={handleCreateSubject} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaBook style={{ color: '#f59e0b' }} /> Create Subject
          </h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Subject Name *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. History" 
              required 
              value={subjectForm.name} 
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Subject Code *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. HIST101" 
              required 
              value={subjectForm.code} 
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Type</label>
            <select 
              className="form-control" 
              value={subjectForm.type} 
              onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
            >
              <option value="Theory">Theory</option>
              <option value="Practical">Practical</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}><FaPlus /> Add Subject</button>
        </form>
      </div>

      {/* 2. Mapping Form (Assign Subject & Teacher) */}
      <form onSubmit={handleMappingSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <FaUserTie style={{ color: 'var(--primary-color)' }} /> Assign Subject and Teacher to Class
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="form-group">
            <label>Class *</label>
            <select 
              className="form-control" 
              required 
              value={mappingForm.class_id} 
              onChange={(e) => handleMappingClassChange(e.target.value)}
            >
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Section *</label>
            <select 
              className="form-control" 
              required 
              value={mappingForm.section_id} 
              onChange={(e) => setMappingForm({ ...mappingForm, section_id: e.target.value })}
              disabled={!mappingForm.class_id}
            >
              <option value="">-- Choose Section --</option>
              {mappingSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Subject *</label>
            <select 
              className="form-control" 
              required 
              value={mappingForm.subject_id} 
              onChange={(e) => setMappingForm({ ...mappingForm, subject_id: e.target.value })}
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Teacher</label>
            <select 
              className="form-control" 
              value={mappingForm.teacher_id} 
              onChange={(e) => setMappingForm({ ...mappingForm, teacher_id: e.target.value })}
            >
              <option value="">-- Choose Teacher (Optional) --</option>
              {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.name} ({t.department})</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Assign Course Mapping</button>
      </form>

      {/* 3. Mappings & Sections Directories */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Course Mappings */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Assigned Classes & Course Directory</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Subject Name</th>
                  <th>Subject Code</th>
                  <th>Assigned Teacher</th>
                </tr>
              </thead>
              <tbody>
                {mappings.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>No courses assigned yet.</td>
                  </tr>
                ) : (
                  mappings.map((m) => (
                    <tr key={m.id}>
                      <td>{m.class_name}</td>
                      <td>{m.section_name}</td>
                      <td>{m.subject_name}</td>
                      <td>{m.subject_code}</td>
                      <td>{m.teacher_name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Sections */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Sections</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Room No</th>
                  <th>Capacity</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>No sections created.</td>
                  </tr>
                ) : (
                  sections.map((s) => (
                    <tr key={s.id}>
                      <td>{s.class_name}</td>
                      <td>{s.name}</td>
                      <td>{s.room_no || 'N/A'}</td>
                      <td>{s.capacity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Classes;
