import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { v4 as uuidv4 } from "uuid";

interface IPoints {
  key: string;
  index: number;
  position: { left: string; top: string };
  counter: number;
  opacity: number;
}

type TGameStatus = "LET'S PLAY" | "ALL CLEARED" | "GAME OVER";

const App = () => {
  const [isPlayGame, setIsPlayGame] = useState<boolean>(false);
  const [pointsCount, setPointsCount] = useState<number | "">(5);
  const [counter, setCounter] = useState<number>(0);
  const [buttons, setButtons] = useState<IPoints[]>([]);
  const [gameStatus, setGameStatus] = useState<TGameStatus>("LET'S PLAY");
  const [nextButtonIndex, setNextButtonIndex] = useState<number>(1);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [clickedButtons, setClickedButtons] = useState<Set<number>>(new Set());
  const [buttonCounters, setButtonCounters] = useState<Map<number, number>>(
    new Map()
  );
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const getRandomPosition = () => {
    const randomX = Math.random() * 90;
    const randomY = Math.random() * 90;
    return {
      left: `${randomX}%`,
      top: `${randomY}%`,
    };
  };

  const generateButtons = (count: number) => {
    return Array.from({ length: count }).map((_, index) => ({
      key: uuidv4(),
      index,
      position: getRandomPosition(),
      counter: 3,
      opacity: 1,
    }));
  };

  const startTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    const id = setInterval(() => {
      setCounter((prevCounter) => prevCounter + 0.1);
    }, 100);

    setIntervalId(id);
    setTimeout(() => clearInterval(id), 60000);
  };

  const handleButtonClick = useCallback(
    (buttonIndex: number) => {
      const button = buttons[buttonIndex];
      if (button.opacity < 0.01) return;

      const updatedButtons = [...buttons];
      updatedButtons[buttonIndex].counter = 3;
      updatedButtons[buttonIndex].opacity = 1;
      setButtons(updatedButtons);

      if (buttonIndex + 1 === nextButtonIndex) {
        setClickedButtons((prev) => new Set(prev).add(buttonIndex));

        const interval = setInterval(() => {
          if (isGameOver) {
            clearInterval(interval);
            return;
          }

          const updatedButtons = [...buttons];
          const button = updatedButtons[buttonIndex];

          if (button.counter > 0) {
            button.counter -= 0.1;
            button.opacity = button.counter / 3;

            setButtons(updatedButtons);
            setButtonCounters((prev) =>
              new Map(prev).set(buttonIndex, button.counter)
            );
          } else if (nextButtonIndex === buttons.length) {
            setGameStatus("ALL CLEARED");
            setNextButtonIndex(buttons.length + 1);
            if (intervalId) clearInterval(intervalId);
            clearInterval(interval);
          }
        }, 100);

        intervalsRef.current.push(interval);
        setNextButtonIndex(nextButtonIndex + 1);
      } else {
        setGameStatus("GAME OVER");
        setIsGameOver(true);
        setClickedButtons((prev) => new Set(prev).add(buttonIndex));
        setButtonCounters((prev) => new Map(prev).set(buttonIndex, 3));
        if (intervalId) clearInterval(intervalId);
        intervalsRef.current.forEach(clearInterval);
        intervalsRef.current = [];
        setButtons((prevButtons) =>
          prevButtons.map((button) => ({
            ...button,
            counter: button.counter,
            opacity: button.counter / 3,
          }))
        );
      }
    },
    [buttons, nextButtonIndex, isGameOver, intervalId]
  );

  useEffect(() => {
    if (isAutoPlay && isPlayGame && !isGameOver) {
      autoPlayIntervalRef.current = setInterval(() => {
        handleButtonClick(nextButtonIndex - 1);
      }, 100);

      return () => {
        if (autoPlayIntervalRef.current) {
          clearInterval(autoPlayIntervalRef.current);
        }
      };
    } else if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
    }
  }, [isAutoPlay, isPlayGame, isGameOver, nextButtonIndex, handleButtonClick]);

  const handlePlayGame = () => {
    setIsPlayGame(true);
    setGameStatus("LET'S PLAY");
    setButtons(generateButtons(Number(pointsCount)));
    setNextButtonIndex(1);
    setCounter(0);
    setClickedButtons(new Set());
    setButtonCounters(new Map());
    setIsGameOver(false);
    startTimer();
  };

  const handleChangePoints = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || Number(value) >= 1) {
      setPointsCount(value === "" ? "" : Number(value));
    }
  };

  const handleAutoPlay = () => {
    setIsAutoPlay((prev) => !prev);
  };

  const resetGame = () => {
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }

    setButtons((prevButtons) =>
      prevButtons.map((button) => ({
        ...button,
        counter: 3,
        opacity: 1,
      }))
    );

    setGameStatus("LET'S PLAY");
    setNextButtonIndex(1);
    setClickedButtons(new Set());
    setButtonCounters(new Map());
    setCounter(0);
    setIsGameOver(false);
    setIsAutoPlay(false);

    setTimeout(() => {
      setButtons(generateButtons(Number(pointsCount)));
      startTimer();
    }, 0);
  };

  const getStatusColor = () => {
    switch (gameStatus) {
      case "LET'S PLAY":
        return "black";
      case "ALL CLEARED":
        return "green";
      case "GAME OVER":
        return "red";
      default:
        return "black";
    }
  };

  return (
    <div className="p-10 flex flex-col gap-5">
      <h2 className="font-bold text-lg" style={{ color: getStatusColor() }}>
        {gameStatus}
      </h2>
      <div className="flex items-center gap-5">
        <Label htmlFor="points">Points:</Label>
        <Input
          type="number"
          value={pointsCount}
          onChange={handleChangePoints}
          className="w-60"
          disabled={isPlayGame}
        />
      </div>
      <div className="flex items-center gap-5">
        <Label htmlFor="time">Times:</Label>
        <div className="px-2">{counter.toFixed(1)}s</div>
      </div>
      <div className="flex items-center gap-5">
        {!isPlayGame ? (
          <Button onClick={handlePlayGame}>Play</Button>
        ) : (
          <>
            <Button onClick={resetGame}>Restart</Button>
            {gameStatus !== "ALL CLEARED" && gameStatus !== "GAME OVER" && (
              <Button onClick={handleAutoPlay}>
                {isAutoPlay ? "Auto Play OFF" : "Auto Play ON"}
              </Button>
            )}
          </>
        )}
      </div>

      <div className="relative w-full h-[600px] border-2 border-black rounded-sm flex flex-wrap gap-2">
        {isPlayGame &&
          buttons.map(({ key, index, position, opacity }) => (
            <Button
              key={key}
              className={`rounded-full w-12 h-12 ${
                clickedButtons.has(index) ? "bg-orange-500 z-10" : "bg-white"
              } border-2 border-orange-500 hover:bg-orange-500 ${
                clickedButtons.has(index) && !isGameOver ? "fade-out" : ""
              }`}
              style={{
                position: "absolute",
                left: position.left,
                top: position.top,
                opacity: opacity,
                pointerEvents: opacity < 0.01 ? "none" : "auto",
              }}
              onClick={() => handleButtonClick(index)}
            >
              <div>
                <span className="text-black"> {index + 1}</span>
                {buttonCounters.has(index) && (
                  <div className=" w-full text-center text-white">
                    {buttonCounters.get(index)!.toFixed(1)}s
                  </div>
                )}
              </div>
            </Button>
          ))}
      </div>

      {isPlayGame &&
        gameStatus !== "ALL CLEARED" &&
        gameStatus !== "GAME OVER" && <div>Next: {nextButtonIndex}</div>}
    </div>
  );
};

export default App;
