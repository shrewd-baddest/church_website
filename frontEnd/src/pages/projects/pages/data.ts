// --- Type Definitions ---
export type SectionType = 'sacramentals' | 'chairs' | 'instruments' | 'tshirts' | 'other';

export interface CartItem {
    id?: string;
    type?: 'rental' | 'purchase';
    category?: SectionType;
    item: any; // Keep `item` object flexible to accept the whole product object
    price: number;
    quantity?: number | string;
    date?: string;
    location?: string;
    img?: string;
    variant?: string;
    rentalDays?: number;
    size?: string;
}

export const SELLER_NUMBERS = {
    sacramentals: "254112051739",
    chairs: "254112051739",
    instruments: "254112051740",
    tshirts: "254112051739"
};

export type SacramentalCategory = 'all' | 'rosaries' | 'bibles' | 'chains' | 'crucifixes' | 'statues' | 'candles';

export const SACRAMENTAL_CATEGORIES: { id: SacramentalCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All Items', icon: '' },
    { id: 'rosaries', label: 'Rosaries', icon: '' },
    { id: 'bibles', label: 'Bibles & Books', icon: '' },
    { id: 'chains', label: 'Chains & Medals', icon: '' },
    { id: 'crucifixes', label: 'Crucifixes', icon: '' },
    { id: 'statues', label: 'Statues', icon: '' },
    { id: 'candles', label: 'Candles & More', icon: '' },
];

export interface SacramentalProduct {
    name: string;
    price: number;
    desc: string;
    img: string;
    category: SacramentalCategory;
}

export const INSTRUMENT_PRICES: Record<string, number> = {
    'piano': 2000,
    'speakers and microphones': 2500,
    'speakers': 2500,
    'organ': 3000,
};
