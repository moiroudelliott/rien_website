import React, { useMemo } from 'react';

const CONFETTI_COUNT = 100; // Remettons plus de confettis pour le Konami code

const ConfettiRain = ({ images }) => {
  // useMemo pour ne pas recalculer les confettis à chaque rendu
  const confettiPieces = useMemo(() => {
    const useAvatarImages = images && images.length > 0;
    
    // Si on utilise des avatars, on en met moins, sinon on en met beaucoup
    const count = useAvatarImages ? 40 : CONFETTI_COUNT; 
    
    const imageSources = useAvatarImages
      ? images
      : ['/confetti1.png', '/confetti2.png'];

    return Array.from({ length: count }).map((_, i) => {
      const baseStyle = {
        left: `${Math.random() * 100}%`,
        // Durée de l'animation aléatoire pour un effet plus naturel
        animationDuration: `${Math.random() * 3 + 4}s`, // entre 4 et 7 secondes
        // Délai de départ aléatoire
        animationDelay: `${Math.random() * 5}s`,
      };

      // Appliquer des styles différents en fonction du type de confettis
      const specificStyle = useAvatarImages
        ? { // Style pour les avatars (anniversaire)
            width: '45px',
            height: '45px',
            borderRadius: '50%',
          }
        : { // Style pour les confettis par défaut (Konami)
            width: '15px',
            height: '15px',
            borderRadius: '0%',
          };
      
      const style = { ...baseStyle, ...specificStyle };
      
      // On choisit une image au hasard dans la liste fournie
      const imageSrc = imageSources[i % imageSources.length];

      return <img key={i} src={imageSrc} className="confetti-piece" style={style} alt="" />;
    });
  }, [images]); // Le tableau de dépendances inclut `images`

  return <div className="confetti-container">{confettiPieces}</div>;
};

export default ConfettiRain;