"use client";
import { useState, useEffect } from "react";
import { useScale } from "../context/ScaleContext";

export default function Scale() {
    // All hooks must be called at the top level, before any conditional returns
    const { updateScale } = useScale();
    
    // Dropdown Variables
    const [showScale, setShowScale] = useState(false);

    const [showFAFSA, setShowFAFSA] = useState(false);
    const [showPaid, setShowPaid] = useState(false);
    const [showInternshipType, setShowInternshipType] = useState(false);

    const [showCostOfLiving, setShowCostOfLiving] = useState(false);
    const [showCostOfLivingInput, setShowCostOfLivingInput] = useState(false);
    const [showCostOfLivingInput2, setShowCostOfLivingInput2] = useState(false);
    const [showCostOfLivingInput3, setShowCostOfLivingInput3] = useState(false);
    const [showTier1, setShowTier1] = useState(false);
    const [showTier2, setShowTier2] = useState(false);
    const [showTier3, setShowTier3] = useState(false);

    const [isMounted, setIsMounted] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");



    // Input Scale variable and default value
    const [fafsaScale, setFafsaScale] = useState({
        very_high_need: 5,
        high_need: 4,
        moderate_need: 3,
        low_need: 2,
        no_need: 0,
    });

    // Input Paid or Unpaid variable and default value
    const [paid, setPaid] = useState({
        paid: 4,
        unpaid: 5,
    });

    // Input In-Person or Remote variable and default value
    const [internshipType, setInternshipType] = useState({
        in_person: 5,
        hybrid: 4,
        virtual: 0,
    });

    // Input Cost of Living variable and default value
    const defaultCostOfLiving = {
        tier1: {
            Mississippi: 1, 
            Arkansas: 1,
            Missouri: 1,
            Michigan: 1,
            Tennessee: 1,
            Ohio: 1,
            Oklahoma: 1,
            Georgia: 1,
            Alabama: 1,
            Indiana: 1,
            WestVirginia: 1,
            Texas: 1,
            Kansas: 1,
            Iowa: 1,
        },
        tier2: {
            NorthCarolina: 3,
            Illinois: 3,
            Wisconsin: 3,
            Nebraska: 3,
            Idaho: 3,
            SouthDakota: 3,
            NewMexico: 3,
            Florida: 3,
            Pennsylvania: 3,
            Minnesota: 3,
            Virginia: 3,
            Utah: 3,
            Wyoming: 3,
            NorthDakota: 3,
            SouthCarolina: 3,
            International: 3,
            Louisiana: 3,
            Kentucky: 3,
            Nevada: 3,
        },
        tier3: {
            Montana: 5, 
            Colorado: 5,
            NewYork: 5,
            Washington: 5,
            Maine: 5,
            Oregon: 5,
            Vermont: 5,
            NewJersey: 5,
            NewHampshire: 5,
            Maryland: 5,
            RhodeIsland: 5,
            Connecticut: 5,
            Massachusetts: 5,
            Hawaii: 5,
            California: 5,
            Alaska: 5,
            DistrictOfColumbia: 5,
            Delaware: 5,
            Arizona: 5,
        },
    };

    // Load from session storage or use default
    const [costOfLiving, setCostOfLiving] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('costOfLiving');
            return saved ? JSON.parse(saved) : defaultCostOfLiving;
        }
        return defaultCostOfLiving;
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showScale && !event.target.closest('.scale-dropdown')) {
                setShowScale(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showScale]);

    // Save to session storage whenever costOfLiving changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('costOfLiving', JSON.stringify(costOfLiving));
        }
    }, [costOfLiving]);

    // Function to move state to different tier
    const moveStateToTier = (stateName, newTier) => {
        const tierValues = { 1: 1, 2: 3, 3: 5 };
        const newValue = tierValues[newTier];
        
        // Remove from all tiers first
        const updatedCostOfLiving = {
            tier1: { ...costOfLiving.tier1 },
            tier2: { ...costOfLiving.tier2 },
            tier3: { ...costOfLiving.tier3 }
        };
        
        delete updatedCostOfLiving.tier1[stateName];
        delete updatedCostOfLiving.tier2[stateName];
        delete updatedCostOfLiving.tier3[stateName];
        
        // Add to new tier
        updatedCostOfLiving[`tier${newTier}`][stateName] = newValue;
        
        setCostOfLiving(updatedCostOfLiving);
    };

    // Function to check if tier is empty and collapse it
    const isTierEmpty = (tier) => {
        return Object.keys(costOfLiving[tier]).length === 0;
    };

    // Function to reset all scales to default values
    const handleReset = async () => {
        setFafsaScale({
            very_high_need: 5,
            high_need: 4,
            moderate_need: 3,
            low_need: 2,
            no_need: 0,
        });
        setPaid({
            paid: 4,
            unpaid: 5,
        });
        setInternshipType({
            in_person: 5,
            hybrid: 4,
            virtual: 0,
        });
        setCostOfLiving(defaultCostOfLiving);
        
        // Clear session storage
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('costOfLiving');
        }
        
        setSuccessMessage("Scale reset to default values");
        setTimeout(() => setSuccessMessage(""), 3000);

        // Call handleSubmit without event parameter
        const currentScale = {
            fafsa_scale: {
                very_high_need: fafsaScale.very_high_need,
                high_need: fafsaScale.high_need,
                moderate_need: fafsaScale.moderate_need,
                low_need: fafsaScale.low_need,
                no_need: fafsaScale.no_need
            },
            paid: paid,
            internship_type: {
                in_person: internshipType.in_person,
                hybrid: internshipType.hybrid,
                virtual: internshipType.virtual
            },
            cost_of_living: costOfLiving
        };

        console.log({scale: currentScale});

        // Update the context
        updateScale(currentScale);

        try {
            const response = await fetch("/api/scale", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({scale: currentScale}),
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log("API Response:", result.result);
                setSuccessMessage("Scale saved successfully");
                setTimeout(()=> setSuccessMessage(""), 3000);
                setShowScale(false);
            } else {
                console.error("API Error:", response.status);
                alert("Error connecting to API");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Error connecting to API");
        }
        setShowScale(false);
    };

    if (!isMounted) {
        return (
            <div className="flex flex-col gap-4 border-2 border-black rounded-md p-5 min-w-fit"> 
                <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    // click to open  and close scale dropdown
    const handleCategoryClick = (category) => {
        // close all categories
        setShowFAFSA(false);
        setShowPaid(false);
        setShowInternshipType(false);
        setShowCostOfLiving(false);
        setShowTier1(false);
        setShowTier2(false);
        setShowTier3(false);

        //toggle the clicked category
        switch (category) {
            case 'fafsa':
                setShowFAFSA(!showFAFSA);
                break;
            case 'paid':
                setShowPaid(!showPaid);
                break;
            case 'internshipType':
                setShowInternshipType(!showInternshipType);
                break;
            case 'costOfLiving':
                setShowCostOfLiving(!showCostOfLiving);
                break;
        }
    }

    // Submit Function
    const handleSubmit = async (e) => {
        e.preventDefault();

        setShowFAFSA(false);
        setShowPaid(false);
        setShowInternshipType(false);
        setShowCostOfLiving(false);
        setShowTier1(false);
        setShowTier2(false);
        setShowTier3(false);
        setShowCostOfLivingInput(false);
        setShowCostOfLivingInput2(false);
        setShowCostOfLivingInput3(false);

        const currentScale = {
            fafsa_scale: {
                very_high_need: fafsaScale.very_high_need,
                high_need: fafsaScale.high_need,
                moderate_need: fafsaScale.moderate_need,
                low_need: fafsaScale.low_need,
                no_need: fafsaScale.no_need
            },
            paid: paid,
            internship_type: {
                in_person: internshipType.in_person,
                hybrid: internshipType.hybrid,
                virtual: internshipType.virtual
            },
            cost_of_living: costOfLiving
        };

        console.log({scale: currentScale});

        // Update the context
        updateScale(currentScale);

        try {
            const response = await fetch("/api/scale", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({scale: currentScale}),
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log("API Response:", result.result);
                setSuccessMessage("Scale saved successfully");
                setTimeout(()=> setSuccessMessage(""), 3000);
                setShowScale(false);
            } else {
                console.error("API Error:", response.status);
                alert("Error connecting to API");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Error connecting to API");
        }
    }

    return (
        <div className="flex flex-col gap-4 justify-center w-full h-full relative scale-dropdown hover:bg-gray-100">
            <div className="flex flex-row gap-4 border-2 border-black rounded-md p-2 w-full h-full"> 
                <button className="hover:cursor-pointer flex items-center justify-between w-full" type="button" onClick={() => setShowScale(!showScale)}>
                    <h2 className="text-xl font-bold">Set Your Scale</h2>
                    <svg 
                        className={`w-6 h-6 transition-transform ${showScale ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                {showScale && (
                    <div className="absolute top-full left-0 right-0 -translate-x-1/3 z-50 min-w-170 rounded-md bg-white border-2 border-black p-4 shadow-lg">
                        <form className="flex flex-col gap-4 justify-center" onSubmit={(e) => e.preventDefault()}>
                            <div className="flex flex-row gap-4 justify-center">
                                {/* FAFSA */}
                                <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2 flex items-center justify-between" type="button" onClick={() => handleCategoryClick('fafsa')}>
                                    <span>FAFSA</span>
                                    <svg 
                                        className={`w-4 h-4 transition-transform ${showFAFSA ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {/* Paid or Unpaid */}
                                <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2 flex items-center justify-between" type="button" onClick={() => handleCategoryClick('paid')}>
                                    <span>Paid or Unpaid</span>
                                    <svg 
                                        className={`w-4 h-4 transition-transform ${showPaid ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {/* In-Person or Remote */}
                                <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2 flex items-center justify-between" type="button" onClick={() => handleCategoryClick('internshipType')}>
                                    <span>In-Person or Remote</span>
                                    <svg 
                                        className={`w-4 h-4 transition-transform ${showInternshipType ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {/* Cost of Living */}
                                <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2 flex items-center justify-between" type="button" onClick={() => handleCategoryClick('costOfLiving')}>
                                    <span>Cost of Living</span>
                                    <svg 
                                        className={`w-4 h-4 transition-transform ${showCostOfLiving ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* FAFSA Details */}
                            {showFAFSA && (
                                <div className="flex flex-col justify-center gap-4 border-2 border-black rounded-md p-2 mx-auto">
                                    <div className="flex flex-row gap-4 justify-between items-center">
                                        <label htmlFor="Very High Need (VHN"> Very High Need (VHN)</label>
                                        <input className="border-2 border-black rounded-md p-2" type="number" placeholder="5" min="0" max="5" 
                                            value={fafsaScale.veryHighNeed} 
                                            onChange={(e) => setFafsaScale({
                                                ...fafsaScale, // Default value
                                                veryHighNeed: parseInt(e.target.value) || 0 // New value
                                            })} 
                                        />
                                    </div>
                                    <hr className="border-2 border-black w-full h-px" />
                                    <div className="flex flex-row gap-4 justify-between items-center">
                                        <label htmlFor="FAFSA">High Need (HN)</label>
                                        <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" 
                                            value={fafsaScale.highNeed} 
                                            onChange={(e) => setFafsaScale({
                                                ...fafsaScale, // Default value
                                                highNeed: parseInt(e.target.value) || 0 // New value
                                            })} 
                                        />
                                    </div>
                                    <hr className="border-2 border-black w-full" />
                                    <div className="flex flex-row gap-4 justify-between items-center">
                                        <label htmlFor="FAFSA">Moderate Need (MH)</label>
                                        <input className="border-2 border-black rounded-md p-2" type="number" placeholder="3" min="0" max="5" 
                                            value={fafsaScale.moderateNeed} 
                                            onChange={(e) => setFafsaScale({
                                                ...fafsaScale, // Default value
                                                moderateNeed: parseInt(e.target.value) || 0 // New value
                                            })} 
                                        />
                                    </div>
                                    <hr className="border-2 border-black w-full" />
                                    <div className="flex flex-row gap-4 justify-between items-center">
                                        <label htmlFor="FAFSA">Low Need (LN)</label>
                                        <input className="border-2 border-black rounded-md p-2" type="number" placeholder="2" min="0" max="5" 
                                            value={fafsaScale.lowNeed} 
                                            onChange={(e) => setFafsaScale({
                                                ...fafsaScale, // Default value
                                                lowNeed: parseInt(e.target.value) || 0 // New value
                                            })} 
                                        />
                                    </div>
                                    <hr className="border-2 border-black w-full" />
                                    <div className="flex flex-row gap-4 justify-between items-center">
                                        <label htmlFor="FAFSA">No Need (LN)</label>
                                        <input className="border-2 border-black rounded-md p-2" type="number" placeholder="0" min="0" max="5" 
                                            value={fafsaScale.noNeed} 
                                            onChange={(e) => setFafsaScale({
                                                ...fafsaScale, // Default value
                                                noNeed: parseInt(e.target.value) || 0 // New value
                                            })} 
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* Paid/Unpaid Details */}
                            {showPaid && (
                                <div className="flex flex-col justify-center gap-4 border-2 border-black rounded-md p-2 mx-auto">
                                    <div className="flex flex-row gap-4 justify-between items-center">
                                        <label htmlFor="Paid?">Paid</label>
                                        <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5"
                                            value={paid.paid}
                                            onChange={(e) => setPaid({
                                                ...paid, // Default value
                                                paid: parseInt(e.target.value) || 0 // New value
                                            })} 
                                        />
                                    </div>
                                    <hr className="border-2 border-black w-full h-px" />
                                    <div className="flex flex-row gap-4 justify-between items-center">
                                        <label htmlFor="Paid?">Unpaid</label>
                                        <input className="border-2 border-black rounded-md p-2" type="number" placeholder="5" min="0" max="5"
                                            value={paid.unpaid}
                                            onChange={(e) => setPaid({
                                                ...paid, // Default value
                                                unpaid: parseInt(e.target.value) || 0  // New value
                                            })} 
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* Internship Type Details */}
                            {showInternshipType && (
                                <div className="flex flex-col justify-center gap-4 border-2 border-black rounded-md p-2 mx-auto">
                                    <div className="flex flex-row gap-4 justify-between items-center">
                                        <label htmlFor="Internship Type">In-Person</label>
                                        <input className="border-2 border-black rounded-md p-2" type="number" placeholder="5" min="0" max="5"
                                            value={internshipType.inPerson}
                                            onChange={(e) => setInternshipType({
                                                ...internshipType, // Default value
                                                inPerson: parseInt(e.target.value) || 0 // New value
                                            })} 
                                        />
                                    </div>
                                    <hr className="border-2 border-black w-full h-px" />
                                    <div className="flex flex-row gap-4 justify-between items-center">
                                        <label htmlFor="Internship Type">Hybrid</label>
                                        <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5"
                                            value={internshipType.hybrid}
                                            onChange={(e) => setInternshipType({
                                                ...internshipType, // Default value
                                                hybrid: parseInt(e.target.value) || 0 // New value
                                            })} 
                                        />
                                    </div>
                                    <hr className="border-2 border-black w-full h-px" />
                                    <div className="flex flex-row gap-4 justify-between items-center">
                                        <label htmlFor="Internship Type">Virtual</label>
                                        <input className="border-2 border-black rounded-md p-2" type="number" placeholder="0" min="0" max="5" 
                                            value={internshipType.virtual}
                                            onChange={(e) => setInternshipType({
                                                ...internshipType, // Default value
                                                virtual: parseInt(e.target.value) || 0 // New value
                                            })} 
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* Cost of Living Details */}
                            {showCostOfLiving && (
                                <div className="flex flex-row gap-4 mx-auto">
                                    {/* Tier 1 */}
                                    {!isTierEmpty('tier1') && (
                                        <div className="flex flex-col gap-4">
                                            <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2 flex items-center justify-between" type="button" onClick={() => setShowTier1(!showTier1)}>
                                                <span>Tier 1</span>
                                                <svg 
                                                    className={`w-4 h-4 transition-transform ${showTier1 ? 'rotate-180' : ''}`} 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {showTier1 && (
                                            <div className="flex flex-col gap-4">
                                                <div className="overflow-y-auto max-h-72">
                                                    {Object.keys(costOfLiving.tier1).map((state) => (
                                                        <div key={state} className="flex flex-row gap-4 justify-between items-center h-10">
                                                            <label htmlFor="Cost of Living">{state}</label>
                                                            {showCostOfLivingInput && (
                                                                <select 
                                                                    className="border-2 border-black rounded-md p-2" 
                                                                    value={1}
                                                                    onChange={(e) => {
                                                                        e.preventDefault();
                                                                        moveStateToTier(state, parseInt(e.target.value));
                                                                    }}
                                                                >
                                                                    <option value={1}>Tier 1</option>
                                                                    <option value={2}>Tier 2</option>
                                                                    <option value={3}>Tier 3</option>
                                                                </select>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2" type="button" 
                                                    onClick={() => setShowCostOfLivingInput(!showCostOfLivingInput)}>
                                                    {showCostOfLivingInput ? "Save Tier 1" : "Edit Tier 1"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    )}

                                    {/* Tier 2 */}
                                    {!isTierEmpty('tier2') && (
                                        <div className="flex flex-col gap-4">
                                            <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2 flex items-center justify-between" type="button" onClick={() => setShowTier2(!showTier2)}>
                                                <span>Tier 2</span>
                                                <svg 
                                                    className={`w-4 h-4 transition-transform ${showTier2 ? 'rotate-180' : ''}`} 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        {showTier2 && (
                                            <div className="flex flex-col gap-4">
                                                <div className="overflow-y-auto max-h-72">
                                                    {Object.keys(costOfLiving.tier2).map((state) => (
                                                        <div key={state} className="flex flex-row gap-4 justify-between items-center h-10">
                                                            <label htmlFor="Cost of Living">{state}</label>
                                                            {showCostOfLivingInput2 && (
                                                                <select 
                                                                    className="border-2 border-black rounded-md p-2"
                                                                    value={2}
                                                                    onChange={(e) => {
                                                                        e.preventDefault();
                                                                        moveStateToTier(state, parseInt(e.target.value));
                                                                    }}
                                                                >
                                                                    <option value={1}>Tier 1</option>
                                                                    <option value={2}>Tier 2</option>
                                                                    <option value={3}>Tier 3</option>
                                                                </select>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2"
                                                    onClick={() => setShowCostOfLivingInput2(!showCostOfLivingInput2)}>
                                                    {showCostOfLivingInput2 ? "Save Tier 2" : "Edit Tier 2"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    )}

                                    {/* Tier 3 */}
                                    {!isTierEmpty('tier3') && (
                                        <div className="flex flex-col gap-4">
                                            <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2 flex items-center justify-between" type="button" onClick={() => setShowTier3(!showTier3)}>
                                                <span>Tier 3</span>
                                                <svg 
                                                    className={`w-4 h-4 transition-transform ${showTier3 ? 'rotate-180' : ''}`} 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        {showTier3 && (
                                            <div className="flex flex-col gap-4">
                                                <div className="overflow-y-auto max-h-72">
                                                    {Object.keys(costOfLiving.tier3).map((state) => (
                                                        <div key={state} className="flex flex-row gap-4 justify-between items-center h-10">
                                                            <label htmlFor="Cost of Living">{state}</label>
                                                            {showCostOfLivingInput3 && (
                                                                <select 
                                                                    className="border-2 border-black rounded-md p-2"
                                                                    value={3}
                                                                    onChange={(e) => {
                                                                        e.preventDefault();
                                                                        moveStateToTier(state, parseInt(e.target.value));
                                                                    }}
                                                                >
                                                                    <option value={1}>Tier 1</option>
                                                                    <option value={2}>Tier 2</option>
                                                                    <option value={3}>Tier 3</option>
                                                                </select>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button className="border-2 border-black rounded-md p-2" onClick={() => setShowCostOfLivingInput3(!showCostOfLivingInput3)}>
                                                    {showCostOfLivingInput3? "Save Tier 3" : " Edit Tier 3"}
                                                </button>
                                            </div>
                                        )} 
                                    </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="flex gap-2 justify-center">
                                <button className="bg-green-600 text-white hover:bg-green-700 rounded-md p-2" type="submit" onClick={handleSubmit}>Save</button>
                                <button className="bg-red-600 text-white hover:bg-red-700 rounded-md p-2" type="button" onClick={handleReset}>Reset to Default</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
            {/* {successMessage && (
                <div className="flex justify-center border border-green-200 rounded-md p-3 bg-green-50">
                    <p className="text-green-600 text-sm">{successMessage}</p>
                </div>
            )} */}
        </div>
    )
}