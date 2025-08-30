import { toggleAppleIntegration } from "@/src/services/integrations/apple/controller";
import { toggleHealthConnectIntegration } from "@/src/services/integrations/google/controller";
import { useHealthStore } from "@/src/store/useHealthStore";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useCallback } from "react";
import { ActivityIndicator, Alert, Platform, Switch, Text, View } from "react-native";

const HC_FALLBACK = { enabled: false, status: "idle" as const, lastSync: undefined as string | undefined, errorMsg: undefined as string | undefined };

export default function IntegrationsCard() {
  const c = useThemeColors();
  // pulling full store is fine here; if you prefer fewer re-renders, use selectors
  const { connections, setConnectionEnabled, setConnectionStatus } = useProfileStore();

  const setDaily = useHealthStore((s) => s.setDaily);
  const clearDaily = useHealthStore((s) => s.clearDaily ?? (() => {}));

  // ---- Health Connect (Android) ----
  const onToggleHC = useCallback(
    async (enable: boolean) => {
      if (Platform.OS !== "android") {
        const msg = Platform.OS === "web"
          ? "Health Connect is not available on the web."
          : "Health Connect works on Android devices only.";
        fail("healthConnect", msg, { revertEnabled: true });
        return;
      }

      try {
        setConnectionEnabled("healthConnect", enable);

        if (!enable) {
          Alert.alert(
            "Disconnect Health Connect?",
            "Remove imported Android health data from your charts?",
            [
              { text: "Keep Data", style: "cancel", onPress: () => setConnectionStatus("healthConnect", "idle") },
              { text: "Remove", style: "destructive", onPress: () => { clearDaily(); setConnectionStatus("healthConnect", "idle"); } },
            ]
          );
          return;
        }

        setConnectionStatus("healthConnect", "connecting");
        await toggleHealthConnectIntegration(true, { days: 90, onData: setDaily });
        // controller will set connected + lastSync on success
      } catch (e: any) {
        const msg = e?.message || "Could not connect to Health Connect. Install Health Connect and grant permissions.";
        fail("healthConnect", msg, { revertEnabled: true });
      }
    },
    [clearDaily, setDaily, setConnectionEnabled, setConnectionStatus]
  );

  // ---- Apple Health (iOS) ----
  const onToggleApple = useCallback(
    async (enable: boolean) => {
      if (Platform.OS !== "ios") {
        const msg = Platform.OS === "web"
          ? "Apple Health is not available on the web."
          : "Apple Health works on iOS devices only.";
        fail("appleHealth", msg, { revertEnabled: true });
        return;
      }

      if (!enable) {
        setConnectionEnabled("appleHealth", false);
        Alert.alert(
          "Disconnect Apple Health?",
          "Do you want to remove imported Apple data from your charts?",
          [
            { text: "Keep Data", style: "cancel", onPress: () => setConnectionStatus("appleHealth", "idle") },
            { text: "Remove", style: "destructive", onPress: () => { clearDaily(); setConnectionStatus("appleHealth", "idle"); } },
          ]
        );
        return;
      }

      try {
        setConnectionEnabled("appleHealth", true);
        setConnectionStatus("appleHealth", "connecting");
        await toggleAppleIntegration(true, { days: 90, onData: setDaily });
        // controller will set connected + lastSync
      } catch (e: any) {
        const msg = e?.message || "Could not connect to Apple Health. Open the Health app and allow permissions.";
        fail("appleHealth", msg, { revertEnabled: true });
      }
    },
    [clearDaily, setDaily, setConnectionEnabled, setConnectionStatus]
  );

  function fail(provider: "appleHealth" | "healthConnect", msg: string, opts?: { revertEnabled?: boolean }) {
    const { setConnectionEnabled, setConnectionStatus } = useProfileStore.getState();
    if (opts?.revertEnabled) setConnectionEnabled(provider, false);
    setConnectionStatus(provider, "error", msg);
    Alert.alert(provider === "appleHealth" ? "Apple Health Error" : "Health Connect Error", msg);
  }

  const A  = connections?.appleHealth ?? HC_FALLBACK;
  const HC = connections?.healthConnect ?? HC_FALLBACK; // ✅ use healthConnect
  const FB = connections?.fitbit ?? HC_FALLBACK;
  const GM = connections?.garmin ?? HC_FALLBACK;

  return (
    <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 12 }}>
      <Text style={{ color: c.text.primary, fontWeight: "700", marginBottom: 8 }}>Integrations & Devices</Text>

      <Row
        label="Apple Health (iOS)"
        status={A.status}
        lastSync={A.lastSync}
        errorMsg={A.errorMsg}
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {A.status === "connecting" && <ActivityIndicator size="small" color={c.text.secondary} />}
            <Switch value={A.enabled} onValueChange={onToggleApple} disabled={A.status === "connecting"} />
          </View>
        }
      />

      <Row
        label="Health Connect (Android)"
        status={HC.status}
        lastSync={HC.lastSync}
        errorMsg={HC.errorMsg}
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {HC.status === "connecting" && <ActivityIndicator size="small" color={c.text.secondary} />}
            <Switch value={HC.enabled} onValueChange={onToggleHC} disabled={HC.status === "connecting"} />
          </View>
        }
      />

      <Row
        label="Fitbit"
        status={FB.status}
        lastSync={FB.lastSync}
        errorMsg={FB.errorMsg}
        right={<Switch value={FB.enabled} onValueChange={() => { /* TODO */ }} />}
      />

      <Row
        label="Garmin"
        status={GM.status}
        lastSync={GM.lastSync}
        errorMsg={GM.errorMsg}
        right={<Switch value={GM.enabled} onValueChange={() => { /* TODO */ }} />}
      />

      <Text style={{ color: c.text.secondary, fontSize: 12, marginTop: 8 }}>
        iOS uses Apple Health; Android uses Health Connect. You can revoke access anytime in the system apps.
      </Text>
    </View>
  );
}

function Row({
  label,
  right,
  status,
  lastSync,
  errorMsg,
}: {
  label: string;
  right: React.ReactNode;
  status?: "idle" | "connecting" | "connected" | "error";
  lastSync?: string;
  errorMsg?: string;
}) {
  const c = useThemeColors();
  return (
    <View style={{ paddingVertical: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: c.text.primary }}>{label}</Text>
        {right}
      </View>

      {status === "connected" && lastSync && (
        <Text style={{ color: c.text.secondary, fontSize: 12, marginTop: 2 }}>
          Connected · Last sync {new Date(lastSync).toLocaleString()}
        </Text>
      )}
      {status === "connecting" && (
        <Text style={{ color: c.text.secondary, fontSize: 12, marginTop: 2 }}>Connecting…</Text>
      )}
      {status === "error" && !!errorMsg && (
        <Text style={{ color: "#DC2626", fontSize: 12, marginTop: 2 }} numberOfLines={2}>
          {errorMsg}
        </Text>
      )}
    </View>
  );
}
