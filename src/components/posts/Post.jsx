import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './Post.css';

export const Post = ({ post }) => {
    const { user } = useContext(AuthContext);

    return (
        <div className="post">
            <p>{post.content}</p>
            {post.imageUrl && (
                <div className="post-image">
                    <img src={post.imageUrl} alt="Post content" />
                </div>
            )}
            <small>Por: {post.authorEmail}</small><br />
            <small>Fecha: {post.createdAt?.toDate().toLocaleString()}</small>
            
            <div>
                <button 
                    onClick={() => handleLike(post.id, post.likes || [])}
                    className={post.likes?.includes(user?.uid) ? 'liked' : ''}
                >
                    {post.likes?.includes(user?.uid) ? '❤️' : '🤍'}
                </button>
                <span>{post.likes?.length || 0} likes</span>
            </div>
        </div>
    );
};