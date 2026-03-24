import { BackendDataService } from '../services/backend-data.js';

// ─── Hardcoded fallback data (shown if JSON files are empty/missing) ───────────
const FALLBACKS = {
    dancers: {
        officials: [
            { id: '1', name: 'Chair', role: 'Chairperson', email: '', phoneNumber: '', photoUrl: '' }
        ],
        activities: [
            { id: '1', title: 'Kerugoya Parish Visit', description: 'Visiting Kerugoya Parish on 15th', date: '2025-02-10', location: 'Kutus', status: 'Upcoming' }
        ]
    },
    charismatic: {
        officials: [],
        activities: []
    },
    'st-francis': {
        officials: [
            { id: '1', name: 'Chairperson', role: 'Chair', email: '', phoneNumber: '', photoUrl: '' }
        ],
        activities: []
    }
};

const modulesMeta = [
    {
        id: 'choir',
        title: 'Choir',
        description: 'Join our heavenly voices in praise and worship.',
        path: '/hub-view/choir',
        color: '#ffffff',
        iconColor: 'var(--theme-primary)',
        icon: 'fas fa-music'
    },
    {
        id: 'dancers',
        title: 'Liturgical Dancers',
        description: 'Expressing faith through rhythmic movement and grace.',
        path: '/hub-view/dancers',
        color: '#e67e22',
        icon: 'fas fa-person-praying',
        scheduleLabel: 'Training Schedule',
        training: 'Every Saturday, 4:00 PM - 6:30 PM',
        location: 'School Compound',
        fees: {
            registration: 'Free',
            subscription: 'Ksh 20 weekly',
            uniform: 'Orange T-shirt (Ksh 600) - Mandatory'
        },
        socials: {
            tiktok: 'https://www.tiktok.com/@kutesaliturgicaldancers?_r=1&_t=ZS-93nRfCuCChM'
        }
    },
    {
        id: 'charismatic',
        title: 'Charismatic Prayer Group',
        description: 'A community of faith, healing, and spiritual growth.',
        path: '/hub-view/charismatic-prayer-group',
        color: '#2ecc71',
        icon: 'fas fa-fire-alt',
        scheduleLabel: 'Meeting Schedule',
        training: 'Every Saturday, 5:00 PM - 6:30 PM',
        location: 'Parish Hall',
        fees: {
            registration: 'Free',
            subscription: 'None'
        },
        story: `
        <h4>St. Vincent de Paul</h4>
        <p>St. Vincent de Paul (1581–1660) remains one of the most beloved figures in Christian history. Born to a peasant family in France, he famously dedicated his life to the service of the poor and marginalized. Renowned for his extraordinary compassion and humility, he established the Congregation of the Mission and the Daughters of Charity, creating a legacy of selfless service that continues to inspire worldwide.</p>
        <p>His tireless advocacy for the destitute, the sick, and the imprisoned earned him the title "Apostle of Charity." Today, his life challenges us to see the face of Christ in the suffering and to respond with profound generosity and love.</p>`,
        agenda: [
            'Praying in devotion through Mother Mary',
            'Seeking to understand the Scriptures well',
            'Spreading the Good News to the community around'
        ]
    },
    {
        id: 'st-francis',
        title: 'St. Francis of Assisi',
        description: 'Building bonds of love and support in our parish family.',
        path: '/hub-view/st-francis',
        color: '#2980b9',
        icon: 'fas fa-dove',
        scheduleLabel: 'Prayer Schedule',
        training: 'Every Sunday, 5:00 PM - 6:30 PM',
        location: 'LH 21',
        fees: {
            registration: 'Ksh 20',
            subscription: 'Ksh 20 (Per Semester)'
        },
        fullImage: '/images/st-francis-icon.jpg',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Saint_Francis_of_Assisi_Icon.jpg/220px-Saint_Francis_of_Assisi_Icon.jpg',
        story: `
        <p>St. Francis of Assisi (1181–1226) remains one of the most beloved figures in Christian history. Born to a wealthy silk merchant, his life changed forever when he heard Christ call from the crucifix at San Damiano to <em>"rebuild my church."</em> Renouncing his inheritance, he embraced radical poverty and service, founding the Franciscan orders for men (Friars Minor), women (Poor Clares), and laypeople (Third Order).</p>
        <p>Known as the patron saint of ecology, he viewed all creation as a sacred brotherhood, famously composing the <em>Canticle of the Creatures</em> and creating the first live Nativity scene at Greccio. In 1224, he became the first recorded person to receive the stigmata, bearing the wounds of Christ. His legacy of humility and peace-making led to his canonization in 1228, inspiring generations to lead lives of profound love for all God's creatures.</p>`
    }
];

export const getIndex = (_req, res) => {
    res.render('index', { title: 'Community Hub', modules: modulesMeta });
};

export const getModule = (req, res) => {
    const meta = modulesMeta.find(m => m.path === `/hub-view${req.path}`);

    if (!meta) {
        return res.status(404).render('module', {
            title: 'Not Found',
            module: { title: 'Not Found', description: 'Module not found.' }
        });
    }

    const fallback = FALLBACKS[meta.id] || {};

    // Clone meta and load dynamic data — fallback defaults ensure content never disappears
    const moduleInfo = {
        ...meta,
        officials:     BackendDataService.load(`${meta.id}_officials.json`,     fallback.officials     || []),
        activities:    BackendDataService.load(`${meta.id}_activities.json`,    fallback.activities    || []),
        announcements: BackendDataService.load(`${meta.id}_announcements.json`, fallback.announcements || []),
        gallery:       BackendDataService.load(`${meta.id}_gallery.json`,       fallback.gallery       || [])
    };

    // Special case for choir
    if (meta.id === 'choir') {
        const choirOfficials  = BackendDataService.load('officials.json',  []);
        const choirActivities = BackendDataService.load('activities.json', []);
        const choirInfo = { ...meta, officials: choirOfficials, activities: choirActivities };
        return res.render('choir', { title: meta.title, module: choirInfo });
    }

    res.render('module', { title: meta.title, module: moduleInfo });
};
