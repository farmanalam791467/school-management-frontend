import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext, api } from '../context/AuthContext';
import { FaUserCircle, FaPaperPlane, FaComments, FaEnvelope, FaWhatsapp } from 'react-icons/fa';

const Chat = () => {
  const { user } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
    }
  }, [activeContact]);

  useEffect(() => {
    // Scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/chat/contacts');
      setContacts(res.data.contacts);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (contactId) => {
    try {
      const res = await api.get(`/chat/messages/${contactId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeContact) return;

    try {
      const res = await api.post('/chat/messages', {
        receiver_id: activeContact.id,
        message: typedMessage
      });
      setMessages([...messages, res.data.chat]);
      setTypedMessage('');
    } catch (err) {
      alert('Error sending message');
    }
  };

  return (
    <div className="glass-card" style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: 0,
      padding: 0,
      height: 'calc(100vh - 200px)',
      overflow: 'hidden',
      borderRadius: '1rem',
      background: 'rgba(255,255,255,0.9)'
    }}>
      {/* Left: Contacts List */}
      <div style={{
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaComments style={{ color: 'var(--primary-color)' }} /> Contacts
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {contacts.length === 0 ? (
            <p style={{ padding: '2rem', fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center' }}>No active contacts found.</p>
          ) : (
            contacts.map(c => (
              <div 
                key={c.id} 
                onClick={() => setActiveContact(c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  background: activeContact?.id === c.id ? '#f3f4f6' : 'transparent',
                  transition: 'background 0.2s ease'
                }}
              >
                {c.avatar ? (
                  <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${c.avatar}`} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                ) : (
                  <FaUserCircle size={38} style={{ color: 'var(--text-secondary)' }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize' }}>{c.role.replace('_', ' ')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Active Chat Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fafafa' }}>
        {activeContact ? (
          <>
            {/* Active Contact Header */}
            <div style={{
              padding: '1rem 2rem',
              borderBottom: '1px solid var(--border-color)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {activeContact.avatar ? (
                  <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${activeContact.avatar}`} alt="Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
                ) : (
                  <FaUserCircle size={32} style={{ color: 'var(--primary-color)' }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{activeContact.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize' }}>{activeContact.role.replace('_', ' ')}</span>
                </div>
              </div>
              
              {['super_admin', 'school_admin'].includes(user?.role) && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {/* Gmail/Email shortcut */}
                  {activeContact.email && (
                    <a 
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${activeContact.email}&su=Message from School Admin&body=Hello ${activeContact.name},`}
                      target="_blank" 
                      rel="noreferrer"
                      className="btn"
                      style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        borderRadius: '0.375rem',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                      title="Send Email via Gmail"
                    >
                      <FaEnvelope /> Gmail
                    </a>
                  )}

                  {/* WhatsApp shortcut */}
                  {activeContact.phone && (
                    <a 
                      href={`https://api.whatsapp.com/send?phone=${activeContact.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="btn"
                      style={{
                        background: '#d1fae5',
                        color: '#059669',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        borderRadius: '0.375rem',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                      title="Send WhatsApp Message"
                    >
                      <FaWhatsapp /> WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Message Stream */}
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div 
                    key={msg.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '65%',
                      padding: '0.75rem 1.25rem',
                      borderRadius: isMe ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                      background: isMe ? 'var(--primary-color)' : '#fff',
                      color: isMe ? '#fff' : 'var(--text-primary)',
                      boxShadow: 'var(--shadow-sm)',
                      fontSize: '0.9rem',
                      position: 'relative'
                    }}
                  >
                    <p style={{ margin: 0 }}>{msg.message}</p>
                    <span style={{
                      display: 'block',
                      fontSize: '0.65rem',
                      color: isMe ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                      textAlign: 'right',
                      marginTop: '0.25rem'
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef}></div>
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} style={{
              padding: '1rem 2rem',
              background: '#fff',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '1rem'
            }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Type your message..." 
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                style={{ borderRadius: '2rem' }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0, justifyContent: 'center' }}>
                <FaPaperPlane />
              </button>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            gap: '1rem'
          }}>
            <FaComments size={50} />
            <span>Select a contact to start messaging</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
