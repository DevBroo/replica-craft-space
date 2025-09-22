import { supabase } from "@/integrations/supabase/client";

export interface DateAvailability {
  date: string;
  available: boolean;
  reason?: string; // 'booked' | 'blocked' | 'maintenance'
}

export interface PropertyAvailability {
  propertyId: string;
  unavailableDates: string[]; // Array of date strings in YYYY-MM-DD format
  blockedDateRanges: {
    start: string;
    end: string;
    reason: string;
  }[];
}

export class AvailabilityService {
  /**
   * Get unavailable dates for a property
   */
  static async getPropertyAvailability(
    propertyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PropertyAvailability> {
    try {
      console.log("🔍 Checking availability for property:", propertyId);

      // Default date range: next 6 months
      const start = startDate || new Date();
      const end =
        endDate || new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);

      const startDateStr = start.toISOString().split("T")[0];
      const endDateStr = end.toISOString().split("T")[0];

      // Get confirmed bookings that overlap with the date range
      const { data: bookings, error: bookingError } = await supabase
        .from("bookings")
        .select("check_in_date, check_out_date, status")
        .eq("property_id", propertyId)
        .in("status", ["confirmed", "pending"]) // Include pending bookings as unavailable
        .or(
          `check_in_date.lte.${endDateStr},check_out_date.gte.${startDateStr}`
        )
        .order("check_in_date");

      if (bookingError) {
        console.error("❌ Error fetching bookings:", bookingError);
        throw bookingError;
      }

      // Generate list of unavailable dates
      const unavailableDates = new Set<string>();

      if (bookings) {
        bookings.forEach((booking) => {
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);

          // Add all dates between check-in and check-out (inclusive)
          const currentDate = new Date(checkIn);
          while (currentDate <= checkOut) {
            unavailableDates.add(currentDate.toISOString().split("T")[0]);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });
      }

      // TODO: Add property-specific blocked dates/maintenance periods
      // This would come from a separate property_blocked_dates table
      const blockedDateRanges: {
        start: string;
        end: string;
        reason: string;
      }[] = [];

      const result: PropertyAvailability = {
        propertyId,
        unavailableDates: Array.from(unavailableDates),
        blockedDateRanges,
      };

      console.log("✅ Availability check complete:", {
        propertyId,
        unavailableDatesCount: result.unavailableDates.length,
        blockedRangesCount: result.blockedDateRanges.length,
      });

      return result;
    } catch (error) {
      console.error("❌ Error checking property availability:", error);
      throw error;
    }
  }

  /**
   * Check if specific dates are available for booking
   */
  static async checkDateRangeAvailability(
    propertyId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<{ available: boolean; conflictingBookings?: any[] }> {
    try {
      console.log("🔍 Checking date range availability:", {
        propertyId,
        checkInDate,
        checkOutDate,
      });

      // Check for overlapping bookings
      const { data: conflictingBookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("property_id", propertyId)
        .in("status", ["confirmed", "pending"])
        .or(
          `and(check_in_date.lte.${checkOutDate},check_out_date.gte.${checkInDate})`
        );

      if (error) {
        console.error("❌ Error checking date availability:", error);
        throw error;
      }

      const available =
        !conflictingBookings || conflictingBookings.length === 0;

      console.log("✅ Date range availability:", {
        available,
        conflicts: conflictingBookings?.length || 0,
      });

      return {
        available,
        conflictingBookings: conflictingBookings || [],
      };
    } catch (error) {
      console.error("❌ Error checking date range availability:", error);
      throw error;
    }
  }

  static async checkDateAvailability(
    propertyId: string,
    checkInDate: string
  ): Promise<{ available: boolean; conflictingBookings?: any[] }> {
    try {
      console.log("🔍 Checking single-date availability:", {
        propertyId,
        checkInDate,
      });
  
      // Check for overlapping bookings on that date
      const { data: conflictingBookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("property_id", propertyId)
        .in("status", ["confirmed", "pending"])
        .or(
          `and(check_in_date.lte.${checkInDate},check_out_date.gte.${checkInDate})`
        );
  
      if (error) {
        console.error("❌ Error checking date availability:", error);
        throw error;
      }
  
      const available =
        !conflictingBookings || conflictingBookings.length === 0;
  
      console.log("✅ Single-date availability:", {
        available,
        conflicts: conflictingBookings?.length || 0,
      });
  
      return {
        available,
        conflictingBookings: conflictingBookings || [],
      };
    } catch (error) {
      console.error("❌ Error checking single-date availability:", error);
      throw error;
    }
  }
  

  /**
   * Get minimum and maximum bookable dates for a property
   */
  static getBookingDateLimits(): { minDate: Date; maxDate: Date } {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1); // Can book from tomorrow

    const maxDate = new Date(today);
    maxDate.setFullYear(today.getFullYear() + 1); // Can book up to 1 year ahead

    return { minDate, maxDate };
  }

  /**
   * Validate booking dates
   */
  static validateBookingDates(
    checkInDate: Date,
    checkOutDate: Date
  ): { valid: boolean; error?: string } {
    const { minDate, maxDate } = this.getBookingDateLimits();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if check-in is in the past
    if (checkInDate < today) {
      return { valid: false, error: "Check-in date cannot be in the past" };
    }

    // Check if check-in is too early (should be at least tomorrow)
    if (checkInDate < minDate) {
      return {
        valid: false,
        error: "Check-in date must be at least 1 day from today",
      };
    }

    // Check if check-in is too far in the future
    if (checkInDate > maxDate) {
      return {
        valid: false,
        error: "Check-in date cannot be more than 1 year from today",
      };
    }

    // Check if check-out is before check-in
    if (checkOutDate <= checkInDate) {
      return {
        valid: false,
        error: "Check-out date must be after check-in date",
      };
    }

    // Check minimum stay (at least 1 night)
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (dayDiff < 1) {
      return { valid: false, error: "Minimum stay is 1 night" };
    }

    // Check maximum stay (e.g., 30 days)
    if (dayDiff > 30) {
      return { valid: false, error: "Maximum stay is 30 nights" };
    }

    return { valid: true };
  }

  static validateBookingDate(checkInDate: Date): {
    valid: boolean;
    error?: string;
  } {
    const { minDate, maxDate } = this.getBookingDateLimits();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if check-in is in the past
    if (checkInDate < today) {
      return { valid: false, error: "Check-in date cannot be in the past" };
    }

    // Check if check-in is too early (before minDate)
    if (checkInDate < minDate) {
      return {
        valid: false,
        error: "Check-in date must be at least 1 day from today",
      };
    }

    // Check if check-in is too far in the future (after maxDate)
    if (checkInDate > maxDate) {
      return {
        valid: false,
        error: "Check-in date cannot be more than 1 year from today",
      };
    }

    return { valid: true };
  }

  /**
   * Get next available date for a property
   */
  static async getNextAvailableDate(propertyId: string): Promise<Date | null> {
    try {
      const availability = await this.getPropertyAvailability(propertyId);
      const { minDate } = this.getBookingDateLimits();

      let currentDate = new Date(minDate);
      const maxSearchDate = new Date(minDate);
      maxSearchDate.setDate(maxSearchDate.getDate() + 90); // Search next 90 days

      while (currentDate <= maxSearchDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        if (!availability.unavailableDates.includes(dateStr)) {
          return new Date(currentDate);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return null; // No available date found in next 90 days
    } catch (error) {
      console.error("❌ Error finding next available date:", error);
      return null;
    }
  }

  /**
   * Update property availability when a booking is modified
   */
  static async updateAvailabilityOnBookingModification(
    propertyId: string,
    oldDates: { check_in_date: string; check_out_date: string },
    newDates: { check_in_date: string; check_out_date: string }
  ): Promise<void> {
    try {
      console.log("🔄 Updating availability for booking modification:", {
        propertyId,
        oldDates,
        newDates,
      });

      // The availability is automatically updated based on the bookings table
      // When a booking is modified, the new dates will be reflected in the availability check
      // This method is here for future enhancements like caching or notifications

      console.log("✅ Availability updated for booking modification");
    } catch (error) {
      console.error(
        "❌ Error updating availability on booking modification:",
        error
      );
      throw error;
    }
  }

  /**
   * Update property availability when a booking is cancelled
   */
  static async updateAvailabilityOnBookingCancellation(
    propertyId: string,
    cancelledDates: { check_in_date: string; check_out_date: string }
  ): Promise<void> {
    try {
      console.log("🔄 Updating availability for booking cancellation:", {
        propertyId,
        cancelledDates,
      });

      // The availability is automatically updated based on the bookings table
      // When a booking is cancelled, those dates become available again
      // This method is here for future enhancements like caching or notifications

      console.log("✅ Availability updated for booking cancellation");
    } catch (error) {
      console.error(
        "❌ Error updating availability on booking cancellation:",
        error
      );
      throw error;
    }
  }

  /**
   * Check if dates are available excluding a specific booking (for modification)
   */
  static async checkDateRangeAvailabilityExcludingBooking(
    propertyId: string,
    checkInDate: string,
    checkOutDate: string,
    excludeBookingId: string
  ): Promise<{ available: boolean; conflictingBookings?: any[] }> {
    try {
      console.log("🔍 Checking date range availability excluding booking:", {
        propertyId,
        checkInDate,
        checkOutDate,
        excludeBookingId,
      });

      // Check for overlapping bookings excluding the specified booking
      const { data: conflictingBookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("property_id", propertyId)
        .in("status", ["confirmed", "pending"])
        .neq("id", excludeBookingId) // Exclude the booking being modified
        .or(
          `and(check_in_date.lte.${checkOutDate},check_out_date.gte.${checkInDate})`
        );

      if (error) {
        console.error("❌ Error checking date availability:", error);
        throw error;
      }

      const available =
        !conflictingBookings || conflictingBookings.length === 0;

      console.log("✅ Date range availability check complete:", {
        available,
        conflicts: conflictingBookings?.length || 0,
      });

      return {
        available,
        conflictingBookings: conflictingBookings || [],
      };
    } catch (error) {
      console.error(
        "❌ Error checking date range availability excluding booking:",
        error
      );
      throw error;
    }
  }
}

export default AvailabilityService;
