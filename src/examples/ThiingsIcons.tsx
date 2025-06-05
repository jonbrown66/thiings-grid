import ThiingsGrid, { type ItemConfig } from "../../lib/ThiingsGrid";

const ThiingsIconCell = ({ gridIndex }: ItemConfig) => {
  const images = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return (
    <div className="absolute inset-1 flex items-center justify-center">
      <img
        draggable={false}
        src={`/thiings/${images[gridIndex % images.length]}.png`}
      />
    </div>
  );
};

export const ThiingsIcons = () => (
  <ThiingsGrid
    gridSize={160}
    renderItem={ThiingsIconCell}
    initialPosition={{ x: 0, y: 0 }}
  />
);

export default ThiingsIcons;
