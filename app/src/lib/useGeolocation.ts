import { useState, useCallback } from 'react';

interface GeoState {
  coords: [number, number] | null;
  status: 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported' | 'error';
  errorMessage: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ coords: null, status: 'idle', errorMessage: null });

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ coords: null, status: 'unsupported', errorMessage: 'Geolocation is not supported by this browser.' });
      return;
    }
    setState((s) => ({ ...s, status: 'loading' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          coords: [pos.coords.latitude, pos.coords.longitude],
          status: 'granted',
          errorMessage: null,
        });
      },
      (err) => {
        setState({
          coords: null,
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
          errorMessage: err.message,
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  const clear = useCallback(() => {
    setState({ coords: null, status: 'idle', errorMessage: null });
  }, []);

  return { ...state, request, clear };
}
