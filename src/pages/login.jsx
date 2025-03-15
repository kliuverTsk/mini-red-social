import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const [error, setError] = useState("");
    const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch (error) {
      setError(
        error.code === 'auth/wrong-password' ? 'Contraseña incorrecta' :
        error.code === 'auth/user-not-found' ? 'Usuario no encontrado' :
        'Error al iniciar sesión'
      );
    }
  }

  return (
    <div>
        <h1>Login</h1>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Email" onChange={(e)=> setEmail(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e)=> setPassword(e.target.value)}/>
            <button type="submit">Login</button>
        </form>
        <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
    </div>
  );
};