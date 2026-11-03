import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RequireAuth({ children, admin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-page"><span className="spinner"/>Checking your session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace/>;
  return children;
}
