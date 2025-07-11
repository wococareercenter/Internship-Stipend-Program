"use client";
import { useState, useEffect } from "react";
import { CsvToHtmlTable } from "react-csv-to-table";

export default function Result() {
    const [currentFile, setCurrentFile] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [csvData, setCsvData] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetchCurrentFile();
        
        // Listen for file upload events
        const handleFileUploaded = (event) => {
            fetchCurrentFile();
        };
        
        window.addEventListener('fileUploaded', handleFileUploaded);
        
        // Cleanup event listener
        return () => {
            window.removeEventListener('fileUploaded', handleFileUploaded);
        };
    }, []);

    const fetchCurrentFile = async () => {
        setIsLoading(true);
        setError("");
        
        try {
            // Connect to FastAPI backend instead of Next.js API
            const response = await fetch('http://localhost:8000/api/files');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            setCurrentFile(data.file);
        } catch (err) {
            setError('Failed to load current file');
            console.error('Error fetching file:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCsvFile = async (fileName) => {
        setIsLoading(true);
        setError("");
        
        try {
            // Connect to FastAPI backend instead of Next.js API
            const response = await fetch(`http://localhost:8000/api/files/${encodeURIComponent(fileName)}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            setCsvData(data.content);
            setSelectedFile(fileName);
        } catch (err) {
            setError('Failed to load CSV file');
            console.error('Error loading CSV:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };



    const extractData = async (fileName) => {
        setIsLoading(true);
        setError("");
        
        try {
            const response = await fetch('http://localhost:8000/api/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ file_name: fileName }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Extraction Result:", result);
                setSuccessMessage("Data extracted successfully!");
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            console.error('Extract error:', error);
            setError(`Failed to extract data: ${error.message}`);
            setTimeout(() => setError(""), 5000);
        } finally {
            setIsLoading(false);
        }
    }

    

    if (!isMounted) {
        return (
            <div className="flex flex-col gap-4 border-2 border-black rounded-md p-5 w-full h-full"> 
                <h2 className="text-xl font-bold text-center">Results</h2>
                <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 border-2 border-black rounded-md p-5 w-full h-full"> 
            <h2 className="text-xl font-bold text-center">Results</h2>
            {/* File Container */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Current File</h3>
                {isLoading && !currentFile && (
                    <div className="text-center py-4">
                        <div className="text-gray-500">Loading file...</div>
                    </div>
                )}
                
                {error && (
                    <div className="border border-red-200 rounded-md p-3 bg-red-50">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}
                
                {successMessage && (
                    <div className="border border-green-200 rounded-md p-3 bg-green-50">
                        <p className="text-green-600 text-sm">{successMessage}</p>
                    </div>
                )}
                
                {!currentFile && !isLoading && (
                    <div className="text-center py-4">
                        <p className="text-gray-500">No file uploaded yet</p>
                    </div>
                )}
                
                {/* File Display */}
                {currentFile && (
                    <div 
                        className="border rounded-md transition-colors border-gray-200 hover:border-gray-300"
                    >
                        <div 
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() => {
                                if (selectedFile === currentFile.name) {
                                    // Close if already open
                                    setSelectedFile(null);
                                    setCsvData("");
                                } else {
                                    // Open this file
                                    loadCsvFile(currentFile.name);
                                }
                            }}
                        >
                            <div className="flex-1">
                                <p className="font-medium text-sm">{currentFile.name}</p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(currentFile.size)} • {formatDate(currentFile.uploadDate)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {currentFile.name.toLowerCase().endsWith('.csv') && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        CSV
                                    </span>
                                )}
                                <svg 
                                    className={`w-4 h-4 text-gray-500 transition-transform ${
                                        selectedFile === currentFile.name ? 'rotate-180' : ''
                                    }`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* CSV Preview Dropdown */}
                        {selectedFile === currentFile.name && csvData && (
                            <div className="border-t border-gray-200 bg-white">
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700">CSV Preview</h4>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFile(null);
                                                setCsvData("");
                                            }}
                                            className="text-gray-500 hover:text-gray-700 text-sm"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto overflow-y-auto  max-w-105 max-h-64">
                                        <CsvToHtmlTable 
                                            data={csvData}
                                            csvDelimiter="," 
                                            tableClassName="min-w-full border-collapse border border-gray-300 text-xs" 
                                            hasHeader={true}
                                            tableStyle={{
                                                borderCollapse: 'collapse',
                                                width: '100%',
                                                fontSize: '12px'
                                            }}
                                            headerStyle={{
                                                backgroundColor: '#f3f4f6',
                                                fontWeight: 'bold',
                                                padding: '6px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '12px'
                                            }}
                                            bodyStyle={{
                                                padding: '6px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '12px'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading State for CSV */}
                        {selectedFile === currentFile.name && isLoading && (
                            <div className="border-t border-gray-200 bg-white p-4">
                                <div className="text-center">
                                    <div className="text-gray-500 text-sm">Loading CSV preview...</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {currentFile && (
                <button 
                    className="border-2 border-zinc-100 hover:bg-zinc-200 hover:border-zinc-300 rounded-lg p-2 mx-auto transition-colors"
                    onClick={() => extractData(currentFile.name)}
                    disabled={isLoading}
                >
                    {isLoading ? 'Extracting...' : 'Extract Data'}
                </button>
            )}
        </div>
    );
}