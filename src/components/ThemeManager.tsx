
// FIX: Import `React` to resolve "Cannot find namespace 'React'" error.
import React, { useEffect } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

/**
 * Converts a hex color string to an RGB string "r g b".
 * @param hex The hex color string (e.g., "#RRGGBB").
 * @returns The RGB values as a space-separated string or null if invalid.
 */
const hexToRgb = (hex: string): string | null => {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
};

const ThemeManager: React.FC = () => {
    const { settings } = useSiteSettings();
    
    useEffect(() => {
        const colors = settings.theme_colors;
        
        if (colors) {
            const root = document.documentElement;
            // Iterate over the color settings and apply them as CSS variables
            for (const [key, value] of Object.entries(colors)) {
                // FIX: Add type check for value, as Object.entries returns `unknown` for values.
                if (typeof value === 'string') {
                    const rgb = hexToRgb(value);
                    if (rgb) {
                        root.style.setProperty(`--color-${key}`, rgb);
                    }
                }
            }
        }
    }, [settings.theme_colors]);

    // This component does not render any visible UI
    return null;
};

export default ThemeManager;
