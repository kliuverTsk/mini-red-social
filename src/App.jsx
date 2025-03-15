import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { Navbar } from './components/navbar/navbar';
import { Profile } from './pages/profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile/>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
