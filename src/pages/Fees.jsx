import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaPlus, FaSearch, FaCreditCard, FaFilePdf, FaMoneyBillWave, FaQrcode } from 'react-icons/fa';

const Fees = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form States
  const [feeTypeForm, setFeeTypeForm] = useState({ name: '', code: '', description: '', amount: '', due_date: '' });
  const [bulkForm, setBulkForm] = useState({ class_id: '', section_id: '', fee_type_id: '' });

  // Checkout Modal State
  const [checkoutInvoice, setCheckoutInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [payAmount, setPayAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paying, setPaying] = useState(false);

  // Invoice Detail Modal State
  const [viewInvoice, setViewInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
    if (['super_admin', 'school_admin', 'accountant'].includes(user?.role)) {
      fetchFeeTypes();
      fetchClasses();
    }
  }, [page, statusFilter]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get(`/fees/invoices?page=${page}&status=${statusFilter}&search=${search}`);
      setInvoices(res.data.invoices);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeeTypes = async () => {
    try {
      const res = await api.get('/fees/types');
      setFeeTypes(res.data.feeTypes);
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

  const handleClassChange = async (classId) => {
    setBulkForm({ ...bulkForm, class_id: classId, section_id: '' });
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

  const handleCreateFeeType = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/types', feeTypeForm);
      alert('Fee Type created successfully!');
      setFeeTypeForm({ name: '', code: '', description: '', amount: '', due_date: '' });
      fetchFeeTypes();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating fee type');
    }
  };

  const handleBulkInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/invoices/bulk', bulkForm);
      alert('Invoices generated successfully for all students in the class!');
      setBulkForm({ class_id: '', section_id: '', fee_type_id: '' });
      setSections([]);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating invoices');
    }
  };

  // Open checkout modal
  const openCheckout = (invoice) => {
    setCheckoutInvoice(invoice);
    const balance = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);
    setPayAmount(balance.toFixed(2));
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setUpiId('');
  };

  // Process payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      const transaction_no = paymentMethod === 'Card' ? `TXN-CARD${Date.now()}` : `TXN-UPI${Date.now()}`;
      await api.post('/fees/collect', {
        invoice_id: checkoutInvoice.id,
        amount_paid: payAmount,
        payment_method: paymentMethod,
        transaction_no
      });

      alert('Payment processed successfully!');
      setCheckoutInvoice(null);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  // View Detailed Invoice Modal
  const openInvoiceDetails = async (invoiceId) => {
    try {
      const res = await api.get(`/fees/invoices/${invoiceId}`);
      setViewInvoice(res.data);
    } catch (err) {
      alert('Error loading invoice details');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('invoices')}
          className={`btn ${activeTab === 'invoices' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'invoices' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'invoices' ? '#fff' : 'var(--text-secondary)' }}
        >
          Invoices Directory
        </button>
        {['super_admin', 'school_admin', 'accountant'].includes(user?.role) && (
          <>
            <button 
              onClick={() => setActiveTab('types')}
              className={`btn ${activeTab === 'types' ? 'btn-primary' : ''}`}
              style={{ background: activeTab === 'types' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'types' ? '#fff' : 'var(--text-secondary)' }}
            >
              <FaPlus /> Setup Fee Types
            </button>
            <button 
              onClick={() => setActiveTab('bulk')}
              className={`btn ${activeTab === 'bulk' ? 'btn-primary' : ''}`}
              style={{ background: activeTab === 'bulk' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'bulk' ? '#fff' : 'var(--text-secondary)' }}
            >
              <FaMoneyBillWave /> Bulk Invoicing
            </button>
          </>
        )}
      </div>

      {/* ==========================================================
          TAB 1: INVOICE DIRECTORY
          ========================================================== */}
      {activeTab === 'invoices' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search student, invoice..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <select 
              className="form-control" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Invoices</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>

            <button className="btn btn-primary" onClick={fetchInvoices}>Search</button>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Class</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center' }}>No invoices found.</td>
                  </tr>
                ) : (
                  invoices.map(invoice => {
                    const balance = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);
                    return (
                      <tr key={invoice.id}>
                        <td>{invoice.invoice_no}</td>
                        <td>{invoice.student_name}</td>
                        <td>{invoice.roll_number}</td>
                        <td>{invoice.class_name} - {invoice.section_name}</td>
                        <td>₹{parseFloat(invoice.total_amount).toFixed(2)}</td>
                        <td>₹{parseFloat(invoice.paid_amount).toFixed(2)}</td>
                        <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: invoice.status === 'Paid' ? '#d1fae5' : invoice.status === 'Partially Paid' ? '#fef3c7' : '#fee2e2',
                            color: invoice.status === 'Paid' ? '#10b981' : invoice.status === 'Partially Paid' ? '#d97706' : '#ef4444'
                          }}>{invoice.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn" style={{ padding: '0.4rem', background: '#e0e7ff', color: 'var(--primary-color)', fontSize: '0.8rem' }} onClick={() => openInvoiceDetails(invoice.id)}>
                              View
                            </button>
                            {invoice.status !== 'Paid' && (
                              <button className="btn" style={{ padding: '0.4rem', background: '#d1fae5', color: '#10b981', fontSize: '0.8rem' }} onClick={() => openCheckout(invoice)}>
                                Pay Now
                              </button>
                            )}
                            <a 
                              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/invoices/${invoice.id}/pdf`}
                              className="btn" 
                              style={{ padding: '0.4rem', background: '#f3f4f6', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FaFilePdf />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 2: SETUP FEE TYPES
          ========================================================== */}
      {activeTab === 'types' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* Form */}
          <form onSubmit={handleCreateFeeType} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Add New Fee Type</h3>
            
            <div className="form-group">
              <label>Fee Name *</label>
              <input type="text" className="form-control" placeholder="e.g. Science Lab Fee" required value={feeTypeForm.name} onChange={(e) => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })} />
            </div>
            
            <div className="form-group">
              <label>Fee Code *</label>
              <input type="text" className="form-control" placeholder="e.g. SCIFEE" required value={feeTypeForm.code} onChange={(e) => setFeeTypeForm({ ...feeTypeForm, code: e.target.value })} />
            </div>
            
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input type="number" className="form-control" required value={feeTypeForm.amount} onChange={(e) => setFeeTypeForm({ ...feeTypeForm, amount: e.target.value })} />
            </div>
            
            <div className="form-group">
              <label>Due Date *</label>
              <input type="date" className="form-control" required value={feeTypeForm.due_date} onChange={(e) => setFeeTypeForm({ ...feeTypeForm, due_date: e.target.value })} />
            </div>
            
            <button type="submit" className="btn btn-primary">Create Structure</button>
          </form>

          {/* List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Fee Structures</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feeTypes.map(ft => (
                    <tr key={ft.id}>
                      <td>{ft.code}</td>
                      <td>{ft.name}</td>
                      <td>₹{parseFloat(ft.amount).toFixed(2)}</td>
                      <td>{new Date(ft.due_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 3: BULK INVOICING
          ========================================================== */}
      {activeTab === 'bulk' && (
        <form onSubmit={handleBulkInvoice} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '550px', margin: '0 auto' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Class-wide Bulk Invoicing</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Generate monthly/term fee invoices for all active students in a specific class and section.</p>
          </div>

          <div className="form-group">
            <label>Select Target Class *</label>
            <select className="form-control" required value={bulkForm.class_id} onChange={(e) => handleClassChange(e.target.value)}>
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Select Section *</label>
            <select className="form-control" required value={bulkForm.section_id} onChange={(e) => setBulkForm({ ...bulkForm, section_id: e.target.value })} disabled={!bulkForm.class_id}>
              <option value="">-- Choose Section --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Select Fee Type *</label>
            <select className="form-control" required value={bulkForm.fee_type_id} onChange={(e) => setBulkForm({ ...bulkForm, fee_type_id: e.target.value })}>
              <option value="">-- Choose Fee Type --</option>
              {feeTypes.map(ft => <option key={ft.id} value={ft.id}>{ft.name} (₹{parseFloat(ft.amount).toFixed(2)})</option>)}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            Run Bulk Invoicing Job
          </button>
        </form>
      )}

      {/* DETAILED INVOICE MODAL */}
      {viewInvoice && (
        <div className="modal-overlay" style={{ opacity: 1 }}>
          <div className="modal-content" style={{ maxWidth: '550px', transform: 'translateY(0)' }}>
            <div className="modal-header">
              <h3>Invoice Detail - {viewInvoice.invoice.invoice_no}</h3>
              <button className="close-btn" onClick={() => setViewInvoice(null)}>&times;</button>
            </div>
            
            <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <p><strong>Student Name:</strong> {viewInvoice.invoice.student_name} ({viewInvoice.invoice.roll_number})</p>
              <p><strong>Class/Section:</strong> {viewInvoice.invoice.class_name} - {viewInvoice.invoice.section_name}</p>
              <p><strong>Due Date:</strong> {new Date(viewInvoice.invoice.due_date).toLocaleDateString()}</p>
              <p><strong>Status:</strong> {viewInvoice.invoice.status}</p>
            </div>

            <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>Billing Items</h4>
            <table className="custom-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {viewInvoice.details.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.fee_name}</td>
                    <td>₹{parseFloat(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '1rem', gap: '0.5rem', fontWeight: 600 }}>
              <p>Total: ₹{parseFloat(viewInvoice.invoice.total_amount).toFixed(2)}</p>
              <p>Paid: ₹{parseFloat(viewInvoice.invoice.paid_amount).toFixed(2)}</p>
              <p style={{ color: 'red' }}>Due Balance: ₹{(parseFloat(viewInvoice.invoice.total_amount) - parseFloat(viewInvoice.invoice.paid_amount)).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* STRIPE / RAZORPAY CHECKOUT MODAL */}
      {checkoutInvoice && (
        <div className="modal-overlay" style={{ opacity: 1 }}>
          <form onSubmit={handlePaymentSubmit} className="modal-content" style={{ maxWidth: '480px', transform: 'translateY(0)' }}>
            <div className="modal-header">
              <h3>Gateway Secure Checkout</h3>
              <button type="button" className="close-btn" onClick={() => setCheckoutInvoice(null)}>&times;</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Paying for invoice <strong>{checkoutInvoice.invoice_no}</strong></p>
              <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)', fontWeight: 'bold', marginTop: '0.5rem' }}>₹{parseFloat(payAmount).toFixed(2)}</h2>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ flex: 1, justifyContent: 'center', background: paymentMethod === 'Card' ? 'var(--primary-color)' : '#f3f4f6', color: paymentMethod === 'Card' ? '#fff' : 'var(--text-primary)' }}
                onClick={() => setPaymentMethod('Card')}
              >
                <FaCreditCard /> Credit Card
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ flex: 1, justifyContent: 'center', background: paymentMethod === 'UPI' ? 'var(--primary-color)' : '#f3f4f6', color: paymentMethod === 'UPI' ? '#fff' : 'var(--text-primary)' }}
                onClick={() => setPaymentMethod('UPI')}
              >
                <FaQrcode /> UPI Scanner
              </button>
            </div>

            {/* Card Form */}
            {paymentMethod === 'Card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>Card Number</label>
                  <input type="text" className="form-control" placeholder="4111 2222 3333 4444" required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input type="text" className="form-control" placeholder="MM/YY" required value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>CVC</label>
                    <input type="text" className="form-control" placeholder="123" required value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* UPI QR Code Scanner */}
            {paymentMethod === 'UPI' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                <div style={{
                  padding: '1rem',
                  background: '#fff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  width: '150px',
                  height: '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Mock QR */}
                  <div style={{ width: '130px', height: '130px', background: 'repeating-conic-gradient(from 0deg, #000 0deg 90deg, #fff 90deg 180deg) 0 0/10px 10px' }}></div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scan this QR code using BHIM, GooglePay, PhonePe, or Paytm to pay.</p>
                <div className="form-group" style={{ width: '100%' }}>
                  <label>Or enter UPI ID</label>
                  <input type="text" className="form-control" placeholder="john@okaxis" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }} disabled={paying}>
              {paying ? 'Authorizing Payment...' : 'Authorize Transaction'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Fees;
