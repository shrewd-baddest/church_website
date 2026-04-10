export interface Member {
    id: number;
    name: string;
    year: string;
    isRegistered: boolean;
    phone?: string;
    email?: string;
}

export const membersList: Member[] = [
    { id: 1, name: 'Mary Wanjiru', year: '1st', isRegistered: true, phone: '+254 712 345 678', email: 'mary@example.com' },
    { id: 2, name: 'John Kamau', year: '2nd', isRegistered: true, phone: '+254 723 456 789', email: 'john@example.com' },
    { id: 3, name: 'Grace Akinyi', year: '2nd', isRegistered: false, phone: '+254 734 567 890', email: 'grace@example.com' },
    { id: 4, name: 'Peter Ochieng', year: '3rd', isRegistered: true, phone: '+254 745 678 901', email: 'peter@example.com' },
    { id: 5, name: 'Faith Njeri', year: '4th', isRegistered: false, phone: '+254 756 789 012', email: 'faith@example.com' },
    { id: 6, name: 'David Mwangi', year: '4th', isRegistered: true, phone: '+254 767 890 123', email: 'david@example.com' },
    { id: 7, name: 'James Kerubo', year: '1st', isRegistered: false, phone: '+254 778 901 234', email: 'james@example.com' },
    { id: 8, name: 'Ann Wambui', year: '3rd', isRegistered: false, phone: '+254 789 012 345', email: 'ann@example.com' },
];

// Mock logged in user (unregistered for demo purposes)
export const currentUser = membersList[4]; // Faith Njeri
