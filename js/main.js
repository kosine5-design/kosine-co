/* KOSINE.CO prototype behavior. Kept intentionally small.
   1. Header state on scroll
   2. Mobile navigation
   3. Reveal on scroll (respects prefers-reduced-motion)
   4. Conversion gateway dialog with intent routing
   5. Form prototype confirmations
*/

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Header state */
  var header = document.getElementById("site-header");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 2. Mobile navigation */
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("primary-nav");
  function closeNav() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.style.overflow = "";
  }
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeNav();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) closeNav();
  });

  /* 3. Reveal on scroll */
  var revealEls = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* 4. Conversion gateway */
  var dialog = document.getElementById("inquiry-dialog");
  var dialogTitle = document.getElementById("inquiry-title");
  var dialogContext = document.getElementById("inquiry-context");
  var confirmNote = document.getElementById("inquiry-confirm");
  var inquiryForm = document.getElementById("inquiry-form");

  var FORM_ENDPOINT = "https://formsubmit.co/ajax/info@kosine.co";
  var currentIntent = "project";

  var intents = {
    speak: {
      title: "Book Kosine to Speak",
      context: "Keynotes, masterclasses, and institutional programs. Tell us about the room.",
      tag: "[SPEAKING]"
    },
    project: {
      title: "Hire Kosine for a Project",
      context: "Production, songwriting, music supervision, or sonic identity. Tell us about the work.",
      tag: "[PROJECT]"
    },
    consult: {
      title: "Request a Consultation",
      context: "Focused one on one strategy. Tell us what you want to move.",
      tag: "[CONSULT]"
    },
    media: {
      title: "Media & Partnerships",
      context: "Press, appearances, brand and institutional partnerships. Tell us about the platform.",
      tag: "[MEDIA]"
    }
  };

  function openIntent(key) {
    var intent = intents[key] || intents.project;
    currentIntent = key in intents ? key : "project";
    dialogTitle.textContent = intent.title;
    dialogContext.textContent = intent.context;
    confirmNote.classList.remove("is-shown");
    inquiryForm.hidden = false;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  document.querySelectorAll(".door").forEach(function (door) {
    door.addEventListener("click", function () {
      openIntent(door.getAttribute("data-door"));
    });
  });

  /* Pathway links carry an intent into the gateway */
  document.querySelectorAll("[data-intent]").forEach(function (link) {
    link.addEventListener("click", function () {
      var key = link.getAttribute("data-intent");
      window.setTimeout(function () { openIntent(key); }, reducedMotion ? 0 : 450);
    });
  });

  document.getElementById("inquiry-close").addEventListener("click", function () {
    dialog.close ? dialog.close() : dialog.removeAttribute("open");
  });

  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) {
      dialog.close ? dialog.close() : dialog.removeAttribute("open");
    }
  });

  inquiryForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var intent = intents[currentIntent];
    var payload = {
      _subject: intent.tag + " " + intent.title + ": " + (document.getElementById("inq-name").value || "New inquiry"),
      pathway: intent.title,
      name: document.getElementById("inq-name").value,
      organization: document.getElementById("inq-org").value,
      email: document.getElementById("inq-email").value,
      timeline: document.getElementById("inq-timeline").value,
      details: document.getElementById("inq-detail").value,
      _template: "table"
    };
    var submitBtn = inquiryForm.querySelector(".btn--solid");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function () {
      inquiryForm.hidden = true;
      confirmNote.innerHTML = "<strong>Received.</strong> Your inquiry is in. Expect a response within two business days.";
      confirmNote.classList.add("is-shown");
      inquiryForm.reset();
    }).catch(function () {
      confirmNote.innerHTML = "<strong>Something interrupted the send.</strong> Email us directly: info@kosine.co";
      confirmNote.classList.add("is-shown");
    }).finally(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Inquiry";
    });
  });

  /* 5. Mailing list: routes to info@kosine.co tagged [HOUSE].
     Swap to the Beehiiv embed when the embed code is pulled from the dashboard. */
  var houseForm = document.getElementById("house-form");
  var houseNote = document.getElementById("house-note");
  houseForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var payload = {
      _subject: "[HOUSE] New member: " + document.getElementById("house-name").value,
      firstName: document.getElementById("house-name").value,
      email: document.getElementById("house-email").value,
      list: "Enter the House mailing list",
      _template: "table"
    };
    var btn = houseForm.querySelector(".btn");
    btn.disabled = true;
    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function () {
      houseNote.textContent = "You are in the House. Watch your inbox.";
      houseForm.reset();
    }).catch(function () {
      houseNote.textContent = "Something interrupted the send. Email info@kosine.co and we will add you.";
    }).finally(function () { btn.disabled = false; });
  });

  /* Footer year */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
