// === Theme Switching ===
const root = document.body;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function setTheme(mode) {
    if (mode === "light") {
        root.classList.add('light');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('theme', 'light');
    } else {
        root.classList.remove('light');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('theme', 'dark');
    }
}

function toggleTheme() {
    if (root.classList.contains('light')) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
}

themeToggle.addEventListener('click', toggleTheme);

// On load, apply preferred theme
(function() {
    const pref = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(pref);
})();

// === Mojangles font for headers/buttons ===
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('h1, h2, .repo-title, .colorful-btn, .repo-link').forEach(el => {
        el.style.fontFamily = "'Mojangles', 'Segoe UI', Arial, sans-serif";
    });
});

// === Fetch and display GitHub repos ===
async function fetchRepos() {
    const container = document.getElementById('repo-list');
    container.innerHTML = '<div class="repo-card">Loading repositories...</div>';
    try {
        const res = await fetch('https://api.github.com/users/SSMG4/repos?per_page=100&sort=updated');
        if (!res.ok) throw new Error('GitHub API error');
        const data = await res.json();
        // Filter out forks and sort by stargazers
        const repos = data.filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count);
        if (repos.length === 0) {
            container.innerHTML = '<div class="repo-card">No repositories found.</div>';
            return;
        }
        // Build cards
        container.innerHTML = '';
        repos.forEach(repo => {
            const card = document.createElement('div');
            card.className = 'repo-card';
            card.innerHTML = `
                <div class="repo-title">${repo.name}</div>
                <div class="repo-desc">${repo.description ? repo.description : '<em>No description</em>'}</div>
                <div class="repo-meta">
                    <span title="Stars"><i class="fa-solid fa-star"></i> ${repo.stargazers_count}</span>
                    <span title="Language">${repo.language || 'N/A'}</span>
                </div>
                <a href="${repo.html_url}" target="_blank" class="repo-link">View on GitHub</a>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<div class="repo-card">Could not load repositories.<br/>Try again later.</div>';
    }
}
fetchRepos();