import dailyDropLogo from './daily_drop_logo.png';
import dailyDropLogoWhite from './daily_drop_logo_white.png';

// Fallback/Legacy Appliance images
import applianceHero from './hero_kitchen.jpg';
import appliancePrep from './prep_station.jpg';
import applianceRange from './cooking_range.jpg';
import applianceStorage from './cold_storage.jpg';

// Exact Actual Daily Drop Commercial Kitchen Photos with updated people from 'DD kitchen pics'
import picImage from '../kitchen_actual/image.png';
import picCopy from '../kitchen_actual/image copy.png';
import picCopy2 from '../kitchen_actual/image copy 2.png';
import picCopy3 from '../kitchen_actual/image copy 3.png';
import picCopy4 from '../kitchen_actual/image copy 4.png';
import picCopy5 from '../kitchen_actual/image copy 5.png';
import picCopy6 from '../kitchen_actual/image copy 6.png';

export const Images = {
  logo: dailyDropLogo,
  logoWhite: dailyDropLogoWhite,

  // Appliances images kept for reference
  hero: applianceHero,
  prepStation: appliancePrep,
  cookingRange: applianceRange,
  coldStorage: applianceStorage,

  // Actual kitchen photos for:
  // 1. 1st screen background (Hero)
  // 2. A Kitchen That Works For Your Business (OurKitchen)
  // 3. Why Food Creators Choose Daily Drop Commercial Kitchens (WhyChoose)
  actual: {
    hero: picImage,           // Wide panoramic shot of active kitchen with chefs
    cookline: picCopy2,       // Center perspective showing cookline & prep stations
    range: picCopy,           // Commercial cookline & prep stations
    prep: picCopy3,           // Active prep stations with chefs & mixer
    wash: picCopy5,           // Spotless wash bay, dishwasher & coffee station
    benches: picCopy4,        // Food prep workstations with chefs
    storage: picCopy6,        // Deep freezer & dry storage shelving
    slideshow: [
      picImage,               // 1. Panoramic kitchen view
      picCopy2,               // 2. Main floor & cookline overview
      picCopy,                // 3. Cookline & stainless prep benches
      picCopy3,               // 4. Multi-chef prep & plating
      picCopy4,               // 5. Food prep workstations & equipment
      picCopy5,               // 6. Dishwashing & hygiene station
      picCopy6,               // 7. Bulk freezer & inventory storage
    ],
  },
};
