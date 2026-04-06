import axios from 'axios';

// GSTIN Lookup Service
// This service provides methods to verify and fetch details of GSTIN numbers
// Note: For production, integrate with a licensed GST Suvidha Provider (GSP) API

interface GSTINDetails {
    gstin: string;
    legalName: string;
    tradeName: string | null;
    status: string;
    registrationDate: string | null;
    businessType: string | null;
    stateCode: string;
    stateName: string;
    address: {
        building: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    };
    email?: string;
    phone?: string;
}

// State code to state name mapping
const stateCodeMap: Record<string, string> = {
    '01': 'Jammu & Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra & Nagar Haveli and Daman & Diu',
    '27': 'Maharashtra',
    '28': 'Andhra Pradesh (Old)',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman & Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh',
};

/**
 * Validates GSTIN format using regex
 * GSTIN Format: 2 digit state code + 10 character PAN + 1 entity code + Z + 1 check digit
 */
export function validateGSTINFormat(gstin: string): boolean {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin.trim().toUpperCase());
}

/**
 * Extracts PAN from GSTIN
 * PAN is characters 3-12 of GSTIN
 */
export function extractPANFromGSTIN(gstin: string): string {
    return gstin.substring(2, 12);
}

/**
 * Gets state name from GSTIN's first two digits
 */
export function getStateFromGSTIN(gstin: string): { code: string; name: string } {
    const stateCode = gstin.substring(0, 2);
    return {
        code: stateCode,
        name: stateCodeMap[stateCode] || 'Unknown'
    };
}

/**
 * Fetch GSTIN details from GST verification API
 * Uses a public API for demo - replace with licensed GSP API for production
 */
export async function lookupGSTIN(gstin: string): Promise<GSTINDetails | null> {
    // First validate format
    if (!validateGSTINFormat(gstin)) {
        throw new Error('Invalid GSTIN format');
    }

    try {
        // Using the public GST search API endpoint
        // Note: For production, use a licensed GSP like Masters India, ClearTax, etc.
        const response = await axios.get(
            `https://sheet.gstzen.in/gstin/${gstin}`,
            {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                }
            }
        );

        if (response.data && response.data.flag === true) {
            const data = response.data.data;
            const stateInfo = getStateFromGSTIN(gstin);

            // Parse address from multiple fields
            const address = {
                building: data.pradr?.addr?.bno || '',
                street: [data.pradr?.addr?.st, data.pradr?.addr?.loc].filter(Boolean).join(', ') || '',
                city: data.pradr?.addr?.dst || data.pradr?.addr?.city || '',
                state: stateInfo.name,
                pincode: data.pradr?.addr?.pncd || '',
                country: 'India'
            };

            return {
                gstin: gstin.toUpperCase(),
                legalName: data.lgnm || '',
                tradeName: data.tradeNam || null,
                status: data.sts || 'Unknown',
                registrationDate: data.rgdt || null,
                businessType: data.ctb || null,
                stateCode: stateInfo.code,
                stateName: stateInfo.name,
                address
            };
        }

        return null;
    } catch (error: any) {
        // If the public API fails, try to extract basic info from GSTIN
        console.error('GSTIN lookup API error:', error.message);

        // Return basic info extracted from GSTIN itself
        const stateInfo = getStateFromGSTIN(gstin);
        const pan = extractPANFromGSTIN(gstin);

        return {
            gstin: gstin.toUpperCase(),
            legalName: '', // Would need to be filled by user
            tradeName: null,
            status: 'Pending Verification',
            registrationDate: null,
            businessType: null,
            stateCode: stateInfo.code,
            stateName: stateInfo.name,
            address: {
                building: '',
                street: '',
                city: '',
                state: stateInfo.name,
                pincode: '',
                country: 'India'
            }
        };
    }
}

export default {
    validateGSTINFormat,
    extractPANFromGSTIN,
    getStateFromGSTIN,
    lookupGSTIN
};
