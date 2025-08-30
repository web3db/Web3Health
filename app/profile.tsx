import ActionRow from "@/src/components/ActionRow";
import AddWeightSheet from "@/src/components/AddWeightSheet";
import EditEmergencySheet from "@/src/components/EditEmergencySheet";
import EditGoalsSheet from "@/src/components/EditGoalsSheet";
import EditMedicalSheet from "@/src/components/EditMedicalSheet";
import EditProfileSheet from "@/src/components/EditProfileSheet";
import GoalsPreferencesCard from "@/src/components/GoalsPreferencesCard";
import HistoryAccountCard from "@/src/components/HistoryAccountCard";
import IntegrationsCard from "@/src/components/IntegrationsCard";
import MedicalSafetyCard from "@/src/components/MedicalSafetyCard";
import ProfileHeader from "@/src/components/ProfileHeader";
import VitalsCard from "@/src/components/VitalsCard";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const c = useThemeColors();
  const [editOpen, setEditOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [medicalOpen, setMedicalOpen] = useState(false);
  const { update } = useProfileStore();
  const [addOpen, setAddOpen] = useState(false);

  // If your app has a theme controller, pass it here:
  const handleThemeChange = (mode: "system" | "light" | "dark") => {
    // TODO: call your theme context if needed
    // e.g., theme.setMode(mode)
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32, rowGap: 16 }}
      >
        <ProfileHeader onEdit={() => setEditOpen(true)} />
        <VitalsCard />
        <GoalsPreferencesCard onEditGoals={() => setGoalsOpen(true)} />
        <MedicalSafetyCard
          onEditMedical={() => setMedicalOpen(true)}
          onEditEmergency={() => setEmergencyOpen(true)}
        />
        <IntegrationsCard />
        <HistoryAccountCard onAdd={() => setAddOpen(true)} />
        <View style={{ height: 4 }} />
        <ActionRow />
      </ScrollView>
      <AddWeightSheet visible={addOpen} onClose={() => setAddOpen(false)} />
      <EditProfileSheet visible={editOpen} onClose={() => setEditOpen(false)} />
      <EditGoalsSheet visible={goalsOpen} onClose={() => setGoalsOpen(false)} />
      <EditMedicalSheet
        visible={medicalOpen}
        onClose={() => setMedicalOpen(false)}
      />
      <EditEmergencySheet
        visible={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />
    </SafeAreaView>
  );
}
