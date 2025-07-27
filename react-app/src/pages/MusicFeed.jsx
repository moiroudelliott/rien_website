import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/_musicfeed.css';

const MusicFeed = ({ currentUser }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [newPost, setNewPost] = useState({
        text_content: '',
        spotify_url: ''
    });

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const fetchPosts = useCallback(async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/get_music_feed.php`, { 
                withCredentials: true 
            });
            setPosts(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération du feed:", error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!newPost.spotify_url.trim()) {
            alert('Veuillez entrer un lien Spotify');
            return;
        }

        setPosting(true);
        try {
            await axios.post(`${apiBaseUrl}/post_music.php`, newPost, { 
                withCredentials: true 
            });
            
            setNewPost({ text_content: '', spotify_url: '' });
            fetchPosts(); // Recharger le feed
        } catch (error) {
            console.error("Erreur lors de l'ajout du post:", error);
            alert('Erreur lors de l\'ajout du post');
        } finally {
            setPosting(false);
        }
    };

    const toggleLike = async (postId) => {
        console.log("🔄 Tentative de like/unlike pour le post:", postId);
        try {
            const response = await axios.post(`${apiBaseUrl}/toggle_music_like.php`, 
                { post_id: postId }, 
                { withCredentials: true }
            );
            
            console.log("✅ Réponse du serveur:", response.data);
            
            // Mettre à jour l'état local
            setPosts(posts.map(post => 
                post.id === postId 
                    ? { 
                        ...post, 
                        like_count: response.data.like_count,
                        user_has_liked: response.data.action === 'liked'
                      }
                    : post
            ));
        } catch (error) {
            console.error("❌ Erreur lors du toggle like:", error);
            console.error("Détails:", error.response?.data);
        }
    };

    const extractSpotifyTrackId = (url) => {
        try {
            const urlObj = new URL(url);
            const match = urlObj.pathname.match(/\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)$/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}j`;
    };

    if (loading) {
        return <div className="loading-screen">Chargement du feed musique...</div>;
    }

    return (
        <div className="music-feed-container">
            <div className="music-feed-header">
                <h1>🎵 Feed Musique</h1>
                <p>Partagez vos découvertes Spotify avec le Rien !</p>
            </div>

            {/* Formulaire de nouveau post */}
            <form onSubmit={handleSubmit} className="new-post-form">
                <div className="form-group">
                    <textarea
                        placeholder="Que pensez-vous de ce son ? (optionnel)"
                        value={newPost.text_content}
                        onChange={(e) => setNewPost({...newPost, text_content: e.target.value})}
                        className="text-input"
                        rows="3"
                    />
                </div>
                <div className="form-group">
                    <input
                        type="url"
                        placeholder="Lien Spotify ou Deezer (https://open.spotify.com/track/... ou https://www.deezer.com/track/...)"
                        value={newPost.spotify_url}
                        onChange={(e) => setNewPost({...newPost, spotify_url: e.target.value})}
                        className="url-input"
                        required
                    />
                </div>
                <button type="submit" disabled={posting} className="submit-button">
                    {posting ? 'Publication...' : '🎵 Partager'}
                </button>
            </form>

            {/* Feed des posts */}
            <div className="posts-feed">
                {posts.length === 0 ? (
                    <div className="no-posts">
                        <p>Aucun post pour le moment. Soyez le premier à partager de la musique !</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="music-post">
                            <div className="post-header">
                                <img 
                                    src={post.user.avatar_hash 
                                        ? `https://cdn.discordapp.com/avatars/${post.user.discord_id}/${post.user.avatar_hash}.png`
                                        : '/vite.svg'
                                    }
                                    alt={post.user.username}
                                    className="user-avatar"
                                />
                                <div className="post-info">
                                    <span className="username">{post.user.username}</span>
                                    <span className="timestamp">{formatTimeAgo(post.created_at)}</span>
                                </div>
                            </div>

                            {post.text_content && (
                                <div className="post-text">
                                    {post.text_content}
                                </div>
                            )}

                            <div className="music-embed">
                                {(() => {
                                    const url = post.spotify_url;
                                    
                                    // Support Spotify
                                    if (url && url.includes('open.spotify.com')) {
                                        const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
                                        if (match) {
                                            const trackId = match[1];
                                            return (
                                                <iframe
                                                    src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
                                                    width="100%"
                                                    height="152"
                                                    frameBorder="0"
                                                    allowfullscreen=""
                                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                    loading="lazy"
                                                    title="Spotify Track"
                                                ></iframe>
                                            );
                                        }
                                    }
                                    
                                    // Support Deezer
                                    if (url && url.includes('deezer.com')) {
                                        const match = url.match(/\/track\/(\d+)/);
                                        if (match) {
                                            const trackId = match[1];
                                            const embedUrl = `https://widget.deezer.com/widget/auto/track/${trackId}`;
                                            console.log('🎶 Deezer embed:', { url, trackId, embedUrl });
                                            
                                            return (
                                                <div>
                                                    <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>
                                                        Debug Deezer: ID={trackId} | Embed={embedUrl}
                                                    </div>
                                                    <iframe
                                                        src={embedUrl}
                                                        width="100%"
                                                        height="152"
                                                        frameBorder="0"
                                                        scrolling="no"
                                                        style={{border: 'none'}}
                                                        allowtransparency="true"
                                                        allow="encrypted-media"
                                                        loading="lazy"
                                                        title="Deezer Track"
                                                        onError={() => console.error('❌ Erreur iframe Deezer')}
                                                        onLoad={() => console.log('✅ Iframe Deezer chargée')}
                                                    ></iframe>
                                                </div>
                                            );
                                        } else {
                                            console.log('❌ Pas de match Deezer pour:', url);
                                        }
                                    }
                                    
                                    // Fallback : bouton adaptatif
                                    const platformName = url?.includes('spotify.com') ? 'Spotify' : 
                                                         url?.includes('deezer.com') ? 'Deezer' : 
                                                         'Musique';
                                    const platformEmoji = url?.includes('spotify.com') ? '🎵' : 
                                                         url?.includes('deezer.com') ? '🎶' : 
                                                         '🎵';
                                    
                                    return (
                                        <a 
                                            href={url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="music-link"
                                        >
                                            {platformEmoji} Écouter sur {platformName}
                                        </a>
                                    );
                                })()}
                            </div>

                            <div className="post-actions">
                                <button 
                                    onClick={() => toggleLike(post.id)}
                                    className={`like-button ${post.user_has_liked ? 'liked' : ''}`}
                                >
                                    ❤️ {post.like_count}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MusicFeed;