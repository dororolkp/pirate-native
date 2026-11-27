import { PropsWithChildren, Ref } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  type ScrollViewInstance,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { X } from "lucide-react-native";
import { Button, colors, maximalist, s } from "./ui";

export function Dialog({
  title,
  visible,
  close,
  children,
  scrollRef,
}: PropsWithChildren<{
  title: string;
  visible: boolean;
  close: () => void;
  scrollRef?: Ref<ScrollViewInstance>;
}>) {
  const { width, height } = useWindowDimensions();
  if (!visible) return null;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={{ flex: 1, minHeight: 0 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={Platform.OS !== "web"}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(25,36,49,0.45)",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 0,
            padding: height < 500 || width < 600 ? 12 : 20,
          }}
        >
          <View
            role="dialog"
            accessibilityLabel={title}
            aria-modal
            accessibilityViewIsModal
            style={{
              width: "100%",
              maxWidth: 620,
              maxHeight: "100%",
              minHeight: 0,
              flexShrink: 1,
              backgroundColor: "white",
              borderRadius: 24,
              borderWidth: 3,
              borderColor: maximalist.outline,
              boxShadow: "8px 8px 0 #5020a0",
              overflow: "hidden",
            }}
          >
            <View
              style={[
                s.row,
                {
                  padding: width < 600 ? 12 : 20,
                  flexShrink: 0,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text
                accessibilityRole="header"
                style={[s.panelTitle, { flex: 1 }]}
              >
                {title}
              </Text>
              <Button
                label="Close dialog"
                icon={X}
                compact={width < 600}
                onPress={close}
              />
            </View>
            <ScrollView
              ref={scrollRef}
              testID="dialog-scroll"
              style={{ minHeight: 0, flexShrink: 1 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.body}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
