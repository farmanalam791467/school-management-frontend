import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaUserPlus, FaMoneyBillWave, FaCalendarTimes, FaCheck, FaTimes } from 'react-icons/fa';

const HR = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [leaves, setLeaves] = useState([]);

  // Selection/Filter States
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

  // Form States
  const [employeeForm, setEmployeeForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'accountant',
    employee_id: '', department: '', designation: '', salary: ''
  });
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'Casual Leave', start_date: '', end_date: '', reason: '' });

  useEffect(() => {
    fetchEmployees();
    fetchLeaves();
    fetchPayroll();
  }, [payrollMonth, payrollYear]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/hr/employees');
      setEmployees(res.data.employees);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayroll = async () => {
    try {
      const res = await api.get(`/hr/payroll?month=${payrollMonth}&year=${payrollYear}`);
      setPayroll(res.data.payroll);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/hr/leaves');
      setLeaves(res.data.leaves);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/employees', employeeForm);
      alert('Employee registered successfully!');
      setEmployeeForm({
        name: '', email: '', password: '', phone: '', role: 'accountant',
        employee_id: '', department: '', designation: '', salary: ''
      });
      setActiveTab('employees');
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering employee');
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      await api.post('/hr/payroll/generate', { month: payrollMonth, year: payrollYear });
      alert('Payroll generated successfully!');
      fetchPayroll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating payroll');
    }
  };

  const handlePaySalary = async (payrollId) => {
    try {
      await api.post('/hr/payroll/pay', { payroll_id: payrollId });
      alert('Salary payment processed and ledger expense logged!');
      fetchPayroll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing salary');
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/leaves', leaveForm);
      alert('Leave request submitted successfully!');
      setLeaveForm({ leave_type: 'Casual Leave', start_date: '', end_date: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Error requesting leave');
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.put(`/hr/leaves/${leaveId}`, { status });
      alert(`Leave request ${status.toLowerCase()} successfully!`);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating leave request');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('employees')}
          className={`btn ${activeTab === 'employees' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'employees' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'employees' ? '#fff' : 'var(--text-secondary)' }}
        >
          Employees Directory
        </button>
        <button 
          onClick={() => setActiveTab('payroll')}
          className={`btn ${activeTab === 'payroll' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'payroll' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'payroll' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaMoneyBillWave /> Payroll & Salaries
        </button>
        <button 
          onClick={() => setActiveTab('leaves')}
          className={`btn ${activeTab === 'leaves' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'leaves' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'leaves' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaCalendarTimes /> Leaves Management
        </button>
      </div>

      {/* ==========================================================
          TAB 1: EMPLOYEES DIRECTORY
          ========================================================== */}
      {activeTab === 'employees' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
          {/* List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Staff Directory</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.employee_id}</td>
                      <td>{emp.name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{emp.role.replace('_', ' ')}</td>
                      <td>{emp.department}</td>
                      <td>{emp.designation}</td>
                      <td>₹{parseFloat(emp.salary).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateEmployee} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaUserPlus style={{ color: 'var(--primary-color)' }} /> Add Staff
            </h3>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Full Name *</label>
              <input type="text" className="form-control" required value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Email Address *</label>
              <input type="email" className="form-control" required value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Designated Role *</label>
              <select className="form-control" value={employeeForm.role} onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}>
                <option value="accountant">Accountant</option>
                <option value="librarian">Librarian</option>
                <option value="receptionist">Receptionist</option>
                <option value="hr">HR Specialist</option>
                <option value="transport_manager">Transport Manager</option>
                <option value="hostel_manager">Hostel Warden</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Employee ID *</label>
              <input type="text" className="form-control" required value={employeeForm.employee_id} onChange={(e) => setEmployeeForm({ ...employeeForm, employee_id: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Department *</label>
              <input type="text" className="form-control" placeholder="e.g. Administration" required value={employeeForm.department} onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Designation *</label>
              <input type="text" className="form-control" placeholder="e.g. Accounts Officer" required value={employeeForm.designation} onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Basic Salary (₹) *</label>
              <input type="number" className="form-control" required value={employeeForm.salary} onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })} />
            </div>

            <button type="submit" className="btn btn-primary"><FaPlus /> Register Employee</button>
          </form>
        </div>
      )}

      {/* ==========================================================
          TAB 2: PAYROLL & SALARIES
          ========================================================== */}
      {activeTab === 'payroll' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select className="form-control" value={payrollMonth} onChange={(e) => setPayrollMonth(parseInt(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>{new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select className="form-control" value={payrollYear} onChange={(e) => setPayrollYear(parseInt(e.target.value))}>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
            
            {['super_admin', 'school_admin', 'hr'].includes(user?.role) && (
              <button className="btn btn-primary" onClick={handleGeneratePayroll}>
                Generate Monthly Payroll
              </button>
            )}
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Net Salary</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payroll.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>No payroll records found for this period.</td>
                  </tr>
                ) : (
                  payroll.map(pr => (
                    <tr key={pr.id}>
                      <td>{pr.emp_code}</td>
                      <td>{pr.employee_name}</td>
                      <td>{pr.department}</td>
                      <td>{pr.designation}</td>
                      <td>₹{parseFloat(pr.net_salary).toFixed(2)}</td>
                      <td>{pr.payment_date ? new Date(pr.payment_date).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: pr.status === 'Paid' ? '#d1fae5' : '#fee2e2',
                          color: pr.status === 'Paid' ? '#10b981' : '#ef4444'
                        }}>{pr.status}</span>
                      </td>
                      <td>
                        {pr.status === 'Unpaid' && ['super_admin', 'school_admin', 'accountant'].includes(user?.role) ? (
                          <button className="btn" style={{ padding: '0.4rem 0.8rem', background: '#d1fae5', color: '#10b981', fontSize: '0.8rem' }} onClick={() => handlePaySalary(pr.id)}>
                            Disburse
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>Settled</span>
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
          TAB 3: LEAVES MANAGEMENT
          ========================================================== */}
      {activeTab === 'leaves' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Leave Requests Registry</h3>
            
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    {['super_admin', 'school_admin', 'hr', 'principal'].includes(user?.role) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center' }}>No leave requests filed.</td>
                    </tr>
                  ) : (
                    leaves.map(l => (
                      <tr key={l.id}>
                        <td>{l.employee_name} ({l.employee_role})</td>
                        <td>{l.leave_type}</td>
                        <td>{new Date(l.start_date).toLocaleDateString()}</td>
                        <td>{new Date(l.end_date).toLocaleDateString()}</td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: l.status === 'Approved' ? '#d1fae5' : l.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                            color: l.status === 'Approved' ? '#10b981' : l.status === 'Rejected' ? '#ef4444' : '#d97706'
                          }}>{l.status}</span>
                        </td>
                        {['super_admin', 'school_admin', 'hr', 'principal'].includes(user?.role) && (
                          <td>
                            {l.status === 'Pending' ? (
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button className="btn" style={{ padding: '0.4rem', background: '#d1fae5', color: '#10b981' }} onClick={() => handleLeaveAction(l.id, 'Approved')}>
                                  <FaCheck />
                                </button>
                                <button className="btn" style={{ padding: '0.4rem', background: '#fee2e2', color: '#ef4444' }} onClick={() => handleLeaveAction(l.id, 'Rejected')}>
                                  <FaTimes />
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>Closed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form (Request Leave for employee/teacher) */}
          <form onSubmit={handleLeaveSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>File Leave Application</h3>

            <div className="form-group">
              <label>Leave Type *</label>
              <select className="form-control" value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Earned Leave">Earned Leave</option>
              </select>
            </div>

            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" className="form-control" required value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input type="date" className="form-control" required value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Reason *</label>
              <textarea className="form-control" rows="3" placeholder="State reason..." required value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
            </div>

            <button type="submit" className="btn btn-primary">File Application</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default HR;
