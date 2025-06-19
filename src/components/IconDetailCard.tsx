import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

interface IconDetailCardProps {
  imageUrl: string;
  description: string;
  title: string;
  tag: string;
  onClose: () => void;
}

const IconDetailCard: React.FC<IconDetailCardProps> = ({
  imageUrl,
  description,
  title,
  tag,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;

    const original = cardRef.current;
    const clone = original.cloneNode(true) as HTMLElement;

    // 移除 clone 中的按钮和关闭元素
    const buttons = clone.querySelectorAll('button');
    buttons.forEach((btn) => btn.remove());

    // 设置统一样式防止字体偏移
    clone.style.fontFamily = 'Arial, sans-serif';
    clone.querySelectorAll('*').forEach((el) => {
      (el as HTMLElement).style.lineHeight = '1.2';
      (el as HTMLElement).style.verticalAlign = 'middle';
      (el as HTMLElement).style.fontFamily = 'Arial, sans-serif';
    });

    // 加入页面临时渲染
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, {
      backgroundColor: '#ffffff',
      useCORS: true,
      scale: window.devicePixelRatio || 2,
    });

    document.body.removeChild(clone);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `card-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={cardRef}
        className={`bg-white rounded-lg p-6 max-w-sm mx-auto relative transform transition-transform duration-300 ease-out ${
          isVisible ? 'scale-100' : 'scale-0'
        }`}
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Tag */}
        <p
          className="text-xs text-gray-500 text-center px-2 py-1 border border-gray-300 rounded-full inline-block mx-auto mb-3"
          style={{
            lineHeight: '1.2',
            verticalAlign: 'middle',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {tag}
        </p>

        {/* Title */}
        <h2
          className="text-xl font-bold text-gray-900 text-center mb-4"
          style={{ lineHeight: '1.2', verticalAlign: 'middle' }}
        >
          {title}
        </h2>

        {/* Image */}
        <img src={imageUrl} alt="Icon" className="w-full h-auto mb-4" />

        {/* Description */}
        <p
          className="text-gray-800 text-center mb-4"
          style={{ lineHeight: '1.2', verticalAlign: 'middle' }}
        >
          {description}
        </p>

        {/* Buttons */}
        <button
          className="w-full bg-[#323130] text-white font-bold py-2 px-4 rounded mb-2"
          onClick={() => {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = imageUrl.split('/').pop() || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          Download Image
        </button>

        <button
          className="w-full bg-[#323130] text-white font-bold py-2 px-4 rounded"
          onClick={handleDownloadCard}
        >
          Download Card
        </button>
      </div>
    </div>
  );
};

export default IconDetailCard;
