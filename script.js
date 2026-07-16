(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".mobile-menu");

  function closeMenu() {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  // Sticky header shrink on scroll (class toggle only, no layout thrash)
  var header = document.querySelector(".site-header");
  var lastScrolled = false;
  window.addEventListener(
    "scroll",
    function () {
      var scrolled = window.scrollY > 12;
      if (scrolled !== lastScrolled) {
        header.classList.toggle("is-scrolled", scrolled);
        lastScrolled = scrolled;
      }
    },
    { passive: true }
  );

  // Scroll progress bar + nav active-section highlighting + subtle hero parallax
  var progressBar = document.querySelector(".scroll-progress");
  var heroBg = document.querySelector(".hero-bg");
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var sections = navAnchors
    .map(function (a) {
      var id = a.getAttribute("href");
      return id && id.charAt(0) === "#" ? document.querySelector(id) : null;
    })
    .map(function (el, i) { return { el: el, link: navAnchors[i] }; })
    .filter(function (s) { return s.el; });

  var reduceMotionForScroll = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ticking = false;

  function onScrollUpdate() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (progressBar && docHeight > 0) {
      progressBar.style.width = Math.min(100, (scrollTop / docHeight) * 100) + "%";
    }

    if (heroBg && !reduceMotionForScroll) {
      var offset = Math.min(scrollTop * 0.25, 140);
      heroBg.style.transform = "translateY(" + offset + "px) scale(1.06)";
    }

    var current = null;
    sections.forEach(function (s) {
      var rect = s.el.getBoundingClientRect();
      if (rect.top <= 120) current = s;
    });
    navAnchors.forEach(function (a) { a.classList.remove("active"); });
    if (current) current.link.classList.add("active");

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        setTimeout(onScrollUpdate, 16);
      }
    },
    { passive: true }
  );
  onScrollUpdate();

  // Sentinel: confirm IntersectionObserver actually delivers callbacks in this
  // environment (some embedded/sandboxed contexts silently never fire it).
  // If it doesn't respond quickly, fall back to showing everything immediately
  // rather than leaving content permanently hidden.
  var ioIsAlive = false;
  var ioFallbackFired = false;
  var ioFallbackCallbacks = [];
  function onIoFallback(fn) { ioFallbackCallbacks.push(fn); }
  function triggerIoFallbackIfNeeded() {
    if (ioIsAlive || ioFallbackFired) return;
    ioFallbackFired = true;
    ioFallbackCallbacks.forEach(function (fn) { fn(); });
  }
  if ("IntersectionObserver" in window) {
    var sentinel = document.body;
    var sentinelIo = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        ioIsAlive = true;
        sentinelIo.disconnect();
      }
    });
    sentinelIo.observe(sentinel);
    setTimeout(triggerIoFallbackIfNeeded, 1000);
  } else {
    triggerIoFallbackIfNeeded();
  }

  // Scroll reveal via IntersectionObserver
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach(function (el) { io.observe(el); });
    onIoFallback(function () {
      reveals.forEach(function (el) { el.classList.add("is-visible"); });
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Current year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Gallery lightbox
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxClose = document.getElementById("lightbox-close");
  var tiles = document.querySelectorAll(".gallery-tile");

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add("open");
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxImg.src = "";
  }

  tiles.forEach(function (tile) {
    tile.addEventListener("click", function () {
      var img = tile.querySelector("img");
      openLightbox(tile.getAttribute("data-full") || img.src, img.alt);
    });
  });
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
  });

  // Count-up numbers
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var counters = document.querySelectorAll("[data-count-to]");

  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.hasAttribute("data-suffix") ? el.getAttribute("data-suffix") : "";
    if (reduceMotion) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    var duration = 2400;
    var frameMs = 20;
    var steps = Math.round(duration / frameMs);
    var frame = 0;
    var timer = setInterval(function () {
      frame++;
      var progress = Math.min(frame / steps, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (progress >= 1) clearInterval(timer);
    }, frameMs);
  }

  if ("IntersectionObserver" in window && counters.length) {
    var countIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { countIo.observe(el); });
    onIoFallback(function () {
      counters.forEach(animateCount);
    });
  } else {
    counters.forEach(animateCount);
  }

  // Review slider
  var track = document.getElementById("review-track");
  if (track) {
    var slides = track.querySelectorAll(".review-slide");
    var dotsWrap = document.getElementById("review-dots");
    var prevBtn = document.getElementById("review-prev");
    var nextBtn = document.getElementById("review-next");
    var current = 0;
    var autoTimer;

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.setAttribute("aria-label", "Go to review " + (i + 1));
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.querySelectorAll("button");

    function goTo(i) {
      current = (i + slides.length) % slides.length;
      track.style.transform = "translateX(-" + (current * 100) + "%)";
      dots.forEach(function (d, di) { d.classList.toggle("active", di === current); });
    }
    function restartAuto() {
      clearInterval(autoTimer);
      if (!reduceMotion && slides.length > 1) {
        autoTimer = setInterval(function () { goTo(current + 1); }, 6000);
      }
    }
    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(current - 1); restartAuto(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(current + 1); restartAuto(); });
    goTo(0);
    restartAuto();
  }
})();
