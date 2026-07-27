import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { 
  FaQrcode, FaCheckCircle, FaUserClock, FaCalendarCheck, FaCamera,
  FaChevronLeft, FaChevronRight, FaCheck, FaTimes, FaClock, FaCalendarDay
} from 'react-icons/fa';

const Attendance = () => {
  const { user } = useContext(AuthContext);
  
  // Determine if user is staff (admin, principal, teacher, receptionist)
  const isStaff = ['super_admin', 'school_admin', 'principal', 'vice_principal', 'teacher', 'receptionist'].includes(user?.role);
  const [activeTab, setActiveTab] = useState(isStaff ? 'manual' : 'my-attendance');
  
  // Selection States for Staff Manual Attendance & Monthly Report
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Manual marking state
  const [attendanceList, setAttendanceList] = useState([]);

  // Monthly Class Report
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(30);

  // QR Scanning Simulation
  const [scanHistory, setScanHistory] = useState([]);
  const [mockQrStudentId, setMockQrStudentId] = useState('');

  // Personal/Child Attendance States
  const [personalYear, setPersonalYear] = useState(new Date().getFullYear());
  const [personalMonth, setPersonalMonth] = useState(new Date().getMonth() + 1);
  const [personalStats, setPersonalStats] = useState({ total: 0, presents: 0, absents: 0, lates: 0, halfDays: 0, percentage: 100 });
  const [personalRecords, setPersonalRecords] = useState([]);
  const [personalDaysInMonth, setPersonalDaysInMonth] = useState(30);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [selectedStudentUserId, setSelectedStudentUserId] = useState('');

  // Fetch classes only if the user is staff
  useEffect(() => {
    if (isStaff) {
      fetchClasses();
    }
  }, [user, isStaff]);

  // Fetch children for parent roles
  useEffect(() => {
    if (user?.role === 'parent') {
      const fetchChildren = async () => {
        try {
          const res = await api.get('/dashboard/stats');
          setChildren(res.data.children || []);
          if (res.data.children && res.data.children.length > 0) {
            setSelectedStudentUserId(res.data.children[0].user_id);
          }
        } catch (err) {
          console.error('Error fetching children list:', err);
        }
      };
      fetchChildren();
    }
  }, [user]);

  // Fetch personal/child attendance when month, year, or selected student changes
  useEffect(() => {
    if (activeTab === 'my-attendance') {
      fetchPersonalAttendance();
    }
  }, [personalYear, personalMonth, selectedStudentUserId, activeTab]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = async (cid) => {
    setClassId(cid);
    setSectionId('');
    setAttendanceList([]);
    if (cid) {
      try {
        const res = await api.get(`/classes/sections?classId=${cid}`);
        setSections(res.data.sections);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSections([]);
    }
  };

  const fetchAttendance = async () => {
    if (!classId || !sectionId || !date) return alert('Please select Class, Section, and Date');
    try {
      const res = await api.get(`/attendance?classId=${classId}&sectionId=${sectionId}&date=${date}`);
      setAttendanceList(res.data.attendance);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = (userId, status) => {
    setAttendanceList(
      attendanceList.map(item => item.user_id === userId ? { ...item, status } : item)
    );
  };

  const handleRemarksChange = (userId, remarks) => {
    setAttendanceList(
      attendanceList.map(item => item.user_id === userId ? { ...item, remarks } : item)
    );
  };

  const handleSaveAttendance = async () => {
    try {
      await api.post('/attendance', {
        date,
        attendanceList: attendanceList.map(item => ({
          user_id: item.user_id,
          status: item.status,
          remarks: item.remarks
        }))
      });
      alert('Attendance saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving attendance');
    }
  };

  const fetchMonthlyReport = async () => {
    if (!classId || !sectionId) return alert('Please select Class and Section');
    try {
      const res = await api.get(`/attendance/monthly-report?classId=${classId}&sectionId=${sectionId}&year=${reportYear}&month=${reportMonth}`);
      setMonthlyReport(res.data.report);
      setDaysInMonth(res.data.daysInMonth);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQRScanSimulate = async (e) => {
    e.preventDefault();
    if (!mockQrStudentId) return alert('Please enter a mock Student User ID');
    try {
      const res = await api.post('/attendance/scan-qr', { userId: mockQrStudentId });
      setScanHistory([res.data, ...scanHistory]);
      setMockQrStudentId('');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid QR code scan');
    }
  };

  const fetchPersonalAttendance = async () => {
    setPersonalLoading(true);
    try {
      let url = `/attendance/my-attendance?year=${personalYear}&month=${personalMonth}`;
      if (user?.role === 'parent' && selectedStudentUserId) {
        url += `&studentUserId=${selectedStudentUserId}`;
      } else if (isStaff && selectedStudentUserId) {
        // Staff lookup for student
        url += `&studentUserId=${selectedStudentUserId}`;
      }
      
      const res = await api.get(url);
      setPersonalStats(res.data.stats);
      setPersonalRecords(res.data.records);
      setPersonalDaysInMonth(res.data.daysInMonth);
    } catch (err) {
      console.error('Error fetching personal attendance:', err);
    } finally {
      setPersonalLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (personalMonth === 1) {
      setPersonalMonth(12);
      setPersonalYear(prev => prev - 1);
    } else {
      setPersonalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (personalMonth === 12) {
      setPersonalMonth(1);
      setPersonalYear(prev => prev + 1);
    } else {
      setPersonalMonth(prev => prev + 1);
    }
  };

  // Calendar rendering configurations
  const firstDayOfWeek = new Date(personalYear, personalMonth - 1, 1).getDay(); // 0 is Sunday
  const daysArray = Array.from({ length: personalDaysInMonth }, (_, i) => i + 1);
  const emptyDaysArray = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = new Date(personalYear, personalMonth - 1, 1).toLocaleString('default', { month: 'long' });

  // Circular progress configuration
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const percentageValue = personalStats?.percentage ?? 100;
  const strokeDashoffset = circumference - (percentageValue / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        
        {/* Personal or Child Attendance */}
        <button 
          onClick={() => setActiveTab('my-attendance')}
          className={`btn ${activeTab === 'my-attendance' ? 'btn-primary' : ''}`}
          style={{ 
            background: activeTab === 'my-attendance' ? 'var(--primary-color)' : 'transparent', 
            color: activeTab === 'my-attendance' ? '#fff' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <FaCalendarDay style={{ marginRight: '0.5rem' }} /> 
          {user?.role === 'parent' ? "Children's Attendance" : "My Attendance"}
        </button>

        {/* Staff Tools */}
        {isStaff && (
          <>
            <button 
              onClick={() => setActiveTab('manual')}
              className={`btn ${activeTab === 'manual' ? 'btn-primary' : ''}`}
              style={{ 
                background: activeTab === 'manual' ? 'var(--primary-color)' : 'transparent', 
                color: activeTab === 'manual' ? '#fff' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FaCalendarCheck style={{ marginRight: '0.5rem' }} /> Mark Attendance
            </button>
            <button 
              onClick={() => setActiveTab('qr')}
              className={`btn ${activeTab === 'qr' ? 'btn-primary' : ''}`}
              style={{ 
                background: activeTab === 'qr' ? 'var(--primary-color)' : 'transparent', 
                color: activeTab === 'qr' ? '#fff' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FaQrcode style={{ marginRight: '0.5rem' }} /> QR Scanner
            </button>
            <button 
              onClick={() => setActiveTab('report')}
              className={`btn ${activeTab === 'report' ? 'btn-primary' : ''}`}
              style={{ 
                background: activeTab === 'report' ? 'var(--primary-color)' : 'transparent', 
                color: activeTab === 'report' ? '#fff' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FaUserClock style={{ marginRight: '0.5rem' }} /> Class Report
            </button>
          </>
        )}

        {/* Digital QR Card for Students */}
        {!isStaff && user?.role === 'student' && (
          <button 
            onClick={() => setActiveTab('myqr')}
            className={`btn ${activeTab === 'myqr' ? 'btn-primary' : ''}`}
            style={{ 
              background: activeTab === 'myqr' ? 'var(--primary-color)' : 'transparent', 
              color: activeTab === 'myqr' ? '#fff' : 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FaQrcode style={{ marginRight: '0.5rem' }} /> Digital QR Card
          </button>
        )}
      </div>

      {/* ==========================================================
          TAB: MY ATTENDANCE / CHILD ATTENDANCE (Dashboard & Calendar)
          ========================================================== */}
      {activeTab === 'my-attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Lookup Selectors for Parent or Staff */}
          {(user?.role === 'parent' || isStaff) && (
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {user?.role === 'parent' ? (
                <>
                  <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Select Child:</label>
                  <select 
                    className="form-control" 
                    value={selectedStudentUserId} 
                    onChange={(e) => setSelectedStudentUserId(e.target.value)}
                    style={{ maxWidth: '300px' }}
                  >
                    {children.map(child => (
                      <option key={child.user_id} value={child.user_id}>
                        {child.name} ({child.class_name} - {child.section_name})
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Look Up Student by ID (Optional):</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Enter Student User ID (Leave blank for personal view)"
                    value={selectedStudentUserId}
                    onChange={(e) => setSelectedStudentUserId(e.target.value)}
                    style={{ maxWidth: '300px' }}
                  />
                  {selectedStudentUserId && (
                    <button className="btn" onClick={() => setSelectedStudentUserId('')} style={{ background: '#f3f4f6', color: '#1f2937' }}>
                      Clear Filter
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Premium Overview Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            
            {/* Circular Progress Ring Card */}
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
              <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="35" stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="45" 
                    cy="45" 
                    r="35" 
                    stroke={percentageValue >= 85 ? "#10b981" : percentageValue >= 75 ? "#f59e0b" : "#ef4444"} 
                    strokeWidth="8" 
                    fill="transparent"
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round"
                    transform="rotate(-90 45 45)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} 
                  />
                </svg>
                <span style={{ position: 'absolute', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {percentageValue}%
                </span>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Rate</h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {percentageValue >= 85 ? "Excellent" : percentageValue >= 75 ? "Satisfactory" : "Low Attendance"}
                </p>
              </div>
            </div>

            {/* Presents Stats Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #10b981', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Present Days</span>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d1fae5', color: '#10b981', width: '28px', height: '28px', borderRadius: '50%' }}><FaCheck size={12} /></span>
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{personalStats.presents}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Out of {personalStats.total} total sessions</span>
            </div>

            {/* Absents Stats Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #ef4444', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Absent Days</span>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#ef4444', width: '28px', height: '28px', borderRadius: '50%' }}><FaTimes size={12} /></span>
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{personalStats.absents}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Excuses must be submitted</span>
            </div>

            {/* Late & Half Day Stats Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #f59e0b', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Lates / Half Days</span>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7', color: '#f59e0b', width: '28px', height: '28px', borderRadius: '50%' }}><FaClock size={12} /></span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{personalStats.lates} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Late</span></span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{personalStats.halfDays} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Half</span></span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Counted in total score</span>
            </div>
          </div>

          {/* Calendar and Logs Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'flex-start' }}>
            
            {/* Interactive Grid Calendar */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Calendar Controller */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {monthName} {personalYear}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn" onClick={handlePrevMonth} style={{ padding: '0.5rem', minWidth: 'auto', background: '#f3f4f6', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                    <FaChevronLeft />
                  </button>
                  <button className="btn" onClick={handleNextMonth} style={{ padding: '0.5rem', minWidth: 'auto', background: '#f3f4f6', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                    <FaChevronRight />
                  </button>
                </div>
              </div>

              {personalLoading ? (
                <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  Loading Calendar...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  
                  {/* Grid Headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {weekDays.map(wd => <div key={wd} style={{ padding: '0.25rem 0' }}>{wd}</div>)}
                  </div>

                  {/* Calendar Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                    
                    {/* Padding offset days */}
                    {emptyDaysArray.map(emptyIdx => (
                      <div key={`empty-${emptyIdx}`} style={{ height: '52px', background: '#f9fafb', borderRadius: '0.5rem', opacity: 0.3 }}></div>
                    ))}

                    {/* Calendar Days */}
                    {daysArray.map(day => {
                      // Lookup attendance matching this day
                      const record = personalRecords.find(r => {
                        const datePart = r.date.split('T')[0];
                        const parts = datePart.split('-');
                        return parseInt(parts[2]) === day;
                      });

                      let bg = 'transparent';
                      let border = '1px solid var(--border-color)';
                      let color = 'var(--text-primary)';
                      let indicatorColor = 'transparent';

                      if (record) {
                        if (record.status === 'Present') {
                          bg = '#e6f7ed';
                          border = '1px solid #10b981';
                          color = '#065f46';
                          indicatorColor = '#10b981';
                        } else if (record.status === 'Absent') {
                          bg = '#fdf2f2';
                          border = '1px solid #ef4444';
                          color = '#991b1b';
                          indicatorColor = '#ef4444';
                        } else if (record.status === 'Late') {
                          bg = '#fffbeb';
                          border = '1px solid #f59e0b';
                          color = '#92400e';
                          indicatorColor = '#f59e0b';
                        } else if (record.status === 'Half Day') {
                          bg = '#eff6ff';
                          border = '1px solid #3b82f6';
                          color = '#1e40af';
                          indicatorColor = '#3b82f6';
                        }
                      }

                      // Check weekends
                      const currentDayOfWeek = new Date(personalYear, personalMonth - 1, day).getDay();
                      const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6;
                      if (!record && isWeekend) {
                        bg = '#f9fafb';
                        color = '#9ca3af';
                      }

                      return (
                        <div 
                          key={`day-${day}`}
                          title={record ? `${record.status}${record.remarks ? `: ${record.remarks}` : ''}` : isWeekend ? 'Weekend' : 'Not marked'}
                          style={{
                            height: '52px',
                            background: bg,
                            border: border,
                            borderRadius: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '0.4rem',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color }}>{day}</span>
                          
                          {record && (
                            <span style={{ 
                              width: '6px', 
                              height: '6px', 
                              background: indicatorColor, 
                              borderRadius: '50%',
                              alignSelf: 'flex-end'
                            }}></span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#065f46' }}><span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span> Present</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#991b1b' }}><span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span> Absent</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#92400e' }}><span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }}></span> Late</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#1e40af' }}><span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></span> Half Day</span>
              </div>
            </div>

            {/* Activity Logs & Remarks */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignSelf: 'stretch' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Activity Remarks Log
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '330px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {personalRecords.filter(r => r.remarks || r.status !== 'Present').length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '3rem' }}>
                    No exceptions or remarks recorded this month. Good job!
                  </p>
                ) : (
                  personalRecords.filter(r => r.remarks || r.status !== 'Present').map((rec, i) => {
                    let badgeColor = '#10b981';
                    let badgeBg = '#d1fae5';
                    if (rec.status === 'Absent') { badgeColor = '#ef4444'; badgeBg = '#fee2e2'; }
                    else if (rec.status === 'Late') { badgeColor = '#f59e0b'; badgeBg = '#fef3c7'; }
                    else if (rec.status === 'Half Day') { badgeColor = '#3b82f6'; badgeBg = '#dbeafe'; }

                    return (
                      <div key={i} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: `3px solid ${badgeColor}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                            {new Date(rec.date).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', background: badgeBg, color: badgeColor, fontWeight: 'bold' }}>
                            {rec.status}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          {rec.remarks || 'No remarks recorded'}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB: MANUAL ATTENDANCE (STAFF ONLY)
          ========================================================== */}
      {activeTab === 'manual' && isStaff && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <select className="form-control" value={classId} onChange={(e) => handleClassChange(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select className="form-control" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
              <option value="">-- Select Section --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />

            <button className="btn btn-primary" onClick={fetchAttendance}>Load Sheet</button>
          </div>

          {attendanceList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.map(student => (
                      <tr key={student.user_id}>
                        <td>{student.roll_number}</td>
                        <td>{student.name}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['Present', 'Absent', 'Late', 'Half Day'].map(status => (
                              <label key={status} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                background: student.status === status ? 'var(--primary-color)' : '#f3f4f6',
                                color: student.status === status ? '#fff' : 'var(--text-secondary)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}>
                                <input
                                  type="radio"
                                  name={`status-${student.user_id}`}
                                  checked={student.status === status}
                                  onChange={() => handleStatusChange(student.user_id, status)}
                                  style={{ display: 'none' }}
                                />
                                {status}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Remarks (e.g. Sick Leave)"
                            value={student.remarks}
                            onChange={(e) => handleRemarksChange(student.user_id, e.target.value)}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="btn btn-primary" onClick={handleSaveAttendance} style={{ alignSelf: 'flex-end' }}>
                Save Attendance
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==========================================================
          TAB: QR CODE ATTENDANCE SCANNER (STAFF ONLY)
          ========================================================== */}
      {activeTab === 'qr' && isStaff && (
        <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
          {/* Scanner Simulation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>QR Terminal Scanner (Gate Access Control)</h3>
            
            <div style={{
              width: '100%',
              maxWidth: '450px',
              height: '280px',
              background: '#000',
              borderRadius: '1rem',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4b5563'
            }}>
              {/* Scan overlays */}
              <div style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                right: '10%',
                bottom: '10%',
                border: '2px dashed #10b981',
                borderRadius: '0.5rem',
                zIndex: 1
              }}></div>
              
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '4px',
                background: 'linear-gradient(to right, transparent, #10b981, transparent)',
                top: 0,
                animation: 'scanLine 2s linear infinite',
                zIndex: 2
              }}></div>

              <FaCamera size={50} style={{ color: '#1f2937', marginBottom: '1rem' }} />
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>SCANNER READY</span>

              <style>{`
                @keyframes scanLine {
                  0% { top: 10%; }
                  50% { top: 90%; }
                  100% { top: 10%; }
                }
              `}</style>
            </div>

            {/* Simulated QR Submission Form */}
            <form onSubmit={handleQRScanSimulate} style={{ display: 'flex', gap: '1rem', maxWidth: '450px' }}>
              <input
                type="number"
                className="form-control"
                placeholder="Enter Student User ID to simulate QR scan"
                value={mockQrStudentId}
                onChange={(e) => setMockQrStudentId(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Simulate Scan</button>
            </form>
          </div>

          {/* Real-time Scan History Feed */}
          <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaCheckCircle style={{ color: 'var(--secondary-color)' }} /> Scan Activity Logs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {scanHistory.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center', marginTop: '2rem' }}>No recent scans recorded.</p>
              ) : (
                scanHistory.map((log, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    background: '#fff',
                    borderRadius: '0.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    borderLeft: '4px solid #10b981',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      <span>{log.name}</span>
                      <span style={{ color: '#9ca3af' }}>{log.time}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Role: {log.role} | Status: Check-in OK</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB: MY QR CODE (STUDENT ONLY)
          ========================================================== */}
      {activeTab === 'myqr' && !isStaff && user?.role === 'student' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>My Student Digital QR Code</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Present this QR code at the main gate scanner to mark your daily attendance.</p>
          
          <div style={{
            padding: '1.5rem',
            background: '#fff',
            borderRadius: '1rem',
            border: '2px solid var(--primary-color)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '220px',
            height: '220px'
          }}>
            {/* Simulated QR Code matrix */}
            <div style={{
              width: '180px',
              height: '180px',
              background: 'repeating-conic-gradient(from 0deg, #000 0deg 90deg, #fff 90deg 180deg) 0 0/20px 20px',
              border: '4px solid #000',
              position: 'relative'
            }}>
              {/* Corner position markers */}
              <div style={{ position: 'absolute', width: '40px', height: '40px', background: '#000', top: 0, left: 0, border: '4px solid #fff' }}></div>
              <div style={{ position: 'absolute', width: '40px', height: '40px', background: '#000', top: 0, right: 0, border: '4px solid #fff' }}></div>
              <div style={{ position: 'absolute', width: '40px', height: '40px', background: '#000', bottom: 0, left: 0, border: '4px solid #fff' }}></div>
            </div>
          </div>

          <h4 style={{ fontWeight: 'bold' }}>{user?.name}</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>User ID: {user?.id}</span>
        </div>
      )}

      {/* ==========================================================
          TAB: MONTHLY REPORT REGISTER (STAFF ONLY)
          ========================================================== */}
      {activeTab === 'report' && isStaff && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <select className="form-control" value={classId} onChange={(e) => handleClassChange(e.target.value)}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select className="form-control" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
              <option value="">-- Select Section --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select className="form-control" value={reportMonth} onChange={(e) => setReportMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>{new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>

            <select className="form-control" value={reportYear} onChange={(e) => setReportYear(parseInt(e.target.value))}>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>

            <button className="btn btn-primary" onClick={fetchMonthlyReport}>Generate Report</button>
          </div>

          {monthlyReport.length > 0 && (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '150px', position: 'sticky', left: 0, background: '#fff', zIndex: 10 }}>Student Name</th>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <th key={i+1} style={{ textAlign: 'center', padding: '0.25rem', minWidth: '25px' }}>{i+1}</th>
                    ))}
                    <th style={{ padding: '0.25rem', textAlign: 'center' }}>P</th>
                    <th style={{ padding: '0.25rem', textAlign: 'center' }}>A</th>
                    <th style={{ padding: '0.25rem', textAlign: 'center' }}>L</th>
                    <th style={{ padding: '0.25rem', textAlign: 'center' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyReport.map(row => (
                    <tr key={row.student_id}>
                      <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: '#fff', zIndex: 10, borderRight: '1px solid var(--border-color)' }}>{row.name}</td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const status = row.days[i+1];
                        let symbol = '-';
                        let color = '#9ca3af';

                        if (status === 'Present') { symbol = 'P'; color = '#10b981'; }
                        else if (status === 'Absent') { symbol = 'A'; color = '#ef4444'; }
                        else if (status === 'Late') { symbol = 'L'; color = '#f59e0b'; }
                        else if (status === 'Half Day') { symbol = 'H'; color = '#3b82f6'; }

                        return (
                          <td key={i+1} style={{ textAlign: 'center', color, fontWeight: 'bold', padding: '0.25rem' }}>
                            {symbol}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>{row.stats.presents}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>{row.stats.absents}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#f59e0b' }}>{row.stats.lates}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{row.stats.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
