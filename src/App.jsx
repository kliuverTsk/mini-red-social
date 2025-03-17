import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/home/Home';
import { Login } from './pages/login-register/login';
import { Register } from './pages/login-register/register';
import { Navbar } from './components/navbar/navbar';
import { Profile } from './pages/profile/profile';

function App() {
  return (
    <AuthProvider>
      <Router basename="/mini-red-social">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
