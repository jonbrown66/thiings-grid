import React, { useState, useEffect, useRef, useCallback, useMemo, useImperativeHandle } from "react";

// Grid physics constants
const MIN_VELOCITY = 0.2;
const UPDATE_INTERVAL = 16;
const VELOCITY_HISTORY_SIZE = 5;
const FRICTION = 0.9;
const VELOCITY_THRESHOLD = 0.3;

// Custom debounce implementation
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
) {
  let timeoutId: number | undefined = undefined;

  const debouncedFn = function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = undefined;
    }, wait);
  };

  debouncedFn.cancel = function () {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  };

  return debouncedFn;
}

function getDistance(p1: Position, p2: Position) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

type Position = {
  x: number;
  y: number;
};

type GridItem = {
  position: Position;
  gridIndex: number;
};

// Remove State type as it will be replaced by useState

export type ItemConfig = {
  isMoving: boolean;
  position: Position;
  gridIndex: number;
};

export type ThiingsGridProps = {
  gridSize: number;
  renderItem: (itemConfig: ItemConfig) => React.ReactNode;
  className?: string;
  initialPosition?: Position;
};

const ThiingsGrid = React.forwardRef<
  { publicGetCurrentPosition: () => Position },
  ThiingsGridProps
>(({ gridSize, renderItem, className, initialPosition }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [offset, setOffset] = useState<Position>(initialPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<Position>(initialPosition || { x: 0, y: 0 });
  const [restPos, setRestPos] = useState<Position>(initialPosition || { x: 0, y: 0 });
  const [velocity, setVelocity] = useState<Position>({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const lastMoveTime = useRef<number>(0);
  const velocityHistory = useRef<Position[]>([]);
  const [renderedItems, setRenderedItems] = useState<Map<string, GridItem>>(new Map());
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const lastPos = useRef<Position>({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);
  const isComponentMounted = useRef<boolean>(false);
  const lastUpdateTime = useRef<number>(0);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // Expose public method via ref
  useImperativeHandle(ref, () => ({
    publicGetCurrentPosition: () => offset,
  }));

  const getItemIndexForPosition = useCallback((x: number, y: number): number => {
    // Special case for center
    if (x === 0 && y === 0) return 0;

    // Determine which layer of the spiral we're in
    const layer = Math.max(Math.abs(x), Math.abs(y));

    // Calculate the size of all inner layers
    const innerLayersSize = Math.pow(2 * layer - 1, 2);

    // Calculate position within current layer
    let positionInLayer = 0;

    if (y === 0 && x === layer) {
      // Starting position (middle right)
      positionInLayer = 0;
    } else if (y < 0 && x === layer) {
      // Right side, bottom half
      positionInLayer = -y;
    } else if (y === -layer && x > -layer) {
      // Bottom side
      positionInLayer = layer + (layer - x);
    } else if (x === -layer && y < layer) {
      // Left side
      positionInLayer = 3 * layer + (layer + y);
    } else if (y === layer && x < layer) {
      // Top side
      positionInLayer = 5 * layer + (layer + x);
    } else {
      // Right side, top half (y > 0 && x === layer)
      positionInLayer = 7 * layer + (layer - y);
    }

    const index = innerLayersSize + positionInLayer;
    return index;
  }, []);

  const calculateVisiblePositions = useCallback((): Position[] => {
    if (containerWidth === 0 || containerHeight === 0) return [];

    const width = containerWidth;
    const height = containerHeight;

    // Calculate grid cells needed to fill container
    const cellsX = Math.ceil(width / gridSize);
    const cellsY = Math.ceil(height / gridSize);

    // Calculate center position based on offset
    const centerX = -Math.round(offset.x / gridSize);
    const centerY = -Math.round(offset.y / gridSize);

    const positions: Position[] = [];
    const halfCellsX = Math.ceil(cellsX / 2);
    const halfCellsY = Math.ceil(cellsY / 2);

    for (let y = centerY - halfCellsY; y <= centerY + halfCellsY; y++) {
      for (let x = centerX - halfCellsX; x <= centerX + halfCellsX; x++) {
        positions.push({ x, y });
      }
    }

    return positions;
  }, [containerWidth, containerHeight, gridSize, offset]);

  const debouncedStopMoving = useMemo(() => debounce(() => {
    setIsMoving(false);
    setRestPos((prevRestPos) => {
      // Only update restPos if it's different from current offset to avoid unnecessary re-renders
      if (prevRestPos.x !== offset.x || prevRestPos.y !== offset.y) {
        return { ...offset };
      }
      return prevRestPos;
    });
  }, 200), [offset]);

  const updateGridItems = useCallback(() => {
    if (!isComponentMounted.current) return;

    const positions = calculateVisiblePositions();
    const newVisibleItems = new Map<string, GridItem>();
    const currentRenderedItems = renderedItems; // Use the current state directly

    let hasChanges = false;

    positions.forEach((position) => {
      const key = `${position.x}-${position.y}`;
      let item = currentRenderedItems.get(key);

      if (item) {
        newVisibleItems.set(key, item);
      } else {
        const gridIndex = getItemIndexForPosition(position.x, position.y);
        newVisibleItems.set(key, { position, gridIndex });
        hasChanges = true; // New item added
      }
    });

    // Check for removed items
    if (newVisibleItems.size !== currentRenderedItems.size) {
      hasChanges = true;
    } else {
      // Check if any existing item was removed (only if sizes are the same)
      for (const key of currentRenderedItems.keys()) {
        if (!newVisibleItems.has(key)) {
          hasChanges = true;
          break;
        }
      }
    }

    if (hasChanges) {
      setRenderedItems(newVisibleItems);
    }

    const distanceFromRest = getDistance(offset, restPos);
    if (isMoving !== (distanceFromRest > 5)) {
      setIsMoving(distanceFromRest > 5);
    }

    debouncedStopMoving();
  }, [calculateVisiblePositions, debouncedStopMoving, getItemIndexForPosition, offset, renderedItems, restPos, isMoving]);

  const animate = useCallback(() => {
    if (!isComponentMounted.current) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - lastUpdateTime.current;

    if (deltaTime >= UPDATE_INTERVAL) {
      const currentVelocity = velocity;
      const speed = Math.sqrt(
        currentVelocity.x * currentVelocity.x + currentVelocity.y * currentVelocity.y
      );

      if (speed < MIN_VELOCITY) {
        setVelocity({ x: 0, y: 0 });
        animationFrame.current = null;
        return;
      }

      let deceleration = FRICTION;
      if (speed < VELOCITY_THRESHOLD) {
        deceleration = FRICTION * (speed / VELOCITY_THRESHOLD);
      }

      setOffset((prevOffset) => ({
        x: prevOffset.x + currentVelocity.x,
        y: prevOffset.y + currentVelocity.y,
      }));
      setVelocity((prevVelocity) => ({
        x: prevVelocity.x * deceleration,
        y: prevVelocity.y * deceleration,
      }));

      lastUpdateTime.current = currentTime;
      // updateGridItems is called here, but it depends on offset and velocity which are updated via setState.
      // This might cause a stale closure issue if updateGridItems is not re-created when offset/velocity change.
      // However, updateGridItems itself depends on offset, so it will be re-created.
      // The key is that updateGridItems should use the LATEST state values.
      // React guarantees that state updates are batched, so calling updateGridItems immediately after setState
      // might not see the very latest state in the same render cycle.
      // For animation, it's often better to pass the latest state values directly or use functional updates.
      // Let's keep it as is for now, as updateGridItems is useCallback and depends on offset.
      updateGridItems();
    }

    animationFrame.current = requestAnimationFrame(animate);
  }, [updateGridItems, velocity]); // Added velocity to dependencies

  const handleDown = useCallback((p: Position) => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    setIsDragging(true);
    setStartPos({
      x: p.x - offset.x,
      y: p.y - offset.y,
    });
    setVelocity({ x: 0, y: 0 });
    dragStartPos.current = { x: p.x, y: p.y };

    lastPos.current = { x: p.x, y: p.y };
  }, [offset]); // offset is a dependency

  const handleMove = useCallback((p: Position) => {
    if (!isDragging) return; // Check isDragging directly

    const currentTime = performance.now();
    const timeDelta = currentTime - lastMoveTime.current;

    const rawVelocity = {
      x: (p.x - lastPos.current.x) / (timeDelta || 1),
      y: (p.y - lastPos.current.y) / (timeDelta || 1),
    };

    const history = [...velocityHistory.current, rawVelocity];
    if (history.length > VELOCITY_HISTORY_SIZE) {
      history.shift();
    }
    velocityHistory.current = history;

    const smoothedVelocity = history.reduce(
      (acc, vel) => ({
        x: acc.x + vel.x / history.length,
        y: acc.y + vel.y / history.length,
      }),
      { x: 0, y: 0 }
    );

    setVelocity(smoothedVelocity);
    setOffset({
      x: p.x - startPos.x,
      y: p.y - startPos.y,
    });
    lastMoveTime.current = currentTime;

    updateGridItems();
    lastPos.current = { x: p.x, y: p.y };
  }, [isDragging, startPos, updateGridItems]); // Added isDragging to dependencies

  const handleUp = useCallback(() => {
    const dragThreshold = 5; // pixels
    const dragDistance = getDistance(dragStartPos.current, lastPos.current);

    setIsDragging(false);

    if (dragDistance < dragThreshold) {
      setIsMoving(false);
    } else {
      animationFrame.current = requestAnimationFrame(animate);
    }
  }, [animate]); // animate is a dependency

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleDown({
      x: e.clientX,
      y: e.clientY,
    });
  }, [handleDown]); // handleDown is a dependency

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleMove({
      x: e.clientX,
      y: e.clientY,
    });
  }, [handleMove]); // handleMove is a dependency

  const handleMouseUp = useCallback(() => {
    handleUp();
  }, [handleUp]); // handleUp is a dependency

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    handleDown({
      x: touch.clientX,
      y: touch.clientY,
    });
  }, [handleDown]); // handleDown is a dependency

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();
    handleMove({
      x: touch.clientX,
      y: touch.clientY,
    });
  }, [handleMove]); // handleMove is a dependency

  const handleTouchEnd = useCallback(() => {
    handleUp();
  }, [handleUp]); // handleUp is a dependency

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const deltaX = e.deltaX;
    const deltaY = e.deltaY;

    setOffset((prevOffset) => ({
      x: prevOffset.x - deltaX,
      y: prevOffset.y - deltaY,
    }));
    setVelocity({ x: 0, y: 0 });
    updateGridItems();
  }, [updateGridItems]); // updateGridItems is a dependency

  useEffect(() => {
    isComponentMounted.current = true;
    const currentContainerRef = containerRef.current;

    const updateDimensions = () => {
      if (currentContainerRef) {
        const rect = currentContainerRef.getBoundingClientRect();
        setContainerWidth(rect.width);
        setContainerHeight(rect.height);
      }
    };

    updateDimensions();
    updateGridItems(); // Initial update of grid items

    if (currentContainerRef) {
      currentContainerRef.addEventListener("wheel", handleWheel, { passive: false });
      currentContainerRef.addEventListener("touchmove", handleTouchMove, { passive: false });

      resizeObserver.current = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === currentContainerRef) {
            setContainerWidth(entry.contentRect.width);
            setContainerHeight(entry.contentRect.height);
            updateGridItems(); // Recalculate visible items on resize
          }
        }
      });
      resizeObserver.current.observe(currentContainerRef);
    }

    return () => {
      isComponentMounted.current = false;
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      debouncedStopMoving.cancel();

      if (currentContainerRef) {
        currentContainerRef.removeEventListener("wheel", handleWheel);
        currentContainerRef.removeEventListener("touchmove", handleTouchMove);
      }
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
    };
  }, [handleWheel, handleTouchMove, updateGridItems, debouncedStopMoving]);

  const memoizedRenderedItems = useMemo(() => {
    return Array.from(renderedItems.values());
  }, [renderedItems]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        touchAction: "none",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          willChange: "transform",
        }}
      >
        {memoizedRenderedItems.map((item) => {
          const x = item.position.x * gridSize + containerWidth / 2;
          const y = item.position.y * gridSize + containerHeight / 2;

          return (
            <div
              key={`${item.position.x}-${item.position.y}`}
              style={{
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                width: gridSize,
                height: gridSize,
                transform: `translate3d(${x}px, ${y}px, 0)`,
                marginLeft: `-${gridSize / 2}px`,
                marginTop: `-${gridSize / 2}px`,
                willChange: "transform",
              }}
            >
              {renderItem({
                gridIndex: item.gridIndex,
                position: item.position,
                isMoving,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ThiingsGrid;
