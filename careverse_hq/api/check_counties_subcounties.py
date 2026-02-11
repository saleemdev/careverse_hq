#!/usr/bin/env python3
"""
Script to fetch all counties and sub-counties from KMHFR API
and check for duplicate sub-county names.

Usage:
    bench console
    >>> exec(open('check_counties_subcounties.py').read())
"""

import requests
import json
from collections import defaultdict
import frappe


def authenticate_kmhfr():
    """Authenticate with KMHFR API and get access token"""
    url = "https://api.kmhfr.health.go.ke/o/token/"

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    }

    # Basic Auth credentials
    settings = frappe.get_single("HealthPro Backend Settings")
    basic_auth_username = settings.get("kmhfr_basic_auth_username")
    basic_auth_password = settings.get_password("kmhfr_basic_auth_password")

    # User credentials
    username = settings.get("kmhfr_auth_username")
    password = settings.get_password("kmhfr_auth_password")

    data = {
        "grant_type": "password",
        "username": username,
        "password": password,
        "scope": "read",
    }

    response = requests.post(
        url,
        headers=headers,
        data=data,
        timeout=30,
        auth=(basic_auth_username, basic_auth_password),
    )

    if response.status_code != 200:
        return None

    response_data = response.json()
    return response_data.get("access_token")


def fetch_counties(token):
    """Fetch all counties from KMHFR API"""
    # Get base URL from settings
    settings = frappe.get_single("HealthPro Backend Settings")
    base_url = settings.get("kmhfr_api_base_url") or "https://api.kmhfr.health.go.ke"

    url = f"{base_url}/api/common/counties"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    params = {"page_size": 50, "format": "json"}

    response = requests.get(url, headers=headers, params=params, timeout=30)

    if response.status_code != 200:
        print(f"Failed to fetch counties: {response.status_code}")
        print(f"Response: {response.text}")
        return []

    try:
        data = response.json()
        return data.get("results", [])
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON response: {e}")
        print(f"Response text: {response.text[:500]}")  # Print first 500 chars
        return []


def fetch_subcounties(county_id, token):
    """Fetch sub-counties for a specific county"""
    # Get base URL from settings
    settings = frappe.get_single("HealthPro Backend Settings")
    base_url = settings.get("kmhfr_api_base_url") or "https://api.kmhfr.health.go.ke"

    url = f"{base_url}/api/common/sub_counties"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    params = {"county": county_id, "page_size": 100, "format": "json"}

    response = requests.get(url, headers=headers, params=params, timeout=30)

    if response.status_code != 200:
        print(
            f"Failed to fetch sub-counties for county {county_id}: {response.status_code}"
        )
        return []

    try:
        data = response.json()
        return data.get("results", [])
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON response for county {county_id}: {e}")
        print(f"Response text: {response.text[:500]}")
        return []


def check_counties_and_subcounties():
    """Main function to fetch all data and check for duplicates"""
    print("=" * 80)
    print("KMHFR Counties and Sub-Counties Analysis")
    print("=" * 80)
    print()

    # Step 1: Authenticate
    print("Step 1: Authenticating with KMHFR API...")
    token = authenticate_kmhfr()
    if not token:
        print("❌ Authentication failed!")
        return
    print("✅ Authentication successful!")
    print()

    # Step 2: Fetch all counties
    print("Step 2: Fetching all counties...")
    counties = fetch_counties(token)
    print(f"✅ Found {len(counties)} counties")
    print()

    # Step 3: Fetch sub-counties for each county
    print("Step 3: Fetching sub-counties for each county...")
    counties_data = []
    all_subcounties = []
    subcounty_to_counties = defaultdict(
        list
    )  # Track which counties have which sub-counties

    for i, county in enumerate(counties, 1):
        county_name = county.get("name", "").upper()
        county_id = county.get("id")

        print(f"  [{i}/{len(counties)}] Fetching sub-counties for {county_name}...")

        subcounties = fetch_subcounties(county_id, token)

        county_info = {
            "id": county_id,
            "name": county_name,
            "subcounties": [],
        }

        for subcounty in subcounties:
            subcounty_name = subcounty.get("name", "").upper()
            subcounty_id = subcounty.get("id")

            county_info["subcounties"].append(
                {"id": subcounty_id, "name": subcounty_name}
            )

            # Track all sub-counties and their parent counties
            all_subcounties.append(subcounty_name)
            subcounty_to_counties[subcounty_name].append(county_name)

        counties_data.append(county_info)
        print(f"      → Found {len(subcounties)} sub-counties")

    print()
    print("=" * 80)
    print("RESULTS")
    print("=" * 80)
    print()

    # Step 4: Save to JSON file in fixtures directory
    from datetime import datetime
    import os

    # Get app path and create data directory if it doesn't exist
    app_path = frappe.get_app_path("healthpro_erp")
    data_dir = os.path.join(app_path, "data")
    os.makedirs(data_dir, exist_ok=True)

    output_file = os.path.join(data_dir, "kenya_counties_subcounties.json")

    # Create structured JSON with metadata
    output_data = {
        "metadata": {
            "extracted_at": datetime.now().isoformat(),
            "source": "KMHFR API",
            "total_counties": len(counties_data),
            "total_subcounties": len(all_subcounties),
        },
        "counties": counties_data,
    }

    with open(output_file, "w") as f:
        json.dump(output_data, f, indent=2)
    print(f"✅ Data saved to: {output_file}")
    print()

    # Step 5: Check for duplicates
    print("=" * 80)
    print("DUPLICATE SUB-COUNTY NAMES ANALYSIS")
    print("=" * 80)
    print()

    duplicates = {
        name: counties
        for name, counties in subcounty_to_counties.items()
        if len(counties) > 1
    }

    if duplicates:
        print(f"⚠️  Found {len(duplicates)} DUPLICATE sub-county names:")
        print()
        for subcounty_name, county_list in sorted(duplicates.items()):
            print(f"  📍 '{subcounty_name}' appears in {len(county_list)} counties:")
            for county in county_list:
                print(f"      - {county}")
            print()
    else:
        print("✅ No duplicate sub-county names found!")
        print()

    # Step 6: Summary statistics
    print("=" * 80)
    print("SUMMARY STATISTICS")
    print("=" * 80)
    print()
    print(f"Total Counties: {len(counties_data)}")
    print(f"Total Sub-Counties: {len(all_subcounties)}")
    print(f"Unique Sub-County Names: {len(set(all_subcounties))}")
    print(f"Duplicate Sub-County Names: {len(duplicates)}")
    print()

    # Step 7: Show sample data
    print("=" * 80)
    print("SAMPLE DATA (First 3 Counties)")
    print("=" * 80)
    print()
    for county in counties_data[:3]:
        print(f"📍 {county['name']} (ID: {county['id']})")
        print(f"   Sub-counties ({len(county['subcounties'])}):")
        for subcounty in county["subcounties"][:5]:  # Show first 5 sub-counties
            print(f"      - {subcounty['name']}")
        if len(county["subcounties"]) > 5:
            print(f"      ... and {len(county['subcounties']) - 5} more")
        print()

    print("=" * 80)
    print("✅ Analysis complete!")
    print("=" * 80)

    return counties_data, duplicates


# Run the analysis
if __name__ == "__main__":
    check_counties_and_subcounties()
