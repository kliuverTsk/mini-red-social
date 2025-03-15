import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CreatePost } from '../components/posts/CreatePost';
import { PostList } from '../components/posts/PostList';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="home">
      <h1>DevShare Feed</h1>
      {user ? (
        <div className="feed">
          <CreatePost />
          <PostList />
          <p>Welcome, {user.email}</p>
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