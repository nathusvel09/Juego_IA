import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const WIDTH = 800;
const HEIGHT = 600;
const BALL_SIZE = 50; // Tamaño de las figuras
const INITIAL_BALLS = 8; // Número inicial de pares de figuras
const POINTS_PER_LEVEL = 20; // Puntos necesarios para subir de nivel
const TIME_LIMIT = 60; // Tiempo límite en segundos

function App() {
  const [shapes, setShapes] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [selectedShape, setSelectedShape] = useState(null); // Para almacenar la figura seleccionada
  const canvasRef = useRef(null);

  // Tipos de figuras geométricas
  const shapeTypes = [
    { type: 'circle', src: '/images/circle.png' },
    { type: 'square', src: '/images/square.png' },
    { type: 'triangle', src: '/images/triangle.png' },
    { type: 'new_shape', src: '/images/new_shape.png' }, // Nueva figura para niveles posteriores
  ];

  // Cargar imágenes
  const loadImage = (src) => {
    const img = new Image();
    img.src = src;
    return img;
  };

  // Generar pares de figuras
  const generateShapes = () => {
    let pairs = [];
    for (let i = 0; i < INITIAL_BALLS + (level - 1) * 5; i++) {
      const shapeType = shapeTypes[i % shapeTypes.length];
      pairs.push({
        ...shapeType,
        x: Math.random() * (WIDTH - BALL_SIZE),
        y: Math.random() * (HEIGHT - BALL_SIZE),
        selected: false,
      });
      pairs.push({
        ...shapeType,
        x: Math.random() * (WIDTH - BALL_SIZE),
        y: Math.random() * (HEIGHT - BALL_SIZE),
        selected: false,
      }); // Agregar par
    }
    // Mezclar las figuras
    pairs.sort(() => Math.random() - 0.5);
    return pairs;
  };

  // Manejar clic en el canvas
  const handleCanvasClick = (event) => {
    if (!gameActive) return; // No hacer nada si el juego no está activo

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Comprobar si se ha hecho clic en alguna figura
    setShapes((prevShapes) => {
      const clickedShapeIndex = prevShapes.findIndex((shape) => {
        return (
          clickX >= shape.x &&
          clickX <= shape.x + BALL_SIZE &&
          clickY >= shape.y &&
          clickY <= shape.y + BALL_SIZE
        );
      });

      if (clickedShapeIndex !== -1) {
        const clickedShape = prevShapes[clickedShapeIndex];

        if (!selectedShape) {
          // Si no hay figura seleccionada, seleccionar la figura actual
          setSelectedShape(clickedShape);
          clickedShape.selected = true; // Marcar como seleccionada
          return [...prevShapes]; // Actualizar estado sin eliminar la figura
        } else {
          // Verificar si las dos figuras son iguales
          if (selectedShape.type === clickedShape.type && selectedShape !== clickedShape) {
            // Son iguales, eliminar ambas y sumar puntos
            setScore((prevScore) => prevScore + 1);
            return prevShapes.filter((_, index) =>
              index !== clickedShapeIndex && index !== prevShapes.indexOf(selectedShape)
            );
          } else {
            // Son diferentes, perder una vida
            if (lives > 1) {
              alert('¡Incorrecto! Has perdido una vida.');
              setLives((prevLives) => prevLives - 1);
            } else {
              alert('¡Game Over! Has perdido.');
              resetGame(); // Reiniciar el juego al perder todas las vidas.
            }
            selectedShape.selected = false; // Deseleccionar la figura anterior
            clickedShape.selected = false; // Deseleccionar la figura actual
            setSelectedShape(null); // Reiniciar selección para permitir nuevas selecciones
            return [...prevShapes]; // No se eliminan figuras
          }
        }
      }

      return prevShapes; // No se hizo clic en ninguna figura válida
    });
    
    // Comprobar si se ha alcanzado el puntaje para subir de nivel
    if (score >= POINTS_PER_LEVEL * level) {
      alert(`¡Nivel ${level + 1}!`);
      setLevel((prevLevel) => prevLevel + 1);
      setScore(0); // Reiniciar puntaje al pasar de nivel
      setSelectedShape(null); // Reiniciar selección al pasar de nivel
      setShapes(generateShapes()); // Generar nuevas figuras para el nuevo nivel
    }
  };

  // Reiniciar el juego al perder todas las vidas o al finalizar un nivel.
  const resetGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setTimeLeft(TIME_LIMIT); // Reiniciar temporizador
    setGameActive(false);
    setShapes([]); // Limpiar las figuras del estado.
    setSelectedShape(null); // Limpiar la selección.
  };

  // Iniciar el juego
  const startGame = () => {
    resetGame(); // Reiniciar estado del juego antes de iniciar.
    
    setGameActive(true);

    // Generar las figuras iniciales para el primer nivel
    setShapes(generateShapes());

    // Temporizador para contar regresivamente
    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          alert('¡Se acabó el tiempo! Has perdido.');
          resetGame(); 
          return TIME_LIMIT; 
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  };

  useEffect(() => {
    if (!gameActive) return;

    const ctx = canvasRef.current.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Dibujar todas las figuras
      shapes.forEach((shape) => {
        ctx.drawImage(loadImage(shape.src), shape.x, shape.y, BALL_SIZE, BALL_SIZE); 
      });

      requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(draw);
    };
    
  }, [shapes, gameActive]);

  return (
    <div className="game-container">
      <h1>Cazar Figuras Geométricas</h1>
      <h2>Puntuación: {score}</h2>
      <h3>Vidas: {lives}</h3>
      <h3>Nivel: {level}</h3>
      <h3>Tiempo Restante: {timeLeft}s</h3>
      {!gameActive && <button onClick={startGame}>Iniciar Juego</button>}
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} onClick={handleCanvasClick} />
    </div>
  );
}

export default App;