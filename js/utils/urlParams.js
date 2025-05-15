// URL parameter handling
export class UrlManager {
    static getUrlParameters() {
        const params = new URLSearchParams(window.location.search);
        return {
            city: params.get('city'),
            locations: params.get('locations') || '100000',
            filter250k: params.get('filter250k') || '0111110',
            filter500k: params.get('filter500k') || '1111110'
        };
    }

    static validateLocationsParam(locations) {
        if (!locations) return false;
        if (locations.length !== 6) return false;
        if (!/^[01]{6}$/.test(locations)) return false;
        return true;
    }

    // Additional URL parameter functionality will be moved here
}
