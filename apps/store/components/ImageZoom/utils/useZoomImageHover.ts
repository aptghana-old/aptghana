"use client"
import {useCallback, useEffect, useRef, useState} from "react"
import {createZoomImageHover as _createZoomImageHover, ZoomImageHoverState} from "../core/createZoomImageHover"


export default function useZoomImageHover() {
    const result = useRef<ReturnType<typeof _createZoomImageHover>>(undefined)
    const [zoomImageState, updateZoomImageState] = useState<ZoomImageHoverState>({
        enabled: false,
        zoomedImgStatus: "idle",
    })

    const createZoomImage = useCallback((create?: boolean, ...arg: Parameters<typeof _createZoomImageHover>) => {
        result.current?.cleanup()
        if (create) {
            result.current = _createZoomImageHover(...arg)
            updateZoomImageState(result.current.getState())

            result.current.subscribe(({state}: any) => {
                updateZoomImageState(state)
            })
        }
    }, [])

    useEffect(() => {
        return () => {
            result.current?.cleanup()
        }
    }, [])

    const setZoomImageState = useCallback((state: any) => {
        result.current?.setState(state)
    }, [])

    return {
        createZoomImage,
        zoomImageState,
        setZoomImageState,
    }
}
