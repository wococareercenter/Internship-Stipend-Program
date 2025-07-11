"use client";
import { useState, useEffect } from "react";

export default function Result() {
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
                    file_name: fileData.file.name
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-80">
                            {extractedData.data.map((item, index) => (
                                <div key={index} className="border p-2 m-2 rounded">
                                    <p><strong>Name:</strong> {item.name || 'N/A'}</p>
                                    <p><strong>School Year:</strong> {item.school_year || 'N/A'}</p>
                                    <p><strong>Location:</strong> {item.location || 'N/A'}</p>
                                    <p><strong>Need Level:</strong> {item.need_level || 'N/A'}</p>
                                    <p><strong>Internship Type:</strong> {item.internship_type || 'N/A'}</p>
                                    <p><strong>Hours:</strong> {item.hours || 'N/A'}</p>
                                </div>
                            ))}
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