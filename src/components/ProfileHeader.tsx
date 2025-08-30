import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function ProfileHeader({ onEdit }: { onEdit: () => void }) {
  const c = useThemeColors();
  const { name, email } = useProfileStore();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Image
          source={{ uri: "https://assets.gqindia.com/photos/64afaacaca23363cf3f5fa20/master/w_1600%2Cc_limit/Tom-Cruise-as-Ethan-Hunt-(Mission-Impossible).jpg" }}
          style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: c.border }}
        />
        <View>
          <Text style={{ color: c.text.primary, fontSize: 20, fontWeight: "800" }}>{name}</Text>
          {!!email && <Text style={{ color: c.text.secondary, fontSize: 12 }}>{email}</Text>}
        </View>
      </View>
      <TouchableOpacity onPress={onEdit} accessibilityRole="button">
        <Ionicons name="create-outline" size={22} color={c.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}
