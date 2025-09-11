export interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

export const shareUtils = {
  // Check if Web Share API is supported
  isWebShareSupported: (): boolean => {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  },

  // Use Web Share API if available, otherwise fallback to clipboard
  async share(options: ShareOptions): Promise<boolean> {
    try {
      if (this.isWebShareSupported()) {
        await navigator.share(options);
        return true;
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${options.title}\n\n${options.text}\n\n${options.url}`);
        return true;
      }
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  },

  // Share property
  async shareProperty(property: any): Promise<boolean> {
    const url = `${window.location.origin}/property/${property.id}`;
    const title = `Check out ${property.title || property.name} on Picnify`;
    const text = `Amazing ${property.type || 'property'} in ${property.location || property.general_location}. Starting from ₹${property.pricing?.daily_rate || property.price || 'N/A'}/night.`;

    return this.share({ title, text, url });
  },

  // Share booking
  async shareBooking(booking: any): Promise<boolean> {
    const url = `${window.location.origin}/booking/${booking.id}`;
    const title = `My booking at ${booking.property?.title || booking.property?.name}`;
    const text = `I've booked ${booking.property?.title || booking.property?.name} for ${booking.check_in_date} to ${booking.check_out_date}. Total: ₹${booking.total_amount}`;

    return this.share({ title, text, url });
  },

  // Copy link to clipboard
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  },

  // Copy property link
  async copyPropertyLink(property: any): Promise<boolean> {
    const url = `${window.location.origin}/property/${property.id}`;
    return this.copyToClipboard(url);
  },

  // Copy booking link
  async copyBookingLink(booking: any): Promise<boolean> {
    const url = `${window.location.origin}/booking/${booking.id}`;
    return this.copyToClipboard(url);
  },

  // Generate shareable link
  generateShareableLink(path: string): string {
    return `${window.location.origin}${path}`;
  }
};
