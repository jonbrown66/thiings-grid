import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface IconDetailCardProps {
  imageUrl: string;
  downloadImageUrl: string; // Add this new prop for download
  description: string;
  title: string;
  tag: string;
  onClose: () => void;
}

const IconDetailCard: React.FC<IconDetailCardProps> = ({
  imageUrl,
  downloadImageUrl, // Destructure the new prop
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if the click is directly on the overlay, not on the card content
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;

    const downloadPromise = new Promise<void>(async (resolve, reject) => {
    const original = cardRef.current!;
      const clone = original.cloneNode(true) as HTMLElement;

      // 移除 clone 中的按钮和关闭元素
      const buttons = clone.querySelectorAll('button');
      buttons.forEach((btn) => btn.remove());

      // 移除可能影响渲染的 transform 样式
      clone.style.transform = 'none';
      clone.style.transition = 'none';
      clone.querySelectorAll('*').forEach((el) => {
        (el as HTMLElement).style.transform = 'none';
        (el as HTMLElement).style.transition = 'none';
      });

      // 设置统一样式防止字体偏移
      clone.style.fontFamily = 'Arial, sans-serif';
      clone.querySelectorAll('*').forEach((el) => {
        (el as HTMLElement).style.lineHeight = '1.2';
        (el as HTMLElement).style.verticalAlign = 'middle';
        (el as HTMLElement).style.fontFamily = 'Arial, sans-serif';
      });

      // 等待图片加载完成
      const imgElement = clone.querySelector('img');
      if (imgElement) {
        try {
          // 确保 crossOrigin 属性在设置 src 之前被设置
          imgElement.crossOrigin = 'anonymous';
          // 使用 downloadImageUrl 来确保获取的是最高质量的图片
          // 并且给它一个时间戳来防止浏览器缓存问题
          imgElement.src = `${downloadImageUrl}?t=${new Date().getTime()}`;

          // 等待图片加载完成
          if (imgElement && !imgElement.complete) {
            await new Promise<void>((res) => {
              imgElement.onload = () => res();
              imgElement.onerror = (e) => {
                console.error("Image failed to load for html2canvas:", e);
                // 即使图片加载失败，也调用 resolve 以避免 Promise 挂起
                res(); 
              };
            });
          }

          // 加入页面临时渲染
          clone.style.position = 'absolute';
          clone.style.left = '-9999px';
          document.body.appendChild(clone);

          const canvas = await html2canvas(clone, {
            backgroundColor: '#ffffff',
            useCORS: true,
            scale: window.devicePixelRatio || 2,
            ignoreElements: () => {
              // Optionally ignore elements that might cause issues, e.g., iframes or complex SVGs
              // return element.tagName === 'IFRAME' || element.tagName === 'SVG';
              return false; // For now, don't ignore any specific elements
            },
          });

          document.body.removeChild(clone);

          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `card-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve();
        } catch (error) {
          console.error("Failed to download card:", error);
          reject(error);
        }
      } else {
        reject(new Error("Image element not found for card download."));
      }
    });

    toast.promise(downloadPromise, {
      loading: '卡片下载中...',
      success: '卡片下载成功！',
      error: '卡片下载失败。请稍后再试。',
    });
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleOverlayClick} // Add click handler to overlay
    >
      <div
        ref={cardRef}
        className={`bg-white rounded-lg p-6 max-w-sm mx-auto relative transform transition-transform duration-300 ease-out ${
          isVisible ? 'scale-100' : 'scale-0'
        }`}
        style={{ fontFamily: 'Arial, sans-serif'}}
      >
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-12 h-12 flex items-center justify-center" // Make button square and center content
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
        <img src={imageUrl} alt="Icon" className="w-full h-auto mb-4" loading="lazy" />

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
          onClick={async () => {
            const downloadPromise = new Promise<void>(async (resolve, reject) => {
              try {
                const response = await fetch(downloadImageUrl);
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = downloadImageUrl.split('/').pop() || 'download';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url); // Clean up the object URL
                resolve();
              } catch (error) {
                console.error("Failed to download image:", error);
                reject(error);
              }
            });

            toast.promise(downloadPromise, {
              loading: '图片下载中...',
              success: '图片下载成功！',
              error: '图片下载失败。请稍后再试。',
            });
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
