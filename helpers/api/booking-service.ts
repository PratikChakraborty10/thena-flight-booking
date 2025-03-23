import { supabase } from "@/lib/supabase";

const generateBookingReference = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = '';
    
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    for (let i = 0; i < 3; i++) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return result;
  }
  
  // Create a new booking in Supabase
  export const createBooking = async (
    userId: string,
    flightDetails: any,
    passengers: any[],
    totalPrice: number
  ) => {
    try {
      // Create booking object from the provided data
      const bookingData = {
        user_profile_id: userId,
        booking_reference: generateBookingReference(),
        flight_number: flightDetails.flightNumber,
        airline: flightDetails.airline,
        departure_airport: flightDetails.departureAirport,
        arrival_airport: flightDetails.arrivalAirport,
        departure_datetime: flightDetails.departureTime,
        arrival_datetime: flightDetails.arrivalTime,
        passenger_count: passengers.length,
        total_price: totalPrice,
        booking_status: 'confirmed',
        payment_status: 'completed',
        passenger_details: JSON.stringify(passengers),
      }
  
      // Insert the booking into Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single()
  
      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('Error creating booking:', error)
      return { success: false, error }
    }
  }
  
  // Simulate payment processing
  export const processPayment = async (amount: number) => {
    // This is a mock function that simulates payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, transactionId: `TXN${Math.random().toString(36).substring(2, 10).toUpperCase()}` })
      }, 2000)
    })
  }
  