"use client";
import { createContext, useContext, useState } from 'react';

// Default scale based on Scale.js - using snake_case keys to match backend expectations
const defaultScale = {
    fafsa_scale: {
        very_high_need: 12,
        high_need: 12,
        moderate_need: 9,
        low_need: 5,
        no_need: 2
    },
    paid: {
        paid: 4,
        unpaid: 6
    },
    internship_type: {
        in_person: 3,
        hybrid: 1,
        virtual: 0
    },
    cost_of_living: {
        tier1: {
            Mississippi: 1, Arkansas: 1, Missouri: 1, Michigan: 1,
            Tennessee: 1, Ohio: 1, Oklahoma: 1, Georgia: 1,
            Alabama: 1, Indiana: 1, WestVirginia: 1, Texas: 1,
            Kansas: 1, Iowa: 1
        },
        tier2: {
            NorthCarolina: 2, Illinois: 2, Wisconsin: 2, Nebraska: 2,
            Idaho: 2, SouthDakota: 2, NewMexico: 2, Florida: 2,
            Pennsylvania: 2, Minnesota: 2, Virginia: 2, Utah: 2,
            Wyoming: 2, NorthDakota: 2, SouthCarolina: 2, International: 2,
            Louisiana: 2, Kentucky: 2, Nevada: 2
        },
        tier3: {
            Montana: 3, Colorado: 3, NewYork: 3, Washington: 3,
            Maine: 3, Oregon: 3, Vermont: 3, NewJersey: 3,
            NewHampshire: 3, Maryland: 3, RhodeIsland: 3, Connecticut: 3,
            Massachusetts: 3, Hawaii: 3, California: 3, Alaska: 3,
            DistrictOfColumbia: 3, Delaware: 3, Arizona: 3
        }
    }
};

const ScaleContext = createContext();

export function ScaleProvider({ children }) {
    const [scale, setScale] = useState(defaultScale);

    const updateScale = (newScale) => {
        setScale(newScale);
    };

    return (
        <ScaleContext.Provider value={{ scale, updateScale }}>
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