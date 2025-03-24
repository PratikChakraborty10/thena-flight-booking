import BookingSection from "@/components/booking-details";

export default function Home() {
  return (
    <div className="h-full w-full relative">
      <div className="w-full h-1/3 bg-blue-500 flex justify-center items-center">
        <div className="flex flex-col gap-2 items-center p-6">
        <h1 className="text-white text-5xl font-bold">Find and Book Your Perfect Flight</h1>
        </div>
      </div>
      <BookingSection />
    </div>
  );
}
