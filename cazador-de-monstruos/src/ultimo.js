import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const WIDTH = 800;
const HEIGHT = 450;
const MONSTER_SIZE = 50;
const HUMAN_SIZE = 50;
const MAX_LIVES = 3;
const MAX_LEVEL = 3; // Limitar a 3 niveles

function App() {
  const [monsters, setMonsters] = useState([]);
  const [humans, setHumans] = useState([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState(20);
  const [highScore, setHighScore] = useState(0);
  const [lastScore, setLastScore] = useState(0); // Guardar el último puntaje
  const [level, setLevel] = useState(1);
  const canvasRef = useRef(null);
  const playerPos = { x: WIDTH / 2, y: HEIGHT / 2 };

  // Leer el puntaje más alto desde el localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('highScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Guardar el puntaje más alto en el localStorage
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('highScore', score);
    }
  }, [score, highScore]);

  // Generar un nuevo monstruo con IA adaptativa
  const generateMonster = () => {
    const x = Math.random() * (WIDTH - MONSTER_SIZE);
    const y = Math.random() * (HEIGHT - MONSTER_SIZE);
    const speed = Math.random() * 2 + 1 + level * 0.5;
    const type = Math.random() > 0.5 ? 'fast' : 'aggressive';
    const color = type === 'fast' ? '#FF5733' : type === 'aggressive' ? '#C70039' : '#28A745';

    setMonsters((prev) => [...prev, { x, y, speed, type, color, behavior: 'random' }]);
  };

  // Generar un nuevo ser humano
  const generateHuman = () => {
    const x = Math.random() * (WIDTH - HUMAN_SIZE);
    const y = Math.random() * (HEIGHT - HUMAN_SIZE);
    setHumans((prev) => [...prev, { x, y, timeout: Date.now() }]);
  };

  // Manejar clic en el canvas
  const handleCanvasClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Comprobar si se ha hecho clic en un monstruo
    setMonsters((prev) => {
      const newMonsters = prev.filter((monster) => {
        const distance = Math.sqrt(
          (clickX - monster.x) ** 2 + (clickY - monster.y) ** 2
        );
        if (distance < MONSTER_SIZE) {
          setScore((score) => score + (monster.type === 'fast' ? 20 : 10));
          return false;
        }
        return true;
      });
      return newMonsters;
    });

    // Comprobar si se ha hecho clic en un ser humano
    setHumans((prev) => {
      const newHumans = prev.filter((human) => {
        const distance = Math.sqrt(
          (clickX - human.x) ** 2 + (clickY - human.y) ** 2
        );
        if (distance < HUMAN_SIZE) {
          setLives((lives) => {
            const newLives = Math.max(0, lives - 1);
            if (newLives === 0) {
              setGameActive(false);
            }
            return newLives;
          });
          return false;
        }
        return true;
      });
      return newHumans;
    });
  };

  // Actualizar la posición de los monstruos con IA adaptativa
  const updateEntities = () => {
    setMonsters((prev) =>
      prev.map((monster) => {
        let moveX = 0;
        let moveY = 0;

        // IA adaptativa basada en el comportamiento del jugador
        if (monster.behavior === 'aggressive') {
          // Movimiento agresivo: se mueve rápidamente hacia el jugador
          const angle = Math.atan2(playerPos.y - monster.y, playerPos.x - monster.x);
          moveX = Math.cos(angle) * monster.speed * 1.5;
          moveY = Math.sin(angle) * monster.speed * 1.5;
        } else if (monster.behavior === 'avoid') {
          // Movimiento evasivo: se aleja del jugador
          const angle = Math.atan2(monster.y - playerPos.y, monster.x - playerPos.x);
          moveX = Math.cos(angle) * monster.speed * 1.5;
          moveY = Math.sin(angle) * monster.speed * 1.5;
        } else {
          // Movimiento aleatorio
          moveX = (Math.random() - 0.5) * monster.speed;
          moveY = (Math.random() - 0.5) * monster.speed;
        }

        // Cambiar el comportamiento de los monstruos a medida que se acercan al jugador
        if (Math.abs(playerPos.x - monster.x) < 100 && Math.abs(playerPos.y - monster.y) < 100) {
          monster.behavior = 'aggressive'; // Volverse agresivo
        } else if (Math.abs(playerPos.x - monster.x) > 200 && Math.abs(playerPos.y - monster.y) > 200) {
          monster.behavior = 'avoid'; // Evadir si está lejos
        }

        return {
          ...monster,
          x: monster.x + moveX,
          y: monster.y + moveY,
        };
      })
    );

    // Actualizar humanos, eliminarlos después de un tiempo
    setHumans((prev) =>
      prev.filter((human) => Date.now() - human.timeout < 5000)
    );
  };

  // Iniciar el juego
  const startGame = () => {
    setScore(0);
    setMonsters([]);
    setHumans([]);
    setLives(MAX_LIVES);
    setGameActive(true);
    setTimeLeft(20);
    setLevel(1);

    generateMonster();
    generateHuman();

    const intervalId = setInterval(() => {
      updateEntities();
      if (monsters.length < 8) generateMonster();
      if (humans.length < 3) generateHuman();

      if (timeLeft <= 0 || lives <= 0) {
        setLastScore(score); // Guardar el último puntaje
        setGameActive(false);
        clearInterval(intervalId);
      }
    }, 800);

    return () => clearInterval(intervalId);
  };

  // Temporizador para el tiempo de juego
  useEffect(() => {
    if (!gameActive) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          if (level < MAX_LEVEL) {
            setLevel(level + 1);
            setTimeLeft(20 - level * 2);
          } else {
            setGameActive(false); // Detener el juego cuando se alcance el nivel máximo
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [gameActive, lives, level]);

  // Dibujar en el canvas
  useEffect(() => {
    if (!gameActive) return;

    const ctx = canvasRef.current.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      monsters.forEach((monster) => {
        ctx.fillStyle = monster.color;
        ctx.fillRect(monster.x, monster.y, MONSTER_SIZE, MONSTER_SIZE);
        ctx.strokeStyle = '#C70039';
        ctx.strokeRect(monster.x, monster.y, MONSTER_SIZE, MONSTER_SIZE);
      });

      humans.forEach((human) => {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(human.x, human.y, HUMAN_SIZE, HUMAN_SIZE);
        ctx.strokeStyle = '#FFA500';
        ctx.strokeRect(human.x, human.y, HUMAN_SIZE, HUMAN_SIZE);
      });

      requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(draw);
  }, [monsters, humans, gameActive]);

  return (
    <div className="game-container">
      <h1>Cazador de Monstruos</h1>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={handleCanvasClick}
        style={{ border: '1px solid black' }}
      />
      {gameActive ? (
        <div className="game-info">
          <p>Puntaje: {score}</p>
          <p>Vidas: {lives}</p>
          <p>Tiempo: {timeLeft}s</p>
          <p>Level: {level}</p>
        </div>
      ) : (
        <div className="game-info">
          <p>Game Over!</p>
          <p>High Score: {highScore}</p>
          <p>Last Score: {lastScore}</p> {/* Mostrar el último puntaje */}
          <button onClick={startGame}>Iniciar Juego</button>
        </div>
      )}
    </div>
  );
}

export default App;