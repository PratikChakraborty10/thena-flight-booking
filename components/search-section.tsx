"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, useCallback, Suspense } from "react"
import { format, parseISO } from "date-fns"
import { ArrowRight, ArrowLeftRight, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchFlights, type Flight, type SearchResults } from "@/helpers/api/get-flights"

// Create a wrapper component for the search functionality
function SearchFlightContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedOutbound, setSelectedOutbound] = useState<string | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extract search parameters
  const tripType = (searchParams.get("tripType") as "oneway" | "roundtrip") || "roundtrip"
  const origin = searchParams.get("origin") || ""
  const destination = searchParams.get("destination") || ""
  const departDate = searchParams.get("departDate") || ""
  const returnDate = searchParams.get("returnDate") || ""
  const adults = Number.parseInt(searchParams.get("adults") || "1")
  const children = Number.parseInt(searchParams.get("children") || "0")
  const infants = Number.parseInt(searchParams.get("infants") || "0")
  const cabinClass = searchParams.get("cabinClass") || "economy"

  // Create a stable search params object
  const searchQueryParams = {
    origin,
    destination,
    departDate,
    returnDate: returnDate || undefined,
    cabinClass,
    adults,
    children,
    infants,
    tripType,
  }

  // Use a memoized function to fetch flights
  const loadFlights = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchFlights(searchQueryParams)
      setResults(data)
    } catch (err) {
      console.error("Error fetching flights:", err)
      setError("Failed to fetch flight results. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [origin, destination, departDate, returnDate, cabinClass, adults, children, infants, tripType])

  // Load flights only once on component mount or when search params change
  useEffect(() => {
    loadFlights()
  }, [loadFlights])

  const totalPassengers = adults + children + infants
  const isRoundTrip = tripType === "roundtrip"

  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), "h:mm a")
    } catch (e) {
      return timeString
    }
  }

  const formatDate = (timeString: string) => {
    try {
      return format(parseISO(timeString), "EEE, MMM d")
    } catch (e) {
      return timeString
    }
  }

  const calculateTotalPrice = () => {
    let total = 0

    if (selectedOutbound && results?.outboundFlights) {
      const outboundFlight = results.outboundFlights.find((f) => f.id === selectedOutbound)
      if (outboundFlight) {
        total += outboundFlight.price * (adults + children * 0.75)
      }
    }

    if (selectedReturn && results?.returnFlights) {
      const returnFlight = results.returnFlights.find((f) => f.id === selectedReturn)
      if (returnFlight) {
        total += returnFlight.price * (adults + children * 0.75)
      }
    }

    return total.toFixed(2)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <h2 className="text-2xl font-semibold text-center">Searching for the best flights</h2>
        <p className="text-muted-foreground text-center mt-2">
          Finding flights from {origin} to {destination}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-5xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Flight Search Results</h1>
        <div className="flex items-center mt-2">
          <span className="font-medium">{origin}</span>
          {isRoundTrip ? <ArrowLeftRight className="mx-2 h-4 w-4" /> : <ArrowRight className="mx-2 h-4 w-4" />}
          <span className="font-medium">{destination}</span>
          <span className="mx-2 text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {departDate && formatDate(departDate)}
            {isRoundTrip && returnDate && ` - ${formatDate(returnDate)}`}
          </span>
          <span className="mx-2 text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {totalPassengers} {totalPassengers === 1 ? "passenger" : "passengers"}
          </span>
          <span className="mx-2 text-muted-foreground">•</span>
          <Badge variant="outline" className="capitalize">
            {cabinClass}
          </Badge>
        </div>
      </div>

      {results && results.outboundFlights && results.outboundFlights.length > 0 ? (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">{isRoundTrip ? "Outbound Flights" : "Available Flights"}</h2>
            <div className="space-y-4">
              {results.outboundFlights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  isSelected={selectedOutbound === flight.id}
                  onSelect={() => setSelectedOutbound(flight.id)}
                  passengers={totalPassengers}
                />
              ))}
            </div>
          </div>

          {isRoundTrip && results.returnFlights && results.returnFlights.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Return Flights</h2>
              <div className="space-y-4">
                {results.returnFlights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    isSelected={selectedReturn === flight.id}
                    onSelect={() => setSelectedReturn(flight.id)}
                    passengers={totalPassengers}
                  />
                ))}
              </div>
            </div>
          )}

          {(selectedOutbound || (!isRoundTrip && selectedOutbound)) && (
            <Card className="sticky bottom-4 mt-8 border-2 border-blue-500">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h3 className="font-semibold">Selected Flights</h3>
                    <p className="text-muted-foreground">
                      Total Price: <span className="font-bold text-lg">₹{calculateTotalPrice()}</span>
                    </p>
                  </div>
                  <Button
                    className="mt-4 md:mt-0 bg-blue-500 hover:bg-blue-600"
                    onClick={() => {
                      if (selectedOutbound) {
                        // Find the selected flight to pass its details
                        const selectedFlight = results?.outboundFlights.find((f) => f.id === selectedOutbound)
                        if (selectedFlight) {
                          // Create URL with all necessary parameters
                          const params = new URLSearchParams()
                          params.append("flightId", selectedFlight.id)
                          params.append("airline", selectedFlight.airline.name)
                          params.append("flightNumber", selectedFlight.flightNumber)
                          params.append("departureAirport", selectedFlight.departureAirport)
                          params.append("arrivalAirport", selectedFlight.arrivalAirport)
                          params.append("departureTime", selectedFlight.departureTime)
                          params.append("arrivalTime", selectedFlight.arrivalTime)
                          params.append("duration", selectedFlight.duration)
                          params.append("price", selectedFlight.price.toString())
                          params.append("cabinClass", selectedFlight.cabinClass)
                          params.append("adults", adults.toString())
                          // Navigate to booking page with parameters
                          window.location.href = `/create-booking?${params.toString()}`
                        }
                      }
                    }}
                  >
                    Continue to Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No flights found</h3>
          <p className="text-muted-foreground mt-2">We couldn't find any flights matching your search criteria.</p>
          <Button className="mt-6" onClick={() => window.history.back()}>
            Modify Search
          </Button>
        </div>
      )}
    </div>
  )
}

// Main component with Suspense
export default function SearchFlightSection() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <h2 className="text-2xl font-semibold text-center">Loading search results</h2>
      </div>
    }>
      <SearchFlightContent />
    </Suspense>
  )
}

function FlightCard({
  flight,
  isSelected,
  onSelect,
  passengers,
}: {
  flight: Flight
  isSelected: boolean
  onSelect: () => void
  passengers: number
}) {
  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), "h:mm a")
    } catch (e) {
      return timeString
    }
  }

  const formatDate = (timeString: string) => {
    try {
      return format(parseISO(timeString), "EEE, MMM d")
    } catch (e) {
      return timeString
    }
  }

  return (
    <Card className={`transition-all ${isSelected ? "border-2 border-blue-500" : ""}`}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
              {flight.airline.logo ? (
                <img
                  src={flight.airline.logo || "/placeholder.svg"}
                  alt={flight.airline.name}
                  className="object-contain"
                />
              ) : (
                <span className="font-bold text-sm">{flight.airline.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="font-medium">{flight.airline.name}</p>
              <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center mt-4 md:mt-0 space-y-4 md:space-y-0 md:space-x-6">
            <div className="text-center">
              <p className="font-bold text-lg">{formatTime(flight.departureTime)}</p>
              <p className="text-sm">{flight.departureAirport}</p>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-xs text-muted-foreground">{flight.duration}</p>
              <div className="relative w-24 md:w-32">
                <Separator className="my-2" />
                <ArrowRight className="absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2" />
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(flight.departureTime)}</p>
            </div>

            <div className="text-center">
              <p className="font-bold text-lg">{formatTime(flight.arrivalTime)}</p>
              <p className="text-sm">{flight.arrivalAirport}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 pt-4 border-t">
          <div>
            <Badge variant="outline" className="capitalize">
              {flight.cabinClass}
            </Badge>
            <p className="text-sm mt-1">{flight.seatsAvailable} seats available</p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col items-end">
            <p className="font-bold text-xl">₹{flight.price}</p>
            <p className="text-xs text-muted-foreground">per passenger</p>
            <Button
              variant={isSelected ? "default" : "outline"}
              className={`mt-2 ${isSelected ? "bg-blue-500 hover:bg-blue-600" : ""}`}
              onClick={onSelect}
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}