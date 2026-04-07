function enableSidebarToggle() {
    const toggleBtn = document.querySelector(".toggle-btn");
    const sidebar = document.querySelector(".sidebar");

    toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        document.body.classList.toggle("sidebar-collapsed");

        // Save state
        localStorage.setItem(
        "sidebarCollapsed",
        sidebar.classList.contains("collapsed")
        );
    });

    // Load saved state
    const savedState = localStorage.getItem("sidebarCollapsed");

    if (savedState === "true") {
        sidebar.classList.add("collapsed");
    }
}

function enableMobileSidebar() {
    const menuBtn = document.querySelector(".mobile-menu-btn");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".overlay");

    if (!menuBtn || !sidebar || !overlay) return;

    menuBtn.addEventListener("click", () => {
        sidebar.classList.add("open");
        overlay.classList.add("active");
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    });
}

function enableLogout() {
    const logoutBtn = document.querySelector(".logout-btn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {

        // Clear stored user data
        localStorage.removeItem("user_name");
        localStorage.removeItem("token"); // if you’re storing auth token

        // Redirect to login
        window.location.href = "../pages/login.html";
    });
}

fetch("sidebar.html")
    .then(res => res.text())
    .then(data => {
        document.getElementById("sidebar-container").innerHTML = data;

        lucide.createIcons();

        // AFTER sidebar loads → run active logic
        setActiveLink();
        enableSidebarToggle();
        enableMobileSidebar();
        enableLogout();
    });

    function setActiveLink() {
    const links = document.querySelectorAll(".nav-link");

    // get current file name
    const currentPage = window.location.pathname.split("/").pop();

    links.forEach(link => {
        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage) {
        link.classList.add("active");
        }
    });

    const userNameElement = document.querySelector(".user-name");

    // example: get from localStorage
    const user = localStorage.getItem("user_name") || "User";

    if (userNameElement) {
        userNameElement.textContent = "👋 " + user;
    }
}