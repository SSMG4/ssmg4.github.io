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

/* -----------------------------------------------------------------------
   MANUAL SITES PLACEHOLDER
   -----------------------------------------------------------------------
   Add manual/non-GitHub websites here by editing this array in the repo.
   Example:
   { name: 'My Site', url: 'https://example.com', description: 'Short description' }

   IMPORTANT: Edit this file in your Github repository (not via the website).
   ----------------------------------------------------------------------- */
const MANUAL_SITES = [
    // <-- Insert Manual Website Here -->
    // Example commented entry:
    // { name: 'My Project', url: 'https://myproject.example.com', description: 'Hosted outside GitHub' }
];

/* === Utilities (manual sites are read from MANUAL_SITES constant) */
function loadManualSites() {
    // Return a (clone) array to avoid mutation of the constant by mistake
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
            
            // Primary action: View code
            const actions = [{ href: repo.html_url, label: 'View on GitHub' }];

            // NEW: Detects GitHub Pages or a custom homepage URL
            if (repo.has_pages || repo.homepage) {
                // Use the homepage URL if set, otherwise default to the GitHub Pages structure
                const siteUrl = repo.homepage || `https://${GITHUB_USER}.github.io/${repo.name}/`;
                actions.push({ href: siteUrl, label: 'Visit Website' });
            }

            const card = makeCard('repo', title, desc, { line: metaLine }, actions);
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="repo-card">Could not load repositories.</div>';
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

/* === Render only Manual Websites === */
async function fetchWebsitesAndRender() {
    const container = document.getElementById('websites-list');
    if (!container) return;
    
    // This now strictly pulls from your MANUAL_SITES array above
    const manual = loadManualSites();

    if (manual.length === 0) {
        container.innerHTML = '<div class="repo-card">No external websites listed. Check back later.</div>';
        return;
    }

    container.innerHTML = '';
    manual.forEach(item => {
        const actions = [];
        if (item.url) {
            actions.push({ href: item.url, label: 'Visit Website' });
        }
        const desc = item.description || 'External Website';
        const card = makeCard('site', item.name, desc, null, actions);
        container.appendChild(card);
    });
}

        // Manual sites from the MANUAL_SITES constant
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
            // no on-site remove/edit controls for manual items (you edit MANUAL_SITES in code)
            const desc = item.description || (item.source === 'github' ? 'GitHub Pages site' : '');
            const card = makeCard('site', item.name, desc, null, actions);
            container.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="repo-card">Could not load websites.<br/>Try again later.</div>';
    }
}

/* === Initial fetches in requested order ===
   1) My GitHub Projects
   2) My Websites
   3) My Organizations
*/
document.addEventListener('DOMContentLoaded', function () {
    fetchReposAndRender();
    fetchWebsitesAndRender();
    fetchOrgsAndRender();
});
