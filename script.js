(() => {
	"use strict";

	const SELECTORS = {
		header: "header",
		headerInner: ".header-inner",
		navList: "nav ul",
		navLinks: "nav a[href^='#']",
		heroForm: ".hero-form",
		heroButton: ".hero-form button",
		contactForm: "#contacto form",
		revealTargets: ".card, .section-title, .section-subtitle, .hero-image, .contact-aside"
	};

	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const init = () => {
		setupNavbarScrollStyle();
		setupDynamicBackground();
		setupResumeSection();
		setupVisibleSectionDetection();
		setupResponsiveMenu();
		setupSmoothScroll();
		setupContactFormValidation();
		setupHeroCtaInteraction();
		setupScrollReveal();
	};

	const setupVisibleSectionDetection = () => {
		const sections = Array.from(document.querySelectorAll("main section[id]"));
		if (!sections.length) {
			return;
		}

		let currentSectionId = "";

		const updateCurrentSection = (sectionId) => {
			if (!sectionId || sectionId === currentSectionId) {
				return;
			}

			currentSectionId = sectionId;
			document.body.setAttribute("data-visible-section", sectionId);
			document.dispatchEvent(new CustomEvent("visible-section-change", {
				detail: { sectionId }
			}));
		};

		if (!("IntersectionObserver" in window)) {
			updateCurrentSection(sections[0].id);
			return;
		}

		const observer = new IntersectionObserver((entries) => {
			const visibleEntries = entries
				.filter((entry) => entry.isIntersecting)
				.sort((entryA, entryB) => entryB.intersectionRatio - entryA.intersectionRatio);

			if (!visibleEntries.length) {
				return;
			}

			const topVisibleSection = visibleEntries[0].target;
			if (topVisibleSection instanceof HTMLElement) {
				updateCurrentSection(topVisibleSection.id);
			}
		}, {
			threshold: [0.25, 0.5, 0.75],
			rootMargin: "-20% 0px -55% 0px"
		});

		sections.forEach((section) => observer.observe(section));
		updateCurrentSection(sections[0].id);
	};

	const setupNavbarScrollStyle = () => {
		const header = document.querySelector(SELECTORS.header);
		if (!(header instanceof HTMLElement)) {
			return;
		}

		const scrollThreshold = 22;

		const syncHeaderStyle = () => {
			header.classList.toggle("is-scrolled", window.scrollY > scrollThreshold);
			const normalized = Math.min(window.scrollY / 320, 1);
			header.style.setProperty("--nav-shadow-alpha", (0.06 + normalized * 0.12).toFixed(3));
		};

		window.addEventListener("scroll", syncHeaderStyle, { passive: true });
		syncHeaderStyle();
	};

	const setupDynamicBackground = () => {
		const scrollThreshold = 340;

		const syncBackground = () => {
			document.body.classList.toggle("is-dynamic-bg", window.scrollY > scrollThreshold);
		};

		window.addEventListener("scroll", syncBackground, { passive: true });
		syncBackground();
	};

	const setupResumeSection = () => {
		const main = document.querySelector("main");
		if (!(main instanceof HTMLElement) || main.querySelector("#hoja-de-vida")) {
			return;
		}

		const contactSection = document.querySelector("#contacto");
		const section = document.createElement("section");
		section.id = "hoja-de-vida";
		section.setAttribute("aria-labelledby", "hoja-de-vida-title");
		section.className = "resume-section";

		section.innerHTML = `
			<header>
				<h2 id="hoja-de-vida-title" class="section-title">Hoja de vida</h2>
				<p class="section-subtitle">Ejemplo de perfil orientado a operación de alojamientos urbanos por ciudad.</p>
			</header>
			<div class="resume-grid">
				<article class="card">
					<h3>Datos personales</h3>
					<p><strong>Nombre:</strong> <span data-cv="nombre">Camila Rojas (ejemplo)</span></p>
					<p><strong>Ciudad base:</strong> <span data-cv="ciudad">Medellín, Colombia</span></p>
					<p><strong>Correo:</strong> <span data-cv="correo">camila.alojamientos@example.com</span></p>
					<p><strong>Perfil:</strong> <span data-cv="perfil">Coordinadora de experiencias de hospedaje urbano con enfoque en reservas por zonas de ciudad.</span></p>
				</article>
				<article class="card">
					<h3>Formación</h3>
					<p><strong>Tecnología:</strong> <span data-cv="formacion">Gestión Turística y Hotelera</span></p>
					<p><strong>Diplomado:</strong> <span data-cv="diplomado">Revenue Management para alojamientos urbanos</span></p>
					<p><strong>Áreas:</strong> <span data-cv="areas">Optimización de ocupación, segmentación por barrios, experiencia del huésped y analítica de reservas.</span></p>
				</article>
				<article class="card">
					<h3>Repositorios</h3>
					<div class="resume-links">
						<a data-cv-link="repo1" href="https://example.com/repo-alojamientos" target="_blank" rel="noopener noreferrer">Repositorio ejemplo 1</a>
						<a data-cv-link="repo2" href="https://example.com/perfil-desarrollador" target="_blank" rel="noopener noreferrer">Repositorio ejemplo 2</a>
					</div>
				</article>
				<article class="card resume-editor">
					<h3>Tu hoja de vida (editable)</h3>
					<p class="resume-editor-note">Completa estos campos para personalizar la hoja de vida de arriba con tus datos.</p>
					<div class="resume-form">
						<input type="text" data-cv-input="nombre" placeholder="Nombre completo">
						<input type="text" data-cv-input="ciudad" placeholder="Ciudad base">
						<input type="email" data-cv-input="correo" placeholder="Correo electrónico">
						<input type="text" data-cv-input="perfil" placeholder="Resumen de perfil">
						<input type="text" data-cv-input="formacion" placeholder="Formación principal">
						<input type="text" data-cv-input="diplomado" placeholder="Curso o diplomado">
						<input type="text" data-cv-input="areas" placeholder="Áreas de interés">
						<input type="text" data-cv-input="repo1" placeholder="URL repositorio ejemplo 1 (https://example.com/...)">
						<input type="text" data-cv-input="repo2" placeholder="URL repositorio ejemplo 2 (https://example.com/...)">
						<button type="button" class="btn-primary" data-cv-action="aplicar">Aplicar mis datos</button>
					</div>
				</article>
			</div>
		`;

		if (contactSection instanceof HTMLElement) {
			main.insertBefore(section, contactSection);
			setupResumeEditor(section);
			return;
		}

		main.appendChild(section);
		setupResumeEditor(section);
	};

	const setupResumeEditor = (section) => {
		const applyButton = section.querySelector("[data-cv-action='aplicar']");
		if (!(applyButton instanceof HTMLButtonElement)) {
			return;
		}

		const inputByKey = (key) => section.querySelector(`[data-cv-input='${key}']`);
		const outputByKey = (key) => section.querySelector(`[data-cv='${key}']`);
		const linkByKey = (key) => section.querySelector(`[data-cv-link='${key}']`);

		const normalizeUrl = (value, fallback) => {
			const trimmed = value.trim();
			if (!trimmed) {
				return fallback;
			}
			if (/^https?:\/\//i.test(trimmed)) {
				return trimmed;
			}
			return `https://${trimmed}`;
		};

		const updateText = (key) => {
			const input = inputByKey(key);
			const output = outputByKey(key);
			if (!(input instanceof HTMLInputElement) || !(output instanceof HTMLElement)) {
				return;
			}
			if (input.value.trim()) {
				output.textContent = input.value.trim();
			}
		};

		applyButton.addEventListener("click", () => {
			["nombre", "ciudad", "correo", "perfil", "formacion", "diplomado", "areas"].forEach(updateText);

			const repo1Input = inputByKey("repo1");
			const repo2Input = inputByKey("repo2");
			const repo1Link = linkByKey("repo1");
			const repo2Link = linkByKey("repo2");

			if (repo1Input instanceof HTMLInputElement && repo1Link instanceof HTMLAnchorElement) {
				repo1Link.href = normalizeUrl(repo1Input.value, "https://example.com/repo-alojamientos");
				repo1Link.textContent = "Repositorio ejemplo 1";
			}

			if (repo2Input instanceof HTMLInputElement && repo2Link instanceof HTMLAnchorElement) {
				repo2Link.href = normalizeUrl(repo2Input.value, "https://example.com/perfil-desarrollador");
				repo2Link.textContent = "Repositorio ejemplo 2";
			}
		});
	};

	const setupResponsiveMenu = () => {
		const header = document.querySelector(SELECTORS.header);
		const headerInner = document.querySelector(SELECTORS.headerInner);
		const navList = document.querySelector(SELECTORS.navList);

		if (!header || !headerInner || !navList) {
			return;
		}

		let isMenuOpen = false;
		const mobileQuery = window.matchMedia("(max-width: 767px)");

		const toggleButton = document.createElement("button");
		toggleButton.type = "button";
		toggleButton.className = "js-menu-toggle";
		toggleButton.setAttribute("aria-label", "Abrir menú principal");
		toggleButton.setAttribute("aria-expanded", "false");
		toggleButton.innerHTML = "☰";

		headerInner.style.position = "relative";
		headerInner.insertBefore(toggleButton, headerInner.querySelector("nav"));

		const applyDesktopState = () => {
			navList.style.position = "static";
			navList.style.display = "flex";
			navList.style.flexDirection = "row";
			navList.style.width = "auto";
			navList.style.padding = "0";
			navList.style.borderRadius = "0";
			navList.style.border = "0";
			navList.style.background = "transparent";
			navList.style.boxShadow = "none";
			navList.style.gap = "1.25rem";
			navList.style.right = "auto";
			navList.style.top = "auto";
			navList.style.opacity = "1";
			navList.style.pointerEvents = "auto";
			navList.style.transform = "none";
			navList.style.transition = "none";

			toggleButton.style.display = "none";
			isMenuOpen = false;
			toggleButton.setAttribute("aria-expanded", "false");
			toggleButton.setAttribute("aria-label", "Abrir menú principal");
			toggleButton.innerHTML = "☰";
		};

		const applyMobileState = () => {
			toggleButton.style.display = "inline-flex";
			toggleButton.style.alignItems = "center";
			toggleButton.style.justifyContent = "center";
			toggleButton.style.width = "42px";
			toggleButton.style.height = "42px";
			toggleButton.style.border = "1px solid rgba(228, 230, 236, 0.9)";
			toggleButton.style.borderRadius = "10px";
			toggleButton.style.background = "#ffffff";
			toggleButton.style.cursor = "pointer";
			toggleButton.style.fontSize = "1.1rem";

			navList.style.position = "absolute";
			navList.style.top = "calc(100% + 0.65rem)";
			navList.style.right = "1.5rem";
			navList.style.display = "flex";
			navList.style.flexDirection = "column";
			navList.style.width = "min(90vw, 260px)";
			navList.style.padding = "1rem";
			navList.style.borderRadius = "14px";
			navList.style.border = "1px solid rgba(228, 230, 236, 0.9)";
			navList.style.background = "#ffffff";
			navList.style.boxShadow = "0 14px 34px rgba(16, 17, 20, 0.12)";
			navList.style.gap = "0.85rem";
			navList.style.transformOrigin = "top right";
			navList.style.transition = prefersReducedMotion
				? "none"
				: "opacity 0.22s ease, transform 0.22s ease";

			if (isMenuOpen) {
				navList.style.opacity = "1";
				navList.style.pointerEvents = "auto";
				navList.style.transform = "scale(1)";
			} else {
				navList.style.opacity = "0";
				navList.style.pointerEvents = "none";
				navList.style.transform = "scale(0.97)";
			}
		};

		const syncLayout = () => {
			if (mobileQuery.matches) {
				applyMobileState();
				return;
			}
			applyDesktopState();
		};

		const setMenuOpen = (open) => {
			isMenuOpen = open;
			toggleButton.setAttribute("aria-expanded", String(open));
			toggleButton.setAttribute("aria-label", open ? "Cerrar menú principal" : "Abrir menú principal");
			toggleButton.innerHTML = open ? "✕" : "☰";
			if (mobileQuery.matches) {
				applyMobileState();
			}
		};

		toggleButton.addEventListener("click", () => {
			setMenuOpen(!isMenuOpen);
		});

		document.addEventListener("click", (event) => {
			if (!mobileQuery.matches || !isMenuOpen) {
				return;
			}
			const target = event.target;
			if (target instanceof Node && !header.contains(target)) {
				setMenuOpen(false);
			}
		});

		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape" && isMenuOpen) {
				setMenuOpen(false);
			}
		});

		document.querySelectorAll(SELECTORS.navLinks).forEach((link) => {
			link.addEventListener("click", () => {
				if (mobileQuery.matches) {
					setMenuOpen(false);
				}
			});
		});

		mobileQuery.addEventListener("change", syncLayout);
		syncLayout();
	};

	const setupSmoothScroll = () => {
		const header = document.querySelector(SELECTORS.header);
		const links = document.querySelectorAll(SELECTORS.navLinks);

		if (!links.length) {
			return;
		}

		links.forEach((link) => {
			link.addEventListener("click", (event) => {
				const href = link.getAttribute("href");
				if (!href || href === "#") {
					return;
				}

				const section = document.querySelector(href);
				if (!section) {
					return;
				}

				event.preventDefault();

				if (prefersReducedMotion) {
					section.scrollIntoView({ block: "start" });
					return;
				}

				const headerOffset = header ? header.offsetHeight + 10 : 0;
				const sectionTop = section.getBoundingClientRect().top + window.scrollY - headerOffset;
				window.scrollTo({ top: sectionTop, behavior: "smooth" });
			});
		});
	};

	const setupContactFormValidation = () => {
		const form = document.querySelector(SELECTORS.contactForm);
		if (!(form instanceof HTMLFormElement)) {
			return;
		}

		const fields = {
			nombre: form.querySelector("#nombre"),
			email: form.querySelector("#email"),
			tipo: form.querySelector("#tipo"),
			mensaje: form.querySelector("#mensaje")
		};

		if (!fields.nombre || !fields.email || !fields.tipo || !fields.mensaje) {
			return;
		}

		const statusBox = getOrCreateMessageBox(form, "js-form-status", true);

		const validators = {
			nombre: (value) => {
				if (!value.trim()) {
					return "El nombre es obligatorio.";
				}
				if (value.trim().length < 3) {
					return "Escribe al menos 3 caracteres en el nombre.";
				}
				return "";
			},
			email: (value) => {
				if (!value.trim()) {
					return "El correo electrónico es obligatorio.";
				}
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
				if (!emailRegex.test(value.trim())) {
					return "Ingresa un correo electrónico válido.";
				}
				return "";
			},
			tipo: (value) => {
				if (value.trim().length > 80) {
					return "Mantén este campo por debajo de 80 caracteres.";
				}
				return "";
			},
			mensaje: (value) => {
				if (!value.trim()) {
					return "El mensaje es obligatorio.";
				}
				if (value.trim().length < 10) {
					return "El mensaje debe tener mínimo 10 caracteres.";
				}
				return "";
			}
		};

		const validateField = (fieldName, showSuccess) => {
			const field = fields[fieldName];
			if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
				return true;
			}
			const errorMessage = validators[fieldName](field.value);
			const feedback = getOrCreateFieldFeedback(field);
			const isValid = !errorMessage;

			field.setAttribute("aria-invalid", String(!isValid));
			field.style.borderColor = isValid ? "var(--border)" : "#e63b48";

			if (isValid) {
				feedback.textContent = showSuccess ? "Campo correcto." : "";
				feedback.style.color = showSuccess ? "#1a7f37" : "transparent";
			} else {
				feedback.textContent = errorMessage;
				feedback.style.color = "#b42318";
			}

			return isValid;
		};

		Object.keys(fields).forEach((fieldName) => {
			const field = fields[fieldName];
			if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
				return;
			}
			field.addEventListener("blur", () => validateField(fieldName, true));
			field.addEventListener("input", () => validateField(fieldName, false));
		});

		form.addEventListener("submit", (event) => {
			event.preventDefault();

			const results = Object.keys(fields).map((fieldName) => validateField(fieldName, false));
			const isFormValid = results.every(Boolean);

			if (!isFormValid) {
				statusBox.textContent = "Revisa los campos marcados antes de enviar el formulario.";
				statusBox.style.color = "#b42318";
				statusBox.style.opacity = "1";
				const firstInvalidField = Object.keys(fields).find((fieldName) => !validateField(fieldName, false));
				if (firstInvalidField) {
					const focusTarget = fields[firstInvalidField];
					if (focusTarget instanceof HTMLElement) {
						focusTarget.focus();
					}
				}
				return;
			}

			statusBox.textContent = "¡Mensaje enviado con éxito! Te contactaremos pronto.";
			statusBox.style.color = "#1a7f37";
			statusBox.style.opacity = "1";
			form.reset();

			Object.keys(fields).forEach((fieldName) => {
				const field = fields[fieldName];
				if ((field instanceof HTMLInputElement) || (field instanceof HTMLTextAreaElement)) {
					field.setAttribute("aria-invalid", "false");
					field.style.borderColor = "var(--border)";
					const feedback = getOrCreateFieldFeedback(field);
					feedback.textContent = "";
					feedback.style.color = "transparent";
				}
			});
		});
	};

	const setupHeroCtaInteraction = () => {
		const heroForm = document.querySelector(SELECTORS.heroForm);
		const ctaButton = document.querySelector(SELECTORS.heroButton);
		if (!(heroForm instanceof HTMLElement) || !(ctaButton instanceof HTMLButtonElement)) {
			return;
		}

		const destino = heroForm.querySelector("#destino");
		const fechas = heroForm.querySelector("#fechas");
		const huespedes = heroForm.querySelector("#huespedes");
		const ctaStatus = getOrCreateMessageBox(heroForm, "js-cta-status");

		ctaButton.addEventListener("click", () => {
			const destinoValue = destino instanceof HTMLInputElement ? destino.value.trim() : "";
			const fechasValue = fechas instanceof HTMLInputElement ? fechas.value.trim() : "";
			const huespedesValue = huespedes instanceof HTMLInputElement ? Number(huespedes.value) : 0;

			if (!destinoValue || !fechasValue || huespedesValue < 1) {
				ctaStatus.textContent = "Completa destino, fechas y huéspedes para continuar.";
				ctaStatus.style.color = "#b42318";
				animateElement(heroForm, [
					{ transform: "translateX(0)" },
					{ transform: "translateX(-6px)" },
					{ transform: "translateX(6px)" },
					{ transform: "translateX(0)" }
				], 260);
				return;
			}

			ctaStatus.textContent = `Buscando en ${destinoValue} para ${huespedesValue} huésped(es)...`;
			ctaStatus.style.color = "#1a7f37";

			animateElement(ctaButton, [
				{ transform: "scale(1)", boxShadow: "0 16px 30px rgba(255, 79, 90, 0.3)" },
				{ transform: "scale(1.07)", boxShadow: "0 20px 36px rgba(255, 79, 90, 0.36)" },
				{ transform: "scale(1)", boxShadow: "0 16px 30px rgba(255, 79, 90, 0.3)" }
			], 420);

			const targetSection = document.querySelector("#caracteristicas");
			if (targetSection instanceof HTMLElement) {
				const header = document.querySelector(SELECTORS.header);
				const offset = header instanceof HTMLElement ? header.offsetHeight + 12 : 0;
				const top = targetSection.getBoundingClientRect().top + window.scrollY - offset;
				window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
			}
		});
	};

	const setupScrollReveal = () => {
		const elements = Array.from(document.querySelectorAll(SELECTORS.revealTargets));
		if (!elements.length) {
			return;
		}

		if (prefersReducedMotion || !("IntersectionObserver" in window)) {
			elements.forEach((element) => {
				element.style.opacity = "1";
				element.style.transform = "none";
			});
			return;
		}

		elements.forEach((element) => {
			element.style.opacity = "0";
			element.style.transform = "translateY(20px)";
			element.style.transition = "opacity 0.6s ease, transform 0.6s ease";
		});

		const observer = new IntersectionObserver((entries, currentObserver) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) {
					return;
				}

				entry.target.style.opacity = "1";
				entry.target.style.transform = "translateY(0)";
				currentObserver.unobserve(entry.target);
			});
		}, {
			threshold: 0.18,
			rootMargin: "0px 0px -8% 0px"
		});

		elements.forEach((element) => observer.observe(element));
	};

	const getOrCreateFieldFeedback = (field) => {
		const currentSibling = field.nextElementSibling;
		if (currentSibling instanceof HTMLElement && currentSibling.classList.contains("js-field-feedback")) {
			return currentSibling;
		}

		const feedback = document.createElement("p");
		feedback.className = "js-field-feedback";
		feedback.style.minHeight = "1.15rem";
		feedback.style.fontSize = "0.78rem";
		feedback.style.marginTop = "0.35rem";
		feedback.style.color = "transparent";
		field.insertAdjacentElement("afterend", feedback);
		return feedback;
	};

	const getOrCreateMessageBox = (container, className, fullWidth) => {
		const existing = container.querySelector(`.${className}`);
		if (existing instanceof HTMLElement) {
			return existing;
		}

		const box = document.createElement("p");
		box.className = className;
		box.style.marginTop = "0.5rem";
		box.style.fontSize = "0.85rem";
		box.style.fontWeight = "600";
		box.style.opacity = "1";

		if (fullWidth) {
			box.style.gridColumn = "1 / -1";
		}

		container.appendChild(box);
		return box;
	};

	const animateElement = (element, keyframes, duration) => {
		if (prefersReducedMotion || typeof element.animate !== "function") {
			return;
		}
		element.animate(keyframes, {
			duration,
			easing: "ease"
		});
	};

	document.addEventListener("DOMContentLoaded", init);
})();
