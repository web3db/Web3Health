import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React from "react";
import { Switch, Text, View } from "react-native";

const Tag = ({ t }: { t: string }) => {
    const c = useThemeColors();
    return (
        <View
            style={{
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: c.muted,
                borderColor: c.border,
                borderWidth: 1,
                marginRight: 8,
                marginBottom: 8,
            }}
        >
            <Text style={{ color: c.text.secondary }}>{t}</Text>
        </View>
    );
};

export default function GoalsPreferencesCard({
    onThemeChange,
    onEditGoals,
}: {
    onThemeChange?: (mode: "system" | "light" | "dark") => void;
    onEditGoals?: () => void;
}) {
    const c = useThemeColors();
    const {
        goals,
        customGoals,
        unit,
        notificationsEnabled,
        update,
        toggleUnit,
    } = useProfileStore();

    return (
        <View
            style={{
                backgroundColor: c.surface,
                borderColor: c.border,
                borderWidth: 1,
                borderRadius: 16,
                padding: 12,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                }}
            >
                <Text
                    style={{ color: c.text.primary, fontWeight: "700", marginBottom: 8 }}
                >
                    Goals & Preferences
                </Text>
                {onEditGoals && (
                    <Text onPress={onEditGoals} style={{ color: c.text.secondary }}>
                        Edit goals
                    </Text>
                )}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {goals.map((g) => (
                    <Tag key={`built-${g}`} t={g.replace("_", " ")} />
                ))}
                {customGoals.map((g) => (
                    <Tag key={`custom-${g}`} t={g} />
                ))}
            </View>

            <View
                style={{ height: 1, backgroundColor: c.border, marginVertical: 8 }}
            />

            <Row label={`Units: ${unit === "metric" ? "Metric" : "Imperial"}`}>
                <Switch value={unit === "metric"} onValueChange={toggleUnit} />
            </Row>

            <Row label="Notifications">
                <Switch
                    value={notificationsEnabled}
                    onValueChange={(v) => update({ notificationsEnabled: v })}
                />
            </Row>
        </View>
    );
}

function Row({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    const c = useThemeColors();
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 6,
            }}
        >
            <Text style={{ color: c.text.primary }}>{label}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {children}
            </View>
        </View>
    );
}

