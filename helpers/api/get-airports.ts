import { supabase } from "@/lib/supabase";

export async function fetchAirports(options = {}) {
    const { data, error } = await supabase
      .from("airports")
      .select("*")
      .order(options.orderBy || "name");
  
    if (error) {
      console.error(error);
      throw new Error("Unable to load airports");
    }
  
    return data;
  }