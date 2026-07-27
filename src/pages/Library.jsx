import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaBook, FaPlus, FaBookReader, FaUndo, FaSearch, FaBarcode } from 'react-icons/fa';

const Library = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('catalog');
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [search, setSearch] = useState('');

  // Form States
  const [bookForm, setBookForm] = useState({ title: '', isbn: '', author: '', publisher: '', subject: '', quantity: 1, rack_number: '', price: '', barcode: '' });
  const [issueForm, setIssueForm] = useState({ book_id: '', user_id: '', due_date: '' });

  // Dropdowns for issuing
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    fetchBooks();
    fetchIssues();
    if (['super_admin', 'school_admin', 'librarian'].includes(user?.role)) {
      fetchUsers();
    }
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await api.get(`/library/books?search=${search}`);
      setBooks(res.data.books);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIssues = async () => {
    try {
      const res = await api.get('/library/issues');
      setIssues(res.data.issues);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch active students and teachers to populate dropdown
      const stuRes = await api.get('/students?limit=100');
      const teaRes = await api.get('/teachers');
      
      const studentsMapped = stuRes.data.students.map(s => ({ id: s.user_id, name: `${s.name} (Student - ${s.roll_number})` }));
      const teachersMapped = teaRes.data.teachers.map(t => ({ id: t.user_id, name: `${t.name} (Teacher - ${t.employee_id})` }));
      
      setAllUsers([...studentsMapped, ...teachersMapped]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/library/books', bookForm);
      alert('Book added to catalog successfully!');
      setBookForm({ title: '', isbn: '', author: '', publisher: '', subject: '', quantity: 1, rack_number: '', price: '', barcode: '' });
      fetchBooks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding book');
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/library/issue', issueForm);
      alert('Book issued successfully!');
      setIssueForm({ book_id: '', user_id: '', due_date: '' });
      fetchBooks();
      fetchIssues();
    } catch (err) {
      alert(err.response?.data?.message || 'Error issuing book');
    }
  };

  const handleReturnBook = async (issueId) => {
    if (!window.confirm('Are you sure you want to return this book?')) return;
    try {
      const res = await api.post('/library/return', { issue_id: issueId });
      alert(`Book returned successfully! Late fine charged: $${res.data.fineAmount.toFixed(2)}`);
      fetchBooks();
      fetchIssues();
    } catch (err) {
      alert(err.response?.data?.message || 'Error returning book');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => { setActiveTab('catalog'); fetchBooks(); }}
          className={`btn ${activeTab === 'catalog' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'catalog' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'catalog' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaBook /> Book Catalog
        </button>
        {['super_admin', 'school_admin', 'librarian'].includes(user?.role) && (
          <>
            <button 
              onClick={() => setActiveTab('procure')}
              className={`btn ${activeTab === 'procure' ? 'btn-primary' : ''}`}
              style={{ background: activeTab === 'procure' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'procure' ? '#fff' : 'var(--text-secondary)' }}
            >
              <FaPlus /> Procure Books
            </button>
            <button 
              onClick={() => setActiveTab('issue')}
              className={`btn ${activeTab === 'issue' ? 'btn-primary' : ''}`}
              style={{ background: activeTab === 'issue' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'issue' ? '#fff' : 'var(--text-secondary)' }}
            >
              <FaBookReader /> Issue Book
            </button>
          </>
        )}
        <button 
          onClick={() => { setActiveTab('issues'); fetchIssues(); }}
          className={`btn ${activeTab === 'issues' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'issues' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'issues' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaUndo /> Issue Registry
        </button>
      </div>

      {/* ==========================================================
          TAB 1: BOOK CATALOG
          ========================================================== */}
      {activeTab === 'catalog' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Search */}
          <div style={{ display: 'flex', gap: '1rem', maxWidth: '400px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FaSearch style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search title, author, ISBN..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            <button className="btn btn-primary" onClick={fetchBooks}>Search</button>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Barcode</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Subject</th>
                  <th>Rack No</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>No books found in catalog.</td>
                  </tr>
                ) : (
                  books.map(b => (
                    <tr key={b.id}>
                      <td><FaBarcode /> {b.barcode}</td>
                      <td>{b.title}</td>
                      <td>{b.author}</td>
                      <td>{b.isbn}</td>
                      <td>{b.subject || 'N/A'}</td>
                      <td>{b.rack_number || 'N/A'}</td>
                      <td>{b.quantity}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: b.status === 'Available' ? '#d1fae5' : '#fee2e2',
                          color: b.status === 'Available' ? '#10b981' : '#ef4444'
                        }}>{b.status}</span>
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
          TAB 2: PROCURE BOOKS
          ========================================================== */}
      {activeTab === 'procure' && (
        <form onSubmit={handleAddBook} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '550px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Procure Book</h3>

          <div className="form-group">
            <label>Book Title *</label>
            <input type="text" className="form-control" required value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Author *</label>
              <input type="text" className="form-control" required value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
            </div>
            <div className="form-group">
              <label>ISBN Number *</label>
              <input type="text" className="form-control" required value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Barcode ID *</label>
              <input type="text" className="form-control" placeholder="e.g. B00101" required value={bookForm.barcode} onChange={(e) => setBookForm({ ...bookForm, barcode: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Subject Category</label>
              <input type="text" className="form-control" placeholder="e.g. Physics" value={bookForm.subject} onChange={(e) => setBookForm({ ...bookForm, subject: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" className="form-control" required value={bookForm.quantity} onChange={(e) => setBookForm({ ...bookForm, quantity: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Rack Number</label>
              <input type="text" className="form-control" placeholder="A-3" value={bookForm.rack_number} onChange={(e) => setBookForm({ ...bookForm, rack_number: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Unit Price (₹)</label>
              <input type="number" step="0.01" className="form-control" value={bookForm.price} onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Procure to Stock</button>
        </form>
      )}

      {/* ==========================================================
          TAB 3: ISSUE BOOK
          ========================================================== */}
      {activeTab === 'issue' && (
        <form onSubmit={handleIssueBook} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Checkout Book</h3>

          <div className="form-group">
            <label>Select Book *</label>
            <select className="form-control" required value={issueForm.book_id} onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })}>
              <option value="">-- Choose Book --</option>
              {books.filter(b => b.quantity > 0).map(b => (
                <option key={b.id} value={b.id}>{b.title} (Barcode: {b.barcode})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Issue To (Student/Teacher) *</label>
            <select className="form-control" required value={issueForm.user_id} onChange={(e) => setIssueForm({ ...issueForm, user_id: e.target.value })}>
              <option value="">-- Choose Borrower --</option>
              {allUsers.map(au => (
                <option key={au.id} value={au.id}>{au.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Due Return Date *</label>
            <input type="date" className="form-control" required value={issueForm.due_date} onChange={(e) => setIssueForm({ ...issueForm, due_date: e.target.value })} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Issue Book Card</button>
        </form>
      )}

      {/* ==========================================================
          TAB 4: ISSUE REGISTRY
          ========================================================== */}
      {activeTab === 'issues' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Checkouts & Issue History</h3>
          
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Borrower Name</th>
                  <th>Role</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Fines</th>
                  <th>Status</th>
                  {['super_admin', 'school_admin', 'librarian'].includes(user?.role) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center' }}>No books currently checked out.</td>
                  </tr>
                ) : (
                  issues.map(is => (
                    <tr key={is.id}>
                      <td>{is.title}</td>
                      <td>{is.user_name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{is.user_role}</td>
                      <td>{new Date(is.issue_date).toLocaleDateString()}</td>
                      <td>{new Date(is.due_date).toLocaleDateString()}</td>
                      <td>{is.return_date ? new Date(is.return_date).toLocaleDateString() : '-'}</td>
                      <td style={{ color: parseFloat(is.fine_amount) > 0 ? '#ef4444' : 'inherit', fontWeight: parseFloat(is.fine_amount) > 0 ? 'bold' : 'normal' }}>
                        {parseFloat(is.fine_amount) > 0 ? `₹${parseFloat(is.fine_amount).toFixed(2)}` : '₹0.00'}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: is.status === 'Returned' ? '#d1fae5' : '#fef3c7',
                          color: is.status === 'Returned' ? '#10b981' : '#d97706'
                        }}>{is.status}</span>
                      </td>
                      {['super_admin', 'school_admin', 'librarian'].includes(user?.role) && (
                        <td>
                          {is.status === 'Issued' ? (
                            <button className="btn" style={{ padding: '0.4rem 0.8rem', background: '#e0e7ff', color: 'var(--primary-color)', fontSize: '0.8rem' }} onClick={() => handleReturnBook(is.id)}>
                              Return
                            </button>
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
      )}
    </div>
  );
};

export default Library;
