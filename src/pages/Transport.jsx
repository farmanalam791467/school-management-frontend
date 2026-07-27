import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaBus, FaPlus, FaMapMarkedAlt, FaUserSlash, FaUserPlus } from 'react-icons/fa';

const Transport = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('routes');
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [allocatedStudents, setAllocatedStudents] = useState([]);
  
  // Form States
  const [routeForm, setRouteForm] = useState({ route_name: '', start_point: '', end_point: '', fare: '' });
  const [stopForm, setStopForm] = useState({ route_id: '', point_name: '', pickup_time: '', monthly_fee: '' });
  const [vehicleForm, setVehicleForm] = useState({ vehicle_no: '', model: '', capacity: '', driver_name: '', driver_phone: '', driver_license: '' });
  const [allocForm, setAllocForm] = useState({ student_id: '', route_id: '', pickup_point_id: '' });

  // Dropdowns
  const [students, setStudents] = useState([]);
  const [stopsDropdown, setStopsDropdown] = useState([]);

  useEffect(() => {
    fetchRoutes();
    fetchVehicles();
    if (['super_admin', 'school_admin', 'transport_manager'].includes(user?.role)) {
      fetchStudents();
    }
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/transport/routes');
      setRoutes(res.data.routes);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/transport/vehicles');
      setVehicles(res.data.vehicles);
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

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transport/routes', routeForm);
      alert('Route created successfully!');
      setRouteForm({ route_name: '', start_point: '', end_point: '', fare: '' });
      fetchRoutes();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating route');
    }
  };

  const handleCreateStop = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transport/pickup-points', stopForm);
      alert('Pickup point added successfully!');
      setStopForm({ route_id: '', point_name: '', pickup_time: '', monthly_fee: '' });
      fetchRoutes();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding stop');
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transport/vehicles', vehicleForm);
      alert('Vehicle registered successfully!');
      setVehicleForm({ vehicle_no: '', model: '', capacity: '', driver_name: '', driver_phone: '', driver_license: '' });
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding vehicle');
    }
  };

  const handleAllocateChangeRoute = (routeId) => {
    setAllocForm({ ...allocForm, route_id: routeId, pickup_point_id: '' });
    if (routeId) {
      const route = routes.find(r => r.id === parseInt(routeId));
      setStopsDropdown(route ? route.pickupPoints : []);
    } else {
      setStopsDropdown([]);
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transport/allocate', allocForm);
      alert('Student allocated to transport successfully!');
      setAllocForm({ student_id: '', route_id: '', pickup_point_id: '' });
      setStopsDropdown([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error allocating transport');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('routes')}
          className={`btn ${activeTab === 'routes' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'routes' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'routes' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaMapMarkedAlt /> Routes & Stops
        </button>
        <button 
          onClick={() => setActiveTab('vehicles')}
          className={`btn ${activeTab === 'vehicles' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'vehicles' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'vehicles' ? '#fff' : 'var(--text-secondary)' }}
        >
          <FaBus /> Vehicles & Drivers
        </button>
        {['super_admin', 'school_admin', 'transport_manager'].includes(user?.role) && (
          <button 
            onClick={() => setActiveTab('allocate')}
            className={`btn ${activeTab === 'allocate' ? 'btn-primary' : ''}`}
            style={{ background: activeTab === 'allocate' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'allocate' ? '#fff' : 'var(--text-secondary)' }}
          >
            <FaUserPlus /> Student Allocation
          </button>
        )}
      </div>

      {/* ==========================================================
          TAB 1: ROUTES & STOPS
          ========================================================== */}
      {activeTab === 'routes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Transport Routes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {routes.map(route => (
                <div key={route.id} style={{
                  padding: '1.25rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  borderLeft: '4px solid var(--primary-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{route.route_name}</h4>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>Fare: ₹{parseFloat(route.fare).toFixed(2)}/mo</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Line: {route.start_point} &rarr; {route.end_point}
                  </p>
                  
                  {/* Stops */}
                  <div style={{ marginTop: '1rem' }}>
                    <h5 style={{ fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>Stops & Schedules</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                      {route.pickupPoints?.map(stop => (
                        <div key={stop.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '0.4rem', borderRadius: '0.25rem' }}>
                          <span>{stop.point_name}</span>
                          <span>Time: {stop.pickup_time} | Fee: ₹{parseFloat(stop.monthly_fee).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forms */}
          {['super_admin', 'school_admin', 'transport_manager'].includes(user?.role) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Route Form */}
              <form onSubmit={handleCreateRoute} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Create New Route</h4>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Route Name *</label>
                  <input type="text" className="form-control" placeholder="e.g. Route 3 North" required value={routeForm.route_name} onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Start Point</label>
                    <input type="text" className="form-control" required value={routeForm.start_point} onChange={(e) => setRouteForm({ ...routeForm, start_point: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>End Point</label>
                    <input type="text" className="form-control" required value={routeForm.end_point} onChange={(e) => setRouteForm({ ...routeForm, end_point: e.target.value })} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Monthly Route Fare (₹)</label>
                  <input type="number" className="form-control" required value={routeForm.fare} onChange={(e) => setRouteForm({ ...routeForm, fare: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary">Create Route</button>
              </form>

              {/* Stop Form */}
              <form onSubmit={handleCreateStop} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Add Stop / Pickup Point</h4>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Select Route *</label>
                  <select className="form-control" required value={stopForm.route_id} onChange={(e) => setStopForm({ ...stopForm, route_id: e.target.value })}>
                    <option value="">-- Choose Route --</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Stop Name *</label>
                  <input type="text" className="form-control" required value={stopForm.point_name} onChange={(e) => setStopForm({ ...stopForm, point_name: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Pickup Time *</label>
                    <input type="time" className="form-control" required value={stopForm.pickup_time} onChange={(e) => setStopForm({ ...stopForm, pickup_time: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Stop Fee (₹) *</label>
                    <input type="number" className="form-control" required value={stopForm.monthly_fee} onChange={(e) => setStopForm({ ...stopForm, monthly_fee: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Add Stop</button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ==========================================================
          TAB 2: VEHICLES & DRIVERS
          ========================================================== */}
      {activeTab === 'vehicles' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* List */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Vehicle Fleet</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Vehicle No</th>
                    <th>Model</th>
                    <th>Capacity</th>
                    <th>Driver Name</th>
                    <th>Driver Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>No vehicles registered.</td>
                    </tr>
                  ) : (
                    vehicles.map(v => (
                      <tr key={v.id}>
                        <td>{v.vehicle_no}</td>
                        <td>{v.model}</td>
                        <td>{v.capacity} seats</td>
                        <td>{v.driver_name}</td>
                        <td>{v.driver_phone}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form */}
          {['super_admin', 'school_admin', 'transport_manager'].includes(user?.role) && (
            <form onSubmit={handleCreateVehicle} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Add Vehicle</h3>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Vehicle Number *</label>
                <input type="text" className="form-control" placeholder="e.g. TX-9821" required value={vehicleForm.vehicle_no} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_no: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Model / Type *</label>
                <input type="text" className="form-control" placeholder="e.g. Tata Starbus" required value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Capacity *</label>
                <input type="number" className="form-control" required value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Driver Name *</label>
                <input type="text" className="form-control" required value={vehicleForm.driver_name} onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Driver Phone *</label>
                <input type="text" className="form-control" required value={vehicleForm.driver_phone} onChange={(e) => setVehicleForm({ ...vehicleForm, driver_phone: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Driver License *</label>
                <input type="text" className="form-control" required value={vehicleForm.driver_license} onChange={(e) => setVehicleForm({ ...vehicleForm, driver_license: e.target.value })} />
              </div>

              <button type="submit" className="btn btn-primary">Add Vehicle</button>
            </form>
          )}
        </div>
      )}

      {/* ==========================================================
          TAB 3: STUDENT ALLOCATION
          ========================================================== */}
      {activeTab === 'allocate' && (
        <form onSubmit={handleAllocateSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Allocate Transport Seat</h3>

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
            <label>Select Route *</label>
            <select className="form-control" required value={allocForm.route_id} onChange={(e) => handleAllocateChangeRoute(e.target.value)}>
              <option value="">-- Choose Route --</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.route_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Stop / Pickup Point *</label>
            <select className="form-control" required value={allocForm.pickup_point_id} onChange={(e) => setAllocForm({ ...allocForm, pickup_point_id: e.target.value })} disabled={!allocForm.route_id}>
              <option value="">-- Choose Stop --</option>
              {stopsDropdown.map(stop => (
                <option key={stop.id} value={stop.id}>{stop.point_name} (Fee: ${parseFloat(stop.monthly_fee).toFixed(2)})</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Allocate Seat</button>
        </form>
      )}
    </div>
  );
};

export default Transport;
