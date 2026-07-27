import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { 
  FaUserGraduate, FaChalkboardTeacher, FaSchool, FaClipboardCheck, 
  FaBullhorn, FaCalendarAlt, FaHistory, FaHandHoldingUsd 
} from 'react-icons/fa';

// Register ChartJS
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [statsData, setStatsData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await api.get('/dashboard/stats');
        setStatsData(statsRes.data);

        const noticesRes = await api.get('/notices');
        setNotices(noticesRes.data.notices.slice(0, 3)); // Top 3

        const eventsRes = await api.get('/events');
        setEvents(eventsRes.data.events.slice(0, 3)); // Top 3
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Dashboard...</div>;
  }

  // --- Chart Configurations ---

  // 1. Finance Chart (Admin/Accountant) - Income vs Expense
  const financeChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Income',
        data: [1200, 1900, 3000, 5000, 4000, 3000, 3500, 4000, 4500, 5000, 6000, statsData?.finance?.income || 0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Expense',
        data: [1000, 1500, 2000, 3500, 3000, 2500, 2800, 3000, 3200, 3500, 4000, statsData?.finance?.expense || 0],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  // 2. Attendance Doughnut Chart (Student)
  const attendanceChartData = {
    labels: ['Present', 'Absent', 'Late', 'Half Day'],
    datasets: [
      {
        data: [85, 5, 7, 3],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
        borderWidth: 1,
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Quick Stats Grid */}
      <div className="dashboard-grid">
        {statsData?.stats?.map((stat, i) => {
          const icons = {
            students: <FaUserGraduate />,
            teachers: <FaChalkboardTeacher />,
            classes: <FaSchool />,
            attendance: <FaClipboardCheck />,
            fees: <FaHandHoldingUsd />,
            expenses: <FaHandHoldingUsd />
          };

          return (
            <div className="glass-card stat-card" key={i}>
              <div className={`stat-icon ${stat.color}`}>
                {icons[stat.icon] || <FaSchool />}
              </div>
              <div className="stat-info">
                <h3>{stat.label}</h3>
                <p>{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Charts and Main Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem'
      }}>
        {/* Left: Chart based on Role */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
            {['super_admin', 'school_admin', 'principal', 'accountant'].includes(user?.role)
              ? 'Financial Analytics (Income vs Expense)'
              : 'My Academic Attendance Analytics'}
          </h3>
          <div style={{ minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {['super_admin', 'school_admin', 'principal', 'accountant'].includes(user?.role) ? (
              <Line data={financeChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div style={{ width: '220px', height: '220px' }}>
                <Doughnut data={attendanceChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Notices / Bulletin Board */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaBullhorn style={{ color: 'var(--primary-color)' }} /> Notice Board
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1 }}>
            {notices.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No recent notices posted.</p>
            ) : (
              notices.map((notice) => (
                <div key={notice.id} style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  background: '#f9fafb',
                  borderLeft: '4px solid var(--primary-color)'
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>{notice.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{notice.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af' }}>
                    <span>By: {notice.author_name}</span>
                    <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Events and Activity Logs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {/* Events Widget */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCalendarAlt style={{ color: 'var(--secondary-color)' }} /> Upcoming Events & Holidays
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {events.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No upcoming events scheduled.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: '#f9fafb'
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{event.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(event.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    background: event.type === 'Holiday' ? '#fee2e2' : '#d1fae5',
                    color: event.type === 'Holiday' ? '#ef4444' : '#10b981'
                  }}>
                    {event.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaHistory style={{ color: '#6366f1' }} /> Recent Activity Log
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>08:15 AM</span>
              <span>Daily student attendance check-in started.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Yesterday</span>
              <span>New fee invoices generated for all active classes.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>2 days ago</span>
              <span>Final Term Offline Exam marks entry opened.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
