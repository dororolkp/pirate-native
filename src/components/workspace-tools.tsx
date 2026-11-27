import { useEffect, useRef } from "react";
import { type ScrollViewInstance, Text, TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { useGuidedTour } from "../hooks/use-guided-tour";
import { useWorkspaceTools } from "../hooks/use-workspace-tools";
import { useLayoutWidth } from "../hooks/use-layout-width";
import { Button, colors, s } from "./ui";
import { Dialog } from "./dialog";

export function WorkspaceTools({ compact = false }: { compact?: boolean }) {
  const tour = useGuidedTour();
  const width = useLayoutWidth();
  const tools = useWorkspaceTools(() => tour?.start());
  const scroll = useRef<ScrollViewInstance>(null);
  const positions = useRef<Record<number, number>>({});
  useEffect(() => {
    if (!tools.open) return;
    const y = tools.selection === 0 ? 0 : positions.current[tools.selection];
    if (y !== undefined)
      scroll.current?.scrollTo({ y: Math.max(0, y - 16), animated: false });
  }, [tools.open, tools.selection, tools.results]);
  return (
    <>
      <Button
        label="Workspace tools"
        icon={Search}
        compact={compact}
        disabled={width === 0}
        onPress={tools.toggle}
      />
      <Dialog
        title="Workspace tools"
        visible={tools.open}
        close={tools.close}
        scrollRef={scroll}
      >
        <Text style={s.caption}>
          Navigation and help only. Ctrl/Cmd+K opens; arrows select; Enter
          opens; Escape closes. No robot command is issued here.
        </Text>
        <TextInput
          autoFocus
          accessibilityLabel="Search workspace tools"
          placeholder="Search pages, guides or privacy..."
          placeholderTextColor={colors.muted}
          value={tools.query}
          onChangeText={tools.search}
          onSubmitEditing={() => tools.choose()}
          onKeyPress={(event) => {
            if (
              event.nativeEvent.key === "ArrowDown" ||
              event.nativeEvent.key === "ArrowUp"
            ) {
              event.preventDefault();
              tools.move(event.nativeEvent.key === "ArrowDown" ? 1 : -1);
            }
          }}
          style={s.input}
        />
        {tools.results.length === 0 && (
          <Text style={s.text}>
            No matching tools. Try docs, backend or history.
          </Text>
        )}
        {tools.results.map((command, index) => (
          <View
            key={command.id}
            onLayout={(event) => {
              positions.current[index] = event.nativeEvent.layout.y;
            }}
            style={{ gap: 4 }}
          >
            <Button
              label={command.title}
              selected={tools.selection === index}
              onPress={() => tools.choose(index)}
            />
            <Text style={s.caption}>{command.description}</Text>
          </View>
        ))}
      </Dialog>
    </>
  );
}
