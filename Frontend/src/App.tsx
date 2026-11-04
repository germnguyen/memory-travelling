import React, { useEffect, useState, useCallback, useRef } from "react";
import gsap from "gsap";
import { Intro } from "./components/Intro";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { MapShowcase } from "./components/MapShowcase";
import { DestinationLeaderboard } from "./components/DestinationLeaderboard";
import { Footer } from "./components/Footer";

const INTRO_STORAGE_KEY = "memory-travelling-intro-seen";

export const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    // Force show if URL has ?intro
    if (typeof window !== "undefined" && window.location.search.includes("intro")) {
      return true;
    }
    // Check session storage
    try {
      return sessionStorage.getItem(INTRO_STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const pageRef = useRef<HTMLDivElement>(null);

  // Trigger main page reveal animations
  const triggerPageMotion = useCallback(() => {
    const page = pageRef.current;
    if (!page) return;

    const nav = page.querySelector("[data-nav]");
    const splitTitle = page.querySelector("[data-split]");
    const heroItems = page.querySelectorAll("[data-hero]");
    const heroMedia = page.querySelector("[data-hero-media]");

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (nav) {
      tl.fromTo(nav, { autoAlpha: 0, y: -25 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 0);
    }

    if (splitTitle) {
      tl.fromTo(
        splitTitle,
        { autoAlpha: 0, y: 36, rotateX: -20 },
        { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.85, ease: "power4.out" },
        0.15
      );
    }

    if (heroItems.length) {
      tl.fromTo(
        heroItems,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 },
        0.35
      );
    }

    if (heroMedia) {
      tl.fromTo(
        heroMedia,
        { autoAlpha: 0, y: 40, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.0, ease: "power2.out" },
        0.5
      );
    }

    // Scroll reveal observer for other sections
    const reveals = page.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              entry.target,
              { autoAlpha: 0, y: 30 },
              { autoAlpha: 1, y: 0, duration: 0.75, ease: "power3.out" }
            );

            const items = entry.target.querySelectorAll("[data-reveal-items] > *");
            if (items.length) {
              gsap.fromTo(
                items,
                { autoAlpha: 0, y: 12 },
                { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out", delay: 0.2 }
              );
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    reveals.forEach((el) => observer.observe(el));
  }, []);

  // When intro completes
  const handleIntroDone = useCallback(() => {
    setShowIntro(false);
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      // Ignore sessionStorage errors
    }
    // Animate page into view
    triggerPageMotion();
  }, [triggerPageMotion]);

  // Handle replaying intro
  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  useEffect(() => {
    // If intro was already seen, trigger page motion on mount
    if (!showIntro) {
      triggerPageMotion();
    }
  }, [showIntro, triggerPageMotion]);

  return (
    <div ref={pageRef} className="min-h-screen bg-[#f7f7f7] text-[#0a0a0a] selection:bg-[#ff4d1a] selection:text-white">
      {/* Intro Experience Overlay */}
      {showIntro && <Intro onDone={handleIntroDone} />}

      {/* Floating Pill Navigation */}
      <Navbar onReplayIntro={handleReplayIntro} />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <Hero
          onExploreClick={() => {
            const mapElem = document.getElementById("map");
            if (mapElem) {
              mapElem.scrollIntoView({ behavior: "smooth" });
            }
          }}
        />

        {/* Vietnam Map Showcase */}
        <MapShowcase />

        {/* Destination Leaderboard / Voting */}
        <DestinationLeaderboard />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
