import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import type { JumuiyaData, GalleryImage, Official, MeetingSchedule, TshirtOrder } from '../data/jumuiyaData';
import { jumuiyaList as initialJumuiyaList } from '../data/jumuiyaData';

// Increment this whenever the data structure changes to force a localStorage reset
const DATA_VERSION = '3';

interface DataContextType {
    jumuiyaList: JumuiyaData[];
    getJumuiyaById: (id: string) => JumuiyaData | undefined;
    updateJumuiya: (id: string, updates: Partial<JumuiyaData>) => void;
    updateAbout: (id: string, about: JumuiyaData['about']) => void;
    updateOfficials: (id: string, officials: Official[]) => void;
    updateMeetingSchedule: (id: string, schedule: MeetingSchedule) => void;
    updateGallery: (id: string, gallery: GalleryImage[]) => void;
    addTshirtOrder: (jumuiyaId: string, order: TshirtOrder) => void;
    resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [jumuiyaList, setJumuiyaList] = useState<JumuiyaData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = () => {
            const storedVersion = localStorage.getItem('jumuiya_data_version');
            const storedData = localStorage.getItem('jumuiya_data');

            if (storedVersion !== DATA_VERSION || !storedData) {
                // Version mismatch or missing data — reset to fresh data
                console.log('Data version mismatch or missing, resetting to initial data.');
                setJumuiyaList(initialJumuiyaList);
                localStorage.setItem('jumuiya_data', JSON.stringify(initialJumuiyaList));
                localStorage.setItem('jumuiya_data_version', DATA_VERSION);
            } else {
                try {
                    setJumuiyaList(JSON.parse(storedData));
                } catch (e) {
                    console.error('Failed to parse stored data', e);
                    setJumuiyaList(initialJumuiyaList);
                    localStorage.setItem('jumuiya_data', JSON.stringify(initialJumuiyaList));
                    localStorage.setItem('jumuiya_data_version', DATA_VERSION);
                }
            }
            setIsLoading(false);
        };

        loadData();
    }, []);

    useEffect(() => {
        if (!isLoading && jumuiyaList.length > 0) {
            localStorage.setItem('jumuiya_data', JSON.stringify(jumuiyaList));
        }
    }, [jumuiyaList, isLoading]);

    const getJumuiyaById = (id: string) => {
        return jumuiyaList.find(j => j.id === id);
    };

    const updateJumuiya = (id: string, updates: Partial<JumuiyaData>) => {
        setJumuiyaList(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
    };

    const updateAbout = (id: string, about: JumuiyaData['about']) => {
        setJumuiyaList(prev => prev.map(j => j.id === id ? { ...j, about } : j));
    };

    const updateOfficials = (id: string, officials: Official[]) => {
        setJumuiyaList(prev => prev.map(j => j.id === id ? { ...j, officials } : j));
    };

    const updateMeetingSchedule = (id: string, schedule: MeetingSchedule) => {
        setJumuiyaList(prev => prev.map(j => j.id === id ? { ...j, meetingSchedule: schedule } : j));
    };

    const updateGallery = (id: string, gallery: GalleryImage[]) => {
        setJumuiyaList(prev => prev.map(j => j.id === id ? { ...j, gallery } : j));
    };

    const addTshirtOrder = (jumuiyaId: string, order: TshirtOrder) => {
        setJumuiyaList(prev => prev.map(j =>
            j.id === jumuiyaId
                ? { ...j, tshirtOrders: [...(j.tshirtOrders || []), order] }
                : j
        ));
    };

    const resetData = () => {
        setJumuiyaList(initialJumuiyaList);
        localStorage.setItem('jumuiya_data', JSON.stringify(initialJumuiyaList));
        localStorage.setItem('jumuiya_data_version', DATA_VERSION);
    };

    if (isLoading) {
        return <div>Loading data...</div>;
    }

    return (
        <DataContext.Provider value={{
            jumuiyaList,
            getJumuiyaById,
            updateJumuiya,
            updateAbout,
            updateOfficials,
            updateMeetingSchedule,
            updateGallery,
            addTshirtOrder,
            resetData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
