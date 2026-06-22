import { useEffect, useState } from 'react';

function isMidFiActive() {
  return document.body.classList.contains('proto-midfi');
}

/** Reactively tracks whether the page is in mid-fi mode (body.proto-midfi). */
export function useMidFiMode(): boolean {
  const [midFi, setMidFi] = useState(isMidFiActive);

  useEffect(() => {
    const observer = new MutationObserver(() => setMidFi(isMidFiActive()));
    observer.observe(document.body, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return midFi;
}
