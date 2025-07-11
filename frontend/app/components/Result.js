"use client";
import { useState, useEffect } from "react";
import { useScale } from "../context/ScaleContext";

export default function Result() {
    const { scale } = useScale();
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState(null);

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
            // First, get the current file info
            // console.log("Fetching file info...");
            const fileResponse = await fetch('http://localhost:8000/api/file');
            const fileData = await fileResponse.json();
            // console.log("File data:", fileData);
            
            if (!fileData.file) {
                console.log("No file found");
                setError("No file uploaded yet. Please upload a CSV file first.");
                return;
            }
            
            // Now extract data from the uploaded file
            // console.log("Extracting data from file:", fileData.file.name);
            const extractResponse = await fetch('http://localhost:8000/api/extract', {
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

    if (!isMounted) {
        // console.log("Not mounted yet, returning null");
        return null;
    }

    return (
        <div>
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-center">Results</h2>
                <button 
                    onClick={handleRefresh}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                    Refresh
                </button>
            </div>
            
            <div className="space-y-2">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                        <p className="mt-2">Loading...</p>
                    </div>
                )}

                {error && (
                    <div className="text-red-600 text-center">
                        Error: {error}
                    </div>
                )}
                
                {!isLoading && !error && extractedData && (
                    <div className="text-center flex flex-col items-center justify-center">
                        <div className="flex flex-row justify-left items-center gap-4">
                            <p className="text-green-600 font-semibold">Data extracted successfully!</p>
                            <p>Total records: {extractedData.total_records}</p>
                        </div>
                        
                        {/* Student Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-100 border-2 border-gray-300 rounded-md p-2">
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
                                
                                return (
                                    <div 
                                        key={index} 
                                        className={`flex flex-col justify-left items-start border p-2 m-2 rounded bg-white gap-1 ${
                                            invalidFields.length > 0 
                                                ? 'border-red-200 border-2' 
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <h3 className="text-lg font-bold"><span className={invalidFields.includes('name') ? 'bg-red-200 px-1 rounded' : ''}>{item.name || 'N/A'}</span></h3>
                                        <div className="flex flex-row justify-left rounded-md items-start gap-1 w-full">
                                            <div className="flex flex-col justify-left gap-2 items-start text-sm rounded-md p-2">
                                                <h2 className="text-[16px] font-bold  ">Eligibility</h2>
                                                <p>School Year: <span className={`font-semibold ${invalidFields.includes('school_year') ? 'bg-red-200 px-1 rounded' : ''}`}>{item.school_year || 'N/A'}</span></p>
                                                <p>Accepted Internship: <span className={`font-semibold ${invalidFields.includes('accepted_internship') ? 'bg-red-200 px-1 rounded' : ''}`}>{item.accepted_internship || 'N/A'}</span></p>
                                                <p>Additional Funding: <span className={`font-semibold ${invalidFields.includes('additional_funding') ? 'bg-red-200 px-1 rounded' : ''}`}>{item.additional_funding || 'N/A'}</span></p>
                                                <p>Internship Length: <span className={`font-semibold ${invalidFields.includes('internship_length') ? 'bg-red-200 px-1 rounded' : ''}`}>{`${Math.ceil((new Date(item.end_date) - new Date(item.start_date)) / (1000 * 60 * 60 * 24 * 7))} weeks`}</span></p>
                                                <p>Hours: <span className={`font-semibold ${invalidFields.includes('hours') ? 'bg-red-200 px-1 rounded' : ''}`}>{item.hours || 'N/A'}</span></p>
                                            </div>
                                            <div className="flex flex-col justify-left items-start rounded-md p-2 w-1/2 ">
                                                <h2 className="text-[16px] font-bold ">Scores</h2>
                                                <table className="w-full border-collapse">
                                                    <tbody>
                                                        {/* Location */}
                                                        <tr className="border-b">            
                                                            <td className="text-sm text-left border-r">
                                                                <span className={invalidFields.includes('location') ? 'bg-red-200 px-1 rounded' : ''}>{item.location || 'N/A'}</span>
                                                            </td>
                                                                                                                         <td className="text-sm text-right py-1">{item.score_breakdown.location !== undefined ? item.score_breakdown.location : 'N/A'}</td>
                                                        </tr>
                                                        {/* Need Level */}
                                                        <tr className="border-b">
                                                            <td className="text-sm text-left border-r">
                                                                <span className={invalidFields.includes('need_level') ? 'bg-red-200 px-1 rounded' : ''}>{item.need_level || 'N/A'}</span>
                                                            </td>
                                                                                                                         <td className="text-sm text-right py-1">{item.score_breakdown.need_level !== undefined ? item.score_breakdown.need_level : 'N/A'}</td>
                                                        </tr>
                                                        {/* Internship Type */}
                                                        <tr className="border-b">
                                                            <td className="text-sm text-left border-r">
                                                                <span className={invalidFields.includes('internship_type') ? 'bg-red-200 px-1 rounded' : ''}>{item.internship_type || 'N/A'}</span>
                                                            </td>
                                                                                                                         <td className="text-sm text-right py-1">{item.score_breakdown.internship_type !== undefined ? item.score_breakdown.internship_type : 'N/A'}</td>
                                                        </tr>
                                                        {/* Paid Internship */}
                                                        <tr className="border-b">
                                                            <td className="text-sm text-left border-r">
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
                                        {/* <p><strong>School Year:</strong> <span className={invalidFields.includes('school_year') ? 'bg-red-200 px-1 rounded' : ''}>{item.school_year || 'N/A'}</span></p>
                                        <p><strong>Accepted Internship:</strong> <span className={invalidFields.includes('accepted_internship') ? 'bg-red-200 px-1 rounded' : ''}>{item.accepted_internship || 'N/A'}</span></p>
                                        <p><strong>Additional Funding:</strong> <span className={invalidFields.includes('additional_funding') ? 'bg-red-200 px-1 rounded' : ''}>{item.additional_funding || 'N/A'}</span></p>
                                        <p><strong>Location:</strong> <span className={invalidFields.includes('location') ? 'bg-red-200 px-1 rounded' : ''}>{item.location || 'N/A'}</span></p>
                                        <p><strong>Need Level:</strong> <span className={invalidFields.includes('need_level') ? 'bg-red-200 px-1 rounded' : ''}>{item.need_level || 'N/A'}</span></p>
                                        <p><strong>Internship Type:</strong> <span className={invalidFields.includes('internship_type') ? 'bg-red-200 px-1 rounded' : ''}>{item.internship_type || 'N/A'}</span></p>
                                        <p><strong>Hours:</strong> <span className={invalidFields.includes('hours') ? 'bg-red-200 px-1 rounded' : ''}>{item.hours || 'N/A'}</span></p> */}
                                    </div>

                                );
                            })}
                        </div>

                        {extractedData.warnings && extractedData.warnings.length > 0 && (
                            <div className="mt-2">
                                <p className="text-yellow-600 font-semibold">Warnings:</p>
                                <ul className="text-sm text-yellow-600">
                                    {extractedData.warnings.map((warning, index) => (
                                        <li key={index}>{warning}</li>
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