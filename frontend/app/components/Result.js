"use client";
import { useState, useEffect } from "react";
import { useScale } from "../context/ScaleContext";

export default function Result() {
    const { scale } = useScale();
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState(null);
    const [openStudents, setOpenStudents] = useState(new Set());

    // Function to format state names with spaces for display
    const formatStateName = (stateName) => {
        if (!stateName || stateName === 'N/A' || stateName === 'Unknown') {
            return stateName;
        }
        
        // Add spaces before capital letters (except the first character)
        return stateName.replace(/([A-Z])/g, ' $1').trim();
    };

    useEffect(() => {
        // console.log("Component mounted, starting fetch...");
        setIsMounted(true);
        fetchExtractedData();
        
        // Listen for file upload events
        const handleFileUploaded = () => {
            console.log("File uploaded, refreshing data...");
            fetchExtractedData();
        };
        
        window.addEventListener('fileUploaded', handleFileUploaded);
        
        // Cleanup event listener
        return () => {
            window.removeEventListener('fileUploaded', handleFileUploaded);
        };
    }, []);

    // Load extracted data
    const fetchExtractedData = async () => {
        // console.log("Starting fetchExtractedData...");
        setIsLoading(true);
        setError(null);
        
        try {
            // Add artificial delay for testing loading state
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
            
            // First, get the current file info
            // console.log("Fetching file info...");
            const fileResponse = await fetch('/api/file');
            const fileData = await fileResponse.json();
            // console.log("File data:", fileData);
            
            if (!fileData.file) {
                console.log("No file found");
                setError("No file uploaded yet. Please upload a CSV file first.");
                return;
            }
            
            // Now extract data from the uploaded file
            // console.log("Extracting data from file:", fileData.file.name);
            const extractResponse = await fetch('/api/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_name: fileData.file.name,
                    scale: scale
                })
            });
            
            if (!extractResponse.ok) {
                throw new Error(`HTTP error! status: ${extractResponse.status}`);
            }
            
            const data = await extractResponse.json();
            console.log("Extracted data:", data);
            setExtractedData(data);
            
        } catch (error) {
            console.error("Yikes, data was not fetched...", error);
            setError(error.message);
        } finally {
            // console.log("Setting loading to false");
            setIsLoading(false);
        }
    }

    const handleRefresh = () => {
        fetchExtractedData();
    };

    const handleStudentClick = (studentId) => {
        setOpenStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    if (!isMounted) {
        // console.log("Not mounted yet, returning null");
        return null;
    }

    return (
        <div>
            <div className="flex justify-between items-center">
                <div className="flex flex-row justify-left items-center gap-4 p-2">
                    <h2 className="text-xl font-bold text-center">Results</h2>
                    {!isLoading && !error && extractedData && (
                        <p className="text-sm">Total Students: {extractedData.total_records} </p>
                    )}
                    {isLoading && (
                        <div className="flex flex-row justify-left items-center gap-4 p-2">
                            <p className="text-sm">Loading...</p>
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleRefresh}
                    className="px-3 py-1 bg-green-100 rounded hover:bg-green-200 text-sm hover:cursor-pointer"
                >
                    Refresh for a different scale
                </button>
            </div>
            
            <div className="space-y-2">
                {isLoading && (
                    <div className="flex flex-wrap gap-4 w-full p-5">   
                        {Array.from({ length: 50 }).map((_, index) => (
                            <div key={index} className="flex flex-col justify-left items-start p-2 m-2 rounded bg-white gap-1 shadow-md min-w-80 w-80 h-fit">
                                <div className="flex flex-row justify-between items-center w-full">
                                    <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="text-red-600 text-center">
                        Error: {error}
                    </div>
                )}
                
                {!isLoading && !error && extractedData && (
                    <div className="text-center flex flex-col items-center justify-center rounded-md p-2">
                        {/* Student Data */}
                        <div className="flex flex-wrap gap-4 overflow-y-auto max-h-[calc(100vh/1.5)] rounded-md p-2">
                            {extractedData.data.map((item, index) => {
                                // Check for invalid elements using warnings from backend
                                const getInvalidFields = () => {
                                    if (!extractedData.warnings) return [];
                                    
                                    const invalidFields = [];
                                    extractedData.warnings.forEach(warning => {
                                        // Parse warning to extract field name and invalid values
                                        // Warning format: "Invalid field_name values: [value1, value2, ...]"
                                        const match = warning.match(/Invalid (\w+) values: \[(.*)\]/);
                                        if (match) {
                                            const fieldName = match[1];
                                            const invalidValuesStr = match[2];
                                            // Parse the invalid values list and convert to lowercase
                                            const invalidValues = invalidValuesStr
                                                .split(',')
                                                .map(val => val.trim().replace(/['"]/g, '').toLowerCase())
                                                .filter(val => val.length > 0);
                                            
                                            // Check if this student's value for this field is in the invalid list (case insensitive)
                                            const studentValue = item[fieldName];
                                            if (studentValue && invalidValues.includes(studentValue.toString().toLowerCase())) {
                                                invalidFields.push(fieldName);
                                            }
                                        }
                                    });
                                    return [...new Set(invalidFields)]; // Remove duplicates
                                };
                                
                                const invalidFields = getInvalidFields();
                                const isOpen = openStudents.has(index);
                                
                                return (
                                    <div 
                                        key={index} 
                                        className={`flex flex-col justify-left items-start p-2 m-2 rounded bg-white gap-1 shadow-md cursor-pointer hover:bg-gray-50 min-w-100
                                            ${invalidFields.length > 0 ? 'border-2 border-red-200 border-dashed rounded-md' : ''}
                                            `}
                                        onClick={() => handleStudentClick(index)}
                                    >
                                        <div className="flex flex-row justify-between items-center w-full">
                                            <h3 className="text-lg font-bold"><span className={invalidFields.includes('name') ? 'bg-red-200 px-1 rounded' : ''}>{item.name || 'N/A'}</span></h3>
                                            <span className={`text-lg font-bold px-2 py-1 rounded ${item.score > 14 ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {item.score}
                                            </span>
                                        </div>

                                        {/* Breakdown */}
                                        <div className={`flex flex-row justify-left rounded-md items-start gap-1 w-full ${isOpen ? 'flex' : 'hidden'}`}>
                                            <div className="flex flex-col justify-left gap-2 items-start text-sm rounded-md p-2">
                                                {/* Eligibility */}
                                                <h2 className="text-[16px] font-bold  ">Eligibility</h2>
                                                <p>School Year: <span className={`font-semibold ${invalidFields.includes('school_year') ? 'bg-red-200 px-1 rounded' : ''}`}>{item.school_year || 'N/A'}</span></p>
                                                <p>Accepted Internship: <span className={`font-semibold ${invalidFields.includes('accepted_internship') ? 'bg-red-200 px-1 rounded' : ''}`}>{item.accepted_internship || 'N/A'}</span></p>
                                                <p>Additional Funding: <span className={`font-semibold ${invalidFields.includes('additional_funding') ? 'bg-red-200 px-1 rounded' : ''}`}>{item.additional_funding || 'N/A'}</span></p>
                                                <p>Internship Length: <span className={`font-semibold ${invalidFields.includes('internship_length') ? 'bg-red-200 px-1 rounded' : ''}`}>{`${Math.ceil((new Date(item.end_date) - new Date(item.start_date)) / (1000 * 60 * 60 * 24 * 7))} weeks`}</span></p>
                                                <p>Hours: <span className={`font-semibold ${invalidFields.includes('hours') ? 'bg-red-200 px-1 rounded' : ''}`}>{item.hours || 'N/A'}</span></p>
                                            </div>

                                            {/* Scores */}
                                            <div className="flex flex-col justify-center items-start rounded-md p-2">
                                                <h2 className="text-[16px] font-bold ">Scores</h2>
                                                <table className="w-full border-collapse">
                                                    <tbody>
                                                        {/* Location */}
                                                        <tr className="border-b">            
                                                            <td className="text-sm text-left border-r pr-5">
                                                                <span className={invalidFields.includes('location') ? 'bg-red-200 px-1 rounded' : ''}>{formatStateName(item.location) || 'N/A'}</span>
                                                            </td>
                                                                                                                         <td className="text-sm text-right py-1 pl-5">{item.score_breakdown.location !== undefined ? item.score_breakdown.location : 'N/A'}</td>
                                                        </tr>
                                                        {/* Need Level */}
                                                        <tr className="border-b">
                                                            <td className="text-sm text-left border-r pr-5">
                                                                <span className={invalidFields.includes('need_level') ? 'bg-red-200 px-1 rounded' : ''}>{item.need_level || 'N/A'}</span>
                                                            </td>
                                                                                                                         <td className="text-sm text-right py-1">{item.score_breakdown.need_level !== undefined ? item.score_breakdown.need_level : 'N/A'}</td>
                                                        </tr>
                                                        {/* Internship Type */}
                                                        <tr className="border-b">
                                                            <td className="text-sm text-left border-r pr-5">
                                                                <span className={invalidFields.includes('internship_type') ? 'bg-red-200 px-1 rounded' : ''}>{item.internship_type || 'N/A'}</span>
                                                            </td>
                                                                                                                         <td className="text-sm text-right py-1">{item.score_breakdown.internship_type !== undefined ? item.score_breakdown.internship_type : 'N/A'}</td>
                                                        </tr>
                                                        {/* Paid Internship */}
                                                        <tr className="border-b">
                                                            <td className="text-sm text-left border-r pr-5">
                                                                <span className={invalidFields.includes('paid_internship') ? 'bg-red-200 px-1 rounded' : ''}>{item.paid_internship || 'N/A'}</span>
                                                            </td>
                                                                                                                         <td className="text-sm text-right py-1">{item.score_breakdown.paid_internship !== undefined ? item.score_breakdown.paid_internship : 'N/A'}</td>
                                                        </tr>
                                                        <tr className="font-bold">
                                                            <td className="text-sm text-left border-r">Total</td>
                                                                                                                         <td className="text-sm text-right py-1">{item.score !== undefined ? item.score : 'N/A'}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                );
                            })}
                        </div>

                        {extractedData.warnings && extractedData.warnings.length > 0 && (
                            <div className="mt-4 text-center mx-auto w-full">
                                <span className="bg-red-100 px-1 rounded font-semibold">
                                        Sorry Jenn, I'm not sure what to do with these values so 
                                        I can't add them to the score. But don't worry, 
                                        I'll highlight the students so you can double check my work!
                                </span>
                               
                                <ul className="text-sm list-disc list-inside">
                                    {extractedData.warnings.map((warning, index) => (
                                        <li key={index}>{warning.split(':')[0].trim()}: <span className="text-red-600">{warning.split(':')[1].trim()}</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                
                {!isLoading && !error && !extractedData && (
                    <div className="text-center text-gray-500">
                        No data to display
                    </div>
                )}
            </div>
        </div>
    );
}