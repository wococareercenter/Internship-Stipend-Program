"use client";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export default function Upload() {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [error, setError] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const fileInputRef = useRef(null);

    // Base URL for API calls
    let baseUrl = "";
    if (process.env.NODE_ENV === "development") {
        baseUrl = "http://localhost:3000";
    }

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

    const handleFileSelect = async (selectedFile) => {
        if (validateFile(selectedFile)) {
            setFile(selectedFile);
            setUploadedFile(null);
            
            // Automatically upload the file immediately
            await handleUpload(null, selectedFile);
        }
    };

    const handleFileInputChange = (e) => {
        const selectedFile = e.target.files[0];
        handleFileSelect(selectedFile);
    };

    const handleUpload = async (e, fileToUpload = null) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        
        // Use provided file or fall back to state
        const fileToUse = fileToUpload || file;
        if (!fileToUse || !validateFile(fileToUse)) return;

        setIsUploading(true);
        setError("");

        const formData = new FormData();
        formData.append("file", fileToUse);

        try {
            const response = await fetch(`${baseUrl}/api/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed. 
                    Server returned status code: ${response.status}. 
                    Please try uploading the file again or contact support if the issue persists.`);
            }

            const data = await response.json();
            setUploadedFile({
                name: fileToUse.name,
                size: fileToUse.size,
                type: fileToUse.type,
                url: data.url || null
            });
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            // Show success toast
            toast.success(`File "${fileToUse.name}" uploaded successfully!`);
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('fileUploaded', {
                detail: {
                    fileName: fileToUse.name,
                    fileSize: fileToUse.size,
                    fileType: fileToUse.type
                }
            }));
        } catch (err) {
            setError("Upload failed. Please try again.");
            toast.error("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (uploadedFile) {
            const timer = setTimeout(() => {
                setUploadedFile(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [uploadedFile]);

    if (!isMounted) {
        return (
            <div className="flex flex-col gap-2 border-2 border-black rounded-md p-3 w-full h-full"> 
                <h2 className="text-lg font-bold text-center">File Upload</h2>
                <div className="flex items-center justify-center h-20">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="border-2 border-black rounded-md p-3 flex-shrink-0 hover:bg-gray-50">
            <button className="hover:cursor-pointer" type="button" onClick={() => {
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
            }}>
                <div className="flex flex-row items-center gap-2 justify-center">
                    <h2 className="text-xl font-bold">Upload Files</h2>
                </div>
            </button>
            <input 
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
            />
        </div>
    );
}