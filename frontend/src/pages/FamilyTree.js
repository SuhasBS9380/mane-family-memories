import React, { useEffect, useRef, useState } from 'react';
import { fetchTree, addMember } from '../api';
import { DataSet, Network } from 'vis-network/standalone';
import { jwtDecode } from 'jwt-decode';

const RELATIONSHIP_TYPES = [
  'SON_OF', 'WIFE_OF', 'HUSBAND_OF', 'SIBLING_OF'
];

export default function FamilyTree() {
  const containerRef = useRef(null);
  const [tree, setTree] = useState({ nodes: [], edges: [] });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    existingPersonId: '',
    relationshipType: 'SPOUSE_OF',
    newMemberName: '',
    newMemberEmail: '',
    tempPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [tempEmail, setTempEmail] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState(null);

  const token = localStorage.getItem('token');

  const loadTree = () => {
    fetchTree(token)
      .then(res => {
        setTree(res.data);
        setOwnerEmail(res.data.ownerEmail);
      })
      .catch(() => setError('Failed to load tree'));
  };

  useEffect(() => {
    loadTree();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (containerRef.current && tree.nodes.length) {
      const nodes = new DataSet(tree.nodes.map(n => ({ id: n.personId, label: n.name })));
      const edges = new DataSet(tree.edges.map(e => ({ from: e.from, to: e.to, label: e.type })));
      new Network(containerRef.current, { nodes, edges }, {
        layout: { hierarchical: false },
        edges: {
          arrows: {
            to: { enabled: true, scaleFactor: 1 }
          }
        }
      });
    }
  }, [tree]);

  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTempPassword(null);
    setTempEmail(null);
    console.log('Submitting relationshipType:', form.relationshipType); // Debug log
    try {
      const res = await addMember(form, token);
      setShowForm(false);
      setForm({ existingPersonId: '', relationshipType: 'SPOUSE_OF', newMemberName: '', newMemberEmail: '', tempPassword: '' });
      loadTree();
      if (res.data.tempPassword && form.newMemberEmail) {
        setTempPassword(res.data.tempPassword);
        setTempEmail(form.newMemberEmail);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  // If tree is empty, show form to add the first person (no dropdowns)
  const isTreeEmpty = tree.nodes.length === 0;

  // Determine if the user is the owner
  let isOwner = false;
  try {
    const token = localStorage.getItem('token');
    if (token && ownerEmail) {
      const decoded = jwtDecode(token);
      isOwner = decoded.email === ownerEmail;
    }
  } catch {}

  let isAdmin = false;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      console.log('Decoded JWT:', decoded);
      isAdmin = decoded.isAdmin === true || decoded.isAdmin === 'true';
      console.log('isAdmin:', isAdmin);
    }
  } catch {}

  return (
    <div className="main-container">
      <div className="header">
        <div className="header-content">
          <h2>🌳 Family Tree</h2>
          <div>
            {isAdmin && <span style={{marginRight: 15, fontSize: 14}}>Admin Mode</span>}
            <button className="logout-btn" onClick={() => {localStorage.removeItem('token'); window.location.reload();}}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="content">
        {error && <div className="error-message">{error}</div>}
        
        {tempPassword && tempEmail && (
          <div className="temp-credentials">
            <h4>✅ New Member Added Successfully!</h4>
            <p><strong>Email:</strong> {tempEmail}</p>
            <p><strong>Temporary Password:</strong> {tempPassword}</p>
            <p>Share these credentials with the new family member so they can log in.</p>
          </div>
        )}

        <div className="tree-container">
          <div ref={containerRef} style={{ height: 500, width: '100%' }} />
        </div>

        {isAdmin && (
          <div className="tree-controls">
            <button 
              className="btn btn-primary" 
              onClick={() => setShowForm(f => !f)}
            >
              {showForm ? 'Cancel' : isTreeEmpty ? 'Add First Person' : 'Add Family Member'}
            </button>
          </div>
        )}

        {showForm && isAdmin && (
          <div className="form-container">
            <h3>{isTreeEmpty ? 'Add First Family Member' : 'Add New Family Member'}</h3>
            <form onSubmit={handleSubmit}>
              {!isTreeEmpty && (
                <div className="form-row">
                  <select name="existingPersonId" value={form.existingPersonId} onChange={handleFormChange} required>
                    <option value="">Select Existing Person</option>
                    {tree.nodes.map(n => (
                      <option key={n.personId} value={n.personId}>{n.name}</option>
                    ))}
                  </select>
                  <select name="relationshipType" value={form.relationshipType} onChange={handleFormChange} required>
                    <option value="SON_OF">Son Of</option>
                    <option value="HUSBAND_OF">Husband Of</option>
                    <option value="WIFE_OF">Wife Of</option>
                    <option value="SIBLING_OF">Sibling Of</option>
                  </select>
                </div>
              )}
              <div className="form-row">
                <input 
                  name="newMemberName" 
                  placeholder="New Member Name" 
                  value={form.newMemberName} 
                  onChange={handleFormChange} 
                  required 
                />
                <input 
                  name="newMemberEmail" 
                  placeholder="New Member Email (optional)" 
                  value={form.newMemberEmail} 
                  onChange={handleFormChange} 
                />
                <input 
                  name="tempPassword" 
                  placeholder="Temporary Password" 
                  value={form.tempPassword} 
                  onChange={handleFormChange} 
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Adding...' : isTreeEmpty ? 'Add First Person' : 'Add Member'}
              </button>
            </form>
          </div>
        )}

        {!isAdmin && (
          <div style={{textAlign: 'center', marginTop: 30, padding: 20, background: '#f8f9fa', borderRadius: 8}}>
            <p>You can view the family tree but only administrators can add new members.</p>
          </div>
        )}
      </div>
    </div>
  );
} 