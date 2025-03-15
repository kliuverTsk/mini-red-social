import { useState, useEffect, useContext } from 'react';
import { db } from '../../firebase/config';
// Primero, actualizar los imports agregando getDocs
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import './PostList.css';

export const PostList = () => {
    const [posts, setPosts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [commentContent, setCommentContent] = useState('');
    const [showComments, setShowComments] = useState({});
    const [comments, setComments] = useState({});
    // Agregar estos estados que estaban fuera del componente
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState('');
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
                ...doc.data(),
                likes: doc.data().likes || []
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

    // Modificar el useEffect de los posts
    useEffect(() => {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const postData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPosts(postData);

            // Cargar comentarios para todos los posts
            postData.forEach(post => {
                loadComments(post.id);
            });
        });

        return () => unsubscribe();
    }, []);

    // Eliminar el useEffect anterior de comentarios ya que ahora los cargamos con los posts

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
                            {/* Agregamos el contador de comentarios */}
                            ({comments[post.id]?.length || 0})
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
                                                <div>
                                                    <textarea
                                                        value={editCommentContent}
                                                        onChange={(e) => setEditCommentContent(e.target.value)}
                                                    />
                                                    <button onClick={() => handleEditComment(post.id, comment.id)}>
                                                        Guardar
                                                    </button>
                                                    <button onClick={() => {
                                                        setEditingCommentId(null);
                                                        setEditCommentContent('');
                                                    }}>Cancelar</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p>{comment.content}</p>
                                                    <small>Por: {comment.authorEmail}</small>
                                                    <small>Fecha: {comment.createdAt?.toDate().toLocaleString()}</small>
                                                    
                                                    <div>
                                                        <button 
                                                            onClick={() => handleCommentLike(post.id, comment.id, comment.likes)}
                                                            className={comment.likes?.includes(user?.uid) ? 'liked' : ''}
                                                        >
                                                            {comment.likes?.includes(user?.uid) ? '❤️' : '🤍'}
                                                        </button>
                                                        <span>{comment.likes?.length || 0} likes</span>
                                                    </div>

                                                    {user && user.uid === comment.authorId && (
                                                        <>
                                                            <button onClick={() => handleDeleteComment(post.id, comment.id)}>
                                                                Eliminar comentario
                                                            </button>
                                                            <button onClick={() => {
                                                                setEditingCommentId(comment.id);
                                                                setEditCommentContent(comment.content);
                                                            }}>Editar comentario</button>
                                                        </>
                                                    )}
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
        </div>
    );
};