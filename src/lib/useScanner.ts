import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

interface UseScannerOpts {
  active: boolean;
  onDetected: (code: string) => void;
}

type ErrKind = 'denied' | 'notfound' | 'unsupported' | 'unknown';

export interface ScannerState {
  videoRef: React.RefObject<HTMLVideoElement>;
  running: boolean;
  error: string | null;
  errorKind: ErrKind | null;
  supported: boolean;
  start: () => Promise<void>;
  stop: () => void;
  restart: () => Promise<void>;
}

export function useScanner({ active, onDetected }: UseScannerOpts): ScannerState {
  const videoRef = useRef<HTMLVideoElement | null>(null) as React.RefObject<HTMLVideoElement>;
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrKind | null>(null);
  const [supported] = useState(true);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const stop = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setRunning(false);
  }, []);

  const classify = (e: unknown): { msg: string; kind: ErrKind } => {
    const name = (e as { name?: string })?.name || '';
    const msg = String((e as Error)?.message || e);
    if (name === 'NotAllowedError' || /permission|denied/i.test(msg))
      return { msg: 'Camera permission denied. Allow camera access in your browser, or enter the barcode manually.', kind: 'denied' };
    if (name === 'NotFoundError' || /not found|no camera|notfound/i.test(msg))
      return { msg: 'No camera found on this device. Enter the barcode manually below.', kind: 'notfound' };
    if (name === 'NotReadableError' || /in use|busy/i.test(msg))
      return { msg: 'Camera is being used by another app. Close it and try again, or enter the barcode manually.', kind: 'unknown' };
    return { msg: 'Could not start camera. Enter the barcode manually below.', kind: 'unknown' };
  };

  const start = useCallback(async () => {
    setError(null);
    setErrorKind(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser. Enter the barcode manually.');
      setErrorKind('unsupported');
      return;
    }
    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 180,
        });
      }
      // Stop any previous session before starting a new one
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      const controls = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result, err) => {
          if (result) {
            const code = result.getText().trim();
            if (code) onDetectedRef.current(code);
          }
        },
      );
      controlsRef.current = controls;
      setRunning(true);
    } catch (e) {
      const { msg, kind } = classify(e);
      setError(msg);
      setErrorKind(kind);
      setRunning(false);
    }
  }, []);

  const restart = useCallback(async () => {
    stop();
    await start();
  }, [start, stop]);

  useEffect(() => {
    if (active) start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { videoRef, running, error, errorKind, supported, start, stop, restart };
}
