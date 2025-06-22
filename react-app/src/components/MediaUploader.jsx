import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import '../styles/_mediauploader.css';

const generateVideoThumbnail = (file) => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('video/')) {
            resolve(null);
            return;
        }

        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;

        video.onloadeddata = () => {
            // Seek to a frame that is likely to be interesting, e.g., 1 second in
            video.currentTime = 1; 
        };

        video.onseeked = () => {
            // Wait for the next frame to be painted for accuracy
            requestAnimationFrame(() => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                resolve(canvas.toDataURL('image/jpeg'));
                URL.revokeObjectURL(video.src); // Clean up memory
            });
        };

        video.onerror = () => {
            console.error("Erreur lors du chargement de la vidéo pour la miniature.");
            resolve(null); // Return null on error
            URL.revokeObjectURL(video.src);
        };
        
        video.load();
    });
};

function MediaUploader({ eventId, apiBaseUrl, onUploadComplete }) {
    const [files, setFiles] = useState([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const handleFiles = async (selectedFiles) => {
        if (!selectedFiles) return;

        const newFilesPromises = Array.from(selectedFiles).map(async (file) => {
            let preview = null;
            let thumbnailData = null; // We will store the base64 data for upload
            if (file.type.startsWith('image/')) {
                preview = URL.createObjectURL(file);
            } else if (file.type.startsWith('video/')) {
                const thumbnailResult = await generateVideoThumbnail(file);
                if (thumbnailResult) {
                    preview = thumbnailResult;
                    thumbnailData = thumbnailResult;
                }
            }
            return { file, preview, thumbnailData };
        });
        
        const newFiles = await Promise.all(newFilesPromises);
        setFiles(prev => [...prev, ...newFiles.filter(f => f.preview !== null)]);
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    const handleFileChange = (e) => {
        handleFiles(e.target.files);
        e.target.value = null; // Reset input to allow selecting the same file again
    };

    const removeFile = (indexToRemove) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        
        setUploading(true);
        setError('');
        setUploadProgress(0);
        
        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('event_id', eventId);
            formData.append('media', files[i].file);

            if (files[i].thumbnailData) {
                const thumbnailBlob = await (await fetch(files[i].thumbnailData)).blob();
                formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
            }

            try {
                const config = {
                    withCredentials: true,
                    onUploadProgress: (progressEvent) => {
                        const { loaded, total } = progressEvent;
                        if (total) {
                            const fileProgress = loaded / total;
                            const totalProgress = Math.round(((i + fileProgress) / files.length) * 100);
                            setUploadProgress(totalProgress);
                        }
                    }
                };
                await axios.post(`${apiBaseUrl}/add_event_media.php`, formData, config);
            } catch (err) {
                const serverMessage = err.response?.data?.message;
                setError(serverMessage || `Erreur sur le fichier ${files[i].file.name}. Vérifiez la console pour plus de détails.`);
                console.error("Erreur d'upload:", err.response?.data || err);
                setUploading(false);
                return;
            }
        }
        
        // Let the user see 100% for a moment
        setTimeout(() => {
            setUploading(false);
            setFiles([]);
            onUploadComplete(); // Notify parent to refresh
            setUploadProgress(0);
        }, 500);
    };
    
    return (
        <div className="media-uploader">
            <input 
                type="file" 
                ref={inputRef}
                multiple 
                onChange={handleFileChange} 
                accept="image/*,video/*"
                style={{ display: 'none' }} 
            />
            {isMobile ? (
                <div className="upload-actions-mobile">
                    <button onClick={() => inputRef.current.click()}>Ajouter des photos ou vidéos</button>
                </div>
            ) : (
                <div
                    className={`drop-zone ${isDragActive ? 'is-active' : ''}`}
                    onClick={() => inputRef.current.click()}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                >
                    <p>Glissez-déposez des fichiers ici, ou cliquez pour sélectionner.</p>
                </div>
            )}

            {files.length > 0 && (
                <>
                    <div className="file-previews">
                        {files.map((f, index) => (
                            <div key={index} className="preview-item">
                                {f.preview ? (
                                    <img src={f.preview} alt="Prévisualisation" />
                                ) : (
                                    <div className="file-info"><span>{f.file.name}</span></div>
                                )}
                                <button className="remove-file-button" onClick={() => removeFile(index)}>×</button>
                            </div>
                        ))}
                    </div>
                    <div className="upload-actions">
                        <button className="upload-button" onClick={handleUpload} disabled={uploading || files.length === 0}>
                            {uploading ? `Envoi...` : `Envoyer ${files.length} fichier(s)`}
                        </button>
                    </div>
                </>
            )}

            {uploading && (
                <div className="upload-progress">
                    <p>Envoi de {files.length} fichier(s)</p>
                    <div className="progress-bar">
                        <div className="progress-bar-inner" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                </div>
            )}
            {error && <p className="error-message" style={{color: 'var(--led-red)', textAlign: 'right', marginTop: '1rem'}}>{error}</p>}
        </div>
    );
}

export default MediaUploader;