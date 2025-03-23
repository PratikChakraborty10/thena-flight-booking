import { supabase } from "@/lib/supabase"

export interface Airline {
  id: string
  name: string
  logo: string
}

export interface Airport {
  id: string
  code: string
  name: string
  city: string
  country: string
}

export interface Flight {
  id: string
  flight_number: string
  airline_id: string
  departure_airport: string
  arrival_airport: string
  departure_time: string
  arrival_time: string
  duration: string
  airline?: Airline
  departureAirportDetails?: Airport
  arrivalAirportDetails?: Airport
}

export interface FlightInventory {
  id: string
  flight_id: string
  seats_available: number
  cabin_class: string
  price: number
}

export interface FlightWithDetails {
  id: string
  airline: Airline
  flightNumber: string
  departureAirport: string
  departureCity: string
  departureTime: string
  arrivalAirport: string
  arrivalCity: string
  arrivalTime: string
  duration: string
  price: number
  cabinClass: string
  seatsAvailable: number
}

export interface SearchResults {
  outboundFlights: FlightWithDetails[]
  returnFlights: FlightWithDetails[] | null
}

export async function fetchFlightData(
  origin: string,
  destination: string,
  departDate: string,
  returnDate: string | null,
  isRoundTrip: boolean,
  cabinClass: string,
): Promise<SearchResults> {
  // Format date for comparison (keep only YYYY-MM-DD part)
  const formattedDepartDate = departDate.split("T")[0]

  // Fetch outbound flights
  const outboundFlights = await fetchFlightsForRoute(origin, destination, formattedDepartDate, cabinClass)

  // Fetch return flights if round trip
  let returnFlights = null
  if (isRoundTrip && returnDate) {
    const formattedReturnDate = returnDate.split("T")[0]
    returnFlights = await fetchFlightsForRoute(destination, origin, formattedReturnDate, cabinClass)
  }

  return {
    outboundFlights,
    returnFlights,
  }
}

async function fetchFlightsForRoute(
  origin: string,
  destination: string,
  date: string,
  cabinClass: string,
): Promise<FlightWithDetails[]> {
  try {
    // Step 1: Get airports by code
    const { data: originAirport } = await supabase
      .from("airports")
      .select("*")
      .eq("code", origin.toUpperCase())
      .single()

    const { data: destAirport } = await supabase
      .from("airports")
      .select("*")
      .eq("code", destination.toUpperCase())
      .single()

    if (!originAirport || !destAirport) {
      throw new Error("Airport not found")
    }

    // Step 2: Get flights for the route on the specified date
    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    const { data: flights, error: flightsError } = await supabase
      .from("flights")
      .select(`
        *,
        airline:airline_id(*)
      `)
      .eq("departure_airport", origin.toUpperCase())
      .eq("arrival_airport", destination.toUpperCase())
      .gte("departure_time", startOfDay)
      .lte("departure_time", endOfDay)

    if (flightsError) throw flightsError
    if (!flights || flights.length === 0) return []

    // Step 3: Get inventory for these flights with the specified cabin class
    const flightIds = flights.map((flight) => flight.id)

    const { data: inventory, error: inventoryError } = await supabase
      .from("flight_inventory")
      .select("*")
      .in("flight_id", flightIds)
      .eq("cabin_class", cabinClass.toLowerCase())

    if (inventoryError) throw inventoryError

    // Step 4: Combine the data
    const flightsWithDetails: FlightWithDetails[] = []

    for (const flight of flights) {
      const flightInventory = inventory?.find((inv) => inv.flight_id === flight.id)

      if (flightInventory && flightInventory.seats_available > 0) {
        flightsWithDetails.push({
          id: flight.id,
          airline: {
            id: flight.airline.id,
            name: flight.airline.name,
            logo: flight.airline.logo,
          },
          flightNumber: flight.flight_number,
          departureAirport: flight.departure_airport,
          departureCity: originAirport.city,
          departureTime: flight.departure_time,
          arrivalAirport: flight.arrival_airport,
          arrivalCity: destAirport.city,
          arrivalTime: flight.arrival_time,
          duration: flight.duration,
          price: flightInventory.price,
          cabinClass: flightInventory.cabin_class,
          seatsAvailable: flightInventory.seats_available,
        })
      }
    }

    return flightsWithDetails
  } catch (error) {
    console.error("Error fetching flights:", error)
    return []
  }
}

