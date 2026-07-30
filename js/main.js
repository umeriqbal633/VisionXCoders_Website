const THEME_STORAGE_KEY = "visionx-theme";

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Ignore storage failures (private mode, blocked storage, etc.)
  }
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
    button.title = isDark ? "Switch to light mode" : "Switch to dark mode";
  });
}

function initThemeToggle() {
  const storedTheme = getStoredTheme();
  const initialTheme =
    storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : document.documentElement.classList.contains("dark") ||
          document.body.classList.contains("dark")
        ? "dark"
        : "light";

  applyTheme(initialTheme);

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("dark")
        ? "light"
        : "dark";
      applyTheme(nextTheme);
      setStoredTheme(nextTheme);
    });
  });
}

function initCustomCursor() {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!finePointer.matches) {
    return;
  }

  document.documentElement.classList.add("has-custom-cursor");

  const cursor = document.createElement("div");
  cursor.className = "vx-cursor";
  cursor.setAttribute("aria-hidden", "true");

  const trail = document.createElement("div");
  trail.className = "vx-cursor-trail";
  trail.setAttribute("aria-hidden", "true");

  document.body.append(cursor, trail);

  const interactiveSelector = [
    "a",
    "button",
    ".btn-primary",
    ".btn-secondary",
    ".hamburger",
    ".theme-toggle",
    ".filter-btn",
    ".nav-cta",
    ".blog-tab",
    ".accordion-trigger",
    "[role='button']",
    "input[type='submit']",
    "input[type='button']",
    "label[for]",
    ".socials a",
    ".footer-socials a",
  ].join(", ");

  let isVisible = false;

  const setPosition = (x, y) => {
    const value = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    cursor.style.transform = value;
    trail.style.transform = value;
  };

  const show = () => {
    if (isVisible) {
      return;
    }
    isVisible = true;
    cursor.classList.add("is-visible");
    trail.classList.add("is-visible");
  };

  const hide = () => {
    isVisible = false;
    cursor.classList.remove("is-visible", "is-hover", "is-click");
    trail.classList.remove("is-visible", "is-hover");
  };

  document.addEventListener("mousemove", (event) => {
    show();
    setPosition(event.clientX, event.clientY);
  });

  document.addEventListener("mouseover", (event) => {
    const isInteractive = Boolean(event.target.closest(interactiveSelector));
    cursor.classList.toggle("is-hover", isInteractive);
    trail.classList.toggle("is-hover", isInteractive);
  });

  document.addEventListener("mousedown", (event) => {
    cursor.classList.add("is-click");

    const ripple = document.createElement("div");
    ripple.className = "vx-cursor-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.appendChild(ripple);

    ripple.addEventListener("animationend", () => {
      ripple.remove();
    });
  });

  document.addEventListener("mouseup", () => {
    cursor.classList.remove("is-click");
  });

  document.addEventListener("mouseleave", hide);

  finePointer.addEventListener("change", (event) => {
    if (!event.matches) {
      hide();
      document.documentElement.classList.remove("has-custom-cursor");
      cursor.remove();
      trail.remove();
    }
  });
}

async function injectPartial(targetSelector, url) {
  const target = document.querySelector(targetSelector);
  if (!target) {
    return;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }

  target.innerHTML = await response.text();
}

function animateCounters() {
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

  document.querySelectorAll(".count-up").forEach((el) => {
    if (el.dataset.countAnimated === "true") {
      return;
    }

    const target = Number(el.dataset.target || 0);
    const suffix = target === 98 ? "%" : "+";
    const duration = 1400;
    const startTime = performance.now();

    el.dataset.countAnimated = "true";
    el.classList.add("is-animating");

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const value = Math.floor(target * easedProgress);

      el.textContent = `${value.toLocaleString()}${progress >= 1 ? suffix : ""}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
        return;
      }

      el.classList.remove("is-animating");
      el.textContent = `${target.toLocaleString()}${suffix}`;
    };

    requestAnimationFrame(tick);
  });
}

function initCourseFilters() {
  const filterGroups = Array.from(document.querySelectorAll(".filter-group"));
  const cards = Array.from(document.querySelectorAll(".course-card"));

  if (!filterGroups.length || !cards.length) {
    return;
  }

  const state = {
    age: "all",
    difficulty: "all",
  };

  const applyFilters = () => {
    cards.forEach((card) => {
      const matchesAge = state.age === "all" || card.dataset.age === state.age;
      const matchesDifficulty =
        state.difficulty === "all" ||
        card.dataset.difficulty === state.difficulty;
      const shouldShow = matchesAge && matchesDifficulty;

      if (shouldShow) {
        card.hidden = false;
        requestAnimationFrame(() => {
          card.classList.remove("is-filtered-out");
        });
        return;
      }

      card.classList.add("is-filtered-out");
      const handleTransitionEnd = (event) => {
        if (
          event.propertyName === "opacity" &&
          card.classList.contains("is-filtered-out")
        ) {
          card.hidden = true;
        }
        card.removeEventListener("transitionend", handleTransitionEnd);
      };
      card.addEventListener("transitionend", handleTransitionEnd);
    });
  };

  filterGroups.forEach((group) => {
    const groupName = group.dataset.filterGroup;
    const buttons = Array.from(group.querySelectorAll(".filter-btn"));

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.filter || "all";
        state[groupName] = value;

        buttons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });

        applyFilters();
      });
    });
  });

  applyFilters();
}

function initCourseAccordion() {
  const accordion = document.querySelector("[data-accordion]");

  if (!accordion) {
    return;
  }

  const items = Array.from(accordion.querySelectorAll(".accordion-item"));

  const setItemState = (item, isOpen) => {
    const trigger = item.querySelector(".accordion-trigger");
    const panel = item.querySelector(".accordion-panel");

    if (!trigger || !panel) {
      return;
    }

    item.classList.toggle("is-open", isOpen);
    trigger.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      panel.style.maxHeight = `${panel.scrollHeight}px`;
      return;
    }

    panel.style.maxHeight = "0px";
  };

  items.forEach((item, index) => {
    const trigger = item.querySelector(".accordion-trigger");
    const panel = item.querySelector(".accordion-panel");

    if (!trigger || !panel) {
      return;
    }

    if (index === 0) {
      setItemState(item, true);
    } else {
      setItemState(item, false);
    }

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      items.forEach((otherItem) => {
        setItemState(otherItem, false);
      });

      if (!isOpen) {
        setItemState(item, true);
      }
    });
  });
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");

  if (!form) {
    return;
  }

  const message = form.querySelector("[data-form-message]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      if (message) {
        message.textContent =
          "Please complete all required fields before submitting.";
        message.className = "contact-form__message is-error";
      }
      return;
    }

    if (message) {
      message.textContent =
        "Thanks! Your message has been sent successfully. We will get back to you soon.";
      message.className = "contact-form__message is-success";
    }

    form.reset();
  });
}

function initFaqAccordion() {
  const accordion = document.querySelector("[data-faq-accordion]");

  if (!accordion) {
    return;
  }

  const items = Array.from(accordion.querySelectorAll(".accordion-item"));

  const setItemState = (item, isOpen) => {
    const trigger = item.querySelector(".accordion-trigger");
    const panel = item.querySelector(".accordion-panel");

    if (!trigger || !panel) {
      return;
    }

    item.classList.toggle("is-open", isOpen);
    trigger.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      panel.style.maxHeight = `${panel.scrollHeight}px`;
      return;
    }

    panel.style.maxHeight = "0px";
  };

  items.forEach((item, index) => {
    const trigger = item.querySelector(".accordion-trigger");

    if (!trigger) {
      return;
    }

    setItemState(item, index === 0);

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      items.forEach((otherItem) => setItemState(otherItem, false));

      if (!isOpen) {
        setItemState(item, true);
      }
    });
  });
}

function initBlogFilters() {
  const searchInput = document.querySelector("[data-blog-search]");
  const tabs = Array.from(
    document.querySelectorAll("[data-blog-tabs] .blog-tab"),
  );
  const items = Array.from(document.querySelectorAll("[data-blog-item]"));

  if (!searchInput || !tabs.length || !items.length) {
    return;
  }

  const state = {
    category: "all",
    query: "",
  };

  const applyFilters = () => {
    const query = state.query.trim().toLowerCase();

    items.forEach((item) => {
      const categoryMatch =
        state.category === "all" || item.dataset.category === state.category;
      const searchable =
        `${item.dataset.title || ""} ${item.dataset.content || ""}`.toLowerCase();
      const queryMatch = !query || searchable.includes(query);
      const shouldShow = categoryMatch && queryMatch;

      if (shouldShow) {
        item.hidden = false;
        requestAnimationFrame(() => item.classList.remove("is-filtered-out"));
        return;
      }

      item.classList.add("is-filtered-out");
      const handleTransitionEnd = (event) => {
        if (
          event.propertyName === "opacity" &&
          item.classList.contains("is-filtered-out")
        ) {
          item.hidden = true;
        }
        item.removeEventListener("transitionend", handleTransitionEnd);
      };
      item.addEventListener("transitionend", handleTransitionEnd);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.category = tab.dataset.category || "all";

      tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      applyFilters();
    });
  });

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    applyFilters();
  });

  applyFilters();
}

// ─────────────────────────────────────────────────────────────
// HERO PARTICLE BACKGROUND
// Canvas API — no libraries. 60 glowing dots in orange shades,
// connecting lines, mouse repulsion, text-zone avoidance.
// ─────────────────────────────────────────────────────────────
function initHeroParticles() {
  const hero   = document.querySelector('section.hero');
  const canvas = document.getElementById('hero-canvas');
  if (!hero || !canvas) return;

  const ctx = canvas.getContext('2d');

  /* ── Config ─────────────────────────────────────────── */
  const PARTICLE_COUNT  = 60;
  const CONNECT_DIST    = 130;  // px – max distance for a connection line
  const MOUSE_RADIUS    = 110;  // px – repulsion activation radius
  const MOUSE_STRENGTH  = 1.5;  // force multiplier on repulsion
  const TEXT_PAD        = 55;   // px – soft padding around the text zone
  const MAX_SPEED       = 2.2;  // px/frame cap

  // Monochromatic orange palette
  const PALETTE = [
    { r: 194, g: 65,  b: 12 },   // deep orange
    { r: 232, g: 93,  b: 4 },    // tangerine
    { r: 255, g: 159, b: 67 },   // orange-light
    { r: 255, g: 129, b: 38 },   // neon-orange light
  ];

  /* ── State ──────────────────────────────────────────── */
  let W = 0, H = 0;
  let mouse  = { x: -9999, y: -9999 };
  let tz     = { x: 0, y: 0, w: 0, h: 0, on: false }; // text zone
  let particles = [];

  /* ── Utility ────────────────────────────────────────── */
  function rand(a, b) { return a + Math.random() * (b - a); }

  function updateCanvasSize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;

    // Text-zone avoidance only on desktop layouts (hero is side-by-side)
    const heroLeft = hero.querySelector('.hero-left');
    if (heroLeft && W >= 900) {
      const hr = hero.getBoundingClientRect();
      const lr = heroLeft.getBoundingClientRect();
      tz = {
        x:  lr.left - hr.left,
        y:  lr.top  - hr.top,
        w:  lr.width,
        h:  lr.height,
        on: true,
      };
    } else {
      tz.on = false;
    }
  }

  function inTextZone(x, y, pad) {
    return tz.on &&
      x > tz.x - pad && x < tz.x + tz.w + pad &&
      y > tz.y - pad && y < tz.y + tz.h + pad;
  }

  /* ── Particle factory ───────────────────────────────── */
  function spawn() {
    let x, y, tries = 0;
    // Try to place outside the text zone
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (inTextZone(x, y, TEXT_PAD) && ++tries < 50);

    const col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    return {
      x,
      y,
      vx:    rand(-0.55, 0.55),
      vy:    rand(-0.55, 0.55),
      r:     rand(1.8, 3.8),
      col,
      alpha: rand(0.35, 0.82),
    };
  }

  /* ── Draw helpers ───────────────────────────────────── */
  function drawDot(p) {
    const { r, g, b } = p.col;

    // Glowing halo via radial gradient
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
    grd.addColorStop(0,    `rgba(${r},${g},${b},${(p.alpha * 0.9).toFixed(3)})`);
    grd.addColorStop(0.45, `rgba(${r},${g},${b},${(p.alpha * 0.12).toFixed(3)})`);
    grd.addColorStop(1,    `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 6, 0, 6.2832);
    ctx.fillStyle = grd;
    ctx.fill();

    // Solid bright core
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, 6.2832);
    ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha.toFixed(3)})`;
    ctx.fill();
  }

  function drawLines() {
    for (let i = 0; i < particles.length - 1; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b  = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d >= CONNECT_DIST) continue;

        // Fade line with distance; blend the two particles' colours
        const opacity = ((1 - d / CONNECT_DIST) * 0.18).toFixed(3);
        const mr = (a.col.r + b.col.r) >> 1;
        const mg = (a.col.g + b.col.g) >> 1;
        const mb = (a.col.b + b.col.b) >> 1;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${mr},${mg},${mb},${opacity})`;
        ctx.lineWidth   = 0.7;
        ctx.stroke();
      }
    }
  }

  /* ── Physics step ───────────────────────────────────── */
  function step(p) {
    /* Mouse repulsion */
    const mdx = p.x - mouse.x;
    const mdy = p.y - mouse.y;
    const md  = Math.hypot(mdx, mdy);
    if (md < MOUSE_RADIUS && md > 0) {
      const s = ((MOUSE_RADIUS - md) / MOUSE_RADIUS) * MOUSE_STRENGTH;
      p.vx += (mdx / md) * s;
      p.vy += (mdy / md) * s;
    }

    /* Text-zone soft repulsion */
    if (tz.on && inTextZone(p.x, p.y, TEXT_PAD)) {
      const cx = tz.x + tz.w / 2;
      const cy = tz.y + tz.h / 2;
      // Nearest point on zone rectangle
      const nx  = Math.max(tz.x, Math.min(tz.x + tz.w, p.x));
      const ny  = Math.max(tz.y, Math.min(tz.y + tz.h, p.y));
      const tdx = p.x - nx;
      const tdy = p.y - ny;
      const td  = Math.hypot(tdx, tdy);
      if (td < TEXT_PAD) {
        const s = ((TEXT_PAD - td) / TEXT_PAD) * 0.28;
        p.vx += td > 0.5 ? (tdx / td) * s : (p.x < cx ? -s : s);
        p.vy += td > 0.5 ? (tdy / td) * s : (p.y < cy ? -s : s);
      }
    }

    /* Speed cap + gentle damping (keeps motion organic) */
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > MAX_SPEED) { p.vx *= MAX_SPEED / sp; p.vy *= MAX_SPEED / sp; }
    p.vx *= 0.975;
    p.vy *= 0.975;

    p.x += p.vx;
    p.y += p.vy;

    /* Wrap around edges */
    const m = 20;
    if      (p.x < -m)    p.x = W + m;
    else if (p.x > W + m) p.x = -m;
    if      (p.y < -m)    p.y = H + m;
    else if (p.y > H + m) p.y = -m;
  }

  /* ── Animation loop ─────────────────────────────────── */
  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawLines();                            // lines first (under dots)
    for (const p of particles) {
      step(p);
      drawDot(p);
    }
    requestAnimationFrame(loop);
  }

  /* ── Event listeners ────────────────────────────────── */
  // Mouse tracking on hero section (canvas has pointer-events:none)
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Debounced resize — recalculate canvas dimensions & text zone
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateCanvasSize, 120);
  });

  /* ── Boot ───────────────────────────────────────────── */
  updateCanvasSize();
  particles = Array.from({ length: PARTICLE_COUNT }, spawn);
  loop();
}

function initSite() {
  const navbar = document.getElementById("navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 10);
    });
  }

  const navLinks = document.querySelector(".nav-links");
  const hamburger = document.querySelector(".hamburger");
  const navClose = document.querySelector(".nav-close");
  const navBackdrop = document.querySelector(".nav-backdrop");

  const setMenuState = (isOpen) => {
    if (!navbar || !navLinks || !hamburger) {
      return;
    }

    navbar.classList.toggle("menu-open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (navBackdrop) {
      navBackdrop.hidden = !isOpen;
    }
  };

  const closeMenu = () => setMenuState(false);
  const openMenu = () => setMenuState(true);

  if (hamburger) {
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.addEventListener("click", () => {
      const isOpen = navbar.classList.contains("menu-open");
      setMenuState(!isOpen);
    });
    hamburger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const isOpen = navbar.classList.contains("menu-open");
        setMenuState(!isOpen);
      }
    });
  }

  if (navClose) {
    navClose.addEventListener("click", closeMenu);
  }

  if (navBackdrop) {
    navBackdrop.addEventListener("click", closeMenu);
  }

  if (navLinks) {
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeMenu();
      }
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });

  const statsBar = document.querySelector(".stats-bar");
  if (statsBar) {
    let statsTriggered = false;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !statsTriggered) {
            statsTriggered = true;
            animateCounters();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    observer.observe(statsBar);
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const linkPath = link.getAttribute("href");
    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });

  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 },
  );

  const staggerGroups = [
    ".programs-grid",
    ".why-grid",
    ".skills-grid",
    ".steps-grid",
    ".testi-grid",
  ];

  staggerGroups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((group) => {
      Array.from(group.querySelectorAll(":scope > .reveal-stagger")).forEach(
        (item, index) => {
          item.style.setProperty("--reveal-delay", `${index * 100}ms`);
          revealObserver.observe(item);
        },
      );
    });
  });

  revealItems
    .filter((element) => !element.classList.contains("reveal-stagger"))
    .forEach((element) => {
      revealObserver.observe(element);
    });

  initThemeToggle();
  initCustomCursor();
  initCourseFilters();
  initCourseAccordion();
  initContactForm();
  initFaqAccordion();
  initBlogFilters();
  initHeroParticles();
  initCookieBanner();        // GDPR cookie consent
  initNewsletterSignup();    // Footer newsletter (/api/newsletter)
  initTrialBookingForm();    // Trial booking (/api/book-trial)
  initContactFormSheets();   // Contact form (/api/contact)
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Promise.all([
      injectPartial("#site-header", "partials/header.html"),
      injectPartial("#site-footer", "partials/footer.html"),
    ]);
  } catch (error) {
    console.error(error);
  }

  initSite();
});

// ─────────────────────────────────────────────────────────────
// COOKIE CONSENT BANNER & PREFERENCES MODAL
// Shows on first visit; saves choices to localStorage.
// ─────────────────────────────────────────────────────────────
function initCookieBanner() {
  const CONSENT_KEY = "vx-cookie-consent";
  const PREFS_KEY   = "vx-cookie-prefs";

  const banner        = document.getElementById("cookie-banner");
  const modal         = document.getElementById("cookie-modal");
  if (!banner || !modal) return;

  // Buttons – banner
  const acceptAllBtn    = document.getElementById("cookie-accept-all");
  const manageBtn       = document.getElementById("cookie-manage");
  const bannerCloseBtn  = document.getElementById("cookie-banner-close");

  // Buttons – modal
  const modalCloseBtn   = document.getElementById("cookie-modal-close");
  const modalCancelBtn  = document.getElementById("cookie-modal-cancel");
  const modalAcceptAll  = document.getElementById("cookie-modal-accept-all");
  const savePrefsBtn    = document.getElementById("cookie-save-prefs");
  const modalOverlay    = document.getElementById("cookie-modal-overlay");

  // Toggles
  const toggleAnalytics   = document.getElementById("toggle-analytics");
  const toggleMarketing   = document.getElementById("toggle-marketing");
  const toggleFunctional  = document.getElementById("toggle-functional");

  // ── If already consented, bail out ──────────────────────
  if (localStorage.getItem(CONSENT_KEY)) {
    // Restore saved toggle states in case modal is opened via settings link
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    if (toggleAnalytics)  toggleAnalytics.checked  = !!saved.analytics;
    if (toggleMarketing)  toggleMarketing.checked   = !!saved.marketing;
    if (toggleFunctional) toggleFunctional.checked  = !!saved.functional;
    return;
  }

  // ── Show / hide banner ───────────────────────────────────
  function showBanner() {
    banner.removeAttribute("hidden");
    // Double RAF ensures CSS transition fires after display:block
    requestAnimationFrame(() => requestAnimationFrame(() => {
      banner.classList.add("is-visible");
    }));
  }

  function hideBanner() {
    banner.classList.remove("is-visible");
    // Hide fully after slide-down animation
    setTimeout(() => banner.setAttribute("hidden", ""), 460);
  }

  // ── Open / close modal ───────────────────────────────────
  function openModal() {
    modal.removeAttribute("hidden");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      modal.classList.add("is-open");
    }));
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    setTimeout(() => modal.setAttribute("hidden", ""), 360);
    document.body.style.overflow = "";
  }

  // ── Save consent to localStorage ─────────────────────────
  function saveConsent(prefs) {
    localStorage.setItem(CONSENT_KEY, "1");
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    hideBanner();
    closeModal();
  }

  function buildPrefsFromToggles() {
    return {
      essential:  true,
      analytics:  toggleAnalytics  ? toggleAnalytics.checked  : false,
      marketing:  toggleMarketing   ? toggleMarketing.checked  : false,
      functional: toggleFunctional  ? toggleFunctional.checked : false,
    };
  }

  // ── Wire up banner buttons ───────────────────────────────
  acceptAllBtn?.addEventListener("click", () => {
    saveConsent({ essential: true, analytics: true, marketing: true, functional: true });
  });

  bannerCloseBtn?.addEventListener("click", () => {
    // Closing = accept essential only (GDPR: must not deny service for rejecting)
    saveConsent({ essential: true, analytics: false, marketing: false, functional: false });
  });

  manageBtn?.addEventListener("click", openModal);

  // ── Wire up modal buttons ────────────────────────────────
  modalCloseBtn?.addEventListener("click",  closeModal);
  modalCancelBtn?.addEventListener("click", closeModal);
  modalOverlay?.addEventListener("click",   closeModal);

  modalAcceptAll?.addEventListener("click", () => {
    if (toggleAnalytics)  toggleAnalytics.checked  = true;
    if (toggleMarketing)  toggleMarketing.checked   = true;
    if (toggleFunctional) toggleFunctional.checked  = true;
    saveConsent({ essential: true, analytics: true, marketing: true, functional: true });
  });

  savePrefsBtn?.addEventListener("click", () => {
    saveConsent(buildPrefsFromToggles());
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  // ── Auto-show on first visit ─────────────────────────────
  showBanner();
}

// ─────────────────────────────────────────────────────────────
// NEWSLETTER SIGNUP — /api/newsletter
// ─────────────────────────────────────────────────────────────
function initNewsletterSignup() {
  /* ── DOM refs ─────────────────────────────────────────────── */
  var form      = document.getElementById("nl-form");
  var emailInput= document.getElementById("nl-email");
  var submitBtn = document.getElementById("nl-submit");
  var btnText   = submitBtn  ? submitBtn.querySelector(".nl-btn-text")  : null;
  var spinner   = submitBtn  ? submitBtn.querySelector(".nl-spinner")   : null;
  var errorEl   = document.getElementById("nl-error");
  var successEl = document.getElementById("nl-success");
  var inputWrap = emailInput ? emailInput.closest(".nl-input-wrap")     : null;

  if (!form || !emailInput) return; // newsletter not present on this page

  // Stamp form load time for bot timing check
  var nlFormStart = Date.now();
  var nlFormTimeInput = document.getElementById("nl-form-time");
  if (nlFormTimeInput) nlFormTimeInput.value = nlFormStart;

  /* ── Helpers ─────────────────────────────────────────────── */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    if (btnText) btnText.hidden = on;
    if (spinner) spinner.hidden = !on;
  }

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.removeAttribute("hidden");
    // Re-trigger shake animation by toggling
    errorEl.style.animation = "none";
    // Force reflow
    void errorEl.offsetHeight;
    errorEl.style.animation = "";
    if (inputWrap) inputWrap.classList.add("is-invalid");
  }

  function clearError() {
    if (errorEl) errorEl.setAttribute("hidden", "");
    if (inputWrap) inputWrap.classList.remove("is-invalid");
  }

  function showSuccess() {
    // Swap form → success state
    if (form)      form.setAttribute("hidden", "");
    if (successEl) {
      successEl.removeAttribute("hidden");
      // Re-trigger SVG animations
      var circle = successEl.querySelector(".nl-check-circle");
      var tick   = successEl.querySelector(".nl-check-tick");
      [circle, tick].forEach(function(el) {
        if (!el) return;
        el.style.animation = "none";
        void el.offsetHeight;
        el.style.animation = "";
      });
    }
  }

  /* ── Submit handler ──────────────────────────────────────── */
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    clearError();

    var email = emailInput.value.trim();

    // Client-side validation
    if (!email) {
      showError("Please enter your email address.");
      emailInput.focus();
      return;
    }
    if (!isValidEmail(email)) {
      showError("That doesn't look like a valid email. Please try again.");
      emailInput.focus();
      return;
    }

    setLoading(true);

    fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email })
    })
      .then(function(response) {
        return response.json().then(function(json) {
          return { ok: response.ok, json: json };
        });
      })
      .then(function(result) {
        setLoading(false);
        if (result.ok) {
          showSuccess();
        } else {
          showError(result.json && result.json.message ? result.json.message : "Something went wrong. Please try again.");
        }
      })
      .catch(function(err) {
        setLoading(false);
        console.error("[VisionX Newsletter] Request error:", err);
        showError("Something went wrong. Please try again or contact us directly.");
      });
  });

  /* Clear error on typing */
  emailInput.addEventListener("input", clearError);
}

// ═══════════════════════════════════════════════════════════════
//  VisionX Coders — Security Module
//  Adds: rate limiting, input sanitization, honeypot detection,
//        anti-bot timing checks, and form integrity guards.
// ═══════════════════════════════════════════════════════════════

// ── Input Sanitizer ────────────────────────────────────────────
// Strips all HTML tags and dangerous characters from user input.
function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
    .slice(0, 500); // cap length to prevent large payloads
}

// ── Email Validator (strict RFC-compatible) ────────────────────
function isStrictEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(
    String(email).toLowerCase().trim()
  );
}

// ── Rate Limiter ───────────────────────────────────────────────
// Prevents repeated form submissions. Max N attempts per window.
// Uses localStorage so limits persist across page reloads.
var RateLimiter = {
  check: function(key, maxAttempts, windowMs) {
    try {
      var now    = Date.now();
      var stored = JSON.parse(localStorage.getItem("vx_rl_" + key) || "[]");
      // Remove entries outside the time window
      stored = stored.filter(function(t) { return now - t < windowMs; });
      if (stored.length >= maxAttempts) {
        var waitSec = Math.ceil((windowMs - (now - stored[0])) / 1000);
        return { blocked: true, waitSeconds: waitSec };
      }
      stored.push(now);
      localStorage.setItem("vx_rl_" + key, JSON.stringify(stored));
      return { blocked: false };
    } catch(e) {
      return { blocked: false }; // fail open if localStorage unavailable
    }
  }
};

// ── Honeypot Checker ───────────────────────────────────────────
// Forms have a hidden field called "website". Real users never
// fill it in. Bots that auto-fill all fields will trip this.
function isHoneypotTripped(form) {
  var pot = form.querySelector('[name="website"]');
  return pot && pot.value.length > 0;
}

// ── Timing Guard ───────────────────────────────────────────────
// Bots often submit forms in < 1 second. Real humans take longer.
function isTooFast(formStartTime) {
  return (Date.now() - formStartTime) < 1200; // 1.2 seconds minimum
}

// ── Console Warning for DevTools Snoopers ─────────────────────
(function() {
  var warned = false;
  function devToolsWarning() {
    if (!warned) {
      warned = true;
      console.log(
        "%c\u26A0\uFE0F STOP!",
        "color:#f97316;font-size:48px;font-weight:900;"
      );
      console.log(
        "%cThis is a browser feature for developers. Do not paste or run any code here — it could compromise your account or data.",
        "color:#c2410c;font-size:16px;"
      );
      console.log(
        "%cVisionX Coders | Islamabad, Pakistan | iumer633@gmail.com",
        "color:#6b4a3a;font-size:12px;"
      );
    }
  }
  // Detect DevTools open (simple threshold method)
  var threshold = 160;
  setInterval(function() {
    if (
      window.outerWidth  - window.innerWidth  > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      devToolsWarning();
    }
  }, 1000);
})();


// ═══════════════════════════════════════════════════════════════
//  Trial Booking + Contact Form → /api/* (Vercel serverless
//  functions, which validate server-side and write to Google
//  Sheets + send email notifications via Resend)
// ═══════════════════════════════════════════════════════════════

// ── Trial Booking Form → /api/book-trial ──────────────────────
function initTrialBookingForm() {
  var modal   = document.getElementById("trial-modal");
  var form    = modal ? modal.querySelector(".trial-form") : null;
  var msgBox  = modal ? modal.querySelector(".trial-form__message") : null;
  var submitBtn = form ? form.querySelector(".trial-form__submit") : null;

  if (!form) return;

  // Stamp form open time (for bot timing check)
  var formOpenTime = Date.now();
  var timeInput = form.querySelector('[name="form_time"]');
  if (timeInput) timeInput.value = formOpenTime;

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    // ── Security checks ────────────────────────────────────────
    if (isHoneypotTripped(form)) return; // silent bot rejection
    if (isTooFast(formOpenTime)) {
      showMsg(msgBox, "error", "Please slow down and try again.");
      return;
    }
    var rl = RateLimiter.check("trial-booking", 3, 60 * 60 * 1000);
    if (rl.blocked) {
      showMsg(msgBox, "error", "Too many submissions. Wait " + rl.waitSeconds + "s.");
      return;
    }

    // ── Validate ───────────────────────────────────────────────
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // ── Gather sanitized data ──────────────────────────────────
    var data = {
      type:       "trial-booking",
      childName:  sanitizeInput(form.querySelector('[name="childName"]')  ? form.querySelector('[name="childName"]').value  : ""),
      parentName: sanitizeInput(form.querySelector('[name="parentName"]') ? form.querySelector('[name="parentName"]').value : ""),
      email:      sanitizeInput(form.querySelector('[name="email"]')      ? form.querySelector('[name="email"]').value      : ""),
      phone:      sanitizeInput(form.querySelector('[name="phone"]')      ? form.querySelector('[name="phone"]').value      : ""),
      age:        sanitizeInput(form.querySelector('[name="age"]')        ? form.querySelector('[name="age"]').value        : ""),
      program:    sanitizeInput(form.querySelector('[name="program"]')    ? form.querySelector('[name="program"]').value    : ""),
      timeslot:   sanitizeInput(form.querySelector('[name="timeslot"]')   ? form.querySelector('[name="timeslot"]').value   : ""),
      timestamp:  new Date().toLocaleString("en-PK", {timeZone:"Asia/Karachi"})
    };

    // ── Submit ─────────────────────────────────────────────────
    setSubmitState(submitBtn, true);
    showMsg(msgBox, "info", "Submitting your booking...");

    fetch("/api/book-trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:   JSON.stringify(data)
    })
    .then(function(response) {
      return response.json().then(function(json) {
        return { ok: response.ok, json: json };
      });
    })
    .then(function(result) {
      setSubmitState(submitBtn, false);
      if (result.ok) {
        showMsg(msgBox, "success", "✅ Booking received! We will WhatsApp you within 30 minutes at " + data.phone + " to confirm your free trial class. 🎉");
        setTimeout(function() { form.reset(); }, 2000);
      } else {
        showMsg(msgBox, "error", (result.json && result.json.message) || "Could not submit. Please WhatsApp us directly at +92 329 505 0039");
      }
    })
    .catch(function(err) {
      setSubmitState(submitBtn, false);
      showMsg(msgBox, "error", "Could not submit. Please WhatsApp us directly at +92 329 505 0039");
      console.error("[VisionX Booking Error]", err);
    });
  });
}

// ── Contact Form → /api/contact ───────────────────────────────
function initContactFormSheets() {
  var form    = document.querySelector("[data-contact-form]");
  var msgBox  = form ? form.querySelector("[data-form-message]") : null;
  var submitBtn = form ? form.querySelector("[type='submit']") : null;

  if (!form) return;

  var formOpenTime = Date.now();

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    // ── Security ───────────────────────────────────────────────
    if (isHoneypotTripped(form)) return;
    if (isTooFast(formOpenTime)) {
      showMsg(msgBox, "error", "Please wait a moment before submitting.");
      return;
    }
    var rl = RateLimiter.check("contact-form", 5, 60 * 60 * 1000);
    if (rl.blocked) {
      showMsg(msgBox, "error", "Too many submissions. Try again in " + rl.waitSeconds + " seconds.");
      return;
    }

    if (!form.checkValidity()) { form.reportValidity(); return; }

    var nameField    = form.querySelector('[name="name"], [name="fullName"], [name="parentName"]');
    var emailField   = form.querySelector('[name="email"]');
    var phoneField   = form.querySelector('[name="phone"]');
    var messageField = form.querySelector('[name="message"]');
    var subjectField = form.querySelector('[name="subject"]');

    var data = {
      type:      "contact-inquiry",
      name:      sanitizeInput(nameField    ? nameField.value    : ""),
      email:     sanitizeInput(emailField   ? emailField.value   : ""),
      phone:     sanitizeInput(phoneField   ? phoneField.value   : ""),
      subject:   sanitizeInput(subjectField ? subjectField.value : "General Inquiry"),
      message:   sanitizeInput(messageField ? messageField.value : ""),
      timestamp: new Date().toLocaleString("en-PK", {timeZone:"Asia/Karachi"})
    };

    setSubmitState(submitBtn, true);
    showMsg(msgBox, "info", "Sending your message...");

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:   JSON.stringify(data)
    })
    .then(function(response) {
      return response.json().then(function(json) {
        return { ok: response.ok, json: json };
      });
    })
    .then(function(result) {
      setSubmitState(submitBtn, false);
      if (result.ok) {
        showMsg(msgBox, "success", "✅ Thank you " + data.name + "! Your message has been received. We will reply to " + data.email + " within 24 hours.");
        form.reset();
      } else {
        showMsg(msgBox, "error", (result.json && result.json.message) || "Could not send message. Please email us directly at iumer633@gmail.com");
      }
    })
    .catch(function() {
      setSubmitState(submitBtn, false);
      showMsg(msgBox, "error", "Could not send message. Please email us directly at iumer633@gmail.com");
    });
  });
}

// ── Shared helpers ─────────────────────────────────────────────
function showMsg(el, type, text) {
  if (!el) return;
  el.textContent = text;
  el.className   = "trial-form__message contact-form__message " +
    (type === "success" ? "is-success" : type === "error" ? "is-error" : "is-info");
  el.style.display = "block";
}

function setSubmitState(btn, loading) {
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading ? "Submitting..." : btn.getAttribute("data-original-text") || "Book Free Trial";
  if (!btn.getAttribute("data-original-text") && !loading)
    btn.setAttribute("data-original-text", btn.textContent);
}
