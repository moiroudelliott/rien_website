import { useState, useEffect } from 'react';

// Le fameux Konami Code
const konamiCode = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a'
];

export const useKonamiCode = (callback) => {
  const [konamiIndex, setKonamiIndex] = useState(0);

  useEffect(() => {
    const handler = (event) => {
      // Si la touche pressée est la bonne dans la séquence
      if (event.key === konamiCode[konamiIndex]) {
        // On passe à la touche suivante
        setKonamiIndex(prevIndex => prevIndex + 1);
      } else {
        // Sinon, on réinitialise la séquence
        setKonamiIndex(0);
      }
    };

    window.addEventListener('keydown', handler);

    // Nettoyage de l'écouteur d'événement
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [konamiIndex]); // L'effet se redéclenche si l'index change

  useEffect(() => {
    // Si on a atteint la fin du code
    if (konamiIndex === konamiCode.length) {
      // On déclenche l'action !
      callback();
      // Et on réinitialise pour pouvoir le refaire
      setKonamiIndex(0);
    }
  }, [konamiIndex, callback]);
};