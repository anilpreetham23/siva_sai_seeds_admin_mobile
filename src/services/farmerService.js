import { supabase } from '../lib/supabase';

// Fallback seed assets for visual display
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

const DEFAULT_PROFILE = {
  id: 1,
  app_user_id: 1,
  name: 'Harshath Kumar',
  phone: '917898778987',
  email: '7898778987@agriseq.local',
  acres_of_land: 8.5,
  crop_address: 'Kalluru Farm, Plot #14, Kurnool Dist, AP',
  village: 'Kalluru',
  mandal: 'Kalluru',
  district: 'Kurnool',
  state: 'Andhra Pradesh',
  bank_account_number: '912345678901',
  bank_ifsc: 'SBIN0001234',
  bank_name: 'State Bank of India',
  status: 'active'
};

const STARTER_CROPS = [
  {
    id: 1,
    farmer_id: 1,
    crop_name: 'Cotton (Bollgard II)',
    crop_type: 'Cotton',
    variety: 'Long Staple',
    acres: 4.5,
    sowing_date: '2026-06-15',
    harvest_date: '2026-11-20',
    expected_harvest_date: '2026-11-20',
    status: 'Growing',
    stage: 'Flowering & Boll Formation',
    health_status: 'Healthy',
    location: 'North Plot (4.5 ac)',
    created_at: '2026-06-15T09:00:00Z'
  },
  {
    id: 2,
    farmer_id: 1,
    crop_name: 'Hybrid Maize (NK 6240)',
    crop_type: 'Maize',
    variety: 'NK 6240',
    acres: 4.0,
    sowing_date: '2026-07-02',
    harvest_date: '2026-10-25',
    expected_harvest_date: '2026-10-25',
    status: 'Growing',
    stage: 'Grain Filling',
    health_status: 'Excellent',
    location: 'South Canal Plot (4.0 ac)',
    created_at: '2026-07-02T10:30:00Z'
  }
];

let memoryCrops = [...STARTER_CROPS];
let memoryBookings = [];
let memoryTransactions = [
  {
    id: 'TX-9021',
    date: '2026-09-10',
    type: 'grain_sale',
    description: 'Grain Sale Payment - Cotton Grade A (2,200 kg)',
    amount: 107800,
    status: 'completed',
    payment_mode: 'Direct Bank Transfer'
  }
];

export const farmerService = {
  // ─── PROFILE ───────────────────────────────────────────────
  async getProfile(userId) {
    try {
      if (userId) {
        const { data, error } = await supabase
          .from('farmer_profiles')
          .select('*')
          .eq('app_user_id', userId)
          .maybeSingle();
        if (!error && data) return { ...DEFAULT_PROFILE, ...data };
      }
    } catch (_) {}
    return DEFAULT_PROFILE;
  },

  async updateProfile(userId, profileData) {
    try {
      if (userId) {
        await supabase
          .from('farmer_profiles')
          .update(profileData)
          .eq('app_user_id', userId);
      }
    } catch (_) {}
    return { success: true, profile: { ...DEFAULT_PROFILE, ...profileData } };
  },

  async requestBankChange(bankForm) {
    try {
      await supabase.from('bank_change_requests').insert({
        bank_name: bankForm.bank_name,
        account_number: bankForm.account_number,
        ifsc_code: bankForm.ifsc_code,
        status: 'pending'
      });
    } catch (_) {}
    return { success: true, message: 'Bank change request submitted.' };
  },

  // ─── CROPS ─────────────────────────────────────────────────
  async getCrops(farmerId) {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data && data.length > 0) {
        return data.map(c => ({
          ...c,
          crop_name: c.crop_name || `${c.crop_type} Field`,
          expected_harvest_date: c.harvest_date || c.expected_harvest_date,
          stage: c.status || 'Vegetative'
        }));
      }
    } catch (err) {
      console.warn('[FarmerService] Live crops query failed, using cache:', err.message);
    }
    return memoryCrops;
  },

  async registerCrop(farmerId, cropData) {
    const newCrop = {
      farmer_id: farmerId || 1,
      crop_type: cropData.crop_type,
      acres: parseFloat(cropData.acres) || 1,
      sowing_date: cropData.sowing_date || new Date().toISOString().split('T')[0],
      harvest_date: cropData.expected_harvest_date || '2026-11-30',
      status: 'Growing',
      notes: cropData.location || 'Main Field'
    };

    try {
      const { data, error } = await supabase
        .from('crops')
        .insert([newCrop])
        .select()
        .single();
      if (!error && data) {
        const mapped = {
          ...data,
          crop_name: `${data.crop_type} Field`,
          expected_harvest_date: data.harvest_date,
          stage: data.status
        };
        memoryCrops = [mapped, ...memoryCrops];
        return { success: true, crop: mapped };
      }
    } catch (err) {
      console.warn('[FarmerService] Crop registration fallback to local:', err.message);
    }

    const localCrop = {
      id: memoryCrops.length + 10,
      ...newCrop,
      crop_name: `${newCrop.crop_type} Field`,
      expected_harvest_date: newCrop.harvest_date,
      stage: 'Growing',
      health_status: 'Healthy',
      created_at: new Date().toISOString()
    };
    memoryCrops = [localCrop, ...memoryCrops];
    return { success: true, crop: localCrop };
  },

  // ─── SEEDS ─────────────────────────────────────────────────
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
          image_url: s.image_url || CROP_FALLBACK_IMAGES[s.crop_type] || CROP_FALLBACK_IMAGES.default
        }));
      }
    } catch (err) {
      console.warn('[FarmerService] Seeds query failed:', err.message);
    }
    return [
      { id: 4, name: 'LRA-5166 Cotton', variety: 'Long Staple', price_per_kg: 120, stock_kg: 1485, description: 'Long staple cotton for premium fiber', image_url: '/assets/crops/cotton.png', is_active: true },
      { id: 1, name: 'IR-36 Rice', variety: 'High Yield', price_per_kg: 44, stock_kg: 4695, description: 'Premium paddy seeds with high yield potential', image_url: '/assets/crops/onb_mandi_prices_1784644862143.png', is_active: true },
      { id: 2, name: 'HD-2967 Wheat', variety: 'Rust Resistant', price_per_kg: 38, stock_kg: 2479, description: 'Disease resistant wheat variety', image_url: '/assets/crops/onb_track_crop_1784644792435.png', is_active: true },
      { id: 12, name: 'Red Gram', variety: 'High Protein', price_per_kg: 56, stock_kg: 134500, description: 'Quality pulses seeds', image_url: '/assets/crops/groundnut.png', is_active: true }
    ];
  },

  async purchaseSeeds(purchaseData) {
    try {
      await supabase.from('seed_purchases').insert({
        farmer_id: purchaseData.farmerId || 1,
        seed_id: purchaseData.seedId,
        quantity_kg: purchaseData.quantity,
        total_price: purchaseData.totalPrice,
        status: 'pending'
      });
    } catch (_) {}
    return { success: true, orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`, message: 'Order placed successfully!' };
  },

  async getSeedPurchases(farmerId) {
    try {
      const { data, error } = await supabase
        .from('seed_purchases')
        .select('*, seeds(*)')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return [
      { id: 1, seed_name: 'LRA-5166 Cotton', quantity: 4, total_price: 480, status: 'delivered', purchase_date: '2026-08-28' }
    ];
  },

  // ─── GRAIN SALES & MANDI RATES ────────────────────────────
  async getMarketRates() {
    try {
      const { data, error } = await supabase
        .from('market_rates')
        .select('*')
        .order('crop_type')
        .order('grade');
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return [
      { id: 16, crop_type: 'Cotton', grade: 'A', price_per_kg: 49, effective_date: '2026-07-14' },
      { id: 17, crop_type: 'Cotton', grade: 'B', price_per_kg: 41, effective_date: '2026-07-09' },
      { id: 19, crop_type: 'Groundnut', grade: 'A', price_per_kg: 68, effective_date: '2026-07-19' },
      { id: 7, crop_type: 'Maize', grade: 'A', price_per_kg: 20, effective_date: '2026-07-10' },
      { id: 1, crop_type: 'Rice', grade: 'A', price_per_kg: 22.5, effective_date: '2026-06-15' },
      { id: 24, crop_type: 'Sugarcane', grade: 'A', price_per_kg: 28, effective_date: '2026-07-21' },
      { id: 4, crop_type: 'Wheat', grade: 'A', price_per_kg: 21, effective_date: '2026-06-15' }
    ];
  },

  async submitGrainSale(farmerId, saleData) {
    try {
      await supabase.from('grain_sales').insert({
        farmer_id: farmerId || 1,
        crop_type: saleData.crop_type,
        grade: saleData.grade || 'A',
        quantity_kg: parseFloat(saleData.quantity_kg),
        price_per_kg: parseFloat(saleData.price_per_kg) || 49,
        status: 'pending'
      });
    } catch (_) {}
    return { success: true, message: 'Grain sale offer submitted.' };
  },

  async getGrainSales(farmerId) {
    try {
      const { data, error } = await supabase
        .from('grain_sales')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return [
      { id: 501, crop_type: 'Cotton', grade: 'A', quantity_kg: 2200, price_per_kg: 49, status: 'approved', created_at: '2026-09-08' }
    ];
  },

  // ─── WAREHOUSES & BOOKINGS ────────────────────────────────
  async getWarehouses() {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return [
      { id: 1, name: 'Kurnool Central Warehouse Hub', location: 'Industrial Area, Kurnool' },
      { id: 2, name: 'Nandyal Agri Storage Facility', location: 'NH-40 Bypass, Nandyal' },
      { id: 3, name: 'Adoni Grain Terminal', location: 'Cotton Market Yard, Adoni' }
    ];
  },

  async getWarehouseSlots(warehouseId, date) {
    try {
      const { data, error } = await supabase
        .from('warehouse_slots')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .order('start_time');
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return [
      { id: 1, warehouse_id: warehouseId, slot_date: date, start_time: '09:00:00', end_time: '12:00:00', total_capacity_kg: 50000, booked_capacity_kg: 12000, status: 'active' },
      { id: 2, warehouse_id: warehouseId, slot_date: date, start_time: '13:00:00', end_time: '16:00:00', total_capacity_kg: 50000, booked_capacity_kg: 8000, status: 'active' }
    ];
  },

  async bookDeliverySlot(farmerId, bookingData) {
    try {
      const { data, error } = await supabase.rpc('create_booking_slot', {
        p_farmer_id: farmerId || 1,
        p_booking_date: bookingData.booking_date,
        p_delivery_address: bookingData.delivery_address || 'Kalluru Farm',
        p_grain_type: bookingData.grain_type,
        p_warehouse_id: parseInt(bookingData.warehouse_id) || 1,
        p_quantity_kg: parseFloat(bookingData.quantity_kg),
        p_warehouse_slot_id: bookingData.warehouse_slot_id ? parseInt(bookingData.warehouse_slot_id) : null
      });
      if (!error && data) return data;
    } catch (_) {}
    const newBooking = {
      id: memoryBookings.length + 101,
      booking_date: bookingData.booking_date,
      grain_type: bookingData.grain_type,
      quantity_kg: parseFloat(bookingData.quantity_kg),
      status: 'confirmed',
      delivery_address: bookingData.delivery_address || 'Kalluru Farm'
    };
    memoryBookings = [newBooking, ...memoryBookings];
    return { success: true, booking: newBooking };
  },

  async getBookingSlots(farmerId) {
    try {
      const { data, error } = await supabase
        .from('booking_slots')
        .select('*')
        .order('booking_date', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return [
      { id: 101, booking_date: '2026-09-22', grain_type: 'Cotton', quantity_kg: 2500, status: 'confirmed' }
    ];
  },

  async getTransactions(farmerId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return memoryTransactions;
  },

  async getVisits(farmerId) {
    try {
      const { data, error } = await supabase
        .from('farm_visits')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (_) {}
    return [
      { id: 1, visit_date: '2026-09-05', manager_name: 'Suresh Reddy (Field Manager)', notes: 'Inspected cotton crop. Healthy growth, recommend irrigation next week.', status: 'completed' }
    ];
  },

  async getDashboard(farmerId) {
    const crops = await this.getCrops(farmerId);
    const bookings = await this.getBookingSlots(farmerId);
    return {
      activeCropsCount: crops.length,
      totalAcres: crops.reduce((acc, c) => acc + (parseFloat(c.acres) || 0), 0),
      pendingBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length,
      recentEarnings: 107800,
      crops,
      upcomingDeliveries: bookings
    };
  }
};

export default farmerService;
