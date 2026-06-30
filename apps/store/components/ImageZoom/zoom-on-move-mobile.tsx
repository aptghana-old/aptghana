// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { useGesture } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/web";
import useWindowSize from "~/hooks/use-window-size";

type ImageZoomProps = {
  src: string;
  alt?: string;
};

const ZoomOnMoveMobile: React.FC<ImageZoomProps> = ({ src, alt }) => {
  const { windowSize, isMobile } = useWindowSize();

  const [{ x, y, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    config: { tension: 300, friction: 30 },
  }));

  // State for double-click zoom
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    api.start({
      scale: (windowSize.width ?? 0) < 1024 ? (isMobile ? 1.75 : 1.25) : 0.75,
    });
  }, [api, isMobile, windowSize]);

  const handleDoubleClick = () => {
    setIsZoomed((prev) => !prev);
  };

  useEffect(() => {
    // Apply scale change on double-click
    api.start({
      scale: isZoomed ? 2 : 1,
      config: { tension: 300, friction: 30 },
    });
  }, [isZoomed, api]);

  const bind = useGesture(
    {
      onPinch: ({ offset: [d] }) => api.start({ scale: d }),
      onDrag: ({ offset: [dx, dy] }) => api.start({ x: dx, y: dy }),
    },
    {
      drag: {
        bounds: isZoomed
          ? {
              left: -800,
              right: 800,
              top: -1000,
              bottom: 1000,
            }
          : {
              left: -400,
              right: 400,
              top: -400,
              bottom: 400,
            },
      },
      pinch: { scaleBounds: { min: 1, max: 4 } },
    }
  );

  return (
    <div
      style={{
        touchAction: "none",
        overflow: "hidden",
        width: "100vw",
        height: "100vh",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "grabbing",
      }}
      onDoubleClick={handleDoubleClick} // Double-click handler
    >
      <animated.img
        {...bind()}
        src={src}
        alt={alt}
        style={{
          transformOrigin: "center center",
          x,
          y,
          scale,
        }}
        draggable={false}
      />
    </div>
  );
};

export default ZoomOnMoveMobile;
