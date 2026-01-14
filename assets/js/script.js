// === Theme Switching ===
const root = document.body;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function setTheme(mode) {
    if (mode === "light") {
        root.classList.add('light');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
        localStorage.setItem('theme', 'light');
    } else {
        root.classList.remove('light');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
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

if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

(function() {
    const pref = localStorage.getItem('theme') ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(pref);
})();

// === Mojangles font for headers/buttons ===
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('h1, h2, .repo-title, .colorful-btn, .repo-link').forEach(el => {
        el.style.fontFamily = "'Mojangles', 'Segoe UI', Arial, sans-serif";
    });
});

/* --- MANUAL SITES --- */
const MANUAL_SITES = [
    // Add external websites here. Example:
    // { name: 'My Portfolio', url: 'https://example.com', description: 'My personal portfolio' }
];

function loadManualSites() {
    try {
        return Array.isArray(MANUAL_SITES) ? MANUAL_SITES.slice() : [];
    } catch (e) {
        console.error('Failed to load manual sites', e);
        return [];
    }
}

/* === Rendering helpers === */
function makeCard(kind, title, descText, metaHtml, actions = []) {
    const card = document.createElement('div');
    card.className = 'repo-card';

    if (kind === 'org') {
        const header = document.createElement('div');
        header.className = 'org-header';
        const avatar = document.createElement('img');
        avatar.className = 'org-avatar';
        avatar.src = (metaHtml && metaHtml.avatar) ? metaHtml.avatar : '';
        avatar.alt = title + ' avatar';
        const titleEl = document.createElement('div');
        titleEl.className = 'repo-title';
        titleEl.textContent = title;
        header.appendChild(avatar);
        header.appendChild(titleEl);
        card.appendChild(header);
    } else {
        const titleEl = document.createElement('div');
        titleEl.className = 'repo-title';
        titleEl.textContent = title;
        card.appendChild(titleEl);
    }

    const desc = document.createElement('div');
    desc.className = 'repo-desc';
    desc.textContent = descText || '';
    card.appendChild(desc);

    if (metaHtml && metaHtml.line) {
        const meta = document.createElement('div');
        meta.className = 'repo-meta';
        meta.innerHTML = metaHtml.line;
        card.appendChild(meta);
    }

    if (actions && actions.length) {
        const actionWrap = document.createElement('div');
        actionWrap.style.display = 'flex';
        actionWrap.style.gap = '0.6rem';
        actions.forEach(a => {
            const btn = document.createElement('a');
            btn.className = 'repo-link';
            btn.href = a.href;
            btn.target = '_blank';
            btn.rel = 'noopener noreferrer';
            btn.textContent = a.label || 'Visit Website';
            actionWrap.appendChild(btn);
        });
        card.appendChild(actionWrap);
    }

    return card;
}

const GITHUB_USER = 'SSMG4';

/* === 1. GitHub Projects (Now includes "Visit Website" if available) === */
async function fetchReposAndRender() {
    const container = document.getElementById('repo-list');
    if (!container) return;
    container.innerHTML = '<div class="repo-card">Loading repositories...</div>';
    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=200&sort=updated`);
        if (!res.ok) throw new Error('GitHub API error');
        const data = await res.json();
        const repos = Array.isArray(data) ? data.filter(r => !r.fork) : [];
        repos.sort((a, b) => b.stargazers_count - a.stargazers_count);

        container.innerHTML = '';
        repos.forEach(repo => {
            const metaLine = `<span title="Stars"><i class="fa-solid fa-star"></i> ${repo.stargazers_count}</span>
                              <span title="Language">${repo.language || 'N/A'}</span>`;
            
            const actions = [{ href: repo.html_url, label: 'View on GitHub' }];

            // Auto-check for website
            if (repo.has_pages || repo.homepage) {
                const siteUrl = repo.homepage || `https://${GITHUB_USER}.github.io/${repo.name}/`;
                actions.push({ href: siteUrl, label: 'Visit Website' });
            }

            container.appendChild(makeCard('repo', repo.name, repo.description, { line: metaLine }, actions));
        });
    } catch (e) {
        container.innerHTML = '<div class="repo-card">Could not load repositories.</div>';
    }
}

/* === 2. Manual Websites Section === */
async function fetchWebsitesAndRender() {
    const container = document.getElementById('websites-list');
    if (!container) return;
    
    const manual = loadManualSites();
    if (manual.length === 0) {
        container.innerHTML = '<div class="repo-card">No external websites listed.</div>';
        return;
    }

    container.innerHTML = '';
    manual.forEach(item => {
        const actions = item.url ? [{ href: item.url, label: 'Visit Website' }] : [];
        container.appendChild(makeCard('site', item.name, item.description, null, actions));
    });
}

/* === 3. Organizations === */
async function fetchOrgsAndRender() {
    const container = document.getElementById('orgs-list');
    if (!container) return;
    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/orgs`);
        const data = await res.json();
        container.innerHTML = '';
        data.forEach(org => {
            const meta = { avatar: org.avatar_url, line: '' };
            const actions = [{ href: `https://github.com/${org.login}`, label: 'View on GitHub' }];
            container.appendChild(makeCard('org', org.login, org.description, meta, actions));
        });
    } catch (e) {
        container.innerHTML = '<div class="repo-card">No organizations found.</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchReposAndRender();
    fetchWebsitesAndRender();
    fetchOrgsAndRender();
});
