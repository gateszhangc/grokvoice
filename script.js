const topbar = document.querySelector("[data-topbar]");
const yearNode = document.querySelector("#current-year");
const modeButtons = Array.from(document.querySelectorAll("[data-mode-trigger]"));
const modePanels = Array.from(document.querySelectorAll("[data-mode-panel]"));

const setActiveMode = (nextMode) => {
  modeButtons.forEach((button) => {
    const isActive = button.dataset.modeTrigger === nextMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  modePanels.forEach((panel) => {
    const isActive = panel.dataset.modePanel === nextMode;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
};

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveMode(button.dataset.modeTrigger || "agent"));
});

const handleScroll = () => {
  if (!topbar) return;
  topbar.classList.toggle("is-scrolled", window.scrollY > 10);
};

window.addEventListener("scroll", handleScroll, { passive: true });
handleScroll();
setActiveMode("agent");

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}
