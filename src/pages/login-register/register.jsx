import { useState, useContext } from "react";
import { useNavigate,Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import './login-register.css'

export const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { register } = useContext(AuthContext);
    const navigate = useNavigate(); // Agregar esto arriba

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validaciones básicas
        if (!email || !password) {
            setError('Por favor complete todos los campos');
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Por favor ingrese un email válido');
            return;
        }   

        // Validación de contraseña
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            await register(email, password);
            alert('¡Registro exitoso! Por favor inicia sesión');
            navigate('/login');
        } catch (error) {
            console.log(error.code);
            setError(
                error.code === 'auth/email-already-in-use' ? 'El email ya está registrado' :
                error.code === 'auth/weak-password' ? 'La contraseña debe tener al menos 6 caracteres' :
                'Error al registrar usuario'
            );
        }
    }

    return (<>
        <div className="container-loginRegister">
                <h1>Register</h1>
                {error && <p style={{color: 'red'}}>{error}</p>}
                <form onSubmit={handleSubmit}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email"/>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password"/>
                <button type="submit">Register</button>
                <p>ya tienes una cuenta? <Link to={"/login"}>haz login aqui</Link></p>
            </form>
            
        </div>
    </>)
}

