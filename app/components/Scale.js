"use client";
import { useState, useEffect } from "react";

export default function Scale() {
    const [showScale, setShowScale] = useState(false);
    const [showFAFSA, setShowFAFSA] = useState(false);
    const [showPaid, setShowPaid] = useState(false);
    const [showLocation, setShowLocation] = useState(false);
    const [showCostOfLiving, setShowCostOfLiving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="flex flex-col gap-4 border-2 border-black rounded-md p-5 min-w-fit"> 
                <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 border-2 border-black rounded-md p-5 min-w-fit"> 
            <button className="hover:text-zinc-500" type="button" onClick={() => setShowScale(!showScale)}>
                <h2 className="text-2xl font-bold">Set Your Scale</h2>
            </button>
            {showScale && (
            <div className="flex flex-col gap-4 border-2 border-black rounded-md p-2 mx-auto">
                <form className="flex flex-col gap-4 justify-center max-w-md mx-auto">
                    {/* FAFSA */}
                    <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2" type="button" onClick={() => setShowFAFSA(!showFAFSA)}>
                        FAFSA
                    </button>
                    {showFAFSA && (
                        <div className="flex flex-col justify-center gap-4 border-2 border-black rounded-md p-2 mx-auto">
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Very High Need (VHN"> Very High Need (VHN)</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="5" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="FAFSA">High Need (HN)</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="FAFSA">Moderate Need (MH)</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="3" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="FAFSA">Low Need (LN)</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="2" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="FAFSA">No Need (LN)</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="0" min="0" max="5" />
                            </div>

                        </div>
                    )}
                    
                    {/* Paid or Unpaid */}
                    <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2" type="button" onClick={() => setShowPaid(!showPaid)}>
                        Paid or Unpaid
                    </button>
                    {showPaid && (
                        <div className="flex flex-col justify-center gap-4 border-2 border-black rounded-md p-2 mx-auto">
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Paid?">Paid</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Paid?">Unpaid</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="5" min="0" max="5" />
                            </div>
                        </div>
                    )}
                    
                    {/* In-Person or Remote */}
                    <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2" type="button" onClick={() => setShowLocation(!showLocation)}>
                        In-Person or Remote
                    </button>
                    {showLocation && (
                        <div className="flex flex-col justify-center gap-4 border-2 border-black rounded-md p-2 mx-auto">
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Location">In-Person</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="5" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Location">Hybrid</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Location">Virtual</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="0" min="0" max="5" />
                            </div>
                        </div>
                    )}
                    
                    {/* Cost of Living */}
                    <button className="border-2 border-black hover:bg-gray-200 rounded-md p-2" type="button" onClick={() => setShowCostOfLiving(!showCostOfLiving)}>
                        Cost of Living
                    </button>
                    {showCostOfLiving && (
                        <div className="flex flex-col gap-4 border-2 border-black rounded-md p-2 max-h-96 overflow-y-auto">
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Alabama</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="5" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Alaska</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Arizona</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Arkansas</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">California</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Colorado</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Connecticut</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Delaware</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Florida</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Georgia</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Hawaii</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Idaho</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Illinois</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Indiana</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Iowa</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Kansas</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Kentucky</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Louisiana</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Maine</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Maryland</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Massachusetts</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Michigan</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Minnesota</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Mississippi</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Missouri</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Montana</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Nebraska</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Nevada</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">New Hampshire</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">New Jersey</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">New Mexico</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">New York</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">North Carolina</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">North Dakota</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Ohio</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Oklahoma</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Oregon</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Pennsylvania</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Rhode Island</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">South Carolina</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">South Dakota</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Tennessee</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Texas</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Utah</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Vermont</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Virginia</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Washington</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">West Virginia</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Wisconsin</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <label htmlFor="Cost of Living">Wyoming</label>
                                <input className="border-2 border-black rounded-md p-2" type="number" placeholder="4" min="0" max="5" />
                            </div>
                            <hr className="border-2 border-black w-full h-px" />
                            
                        </div>  
                    )}
                    
                    <button className=" bg-green-600 text-white hover:bg-green-700 rounded-md p-2" type="submit">Save</button>
                </form>
            </div>
            )}
        </div>
    )
}