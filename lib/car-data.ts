import type { VehicleType } from '@/components/rides/vehicle-silhouettes'

export type CarModel = { model: string; seats: number }

export const CAR_DATA: Record<string, CarModel[]> = {
  Acura: [
    { model: 'ILX', seats: 5 },
    { model: 'TLX', seats: 5 },
    { model: 'RDX', seats: 5 },
    { model: 'MDX', seats: 7 },
    { model: 'NSX', seats: 2 },
  ],
  'Alfa Romeo': [
    { model: 'Giulia', seats: 5 },
    { model: 'Stelvio', seats: 5 },
    { model: 'Tonale', seats: 5 },
  ],
  Audi: [
    { model: 'A3', seats: 5 },
    { model: 'A4', seats: 5 },
    { model: 'A6', seats: 5 },
    { model: 'A8', seats: 5 },
    { model: 'Q3', seats: 5 },
    { model: 'Q5', seats: 5 },
    { model: 'Q7', seats: 7 },
    { model: 'Q8', seats: 5 },
    { model: 'e-tron', seats: 5 },
  ],
  BMW: [
    { model: '3 Series', seats: 5 },
    { model: '5 Series', seats: 5 },
    { model: '7 Series', seats: 5 },
    { model: 'X1', seats: 5 },
    { model: 'X3', seats: 5 },
    { model: 'X5', seats: 5 },
    { model: 'X7', seats: 7 },
    { model: 'M3', seats: 5 },
    { model: 'M5', seats: 5 },
  ],
  Buick: [
    { model: 'Encore', seats: 5 },
    { model: 'Envision', seats: 5 },
    { model: 'Enclave', seats: 7 },
    { model: 'Regal', seats: 5 },
  ],
  Cadillac: [
    { model: 'CT4', seats: 5 },
    { model: 'CT5', seats: 5 },
    { model: 'Escalade', seats: 7 },
    { model: 'XT4', seats: 5 },
    { model: 'XT5', seats: 5 },
    { model: 'XT6', seats: 7 },
  ],
  Chevrolet: [
    { model: 'Silverado', seats: 5 },
    { model: 'Malibu', seats: 5 },
    { model: 'Equinox', seats: 5 },
    { model: 'Tahoe', seats: 7 },
    { model: 'Suburban', seats: 8 },
    { model: 'Traverse', seats: 7 },
    { model: 'Colorado', seats: 5 },
    { model: 'Corvette', seats: 2 },
    { model: 'Camaro', seats: 4 },
  ],
  Chrysler: [
    { model: '300', seats: 5 },
    { model: 'Pacifica', seats: 7 },
    { model: 'Voyager', seats: 7 },
  ],
  Dodge: [
    { model: 'Charger', seats: 5 },
    { model: 'Challenger', seats: 5 },
    { model: 'Durango', seats: 7 },
    { model: 'Journey', seats: 5 },
  ],
  Fiat: [
    { model: '500', seats: 4 },
    { model: '500X', seats: 5 },
    { model: '500L', seats: 5 },
  ],
  Ford: [
    { model: 'F-150', seats: 5 },
    { model: 'Mustang', seats: 4 },
    { model: 'Escape', seats: 5 },
    { model: 'Explorer', seats: 7 },
    { model: 'Edge', seats: 5 },
    { model: 'Bronco', seats: 5 },
    { model: 'Ranger', seats: 5 },
    { model: 'Expedition', seats: 8 },
    { model: 'Focus', seats: 5 },
  ],
  Genesis: [
    { model: 'G70', seats: 5 },
    { model: 'G80', seats: 5 },
    { model: 'G90', seats: 5 },
    { model: 'GV70', seats: 5 },
    { model: 'GV80', seats: 5 },
  ],
  GMC: [
    { model: 'Sierra', seats: 5 },
    { model: 'Canyon', seats: 5 },
    { model: 'Acadia', seats: 7 },
    { model: 'Terrain', seats: 5 },
    { model: 'Yukon', seats: 7 },
  ],
  Honda: [
    { model: 'Civic', seats: 5 },
    { model: 'Accord', seats: 5 },
    { model: 'CR-V', seats: 5 },
    { model: 'HR-V', seats: 5 },
    { model: 'Pilot', seats: 8 },
    { model: 'Odyssey', seats: 7 },
    { model: 'Ridgeline', seats: 5 },
    { model: 'Fit', seats: 5 },
  ],
  Hyundai: [
    { model: 'Elantra', seats: 5 },
    { model: 'Sonata', seats: 5 },
    { model: 'Tucson', seats: 5 },
    { model: 'Santa Fe', seats: 5 },
    { model: 'Palisade', seats: 7 },
    { model: 'Kona', seats: 5 },
    { model: 'Venue', seats: 5 },
    { model: 'Ioniq 5', seats: 5 },
    { model: 'Ioniq 6', seats: 5 },
  ],
  Infiniti: [
    { model: 'Q50', seats: 5 },
    { model: 'Q60', seats: 4 },
    { model: 'QX50', seats: 5 },
    { model: 'QX60', seats: 7 },
    { model: 'QX80', seats: 8 },
  ],
  Jaguar: [
    { model: 'XE', seats: 5 },
    { model: 'XF', seats: 5 },
    { model: 'F-Pace', seats: 5 },
    { model: 'E-Pace', seats: 5 },
    { model: 'F-Type', seats: 2 },
  ],
  Jeep: [
    { model: 'Wrangler', seats: 5 },
    { model: 'Grand Cherokee', seats: 5 },
    { model: 'Cherokee', seats: 5 },
    { model: 'Compass', seats: 5 },
    { model: 'Renegade', seats: 5 },
    { model: 'Gladiator', seats: 5 },
  ],
  Kia: [
    { model: 'Forte', seats: 5 },
    { model: 'Optima', seats: 5 },
    { model: 'K5', seats: 5 },
    { model: 'Sorento', seats: 7 },
    { model: 'Sportage', seats: 5 },
    { model: 'Telluride', seats: 7 },
    { model: 'Soul', seats: 5 },
    { model: 'EV6', seats: 5 },
    { model: 'Niro', seats: 5 },
  ],
  'Land Rover': [
    { model: 'Range Rover', seats: 7 },
    { model: 'Range Rover Sport', seats: 5 },
    { model: 'Discovery', seats: 7 },
    { model: 'Defender', seats: 5 },
    { model: 'Evoque', seats: 5 },
  ],
  Lexus: [
    { model: 'IS', seats: 5 },
    { model: 'ES', seats: 5 },
    { model: 'GS', seats: 5 },
    { model: 'LS', seats: 5 },
    { model: 'NX', seats: 5 },
    { model: 'RX', seats: 5 },
    { model: 'GX', seats: 7 },
    { model: 'LX', seats: 7 },
  ],
  Lincoln: [
    { model: 'Corsair', seats: 5 },
    { model: 'Nautilus', seats: 5 },
    { model: 'Aviator', seats: 7 },
    { model: 'Navigator', seats: 8 },
  ],
  Mazda: [
    { model: 'Mazda3', seats: 5 },
    { model: 'Mazda6', seats: 5 },
    { model: 'CX-3', seats: 5 },
    { model: 'CX-5', seats: 5 },
    { model: 'CX-30', seats: 5 },
    { model: 'CX-50', seats: 5 },
    { model: 'CX-9', seats: 7 },
    { model: 'MX-5 Miata', seats: 2 },
  ],
  'Mercedes-Benz': [
    { model: 'C-Class', seats: 5 },
    { model: 'E-Class', seats: 5 },
    { model: 'S-Class', seats: 5 },
    { model: 'GLA', seats: 5 },
    { model: 'GLC', seats: 5 },
    { model: 'GLE', seats: 5 },
    { model: 'GLS', seats: 7 },
    { model: 'G-Class', seats: 5 },
  ],
  Mini: [
    { model: 'Cooper', seats: 4 },
    { model: 'Countryman', seats: 5 },
    { model: 'Clubman', seats: 5 },
  ],
  Mitsubishi: [
    { model: 'Mirage', seats: 5 },
    { model: 'Lancer', seats: 5 },
    { model: 'Outlander', seats: 7 },
    { model: 'Eclipse Cross', seats: 5 },
    { model: 'Pajero', seats: 7 },
  ],
  Nissan: [
    { model: 'Altima', seats: 5 },
    { model: 'Sentra', seats: 5 },
    { model: 'Rogue', seats: 5 },
    { model: 'Pathfinder', seats: 7 },
    { model: 'Armada', seats: 8 },
    { model: 'Frontier', seats: 5 },
    { model: 'Maxima', seats: 5 },
    { model: 'Versa', seats: 5 },
    { model: 'Leaf', seats: 5 },
  ],
  Porsche: [
    { model: '911', seats: 4 },
    { model: 'Cayenne', seats: 5 },
    { model: 'Macan', seats: 5 },
    { model: 'Panamera', seats: 4 },
    { model: 'Taycan', seats: 4 },
  ],
  Ram: [
    { model: '1500', seats: 5 },
    { model: '2500', seats: 5 },
    { model: '3500', seats: 5 },
    { model: 'ProMaster', seats: 2 },
  ],
  Subaru: [
    { model: 'Impreza', seats: 5 },
    { model: 'Legacy', seats: 5 },
    { model: 'Outback', seats: 5 },
    { model: 'Forester', seats: 5 },
    { model: 'Crosstrek', seats: 5 },
    { model: 'Ascent', seats: 8 },
    { model: 'BRZ', seats: 4 },
    { model: 'WRX', seats: 5 },
  ],
  Tesla: [
    { model: 'Model 3', seats: 5 },
    { model: 'Model S', seats: 5 },
    { model: 'Model X', seats: 7 },
    { model: 'Model Y', seats: 5 },
    { model: 'Cybertruck', seats: 5 },
  ],
  Toyota: [
    { model: 'Corolla', seats: 5 },
    { model: 'Camry', seats: 5 },
    { model: 'RAV4', seats: 5 },
    { model: 'Highlander', seats: 7 },
    { model: 'Prius', seats: 5 },
    { model: 'Tacoma', seats: 5 },
    { model: 'Tundra', seats: 5 },
    { model: '4Runner', seats: 7 },
    { model: 'Land Cruiser', seats: 7 },
    { model: 'Sienna', seats: 7 },
  ],
  Volkswagen: [
    { model: 'Jetta', seats: 5 },
    { model: 'Passat', seats: 5 },
    { model: 'Atlas', seats: 7 },
    { model: 'Tiguan', seats: 5 },
    { model: 'Taos', seats: 5 },
    { model: 'Golf', seats: 5 },
    { model: 'GTI', seats: 5 },
    { model: 'ID.4', seats: 5 },
  ],
  Volvo: [
    { model: 'S60', seats: 5 },
    { model: 'S90', seats: 5 },
    { model: 'XC40', seats: 5 },
    { model: 'XC60', seats: 5 },
    { model: 'XC90', seats: 7 },
  ],
}

const TRUCK_MODELS = new Set([
  'F-150', 'Tacoma', 'Tundra', 'Silverado', 'Colorado', 'Frontier',
  'Ridgeline', 'Ranger', '1500', '2500', '3500', 'Sierra', 'Canyon',
  'Gladiator', 'Cybertruck',
])

const MINIVAN_MODELS = new Set(['Sienna', 'Odyssey', 'Pacifica', 'Voyager'])

const VAN_MODELS = new Set(['ProMaster'])

const COUPE_MODELS = new Set([
  'Corvette', 'Camaro', 'Mustang', 'BRZ', '911', 'Panamera', 'Taycan',
  'F-Type', 'Cooper', 'MX-5 Miata', 'NSX',
])

const HATCHBACK_MODELS = new Set([
  'Fit', 'Golf', 'GTI', 'Ioniq 5', 'Ioniq 6', 'EV6', 'Niro', 'Leaf',
  'Clubman', '500L', 'Impreza', 'Soul', 'Prius',
])

const SUV_MODELS = new Set([
  'RAV4', 'CR-V', 'HR-V', 'Rogue', 'Tucson', 'Santa Fe', 'Palisade',
  'Kona', 'Venue', 'Sportage', 'Telluride', 'Sorento', 'Tiguan', 'Taos',
  'ID.4', 'Atlas', 'X1', 'X3', 'X5', 'X7', 'GLA', 'GLC', 'GLE', 'GLS',
  'G-Class', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'Model X', 'Model Y',
  'Outback', 'Forester', 'Crosstrek', 'Ascent', 'CX-3', 'CX-5', 'CX-30',
  'CX-50', 'CX-9', 'NX', 'RX', 'GX', 'LX', 'RDX', 'MDX', 'Wrangler',
  'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Bronco', 'Equinox',
  'Tahoe', 'Suburban', 'Traverse', 'Terrain', 'Acadia', 'Yukon', 'Durango',
  'Explorer', 'Escape', 'Edge', 'Expedition', 'XC40', 'XC60', 'XC90',
  'F-Pace', 'E-Pace', 'Cayenne', 'Macan', 'Range Rover', 'Range Rover Sport',
  'Discovery', 'Defender', 'Evoque', 'Countryman', '500X', 'Stelvio',
  'Tonale', 'Eclipse Cross', 'Pajero', 'Outlander', 'QX50', 'QX60', 'QX80',
  'GV70', 'GV80', 'Encore', 'Envision', 'Enclave', 'XT4', 'XT5', 'XT6',
  'Escalade', 'Corsair', 'Nautilus', 'Aviator', 'Navigator', 'Highlander',
  '4Runner', 'Land Cruiser', 'Pilot', 'Pathfinder', 'Armada',
])

export function inferVehicleType(_brand: string, model: string, seats: number): VehicleType {
  if (VAN_MODELS.has(model)) return 'van'
  if (MINIVAN_MODELS.has(model)) return 'minivan'
  if (TRUCK_MODELS.has(model)) return 'truck'
  if (COUPE_MODELS.has(model) || seats <= 2) return 'coupe'
  if (HATCHBACK_MODELS.has(model)) return 'hatchback'
  if (SUV_MODELS.has(model) || seats >= 7) return 'suv'
  return 'sedan'
}

export function getBrands(): string[] {
  return Object.keys(CAR_DATA).sort()
}

export function getModelsByBrand(brand: string): CarModel[] {
  return CAR_DATA[brand] ?? []
}
