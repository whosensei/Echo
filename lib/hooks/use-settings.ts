import { useSettings as useSettingsContext } from "../context/settings-context";

export default function useSettings() {
  return useSettingsContext();
}
