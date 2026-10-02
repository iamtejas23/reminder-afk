import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/app-ui';

/** Visible tab row (icons + labels), excluding system inset. */
export const TAB_BAR_CONTENT_HEIGHT = 56;

const TAB_BAR_TOP_PADDING = 8;

const tabBarBase = StyleSheet.create({
  tabBar: {
    backgroundColor: AppColors.canvasDeep,
    borderTopColor: AppColors.cardBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    shadowOpacity: 0,
  },
});

export const TAB_BAR_HIDDEN_STYLE = { display: 'none' } as const;

export function useTabBarMetrics() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const height = TAB_BAR_CONTENT_HEIGHT + TAB_BAR_TOP_PADDING + bottomInset;

  const insetStyle = {
    paddingTop: TAB_BAR_TOP_PADDING,
    paddingBottom: bottomInset,
    height,
  };

  const resolvedTabBarStyle = [tabBarBase.tabBar, insetStyle];

  return {
    bottomInset,
    height,
    resolvedTabBarStyle,
    scrollBottomPadding: height + 16,
    tabBarStyle: insetStyle,
  };
}
