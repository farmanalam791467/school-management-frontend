import { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaCalendarAlt, FaPlus, FaTrash } from 'react-icons/fa';

const Events = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  
  // Form State
  const [eventForm, setEventForm] = useState({ title: '', description: '', start_date: '', end_date: '', type: 'Event' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data.events);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', eventForm);
      alert('Event scheduled successfully!');
      setEventForm({ title: '', description: '', start_date: '', end_date: '', type: 'Event' });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch (err) {
      alert('Error deleting event');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
      {/* Calendar List */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaCalendarAlt style={{ color: 'var(--primary-color)' }} /> School Event Calendar
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '550px' }}>
          {events.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No events scheduled.</p>
          ) : (
            events.map(event => (
              <div key={event.id} style={{
                padding: '1.25rem',
                borderRadius: '0.5rem',
                background: '#f9fafb',
                borderLeft: event.type === 'Holiday' ? '4px solid #ef4444' : '4px solid #10b981',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{event.title}</h4>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    background: event.type === 'Holiday' ? '#fee2e2' : '#d1fae5',
                    color: event.type === 'Holiday' ? '#ef4444' : '#10b981'
                  }}>{event.type}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{event.description}</p>
                
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                  <span>Start: {new Date(event.start_date).toLocaleString()}</span>
                  <span>End: {new Date(event.end_date).toLocaleString()}</span>
                </div>

                {['super_admin', 'school_admin', 'principal'].includes(user?.role) && (
                  <button 
                    onClick={() => handleDeleteEvent(event.id)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '1rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {['super_admin', 'school_admin', 'principal', 'vice_principal'].includes(user?.role) ? (
          <form onSubmit={handleCreateEvent} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}><FaPlus /> Schedule Event</h3>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Event Title *</label>
              <input type="text" className="form-control" placeholder="e.g. Science Fair" required value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Description</label>
              <textarea className="form-control" rows="3" placeholder="Description..." value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Start Date & Time *</label>
              <input type="datetime-local" className="form-control" required value={eventForm.start_date} onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>End Date & Time *</label>
              <input type="datetime-local" className="form-control" required value={eventForm.end_date} onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Event Type</label>
              <select className="form-control" value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}>
                <option value="Event">Active School Event</option>
                <option value="Holiday">School Holiday</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Schedule</button>
          </form>
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            Only administrators can add events to the calendar.
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
