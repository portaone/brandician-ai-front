import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import Button from "./common/Button";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentHatIndex, setCurrentHatIndex] = useState(0);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  // Hat images from brandician.eu
  const hatImages = [
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-cilinder-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-brandician-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-worker-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-viking-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-sailor-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-sage-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-nurse-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-military-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-magus-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-lover-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-lady-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-jester-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-innocent-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-hunter-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-detective-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-cowboy-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-cook-1.svg",
    "https://www.brandician.eu/wp-content/uploads/2021/12/Brandician-0-hat-citizen-1.svg",
  ];

  const hatNames = [
    "cilinder",
    "brandician",
    "worker",
    "viking",
    "sailor",
    "sage",
    "nurse",
    "military",
    "magus",
    "lover",
    "lady",
    "jester",
    "innocent",
    "hunter",
    "detective",
    "cowboy",
    "cook",
    "citizen",
  ];

  // Auto-rotate carousel every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHatIndex((prevIndex) => (prevIndex + 1) % hatImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [hatImages.length]);

  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* Hero Section */}
        <motion.section
          className="relative min-h-[460px] lg:min-h-[600px] overflow-hidden"
          style={{
            backgroundColor: "#7F5971",
            backgroundImage:
              "url(https://www.brandician.eu/wp-content/uploads/2021/12/seamless-back-dark-circles.svg)",
            backgroundPosition: "center center",
            backgroundSize: "cover",
          }}
          initial="initial"
          animate="animate"
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {/* Gradient overlay matching original site */}
          <div
            className="absolute inset-0 z-0"
            style={{
              background: "linear-gradient(28deg, #704C63 31%, #FD615E 130%)",
              opacity: 0.92,
            }}
          />
          <div className="container mx-auto flex flex-col lg:flex-row items-center min-h-[400px] md:min-h-[500px] lg:min-h-[600px] h-auto lg:h-[768px] py-12 md:py-16 lg:py-0 relative z-10">
            {/* Left side - Carousel */}
            <motion.div
              className="hidden lg:flex justify-center items-center w-1/2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative w-[400px] h-[400px] flex items-center justify-center">
                {/* Hat carousel with fade transition */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentHatIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <img
                      src={hatImages[currentHatIndex]}
                      alt={hatNames[currentHatIndex]}
                      className="w-full h-full object-contain filter brightness-0 invert opacity-90"
                      style={{ maxWidth: "350px", maxHeight: "350px" }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Right side - Content */}
            <motion.div
              className="w-full lg:w-1/2 px-4 md:px-6 lg:p-[10px] space-y-[15px] md:space-y-[18px] lg:space-y-[20px] text-center lg:text-left"
              {...fadeIn}
            >
              <h1 className="hero-title text-[32px] md:text-[44px] lg:text-[56px] leading-[1.2] md:leading-[1.25] lg:leading-[70px]">
                Build brands on insight, not intuition.
              </h1>
              <p className="hero-paragraph text-[18px] md:text-[22px] lg:text-[28px] leading-[1.5] max-w-[600px] mx-auto lg:mx-0">
                We use psychology and AI to create brands that connect
                emotionally and perform strategically—from startup foundations
                to complete transformations.
              </p>
              <Button
                size="xl"
                onClick={() => {
                  if (user) {
                    navigate("/brands/new");
                  } else {
                    navigate("/register");
                  }
                }}
              >
                Start brand creation
              </Button>
            </motion.div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default LandingPage;
