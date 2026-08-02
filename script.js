/* ============================================================
   VERA NUTRITION — SCRIPT
   Vanilla JS, no dependencies. Each feature is a small module
   that fails quietly if its markup isn't on the page.

   1. Reduced-motion check   5. Product card tilt
   2. Sticky header          6. Waitlist forms
   3. Scroll reveals         7. Seamless ticker
   4. Counter + parallax     8. Topographic canvas
   ============================================================ */

(function () {
  "use strict";

  /* ---- 1. Respect the OS "reduce motion" setting ------------ */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* ---- 2. Sticky header ------------------------------------- */
  const header = document.getElementById("siteHeader");

  const onScroll = () => {
    if (header) header.classList.toggle("is-stuck", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });


  /* ---- 3. Scroll reveals ------------------------------------ */
  const revealables = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);      // reveal once, then stop watching
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach((el) => revealObserver.observe(el));
  }


  /* ---- 4a. Animated counter ---------------------------------
     Counts up to the number in data-count-to the first time the
     element scrolls into view. Edit the number in index.html.  */
  const counters = document.querySelectorAll("[data-count-to]");

  const runCounter = (el) => {
    const target = parseInt(el.dataset.countTo, 10) || 0;

    if (reduceMotion) {
      el.textContent = target.toLocaleString("sv-SE");
      return;
    }

    const duration = 1800;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);           // ease-out cubic
      el.textContent = Math.round(target * eased).toLocaleString("sv-SE");
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach(runCounter);
  }


  /* ---- 4b. Pointer parallax on the hero jars ----------------- */
  const parallaxItems = document.querySelectorAll("[data-parallax]");

  if (!reduceMotion && parallaxItems.length && window.matchMedia("(pointer: fine)").matches) {
    let pending = false;

    window.addEventListener("mousemove", (event) => {
      if (pending) return;
      pending = true;

      requestAnimationFrame(() => {
        const dx = event.clientX / window.innerWidth - 0.5;
        const dy = event.clientY / window.innerHeight - 0.5;

        parallaxItems.forEach((item) => {
          const depth = parseFloat(item.dataset.parallax) || 0.02;
          item.style.translate = `${dx * depth * 900}px ${dy * depth * 900}px`;
        });
        pending = false;
      });
    });
  }


  /* ---- 4c. Cursor-following glow on buttons ------------------ */
  document.querySelectorAll("[data-glow]").forEach((btn) => {
    btn.addEventListener("mousemove", (event) => {
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty("--glow-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      btn.style.setProperty("--glow-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  });


  /* ---- 5. Product card tilt ---------------------------------- */
  const MAX_TILT = 6;   // degrees — raise for a stronger effect

  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-y", `${px * MAX_TILT}deg`);
        card.style.setProperty("--tilt-x", `${-py * MAX_TILT}deg`);
      });

      card.addEventListener("mouseleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }


  /* ---- 6. Waitlist forms -------------------------------------
     Front-end only: no address is sent anywhere yet. Hook up your
     provider inside submitEmail() — Mailchimp, Klaviyo, Formspree
     or your own endpoint.                                        */
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const MESSAGES = {
    empty:   "Skriv in din e-postadress först.",
    invalid: "Kontrollera adressen — den ser inte komplett ut.",
    success: "Du är med på listan. Vi hör av oss innan lanseringen.",
    failed:  "Det gick inte att spara adressen. Försök igen om en stund."
  };

  /**
   * Send the address to your provider.
   * Replace the body of this function with a real fetch() call, e.g.
   *
   *   return fetch("https://din-endpoint.se/waitlist", {
   *     method: "POST",
   *     headers: { "Content-Type": "application/json" },
   *     body: JSON.stringify({ email })
   *   }).then((res) => { if (!res.ok) throw new Error(res.status); });
   */
  function submitEmail(email) {
    console.log("Waitlist signup:", email);
    return new Promise((resolve) => setTimeout(resolve, 650));
  }

  document.querySelectorAll(".waitlist-form").forEach((form) => {
    const input = form.querySelector("input[type='email']");
    const button = form.querySelector("button");
    const message = form.querySelector(".form-msg");

    const showMessage = (text, isError) => {
      message.textContent = text;
      message.classList.toggle("is-error", Boolean(isError));
      message.classList.add("is-shown");
    };

    // Clear the error state as soon as the person starts fixing it
    input.addEventListener("input", () => {
      form.classList.remove("is-invalid");
      message.classList.remove("is-shown", "is-error");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = input.value.trim();

      if (!email) {
        form.classList.add("is-invalid");
        showMessage(MESSAGES.empty, true);
        input.focus();
        return;
      }

      if (!EMAIL_PATTERN.test(email)) {
        form.classList.add("is-invalid");
        showMessage(MESSAGES.invalid, true);
        input.focus();
        return;
      }

      button.disabled = true;
      button.querySelector("span").textContent = "Skickar…";

      try {
        await submitEmail(email);
        form.classList.add("is-done");
        showMessage(MESSAGES.success, false);

        // Bump the visible counter so the page reflects the new signup
        counters.forEach((el) => {
          const next = (parseInt(el.textContent.replace(/\D/g, ""), 10) || 0) + 1;
          el.textContent = next.toLocaleString("sv-SE");
        });
      } catch (error) {
        showMessage(MESSAGES.failed, true);
        button.disabled = false;
        button.querySelector("span").textContent = "Få tidig tillgång";
      }
    });
  });


  /* ---- 7. Seamless ticker -----------------------------------
     Duplicates the strip once so the -50% marquee loops without
     a visible jump. Edit the words in index.html.              */
  const tickerTrack = document.querySelector(".ticker__track");
  if (tickerTrack) tickerTrack.innerHTML += tickerTrack.innerHTML;


  /* ---- 8. Topographic canvas ---------------------------------
     Draws the same contour-line pattern as the product labels,
     drifting slowly behind the page. Marching squares over a
     smooth wave field — no images, no libraries.               */
  const canvas = document.getElementById("topo");

  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");

    const SETTINGS = {
      cell: 26,          // grid size in px — smaller = finer lines
      levels: 11,        // number of contour rings
      speed: 0.00016,    // drift speed
      stroke: "rgba(67, 201, 172, 0.20)"
    };

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let field = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / SETTINGS.cell) + 1;
      rows = Math.ceil(height / SETTINGS.cell) + 1;
      field = new Float32Array(cols * rows);
    };

    // Smooth, organic scalar field built from layered waves
    const sample = (x, y, t) =>
      Math.sin(x * 0.28 + t) +
      Math.sin(y * 0.32 - t * 0.8) +
      Math.sin((x + y) * 0.17 + t * 1.3) +
      Math.sin(Math.hypot(x - cols * 0.5, y - rows * 0.55) * 0.22 - t * 1.6);

    // Linear interpolation between two grid points at the threshold
    const cross = (a, b, level) => (level - a) / (b - a || 1e-6);

    const draw = (time) => {
      const t = time * SETTINGS.speed;
      ctx.clearRect(0, 0, width, height);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          field[y * cols + x] = sample(x, y, t);
        }
      }

      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      for (let level = 0; level < SETTINGS.levels; level++) {
        const threshold = -3.2 + (level * 6.4) / (SETTINGS.levels - 1);
        // Every third line is drawn brighter, like an index contour
        ctx.strokeStyle = level % 3 === 0
          ? "rgba(67, 201, 172, 0.34)"
          : SETTINGS.stroke;
        ctx.beginPath();

        for (let y = 0; y < rows - 1; y++) {
          for (let x = 0; x < cols - 1; x++) {
            const tl = field[y * cols + x];
            const tr = field[y * cols + x + 1];
            const br = field[(y + 1) * cols + x + 1];
            const bl = field[(y + 1) * cols + x];

            // 4-bit marching-squares index
            let state = 0;
            if (tl > threshold) state |= 8;
            if (tr > threshold) state |= 4;
            if (br > threshold) state |= 2;
            if (bl > threshold) state |= 1;
            if (state === 0 || state === 15) continue;

            const cw = SETTINGS.cell;
            const px = x * cw;
            const py = y * cw;

            const top    = [px + cross(tl, tr, threshold) * cw, py];
            const right  = [px + cw, py + cross(tr, br, threshold) * cw];
            const bottom = [px + cross(bl, br, threshold) * cw, py + cw];
            const left   = [px, py + cross(tl, bl, threshold) * cw];

            const segment = (a, b) => {
              ctx.moveTo(a[0], a[1]);
              ctx.lineTo(b[0], b[1]);
            };

            switch (state) {
              case 1: case 14: segment(left, bottom); break;
              case 2: case 13: segment(bottom, right); break;
              case 3: case 12: segment(left, right); break;
              case 4: case 11: segment(top, right); break;
              case 5:          segment(left, top); segment(bottom, right); break;
              case 6: case 9:  segment(top, bottom); break;
              case 7: case 8:  segment(left, top); break;
              case 10:         segment(top, right); segment(left, bottom); break;
            }
          }
        }
        ctx.stroke();
      }
    };

    resize();

    if (reduceMotion) {
      draw(0);                                  // one static frame
    } else {
      let last = 0;
      const loop = (now) => {
        if (now - last > 33) {                  // cap at ~30fps
          draw(now);
          last = now;
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reduceMotion) draw(0);
      }, 150);
    });
  }


  /* ---- Footer year ------------------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
