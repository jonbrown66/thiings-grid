import { useState, useEffect, useMemo } from "react";
import { Toaster } from "react-hot-toast";
import { ThiingsIcons } from "./examples/ThiingsIcons";
import IconDetailCard from "./components/IconDetailCard";
import { fetchIconData, type IconData } from "./iconData";

function App() {
  const [selectedIconIndex, setSelectedIconIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [iconData, setIconData] = useState<IconData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIconData().then(data => {
      setIconData(data);
      setLoading(false);
    });
  }, []);

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
    return iconData.filter((icon: IconData) =>
      icon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      icon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (icon.tag1 && icon.tag1.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (icon.tag2 && icon.tag2.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (icon.tag3 && icon.tag3.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, iconData]);

  const getIconDetails = (index: number) => {
    const icon: IconData = filteredIconData[index % filteredIconData.length];
    const displayImageUrl = `https://sokala.xyz/webp/${icon.filename}`; // For displaying webp
    const downloadImageUrl = `https://sokala.xyz/${icon.filename.replace('.webp', '.png')}`; // For downloading png
    const description = icon.description;
    const title = icon.title;
    // Combine all tags into a single string for display if needed, or handle them separately
    const tag = [icon.tag1, icon.tag2, icon.tag3].filter(Boolean).join(', ');
    return { imageUrl: displayImageUrl, downloadImageUrl, description, title, tag };
  };

  const iconDetails = selectedIconIndex !== null ? getIconDetails(selectedIconIndex) : null;

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center font-sans text-white">
        加载数据中...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen font-sans">
      <main className="flex flex-1 flex-col h-screen">
        <div className="flex-1 relative bg-white">
          <ThiingsIcons icons={filteredIconData} onIconClick={handleIconClick} />
          {selectedIconIndex !== null && iconDetails && (
            <IconDetailCard
              imageUrl={iconDetails.imageUrl}
              downloadImageUrl={iconDetails.downloadImageUrl} // Pass the new prop
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
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
