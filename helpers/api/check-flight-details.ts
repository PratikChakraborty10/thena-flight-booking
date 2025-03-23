import { supabase } from "@/lib/supabase"

export interface FlightDetails {
    id: string
    flightNumber: string
    airline: string
    airlineLogo: string
    departureAirport: string
    departureAirportName: string
    departureCity: string
    arrivalAirport: string
    arrivalAirportName: string
    arrivalCity: string
    departureTime: string
    arrivalTime: string
    duration: string
    price: number
    cabinClass: string
    seatsAvailable: number
  }
  
  // Function to get detailed flight information
  export async function getFlightDetails(flightId: string, cabinClass: string): Promise<FlightDetails | null> {
    // Query that joins flights, flight_inventory, airlines, and airports tables
    const { data, error } = await supabase
      .from("flights")
      .select(`
        id,
        flight_number,
        departure_time,
        arrival_time,
        duration,
        departure_airport,
        arrival_airport,
        airlines(id, name, logo),
        flight_inventory(id, seats_available, cabin_class, price)
      `)
      .eq("id", flightId)
      .eq("flight_inventory.cabin_class", cabinClass)
      .single()
  
    if (error || !data) {
      console.error("Error fetching flight details:", error)
      return null
    }
  
    // Get departure airport details
    const { data: departureAirportData, error: departureAirportError } = await supabase
      .from("airports")
      .select("name, city")
      .eq("code", data.departure_airport)
      .single()
  
    if (departureAirportError) {
      console.error("Error fetching departure airport:", departureAirportError)
    }
  
    // Get arrival airport details
    const { data: arrivalAirportData, error: arrivalAirportError } = await supabase
      .from("airports")
      .select("name, city")
      .eq("code", data.arrival_airport)
      .single()
  
    if (arrivalAirportError) {
      console.error("Error fetching arrival airport:", arrivalAirportError)
    }
  
    // Format the data
    return {
      id: data.id,
      flightNumber: data.flight_number,
      airline: data.airlines.name,
      airlineLogo: data.airlines.logo,
      departureAirport: data.departure_airport,
      departureAirportName: departureAirportData?.name || "",
      departureCity: departureAirportData?.city || "",
      arrivalAirport: data.arrival_airport,
      arrivalAirportName: arrivalAirportData?.name || "",
      arrivalCity: arrivalAirportData?.city || "",
      departureTime: data.departure_time,
      arrivalTime: data.arrival_time,
      duration: data.duration,
      price: data.flight_inventory[0]?.price || 0,
      cabinClass: data.flight_inventory[0]?.cabin_class || cabinClass,
      seatsAvailable: data.flight_inventory[0]?.seats_available || 0,
    }
  }
  
  // Function to check if seats are available
  export async function checkSeatAvailability(
    flightId: string,
    cabinClass: string,
    requiredSeats: number,
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("flight_inventory")
      .select("seats_available")
      .eq("flight_id", flightId)
      .eq("cabin_class", cabinClass)
      .single()
  
    if (error || !data) {
      console.error("Error checking seat availability:", error)
      return false
    }
  
    return data.seats_available >= requiredSeats
  }