// Bundled menu item images. Served by GitHub Pages (part of the app bundle),
// NOT from Supabase Storage — zero Supabase egress no matter how many views.
//
// Keyed by item NAME so one image covers the item at BOTH locations. Matching
// is normalized (case, spacing, punctuation, & vs and) so minor spelling
// differences between here and the admin still match.
//
// To add an item later: drop the .webp in src/assets/menu/, import it, and add
// one line to RAW with the item's name.

import chickenQuesadilla from '../assets/menu/chicken-quesadilla.webp';
import chickenSub from '../assets/menu/chicken-sub.webp';
import chickenTendersAndFries from '../assets/menu/chicken-tenders-and-fries.webp';
import chickenWings from '../assets/menu/chicken-wings.webp';
import steakTacos from '../assets/menu/steak-tacos.webp';
import steakQuesadillas from '../assets/menu/steak-quesadillas.webp';
import smashCheeseBurger from '../assets/menu/smash-cheese-burger.webp';
import phillySteakSub from '../assets/menu/philly-steak-sub.webp';
import mixRiceBowl from '../assets/menu/mix-rice-bowl.webp';
import fajitaSub from '../assets/menu/fajita-sub.webp';
import crispyChickenSub from '../assets/menu/crispy-chicken-sub.webp';
import crispyChickenBurger from '../assets/menu/crispy-chicken-burger.webp';
import wallyzShawarma from '../assets/menu/wallyz-shawarma.webp';
import wallyzBurger from '../assets/menu/wallyz-burger.webp';
import classicCheeseBurger from '../assets/menu/classic-cheese-burger.webp';
import nachoburger from '../assets/menu/nachoburger.webp';
import mushroomSwissBurger from '../assets/menu/mushroom-swiss-burger.webp';
import loadedFries from '../assets/menu/loaded-fries.webp';
import grilledChickenBurger from '../assets/menu/grilled-chicken-burger.webp';
import img3ChickenTacos from '../assets/menu/3-chicken-tacos.webp';
import chickenShawarma from '../assets/menu/chicken-shawarma.webp';
import chickenRiceBowl from '../assets/menu/chicken-rice-bowl.webp';
import cheeseSticks from '../assets/menu/cheese-sticks.webp';
import beefShawarma from '../assets/menu/beef-shawarma.webp';
import beefGyroRiceBowl from '../assets/menu/beef-gyro-rice-bowl.webp';

const RAW: Record<string, string> = {
  'Chicken Quesadilla': chickenQuesadilla,
  'Chicken Sub': chickenSub,
  'Chicken Tenders & Fries': chickenTendersAndFries,
  'Chicken Wings': chickenWings,
  'Steak Tacos': steakTacos,
  'Steak Quesadillas': steakQuesadillas,
  'Smash Cheese Burger': smashCheeseBurger,
  'Philly Steak Sub': phillySteakSub,
  'Mix Rice Bowl': mixRiceBowl,
  'Fajita Sub': fajitaSub,
  'Crispy Chicken Sub': crispyChickenSub,
  'Crispy Chicken Burger': crispyChickenBurger,
  'Wallyz Shawarma': wallyzShawarma,
  'Wally\'z Burger': wallyzBurger,
  'Classic Cheese Burger': classicCheeseBurger,
  'NachoBurger': nachoburger,
  'Nacho Burger': nachoburger,
  'Mushroom Swiss Burger': mushroomSwissBurger,
  'Loaded Fries': loadedFries,
  'Grilled Chicken Burger': grilledChickenBurger,
  '3 Chicken Tacos': img3ChickenTacos,
  'Chicken Shawarma': chickenShawarma,
  'Chicken Rice Bowl': chickenRiceBowl,
  'Cheese Sticks': cheeseSticks,
  'Beef Shawarma': beefShawarma,
  'Beef Gyro Rice Bowl': beefGyroRiceBowl,
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[\u2018\u2019'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const MENU_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(RAW).map(([k, v]) => [normalize(k), v]),
);

export function getMenuImage(name?: string | null): string | null {
  if (!name) return null;
  return MENU_IMAGES[normalize(name)] ?? null;
}
