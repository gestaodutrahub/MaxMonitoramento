/**
 * form.js
 * CTA form handling: validation, Brazilian phone mask, submission,
 * success state, and Tintim event tracking (no PII).
 */

(function () {
  "use strict";

  const Tintim = window.Tintim || { track: () => {} };

  const form = document.getElementById("ctaForm");
  if (!form) return;

  const nameField = form.querySelector('[name="name"]');
  const phoneField = form.querySelector('[name="phone"]');
  const emailField = form.querySelector('[name="email"]');
  const typeField = form.querySelector('[name="type"]');
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
      // Adjust cursor position when adding mask characters
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
  [nameField, emailField, typeField].forEach((field) => {
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

  [nameField, phoneField, emailField, typeField].forEach((field) => {
    if (!field) return;
    field.addEventListener("input", () => clearError(field));
    field.addEventListener("change", () => clearError(field));
  });

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

    return valid;
  }

  // ============================================================
  // SUBMISSION
  // ============================================================
  function showSuccessState() {
    const successHTML = `
      <div class="form-success">
        <div class="form-success__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 class="form-success__title">Solicitação enviada!</h3>
        <p class="form-success__text">Em breve nossa equipe entrará em contato pelo WhatsApp para apresentar a solução ideal para o seu condomínio.</p>
      </div>
    `;
    form.innerHTML = successHTML;
    form.classList.add("is-success");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Tintim.track("form_validation_error", {
        hasName: !!(nameField && nameField.value.trim()),
        hasPhone: !!(phoneField && isValidPhone(phoneField.value)),
        hasEmail: !!(emailField && isValidEmail(emailField.value)),
        hasType: !!(typeField && typeField.value),
      });
      return;
    }

    // Disable button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      const original = submitBtn.textContent;
      submitBtn.dataset.original = original;
      submitBtn.textContent = "Enviando...";
    }

    // Track submission — NO raw PII
    Tintim.track("form_submit", {
      type: typeField ? typeField.value : null,
      hasName: !!(nameField && nameField.value.trim()),
      hasEmail: !!(emailField && emailField.value.trim()),
      hasPhone: !!(phoneField && phoneField.value.trim()),
      location: "cta_final",
    });

    // Simulate async submission. Replace with real endpoint as needed.
    setTimeout(() => {
      showSuccessState();
      Tintim.track("form_success", {
        type: typeField ? typeField.value : null,
      });
    }, 900);
  });
})();
