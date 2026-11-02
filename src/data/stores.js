// Fictional stockists for the concept site. lon/lat place the pins on the map.
export const STORES = [
  { city: 'New York', state: 'NY', name: 'Septem Kitchen & Shop', flagship: true, address: '14 Cacao Lane, SoHo', hours: 'Tue–Sun · 10am–6pm', lon: -74.0, lat: 40.72 },
  { city: 'Boston', state: 'MA', name: 'Fig & Fennel Pantry', address: '88 Newbury St', hours: 'Daily · 9am–7pm', lon: -71.06, lat: 42.36 },
  { city: 'Philadelphia', state: 'PA', name: 'The Little Larder', address: '230 South St', hours: 'Mon–Sat · 10am–7pm', lon: -75.16, lat: 39.95 },
  { city: 'Atlanta', state: 'GA', name: 'Peach & Pod', address: '615 Ponce de Leon Ave', hours: 'Daily · 10am–8pm', lon: -84.39, lat: 33.77 },
  { city: 'Miami', state: 'FL', name: 'Casa Cacao', address: '2400 NW 2nd Ave, Wynwood', hours: 'Daily · 11am–9pm', lon: -80.2, lat: 25.8 },
  { city: 'Chicago', state: 'IL', name: 'Northside Provisions', address: '1550 N Milwaukee Ave', hours: 'Daily · 9am–8pm', lon: -87.65, lat: 41.9 },
  { city: 'Nashville', state: 'TN', name: 'Sweet Hollow', address: '1200 Villa Pl', hours: 'Tue–Sun · 10am–6pm', lon: -86.78, lat: 36.16 },
  { city: 'Austin', state: 'TX', name: 'Pecan & Pine Market', address: '1100 S Congress Ave', hours: 'Daily · 9am–9pm', lon: -97.75, lat: 30.25 },
  { city: 'Denver', state: 'CO', name: 'High Plains Grocer', address: '2900 Larimer St', hours: 'Daily · 9am–7pm', lon: -104.98, lat: 39.76 },
  { city: 'Los Angeles', state: 'CA', name: 'Sunset Sweet Shop', address: '3200 Sunset Blvd, Silver Lake', hours: 'Daily · 10am–9pm', lon: -118.27, lat: 34.08 },
  { city: 'San Francisco', state: 'CA', name: 'Fog City Confections', address: '540 Valencia St', hours: 'Daily · 10am–8pm', lon: -122.42, lat: 37.76 },
  { city: 'Seattle', state: 'WA', name: 'Rain & Rye', address: '1500 Pike Pl', hours: 'Daily · 9am–6pm', lon: -122.34, lat: 47.61 }
];

export const REGIONS = [
  { id: 'all', label: 'All' },
  { id: 'west', label: 'West', test: s => s.lon < -103 },
  { id: 'central', label: 'Central', test: s => s.lon >= -103 && s.lon < -84.9 },
  { id: 'east', label: 'East', test: s => s.lon >= -84.9 }
];
