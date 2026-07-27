import { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { 
  FaFileExcel, FaChartBar, FaUserGraduate, FaMoneyBillWave, 
  FaPrint, FaSearch, FaCalendarAlt, FaFilePdf, FaTable 
} from 'react-icons/fa';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

const Reports = () => {
  const [reportType, setReportType] = useState('ledger'); // 'ledger' or 'students'
  const [timeframe, setTimeframe] = useState('all'); // 'all', 'monthly', 'yearly'
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch report data
  const handleFetchReport = async () => {
    setLoading(true);
    setError('');
    setData([]);
    setCurrentPage(1);

    try {
      let endpoint = `/reports/${reportType}`;
      const params = [];
      if (timeframe === 'monthly') {
        params.push(`month=${month}`);
        params.push(`year=${year}`);
      } else if (timeframe === 'yearly') {
        params.push(`year=${year}`);
      }
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }

      const res = await api.get(endpoint);
      if (res.data && res.data.success) {
        setData(res.data.data);
      } else {
        setError('Failed to load report data.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading report data.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch report on load
  useEffect(() => {
    handleFetchReport();
  }, [reportType]);

  // Export to Excel using existing auth-configured API endpoint
  const handleExportExcel = async () => {
    try {
      let endpoint = `/reports/${reportType}/excel`;
      const params = [];
      if (timeframe === 'monthly') {
        params.push(`month=${month}`);
        params.push(`year=${year}`);
      } else if (timeframe === 'yearly') {
        params.push(`year=${year}`);
      }
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }

      const res = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const filename = `${reportType}_report_${timeframe === 'all' ? 'alltime' : timeframe === 'monthly' ? `${month}_${year}` : year}.xlsx`;
      link.download = filename;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to export Excel report.');
    }
  };

  // Print/PDF function using browser native printing styled with custom media query
  const handlePrint = () => {
    window.print();
  };

  // Filter local search
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    if (reportType === 'ledger') {
      return (
        item.category?.toLowerCase().includes(term) ||
        item.title?.toLowerCase().includes(term) ||
        item.payment_method?.toLowerCase().includes(term) ||
        item.reference_no?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    } else {
      return (
        item.name?.toLowerCase().includes(term) ||
        item.roll_number?.toLowerCase().includes(term) ||
        item.admission_no?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.class_name?.toLowerCase().includes(term) ||
        item.father_name?.toLowerCase().includes(term)
      );
    }
  });

  // Calculate metrics
  const getMetrics = () => {
    if (reportType === 'ledger') {
      let totalTransactions = filteredData.length;
      let income = filteredData
        .filter(item => item.type === 'Credit')
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      let expenses = filteredData
        .filter(item => item.type === 'Debit')
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      let netCash = income - expenses;

      return {
        totalTransactions,
        income,
        expenses,
        netCash
      };
    } else {
      let totalStudents = filteredData.length;
      let maleCount = filteredData.filter(item => item.gender === 'Male').length;
      let femaleCount = filteredData.filter(item => item.gender === 'Female').length;
      
      // Calculate admissions inside the selected range
      let dateFilteredCount = filteredData.length; 

      return {
        totalStudents,
        maleCount,
        femaleCount,
        dateFilteredCount
      };
    }
  };

  const metrics = getMetrics();

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Custom print CSS styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide normal sidebar, topbar, buttons, and filters during printing */
          body * {
            visibility: hidden;
            background: transparent !important;
            box-shadow: none !important;
          }
          .printable-report-area, .printable-report-area * {
            visibility: visible;
          }
          .printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 2rem;
            border-bottom: 2px solid #333;
            padding-bottom: 1rem;
          }
          .print-title {
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            color: #1f2937;
          }
          .print-meta {
            font-size: 12px;
            text-align: center;
            color: #6b7280;
            margin-top: 0.25rem;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 1rem !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px 12px !important;
            text-align: left !important;
            font-size: 9pt !important;
            color: #000 !important;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
          }
          .metrics-summary-print {
            display: flex !important;
            gap: 2rem !important;
            margin-bottom: 1.5rem !important;
            border: 1px solid #cbd5e1 !important;
            padding: 1rem !important;
            border-radius: 0.5rem !important;
          }
          .metric-print-item {
            display: flex;
            flex-direction: column;
          }
          .metric-print-label {
            font-size: 10px;
            color: #6b7280;
          }
          .metric-print-val {
            font-size: 14px;
            font-weight: bold;
          }
        }
      `}} />

      {/* Main Banner */}
      <div className="glass-card no-print">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Interactive Reports & Records Explorer</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Review and audit school records, filter details dynamically by month and year, and export customized PDF layouts, excel sheets, or print receipts.
        </p>
      </div>

      {/* Configuration & Filters Row */}
      <div className="glass-card no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaCalendarAlt style={{ color: 'var(--primary-color)' }} /> Filters & Settings
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Report Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Report Type</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', outline: 'none' }}
            >
              <option value="ledger">Financial Ledger</option>
              <option value="students">Student Directory</option>
            </select>
          </div>

          {/* Timeframe Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Timeframe</label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', outline: 'none' }}
            >
              <option value="all">All Time</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Month Selector (if monthly) */}
          {timeframe === 'monthly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Month</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
                style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', outline: 'none' }}
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Year Selector */}
          {timeframe !== 'all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Year</label>
              <select 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', outline: 'none' }}
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
          <button 
            onClick={handleFetchReport} 
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', minWidth: '120px', justifyContent: 'center' }}
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Main Report Visualizer Area */}
      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#ef4444', borderRadius: '0.375rem', fontWeight: 500 }} className="no-print">
          {error}
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} className="no-print">
          <FaTable size={40} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
          <h4 style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No records found</h4>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.25rem' }}>No data matches the selected timeframe filters.</p>
        </div>
      )}

      {data.length > 0 && (
        <div className="printable-report-area">
          
          {/* Header ONLY visible during print */}
          <div className="print-header" style={{ display: 'none' }}>
            <div className="print-title">Secondary School of Modern Education</div>
            <div className="print-meta">
              Official Report: {reportType === 'ledger' ? 'Accounts General Ledger' : 'Active Student Directory'}
            </div>
            <div className="print-meta">
              Timeframe: {timeframe === 'all' ? 'All Time' : timeframe === 'monthly' ? `${MONTHS.find(m => m.value === month)?.label} ${year}` : `Academic Year ${year}`} 
              &nbsp;|&nbsp; Generated on: {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Metrics summary widgets */}
          {reportType === 'ledger' ? (
            <div>
              {/* Visible on screen */}
              <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-card" style={{ borderLeft: '4px solid var(--primary-color)', padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Transactions</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{metrics.totalTransactions}</h3>
                </div>
                <div className="glass-card" style={{ borderLeft: '4px solid #10b981', padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Income (Credit)</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>₹{metrics.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="glass-card" style={{ borderLeft: '4px solid #ef4444', padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Expense (Debit)</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>₹{metrics.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="glass-card" style={{ borderLeft: `4px solid ${metrics.netCash >= 0 ? '#10b981' : '#ef4444'}`, padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Net Balance</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: metrics.netCash >= 0 ? '#10b981' : '#ef4444', marginTop: '0.25rem' }}>₹{metrics.netCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                </div>
              </div>
              {/* Visible ONLY on PDF/Print page */}
              <div className="metrics-summary-print" style={{ display: 'none' }}>
                <div className="metric-print-item">
                  <span className="metric-print-label">Transactions</span>
                  <span className="metric-print-val">{metrics.totalTransactions}</span>
                </div>
                <div className="metric-print-item">
                  <span className="metric-print-label">Total Credit</span>
                  <span className="metric-print-val">₹{metrics.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="metric-print-item">
                  <span className="metric-print-label">Total Debit</span>
                  <span className="metric-print-val">₹{metrics.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="metric-print-item">
                  <span className="metric-print-label">Net Flow Balance</span>
                  <span className="metric-print-val">₹{metrics.netCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Visible on screen */}
              <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-card" style={{ borderLeft: '4px solid var(--primary-color)', padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Student Base</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{metrics.totalStudents}</h3>
                </div>
                <div className="glass-card" style={{ borderLeft: '4px solid #3b82f6', padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Male Students</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.25rem' }}>{metrics.maleCount}</h3>
                </div>
                <div className="glass-card" style={{ borderLeft: '4px solid #ec4899', padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Female Students</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ec4899', marginTop: '0.25rem' }}>{metrics.femaleCount}</h3>
                </div>
                <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b', padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Record Count</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>{metrics.dateFilteredCount}</h3>
                </div>
              </div>
              {/* Visible ONLY on PDF/Print page */}
              <div className="metrics-summary-print" style={{ display: 'none' }}>
                <div className="metric-print-item">
                  <span className="metric-print-label">Total Student Records</span>
                  <span className="metric-print-val">{metrics.totalStudents}</span>
                </div>
                <div className="metric-print-item">
                  <span className="metric-print-label">Male Students</span>
                  <span className="metric-print-val">{metrics.maleCount}</span>
                </div>
                <div className="metric-print-item">
                  <span className="metric-print-label">Female Students</span>
                  <span className="metric-print-val">{metrics.femaleCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Table Container */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Action controls row on screen */}
            <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', padding: '0.4rem 0.8rem', background: '#fff', width: '300px' }}>
                <FaSearch style={{ color: '#9ca3af' }} />
                <input 
                  type="text" 
                  placeholder="Search report records..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{ border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handleExportExcel} 
                  className="btn" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', background: '#d1fae5', color: '#10b981' }}
                >
                  <FaFileExcel /> Excel
                </button>
                <button 
                  onClick={handlePrint} 
                  className="btn" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', background: '#e0f2fe', color: '#0369a1' }}
                >
                  <FaPrint /> Print / Save PDF
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1.5px solid var(--border-color)' }}>
                    {reportType === 'ledger' ? (
                      <>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Type</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Category</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Title</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Method</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Reference</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }} className="no-print">Description</th>
                      </>
                    ) : (
                      <>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Roll No</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Admission No</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Admission Date</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Name</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Class</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Section</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Gender</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Parent/Guardian</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }} className="no-print">Contact</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr 
                      key={item.id || index} 
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                    >
                      {reportType === 'ledger' ? (
                        <>
                          <td style={{ padding: '0.75rem 1rem' }}>{new Date(item.date).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ 
                              padding: '0.2rem 0.5rem', 
                              borderRadius: '0.25rem', 
                              fontSize: '0.75rem', 
                              fontWeight: 600,
                              background: item.type === 'Credit' ? '#e6f4ea' : '#fce8e6', 
                              color: item.type === 'Credit' ? '#137333' : '#c5221f' 
                            }}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>{item.category}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{item.title}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: item.type === 'Credit' ? '#137333' : '#c5221f' }}>
                            ₹{parseFloat(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>{item.payment_method || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{item.reference_no || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="no-print">
                            {item.description || '-'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{item.roll_number}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{item.admission_no}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{new Date(item.admission_date).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{item.name}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{item.class_name}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{item.section_name}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{item.gender}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{item.father_name || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 1rem' }} className="no-print">
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
                              <span>{item.email}</span>
                              <span style={{ color: 'var(--text-secondary)' }}>{item.phone}</span>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Row */}
            {totalPages > 1 && (
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Showing Page {currentPage} of {totalPages} ({filteredData.length} records total)
                </span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="btn"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#f3f4f6' }}
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className="btn"
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.8rem', 
                        background: currentPage === i + 1 ? 'var(--primary-color)' : '#f3f4f6',
                        color: currentPage === i + 1 ? '#fff' : 'var(--text-primary)'
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="btn"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#f3f4f6' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default Reports;
