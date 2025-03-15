import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const CreatePost = () => {
    const [content, setContent] = useState('');
    const { user } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // En el handleSubmit, modificar el objeto que se guarda:
            await addDoc(collection(db, 'posts'), {
                content,
                authorId: user.uid,
                authorEmail: user.email,
                createdAt: serverTimestamp(),
                likes: [], // Array que guardará los IDs de usuarios que dieron like
            });
            setContent('');
        } catch (error) {
            console.log('Error al crear post:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="¿Qué estás pensando?"
            />
            <button type="submit">Publicar</button>
        </form>
    );
};