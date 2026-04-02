document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // MOBILE SIDEBAR
  document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // MOBILE SIDEBAR
    // =========================
    const toggle = document.getElementById("mobileMenuToggle");
    const sidebar = document.getElementById("mobileSidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (toggle && sidebar && overlay) {
        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
            overlay.classList.toggle("show");
            document.body.classList.toggle("menu-open");
        });

        overlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("show");
            document.body.classList.remove("menu-open");
        });
    }

    // =========================
    // TOPBAR NOTIFICATION DROPDOWN
    // =========================
    const bell = document.getElementById("notificationBell");
    const dropdown = document.getElementById("notificationDropdown");
    const countBadge = document.getElementById("notificationCount");
    const dropdownList = document.getElementById("notificationDropdownList");

    async function loadTopbarNotifications() {
        if (!dropdownList) return;

        try {
            const response = await fetch("/api/topbar-notifications/", {
                headers: { "X-Requested-With": "XMLHttpRequest" }
            });
            const data = await response.json();

            if (countBadge) {
                const unread = Number(data.unread_count || 0);
                countBadge.textContent = unread;
                countBadge.classList.toggle("hidden", unread <= 0);
            }

            const items = data.items || [];

            if (!items.length) {
                dropdownList.innerHTML = `<div class="notification-dropdown-empty">No notifications yet.</div>`;
                return;
            }

            dropdownList.innerHTML = items.map((item) => `
                <a href="${item.url}" class="notification-dropdown-item ${item.is_read ? "" : "unread"}">
                    <strong>${item.title}</strong>
                    <p>${item.message}</p>
                    <small>${item.created}</small>
                </a>
            `).join("");
        } catch (error) {
            dropdownList.innerHTML = `<div class="notification-dropdown-empty">Unable to load notifications.</div>`;
        }
    }

    if (bell && dropdown) {
        bell.addEventListener("click", async (event) => {
            event.stopPropagation();
            const opening = !dropdown.classList.contains("show");
            dropdown.classList.toggle("show");

            if (opening) {
                await loadTopbarNotifications();
            }
        });

        document.addEventListener("click", (event) => {
            if (!dropdown.contains(event.target) && !bell.contains(event.target)) {
                dropdown.classList.remove("show");
            }
        });

        // real-time refresh every 15 seconds
        setInterval(loadTopbarNotifications, 15000);
    }

    // =========================
    // FORMSET
    // =========================
    document.querySelectorAll("[data-formset]").forEach((formset) => {
        const prefix = formset.dataset.prefix;
        const totalInput = formset.querySelector(`input[name="${prefix}-TOTAL_FORMS"]`);
        const formsContainer = formset.querySelector("[data-formset-forms]");
        const emptyTemplate = formset.querySelector("template[data-empty-form]");
        const addButton = formset.querySelector("[data-add-form]") || formset.parentElement.querySelector("[data-add-form]");

        if (!totalInput || !formsContainer || !emptyTemplate || !addButton) return;

        addButton.addEventListener("click", () => {
            const index = Number(totalInput.value);
            const html = emptyTemplate.innerHTML.replace(/__prefix__/g, index);

            const wrapper = document.createElement("div");
            wrapper.innerHTML = html.trim();

            const newRow = wrapper.firstElementChild;

            if (newRow) {
                formsContainer.appendChild(newRow);
                totalInput.value = index + 1;
            }
        });

        formsContainer.addEventListener("click", (event) => {
            const btn = event.target.closest("[data-remove-form]");
            if (!btn) return;

            const row = btn.closest(".formset-row");
            if (!row) return;

            const deleteInput = row.querySelector('input[name$="-DELETE"]');

            if (deleteInput) {
                deleteInput.checked = true;
                row.style.display = "none";
            } else {
                row.remove();
                totalInput.value = Math.max(0, Number(totalInput.value) - 1);
            }
        });
    });

    // =========================
    // AVAILABILITY CHECK
    // =========================
    document.querySelectorAll("[data-availability-checker]").forEach((checker) => {
        const endpoint = checker.dataset.url;
        const trigger = checker.querySelector("[data-check-availability]");
        const feedback = checker.querySelector("[data-availability-feedback]");
        const results = checker.querySelector("[data-availability-results]");
        const eventDateInput = document.querySelector('input[name="event_date"]');
        const returnDateInput = document.querySelector('input[name="return_due_date"]');

        if (!endpoint || !trigger || !feedback || !results || !eventDateInput || !returnDateInput) return;

        trigger.addEventListener("click", async () => {
            const eventDate = eventDateInput.value;
            const returnDate = returnDateInput.value;

            if (!eventDate || !returnDate) {
                feedback.textContent = "Select dates first.";
                return;
            }

            feedback.textContent = "Checking availability...";
            results.innerHTML = "";

            try {
                const response = await fetch(`${endpoint}?event_date=${eventDate}&return_due_date=${returnDate}`);
                const data = await response.json();

                const items = data.items || [];

                if (!items.length) {
                    results.innerHTML = "<p>No items available.</p>";
                    return;
                }

                results.innerHTML = items.map(item => `
                    <div class="availability-card ${item.status || ""}">
                        <div class="availability-card-head">
                            <strong>${item.item}</strong>
                            <span>${item.available} of ${item.total} free</span>
                        </div>
                        <p>${item.category || ""}</p>
                        <small>${item.price_labels || ""}</small>
                    </div>
                `).join("");

            } catch {
                feedback.textContent = "Error checking availability.";
            }
        });
    });

    // =========================
    // AUTO TEXTAREA
    // =========================
    document.querySelectorAll("textarea").forEach((textarea) => {
        const resize = () => {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        };
        textarea.addEventListener("input", resize);
        resize();
    });
});  // =========================
    const toggle = document.getElementById("mobileMenuToggle");
    const sidebar = document.getElementById("mobileSidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (toggle && sidebar && overlay) {
        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
            overlay.classList.toggle("show");
            document.body.classList.toggle("menu-open");
        });

        overlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("show");
            document.body.classList.remove("menu-open");
        });
    }

    // =========================
    // FORMSET (ADD ITEM)
    // =========================
    document.querySelectorAll("[data-formset]").forEach((formset) => {
        const prefix = formset.dataset.prefix;
        const totalInput = formset.querySelector(`input[name="${prefix}-TOTAL_FORMS"]`);
        const formsContainer = formset.querySelector("[data-formset-forms]");
        const emptyTemplate = formset.querySelector("template[data-empty-form]");
        const addButton = formset.querySelector("[data-add-form]") || formset.parentElement.querySelector("[data-add-form]");

        if (!totalInput || !formsContainer || !emptyTemplate || !addButton) return;

        addButton.addEventListener("click", () => {
            const index = Number(totalInput.value);
            const html = emptyTemplate.innerHTML.replace(/__prefix__/g, index);

            const wrapper = document.createElement("div");
            wrapper.innerHTML = html.trim();

            const newRow = wrapper.firstElementChild;

            if (newRow) {
                formsContainer.appendChild(newRow);
                totalInput.value = index + 1;
            }
        });

        formsContainer.addEventListener("click", (event) => {
            const btn = event.target.closest("[data-remove-form]");
            if (!btn) return;

            const row = btn.closest(".formset-row");
            if (!row) return;

            const deleteInput = row.querySelector('input[name$="-DELETE"]');

            if (deleteInput) {
                deleteInput.checked = true;
                row.style.display = "none";
            } else {
                row.remove();
                totalInput.value = Math.max(0, Number(totalInput.value) - 1);
            }
        });
    });

    // =========================
    // AVAILABILITY CHECK
    // =========================
    document.querySelectorAll("[data-availability-checker]").forEach((checker) => {
        const endpoint = checker.dataset.url;
        const trigger = checker.querySelector("[data-check-availability]");
        const feedback = checker.querySelector("[data-availability-feedback]");
        const results = checker.querySelector("[data-availability-results]");
        const eventDateInput = document.querySelector('input[name="event_date"]');
        const returnDateInput = document.querySelector('input[name="return_due_date"]');

        if (!endpoint || !trigger || !feedback || !results || !eventDateInput || !returnDateInput) return;

        trigger.addEventListener("click", async () => {
            const eventDate = eventDateInput.value;
            const returnDate = returnDateInput.value;

            if (!eventDate || !returnDate) {
                feedback.textContent = "Select dates first.";
                return;
            }

            feedback.textContent = "Checking availability...";
            results.innerHTML = "";

            try {
                const response = await fetch(`${endpoint}?event_date=${eventDate}&return_due_date=${returnDate}`);
                const data = await response.json();

                const items = data.items || [];

                if (!items.length) {
                    results.innerHTML = "<p>No items available.</p>";
                    return;
                }

                results.innerHTML = items.map(item => `
                    <div class="availability-card">
                        <strong>${item.item}</strong>
                        <p>${item.available} available</p>
                    </div>
                `).join("");

            } catch {
                feedback.textContent = "Error checking availability.";
            }
        });
    });

    // =========================
    // AUTO TEXTAREA
    // =========================
    document.querySelectorAll("textarea").forEach((textarea) => {
        const resize = () => {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        };
        textarea.addEventListener("input", resize);
        resize();
    });

});
