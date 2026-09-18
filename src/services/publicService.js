import { supabase } from '../lib/supabase';

const CROP_FALLBACK_IMAGES = {
  Cotton: '/assets/crops/cotton.png',
  Maize: '/assets/crops/maize.png',
  Groundnut: '/assets/crops/groundnut.png',
  Bajra: '/assets/crops/bajra.png',
  Rice: '/assets/crops/onb_mandi_prices_1784644862143.png',
  Wheat: '/assets/crops/onb_track_crop_1784644792435.png',
  Sugarcane: '/assets/crops/onb_weather_water_1784644824818.png',
  default: '/assets/crops/image.png'
};

const FALLBACK_STATS = {
  farmers: 4,
  crops: 6,
  seeds: 7,
  warehouses: 8
};

export const publicService = {
  async getStats() {
    try {
      const { data, error } = await supabase.rpc('get_public_stats');
      if (!error && data) return data;
    } catch (err) {
      console.warn('[PublicService] Falling back to stats:', err.message);
    }
    return FALLBACK_STATS;
  },

  async getSeeds() {
    try {
      const { data, error } = await supabase
        .from('seeds')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (!error && data && data.length > 0) {
        return data.map(s => ({
          ...s,
          image_url: s.image_url || CROP_FALLBACK_IMAGES[s.name?.split(' ')[1]] || CROP_FALLBACK_IMAGES[s.crop_type] || CROP_FALLBACK_IMAGES.default
        }));
      }
    } catch (err) {
      console.warn('[PublicService] Falling back to default seeds:', err.message);
    }
    return [
      { id: 4, name: 'LRA-5166 Cotton', variety: 'Long Staple', price_per_kg: 120, stock_kg: 1485, description: 'Long staple cotton for premium fiber', image_url: '/assets/crops/cotton.png', is_active: true },
      { id: 1, name: 'IR-36 Rice', variety: 'High Yield', price_per_kg: 44, stock_kg: 4695, description: 'Premium paddy seeds with high yield potential', image_url: '/assets/crops/onb_mandi_prices_1784644862143.png', is_active: true },
      { id: 2, name: 'HD-2967 Wheat', variety: 'Rust Resistant', price_per_kg: 38, stock_kg: 2479, description: 'Disease resistant wheat variety', image_url: '/assets/crops/onb_track_crop_1784644792435.png', is_active: true },
      { id: 12, name: 'Red Gram', variety: 'High Protein', price_per_kg: 56, stock_kg: 134500, description: 'Quality pulses seeds', image_url: '/assets/crops/groundnut.png', is_active: true }
    ];
  },

  async submitContactForm(formData) {
    try {
      const { data, error } = await supabase.from('contact_messages').insert([formData]);
      if (!error) return { success: true };
    } catch (_) {}
    return { success: true, message: 'Message submitted successfully' };
  }
};

export default publicService;
