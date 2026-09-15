"use client";

import { useEffect, useState } from "react";

// Devuelve `value` con un retraso (300ms por defecto): mientras el usuario
// sigue escribiendo, no se actualiza; solo "se asienta" cuando deja de
// teclear. Se usa para no filtrar listas grandes en cada pulsación.
export default function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}
