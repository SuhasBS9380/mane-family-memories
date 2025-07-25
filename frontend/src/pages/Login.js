import React, { useState } from 'react';
import { login } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ onAuth }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.token);
      onAuth();
      navigate('/'); // Redirect to Family Tree
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required type="email" />
        <input name="password" placeholder="Password" value={form.password} onChange={handleChange} required type="password" />
        <button type="submit">Login</button>
      </form>
      {error && <div style={{color:'red'}}>{error}</div>}
      <div>
        <span>Don't have an account? </span>
        <Link to="/register">Register here</Link>
      </div>
    </div>
  );
} 