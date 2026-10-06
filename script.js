// ============================================================
// OBLIVION — interacciones de la landing
// ============================================================

// Marca que hay JS activo: habilita los estados ocultos de .reveal
document.documentElement.classList.add("js");

// Modo captura (?at=seccion): salto instantáneo con todo visible, para QA y screenshots
const captureParams = new URLSearchParams(location.search);
if (captureParams.has("at")) {
  document.documentElement.style.scrollBehavior = "auto";
  window.addEventListener("load", () => {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    const target = document.getElementById(captureParams.get("at"));
    if (target) {
      // Desplaza con transform (no scroll): el frame se pinta completo en headless
      document.body.style.transform = "translateY(-" + target.offsetTop + "px)";
    }
  });
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Nav: fondo + aparición al hacer scroll (oculto sobre el hero) ---
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 40);
  nav.classList.toggle("nav--visible", window.scrollY > 40);
}, { passive: true });

// --- Hero: parallax scroll (GSAP + ScrollTrigger) ---
const parallaxLayers = document.querySelector("[data-parallax-layers]");
if (parallaxLayers && window.gsap && window.ScrollTrigger && !reduceMotion && !captureParams.has("at")) {
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: parallaxLayers,
      start: "0% 0%",
      end: "100% 0%",
      scrub: 0,
    },
  });

  // yPercent es relativo a la altura PROPIA de cada capa (100% del hero).
  // Contraintuitivo pero así funciona el efecto: yPercent ALTO = la capa se
  // desplaza HACIA ABAJO contrarrestando el scroll normal (que la empuja
  // hacia arriba) → se queda "pegada" en pantalla, casi fija. yPercent BAJO
  // = casi no contrarresta el scroll → se va de pantalla casi a velocidad
  // normal, se percibe como la capa que "más se mueve". Por eso el logo
  // (ancla) lleva el valor más alto y el fondo el más bajo.
  [
    { layer: "1", yPercent: 12 }, // fondo — el que más se mueve
    { layer: "2", yPercent: 35 }, // grano + resplandor
    { layer: "3", yPercent: 65 }, // tagline
    { layer: "4", yPercent: 90 }, // logo — ancla, casi fijo en pantalla
  ].forEach((l, idx) => {
    tl.to(
      parallaxLayers.querySelectorAll(`[data-parallax-layer="${l.layer}"]`),
      { yPercent: l.yPercent, ease: "none" },
      idx === 0 ? undefined : "<"
    );
  });
}

// --- Revelado de elementos al entrar en viewport ---
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// --- FAQ acordeón ---
document.querySelectorAll(".faq__item").forEach((item) => {
  const btn = item.querySelector(".faq__q");
  const answer = item.querySelector(".faq__a");

  btn.addEventListener("click", () => {
    const isOpen = item.classList.contains("is-open");

    // Cierra los demás
    document.querySelectorAll(".faq__item.is-open").forEach((open) => {
      if (open !== item) {
        open.classList.remove("is-open");
        open.querySelector(".faq__q").setAttribute("aria-expanded", "false");
        open.querySelector(".faq__a").style.maxHeight = "0";
      }
    });

    item.classList.toggle("is-open", !isOpen);
    btn.setAttribute("aria-expanded", String(!isOpen));
    answer.style.maxHeight = isOpen ? "0" : answer.scrollHeight + "px";
  });
});

// --- Caja de ideas: máquina de escribir sobre el placeholder ---
const ideaInput = document.getElementById("idea-input");
if (ideaInput) {
  const ideas = [
    "Quiero automatizar el proceso de pedidos de mi negocio…",
    "Necesito una herramienta que no existe todavía…",
    "Quiero que mi marca se vea a la altura de lo que ya construí…",
    "Necesito conectar varios sistemas que no se hablan entre sí…",
  ];

  if (reduceMotion || captureParams.has("at")) {
    ideaInput.placeholder = ideas[0];
  } else {
    let ideaIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function typeStep() {
      const current = ideas[ideaIndex];

      if (!deleting) {
        charIndex++;
        ideaInput.placeholder = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(typeStep, 1800);
          return;
        }
      } else {
        charIndex--;
        ideaInput.placeholder = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          ideaIndex = (ideaIndex + 1) % ideas.length;
        }
      }
      setTimeout(typeStep, deleting ? 25 : 45);
    }
    typeStep();

    // Pausa la animación mientras el campo tiene foco o contenido real
    ideaInput.addEventListener("focus", () => { ideaInput.placeholder = ""; });
  }
}

// --- Composer de ideas: envía la idea escrita por mailto (sin backend todavía) ---
const ideaForm = document.getElementById("idea-form");
if (ideaForm && ideaInput) {
  ideaForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const idea = ideaInput.value.trim();
    if (!idea) {
      ideaInput.focus();
      return;
    }
    const subject = "Nuevo proyecto — Oblivion";
    const body = ["Qué tiene en mente:", idea].join("\n");
    window.location.href = `mailto:hola@byoblivion.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

// --- Casos de uso: máquina de escribir cíclica entre las 3 citas reales ---
const quoteTyped = document.getElementById("quote-typed");
const quoteService = document.getElementById("quote-service");
const quoteSource = document.getElementById("quote-source");
if (quoteTyped && quoteService && quoteSource) {
  const quoteItems = Array.from(quoteSource.querySelectorAll("li")).map((li) => ({
    service: li.dataset.service,
    text: li.textContent.trim().replace(/\s+/g, " "),
  }));

  if (!reduceMotion && !captureParams.has("at") && quoteItems.length > 1) {
    let quoteIndex = 0;
    let quoteChar = quoteItems[0].text.length;
    let quoteDeleting = false;

    function quoteStep() {
      const current = quoteItems[quoteIndex];

      if (!quoteDeleting) {
        quoteChar++;
        quoteTyped.textContent = current.text.slice(0, quoteChar);
        if (quoteChar >= current.text.length) {
          quoteDeleting = true;
          setTimeout(quoteStep, 3200);
          return;
        }
      } else {
        quoteChar--;
        quoteTyped.textContent = current.text.slice(0, quoteChar);
        if (quoteChar === 0) {
          quoteDeleting = false;
          quoteIndex = (quoteIndex + 1) % quoteItems.length;
          quoteService.textContent = quoteItems[quoteIndex].service;
        }
      }
      setTimeout(quoteStep, quoteDeleting ? 12 : 18);
    }
    setTimeout(quoteStep, 3200);
  }
}

// --- Cómo funciona: ciclo del nodo activo + mensaje sincronizado ---
const pipelineNodes = document.querySelectorAll(".pipeline-node");
const pipelineMessage = document.getElementById("pipeline-message");
if (pipelineNodes.length && pipelineMessage) {
  const pipelineSteps = [
    "Entendemos el espacio gris: tu operación, tus sistemas, tu marca, y dónde exactamente se está perdiendo certeza.",
    "Definimos si tu caso pide Sync, Architect, Ascend — o una combinación — y construimos un plan con entregables claros desde el día uno.",
    "Entregamos, medimos el impacto real, y dejamos tu equipo listo para operarlo — con nosotros disponibles cuando lo necesites.",
  ];

  function setActivePipelineStep(index) {
    pipelineNodes.forEach((node) => {
      node.classList.toggle("is-active", Number(node.dataset.step) === index + 1);
    });
    pipelineMessage.textContent = pipelineSteps[index];
  }
  setActivePipelineStep(0);

  if (!reduceMotion && !captureParams.has("at")) {
    let pipelineIndex = 0;
    setInterval(() => {
      pipelineIndex = (pipelineIndex + 1) % pipelineSteps.length;
      setActivePipelineStep(pipelineIndex);
    }, 3400);
  }
}

// --- Formulario de contacto: arma un mailto con los datos (sin backend todavía) ---
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = contactForm.elements["name"].value.trim();
    const phone = contactForm.elements["phone"].value.trim();
    const email = contactForm.elements["email"].value.trim();
    const idea = contactForm.elements["idea"].value.trim();

    const subject = `Nuevo proyecto — ${name || "Oblivion"}`;
    const body = [
      `Nombre: ${name}`,
      `Teléfono: ${phone || "—"}`,
      `Correo: ${email}`,
      "",
      "Qué tiene en mente:",
      idea || "—",
    ].join("\n");

    window.location.href = `mailto:hola@byoblivion.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

// --- Reloj en vivo (Ciudad de México) ---
const clockEl = document.getElementById("clock");
const clockDateEl = document.getElementById("clock-date");

function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString("es-MX", {
    timeZone: "America/Mexico_City",
    hour12: false,
  });
  clockDateEl.textContent = now.toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " (GMT-6)";
}
updateClock();
setInterval(updateClock, 1000);
