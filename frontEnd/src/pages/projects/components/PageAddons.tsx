import React from 'react';

/* ================= HERO ================= */
export const CategoryHero: React.FC<{ category: 'sacramentals' | 'tshirts' | 'chairs' | 'instruments' | 'other' }> = () => null;

/* ================= TRUST BAR ================= */
export const TrustBar: React.FC<{ category: 'sacramentals' | 'tshirts' | 'chairs' | 'instruments' | 'other' }> = () => null;

/* ================= PROCESS GUIDE ================= */
export const ProcessGuide: React.FC = () => null;

/* ================= IMAGE SLIDER ================= */
export interface SliderImage {
    url: string;
    message?: string;
}

export const ImageSlider: React.FC<{ images: (string | SliderImage)[] }> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [images.length]);

    if (!images || images.length === 0) return null;

    return (
        <div className="relative w-full h-[220px] md:h-[320px] rounded-3xl overflow-hidden shadow-lg">

            {images.map((img, i) => {
                const url = typeof img === 'string' ? img : img.url;
                const message = typeof img === 'string' ? '' : img.message;

                return (
                    <div
                        key={i}
                        className={`absolute inset-0 transition-opacity duration-1000 ${
                            i === currentIndex ? 'opacity-100 z-10' : 'opacity-0'
                        }`}
                    >
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${url})` }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 via-transparent to-transparent" />

                        {message && (
                            <div className="absolute bottom-6 left-6 right-6 text-white">
                                <p className="text-lg md:text-xl font-semibold">
                                    {message}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-3 h-3 rounded-full transition ${
                            i === currentIndex
                                ? 'bg-white'
                                : 'bg-white/50 hover:bg-white'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};