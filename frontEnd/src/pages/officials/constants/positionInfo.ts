// Position responsibilities and descriptions for CSA officials
export interface PositionInfo {
  icon: string;
  description: string;
  responsibilities: string[];
  qualities: string[];
}

export const POSITION_INFO: Record<string, PositionInfo> = {
  // ── Executive ──────────────────────────────────────────────────────────────
  'Chairperson': {
    icon: '👑',
    description: 'The Chairperson is the head of the CSA and provides overall leadership and vision for the association. They are the primary representative of the CSA in all official capacities.',
    responsibilities: [
      'Presides over all CSA meetings and executive committee sessions',
      'Represents the CSA at Parish Council and diocesan gatherings',
      'Sets the strategic direction and goals for the association',
      'Ensures the implementation of decisions made in meetings',
      'Coordinates all departments and ensures collaboration',
      'Signs official correspondence and documents on behalf of the CSA',
    ],
    qualities: ['Leadership', 'Communication', 'Vision', 'Integrity'],
  },
  'Vice Chairperson': {
    icon: '🤝',
    description: 'The Vice Chairperson supports the Chairperson in all duties and steps in to lead whenever the Chairperson is unavailable. They also oversee specific portfolios as delegated.',
    responsibilities: [
      'Deputises the Chairperson in their absence',
      'Assists in coordinating executive committee activities',
      'Oversees specific sub-committees as assigned',
      'Acts as a liaison between departments and the executive',
      'Monitors the implementation of CSA programmes',
    ],
    qualities: ['Dependability', 'Leadership', 'Flexibility', 'Teamwork'],
  },
  'Organizing Secretary': {
    icon: '📋',
    description: 'The Organizing Secretary is responsible for the logistical planning and coordination of all CSA events, meetings, and activities to ensure they run smoothly.',
    responsibilities: [
      'Plans, schedules, and publicises all CSA events and meetings',
      'Prepares and distributes meeting agendas in advance',
      'Coordinates logistics such as venues, catering, and transport',
      'Manages the CSA calendar and activity schedule',
      'Liaises with external parties for event organisation',
      'Ensures proper documentation of all planned activities',
    ],
    qualities: ['Organisation', 'Attention to detail', 'Time management', 'Planning'],
  },
  'Secretary': {
    icon: '📝',
    description: 'The Secretary is the official record-keeper of the CSA, responsible for all documentation, correspondence, and communication on behalf of the association.',
    responsibilities: [
      'Records accurate minutes of all meetings',
      'Maintains the official register of CSA members',
      'Handles all incoming and outgoing official correspondence',
      'Keeps safe custody of all CSA documents and records',
      'Reads minutes of previous meetings at the start of each session',
      'Archives decisions, resolutions, and important communications',
    ],
    qualities: ['Accuracy', 'Confidentiality', 'Communication', 'Organisation'],
  },
  'Assistant Secretary': {
    icon: '📎',
    description: 'The Assistant Secretary supports the Secretary in all clerical and administrative duties, and takes over the Secretary\'s role in their absence.',
    responsibilities: [
      'Assists the Secretary in recording meeting minutes',
      'Helps manage member communication and correspondence',
      'Maintains backup copies of important records',
      'Deputises the Secretary when necessary',
      'Supports in distributing notices and announcements',
    ],
    qualities: ['Reliability', 'Accuracy', 'Punctuality', 'Teamwork'],
  },
  'Treasurer': {
    icon: '💰',
    description: 'The Treasurer is the chief financial officer of the CSA. They are entrusted with safeguarding the association\'s funds and maintaining transparent financial records.',
    responsibilities: [
      'Receives and safely custodies all CSA funds and contributions',
      'Maintains accurate and up-to-date financial records',
      'Presents financial reports at every CSA meeting',
      'Manages and disburses funds as approved by the executive',
      'Prepares the annual CSA budget for approval',
      'Ensures all expenditures have proper receipts and authorisation',
      'Coordinates with the Parish Finance Committee as needed',
    ],
    qualities: ['Honesty', 'Numeracy', 'Accountability', 'Transparency'],
  },

  // ── Jumuiya Coordinators ───────────────────────────────────────────────────
  'Jumuiya Coordinator': {
    icon: '🏘️',
    description: 'The Jumuiya Coordinator is the primary bridge between the individual Jumuiya Small Christian Communities and the parish-wide CSA structure.',
    responsibilities: [
      'Coordinates activities between all Jumuiya groups and the CSA',
      'Attends Jumuiya meetings and provides reports to the CSA executive',
      'Facilitates communication between Jumuiya leaders and the parish',
      'Encourages membership and active participation in Jumuiyas',
      'Ensures Jumuiya elections and governance follow parish guidelines',
      'Organises inter-Jumuiya events and shared activities',
    ],
    qualities: ['Interpersonal skills', 'Communication', 'Diplomacy', 'Community spirit'],
  },
  'Assistant Jumuiya Coordinator': {
    icon: '🤲',
    description: 'Supports the Jumuiya Coordinator in all duties relating to the Small Christian Communities.',
    responsibilities: [
      'Assists in coordinating between Jumuiyas and the CSA',
      'Deputises the Jumuiya Coordinator in their absence',
      'Helps gather and relay information from Jumuiya leaders',
      'Supports inter-Jumuiya events and activities',
    ],
    qualities: ['Reliability', 'Community spirit', 'Communication', 'Teamwork'],
  },

  // ── Bible Coordinators ─────────────────────────────────────────────────────
  'Bible Study Coordinator': {
    icon: '📖',
    description: 'The Bible Study Coordinator leads the spiritual formation of CSA members through structured Bible study sessions and faith education programmes.',
    responsibilities: [
      'Plans and leads regular Bible study sessions for the CSA',
      'Selects and prepares study materials and resources',
      'Collaborates with the Parish Priest for guidance on topics',
      'Encourages members to engage deeply with Scripture',
      'Coordinates guest speakers, retreats, and formation days',
      'Tracks and reports attendance and engagement in Bible study',
    ],
    qualities: ['Biblical knowledge', 'Teaching ability', 'Spirituality', 'Passion for the Word'],
  },
  'Assistant Bible Study Coordinator': {
    icon: '✝️',
    description: 'Supports the Bible Study Coordinator in planning and conducting Scripture-based activities.',
    responsibilities: [
      'Assists in preparing and facilitating Bible study sessions',
      'Helps source and distribute study materials',
      'Leads sessions in the coordinator\'s absence',
      'Encourages member participation in faith formation',
    ],
    qualities: ['Spirituality', 'Reliability', 'Communication', 'Biblical knowledge'],
  },

  // ── Rosary ─────────────────────────────────────────────────────────────────
  'Rosary Coordinator': {
    icon: '📿',
    description: 'The Rosary Coordinator promotes devotion to Our Lady through the faithful praying of the Rosary within the CSA.',
    responsibilities: [
      'Organises and leads communal Rosary sessions',
      'Promotes the Rosary as a key devotional practice in the CSA',
      'Coordinates Rosary campaigns during the month of May and October',
      'Provides Rosary guides and materials to members',
      'Encourages family and personal Rosary praying',
    ],
    qualities: ['Marian devotion', 'Prayerfulness', 'Leadership', 'Enthusiasm'],
  },
  'Assistant Rosary Coordinator': {
    icon: '🕊️',
    description: 'Supports the Rosary Coordinator in promoting and leading Marian devotions.',
    responsibilities: [
      'Assists in leading Rosary sessions',
      'Helps distribute materials for Rosary campaigns',
      'Deputises the Rosary Coordinator when needed',
    ],
    qualities: ['Marian devotion', 'Reliability', 'Prayerfulness'],
  },

  // ── Pamphlet Managers ──────────────────────────────────────────────────────
  'Pamphlet Manager': {
    icon: '📄',
    description: 'The Pamphlet Manager ensures that the CSA\'s information and communications are accurately produced and widely distributed to members and the parish.',
    responsibilities: [
      'Designs, produces, and distributes CSA newsletters and pamphlets',
      'Ensures accuracy of all published CSA content',
      'Coordinates printing and distribution of liturgical materials',
      'Archives all publications produced by the CSA',
      'Liaises with the Parish communication team',
    ],
    qualities: ['Attention to detail', 'Communication', 'Design skills', 'Organisation'],
  },
  'Assistant Pamphlet Manager': {
    icon: '🖨️',
    description: 'Supports the Pamphlet Manager in all publication and distribution activities.',
    responsibilities: [
      'Helps produce and proofread CSA publications',
      'Assists in distribution of newsletters and pamphlets',
      'Deputises the Pamphlet Manager when needed',
    ],
    qualities: ['Attention to detail', 'Reliability', 'Teamwork'],
  },

  // ── Project Managers ───────────────────────────────────────────────────────
  'Project Manager': {
    icon: '🏗️',
    description: 'The Project Manager spearheads the CSA\'s development projects and social outreach initiatives, ensuring they are delivered on time and within budget.',
    responsibilities: [
      'Plans, executes, and monitors CSA development projects',
      'Prepares project plans, budgets, and progress reports',
      'Coordinates volunteers and resources for projects',
      'Liaises with external partners and donor organisations',
      'Ensures projects align with the CSA\'s mission and parish priorities',
    ],
    qualities: ['Project management', 'Leadership', 'Problem-solving', 'Initiative'],
  },
  'Assistant Project Manager': {
    icon: '🔧',
    description: 'Supports the Project Manager in all project planning, execution, and reporting activities.',
    responsibilities: [
      'Assists in coordinating project activities and volunteers',
      'Helps prepare project reports and documentation',
      'Deputises the Project Manager when needed',
    ],
    qualities: ['Organisation', 'Teamwork', 'Reliability', 'Problem-solving'],
  },

  // ── Liturgist ─────────────────────────────────────────────────────────────
  'Liturgist': {
    icon: '⛪',
    description: 'The Liturgist ensures that all CSA worship experiences are conducted with reverence, dignity, and full adherence to the Church\'s liturgical norms.',
    responsibilities: [
      'Coordinates all liturgical aspects of CSA Masses and celebrations',
      'Prepares lectors, ministers of communion, and altar servers',
      'Ensures the correct use of liturgical texts and gestures',
      'Liaises with the Parish Priest on liturgical matters',
      'Trains CSA members in proper liturgical roles',
      'Plans special celebrations for the CSA\'s annual calendar',
    ],
    qualities: ['Liturgical knowledge', 'Prayerfulness', 'Attention to detail', 'Leadership'],
  },
  'Assistant Liturgist': {
    icon: '🕯️',
    description: 'Supports the Liturgist in planning and executing all worship activities.',
    responsibilities: [
      'Assists in preparing members for liturgical roles',
      'Helps coordinate CSA worship events',
      'Deputises the Liturgist in their absence',
    ],
    qualities: ['Liturgical knowledge', 'Prayerfulness', 'Teamwork'],
  },

  // ── Choir Officials ───────────────────────────────────────────────────────
  'Choir Chairperson': {
    icon: '🎶',
    description: 'The Choir Chairperson provides leadership and governance to the CSA choir, ensuring it functions as a skilled and spiritually-grounded ministry.',
    responsibilities: [
      'Leads the CSA choir and presides over choir meetings',
      'Coordinates choir rehearsal schedules with the choir director',
      'Represents the choir in CSA executive meetings',
      'Ensures choir members are well-prepared for every liturgy',
      'Manages choir welfare, attendance, and conduct',
    ],
    qualities: ['Musical appreciation', 'Leadership', 'Organisation', 'Spirituality'],
  },
  'Choir Vice Chairperson': {
    icon: '🎵',
    description: 'Supports the Choir Chairperson in managing the choir ministry.',
    responsibilities: [
      'Deputises the Choir Chairperson in their absence',
      'Monitors choir attendance at rehearsals and liturgies',
      'Helps resolve issues within the choir',
    ],
    qualities: ['Musical appreciation', 'Leadership', 'Teamwork'],
  },

  // ── Instrument Managers ───────────────────────────────────────────────────
  'Instrument Manager': {
    icon: '🎸',
    description: 'The Instrument Manager is responsible for the procurement, maintenance, and safekeeping of all musical instruments used by the CSA.',
    responsibilities: [
      'Takes inventory and maintains all CSA musical instruments',
      'Ensures instruments are in good working condition',
      'Oversees the secure storage of instruments after use',
      'Coordinates repairs and replacements when necessary',
      'Manages instrument allocation for rehearsals and liturgies',
    ],
    qualities: ['Responsibility', 'Technical knowledge', 'Organisation', 'Integrity'],
  },
  'Assistant Instrument Manager': {
    icon: '🎹',
    description: 'Assists in managing and maintaining the CSA\'s musical instrument inventory.',
    responsibilities: [
      'Assists in instrument maintenance and inventory',
      'Helps set up instruments before rehearsals and Masses',
      'Deputises the Instrument Manager when needed',
    ],
    qualities: ['Responsibility', 'Teamwork', 'Technical aptitude'],
  },

  // ── Liturgical Dancers ────────────────────────────────────────────────────
  'Dance Coordinator': {
    icon: '💃',
    description: 'The Dance Coordinator leads the liturgical dance ministry, blending artistic movement with prayerful worship to glorify God.',
    responsibilities: [
      'Coordinates liturgical dance rehearsals and performances',
      'Choreographs worship dances in alignment with liturgical themes',
      'Trains and mentors dance ministry members',
      'Ensures dancers are spiritually prepared and modestly attired',
      'Liaises with the Liturgist for integration into worship',
    ],
    qualities: ['Dance skills', 'Spirituality', 'Creativity', 'Leadership'],
  },
  'Assistant Dance Coordinator': {
    icon: '🎭',
    description: 'Assists the Dance Coordinator in leading the liturgical dance ministry.',
    responsibilities: [
      'Assists in dance rehearsals and choreography',
      'Deputises the Dance Coordinator when absent',
      'Helps manage dance ministry members',
    ],
    qualities: ['Dance skills', 'Reliability', 'Teamwork'],
  },

  // ── Catechist ─────────────────────────────────────────────────────────────
  'Catechist': {
    icon: '🎓',
    description: 'The Catechist is responsible for faith formation and religious education within the CSA, guiding members in a deeper understanding of the Catholic faith.',
    responsibilities: [
      'Provides structured catechesis and faith formation to CSA members',
      'Prepares members for sacramental celebrations where needed',
      'Uses approved Church materials for religious education',
      'Liaises with the Parish Priest on catechetical content',
      'Supports children and youth formation programmes in the parish',
      'Reports on catechesis activities to the CSA executive',
    ],
    qualities: ['Theological knowledge', 'Teaching ability', 'Patience', 'Faith commitment'],
  },
};

// Fallback for unknown positions
export const DEFAULT_POSITION_INFO: PositionInfo = {
  icon: '👤',
  description: 'A valued member of the CSA executive team, contributing to the mission and activities of the association.',
  responsibilities: [
    'Supports the CSA\'s overall mission and activities',
    'Attends and participates in CSA meetings',
    'Collaborates with other officials to serve members',
  ],
  qualities: ['Commitment', 'Service', 'Teamwork'],
};
