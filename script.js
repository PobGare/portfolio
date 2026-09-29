(() => {
  "use strict";

  const data = window.PORTFOLIO_DATA;
  if (!data) {
    console.error("PORTFOLIO_DATA was not found. Check portfolio-data.js.");
    return;
  }

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const year = new Date().getFullYear();
  const personal = data.personal || {};
  const projects = Array.isArray(data.projects) ? data.projects : [];

  function text(selector, value) {
    const element = $(selector);
    if (element && value !== undefined && value !== null) element.textContent = value;
  }

  function safeUrl(url) {
    if (!url || typeof url !== "string") return "";
    try {
      const parsed = new URL(url, window.location.href);
      return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? parsed.href : "";
    } catch {
      return "";
    }
  }

  function initPersonalDetails() {
    text("#brandMark", personal.brandMark || "YN");
    text("#brandName", personal.name || "YOUR NAME");
    text("#footerName", personal.name || "YOUR NAME");
    text("#availabilityText", personal.availability || "Available for select projects");
    text("#heroDescription", personal.heroDescription || "");
    text("#aboutLead", personal.aboutLead || "");
    text("#aboutBody", personal.aboutBody || "");
    text("#contactText", personal.contactText || "");
    text("#contactEmail", personal.email || "");
    text("#yearLabel", year);
    text("#footerYear", year);

    document.title = `${personal.name || "Portfolio"} — ${personal.role || "Web Developer"}`;

    const whatsappLink = $("#whatsappLink");
    const whatsappNumber = String(personal.whatsapp || "").replace(/\D/g, "");
    if (whatsappLink) {
      if (whatsappNumber) {
        const whatsappMessage = encodeURIComponent(
          `Hi ${personal.name || "there"}, I came across your portfolio and wanted to discuss a project with you.`
        );
        whatsappLink.href = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
      } else {
        whatsappLink.hidden = true;
      }
    }

    const gmailLink = $("#gmailLink");
    if (gmailLink) {
      if (personal.email) {
        const subject = encodeURIComponent("Project Inquiry");
        const body = encodeURIComponent(
          `Hi ${personal.name || "there"},\n\nI came across your portfolio and wanted to discuss a project with you.`
        );
        gmailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(personal.email)}&su=${subject}&body=${body}`;
      } else {
        gmailLink.hidden = true;
      }
    }
  }

  function renderStats() {
    const container = $("#heroStats");
    if (!container) return;
    container.innerHTML = "";
    (data.stats || []).forEach((stat) => {
      const item = document.createElement("div");
      item.className = "stat";
      item.innerHTML = `<strong>${stat.value}</strong><span>${stat.label}</span>`;
      container.appendChild(item);
    });
  }

  function renderMarquee() {
    const track = $("#marqueeTrack");
    if (!track) return;
    const items = data.capabilities || [];
    const loop = [...items, ...items];
    track.innerHTML = loop.map((item) => `<span>${item}<i>✦</i></span>`).join("");
  }

  function renderProjects() {
    const grid = $("#projectGrid");
    if (!grid) return;
    grid.innerHTML = "";

    projects.forEach((project, index) => {
      const card = document.createElement("article");
      card.className = "project-card reveal";
      card.dataset.projectIndex = String(index);
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `View details for ${project.name}`);

      const number = String(index + 1).padStart(2, "0");
      card.innerHTML = `
        <div class="project-media">
          <img src="${project.image}" alt="${project.alt || project.name}" loading="lazy" />
          <div class="project-overlay"><span>View project</span><span>↗</span></div>
        </div>
        <div class="project-info">
          <div>
            <span class="project-number">${number}</span>
            <h3>${project.name}</h3>
          </div>
          <div class="project-meta"><span>${project.category}</span><span>${project.year || ""}</span></div>
        </div>`;

      const open = () => openProject(index);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });

      grid.appendChild(card);
    });

    refreshRevealObserver();
  }

  function renderServices() {
    const list = $("#serviceList");
    if (!list) return;
    list.innerHTML = "";

    (data.services || []).forEach((service) => {
      const item = document.createElement("article");
      item.className = "service-item reveal";
      item.innerHTML = `
        <span class="service-number">${service.number}</span>
        <h3>${service.title}</h3>
        <p>${service.description}</p>
        <div class="service-tags">${(service.tags || []).map((tag) => `<span>${tag}</span>`).join("")}</div>`;
      list.appendChild(item);
    });

    refreshRevealObserver();
  }

  function renderTechnologies() {
    const list = $("#techList");
    if (!list) return;
    list.innerHTML = (data.technologies || []).map((tech) => `<span>${tech}</span>`).join("");
  }

  function renderSocials() {
    const container = $("#socialLinks");
    if (!container) return;
    container.innerHTML = "";

    (data.socials || []).forEach((social) => {
      const url = safeUrl(social.url);
      if (!url) return;
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = social.label;
      container.appendChild(anchor);
    });
  }

  const modal = $("#projectModal");

  function openProject(index) {
    const project = projects[index];
    if (!project || !modal) return;

    text("#modalCategory", project.category || "Project");
    text("#modalTitle", project.name || "Project");
    text("#modalNumber", String(index + 1).padStart(2, "0"));
    text("#modalSummary", project.summary || "");

    const media = $("#modalMedia");
    if (media) media.innerHTML = `<img src="${project.image}" alt="${project.alt || project.name}" />`;

    const highlights = $("#modalHighlights");
    if (highlights) highlights.innerHTML = (project.highlights || []).map((item) => `<li>${item}</li>`).join("");

    const tech = $("#modalTech");
    if (tech) tech.innerHTML = (project.tech || []).map((item) => `<span>${item}</span>`).join("");

    const actions = $("#modalActions");
    if (actions) {
      actions.innerHTML = "";
      const liveUrl = safeUrl(project.liveUrl);
      const githubUrl = safeUrl(project.githubUrl);

      if (liveUrl) actions.appendChild(createModalLink("Visit live website ↗", liveUrl, "button button-light"));
      if (githubUrl) actions.appendChild(createModalLink("View code ↗", githubUrl, "button button-outline"));

      if (!liveUrl && !githubUrl) {
        const note = document.createElement("span");
        note.className = "modal-placeholder-note";
        note.textContent = "Add liveUrl or githubUrl in portfolio-data.js to show project links here.";
        actions.appendChild(note);
      }
    }

    modal.showModal();
    document.body.classList.add("modal-open");
  }

  function createModalLink(label, href, className) {
    const link = document.createElement("a");
    link.className = className;
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    return link;
  }

  function closeModal() {
    if (modal?.open) modal.close();
    document.body.classList.remove("modal-open");
  }

  $("#modalClose")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    const rect = modal.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) closeModal();
  });
  modal?.addEventListener("close", () => document.body.classList.remove("modal-open"));

  function initMobileMenu() {
    const button = $("#menuButton");
    const menu = $("#mobileMenu");
    if (!button || !menu) return;

    const close = () => {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open menu");
      menu.setAttribute("aria-hidden", "true");
      document.body.classList.remove("menu-open");
    };

    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      if (open) {
        close();
      } else {
        button.setAttribute("aria-expanded", "true");
        button.setAttribute("aria-label", "Close menu");
        menu.setAttribute("aria-hidden", "false");
        document.body.classList.add("menu-open");
      }
    });

    $$("a", menu).forEach((link) => link.addEventListener("click", close));
  }

  let revealObserver;
  function refreshRevealObserver() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      $$(".reveal").forEach((el) => el.classList.add("visible"));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
      );
    }

    $$(".reveal:not(.visible)").forEach((el) => revealObserver.observe(el));
  }

  function initScrollEffects() {
    const progress = $(".scroll-progress span");
    const header = $(".site-header");

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      if (progress) progress.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
      if (header) header.classList.toggle("scrolled", window.scrollY > 24);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initCursorGlow() {
    const glow = $(".cursor-glow");
    if (!glow || window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    window.addEventListener("pointermove", (event) => {
      glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    });
  }

  function initProjectTilt() {
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.addEventListener("pointermove", (event) => {
      const card = event.target.closest(".project-card");
      if (!card) return;
      const media = $(".project-media", card);
      if (!media) return;
      const rect = media.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      media.style.transform = `perspective(1000px) rotateX(${(-y * 2.2).toFixed(2)}deg) rotateY(${(x * 2.2).toFixed(2)}deg) scale(0.995)`;
    });

    document.addEventListener("pointerout", (event) => {
      const card = event.target.closest(".project-card");
      if (!card || card.contains(event.relatedTarget)) return;
      const media = $(".project-media", card);
      if (media) media.style.transform = "";
    });
  }

  initPersonalDetails();
  renderStats();
  renderMarquee();
  renderProjects();
  renderServices();
  renderTechnologies();
  renderSocials();
  initMobileMenu();
  initScrollEffects();
  initCursorGlow();
  initProjectTilt();
  refreshRevealObserver();
})();
