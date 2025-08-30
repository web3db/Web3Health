import AddWorkoutSheet from "@/src/components/AddWorkoutSheet";
import EditWorkoutGoalSheet from "@/src/components/EditWorkoutGoalSheet";
import QuickStartRow from "@/src/components/QuickStartRow";
import TrendMiniCard from "@/src/components/TrendMiniCard";
import WorkoutList from "@/src/components/WorkoutList";
import WorkoutSummaryHeader from "@/src/components/WorkoutSummaryHeader";
import type { Workout } from "@/src/store/useWorkoutStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import type { WorkoutType } from "@/src/theme/workoutColors";
import React, { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function WorkoutsScreen() {
  const c = useThemeColors();

  const [addOpen, setAddOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [initialType, setInitialType] = useState<WorkoutType | undefined>(
    undefined
  );

  const handleOpenAddSheet = useCallback(() => {
    setEditing(null);
    setInitialType(undefined);
    setAddOpen(true);
  }, []);

  const handleCloseAddSheet = useCallback(() => {
    setAddOpen(false);
    setEditing(null);
    setInitialType(undefined);
  }, []);

  const handleQuickAdd = useCallback((type: WorkoutType) => {
    setEditing(null);
    setInitialType(type);
    setAddOpen(true);
  }, []);

  const handleEditWorkout = useCallback((workout: Workout) => {
    setEditing(workout);
    setInitialType(undefined);
    setAddOpen(true);
  }, []);

  const handleOpenGoalSheet = useCallback(() => {
    setGoalOpen(true);
  }, []);

  const handleCloseGoalSheet = useCallback(() => {
    setGoalOpen(false);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, rowGap: 16, paddingBottom: 32 }}
        removeClippedSubviews={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: c.text.primary, fontSize: 22, fontWeight: "800" }}
          >
            Workouts
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={handleOpenGoalSheet}>
              <Text style={{ color: c.text.secondary }}>Edit goal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenAddSheet}>
              <Text style={{ color: c.text.secondary }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary + Quick actions */}
        <WorkoutSummaryHeader onPressEditGoal={handleOpenGoalSheet} />
        <QuickStartRow onQuickAdd={handleQuickAdd} />

        {/* Trend */}
        <TrendMiniCard metric="minutes" initialRange="30d" />

        {/* Recent list */}
        <WorkoutList onEdit={handleEditWorkout} onAdd={handleOpenAddSheet} />
      </ScrollView>

      {/* Modals */}
      <AddWorkoutSheet
        visible={addOpen}
        onClose={handleCloseAddSheet}
        workoutToEdit={editing}
        initialType={initialType}
      />
      <EditWorkoutGoalSheet visible={goalOpen} onClose={handleCloseGoalSheet} />
    </SafeAreaView>
  );
}
