"use client"

import React from 'react';
import { Calendar, Clock, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface FlightDetailProps {
  from: string;
  to: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  flightNumber: string;
  duration: string;
  price: number;
}

const FlightDetail: React.FC<FlightDetailProps> = ({
  from,
  to,
  date,
  departureTime,
  arrivalTime,
  flightNumber,
  duration,
  price
}) => {
  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-flight-accent text-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium px-2 py-1 bg-white/20 rounded-full">
                {flightNumber}
              </span>
              <span className="text-sm">Direct Flight</span>
            </div>
            <div className="text-lg font-medium">${price}</div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-4 h-4 mr-2 text-flight-secondary" />
            <span className="text-sm text-flight-secondary">{date}</span>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-start">
              <span className="text-2xl font-medium">{departureTime}</span>
              <span className="text-lg">{from}</span>
            </div>
            
            <div className="flex-1 mx-4 flex flex-col items-center relative">
              <div className="w-full border-t border-dashed border-flight-secondary/40 absolute top-4"></div>
              <Plane className="w-5 h-5 text-flight-accent mt-1 transform rotate-90 z-10 bg-white rounded-full p-0.5" />
              <span className="text-xs text-flight-secondary mt-1">{duration}</span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-2xl font-medium">{arrivalTime}</span>
              <span className="text-lg">{to}</span>
            </div>
          </div>
          
          <Separator className="my-5" />
          
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-flight-secondary" />
            <span className="text-sm text-flight-secondary">
              Local time at destination
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightDetail;