"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ArrowRight, Ticket, CheckCircle2, X, CreditCard, AlertTriangle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getFlightDetails, checkSeatAvailability, type FlightDetails } from "@/helpers/api/check-flight-details"
import { createBooking } from "@/helpers/api/booking-service"
import { PaymentProcessingModal } from "@/components/payment-processing-modal"
import { toast } from "sonner"
import useFetch from "@/hooks/use-fetch"
import { useAuth } from "@/contexts/auth-context"

// Define coupon type
interface Coupon {
  code: string
  discount: number // Percentage discount
  description: string
}

// Define passenger type
interface Passenger {
  id: number
  type: "adult" | "child" | "infant"
  firstName: string
  lastName: string
  gender: "male" | "female" | "other" | ""
  contactNumber?: string // Only required for the first passenger
}

// Create a separate component for the booking content that uses useSearchParams
function BookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()

  // Payment and booking states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [bookingInProgress, setBookingInProgress] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingReference, setBookingReference] = useState("")

  // Passenger counts from URL
  const adultsCount = Number.parseInt(searchParams.get("adults") || "1")
  const childrenCount = Number.parseInt(searchParams.get("children") || "0")
  const infantsCount = Number.parseInt(searchParams.get("infants") || "0")
  const totalPassengers = adultsCount + childrenCount

  // State for passengers
  const [passengers, setPassengers] = useState<Passenger[]>([])

  // State for price change tracking
  const [priceChanged, setPriceChanged] = useState(false)
  const [priceChangeType, setPriceChangeType] = useState("increased")
  const [priceChangeAmount, setPriceChangeAmount] = useState(0)

  // State for coupons
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const [couponError, setCouponError] = useState("")

  // Track if initial data fetch is complete
  const [initialFetchDone, setInitialFetchDone] = useState(false)

  // Using useFetch hook for getFlightDetails API call
  const {
    data: flight,
    loading: flightLoading,
    error: flightError,
    fn: fetchFlightDetails,
  } = useFetch<FlightDetails>((options, flightId: string, cabinClass: string) => getFlightDetails(flightId, cabinClass))

  // Using useFetch hook for checkSeatAvailability API call
  const {
    data: seatAvailabilityData,
    loading: seatAvailabilityLoading,
    fn: checkAvailability,
  } = useFetch<boolean>((options, flightId: string, cabinClass: string, passengerCount: number) =>
    checkSeatAvailability(flightId, cabinClass, passengerCount),
  )

  // Available coupons
  const availableCoupons: Coupon[] = [
    { code: "FIRST10", discount: 10, description: "10% off your first booking" },
    { code: "SUMMER25", discount: 25, description: "25% off summer flights" },
    { code: "WELCOME15", discount: 15, description: "15% welcome discount" },
    { code: "FLASH50", discount: 50, description: "50% flash sale discount" },
  ]

  // Initialize passengers based on count only once
  useEffect(() => {
    const newPassengers: Passenger[] = []

    // Add adults
    for (let i = 0; i < adultsCount; i++) {
      newPassengers.push({
        id: i,
        type: "adult",
        firstName: "",
        lastName: "",
        gender: "",
        contactNumber: i === 0 ? "" : undefined, // Only first passenger needs contact
      })
    }

    setPassengers(newPassengers)
  }, [adultsCount])

  // Fetch flight details and check seat availability only once when component mounts
  useEffect(() => {
    // Skip if we've already done the initial fetch
    if (initialFetchDone) return

    const flightId = searchParams.get("flightId")
    const cabinClass = searchParams.get("cabinClass") || "economy"

    if (flightId) {
      fetchFlightDetails(flightId, cabinClass)
      checkAvailability(flightId, cabinClass, totalPassengers)
      setInitialFetchDone(true)
    }
  }, [searchParams, fetchFlightDetails, checkAvailability, totalPassengers, initialFetchDone])

  // Check for live price change - only runs when flight data changes
  useEffect(() => {
    if (flight) {
      // Get the original price from query params
      const originalPrice = Number(searchParams.get("price") || "0")

      // If we have both prices and they're different
      if (originalPrice > 0 && originalPrice !== flight.price) {
        // Calculate the difference
        const priceDifference = flight.price - originalPrice
        setPriceChangeType(priceDifference > 0 ? "increased" : "decreased")
        setPriceChangeAmount(Math.abs(priceDifference))
        setPriceChanged(true)
      }
    }
  }, [flight, searchParams])

  // Update passenger details
  const updatePassenger = (id: number, field: keyof Passenger, value: string) => {
    setPassengers((prev) =>
      prev.map((passenger) => (passenger.id === id ? { ...passenger, [field]: value } : passenger)),
    )
  }

  // Apply coupon code
  const applyCoupon = () => {
    const coupon = availableCoupons.find((c) => c.code === couponCode)

    if (coupon) {
      setAppliedCoupon(coupon)
      setCouponError("")
    } else {
      setAppliedCoupon(null)
      setCouponError("Invalid coupon code")
    }
  }

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
  }

  // Calculate total price
  const calculateTotalPrice = () => {
    let total = 0

    if (flight) {
      total += flight.price * adultsCount
      total += flight.price * 0.75 * childrenCount
      total += flight.price * 0.1 * infantsCount
    }

    // Apply coupon discount if available
    if (appliedCoupon) {
      total = total * (1 - appliedCoupon.discount / 100)
    }

    return total
  }

  // Format date and time
  const formatDateTime = (dateString: string, formatStr: string) => {
    try {
      return format(parseISO(dateString), formatStr)
    } catch (e) {
      return dateString
    }
  }

  // Check if all required fields are filled
  const isFormValid = () => {
    return passengers.every(
      (passenger) =>
        passenger.firstName.trim() !== "" &&
        passenger.lastName.trim() !== "" &&
        passenger.gender !== "" &&
        // Only check contact number for the first passenger
        (passenger.id !== 0 || (passenger.contactNumber && passenger.contactNumber.trim() !== "")),
    )
  }

  // Handle payment success
  const handlePaymentSuccess = async () => {
    try {
      if (!user) {
        toast.error("Authentication Error", {
          description: "You must be logged in to complete a booking",
        })
        return
      }

      setBookingInProgress(true)

      // Create the booking in Supabase
      const totalPrice = calculateTotalPrice()
      const result = await createBooking(user.id, flight, passengers, totalPrice)

      if (result.success) {
        setBookingComplete(true)
        setBookingReference(result.data.booking_reference)

        toast.success("Booking Confirmed!", {
          description: `Your booking reference is ${result.data.booking_reference}`,
        })

        // Redirect to booking confirmation page after a short delay
        setTimeout(() => {
          router.push(`/bookings/${result.data.id}?success=true`)
        }, 2000)
      } else {
        toast.error("Booking Failed", {
          description: "There was an error creating your booking. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      toast.error("Booking Failed", {
        description: "There was an error creating your booking. Please try again.",
      })
    } finally {
      setBookingInProgress(false)
      setIsPaymentModalOpen(false)
    }
  }

  // Handle payment error
  const handlePaymentError = () => {
    toast.error("Payment Failed", {
      description: "Your payment could not be processed. Please try again.",
    })
    setIsPaymentModalOpen(false)
  }

  // Handle booking submission
  const handleBooking = async () => {
    if (!isFormValid()) {
      toast.error("Missing Information", {
        description: "Please fill in all required passenger details",
      })
      return
    }

    if (!seatAvailabilityData) {
      toast.error("Booking Error", {
        description: "Not enough seats available for this booking",
      })
      return
    }

    if (authLoading) {
      toast("Please wait", {
        description: "Checking your account information...",
      })
      return
    }

    if (!user) {
      toast.error("Authentication Required", {
        description: "Please log in to complete your booking",
      })
      return
    }

    // Open payment modal to start payment simulation
    setIsPaymentModalOpen(true)
  }

  // Check for loading state from both flight_inventory and flight tables
  const isLoading = flightLoading || seatAvailabilityLoading || authLoading

  // Show loading state first
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <h2 className="text-2xl font-semibold text-center">Loading your flight details</h2>
        <p className="text-muted-foreground text-center mt-2">
          This typically takes 5s to load the data. If taking more time please clear the cookies and retry
        </p>
      </div>
    )
  }

  // Then check for error state - only after loading is complete
  if (!isLoading && (flightError || !flight)) {
    return (
      <div className="container max-w-5xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>
            {flightError?.message || "No flight selected. Please go back and select a flight."}
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  // Show booking success state
  if (bookingComplete) {
    return (
      <div className="container max-w-5xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Your booking reference is <span className="font-bold">{bookingReference}</span>
          </p>
          <p className="text-center max-w-md mb-8">
            We've sent the booking details to your email. You can also view your booking in your account.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => router.push("/bookings")}>View My Bookings</Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Complete Your Booking</h1>

      {/* Flight Details Section */}
      <div className="mb-8">
        {priceChanged && (
          <Alert variant={priceChangeType === "increased" ? "destructive" : "success"} className="mt-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {priceChangeType === "increased" ? "Oops!" : "Congratulations!"} Price {priceChangeType} by ₹
              {priceChangeAmount}
            </AlertDescription>
          </Alert>
        )}
        <h2 className="text-xl font-semibold mb-4">Flight Details</h2>

        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Selected Flight</CardTitle>
              <Badge>{flight?.cabinClass}</Badge>
            </div>
            <CardDescription>{formatDateTime(flight?.departureTime, "EEE, MMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded overflow-hidden mr-4">
                  {flight?.airlineLogo ? (
                    <img
                      src={flight?.airlineLogo || "/placeholder.svg"}
                      alt={flight?.airline}
                      className="object-cover"
                    />
                  ) : (
                    <span className="font-bold text-sm">{flight?.airline.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{flight?.airline}</p>
                  <p className="text-sm text-muted-foreground">{flight?.flightNumber}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="text-center">
                  <p className="font-bold text-lg">{formatDateTime(flight?.departureTime, "h:mm a")}</p>
                  <p className="text-sm">{flight?.departureAirport}</p>
                  <p className="text-xs text-muted-foreground">{flight?.departureCity}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-xs text-muted-foreground">{flight?.duration}</p>
                  <div className="relative w-24 md:w-32">
                    <Separator className="my-2" />
                    <ArrowRight className="absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2" />
                  </div>
                </div>

                <div className="text-center">
                  <p className="font-bold text-lg">{formatDateTime(flight?.arrivalTime, "h:mm a")}</p>
                  <p className="text-sm">{flight?.arrivalAirport}</p>
                  <p className="text-xs text-muted-foreground">{flight?.arrivalCity}</p>
                </div>
              </div>
            </div>

            {!seatAvailabilityData && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Not enough seats available for this booking. Only {flight?.seatsAvailable} seats left in{" "}
                  {flight?.cabinClass} class.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Passenger Details Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Passenger Details</h2>

        {passengers.map((passenger, index) => (
          <Card key={passenger.id} className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Adult {index + 1}</CardTitle>
              <CardDescription>Age 12+</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`firstName-${passenger.id}`}>First Name*</Label>
                  <Input
                    id={`firstName-${passenger.id}`}
                    value={passenger.firstName}
                    onChange={(e) => updatePassenger(passenger.id, "firstName", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`lastName-${passenger.id}`}>Last Name*</Label>
                  <Input
                    id={`lastName-${passenger.id}`}
                    value={passenger.lastName}
                    onChange={(e) => updatePassenger(passenger.id, "lastName", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`gender-${passenger.id}`}>Gender*</Label>
                  <Select
                    value={passenger.gender}
                    onValueChange={(value) =>
                      updatePassenger(passenger.id, "gender", value as "male" | "female" | "other")
                    }
                  >
                    <SelectTrigger id={`gender-${passenger.id}`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {passenger.id === 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number*</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      value={passenger.contactNumber || ""}
                      onChange={(e) => updatePassenger(passenger.id, "contactNumber", e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coupon Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Apply Coupon</h2>
        <Card>
          <CardContent className="pt-6">
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 p-4 rounded-md">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <p className="font-medium">{appliedCoupon.code}</p>
                    <p className="text-sm text-muted-foreground">{appliedCoupon.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={removeCoupon}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  {couponError && <p className="text-sm text-red-500 mt-1">{couponError}</p>}
                </div>
                <Button onClick={applyCoupon}>Apply</Button>
              </div>
            )}

            <div className="mt-4">
              <p className="text-sm font-medium">Available Coupons:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {availableCoupons.map((coupon) => (
                  <div
                    key={coupon.code}
                    className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setCouponCode(coupon.code)
                      setAppliedCoupon(coupon)
                      setCouponError("")
                    }}
                  >
                    <Ticket className="h-4 w-4 mr-2 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{coupon.code}</p>
                      <p className="text-xs text-muted-foreground">{coupon.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Price Summary</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>
                  Base Fare ({adultsCount} Adult{adultsCount > 1 ? "s" : ""})
                </span>
                <span>₹{(flight?.price * adultsCount).toFixed(2)}</span>
              </div>

              {childrenCount > 0 && (
                <div className="flex justify-between">
                  <span>
                    Child Fare ({childrenCount} Child{childrenCount > 1 ? "ren" : ""})
                  </span>
                  <span>₹{(flight.price * 0.75 * childrenCount).toFixed(2)}</span>
                </div>
              )}

              {infantsCount > 0 && (
                <div className="flex justify-between">
                  <span>
                    Infant Fare ({infantsCount} Infant{infantsCount > 1 ? "s" : ""})
                  </span>
                  <span>₹{(flight.price * 0.1 * infantsCount).toFixed(2)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{calculateTotalPrice().toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>
                      -₹
                      {(
                        (flight.price * adultsCount +
                          flight.price * 0.75 * childrenCount +
                          flight.price * 0.1 * infantsCount) *
                        (appliedCoupon.discount / 100)
                      ).toFixed(2)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{calculateTotalPrice().toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          className="bg-blue-500 hover:bg-blue-600"
          onClick={handleBooking}
          disabled={!isFormValid() || !seatAvailabilityData || bookingInProgress}
        >
          {bookingInProgress ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Complete Booking
            </>
          )}
        </Button>
      </div>

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        amount={calculateTotalPrice()}
      />
    </div>
  )
}

// Main component with suspense boundary
export default function CreateFlightBooking() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-5xl mx-auto p-4 flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Loading booking details...</p>
          </div>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  )
}

