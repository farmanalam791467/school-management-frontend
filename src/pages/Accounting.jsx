import { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { FaPlus, FaMoneyBillWave, FaArrowDown, FaArrowUp } from 'react-icons/fa';

const Accounting = () => {
  const [activeTab, setActiveTab] = useState('ledger');
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [categoryGroups, setCategoryGroups] = useState([]);

  // Form State
  const [transactionForm, setTransactionForm] = useState({
    type: 'Expense', category: 'Maintenance', title: '', amount: '', date: new Date().toISOString().slice(0,10), description: '', payment_method: 'Cash', reference_no: ''
  });

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchLedger();
    fetchSummary();
  }, [typeFilter, categoryFilter]);

  const fetchLedger = async () => {
    try {
      const res = await api.get(`/accounting/ledger?type=${typeFilter}&category=${categoryFilter}`);
      setLedger(res.data.ledger);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/accounting/summary');
      setSummary(res.data.summary);
      setCategoryGroups(res.data.categoryGroup);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounting/ledger', transactionForm);
      alert('Transaction recorded successfully!');
      setTransactionForm({
        type: 'Expense', category: 'Maintenance', title: '', amount: '', date: new Date().toISOString().slice(0,10), description: '', payment_method: 'Cash', reference_no: ''
      });
      fetchLedger();
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording transaction');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('ledger')}
          className={`btn ${activeTab === 'ledger' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'ledger' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'ledger' ? '#fff' : 'var(--text-secondary)' }}
        >
          General Ledger
        </button>
        <button 
          onClick={() => setActiveTab('balance-sheet')}
          className={`btn ${activeTab === 'balance-sheet' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'balance-sheet' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'balance-sheet' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaMoneyBillWave /> Balance Sheet
        </button>
      </div>

      {/* ==========================================================
          TAB 1: GENERAL LEDGER
          ========================================================== */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Ledger Table */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <select className="form-control" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>

              <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                <option value="Fee">Academic Fee</option>
                <option value="Salary">Staff Salaries</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Library">Library</option>
                <option value="Hostel">Hostel</option>
                <option value="Transport">Transport</option>
                <option value="Other">Other Expenses</option>
              </select>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Ref No</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center' }}>No transactions recorded.</td>
                    </tr>
                  ) : (
                    ledger.map(tx => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.date).toLocaleDateString()}</td>
                        <td>{tx.title}</td>
                        <td>{tx.category}</td>
                        <td style={{ fontWeight: 'bold', color: tx.type === 'Income' ? '#10b981' : '#ef4444' }}>
                          {tx.type === 'Income' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                        </td>
                        <td>{tx.payment_method}</td>
                        <td>{tx.reference_no || 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction Form */}
          <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Record Transaction</h3>

            <div className="form-group">
              <label>Transaction Type</label>
              <select className="form-control" value={transactionForm.type} onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value, category: e.target.value === 'Income' ? 'Fee' : 'Maintenance' })}>
                <option value="Expense">Debit (Expense)</option>
                <option value="Income">Credit (Income)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              {transactionForm.type === 'Income' ? (
                <select className="form-control" value={transactionForm.category} onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}>
                  <option value="Fee">Academic Fee</option>
                  <option value="Other">Other Income</option>
                </select>
              ) : (
                <select className="form-control" value={transactionForm.category} onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}>
                  <option value="Salary">Staff Salaries</option>
                  <option value="Maintenance">School Maintenance</option>
                  <option value="Library">Library Procurement</option>
                  <option value="Hostel">Hostel Maintenance</option>
                  <option value="Transport">Transport Maintenance</option>
                  <option value="Other">Other Expenses</option>
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Transaction Title *</label>
              <input type="text" className="form-control" required placeholder="e.g. Science lab equipment purchase" value={transactionForm.title} onChange={(e) => setTransactionForm({ ...transactionForm, title: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Amount (₹) *</label>
              <input type="number" className="form-control" required value={transactionForm.amount} onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" className="form-control" required value={transactionForm.date} onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select className="form-control" value={transactionForm.payment_method} onChange={(e) => setTransactionForm({ ...transactionForm, payment_method: e.target.value })}>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}><FaPlus /> Record Ledger Entry</button>
          </form>
        </div>
      )}

      {/* ==========================================================
          TAB 2: BALANCE SHEET
          ========================================================== */}
      {activeTab === 'balance-sheet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card stat-card">
              <div className="stat-icon green"><FaArrowUp /></div>
              <div className="stat-info">
                <h3>Total Credit (Income)</h3>
                <p>₹{parseFloat(summary.totalIncome).toFixed(2)}</p>
              </div>
            </div>

            <div className="glass-card stat-card">
              <div className="stat-icon" style={{ background: '#ef4444' }}><FaArrowDown /></div>
              <div className="stat-info">
                <h3>Total Debit (Expense)</h3>
                <p>₹{parseFloat(summary.totalExpense).toFixed(2)}</p>
              </div>
            </div>

            <div className="glass-card stat-card">
              <div className="stat-icon" style={{ background: 'var(--primary-color)' }}><FaMoneyBillWave /></div>
              <div className="stat-info">
                <h3>Net Profit / Balance</h3>
                <p style={{ color: summary.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  ₹{parseFloat(summary.netProfit).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown by Category */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Category-wise Ledger Breakdown</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Flow Type</th>
                    <th>Category</th>
                    <th>Total Cumulative Value</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryGroups.map((group, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold', color: group.type === 'Income' ? '#10b981' : '#ef4444' }}>{group.type}</td>
                      <td>{group.category}</td>
                      <td>₹{parseFloat(group.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
