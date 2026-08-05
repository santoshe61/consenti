"use client";

import {
  ElementType,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type SeeMoreProps = {
  tag?: ElementType;
  className?: string;
  children: ReactNode;
  lines?: 1 | 2 | 3 | 4 | 5 | 6;
};

const lineClampClasses = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

export function SeeMore({
  tag: Root = "div",
  className = "",
  children,
  lines = 4,
}: SeeMoreProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setShowButton(el.scrollHeight > el.clientHeight + 1);
    };

    requestAnimationFrame(checkOverflow);

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);

    window.addEventListener("resize", checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [children, expanded]);

  return (
    <Root>
      <div
        ref={contentRef}
        className={`${className} ${!expanded ? lineClampClasses[lines] : ""
          }`}
      >
        {children}
      </div>

      {showButton && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-sm font-medium text-blue-600 hover:underline"
        >
          See more
        </button>
      )}
    </Root>
  );
}