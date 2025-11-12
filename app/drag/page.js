"use client";
import { useState } from "react";
import { 
    DndContext, 
    useDroppable, 
    useDraggable,
    useSensor,
    useSensors,
    PointerSensor,
    closestCenter,
} from "@dnd-kit/core";

const COL_tiers = [
    {id: 1, title: "Tier 1"},
    {id: 2, title: "Tier 2"},
    {id: 3, title: "Tier 3"},
]

const COL_states = [
    {
        id: 1, 
        title: "Alabama",
        tier: 1,
    },
    {
        id: 2, 
        title: "Alaska",
        tier: 2,
    },
    {
        id: 3, 
        title: "Arizona",
        tier: 2,
    },
    {
        id: 4, 
        title: "Arkansas",
        tier: 3,
    },
    {
        id: 5, 
        title: "California",
        tier: 1,
    },
]

function DraggableState({ state }) {
    const {
        attributes,   
        listeners,      
        setNodeRef,      
        transform,       
        isDragging   
    } = useDraggable({
        id: state.id,
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
            className="hover:cursor-grab active:cursor-grabbing hover:bg-gray-200 rounded-md p-2 mb-2"
        >
            {state.title}
        </div>
    )
}

function DroppableTier({ tier, states }) {
    const {
        setNodeRef,
        isOver
    } = useDroppable({
        id: tier.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`border-x-2 border-black p-2 min-w-[200px] ${
                isOver ? 'bg-blue-100' : ''
            }`}
        >
            <h1 className="text-lg font-bold mb-2">{tier.title}</h1>
            {states.map((state) =>
                <DraggableState key={state.id} state={state} />
            )}
        </div>
    )
}
export default function Drag() {    
    const [states, setStates] = useState(COL_states);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );
    
    return (
        <div className="flex justify-center items-center h-screen p-4">
            <div className="flex flex-row gap-4 text-center">
                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    {COL_tiers.map((tier) => {
                        const tierStates = states.filter(
                            (state) => state.tier === tier.id
                        );
                        return (
                            <DroppableTier
                                key={tier.id}
                                tier={tier}
                                states={tierStates}
                            />
                        );
                    })}             
                </DndContext>
            </div>
        </div>
    )
}