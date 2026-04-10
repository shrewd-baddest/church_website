import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    type?: 'info' | 'success' | 'warning' | 'error';
}

const CommunityModal: React.FC<CommunityModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    type = 'info' 
}) => {
    // Determine icon based on type
    const getIcon = () => {
        switch (type) {
            case 'success': return <i className="fas fa-check-circle text-emerald-500"></i>;
            case 'error': return <i className="fas fa-times-circle text-rose-500"></i>;
            case 'warning': return <i className="fas fa-exclamation-triangle text-amber-500"></i>;
            default: return <i className="fas fa-info-circle text-blue-500"></i>;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
                    >
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{getIcon()}</div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <div className="text-slate-600 leading-relaxed">
                                {children}
                            </div>
                        </div>

                        {/* Footer / OK Button */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={onClose}
                                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition shadow-lg shadow-slate-200"
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommunityModal;
