declare module 'react-confetti' {
    import * as React from 'react';

    interface ConfettiProps {
        width?: number | undefined;
        height?: number | undefined;
        numberOfPieces?: number | undefined;
        confettiSource?: {
            x?: number | undefined;
            y?: number | undefined;
            w?: number | undefined;
            h?: number | undefined;
        } | undefined;
        recycle?: boolean | undefined;
        wind?: number | undefined;
        gravity?: number | undefined;
        friction?: number | undefined;
        colors?: string[] | undefined;
        opacity?: number | undefined;
        run?: boolean | undefined;
        tweenDuration?: number | undefined;
        tweenFunction?: ((currentTime: number, currentValue: number, targetValue: number, duration: number, s?: number | undefined) => number) | undefined;
        drawShape?: ((context: CanvasRenderingContext2D) => void) | undefined;
        onConfettiComplete?: (() => void) | undefined;
    }

    const Confetti: React.FC<ConfettiProps>;
    export default Confetti;
}
