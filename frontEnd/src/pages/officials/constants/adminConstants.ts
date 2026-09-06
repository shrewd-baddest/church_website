export const CATEGORY_ORDER = [
  'Executive', 'Jumuiya Coordinators', 'Bible Coordinators', 'Rosary Coordinators', 'Pamphlet Managers', 'Project Managers', 'Liturgists', 'Choir Officials', 'Instrument Managers', 'Liturgical Dancers', 'Catechist'
];

// Default closing tribute on the public history page when a term has no custom message
export const DEFAULT_CLOSING_TRIBUTE = 'We gratefully honor these gents and ladies for their devoted service. Their legacy continues to guide and inspire our community today.';

export const CATEGORY_COLORS: Record<string, string> = {
  'Executive': 'from-purple-600 to-purple-700',
  'Jumuiya Coordinators': 'from-blue-600 to-blue-700',
  'Bible Coordinators': 'from-green-600 to-green-700',
  'Rosary Coordinators': 'from-pink-600 to-pink-700',
  'Pamphlet Managers': 'from-orange-600 to-orange-700',
  'Project Managers': 'from-indigo-600 to-indigo-700',
  'Liturgists': 'from-cyan-600 to-cyan-700',
  'Choir Officials': 'from-red-600 to-red-700',
  'Instrument Managers': 'from-blue-600 to-blue-700',
  'Liturgical Dancers': 'from-blue-600 to-blue-700',
  'Catechist': 'from-yellow-600 to-yellow-700'
};

export const POSITION_BY_CATEGORY: Record<string, string[]> = {
  'Executive': ['Chairperson', 'Vice Chairperson', 'Organizing Secretary', 'Treasurer', 'Secretary', 'Assistant Secretary'],
  'Jumuiya Coordinators': ['Jumuiya Coordinator', 'Assistant Jumuiya Coordinator'],
  'Bible Coordinators': ['Bible Study Coordinator', 'Assistant Bible Study Coordinator'],
  'Rosary Coordinators': ['Rosary Coordinator', 'Assistant Rosary Coordinator'],
  'Pamphlet Managers': ['Pamphlet Manager', 'Assistant Pamphlet Manager'],
  'Project Managers': ['Project Manager', 'Assistant Project Manager'],
  'Liturgists': ['Liturgist', 'Assistant Liturgist'],
  'Choir Officials': ['Choir Chairperson', 'Choir Vice Chairperson'],
  'Instrument Managers': ['Instrument Manager', 'Assistant Instrument Manager'],
  'Liturgical Dancers': ['Dance Chairperson', 'Dance Vice Chairperson'],
  'Catechist': ['Catechist']
};

export const POSITION_RANK: Record<string, number> = {};
Object.values(POSITION_BY_CATEGORY).forEach((positions, catIdx) => {
  positions.forEach((pos, idx) => {
    POSITION_RANK[pos] = catIdx * 100 + idx;
  });
});

export const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ccircle cx="50" cy="35" r="15" fill="%239ca3af"/%3E%3Cpath d="M20 100 Q20 70 50 70 Q80 70 80 100" fill="%239ca3af"/%3E%3C/svg%3E';

export const JUMUIYA_OPTIONS = [
  'St. Anthony',
  'St. Augustine',
  'St. Catherine',
  'St. Dominic',
  'St. Elizabeth',
  'St. Maria Goretti',
  'St. Monica'
];

export const JUMUIYA_ROLES = [
  'Chairperson',
  'Ass Chairperson',
  'Organizing Secretary',
  'Treasurer',
  'Secretary',
  'Ass Secretary',
  'Liturgist',
  'Ass Liturgist'
];

export const JUMUIYA_COLORS: Record<string, string> = {
  'St. Anthony': 'from-purple-600 to-purple-700',
  'St. Augustine': 'from-indigo-600 to-indigo-700',
  'St. Catherine': 'from-rose-800 to-rose-900',
  'St. Dominic': 'from-gray-600 to-gray-700',
  'St. Elizabeth': 'from-green-600 to-green-700',
  'St. Maria Goretti': 'from-blue-600 to-blue-700',
  'St. Monica': 'from-red-600 to-red-700'
};

export const GROUP_OPTIONS = [
  'Choir',
  'Dancers',
  'Charismatic',
  'St. Francis',
  'Mentorship'
];

export const POSITIONS_BY_GROUP: Record<string, string[]> = {
  'Choir': ['Choir Master', 'Choir Mistress', 'Secretary', 'Vice Secretary', 'Treasurer', 'Project Manager', 'Male Representative', 'Female Representative'],
  'Dancers': ['Dance Chairperson', 'Dance Vice Chairperson'],
  'Charismatic': ['Chairperson', 'Vice Chairperson'],
  'St. Francis': ['Chairperson', 'Vice Chairperson', 'Secretary', 'Treasurer'],
  'Mentorship': ['Coordinator', 'Vice Coordinator']
};

export const GROUP_POSITION_RANK: Record<string, Record<string, number>> = {};
Object.entries(POSITIONS_BY_GROUP).forEach(([group, positions]) => {
  GROUP_POSITION_RANK[group] = {};
  positions.forEach((pos, idx) => {
    GROUP_POSITION_RANK[group][pos] = idx;
  });
});

export const GROUP_COLORS: Record<string, string> = {
  'Choir': 'from-red-600 to-red-700',
  'Dancers': 'from-cyan-600 to-cyan-700',
  'Charismatic': 'from-orange-600 to-orange-700',
  'St. Francis': 'from-teal-600 to-teal-700',
  'Mentorship': 'from-violet-600 to-violet-700'
};
