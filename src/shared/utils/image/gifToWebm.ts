import { decompressFrames, parseGIF } from 'gifuct-js';

const TARGET_FPS = 30;
const BITRATE = 500_000;

export async function gifToWebm(gifFile: File): Promise<Blob> {
    if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder not supported in this browser');
    }

    const buffer = await gifFile.arrayBuffer();
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true);

    if (frames.length === 0) {
        throw new Error('GIF has no frames');
    }

    const { width, height } = gif.lsd;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D unavailable');

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';

    const stream = canvas.captureStream(TARGET_FPS);
    const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: BITRATE,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    const done = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () =>
            resolve(new Blob(chunks, { type: 'video/webm' }));
        recorder.onerror = (e) => reject(e);
    });

    recorder.start();
    await nextFrame(); // let recorder prime

    let prevDisposal = 0;
    let prevDims = { left: 0, top: 0, width: 0, height: 0 };
    let prevSnapshot: ImageData | null = null;

    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];

        // Handle disposal of the previous frame
        if (i > 0) {
            if (prevDisposal === 2) {
                // Restore to background: clear the previous frame's rect
                ctx.clearRect(
                    prevDims.left,
                    prevDims.top,
                    prevDims.width,
                    prevDims.height
                );
            } else if (prevDisposal === 3 && prevSnapshot) {
                // Restore to previous state
                ctx.putImageData(prevSnapshot, 0, 0);
            }
        }

        // Save state for restore-to-previous
        if (frame.disposalType === 3) {
            prevSnapshot = ctx.getImageData(0, 0, width, height);
        }

        // Draw the current frame's patch
        if (frame.patch && frame.dims) {
            const { left, top, width: w, height: h } = frame.dims;
            if (w > 0 && h > 0) {
                const patchCanvas = document.createElement('canvas');
                patchCanvas.width = w;
                patchCanvas.height = h;
                const patchCtx = patchCanvas.getContext('2d');
                if (patchCtx) {
                    const imageData = new ImageData(frame.patch, w, h);
                    patchCtx.putImageData(imageData, 0, 0);
                    ctx.drawImage(patchCanvas, left, top);
                }
            }
        }

        prevDisposal = frame.disposalType;
        prevDims = frame.dims;

        // Wait for this frame's display duration (min 20ms so recorder captures it)
        const delay = Math.max(frame.delay || 100, 20);
        await new Promise((r) => setTimeout(r, delay));
    }

    // Tail delay so the last frame is captured
    await new Promise((r) => setTimeout(r, 100));

    recorder.stop();
    const blob = await done;

    if (blob.size === 0) {
        throw new Error('WebM conversion produced empty output');
    }

    return blob;
}

function nextFrame(): Promise<void> {
    return new Promise((resolve) => {
        requestAnimationFrame(() => resolve());
    });
}
