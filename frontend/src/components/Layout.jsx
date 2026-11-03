import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, CircleUserRound, Compass, LogOut, Plus, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/'); };
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand"><span className="brand-mark"><Search size={19} strokeWidth={2.7}/></span><span>campus<span className="brand-accent">find</span></span></Link>
          <nav className="main-nav">
            <NavLink to="/" end>Explore</NavLink>
            {user && <NavLink to="/dashboard">My activity</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin"><ShieldCheck size={15}/> Admin</NavLink>}
          </nav>
          <div className="top-actions">
            {user ? <>
              <Link className="nav-user" to="/dashboard"><span className="avatar">{user.name?.charAt(0)?.toUpperCase()}</span><span className="nav-user-name">{user.name.split(' ')[0]}</span></Link>
              <button className="icon-button" title="Sign out" onClick={signOut}><LogOut size={17}/></button>
              <Link className="button button-primary button-small" to="/report"><Plus size={16}/> Report item</Link>
            </> : <>
              <Link className="button button-ghost button-small" to="/login">Log in</Link>
              <Link className="button button-primary button-small" to="/register">Create account</Link>
            </>}
          </div>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer"><div className="footer-inner"><Link to="/" className="brand footer-brand"><span className="brand-mark"><Search size={16}/></span><span>campus<span className="brand-accent">find</span></span></Link><span>Helping campus belongings find their way home.</span><span>CampusFind · Lost & Found Portal</span></div></footer>
    </div>
  );
}
