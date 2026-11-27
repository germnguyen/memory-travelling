import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { PhotoCard } from "../types";

interface IntroProps {
  photos?: PhotoCard[];
  onDone: () => void;
}

const DEFAULT_PHOTOS: PhotoCard[] = [
  {
    src: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=720&q=80",
    alt: "Tà Xùa săn mây",
    title: "Tà Xùa - Biển Mây",
    location: "Bắc Yên, Sơn La",
    tilt: -8,
    x: -24,
    y: 10,
    width: 720,
    height: 688,
  },
  {
    src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=720&q=80",
    alt: "Đèo Mã Pí Lèng Hà Giang",
    title: "Mã Pí Lèng Hùng Vĩ",
    location: "Mèo Vạc, Hà Giang",
    tilt: 7,
    x: 28,
    y: -12,
    width: 720,
    height: 480,
  },
  {
    src: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=720&q=80",
    alt: "Cầu Vàng Bà Nà Hills",
    title: "Cầu Vàng",
    location: "Đà Nẵng",
    tilt: -4,
    x: -8,
    y: 36,
    width: 720,
    height: 680,
  },
];

export const Intro: React.FC<IntroProps> = ({ photos = DEFAULT_PHOTOS, onDone }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Respect user's motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRemoved(true);
      return;
    }

    const doc = document.documentElement;
    const prevOverflow = doc.style.overflow;
    doc.style.overflow = "hidden";

    const q = gsap.utils.selector(root);
    const mascot = q("[data-mascot]");
    const loadingText = q("[data-loading]");
    const dots = q("[data-dot]");
    const helloBox = q("[data-hello]");
    const helloWords = q("[data-hello] [data-w]");
    const photoStack = q("[data-stack]");
    const cards = q("[data-card]");
    const lines = q("[data-line]");
    const calledBox = q("[data-called]");
    const logoLetters1 = q("[data-logo-part='memory'] span");
    const logoLetters2 = q("[data-logo-part='travelling'] span");
    const surface = q("[data-surface]");
    const underline = q("[data-ul]");

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        doc.style.overflow = prevOverflow;
        setIsRemoved(true);
      },
    });
    timelineRef.current = tl;

    // 1. Mascot + Loading (t = 0.0s -> 0.9s)
    tl.fromTo(
      mascot,
      { autoAlpha: 0, scale: 0.2, rotate: -22, y: 30 },
      { autoAlpha: 1, scale: 1, rotate: -6, y: 0, duration: 0.7, ease: "elastic.out(1, 0.55)" },
      0
    )
      .fromTo(loadingText, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.2)
      .fromTo(
        dots,
        { opacity: 0.15 },
        { opacity: 1, duration: 0.22, stagger: { each: 0.11, repeat: 2, yoyo: true }, ease: "none" },
        0.35
      )
      .to(mascot, { y: -60, scale: 0.5, rotate: 14, autoAlpha: 0, duration: 0.3, ease: "power3.in" }, 0.85)
      .to(loadingText, { autoAlpha: 0, y: -14, duration: 0.25, ease: "power3.in" }, 0.87);

    // 2. "Hi, I am Duc" (t = 1.0s -> 2.55s)
    tl.fromTo(
      helloWords,
      { autoAlpha: 0, y: 46, rotateX: -45 },
      { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.08, ease: "power4.out" },
      1.0
    );
    tl.to(helloBox, { autoAlpha: 0, y: -40, scale: 0.9, duration: 0.3, ease: "power3.in" }, 2.55);

    // 3. Polaroid Photos Stack (t = 2.8s -> 4.6s)
    cards.forEach((card, idx) => {
      const p = photos[idx] || photos[0];
      tl.fromTo(
        card,
        {
          autoAlpha: 0,
          scale: 1.55,
          rotate: p.tilt + 16,
          x: p.x,
          y: p.y + 60,
          xPercent: -50,
          yPercent: -50,
        },
        {
          autoAlpha: 1,
          scale: 1,
          rotate: p.tilt,
          x: p.x,
          y: p.y,
          xPercent: -50,
          yPercent: -50,
          duration: 0.45,
          ease: "back.out(1.8)",
        },
        2.8 + 0.3 * idx
      );
    });

    // Shrink photo stack down to bottom
    tl.to(photoStack, { scale: 0.44, y: "42vh", rotate: -4, duration: 0.6, ease: "power3.inOut" }, 4.5);

    // 4. "Mình đang xây dựng một nền tảng du lịch miễn phí" (t = 4.65s -> 5.7s)
    const animLine = (el: Element, startTime: number) => {
      tl.fromTo(
        el.querySelectorAll("[data-w]"),
        { autoAlpha: 0, y: 34, rotateX: -30 },
        { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.5, stagger: 0.045, ease: "power4.out" },
        startTime
      );
    };
    const fadeLine = (el: Element, startTime: number) => {
      tl.to(el, { autoAlpha: 0, y: -26, duration: 0.28, ease: "power3.in" }, startTime);
    };

    if (lines[0]) {
      animLine(lines[0], 4.65);
      fadeLine(lines[0], 5.7);
    }

    // 5. "Nó có tên là…" + Animated Logo "MEMORY TRAVELLING" (t = 5.8s -> 8.8s)
    if (calledBox[0]) {
      tl.fromTo(
        calledBox[0].querySelectorAll("[data-w]"),
        { autoAlpha: 0, y: 34, rotateX: -30 },
        { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.5, stagger: 0.06, ease: "power4.out" },
        5.8
      );
    }

    // Logo Letters Bounce Drop
    tl.set(q("[data-logo]"), { autoAlpha: 1 }, 6.4);
    tl.fromTo(
      logoLetters1,
      { y: -160, autoAlpha: 0, scale: 0.5, rotate: () => gsap.utils.random(-35, 35) },
      { y: 0, autoAlpha: 1, scale: 1, rotate: 0, duration: 0.7, stagger: 0.07, ease: "bounce.out" },
      6.5
    );
    tl.fromTo(
      logoLetters2,
      { autoAlpha: 0, scale: 2.2, rotate: (i) => [-12, 10, -6, 8, -4, 6, -10, 4, -8, 6][i % 10] },
      { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.55, stagger: 0.06, ease: "back.out(2.2)" },
      7.2
    );

    // Logo slight pulse wiggle
    tl.to(
      q("[data-logo]"),
      { scale: 1.05, rotate: -2, duration: 0.16, yoyo: true, repeat: 1, ease: "power1.inOut" },
      8.0
    );

    // Logo & "It's called…" exit
    tl.to(
      [calledBox[0], q("[data-logo]")[0]],
      { autoAlpha: 0, y: -40, duration: 0.32, ease: "power3.in", stagger: 0.04 },
      8.7
    );

    // 6. "Cùng mình lưu lại chuyến đi tiếp theo ở đâu?" + Animated underline (t = 8.9s -> 10.1s)
    if (lines[1]) {
      animLine(lines[1], 8.9);
      tl.to(underline, { scaleX: 1, duration: 0.35, ease: "power3.inOut" }, 9.35);
      fadeLine(lines[1], 10.1);
    }

    // 7. "Sẽ rất tuyệt đấy!" (t = 10.2s)
    if (lines[2]) {
      tl.set(lines[2].querySelectorAll("[data-w]"), { autoAlpha: 1 }, 10.2).fromTo(
        lines[2],
        { autoAlpha: 0, scale: 0.4, rotate: -6 },
        { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.85, ease: "elastic.out(1, 0.5)" },
        10.2
      );
    }

    // 8. Exit transition (Curtain reveal / Sliding curved surface) (t = 11.2s)
    tl.addLabel("exit", 11.2);
    if (lines[2]) {
      tl.to(lines[2], { scale: 0.2, y: "-46vh", autoAlpha: 0, duration: 0.5, ease: "power3.in" }, "exit");
    }
    tl.to(photoStack, { y: "80vh", autoAlpha: 0, duration: 0.45, ease: "power3.in" }, "exit");
    tl.to(surface, { yPercent: -120, duration: 0.85, ease: "power4.inOut" }, "exit+=0.2");
    tl.call(() => onDone(), [], "exit+=0.48");

    // Skip handler: jump straight to "exit" label
    const skip = () => {
      if (tl.time() < (tl.labels.exit || 11.2)) {
        tl.play("exit");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        skip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      doc.style.overflow = prevOverflow;
      tl.kill();
    };
  }, [photos, onDone]);

  if (isRemoved) return null;

  const triggerSkip = () => {
    if (timelineRef.current) {
      timelineRef.current.play("exit");
    }
  };

  return (
    <div
      ref={containerRef}
      data-intro="true"
      onClick={triggerSkip}
      className="cc-intro fixed inset-0 z-[9999] overflow-hidden touch-none select-none cursor-pointer"
      role="presentation"
    >
      {/* Curved background curtain sliding up on exit */}
      <div
        data-surface="true"
        className="absolute inset-x-0 -top-32 bottom-0 rounded-b-[56px] bg-[#fbfbfb] shadow-[0_30px_80px_rgba(0,0,0,0.18)] will-change-transform"
      >
        {/* Skip button top right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerSkip();
          }}
          className="absolute right-6 top-36 z-20 flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 backdrop-blur transition hover:bg-neutral-100 hover:text-black"
        >
          <span>Bỏ qua</span>
          <span className="text-neutral-400">Esc</span>
        </button>

        <div className="absolute inset-x-0 top-32 bottom-0 grid place-items-center px-6 text-center perspective-900">
          {/* Stage 1: Mascot & Loading */}
          <div className="col-start-1 row-start-1 flex flex-col items-center gap-3">
            <div data-mascot className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl lg:h-32 lg:w-32 will-change-transform border border-black/5">
              <span className="text-5xl lg:text-6xl select-none">🎒</span>
            </div>
            <p data-loading className="text-sm font-medium text-neutral-400 flex items-center gap-0.5">
              Đang tải trải nghiệm
              <span data-dot className="inline-block font-bold">.</span>
              <span data-dot className="inline-block font-bold">.</span>
              <span data-dot className="inline-block font-bold">.</span>
            </p>
          </div>

          {/* Stage 2: Hello */}
          <h1
            data-hello
            className="col-start-1 row-start-1 max-w-[12ch] text-[2.75rem] font-black tracking-tight leading-[0.98] sm:text-6xl lg:text-7xl"
          >
            <span data-w className="inline-block mr-3">Xin</span>
            <span data-w className="inline-block mr-3">chào,</span>
            <span data-w className="inline-block mr-3">mình</span>
            <span data-w className="inline-block mr-3">là</span>
            <span data-w className="inline-block text-[#ff4d1a]">Đức</span>
          </h1>

          {/* Stage 3: Polaroid Photo Stack */}
          <div data-stack className="col-start-1 row-start-1 relative h-[60vh] w-full max-w-md will-change-transform">
            {photos.map((p, i) => (
              <figure
                key={p.src}
                data-card
                className={`absolute left-1/2 top-1/2 m-0 bg-white p-3 pb-8 shadow-[0_25px_60px_rgba(0,0,0,0.22)] will-change-transform border border-neutral-100 rounded-sm ${
                  i === 1 ? "w-[min(76vw,340px)]" : "w-[min(64vw,290px)]"
                }`}
              >
                <div className="overflow-hidden rounded-xs bg-neutral-100 aspect-[4/3]">
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading="eager"
                    draggable={false}
                    className="block h-full w-full object-cover"
                  />
                </div>
                <figcaption className="mt-2 text-left">
                  <p className="text-xs font-bold text-neutral-800 truncate">{p.title}</p>
                  <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1 mt-0.5">
                    <span>📍</span> {p.location}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Stage 4: "Nó có tên là…" + Animated Logo */}
          <div className="col-start-1 row-start-1 flex flex-col items-center gap-6 lg:gap-8">
            <p data-called className="text-[2.2rem] font-extrabold leading-tight sm:text-5xl lg:text-6xl text-neutral-800">
              <span data-w className="inline-block mr-2.5">Nó</span>
              <span data-w className="inline-block mr-2.5">có</span>
              <span data-w className="inline-block mr-2.5">tên</span>
              <span data-w className="inline-block">là…</span>
            </p>
            <div
              data-logo
              className="flex flex-col items-center select-none will-change-transform opacity-0"
            >
              <div
                data-logo-part="memory"
                className="flex items-center tracking-tighter text-[13vw] font-black uppercase leading-[0.85] text-neutral-900 md:text-[6.5rem]"
              >
                {"MEMORY".split("").map((ch, i) => (
                  <span key={i} className="inline-block">
                    {ch}
                  </span>
                ))}
              </div>
              <div
                data-logo-part="travelling"
                className="flex items-center tracking-tight text-[10vw] font-black uppercase leading-[0.9] text-[#ff4d1a] md:text-[5.2rem]"
              >
                {"TRAVELLING".split("").map((ch, i) => (
                  <span key={i} className="inline-block">
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stage 5: "Mình đang xây dựng..." */}
          <p
            data-line
            className="col-start-1 row-start-1 mx-auto max-w-[16ch] text-[2.2rem] font-black leading-tight sm:text-5xl lg:text-6xl text-neutral-900"
          >
            <span data-w className="inline-block mr-2">Mình</span>
            <span data-w className="inline-block mr-2">đang</span>
            <span data-w className="inline-block mr-2">tạo</span>
            <span data-w className="inline-block mr-2">một</span>
            <span data-w className="inline-block mr-2">nền</span>
            <span data-w className="inline-block mr-2">tảng</span>
            <span data-w className="inline-block mr-2">lưu</span>
            <span data-w className="inline-block mr-2">giữ</span>
            <span data-w className="inline-block mr-2">chuyến</span>
            <span data-w className="inline-block mr-2">đi</span>
            <span data-w className="inline-block text-[#ff4d1a]">miễn phí</span>
          </p>

          {/* Stage 6: "Cùng mình lưu lại chuyến đi tiếp theo ở đâu?" */}
          <p
            data-line
            className="col-start-1 row-start-1 mx-auto max-w-[17ch] text-[2.2rem] font-black leading-tight sm:text-5xl lg:text-6xl text-neutral-900"
          >
            <span data-w className="inline-block mr-2">Chuyến</span>
            <span data-w className="inline-block mr-2">đi</span>
            <span data-w className="inline-block mr-2">tiếp</span>
            <span data-w className="inline-block mr-2">theo</span>
            <span data-w className="inline-block mr-2">của</span>
            <span data-w className="inline-block mr-2">bạn</span>
            <span data-w className="inline-block mr-2">sẽ</span>
            <span data-w className="inline-block mr-2">ở</span>
            <span data-w className="relative inline-block font-extrabold text-[#ff4d1a]">
              đâu?
              <span
                data-ul
                className="absolute inset-x-0 -bottom-1 h-1.5 origin-left scale-x-0 rounded-full bg-[#ff4d1a]"
              />
            </span>
          </p>

          {/* Stage 7: "Sẽ rất tuyệt đấy!" */}
          <p
            data-line
            className="col-start-1 row-start-1 mx-auto text-[3rem] font-black leading-none sm:text-7xl lg:text-8xl text-neutral-900"
          >
            <span data-w className="inline-block mr-3">Sẽ</span>
            <span data-w className="inline-block mr-3">rất</span>
            <span data-w className="inline-block text-[#ff4d1a]">tuyệt</span>
            <span data-w className="inline-block ml-3">đấy!</span>
          </p>
        </div>
      </div>
    </div>
  );
};
