import React, { useState } from 'react';
import axios from 'axios';
// Ajoute des styles pour ce formulaire dans App.css

function ProfileCompletion({ currentUser, onProfileComplete }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    linkedin_url: '',
    instagram_handle: '',
    steam_id: '',
    github_username: '',
  });

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`${apiBaseUrl}/update_profile.php`, formData)
      .then(() => {
        // On met à jour l'état de l'utilisateur dans App.jsx
        onProfileComplete({ ...currentUser, ...formData, profile_complete: true });
      })
      .catch(error => {
        alert("Erreur: " + (error.response?.data?.message || "Veuillez vérifier vos champs."));
      });
  };

  return (
    <div className="profile-completion-container">
      <h2>Bienvenue, {currentUser.username} !</h2>
      <p>Complétez votre profil pour apparaître sur la carte.</p>
      <form onSubmit={handleSubmit} className="profile-form">
        <fieldset>
            <legend>Informations requises</legend>
            <div className="form-group">
                {/* Champs obligatoires */}
                <input type="text" name="first_name" placeholder="Prénom" required onChange={handleChange} />
                <input type="text" name="last_name" placeholder="Nom" required onChange={handleChange} />
                <input type="date" name="birth_date" required onChange={handleChange} />
            </div>
        </fieldset>
        <fieldset className="optional-fieldset"> 
            <legend>Réseaux sociaux (optionnel)</legend>
            <div className="form-group">
            <div className="input-with-icon">
                <img src="/linkedin.svg" alt="LinkedIn" />
                <input type="url" name="linkedin_url" placeholder="URL Profil LinkedIn" onChange={handleChange} />
            </div>
            <div className="input-with-icon">
                <img src="/instagram.svg" alt="Instagram" />
                <input type="text" name="instagram_handle" placeholder="Pseudo Instagram" onChange={handleChange} />
            </div>
            <div className="input-with-icon">
                <img src="/github.svg" alt="GitHub" />
                <input type="text" name="github_username" placeholder="Pseudo GitHub" onChange={handleChange} />
            </div>
            <div className="input-with-icon">
                <img src="/steam.svg" alt="Steam" />
                <input type="text" name="steam_id" placeholder="ID Steam" onChange={handleChange} />
            </div>
            </div>
        </fieldset>

        <button type="submit">Enregistrer et accéder à la carte</button>
      </form>
    </div>
  );
}

export default ProfileCompletion;