import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
export default function MedicalSafetyCard({
    onEditEmergency,
    onEditMedical,
}: {
    onEditEmergency: () => void;
    onEditMedical: () => void;
}) {
    const c = useThemeColors();
    const { medical, emergency } = useProfileStore();

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
                <Text style={{ color: c.text.primary, fontWeight: "700" }}>
                    Medical & Safety
                </Text>
                <Text onPress={onEditMedical} style={{ color: c.text.secondary }}>
                    Edit medical
                </Text>
            </View>
            <Text style={{ color: c.text.primary }}>
                Resting HR baseline: {medical.restingHrBaseline ?? "—"} bpm
            </Text>
            <Text style={{ color: c.text.primary, marginTop: 4 }}>
                Allergies: {medical.allergiesNote || "None added"}
            </Text>

            <View
                style={{ height: 1, backgroundColor: c.border, marginVertical: 8 }}
            />
            

            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <View>
                    <Text style={{ color: c.text.primary, fontWeight: "600" }}>
                        Emergency contact
                    </Text>
                    <Text style={{ color: c.text.secondary }}>
                        {emergency?.name
                            ? `${emergency.name} — ${emergency.phone}`
                            : "Not set"}
                    </Text>
                </View>
                <TouchableOpacity onPress={onEditEmergency}>
                    <Text style={{ color: c.text.secondary }}>Edit</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
