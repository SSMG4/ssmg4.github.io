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

document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('h1, h2, .repo-title, .colorful-btn, .repo-link').forEach(el => {
        el.style.fontFamily = "'Mojangles', 'Segoe UI', Arial, sans-serif";
    });

    const audio = document.getElementById('bg-audio');
    const musicToggle = document.getElementById('music-toggle');
    const musicIcon = document.getElementById('music-icon');

    if (musicToggle && audio) {
        audio.volume = 0.2;
        musicToggle.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                musicIcon.classList.replace('fa-play', 'fa-pause');
            } else {
                audio.pause();
                musicIcon.classList.replace('fa-pause', 'fa-play');
            }
        });
    }
});

const MANUAL_SITES = [
];

function loadManualSites() {
    try {
        return Array.isArray(MANUAL_SITES) ? MANUAL_SITES.slice() : [];
    } catch (e) {
        console.error('Failed to load manual sites', e);
        return [];
    }
}

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

async function fetchReposAndRender() {
    const container = document.getElementById('repo-list');
    const countEl = document.getElementById('repo-count');
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
            if (repo.has_pages || repo.homepage) {
                const siteUrl = repo.homepage || `https://${GITHUB_USER}.github.io/${repo.name}/`;
                actions.push({ href: siteUrl, label: 'Visit Website' });
            }
            container.appendChild(makeCard('repo', repo.name, repo.description, { line: metaLine }, actions));
        });

        if (countEl) countEl.textContent = `(${repos.length})`;
    } catch (e) {
        container.innerHTML = '<div class="repo-card">Could not load repositories.</div>';
    }
}

async function fetchWebsitesAndRender() {
    const container = document.getElementById('websites-list');
    const countEl = document.getElementById('websites-count');
    if (!container) return;

    const manual = loadManualSites();
    if (manual.length === 0) {
        container.innerHTML = '<div class="repo-card">No external websites listed.</div>';
        if (countEl) countEl.textContent = '(0)';
        return;
    }

    container.innerHTML = '';
    manual.forEach(item => {
        const actions = item.url ? [{ href: item.url, label: 'Visit Website' }] : [];
        container.appendChild(makeCard('site', item.name, item.description, null, actions));
    });
    if (countEl) countEl.textContent = `(${manual.length})`;
}

async function fetchOrgsAndRender() {
    const container = document.getElementById('orgs-list');
    const countEl = document.getElementById('orgs-count');
    if (!container) return;
    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/orgs`);
        const data = await res.json();
        container.innerHTML = '';

        const orgDetails = await Promise.all(
            data.map(org => fetch(`https://api.github.com/orgs/${org.login}`).then(r => r.json()).catch(() => org))
        );

        orgDetails.forEach(org => {
            const meta = { avatar: org.avatar_url, line: '' };
            const actions = [{ href: `https://github.com/${org.login}`, label: 'View on GitHub' }];
            if (org.blog && org.blog.trim() !== '') {
                const websiteUrl = org.blog.startsWith('http') ? org.blog : `https://${org.blog}`;
                actions.push({ href: websiteUrl, label: 'View Website' });
            }
            container.appendChild(makeCard('org', org.login, org.description, meta, actions));
        });

        if (countEl) countEl.textContent = `(${orgDetails.length})`;
    } catch (e) {
        container.innerHTML = '<div class="repo-card">No organizations found.</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchReposAndRender();
    fetchWebsitesAndRender();
    fetchOrgsAndRender();
});
