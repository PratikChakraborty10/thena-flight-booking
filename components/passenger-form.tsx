"use client"

import React, { useState } from 'react';
import { PlusCircle, Trash2, Users } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
}

interface PassengerFormProps {
  passengers: Passenger[];
  onUpdatePassengers: (passengers: Passenger[]) => void;
}

const PassengerForm: React.FC<PassengerFormProps> = ({ 
  passengers, 
  onUpdatePassengers 
}) => {
  const addPassenger = () => {
    const newPassenger: Passenger = {
      id: `passenger-${Date.now()}`,
      firstName: "",
      lastName: "",
      gender: "",
    };
    
    onUpdatePassengers([...passengers, newPassenger]);
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value,
    };
    
    onUpdatePassengers(updatedPassengers);
  };

  const removePassenger = (index: number) => {
    const updatedPassengers = passengers.filter((_, i) => i !== index);
    onUpdatePassengers(updatedPassengers);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2 text-flight-accent" />
          <span>Passenger Details</span>
        </CardTitle>
        <CardDescription>
          Please enter details for all passengers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {passengers.map((passenger, index) => (
          <div 
            key={passenger.id} 
            className="p-4 rounded-lg border group transition-all hover:border-flight-accent"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Passenger {index + 1}</h3>
              {passengers.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="remove-button"
                  onClick={() => removePassenger(index)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`firstName-${index}`} className="block text-sm font-medium mb-1">
                  First Name
                </label>
                <Input
                  id={`firstName-${index}`}
                  value={passenger.firstName}
                  onChange={(e) => updatePassenger(index, "firstName", e.target.value)}
                  className="w-full"
                  placeholder="First Name"
                />
              </div>
              
              <div>
                <label htmlFor={`lastName-${index}`} className="block text-sm font-medium mb-1">
                  Last Name
                </label>
                <Input
                  id={`lastName-${index}`}
                  value={passenger.lastName}
                  onChange={(e) => updatePassenger(index, "lastName", e.target.value)}
                  className="w-full"
                  placeholder="Last Name"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor={`gender-${index}`} className="block text-sm font-medium mb-1">
                  Gender
                </label>
                <Select
                  value={passenger.gender}
                  onValueChange={(value) => updatePassenger(index, "gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          className="w-full border-dashed border-flight-accent text-flight-accent hover:bg-flight-accent/5"
          onClick={addPassenger}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Another Passenger
        </Button>
      </CardContent>
    </Card>
  );
};

export default PassengerForm;