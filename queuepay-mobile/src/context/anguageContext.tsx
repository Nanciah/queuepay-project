import React, { createContext, useContext, useState, useEffect } from 'react';
import { fr } from '../translations/fr';
import { en } from '../translations/en';
import { mg } from '../translations/mg';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LanguageType = 'fr' | 'en' | 'mg';

interface LanguageContextType {
  language: LanguageType;
  t: (key: string) => string;
  setLanguage: (lang: LanguageType) => void;
}

const translations = { fr, en, mg };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageType>('fr');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('language');
      if (saved && (saved === 'fr' || saved === 'en' || saved === 'mg')) {
        setLanguage(saved);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const changeLanguage = async (lang: LanguageType) => {
    setLanguage(lang);
    await AsyncStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key;
      }
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage: changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};