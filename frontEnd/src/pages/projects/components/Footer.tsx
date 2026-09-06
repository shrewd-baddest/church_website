import { useState, useEffect } from 'react';

interface FooterProps {
    apiMessages: Record<string, string[]>;
    footerIndex: number;
    isFooterFading: boolean;
}

export const Footer = ({ apiMessages, footerIndex, isFooterFading }: FooterProps) => {
    const [displayIdx, setDisplayIdx] = useState(footerIndex);
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        if (footerIndex === displayIdx) return;
        setOpacity(0);
        const t = setTimeout(() => {
            setDisplayIdx(footerIndex);
            setOpacity(1);
        }, 400);
        return () => clearTimeout(t);
    }, [footerIndex, displayIdx]);

    const msgs = apiMessages?.general || [];
    const text = msgs.length > 0 ? msgs[displayIdx] : 'Quality services.';

    return (
        <footer className="bg-slate-900 border-t border-slate-800">
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                    <h3 className="text-white font-bold text-lg">CSA Shop</h3>
                    <p className="text-slate-400 text-sm mt-1">Dedicated to quality, faith, and community service.</p>
                </div>

                {msgs.length > 0 && (
                    <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-2xl px-6 py-4 max-w-md text-center backdrop-blur-sm">
                        <div className="absolute -top-2.5 left-6 text-slate-600 text-lg">&ldquo;</div>
                        <p
                            className="text-slate-300 text-sm italic leading-relaxed transition-opacity duration-400"
                            style={{ opacity }}
                        >
                            {text}
                        </p>
                        <div className="absolute -bottom-2.5 right-6 text-slate-600 text-lg">&rdquo;</div>
                    </div>
                )}
            </div>

            <div className="border-t border-slate-800 py-4 text-center">
                <p className="text-slate-500 text-xs">
                    &copy; {new Date().getFullYear()} CSA Shop. All rights reserved.
                </p>
            </div>
        </footer>
    );
};
