/**
 * Generates a Short Order ID from a UUID or MongoDB ID
 * @param {string} orderId - The full ID (e.g. 7f44e42c-13cc-4472-b456-b84e1116ba15)
 * @returns {string} - The formatted short ID (e.g. #44E42C)
 */
const formatOrderId = (orderId: string | undefined): string => {
    if (!orderId) return '#N/A';

    // 1. Get the first segment (before the first '-')
    // For 7f44e42c-13cc-..., this gets "7f44e42c"
    const firstSegment = orderId.toString().split('-')[0];

    // 2. Take the last 6 characters of THAT segment
    // This gives "44e42c"
    const shortCode = firstSegment.slice(-6).toUpperCase();

    // 3. Return with # prefix
    return `#${shortCode}`;
};

export default formatOrderId;
