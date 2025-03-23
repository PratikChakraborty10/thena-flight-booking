'use client';

import React, { useState } from 'react';
import { Check, Ticket } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  description: string;
}

interface CouponSectionProps {
  onApplyCoupon: (coupon: Coupon | null) => void;
}

const availableCoupons: Coupon[] = [
  {
    id: "1",
    code: "FIRST10",
    discount: 10,
    description: "10% off on your first booking"
  },
  {
    id: "2",
    code: "SUMMER25",
    discount: 25,
    description: "25% off on summer flights"
  },
  {
    id: "3",
    code: "FLASH50",
    discount: 50,
    description: "50% off flash sale"
  }
];

const CouponSection: React.FC<CouponSectionProps> = ({ onApplyCoupon }) => {
  const [couponCode, setCouponCode] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [error, setError] = useState("");

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    const coupon = availableCoupons.find(
      (coupon) => coupon.code.toLowerCase() === couponCode.toLowerCase()
    );

    if (coupon) {
      setSelectedCoupon(coupon);
      onApplyCoupon(coupon);
      setError("");
    } else {
      setError("Invalid coupon code");
      setSelectedCoupon(null);
      onApplyCoupon(null);
    }
  };

  const handleSelectCoupon = (coupon: Coupon) => {
    setCouponCode(coupon.code);
    setSelectedCoupon(coupon);
    onApplyCoupon(coupon);
    setError("");
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Ticket className="w-5 h-5 mr-2 text-flight-accent" />
          <span>Apply Coupon</span>
        </CardTitle>
        <CardDescription>
          Enter a coupon code or select from available coupons
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-2">
          <Input
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="focus-visible:ring-flight-accent"
          />
          <Button 
            onClick={handleApplyCoupon}
            className="bg-flight-accent hover:bg-flight-accent/90"
          >
            Apply
          </Button>
        </div>
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        
        <div>
          <p className="text-sm font-medium mb-3">Available Coupons</p>
          <div className="space-y-3">
            {availableCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`coupon-item flex justify-between items-center ${
                  selectedCoupon?.id === coupon.id ? "coupon-item-active" : ""
                }`}
                onClick={() => handleSelectCoupon(coupon)}
              >
                <div>
                  <p className="font-medium">{coupon.code}</p>
                  <p className="text-sm text-flight-secondary">
                    {coupon.description}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-flight-accent font-medium">
                    {coupon.discount}% off
                  </span>
                  {selectedCoupon?.id === coupon.id && (
                    <Check className="ml-2 w-5 h-5 text-flight-accent" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CouponSection;
