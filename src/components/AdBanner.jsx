import React, { useEffect } from 'react';

const AdBanner = ({ slotId }) => {
    useEffect(() => {
        try {
            // This pushes the ad request to Google
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense Error:", e);
        }
    }, []);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '20px 0',
            background: '#f0f0f0', // Light grey placeholder so you see it even if ad fails
            minHeight: '100px'
        }}>
            <ins className="adsbygoogle"
                style={{ display: 'block', width: '100%' }}
                data-ad-client="ca-pub-8027466882908992"
                data-ad-slot={slotId}
                data-ad-format="auto"
                data-full-width-responsive="true">
            </ins>
        </div>
    );
};

export default AdBanner;
