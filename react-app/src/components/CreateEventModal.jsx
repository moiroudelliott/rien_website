import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ToggleSwitch from './ToggleSwitch';
import UserMultiSelect from './UserMultiSelect';
import '../styles/_createeventmodal.css';

function CreateEventModal({ onClose, onEventCreated, currentUser, eventToEdit }) {
    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location_text: '',
        is_public: true,
        attendees: []
    });
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const isEditing = !!eventToEdit;

    useEffect(() => {
        if (isEditing) {
            const eventDate = new Date(eventToEdit.event_date);
            setEventData({
                title: eventToEdit.title || '',
                description: eventToEdit.description || '',
                date: eventDate.toISOString().split('T')[0],
                time: eventDate.toTimeString().split(' ')[0].substring(0, 5),
                location_text: eventToEdit.location_text || '',
                is_public: eventToEdit.is_public,
                attendees: eventToEdit.attendees ? eventToEdit.attendees.map(a => a.id) : []
            });
        }
    }, [isEditing, eventToEdit]);

    // Fetch all users with a complete profile to populate the attendees select list
    useEffect(() => {
        axios.get(`${apiBaseUrl}/get_all_users.php`)
            .then(response => setAllUsers(response.data))
            .catch(err => console.error("Could not fetch users:", err));
    }, [apiBaseUrl]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setEventData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleToggle = useCallback((isChecked) => {
        setEventData(prev => ({ ...prev, is_public: isChecked }));
    }, []);

    const handleAttendeesChange = useCallback((ids) => {
        setEventData(prev => ({ ...prev, attendees: ids }));
    }, []);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Combine date and time
        const event_date = `${eventData.date} ${eventData.time}`;

        // Simple validation
        if (!eventData.title || !eventData.date || !eventData.time || !eventData.location_text) {
            setError('Veuillez remplir tous les champs obligatoires.');
            setIsLoading(false);
            return;
        }

        const dataToSend = { ...eventData, event_date, latitude: 0, longitude: 0 };
        delete dataToSend.date;
        delete dataToSend.time;

        if (isEditing) {
            dataToSend.event_id = eventToEdit.id;
        }

        const endpoint = isEditing ? 'update_event.php' : 'create_event.php';

        axios.post(`${apiBaseUrl}/${endpoint}`, dataToSend, { withCredentials: true })
            .then(() => {
                setIsLoading(false);
                onEventCreated(); // This prop is used for both creation and update to refresh the list
                onClose(); // Close the modal
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Une erreur est survenue.');
                setIsLoading(false);
            });
    };
    
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="event-detail-modal-overlay" onClick={handleOverlayClick}>
            <div className="create-event-modal-content">
                <button onClick={onClose} className="close-button" title="Fermer">×</button>
                <h2>{isEditing ? "Modifier l'événement" : "Créer un nouvel événement"}</h2>
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group full-width">
                        <label htmlFor="title">Titre de l'événement *</label>
                        <input type="text" id="title" name="title" value={eventData.title} onChange={handleChange} required />
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" name="description" value={eventData.description} onChange={handleChange}></textarea>
                    </div>

                    <div className="form-group-separator"></div>

                    <div className="form-group">
                        <label>Date *</label>
                        <input type="date" name="date" value={eventData.date} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Heure *</label>
                        <input type="time" name="time" value={eventData.time} onChange={handleChange} required />
                    </div>

                    <div className="form-group-separator"></div>

                    <div className="form-group full-width">
                        <label htmlFor="location_text">Nom du lieu (ex: "Parc Monceau") *</label>
                        <input type="text" id="location_text" name="location_text" value={eventData.location_text} onChange={handleChange} required/>
                    </div>

                    <div className="form-group-separator"></div>
                    
                    <div className="form-group full-width">
                        <ToggleSwitch 
                            label="Événement Public (visible par tous)"
                            checked={eventData.is_public}
                            onChange={handleToggle}
                        />
                    </div>
                    
                    {!eventData.is_public && (
                        <div className="form-group full-width">
                            <label>Inviter des membres</label>
                            <UserMultiSelect 
                                allUsers={allUsers}
                                selectedUserIds={eventData.attendees}
                                onChange={handleAttendeesChange}
                                currentUser={currentUser}
                            />
                        </div>
                    )}
                    
                    <div className="form-actions">
                         {error && <p className="error-message" style={{color: 'var(--led-red)', width: '100%'}}>{error}</p>}
                        <button type="button" onClick={onClose} className="cancel-button">Annuler</button>
                        <button type="submit" disabled={isLoading} className="submit-button">
                            {isLoading ? (isEditing ? 'Modification...' : 'Création...') : (isEditing ? "Modifier l'événement" : "Créer l'événement")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateEventModal;
