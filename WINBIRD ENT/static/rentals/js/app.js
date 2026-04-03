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
    // FORMSET
    // =========================
    document.querySelectorAll("[data-formset]").forEach((formset) => {
        const prefix = formset.dataset.prefix;
        const totalInput = formset.querySelector(`input[name="${prefix}-TOTAL_FORMS"]`);
        const formsContainer = formset.querySelector("[data-formset-forms]");
        const emptyTemplate = formset.querySelector("template[data-empty-form]");
        const addButton = formset.querySelector("[data-add-form]");

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
            const button = event.target.closest("[data-remove-form]");
            if (!button) return;

            const row = button.closest(".formset-row");
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
    // AVAILABILITY CHECKER
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
                feedback.textContent = "Choose both dates first.";
                return;
            }

            feedback.textContent = "Checking...";
            results.innerHTML = "";

            try {
                const response = await fetch(`${endpoint}?event_date=${eventDate}&return_due_date=${returnDate}`);
                const data = await response.json();

                results.innerHTML = data.items.map(item => `
                    <div class="availability-card ${item.status}">
                        <strong>${item.item}</strong>
                        <span>${item.available}/${item.total}</span>
                    </div>
                `).join("");

                feedback.textContent = "Done";

            } catch {
                feedback.textContent = "Error checking availability";
            }
        });
    });


    // =========================
    // TEXTAREA AUTO GROW
    // =========================
    document.querySelectorAll("textarea").forEach((textarea) => {
        const resize = () => {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        };

        textarea.addEventListener("input", resize);
        resize();
    });


    // =========================
    // 🔔 NOTIFICATIONS SYSTEM
    // =========================
    let lastNotificationCount = 0;
    let soundUnlocked = false;

    function getSound() {
        return document.getElementById("notificationSound");
    }

    function unlockSound() {
        const sound = getSound();
        if (!sound || soundUnlocked) return;

        sound.muted = true;
        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
            sound.muted = false;
            soundUnlocked = true;
        }).catch(() => {});
    }

    function playNotificationSound() {
        const sound = getSound();
        if (!sound || !soundUnlocked) return;

        sound.currentTime = 0;
        sound.play().catch(() => {});
    }

    document.addEventListener("click", unlockSound, { once: true });
    document.addEventListener("touchstart", unlockSound, { once: true });


    const bell = document.getElementById("notificationBell");
    const dropdown = document.getElementById("notificationDropdown");

    if (bell && dropdown) {
        bell.addEventListener("click", () => {
            dropdown.classList.toggle("show");
        });
    }


    async function loadNotifications() {
        try {
            const response = await fetch("/api/topbar-notifications/");
            const data = await response.json();

            const unread = data.unread_count;

            // 🔊 SOUND
            if (unread > lastNotificationCount) {
                playNotificationSound();
            }
            lastNotificationCount = unread;

            // 🔴 BADGE
            const badge = document.getElementById("notificationBadge");
            if (badge) {
                badge.textContent = unread;
                badge.style.display = unread > 0 ? "inline-block" : "none";
            }

            // 📩 DROPDOWN LIST
            if (dropdown) {
                dropdown.innerHTML = data.items.map(n => `
                    <a href="${n.url}" class="notification-item ${n.is_read ? '' : 'unread'}">
                        <strong>${n.title}</strong>
                        <p>${n.message}</p>
                        <small>${n.created}</small>
                    </a>
                `).join("");
            }

        } catch (error) {
            console.log("Notification error:", error);
        }
    }

    // Load every 10 seconds
    setInterval(loadNotifications, 10000);
    loadNotifications();

});
