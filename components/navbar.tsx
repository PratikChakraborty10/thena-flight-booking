"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
}

const NavLink = ({ href, children, mobile = false }: NavLinkProps) => (
  <Link
    href={href}
    className={cn(
      "text-gray-700 hover:text-sky-600 transition-colors",
      mobile ? "text-lg py-3" : "text-sm font-medium"
    )}
  >
    {children}
  </Link>
);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="p-4 w-full bg-white border-b border-gray-200 z-50 fixed top-0">
      <div className="w-full mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Plane className="h-6 w-6 text-sky-600" />
          <Link href="/" className="font-bold text-xl text-gray-900">
            SkyBooker
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/bookings">My Bookings</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </nav>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-white pt-20 px-6 animate-fade-in">
            <nav className="flex flex-col space-y-4">
              <NavLink href="/" mobile>Home</NavLink>
              <NavLink href="/bookings" mobile>My Bookings</NavLink>
              <NavLink href="/about" mobile>About</NavLink>
              <NavLink href="/contact" mobile>Contact</NavLink>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
