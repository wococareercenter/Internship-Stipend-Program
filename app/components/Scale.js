"use client";
import { useState, useEffect, useRef } from "react";
import { useScale } from "../context/ScaleContext";
import { 
    DndContext, 
    useDroppable, 
    useDraggable,
    useSensor,
    useSensors,
    PointerSensor,
    closestCenter,
} from "@dnd-kit/core";

// Draggable State Component
function DraggableState({ stateName }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging
    } = useDraggable({
        id: stateName, // Use state name as ID
    });

    const style = {
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="hover:cursor-grab active:cursor-grabbing hover:bg-gray-200 rounded-md p-1 text-sm"
        >
            {stateName}
        </div>
    );
}

// Droppable Tier Component
function DroppableTier({ tierNumber, tierTitle, states }) {
    const { setNodeRef, isOver } = useDroppable({
        id: tierNumber, // Use tier number (1, 2, or 3) as ID
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col items-center justify-center ${
                isOver ? 'bg-blue-100' : ''
            }`}
        >
            <h4 className="font-semibold text-center">{tierTitle}</h4>
            <div className="flex flex-col h-full items-center">
                {states.map((stateName) => (
                    <DraggableState key={stateName} stateName={stateName} />
                ))}
            </div>
        </div>
    );
}

export default function Scale( { onSave }) {
    // All hooks must be called at the top level, before any conditional returns
    const { scale, resetScale, defaultScale, updateScale } = useScale();

    const [isMounted, setIsMounted] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Base URL for API calls
    // Use relative URLs in production (empty string = same origin)
    // This works correctly on Vercel and avoids hardcoded domain issues
    let baseUrl = "";
    if (process.env.NODE_ENV === "development") {
        baseUrl = "http://localhost:3000";
    }

    // Input Scale variable and default value
    const [fafsaScale, setFafsaScale] = useState(defaultScale.fafsa_scale);
    const [paid, setPaid] = useState(defaultScale.paid);
    const [internshipType, setInternshipType] = useState(defaultScale.internship_type);
    const [costOfLiving, setCostOfLiving] = useState(defaultScale.cost_of_living);

    // Tier point values (editable)
    const [tierPoints, setTierPoints] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('tierPoints');
            return saved ? JSON.parse(saved) : { tier1: 1, tier2: 2, tier3: 3 };
        }
        return { tier1: 1, tier2: 2, tier3: 3 };
    });


    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Save to session storage whenever costOfLiving changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('costOfLiving', JSON.stringify(costOfLiving));
        }
    }, [costOfLiving]);

    // Save to session storage whenever tierPoints changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('tierPoints', JSON.stringify(tierPoints));
        }
    }, [tierPoints]);

    // Track previous tier points to avoid unnecessary updates
    const prevTierPointsRef = useRef(tierPoints);
    const isInitialMount = useRef(true);

    // Update all states in a tier when tier points change
    useEffect(() => {
        // Skip on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            prevTierPointsRef.current = tierPoints;
            return;
        }

        // Check if tier points actually changed
        const tier1Changed = prevTierPointsRef.current.tier1 !== tierPoints.tier1;
        const tier2Changed = prevTierPointsRef.current.tier2 !== tierPoints.tier2;
        const tier3Changed = prevTierPointsRef.current.tier3 !== tierPoints.tier3;

        if (!tier1Changed && !tier2Changed && !tier3Changed) {
            return;
        }

        // Update costOfLiving using functional update to avoid stale closure
        setCostOfLiving(prevCostOfLiving => {
            const updatedCostOfLiving = {
                tier1: { ...prevCostOfLiving.tier1 },
                tier2: { ...prevCostOfLiving.tier2 },
                tier3: { ...prevCostOfLiving.tier3 }
            };

            // Update all states in tier1 if tier1 points changed
            if (tier1Changed) {
                Object.keys(updatedCostOfLiving.tier1).forEach(state => {
                    updatedCostOfLiving.tier1[state] = tierPoints.tier1;
                });
            }

            // Update all states in tier2 if tier2 points changed
            if (tier2Changed) {
                Object.keys(updatedCostOfLiving.tier2).forEach(state => {
                    updatedCostOfLiving.tier2[state] = tierPoints.tier2;
                });
            }

            // Update all states in tier3 if tier3 points changed
            if (tier3Changed) {
                Object.keys(updatedCostOfLiving.tier3).forEach(state => {
                    updatedCostOfLiving.tier3[state] = tierPoints.tier3;
                });
            }

            return updatedCostOfLiving;
        });

        // Update ref
        prevTierPointsRef.current = tierPoints;
    }, [tierPoints.tier1, tierPoints.tier2, tierPoints.tier3]);

    // Function to move state to different tier
    const moveStateToTier = (stateName, newTier) => {
        const tierValues = { 1: tierPoints.tier1, 2: tierPoints.tier2, 3: tierPoints.tier3 };
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

    // Configure sensors for drag-and-drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px of movement before dragging starts
            },
        })
    );

    // Handle drag end event
    const handleDragEnd = (event) => {
        const { active, over } = event;
        
        if (!over) return; // If dropped outside, do nothing

        const stateName = active.id; // State name (string)
        const newTier = over.id; // Tier number (1, 2, or 3)

        // Only update if tier actually changed
        const currentTier = costOfLiving.tier1[stateName] ? 1 :
                           costOfLiving.tier2[stateName] ? 2 :
                           costOfLiving.tier3[stateName] ? 3 : null;
        
        if (currentTier === newTier) return;

        // Move state to new tier
        moveStateToTier(stateName, newTier);
    };

    // Function to check if tier is empty and collapse it
    const isTierEmpty = (tier) => {
        return Object.keys(costOfLiving[tier]).length === 0;
    };

    // Function to reset all scales to default values
    const handleReset = async () => {
        resetScale();
        setTierPoints({ tier1: 1, tier2: 2, tier3: 3 });
        
        // Clear session storage
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('costOfLiving');
            sessionStorage.removeItem('tierPoints');
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
            const response = await fetch(`${baseUrl}/api/scale`, {
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
            } else {
                console.error("API Error:", response.status);
                alert("Error connecting to API");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Error connecting to API");
        }
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

    // Submit Function
    const handleSubmit = async (e) => {
        e.preventDefault();

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
        updateScale(currentScale);

        try {
            const response = await fetch(`${baseUrl}/api/scale`, {
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

                // Close the dialog
                if (onSave) {
                    onSave();
                }
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
        <div className="w-full h-full p-4">
            <form className="flex flex-col gap-4 justify-center" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-row gap-4 justify-center">
                    {/* FAFSA */}
                    <div className="flex flex-col gap-3 border-1 border-black rounded-md p-3 w-full min-w-fit">
                        <h3 className="text-lg font-bold text-center">FAFSA</h3>
                        <hr className="border-1 border-black w-full" />
                        <div className="flex flex-row justify-between items-center gap-4">
                            <label htmlFor="Very High Need (VHN"> Very High Need (VHN)</label>
                            <input className="border-2 border-black rounded-md p-2" type="number" placeholder="12" min="0" max="15" 
                                value={fafsaScale.very_high_need} 
                                onChange={(e) => setFafsaScale({
                                    ...fafsaScale, // Default value
                                    very_high_need: parseInt(e.target.value) || 0 // New value
                                })} 
                            />
                        </div>
                        <hr className="border-0.5 border-zinc-300 w-full h-px" />
                        {/* High Need */}
                        <div className="flex flex-row justify-between items-center gap-4">
                            <label htmlFor="FAFSA">High Need (HN)</label>
                            <input className="border-2 border-black rounded-md p-2" type="number" placeholder="12" min="0" max="15" 
                                value={fafsaScale.high_need} 
                                onChange={(e) => setFafsaScale({
                                    ...fafsaScale, // Default value
                                    high_need: parseInt(e.target.value) || 0 // New value
                                })} 
                            />
                        </div>
                        <hr className="border-0.5 border-zinc-300 w-full" />
                        {/* Moderate Need */}
                        <div className="flex flex-row justify-between items-center gap-4">
                            <label htmlFor="FAFSA">Moderate Need (MH)</label>
                            <input className="border-2 border-black rounded-md p-2" type="number" placeholder="9" min="0" max="15" 
                                value={fafsaScale.moderate_need} 
                                onChange={(e) => setFafsaScale({
                                    ...fafsaScale, // Default value
                                    moderate_need: parseInt(e.target.value) || 0 // New value
                                })} 
                            />
                        </div>
                        <hr className="border-0.5 border-zinc-300 w-full" />
                        {/* Low Need */}
                        <div className="flex flex-row justify-between items-center gap-4">
                            <label htmlFor="FAFSA">Low Need (LN)</label>
                            <input className="border-2 border-black rounded-md p-2" type="number" placeholder="5" min="0" max="15" 
                                value={fafsaScale.low_need} 
                                onChange={(e) => setFafsaScale({
                                    ...fafsaScale, // Default value
                                    low_need: parseInt(e.target.value) || 0 // New value
                                })} 
                            />
                        </div>
                        <hr className="border-0.5 border-zinc-300 w-full" />
                        {/* No Need */}
                        <div className="flex flex-row justify-between items-center gap-4">
                            <label htmlFor="FAFSA">No Need (LN)</label>
                            <input className="border-2 border-black rounded-md p-2" type="number" placeholder="2" min="0" max="15" 
                                value={fafsaScale.no_need} 
                                onChange={(e) => setFafsaScale({
                                    ...fafsaScale, // Default value
                                    no_need: parseInt(e.target.value) || 0 // New value
                                })} 
                            />
                        </div>
                    </div>
                    
                    {/* <div className="flex flex-col gap-4 w-full"> */}
                        {/* Paid/Unpaid Details */}
                        <div className="flex flex-col gap-3 border-1 border-black rounded-md p-3 w-full min-w-fit">
                            <h3 className="text-lg font-bold text-center">Paid or Unpaid</h3>
                            <hr className="border-1 border-black w-full" />
                            {/* Paid */}
                            <div className="flex flex-row justify-between items-center gap-4">
                                <label htmlFor="Paid?">Paid</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="15"
                                    value={paid.paid}
                                    onChange={(e) => setPaid({
                                        ...paid, // Default value
                                        paid: parseInt(e.target.value) || 0 // New value
                                    })} 
                                />
                            </div>
                            <hr className="border-0.5 border-zinc-300 w-full" />
                            {/* Unpaid */}
                            <div className="flex flex-row justify-between items-center gap-4">
                                <label htmlFor="Paid?">Unpaid</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="6" min="0" max="15"
                                    value={paid.unpaid}
                                    onChange={(e) => setPaid({
                                        ...paid, // Default value
                                        unpaid: parseInt(e.target.value) || 0  // New value
                                    })} 
                                />
                            </div>
                        </div>
                        
                        {/* Internship Type Details */}
                        <div className="flex flex-col gap-3 border-1 border-black rounded-md p-3 w-full min-w-fit">
                            <h3 className="text-lg font-bold text-center">In-Person or Remote</h3>
                            <hr className="border-1 border-black w-full" />
                            {/* In-Person */}
                            <div className="flex flex-row justify-between items-center gap-4">
                                <label htmlFor="Internship Type">In-Person</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="3" min="0" max="15"
                                    value={internshipType.in_person}
                                    onChange={(e) => setInternshipType({
                                        ...internshipType, // Default value
                                        in_person: parseInt(e.target.value) || 0 // New value
                                    })} 
                                />
                            </div>
                                <hr className="border-0.5 border-zinc-300 w-full" />
                            {/* Hybrid */}
                            <div className="flex flex-row justify-between items-center gap-4">
                                <label htmlFor="Internship Type">Hybrid</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="1" min="0" max="15"
                                    value={internshipType.hybrid}
                                    onChange={(e) => setInternshipType({
                                        ...internshipType, // Default value
                                        hybrid: parseInt(e.target.value) || 0 // New value
                                    })} 
                                />
                            </div>
                            <hr className="border-0.5 border-zinc-300 w-full" />
                            {/* Virtual */}
                            <div className="flex flex-row justify-between items-center gap-4">
                                <label htmlFor="Internship Type">Virtual</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="0" min="0" max="15" 
                                    value={internshipType.virtual}
                                    onChange={(e) => setInternshipType({
                                        ...internshipType, // Default value
                                        virtual: parseInt(e.target.value) || 0 // New value
                                    })} 
                                />
                            </div>
                        </div>
                    {/* </div> */}

                    {/* Cost of Living Details */}
                    <div className="flex flex-col gap-3 border-1 border-black rounded-md p-3 w-full min-w-fit items-center justify-center">
                        <h3 className="text-lg font-bold text-center">Cost of Living</h3>
                        <hr className="border-1 border-black w-full" />
                        
                        {/* Tier Point Inputs */}
                        {/* <div className="flex flex-row gap-4 w-full justify-center">
                            <div className="flex flex-row items-center gap-2">
                                <label htmlFor="tier1Points" className="text-sm font-semibold">Tier 1 Points:</label>
                                <input 
                                    className="border-2 border-black rounded-md p-2 w-20" 
                                    type="number" 
                                    placeholder="1" 
                                    min="0" 
                                    max="15"
                                    value={tierPoints.tier1}
                                    onChange={(e) => setTierPoints({
                                        ...tierPoints,
                                        tier1: parseInt(e.target.value) || 0
                                    })} 
                                />
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <label htmlFor="tier2Points" className="text-sm font-semibold">Tier 2 Points:</label>
                                <input 
                                    className="border-2 border-black rounded-md p-2 w-20" 
                                    type="number" 
                                    placeholder="2" 
                                    min="0" 
                                    max="15"
                                    value={tierPoints.tier2}
                                    onChange={(e) => setTierPoints({
                                        ...tierPoints,
                                        tier2: parseInt(e.target.value) || 0
                                    })} 
                                />
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <label htmlFor="tier3Points" className="text-sm font-semibold">Tier 3 Points:</label>
                                <input 
                                    className="border-2 border-black rounded-md p-2 w-20" 
                                    type="number" 
                                    placeholder="3" 
                                    min="0" 
                                    max="15"
                                    value={tierPoints.tier3}
                                    onChange={(e) => setTierPoints({
                                        ...tierPoints,
                                        tier3: parseInt(e.target.value) || 0
                                    })} 
                                />
                            </div>
                        </div> */}

                        <DndContext 
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex flex-row gap-4">
                                <DroppableTier
                                    tierNumber={1}
                                    tierTitle={`Tier 1`}
                                    states={Object.keys(costOfLiving.tier1)}
                                />
                                <DroppableTier
                                    tierNumber={2}
                                    tierTitle={`Tier 2`}
                                    states={Object.keys(costOfLiving.tier2)}
                                />
                                <DroppableTier
                                    tierNumber={3}
                                    tierTitle={`Tier 3`}
                                    states={Object.keys(costOfLiving.tier3)}
                                />
                            </div>
                        </DndContext>
                    </div>
                </div>
                
                <div className="flex gap-2 justify-center mb-4">
                    <button className="bg-green-600 text-white hover:bg-green-700 rounded-md p-2" type="submit" onClick={handleSubmit}>Save</button>
                    <button className="bg-red-600 text-white hover:bg-red-700 rounded-md p-2" type="button" onClick={handleReset}>Reset to Default</button>
                </div>
            </form>
        </div>
)
}