"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { 
  Ticket, 
  MapPin, 
  Clock, 
  User, 
  CreditCard, 
  CheckCircle, 
  XCircle,
  Printer,
  Download,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { fetchBookingDetails, BookingDetails } from "@/helpers/api/get-booking-details"
export default function BookingDetailsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for successful booking redirect
  const isSuccess = searchParams.get('success') === 'true'

  useEffect(() => {
    if (isSuccess) {
      toast.success("Booking Confirmed!", {
        description: "Your flight has been booked successfully."
      })
    }
  }, [isSuccess])

  useEffect(() => {
    // Fetch booking details
    const loadBookingDetails = async () => {
      // Ensure user is authenticated
      if (!user) {
        router.push('/login')
        return
      }

      try {
        setIsLoading(true)
        const bookingData = await fetchBookingDetails({}, params.id)
        setBooking(bookingData)
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError('Failed to fetch booking details')
        toast.error('Booking Not Found', {
          description: 'Unable to retrieve booking information'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadBookingDetails()
  }, [params.id, user, router])

  // Format date and time utility
  const formatDateTime = (dateString: string, formatStr: string) => {
    try {
      return format(parseISO(dateString), formatStr)
    } catch (e) {
      return dateString
    }
  }

  // Print booking details
  const handlePrint = () => {
    window.print()
  }

  // Download booking details as PDF
  const handleDownload = () => {
    window.alert("Download function yet to be added") // TODO
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <h2 className="text-2xl font-semibold text-center">Loading your booking details</h2>
        <p className="text-muted-foreground text-center mt-2">
          This typically takes 5s to load the data. If taking more time please clear the cookies and retry
        </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !booking) {
    return (
      <div className="container max-w-5xl mx-auto p-4 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              We couldn't retrieve the booking details. Please check and try again.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push('/bookings')}>
                View All Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Rest of the component remains the same as in the original code
  return (
    <div className="container max-w-5xl mx-auto p-4 print:p-0">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-3xl font-bold">Booking Details</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Booking Status */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Booking Status</CardTitle>
            <Badge 
              variant={
                booking.booking_status === 'confirmed' ? 'default' : 
                booking.booking_status === 'cancelled' ? 'destructive' : 'outline'
              }
            >
              {booking.booking_status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            {booking.booking_status === 'confirmed' ? (
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500 mr-2" />
            )}
            <div>
              <p className="font-medium">Booking Reference: {booking.booking_reference}</p>
              <p className="text-sm text-muted-foreground">
                {booking.booking_status === 'confirmed' 
                  ? 'Your booking is confirmed and ready' 
                  : 'There might be an issue with your booking'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flight Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Flight Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-2">
                <Ticket className="h-5 w-5 mr-2 text-blue-500" />
                <span className="font-medium">Flight Details</span>
              </div>
              <p>{booking.airline}</p>
              <p>Flight Number: {booking.flight_number}</p>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 mr-2 text-green-500" />
                <span className="font-medium">Route</span>
              </div>
              <p>From: {booking.departure_airport}</p>
              <p>To: {booking.arrival_airport}</p>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 mr-2 text-purple-500" />
                <span className="font-medium">Departure</span>
              </div>
              <p>{formatDateTime(booking.departure_datetime, "EEE, MMM d, yyyy")}</p>
              <p>{formatDateTime(booking.departure_datetime, "h:mm a")}</p>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 mr-2 text-orange-500" />
                <span className="font-medium">Arrival</span>
              </div>
              <p>{formatDateTime(booking.arrival_datetime, "EEE, MMM d, yyyy")}</p>
              <p>{formatDateTime(booking.arrival_datetime, "h:mm a")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passenger Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Passenger Details</CardTitle>
        </CardHeader>
        <CardContent>
          {booking.passenger_details.map((passenger, index) => (
            <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 mr-2 text-teal-500" />
                <span className="font-medium">Passenger {index + 1}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <p>Name: {passenger.firstName} {passenger.lastName}</p>
                <p>Gender: {passenger.gender}</p>
                {passenger.contactNumber && (
                  <p>Contact: {passenger.contactNumber}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-2">
            <CreditCard className="h-5 w-5 mr-2 text-indigo-500" />
            <span className="font-medium">Payment Status</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Badge 
                variant={
                  booking.payment_status === 'completed' ? 'default' : 
                  booking.payment_status === 'pending' ? 'outline' : 'destructive'
                }
              >
                {booking.payment_status.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="font-bold text-xl">₹{booking.total_price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Paid</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}