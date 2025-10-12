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

// On load, apply preferred theme
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

/* === Utilities for manual sites in localStorage === */
const MANUAL_SITES_KEY = 'ssmg4_manual_sites';

function loadManualSites() {
    try {
        const raw = localStorage.getItem(MANUAL_SITES_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse manual sites', e);
        return [];
    }
}

function saveManualSites(sites) {
    try {
        localStorage.setItem(MANUAL_SITES_KEY, JSON.stringify(sites));
    } catch (e) {
        console.error('Failed to save manual sites', e);
    }
}

/* === Rendering helpers === */
function makeCard(kind, title, descText, metaHtml, actions = []) {
    const card = document.createElement('div');
    card.className = 'repo-card';
    const titleEl = document.createElement('div');
    titleEl.className = 'repo-title';
    titleEl.textContent = title;
    card.appendChild(titleEl);

    if (kind === 'org' && metaHtml && metaHtml.avatar) {
        const header = document.createElement('div');
        header.className = 'org-header';
        const avatar = document.createElement('img');
        avatar.className = 'org-avatar';
        avatar.src = metaHtml.avatar;
        avatar.alt = title + ' avatar';
        header.appendChild(avatar);
        const titleBlock = document.createElement('div');
        titleBlock.appendChild(titleEl);
        header.appendChild(titleBlock);
        card.appendChild(header);
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
            if (a.element) {
                actionWrap.appendChild(a.element);
            } else if (a.href) {
                const btn = document.createElement('a');
                btn.className = 'repo-link';
                btn.href = a.href;
                btn.target = '_blank';
                btn.rel = 'noopener noreferrer';
                btn.textContent = a.label || 'Visit';
                actionWrap.appendChild(btn);
            }
        });
        card.appendChild(actionWrap);
    }

    return card;
}

/* === Fetch and display GitHub repos, websites, and orgs === */
const GITHUB_USER = 'SSMG4'; // change here if needed

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

        if (repos.length === 0) {
            container.innerHTML = '<div class="repo-card">No repositories found.</div>';
            return;
        }
        container.innerHTML = '';
        repos.forEach(repo => {
            const title = repo.name;
            const desc = repo.description || 'No description';
            const metaLine = `<span title="Stars"><i class="fa-solid fa-star"></i> ${repo.stargazers_count}</span>
                              <span title="Language">${repo.language || 'N/A'}</span>`;
            const visit = { href: repo.html_url, label: 'View on GitHub' };
            const card = makeCard('repo', title, desc, { line: metaLine }, [visit]);
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="repo-card">Could not load repositories.<br/>Try again later.</div>';
    }
}

async function fetchOrgsAndRender() {
    const container = document.getElementById('orgs-list');
    if (!container) return;
    container.innerHTML = '<div class="repo-card">Loading organizations...</div>';
    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/orgs`);
        if (!res.ok) throw new Error('GitHub API error (orgs)');
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = '<div class="repo-card">No organizations found.</div>';
            return;
        }
        // Sort alphabetically by login (case-insensitive)
        data.sort((a, b) => (a.login || '').toLowerCase().localeCompare((b.login || '').toLowerCase()));
        container.innerHTML = '';
        data.forEach(org => {
            const title = org.login || org.name || 'Organization';
            const desc = org.description || '';
            const meta = { avatar: org.avatar_url, line: '' };
            const visit = { href: `https://github.com/${org.login}`, label: 'View on GitHub' };
            const card = makeCard('org', title, desc, meta, [visit]);
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="repo-card">Could not load organizations.</div>';
    }
}

/* === Websites: combine GitHub Pages sites and manual entries, allow adding/removing manual entries === */
async function fetchWebsitesAndRender() {
    const container = document.getElementById('websites-list');
    if (!container) return;
    container.innerHTML = '<div class="repo-card">Loading websites...</div>';
    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=200&sort=updated`);
        if (!res.ok) throw new Error('GitHub API error');
        const data = await res.json();
        const repos = Array.isArray(data) ? data : [];

        // Discover GitHub Pages: has_pages true and exclude repo named exactly `${GITHUB_USER}.github.io`
        const ghSites = repos
            .filter(r => r.has_pages && r.name.toLowerCase() !== `${GITHUB_USER.toLowerCase()}.github.io`)
            .map(r => {
                return {
                    name: r.name,
                    url: `https://${GITHUB_USER}.github.io/${r.name}/`,
                    description: r.description || '',
                    source: 'github'
                };
            });

        // Manual sites from localStorage
        const manual = loadManualSites().map(s => ({ ...s, source: 'manual' }));

        // Combine and sort alphabetically by name (case-insensitive)
        const combined = ghSites.concat(manual).sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));

        // Render
        if (combined.length === 0) {
            container.innerHTML = '<div class="repo-card">No websites found.</div>';
            return;
        }
        container.innerHTML = '';
        combined.forEach(item => {
            const actions = [];
            if (item.url) {
                const a = document.createElement('a');
                a.className = 'repo-link';
                a.href = item.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = 'Visit';
                actions.push({ element: a });
            }
            if (item.source === 'manual') {
                // remove button for manual entries
                const rmBtn = document.createElement('button');
                rmBtn.className = 'repo-link';
                rmBtn.style.background = '#ff6b6b';
                rmBtn.style.color = '#fff';
                rmBtn.type = 'button';
                rmBtn.textContent = 'Remove';
                rmBtn.addEventListener('click', () => {
                    removeManualSite(item.url);
                });
                actions.push({ element: rmBtn });
            }
            const desc = item.description || (item.source === 'github' ? 'GitHub Pages site' : '');
            const card = makeCard('site', item.name, desc, null, actions);
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="repo-card">Could not load websites.<br/>Try again later.</div>';
    }
}

function addManualSite(site) {
    const current = loadManualSites();
    // basic dedupe: by URL
    if (current.some(s => s.url === site.url)) return false;
    current.push(site);
    saveManualSites(current);
    return true;
}

function removeManualSite(url) {
    let current = loadManualSites();
    current = current.filter(s => s.url !== url);
    saveManualSites(current);
    // rerender websites
    fetchWebsitesAndRender();
}

/* === Form handling for adding manual sites === */
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('add-site-form');
    if (form) {
        form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const nameInput = document.getElementById('site-name');
            const urlInput = document.getElementById('site-url');
            const descInput = document.getElementById('site-desc');
            if (!nameInput || !urlInput) return;

            const name = nameInput.value.trim();
            const url = urlInput.value.trim();
            const desc = descInput ? descInput.value.trim() : '';

            if (!name || !url) return;

            // Ensure URL is absolute
            let normalizedUrl = url;
            if (!/^https?:\/\//i.test(normalizedUrl)) {
                normalizedUrl = 'https://' + normalizedUrl;
            }

            const siteObj = { name, url: normalizedUrl, description: desc };
            const added = addManualSite(siteObj);
            if (!added) {
                // optionally show feedback; for now console
                console.info('Site already exists in manual list.');
            } else {
                // clear form
                nameInput.value = '';
                urlInput.value = '';
                if (descInput) descInput.value = '';
                fetchWebsitesAndRender();
            }
        });
    }

    // Initial fetches
    fetchWebsitesAndRender();
    fetchOrgsAndRender();
    fetchReposAndRender();
});
