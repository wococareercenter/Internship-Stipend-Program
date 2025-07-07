"use client";
import { useState, useEffect } from "react";
import { CsvToHtmlTable } from "react-csv-to-table";

export default function Result() {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [csvData, setCsvData] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [deletingFiles, setDeletingFiles] = useState(new Set());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetchUploadedFiles();
        
        // Listen for file upload events
        const handleFileUploaded = (event) => {
            fetchUploadedFiles();
            
        };
        
        window.addEventListener('fileUploaded', handleFileUploaded);
        
        // Cleanup event listener
        return () => {
            window.removeEventListener('fileUploaded', handleFileUploaded);
        };
    }, []);

    const fetchUploadedFiles = async () => {
        setIsLoading(true);
        setError("");
        
        try {
            const response = await fetch('/api/files');
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            
            const data = await response.json();
            setUploadedFiles(data.files || []);
        } catch (err) {
            setError('Failed to load uploaded files');
            console.error('Error fetching files:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCsvFile = async (fileName) => {
        setIsLoading(true);
        setError("");
        
        try {
            const response = await fetch(`/api/files/${encodeURIComponent(fileName)}`);
            if (!response.ok) {
                throw new Error('Failed to load file');
            }
            
            const csvContent = await response.text();
            setCsvData(csvContent);
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

    const handleDeleteFile = async (fileName) => {
        // Show confirmation dialog
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
            return;
        }
        
        setDeletingFiles(prev => new Set(prev).add(fileName));
        setError("");
        
        try {
            const response = await fetch(`/api/files/${encodeURIComponent(fileName)}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete file');
            }
            
            // Refresh the file list
            fetchUploadedFiles();
            
            // Show success message
            setSuccessMessage(`File "${fileName}" deleted successfully!`);
            setTimeout(() => setSuccessMessage(""), 3000);
            
        } catch (err) {
            setError('Failed to delete file. Please try again.');
        } finally {
            setDeletingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(fileName);
                return newSet;
            });
        }
    };

    

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
                <h3 className="text-lg font-semibold">Uploaded Files</h3>
                {isLoading && uploadedFiles.length === 0 && (
                    <div className="text-center py-4">
                        <div className="text-gray-500">Loading files...</div>
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
                
                {uploadedFiles.length === 0 && !isLoading && (
                    <div className="text-center py-4">
                        <p className="text-gray-500">No files uploaded yet</p>
                    </div>
                )}
                
                {/* File List */}
                {uploadedFiles.map((file, index) => (
                    <div 
                        key={index}
                        className={`border rounded-md transition-colors ${
                            selectedFile === file.name 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div 
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() => {
                                if (selectedFile === file.name) {
                                    // Close if already open
                                    setSelectedFile(null);
                                    setCsvData("");
                                } else {
                                    // Open this file
                                    loadCsvFile(file.name);
                                }
                            }}
                        >
                            <div className="flex-1">
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {file.name.toLowerCase().endsWith('.csv') && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        CSV
                                    </span>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFile(file.name);
                                    }}
                                    disabled={deletingFiles.has(file.name)}
                                    className={`text-red-500 hover:text-red-700 p-1 transition-colors ${
                                        deletingFiles.has(file.name) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Delete file"
                                >
                                    {deletingFiles.has(file.name) ? (
                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>
                                <svg 
                                    className={`w-4 h-4 text-gray-500 transition-transform ${
                                        selectedFile === file.name ? 'rotate-180' : ''
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
                        {selectedFile === file.name && csvData && (
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
                                    <div className="overflow-x-auto max-h-64">
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
                        {selectedFile === file.name && isLoading && (
                            <div className="border-t border-gray-200 bg-white p-4">
                                <div className="text-center">
                                    <div className="text-gray-500 text-sm">Loading CSV preview...</div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}