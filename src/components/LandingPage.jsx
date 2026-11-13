import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero3D from "./Hero3D";

gsap.registerPlugin(ScrollTrigger);

const DISPLAY = { fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const MARQUEE = ["Questions", "Code", "Writing", "Ideas", "Debugging", "Learning", "Summaries", "Plans"];

const TRACK_CARDS = [
  {
    n: "03",
    title: "It remembers the thread",
    text: "Follow up without repeating yourself. Each chat keeps its context, so \"make it shorter\" just works.",
    tone: "#00E5FF",
  },
  {
    n: "04",
    title: "Replies that render properly",
    text: "Lists, tables and code blocks show up formatted, with syntax colors for the language you asked about.",
    tone: "#FF3D00",
  },
  {
    n: "05",
    title: "No account, no setup",
    text: "Open the page, type a question, get an answer. Nothing to install and no sign up screen in the way.",
    tone: "#F4F6F9",
  },
];

function SplitChars({ text, className = "", style }) {
  return (
    <span className={className} style={style} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.16em] -mb-[0.16em] align-bottom" aria-hidden="true">
          <span className="split-char inline-block will-change-transform">{ch === " " ? "\u00A0" : ch}</span>
        </span>
      ))}
    </span>
  );
}

const LandingPage = ({ onStartChat }) => {
  const rootRef = useRef(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      // Top progress bar
      gsap.to("#scroll-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom bottom", scrub: 0.3 },
      });

      // Hero intro
      const intro = gsap.timeline({ delay: 0.2 });
      intro
        .from(".hero-eyebrow", { opacity: 0, y: 16, duration: 0.8, ease: "power3.out" })
        .from(".hero-title .split-char", { yPercent: 115, duration: 1.1, ease: "expo.out", stagger: 0.06 }, "-=0.4")
        .from(".hero-sub", { opacity: 0, y: 20, duration: 0.9, ease: "power3.out" }, "-=0.6")
        .from(".hero-cta", { opacity: 0, y: 20, duration: 0.8, ease: "power3.out", stagger: 0.1 }, "-=0.6")
        .from(".hero-hint", { opacity: 0, duration: 1 }, "-=0.2");

      // Hero fades and drifts away as you scroll
      gsap.to(".hero-content", {
        opacity: 0,
        yPercent: -18,
        ease: "none",
        scrollTrigger: { trigger: "#scene-hero", start: "top top", end: "bottom top", scrub: true },
      });

      // Scene cards
      gsap.utils.toArray(".scene-card").forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 80,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 82%", toggleActions: "play none none reverse" },
        });
        gsap.from(card.querySelectorAll(".card-line"), {
          opacity: 0,
          y: 24,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: card, start: "top 78%", toggleActions: "play none none reverse" },
        });
      });

      // Big words that slide in sideways
      gsap.utils.toArray(".slide-word").forEach((el, i) => {
        gsap.fromTo(
          el,
          { xPercent: i % 2 ? 12 : -12 },
          {
            xPercent: i % 2 ? -12 : 12,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });

      // Pinned horizontal track
      const track = document.querySelector("#track-inner");
      if (track) {
        const distance = () => Math.max(track.scrollWidth - window.innerWidth, 0);
        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: "#scene-track",
            start: "top top",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 1,
          },
        });
      }

      // Final section
      gsap.from(".final-title .split-char", {
        yPercent: 115,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.04,
        scrollTrigger: { trigger: "#scene-final", start: "top 60%", toggleActions: "play none none reverse" },
      });
      gsap.from(".final-fade", {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: "#scene-final", start: "top 50%", toggleActions: "play none none reverse" },
      });
    }, rootRef);

    const refreshId = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(refreshId);
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollToFrost = () => {
    lenisRef.current?.scrollTo("#scene-frost", { duration: 1.8, offset: -40 });
  };

  return (
    <div
      id="scroll-container"
      ref={rootRef}
      className="relative w-full bg-[#050609] text-white"
      style={DISPLAY}
    >
      <style>{`
        html.lenis, html.lenis body { height: auto; }
        .lenis.lenis-smooth { scroll-behavior: auto !important; }
        .lenis.lenis-stopped { overflow: hidden; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes hint { 0% { transform: scaleY(0); transform-origin: top; } 50% { transform: scaleY(1); transform-origin: top; } 51% { transform-origin: bottom; } 100% { transform: scaleY(0); transform-origin: bottom; } }
        @media (prefers-reduced-motion: reduce) { .marquee-track, .hint-line { animation: none !important; } }
      `}</style>

      {/* Scroll progress */}
      <div className="fixed left-0 top-0 z-[60] h-[2px] w-full bg-transparent">
        <div
          id="scroll-progress"
          className="h-full w-full origin-left bg-gradient-to-r from-[#00E5FF] to-[#FF3D00]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      <Hero3D />

      {/* HERO */}
      <section id="scene-hero" className="relative z-10 flex min-h-screen w-full items-center justify-center px-6">
        <div className="hero-content flex flex-col items-center text-center">
          <span className="hero-eyebrow mb-6 text-xs tracking-[0.35em] text-[#8A99AD]" style={MONO}>
            AI CHAT, BUILT ON GEMINI
          </span>
          <h1
            className="hero-title mb-6 text-[clamp(4rem,17vw,15rem)] font-bold leading-[0.9] tracking-[-0.05em]"
          >
            <SplitChars text="BotGPT" />
          </h1>
          <p className="hero-sub mb-10 max-w-xl text-lg text-[#C3D0E0] sm:text-xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.95)" }}>
            A fast chat assistant for questions, code and writing. Ask once, follow up as often as you like.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onStartChat}
              className="hero-cta cursor-pointer rounded-full bg-white px-9 py-4 text-sm font-semibold tracking-wide text-black transition-[scale,box-shadow] hover:scale-105 hover:shadow-[0_0_40px_rgba(0,229,255,0.45)]"
            >
              Start chatting
            </button>
            <button
              onClick={scrollToFrost}
              className="hero-cta cursor-pointer rounded-full border border-white/25 bg-white/5 px-9 py-4 text-sm font-semibold tracking-wide text-white backdrop-blur-md transition-[border-color,background-color] hover:border-white/60 hover:bg-white/10"
            >
              See what it does
            </button>
          </div>
        </div>
        <div className="hero-hint absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
          <span className="text-[10px] tracking-[0.4em] text-[#8A99AD]" style={MONO}>
            SCROLL
          </span>
          <span className="hint-line block h-12 w-px bg-white/70" style={{ animation: "hint 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* MARQUEE */}
      <section className="relative z-10 w-full overflow-hidden border-y border-white/10 bg-black/40 py-6 backdrop-blur-sm">
        <div className="marquee-track flex w-max gap-14 whitespace-nowrap" style={{ animation: "marquee 28s linear infinite" }}>
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((w, i) => (
            <span
              key={i}
              className="text-4xl font-bold uppercase tracking-tight sm:text-6xl"
              style={{ color: i % 2 ? "transparent" : "#F4F6F9", WebkitTextStroke: i % 2 ? "1px rgba(255,255,255,0.5)" : "0" }}
            >
              {w}
            </span>
          ))}
        </div>
      </section>

      {/* SCENE 1: code */}
      <section id="scene-frost" className="relative z-10 flex min-h-[130vh] w-full items-center justify-start px-6 sm:px-20">
        <div className="scene-card max-w-lg border border-white/10 bg-black/45 p-10 backdrop-blur-2xl sm:p-12">
          <span className="card-line mb-5 block text-xs tracking-[0.3em] text-[#00E5FF]" style={MONO}>
            01 / CODE
          </span>
          <h2 className="card-line mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Code that explains itself
          </h2>
          <p className="card-line text-lg leading-relaxed text-[#9FB0C4]">
            Ask for a React component, a SQL query or a fix for an error message. You get working code with a short
            explanation of what changed and why.
          </p>
        </div>
      </section>

      {/* BIG WORD 1 */}
      <div className="relative z-10 w-full overflow-hidden py-10">
        <div className="slide-word whitespace-nowrap text-[clamp(4rem,16vw,14rem)] font-bold uppercase leading-none tracking-[-0.04em] text-transparent" style={{ WebkitTextStroke: "1px rgba(0,229,255,0.8)" }}>
          Think faster
        </div>
      </div>

      {/* SCENE 2: writing */}
      <section id="scene-fire" className="relative z-10 flex min-h-[130vh] w-full items-center justify-end px-6 sm:px-20">
        <div className="scene-card max-w-lg border border-white/10 bg-black/45 p-10 backdrop-blur-2xl sm:p-12">
          <span className="card-line mb-5 block text-xs tracking-[0.3em] text-[#FF3D00]" style={MONO}>
            02 / WRITING
          </span>
          <h2 className="card-line mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Drafts you can actually use
          </h2>
          <p className="card-line text-lg leading-relaxed text-[#9FB0C4]">
            Emails, outlines, cover letters, captions. Start from a rough idea and ask for another take until the tone
            is right.
          </p>
        </div>
      </section>

      {/* BIG WORD 2 */}
      <div className="relative z-10 w-full overflow-hidden py-10">
        <div className="slide-word whitespace-nowrap text-[clamp(4rem,16vw,14rem)] font-bold uppercase leading-none tracking-[-0.04em] text-transparent" style={{ WebkitTextStroke: "1px rgba(255,90,30,0.85)" }}>
          Write better
        </div>
      </div>

      {/* PINNED HORIZONTAL TRACK */}
      <section id="scene-track" className="relative z-10 h-screen w-full overflow-hidden">
        <div id="track-inner" className="flex h-full w-max items-center gap-8 px-[8vw] sm:gap-12">
          <div className="flex h-full w-[80vw] shrink-0 flex-col justify-center sm:w-[34vw]">
            <span className="mb-5 text-xs tracking-[0.3em] text-[#8A99AD]" style={MONO}>
              KEEP SCROLLING
            </span>
            <h2 className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
              Built for the
              <br />
              everyday stuff
            </h2>
          </div>
          {TRACK_CARDS.map((c) => (
            <article
              key={c.n}
              className="relative flex h-[62vh] w-[82vw] shrink-0 flex-col justify-between overflow-hidden border border-white/10 bg-black/50 p-8 backdrop-blur-2xl sm:w-[38vw] sm:p-12"
            >
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
                style={{ background: c.tone }}
              />
              <span className="relative text-sm tracking-[0.3em]" style={{ ...MONO, color: c.tone }}>
                {c.n}
              </span>
              <div className="relative">
                <h3 className="mb-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{c.title}</h3>
                <p className="max-w-md text-base leading-relaxed text-[#9FB0C4] sm:text-lg">{c.text}</p>
              </div>
            </article>
          ))}
          <div className="h-full w-[10vw] shrink-0" />
        </div>
      </section>

      {/* FINAL */}
      <section id="scene-final" className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 text-center">
        <h2 className="final-title mb-8 text-[clamp(3rem,11vw,10rem)] font-bold leading-[0.92] tracking-[-0.04em]">
          <SplitChars text="Ask it" />
          <br />
          <SplitChars text="something." />
        </h2>
        <p className="final-fade mb-10 max-w-md text-lg text-[#9FB0C4]">
          The chat is one click away. Type a question and see what comes back.
        </p>
        <button
          onClick={onStartChat}
          className="final-fade cursor-pointer rounded-full bg-white px-12 py-5 text-sm font-semibold tracking-wide text-black transition-[scale,box-shadow] hover:scale-105 hover:shadow-[0_0_60px_rgba(255,61,0,0.45)]"
        >
          Open BotGPT
        </button>
        <footer className="final-fade absolute bottom-8 text-xs tracking-[0.25em] text-[#5E6B7C]" style={MONO}>
          BUILT WITH REACT, THREE.JS AND GEMINI
        </footer>
      </section>
    </div>
  );
};

export default LandingPage;
