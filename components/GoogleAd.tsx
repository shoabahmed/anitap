import React, { useEffect, useRef } from 'react';

const GoogleAd = ({ className }: { className?: string }) => {
    const adRef = useRef<HTMLModElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                if (initialized.current) return;
                const adsbygoogle = (window as any).adsbygoogle || [];
                // Double check existence and emptiness before pushing
                if (adRef.current && adRef.current.innerHTML === "") {
                    if (!initialized.current) {
                        adsbygoogle.push({});
                        initialized.current = true;
                    }
                }
            } catch (e) {
                // Silent catch for React Strict Mode re-mount issues
            }
        }, 200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`w-full overflow-hidden bg-surfaceVariant/5 flex justify-center items-center min-h-[100px] relative ${className}`}>
             <span className="text-[10px] text-onSurfaceVariant/20 absolute top-1 right-2 uppercase tracking-wider">Ad</span>
             <ins className="adsbygoogle"
                 ref={adRef}
                 style={{ display: 'block', width: '100%' }}
                 data-ad-client="ca-pub-7652027225361719"
                 data-ad-slot="7167045749" 
                 data-ad-format="auto"
                 data-full-width-responsive="true"
             />
        </div>
    );
};

export default GoogleAd;