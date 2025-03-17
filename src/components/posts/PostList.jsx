import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { 
    collection, 
    query, 
    orderBy, 
    getDocs, 
    getDoc, 
    deleteDoc,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    onSnapshot,
    startAfter,
    limit,
    where
} from 'firebase/firestore';
import './PostList.css';

export const PostList = () => {
    const [posts, setPosts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [commentContent, setCommentContent] = useState('');
    const [showComments, setShowComments] = useState({});
    const [comments, setComments] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastPost, setLastPost] = useState(null);
    const [postListeners, setPostListeners] = useState({});
    const {user} = useContext(AuthContext);

    // Modificar la dependencia del useCallback
    const setupPostListener = useCallback((postId) => {
        if (postListeners[postId]) return;

        const postRef = doc(db, 'posts', postId);
        const unsubscribe = onSnapshot(postRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const postData = {
                    id: docSnapshot.id,
                    ...docSnapshot.data(),
                    likes: docSnapshot.data().likes || []
                };
                
                setPosts(prevPosts => {
                    const index = prevPosts.findIndex(p => p.id === postId);
                    if (index === -1) return prevPosts;
                    
                    const newPosts = [...prevPosts];
                    newPosts[index] = postData;
                    return newPosts;
                });
            } else {
                setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
                if (postListeners[postId]) {
                    postListeners[postId]();
                    setPostListeners(prev => {
                        const newListeners = { ...prev };
                        delete newListeners[postId];
                        return newListeners;
                    });
                }
            }
        }, error => {
            console.error('Error en el listener:', error);
        });

        setPostListeners(prev => ({
            ...prev,
            [postId]: unsubscribe
        }));

        return unsubscribe;
    }, []); // Eliminar postListeners de las dependencias

    // Añadir nuevo estado para el conteo de comentarios
    const [commentCounts, setCommentCounts] = useState({});

    // Modificar loadComments para incluir el conteo
    const loadComments = useCallback(async (postId) => {
        const q = query(
            collection(db, 'posts', postId, 'comments'),
            orderBy('createdAt', 'desc')
        );
        
        return onSnapshot(q, (snapshot) => {
            const commentData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                likes: doc.data().likes || []
            }));
            setComments(prev => ({
                ...prev,
                [postId]: commentData
            }));
            // Actualizar el conteo de comentarios
            setCommentCounts(prev => ({
                ...prev,
                [postId]: snapshot.size
            }));
        });
    }, []);

    // Añadir useEffect para cargar el conteo inicial de comentarios
    useEffect(() => {
        posts.forEach(post => {
            if (!commentCounts[post.id]) {
                loadComments(post.id);
            }
        });
    }, [posts]);

 
    useEffect(() => {
        posts.forEach(post => {
            if (!commentCounts[post.id]) {
                loadComments(post.id);
            }
        });
    }, [posts]);

    useEffect(() => {
        const q = query(
            collection(db, 'posts'), 
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                likes: doc.data().likes || []
            }));
            setPosts(postData);
            setLastPost(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === 5);

            postData.forEach(post => {
                setupPostListener(post.id);
            });
        });

        return () => {
            unsubscribe();
            Object.values(postListeners).forEach(listener => {
                if (typeof listener === 'function') {
                    listener();
                }
            });
            setPostListeners({});
        };
    }, [setupPostListener]);

    useEffect(() => {
        const unsubscribers = {};
        
        posts.forEach(post => {
            if (showComments[post.id] && !unsubscribers[post.id]) {
                const unsubscribe = loadComments(post.id);
                if (typeof unsubscribe === 'function') {
                    unsubscribers[post.id] = unsubscribe;
                }
            }
        });
    
        return () => {
            Object.values(unsubscribers).forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
        };
    }, [posts, showComments, loadComments]);

    const loadMorePosts = async () => {
        if (!lastPost || loading) return;
        
        try {
            setLoading(true);
            const q = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc'),
                startAfter(lastPost),
                limit(5)
            );
            
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                setHasMore(false);
                return;
            }

            const newPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                likes: doc.data().likes || []
            }));
            
            setPosts(prevPosts => [...prevPosts, ...newPosts]);
            setLastPost(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === 5);

            newPosts.forEach(post => {
                if (!postListeners[post.id]) {
                    setupPostListener(post.id);
                }
            });
        } catch (error) {
            console.error('Error al cargar más posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleComment = async (postId) => {
        if (!commentContent.trim()) return;
        
        try {
            const commentRef = collection(db, 'posts', postId, 'comments');
            await addDoc(commentRef, {
                content: commentContent,
                authorId: user.uid,
                authorEmail: user.email,
                createdAt: serverTimestamp(),
                likes: []
            });
            setCommentContent('');
        } catch (error) {
            console.log('Error al comentar:', error);
        }
    };

    const handleEdit = async (postId) => {
        if (!editContent.trim()) return;
        
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
        if (window.confirm('¿Estás seguro de que deseas eliminar este post?')) {
            try {
                await deleteDoc(doc(db, 'posts', id));
            } catch (error) {
                console.log('Error al eliminar:', error);
            }
        }
    };

    const handleLike = async (postId, currentLikes = []) => {
        try {
            const postRef = doc(db, 'posts', postId);
            const postSnap = await getDoc(postRef);
            
            if (!postSnap.exists()) {
                console.log('El post ya no existe');
                setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
                return;
            }

            const newLikes = currentLikes.includes(user.uid)
                ? currentLikes.filter(id => id !== user.uid)
                : [...currentLikes, user.uid];
            
            await updateDoc(postRef, {
                likes: newLikes
            });
        } catch (error) {
            console.error('Error al dar like:', error);
            if (error.code === 'not-found') {
                setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
            }
        }
    };

    const handleCommentLike = async (postId, commentId, currentLikes = []) => {
        try {
            const newLikes = currentLikes.includes(user.uid)
                ? currentLikes.filter(id => id !== user.uid)
                : [...currentLikes, user.uid];
            
            await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
                likes: newLikes
            });
        } catch (error) {
            console.log('Error al dar like al comentario:', error);
        }
    };

    const handleEditComment = async (postId, commentId) => {
        if (!editCommentContent.trim()) return;
        
        try {
            await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
                content: editCommentContent
            });
            setEditingCommentId(null);
            setEditCommentContent('');
        } catch (error) {
            console.log('Error al editar comentario:', error);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
            try {
                await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
            } catch (error) {
                console.log('Error al eliminar comentario:', error);
            }
        }
    };

    return (
        <div className="posts-container">
            {posts.map(post => (
                <div key={post.id} className="post">
                    {editingId === post.id ? (
                        <div className="edit-form">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="Edita tu post..."
                            />
                            <div className="edit-buttons">
                                <button onClick={() => handleEdit(post.id)}>Guardar</button>
                                <button onClick={() => {
                                    setEditingId(null);
                                    setEditContent('');
                                }}>Cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="post-content">{post.content}</p>
                            {post.imageUrl && (
                                <div className="post-image">
                                    <img src={post.imageUrl} alt="Contenido del post" />
                                </div>
                            )}
                            <div className="post-info">
                                <small>Por: {post.authorEmail}</small>
                                <small>Fecha: {post.createdAt?.toDate().toLocaleString()}</small>
                            </div>
                            
                            <div className="post-actions">
                                <button 
                                    onClick={() => handleLike(post.id, post.likes)}
                                    className={`like-button ${post.likes?.includes(user?.uid) ? 'liked' : ''}`}
                                >
                                    {post.likes?.includes(user?.uid) ? '❤️' : '🤍'}
                                    <span>{post.likes?.length || 0}</span>
                                </button>

                                {user && user.uid === post.authorId && (
                                    <div className="author-actions">
                                        <button onClick={() => handleDelete(post.id)}>Eliminar</button>
                                        <button onClick={() => {
                                            setEditingId(post.id);
                                            setEditContent(post.content);
                                        }}>Editar</button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    
                    <div className="comments-section">
                        <button 
                            className="toggle-comments"
                            onClick={() => setShowComments(prev => ({
                                ...prev,
                                [post.id]: !prev[post.id]
                            }))}
                        >
                            {showComments[post.id] ? 'Ocultar' : 'Mostrar'} comentarios 
                            ({commentCounts[post.id] || 0})
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
                                            {editingCommentId === comment.id ? (
                                                <div className="edit-comment-form">
                                                    <textarea
                                                        value={editCommentContent}
                                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                                    />
                                                    <div className="edit-buttons">
                                                        <button onClick={() => handleEditComment(post.id, comment.id)}>
                                                            Guardar
                                                        </button>
                                                        <button onClick={() => {
                                                            setEditingCommentId(null);
                                                            setEditCommentContent('');
                                                        }}>Cancelar</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p>{comment.content}</p>
                                                    <div className="comment-info">
                                                        <small>Por: {comment.authorEmail}</small>
                                                        <small>Fecha: {comment.createdAt?.toDate().toLocaleString()}</small>
                                                    </div>
                                                    
                                                    <div className="comment-actions">
                                                        <button 
                                                            onClick={() => handleCommentLike(post.id, comment.id, comment.likes)}
                                                            className={`like-button ${comment.likes?.includes(user?.uid) ? 'liked' : ''}`}
                                                        >
                                                            {comment.likes?.includes(user?.uid) ? '❤️' : '🤍'}
                                                            <span>{comment.likes?.length || 0}</span>
                                                        </button>

                                                        {user && user.uid === comment.authorId && (
                                                            <div className="author-actions">
                                                                <button onClick={() => handleDeleteComment(post.id, comment.id)}>
                                                                    Eliminar
                                                                </button>
                                                                <button onClick={() => {
                                                                    setEditingCommentId(comment.id);
                                                                    setEditCommentContent(comment.content);
                                                                }}>Editar</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {hasMore && (
                <button 
                    className="load-more"
                    onClick={loadMorePosts}
                    disabled={loading}
                >
                    {loading ? 'Cargando...' : 'Cargar más'}
                </button>
            )}
        </div>
    );
};

export default PostList;