import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";   

export const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div>
      <h1>Perfil</h1>
      <div>
        <p>Email: {user.email}</p>
        <p>Cuenta creada: {user.metadata.creationTime}</p>
        <p>Último inicio de sesión: {user.metadata.lastSignInTime}</p>
      </div>
    </div>
  );
}