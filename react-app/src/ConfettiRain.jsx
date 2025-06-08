import React, { useMemo } from 'react';

const CONFETTI_COUNT = 100;

const ConfettiRain = () => {
  // useMemo pour ne pas recalculer les confettis à chaque rendu
  const confettiPieces = useMemo(() => {
    return Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
      const style = {
        left: `${Math.random() * 100}%`,
        // Durée de l'animation aléatoire pour un effet plus naturel
        animationDuration: `${Math.random() * 3 + 4}s`, // entre 4 et 7 secondes
        // Délai de départ aléatoire
        animationDelay: `${Math.random() * 5}s`,
      };
      // On alterne entre les deux images
      const imageSrc = i % 2 === 0 ? '/confetti1.png' : '/confetti2.png';

      return <img key={i} src={imageSrc} className="confetti-piece" style={style} alt="" />;
    });
  }, []);

  return <div className="confetti-container">{confettiPieces}</div>;
};

export default ConfettiRain;