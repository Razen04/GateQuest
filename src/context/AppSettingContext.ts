import { createContext } from 'react';
import type { Settings } from '../types/Settings.ts';

type AppSettingContextType =
    | {
          settings: Settings;
          handleSettingToggle: (key: keyof Settings) => void;
      }
    | undefined;

const AppSettingContext = createContext<AppSettingContextType>(undefined);
export default AppSettingContext;
