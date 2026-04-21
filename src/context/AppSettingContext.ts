import { createContext } from 'react';
import type { Settings } from '../types/Settings.ts';

type AppSettingContextType =
    | {
          settings: Settings;
          handleSettingToggle: <K extends keyof Settings>(key: K, value?: Settings[K]) => void;
      }
    | undefined;

const AppSettingContext = createContext<AppSettingContextType>(undefined);
export default AppSettingContext;
