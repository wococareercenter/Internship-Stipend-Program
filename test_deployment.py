#!/usr/bin/env python3
"""
Test script to verify FastAPI deployment on Vercel
"""
import requests
import json

def test_endpoints(base_url):
    """Test various endpoints to ensure they return JSON"""
    
    endpoints = [
        "/",
        "/health",
        "/api/cache",
    ]
    
    for endpoint in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            print(f"Testing: {url}")
            
            response = requests.get(url, timeout=10)
            
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('content-type', 'Not set')}")
            
            # Try to parse as JSON
            try:
                data = response.json()
                print(f"JSON Response: {json.dumps(data, indent=2)}")
            except json.JSONDecodeError as e:
                print(f"ERROR: Response is not valid JSON: {e}")
                print(f"Response content: {response.text[:200]}...")
            
            print("-" * 50)
            
        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to connect to {url}: {e}")
            print("-" * 50)

if __name__ == "__main__":
    # Replace with your actual Vercel URL
    base_url = "internship-stipend-program.vercel.app"  # Update this with your actual Vercel domain
    
    print("Testing FastAPI deployment...")
    print(f"Base URL: {base_url}")
    print("=" * 50)
    
    test_endpoints(base_url) 