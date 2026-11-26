import { Link } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { useCatalogSearch } from "../hooks/use-catalog-search";
import { STACK_CAPABILITIES } from "../lib/workspace-catalog";
import { useLayoutWidth } from "../hooks/use-layout-width";
import { Badge, Button, colors, maximalist, s } from "./ui";
import { WorkspaceBanner } from "./workspace-banner";
import { LocalInsights } from "./local-insights";

export function IntegrationsCenter() {
  const search = useCatalogSearch(STACK_CAPABILITIES);
  const width = useLayoutWidth();
  return (
    <View style={s.stack}>
      <WorkspaceBanner
        title="Fancy tools. Thoughtful defaults."
        description="A free-first stack studio, built with React Native. Useful open components and local capabilities replace paid SDK clutter. Account-dependent services are clearly marked, never presented as connected."
      >
        <View style={s.row}>
          <Link
            href="/docs"
            style={[
              s.text,
              { color: maximalist.lime, padding: 14, minHeight: 44 },
            ]}
          >
            Read the documentation
          </Link>
          <Link
            href="/settings"
            style={[
              s.text,
              { color: maximalist.lime, padding: 14, minHeight: 44 },
            ]}
          >
            Connection and GA4 consent
          </Link>
        </View>
      </WorkspaceBanner>
      <LocalInsights />
      <TextInput
        accessibilityLabel="Search free stack"
        placeholder="Search design, analytics, consent..."
        placeholderTextColor={colors.muted}
        value={search.query}
        onChangeText={search.setQuery}
        maxLength={120}
        style={s.input}
      />
      <View style={s.row}>
        {["All", "Design", "Privacy", "Operations"].map((category) => (
          <Button
            key={category}
            label={category === "All" ? "All capabilities" : category}
            selected={search.category === category}
            onPress={() => search.setCategory(category)}
          />
        ))}
        <Button label="Clear stack filters" onPress={search.reset} />
      </View>
      <Text accessibilityLiveRegion="polite" style={s.caption}>
        {search.results.length} capabilities / No automatic service activation.
      </Text>
      {search.results.length === 0 && (
        <Text style={s.text}>
          No matching capabilities. Try graphics, docs or privacy.
        </Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
        {search.results.map((item, index) => (
          <View
            key={item.id}
            style={{
              flexBasis: width < 900 ? "100%" : "48%",
              flexGrow: 1,
              minWidth: 0,
              padding: 20,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: maximalist.outline,
              backgroundColor: colors.surface,
              boxShadow: "4px 5px 0 #e4c9ee",
              gap: 12,
            }}
          >
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: [
                  maximalist.pink,
                  maximalist.teal,
                  maximalist.yellow,
                ][index % 3],
                padding: 8,
                borderRadius: 8,
              }}
            >
              <Text style={s.label}>{item.category.toUpperCase()}</Text>
            </View>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={s.panelTitle}
            >
              {item.title}
            </Text>
            <Badge
              label={item.status.toUpperCase()}
              tone={item.status === "Included" ? "green" : "orange"}
            />
            <Text style={s.caption}>Reference: {item.reference}</Text>
            <Text style={[s.text, { fontWeight: "700" }]}>
              {item.alternative}
            </Text>
            <Text style={s.text}>{item.detail}</Text>
          </View>
        ))}
      </View>
      <Text style={s.caption}>
        Uiverse MIT patterns and shadcn/ui command-menu ideas are adapted to
        native primitives. No paid licences or additional dependencies were
        added. Free hosting/account tiers have provider limits; legal compliance
        and third-party configuration still need owner review.
      </Text>
    </View>
  );
}
