import { PropsWithChildren } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { Button, colors, maximalist, s } from "./ui";

export function Dialog({
  title,
  visible,
  close,
  children,
}: PropsWithChildren<{
  title: string;
  visible: boolean;
  close: () => void;
}>) {
  if (!visible) return null;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={close}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(25,36,49,0.45)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            width: "100%",
            maxWidth: 620,
            maxHeight: "85%",
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
                padding: 20,
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
            <Button label="Close dialog" icon={X} onPress={close} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.body}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
