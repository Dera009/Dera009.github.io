/*
  DERA — Portfolio interactions.
  Plain JS, no dependencies. Handles: sticky header state on scroll,
  the mobile menu, scroll-reveal animations, and the footer year.
*/

document.addEventListener("DOMContentLoaded", () => {
  initHeaderScrollState();
  initMobileNav();
  initScrollReveal();
  initHeroOrb();
  initHeroScrollFade();
  setFooterYear();
});

/* Adds a class to the header once the page scrolls past a small threshold,
   so the nav gets a background/blur only when it's actually overlapping content. */
function initHeaderScrollState() {
  const header = document.getElementById("site-header");
  if (!header) return;

  const SCROLL_THRESHOLD = 12;

  const updateState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > SCROLL_THRESHOLD);
  };

  updateState();
  window.addEventListener("scroll", updateState, { passive: true });
}

/* Opens/closes the full-screen mobile menu and keeps its state in sync
   with the hamburger button's aria-expanded attribute. */
function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("mobile-nav");
  if (!toggle || !menu) return;

  const atmosphere = initMobileNavAtmosphere(menu);

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    menu.classList.remove("is-open");
    document.body.style.overflow = "";
    atmosphere.deactivate();
  };

  const openMenu = () => {
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    menu.classList.add("is-open");
    document.body.style.overflow = "hidden";
    atmosphere.activate();
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  // Close the menu whenever a link inside it is used to navigate.
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close on Escape for keyboard users.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

/* The mobile menu's atmospheric backdrop: a large ghost word behind the
   nav links that switches to match whichever link is currently focused,
   plus a field of tiny particles that gently drift and lean toward that
   same link's "zone" of the panel. Pure decoration — driven entirely by
   pointerenter/focus, so it responds to mouse hover AND touch taps alike
   without depending on mousemove (which touch screens never fire). */
function initMobileNavAtmosphere(menu) {
  const wordEl = document.getElementById("mobile-nav-word");
  const canvas = document.getElementById("mobile-nav-particles");
  const noop = { activate() {}, deactivate() {} };
  if (!wordEl || !canvas || !canvas.getContext) return noop;

  const links = Array.from(menu.querySelectorAll("nav a"));
  if (!links.length) return noop;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PARTICLE_COUNT = 42;
  const WORD_REVEAL_DELAY = 500; // let the panel + links settle first
  const WORD_SWAP_DELAY = 260; // half of the word's CSS fade duration

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = null;
  let particles = [];
  let currentWord = "";
  let wordChangeTimeout = null;
  let wordRevealTimeout = null;

  // Each link gets a spot spread across the lower part of the panel, so
  // the particle field visibly leans a different direction per item
  // instead of just pulsing in place.
  const zones = links.map((_, index) => ({
    x: links.length > 1 ? 0.22 + (0.56 * index) / (links.length - 1) : 0.5,
    y: 0.5 + (index % 2 === 0 ? 0 : 0.1),
  }));
  let focusTargetX = zones[0].x;
  let focusTargetY = zones[0].y;
  let focusX = focusTargetX;
  let focusY = focusTargetY;

  function buildParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        baseX: Math.random(),
        baseY: Math.random(),
        driftSeed: Math.random() * Math.PI * 2,
        driftSpeed: 0.2 + Math.random() * 0.3,
        size: 0.6 + Math.random() * 1.5,
        twinkleSeed: Math.random() * Math.PI * 2,
      });
    }
  }
  buildParticles();

  function resize() {
    const rect = menu.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawParticle(x, y, size, alpha) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(232, 90, 79, ${alpha.toFixed(3)})`;
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // A single still frame, positioned at whatever the current focus target
  // is (no drift, no animation loop) — this is what reduced-motion
  // visitors see instead of the continuous version below.
  function drawStaticFrame() {
    resize();
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      const x = (p.baseX + (focusTargetX - p.baseX) * 0.18) * width;
      const y = (p.baseY + (focusTargetY - p.baseY) * 0.18) * height;
      drawParticle(x, y, p.size, 0.4);
    });
  }

  let t = 0;
  function tick() {
    t += 0.012;
    focusX += (focusTargetX - focusX) * 0.06;
    focusY += (focusTargetY - focusY) * 0.06;

    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      // Each particle sits mostly at its own random spot, but is nudged
      // toward the active zone and given a slow independent wobble — the
      // combination is what reads as an atmosphere "leaning" toward the
      // hovered word rather than a single tight cluster of dots.
      const pullX = (focusX - p.baseX) * 0.18;
      const pullY = (focusY - p.baseY) * 0.18;
      const driftX = Math.sin(t * p.driftSpeed + p.driftSeed) * 0.015;
      const driftY = Math.cos(t * p.driftSpeed + p.driftSeed) * 0.015;

      const x = (p.baseX + pullX + driftX) * width;
      const y = (p.baseY + pullY + driftY) * height;
      const twinkle = 0.3 + Math.sin(t * 0.6 + p.twinkleSeed) * 0.22;
      drawParticle(x, y, p.size, Math.max(0.1, twinkle));
    });

    rafId = requestAnimationFrame(tick);
  }

  function startParticles() {
    if (prefersReducedMotion) {
      drawStaticFrame();
      return;
    }
    resize();
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  function stopParticles() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function setWord(text) {
    if (text === currentWord) return;
    currentWord = text;
    if (wordChangeTimeout) clearTimeout(wordChangeTimeout);
    wordEl.classList.remove("is-visible");
    wordEl.classList.add("is-changing");
    wordChangeTimeout = setTimeout(() => {
      wordEl.textContent = text;
      wordEl.classList.remove("is-changing");
      wordEl.classList.add("is-visible");
    }, WORD_SWAP_DELAY);
  }

  function setFocusZone(index) {
    const zone = zones[index] || zones[0];
    focusTargetX = zone.x;
    focusTargetY = zone.y;
    if (prefersReducedMotion) drawStaticFrame();
  }

  links.forEach((link, index) => {
    const activate = () => {
      setWord(link.textContent.trim().toUpperCase());
      setFocusZone(index);
    };
    // pointerenter covers both mouse hover and a touch making contact;
    // focus covers keyboard navigation.
    link.addEventListener("pointerenter", activate);
    link.addEventListener("focus", activate);
  });

  let resizeRaf = null;
  window.addEventListener("resize", () => {
    if (!menu.classList.contains("is-open")) return;
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      if (prefersReducedMotion) drawStaticFrame();
      else resize();
    });
  });

  function activate() {
    startParticles();
    if (wordRevealTimeout) clearTimeout(wordRevealTimeout);
    wordRevealTimeout = setTimeout(() => {
      setWord(links[0].textContent.trim().toUpperCase());
      setFocusZone(0);
    }, WORD_REVEAL_DELAY);
  }

  function deactivate() {
    if (wordRevealTimeout) clearTimeout(wordRevealTimeout);
    if (wordChangeTimeout) clearTimeout(wordChangeTimeout);
    wordEl.classList.remove("is-visible");
    wordEl.classList.add("is-changing");
    currentWord = "";
    stopParticles();
  }

  return { activate, deactivate };
}

/* Fades/slides ".reveal" elements into place the first time they enter
   the viewport. Falls back to showing everything immediately if
   IntersectionObserver isn't available. */
function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/* The hero's focal visual: a rotating wireframe "armillary sphere" drawn
   frame-by-frame on a <canvas> using plain trigonometry — no 3D engine,
   no dependency. A handful of circular rings, each tilted at its own
   angle and spinning at its own speed, are projected from 3D to 2D with
   a simple perspective divide. Mouse position on desktop nudges the
   whole form slightly, like it's being turned to face the cursor.
   Reduced-motion visitors get one static frame instead of the loop. */
function initHeroOrb() {
  const canvas = document.getElementById("hero-orb");
  const hero = document.querySelector(".hero");
  if (!canvas || !hero || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Coral, warm red, muted rose — cycled across rings for quiet variety
  // without leaving the established Dera palette.
  const RING_COLORS = ["#E85A4F", "#9E342C", "#B9827D"];
  const PERSPECTIVE = 640;

  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let radius = 0;
  let rings = [];

  let spin = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let rafId = null;

  function isSmallScreen() {
    return window.innerWidth < 620;
  }

  function isMediumScreen() {
    return window.innerWidth < 1080;
  }

  function buildRings() {
    const ringCount = isSmallScreen() ? 3 : 5;
    const segments = isSmallScreen() ? 34 : 56;
    rings = [];
    for (let i = 0; i < ringCount; i++) {
      rings.push({
        tiltX: (Math.PI / ringCount) * i,
        tiltZ: i % 2 === 0 ? 0.18 : -0.18,
        segments,
        color: RING_COLORS[i % RING_COLORS.length],
        speed: 0.5 + i * 0.16,
        // Each ring answers to the cursor a little differently, so the
        // form reads as several layers turning together rather than one
        // flat plane — a cheap stand-in for real depth parallax.
        pointerFactor: 0.07 + (i / ringCount) * 0.06,
      });
    }
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    width = rect.width;
    height = rect.height;

    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Bias the orb toward the right on wide screens, where the copy
    // leaves room for it; recenter it behind the text on mobile so it
    // reads as ambient depth instead of competing for space.
    const horizontalBias = isSmallScreen() ? 0.5 : isMediumScreen() ? 0.64 : 0.75;
    centerX = width * horizontalBias;
    centerY = height * (isSmallScreen() ? 0.4 : 0.5);
    radius = Math.min(width, height) * (isSmallScreen() ? 0.22 : 0.3);

    buildRings();
    if (prefersReducedMotion) drawFrame();
  }

  function rotate(x, y, z, angleX, angleY) {
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;

    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const x2 = x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;

    return { x: x2, y: y1, z: z2 };
  }

  function project(x, y, z) {
    const scale = PERSPECTIVE / (PERSPECTIVE + z);
    return { x: centerX + x * scale, y: centerY + y * scale, scale };
  }

  function hexToRgbParts(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }

  function hexToRgba(hex, alpha) {
    const [r, g, b] = hexToRgbParts(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // A large, soft, low-opacity disc behind the wireframe — it does nothing
  // but suggest that the rings are wrapped around an actual volume rather
  // than floating flat on the background. Kept dim enough to read as
  // material, not as a glowing sci-fi ball.
  function drawShell() {
    const shellRadius = radius * 1.08;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, shellRadius);
    gradient.addColorStop(0, "rgba(90, 33, 29, 0.16)");
    gradient.addColorStop(0.65, "rgba(90, 33, 29, 0.06)");
    gradient.addColorStop(1, "rgba(90, 33, 29, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, shellRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCore() {
    const glowRadius = radius * 0.2;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
    gradient.addColorStop(0, "rgba(232, 90, 79, 0.42)");
    gradient.addColorStop(1, "rgba(232, 90, 79, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rather than a single flat color for the whole ring, this finds the
  // point currently closest to the viewer and the point currently
  // farthest away, then strokes the ring with a gradient running between
  // them — bright/warm where it faces the viewer, dim/cool where it
  // curves away. That near-vs-far falloff (which a single averaged alpha
  // can't produce, since a symmetric ring's average depth barely changes
  // as it spins) is what reads as an actual lit 3D surface.
  function drawRing(ring) {
    const points = [];
    const cosT = Math.cos(ring.tiltZ);
    const sinT = Math.sin(ring.tiltZ);
    const angleX = ring.tiltX + pointerY * ring.pointerFactor;
    const angleY = spin * ring.speed + pointerX * ring.pointerFactor;

    let nearIdx = 0;
    let farIdx = 0;
    let avgScale = 0;

    for (let p = 0; p <= ring.segments; p++) {
      const theta = (p / ring.segments) * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius;

      const xt = x * cosT - y * sinT;
      const yt = x * sinT + y * cosT;

      const rotated = rotate(xt, yt, 0, angleX, angleY);
      const projected = project(rotated.x, rotated.y, rotated.z);
      points.push(projected);
      avgScale += projected.scale;

      if (projected.scale > points[nearIdx].scale) nearIdx = points.length - 1;
      if (projected.scale < points[farIdx].scale) farIdx = points.length - 1;
    }

    avgScale /= points.length;
    // Floored rather than allowed to hit zero — a ring edge-on to the
    // viewer should dim, not vanish, so the sphere always reads as whole.
    const overallAlpha = Math.min(Math.max(avgScale - 0.45, 0.16), 1);

    const near = points[nearIdx];
    const far = points[farIdx];
    const [r, g, b] = hexToRgbParts(ring.color);
    const gradient = ctx.createLinearGradient(far.x, far.y, near.x, near.y);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(0.1 * overallAlpha).toFixed(3)})`);
    gradient.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${(0.32 * overallAlpha).toFixed(3)})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${(0.92 * overallAlpha).toFixed(3)})`);

    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(0.55, near.scale * 1.3);

    // A faint glow, only as strong as the ring's brightest point, gives
    // the near edge a soft lit look without turning the whole form into
    // a neon outline.
    ctx.shadowColor = hexToRgba(ring.color, 0.3 * overallAlpha);
    ctx.shadowBlur = 5;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);
    drawShell();
    rings.forEach(drawRing);
    drawCore();
  }

  function tick() {
    spin += 0.0022;
    pointerX += (pointerTargetX - pointerX) * 0.035;
    pointerY += (pointerTargetY - pointerY) * 0.035;
    drawFrame();
    rafId = requestAnimationFrame(tick);
  }

  let resizeRaf = null;
  window.addEventListener("resize", () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(resize);
  });

  if (!prefersReducedMotion && hasFinePointer) {
    hero.addEventListener("mousemove", (event) => {
      const rect = hero.getBoundingClientRect();
      pointerTargetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerTargetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    });
    hero.addEventListener("mouseleave", () => {
      pointerTargetX = 0;
      pointerTargetY = 0;
    });
  }

  resize();

  if (prefersReducedMotion) {
    drawFrame();
  } else {
    rafId = requestAnimationFrame(tick);
  }

  // Pause the animation loop while the hero is scrolled out of view —
  // no visible benefit to spending frames on an invisible canvas.
  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (prefersReducedMotion) return;
          if (entry.isIntersecting && rafId === null) {
            rafId = requestAnimationFrame(tick);
          } else if (!entry.isIntersecting && rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(hero);
  }
}

/* Fades and gently lifts the hero copy as the visitor scrolls past it —
   a quiet nod to the reference component's scroll-linked depth, tuned
   down to a barely-there effect rather than a full disappearance. */
function initHeroScrollFade() {
  const heroInner = document.querySelector(".hero-inner");
  if (!heroInner) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const FADE_DISTANCE = 520;
  let ticking = false;

  const update = () => {
    const progress = Math.min(Math.max(window.scrollY / FADE_DISTANCE, 0), 1);
    heroInner.style.opacity = String(1 - progress * 0.65);
    heroInner.style.transform = `translateY(${progress * 26}px)`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
}

function setFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
