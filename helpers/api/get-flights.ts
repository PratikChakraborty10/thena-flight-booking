import { supabase } from "@/lib/supabase"

export interface FlightSearchParams {
    origin: string
    destination: string
    departDate: string
    returnDate?: string
    cabinClass: string
    adults: number
    children?: number
    infants?: number
    tripType: "oneway" | "roundtrip"
  }
  
  export interface Airline {
    id: string
    name: string
    logo: string
  }
  
  export interface Flight {
    id: string
    airline: Airline
    flightNumber: string
    departureAirport: string
    arrivalAirport: string
    departureTime: string
    arrivalTime: string
    duration: string
    price: number
    cabinClass: string
    seatsAvailable: number
  }
  
  export interface SearchResults {
    outboundFlights: Flight[]
    returnFlights: Flight[] | null
  }
  
  export async function fetchFlights(params: FlightSearchParams): Promise<SearchResults> {
    console.log("Fetching flights with params:", params)
  
    const { origin, destination, departDate, returnDate, cabinClass, tripType } = params
  
    // Format date for database query (assuming departDate is in YYYY-MM-DD format)
    const departDateObj = new Date(departDate)
    const departDateStart = new Date(departDateObj)
    departDateStart.setHours(0, 0, 0, 0)
  
    const departDateEnd = new Date(departDateObj)
    departDateEnd.setHours(23, 59, 59, 999)
  
    // Query for outbound flights
    const { data: outboundData, error: outboundError } = await supabase
      .from("flights")
      .select(`
        id,
        flight_number,
        departure_airport,
        arrival_airport,
        departure_time,
        arrival_time,
        duration,
        airlines (
          id,
          name,
          logo
        ),
        flight_inventory (
          id,
          seats_available,
          cabin_class,
          price
        )
      `)
      .eq("departure_airport", origin)
      .eq("arrival_airport", destination)
      .gte("departure_time", departDateStart.toISOString())
      .lte("departure_time", departDateEnd.toISOString())
      .eq("flight_inventory.cabin_class", cabinClass)
  
    if (outboundError) {
      console.error("Error fetching outbound flights:", outboundError)
      throw new Error("Failed to fetch outbound flights")
    }
  
    // Process outbound flights
    const outboundFlights = processFlightData(outboundData || [])
  
    // If round trip, query for return flights
    let returnFlights: Flight[] | null = null
  
    if (tripType === "roundtrip" && returnDate) {
      const returnDateObj = new Date(returnDate)
      const returnDateStart = new Date(returnDateObj)
      returnDateStart.setHours(0, 0, 0, 0)
  
      const returnDateEnd = new Date(returnDateObj)
      returnDateEnd.setHours(23, 59, 59, 999)
  
      const { data: returnData, error: returnError } = await supabase
        .from("flights")
        .select(`
          id,
          flight_number,
          departure_airport,
          arrival_airport,
          departure_time,
          arrival_time,
          duration,
          airlines (
            id,
            name,
            logo
          ),
          flight_inventory (
            id,
            seats_available,
            cabin_class,
            price
          )
        `)
        .eq("departure_airport", destination)
        .eq("arrival_airport", origin)
        .gte("departure_time", returnDateStart.toISOString())
        .lte("departure_time", returnDateEnd.toISOString())
        .eq("flight_inventory.cabin_class", cabinClass)
  
      if (returnError) {
        console.error("Error fetching return flights:", returnError)
        throw new Error("Failed to fetch return flights")
      }
  
      returnFlights = processFlightData(returnData || [])
    }
  
    return {
      outboundFlights,
      returnFlights,
    }
  }
  
  // Helper function to process flight data from Supabase
  function processFlightData(data: any[]): Flight[] {
    return data.map((flight) => {
      // Find the inventory record for the requested cabin class
      const inventory = Array.isArray(flight.flight_inventory) ? flight.flight_inventory[0] : flight.flight_inventory
  
      return {
        id: flight.id,
        airline: {
          id: flight.airlines.id,
          name: flight.airlines.name,
          logo: flight.airlines.logo,
        },
        flightNumber: flight.flight_number,
        departureAirport: flight.departure_airport,
        arrivalAirport: flight.arrival_airport,
        departureTime: flight.departure_time,
        arrivalTime: flight.arrival_time,
        duration: flight.duration,
        price: inventory?.price || 0,
        cabinClass: inventory?.cabin_class || "economy",
        seatsAvailable: inventory?.seats_available || 0,
      }
    })
  }