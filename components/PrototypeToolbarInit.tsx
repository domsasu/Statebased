import { useEffect } from 'react';
import { buildPrototypeToolbarConfig } from '../config/prototypeToolbar';

/** Mounts the vanilla prototype toolbar (public/prototype-toolbar.js). */
export function PrototypeToolbarInit() {
  useEffect(() => {
    if (!window.PrototypeToolbar) return;

    window.PrototypeToolbar.init(buildPrototypeToolbarConfig());
  }, []);

  return null;
}
