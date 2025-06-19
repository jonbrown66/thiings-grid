import { useState, useMemo } from "react";
import { Toaster } from "sonner";
import { ThiingsIcons } from "./examples/ThiingsIcons";
import IconDetailCard from "./components/IconDetailCard";
import iconData from "./iconData";

function App() {
  const [selectedIconIndex, setSelectedIconIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleIconClick = (index: number) => {
    setSelectedIconIndex(index);
  };

  const handleCloseCard = () => {
    setSelectedIconIndex(null);
  };

  const filteredIconData = useMemo(() => {
    if (!searchQuery) {
      return iconData;
    }
    return iconData.filter(icon =>
      icon.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getIconDetails = (index: number) => {

    const originalIndex = iconData.findIndex(icon => icon.filename === filteredIconData[index % filteredIconData.length].filename);
    const icon = iconData[originalIndex !== -1 ? originalIndex : index % iconData.length];

    const imageUrl = `/thiings/${icon.filename}`;
    const description = icon.description;
    const title = icon.title;
    const tag = icon.tag;
    return { imageUrl, description, title, tag };
  };

  const iconDetails = selectedIconIndex !== null ? getIconDetails(selectedIconIndex) : null;

  return (
    <div className="flex h-screen w-screen font-sans">
      <main className="flex flex-1 flex-col h-screen">
        <div className="flex-1 relative bg-white">
          <ThiingsIcons icons={filteredIconData} onIconClick={handleIconClick} />
          {selectedIconIndex !== null && iconDetails && (
            <IconDetailCard
              imageUrl={iconDetails.imageUrl}
              description={iconDetails.description}
              title={iconDetails.title}
              tag={iconDetails.tag}
              onClose={handleCloseCard}
            />
          )}
        </div>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
          <input
            type="text"
            placeholder="搜索图片..."
            className="w-full p-3 rounded-full bg-black bg-opacity-30 backdrop-blur-sm border border-gray-700 focus:outline-none text-white text-center placeholder-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
