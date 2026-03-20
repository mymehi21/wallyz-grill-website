import { useEffect, useState } from 'react';
import { supabase, SiteSetting } from '../lib/supabase';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

const defaultColors: ThemeColors = {
  primary: '#FF6B35',
  secondary: '#000000',
  accent: '#FFA500',
};

export function useThemeColors() {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('setting_key', ['primary_color', 'secondary_color', 'accent_color']);

      if (error) throw error;

      if (data && data.length > 0) {
        const colorMap: ThemeColors = { ...defaultColors };
        data.forEach((setting: SiteSetting) => {
          if (setting.setting_key === 'primary_color') {
            colorMap.primary = setting.setting_value;
          } else if (setting.setting_key === 'secondary_color') {
            colorMap.secondary = setting.setting_value;
          } else if (setting.setting_key === 'accent_color') {
            colorMap.accent = setting.setting_value;
          }
        });
        setColors(colorMap);
      }
    } catch (error) {
      console.error('Error fetching theme colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateColor = async (key: 'primary_color' | 'secondary_color' | 'accent_color', value: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key);

      if (error) throw error;

      await fetchColors();
    } catch (error) {
      console.error('Error updating color:', error);
      throw error;
    }
  };

  return { colors, loading, updateColor };
}
