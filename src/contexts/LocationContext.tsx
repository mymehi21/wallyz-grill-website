import { createContext, useContext, useState, ReactNode } from 'react';

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  cloverMerchantId: string;
  cloverApiToken: string;
  directions: string;
  comingSoon?: boolean;
}

interface LocationContextType {
  selectedLocation: Location;
  setSelectedLocation: (location: Location) => void;
  locations: Location[];
  hasSelection: boolean;
  clearSelection: () => void;
}

// Default locations
const defaultLocations: Location[] = [
  {
    id: 'location1',
    name: 'Wallyz Grill - Oak Park',
    address: '25000 Greenfield Rd, Oak Park, MI 48237',
    phone: '(248) 993-9330',
    cloverMerchantId: 'JKK2PQSFMZNS1',
    cloverApiToken: '74ced84f-11bc-7103-0bdd-4da52e7e0842',
    directions: 'https://maps.google.com/?q=25000+Greenfield+Rd,+Oak+Park,+MI+48237'
  },
  {
    id: 'location2',
    name: 'Wallyz Grill - Redford',
    address: '25575 5 Mile Rd, Redford, MI 48239',
    phone: '(313) 800-1954',
    cloverMerchantId: 'G6JZKQKPDNT71',
    cloverApiToken: 'b92256f2-54bd-75d3-394e-f13c76b59ae4',
    directions: 'https://maps.google.com/?q=25575+5+Mile+Rd,+Redford,+MI+48239',
  }
];

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null);

  const setSelectedLocation = (location: Location) => {
    setSelectedLocationState(location);
  };

  const clearSelection = () => {
    setSelectedLocationState(null);
  };

  // We expose selectedLocation as non-null. Consumers must only render
  // when hasSelection is true (the LocationGate enforces this).
  // We give a safe placeholder so destructuring at module top-level
  // (e.g. in component definitions) doesn't crash before the gate renders.
  const safeSelectedLocation: Location = selectedLocation || defaultLocations[0];

  return (
    <LocationContext.Provider value={{
      selectedLocation: safeSelectedLocation,
      setSelectedLocation,
      locations: defaultLocations,
      hasSelection: selectedLocation !== null,
      clearSelection,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
}
