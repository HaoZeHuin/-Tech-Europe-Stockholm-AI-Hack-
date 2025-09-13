import { useEffect, useRef, useState } from "react";

interface GoopBlob {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
  opacity: number;
  hue: number;
  delay: number;
}

export function CursorGoop() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mouseSpeed, setMouseSpeed] = useState(0);
  const [blobs, setBlobs] = useState<GoopBlob[]>([]);
  const blobIdRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const speed = Math.sqrt(
        Math.pow(e.clientX - lastMousePos.current.x, 2) + 
        Math.pow(e.clientY - lastMousePos.current.y, 2)
      );
      setMouseSpeed(Math.min(speed * 0.1, 3)); // Cap the speed effect
      setMousePos({ x: e.clientX, y: e.clientY });
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let hueCounter = 0;
    
    const createBlob = () => {
      const speedMultiplier = 1 + mouseSpeed * 0.3; // Size varies with speed
      const baseScale = Math.random() * 0.6 + 0.4; // More size variation
      
      const newBlob: GoopBlob = {
        id: blobIdRef.current++,
        x: mousePos.x,
        y: mousePos.y,
        targetX: mousePos.x,
        targetY: mousePos.y,
        scale: baseScale * speedMultiplier, // Dynamic scale based on speed
        opacity: 1,
        hue: hueCounter,
        delay: Math.random() * 50,
      };

      hueCounter = (hueCounter + 8) % 360; // Much more gradual color progression
      setBlobs(prev => [...prev.slice(-6), newBlob]); // Keep max 7 blobs
    };

    const interval = setInterval(createBlob, 150); // Slower blob creation
    return () => clearInterval(interval);
  }, [mousePos]);

  useEffect(() => {
    const animate = () => {
      setBlobs(prevBlobs => 
        prevBlobs.map(blob => {
          // Much smoother following with easing
          const ease = 0.04; // Slower, smoother motion
          const newX = blob.x + (mousePos.x - blob.x) * ease;
          const newY = blob.y + (mousePos.y - blob.y) * ease;
          
          return {
            ...blob,
            x: newX,
            y: newY,
            opacity: Math.max(0, blob.opacity - 0.005), // Slower fade
            scale: blob.scale * 0.9995, // Much slower shrink
          };
        }).filter(blob => blob.opacity > 0.15) // Keep blobs longer
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos]);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-20"
      style={{ mixBlendMode: 'multiply' }}
    >
      {blobs.map((blob, index) => (
        <div
          key={blob.id}
          className="absolute rounded-full transition-all duration-500 ease-out"
          style={{
            left: blob.x - (50 * blob.scale),
            top: blob.y - (50 * blob.scale),
            width: 100 * blob.scale,
            height: 100 * blob.scale,
            background: `radial-gradient(circle, 
              hsla(${blob.hue}, 60%, 85%, ${blob.opacity * 0.15}) 0%,
              hsla(${blob.hue + 10}, 55%, 80%, ${blob.opacity * 0.12}) 50%,
              hsla(${blob.hue + 20}, 50%, 75%, ${blob.opacity * 0.08}) 80%,
              transparent 100%
            )`,
            filter: `blur(${3 + index * 0.5}px)`,
            transform: `scale(${blob.scale})`,
            zIndex: -index,
          }}
        />
      ))}
      
      {/* Main cursor blob */}
      <div
        className="absolute rounded-full transition-all duration-300 ease-out"
        style={{
          left: mousePos.x - (30 + mouseSpeed * 5),
          top: mousePos.y - (30 + mouseSpeed * 5),
          width: 60 + mouseSpeed * 10,
          height: 60 + mouseSpeed * 10,
          background: `radial-gradient(circle,
            hsla(260, 50%, 85%, 0.2) 0%,
            hsla(200, 55%, 80%, 0.15) 30%,
            hsla(140, 60%, 85%, 0.1) 60%,
            hsla(80, 65%, 80%, 0.05) 80%,
            transparent 100%
          )`,
          filter: 'blur(4px)',
        }}
      />
    </div>
  );
}