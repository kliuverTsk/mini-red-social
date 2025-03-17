import { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./navbar.css"

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate()
  
  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.log(error)
    }
  }

  return (
    user ? (
      <div className="navbar">
        <Link to="/"><h1>DevShare</h1></Link>
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>
        <button onClick={handleLogout}>cerrar sesion</button>
      </div>
    ) : (
      <div className="navbar">
        <Link to="/"><h1>DevShare</h1></Link>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    )
  );
}