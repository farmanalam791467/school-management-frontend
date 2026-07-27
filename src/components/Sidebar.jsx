import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  FaTachometerAlt, FaUserGraduate, FaChalkboardTeacher, FaSchool, 
  FaClipboardCheck, FaCalendarAlt, FaBookOpen, FaFileAlt, 
  FaMoneyBillWave, FaBook, FaBus, FaHotel, 
  FaUsers, FaBullhorn, FaComments, FaCalendarDay, 
  FaFileSignature, FaCog, FaSignOutAlt 
} from 'react-icons/fa';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const role = user?.role || 'student';

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: FaTachometerAlt, roles: ['*'] },
    { path: '/students', label: 'Students', icon: FaUserGraduate, roles: ['super_admin', 'school_admin', 'principal', 'vice_principal', 'receptionist'] },
    { path: '/teachers', label: 'Teachers', icon: FaChalkboardTeacher, roles: ['super_admin', 'school_admin', 'principal', 'vice_principal', 'hr'] },
    { path: '/classes', label: 'Classes', icon: FaSchool, roles: ['super_admin', 'school_admin', 'principal', 'vice_principal'] },
    { path: '/attendance', label: 'Attendance', icon: FaClipboardCheck, roles: ['super_admin', 'school_admin', 'principal', 'vice_principal', 'teacher', 'receptionist'] },
    { path: '/timetable', label: 'Timetable', icon: FaCalendarAlt, roles: ['super_admin', 'school_admin', 'principal', 'vice_principal', 'teacher', 'student'] },
    { path: '/homework', label: 'Homework', icon: FaBookOpen, roles: ['super_admin', 'school_admin', 'teacher', 'student', 'parent'] },
    { path: '/exams', label: 'Exams', icon: FaFileAlt, roles: ['super_admin', 'school_admin', 'principal', 'teacher', 'student'] },
    { path: '/fees', label: 'Fees', icon: FaMoneyBillWave, roles: ['super_admin', 'school_admin', 'accountant', 'parent', 'student'] },
    { path: '/accounting', label: 'Accounting', icon: FaFileSignature, roles: ['super_admin', 'school_admin', 'accountant'] },
    { path: '/library', label: 'Library', icon: FaBook, roles: ['super_admin', 'school_admin', 'librarian', 'student', 'teacher'] },
    { path: '/transport', label: 'Transport', icon: FaBus, roles: ['super_admin', 'school_admin', 'transport_manager', 'student'] },
    { path: '/hostel', label: 'Hostel', icon: FaHotel, roles: ['super_admin', 'school_admin', 'hostel_manager', 'student'] },
    { path: '/hr', label: 'HR Module', icon: FaUsers, roles: ['super_admin', 'school_admin', 'hr'] },
    { path: '/notices', label: 'Notice Board', icon: FaBullhorn, roles: ['*'] },
    { path: '/chat', label: 'Messaging', icon: FaComments, roles: ['*'] },
    { path: '/events', label: 'Events', icon: FaCalendarDay, roles: ['*'] },
    { path: '/reports', label: 'Reports', icon: FaFileSignature, roles: ['super_admin', 'school_admin', 'principal', 'accountant', 'hr'] },
    { path: '/settings', label: 'Settings', icon: FaCog, roles: ['super_admin', 'school_admin'] },
  ];

  const filteredMenu = menuItems.filter(
    item => item.roles.includes('*') || item.roles.includes(role)
  );

  return (
    <div className="sidebar" style={{ overflowY: 'auto' }}>
      <div className="brand">
        <FaSchool size={28} style={{ color: '#818cf8' }} />
        <span>Modern Ed</span>
      </div>
      <div style={{ padding: '0 1rem 1rem 1rem', fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', borderBottom: '1px solid #374151', marginBottom: '1rem' }}>
        Role: <span style={{ color: '#818cf8', fontWeight: 'bold', textTransform: 'capitalize' }}>{role.replace('_', ' ')}</span>
      </div>
      <ul className="sidebar-menu">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
        <li style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <button 
            onClick={logout} 
            className="btn btn-danger" 
            style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', background: '#dc2626' }}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
