"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export default function Upload() {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [error, setError] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const allowedExtensions = ['.csv', '.xls', '.xlsx'];

    const validateFile = (file) => {
        if (!file) return false;
        
        const isValidType = allowedTypes.includes(file.type) || 
            allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!isValidType) {
            setError("Please upload only CSV or Excel files (.csv, .xls, .xlsx)");
            return false;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setError("File size must be less than 10MB");
            return false;
        }

        setError("");
        return true;
    };

    const handleFileSelect = (selectedFile) => {
        if (validateFile(selectedFile)) {
            setFile(selectedFile);
            setUploadedFile(null);
        }
    };

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const droppedFile = e.dataTransfer.files[0];
        handleFileSelect(droppedFile);
    }, []);

    const handleFileInputChange = (e) => {
        const selectedFile = e.target.files[0];
        handleFileSelect(selectedFile);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !validateFile(file)) return;

        setIsUploading(true);
        setUploadProgress(0);
        setError("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            setUploadedFile({
                name: file.name,
                size: file.size,
                type: file.type,
                url: data.url || null
            });
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            setError("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const LoadingDots = () => (
        <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
    );

    if (!isMounted) {
        return (
            <div className="flex flex-col gap-4 border-2 border-black rounded-md p-5 w-full h-full"> 
                <h2 className="text-xl font-bold text-center">File Upload</h2>
                <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 border-2 border-black rounded-md p-5 w-full h-full"> 
            <h2 className="text-xl font-bold text-center">File Upload</h2>
            
            {/* Drag & Drop Area */}
            <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center gap-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                        <p className="text-lg font-medium">
                            {isDragOver ? "Drop your file here" : "Drag and drop your file here"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            or click to browse
                        </p>
                    </div>
                    <input 
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileInputChange}
                        accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        className="hidden"
                    />
                    <button 
                        type="button"
                        onClick={() => {
                            if (fileInputRef.current) {
                                fileInputRef.current.click();
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Choose File
                    </button>
                </div>
            </div>

            {/* File Info */}
            {file && (
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="border border-red-200 rounded-md p-4 bg-red-50">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <LoadingDots />
                        <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Upload Button */}
            {file && !isUploading && (
                <button 
                    onClick={handleUpload}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    Upload File
                </button>
            )}

            {/* Uploaded File Preview */}
            {uploadedFile && (
                <div className="border border-green-200 rounded-md p-4 bg-green-50">
                    <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div className="flex-1">
                            <p className="font-medium text-green-800">Upload Successful!</p>
                            <p className="text-sm text-green-600">{uploadedFile.name}</p>
                            <p className="text-xs text-green-500">{formatFileSize(uploadedFile.size)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}