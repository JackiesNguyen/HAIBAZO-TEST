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
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref để lưu trữ interval của Auto Play
  const intervalsRef = useRef<NodeJS.Timeout[]>([]); // Mảng để lưu trữ tất cả các interval

  const handleButtonClick = useCallback(
    (buttonIndex: number) => {
      const button = buttons[buttonIndex];
      if (button.opacity < 0.01) return; // Bỏ qua các nút có opacity gần bằng 0

      const updatedButtons = [...buttons];
      updatedButtons[buttonIndex].counter = 3; // Reset lại bộ đếm mỗi lần nút được nhấn
      updatedButtons[buttonIndex].opacity = 1; // Đặt opacity về 1 khi bắt đầu lại
      setButtons(updatedButtons); // Cập nhật lại buttons

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
            button.counter -= 0.1; // Giảm bộ đếm
            button.opacity = button.counter / 3; // Cập nhật opacity từ 1 -> 0

            setButtons(updatedButtons); // Cập nhật trạng thái buttons
            setButtonCounters(
              (prev) => new Map(prev).set(buttonIndex, button.counter) // Cập nhật bộ đếm vào state
            );
          } else if (nextButtonIndex === buttons.length) {
            setGameStatus("ALL CLEARED");
            setNextButtonIndex(buttons.length + 1);
            if (intervalId) clearInterval(intervalId);
            clearInterval(interval);
          }
        }, 100);

        intervalsRef.current.push(interval); // Lưu interval vào mảng

        setNextButtonIndex(nextButtonIndex + 1);
      } else {
        setGameStatus("GAME OVER");
        setIsGameOver(true);
        setClickedButtons((prev) => new Set(prev).add(buttonIndex)); // Đảm bảo nút cuối cùng được nhấn có màu nền
        setButtonCounters((prev) => new Map(prev).set(buttonIndex, 3)); // Đặt lại bộ đếm của nút cuối cùng được nhấn thành 3.0s
        if (intervalId) clearInterval(intervalId);
        // Clear tất cả các interval khi game over
        intervalsRef.current.forEach(clearInterval);
        intervalsRef.current = [];
        // Dừng tất cả các nút
        setButtons((prevButtons) =>
          prevButtons.map((button) => ({
            ...button,
            counter: button.counter, // Giữ nguyên giá trị counter
            opacity: button.counter / 3, // Giữ nguyên giá trị opacity tương ứng với counter
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
      }, 1000);

      return () => {
        if (autoPlayIntervalRef.current) {
          clearInterval(autoPlayIntervalRef.current);
        }
      };
    } else {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
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

  const getRandomPosition = () => {
    const randomX = Math.random() * 90;
    const randomY = Math.random() * 90;
    return {
      left: `${randomX}%`,
      top: `${randomY}%`,
    };
  };

  const generateButtons = (count: number) => {
    return Array.from({ length: count }).map((_, index) => {
      const position = getRandomPosition();
      const key = uuidv4();
      return {
        key,
        index,
        position,
        counter: 3, // Bắt đầu với bộ đếm 3s
        opacity: 1, // Độ mờ ban đầu là 1 (đầy đủ)
      };
    });
  };

  const startTimer = () => {
    // Clear interval nếu đang chạy
    if (intervalId) {
      clearInterval(intervalId);
    }

    const id = setInterval(() => {
      setCounter((prevCounter) => prevCounter + 0.1);
    }, 100);

    setIntervalId(id); // Lưu intervalId vào state
    setTimeout(() => clearInterval(id), 60000); // Dừng sau 60 giây
  };

  const resetGame = () => {
    // Clear tất cả các interval
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    // Clear interval nếu đang chạy
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null); // Đảm bảo rằng intervalId được reset
    }

    // Clear auto play interval nếu đang chạy
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }

    // Reset lại trạng thái của buttons (bao gồm counter và opacity)
    setButtons((prevButtons) =>
      prevButtons.map((button) => ({
        ...button,
        counter: 3, // Thiết lập lại bộ đếm (hoặc giá trị mặc định)
        opacity: 1, // Đặt opacity về 1 (hoặc giá trị mặc định)
      }))
    );

    // Reset các trạng thái game
    setGameStatus("LET'S PLAY");
    setNextButtonIndex(1);
    setClickedButtons(new Set());
    setButtonCounters(new Map());
    setCounter(0);
    setIsGameOver(false);
    setIsAutoPlay(false); // Tắt chế độ Auto Play khi reset

    // Tạo lại buttons sau khi reset
    setTimeout(() => {
      setButtons(generateButtons(Number(pointsCount))); // Tạo lại buttons mới
      startTimer(); // Khởi động lại bộ đếm thời gian
    }, 0); // Đảm bảo việc render lại buttons là tức thời
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
        <Label htmlFor="time">BỘ ĐẾM TỔNG:</Label>
        <div className="px-2">{counter.toFixed(1)}s</div>
      </div>
      <div className="flex items-center gap-5">
        {!isPlayGame ? (
          <Button onClick={handlePlayGame}>Play</Button>
        ) : (
          <>
            <Button onClick={resetGame}>Restart</Button>
            {gameStatus !== "ALL CLEARED" && (
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
              key={key} // Gán key duy nhất cho mỗi button
              className={`rounded-full w-12 h-12 ${
                clickedButtons.has(index) ? "bg-orange-500 z-10" : "bg-white"
              } border-2 border-orange-500 hover:bg-orange-500 ${
                clickedButtons.has(index) && !isGameOver ? "fade-out" : ""
              }`} // Loại bỏ lớp fade-out khi game over
              style={{
                position: "absolute",
                left: position.left,
                top: position.top,
                opacity: opacity, // Giữ nguyên opacity tương ứng với counter
                pointerEvents: opacity < 0.01 ? "none" : "auto", // Vô hiệu hóa sự kiện chuột khi opacity gần bằng 0
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

      {isPlayGame && gameStatus !== "ALL CLEARED" && (
        <div>Next: {nextButtonIndex}</div>
      )}
    </div>
  );
};

export default App;
