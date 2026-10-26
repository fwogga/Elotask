// Corre em todas as páginas da aplicação
import { renderSidebar } from "./components/sidebar.js";

const sidebar = document.querySelector("[data-sidebar]");
if (sidebar) {
  renderSidebar(sidebar);
}
