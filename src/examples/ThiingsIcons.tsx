import { useState } from 'react'; // Import useState
import ThiingsGrid, { type ItemConfig } from "../../lib/ThiingsGrid";
import { type IconData } from "../iconData"; // Import IconData type

interface ThiingsIconsProps {
  icons: IconData[];
  onIconClick: (index: number) => void;
}

interface ThiingsIconCellProps extends ItemConfig {
  icon: IconData; // Pass individual icon data
  onIconClick: (index: number) => void;
}

const ThiingsIconCell = ({ gridIndex, icon, onIconClick, isMoving }: ThiingsIconCellProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
const imageUrl = `https://pub-3eaacd7f361f489abc8c1264f34670cd.r2.dev/webp/${icon.filename}`;

  return (
    <div className="absolute inset-1 flex items-center justify-center overflow-hidden">
      <img
        draggable={false}
        src={imageUrl}
        alt={icon.description} // Use icon description for alt text
        className={`transform transition-all duration-1000 ease-out ${!isMoving ? 'cursor-pointer hover:scale-110' : ''}`}
        style={{
          opacity: imageLoaded ? 1 : 0, // Fade in
          transform: `scale(${imageLoaded ? 1 : 0.8})`, // Scale in
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        onClick={() => {
          if (!isMoving) {
            onIconClick(gridIndex);
          }
        }}
        onLoad={() => setImageLoaded(true)}
        loading="lazy"
      />
    </div>
  );
};

export const ThiingsIcons = ({ icons, onIconClick }: ThiingsIconsProps) => { // Re-add props
  if (icons.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-lg">
        没有找到匹配的图标。
      </div>
    );
  }

  return (
    <ThiingsGrid
      gridSize={200}
      renderItem={(config) => {
        const icon = icons[config.gridIndex % icons.length];
        return <ThiingsIconCell {...config} icon={icon} onIconClick={onIconClick} />;
      }}
      initialPosition={{ x: 0, y: 0 }}
    />
  );
};

export default ThiingsIcons;
