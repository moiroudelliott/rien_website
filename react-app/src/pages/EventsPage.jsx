import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/_events.css'; // Le nouveau fichier de style
import EventDetailModal from '../components/EventDetailModal'; // Importer la modale
import CreateEventModal from '../components/CreateEventModal';

// Les composants de modale seront importés ici plus tard
// import CreateEventModal from '../components/CreateEventModal';

function EventsPage({ currentUser }) {
    const [futureEvents, setFutureEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    const fetchEvents = () => {
        setLoading(true);
        axios.get(`${apiBaseUrl}/get_events.php`, { withCredentials: true })
            .then(response => {
                setFutureEvents(response.data.future_events || []);
                setPastEvents(response.data.past_events || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur de chargement des événements:", err);
                setError("Impossible de charger les événements.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchEvents();
    }, [apiBaseUrl]);

    const formatEventDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="loading-screen">Chargement des événements...</div>;
    }

    if (error) {
        return <div className="loading-screen">{error}</div>;
    }

    return (
        <div className="page-container events-container">
            <div className="page-header">
                <h1 className="page-title">Événements</h1>
                <button onClick={() => setCreateModalOpen(true)} className="create-event-btn">Créer un événement</button>
            </div>

            <div className="events-section">
                <h2 className="events-section-title">Événements à venir</h2>
                {futureEvents.length > 0 ? (
                    <div className="events-grid">
                        {futureEvents.map(event => (
                            <div key={event.id} className="event-card" onClick={() => setSelectedEvent(event)}>
                                <div className="event-card-header">
                                    <h3>{event.title}</h3>
                                    <p className="event-creator">Créé par {event.creator_username}</p>
                                </div>
                                <div className="event-card-body">
                                    <p className="event-date">{formatEventDate(event.event_date)}</p>
                                    <p className="event-location">{event.location_text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Aucun événement à venir.</p>
                )}
            </div>

            <div className="events-section">
                <h2 className="events-section-title">Événements passés</h2>
                {pastEvents.length > 0 ? (
                    <div className="events-grid">
                        {pastEvents.map(event => (
                            <div key={event.id} className="event-card" onClick={() => setSelectedEvent(event)}>
                                <div className="event-card-header">
                                    <h3>{event.title}</h3>
                                    <p className="event-creator">Créé par {event.creator_username}</p>
                                </div>
                                <div className="event-card-body">
                                    <p className="event-date">{formatEventDate(event.event_date)}</p>
                                    <p className="event-location">{event.location_text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Aucun événement passé.</p>
                )}
            </div>
            
            {selectedEvent && (
                <EventDetailModal 
                    event={selectedEvent} 
                    currentUser={currentUser}
                    onClose={() => setSelectedEvent(null)}
                    onEventDeleted={fetchEvents}
                    onEdit={() => {
                        setEditingEvent(selectedEvent);
                        setSelectedEvent(null);
                    }}
                />
            )}
            
            {(isCreateModalOpen || editingEvent) && (
                <CreateEventModal 
                    onClose={() => {
                        setCreateModalOpen(false);
                        setEditingEvent(null);
                    }} 
                    onEventCreated={() => {
                        setCreateModalOpen(false);
                        setEditingEvent(null);
                        fetchEvents();
                    }}
                    currentUser={currentUser}
                    eventToEdit={editingEvent}
                />
            )}
        </div>
    );
}

export default EventsPage; 