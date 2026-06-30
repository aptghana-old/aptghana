import { createStore } from "../../../hooks/use-store"
import { imageLoader } from "./imageLoader"
import { disableScroll } from "../core"

export type ZoomedImgStatus = "idle" | "loading" | "loaded" | "error"

export type ZoomImageMoveOptions = {
    zoomFactor?: number
    isMobile?: boolean
    isDrawing?: boolean
    isSchneider?: boolean
    zoomImageSource?: string
    disableScrollLock?: boolean
    zoomImageProps?: {
        alt?: string
    }
}

export type ZoomImageMoveState = {
    zoomedImgStatus: ZoomedImgStatus
}

export function createZoomImageMove(container: HTMLElement, options: ZoomImageMoveOptions = {}) {
    const finalOptions: Omit<Required<ZoomImageMoveOptions>, "zoomImageProps"> = {
        zoomFactor: options.zoomFactor ?? 1.75,
        zoomImageSource: options.zoomImageSource ?? "",
        disableScrollLock: options.disableScrollLock ?? false,
        isMobile: options.isMobile ?? false,
        isSchneider: options.isSchneider ?? false,
        isDrawing: options.isDrawing ?? false
    }

    const { disableScrollLock, zoomFactor, zoomImageSource } = finalOptions

    const store = createStore<ZoomImageMoveState>({
        zoomedImgStatus: "idle",
    })

    const zoomedImg = container.appendChild(document.createElement("img"))
    zoomedImg.alt = options.zoomImageProps?.alt || ""
    zoomedImg.style.position = "fixed"
    zoomedImg.style.maxWidth = finalOptions.isMobile ? "50%" : "none"
    zoomedImg.style.height = finalOptions.isMobile ? "50%" : "none"
    zoomedImg.style.top = finalOptions.isMobile ? "25%" : finalOptions.isSchneider ? "40%" : finalOptions.isDrawing ? "30%" : "55%"
    zoomedImg.style.left = finalOptions.isMobile ? "25%" : finalOptions.isSchneider ? "63%" : finalOptions.isDrawing ? "30%" : "55%"

    function handlePointerEnter(event: PointerEvent) {
        zoomedImg.style.display = "block"
        zoomedImg.style.width = `max-content`
        zoomedImg.style.height = finalOptions.isMobile ? "50%" : finalOptions.isSchneider ? "75%" : "65%"
        imageLoader.createZoomImage(zoomedImg, zoomImageSource, store)

        processZoom(event)

        if (!disableScrollLock) disableScroll()
    }

    function handlePointerMove(event: PointerEvent) {
        processZoom(event)
    }

    const calculatePositionX = (newPositionX: number, containerWidth: number, imgWidth: number) => {
        if (newPositionX > 0) return 0; // Prevent left overflow
        if (newPositionX + imgWidth < containerWidth) return containerWidth - imgWidth; // Prevent right overflow
        return newPositionX;
    };

    const calculatePositionY = (newPositionY: number, containerHeight: number, imgHeight: number) => {
        if (newPositionY > 0) return 0; // Prevent top overflow
        if (newPositionY + imgHeight < containerHeight) return containerHeight - imgHeight; // Prevent bottom overflow
        return newPositionY;
    };

    function processZoom(event: PointerEvent) {
        zoomedImg.style.display = "block";

        const containerRect = container.getBoundingClientRect();
        const zoomPointX = event.clientX - containerRect.left;
        const zoomPointY = event.clientY - containerRect.top;

        // Calculate image dimensions
        const imgWidth = zoomedImg.naturalWidth * zoomFactor;
        const imgHeight = zoomedImg.naturalHeight * zoomFactor;

        // Adjust translation to prevent out-of-bounds issues
        const currentPositionX = calculatePositionX(
            -zoomPointX * zoomFactor + zoomPointX,
            containerRect.width,
            imgWidth
        );
        const currentPositionY = calculatePositionY(
            -zoomPointY * zoomFactor + zoomPointY,
            containerRect.height,
            imgHeight
        );

        zoomedImg.style.transform = `translate(${currentPositionX}px, ${currentPositionY}px) scale(${zoomFactor})`;
    }


    const controller = new AbortController()
    const { signal } = controller
    container.addEventListener("pointermove", handlePointerMove, { signal })
    container.addEventListener("pointerenter", handlePointerEnter, { signal })

    return {
        cleanup: () => {
            controller.abort()
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            container.contains(zoomedImg) && container.removeChild(zoomedImg)
            container.style.width = "100%"
            container.style.height = "100%"
            store.cleanup()
        },
        subscribe: store.subscribe,
        getState: store.getState,
    }
}