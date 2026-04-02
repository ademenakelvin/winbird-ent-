document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-formset]").forEach((formset) => {
        const prefix = formset.dataset.prefix;
        const totalInput = formset.querySelector(`input[name="${prefix}-TOTAL_FORMS"]`);
        const formsContainer = formset.querySelector("[data-formset-forms]");
        const emptyTemplate = formset.querySelector("template[data-empty-form]");
        const addButton = formset.parentElement.querySelector("[data-add-form]");

        if (!totalInput || !formsContainer || !emptyTemplate || !addButton) {
            return;
        }

        const clearRowInputs = (row) => {
            row.querySelectorAll("input, select, textarea").forEach((field) => {
                const name = field.getAttribute("name") || "";

                if (name.endsWith("-DELETE")) {
                    field.checked = true;
                    return;
                }

                if (field.type === "checkbox" || field.type === "radio") {
                    field.checked = false;
                } else {
                    field.value = "";
                }
            });
        };

        addButton.addEventListener("click", () => {
            const index = Number(totalInput.value);
            const html = emptyTemplate.innerHTML.replace(/__prefix__/g, index);
            const wrapper = document.createElement("div");
            wrapper.innerHTML = html.trim();
            const newRow = wrapper.firstElementChild;

            if (newRow) {
                clearRowInputs(newRow);
                newRow.classList.add("is-new");
                newRow.addEventListener(
                    "animationend",
                    () => newRow.classList.remove("is-new"),
                    { once: true }
                );
                formsContainer.appendChild(newRow);
                totalInput.value = index + 1;
            }
        });

        formsContainer.addEventListener("click", (event) => {
            const button = event.target.closest("[data-remove-form]");
            if (!button) {
                return;
            }

            const row = button.closest(".formset-row");
            if (!row) {
                return;
            }

            const deleteInput = row.querySelector('input[name$="-DELETE"]');

            if (deleteInput) {
                deleteInput.checked = true;
                row.querySelectorAll("input, select, textarea").forEach((field) => {
                    const name = field.getAttribute("name") || "";
                    if (!name.endsWith("-DELETE")) {
                        if (field.type === "checkbox" || field.type === "radio") {
                            field.checked = false;
                        } else {
                            field.value = "";
                        }
                    }
                });
                row.classList.add("is-removing");
                window.setTimeout(() => {
                    row.style.display = "none";
                }, 180);
            } else {
                row.remove();
                totalInput.value = Math.max(0, Number(totalInput.value) - 1);
            }
        });
    });

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

        const renderItems = (items) => {
            if (!items.length) {
                results.innerHTML = '<p class="muted-copy muted-copy-dark">No inventory items are available to show.</p>';
                return;
            }

            results.innerHTML = items
                .map((item) => `
                    <article class="availability-card ${item.status}">
                        <div class="availability-card-head">
                            <strong>${item.item}</strong>
                            <span>${item.available} of ${item.total} free</span>
                        </div>
                        <p>${item.category}</p>
                        <small>${item.price_labels || "No active price options configured."}</small>
                    </article>
                `)
                .join("");
        };

        trigger.addEventListener("click", async () => {
            const eventDate = eventDateInput.value;
            const returnDate = returnDateInput.value;

            if (!eventDate || !returnDate) {
                feedback.textContent = "Choose both dates before checking availability.";
                return;
            }

            feedback.textContent = "Checking stock availability...";
            results.innerHTML = "";

            const url = `${endpoint}?event_date=${encodeURIComponent(eventDate)}&return_due_date=${encodeURIComponent(returnDate)}`;

            try {
                const response = await fetch(url, {
                    headers: { "X-Requested-With": "XMLHttpRequest" },
                });
                const payload = await response.json();

                if (!response.ok) {
                    feedback.textContent = payload.error || "Availability check failed.";
                    return;
                }

                feedback.textContent = `Availability for ${eventDate} to ${returnDate}`;
                renderItems(payload.items || []);
            } catch (error) {
                feedback.textContent = "Unable to check availability right now.";
            }
        });
    });
});
