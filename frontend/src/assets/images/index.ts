import dailyDropLogo from './daily_drop_logo.png';
import dailyDropLogoWhite from './daily_drop_logo_white.png';

// Appliance images (preserved for Certified Facilities & Commercial Appliances section)
import applianceHero from './hero_kitchen.jpg';
import appliancePrep from './prep_station.jpg';
import applianceRange from './cooking_range.jpg';
import applianceStorage from './cold_storage.jpg';

// Exact Actual Daily Drop Commercial Kitchen Photos from 'DD kitchen pics'
import pic1035 from '../kitchen_actual/10353e7c-140a-444a-ae53-3886e0ec3d2c.png';
import pic2485 from '../kitchen_actual/2485bcbe-98d6-466f-b7b1-b92134873640.png';
import pic4a6b from '../kitchen_actual/4a6bdfbf-ae0d-4451-a81c-042ab9e85980.png';
import picAba1 from '../kitchen_actual/aba14660-ff37-46c9-a574-7c4fa40370c8.png';
import picD51a from '../kitchen_actual/d51a661f-364c-4d16-a8b5-0e7ad7c1662c.png';
import picDa8f from '../kitchen_actual/da8f9ab8-9c9a-4013-a1e9-f3ad261708f9.png';
import picEc7f from '../kitchen_actual/ec7fa2a8-33f3-49f8-91e2-af6dfbb17245.png';

export const Images = {
  logo: dailyDropLogo,
  logoWhite: dailyDropLogoWhite,

  // Appliances images kept as-is for Certified Facilities section
  hero: applianceHero,
  prepStation: appliancePrep,
  cookingRange: applianceRange,
  coldStorage: applianceStorage,

  // Actual kitchen photos from 'DD kitchen pics' for Hero, OurKitchen, and WhyChoose sections
  actual: {
    hero: picDa8f,
    cookline: picEc7f,
    range: pic2485,
    prep: picAba1,
    wash: picD51a,
    benches: pic4a6b,
    overview: pic1035,
    slideshow: [
      picDa8f,
      picEc7f,
      pic1035,
      pic4a6b,
      pic2485,
      picAba1,
      picD51a,
    ],
  },
};
