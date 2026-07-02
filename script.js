/* =========================================================
   DON JUAN MEXICAN COCINA — interactions
   ========================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Smooth scroll (Lenis) — single rAF driver ---------- */
  var lenis = null;
  if (window.Lenis && !prefersReduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- Hero reveal — immediate, never scroll-gated ----------
     The hero is in view at load; reveal it on DOM-ready with a staggered
     intro so it never depends on ScrollTrigger init timing or the failsafe. */
  (function revealHero() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var items = hero.querySelectorAll("[data-reveal]");
    function show() {
      items.forEach(function (el, i) {
        el.style.transitionDelay = (0.08 + i * 0.09).toFixed(2) + "s";
        el.classList.add("is-visible");
      });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", show, { once: true });
    } else {
      requestAnimationFrame(show);
    }
  })();

  /* ---------- GSAP + ScrollTrigger ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on("scroll", ScrollTrigger.update); }

    /* Reveal on scroll */
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () { el.classList.add("is-visible"); }
      });
    });

    if (!prefersReduced) {
      /* Hero parallax (zoom out as you scroll) */
      var heroImg = document.getElementById("heroImg");
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 14, scale: 1.02, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
        });
      }

      /* Parallax media blocks */
      gsap.utils.toArray("[data-parallax]").forEach(function (img) {
        gsap.fromTo(img, { yPercent: -8 }, {
          yPercent: 8, ease: "none",
          scrollTrigger: { trigger: img.closest("[data-parallax-wrap]") || img, start: "top bottom", end: "bottom top", scrub: true }
        });
      });

      /* Signature titles — letter rise */
      gsap.utils.toArray("[data-letters]").forEach(function (title) {
        var text = title.textContent;
        title.setAttribute("aria-label", text);
        title.innerHTML = "";
        text.split("").forEach(function (ch) {
          var s = document.createElement("span");
          s.className = "ltr";
          s.textContent = ch === " " ? " " : ch;
          s.setAttribute("aria-hidden", "true");
          title.appendChild(s);
        });
        gsap.from(title.querySelectorAll(".ltr"), {
          yPercent: 110, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.025,
          scrollTrigger: { trigger: title, start: "top 86%", once: true }
        });
      });
    }

    /* Stat counters */
    gsap.utils.toArray(".stat__num[data-count]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: end, duration: 1.6, ease: "power2.out",
            onUpdate: function () {
              el.textContent = obj.v.toFixed(decimals) + suffix;
            },
            onComplete: function () {
              el.textContent = (decimals ? end.toFixed(decimals) : Math.round(end)) + suffix;
            }
          });
        }
      });
    });
  } else {
    /* No GSAP — show everything */
    document.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Nav solid on scroll ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 60) nav.classList.add("is-solid");
    else nav.classList.remove("is-solid");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile overlay ---------- */
  var toggle = document.getElementById("navToggle");
  var overlay = document.getElementById("overlay");
  var overlayClose = document.getElementById("overlayClose");

  function openOverlay() {
    if (!overlay) return;
    overlay.classList.add("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
  }
  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
    document.body.style.overflow = "";
  }
  if (toggle) toggle.addEventListener("click", openOverlay);
  if (overlayClose) overlayClose.addEventListener("click", closeOverlay);
  if (overlay) {
    overlay.querySelectorAll(".overlay__nav a").forEach(function (a) {
      a.addEventListener("click", closeOverlay);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeOverlay();
  });

  /* ---------- Anchor smooth-scroll via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  /* ---------- Menu tabs ---------- */
  var tabs = document.querySelectorAll(".menu__tab");
  var panels = document.querySelectorAll(".menu__panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.getAttribute("data-tab");
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === key);
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Highlight today's row ONLY when actually open now ---------- */
  (function highlightHours() {
    var table = document.getElementById("hours");
    if (!table) return;
    var rows = table.querySelectorAll("tbody tr");
    if (!rows.length) return;
    /* Open/close in minutes from midnight; a close > 1440 would run past
       midnight into the next day. Table rows are Sun..Sat, so the row
       index equals getDay() (0 = Sunday .. 6 = Saturday). */
    var HRS = {
      0: { o: 660, c: 1260 },  // Sun 11:00 AM – 9:00 PM
      1: { o: 660, c: 1260 },  // Mon 11:00 AM – 9:00 PM
      2: { o: 660, c: 1320 },  // Tue 11:00 AM – 10:00 PM
      3: { o: 660, c: 1260 },  // Wed 11:00 AM – 9:00 PM
      4: { o: 660, c: 1260 },  // Thu 11:00 AM – 9:00 PM
      5: { o: 660, c: 1320 },  // Fri 11:00 AM – 10:00 PM
      6: { o: 660, c: 1320 }   // Sat 11:00 AM – 10:00 PM
    };
    var d = new Date();
    var day = d.getDay();                         // 0 Sun .. 6 Sat
    var now = d.getHours() * 60 + d.getMinutes();
    var openDay = -1;
    var t = HRS[day];
    if (t && now >= t.o && now < Math.min(t.c, 1440)) openDay = day;  // today's shift, up to midnight
    var yDay = (day + 6) % 7;                     // yesterday
    var yt = HRS[yDay];
    if (openDay < 0 && yt && yt.c > 1440 && now < yt.c - 1440) openDay = yDay; // still open from last night's late shift
    if (openDay < 0) return;                      // closed → no highlight, no "Open now"
    if (rows[openDay]) rows[openDay].classList.add("is-now");
  })();

  /* ---------- Swiper: gallery ---------- */
  if (window.Swiper) {
    if (document.querySelector(".gallery__swiper")) {
      new Swiper(".gallery__swiper", {
        slidesPerView: "auto",
        spaceBetween: 20,
        grabCursor: true,
        navigation: {
          prevEl: ".gallery__btn--prev",
          nextEl: ".gallery__btn--next"
        }
      });
    }

    /* Swiper: reviews */
    if (document.querySelector(".reviews__swiper")) {
      new Swiper(".reviews__swiper", {
        slidesPerView: 1,
        loop: true,
        autoplay: { delay: 5500, disableOnInteraction: false },
        speed: 700,
        pagination: { el: ".reviews__dots", clickable: true }
      });
    }
  }
})();
