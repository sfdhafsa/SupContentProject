import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BOTTOM_TAB_BASE_HEIGHT = 66;
export const BOTTOM_TAB_CONTENT_GAP = 16;

export function useBottomTabSpacing(extraGap = BOTTOM_TAB_CONTENT_GAP) {
  const insets = useSafeAreaInsets();

  return {
    bottomInset: insets.bottom,
    tabBarHeight: BOTTOM_TAB_BASE_HEIGHT + insets.bottom,
    scrollPaddingBottom: BOTTOM_TAB_BASE_HEIGHT + insets.bottom + extraGap,
  };
}
