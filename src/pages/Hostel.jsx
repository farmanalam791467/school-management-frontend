import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaHotel, FaPlus, FaBed, FaUserSlash, FaUserPlus } from 'react-icons/fa';

const Hostel = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('hostels');
  const [hostels, setHostels] = useState([]);
  
  // Form States
  const [hostelForm, setHostelForm] = useState({ name: '', type: 'Boys', address: '', description: '' });
  const [roomForm, setRoomForm] = useState({ hostel_id: '', room_no: '', room_type: 'Double', capacity: 2, cost_per_bed: '' });
  const [allocForm, setAllocForm] = useState({ student_id: '', room_id: '', bed_no: '' });

  // Dropdowns
  const [students, setStudents] = useState([]);
  const [roomsDropdown, setRoomsDropdown] = useState([]);

  useEffect(() => {
    fetchHostels();
    if (['super_admin', 'school_admin', 'hostel_manager'].includes(user?.role)) {
      fetchStudents();
    }
  }, []);

  const fetchHostels = async () => {
    try {
      const res = await api.get('/hostel');
      setHostels(res.data.hostels);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students?limit=100');
      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateHostel = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hostel', hostelForm);
      alert('Hostel created successfully!');
      setHostelForm({ name: '', type: 'Boys', address: '', description: '' });
      fetchHostels();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating hostel');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hostel/rooms', roomForm);
      alert('Room created successfully!');
      setRoomForm({ hostel_id: '', room_no: '', room_type: 'Double', capacity: 2, cost_per_bed: '' });
      fetchHostels();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating room');
    }
  };

  const handleAllocateChangeHostel = (hostelId) => {
    setAllocForm({ ...allocForm, room_id: '', bed_no: '' });
    if (hostelId) {
      const hostel = hostels.find(h => h.id === parseInt(hostelId));
      setRoomsDropdown(hostel ? hostel.rooms : []);
    } else {
      setRoomsDropdown([]);
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hostel/allocate', allocForm);
      alert('Student allocated to bed successfully!');
      setAllocForm({ student_id: '', room_id: '', bed_no: '' });
      setRoomsDropdown([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error allocating bed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('hostels')}
          className={`btn ${activeTab === 'hostels' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'hostels' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'hostels' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaHotel /> Hostels List
        </button>
        {['super_admin', 'school_admin', 'hostel_manager'].includes(user?.role) && (
          <>
            <button 
              onClick={() => setActiveTab('setup-rooms')}
              className={`btn ${activeTab === 'setup-rooms' ? 'btn-primary' : ''}`}
              style={{ background: activeTab === 'setup-rooms' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'setup-rooms' ? '#fff' : 'var(--text-secondary)' }}
            >
              <FaPlus /> Setup Rooms
            </button>
            <button 
              onClick={() => setActiveTab('allocate')}
              className={`btn ${activeTab === 'allocate' ? 'btn-primary' : ''}`}
              style={{ background: activeTab === 'allocate' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'allocate' ? '#fff' : 'var(--text-secondary)' }}
            >
              <FaUserPlus /> Room Allocation
            </button>
          </>
        )}
      </div>

      {/* ==========================================================
          TAB 1: HOSTELS LIST
          ========================================================== */}
      {activeTab === 'hostels' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Hostels</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {hostels.map(hostel => (
                <div key={hostel.id} style={{
                  padding: '1.25rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  borderLeft: '4px solid var(--primary-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{hostel.name}</h4>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      background: hostel.type === 'Boys' ? '#e0e7ff' : '#fce7f3',
                      color: hostel.type === 'Boys' ? 'var(--primary-color)' : '#db2777'
                    }}>{hostel.type} Hostel</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {hostel.address} | {hostel.description}
                  </p>
                  
                  {/* Rooms list */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>Room Catalog</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                      {hostel.rooms?.map(room => (
                        <div key={room.id} style={{ background: '#fff', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'bold' }}>Room {room.room_no}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>Type: {room.room_type}</span>
                          <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Cost: ₹{parseFloat(room.cost_per_bed).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Hostel Form */}
          {['super_admin', 'school_admin', 'hostel_manager'].includes(user?.role) && (
            <form onSubmit={handleCreateHostel} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Add Hostel Building</h3>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Hostel Name *</label>
                <input type="text" className="form-control" placeholder="e.g. Einstein Block" required value={hostelForm.name} onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Hostel Type *</label>
                <select className="form-control" value={hostelForm.type} onChange={(e) => setHostelForm({ ...hostelForm, type: e.target.value })}>
                  <option value="Boys">Boys Only</option>
                  <option value="Girls">Girls Only</option>
                  <option value="Mixed">Co-Ed (Mixed)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Address</label>
                <input type="text" className="form-control" value={hostelForm.address} onChange={(e) => setHostelForm({ ...hostelForm, address: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Description</label>
                <textarea className="form-control" rows="2" value={hostelForm.description} onChange={(e) => setHostelForm({ ...hostelForm, description: e.target.value })} />
              </div>

              <button type="submit" className="btn btn-primary">Create Hostel</button>
            </form>
          )}
        </div>
      )}

      {/* ==========================================================
          TAB 2: SETUP ROOMS
          ========================================================== */}
      {activeTab === 'setup-rooms' && (
        <form onSubmit={handleCreateRoom} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Add Room</h3>

          <div className="form-group">
            <label>Select Hostel Building *</label>
            <select className="form-control" required value={roomForm.hostel_id} onChange={(e) => setRoomForm({ ...roomForm, hostel_id: e.target.value })}>
              <option value="">-- Choose Hostel --</option>
              {hostels.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.type})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Room Number *</label>
              <input type="text" className="form-control" placeholder="e.g. 104" required value={roomForm.room_no} onChange={(e) => setRoomForm({ ...roomForm, room_no: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Room Type *</label>
              <select className="form-control" value={roomForm.room_type} onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}>
                <option value="Single">Single (1 Bed)</option>
                <option value="Double">Double (2 Beds)</option>
                <option value="Triple">Triple (3 Beds)</option>
                <option value="Dormitory">Dormitory (4+ Beds)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Bed Capacity *</label>
              <input type="number" className="form-control" required value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Cost Per Bed (₹) *</label>
              <input type="number" className="form-control" required value={roomForm.cost_per_bed} onChange={(e) => setRoomForm({ ...roomForm, cost_per_bed: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Add Room</button>
        </form>
      )}

      {/* ==========================================================
          TAB 3: ROOM ALLOCATION
          ========================================================== */}
      {activeTab === 'allocate' && (
        <form onSubmit={handleAllocateSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Allocate Bed Space</h3>

          <div className="form-group">
            <label>Select Student *</label>
            <select className="form-control" required value={allocForm.student_id} onChange={(e) => setAllocForm({ ...allocForm, student_id: e.target.value })}>
              <option value="">-- Choose Student --</option>
              {students.map(s => (
                <option key={s.student_id} value={s.student_id}>{s.name} ({s.roll_number})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Hostel Building *</label>
            <select className="form-control" required onChange={(e) => handleAllocateChangeHostel(e.target.value)}>
              <option value="">-- Choose Hostel --</option>
              {hostels.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.type})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Select Room *</label>
              <select className="form-control" required value={allocForm.room_id} onChange={(e) => setAllocForm({ ...allocForm, room_id: e.target.value })} disabled={roomsDropdown.length === 0}>
                <option value="">-- Choose Room --</option>
                {roomsDropdown.map(room => (
                  <option key={room.id} value={room.id}>Room {room.room_no} ({room.room_type})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Bed Number *</label>
              <input type="number" className="form-control" required placeholder="e.g. 1" value={allocForm.bed_no} onChange={(e) => setAllocForm({ ...allocForm, bed_no: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Allocate Bed</button>
        </form>
      )}
    </div>
  );
};

export default Hostel;
