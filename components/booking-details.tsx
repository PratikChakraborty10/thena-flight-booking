"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, MapPin, Search, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useFetch from "@/hooks/use-fetch"
import { fetchAirports } from "@/helpers/api/get-airports"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface Airport {
  code: string
  name: string
}

interface SearchFormData {
  tripType: "oneway" | "roundtrip"
  origin: string
  originCode: string
  destination: string
  destinationCode: string
  departDate: Date | undefined
  returnDate: Date | undefined
  passengers: {
    adults: number
    children: number
    infants: number
  }
  cabinClass: "economy" | "premium" | "business" | "first"
}

const BookingSection: React.FC = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<SearchFormData>({
    tripType: "oneway",
    origin: "",
    originCode: "",
    destination: "",
    destinationCode: "",
    departDate: undefined,
    returnDate: undefined,
    passengers: {
      adults: 1,
      children: 0,
      infants: 0,
    },
    cabinClass: "economy",
  })

  const [isFormValid, setIsFormValid] = useState(false)

  const [passengersOpen, setPassengersOpen] = useState(false)
  const [originOpen, setOriginOpen] = useState(false)
  const [destinationOpen, setDestinationOpen] = useState(false)

  const {
    data: airports,
    loading,
    error,
    fn: loadAirports,
  } = useFetch(fetchAirports, {
    orderBy: "name", 
  })

  // Validate form whenever relevant fields change
  useEffect(() => {
    const requiredFieldsValid = Boolean(formData.originCode && formData.destinationCode && formData.departDate)

    // const roundTripValid = formData.tripType === "roundtrip" ? Boolean(formData.returnDate) : true

    setIsFormValid(requiredFieldsValid)
  }, [formData.originCode, formData.destinationCode, formData.departDate, formData.returnDate, formData.tripType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Create query parameters
    const queryParams = new URLSearchParams()
    queryParams.append("tripType", formData.tripType)
    queryParams.append("origin", formData.originCode) 
    queryParams.append("destination", formData.destinationCode)

    if (formData.departDate) {
      queryParams.append("departDate", format(formData.departDate, "yyyy-MM-dd"))
    }

    if (formData.returnDate && formData.tripType === "roundtrip") {
      queryParams.append("returnDate", format(formData.returnDate, "yyyy-MM-dd"))
    }

    queryParams.append("adults", formData.passengers.adults.toString())
    queryParams.append("cabinClass", formData.cabinClass)

    // Navigate to search page with query parameters
    router.push(`/search?${queryParams.toString()}`)
  }

  const updatePassengers = (type: "adults" | "children" | "infants", value: number) => {
    setFormData({
      ...formData,
      passengers: {
        ...formData.passengers,
        [type]: value,
      },
    })
  }

  const totalPassengers = formData.passengers.adults + formData.passengers.children + formData.passengers.infants

  return (
    <Card className="search-card mx-auto -mt-8 relative z-10 max-w-5xl">
      <form onSubmit={handleSubmit} className="p-4 md:p-6">
        <div className="mb-6">
          <RadioGroup
            defaultValue={formData.tripType}
            className="flex space-x-4"
            onValueChange={(value) => setFormData({ ...formData, tripType: value as "oneway" | "roundtrip" })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="roundtrip" id="roundtrip" disabled />
              <Label htmlFor="roundtrip">Round Trip</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oneway" id="oneway" />
              <Label htmlFor="oneway">One Way</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="origin">From</Label>
            <Popover
              open={originOpen}
              onOpenChange={(open) => {
                setOriginOpen(open)
                if (open && (!airports || airports.length === 0)) {
                  loadAirports()
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={originOpen} className="w-full justify-between">
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                    {formData.origin ? formData.origin : "Origin city or airport"}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search airport..." className="w-full truncate" />
                  <CommandList>
                    <CommandEmpty>No airport found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {airports &&
                        airports.map((airport: Airport) => (
                          <CommandItem
                            key={airport.code}
                            value={`${airport.name} (${airport.code})`}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                origin: `${airport.name} (${airport.code})`,
                                originCode: airport.code,
                              })
                              setOriginOpen(false)
                            }}
                            className="overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            {airport.name} ({airport.code})
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">To</Label>
            <Popover
              open={destinationOpen}
              onOpenChange={(open) => {
                setDestinationOpen(open)
                if (open && (!airports || airports.length === 0)) {
                  loadAirports()
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={destinationOpen}
                  className="w-full justify-between"
                >
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                    {formData.destination ? formData.destination : "Destination city or airport"}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search airport..." />
                  <CommandList>
                    <CommandEmpty>No airport found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {airports &&
                        airports.map((airport: Airport) => (
                          <CommandItem
                            key={airport.code}
                            value={`${airport.name} (${airport.code})`}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                destination: `${airport.name} (${airport.code})`,
                                destinationCode: airport.code,
                              })
                              setDestinationOpen(false)
                            }}
                          >
                            {airport.name} ({airport.code})
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Depart</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.departDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.departDate ? format(formData.departDate, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.departDate}
                  onSelect={(date) => setFormData({ ...formData, departDate: date })}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Return</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    (!formData.returnDate || formData.tripType === "oneway") && "text-muted-foreground",
                  )}
                  disabled={formData.tripType === "oneway"}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.returnDate && formData.tripType === "roundtrip" ? (
                    format(formData.returnDate, "PPP")
                  ) : (
                    <span>Select date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.returnDate}
                  onSelect={(date) => setFormData({ ...formData, returnDate: date })}
                  disabled={(date) => (formData.departDate ? date < formData.departDate : false)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Passengers</Label>
            <Popover open={passengersOpen} onOpenChange={setPassengersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    <span>
                      {totalPassengers} {totalPassengers === 1 ? "Passenger" : "Passengers"}
                    </span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4 p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Adults</div>
                      <div className="text-sm text-gray-500">Age 12+</div>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          if (formData.passengers.adults > 1) {
                            updatePassengers("adults", formData.passengers.adults - 1)
                          }
                        }}
                        type="button"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{formData.passengers.adults}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updatePassengers("adults", formData.passengers.adults + 1)}
                        type="button"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => setPassengersOpen(false)} type="button">
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cabinClass">Cabin Class</Label>
            <Select
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  cabinClass: value as "economy" | "premium" | "business" | "first",
                })
              }
              defaultValue={formData.cabinClass}
            >
              <SelectTrigger id="cabinClass">
                <SelectValue placeholder="Select cabin class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="premium">Premium Economy</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="first">First Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
          disabled={!isFormValid}
        >
          <Search className="mr-2 h-4 w-4" />
          Search Flights
        </Button>
      </form>
    </Card>
  )
}

export default BookingSection

