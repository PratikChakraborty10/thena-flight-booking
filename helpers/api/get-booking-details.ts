import { supabase } from "@/lib/supabase"

export interface BookingDetails {
    id: string
    booking_reference: string
    flight_number: string
    airline: string
    departure_airport: string
    arrival_airport: string
    departure_datetime: string
    arrival_datetime: string
    passenger_count: number
    total_price: number
    booking_status: string
    payment_status: string
    passenger_details: any[] 
  }
  
  // Fetch booking details by ID
  export const fetchBookingDetails = async (options: Record<string, unknown>, bookingId: string): Promise<BookingDetails> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()
  
      if (error) throw error
  
      // Parse passenger details from JSON
      return {
        ...data,
        passenger_details: JSON.parse(data.passenger_details)
      }
    } catch (err) {
      console.error('Error fetching booking:', err)
      throw new Error('Failed to fetch booking details')
    }
  }