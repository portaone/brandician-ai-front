import { LoaderConfig } from "../../lib/loader-constants";
import { useEffect, useState } from "react";

interface BrandicianLoaderProps {
  config?: LoaderConfig;
  isComplete?: boolean;
  onHidden?: () => void;
}

const BrandicianLoader: React.FC<BrandicianLoaderProps> = ({
  config,
  isComplete = false,
  onHidden,
}) => {
  const { loadingText, steps } = config || {};
  const [visibleSteps, setVisibleSteps] = useState<number>(0);
  const [shouldHide, setShouldHide] = useState(false);

  // Animate steps one by one
  useEffect(() => {
    if (isComplete) {
      // Show all steps immediately on completion
      setVisibleSteps(steps?.length ?? 0);

      // Hide the loader after 5 second delay
      const hideTimer = setTimeout(() => {
        setShouldHide(true);
        onHidden?.();
      }, 5000);

      return () => clearTimeout(hideTimer);
    } else {
      // During loading, animate steps one by one
      if (visibleSteps < (steps?.length ?? 0)) {
        const timer = setTimeout(() => {
          setVisibleSteps((prev) => prev + 1);
        }, 400); // Delay between each step animation

        return () => clearTimeout(timer);
      }
    }
  }, [visibleSteps, steps, isComplete, onHidden]);

  if (shouldHide) {
    return null;
  }

  return (
    <div className="loader-container flex-col">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 233.7 115.8"
        width="234"
        height="116"
        className={isComplete ? "opacity-50" : ""}
      >
        <g>
          <path
            fill="#383236"
            d="M231.5,66.1c-1.3-1.2-4.9-3.5-10,1.2-1.5,1.3-3.2,3.2-5.4,5.6-5.4,5.9-13.1,14.2-22.4,20.2v-54.1c0-12.3-7.1-24.6-18.6-32.2-5.9-3.9-12.4-6.1-19.4-6.7-1.2-.1-2.5-.2-3.8-.2-4.9,0-10.1.7-15.8,2.2-7.2,1.9-13.2,3.2-19.2,3.2-5.9,0-12-1.4-19.2-3.2-7.2-1.9-13.6-2.6-19.6-2.1-7,.6-13.6,2.8-19.4,6.7-11.5,7.5-18.6,19.9-18.6,32.2v54.1c-9.4-6.1-17-14.3-22.4-20.2-2.2-2.4-3.9-4.2-5.4-5.6-5.2-4.7-8.7-2.4-10-1.2C.8,67.4,0,69.2,0,71.3c-.2,7.9,13.2,21.7,13.3,21.9,21.8,21.6,43.6,22.7,103.5,22.7s81.8-1.1,103.5-22.7c.1-.1,13.5-14,13.3-21.9,0-2-.8-3.9-2.2-5.1ZM182.6,101.4c-14.7,3.1-34.6,3.4-65.8,3.4s-51.1-.3-65.8-3.4v-62.4c0-8.6,5.2-17.4,13.6-23,8.3-5.5,17.7-6.5,30.2-3.2,8,2.1,14.8,3.5,21.9,3.6h.1c7.1,0,13.9-1.5,21.9-3.6,12.5-3.3,21.8-2.3,30.2,3.2,8.4,5.5,13.6,14.3,13.6,23v62.4Z"
          />
          <path
            fill="#fd615e"
            d="M141.1,58.7l-13.4-1.5,9.6-9.6c2-2,2-5.3,0-7.4s-2.4-1.5-3.7-1.5-2.7.5-3.7,1.5l-9.6,9.6-1.5-13.4c-.3-2.7-2.6-4.6-5.2-4.6s-.4,0-.6,0c-2.9.3-4.9,2.9-4.6,5.8l1.5,13.4-11.5-7.2c-.9-.5-1.8-.8-2.8-.8-1.7,0-3.4.9-4.4,2.4-1.5,2.4-.8,5.7,1.6,7.2l11.5,7.2-12.8,4.5c-2.7,1-4.2,3.9-3.2,6.7s3.9,4.2,6.7,3.2l12.8-4.5-4.5,12.8c-1,2.7.5,5.7,3.2,6.7,2.7,1,5.7-.5,6.7-3.2l4.5-12.8,7.2,11.5c1.5,2.4,4.8,3.2,7.2,1.6,2.4-1.5,3.2-4.8,1.6-7.2l-7.2-11.5,13.4,1.5c2.9.3,5.5-1.7,5.8-4.6s-1.7-5.5-4.6-5.8Z"
            style={isComplete ? { animation: "none" } : {}}
          >
            {!isComplete && (
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 116.85 61"
                to="360 116.85 61"
                dur="1s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </g>
      </svg>
      <div className="text-center">
        <p className="mt-4 text-lg font-display font-bold">
          {loadingText ?? ""}
        </p>
        <ul className="mt-2 space-y-1 list-disc text-left">
          {steps &&
            steps.map((step, index) => (
              <li
                key={index}
                className={`text-sm transition-all duration-300 ease-out ${
                  index < visibleSteps
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2"
                }`}
              >
                {step}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default BrandicianLoader;
