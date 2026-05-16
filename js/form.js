/**
 * form.js
 * CTA form handling: validation, Brazilian phone mask, submission,
 * mailto redirect with structured content, success state, and Tintim tracking.
 */

(function () {
  "use strict";

  const Tintim = window.Tintim || { track: () => {} };

  const form = document.getElementById("ctaForm");
  if (!form) return;

  // Email destination — change here if needed
  const DESTINATION_EMAIL = "sac@grupomax.net";

  const nameField = form.querySelector('[name="name"]');
  const phoneField = form.querySelector('[name="phone"]');
  const emailField = form.querySelector('[name="email"]');
  const typeField = form.querySelector('[name="type"]');
  const serviceField = form.querySelector('[name="service"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  // ============================================================
  // BRAZILIAN PHONE MASK — (XX) XXXXX-XXXX
  // ============================================================
  function maskPhone(value) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    const len = digits.length;

    if (len === 0) return "";
    if (len < 3) return `(${digits}`;
    if (len < 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (len < 11)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (phoneField) {
    phoneField.addEventListener("input", (e) => {
      const cursorPos = e.target.selectionStart;
      const oldLength = e.target.value.length;
      e.target.value = maskPhone(e.target.value);
      const newLength = e.target.value.length;
      try {
        e.target.setSelectionRange(
          cursorPos + (newLength - oldLength),
          cursorPos + (newLength - oldLength),
        );
      } catch (_) {}
    });

    phoneField.addEventListener("focus", () => {
      Tintim.track("form_field_focus", { field: "whatsapp" });
    });
  }

  // ============================================================
  // FIELD-LEVEL FOCUS TRACKING
  // ============================================================
  [nameField, emailField, typeField, serviceField].forEach((field) => {
    if (!field) return;
    field.addEventListener("focus", () => {
      Tintim.track("form_field_focus", { field: field.name });
    });
  });

  // ============================================================
  // VALIDATION
  // ============================================================
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  }

  function isValidPhone(value) {
    const digits = value.replace(/\D/g, "");
    return digits.length === 10 || digits.length === 11;
  }

  function setError(field, message) {
    if (!field) return;
    const wrapper = field.closest(".cta-form__field");
    if (!wrapper) return;
    wrapper.classList.add("has-error");
    let errorEl = wrapper.querySelector(".form-error");
    if (!errorEl) {
      errorEl = document.createElement("span");
      errorEl.className = "form-error";
      wrapper.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }

  function clearError(field) {
    if (!field) return;
    const wrapper = field.closest(".cta-form__field");
    if (!wrapper) return;
    wrapper.classList.remove("has-error");
    const errorEl = wrapper.querySelector(".form-error");
    if (errorEl) errorEl.textContent = "";
  }

  [nameField, phoneField, emailField, typeField, serviceField].forEach(
    (field) => {
      if (!field) return;
      field.addEventListener("input", () => clearError(field));
      field.addEventListener("change", () => clearError(field));
    },
  );

  function validateForm() {
    let valid = true;

    if (nameField) {
      const v = nameField.value.trim();
      if (v.length < 2) {
        setError(nameField, "Informe seu nome completo");
        valid = false;
      } else {
        clearError(nameField);
      }
    }

    if (phoneField) {
      if (!isValidPhone(phoneField.value)) {
        setError(phoneField, "Informe um WhatsApp válido");
        valid = false;
      } else {
        clearError(phoneField);
      }
    }

    if (emailField) {
      if (!isValidEmail(emailField.value)) {
        setError(emailField, "Informe um e-mail válido");
        valid = false;
      } else {
        clearError(emailField);
      }
    }

    if (typeField) {
      if (!typeField.value) {
        setError(typeField, "Selecione o tipo de imóvel");
        valid = false;
      } else {
        clearError(typeField);
      }
    }

    if (serviceField) {
      if (!serviceField.value) {
        setError(serviceField, "Selecione o serviço desejado");
        valid = false;
      } else {
        clearError(serviceField);
      }
    }

    return valid;
  }

  // ============================================================
  // BUILD STRUCTURED EMAIL BODY
  // ============================================================
  function buildEmailContent() {
    const name = nameField ? nameField.value.trim() : "";
    const phone = phoneField ? phoneField.value.trim() : "";
    const email = emailField ? emailField.value.trim() : "";
    const propertyType = typeField ? typeField.value : "";
    const service = serviceField ? serviceField.value : "";

    const subject = `Solicitação de diagnóstico gratuito — ${service || "Max Monitoramento"}`;

    const body = `Olá, equipe Max Monitoramento!

Gostaria de solicitar um diagnóstico gratuito para minha necessidade de segurança.

═══════════════════════════════════════
DADOS DE CONTATO
═══════════════════════════════════════

- Nome completo: ${name}
- WhatsApp: ${phone}
- E-mail: ${email}

═══════════════════════════════════════
DETALHES DA SOLICITAÇÃO
═══════════════════════════════════════

- Tipo de imóvel: ${propertyType}
- Serviço desejado: ${service}

═══════════════════════════════════════

Aguardo o contato de um especialista para apresentação da proposta e orientações sobre o próximo passo.

Atenciosamente,
${name}

──────────────────────────────────────
Mensagem enviada pelo site Max Monitoramento
maxmonitoramento.com.br
──────────────────────────────────────`;

    return { subject, body };
  }

  // ============================================================
  // SUCCESS STATE
  // ============================================================
  function showSuccessState() {
    const successHTML = `
      <div class="form-success">
        <div class="form-success__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 class="form-success__title">Solicitação preparada!</h3>
        <p class="form-success__text">Abrimos seu cliente de e-mail com a mensagem pronta. Basta clicar em <strong>Enviar</strong> para que nossa equipe receba sua solicitação e entre em contato em breve.</p>
      </div>
    `;
    form.innerHTML = successHTML;
    form.classList.add("is-success");
  }

  // ============================================================
  // SUBMISSION — opens mailto with structured content
  // ============================================================
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Tintim.track("form_validation_error", {
        hasName: !!(nameField && nameField.value.trim()),
        hasPhone: !!(phoneField && isValidPhone(phoneField.value)),
        hasEmail: !!(emailField && isValidEmail(emailField.value)),
        hasType: !!(typeField && typeField.value),
        hasService: !!(serviceField && serviceField.value),
      });
      return;
    }

    // Disable button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      const original = submitBtn.textContent;
      submitBtn.dataset.original = original;
    }

    // Track submission — no raw PII
    Tintim.track("form_submit", {
      type: typeField ? typeField.value : null,
      service: serviceField ? serviceField.value : null,
      hasName: !!(nameField && nameField.value.trim()),
      hasEmail: !!(emailField && emailField.value.trim()),
      hasPhone: !!(phoneField && phoneField.value.trim()),
      location: "cta_final",
    });

    // Build mailto link
    const { subject, body } = buildEmailContent();
    const mailtoLink = `mailto:${DESTINATION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open the user's email client
    setTimeout(() => {
      window.location.href = mailtoLink;

      // Show success state shortly after
      setTimeout(() => {
        showSuccessState();
        Tintim.track("form_success", {
          type: typeField ? typeField.value : null,
          service: serviceField ? serviceField.value : null,
        });
      }, 500);
    }, 300);
  });
})();
