import { useState, useEffect, useContext } from 'react';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';

export const PostList = () => {
    const [posts, setPosts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [commentContent, setCommentContent] = useState('');
    const [showComments, setShowComments] = useState({});
    const [comments, setComments] = useState({}); // Movido al inicio
    const {user} = useContext(AuthContext);

    // Función loadComments movida fuera del JSX
    const loadComments = async (postId) => {
        const q = query(
            collection(db, 'posts', postId, 'comments'),
            orderBy('createdAt', 'desc')
        );
        
        return onSnapshot(q, (snapshot) => {
            const commentData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(prev => ({
                ...prev,
                [postId]: commentData
            }));
        });
    };

    // useEffect para los comentarios
    useEffect(() => {
        const unsubscribers = {};
        
        posts.forEach(post => {
            if (showComments[post.id]) {
                // Asegurarnos de que loadComments devuelve una función
                const unsubscribe = loadComments(post.id);
                if (typeof unsubscribe === 'function') {
                    unsubscribers[post.id] = unsubscribe;
                }
            }
        });
    
        return () => {
            // Solo ejecutar unsubscribe en las funciones válidas
            Object.values(unsubscribers).forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
        };
    }, [posts, showComments]);

    const handleComment = async (postId) => {
        try {
            const commentRef = collection(db, 'posts', postId, 'comments');
            await addDoc(commentRef, {
                content: commentContent,
                authorId: user.uid,
                authorEmail: user.email,
                createdAt: serverTimestamp()
            });
            setCommentContent('');
        } catch (error) {
            console.log('Error al comentar:', error);
        }
    };
    const handleEdit = async (postId) => {
        try {
            await updateDoc(doc(db, 'posts', postId), {
                content: editContent
            });
            setEditingId(null);
            setEditContent('');
        } catch (error) {
            console.log('Error al editar:', error);
        }
    };



    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este posts?')){
            try {
                await deleteDoc(doc(db, 'posts', id));
            } catch (error) {
                console.log(error);
            }
        }
        
    };

    const handleLike = async (postId, currentLikes) => {
        try {
            const newLikes = currentLikes.includes(user.uid)
                ? currentLikes.filter(id => id !== user.uid) // quitar like
                : [...currentLikes, user.uid];               // agregar like
            
            await updateDoc(doc(db, 'posts', postId), {
                likes: newLikes
            });
        } catch (error) {
            console.log('Error al dar like:', error);
        }
    };

    useEffect(() => {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
                
            }));
            setPosts(postData);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div>
            {posts.map(post => (
                <div key={post.id} className="post">
                    {editingId === post.id ? (
                        <div>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                            />
                            <button onClick={() => handleEdit(post.id)}>Guardar</button>
                            <button onClick={() => {
                                setEditingId(null);
                                setEditContent('');
                            }}>Cancelar</button>
                        </div>
                    ) : (
                        <>
                            <p>{post.content}</p>
                            <small>Por: {post.authorEmail}</small><br />
                            <small>Fecha: {post.createdAt?.toDate().toLocaleString()}</small>
                            
                            {/* Agregamos el botón de like y contador */}
                            <div>
                                <button 
                                    onClick={() => handleLike(post.id, post.likes || [])}
                                    className={post.likes?.includes(user?.uid) ? 'liked' : ''}
                                >
                                    {post.likes?.includes(user?.uid) ? '❤️' : '🤍'}
                                </button>
                                <span>{post.likes?.length || 0} likes</span>
                            </div>

                            {user && user.uid === post.authorId && (
                                <>
                                    <button onClick={() => handleDelete(post.id)}>Eliminar post</button>
                                    <button onClick={() => {
                                        setEditingId(post.id);
                                        setEditContent(post.content);
                                    }}>Editar</button>
                                </>
                            )}
                        </>
                    )}
                    
                    {/* Agregamos la sección de comentarios */}
                    <div className="comments-section">
                        <button onClick={() => setShowComments({
                            ...showComments,
                            [post.id]: !showComments[post.id]
                        })}>
                            {showComments[post.id] ? 'Ocultar comentarios' : 'Mostrar comentarios'}
                        </button>

                        {showComments[post.id] && (
                            <div className="comments">
                                <div className="comment-form">
                                    <textarea
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder="Escribe un comentario..."
                                    />
                                    <button onClick={() => handleComment(post.id)}>
                                        Comentar
                                    </button>
                                </div>
                                <div className="comments-list">
                                    {comments[post.id]?.map(comment => (
                                        <div key={comment.id} className="comment">
                                            <p>{comment.content}</p>
                                            <small>Por: {comment.authorEmail}</small>
                                            <small>Fecha: {comment.createdAt?.toDate().toLocaleString()}</small>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};