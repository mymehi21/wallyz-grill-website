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
}

// Default locations
const defaultLocations: Location[] = [
  {
    id: 'location1',
    name: 'Wallyz Grill - Oak Park',
    address: '25000 Greenfield Rd, Oak Park, MI 48237',
    phone: '(248) 993-9330',
    cloverMerchantId: 'YOUR_CLOVER_MERCHANT_ID',
    cloverApiToken: 'YOUR_CLOVER_API_TOKEN',
    directions: 'https://maps.google.com/?q=25000+Greenfield+Rd,+Oak+Park,+MI+48237'
  },
  {
    id: 'location2',
    name: 'Wallyz Grill - Redford',
    address: 'Coming Soon',
    phone: 'Coming Soon',
    cloverMerchantId: '',
    cloverApiToken: '',
    directions: '#',
    comingSoon: true
  }
];

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<Location>(defaultLocations[0]);

  return (
    <LocationContext.Provider value={{ selectedLocation, setSelectedLocation, locations: defaultLocations }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
