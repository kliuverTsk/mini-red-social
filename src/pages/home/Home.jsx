import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { CreatePost } from '../../components/posts/CreatePost';
import { PostList } from '../../components/posts/PostList';
import './Home.css'

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="home">
      
      {user ? (
        <div className="feed">
          <h1>DevShare Feed</h1>
          <CreatePost />
          <PostList />
        </div>
      ) : (
        <div className="welcome">
          <h2>Welcome to DevShare</h2>
          <p>Inicie sesión para ver y compartir publicaciones.</p>
        </div>
      )}
    </div>
  );
};

export default Home;