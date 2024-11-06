import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";

const App = () => {
  const [isPlayGame, setIsPlayGame] = useState<boolean>(false);
  const [pointsCount, setPointsCount] = useState<number | "">(5);
  const [time, setTime] = useState<number>(0);
  const [buttonPositions, setButtonPositions] = useState<
    { x: string; y: string; id: string }[]
  >([]); // State lưu vị trí và id của các button

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayGame) {
      // Bắt đầu đếm thời gian khi bấm "Play"
      timer = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 0.1;
          return Math.round(newTime * 10) / 10;
        });
      }, 100); // Mỗi 100ms
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlayGame]);

  useEffect(() => {
    if (isPlayGame) {
      const positions = Array.from({ length: Number(pointsCount) }, () => ({
        x: Math.floor(Math.random() * 90) + "%",
        y: Math.floor(Math.random() * 90) + "%",
        id: uuidv4(),
      }));
      setButtonPositions(positions);
    }
  }, [pointsCount, isPlayGame]); // Cập nhật lại vị trí khi pointsCount thay đổi

  const handlePlayGame = () => {
    setIsPlayGame(true);
    setTime(0);
  };

  const renderButtons = () => {
    return buttonPositions.map((position, index) => (
      <Button
        key={position.id} // Sử dụng id duy nhất từ uuidv4()
        className="absolute w-12 h-12 bg-white border-2 border-orange-400 rounded-full text-black hover:bg-orange-400 hover:text-white"
        style={{ top: position.y, left: position.x }}
      >
        {index + 1} {/* Hiển thị số thứ tự của button */}
      </Button>
    ));
  };

  return (
    <div className="p-10 flex flex-col gap-5">
      <h2>LET'S PLAY</h2>
      <div className="flex items-center gap-5">
        <Label htmlFor="points">Points:</Label>
        <Input
          type="number"
          value={pointsCount}
          onChange={(e) => setPointsCount(Number(e.target.value))}
          className="w-60"
          min={1}
          disabled={isPlayGame}
        />
      </div>
      <div className="flex items-center gap-5">
        <Label htmlFor="time">Time:</Label>
        <div className="px-2">{time}s</div>
      </div>
      <div className="flex items-center gap-5">
        {!isPlayGame ? (
          <Button onClick={handlePlayGame}>Play</Button>
        ) : (
          <>
            <Button>Restart</Button>
            <Button>Auto Play ON</Button>
          </>
        )}
      </div>

      {/* Render các button số chỉ một lần khi bấm "Play" */}
      <div className="w-full h-[600px] border-2 border-black rounded-sm relative overflow-hidden flex flex-wrap gap-2">
        {isPlayGame && renderButtons()}
      </div>

      <div>Next: 1</div>
    </div>
  );
};

export default App;
