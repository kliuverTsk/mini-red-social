import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './CreatePost.css';

export const CreatePost = () => {
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const { user } = useContext(AuthContext);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let imageUrl = null;
            if (image) {
                const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}-${image.name}`);
                await uploadBytes(imageRef, image);
                imageUrl = await getDownloadURL(imageRef);
            }

            await addDoc(collection(db, 'posts'), {
                content,
                authorId: user.uid,
                authorEmail: user.email,
                createdAt: serverTimestamp(),
                likes: [],
                imageUrl
            });

            setContent('');
            setImage(null);
            setImagePreview(null);
        } catch (error) {
            console.log('Error al crear post:', error);
        }
    };

    return (
        <div className="create-post-container">
            <form onSubmit={handleSubmit} className="create-post-form">
                <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="¿Qué estás pensando?"
                />
                <div className="image-upload">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                        id="image-input"
                    />
                    <label htmlFor="image-input" className="image-upload-label">
                        📷 Agregar imagen
                    </label>
                </div>
                {imagePreview && (
                    <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button 
                            type="button" 
                            onClick={() => {
                                setImage(null);
                                setImagePreview(null);
                            }}
                            className="remove-image"
                        >
                            ❌
                        </button>
                    </div>
                )}
                <button type="submit" className="create-post-button">Publicar</button>
            </form>
        </div>
    );
};