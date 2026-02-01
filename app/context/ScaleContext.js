"use client";
import { createContext, useContext, useState } from 'react';
import csvConfig from '../csv_config.json';

// Default scale based on Scale.js - using snake_case keys to match backend expectations
const defaultScale = csvConfig.default_scale;

const ScaleContext = createContext();

export function ScaleProvider({ children }) {
    const [scale, setScale] = useState(defaultScale);

    const updateScale = (newScale) => {
        setScale(newScale);
    };

    const resetScale = () => {
        setScale(defaultScale);
    };

    return (
        <ScaleContext.Provider value={{ scale, defaultScale, updateScale, resetScale }}>
            {children}
        </ScaleContext.Provider>
    );
}

export function useScale() {
    const context = useContext(ScaleContext);
    if (!context) {
        throw new Error('useScale must be used within a ScaleProvider');
    }
    return context;
} 