import type { IconType } from 'react-icons'
import {
  GiAirplane, GiBank, GiBrain, GiBrassKnuckles, GiCapitol, GiCarWheel, GiCargoShip, GiCardRandom, GiCash,
  GiChemicalDrop, GiCityCar, GiCoinsPile, GiCrown, GiDiamondRing, GiDogBowl, GiGasPump, GiHouseKeys, GiJusticeStar,
  GiKebabSpit, GiLaptop, GiLockedChest, GiModernCity, GiMuscleUp, GiMusicalNotes, GiNails, GiPalmTree,
  GiPirateSkull, GiPoliceBadge, GiPowderBag, GiRollingDices, GiScales, GiScooter, GiShop, GiSteeringWheel, GiTie,
  GiTruck, GiWashingMachine, GiHandcuffs, GiPerson, GiFactory, GiAnchor, GiWineGlass, GiCastle,
} from 'react-icons/gi'

export const BUSINESS_ICONS: Record<string, IconType> = {
  deal: GiPowderBag,
  scooter: GiScooter,
  racket: GiBrassKnuckles,
  paris: GiDogBowl,
  labo: GiChemicalDrop,
  contrebande: GiCargoShip,
  fauxbillets: GiCash,
  casino: GiRollingDices,
  cartel: GiAirplane,
  ransomware: GiLaptop,
}

export const FRONT_ICONS: Record<string, IconType> = {
  laverie: GiWashingMachine,
  kebab: GiKebabSpit,
  carwash: GiCarWheel,
  onglerie: GiNails,
  boite: GiMusicalNotes,
  immo: GiHouseKeys,
  offshore: GiPalmTree,
  mixer: GiCoinsPile,
}

export const ROLE_ICONS: Record<string, IconType> = {
  muscle: GiMuscleUp,
  chauffeur: GiSteeringWheel,
  perceur: GiLockedChest,
  hacker: GiLaptop,
  cerveau: GiBrain,
}

export const HEIST_ICONS: Record<string, IconType> = {
  superette: GiShop,
  station: GiGasPump,
  bijouterie: GiDiamondRing,
  fourgon: GiTruck,
  banque: GiBank,
  casino: GiCardRandom,
  reserve: GiCastle,
}

export const DISTRICT_ICONS: Record<string, IconType> = {
  lilas: GiModernCity,
  zi: GiFactory,
  docks: GiAnchor,
  centre: GiCityCar,
  corniche: GiWineGlass,
  aeroport: GiAirplane,
  affaires: GiTie,
  mairie: GiCapitol,
}

export const CORRUPTION_ICONS: Record<string, IconType> = {
  agent: GiPoliceBadge,
  indic: GiPerson,
  commissaire: GiHandcuffs,
  juge: GiScales,
  prefet: GiJusticeStar,
  depute: GiCapitol,
  ministre: GiCrown,
}

export const FallbackIcon = GiPirateSkull
