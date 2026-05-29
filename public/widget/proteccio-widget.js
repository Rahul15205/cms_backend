(function () { // PHASE 6 CHANGE
  // 1. Read config from current script tag
  const currentScript = document.currentScript;
  const tenantId = currentScript.getAttribute("data-tenant-id");
  const apiKey = currentScript.getAttribute("data-api-key");
  const lang = currentScript.getAttribute("data-lang") || "en";
  const theme = currentScript.getAttribute("data-theme") || "light";
  const buttonLabel = currentScript.getAttribute("data-button-label") || "Submit Privacy Request";

  // Derive API host dynamically from script source location
  const scriptSrc = currentScript.src;
  const apiHost = new URL(scriptSrc).origin;

  // Inject Scoped Stylesheet
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    .proteccio-widget-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.625rem 1.25rem;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.25rem;
      border-radius: 0.375rem;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }
    .proteccio-widget-btn-light {
      background-color: #0f172a;
      color: #ffffff;
    }
    .proteccio-widget-btn-light:hover {
      background-color: #1e293b;
    }
    .proteccio-widget-btn-dark {
      background-color: #38bdf8;
      color: #0f172a;
    }
    .proteccio-widget-btn-dark:hover {
      background-color: #7dd3fc;
    }

    .proteccio-widget-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      box-sizing: border-box;
      padding: 1rem;
    }

    .proteccio-widget-modal {
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 0.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      border: 1px solid;
      box-sizing: border-box;
    }

    .proteccio-widget-theme-light {
      background-color: #ffffff;
      color: #0f172a;
      border-color: #e2e8f0;
    }

    .proteccio-widget-theme-dark {
      background-color: #1e293b;
      color: #f8fafc;
      border-color: #334155;
    }

    .proteccio-widget-modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }
    .proteccio-widget-modal-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
    }
    .proteccio-widget-close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .proteccio-widget-theme-light .proteccio-widget-close-btn { color: #64748b; }
    .proteccio-widget-theme-dark .proteccio-widget-close-btn { color: #94a3b8; }

    .proteccio-widget-form {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-sizing: border-box;
    }

    .proteccio-widget-form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .proteccio-widget-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .proteccio-widget-theme-light .proteccio-widget-label { color: #475569; }
    .proteccio-widget-theme-dark .proteccio-widget-label { color: #94a3b8; }

    .proteccio-widget-input {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      border: 1px solid;
      border-radius: 0.375rem;
      outline: none;
      transition: border-color 0.15s ease-in-out;
      background-color: transparent;
      color: inherit;
    }
    .proteccio-widget-theme-light .proteccio-widget-input { border-color: #cbd5e1; color: #0f172a; }
    .proteccio-widget-theme-dark .proteccio-widget-input { border-color: #475569; color: #f8fafc; }
    .proteccio-widget-input:focus {
      border-color: #3b82f6;
    }
    .proteccio-widget-theme-dark .proteccio-widget-input option {
      background-color: #1e293b;
      color: #f8fafc;
    }

    .proteccio-widget-submit-btn {
      margin-top: 0.5rem;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 0.375rem;
      border: 1px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background-color 0.15s ease-in-out;
    }
    .proteccio-widget-theme-light .proteccio-widget-submit-btn { background-color: #2563eb; color: #ffffff; }
    .proteccio-widget-theme-light .proteccio-widget-submit-btn:hover { background-color: #1d4ed8; }
    .proteccio-widget-theme-dark .proteccio-widget-submit-btn { background-color: #38bdf8; color: #0f172a; }
    .proteccio-widget-theme-dark .proteccio-widget-submit-btn:hover { background-color: #0ea5e9; }
    
    .proteccio-widget-submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .proteccio-widget-error-banner {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444;
      padding: 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .proteccio-widget-success-container {
      padding: 2rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .proteccio-widget-success-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #10b981;
      margin: 0;
    }
    .proteccio-widget-success-desc {
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.5;
    }
    .proteccio-widget-case-pill {
      font-family: monospace;
      padding: 0.5rem 1.25rem;
      background-color: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border-radius: 9999px;
      font-weight: bold;
      font-size: 1rem;
    }
  `;
  document.head.appendChild(styleEl);

  // 2. Inject Widget Button
  const button = document.createElement("button");
  button.className = `proteccio-widget-btn proteccio-widget-btn-${theme === "dark" ? "dark" : "light"}`;
  button.innerText = buttonLabel;
  currentScript.parentNode.insertBefore(button, currentScript);

  button.addEventListener("click", () => {
    openModal();
  });

  function openModal() {
    // 3. Create Modal Elements
    const overlay = document.createElement("div");
    overlay.className = "proteccio-widget-overlay";

    const modal = document.createElement("div");
    modal.className = `proteccio-widget-modal proteccio-widget-theme-${theme}`;

    // Header
    const header = document.createElement("div");
    header.className = "proteccio-widget-modal-header";
    const title = document.createElement("h3");
    title.className = "proteccio-widget-modal-title";
    title.innerText = "Submit Privacy Request";
    const closeBtn = document.createElement("button");
    closeBtn.className = "proteccio-widget-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Form
    const form = document.createElement("form");
    form.className = "proteccio-widget-form";
    form.onsubmit = async (e) => {
      e.preventDefault();
      submitForm(form, submitBtn, errorBanner, modal);
    };

    // Form fields helper
    function createField(label, id, type = "text", required = true, placeholder = "", options = null) {
      const group = document.createElement("div");
      group.className = "proteccio-widget-form-group";
      const lbl = document.createElement("label");
      lbl.className = "proteccio-widget-label";
      lbl.innerText = label + (required ? " *" : "");
      group.appendChild(lbl);

      if (options) {
        const select = document.createElement("select");
        select.className = "proteccio-widget-input";
        select.name = id;
        select.required = required;
        options.forEach((opt) => {
          const o = document.createElement("option");
          o.value = opt.value;
          o.innerText = opt.label;
          select.appendChild(o);
        });
        group.appendChild(select);
      } else if (type === "textarea") {
        const ta = document.createElement("textarea");
        ta.className = "proteccio-widget-input";
        ta.name = id;
        ta.required = required;
        ta.placeholder = placeholder;
        ta.maxLength = 3000;
        ta.rows = 4;
        group.appendChild(ta);
      } else {
        const input = document.createElement("input");
        input.className = "proteccio-widget-input";
        input.type = type;
        input.name = id;
        input.required = required;
        input.placeholder = placeholder;
        group.appendChild(input);
      }
      return group;
    }

    form.appendChild(createField("Full Name", "requesterName", "text", true, "Jane Doe"));
    form.appendChild(createField("Email Address", "requesterEmail", "email", true, "jane@example.com"));
    form.appendChild(createField("Phone Number", "requesterPhone", "text", false, "+1 555-0199"));

    form.appendChild(createField("Request Type", "type", "select", true, "", [
      { value: "ACCESS", label: "Right to Access" },
      { value: "ERASURE", label: "Right to Erasure (Delete)" },
      { value: "CORRECTION", label: "Right to Correction" },
      { value: "WITHDRAW_CONSENT", label: "Withdraw Consent" },
      { value: "FILE_COMPLAINT", label: "File a Complaint" },
      { value: "GRIEVANCE_REDRESSAL", label: "Grievance Redressal" },
      { value: "NOMINATE", label: "Nominate Representative" },
    ]));

    form.appendChild(createField("Regulation Context", "regulation", "select", true, "", [
      { value: "GDPR", label: "GDPR (Europe)" },
      { value: "DPDP", label: "DPDP Act (India)" },
      { value: "CCPA", label: "CCPA (California)" },
      { value: "LGPD", label: "LGPD (Brazil)" },
      { value: "CUSTOM", label: "Other / Generic" },
    ]));

    form.appendChild(createField("Description & Context", "description", "textarea", true, "Specify what personal data you would like to request or access..."));

    // Error Banner
    const errorBanner = document.createElement("div");
    errorBanner.className = "proteccio-widget-error-banner";
    errorBanner.style.display = "none";
    form.appendChild(errorBanner);

    // Submit Button
    const submitBtn = document.createElement("button");
    submitBtn.className = "proteccio-widget-submit-btn";
    submitBtn.type = "submit";
    submitBtn.innerText = "Submit Request";
    form.appendChild(submitBtn);

    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  async function submitForm(formEl, submitBtn, errorBanner, modal) {
    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";
    errorBanner.style.display = "none";

    const formData = new FormData(formEl);
    const payload = {
      requesterName: formData.get("requesterName"),
      requesterEmail: formData.get("requesterEmail"),
      requesterPhone: formData.get("requesterPhone") || undefined,
      type: formData.get("type"),
      regulation: formData.get("regulation"),
      description: formData.get("description"),
      submissionChannel: "WEB",
    };

    try {
      const response = await fetch(`${apiHost}/api/v1/public/rights/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "X-Tenant-ID": tenantId,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Failed to submit request.");
      }

      // Show Success view
      showSuccess(modal, resData);
    } catch (err) {
      errorBanner.innerText = err.message || "An unexpected network error occurred.";
      errorBanner.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.innerText = "Submit Request";
    }
  }

  function showSuccess(modal, data) {
    // Clear form content
    const header = modal.querySelector(".proteccio-widget-modal-header");
    modal.innerHTML = "";
    modal.appendChild(header);

    const success = document.createElement("div");
    success.className = "proteccio-widget-success-container";

    const title = document.createElement("h4");
    title.className = "proteccio-widget-success-title";
    title.innerText = "Request Received Successfully";

    const desc = document.createElement("p");
    desc.className = "proteccio-widget-success-desc";
    desc.innerText = "Your privacy request has been logged and queued for operational processing. Please keep your case number for reference:";

    const casePill = document.createElement("div");
    casePill.className = "proteccio-widget-case-pill";
    casePill.innerText = data.caseNumber || "RR-2026-000000";

    const closeBtn = document.createElement("button");
    closeBtn.className = "proteccio-widget-btn proteccio-widget-btn-light";
    closeBtn.innerText = "Close";
    closeBtn.onclick = () => {
      const overlay = modal.closest(".proteccio-widget-overlay");
      if (overlay) overlay.remove();
    };

    success.appendChild(title);
    success.appendChild(desc);
    success.appendChild(casePill);
    success.appendChild(closeBtn);
    modal.appendChild(success);
  }
})();
