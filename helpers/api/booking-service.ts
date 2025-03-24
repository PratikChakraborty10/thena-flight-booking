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
      // First, fetch the correct user_profile_id
      const { data: userProfiles, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId);

      if (userProfileError) throw userProfileError;
      
      if (!userProfiles || userProfiles.length === 0) {
        // If no profile exists, create one
        const { data: newProfile, error: createProfileError } = await supabase
          .from('user_profiles')
          .insert({ user_id: userId })
          .select('id')
          .single();

        if (createProfileError) throw createProfileError;
        
        if (!newProfile) {
          throw new Error('Failed to create user profile');
        }

        // Use the newly created profile's ID
        return await createBookingWithProfileId(newProfile.id, flightDetails, passengers, totalPrice);
      }

      // Use the first matching profile's ID
      return await createBookingWithProfileId(userProfiles[0].id, flightDetails, passengers, totalPrice);

    } catch (error) {
      console.error('Error creating booking:', error)
      return { success: false, error }
    }
  }

  // Separate function to create booking with a known profile ID
  const createBookingWithProfileId = async (
    userProfileId: string,
    flightDetails: any,
    passengers: any[],
    totalPrice: number
  ) => {
    // Create booking object from the provided data
    const bookingData = {
      user_profile_id: userProfileId,
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
  }