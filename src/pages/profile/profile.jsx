import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";   
import './profile.css';

export const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Perfil de Usuario</h1>
      </div>
      <div className="profile-info">
        <p>
          <span className="profile-label">Email:</span>
          <span>{user.email}</span>
        </p>
        <p>
          <span className="profile-label">Cuenta creada:</span>
          <span>{user.metadata.creationTime}</span>
        </p>
        <p>
          <span className="profile-label">Último inicio de sesión:</span>
          <span>{user.metadata.lastSignInTime}</span>
        </p>
      </div>
    </div>
  );
}