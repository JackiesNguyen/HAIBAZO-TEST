import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { v4 as uuidv4 } from "uuid";

interface ICircle {
  id: string;
  x: number;
  y: number;
  countdown: number;
  opacity: number;
  isActive: boolean;
  label: number;
  isClicked: boolean; // Thêm thuộc tính để theo dõi nút đã được nhấn hay chưa
}

const App = () => {
  const [isPlayGame, setIsPlayGame] = useState(false);
  const [circles, setCircles] = useState<ICircle[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [gameStatus, setGameStatus] = useState("LET'S PLAY"); // Trạng thái game

  const startTimer = () => {
    setIsTimerActive(true);
    setElapsedTime(0);
  };

  const handleClickPlayGame = () => {
    setIsPlayGame(true);
    generateRandomCircles();
    startTimer();
    setGameStatus("LET'S PLAY"); // Reset trạng thái game
  };

  const handleClickRestart = () => {
    generateRandomCircles();
    setElapsedTime(0);
    setGameStatus("LET'S PLAY"); // Reset trạng thái game khi khởi động lại
  };

  const generateRandomCircles = () => {
    const newCircles: ICircle[] = [];
    const circleCount = 5;

    while (newCircles.length < circleCount) {
      const x = Math.random() * 400;
      const y = Math.random() * 400;

      const newCircle: ICircle = {
        id: uuidv4(),
        x,
        y,
        countdown: 3,
        opacity: 1,
        isActive: true,
        label: newCircles.length + 1,
        isClicked: false, // Khởi tạo là false
      };

      if (!isOverlapping(newCircle, newCircles)) {
        newCircles.push(newCircle);
      }
    }

    setCircles(newCircles);
  };

  const isOverlapping = (
    newCircle: ICircle,
    existingCircles: ICircle[]
  ): boolean => {
    const circleSize = 40;
    return existingCircles.some((circle) => {
      return (
        newCircle.x < circle.x + circleSize &&
        newCircle.x + circleSize > circle.x &&
        newCircle.y < circle.y + circleSize &&
        newCircle.y + circleSize > circle.y
      );
    });
  };

  const handleButtonClick = (id: string) => {
    setCircles((prevCircles) =>
      prevCircles.map((circle) =>
        circle.id === id
          ? {
              ...circle,
              isActive: false,
              isClicked: true,
              countdown: 3,
              opacity: 1,
            } // Đánh dấu là đã nhấn
          : circle
      )
    );

    const activeCircles = circles.filter((circle) => circle.isActive);

    const interval = setInterval(() => {
      setCircles((prevCircles) =>
        prevCircles.map((circle) =>
          circle.id === id && circle.countdown > 0
            ? {
                ...circle,
                countdown: Math.max(0, circle.countdown - 0.1),
                opacity: Math.max(0, circle.opacity - 0.033),
              }
            : circle
        )
      );
    }, 100);

    setTimeout(() => {
      setCircles((prevCircles) =>
        prevCircles.map((circle) =>
          circle.id === id ? { ...circle, isActive: false, opacity: 0 } : circle
        )
      );

      clearInterval(interval);

      if (activeCircles.length === 1) {
        setIsTimerActive(false);
        setGameStatus("ALL CLEARED");
      }
    }, 3000);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerActive) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 0.1);
      }, 100);
    }

    return () => clearInterval(timer);
  }, [isTimerActive]);

  return (
    <div className="p-10 flex flex-col gap-5">
      <h2
        className={`font-bold text-lg ${
          gameStatus === "ALL CLEARED" ? "text-green-500" : ""
        }`}
      >
        {gameStatus}
      </h2>
      <div className="flex items-center gap-5">
        <Label htmlFor="points">Points:</Label>
        <Input type="number" id="points" value={5} readOnly />
      </div>
      <div className="flex items-center gap-5">
        <Label>Time:</Label>
        <div className="px-3">{elapsedTime.toFixed(1)}s</div>
      </div>
      <div>
        {!isPlayGame && <Button onClick={handleClickPlayGame}>Play</Button>}
        {isPlayGame && (
          <div className="flex items-center gap-5">
            <Button onClick={handleClickRestart}>Restart</Button>
            <Button className="w-30">Auto Play ON</Button>
          </div>
        )}
      </div>
      <div className="w-full h-[500px] border-2 border-black rounded-sm p-10">
        <div className="relative w-full h-full">
          {isPlayGame &&
            circles.map((circle) => (
              <Button
                key={circle.id}
                className={`w-12 h-12 text-black border border-orange-400 rounded-full absolute font-bold hover:bg-orange-400 ${
                  circle.isClicked ? "bg-orange-400" : "bg-white"
                }`} // Thêm điều kiện để thay đổi màu nền
                style={{
                  top: circle.y,
                  left: circle.x,
                  opacity: circle.opacity,
                }}
                onClick={() => handleButtonClick(circle.id)}
                disabled={!circle.isActive}
              >
                {circle.isActive ? (
                  circle.label
                ) : (
                  <div className="flex flex-col">
                    <span className="text-sm">{circle.label}</span>
                    <span className="text-white">
                      {circle.countdown.toFixed(1)} s
                    </span>
                  </div>
                )}
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default App;
