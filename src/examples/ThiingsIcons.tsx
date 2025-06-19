import { useState } from 'react'; // Import useState
import ThiingsGrid, { type ItemConfig } from "../../lib/ThiingsGrid";
import { type IconData } from "../iconData"; // Import IconData type

interface ThiingsIconsProps {
  icons: IconData[];
  onIconClick: (index: number) => void;
}

interface ThiingsIconCellProps extends ItemConfig {
  icons: IconData[];
  onIconClick: (index: number) => void;
  isMoving: boolean; // Add isMoving prop
}

const ThiingsIconCell = ({ gridIndex, icons, onIconClick, isMoving }: ThiingsIconCellProps) => {
  const [hasAnimated, setHasAnimated] = useState(false); // Add state to track animation
  const icon = icons[gridIndex % icons.length];
  const imageUrl = `/thiings/${icon.filename}`;

  return (
    <div className="absolute inset-1 flex items-center justify-center">
      <img
        draggable={false}
        src={imageUrl}
        alt={`Icon ${gridIndex}`}
        className={`transform transition-transform duration-500 ease-out ${!isMoving ? 'cursor-pointer hover:scale-110' : ''} ${hasAnimated ? 'scale-100' : 'scale-0'}`} // Use state to control scale, increased duration
        onClick={() => {
          if (!isMoving) { // Only trigger onClick if not moving
            onIconClick(gridIndex);
          }
        }}
        onLoad={() => {
          if (!hasAnimated) { // Only trigger animation if not already animated
            setHasAnimated(true);
          }
        }}
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
      gridSize={160}
      renderItem={(config) => <ThiingsIconCell {...config} icons={icons} onIconClick={onIconClick} />} // Use props
      initialPosition={{ x: 0, y: 0 }}
    />
  );
};

export default ThiingsIcons;
