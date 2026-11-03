import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (isRegister) await register(form); else await login({ email: form.email, password: form.password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <div className="auth-page"><div className="auth-visual"><Link to="/" className="brand auth-brand"><span className="brand-mark"><Search size={18}/></span><span>campus<span className="brand-accent">find</span></span></Link><div className="auth-visual-copy"><span className="section-kicker">A COMMUNITY THAT CARES</span><h1>Some things<br/>are too important<br/>to <em>stay lost.</em></h1><p>One simple place for your campus to look out for each other.</p></div><div className="auth-visual-footer"><span>LOST & FOUND, MADE SIMPLE</span><span>01 / 01</span></div></div><div className="auth-form-side"><div className="auth-form-wrap"><Link to="/" className="back-link"><ArrowLeft size={15}/> Back to explore</Link><span className="section-kicker">{isRegister ? 'JOIN THE COMMUNITY' : 'WELCOME BACK'}</span><h2>{isRegister ? 'Create your account.' : 'Good to see you again.'}</h2><p className="auth-subtitle">{isRegister ? 'Create an account to report and recover campus belongings.' : 'Log in to manage your reports and claims.'}</p>
    <form className="form-stack" onSubmit={submit}>{isRegister && <label className="form-label">Full name<input required minLength="2" maxLength="60" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aanya Sharma"/></label>}<label className="form-label">College email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@college.edu" autoComplete="email"/></label><label className="form-label">Password<input required type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} autoComplete={isRegister ? 'new-password' : 'current-password'}/></label>{error && <div className="notice notice-error">{error}</div>}<button className="button button-primary button-full button-large" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'} <ArrowRight size={17}/></button></form>
    <div className="auth-switch">{isRegister ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New to CampusFind? <Link to="/register">Create an account</Link></>}</div>
    {!isRegister && <div className="demo-credentials"><div><ShieldCheck size={17}/><strong>Demo administrator</strong></div><span>Email: admin@campusfind.edu</span><span>Password: Admin123!</span><small>Use these credentials to explore the admin dashboard.</small></div>}
    <div className="auth-note">By continuing, you agree to use CampusFind responsibly and respect other students' privacy.</div></div></div></div>;
}
