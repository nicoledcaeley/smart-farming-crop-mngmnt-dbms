(function () {
    'use strict';

    /* ---------- Mobile menu ---------- */
    var header = document.getElementById('site-header');
    var toggle = document.querySelector('[data-nav-toggle]');

    if (header && toggle) {
        toggle.addEventListener('click', function () {
            var open = header.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(open));
            toggle.textContent = open ? 'Close' : 'Menu';
        });
    }

    /* ---------- Dropdowns: one open at a time, close on outside click / Escape ---------- */
    var groups = Array.prototype.slice.call(document.querySelectorAll('.nav-group'));

    groups.forEach(function (group) {
        group.addEventListener('toggle', function () {
            if (!group.open) return;
            groups.forEach(function (other) {
                if (other !== group) other.open = false;
            });
        });
    });

    document.addEventListener('click', function (event) {
        groups.forEach(function (group) {
            if (!group.contains(event.target)) group.open = false;
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        groups.forEach(function (group) {
            if (group.open) {
                group.open = false;
                var summary = group.querySelector('summary');
                if (summary) summary.focus();
            }
        });
    });

    /* ---------- Status badges ----------
       Turns plain text in "Status", "Severity" and "Grade" columns into coloured badges. */
    var TONES = {
        status: {
            ok:   ['active', 'planted', 'done', 'ready', 'resolved', 'sufficient', 'harvested', 'treated', 'normal'],
            warn: ['pending', 'open', 'acknowledged', 'growing'],
            bad:  ['overdue', 'failed', 'inactive', 'low stock', 'critical'],
            info: ['fallow'],
            quiet: ['idle', 'skipped']
        },
        severity: {
            info: ['low'],
            warn: ['medium'],
            bad:  ['high', 'critical']
        },
        grade: {
            ok:   ['a'],
            info: ['b'],
            warn: ['c']
        }
    };

    function toneFor(kind, value) {
        var map = TONES[kind];
        for (var tone in map) {
            if (map[tone].indexOf(value) !== -1) return tone;
        }
        return null;
    }

    function columnKind(headerText) {
        var text = headerText.trim().toLowerCase();
        if (text === 'severity') return 'severity';
        if (text === 'grade' || text === 'quality grade') return 'grade';
        if (text === 'status' || text === 'harvest status' || text === 'account status') return 'status';
        return null;
    }

    Array.prototype.forEach.call(document.querySelectorAll('table'), function (table) {
        var rows = table.querySelectorAll('tr');
        if (!rows.length) return;

        var headCells = rows[0].querySelectorAll('th');
        if (!headCells.length) return;

        var kinds = Array.prototype.map.call(headCells, function (th) {
            return columnKind(th.textContent);
        });
        if (!kinds.some(Boolean)) return;

        Array.prototype.forEach.call(rows, function (row, index) {
            if (index === 0) return;
            var cells = row.children;
            if (cells.length !== kinds.length) return;

            kinds.forEach(function (kind, col) {
                var cell = cells[col];
                if (!kind || !cell || cell.children.length) return;

                var text = cell.textContent.replace(/\s+/g, ' ').trim();
                if (!text) return;

                var tone = toneFor(kind, text.toLowerCase());
                if (!tone) return;

                var badge = document.createElement('span');
                badge.className = 'badge' + (tone === 'quiet' ? '' : ' badge--' + tone);
                badge.textContent = text;
                cell.textContent = '';
                cell.appendChild(badge);
            });
        });
    });

    /* ---------- Keep dates on one line ---------- */
    Array.prototype.forEach.call(document.querySelectorAll('td'), function (cell) {
        if (/^\s*\d{4}-\d{2}-\d{2}\s*$/.test(cell.textContent)) cell.classList.add('nowrap');
    });

    /* ---------- Home: search + filter chips ---------- */
    var search = document.querySelector('[data-module-search]');
    if (!search) return;

    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-chip]'));
    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-group]'));
    var empty = document.querySelector('[data-no-results]');
    var active = 'all';

    function apply() {
        var query = search.value.trim().toLowerCase();
        var anyVisible = false;

        sections.forEach(function (section) {
            var inGroup = active === 'all' || section.getAttribute('data-group') === active;
            var visibleTiles = 0;

            Array.prototype.forEach.call(section.querySelectorAll('[data-tile]'), function (tile) {
                var hit = !query || tile.getAttribute('data-tile').indexOf(query) !== -1;
                tile.hidden = !hit;
                if (hit) visibleTiles++;
            });

            section.hidden = !(inGroup && visibleTiles);
            if (!section.hidden) anyVisible = true;
        });

        if (empty) empty.hidden = anyVisible;
    }

    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            active = chip.getAttribute('data-chip');
            chips.forEach(function (other) {
                other.setAttribute('aria-pressed', String(other === chip));
            });
            apply();
        });
    });

    search.addEventListener('input', apply);

    search.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        var first = document.querySelector('[data-group]:not([hidden]) [data-tile]:not([hidden])');
        if (first) window.location.href = first.getAttribute('href');
    });
})();
