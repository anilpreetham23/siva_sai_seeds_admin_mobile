import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'farmer') {
    toast.error('This mobile app is restricted to Managers and Admins. Please use the separate Farmer Mobile App.');
    logout();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

