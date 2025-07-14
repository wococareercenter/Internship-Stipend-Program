"use client";
import { useState, useEffect } from "react";
import { CsvToHtmlTable } from "react-csv-to-table";

export default function File() {
    const [currentFile, setCurrentFile] = useState(null);
    const [showFile, setShowFile] = useState(false);
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

    // Fetch the current file
    const fetchCurrentFile = async () => {
        setIsLoading(true);
        setError("");
        
        try {
            const response = await fetch('/api/file');
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

    // Load the CSV file
    const loadCsvFile = async (fileName) => {
        setIsLoading(true);
        setError("");
        
        try {
            const response = await fetch('/api/file');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data.content) {
                setCsvData(data.content);
                setSelectedFile(fileName);
            } else {
                setError('No CSV content available');
            }
        } catch (err) {
            setError('Failed to load CSV file');
            console.error('Error loading CSV:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Format the file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format the date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    // Loading state
    if (!isMounted) {
        return (
            <div className="flex flex-col gap-4 border-2 border-black rounded-md p-5 w-full h-full"> 
                <h2 className="text-xl font-bold text-center">Current File</h2>
                <div className="flex items-center justify-center">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 border-2 border-black rounded-md p-3 w-full h-full flex-shrink-0 hover:bg-gray-50 cursor-pointer relative"> 
            <button className="hover:cursor-pointer flex items-center justify-between w-full" type="button" onClick={() => setShowFile(!showFile)}>
                <h2 className="text-xl font-bold">Current File</h2>
                <svg 
                    className={`w-5 h-5 transition-transform ${showFile ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {showFile && (
                <div className="absolute top-full left-0 right-0 z-50 min-w-80 rounded-md bg-white border-2 border-black p-3 shadow-lg">
                    {/* File Container */}
                    <div className="space-y-2">
                        {isLoading && !currentFile && (
                            <div className="text-center py-2">
                                <div className="text-gray-500 text-sm">Loading file...</div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="border border-red-200 rounded-md p-2 bg-red-50">
                                <p className="text-red-600 text-xs">{error}</p>
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className="border border-green-200 rounded-md p-2 bg-green-50">
                                <p className="text-green-600 text-xs">{successMessage}</p>
                            </div>
                        )}
                        
                        {!currentFile && !isLoading && (
                            <div className="text-center py-2">
                                <p className="text-gray-500 text-sm">No file uploaded yet</p>
                            </div>
                        )}
                        
                        {/* File Display */}
                        {currentFile && (
                            <div className="border rounded-md transition-colors border-gray-200 hover:border-gray-300">
                                <div 
                                    className="flex flex-row gap-2 items-center justify-between p-2 cursor-pointer"
                                    onClick={() => {
                                        if (selectedFile === currentFile.name) {
                                            setSelectedFile(null);
                                            setCsvData("");
                                        } else {
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
                                    </div>
                                </div>
                        </div>
                    )}
                </div>
                {/* {currentFile && (
                    <button 
                        className="border-2 border-zinc-100 hover:bg-zinc-200 hover:border-zinc-300 rounded-lg p-2 mx-auto transition-colors"
                        onClick={() => extractData(currentFile.name)}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Extracting...' : 'Extract Data'}
                    </button>
                )} */}
            </div>
        )}
        </div>
    );
}