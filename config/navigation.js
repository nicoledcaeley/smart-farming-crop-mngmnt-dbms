// Navigation for the header menu AND the home-page tiles.
// Add a page here once and it shows up in both places.
// "roles" mirrors the allowRoles(...) guard on each route.

const ALL = ['Admin', 'Farm Manager', 'Farmer', 'Agronomist'];
const MANAGERS = ['Admin', 'Farm Manager'];

const icon = (paths) =>
    `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ` +
    `stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICONS = {
    sprout: icon(
        '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/>' +
        '<path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>' +
        '<path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>'
    ),
    clipboard: icon(
        '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>' +
        '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>' +
        '<path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>'
    ),
    activity: icon(
        '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>'
    ),
    chart: icon(
        '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>'
    ),
    shield: icon(
        '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>' +
        '<path d="m9 12 2 2 4-4"/>'
    )
};

const groups = [
    {
        key: 'farm',
        label: 'Farm',
        blurb: 'The land, the crops, and the rules for growing them.',
        icon: ICONS.sprout,
        items: [
            { label: 'Farms', href: '/farms', desc: 'Farm sites and total area', roles: ALL },
            { label: 'Fields', href: '/fields', desc: 'Plots, soil type and status', roles: ALL },
            { label: 'Crops', href: '/crops', desc: 'Crop catalog and days to maturity', roles: ALL },
            { label: 'Growth stages', href: '/growth-stages', desc: 'Stage timeline for each crop', roles: ALL },
            { label: 'Thresholds', href: '/thresholds', desc: 'Min and max values per crop metric', roles: ALL }
        ]
    },
    {
        key: 'operations',
        label: 'Operations',
        blurb: 'Day-to-day work: planting, care, inputs and harvest.',
        icon: ICONS.clipboard,
        items: [
            { label: 'Plantings', href: '/plantings', desc: 'What is planted where, and when', roles: ALL },
            { label: 'Care tasks', href: '/care-tasks', desc: 'Irrigation, fertilizing, weeding', roles: ALL },
            { label: 'Farm inputs', href: '/farm-inputs', desc: 'Seeds, fertilizer and stock levels', roles: ALL },
            { label: 'Input usage', href: '/input-usage', desc: 'Record inputs used on a planting', roles: ALL },
            { label: 'Harvests', href: '/harvests', desc: 'Record harvest quantity and grade', roles: ALL }
        ]
    },
    {
        key: 'monitoring',
        label: 'Monitoring',
        blurb: 'Sensors, alerts, pests and weather.',
        icon: ICONS.activity,
        items: [
            { label: 'Sensor readings', href: '/readings', desc: 'Soil moisture, temperature, pH', roles: ALL },
            { label: 'Alerts', href: '/alerts', desc: 'Threshold breaches that need a look', roles: ALL },
            { label: 'Pest reports', href: '/pest-reports', desc: 'Log and review pest incidents', roles: ALL },
            { label: 'Weather logs', href: '/weather-logs', desc: 'Daily rainfall, temperature, humidity', roles: MANAGERS }
        ]
    },
    {
        key: 'reports',
        label: 'Reports',
        blurb: 'Summaries built from the database joins.',
        icon: ICONS.chart,
        items: [
            { label: 'Harvest prediction', href: '/reports/harvest-prediction', desc: 'Estimated harvest dates', roles: ALL },
            { label: 'Current growth stage', href: '/reports/current-stage', desc: 'Stage of every planting right now', roles: ALL },
            { label: 'Idle fields', href: '/reports/idle-fields', desc: 'Fields with nothing planted', roles: ALL },
            { label: 'Inputs per planting', href: '/reports/planting-inputs', desc: 'Total inputs used on each planting', roles: ALL },
            { label: 'Coverage gaps', href: '/reports/coverage', desc: 'Fields missing weather data', roles: ['Admin', 'Farm Manager', 'Agronomist'] },
            { label: 'Users, roles and farms', href: '/reports/users-roles-farms', desc: 'Who can do what, and where', roles: MANAGERS },
            { label: 'Audit log', href: '/audit', desc: 'Newest changes first, read only', roles: ALL }
        ]
    },
    {
        key: 'admin',
        label: 'Admin',
        blurb: 'Accounts and permissions.',
        icon: ICONS.shield,
        items: [
            { label: 'Users', href: '/users', desc: 'Accounts, roles and farm assignment', roles: MANAGERS },
            { label: 'Roles', href: '/roles', desc: 'Role names and descriptions', roles: ['Admin'] }
        ]
    }
];

// Returns only the groups/items the signed-in user may open.
function navFor(user) {
    const role = user ? user.role_name : null;
    if (!role) return [];

    return groups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => item.roles.includes(role))
        }))
        .filter((group) => group.items.length > 0);
}

module.exports = { navFor };
