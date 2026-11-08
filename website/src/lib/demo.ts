import { animate } from 'motion';

type Keyframes = Record<string, unknown>;
type Options = Record<string, unknown>;

export interface DemoContext {
  /** Fire an animation. It is stopped automatically when the demo leaves view. */
  animate: (target: Element, keyframes: Keyframes, options?: Options) => void;
  /** Pause for a number of seconds. */
  wait: (seconds: number) => Promise<void>;
  /** Count a number into the element's text. */
  count: (element: Element, from: number, to: number, seconds: number) => Promise<void>;
}

/**
 * Runs a demo loop while its element is on screen, and stops it otherwise.
 * With `prefers-reduced-motion` it does nothing, leaving the static markup.
 */
export function runDemo(root: Element, build: (ctx: DemoContext) => Promise<void>): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  let controller: AbortController | null = null;
  let running = false;
  let onScreen = false;

  const start = () => {
    if (running || document.hidden || !onScreen) {
      return;
    }
    running = true;
    controller = new AbortController();
    build(createContext(controller.signal))
      .catch(() => {
        // Aborted loops reject; nothing to do.
      })
      .finally(() => {
        running = false;
        controller = null;
      });
  };

  const stop = () => {
    controller?.abort();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        onScreen = entry.isIntersecting;
        if (onScreen) {
          start();
        } else {
          stop();
        }
      }
    },
    { threshold: 0.3 },
  );
  observer.observe(root);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });
}

function createContext(signal: AbortSignal): DemoContext {
  const active = new Set<{ stop: () => void }>();
  const aborted = () => new DOMException('demo aborted', 'AbortError');

  const play = (target: Element, keyframes: Keyframes, options: Options) => {
    const controls = (animate as unknown as (t: Element, k: Keyframes, o: Options) => { stop: () => void })(
      target,
      keyframes,
      options,
    );
    active.add(controls);
    return controls;
  };

  const wait = (seconds: number) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(aborted());
        return;
      }
      const timer = setTimeout(resolve, seconds * 1000);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(aborted());
        },
        { once: true },
      );
    });

  const animateFn: DemoContext['animate'] = (target, keyframes, options = {}) => {
    if (signal.aborted) {
      return;
    }
    play(target, keyframes, options);
  };

  const count: DemoContext['count'] = async (element, from, to, seconds) => {
    const steps = Math.max(1, Math.round(seconds * 24));
    for (let index = 0; index <= steps; index += 1) {
      if (signal.aborted) {
        throw aborted();
      }
      element.textContent = String(Math.round(from + (to - from) * (index / steps)));
      await wait(seconds / steps);
    }
  };

  signal.addEventListener(
    'abort',
    () => {
      for (const controls of active) {
        controls.stop();
      }
      active.clear();
    },
    { once: true },
  );

  return { animate: animateFn, wait, count };
}
