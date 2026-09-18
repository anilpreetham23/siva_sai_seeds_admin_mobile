import { supabase } from '../lib/supabase';

const FALLBACK_RATES = [
  { id: 1, crop_type: 'Cotton', grade: 'A', price_per_kg: 75.00, effective_date: '2026-09-15' },
  { id: 2, crop_type: 'Cotton', grade: 'B', price_per_kg: 68.00, effective_date: '2026-09-15' },
  { id: 3, crop_type: 'Rice', grade: 'A', price_per_kg: 32.00, effective_date: '2026-09-15' },
  { id: 4, crop_type: 'Rice', grade: 'B', price_per_kg: 28.50, effective_date: '2026-09-15' },
  { id: 5, crop_type: 'Maize', grade: 'A', price_per_kg: 24.00, effective_date: '2026-09-15' },
  { id: 6, crop_type: 'Maize', grade: 'B', price_per_kg: 21.00, effective_date: '2026-09-15' },
  { id: 7, crop_type: 'Groundnut', grade: 'A', price_per_kg: 64.00, effective_date: '2026-09-15' },
  { id: 8, crop_type: 'Bajra', grade: 'A', price_per_kg: 23.50, effective_date: '2026-09-15' },
];

export const marketService = {
  async getRates() {
    try {
      const { data, error } = await supabase
        .from('market_rates')
        .select('*')
        .order('crop_type')
        .order('grade');
      if (error) throw error;
      return (data && data.length > 0) ? data : FALLBACK_RATES;
    } catch (err) {
      console.warn('[MarketService] Falling back to cached market rates:', err.message);
      return FALLBACK_RATES;
    }
  },

  async setRate(rateData, adminId) {
    const { crop_type, grade, price_per_kg, effective_date } = rateData;
    const { data, error } = await supabase
      .from('market_rates')
      .insert({
        crop_type,
        grade,
        price_per_kg: parseFloat(price_per_kg),
        effective_date: effective_date || new Date().toISOString().split('T')[0],
        set_by: adminId
      })
      .select('id')
      .single();

    if (error) throw error;

    // Log Audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: adminId,
        action: 'Set Market Rate',
        entity_type: 'market_rate',
        entity_id: data.id,
        details: `Set rate for ${crop_type} Grade ${grade}: ₹${price_per_kg}/kg`
      });

    return { id: data.id, message: 'Rate set' };
  },

  async updateRate(rateId, rateData) {
    const { price_per_kg, effective_date, crop_type } = rateData;
    const { error } = await supabase
      .from('market_rates')
      .update({
        price_per_kg: price_per_kg !== undefined ? parseFloat(price_per_kg) : undefined,
        effective_date: effective_date || undefined,
        crop_type: crop_type || undefined
      })
      .eq('id', rateId);
    if (error) throw error;
    return { message: 'Rate updated' };
  },

  async deleteRate(rateId) {
    const { error } = await supabase
      .from('market_rates')
      .delete()
      .eq('id', rateId);
    if (error) throw error;
    return { message: 'Rate deleted' };
  }
};

export default marketService;
