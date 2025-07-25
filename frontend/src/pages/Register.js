import React, { useState } from 'react';
import { register } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register({ onAuth }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await register(form);
      localStorage.setItem('token', res.data.token);
      onAuth();
      navigate('/'); // Redirect to Family Tree
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required type="email" />
        <input name="password" placeholder="Password" value={form.password} onChange={handleChange} required type="password" />
        <button type="submit">Register</button>
      </form>
      {error && <div style={{color:'red'}}>{error}</div>}
      <div>
        <span>Already have an account? </span>
        <Link to="/login">Login here</Link>
      </div>
    </div>
  );
} 