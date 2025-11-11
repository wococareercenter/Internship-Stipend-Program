"use client";
import { createContext, useContext, useState } from 'react';

// Default scale based on Scale.js - using snake_case keys to match backend expectations
const defaultScale = {
    fafsa_scale: {
        very_high_need: 5,
        high_need: 4,
        moderate_need: 3,
        low_need: 2,
        no_need: 0
    },
    paid: {
        paid: 4,
        unpaid: 5
    },
    internship_type: {
        in_person: 5,
        hybrid: 4,
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
            NorthCarolina: 3, Illinois: 3, Wisconsin: 3, Nebraska: 3,
            Idaho: 3, SouthDakota: 3, NewMexico: 3, Florida: 3,
            Pennsylvania: 3, Minnesota: 3, Virginia: 3, Utah: 3,
            Wyoming: 3, NorthDakota: 3, SouthCarolina: 3, International: 3,
            Louisiana: 3, Kentucky: 3, Nevada: 3
        },
        tier3: {
            Montana: 5, Colorado: 5, NewYork: 5, Washington: 5,
            Maine: 5, Oregon: 5, Vermont: 5, NewJersey: 5,
            NewHampshire: 5, Maryland: 5, RhodeIsland: 5, Connecticut: 5,
            Massachusetts: 5, Hawaii: 5, California: 5, Alaska: 5,
            DistrictOfColumbia: 5, Delaware: 5, Arizona: 5
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