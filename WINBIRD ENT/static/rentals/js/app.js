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
        const addButton = formset.querySelector("[data-add-form]") || formset.parentElement.querySelector("[data-add-form]");

        if (!totalInput || !formsContainer || !emptyTemplate || !addButton) {
            return;
        }

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

        if (!endpoint || !trigger || !feedback || !results || !eventDateInput || !returnDateInput) {
            return;
        }

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

                results.innerHTML = (data.items || []).map(item => `
                    <div class="availability-card ${item.status}">
                        <div class="availability-card-head">
                            <strong>${item.item}</strong>
                            <span>${item.available} of ${item.total} free</span>
                        </div>
                        <p>${item.category || ""}</p>
                        <small>${item.price_labels || ""}</small>
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
    // TOAST NOTIFICATION SYSTEM
    // =========================
    function getToastContainer() {
        let container = document.getElementById("toastContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "toastContainer";
            container.className = "toast-container";
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(title, message) {
        const container = getToastContainer();
        const toast = document.createElement("div");
        toast.className = "app-toast";
        toast.innerHTML = `
            <div class="app-toast-title">${title}</div>
            <div class="app-toast-message">${message}</div>
        `;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        window.setTimeout(() => {
            toast.classList.remove("show");
            window.setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // =========================
    // NOTIFICATIONS
    // =========================
    let lastNotificationCount = 0;
    let soundUnlocked = false;
    let hasLoadedNotificationsOnce = false;

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

    function vibrateDevice() {
        if ("vibrate" in navigator) {
            navigator.vibrate([180, 80, 180]);
        }
    }

    document.addEventListener("click", unlockSound, { once: true });
    document.addEventListener("touchstart", unlockSound, { once: true });

    const bell = document.getElementById("notificationBell");
    const dropdown = document.getElementById("notificationDropdown");
    const dropdownList = document.getElementById("notificationDropdownList");
    const countBadge = document.getElementById("notificationCount");

    if (bell && dropdown) {
        bell.addEventListener("click", async (event) => {
            event.stopPropagation();
            dropdown.classList.toggle("show");
            if (dropdown.classList.contains("show")) {
                await loadNotifications();
            }
        });

        document.addEventListener("click", (event) => {
            if (!dropdown.contains(event.target) && !bell.contains(event.target)) {
                dropdown.classList.remove("show");
            }
        });
    }

    async function loadNotifications() {
        try {
            const response = await fetch("/api/topbar-notifications/");
            const data = await response.json();

            const unread = Number(data.unread_count || 0);
            const items = data.items || [];

            if (hasLoadedNotificationsOnce && unread > lastNotificationCount) {
                playNotificationSound();
                vibrateDevice();

                if (items.length > 0) {
                    const newest = items[0];
                    showToast(newest.title, newest.message);
                } else {
                    showToast("New notification", "You have a new notification.");
                }
            }

            lastNotificationCount = unread;
            hasLoadedNotificationsOnce = true;

            if (countBadge) {
                countBadge.textContent = unread;
                countBadge.classList.toggle("hidden", unread <= 0);
            }

            if (dropdownList) {
                if (!items.length) {
                    dropdownList.innerHTML = `<div class="notification-dropdown-empty">No notifications yet.</div>`;
                } else {
                    dropdownList.innerHTML = items.map(n => `
                        <a href="${n.url}" class="notification-dropdown-item ${n.is_read ? "" : "unread"}">
                            <strong>${n.title}</strong>
                            <p>${n.message}</p>
                            <small>${n.created}</small>
                        </a>
                    `).join("");
                }
            }
        } catch (error) {
            console.log("Notification error:", error);
            if (dropdownList) {
                dropdownList.innerHTML = `<div class="notification-dropdown-empty">Unable to load notifications.</div>`;
            }
        }
    }

    setInterval(loadNotifications, 10000);
    loadNotifications();
});
