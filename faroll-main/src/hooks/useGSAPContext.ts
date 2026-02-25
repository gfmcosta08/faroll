import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Executa animações GSAP dentro de um contexto com escopo (ref) e faz
 * revert no unmount para evitar vazamento de timelines e ScrollTriggers.
 * Use o ref no container que envolve os elementos animados.
 */
export function useGSAPContext<T extends HTMLElement>(
  scopeRef: RefObject<T | null>,
  callback: () => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    if (!scopeRef.current) return;
    const ctx = gsap.context(() => callback(), scopeRef);
    return () => ctx.revert();
  }, [scopeRef, ...deps]);
}
