import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';
import { useThemeColors } from '../store/useAppStore';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

// Note: @rn-primitives' web primitives forward `style` straight to the DOM
// element rather than flattening it the way core RN View/Text do, so an
// array style (the usual RN pattern) throws "Failed to set an indexed
// property on CSSStyleDeclaration" on web. Every primitive below merges into
// a single plain object instead.

export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ style, ...props }, ref) => {
  const { colors } = useThemeColors();
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <AlertDialogPrimitive.Content
            ref={ref}
            style={{
              backgroundColor: colors.surface,
              padding: 24,
              borderRadius: 24,
              width: '100%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 5,
              ...(style as object),
            }}
            {...props}
          />
        </View>
      </AlertDialogPrimitive.Overlay>
    </AlertDialogPrimitive.Portal>
  );
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

export const AlertDialogHeader = ({ style, ...props }: any) => (
  <View style={[{ marginBottom: 16 }, style]} {...props} />
);

export const AlertDialogFooter = ({ style, ...props }: any) => (
  <View style={[{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 }, style]} {...props} />
);

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ style, ...props }, ref) => {
  const { colors } = useThemeColors();
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5, ...(style as object) }}
      {...props}
    />
  );
});
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ style, ...props }, ref) => {
  const { colors } = useThemeColors();
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '500', ...(style as object) }}
      {...props}
    />
  );
});
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

export const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ style, ...props }, ref) => {
  const { colors } = useThemeColors();
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      style={{ backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, ...(style as object) }}
      {...props}
    />
  );
});
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

export const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ style, ...props }, ref) => {
  const { colors } = useThemeColors();
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      style={{ backgroundColor: colors.surfaceBorder, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, ...(style as object) }}
      {...props}
    />
  );
});
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
